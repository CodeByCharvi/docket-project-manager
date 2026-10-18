from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import get_current_user, get_project_for_member
from ..models import Project, Task, User
from ..schemas import TaskCreate, TaskOut, TaskUpdate

router = APIRouter(tags=["tasks"])

# Fields that may be set back to "nothing" (null). Everything else ignores null.
NULLABLE_FIELDS = {"assignee_id", "due_date"}


def check_assignee(project: Project, assignee_id: int | None) -> None:
    if assignee_id is not None and all(m.id != assignee_id for m in project.members):
        raise HTTPException(status_code=400, detail="Assignee must be a member of this project")


def get_task_for_member(db: Session, task_id: int, user: User) -> Task:
    task = db.get(Task, task_id)
    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    # Reuses the membership check, so strangers get a 404 here too.
    get_project_for_member(db, task.project_id, user)
    return task


@router.get("/projects/{project_id}/tasks", response_model=list[TaskOut])
def list_tasks(
    project_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    return get_project_for_member(db, project_id, user).tasks


@router.post("/projects/{project_id}/tasks", response_model=TaskOut, status_code=201)
def create_task(
    project_id: int,
    payload: TaskCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    project = get_project_for_member(db, project_id, user)
    check_assignee(project, payload.assignee_id)
    task = Task(project_id=project.id, **payload.model_dump())
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


@router.patch("/tasks/{task_id}", response_model=TaskOut)
def update_task(
    task_id: int,
    payload: TaskUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    task = get_task_for_member(db, task_id, user)
    data = payload.model_dump(exclude_unset=True)
    if data.get("assignee_id") is not None:
        check_assignee(task.project, data["assignee_id"])
    for field, value in data.items():
        if value is None and field not in NULLABLE_FIELDS:
            continue
        setattr(task, field, value)
    db.commit()
    db.refresh(task)
    return task


@router.delete("/tasks/{task_id}", status_code=204)
def delete_task(task_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    task = get_task_for_member(db, task_id, user)
    db.delete(task)
    db.commit()
    return Response(status_code=204)
