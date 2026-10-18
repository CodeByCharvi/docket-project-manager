# Docket: project management and team collaboration app

A full-stack app where teams create projects, invite teammates, and move tasks across a shared board.

- **Frontend:** React + TypeScript (Vite), React Router
- **Backend:** Python, FastAPI, SQLAlchemy
- **Database:** PostgreSQL
- **Extras:** JWT login, automated tests, Docker, GitHub Actions

> **Heads-up:** this code was written in an environment that could not download packages, so the
> tests and the build have **not been run yet**. Run the steps below and, if anything fails, paste the
> error. Expect to fix a small thing or two on the first run.

## Features

- Sign up and sign in (passwords are hashed with bcrypt; login uses a JWT token)
- Dashboard with a folder-style card for each project and a progress bar
- Project board with three columns: To do, In progress, Done
- Create, edit, delete tasks; change status from the card; priority, due date, assignee
- Teams: the project owner adds people by email (they must have signed up first)
- Search tasks, "Only my tasks" filter
- Loading states, error messages with a retry button, empty states
- People can only see projects they belong to

## Run it with Docker (easiest)

Install Docker Desktop, then from this folder:

```bash
docker compose up --build
```

- App: http://localhost:8080
- API docs (try every endpoint in the browser): http://localhost:8000/api/docs

Stop with `Ctrl+C`. Your data is kept in a Docker volume (`docker compose down -v` erases it).

## Run it without Docker (Windows PowerShell)

You need Python 3.11+, Node 20+, and PostgreSQL. Create an empty database called `project_manager`
(for example with pgAdmin, or `createdb project_manager`).

**Terminal 1: backend**

```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements-dev.txt
$env:DATABASE_URL = "postgresql+psycopg2://postgres:YOUR_PASSWORD@localhost:5432/project_manager"
uvicorn app.main:app --reload
```

**Terminal 2: frontend**

```powershell
cd frontend
npm install
npm run dev
```

Open http://localhost:5173. The dev server forwards `/api` requests to the backend on port 8000.

## Tests

```powershell
cd backend
pytest            # 22 API tests (uses a temporary SQLite file, no PostgreSQL needed)

cd ../frontend
npm test          # unit tests for the helper functions
npm run build     # also type-checks everything
```

GitHub Actions (`.github/workflows/ci.yml`) runs all of this on every push and pull request.

## API at a glance

All routes start with `/api`. Everything except register/login needs the header
`Authorization: Bearer <token>`.

| Method | Path | What it does |
| --- | --- | --- |
| POST | `/auth/register` | Create an account, returns a token |
| POST | `/auth/login` | Sign in, returns a token |
| GET | `/auth/me` | Who am I? |
| GET / POST | `/projects` | List my projects / create one |
| GET / PATCH / DELETE | `/projects/{id}` | Read / rename (owner) / delete (owner) |
| POST | `/projects/{id}/members` | Add a person by email (owner) |
| DELETE | `/projects/{id}/members/{user_id}` | Remove a person (owner) |
| GET / POST | `/projects/{id}/tasks` | List / create tasks |
| PATCH / DELETE | `/tasks/{id}` | Edit / delete a task |

## Folder map

```
backend/
  app/
    main.py         app setup, CORS, creates tables on start
    database.py     connection to PostgreSQL
    models.py       tables: users, projects, tasks, project_members
    schemas.py      the JSON shapes the API accepts and returns
    security.py     password hashing + JWT tokens
    deps.py         "who is logged in?" and "can they see this project?"
    routers/        auth.py, projects.py, tasks.py
  tests/            pytest tests
frontend/
  src/
    api.ts          every call to the backend, in one place
    auth.tsx        login state shared across the app
    projects.tsx    project list shared by the sidebar and dashboard
    pages/          AuthPage, DashboardPage, ProjectPage
    components/     AppShell (sidebar), ProjectCard, TaskCard, modals, ...
    lib/format.ts   small pure helpers (and format.test.ts)
docker-compose.yml  database + backend + frontend together
```

## Good things to be able to explain in an interview

- Why a stranger gets **404 (not 403)** for someone else's project: it doesn't reveal which ids exist.
- Why status changes are **optimistic** in the UI: the card moves instantly and snaps back if the server refuses.
- How the JWT works: the server signs "this is user 5", and checks the signature on every request.
- Why passwords are hashed and never stored or returned.
- Why the owner is also stored as a member: one rule ("are you a member?") controls all access.

## Known limits (honest list)

- Tables are created on startup. A real deployment would use migrations (Alembic).
- The token lives in `localStorage`. That is simple, but a production app might prefer httpOnly cookies.
- Project task counts are computed in Python per project, which is fine for small teams but would
  become a SQL `COUNT` query at scale.
- Set a real `SECRET_KEY` before deploying anywhere public.
- **AWS deployment is not included.** A natural next step: push the two images to ECR, run them on
  ECS Fargate (or App Runner), and use RDS for PostgreSQL.
