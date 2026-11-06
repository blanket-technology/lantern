from fastapi import APIRouter

from app.services.resources import EMERGENCY_NUMBER, HELPLINES, INTERNATIONAL_DIRECTORY

router = APIRouter(prefix="/resources", tags=["resources"])


@router.get("/helplines")
async def helplines():
    return {
        "emergency_number": EMERGENCY_NUMBER,
        "international_directory": INTERNATIONAL_DIRECTORY,
        "helplines": [h.model_dump() for h in HELPLINES],
    }
