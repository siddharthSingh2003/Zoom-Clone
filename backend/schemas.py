from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class MeetingCreate(BaseModel):
    title: Optional[str] = "Instant Meeting"
    description: Optional[str] = None


class ScheduleCreate(BaseModel):
    title: str
    description: Optional[str] = None
    scheduled_start: datetime
    duration_minutes: int = 30


class MeetingOut(BaseModel):
    id: int
    meeting_code: str
    title: str
    description: Optional[str] = None
    status: str
    host_id: int
    scheduled_start: Optional[datetime] = None
    duration_minutes: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ParticipantJoin(BaseModel):
    display_name: str
    is_host: bool = False
