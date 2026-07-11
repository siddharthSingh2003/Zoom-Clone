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
app.add_middleware(SessionMiddleware, secret_key=session_secret, same_site="lax")

app.include_router(meetings.router)
app.include_router(signaling.router)
app.include_router(auth.router)


@app.get("/health")
def health():
    return {"status": "ok"}
