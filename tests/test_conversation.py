"""Conversation behaviour: small talk and plain-language follow-ups."""

import pytest
from fastapi.testclient import TestClient

from backend.app import app
from backend.state import state
from findly.assistant.conversation import classify_message


@pytest.fixture(scope="module")
def client():
    state.initialize()
    with TestClient(app) as c:
        yield c


def chat(client, query, session):
    res = client.post("/api/chat", json={"query": query, "session_id": session})
    assert res.status_code == 200
    return res.json()


@pytest.mark.parametrize("text,kind", [
    ("hi", "greeting"),
    ("thanks!", "thanks"),
    ("what can you do?", "help"),
    ("I couldn't understand", "clarify"),
    ("i dont understand", "clarify"),
    ("what does that mean?", "clarify"),
    ("can you explain it simply", "clarify"),
    ("too technical", "clarify"),
    # real questions must still go to retrieval
    ("What's a simple way to fix keystone errors?", None),
    ("summarize the keystone runbook", None),
    ("explain how keystone tokens work", None),
    ("I don't understand why VM 544fd51c-4edc-4780-baae-ba1d80a0acfc is slow", None),
])
def test_classify_message(text, kind):
    assert classify_message(text) == kind


def test_greeting_is_conversational(client):
    data = chat(client, "hi", "conv-greet")
    assert data["intent"] == "conversation"
    assert "Findly" in data["detailed_explanation"]
    assert data["proposed_commands"] == []


def test_clarify_without_previous_answer(client):
    data = chat(client, "I don't understand", "conv-empty")
    assert data["intent"] == "clarification"
    assert "Ask me a question first" in data["detailed_explanation"]


def test_clarify_explains_previous_vm_answer_plainly(client):
    chat(client, "Why did instance 544fd51c-4edc-4780-baae-ba1d80a0acfc take so long to spawn?", "conv-vm")
    data = chat(client, "I couldn't understand", "conv-vm")
    text = data["detailed_explanation"]
    assert data["intent"] == "clarification"
    assert "41.8 seconds" in text and "20 seconds" in text
    assert "σ" not in text  # no statistics jargon in the plain version
    assert data["proposed_commands"] == []


def test_clarify_lists_runbook_steps_in_plain_words(client):
    chat(client, "How do I fix keystone token expiration errors?", "conv-ks")
    text = chat(client, "explain it simply", "conv-ks")["detailed_explanation"]
    assert "Check NTP Time Synchronization" in text
    assert "teammate should approve" in text


def test_second_clarify_is_shorter(client):
    chat(client, "Which VMs are anomalous and why?", "conv-list")
    first = chat(client, "what does that mean?", "conv-list")["detailed_explanation"]
    second = chat(client, "still don't get it", "conv-list")["detailed_explanation"]
    assert len(second) < len(first)
    assert second.startswith("Let me put it even more simply.")


def test_sessions_are_isolated(client):
    chat(client, "Which VMs are anomalous and why?", "conv-a")
    data = chat(client, "I don't understand", "conv-b")
    assert "Ask me a question first" in data["detailed_explanation"]
