"""Schemas describe the JSON the API accepts and returns (and validate it)."""
from datetime import date, datetime
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, StringConstraints, field_validator

Status = Literal["todo", "in_progress", "done"]
Priority = Literal["low", "medium", "high"]

Name = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=100)]
Title = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=200)]


# ---------- users ----------
class UserCreate(BaseModel):
    name: Name
    email: EmailStr
    password: str = Field(min_length=6, max_length=64)

    @field_validator("email")
    @classmethod
    def lowercase_email(cls, v: str) -> str:
        return v.lower()


class UserLogin(BaseModel):
    email: EmailStr
    password: str

    @field_validator("email")
    @classmethod
    def lowercase_email(cls, v: str) -> str:
        return v.lower()


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# ---------- projects ----------
class ProjectCreate(BaseModel):
    name: Name
    description: str = Field(default="", max_length=500)


class ProjectUpdate(BaseModel):
    name: Name | None = None
    description: str | None = Field(default=None, max_length=500)


class ProjectOut(BaseModel):
    id: int
    name: str
    description: str
    owner_id: int
    created_at: datetime
    task_count: int
    done_count: int


class ProjectDetail(ProjectOut):
    members: list[UserOut]


class MemberAdd(BaseModel):
    email: EmailStr

    @field_validator("email")
    @classmethod
    def lowercase_email(cls, v: str) -> str:
        return v.lower()


# ---------- tasks ----------
class TaskCreate(BaseModel):
    title: Title
    description: str = Field(default="", max_length=2000)
    status: Status = "todo"
    priority: Priority = "medium"
    assignee_id: int | None = None
    due_date: date | None = None


class TaskUpdate(BaseModel):
    title: Title | None = None
    description: str | None = Field(default=None, max_length=2000)
    status: Status | None = None
    priority: Priority | None = None
    assignee_id: int | None = None
    due_date: date | None = None


class TaskOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    project_id: int
    title: str
    description: str
    status: Status
    priority: Priority
    due_date: date | None
    assignee_id: int | None
    assignee: UserOut | None
    created_at: datetime
    updated_at: datetime
