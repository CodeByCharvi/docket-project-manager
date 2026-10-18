import { PRIORITY_LABELS, STATUSES, STATUS_LABELS, dueInfo } from '../lib/format'
import type { Status, Task } from '../types'
import Avatar from './Avatar'

type Props = {
  task: Task
  busy: boolean
  onStatusChange: (task: Task, status: Status) => void
  onEdit: (task: Task) => void
  onDelete: (task: Task) => void
}

export default function TaskCard({ task, busy, onStatusChange, onEdit, onDelete }: Props) {
  const due = dueInfo(task.due_date)
  const overdue = due?.overdue && task.status !== 'done'

  return (
    <article className={`task-card priority-${task.priority}`}>
      <button type="button" className="task-title" onClick={() => onEdit(task)}>
        {task.title}
      </button>
      {task.description && <p className="task-desc">{task.description}</p>}

      <div className="task-meta">
        <span className="chip">{PRIORITY_LABELS[task.priority]} priority</span>
        {due && <span className={overdue ? 'chip chip-overdue' : 'chip'}>Due {due.label}</span>}
        {task.assignee && (
          <span className="task-assignee">
            <Avatar user={task.assignee} size={24} />
          </span>
        )}
      </div>

      <div className="task-actions">
        <label className="sr-only" htmlFor={`status-${task.id}`}>
          Status of {task.title}
        </label>
        <select
          id={`status-${task.id}`}
          value={task.status}
          disabled={busy}
          onChange={(e) => onStatusChange(task, e.target.value as Status)}
        >
          {STATUSES.map((status) => (
            <option key={status} value={status}>
              {STATUS_LABELS[status]}
            </option>
          ))}
        </select>
        <button type="button" className="btn btn-quiet btn-small" onClick={() => onDelete(task)}>
          Delete
        </button>
      </div>
    </article>
  )
}
