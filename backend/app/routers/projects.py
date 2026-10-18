from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import get_current_user, get_project_for_member
from ..models import Project, User
from ..schemas import MemberAdd, ProjectCreate, ProjectDetail, ProjectOut, ProjectUpdate, UserOut

router = APIRouter(prefix="/projects", tags=["projects"])


def to_project_out(project: Project) -> ProjectOut:
    return ProjectOut(
        id=project.id,
        name=project.name,
        description=project.description,
        owner_id=project.owner_id,
        created_at=project.created_at,
        task_count=len(project.tasks),
        done_count=sum(1 for t in project.tasks if t.status == "done"),
    )


def to_project_detail(project: Project) -> ProjectDetail:
    return ProjectDetail(
        **to_project_out(project).model_dump(),
        members=[UserOut.model_validate(m) for m in project.members],
    )


def require_owner(project: Project, user: User) -> None:
    if project.owner_id != user.id:
        raise HTTPException(status_code=403, detail="Only the project owner can do this")


@router.get("", response_model=list[ProjectOut])
def list_projects(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    projects = db.scalars(
        select(Project).where(Project.members.any(User.id == user.id)).order_by(Project.id.desc())
    ).all()
    return [to_project_out(p) for p in projects]


@router.post("", response_model=ProjectDetail, status_code=201)
def create_project(
    payload: ProjectCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    project = Project(
        name=payload.name, description=payload.description.strip(), owner_id=user.id, members=[user]
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return to_project_detail(project)


@router.get("/{project_id}", response_model=ProjectDetail)
def get_project(
    project_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    return to_project_detail(get_project_for_member(db, project_id, user))


@router.patch("/{project_id}", response_model=ProjectDetail)
def update_project(
    project_id: int,
    payload: ProjectUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    project = get_project_for_member(db, project_id, user)
    require_owner(project, user)
    data = payload.model_dump(exclude_unset=True)
    if data.get("name") is not None:
        project.name = data["name"]
    if data.get("description") is not None:
        project.description = data["description"].strip()
    db.commit()
    db.refresh(project)
    return to_project_detail(project)


@router.delete("/{project_id}", status_code=204)
def delete_project(
    project_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    project = get_project_for_member(db, project_id, user)
    require_owner(project, user)
    db.delete(project)
    db.commit()
    return Response(status_code=204)


@router.post("/{project_id}/members", response_model=ProjectDetail, status_code=201)
def add_member(
    project_id: int,
    payload: MemberAdd,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    project = get_project_for_member(db, project_id, user)
    require_owner(project, user)
    new_member = db.scalar(select(User).where(User.email == payload.email))
    if new_member is None:
        raise HTTPException(
            status_code=404, detail="No account with that email. Ask them to sign up first."
        )
    if new_member in project.members:
        raise HTTPException(status_code=409, detail="That person is already on this project")
    project.members.append(new_member)
    db.commit()
    db.refresh(project)
    return to_project_detail(project)


@router.delete("/{project_id}/members/{member_id}", response_model=ProjectDetail)
def remove_member(
    project_id: int,
    member_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    project = get_project_for_member(db, project_id, user)
    require_owner(project, user)
    if member_id == project.owner_id:
        raise HTTPException(status_code=400, detail="The owner cannot be removed")
    member = next((m for m in project.members if m.id == member_id), None)
    if member is None:
        raise HTTPException(status_code=404, detail="Member not found")
    project.members.remove(member)
    # Anything that was assigned to them becomes unassigned.
    for task in project.tasks:
        if task.assignee_id == member_id:
            task.assignee_id = None
    db.commit()
    db.refresh(project)
    return to_project_detail(project)
