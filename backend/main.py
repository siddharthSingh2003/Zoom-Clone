import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware

from database import Base, engine, SessionLocal
from routers import meetings, signaling, auth
import seed

Base.metadata.create_all(bind=engine)  # create tables if absent


@asynccontextmanager
async def lifespan(app: FastAPI):
    db = SessionLocal()
    try:
        seed.seed_database(db)
    finally:
        db.close()
    yield


app = FastAPI(title="Zoom Clone API", lifespan=lifespan)

default_origins = "http://localhost:3000,https://YOUR-APP.vercel.app"
allow_origins = os.getenv("CORS_ORIGINS", default_origins).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

session_secret = os.getenv("SESSION_SECRET_KEY")
if not session_secret:
    session_secret = "dev-only-insecure-secret"
    print("WARNING: SESSION_SECRET_KEY not set - using an insecure dev default. "
          "Set it in backend/.env before deploying.")

# Locally, frontend (localhost:3000) and backend (localhost:8000) are the
# same *site* (same registrable domain, different ports), so SameSite=Lax
# works fine. In production the frontend and backend live on different
# domains (e.g. vercel.app vs up.railway.app) - that's cross-site, so the
# cookie needs SameSite=None, which browsers only honor if it's also
# Secure (HTTPS-only). Set SESSION_SAME_SITE=none in production.
session_same_site = os.getenv("SESSION_SAME_SITE", "lax")
app.add_middleware(
    SessionMiddleware,
    secret_key=session_secret,
    same_site=session_same_site,
    https_only=session_same_site == "none",
)

app.include_router(meetings.router)
app.include_router(signaling.router)
app.include_router(auth.router)


@app.get("/health")
def health():
    return {"status": "ok"}
