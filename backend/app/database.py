"""
database.py — SQLAlchemy engine & session factory.

We use SQLite for development/demo. The `connect_args` dict passes
`check_same_thread=False` (SQLite default is True, which breaks
FastAPI's async threading model). We also issue PRAGMA foreign_keys=ON
so FK constraints are enforced at the DB level.
"""

from sqlalchemy import create_engine, event, text
from sqlalchemy.orm import DeclarativeBase, sessionmaker

DATABASE_URL = "sqlite:///./airbnb.db"

# `check_same_thread` must be False for SQLite + FastAPI
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
    echo=False,  # set True for SQL query logging during dev
)

# Enable SQLite foreign-key enforcement on every new connection
@event.listens_for(engine, "connect")
def set_sqlite_pragma(dbapi_conn, _):
    cursor = dbapi_conn.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()


# Session factory — used via dependency injection in routers
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    """All ORM models inherit from this base."""
    pass
