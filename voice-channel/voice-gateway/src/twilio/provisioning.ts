import Twilio from 'twilio'
import { config } from '../config'
import { db } from '../db/client'

const twilio = Twilio(config.TWILIO_ACCOUNT_SID, config.TWILIO_AUTH_TOKEN)

export type NumberType = 'local' | 'toll-free' | 'mobile'
export type Capability = 'voice' | 'sms' | 'mms'

export interface AvailableNumber {
  phoneNumber: string
  friendlyName: string
  region: string
  isoCountry: string
  capabilities: { voice: boolean; SMS: boolean; MMS: boolean }
  monthlyRenewCost: string
}

export interface ProvisionedNumber {
  id: string
  number: string
  twilioSid: string
  type: NumberType
  label: string
  status: 'unassigned'
}

/** Search available numbers from Twilio */
export async function searchAvailableNumbers(params: {
  countryCode?: string
  areaCode?: string
  type: NumberType
  limit?: number
}): Promise<AvailableNumber[]> {
  const { countryCode = 'US', areaCode, type, limit = 20 } = params

  const searchParams = { limit, areaCode, voiceEnabled: true } as Record<string, unknown>

  try {
    let results: Twilio.Api.V2010.AccountInstance['availablePhoneNumbers'] | unknown[]

    if (type === 'toll-free') {
      results = await twilio
        .availablePhoneNumbers(countryCode)
        .tollFree.list(searchParams)
    } else {
      results = await twilio
        .availablePhoneNumbers(countryCode)
        .local.list(searchParams)
    }

    return (results as Array<Record<string, unknown>>).map((n) => ({
      phoneNumber: n.phoneNumber as string,
      friendlyName: n.friendlyName as string,
      region: (n.region as string) ?? '',
      isoCountry: (n.isoCountry as string) ?? countryCode,
      capabilities: n.capabilities as AvailableNumber['capabilities'],
      monthlyRenewCost: '1.00',
    }))
  } catch (err) {
    throw new Error(`Twilio number search failed: ${(err as Error).message}`)
  }
}

/** Purchase a number from Twilio and persist in DB */
export async function purchaseNumber(params: {
  phoneNumber: string
  type: NumberType
  workspaceId: string
  createdBy: string
  label?: string
}): Promise<ProvisionedNumber> {
  const { phoneNumber, type, workspaceId, createdBy, label = '' } = params

  // Check not already owned
  const existing = await db.query(
    'SELECT id FROM phone_numbers WHERE number = $1',
    [phoneNumber],
  )
  if (existing.rowCount && existing.rowCount > 0) {
    throw new Error('NUMBER_ALREADY_OWNED')
  }

  // Purchase via Twilio
  let incomingNumber: Record<string, unknown>
  try {
    incomingNumber = (await twilio.incomingPhoneNumbers.create({
      phoneNumber,
      voiceUrl: `${config.TWILIO_WEBHOOK_BASE_URL}/webhook/voice`,
      voiceMethod: 'POST',
      statusCallbackUrl: `${config.TWILIO_WEBHOOK_BASE_URL}/webhook/status`,
    })) as unknown as Record<string, unknown>
  } catch (err: unknown) {
    const msg = (err as Error).message ?? ''
    if (msg.includes('unavailable') || msg.includes('not found')) {
      throw new Error('NUMBER_UNAVAILABLE')
    }
    throw err
  }

  // Persist in DB — if this fails, roll back the Twilio purchase (saga pattern)
  let result: Awaited<ReturnType<typeof db.query>>
  try {
    result = await db.query(
      `INSERT INTO phone_numbers
         (workspace_id, number, type, label, status, twilio_sid, created_by)
       VALUES ($1, $2, $3, $4, 'unassigned', $5, $6)
       RETURNING id, number, twilio_sid, type, label, status`,
      [workspaceId, phoneNumber, type, label, incomingNumber.sid, createdBy],
    )
  } catch (dbErr) {
    // Compensating transaction: release the number from Twilio to avoid ghost numbers
    try {
      await twilio.incomingPhoneNumbers(incomingNumber.sid as string).remove()
    } catch {
      // Best-effort rollback — log but don't mask the original DB error
    }
    throw dbErr
  }

  const row = result.rows[0]
  return {
    id: row.id,
    number: row.number,
    twilioSid: row.twilio_sid,
    type: row.type,
    label: row.label,
    status: 'unassigned',
  }
}

/** Release a number from Twilio and remove from DB */
export async function releaseNumber(numberId: string): Promise<void> {
  const result = await db.query(
    'SELECT twilio_sid FROM phone_numbers WHERE id = $1',
    [numberId],
  )

  if (!result.rowCount || result.rowCount === 0) {
    throw new Error('NUMBER_NOT_FOUND')
  }

  const { twilio_sid } = result.rows[0]

  await twilio.incomingPhoneNumbers(twilio_sid).remove()
  await db.query('DELETE FROM phone_numbers WHERE id = $1', [numberId])
}

/** Update number configuration */
export async function updateNumberConfig(
  numberId: string,
  updates: Partial<{
    label: string
    acceptInbound: boolean
    voicemailEnabled: boolean
    voicemailTranscription: boolean
    forwardTo: string | null
    greetingText: string | null
    recordingNoticeText: string
    primaryLanguage: string
    autoDetectLanguage: boolean
  }>,
): Promise<void> {
  const fields: string[] = []
  const values: unknown[] = []
  let i = 1

  const fieldMap: Record<string, string> = {
    label: 'label',
    acceptInbound: 'accept_inbound',
    voicemailEnabled: 'voicemail_enabled',
    voicemailTranscription: 'voicemail_transcription',
    forwardTo: 'forward_to',
    greetingText: 'greeting_text',
    recordingNoticeText: 'recording_notice_text',
    primaryLanguage: 'primary_language',
    autoDetectLanguage: 'auto_detect_language',
  }

  for (const [key, col] of Object.entries(fieldMap)) {
    if (key in updates) {
      fields.push(`${col} = $${i++}`)
      values.push(updates[key as keyof typeof updates])
    }
  }

  if (fields.length === 0) return

  values.push(numberId)
  await db.query(
    `UPDATE phone_numbers SET ${fields.join(', ')} WHERE id = $${i}`,
    values,
  )
}
