export type Status = 'todo' | 'in_progress' | 'done'
export type Priority = 'low' | 'medium' | 'high'

export type User = {
  id: number
  name: string
  email: string
}

export type Project = {
  id: number
  name: string
  description: string
  owner_id: number
  created_at: string
  task_count: number
  done_count: number
}

export type ProjectDetail = Project & {
  members: User[]
}

export type Task = {
  id: number
  project_id: number
  title: string
  description: string
  status: Status
  priority: Priority
  due_date: string | null // "YYYY-MM-DD"
  assignee_id: number | null
  assignee: User | null
  created_at: string
  updated_at: string
}

/** What the task form sends to the API. */
export type TaskInput = {
  title: string
  description: string
  status: Status
  priority: Priority
  assignee_id: number | null
  due_date: string | null
}

export type AuthResponse = {
  access_token: string
  token_type: string
  user: User
}
