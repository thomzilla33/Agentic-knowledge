import { db } from './db/client'
import { sendNotifications } from './notifications'

export interface HilConfig {
  id: string
  enabled: boolean
  assignmentMode: 'users' | 'role' | 'department'
  userIds: string[]
  roleId: string | null
  departmentId: string | null
  distributionMode: 'round_robin' | 'first_available' | 'least_load'
  roundRobinIndex: number
  notifyEmail: boolean
  notifyInApp: boolean
  notifyPhoneCall: boolean
  agentTimeoutSeconds: number
  maxReroutingAttempts: number
  fallback: 'voicemail' | 'callback' | 'queue'
  fallbackMessage: string | null
}

export interface HilSession {
  sessionId: string
  customerId: string
  workspaceId: string
  channelNumber: string
  transcriptSoFar: string
}

async function getConfig(phoneNumberId: string): Promise<HilConfig | null> {
  const result = await db.query(
    `SELECT id, enabled, assignment_mode, user_ids, role_id, department_id,
            distribution_mode, round_robin_index, notify_email, notify_in_app,
            notify_phone_call, agent_timeout_seconds, max_rerouting_attempts,
            fallback, fallback_message
     FROM hil_configs WHERE phone_number_id = $1`,
    [phoneNumberId],
  )

  if (!result.rowCount || result.rowCount === 0) return null

  const r = result.rows[0]
  return {
    id: r.id,
    enabled: r.enabled,
    assignmentMode: r.assignment_mode,
    userIds: r.user_ids ?? [],
    roleId: r.role_id,
    departmentId: r.department_id,
    distributionMode: r.distribution_mode,
    roundRobinIndex: r.round_robin_index,
    notifyEmail: r.notify_email,
    notifyInApp: r.notify_in_app,
    notifyPhoneCall: r.notify_phone_call,
    agentTimeoutSeconds: r.agent_timeout_seconds,
    maxReroutingAttempts: r.max_rerouting_attempts,
    fallback: r.fallback,
    fallbackMessage: r.fallback_message,
  }
}

async function resolveAgentList(cfg: HilConfig): Promise<string[]> {
  // In production: resolve from workspace user/role/department service
  // For now returns the user_ids directly (or would query role/dept members)
  if (cfg.assignmentMode === 'users') return cfg.userIds
  // role/department → query workspace users API (stubbed)
  return cfg.userIds
}

/** Pure selection logic — exported for unit testing */
export function selectNextAgent(cfg: Pick<HilConfig,
  'assignmentMode' | 'userIds' | 'roleId' | 'departmentId' | 'distributionMode' | 'roundRobinIndex'
>): string | null {
  if (cfg.assignmentMode === 'role') return cfg.roleId ?? null
  if (cfg.assignmentMode === 'department') return cfg.departmentId ?? null
  const agents = cfg.userIds
  if (agents.length === 0) return null
  if (cfg.distributionMode === 'round_robin') return agents[cfg.roundRobinIndex % agents.length] ?? null
  return agents[0] ?? null
}

async function selectAgent(
  cfg: HilConfig,
  agents: string[],
  attempt: number,
): Promise<string | null> {
  if (agents.length === 0) return null

  if (cfg.distributionMode === 'round_robin') {
    const nextIndex = (cfg.roundRobinIndex + attempt) % agents.length
    return agents[nextIndex] ?? null
  }

  if (cfg.distributionMode === 'least_load') {
    // Query active sessions per agent and pick the one with fewest
    const result = await db.query(
      `SELECT human_agent_id, COUNT(*) as cnt
       FROM voice_sessions
       WHERE status = 'human_active' AND human_agent_id = ANY($1)
       GROUP BY human_agent_id`,
      [agents],
    )
    const loadMap = new Map(result.rows.map((r) => [r.human_agent_id, Number(r.cnt)]))
    return agents.sort((a, b) => (loadMap.get(a) ?? 0) - (loadMap.get(b) ?? 0))[0] ?? null
  }

  // first_available: return first agent (in production, check online status)
  return agents[attempt % agents.length] ?? null
}

/** Trigger Human in the Loop handoff */
export async function triggerHumanInLoop(
  phoneNumberId: string,
  session: HilSession,
): Promise<{ agentId: string | null; fallback: string }> {
  const cfg = await getConfig(phoneNumberId)
  if (!cfg || !cfg.enabled) return { agentId: null, fallback: 'voicemail' }

  const agents = await resolveAgentList(cfg)
  let selectedAgent: string | null = null

  for (let attempt = 0; attempt < cfg.maxReroutingAttempts; attempt++) {
    const candidate = await selectAgent(cfg, agents, attempt)
    if (!candidate) break

    // Send all 3 notification channels simultaneously
    const accepted = await sendNotifications({
      agentId: candidate,
      session,
      cfg,
      timeoutMs: cfg.agentTimeoutSeconds * 1000,
    })

    if (accepted) {
      selectedAgent = candidate

      // Update round-robin index
      if (cfg.distributionMode === 'round_robin') {
        const newIndex = (cfg.roundRobinIndex + attempt + 1) % Math.max(agents.length, 1)
        await db.query(
          'UPDATE hil_configs SET round_robin_index = $1 WHERE id = $2',
          [newIndex, cfg.id],
        )
      }
      break
    }
  }

  // Update session
  await db.query(
    `UPDATE voice_sessions
     SET status = $1, human_agent_id = $2, human_in_loop = TRUE, hil_triggered_at = NOW()
     WHERE id = $3`,
    [
      selectedAgent ? 'human_active' : 'active',
      selectedAgent,
      session.sessionId,
    ],
  )

  // Create Unified Customer Profile alert
  if (selectedAgent) {
    await db.query(
      `INSERT INTO active_session_alerts
         (session_id, customer_id, workspace_id, assigned_agent_id, channel_number)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT DO NOTHING`,
      [
        session.sessionId,
        session.customerId,
        session.workspaceId,
        selectedAgent,
        session.channelNumber,
      ],
    )
  }

  return {
    agentId: selectedAgent,
    fallback: selectedAgent ? 'none' : cfg.fallback,
  }
}

/** Mark HiL session as ended and close the Unified Customer Profile alert */
export async function closeHilAlert(sessionId: string): Promise<void> {
  await db.query(
    `UPDATE active_session_alerts
     SET status = 'ended', ended_at = NOW()
     WHERE session_id = $1`,
    [sessionId],
  )
}
