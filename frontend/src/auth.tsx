import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { ApiError, UNAUTHORIZED_EVENT, api, tokenStore } from './api'
import type { User } from './types'

type AuthState = {
  user: User | null
  /** True while we check a saved token right after the page loads. */
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState<boolean>(() => tokenStore.get() !== null)

  // On page load: if we have a saved token, find out who it belongs to.
  useEffect(() => {
    if (!tokenStore.get()) return
    let cancelled = false
    api
      .me()
      .then((me) => {
        if (!cancelled) setUser(me)
      })
      .catch((error) => {
        // Only forget the token if the server said it is invalid.
        if (error instanceof ApiError && error.status === 401) tokenStore.clear()
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const logout = useCallback(() => {
    tokenStore.clear()
    setUser(null)
  }, [])

  // If any request gets a 401 later, sign out.
  useEffect(() => {
    window.addEventListener(UNAUTHORIZED_EVENT, logout)
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, logout)
  }, [logout])

  const login = useCallback(async (email: string, password: string) => {
    const result = await api.login(email, password)
    tokenStore.set(result.access_token)
    setUser(result.user)
  }, [])

  const register = useCallback(async (name: string, email: string, password: string) => {
    const result = await api.register(name, email, password)
    tokenStore.set(result.access_token)
    setUser(result.user)
  }, [])

  const value = useMemo(
    () => ({ user, loading, login, register, logout }),
    [user, loading, login, register, logout],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthState {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>')
  return context
}
