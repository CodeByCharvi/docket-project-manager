"""Database connection.

The "engine" is the connection to PostgreSQL. A "session" is one conversation
with the database (we open one per request and close it afterwards).
"""
import os

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

DATABASE_URL = os.getenv("DATABASE_URL", "")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is not set. See the README for how to run the app.")

# Hosting services hand out "postgres://..." or "postgresql://..." addresses.
# SQLAlchemy needs to be told which driver to use, so we add it.
for prefix in ("postgres://", "postgresql://"):
    if DATABASE_URL.startswith(prefix):
        DATABASE_URL = "postgresql+psycopg2://" + DATABASE_URL[len(prefix):]
        break

# SQLite (used only by the automated tests) needs one extra setting.
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


class Base(DeclarativeBase):
    """Every database table class inherits from this."""


def get_db():
    """FastAPI dependency: give each request its own session, then close it."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
        