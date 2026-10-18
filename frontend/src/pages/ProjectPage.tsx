import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ApiError, api, errorMessage } from '../api'
import { useAuth } from '../auth'
import Avatar from '../components/Avatar'
import { ErrorBanner, Spinner } from '../components/Feedback'
import TaskCard from '../components/TaskCard'
import TaskModal from '../components/TaskModal'
import TeamModal from '../components/TeamModal'
import { STATUSES, STATUS_LABELS, projectColor } from '../lib/format'
import { useProjects } from '../projects'
import type { ProjectDetail, Status, Task, TaskInput } from '../types'

type LoadError = { message: string; status: number }

export default function ProjectPage() {
  const { projectId } = useParams()
  const id = Number(projectId)
  const { user } = useAuth()
  const { refresh, remove } = useProjects()
  const navigate = useNavigate()

  const [project, setProject] = useState<ProjectDetail | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<LoadError | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  const [actionError, setActionError] = useState<string | null>(null)
  const [busyIds, setBusyIds] = useState<number[]>([])
  const [editor, setEditor] = useState<{ task: Task | null; status: Status } | null>(null)
  const [teamOpen, setTeamOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [onlyMine, setOnlyMine] = useState(false)

  // Load the project and its tasks whenever the URL (or the retry button) changes.
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setLoadError(null)
    Promise.all([api.getProject(id), api.listTasks(id)])
      .then(([loadedProject, loadedTasks]) => {
        if (cancelled) return
        setProject(loadedProject)
        setTasks(loadedTasks)
      })
      .catch((e) => {
        if (cancelled) return
        setLoadError({ message: errorMessage(e), status: e instanceof ApiError ? e.status : 0 })
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [id, reloadKey])

  if (loading) {
    return <Spinner label="Loading project" />
  }

  if (loadError || !project) {
    const notFound = loadError?.status === 404
    return (
      <div className="stack">
        <ErrorBanner
          message={
            notFound
              ? "This project doesn't exist, or you aren't on its team."
              : (loadError?.message ?? 'Could not load this project.')
          }
          onRetry={notFound ? undefined : () => setReloadKey((k) => k + 1)}
        />
        <Link to="/" className="link-btn">
          Back to your projects
        </Link>
      </div>
    )
  }

  const isOwner = project.owner_id === user?.id

  // ----- actions -----

  async function changeStatus(task: Task, status: Status) {
    if (status === task.status) return
    setActionError(null)
    setBusyIds((ids) => [...ids, task.id])
    // Update the screen right away, and undo it if the server says no.
    setTasks((list) => list.map((t) => (t.id === task.id ? { ...t, status } : t)))
    try {
      const saved = await api.updateTask(task.id, { status })
      setTasks((list) => list.map((t) => (t.id === saved.id ? saved : t)))
      void refresh()
    } catch (e) {
      setTasks((list) => list.map((t) => (t.id === task.id ? { ...t, status: task.status } : t)))
      setActionError(errorMessage(e))
    } finally {
      setBusyIds((ids) => ids.filter((x) => x !== task.id))
    }
  }

  async function saveTask(input: TaskInput) {
    if (editor?.task) {
      const saved = await api.updateTask(editor.task.id, input)
      setTasks((list) => list.map((t) => (t.id === saved.id ? saved : t)))
    } else {
      const created = await api.createTask(id, input)
      setTasks((list) => [...list, created])
    }
    void refresh()
  }

  async function deleteTask(task: Task) {
    if (!window.confirm(`Delete "${task.title}"? This can't be undone.`)) return
    setActionError(null)
    try {
      await api.deleteTask(task.id)
      setTasks((list) => list.filter((t) => t.id !== task.id))
      void refresh()
    } catch (e) {
      setActionError(errorMessage(e))
    }
  }

  async function deleteProject() {
    if (!window.confirm(`Delete "${project?.name}" and all of its tasks? This can't be undone.`)) {
      return
    }
    setActionError(null)
    try {
      await remove(id)
      navigate('/')
    } catch (e) {
      setActionError(errorMessage(e))
    }
  }

  async function handleTeamChange(next: ProjectDetail) {
    const someoneLeft = next.members.length < (project?.members.length ?? 0)
    setProject(next)
    void refresh()
    if (someoneLeft) {
      // Removing a person unassigns their tasks on the server, so reload them.
      try {
        setTasks(await api.listTasks(id))
      } catch (e) {
        setActionError(errorMessage(e))
      }
    }
  }

  // ----- what to show -----

  const search = query.trim().toLowerCase()
  const visibleTasks = tasks.filter(
    (t) =>
      (!onlyMine || t.assignee_id === user?.id) &&
      `${t.title} ${t.description}`.toLowerCase().includes(search),
  )

  return (
    <>
      <header className="page-head">
        <div>
          <h1 className="project-title">
            <span className="dot dot-large" style={{ background: projectColor(project.id) }} />
            {project.name}
          </h1>
          {project.description && <p className="page-sub">{project.description}</p>}
        </div>
        <div className="head-actions">
          <button
            type="button"
            className="team-button"
            onClick={() => setTeamOpen(true)}
            aria-label={`Team, ${project.members.length} ${project.members.length === 1 ? 'person' : 'people'}`}
          >
            <span className="avatar-stack">
              {project.members.slice(0, 4).map((member) => (
                <Avatar key={member.id} user={member} size={28} />
              ))}
            </span>
            <span>Team</span>
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setEditor({ task: null, status: 'todo' })}
          >
            New task
          </button>
          {isOwner && (
            <button type="button" className="btn btn-quiet" onClick={() => void deleteProject()}>
              Delete project
            </button>
          )}
        </div>
      </header>

      <div className="toolbar">
        <div className="field toolbar-search">
          <label htmlFor="task-search" className="sr-only">
            Search tasks
          </label>
          <input
            id="task-search"
            type="search"
            placeholder="Search tasks"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <label className="check">
          <input type="checkbox" checked={onlyMine} onChange={(e) => setOnlyMine(e.target.checked)} />
          Only my tasks
        </label>
      </div>

      {actionError && <ErrorBanner message={actionError} />}

      <div className="board">
        {STATUSES.map((status) => {
          const column = visibleTasks.filter((t) => t.status === status)
          return (
            <section key={status} className="column" aria-label={STATUS_LABELS[status]}>
              <div className="column-head">
                <h2>
                  <span className={`status-dot status-${status}`} />
                  {STATUS_LABELS[status]}
                  <span className="count">{column.length}</span>
                </h2>
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => setEditor({ task: null, status })}
                  aria-label={`Add task to ${STATUS_LABELS[status]}`}
                >
                  +
                </button>
              </div>

              {column.length === 0 && (
                <p className="column-empty">
                  {tasks.length === 0 ? 'No tasks yet. Add the first one.' : 'No matching tasks.'}
                </p>
              )}

              {column.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  busy={busyIds.includes(task.id)}
                  onStatusChange={(t, s) => void changeStatus(t, s)}
                  onEdit={(t) => setEditor({ task: t, status: t.status })}
                  onDelete={(t) => void deleteTask(t)}
                />
              ))}
            </section>
          )
        })}
      </div>

      {editor && (
        <TaskModal
          members={project.members}
          task={editor.task}
          initialStatus={editor.status}
          onSave={saveTask}
          onClose={() => setEditor(null)}
        />
      )}

      {teamOpen && (
        <TeamModal
          project={project}
          isOwner={isOwner}
          onChange={(next) => void handleTeamChange(next)}
          onClose={() => setTeamOpen(false)}
        />
      )}
    </>
  )
}
