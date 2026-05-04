import Fastify from 'fastify'
import fastifyCors from '@fastify/cors'
import fastifyFormBody from '@fastify/formbody'
import fastifyWebSocket from '@fastify/websocket'
import { config } from './config'
import { registerWebhooks } from './twilio/webhook'
import { registerProvisioningRoutes } from './routes/provisioning'
import { registerLogsRoutes } from './routes/logs'
import { registerHilRoutes } from './routes/hil'
import { VoicePipeline } from './pipeline'
import { db } from './db/client'

const app = Fastify({ logger: true })

// ── Plugins ────────────────────────────────────────────────────────────────
await app.register(fastifyCors, {
  origin: true,
  credentials: true,
})

// Required for Twilio webhooks which POST application/x-www-form-urlencoded
await app.register(fastifyFormBody)

await app.register(fastifyWebSocket)

// ── Health check ───────────────────────────────────────────────────────────
app.get('/health', async () => ({ status: 'ok', ts: new Date().toISOString() }))

// ── Twilio Webhooks ────────────────────────────────────────────────────────
registerWebhooks(app)

// ── REST API Routes ────────────────────────────────────────────────────────
await app.register(registerProvisioningRoutes, { prefix: '/api/v1/voice' })
await app.register(registerLogsRoutes,         { prefix: '/api/v1/voice' })
await app.register(registerHilRoutes,          { prefix: '/api/v1/voice' })

// ── WebSocket: Real-time audio stream from Twilio Media Streams ────────────
const activePipelines = new Map<string, VoicePipeline>()

app.register(async (fastify) => {
  fastify.get('/stream/:callSid', { websocket: true }, async (socket, req) => {
    const { callSid } = req.params as { callSid: string }

    // Look up session context
    const result = await db.query(
      `SELECT vs.id, vs.phone_number_id, vs.workspace_id, vs.language,
              vs.contact_phone, pn.number as channel_number
       FROM voice_sessions vs
       JOIN phone_numbers pn ON pn.id = vs.phone_number_id
       WHERE vs.twilio_call_sid = $1`,
      [callSid],
    )

    if (!result.rowCount || result.rowCount === 0) {
      socket.close(1008, 'Session not found')
      return
    }

    const row = result.rows[0]
    const pipeline = new VoicePipeline(socket, {
      sessionId: row.id,
      phoneNumberId: row.phone_number_id,
      workspaceId: row.workspace_id,
      language: row.language,
      channelNumber: row.channel_number,
      contactPhone: row.contact_phone,
      customerId: row.contact_phone, // use phone as customer ID until CRM lookup
      humanActive: false,
    })

    await pipeline.start()
    activePipelines.set(callSid, pipeline)

    socket.on('message', (raw: Buffer) => {
      try {
        const msg = JSON.parse(raw.toString()) as Record<string, unknown>

        if (msg['event'] === 'media') {
          const payload = (msg['media'] as Record<string, string>)['payload']
          if (payload) pipeline.handleAudio(Buffer.from(payload, 'base64'))
        }

        if (msg['event'] === 'stop') {
          pipeline.end()
          activePipelines.delete(callSid)
        }

        if (msg['event'] === 'interrupt') {
          pipeline.handleInterrupt()
        }
      } catch {
        // Ignore malformed messages
      }
    })

    socket.on('close', () => {
      pipeline.end()
      activePipelines.delete(callSid)
    })
  })
})

// ── Start ─────────────────────────────────────────────────────────────────
try {
  await app.listen({ port: config.PORT, host: '0.0.0.0' })
  console.log(`🎙 Voice Gateway running on port ${config.PORT}`)
} catch (err) {
  app.log.error(err)
  process.exit(1)
}
