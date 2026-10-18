"""App entry point. Run with: uvicorn app.main:app --reload"""
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from . import models  # noqa: F401  (importing registers the tables)
from .database import Base, engine
from .routers import auth, projects, tasks


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create the tables on startup if they don't exist yet.
    # (A bigger app would use migrations, e.g. Alembic, instead.)
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="Project Manager API",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/api/docs",
    openapi_url="/api/openapi.json",
)

origins = [o.strip() for o in os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api")
app.include_router(projects.router, prefix="/api")
app.include_router(tasks.router, prefix="/api")


@app.get("/api/health", tags=["health"])
def health():
    return {"status": "ok"}
