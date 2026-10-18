import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { errorMessage } from '../api'
import { useAuth } from '../auth'
import { ErrorBanner } from '../components/Feedback'

export default function AuthPage() {
  const { user, login, register } = useAuth()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Already signed in? Go to the dashboard.
  if (user) return <Navigate to="/" replace />

  const isLogin = mode === 'login'

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      if (isLogin) await login(email, password)
      else await register(name, email, password)
      // On success `user` is set and this page redirects by itself.
    } catch (e) {
      setError(errorMessage(e))
      setSubmitting(false)
    }
  }

  function switchMode() {
    setMode(isLogin ? 'register' : 'login')
    setError(null)
  }

  return (
    <div className="auth">
      <section className="auth-side">
        <h1>One folder for every project your team is working on.</h1>
        <p>Track tasks on a shared board, assign them, and see what is done.</p>
      </section>

      <section className="auth-panel">
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-brand">Docket</div>
          <h2>{isLogin ? 'Sign in to your account' : 'Create your account'}</h2>

          {error && <ErrorBanner message={error} />}

          {!isLogin && (
            <div className="field">
              <label htmlFor="auth-name">Your name</label>
              <input
                id="auth-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                maxLength={100}
                required
              />
            </div>
          )}

          <div className="field">
            <label htmlFor="auth-email">Email</label>
            <input
              id="auth-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>

          <div className="field">
            <label htmlFor="auth-password">Password</label>
            <input
              id="auth-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={isLogin ? 'current-password' : 'new-password'}
              minLength={isLogin ? undefined : 6}
              maxLength={64}
              required
            />
            {!isLogin && <p className="hint">Use at least 6 characters.</p>}
          </div>

          <button type="submit" className="btn btn-primary btn-wide" disabled={submitting}>
            {submitting ? 'Please wait…' : isLogin ? 'Sign in' : 'Create account'}
          </button>

          <p className="auth-switch">
            {isLogin ? 'New to Docket?' : 'Already have an account?'}{' '}
            <button type="button" className="link-btn" onClick={switchMode}>
              {isLogin ? 'Create an account' : 'Sign in'}
            </button>
          </p>
        </form>
      </section>
    </div>
  )
}
