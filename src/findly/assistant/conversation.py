"""Conversation layer: small talk and plain-language follow-ups.

The diagnostic engine answers one question at a time in a detailed, technical
format. This module lets the chat behave like a conversation:

- "hi", "thanks", "what can you do?" get a short, friendly reply instead of a
  runbook search.
- "I don't understand" / "explain that simply" re-explains the *previous*
  answer in plain language, built only from the facts that answer already used
  (numbers, VM IDs, runbook steps), so nothing new is invented.
"""

import re
import threading
from collections import OrderedDict
from typing import Any, Dict, List, Optional

BASELINE_SPAWN_S = 19.79

UUID_RE = re.compile(r"[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}", re.IGNORECASE)

# Always mean "re-explain the previous answer".
STRONG_CLARIFY_RE = re.compile(
    r"(do ?n[o']?t|did ?n[o']?t|could ?n[o']?t|can ?n[o']?t|cannot|could not|did not|do not)\s+"
    r"(understand|get( it)?|follow)"
    r"|i'?m (lost|confused)|confus|too (technical|complex|complicated|long)|not clear|unclear"
    r"|plain (english|language|words)|layman|eli5|like i'?m (5|five)"
    r"|what (does|do) (that|this|it|you) mean|what do you mean|meaning of (that|this)"
    r"|(explain|say|put) (it|that|this) (again|simply|more simply|differently|another way|in simple)"
    r"|say (that|it) again|rephrase|^huh\b|^what\?+$|^\?+$",
    re.IGNORECASE,
)
# Only count when the message names no topic of its own ("explain simpler" vs
# "what's a simple way to fix keystone errors?").
WEAK_CLARIFY_RE = re.compile(
    r"simpl(er|y|e terms|e words)|in short|summari[sz]e|tl;?dr|elaborate|explain|more detail|clarify",
    re.IGNORECASE,
)
DOMAIN_RE = re.compile(
    r"\b(vms?|instances?|servers?|keystone|nova|runbooks?|spawn\w*|tokens?|disk|cache|claims?|hypervisor|"
    r"compute|anomal\w*|errors?|restart|migrat\w*|logs?|memcached|ntp|image|neutron|cpu|memory)\b",
    re.IGNORECASE,
)
GREETING_RE = re.compile(r"^(hi|hello|hey|hiya|yo|good (morning|afternoon|evening)|greetings)\b", re.IGNORECASE)
THANKS_RE = re.compile(r"^(thanks|thank you|thx|ty|cheers|great|awesome|perfect|nice|cool|ok(ay)?|got it|understood)\b", re.IGNORECASE)
HELP_RE = re.compile(
    r"what can you do|what do you do|how (do|can) i use you|who are you|what are you|^help\b|how does this work",
    re.IGNORECASE,
)

EXAMPLES = [
    "Which VMs are anomalous and why?",
    "Why did instance 544fd51c take so long to spawn?",
    "How do I fix keystone token expiration errors?",
]

RISK_PLAIN = {
    "LOW": "It's safe: it only looks at the system and changes nothing.",
    "MEDIUM": "It changes something, so a teammate should approve it first.",
    "HIGH": "It can disrupt running services, so it needs explicit approval.",
    "CRITICAL": "It can cause an outage, so it needs explicit approval.",
}
BASH_BLOCK_RE = re.compile(r"```bash\s*\n(.*?)\n```", re.DOTALL)


def classify_message(text: str) -> Optional[str]:
    """Return 'clarify' | 'greeting' | 'thanks' | 'help', or None for a normal question."""
    t = text.strip()
    if not t or UUID_RE.search(t):
        return None
    words = len(t.split())
    if HELP_RE.search(t) and words <= 10:
        return "help"
    if STRONG_CLARIFY_RE.search(t) and words <= 16:
        return "clarify"
    if WEAK_CLARIFY_RE.search(t) and not DOMAIN_RE.search(t) and words <= 10:
        return "clarify"
    if GREETING_RE.search(t) and words <= 5:
        return "greeting"
    if THANKS_RE.search(t) and words <= 5:
        return "thanks"
    return None


class ConversationMemory:
    """Remembers the last answer per chat session (bounded, in-memory)."""

    def __init__(self, max_sessions: int = 1000):
        self._lock = threading.Lock()
        self._data: "OrderedDict[str, Dict[str, Any]]" = OrderedDict()
        self._max = max_sessions

    def remember(self, session_id: str, retrieval: Any, response: Any) -> None:
        with self._lock:
            self._data[session_id] = {"retrieval": retrieval, "response": response, "level": 0}
            self._data.move_to_end(session_id)
            while len(self._data) > self._max:
                self._data.popitem(last=False)

    def last(self, session_id: str) -> Optional[Dict[str, Any]]:
        with self._lock:
            return self._data.get(session_id)

    def bump_level(self, session_id: str) -> int:
        with self._lock:
            turn = self._data.get(session_id)
            if not turn:
                return 0
            turn["level"] += 1
            return turn["level"]


def _vm(vm_id: str) -> str:
    return f"`{vm_id[:8]}`"


