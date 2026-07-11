import os

from fastapi import APIRouter, Depends, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

import models
from database import get_db
from auth import oauth, upsert_google_user, get_current_user

router = APIRouter(prefix="/api/auth", tags=["auth"])

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
# Override for deployments behind a proxy where request.url_for would guess
# the wrong scheme/host; must exactly match the URI registered in Google Cloud.
GOOGLE_REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI")


@router.get("/google/login")
async def google_login(request: Request):
    redirect_uri = GOOGLE_REDIRECT_URI or str(request.url_for("google_callback"))
    return await oauth.google.authorize_redirect(request, redirect_uri)


@router.get("/google/callback", name="google_callback")
async def google_callback(request: Request, db: Session = Depends(get_db)):
    token = await oauth.google.authorize_access_token(request)
    userinfo = token.get("userinfo") or await oauth.google.userinfo(token=token)
    user = upsert_google_user(db, userinfo)
    request.session["user_id"] = user.id
    return RedirectResponse(FRONTEND_URL)


@router.post("/logout")
def logout(request: Request):
    request.session.clear()
    return {"status": "ok"}


@router.get("/me")
def me(user: models.User = Depends(get_current_user)):
    if not user:
        return {"user": None}
    return {
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "avatar_url": user.avatar_url,
        }
    }
