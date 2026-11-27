"""Run the golden question set against the assistant and record accuracy + latency.

Usage:
  python scripts/run_eval.py --output eval-report.json [--history eval-history.json]
                             [--min-accuracy 0.9] [--repo-root PATH] [--golden PATH]

--repo-root lets the same script evaluate an older checkout (used to backfill history).
"""

import argparse
import json
import os
import statistics
import subprocess
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

RISK_ORDER = {"LOW": 0, "MEDIUM": 1, "HIGH": 2, "CRITICAL": 3}


def git(root: Path, *args: str) -> str:
    try:
        return subprocess.check_output(["git", *args], cwd=root, text=True, stderr=subprocess.DEVNULL).strip()
    except Exception:
        return ""


def percentile(values, pct):
    if not values:
        return 0.0
    v = sorted(values)
    k = (len(v) - 1) * pct
    lo = int(k)
    hi = min(lo + 1, len(v) - 1)
    return round(v[lo] + (v[hi] - v[lo]) * (k - lo), 2)


def check(expect: dict, retrieval, response) -> list:
    """Return a list of human-readable failures (empty = pass)."""
    failures = []
    text = response.detailed_explanation or ""
    path = response.hierarchy_path or ""
    cmds = response.proposed_commands or []
    cmd_texts = [c["command"] for c in cmds]
    found = getattr(retrieval, "procedure_found", True) and "Not Found" not in path

    for needle in expect.get("contains", []):
        if needle not in text:
            failures.append(f"answer missing '{needle}'")
    if "path_contains" in expect and expect["path_contains"] not in path:
        failures.append(f"section '{path}' does not contain '{expect['path_contains']}'")
    if "procedure_found" in expect and bool(found) != expect["procedure_found"]:
        failures.append(f"procedure_found={found}, expected {expect['procedure_found']}")
    if expect.get("commands_empty") and cmds:
        failures.append(f"expected no commands, got {len(cmds)}")
    if "has_command" in expect and expect["has_command"] not in cmd_texts:
        failures.append(f"missing command '{expect['has_command']}'")
    if "first_command" in expect and (not cmd_texts or cmd_texts[0] != expect["first_command"]):
        failures.append(f"first command is {cmd_texts[0] if cmd_texts else None!r}")
    if "max_risk" in expect:
        limit = RISK_ORDER[expect["max_risk"]]
        risky = [c["command"] for c in cmds if RISK_ORDER.get(c["risk_level"], 3) > limit]
        if risky:
            failures.append(f"commands above {expect['max_risk']} risk: {risky}")
    for cmd, risk in expect.get("command_risk", {}).items():
        actual = next((c["risk_level"] for c in cmds if c["command"] == cmd), None)
        if actual != risk:
            failures.append(f"risk for '{cmd[:30]}…' is {actual}, expected {risk}")
    if "requires_approval" in expect and bool(response.requires_approval) != expect["requires_approval"]:
        failures.append(f"requires_approval={response.requires_approval}")
    cites = len(response.evidence_citations or [])
    if "min_citations" in expect and cites < expect["min_citations"]:
        failures.append(f"{cites} citations, expected >= {expect['min_citations']}")
    if "max_citations" in expect and cites > expect["max_citations"]:
        failures.append(f"{cites} citations, expected <= {expect['max_citations']}")
    return failures


def run(repo_root: Path, golden_path: Path) -> dict:
    os.chdir(repo_root)  # the app loads dataset/ and runbooks/ by relative path
    sys.path[:0] = [str(repo_root / "src"), str(repo_root)]

    from backend.state import state  # noqa: E402
    from findly.assistant.qwen_engine import QwenGroundedAssistant  # noqa: E402

    state.initialize()
    assistant = QwenGroundedAssistant()
    cases = json.loads(golden_path.read_text(encoding="utf-8"))

    results = []
    for case in cases:
        start = time.perf_counter()
        try:
            retrieval = state.retriever.retrieve(case["query"])
            response = assistant.synthesize(retrieval)
            failures = check(case["expect"], retrieval, response)
            path = response.hierarchy_path
        except Exception as exc:  # a crash is a failed case, not a failed run
            failures, path = [f"error: {exc!r}"], ""
        latency = (time.perf_counter() - start) * 1000
        results.append({
            "id": case["id"],
            "query": case["query"],
            "passed": not failures,
            "failures": failures,
            "latency_ms": round(latency, 2),
            "section": path,
        })

    lat = [r["latency_ms"] for r in results]
    passed = sum(r["passed"] for r in results)
    commit_date = git(repo_root, "log", "-1", "--format=%cI")
    return {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "commit": git(repo_root, "rev-parse", "--short", "HEAD") or os.environ.get("GITHUB_SHA", "")[:7],
        "commit_date": commit_date,
        "commit_message": git(repo_root, "log", "-1", "--format=%s"),
        "run_id": os.environ.get("GITHUB_RUN_ID", "local"),
        # Latency is only comparable between runs on the same kind of machine
        "environment": os.environ.get("EVAL_ENVIRONMENT") or ("github-actions" if os.environ.get("GITHUB_ACTIONS") else "local"),
        "total": len(results),
        "passed": passed,
        "accuracy": round(passed / len(results), 4) if results else 0.0,
        "latency_ms": {
            "p50": percentile(lat, 0.5),
            "p95": percentile(lat, 0.95),
            "mean": round(statistics.mean(lat), 2) if lat else 0.0,
        },
        "cases": results,
    }


def main():
    here = Path(__file__).resolve().parent.parent
    ap = argparse.ArgumentParser()
    ap.add_argument("--repo-root", default=str(here))
    ap.add_argument("--golden", default=str(here / "evals" / "golden.json"))
    ap.add_argument("--output", default="eval-report.json")
    ap.add_argument("--history", help="JSON history file to append this run to")
    ap.add_argument("--min-accuracy", type=float, default=0.0)
    ap.add_argument("--max-runs", type=int, default=300)
    args = ap.parse_args()

    output = Path(args.output).resolve()
    history = Path(args.history).resolve() if args.history else None
    report = run(Path(args.repo_root).resolve(), Path(args.golden).resolve())

    output.write_text(json.dumps(report, indent=2), encoding="utf-8")
    if history:
        runs = json.loads(history.read_text(encoding="utf-8")) if history.exists() else []
        summary = {k: v for k, v in report.items() if k != "cases"}
        summary["failed_cases"] = [c["id"] for c in report["cases"] if not c["passed"]]
        runs = [r for r in runs if r.get("commit") != report["commit"]] + [summary]
        history.write_text(json.dumps(runs[-args.max_runs:], indent=2), encoding="utf-8")

    print(f"Eval: {report['passed']}/{report['total']} passed "
          f"({report['accuracy']:.0%}), p50 {report['latency_ms']['p50']} ms, p95 {report['latency_ms']['p95']} ms")
    for c in report["cases"]:
        if not c["passed"]:
            print(f"  FAIL {c['id']}: {'; '.join(c['failures'])}")
    if report["accuracy"] < args.min_accuracy:
        print(f"Accuracy {report['accuracy']:.2%} is below the required {args.min_accuracy:.0%}")
        sys.exit(1)


if __name__ == "__main__":
    main()
