"""Shared helpers used by the route files."""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from .database import get_db
from .models import Project, User
from .security import decode_access_token

bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    unauthorized = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Not authenticated",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if credentials is None:
        raise unauthorized
    user_id = decode_access_token(credentials.credentials)
    if user_id is None:
        raise unauthorized
    user = db.get(User, user_id)
    if user is None:
        raise unauthorized
    return user


def get_project_for_member(db: Session, project_id: int, user: User) -> Project:
    """Load a project, but only if `user` is a member.

    We answer 404 (not 403) for strangers so nobody can discover which
    project ids exist.
    """
    project = db.get(Project, project_id)
    if project is None or user not in project.members:
        raise HTTPException(status_code=404, detail="Project not found")
    return project
