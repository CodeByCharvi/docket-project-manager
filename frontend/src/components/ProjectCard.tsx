import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { progress, projectColor } from '../lib/format'
import type { Project } from '../types'

export default function ProjectCard({ project }: { project: Project }) {
  const percent = progress(project.done_count, project.task_count)
  // The folder tab colour is passed to the CSS as a variable.
  const style = { '--tab': projectColor(project.id) } as CSSProperties

  return (
    <Link to={`/projects/${project.id}`} className="project-card" style={style}>
      <h3>{project.name}</h3>
      <p className="project-desc">{project.description || 'No description yet'}</p>
      <div
        className="progress"
        role="progressbar"
        aria-label="Tasks done"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
      >
        <span style={{ width: `${percent}%` }} />
      </div>
      <p className="project-meta">
        {project.task_count === 0
          ? 'No tasks yet'
          : `${project.done_count} of ${project.task_count} tasks done`}
      </p>
    </Link>
  )
}
