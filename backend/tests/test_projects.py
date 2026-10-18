def test_create_and_list_projects(client, project):
    headers, created = project
    assert created["name"] == "Website"
    assert created["task_count"] == 0
    assert [m["email"] for m in created["members"]] == ["alice@example.com"]

    listed = client.get("/api/projects", headers=headers)
    assert listed.status_code == 200
    assert [p["id"] for p in listed.json()] == [created["id"]]


def test_projects_require_login(client):
    assert client.get("/api/projects").status_code == 401


def test_strangers_cannot_see_a_project(client, register, project):
    _, created = project
    bob_headers, _ = register("bob@example.com", "Bob")
    assert client.get(f"/api/projects/{created['id']}", headers=bob_headers).status_code == 404
    assert client.get("/api/projects", headers=bob_headers).json() == []


def test_owner_can_add_a_member_who_then_sees_the_project(client, register, project):
    headers, created = project
    bob_headers, bob = register("bob@example.com", "Bob")

    added = client.post(
        f"/api/projects/{created['id']}/members", json={"email": "bob@example.com"}, headers=headers
    )
    assert added.status_code == 201
    assert {m["id"] for m in added.json()["members"]} >= {bob["id"]}

    assert client.get(f"/api/projects/{created['id']}", headers=bob_headers).status_code == 200


def test_add_member_unknown_email_and_duplicates(client, project, register):
    headers, created = project
    register("bob@example.com", "Bob")
    url = f"/api/projects/{created['id']}/members"

    assert client.post(url, json={"email": "nobody@example.com"}, headers=headers).status_code == 404
    assert client.post(url, json={"email": "bob@example.com"}, headers=headers).status_code == 201
    assert client.post(url, json={"email": "bob@example.com"}, headers=headers).status_code == 409


def test_only_owner_can_rename_or_delete(client, register, project):
    headers, created = project
    bob_headers, _ = register("bob@example.com", "Bob")
    client.post(
        f"/api/projects/{created['id']}/members", json={"email": "bob@example.com"}, headers=headers
    )
    url = f"/api/projects/{created['id']}"

    assert client.patch(url, json={"name": "Hacked"}, headers=bob_headers).status_code == 403
    assert client.delete(url, headers=bob_headers).status_code == 403

    renamed = client.patch(url, json={"name": "Website v2"}, headers=headers)
    assert renamed.status_code == 200
    assert renamed.json()["name"] == "Website v2"

    assert client.delete(url, headers=headers).status_code == 204
    assert client.get(url, headers=headers).status_code == 404


def test_owner_cannot_be_removed(client, register, project):
    headers, created = project
    owner_id = created["owner_id"]
    response = client.delete(
        f"/api/projects/{created['id']}/members/{owner_id}", headers=headers
    )
    assert response.status_code == 400


def test_project_name_is_required(client, project):
    headers, _ = project
    response = client.post("/api/projects", json={"name": "   "}, headers=headers)
    assert response.status_code == 422
