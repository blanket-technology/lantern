"""Rule-based risk screening that runs on every user message before the model sees it.

This is a deliberately conservative first line of defence, not a clinical tool.
It decides two things:
  * whether the UI should surface crisis resources immediately, and
  * which extra instructions the model gets for this turn.

The patterns favour catching real risk over avoiding false alarms: showing a
helpline card to someone who did not need it costs little, missing someone
who did costs a great deal.
"""

import re
from dataclasses import dataclass

CRISIS_PATTERNS = [
    r"\bsuicid(e|al)\b",
    r"\b(kill|hurt|harm|cut|hang|poison|drown|shoot)(ing)? myself\b",
    r"\bself[\s-]?harm(ing)?\b",
    r"\bend(ing)? (my|it) (life|all)\b",
    r"\bend it\b.*\btonight\b",
    r"\b(want|wanna|going|ready|wish) (to )?die\b",
    r"\bwish (i|that i) (was|were|wasn'?t|weren'?t) (dead|alive|here|born)\b",
    r"\b(don'?t|do not|no longer) want to (live|be alive|exist|wake up|be here)\b",
    r"\bno (reason|point) (to|in) (live|living|being alive|go on|going on)\b",
    r"\b(better off|be better) without me\b",
    r"\bnot (want|wanting) to be (here|around) any ?more\b",
    r"\boverdos(e|ing)\b",
    r"\b(saying|say|written|wrote|writing) (my )?goodbye(s)?\b.*\b(forever|everyone|last)\b",
    r"\bsuicide note\b",
    # Common romanised Hindi phrasing, since the default helplines are Indian
    r"\b(khudkushi|aatmahatya|atmahatya)\b",
    r"\bmar(na)? (jana|jaana) chah(ta|ti)\b",
]

ELEVATED_PATTERNS = [
    r"\bhopeless(ness)?\b",
    r"\bworthless\b",
    r"\bcan'?t (go on|take (it|this) any ?more|do this any ?more|keep going)\b",
    r"\b(no ?one|nobody) (cares|would (care|notice|miss me))\b",
    r"\b(i'?m|i am) (a )?burden\b",
    r"\bhate myself\b",
    r"\bpanic attack\b",
    r"\bcan'?t (stop crying|breathe)\b",
    r"\b(completely|totally|so) (empty|numb|alone)\b",
    r"\bgive up on (everything|life)\b",
    r"\bwhat'?s the point\b",
]

_crisis = [re.compile(p) for p in CRISIS_PATTERNS]
_elevated = [re.compile(p) for p in ELEVATED_PATTERNS]


@dataclass(frozen=True)
class RiskAssessment:
    level: str  # "none" | "elevated" | "crisis"

    @property
    def is_crisis(self) -> bool:
        return self.level == "crisis"


def _normalise(text: str) -> str:
    text = text.lower().replace("’", "'").replace("‘", "'")
    return re.sub(r"\s+", " ", text)


def assess(text: str) -> RiskAssessment:
    t = _normalise(text)
    if any(p.search(t) for p in _crisis):
        return RiskAssessment("crisis")
    if any(p.search(t) for p in _elevated):
        return RiskAssessment("elevated")
    return RiskAssessment("none")
