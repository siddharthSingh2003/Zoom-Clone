from sqlalchemy.orm import Session
import models
import utils
from models import utcnow


def create_instant_meeting(db: Session, host_id: int, title: str, description=None):
    m = models.Meeting(
        meeting_code=utils.generate_meeting_code(),
        title=title, description=description,
        host_id=host_id, status=models.MeetingStatus.instant,
    )
    db.add(m)
    db.commit()
    db.refresh(m)
    return m


def create_scheduled_meeting(db: Session, host_id: int, data):
    m = models.Meeting(
        meeting_code=utils.generate_meeting_code(),
        title=data.title, description=data.description, host_id=host_id,
        status=models.MeetingStatus.scheduled,
        scheduled_start=data.scheduled_start,
        duration_minutes=data.duration_minutes,
    )
    db.add(m)
    db.commit()
    db.refresh(m)
    return m


def get_meeting_by_code(db: Session, code: str):
    return db.query(models.Meeting).filter(models.Meeting.meeting_code == code).first()


def list_upcoming(db: Session):
    return (db.query(models.Meeting)
            .filter(models.Meeting.status == models.MeetingStatus.scheduled,
                    models.Meeting.scheduled_start >= utcnow())
            .order_by(models.Meeting.scheduled_start.asc()).all())


def list_recent(db: Session, limit=5):
    return (db.query(models.Meeting)
            .filter(models.Meeting.status == models.MeetingStatus.ended)
            .order_by(models.Meeting.created_at.desc()).limit(limit).all())


def create_participant(db: Session, meeting_id: int, display_name: str,
                        user_id=None, is_host=False):
    p = models.Participant(
        meeting_id=meeting_id, user_id=user_id,
        display_name=display_name, is_host=is_host,
    )
    db.add(p)
    db.commit()
    db.refresh(p)
    return p
