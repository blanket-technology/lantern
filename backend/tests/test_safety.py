import pytest

from app.services.companion import reply_for
from app.services.llm import make_title
from app.services.safety import assess


@pytest.mark.parametrize(
    "text",
    [
        "I want to die",
        "i don't want to live anymore",
        "I've been thinking about suicide",
        "sometimes I think about killing myself",
        "Everyone would be better off without me",
        "I just want to end it all",
        "I keep thinking about self-harm",
        "I wish I wasn’t alive",
    ],
)
def test_crisis_phrases_are_flagged(text):
    assert assess(text).level == "crisis"


@pytest.mark.parametrize(
    "text",
    [
        "I feel completely hopeless",
        "I can't take it anymore",
        "nobody cares about me",
        "I had a panic attack at work",
    ],
)
def test_distress_is_elevated(text):
    assert assess(text).level == "elevated"


@pytest.mark.parametrize(
    "text",
    [
        "I'm killing it at work this week",
        "This deadline is killing me",
        "I'd die for some good biryani right now",
        "My exam went fine, just a bit tired",
    ],
)
def test_ordinary_language_is_not_flagged(text):
    assert assess(text).level == "none"


def test_negated_positive_is_not_celebrated():
    reply = reply_for("I'm not feeling good today")
    assert "good to hear" not in reply.lower()


def test_titles_are_short():
    assert make_title("I have been feeling really anxious about my exams lately") == "I have been feeling really anxious…"
    assert make_title("hello") == "Hello"