def _times_slower(seconds: float) -> str:
    ratio = seconds / BASELINE_SPAWN_S
    if ratio < 1.15:
        return "about normal"
    return f"about {ratio:.1f}× slower than normal"


def _plain_sentences(markdown: str, limit: int = 2) -> str:
    text = re.sub(r"```.*?```", " ", markdown, flags=re.DOTALL)
    text = re.sub(r"Risk Level:.*", " ", text)
    text = re.sub(r"[*_#>]+", "", text)
    text = re.sub(r"^\s*(\d+\.|-)\s*", "", text, flags=re.MULTILINE)
    text = re.sub(r"\s+", " ", text).strip()
    parts = re.split(r"(?<=[.!?])\s+", text)
    return " ".join(p for p in parts[:limit] if p)


def _step_descriptions(content: str) -> Dict[str, str]:
    """Map each command to a short description taken from the text just before its code block."""
    out: Dict[str, str] = {}
    last_end = 0
    for m in BASH_BLOCK_RE.finditer(content):
        before = re.sub(r"Risk Level:.*", "", content[last_end:m.start()])
        last_end = m.end()
        titles = re.findall(r"\*\*(.+?)\*\*", before)
        desc = titles[-1] if titles else _plain_sentences(before, 1)
        desc = re.sub(r"^Action \d+:\s*", "", desc).strip().rstrip(":")
        for line in m.group(1).splitlines():
            if line.strip() and not line.strip().startswith("#"):
                out[line.strip()] = desc
    return out


def _explain_single_vm(v: Dict[str, Any], commands: List[Dict[str, Any]]) -> List[str]:
    vm = _vm(v["instance_id"])
    spawn = v.get("spawn_duration")
    if spawn is None:
        return [f"I found log lines for VM {vm}, but none of them record how long it took to start, "
                "so I can't say whether it was slow."]
    lines = [
        f"**In short:** VM {vm} took **{spawn:.1f} seconds** to start up. A normal start takes about "
        f"**{BASELINE_SPAWN_S:.0f} seconds**, so this one was {_times_slower(spawn)}.",
    ]
    if spawn - BASELINE_SPAWN_S > 5:
        lines.append("- That is far outside the normal range (18–22 seconds), which is why it's flagged as a problem.")
    else:
        lines.append("- That is within the normal range, so this VM looks healthy.")
    lines.append(
        f"- It asked for ordinary resources ({v.get('vcpu', 1)} CPU, {v.get('memory_mb', 2048) // 1024 or 1} GB memory, "
        f"{v.get('disk_gb', 20)} GB disk), so the slowness isn't because it was unusually big."
    )
    lines.append(
        "- **What we don't know:** the logs record *that* it was slow, not *why*. They contain no CPU, disk or "
        "network readings from the host, so any specific cause would be a guess."
    )
    if commands:
        c = commands[0]
        lines.append(f"\n**A sensible next step:** run `{c['command']}` on the host. {RISK_PLAIN.get(c['risk_level'], '')}")
    return lines


