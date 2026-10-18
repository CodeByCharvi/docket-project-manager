import { describe, expect, it } from 'vitest'
import { dueInfo, initials, progress } from './format'

describe('initials', () => {
  it('uses the first and last name', () => {
    expect(initials('Charvi Joshi')).toBe('CJ')
  })
  it('handles a single name', () => {
    expect(initials('alice')).toBe('A')
  })
  it('handles an empty name', () => {
    expect(initials('   ')).toBe('?')
  })
})

describe('progress', () => {
  it('is 0 when there are no tasks', () => {
    expect(progress(0, 0)).toBe(0)
  })
  it('rounds to a whole percentage', () => {
    expect(progress(1, 3)).toBe(33)
    expect(progress(3, 3)).toBe(100)
  })
})

describe('dueInfo', () => {
  const today = new Date(2026, 9, 18) // 18 Oct 2026

  it('returns null when there is no due date', () => {
    expect(dueInfo(null, today)).toBeNull()
  })
  it('marks past dates as overdue', () => {
    expect(dueInfo('2026-10-17', today)?.overdue).toBe(true)
  })
  it('does not mark today or future dates as overdue', () => {
    expect(dueInfo('2026-10-18', today)?.overdue).toBe(false)
    expect(dueInfo('2026-11-01', today)?.overdue).toBe(false)
  })
})
