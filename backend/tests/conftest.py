import os

# Tests use a throw-away SQLite file instead of PostgreSQL.
# This must be set BEFORE the app is imported.
os.environ["DATABASE_URL"] = "sqlite:///./test.db"
os.environ.setdefault("SECRET_KEY", "test-secret")

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app.database import Base, engine  # noqa: E402
from app.main import app  # noqa: E402


@pytest.fixture(autouse=True)
def fresh_database():
    """Start every test with empty tables."""
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield


@pytest.fixture
def client():
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def register(client):
    """register("bob@example.com") -> (auth headers, user json)"""

    def _register(email="alice@example.com", name="Alice", password="secret123"):
        response = client.post(
            "/api/auth/register", json={"name": name, "email": email, "password": password}
        )
        assert response.status_code == 201, response.text
        body = response.json()
        return {"Authorization": f"Bearer {body['access_token']}"}, body["user"]

    return _register


@pytest.fixture
def project(client, register):
    """A project owned by Alice. Returns (headers, project json)."""
    headers, _ = register()
    response = client.post(
        "/api/projects", json={"name": "Website", "description": "Redesign"}, headers=headers
    )
    assert response.status_code == 201, response.text
    return headers, response.json()
