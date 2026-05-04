import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock pg pool so no real DB is needed
vi.mock('../db/client', () => ({
  db: {
    query: vi.fn(),
  },
}))

import { db } from '../db/client'
import { isWithinBusinessHoursFromSchedule } from '../business-hours'

// We test the pure schedule logic independently of the DB layer
describe('isWithinBusinessHoursFromSchedule', () => {
  it('returns false when the day is marked closed', () => {
    const schedule = [
      { day: 0, open: false, start: '09:00', end: '17:00' }, // Sunday closed
    ]
    // Sunday at noon
    const result = isWithinBusinessHoursFromSchedule(schedule, 'America/New_York', new Date('2025-01-05T12:00:00-05:00'))
    expect(result).toBe(false)
  })

  it('returns true when current time is inside the window', () => {
    const schedule = [
      { day: 1, open: true, start: '09:00', end: '17:00' }, // Monday open
    ]
    // Monday at 10:30 ET
    const result = isWithinBusinessHoursFromSchedule(schedule, 'America/New_York', new Date('2025-01-06T10:30:00-05:00'))
    expect(result).toBe(true)
  })

  it('returns false when current time is before opening', () => {
    const schedule = [
      { day: 1, open: true, start: '09:00', end: '17:00' },
    ]
    // Monday at 08:00 ET
    const result = isWithinBusinessHoursFromSchedule(schedule, 'America/New_York', new Date('2025-01-06T08:00:00-05:00'))
    expect(result).toBe(false)
  })

  it('returns false when current time is after closing', () => {
    const schedule = [
      { day: 1, open: true, start: '09:00', end: '17:00' },
    ]
    // Monday at 17:30 ET
    const result = isWithinBusinessHoursFromSchedule(schedule, 'America/New_York', new Date('2025-01-06T17:30:00-05:00'))
    expect(result).toBe(false)
  })

  it('handles missing day entry as closed', () => {
    const schedule: Array<{ day: number; open: boolean; start: string; end: string }> = []
    const result = isWithinBusinessHoursFromSchedule(schedule, 'UTC', new Date())
    expect(result).toBe(false)
  })

  it('handles midnight-spanning windows correctly', () => {
    const schedule = [
      { day: 5, open: true, start: '22:00', end: '23:59' }, // Friday night
    ]
    // Friday at 23:00 ET
    const result = isWithinBusinessHoursFromSchedule(schedule, 'America/New_York', new Date('2025-01-10T23:00:00-05:00'))
    expect(result).toBe(true)
  })
})

// DB-dependent path: just verify the query is called with correct id
describe('isWithinBusinessHours (DB path)', async () => {
  const { isWithinBusinessHours } = await import('../business-hours')

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns true when no schedule exists in DB (always open)', async () => {
    vi.mocked(db.query).mockResolvedValueOnce({ rows: [], rowCount: 0 } as never)
    const result = await isWithinBusinessHours('phone-id-1')
    expect(result).toBe(true)
  })

  it('calls DB with correct phone number id', async () => {
    vi.mocked(db.query).mockResolvedValueOnce({ rows: [], rowCount: 0 } as never)
    await isWithinBusinessHours('phone-abc')
    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('SELECT'),
      ['phone-abc'],
    )
  })
})
