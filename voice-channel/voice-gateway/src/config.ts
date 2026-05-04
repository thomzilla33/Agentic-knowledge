import { z } from 'zod'
import 'dotenv/config'

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3001),

  // Twilio
  TWILIO_ACCOUNT_SID: z.string().min(1),
  TWILIO_AUTH_TOKEN: z.string().min(1),
  TWILIO_WEBHOOK_BASE_URL: z.string().url(),

  // Deepgram STT
  DEEPGRAM_API_KEY: z.string().min(1),

  // OpenAI TTS
  OPENAI_API_KEY: z.string().min(1),

  // AWS S3 (recordings)
  AWS_S3_BUCKET: z.string().min(1),
  AWS_ACCESS_KEY_ID: z.string().min(1),
  AWS_SECRET_ACCESS_KEY: z.string().min(1),
  AWS_REGION: z.string().default('us-east-1'),

  // Database
  DATABASE_URL: z.string().url(),

  // AIMS-OS Agent Engine
  AIMS_AGENT_ENGINE_URL: z.string().url(),
  AIMS_AGENT_ENGINE_API_KEY: z.string().min(1),

  // Human in the Loop dashboard webhook
  HUMAN_DASHBOARD_WEBHOOK_URL: z.string().url().optional(),
})

const parsed = EnvSchema.safeParse(process.env)

if (!parsed.success) {
  console.error('❌ Invalid environment variables:')
  console.error(parsed.error.flatten().fieldErrors)
  process.exit(1)
}

export const config = parsed.data
