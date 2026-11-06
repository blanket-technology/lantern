"""Support lines shown in the app. Defaults are for India.

Numbers were checked in October 2026. Helplines change, so re-verify before
you ship, and swap this list out if you deploy for another country.
"""

from app.schemas import Helpline

EMERGENCY_NUMBER = "112"
INTERNATIONAL_DIRECTORY = "https://findahelpline.com"

HELPLINES: list[Helpline] = [
    Helpline(
        name="Tele-MANAS",
        phone="14416",
        hours="24 hours, every day",
        description=(
            "Free government mental health line run under the National Tele Mental "
            "Health Programme. You can choose your language. Alternate number 1800-891-4416."
        ),
        url="https://telemanas.mohfw.gov.in",
    ),
    Helpline(
        name="Vandrevala Foundation",
        phone="+91 99996 66555",
        hours="24 hours, every day",
        description="Free counselling by phone or WhatsApp for distress, panic and suicidal thoughts.",
        url="https://www.vandrevalafoundation.com",
    ),
    Helpline(
        name="iCALL (TISS)",
        phone="+91 91529 87821",
        hours="Monday to Saturday, daytime hours",
        description=(
            "Free counselling from trained professionals at the Tata Institute of Social "
            "Sciences. Better suited to ongoing stress than to emergencies."
        ),
        url="https://icallhelpline.org",
    ),
]


def crisis_message() -> str:
    primary = HELPLINES[0]
    return (
        "I'm really glad you told me, and I'm taking what you said seriously. "
        "You deserve support from a real person right now, not only from me.\n\n"
        f"Please call **{primary.name} on {primary.phone}**. It's free and open around the clock, "
        f"and you can speak in your own language. If you're in immediate danger or have already "
        f"hurt yourself, call **{EMERGENCY_NUMBER}** or go to the nearest emergency department.\n\n"
        "If you can, let someone near you know how you're feeling, or ask them to stay with you. "
        "I'm still here and I'll keep talking with you. Are you somewhere safe right now?"
    )
