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

# ---------------------------------------------------------------------------
# Serve the built website (only when it exists, i.e. inside the combined Docker image).
# ---------------------------------------------------------------------------
from pathlib import Path  # noqa: E402

from fastapi import HTTPException  # noqa: E402
from fastapi.responses import FileResponse  # noqa: E402
from fastapi.staticfiles import StaticFiles  # noqa: E402

STATIC_DIR = (Path(__file__).resolve().parent.parent / "static").resolve()

if STATIC_DIR.is_dir():
    app.mount("/assets", StaticFiles(directory=STATIC_DIR / "assets"), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    def serve_website(full_path: str):
        # Unknown API addresses stay real 404s instead of showing the website.
        if full_path.startswith("api/"):
            raise HTTPException(status_code=404, detail="Not found")
        candidate = (STATIC_DIR / full_path).resolve()
        if full_path and candidate.is_file() and STATIC_DIR in candidate.parents:
            return FileResponse(candidate)
        # Any other address is a page of the React app, which handles its own routing.
        return FileResponse(STATIC_DIR / "index.html")