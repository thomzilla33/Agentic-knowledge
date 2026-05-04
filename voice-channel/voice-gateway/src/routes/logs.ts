import type { FastifyInstance } from 'fastify'
import { db } from '../db/client'

export async function registerLogsRoutes(app: FastifyInstance): Promise<void> {
  /** List sessions (logs) for a workspace */
  app.get('/sessions', async (req, reply) => {
    const workspaceId = req.headers['x-workspace-id'] as string
    if (!workspaceId) return reply.status(400).send({ error: 'Missing workspace ID' })

    const q = req.query as Record<string, string>
    const direction = q['direction']
    const page = Math.max(1, parseInt(q['page'] ?? '1', 10))
    const limit = Math.min(100, parseInt(q['limit'] ?? '50', 10))
    const offset = (page - 1) * limit

    const conditions = ['vs.workspace_id = $1']
    const params: unknown[] = [workspaceId]
    let idx = 2

    if (direction && ['inbound', 'outbound'].includes(direction)) {
      conditions.push(`vs.direction = $${idx++}`)
      params.push(direction)
    }

    const where = conditions.join(' AND ')

    const [sessionsResult, countResult] = await Promise.all([
      db.query(
        `SELECT vs.id, vs.direction, vs.contact_phone, vs.status, vs.language,
                vs.sentiment, vs.started_at, vs.ended_at, vs.duration_s,
                vs.human_in_loop, vs.cost_usd, vs.failure_code,
                pn.number AS channel_number, pn.label AS channel_label
         FROM voice_sessions vs
         JOIN phone_numbers pn ON pn.id = vs.phone_number_id
         WHERE ${where}
         ORDER BY vs.started_at DESC
         LIMIT $${idx++} OFFSET $${idx++}`,
        [...params, limit, offset],
      ),
      db.query(
        `SELECT COUNT(*) FROM voice_sessions vs WHERE ${where}`,
        params,
      ),
    ])

    return {
      data: sessionsResult.rows,
      meta: {
        total: parseInt(countResult.rows[0].count, 10),
        page,
        limit,
      },
    }
  })

  /** Get single session with full transcript */
  app.get('/sessions/:id', async (req, reply) => {
    const { id } = req.params as { id: string }

    const [sessionResult, transcriptsResult] = await Promise.all([
      db.query(
        `SELECT vs.*, pn.number AS channel_number, pn.label AS channel_label
         FROM voice_sessions vs
         JOIN phone_numbers pn ON pn.id = vs.phone_number_id
         WHERE vs.id = $1`,
        [id],
      ),
      db.query(
        `SELECT id, role, content, audio_start_ms, audio_end_ms, created_at
         FROM voice_transcripts WHERE session_id = $1 ORDER BY created_at ASC`,
        [id],
      ),
    ])

    if (!sessionResult.rowCount || sessionResult.rowCount === 0) {
      return reply.status(404).send({ error: 'Session not found' })
    }

    return {
      data: {
        ...sessionResult.rows[0],
        transcript: transcriptsResult.rows,
      },
    }
  })

  /** Export transcript as plain text (for PDF/CSV generation on client) */
  app.get('/sessions/:id/export', async (req, reply) => {
    const { id } = req.params as { id: string }
    const format = ((req.query as Record<string, string>)['format'] ?? 'text') as 'text' | 'json'

    const result = await db.query(
      `SELECT vt.role, vt.content, vt.audio_start_ms, vt.created_at,
              vs.contact_phone, vs.started_at, vs.ended_at, vs.language,
              pn.number AS channel_number
       FROM voice_transcripts vt
       JOIN voice_sessions vs ON vs.id = vt.session_id
       JOIN phone_numbers pn ON pn.id = vs.phone_number_id
       WHERE vt.session_id = $1
       ORDER BY vt.created_at ASC`,
      [id],
    )

    if (format === 'json') {
      return { data: result.rows }
    }

    // Plain text format
    const header = result.rows[0]
    const lines = [
      `AIMS-OS Voice Session Transcript`,
      `Session ID: ${id}`,
      `Date: ${header?.started_at?.toISOString() ?? ''}`,
      `Channel: ${header?.channel_number ?? ''}`,
      `Contact: ${header?.contact_phone ?? ''}`,
      `Language: ${header?.language ?? ''}`,
      '',
      '─'.repeat(60),
      '',
      ...result.rows.map((r) => {
        const ms = r.audio_start_ms ?? 0
        const ts = `${Math.floor(ms / 60000)}:${String(Math.floor((ms % 60000) / 1000)).padStart(2, '0')}`
        const label = r.role === 'user' ? 'CUSTOMER' : r.role === 'agent' ? 'AGENT' : 'HUMAN AGENT'
        return `[${ts}] ${label}: ${r.content}`
      }),
    ]

    reply.type('text/plain')
    return lines.join('\n')
  })

  /** Full-text search across transcripts */
  app.get('/sessions/search', async (req, reply) => {
    const workspaceId = req.headers['x-workspace-id'] as string
    const q = (req.query as Record<string, string>)['q']
    if (!q) return reply.status(400).send({ error: 'Missing search query' })

    const result = await db.query(
      `SELECT DISTINCT vs.id, vs.contact_phone, vs.started_at, vs.direction,
              pn.number AS channel_number,
              ts_headline('english', vt.content, plainto_tsquery('english', $1)) AS excerpt
       FROM voice_transcripts vt
       JOIN voice_sessions vs ON vs.id = vt.session_id
       JOIN phone_numbers pn ON pn.id = vs.phone_number_id
       WHERE vs.workspace_id = $2
         AND vt.search_vector @@ plainto_tsquery('english', $1)
       ORDER BY vs.started_at DESC
       LIMIT 50`,
      [q, workspaceId],
    )

    return { data: result.rows }
  })
}
