import type { FastifyInstance } from 'fastify'
import Twilio from 'twilio'
import { db } from '../db/client'
import { isWithinBusinessHours } from '../business-hours'
import { config } from '../config'

const { validateRequest } = Twilio

/** Register Twilio webhook routes */
export function registerWebhooks(app: FastifyInstance): void {
  // Validate all webhook requests come from Twilio
  app.addHook('preHandler', async (req, reply) => {
    if (!req.url.startsWith('/webhook/')) return

    const signature = (req.headers['x-twilio-signature'] as string) ?? ''
    const url = `${config.TWILIO_WEBHOOK_BASE_URL}${req.url}`
    const valid = validateRequest(
      config.TWILIO_AUTH_TOKEN,
      signature,
      url,
      req.body as Record<string, string>,
    )

    if (!valid) {
      reply.status(403).send({ error: 'Invalid Twilio signature' })
    }
  })

  /** Inbound call webhook */
  app.post('/webhook/voice', async (req, reply) => {
    const body = req.body as Record<string, string>
    const to = body['To'] ?? ''
    const from = body['From'] ?? ''
    const callSid = body['CallSid'] ?? ''

    // Look up the phone number
    const numResult = await db.query(
      `SELECT id, status, accept_inbound, greeting_text, recording_notice_text,
              primary_language, voicemail_enabled, workspace_id
       FROM phone_numbers WHERE number = $1`,
      [to],
    )

    const twiml = new Twilio.twiml.VoiceResponse()

    if (!numResult.rowCount || numResult.rowCount === 0) {
      // Number not found — reject silently
      twiml.reject()
      return reply.type('text/xml').send(twiml.toString())
    }

    const num = numResult.rows[0]

    if (num.status === 'unassigned' || !num.accept_inbound) {
      // Number inactive — no answer
      twiml.reject({ reason: 'busy' })
      return reply.type('text/xml').send(twiml.toString())
    }

    // Check business hours
    const withinHours = await isWithinBusinessHours(num.id)
    if (!withinHours) {
      // Outside hours — voicemail
      if (num.voicemail_enabled) {
        twiml.say({ voice: 'Polly.Lupe', language: num.primary_language },
          'We are currently outside business hours. Please leave a message after the tone.',
        )
        twiml.record({
          action: `${config.TWILIO_WEBHOOK_BASE_URL}/webhook/voicemail`,
          maxLength: 120,
          playBeep: true,
          transcribe: true,
          transcribeCallback: `${config.TWILIO_WEBHOOK_BASE_URL}/webhook/transcribe`,
        })
      } else {
        twiml.say({ voice: 'Polly.Lupe', language: num.primary_language },
          'We are currently outside business hours. Please call back during our working hours.',
        )
        twiml.hangup()
      }
      return reply.type('text/xml').send(twiml.toString())
    }

    // Create voice session record
    await db.query(
      `INSERT INTO voice_sessions
         (phone_number_id, workspace_id, twilio_call_sid, direction, contact_phone, language)
       VALUES ($1, $2, $3, 'inbound', $4, $5)`,
      [num.id, num.workspace_id, callSid, from, num.primary_language],
    )

    // Play recording notice
    if (num.recording_notice_text) {
      twiml.say({ voice: 'Polly.Lupe', language: num.primary_language },
        num.recording_notice_text,
      )
    }

    // Play greeting
    if (num.greeting_text) {
      twiml.say({ voice: 'Polly.Lupe', language: num.primary_language },
        num.greeting_text,
      )
    }

    // Connect to voice gateway WebSocket
    const connect = twiml.connect()
    connect.stream({
      url: `wss://${new URL(config.TWILIO_WEBHOOK_BASE_URL).host}/stream/${callSid}`,
    })

    return reply.type('text/xml').send(twiml.toString())
  })

  /** Call status callback */
  app.post('/webhook/status', async (req) => {
    const body = req.body as Record<string, string>
    const callSid = body['CallSid'] ?? ''
    const status = body['CallStatus'] ?? ''
    const duration = parseInt(body['CallDuration'] ?? '0', 10)

    const statusMap: Record<string, string> = {
      completed: 'ended',
      failed: 'failed',
      'no-answer': 'failed',
      busy: 'failed',
    }

    const sessionStatus = statusMap[status]
    if (!sessionStatus) return

    await db.query(
      `UPDATE voice_sessions
       SET status = $1,
           ended_at = NOW(),
           failure_code = $2
       WHERE twilio_call_sid = $3`,
      [
        sessionStatus,
        status === 'failed' ? body['ErrorCode'] ?? null : null,
        callSid,
      ],
    )
  })

  /** Voicemail recording callback */
  app.post('/webhook/voicemail', async (req) => {
    const body = req.body as Record<string, string>
    const recordingUrl = body['RecordingUrl']
    const callSid = body['CallSid']

    await db.query(
      `UPDATE voice_sessions SET recording_url = $1, status = 'ended', ended_at = NOW()
       WHERE twilio_call_sid = $2`,
      [recordingUrl, callSid],
    )
  })
}
