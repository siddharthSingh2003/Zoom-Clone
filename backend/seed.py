from datetime import timedelta
from sqlalchemy.orm import Session
import models
import utils
from models import utcnow


def seed_database(db: Session):
    if db.query(models.User).first():
        return  # already seeded

    user = models.User(name="You", email="you@example.com")
    db.add(user)
    db.commit()
    db.refresh(user)

    now = utcnow()

    upcoming_specs = [
        ("Product Sync", "Weekly product/eng sync", timedelta(hours=3), 30),
        ("Design Review", "Review new dashboard mocks", timedelta(days=1), 45),
        ("1:1 with Manager", "Monthly check-in", timedelta(days=2, hours=1), 30),
    ]
    for title, desc, delta, duration in upcoming_specs:
        m = models.Meeting(
            meeting_code=utils.generate_meeting_code(),
            title=title, description=desc, host_id=user.id,
            status=models.MeetingStatus.scheduled,
            scheduled_start=now + delta,
            duration_minutes=duration,
        )
        db.add(m)

    ended_specs = [
        ("Sprint Planning", "Plan next sprint", timedelta(days=-1), 60),
        ("All Hands", "Company-wide update", timedelta(days=-3), 45),
        ("Client Demo", "Demo new features to client", timedelta(days=-5), 30),
    ]
    for title, desc, delta, duration in ended_specs:
        m = models.Meeting(
            meeting_code=utils.generate_meeting_code(),
            title=title, description=desc, host_id=user.id,
            status=models.MeetingStatus.ended,
            scheduled_start=now + delta,
            duration_minutes=duration,
        )
        db.add(m)
        db.flush()
        db.add(models.Participant(
            meeting_id=m.id, user_id=user.id, display_name=user.name,
            is_host=True, joined_at=now + delta, left_at=now + delta + timedelta(minutes=duration),
        ))

    db.commit()
