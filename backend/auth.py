import os
from typing import Optional

from authlib.integrations.starlette_client import OAuth
from fastapi import Depends, HTTPException, Request
from sqlalchemy.orm import Session

import models
from database import get_db

oauth = OAuth()
oauth.register(
    name="google",
    client_id=os.getenv("GOOGLE_CLIENT_ID"),
    client_secret=os.getenv("GOOGLE_CLIENT_SECRET"),
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    client_kwargs={"scope": "openid email profile"},
)


def upsert_google_user(db: Session, userinfo: dict) -> models.User:
    sub = userinfo["sub"]
    user = db.query(models.User).filter(models.User.google_sub == sub).first()
    if user:
        user.name = userinfo.get("name", user.name)
        user.avatar_url = userinfo.get("picture", user.avatar_url)
        db.commit()
        db.refresh(user)
        return user

    user = models.User(
        name=userinfo.get("name") or userinfo.get("email", "Google User"),
        email=userinfo.get("email"),
        google_sub=sub,
        avatar_url=userinfo.get("picture"),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def get_current_user(request: Request, db: Session = Depends(get_db)) -> Optional[models.User]:
    user_id = request.session.get("user_id")
    if not user_id:
        return None
    return db.query(models.User).filter(models.User.id == user_id).first()


def require_user(user: Optional[models.User] = Depends(get_current_user)) -> models.User:
    if not user:
        raise HTTPException(401, "Sign in required")
    return user
