import { useState, type FormEvent } from 'react'
import { errorMessage } from '../api'
import { PRIORITY_LABELS, STATUSES, STATUS_LABELS } from '../lib/format'
import type { Priority, Status, Task, TaskInput, User } from '../types'
import { ErrorBanner } from './Feedback'
import Modal from './Modal'

type Props = {
  members: User[]
  /** Pass a task to edit it, or null to create a new one. */
  task: Task | null
  /** Starting status for a new task (the column's "Add task" button sets this). */
  initialStatus: Status
  onSave: (input: TaskInput) => Promise<void>
  onClose: () => void
}

export default function TaskModal({ members, task, initialStatus, onSave, onClose }: Props) {
  const [title, setTitle] = useState(task?.title ?? '')
  const [description, setDescription] = useState(task?.description ?? '')
  const [status, setStatus] = useState<Status>(task?.status ?? initialStatus)
  const [priority, setPriority] = useState<Priority>(task?.priority ?? 'medium')
  const [assignee, setAssignee] = useState(task?.assignee_id ? String(task.assignee_id) : '')
  const [dueDate, setDueDate] = useState(task?.due_date ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await onSave({
        title,
        description,
        status,
        priority,
        assignee_id: assignee ? Number(assignee) : null,
        due_date: dueDate || null,
      })
      onClose()
    } catch (e) {
      setError(errorMessage(e))
      setSaving(false)
    }
  }

  return (
    <Modal title={task ? 'Edit task' : 'New task'} onClose={onClose}>
      <form className="form" onSubmit={handleSubmit}>
        {error && <ErrorBanner message={error} />}

        <div className="field">
          <label htmlFor="task-title">Title</label>
          <input
            id="task-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
            required
            autoFocus
          />
        </div>

        <div className="field">
          <label htmlFor="task-description">Details (optional)</label>
          <textarea
            id="task-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={2000}
            rows={3}
          />
        </div>

        <div className="field-row">
          <div className="field">
            <label htmlFor="task-status">Status</label>
            <select
              id="task-status"
              value={status}
              onChange={(e) => setStatus(e.target.value as Status)}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="task-priority">Priority</label>
            <select
              id="task-priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
            >
              {(Object.keys(PRIORITY_LABELS) as Priority[]).map((p) => (
                <option key={p} value={p}>
                  {PRIORITY_LABELS[p]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="field-row">
          <div className="field">
            <label htmlFor="task-assignee">Assigned to</label>
            <select
              id="task-assignee"
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
            >
              <option value="">Unassigned</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="task-due">Due date</label>
            <input
              id="task-due"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="btn btn-quiet" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving || !title.trim()}>
            {saving ? 'Saving…' : task ? 'Save changes' : 'Add task'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
