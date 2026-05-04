export type NumberStatus = 'active' | 'unassigned'
export type NumberType = 'local' | 'toll-free' | 'mobile'
export type Capability = 'voice' | 'sms' | 'mms'
export type TenDlcStatus = 'approved' | 'pending' | 'n/a'
export type SessionDirection = 'inbound' | 'outbound'
export type SessionStatus = 'active' | 'ended' | 'failed' | 'transferring' | 'human_active'
export type Sentiment = 'positive' | 'neutral' | 'negative'
export type AssignmentMode = 'users' | 'role' | 'department'
export type DistributionMode = 'round_robin' | 'first_available' | 'least_load'
export type HilFallback = 'voicemail' | 'callback' | 'queue'

export interface PhoneNumber {
  id: string
  workspaceId: string
  number: string
  type: NumberType
  label: string
  status: NumberStatus
  capabilities: Capability[]
  twilioSid: string
  assignedNetworkId: string | null
  acceptInbound: boolean
  voicemailEnabled: boolean
  voicemailTranscription: boolean
  forwardTo: string | null
  greetingText: string | null
  recordingNoticeText: string
  primaryLanguage: string
  autoDetectLanguage: boolean
  tenDlcStatus: TenDlcStatus
  createdAt: string
  updatedAt: string
  stats?: NumberStats
}

export interface NumberStats {
  totalCalls7d: number
  avgDurationS: number | null
  cost7d: number
}

export interface VolumePoint {
  day: string
  calls: number
  cost: number
}

export interface HilConfig {
  id: string
  phoneNumberId: string
  enabled: boolean
  assignmentMode: AssignmentMode
  userIds: string[]
  roleId: string | null
  departmentId: string | null
  distributionMode: DistributionMode
  notifyEmail: boolean
  notifyInApp: boolean
  notifyPhoneCall: boolean
  agentTimeoutSeconds: number
  maxReroutingAttempts: number
  fallback: HilFallback
  fallbackMessage: string | null
}

export interface BusinessHourSchedule {
  day: number
  open: boolean
  start: string
  end: string
}

export interface VoiceSession {
  id: string
  direction: SessionDirection
  contactPhone: string
  status: SessionStatus
  language: string
  sentiment: Sentiment | null
  startedAt: string
  endedAt: string | null
  durationS: number | null
  humanInLoop: boolean
  costUsd: number | null
  failureCode: string | null
  channelNumber: string
  channelLabel: string
}

export interface TranscriptEntry {
  id: string
  role: 'user' | 'agent' | 'human_agent'
  content: string
  audioStartMs: number
  createdAt: string
}

export interface AvailableNumber {
  phoneNumber: string
  friendlyName: string
  region: string
  isoCountry: string
  capabilities: { voice: boolean; SMS: boolean; MMS: boolean }
  monthlyRenewCost: string
}

export interface Toast {
  id: string
  type: 'success' | 'error' | 'info'
  message: string
}