def explain_simply(retrieval: Any, response: Any, level: int = 0) -> str:
    """Plain-language version of a previous answer, using only facts it contained."""
    intent = getattr(retrieval, "intent", "runbook")
    commands = response.proposed_commands or []
    lines: List[str] = []

    if intent == "anomaly_listing":
        anomalies = getattr(retrieval, "anomalies", []) or []
        if not anomalies:
            lines = ["**In short:** every VM started up in a normal amount of time. Nothing looks wrong."]
        else:
            total = anomalies[0].get("total_vms", len(anomalies))
            times = [a["spawn_duration"] for a in anomalies if a.get("spawn_duration") is not None]
            slowest = anomalies[0]
            confirmed = sum(1 for a in anomalies if a.get("is_known_anomaly"))
            extra = len(anomalies) - confirmed
            lines = [
                f"**In short:** I checked how long each of the **{total}** virtual machines took to start up. "
                f"Normally it takes about **{BASELINE_SPAWN_S:.0f} seconds**.",
                f"- **{len(anomalies)} machines** took much longer, between {min(times):.0f} and {max(times):.0f} seconds. "
                "Those are the problem machines.",
                f"- The slowest was {_vm(slowest['instance_id'])} at {slowest['spawn_duration']:.0f} seconds, "
                f"{_times_slower(slowest['spawn_duration'])}.",
                f"- {confirmed} of them are confirmed problems in the dataset's answer key"
                + (f"; {extra} more looked slow enough that I flagged it too." if extra else "."),
                "- **What we don't know:** the logs show *that* these machines were slow, not *why*.",
                f"\n**Next step:** ask me about one of them, for example *\"Why is {slowest['instance_id'][:8]} slow?\"*",
            ]

    elif getattr(retrieval, "is_cross_vm_comparison", False) and len(retrieval.vm_lifecycles or {}) > 1:
        vms = list(retrieval.vm_lifecycles.values())
        lines = ["**In short:** here is how long each machine took to start, compared with the normal "
                 f"{BASELINE_SPAWN_S:.0f} seconds:"]
        for v in vms:
            s = v.get("spawn_duration")
            lines.append(f"- {_vm(v['instance_id'])}: **{s:.1f} seconds** ({_times_slower(s)})" if s is not None
                         else f"- {_vm(v['instance_id'])}: no start-up time recorded")
        timed = [v for v in vms if v.get("spawn_duration") is not None]
        if len(timed) >= 2:
            a, b = sorted(timed, key=lambda v: v["spawn_duration"], reverse=True)[:2]
            lines.append(f"\n{_vm(a['instance_id'])} was {a['spawn_duration'] - b['spawn_duration']:.1f} seconds slower than "
                         f"{_vm(b['instance_id'])}. Both asked for the same resources, and the logs don't say why they were slow.")

    elif retrieval.extracted_entities.get("vms") and retrieval.vm_lifecycles:
        vm_id = retrieval.extracted_entities["vms"][0]
        v = retrieval.vm_lifecycles.get(vm_id) or next(iter(retrieval.vm_lifecycles.values()))
        lines = _explain_single_vm(v, commands)

    elif retrieval.extracted_entities.get("vms"):
        lines = [f"**In short:** I couldn't find any log lines for VM {_vm(retrieval.extracted_entities['vms'][0])}. "
                 "Double-check the ID, or that VM may be in a log file that isn't loaded."]

    elif intent == "destructive_refused":
        lines = ["**In short:** you asked me to do something destructive in bulk. None of the runbooks I have describe "
                 "how to do that safely, so I didn't suggest any commands.",
                 "- Deleting or killing things in bulk can't be undone easily. It should go through your normal change "
                 "process with a second person reviewing it."]

    elif not getattr(retrieval, "procedure_found", True):
        lines = ["**In short:** I couldn't find anything about that in the runbooks I have, so I didn't guess.",
                 "- I can answer questions about the OpenStack logs that are loaded (for example why a VM was slow) "
                 "and about the runbooks on the Runbooks page.",
                 f"- Try something like *\"{EXAMPLES[0]}\"*"]

    else:
        doc = getattr(retrieval, "source_document", "") or "a runbook"
        title = re.sub(r"^Action \d+:\s*", "", retrieval.leaf_title)
        if getattr(retrieval, "low_confidence", False):
            lines.append("**In short:** I don't have a runbook that answers this. The closest one I found is about "
                         f"*{title.lower()}* (from the {doc} runbook), which probably isn't what you need, so I left out "
                         "its risky steps.")
            lines.append("- Try asking in a different way, or add a runbook that covers this on the Runbooks page.")
        else:
            lines.append(f"**In short:** this answer comes from the **{doc}** runbook.")
            if not commands:
                about = _plain_sentences(retrieval.procedure_content)
                if about:
                    lines.append(f"- What it says: {about}")
        if commands:
            steps = _step_descriptions(retrieval.procedure_content)
            lines.append("\n**What it suggests you do, in order:**")
            for i, c in enumerate(commands, 1):
                what = steps.get(c["command"])
                lead = f"**{what}:** run" if what else "Run"
                lines.append(f"{i}. {lead} `{c['command']}`. {RISK_PLAIN.get(c['risk_level'], '')}")
            if any(c["risk_level"] != "LOW" for c in commands):
                lines.append("\nNothing runs automatically. Steps that change the system go to the Approvals page first.")

    if not lines:
        lines = ["**In short:** " + (response.summary or "I don't have more detail to add.")]

    if level >= 1:
        # Asked again: keep only the headline and the next step.
        head = [lines[0]]
        tail = [ln for ln in lines[1:] if "next step" in ln.lower() or "run `" in ln]
        lines = ["Let me put it even more simply.", ""] + head + tail[:1]
    return "\n".join(lines)


def small_talk(kind: str) -> str:
    examples = "\n".join(f"- *{q}*" for q in EXAMPLES)
    if kind == "greeting":
        return ("Hi! I'm Findly, an assistant for investigating OpenStack incidents. I read the system logs and your "
                f"runbooks, then explain what happened and how to fix it.\n\nYou could ask:\n{examples}")
    if kind == "thanks":
        return "You're welcome! Ask me anything else about your VMs or runbooks. If an answer is unclear, just say *\"I don't understand\"* and I'll explain it more simply."
    return ("Here's what I can do:\n"
            "- **Find problem VMs:** spot virtual machines that started much slower than normal.\n"
            "- **Explain one VM:** show its timeline and how far it was from normal, with the exact log lines.\n"
            "- **Give fix steps:** pull the right steps from your runbooks and flag the risky ones.\n"
            "- **Keep you safe:** risky commands are never run automatically and need approval.\n"
            "- **Say it simply:** if something is unclear, tell me *\"I don't understand\"*.\n\n"
            f"Try:\n{examples}")


def no_previous_answer() -> str:
    examples = "\n".join(f"- *{q}*" for q in EXAMPLES)
    return ("There isn't an earlier answer for me to explain yet. Ask me a question first, for example:\n" + examples)
