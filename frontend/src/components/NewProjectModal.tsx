import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { errorMessage } from '../api'
import { useProjects } from '../projects'
import { ErrorBanner } from './Feedback'
import Modal from './Modal'

export default function NewProjectModal({ onClose }: { onClose: () => void }) {
  const { create } = useProjects()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const project = await create(name, description)
      onClose()
      navigate(`/projects/${project.id}`)
    } catch (e) {
      setError(errorMessage(e))
      setSaving(false)
    }
  }

  return (
    <Modal title="New project" onClose={onClose}>
      <form className="form" onSubmit={handleSubmit}>
        {error && <ErrorBanner message={error} />}
        <div className="field">
          <label htmlFor="project-name">Name</label>
          <input
            id="project-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={100}
            required
            autoFocus
          />
        </div>
        <div className="field">
          <label htmlFor="project-description">Description (optional)</label>
          <textarea
            id="project-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={500}
            rows={3}
          />
        </div>
        <div className="form-actions">
          <button type="button" className="btn btn-quiet" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving || !name.trim()}>
            {saving ? 'Creating…' : 'Create project'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
