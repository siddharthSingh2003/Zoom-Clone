from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import crud
import schemas
import models
from auth import require_user, get_current_user

router = APIRouter(prefix="/api/meetings", tags=["meetings"])


@router.get("/", response_model=dict)
def dashboard_lists(db: Session = Depends(get_db)):
    return {
        "upcoming": [schemas.MeetingOut.model_validate(m) for m in crud.list_upcoming(db)],
        "recent": [schemas.MeetingOut.model_validate(m) for m in crud.list_recent(db)],
    }


@router.post("/instant", response_model=schemas.MeetingOut)
def create_instant(
    payload: schemas.MeetingCreate,
    db: Session = Depends(get_db),
    user: models.User = Depends(require_user),
):
    return crud.create_instant_meeting(db, user.id, payload.title, payload.description)


@router.post("/schedule", response_model=schemas.MeetingOut)
def schedule(
    payload: schemas.ScheduleCreate,
    db: Session = Depends(get_db),
    user: models.User = Depends(require_user),
):
    return crud.create_scheduled_meeting(db, user.id, payload)


@router.get("/{code}", response_model=schemas.MeetingOut)
def get_meeting(code: str, db: Session = Depends(get_db)):
    m = crud.get_meeting_by_code(db, code)
    if not m:
        raise HTTPException(404, "Meeting not found")  # powers Join validation
    return m


@router.post("/{code}/join")
def join_meeting(
    code: str,
    payload: schemas.ParticipantJoin,
    db: Session = Depends(get_db),
    user: Optional[models.User] = Depends(get_current_user),
):
    m = crud.get_meeting_by_code(db, code)
    if not m:
        raise HTTPException(404, "Meeting not found")
    p = crud.create_participant(
        db, m.id, payload.display_name,
        user_id=user.id if user else None,
        is_host=payload.is_host,
    )
    return {"participant_id": p.id, "meeting_code": m.meeting_code}


@router.post("/{code}/end", response_model=schemas.MeetingOut)
def end_meeting(code: str, db: Session = Depends(get_db)):
    m = crud.get_meeting_by_code(db, code)
    if not m:
        raise HTTPException(404, "Meeting not found")
    m.status = models.MeetingStatus.ended
    db.commit()
    db.refresh(m)
    return m
