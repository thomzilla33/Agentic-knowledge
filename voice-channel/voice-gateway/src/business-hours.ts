import { db } from './db/client'

interface DaySchedule {
  day: number   // 0 = Sunday … 6 = Saturday
  open: boolean
  start: string // "HH:MM"
  end: string   // "HH:MM"
}

function parseTime(timeStr: string): { h: number; m: number } {
  const [h, m] = timeStr.split(':').map(Number)
  return { h: h ?? 0, m: m ?? 0 }
}

function nowInTimezone(tz: string): Date {
  return new Date(new Date().toLocaleString('en-US', { timeZone: tz }))
}

/** Pure, testable logic — separated from the DB read */
export function isWithinBusinessHoursFromSchedule(
  schedule: DaySchedule[],
  timezone: string,
  now: Date = new Date(),
): boolean {
  if (schedule.length === 0) return false

  const local = new Date(now.toLocaleString('en-US', { timeZone: timezone }))
  const currentDay = local.getDay()
  const currentMinutes = local.getHours() * 60 + local.getMinutes()

  const todaySchedule = schedule.find((s) => s.day === currentDay)
  if (!todaySchedule || !todaySchedule.open) return false

  const { h: startH, m: startM } = parseTime(todaySchedule.start)
  const { h: endH, m: endM } = parseTime(todaySchedule.end)

  return currentMinutes >= startH * 60 + startM && currentMinutes < endH * 60 + endM
}

export async function isWithinBusinessHours(
  phoneNumberId: string,
): Promise<boolean> {
  const result = await db.query(
    'SELECT timezone, day_schedule FROM business_hours WHERE phone_number_id = $1',
    [phoneNumberId],
  )

  // No business hours configured → always open
  if (!result.rowCount || result.rowCount === 0) return true

  const { timezone, day_schedule } = result.rows[0]
  const schedule: DaySchedule[] = day_schedule ?? []

  if (schedule.length === 0) return true

  return isWithinBusinessHoursFromSchedule(schedule, timezone)
}

export async function upsertBusinessHours(
  phoneNumberId: string,
  timezone: string,
  daySchedule: DaySchedule[],
): Promise<void> {
  await db.query(
    `INSERT INTO business_hours (phone_number_id, timezone, day_schedule)
     VALUES ($1, $2, $3)
     ON CONFLICT (phone_number_id)
     DO UPDATE SET timezone = $2, day_schedule = $3, updated_at = NOW()`,
    [phoneNumberId, timezone, JSON.stringify(daySchedule)],
  )
}
