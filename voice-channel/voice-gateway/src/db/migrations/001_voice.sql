-- AIMS-OS Voice Channel Schema
-- Migration 001

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── Phone Numbers ──────────────────────────────────────────────────────────
CREATE TABLE phone_numbers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    TEXT NOT NULL,
  number          TEXT NOT NULL UNIQUE,               -- E.164: +14025550171
  type            TEXT NOT NULL CHECK (type IN ('local', 'toll-free', 'mobile')),
  label           TEXT NOT NULL DEFAULT '',
  status          TEXT NOT NULL DEFAULT 'unassigned'
                    CHECK (status IN ('active', 'unassigned')),
  capabilities    TEXT[] NOT NULL DEFAULT '{voice}',
  twilio_sid      TEXT NOT NULL UNIQUE,

  -- Assignment
  assigned_network_id TEXT,

  -- Configuration
  accept_inbound        BOOLEAN NOT NULL DEFAULT TRUE,
  voicemail_enabled     BOOLEAN NOT NULL DEFAULT TRUE,
  voicemail_transcription BOOLEAN NOT NULL DEFAULT TRUE,
  forward_to            TEXT,
  greeting_text         TEXT,
  recording_notice_text TEXT DEFAULT 'This call may be recorded for quality and service improvement.',
  primary_language      TEXT NOT NULL DEFAULT 'es-ES',
  auto_detect_language  BOOLEAN NOT NULL DEFAULT TRUE,

  -- 10DLC
  ten_dlc_status TEXT NOT NULL DEFAULT 'n/a'
                   CHECK (ten_dlc_status IN ('approved', 'pending', 'n/a')),

  -- Audit
  created_by   TEXT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_phone_numbers_workspace ON phone_numbers (workspace_id);
CREATE INDEX idx_phone_numbers_status    ON phone_numbers (workspace_id, status);

-- ── Business Hours ─────────────────────────────────────────────────────────
CREATE TABLE business_hours (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number_id UUID NOT NULL REFERENCES phone_numbers (id) ON DELETE CASCADE,
  timezone        TEXT NOT NULL DEFAULT 'America/New_York',
  -- day_schedule: JSON array of {day: 0-6, open: bool, start: "HH:MM", end: "HH:MM"}
  day_schedule    JSONB NOT NULL DEFAULT '[]',
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_business_hours_number ON business_hours (phone_number_id);

-- ── Human in the Loop Config ───────────────────────────────────────────────
CREATE TABLE hil_configs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number_id UUID NOT NULL REFERENCES phone_numbers (id) ON DELETE CASCADE,
  enabled         BOOLEAN NOT NULL DEFAULT FALSE,

  -- Assignment
  assignment_mode TEXT NOT NULL DEFAULT 'users'
                    CHECK (assignment_mode IN ('users', 'role', 'department')),
  user_ids        TEXT[] DEFAULT '{}',
  role_id         TEXT,
  department_id   TEXT,

  -- Distribution
  distribution_mode TEXT NOT NULL DEFAULT 'round_robin'
                      CHECK (distribution_mode IN ('round_robin', 'first_available', 'least_load')),
  round_robin_index INTEGER NOT NULL DEFAULT 0,

  -- Notification channels
  notify_email      BOOLEAN NOT NULL DEFAULT TRUE,
  notify_in_app     BOOLEAN NOT NULL DEFAULT TRUE,
  notify_phone_call BOOLEAN NOT NULL DEFAULT TRUE,

  -- SLA
  agent_timeout_seconds   INTEGER NOT NULL DEFAULT 30,
  max_rerouting_attempts  INTEGER NOT NULL DEFAULT 3,

  -- Fallback
  fallback         TEXT NOT NULL DEFAULT 'voicemail'
                     CHECK (fallback IN ('voicemail', 'callback', 'queue')),
  fallback_message TEXT,

  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_hil_configs_number ON hil_configs (phone_number_id);

-- ── Voice Sessions ─────────────────────────────────────────────────────────
CREATE TABLE voice_sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number_id UUID NOT NULL REFERENCES phone_numbers (id),
  workspace_id    TEXT NOT NULL,
  twilio_call_sid TEXT NOT NULL UNIQUE,

  direction       TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  contact_phone   TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active', 'ended', 'failed', 'transferring', 'human_active')),

  -- AI metadata
  language        TEXT NOT NULL DEFAULT 'es-ES',
  sentiment       TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  sentiment_score DECIMAL(4,3),

  -- Human in the Loop
  human_in_loop     BOOLEAN NOT NULL DEFAULT FALSE,
  human_agent_id    TEXT,
  hil_triggered_at  TIMESTAMPTZ,

  -- Recording
  recording_url TEXT,
  recording_sid TEXT,

  -- Cost (from Twilio Usage API)
  cost_usd DECIMAL(10,4),

  -- Timestamps
  started_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at    TIMESTAMPTZ,
  duration_s  INTEGER GENERATED ALWAYS AS (
    CASE WHEN ended_at IS NOT NULL
    THEN EXTRACT(EPOCH FROM (ended_at - started_at))::INTEGER
    ELSE NULL END
  ) STORED,

  -- Error tracking
  failure_code    TEXT,
  failure_message TEXT
);

CREATE INDEX idx_voice_sessions_workspace   ON voice_sessions (workspace_id, started_at DESC);
CREATE INDEX idx_voice_sessions_number      ON voice_sessions (phone_number_id, started_at DESC);
CREATE INDEX idx_voice_sessions_status      ON voice_sessions (status);

-- ── Voice Transcripts ──────────────────────────────────────────────────────
CREATE TABLE voice_transcripts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id    UUID NOT NULL REFERENCES voice_sessions (id) ON DELETE CASCADE,
  role          TEXT NOT NULL CHECK (role IN ('user', 'agent', 'human_agent')),
  content       TEXT NOT NULL,
  audio_start_ms BIGINT,
  audio_end_ms   BIGINT,
  language      TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_transcripts_session ON voice_transcripts (session_id, created_at ASC);

-- Full-text search on transcripts
ALTER TABLE voice_transcripts ADD COLUMN search_vector TSVECTOR
  GENERATED ALWAYS AS (to_tsvector('english', content)) STORED;
CREATE INDEX idx_transcripts_fts ON voice_transcripts USING GIN (search_vector);

-- ── Active Session Alerts (for Unified Customer Profile) ──────────────────
CREATE TABLE active_session_alerts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  UUID NOT NULL REFERENCES voice_sessions (id) ON DELETE CASCADE,
  customer_id TEXT NOT NULL,
  workspace_id TEXT NOT NULL,
  type        TEXT NOT NULL DEFAULT 'voice_hil_active',
  assigned_agent_id TEXT,
  channel_number TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'ended')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at    TIMESTAMPTZ
);

CREATE INDEX idx_alerts_customer   ON active_session_alerts (customer_id, status);
CREATE INDEX idx_alerts_workspace  ON active_session_alerts (workspace_id, status);

-- ── Updated_at trigger ─────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_phone_numbers_updated_at
  BEFORE UPDATE ON phone_numbers
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_hil_configs_updated_at
  BEFORE UPDATE ON hil_configs
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_business_hours_updated_at
  BEFORE UPDATE ON business_hours
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
