import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { db } from '../db/client'

const HilConfigSchema = z.object({
  enabled: z.boolean(),
  assignmentMode: z.enum(['users', 'role', 'department']),
  userIds: z.array(z.string()).optional(),
  roleId: z.string().optional(),
  departmentId: z.string().optional(),
  distributionMode: z.enum(['round_robin', 'first_available', 'least_load']),
  notifyEmail: z.boolean().default(true),
  notifyInApp: z.boolean().default(true),
  notifyPhoneCall: z.boolean().default(true),
  agentTimeoutSeconds: z.number().min(10).max(300).default(30),
  maxReroutingAttempts: z.number().min(1).max(10).default(3),
  fallback: z.enum(['voicemail', 'callback', 'queue']),
  fallbackMessage: z.string().optional(),
})

export async function registerHilRoutes(app: FastifyInstance): Promise<void> {
  /** Get HiL config for a number */
  app.get('/numbers/:id/hil', async (req, reply) => {
    const { id } = req.params as { id: string }

    const result = await db.query(
      `SELECT * FROM hil_configs WHERE phone_number_id = $1`,
      [id],
    )

    if (!result.rowCount || result.rowCount === 0) {
      return { data: null }
    }

    return { data: result.rows[0] }
  })

  /** Upsert HiL config for a number */
  app.put('/numbers/:id/hil', async (req, reply) => {
    const { id } = req.params as { id: string }
    const parsed = HilConfigSchema.safeParse(req.body)
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten() })
    }

    const c = parsed.data

    await db.query(
      `INSERT INTO hil_configs
         (phone_number_id, enabled, assignment_mode, user_ids, role_id,
          department_id, distribution_mode, notify_email, notify_in_app,
          notify_phone_call, agent_timeout_seconds, max_rerouting_attempts,
          fallback, fallback_message)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
       ON CONFLICT (phone_number_id) DO UPDATE SET
         enabled = EXCLUDED.enabled,
         assignment_mode = EXCLUDED.assignment_mode,
         user_ids = EXCLUDED.user_ids,
         role_id = EXCLUDED.role_id,
         department_id = EXCLUDED.department_id,
         distribution_mode = EXCLUDED.distribution_mode,
         notify_email = EXCLUDED.notify_email,
         notify_in_app = EXCLUDED.notify_in_app,
         notify_phone_call = EXCLUDED.notify_phone_call,
         agent_timeout_seconds = EXCLUDED.agent_timeout_seconds,
         max_rerouting_attempts = EXCLUDED.max_rerouting_attempts,
         fallback = EXCLUDED.fallback,
         fallback_message = EXCLUDED.fallback_message,
         updated_at = NOW()`,
      [
        id, c.enabled, c.assignmentMode, c.userIds ?? [],
        c.roleId ?? null, c.departmentId ?? null,
        c.distributionMode, c.notifyEmail, c.notifyInApp,
        c.notifyPhoneCall, c.agentTimeoutSeconds, c.maxReroutingAttempts,
        c.fallback, c.fallbackMessage ?? null,
      ],
    )

    return { success: true }
  })

  /** Get active HiL alerts for a customer (Unified Customer Profile) */
  app.get('/alerts/customer/:customerId', async (req) => {
    const { customerId } = req.params as { customerId: string }
    const workspaceId = req.headers['x-workspace-id'] as string

    const result = await db.query(
      `SELECT asa.*, vs.contact_phone, pn.number AS channel_number
       FROM active_session_alerts asa
       JOIN voice_sessions vs ON vs.id = asa.session_id
       JOIN phone_numbers pn ON pn.id = vs.phone_number_id
       WHERE asa.customer_id = $1
         AND asa.workspace_id = $2
         AND asa.status = 'active'
       ORDER BY asa.created_at DESC`,
      [customerId, workspaceId],
    )

    return { data: result.rows }
  })
}
