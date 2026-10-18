import type { AuthResponse, Project, ProjectDetail, Task, TaskInput, User } from './types'

const TOKEN_KEY = 'docket_token'

/** Where the login token lives in the browser. */
export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
}

/** Fired when the server says our token is no longer valid. */
export const UNAUTHORIZED_EVENT = 'docket:unauthorized'

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong. Try again.'
}

/** FastAPI sends `detail` as a string, or as a list of validation problems. */
function messageFromDetail(detail: unknown): string {
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) {
    return detail
      .map((item) => (item && typeof item.msg === 'string' ? item.msg : ''))
      .filter(Boolean)
      .join('. ')
  }
  return ''
}

async function request<T>(
  path: string,
  options: { method?: string; body?: unknown } = {},
): Promise<T> {
  const headers: Record<string, string> = {}
  const token = tokenStore.get()
  if (token) headers.Authorization = `Bearer ${token}`
  if (options.body !== undefined) headers['Content-Type'] = 'application/json'

  let response: Response
  try {
    response = await fetch(`/api${path}`, {
      method: options.method ?? 'GET',
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    })
  } catch {
    throw new ApiError("Can't reach the server. Check that the backend is running.", 0)
  }

  if (response.status === 204) return undefined as T

  const data: unknown = await response.json().catch(() => null)

  if (!response.ok) {
    if (response.status === 401 && token) {
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT))
    }
    const detail = (data as { detail?: unknown } | null)?.detail
    throw new ApiError(
      messageFromDetail(detail) || `Request failed (${response.status})`,
      response.status,
    )
  }
  return data as T
}

export const api = {
  register: (name: string, email: string, password: string) =>
    request<AuthResponse>('/auth/register', { method: 'POST', body: { name, email, password } }),
  login: (email: string, password: string) =>
    request<AuthResponse>('/auth/login', { method: 'POST', body: { email, password } }),
  me: () => request<User>('/auth/me'),

  listProjects: () => request<Project[]>('/projects'),
  createProject: (name: string, description: string) =>
    request<ProjectDetail>('/projects', { method: 'POST', body: { name, description } }),
  getProject: (id: number) => request<ProjectDetail>(`/projects/${id}`),
  deleteProject: (id: number) => request<void>(`/projects/${id}`, { method: 'DELETE' }),
  addMember: (id: number, email: string) =>
    request<ProjectDetail>(`/projects/${id}/members`, { method: 'POST', body: { email } }),
  removeMember: (id: number, userId: number) =>
    request<ProjectDetail>(`/projects/${id}/members/${userId}`, { method: 'DELETE' }),

  listTasks: (projectId: number) => request<Task[]>(`/projects/${projectId}/tasks`),
  createTask: (projectId: number, input: TaskInput) =>
    request<Task>(`/projects/${projectId}/tasks`, { method: 'POST', body: input }),
  updateTask: (taskId: number, input: Partial<TaskInput>) =>
    request<Task>(`/tasks/${taskId}`, { method: 'PATCH', body: input }),
  deleteTask: (taskId: number) => request<void>(`/tasks/${taskId}`, { method: 'DELETE' }),
}
