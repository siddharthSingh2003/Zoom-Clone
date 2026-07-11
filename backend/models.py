from sqlalchemy import (Column, Integer, String, DateTime, Boolean,
                         ForeignKey, Enum)
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import enum
from database import Base


def utcnow():
    return datetime.now(timezone.utc).replace(tzinfo=None)


class MeetingStatus(str, enum.Enum):
    instant = "instant"
    scheduled = "scheduled"
    ended = "ended"


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=True)
    google_sub = Column(String, unique=True, nullable=True, index=True)  # Google's "sub" claim
    avatar_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=utcnow)
    meetings = relationship("Meeting", back_populates="host")


class Meeting(Base):
    __tablename__ = "meetings"
    id = Column(Integer, primary_key=True, index=True)
    meeting_code = Column(String, unique=True, index=True, nullable=False)
    title = Column(String, default="Instant Meeting")
    description = Column(String, nullable=True)
    host_id = Column(Integer, ForeignKey("users.id"))
    status = Column(Enum(MeetingStatus), default=MeetingStatus.instant)
    scheduled_start = Column(DateTime, nullable=True)
    duration_minutes = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=utcnow)
    host = relationship("User", back_populates="meetings")
    participants = relationship("Participant", back_populates="meeting")


class Participant(Base):
    __tablename__ = "participants"
    id = Column(Integer, primary_key=True, index=True)
    meeting_id = Column(Integer, ForeignKey("meetings.id"))
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # guests
    display_name = Column(String, nullable=False)
    is_host = Column(Boolean, default=False)
    joined_at = Column(DateTime, default=utcnow)
    left_at = Column(DateTime, nullable=True)
    meeting = relationship("Meeting", back_populates="participants")
