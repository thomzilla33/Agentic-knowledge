import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import {
  searchAvailableNumbers,
  purchaseNumber,
  releaseNumber,
  updateNumberConfig,
  type NumberType,
} from '../twilio/provisioning'
import { db } from '../db/client'
import { upsertBusinessHours } from '../business-hours'

const SearchSchema = z.object({
  type: z.enum(['local', 'toll-free', 'mobile']).default('local'),
  countryCode: z.string().default('US'),
  areaCode: z.string().optional(),
  limit: z.coerce.number().min(1).max(50).default(20),
})

const PurchaseSchema = z.object({
  phoneNumber: z.string().min(1),
  type: z.enum(['local', 'toll-free', 'mobile']),
  label: z.string().optional(),
})

const UpdateSchema = z.object({
  label: z.string().optional(),
  acceptInbound: z.boolean().optional(),
  voicemailEnabled: z.boolean().optional(),
  voicemailTranscription: z.boolean().optional(),
  forwardTo: z.string().nullable().optional(),
  greetingText: z.string().nullable().optional(),
  recordingNoticeText: z.string().optional(),
  primaryLanguage: z.string().optional(),
  autoDetectLanguage: z.boolean().optional(),
})

function isIanaTimezone(tz: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz })
    return true
  } catch {
    return false
  }
}

const BusinessHoursSchema = z.object({
  timezone: z.string().refine(isIanaTimezone, { message: 'Invalid IANA timezone' }),
  daySchedule: z.array(z.object({
    day: z.number().min(0).max(6),
    open: z.boolean(),
    start: z.string().regex(/^\d{2}:\d{2}$/),
    end: z.string().regex(/^\d{2}:\d{2}$/),
  })),
})

export async function registerProvisioningRoutes(app: FastifyInstance): Promise<void> {
  /** List all numbers for a workspace */
  app.get('/numbers', async (req, reply) => {
    const workspaceId = req.headers['x-workspace-id'] as string
    if (!workspaceId) return reply.status(400).send({ error: 'Missing workspace ID' })

    const status = (req.query as Record<string, string>)['status']
    const query = status
      ? 'SELECT * FROM phone_numbers WHERE workspace_id = $1 AND status = $2 ORDER BY created_at DESC'
      : 'SELECT * FROM phone_numbers WHERE workspace_id = $1 ORDER BY created_at DESC'
    const params = status ? [workspaceId, status] : [workspaceId]

    const result = await db.query(query, params)
    return { data: result.rows }
  })

  /** Get single number with stats */
  app.get('/numbers/:id', async (req, reply) => {
    const { id } = req.params as { id: string }

    const [numResult, statsResult] = await Promise.all([
      db.query('SELECT * FROM phone_numbers WHERE id = $1', [id]),
      db.query(
        `SELECT
           COUNT(*) FILTER (WHERE started_at > NOW() - INTERVAL '7 days') AS total_calls_7d,
           ROUND(AVG(duration_s) FILTER (WHERE started_at > NOW() - INTERVAL '7 days')) AS avg_duration_s,
           COALESCE(SUM(cost_usd) FILTER (WHERE started_at > NOW() - INTERVAL '7 days'), 0) AS cost_7d
         FROM voice_sessions WHERE phone_number_id = $1`,
        [id],
      ),
    ])

    if (!numResult.rowCount || numResult.rowCount === 0) {
      return reply.status(404).send({ error: 'Number not found' })
    }

    return { data: { ...numResult.rows[0], stats: statsResult.rows[0] } }
  })

  /** Search available numbers to purchase */
  app.get('/numbers/search/available', async (req, reply) => {
    const parsed = SearchSchema.safeParse(req.query)
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten() })
    }

    const numbers = await searchAvailableNumbers(parsed.data as {
      countryCode: string
      areaCode?: string
      type: NumberType
      limit: number
    })
    return { data: numbers }
  })

  /** Purchase a number */
  app.post('/numbers', async (req, reply) => {
    const workspaceId = req.headers['x-workspace-id'] as string
    const userId = req.headers['x-user-id'] as string
    if (!workspaceId || !userId) {
      return reply.status(400).send({ error: 'Missing workspace or user ID' })
    }

    const parsed = PurchaseSchema.safeParse(req.body)
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten() })
    }

    const number = await purchaseNumber({
      ...parsed.data,
      workspaceId,
      createdBy: userId,
    })

    return reply.status(201).send({ data: number })
  })

  /** Update number configuration */
  app.patch('/numbers/:id', async (req, reply) => {
    const { id } = req.params as { id: string }
    const parsed = UpdateSchema.safeParse(req.body)
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten() })
    }

    await updateNumberConfig(id, parsed.data)
    return { success: true }
  })

  /** Release a number */
  app.delete('/numbers/:id', async (req, reply) => {
    const { id } = req.params as { id: string }
    await releaseNumber(id)
    return reply.status(204).send()
  })

  /** Get business hours for a number */
  app.get('/numbers/:id/business-hours', async (req, reply) => {
    const { id } = req.params as { id: string }
    const result = await db.query(
      'SELECT timezone, day_schedule FROM business_hours WHERE phone_number_id = $1',
      [id],
    )

    if (!result.rowCount || result.rowCount === 0) {
      return { data: null }
    }

    return {
      data: {
        timezone: result.rows[0].timezone as string,
        daySchedule: result.rows[0].day_schedule as unknown[],
      },
    }
  })

  /** Upsert business hours */
  app.put('/numbers/:id/business-hours', async (req, reply) => {
    const { id } = req.params as { id: string }
    const parsed = BusinessHoursSchema.safeParse(req.body)
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten() })
    }

    await upsertBusinessHours(id, parsed.data.timezone, parsed.data.daySchedule)
    return { success: true }
  })

  /** Get volume chart data for a number (last 7 days by default) */
  app.get('/numbers/:id/volume', async (req) => {
    const { id } = req.params as { id: string }
    const days = parseInt((req.query as Record<string, string>)['days'] ?? '7', 10)

    const result = await db.query(
      `SELECT
         DATE_TRUNC('day', started_at)::DATE AS day,
         COUNT(*) AS calls,
         COALESCE(SUM(cost_usd), 0) AS cost
       FROM voice_sessions
       WHERE phone_number_id = $1
         AND started_at > NOW() - MAKE_INTERVAL(days => $2)
       GROUP BY 1
       ORDER BY 1 ASC`,
      [id, days],
    )

    return { data: result.rows }
  })
}
