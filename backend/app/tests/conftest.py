"""tests/conftest.py — Shared pytest fixtures.

Uses an in-memory SQLite DB so tests don't touch the real airbnb.db.
Each test function gets a fresh DB with all tables created and a
minimal set of seed data (2 users, 1 listing).
"""

import pytest
from datetime import date, timedelta
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base
from app.core.deps import get_db
import app.models  # noqa — register all models

from app.models.user import User
from app.models.listing import Listing, Category, Amenity
from app.main import app

TEST_DB_URL = "sqlite:///:memory:"


@pytest.fixture(scope="function")
def db_engine():
    engine = create_engine(
        TEST_DB_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    yield engine
    Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def db_session(db_engine):
    Session = sessionmaker(bind=db_engine)
    session = Session()
    yield session
    session.close()


@pytest.fixture(scope="function")
def client(db_session):
    """FastAPI test client wired to the in-memory DB."""
    def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture(scope="function")
def seed_data(db_session):
    """Create a minimal set of users and a listing for tests."""
    host = User(name="Test Host", email="host@test.com",
                avatar_url=None, role="host", is_superhost=False)
    guest = User(name="Test Guest", email="guest@test.com",
                 avatar_url=None, role="guest", is_superhost=False)
    db_session.add_all([host, guest])
    db_session.flush()

    cat = Category(name="Beachfront", icon="waves", slug="beachfront")
    db_session.add(cat)
    db_session.flush()

    listing = Listing(
        host_id=host.id,
        title="Test Beach Villa",
        description="A test listing",
        room_type="entire_home",
        city="Goa",
        country="India",
        price_per_night=5000.0,
        cleaning_fee=500.0,
        max_guests=4,
        bedrooms=2,
        beds=2,
        bathrooms=1.0,
        category_id=cat.id,
        status="active",
    )
    db_session.add(listing)
    db_session.commit()
    db_session.refresh(listing)

    return {"host": host, "guest": guest, "listing": listing}
