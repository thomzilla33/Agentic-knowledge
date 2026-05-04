import Twilio from 'twilio'
import { config } from './config'
import type { HilConfig } from './human-loop'
import type { HilSession } from './human-loop'

interface AgentProfile {
  id: string
  email: string
  phone: string
  name: string
}

// In production: fetch from workspace users service
async function getAgentProfile(agentId: string): Promise<AgentProfile> {
  return {
    id: agentId,
    email: `${agentId}@team.aimsplatform.com`,
    phone: '+15005550006', // Twilio magic test number
    name: 'Agent',
  }
}

export interface NotificationParams {
  agentId: string
  session: HilSession
  cfg: HilConfig
  timeoutMs: number
}

/** Send email + in-app + phone call simultaneously, return true if agent accepts */
export async function sendNotifications(
  params: NotificationParams,
): Promise<boolean> {
  const { agentId, session, cfg, timeoutMs } = params
  const agent = await getAgentProfile(agentId)

  const notifications: Promise<unknown>[] = []

  if (cfg.notifyEmail) {
    notifications.push(sendEmailNotification(agent, session))
  }

  if (cfg.notifyInApp) {
    notifications.push(sendInAppNotification(agent, session))
  }

  if (cfg.notifyPhoneCall) {
    notifications.push(callAgent(agent, session))
  }

  // Fire all simultaneously — don't wait for acceptance in demo mode
  await Promise.allSettled(notifications)

  // In production: implement a real acceptance signal via WebSocket or webhook
  // For now: simulate acceptance after a brief delay
  await new Promise((r) => setTimeout(r, Math.min(timeoutMs * 0.3, 5000)))
  return true
}

async function sendEmailNotification(
  agent: AgentProfile,
  session: HilSession,
): Promise<void> {
  // In production: send via SendGrid / Postmark
  console.log(`[HiL Email] → ${agent.email}`, {
    subject: `⚡ Human in the Loop — call from ${session.channelNumber}`,
    customerSummary: `Customer ID: ${session.customerId}`,
    transcriptPreview: session.transcriptSoFar.slice(0, 300),
    sessionLink: `${config.TWILIO_WEBHOOK_BASE_URL}/sessions/${session.sessionId}`,
  })
}

async function sendInAppNotification(
  agent: AgentProfile,
  session: HilSession,
): Promise<void> {
  // In production: push via WebSocket to agent's dashboard session
  if (config.HUMAN_DASHBOARD_WEBHOOK_URL) {
    const payload = {
      type: 'hil_alert',
      agentId: agent.id,
      sessionId: session.sessionId,
      customerId: session.customerId,
      channelNumber: session.channelNumber,
      transcriptPreview: session.transcriptSoFar.slice(0, 300),
    }

    await fetch(config.HUMAN_DASHBOARD_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch((err) => console.error('[HiL In-App] webhook error', err))
  }
}

async function callAgent(
  agent: AgentProfile,
  session: HilSession,
): Promise<void> {
  const twilio = Twilio(config.TWILIO_ACCOUNT_SID, config.TWILIO_AUTH_TOKEN)

  await twilio.calls.create({
    to: agent.phone,
    from: session.channelNumber,
    twiml: `<Response>
      <Say voice="Polly.Joanna">
        AIMS-OS alert. You have an active Human in the Loop transfer from a customer.
        The session ID is ${session.sessionId}.
        Please open your dashboard to join the call.
      </Say>
    </Response>`,
  }).catch((err) => console.error('[HiL Call] error:', err))
}
