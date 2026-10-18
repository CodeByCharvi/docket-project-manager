import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { api, errorMessage } from './api'
import type { Project, ProjectDetail } from './types'

type ProjectsState = {
  projects: Project[]
  /** True only for the very first load. */
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  create: (name: string, description: string) => Promise<ProjectDetail>
  remove: (id: number) => Promise<void>
}

const ProjectsContext = createContext<ProjectsState | null>(null)

/** Keeps the list of projects in one place so the sidebar and dashboard agree. */
export function ProjectsProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      setProjects(await api.listProjects())
      setError(null)
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const create = useCallback(
    async (name: string, description: string) => {
      const project = await api.createProject(name, description)
      await refresh()
      return project
    },
    [refresh],
  )

  const remove = useCallback(async (id: number) => {
    await api.deleteProject(id)
    setProjects((list) => list.filter((p) => p.id !== id))
  }, [])

  const value = useMemo(
    () => ({ projects, loading, error, refresh, create, remove }),
    [projects, loading, error, refresh, create, remove],
  )
  return <ProjectsContext.Provider value={value}>{children}</ProjectsContext.Provider>
}

export function useProjects(): ProjectsState {
  const context = useContext(ProjectsContext)
  if (!context) throw new Error('useProjects must be used inside <ProjectsProvider>')
  return context
}
