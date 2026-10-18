import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../auth'
import { projectColor } from '../lib/format'
import { useProjects } from '../projects'
import Avatar from './Avatar'
import { ErrorBanner } from './Feedback'
import NewProjectModal from './NewProjectModal'

/** The frame around every signed-in page: sidebar on the left, page on the right. */
export default function AppShell() {
  const { user, logout } = useAuth()
  const { projects, loading, error, refresh } = useProjects()
  const [newProjectOpen, setNewProjectOpen] = useState(false)

  return (
    <div className="shell">
      <aside className="sidebar">
        <NavLink to="/" className="brand" end>
          <svg width="22" height="22" viewBox="0 0 32 32" aria-hidden="true">
            <path
              d="M4 9a3 3 0 0 1 3-3h7l3 4h8a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3z"
              fill="#E9A81C"
            />
          </svg>
          Docket
        </NavLink>

        <nav aria-label="Main">
          <NavLink to="/" end className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
            Dashboard
          </NavLink>
        </nav>

        <div className="sidebar-section-head">
          <span>Projects</span>
          <button
            type="button"
            className="icon-btn icon-btn-light"
            onClick={() => setNewProjectOpen(true)}
            aria-label="New project"
          >
            +
          </button>
        </div>

        <nav className="sidebar-projects" aria-label="Projects">
          {loading && <p className="sidebar-note">Loading…</p>}
          {error && <ErrorBanner message={error} onRetry={() => void refresh()} />}
          {!loading && !error && projects.length === 0 && (
            <p className="sidebar-note">No projects yet.</p>
          )}
          {projects.map((project) => (
            <NavLink
              key={project.id}
              to={`/projects/${project.id}`}
              className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
            >
              <span className="dot" style={{ background: projectColor(project.id) }} />
              <span className="nav-text">{project.name}</span>
            </NavLink>
          ))}
        </nav>

        {user && (
          <div className="sidebar-user">
            <Avatar user={user} size={32} />
            <div className="sidebar-user-text">
              <strong>{user.name}</strong>
              <button type="button" className="link-btn" onClick={logout}>
                Sign out
              </button>
            </div>
          </div>
        )}
      </aside>

      <main className="page">
        <Outlet />
      </main>

      {newProjectOpen && <NewProjectModal onClose={() => setNewProjectOpen(false)} />}
    </div>
  )
}
