from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# check_same_thread=False is needed because FastAPI may touch the SQLite
# connection from different threads. SQLite requires this flag to allow that.
SQLALCHEMY_DATABASE_URL = "sqlite:///./zoom_clone.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
