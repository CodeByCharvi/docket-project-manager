def make_task(client, headers, project_id, **fields):
    payload = {"title": "Write homepage copy", **fields}
    response = client.post(f"/api/projects/{project_id}/tasks", json=payload, headers=headers)
    assert response.status_code == 201, response.text
    return response.json()


def test_create_task_uses_defaults(client, project):
    headers, created = project
    task = make_task(client, headers, created["id"])
    assert task["status"] == "todo"
    assert task["priority"] == "medium"
    assert task["assignee"] is None


def test_task_validation(client, project):
    headers, created = project
    url = f"/api/projects/{created['id']}/tasks"
    assert client.post(url, json={"title": ""}, headers=headers).status_code == 422
    assert client.post(url, json={"title": "x", "status": "finished"}, headers=headers).status_code == 422


def test_update_status_and_counts(client, project):
    headers, created = project
    first = make_task(client, headers, created["id"], title="One")
    make_task(client, headers, created["id"], title="Two")

    updated = client.patch(f"/api/tasks/{first['id']}", json={"status": "done"}, headers=headers)
    assert updated.status_code == 200
    assert updated.json()["status"] == "done"

    listed = client.get("/api/projects", headers=headers).json()
    assert listed[0]["task_count"] == 2
    assert listed[0]["done_count"] == 1


def test_assignee_must_be_a_project_member(client, register, project):
    headers, created = project
    _, bob = register("bob@example.com", "Bob")

    bad = client.post(
        f"/api/projects/{created['id']}/tasks",
        json={"title": "Task", "assignee_id": bob["id"]},
        headers=headers,
    )
    assert bad.status_code == 400

    client.post(
        f"/api/projects/{created['id']}/members", json={"email": "bob@example.com"}, headers=headers
    )
    good = make_task(client, headers, created["id"], assignee_id=bob["id"])
    assert good["assignee"]["name"] == "Bob"

    cleared = client.patch(f"/api/tasks/{good['id']}", json={"assignee_id": None}, headers=headers)
    assert cleared.status_code == 200
    assert cleared.json()["assignee"] is None


def test_removing_a_member_unassigns_their_tasks(client, register, project):
    headers, created = project
    _, bob = register("bob@example.com", "Bob")
    client.post(
        f"/api/projects/{created['id']}/members", json={"email": "bob@example.com"}, headers=headers
    )
    task = make_task(client, headers, created["id"], assignee_id=bob["id"])

    removed = client.delete(f"/api/projects/{created['id']}/members/{bob['id']}", headers=headers)
    assert removed.status_code == 200

    tasks = client.get(f"/api/projects/{created['id']}/tasks", headers=headers).json()
    assert tasks[0]["id"] == task["id"]
    assert tasks[0]["assignee"] is None


def test_strangers_cannot_touch_tasks(client, register, project):
    headers, created = project
    task = make_task(client, headers, created["id"])
    bob_headers, _ = register("bob@example.com", "Bob")

    assert client.get(f"/api/projects/{created['id']}/tasks", headers=bob_headers).status_code == 404
    assert client.patch(f"/api/tasks/{task['id']}", json={"title": "x"}, headers=bob_headers).status_code == 404
    assert client.delete(f"/api/tasks/{task['id']}", headers=bob_headers).status_code == 404


def test_delete_task(client, project):
    headers, created = project
    task = make_task(client, headers, created["id"])
    assert client.delete(f"/api/tasks/{task['id']}", headers=headers).status_code == 204
    assert client.get(f"/api/projects/{created['id']}/tasks", headers=headers).json() == []


def test_deleting_a_project_deletes_its_tasks(client, project):
    headers, created = project
    task = make_task(client, headers, created["id"])
    assert client.delete(f"/api/projects/{created['id']}", headers=headers).status_code == 204
    assert client.patch(f"/api/tasks/{task['id']}", json={"title": "x"}, headers=headers).status_code == 404
