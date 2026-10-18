def test_register_returns_token_and_user(client):
    response = client.post(
        "/api/auth/register",
        json={"name": "Alice", "email": "Alice@Example.com", "password": "secret123"},
    )
    assert response.status_code == 201
    body = response.json()
    assert body["access_token"]
    assert body["user"]["email"] == "alice@example.com"  # emails are stored lowercase
    assert "password" not in body["user"]


def test_register_duplicate_email_is_rejected(client, register):
    register("alice@example.com")
    response = client.post(
        "/api/auth/register",
        json={"name": "Other", "email": "alice@example.com", "password": "secret123"},
    )
    assert response.status_code == 409


def test_register_short_password_is_rejected(client):
    response = client.post(
        "/api/auth/register", json={"name": "A", "email": "a@example.com", "password": "123"}
    )
    assert response.status_code == 422


def test_login_success_and_me(client, register):
    register("alice@example.com", password="secret123")
    response = client.post(
        "/api/auth/login", json={"email": "alice@example.com", "password": "secret123"}
    )
    assert response.status_code == 200
    token = response.json()["access_token"]
    me = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me.status_code == 200
    assert me.json()["email"] == "alice@example.com"


def test_login_wrong_password(client, register):
    register("alice@example.com", password="secret123")
    response = client.post(
        "/api/auth/login", json={"email": "alice@example.com", "password": "wrong-password"}
    )
    assert response.status_code == 401


def test_me_requires_a_valid_token(client):
    assert client.get("/api/auth/me").status_code == 401
    bad = client.get("/api/auth/me", headers={"Authorization": "Bearer not-a-real-token"})
    assert bad.status_code == 401
