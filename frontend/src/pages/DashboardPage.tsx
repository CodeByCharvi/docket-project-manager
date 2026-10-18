import { useEffect, useState } from 'react'
import { useAuth } from '../auth'
import { ErrorBanner, Spinner } from '../components/Feedback'
import NewProjectModal from '../components/NewProjectModal'
import ProjectCard from '../components/ProjectCard'
import { useProjects } from '../projects'

export default function DashboardPage() {
  const { user } = useAuth()
  const { projects, loading, error, refresh } = useProjects()
  const [newProjectOpen, setNewProjectOpen] = useState(false)

  // Coming back to the dashboard? Fetch fresh numbers (skip the very first load,
  // which the provider is already doing).
  useEffect(() => {
    if (!loading) void refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const openTasks = projects.reduce((sum, p) => sum + p.task_count - p.done_count, 0)
  const firstName = user?.name.split(' ')[0]

  return (
    <>
      <header className="page-head">
        <div>
          <h1>{firstName ? `Welcome back, ${firstName}` : 'Your projects'}</h1>
          {!loading && !error && projects.length > 0 && (
            <p className="page-sub">
              {openTasks} open {openTasks === 1 ? 'task' : 'tasks'} across {projects.length}{' '}
              {projects.length === 1 ? 'project' : 'projects'}.
            </p>
          )}
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setNewProjectOpen(true)}>
          New project
        </button>
      </header>

      {loading && <Spinner label="Loading projects" />}
      {error && <ErrorBanner message={error} onRetry={() => void refresh()} />}

      {!loading && !error && projects.length === 0 && (
        <div className="empty">
          <h2>No projects yet</h2>
          <p>Create your first project, then add tasks and invite your team.</p>
          <button type="button" className="btn btn-primary" onClick={() => setNewProjectOpen(true)}>
            Create a project
          </button>
        </div>
      )}

      {projects.length > 0 && (
        <div className="project-grid">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}

      {newProjectOpen && <NewProjectModal onClose={() => setNewProjectOpen(false)} />}
    </>
  )
}
