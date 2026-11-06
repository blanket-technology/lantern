"""Offline companion used when no LLM key is configured, or when the model call fails.

It is intentionally simple: it recognises a handful of common themes and responds
with reflective listening plus one open question. It keeps the app fully usable in
local development and demos, and acts as a safety net in production.
"""

import random
import re
from dataclasses import dataclass, field


@dataclass
class Theme:
    name: str
    pattern: re.Pattern
    reflections: list[str]
    ideas: list[str] = field(default_factory=list)
    questions: list[str] = field(default_factory=list)


def _p(words: str) -> re.Pattern:
    return re.compile(rf"\b({words})\b", re.IGNORECASE)


THEMES: list[Theme] = [
    Theme(
        "grief",
        _p(r"died|passed away|passed on|funeral|lost my|grief|grieving|miss (him|her|them) so"),
        [
            "I'm so sorry. Losing someone leaves a space that nothing else quite fills.",
            "That's a heavy loss to carry. Grief doesn't follow a schedule, and there's no right way to feel it.",
        ],
        ["Some people find it helps to talk about the person, the ordinary moments as much as the big ones."],
        ["Would you like to tell me about them?", "How have the days been since it happened?"],
    ),
    Theme(
        "anxiety",
        _p(r"anxious|anxiety|nervous|worried|worry|worrying|panic|panicking|overthink\w*|on edge|scared|afraid"),
        [
            "That sounds like your mind has been running at full speed with no off switch.",
            "Worry like that can be draining, especially when it follows you through the day.",
            "It makes sense that you feel on edge with all of that sitting on you.",
        ],
        [
            "If your body feels wound up, try breathing out a little longer than you breathe in, for a few rounds. It tells your nervous system it's allowed to slow down.",
            "Sometimes it helps to name five things you can see right now. It pulls attention back into the room.",
        ],
        ["What's the worry that keeps coming back the most?", "When did you first notice it getting louder?"],
    ),
    Theme(
        "stress",
        _p(r"stress\w*|overwhelm\w*|deadline\w*|exams?|work|job|boss|office|study|studies|pressure|burn(ed|t)? ?out|too much"),
        [
            "That's a lot to hold at once. No wonder it feels like there isn't enough of you to go around.",
            "It sounds like the pressure has been building without much room to breathe.",
        ],
        [
            "When everything feels urgent, picking just the next small step can make it lighter. Not the whole list, only the next thing.",
            "It can help to write everything down, then circle the one item that would make tomorrow easier.",
        ],
        ["Which part of it is weighing on you the most right now?", "What would make today even slightly more manageable?"],
    ),
    Theme(
        "lonely",
        _p(r"lonely|loneliness|alone|isolated|no friends|left out|no one to talk|nobody to talk"),
        [
            "Feeling alone is one of the hardest things to sit with. I'm glad you reached out here.",
            "That sense of being on the outside can really hurt, even when you're surrounded by people.",
        ],
        ["Even a small, low-pressure contact like a short message to someone you used to be close to can loosen that feeling a little."],
        ["Is there anyone, even one person, you've felt at ease with in the past?", "When does the loneliness tend to hit hardest?"],
    ),
    Theme(
        "sleep",
        _p(r"sleep\w*|insomnia|can'?t sleep|awake all night|tired|exhausted|no energy"),
        [
            "Running on too little rest makes everything else feel heavier.",
            "Exhaustion like that seeps into everything, including how we see our own problems.",
        ],
        ["A steady wake-up time, and putting the phone away a little before bed, help more people than you'd expect."],
        ["How have your nights been lately?", "Is it trouble falling asleep, or waking up and not getting back to sleep?"],
    ),
    Theme(
        "anger",
        _p(r"angry|anger|furious|irritated|frustrat\w*|annoyed|pissed|rage|mad at"),
        [
            "That sounds really frustrating. Anger usually shows up when something important to us got crossed.",
            "It makes sense you're fired up about that.",
        ],
        ["Letting the first wave pass before responding, even a walk around the block, can make the next step clearer."],
        ["What part of it got under your skin the most?", "What do you wish had happened instead?"],
    ),
    Theme(
        "relationships",
        _p(r"break ?up|broke up|girlfriend|boyfriend|partner|husband|wife|friend|friends|family|parents?|mom|mum|dad|mother|father|fight|argument|relationship"),
        [
            "Things with people we care about can hurt in a very particular way.",
            "That sounds painful, especially coming from someone close to you.",
        ],
        [],
        ["How are you feeling about it now?", "What do you think they don't understand about your side of it?"],
    ),
    Theme(
        "sad",
        _p(r"sad|down|low|depressed|unhappy|cry|crying|cried|heartbroken|miserable|empty|numb|hopeless"),
        [
            "I'm sorry you're feeling this low. You don't have to have it figured out to talk about it.",
            "That sounds really heavy. Thank you for putting it into words.",
            "It sounds like things have been hard for a while.",
        ],
        ["On days like this, small things count: water, some daylight, a few minutes outside."],
        ["Has something in particular been weighing on you, or is it more of a general heaviness?", "How long have you been feeling this way?"],
    ),
    Theme(
        "not_ok",
        re.compile(
            r"\b(not|never|no longer|\w+n'?t)\s+(\w+\s+){0,2}(good|great|happy|okay|ok|fine|well|better|calm)\b",
            re.IGNORECASE,
        ),
        [
            "I hear you. Not feeling okay is reason enough to talk about it.",
            "Thanks for being honest about that. It's not always easy to say.",
        ],
        [],
        ["What's been making it hard lately?", "If you had to put a word to the feeling, what would it be?"],
    ),
    Theme(
        "positive",
        _p(r"good|great|happy|feel(ing)? better|excited|proud|relieved|grateful|calm"),
        [
            "That's really good to hear.",
            "I'm glad. It's worth pausing on moments like that.",
        ],
        [],
        ["What do you think helped?", "What made today feel different?"],
    ),
]

GREETING = re.compile(r"^\s*(hi|hello|hey|hii+|good (morning|afternoon|evening))\b", re.IGNORECASE)
THANKS = re.compile(r"\b(thank(s| you)|thx|ty)\b", re.IGNORECASE)

OPENERS = [
    "I'm listening. Take your time.",
    "Thank you for sharing that with me.",
    "That sounds like a lot to carry.",
]
GENERIC_QUESTIONS = [
    "How are you feeling about it right now?",
    "Can you tell me a bit more about what's been happening?",
    "What's been on your mind the most today?",
]


def reply_for(text: str, display_name: str | None = None, turn: int = 0) -> str:
    rng = random.Random(hash((text, turn)))
    stripped = text.strip()

    if GREETING.match(stripped) and len(stripped.split()) <= 4:
        name = f" {display_name}" if display_name else ""
        return rng.choice(
            [
                f"Hi{name}. I'm glad you're here. How are you feeling today, honestly?",
                f"Hello{name}. There's no right way to start. What's on your mind?",
            ]
        )

    if THANKS.search(stripped) and len(stripped.split()) <= 8:
        return "You're welcome. I'm here whenever you want to talk, about big things or small ones."

    theme = next((t for t in THEMES if t.pattern.search(stripped)), None)
    if theme is None:
        return f"{rng.choice(OPENERS)} {rng.choice(GENERIC_QUESTIONS)}"

    parts = [rng.choice(theme.reflections)]
    if theme.ideas and rng.random() < 0.5:
        parts.append(rng.choice(theme.ideas))
    parts.append(rng.choice(theme.questions or GENERIC_QUESTIONS))
    return " ".join(parts)
