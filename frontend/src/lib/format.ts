import type { Priority, Status } from '../types'

export const STATUSES: Status[] = ['todo', 'in_progress', 'done']

export const STATUS_LABELS: Record<Status, string> = {
  todo: 'To do',
  in_progress: 'In progress',
  done: 'Done',
}

export const PRIORITY_LABELS: Record<Priority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
}

/** "Charvi Joshi" -> "CJ", "alice" -> "A" */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  const first = parts[0][0]
  const last = parts.length > 1 ? parts[parts.length - 1][0] : ''
  return (first + last).toUpperCase()
}

/** Percentage of tasks done, rounded to a whole number. */
export function progress(done: number, total: number): number {
  if (total === 0) return 0
  return Math.round((done / total) * 100)
}

/** Turns "2026-10-18" into a local Date (no timezone surprises). */
export function parseDate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function dueInfo(
  due: string | null,
  today: Date = new Date(),
): { label: string; overdue: boolean } | null {
  if (!due) return null
  const date = parseDate(due)
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  return {
    label: date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }),
    overdue: date.getTime() < startOfToday.getTime(),
  }
}

const PROJECT_COLORS = ['#E9A81C', '#2F7D5B', '#C4572F', '#3D6FB6', '#8A5BA8', '#2F8F9D']
const AVATAR_COLORS = ['#2F5D4B', '#7A3E2B', '#2F4F7A', '#5E3F78', '#2B6670', '#6B5A1E']

/** Each project gets a stable folder-tab colour based on its id. */
export function projectColor(id: number): string {
  return PROJECT_COLORS[Math.abs(id) % PROJECT_COLORS.length]
}

export function avatarColor(id: number): string {
  return AVATAR_COLORS[Math.abs(id) % AVATAR_COLORS.length]
}
