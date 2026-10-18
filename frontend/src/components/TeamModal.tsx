import { useState, type FormEvent } from 'react'
import { api, errorMessage } from '../api'
import type { ProjectDetail } from '../types'
import Avatar from './Avatar'
import { ErrorBanner } from './Feedback'
import Modal from './Modal'

type Props = {
  project: ProjectDetail
  isOwner: boolean
  onChange: (project: ProjectDetail) => void
  onClose: () => void
}

export default function TeamModal({ project, isOwner, onChange, onClose }: Props) {
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleAdd(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      onChange(await api.addMember(project.id, email))
      setEmail('')
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  async function handleRemove(userId: number, name: string) {
    if (!window.confirm(`Remove ${name} from this project? Their tasks become unassigned.`)) return
    setBusy(true)
    setError(null)
    try {
      onChange(await api.removeMember(project.id, userId))
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal title="Team" onClose={onClose}>
      <div className="form">
        {error && <ErrorBanner message={error} />}

        <ul className="member-list">
          {project.members.map((member) => (
            <li key={member.id}>
              <Avatar user={member} size={32} />
              <div className="member-text">
                <strong>{member.name}</strong>
                <span>{member.email}</span>
              </div>
              {member.id === project.owner_id ? (
                <span className="chip">Owner</span>
              ) : (
                isOwner && (
                  <button
                    type="button"
                    className="btn btn-quiet btn-small"
                    disabled={busy}
                    onClick={() => handleRemove(member.id, member.name)}
                  >
                    Remove
                  </button>
                )
              )}
            </li>
          ))}
        </ul>

        {isOwner ? (
          <form className="add-member" onSubmit={handleAdd}>
            <div className="field">
              <label htmlFor="member-email">Add a teammate by email</label>
              <input
                id="member-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
              />
              <p className="hint">They need a Docket account first.</p>
            </div>
            <button type="submit" className="btn btn-primary" disabled={busy || !email.trim()}>
              Add to project
            </button>
          </form>
        ) : (
          <p className="hint">Only the project owner can add or remove people.</p>
        )}
      </div>
    </Modal>
  )
}
