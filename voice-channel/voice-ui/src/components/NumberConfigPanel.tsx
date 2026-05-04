import { useState, useEffect } from 'react'
import { numbersApi, hilApi } from '../api/voice'
import type {
  PhoneNumber, HilConfig, BusinessHourSchedule,
  AssignmentMode, DistributionMode, HilFallback,
} from '../types/voice'

interface Props {
  number: PhoneNumber
  workspaceId: string
  isAdmin: boolean
  onClose: () => void
  onSaved: () => void
  onRelease: () => void
}

type PanelTab = 'config' | 'hours' | 'hil'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const DEFAULT_SCHEDULE: BusinessHourSchedule[] = DAYS.map((_, i) => ({
  day: i,
  open: i > 0 && i < 6,
  start: '09:00',
  end: '17:00',
}))

export function NumberConfigPanel({ number, workspaceId, isAdmin, onClose, onSaved, onRelease }: Props) {
  const [tab, setTab] = useState<PanelTab>('config')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Config tab state
  const [label, setLabel] = useState(number.label ?? '')
  const [acceptInbound, setAcceptInbound] = useState(number.acceptInbound)
  const [voicemailEnabled, setVoicemailEnabled] = useState(number.voicemailEnabled)
  const [voicemailTranscription, setVoicemailTranscription] = useState(number.voicemailTranscription)
  const [forwardTo, setForwardTo] = useState(number.forwardTo ?? '')
  const [greetingText, setGreetingText] = useState(number.greetingText ?? '')
  const [recordingNoticeText, setRecordingNoticeText] = useState(number.recordingNoticeText)
  const [primaryLanguage, setPrimaryLanguage] = useState(number.primaryLanguage)
  const [autoDetectLanguage, setAutoDetectLanguage] = useState(number.autoDetectLanguage)

  // Business hours state
  const [timezone, setTimezone] = useState('America/New_York')
  const [schedule, setSchedule] = useState<BusinessHourSchedule[]>(DEFAULT_SCHEDULE)

  // HiL state
  const [hil, setHil] = useState<Partial<HilConfig>>({
    enabled: false,
    assignmentMode: 'users',
    userIds: [],
    roleId: null,
    departmentId: null,
    distributionMode: 'round_robin',
    notifyEmail: true,
    notifyInApp: true,
    notifyPhoneCall: false,
    agentTimeoutSeconds: 30,
    maxReroutingAttempts: 3,
    fallback: 'voicemail',
    fallbackMessage: null,
  })

  useEffect(() => {
    hilApi.get(workspaceId, number.id).then((cfg) => {
      if (cfg) setHil(cfg)
    }).catch(() => {/* use defaults */})
  }, [workspaceId, number.id])

  useEffect(() => {
    numbersApi.getBusinessHours(workspaceId, number.id).then((bh) => {
      if (bh) {
        setTimezone(bh.timezone)
        setSchedule(bh.daySchedule)
      }
    }).catch(() => {/* keep defaults if not configured */})
  }, [workspaceId, number.id])

  // Prevent body scroll while sheet is open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const saveConfig = async () => {
    setSaving(true)
    setSaveError(null)
    try {
      await numbersApi.update(workspaceId, number.id, {
        label: label || undefined,
        acceptInbound,
        voicemailEnabled,
        voicemailTranscription,
        forwardTo: forwardTo || null,
        greetingText: greetingText || null,
        recordingNoticeText,
        primaryLanguage,
        autoDetectLanguage,
      })
      onSaved()
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const saveBusinessHours = async () => {
    setSaving(true)
    setSaveError(null)
    try {
      await numbersApi.updateBusinessHours(workspaceId, number.id, { timezone, daySchedule: schedule })
      onSaved()
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const saveHil = async () => {
    setSaving(true)
    setSaveError(null)
    try {
      await hilApi.save(workspaceId, number.id, hil)
      onSaved()
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const updateScheduleDay = (day: number, patch: Partial<BusinessHourSchedule>) => {
    setSchedule((prev) => prev.map((d) => d.day === day ? { ...d, ...patch } : d))
  }

  const handleSave = () => {
    if (tab === 'config') saveConfig()
    else if (tab === 'hours') saveBusinessHours()
    else saveHil()
  }

  const saveLabel = tab === 'config'
    ? 'Save Configuration'
    : tab === 'hours'
      ? 'Save Business Hours'
      : 'Save HiL Config'

  return (
    <div className="sheet-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="sheet">
        {/* ── Sheet header ── */}
        <div className="sheet-header">
          <div className="sheet-header-left">
            <span className="sheet-header-icon">⚙</span>
            <span className="sheet-header-title">PHONE NUMBER CONFIGURATION</span>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {/* ── Number identity ── */}
        <div className="sheet-identity">
          <div className="sheet-number">{number.number}</div>
          <div className="sheet-number-meta">
            {number.label || 'No label'} · {number.type.charAt(0).toUpperCase() + number.type.slice(1)}
          </div>
          <div className="sheet-badges">
            <span className={`badge badge-${number.status}`}>
              {number.status === 'active' ? '● active' : '○ unassigned'}
            </span>
            <span className={`badge badge-dlc-${number.tenDlcStatus}`}>
              10DLC: {number.tenDlcStatus.charAt(0).toUpperCase() + number.tenDlcStatus.slice(1)}
            </span>
          </div>
        </div>

        {/* ── Stats strip ── */}
        <div className="sheet-stats">
          <div className="sheet-stat">
            <div className="sheet-stat-value">{number.stats?.totalCalls7d ?? '—'}</div>
            <div className="sheet-stat-label">TOTAL CALLS</div>
          </div>
          <div className="sheet-stat">
            <div className="sheet-stat-value">
              {number.stats?.avgDurationS ? formatDuration(number.stats.avgDurationS) : '—'}
            </div>
            <div className="sheet-stat-label">AVG DURATION</div>
          </div>
          <div className="sheet-stat">
            <div className="sheet-stat-value">
              {number.stats?.cost7d != null ? `$${number.stats.cost7d.toFixed(2)}` : '—'}
            </div>
            <div className="sheet-stat-label">COST (7D)</div>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="sheet-tabs">
          <button className={`sheet-tab ${tab === 'config' ? 'active' : ''}`} onClick={() => setTab('config')}>
            Configuration
          </button>
          <button className={`sheet-tab ${tab === 'hours' ? 'active' : ''}`} onClick={() => setTab('hours')}>
            Business Hours
          </button>
          <button className={`sheet-tab ${tab === 'hil' ? 'active' : ''}`} onClick={() => setTab('hil')}>
            Human in the Loop
          </button>
        </div>

        {/* ── Scrollable body ── */}
        <div className="sheet-body">
          {saveError && <div className="alert alert-error" style={{ marginBottom: 16 }}>{saveError}</div>}

          {/* ── CONFIG TAB ── */}
          {tab === 'config' && (
            <>
              <Section title="General">
                <Row label="Friendly Label">
                  <input
                    className="form-input"
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    placeholder="e.g. Main Service Line"
                    disabled={!isAdmin}
                  />
                </Row>
                <Row label="Capabilities">
                  <div className="capability-chips">
                    {number.capabilities.map((c) => (
                      <span key={c} className="chip">{c.charAt(0).toUpperCase() + c.slice(1)}</span>
                    ))}
                  </div>
                </Row>
                <Row label="Forward To">
                  <input
                    className="form-input"
                    value={forwardTo}
                    onChange={(e) => setForwardTo(e.target.value)}
                    placeholder="(none)"
                    disabled={!isAdmin}
                  />
                </Row>
              </Section>

              <Section title="Inbound Settings">
                <RowToggle
                  label="Accept Inbound Calls"
                  sub="Allow this number to receive calls"
                  checked={acceptInbound}
                  onChange={setAcceptInbound}
                  disabled={!isAdmin}
                />
                <RowToggle
                  label="Voicemail Enabled"
                  sub="Send unanswered calls to voicemail"
                  checked={voicemailEnabled}
                  onChange={setVoicemailEnabled}
                  disabled={!isAdmin}
                />
                {voicemailEnabled && (
                  <RowToggle
                    label="Transcribe Voicemail"
                    sub="Auto-transcribe voicemail recordings"
                    checked={voicemailTranscription}
                    onChange={setVoicemailTranscription}
                    disabled={!isAdmin}
                    indent
                  />
                )}
              </Section>

              <Section title="Greeting & Recording">
                <Row label="Greeting message">
                  <textarea
                    className="form-textarea"
                    value={greetingText}
                    onChange={(e) => setGreetingText(e.target.value)}
                    placeholder="Hello! How can I help you today?"
                    rows={2}
                    disabled={!isAdmin}
                  />
                </Row>
                <Row label="Recording notice">
                  <textarea
                    className="form-textarea"
                    value={recordingNoticeText}
                    onChange={(e) => setRecordingNoticeText(e.target.value)}
                    rows={2}
                    disabled={!isAdmin}
                  />
                </Row>
              </Section>

              <Section title="Language">
                <Row label="Primary language">
                  <select
                    className="form-select"
                    value={primaryLanguage}
                    onChange={(e) => setPrimaryLanguage(e.target.value)}
                    disabled={!isAdmin}
                  >
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                    <option value="pt">Portuguese</option>
                    <option value="it">Italian</option>
                    <option value="ja">Japanese</option>
                    <option value="zh">Chinese</option>
                  </select>
                </Row>
                <RowToggle
                  label="Auto-detect caller language"
                  sub="Switch language mid-call based on caller"
                  checked={autoDetectLanguage}
                  onChange={setAutoDetectLanguage}
                  disabled={!isAdmin}
                />
              </Section>
            </>
          )}

          {/* ── BUSINESS HOURS TAB ── */}
          {tab === 'hours' && (
            <>
              <Section title="Timezone">
                <Row label="Timezone">
                  <select
                    className="form-select"
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    disabled={!isAdmin}
                  >
                    {TIMEZONES.map((tz) => (
                      <option key={tz} value={tz}>{tz}</option>
                    ))}
                  </select>
                </Row>
              </Section>

              <Section title="Schedule">
                <div className="hours-grid">
                  {schedule.map((row) => (
                    <div key={row.day} className="hours-row-sheet">
                      <RowToggle
                        label={DAYS[row.day]}
                        checked={row.open}
                        onChange={(v) => updateScheduleDay(row.day, { open: v })}
                        disabled={!isAdmin}
                      />
                      <div className={`hours-time-range ${!row.open ? 'disabled' : ''}`}>
                        <input
                          type="time"
                          className="form-input time-input"
                          value={row.start}
                          onChange={(e) => updateScheduleDay(row.day, { start: e.target.value })}
                          disabled={!isAdmin || !row.open}
                        />
                        <span className="muted">–</span>
                        <input
                          type="time"
                          className="form-input time-input"
                          value={row.end}
                          onChange={(e) => updateScheduleDay(row.day, { end: e.target.value })}
                          disabled={!isAdmin || !row.open}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            </>
          )}

          {/* ── HIL TAB ── */}
          {tab === 'hil' && (
            <>
              <Section title="Human Handoff">
                <RowToggle
                  label="Enable Human in the Loop"
                  sub="Route calls to a live agent when needed"
                  checked={hil.enabled ?? false}
                  onChange={(v) => setHil((h) => ({ ...h, enabled: v }))}
                  disabled={!isAdmin}
                />
              </Section>

              {hil.enabled && (
                <>
                  <Section title="Agent Assignment">
                    <Row label="Assignment mode">
                      <div className="radio-group">
                        {(['users', 'role', 'department'] as AssignmentMode[]).map((m) => (
                          <label key={m} className="radio-option">
                            <input
                              type="radio"
                              name="assignmentMode"
                              value={m}
                              checked={hil.assignmentMode === m}
                              onChange={() => setHil((h) => ({ ...h, assignmentMode: m }))}
                              disabled={!isAdmin}
                            />
                            {m.charAt(0).toUpperCase() + m.slice(1)}
                          </label>
                        ))}
                      </div>
                    </Row>

                    {hil.assignmentMode === 'users' && (
                      <Row label="User IDs (comma-separated)">
                        <input
                          className="form-input"
                          value={(hil.userIds ?? []).join(', ')}
                          onChange={(e) => setHil((h) => ({
                            ...h,
                            userIds: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                          }))}
                          placeholder="user-id-1, user-id-2"
                          disabled={!isAdmin}
                        />
                      </Row>
                    )}
                    {hil.assignmentMode === 'role' && (
                      <Row label="Role ID">
                        <input className="form-input" value={hil.roleId ?? ''} onChange={(e) => setHil((h) => ({ ...h, roleId: e.target.value || null }))} disabled={!isAdmin} />
                      </Row>
                    )}
                    {hil.assignmentMode === 'department' && (
                      <Row label="Department ID">
                        <input className="form-input" value={hil.departmentId ?? ''} onChange={(e) => setHil((h) => ({ ...h, departmentId: e.target.value || null }))} disabled={!isAdmin} />
                      </Row>
                    )}

                    <Row label="Distribution mode">
                      <select
                        className="form-select"
                        value={hil.distributionMode}
                        onChange={(e) => setHil((h) => ({ ...h, distributionMode: e.target.value as DistributionMode }))}
                        disabled={!isAdmin}
                      >
                        <option value="round_robin">Round Robin</option>
                        <option value="first_available">First Available</option>
                        <option value="least_load">Least Load</option>
                      </select>
                    </Row>
                  </Section>

                  <Section title="Notifications">
                    <p className="hint-text" style={{ marginBottom: 12 }}>
                      All active channels fire simultaneously when a handoff is triggered.
                    </p>
                    <RowToggle label="Email notification" checked={hil.notifyEmail ?? true} onChange={(v) => setHil((h) => ({ ...h, notifyEmail: v }))} disabled={!isAdmin} />
                    <RowToggle label="In-app notification" checked={hil.notifyInApp ?? true} onChange={(v) => setHil((h) => ({ ...h, notifyInApp: v }))} disabled={!isAdmin} />
                    <RowToggle label="Phone call to agent" checked={hil.notifyPhoneCall ?? false} onChange={(v) => setHil((h) => ({ ...h, notifyPhoneCall: v }))} disabled={!isAdmin} />
                  </Section>

                  <Section title="SLA & Fallback">
                    <Row label="Agent response timeout (seconds)">
                      <input type="number" className="form-input" value={hil.agentTimeoutSeconds ?? 30} onChange={(e) => setHil((h) => ({ ...h, agentTimeoutSeconds: Number(e.target.value) }))} min={10} max={300} disabled={!isAdmin} />
                    </Row>
                    <Row label="Max rerouting attempts">
                      <input type="number" className="form-input" value={hil.maxReroutingAttempts ?? 3} onChange={(e) => setHil((h) => ({ ...h, maxReroutingAttempts: Number(e.target.value) }))} min={0} max={10} disabled={!isAdmin} />
                    </Row>
                    <Row label="Fallback when no agent available">
                      <select className="form-select" value={hil.fallback} onChange={(e) => setHil((h) => ({ ...h, fallback: e.target.value as HilFallback }))} disabled={!isAdmin}>
                        <option value="voicemail">Voicemail</option>
                        <option value="callback">Callback</option>
                        <option value="queue">Queue</option>
                      </select>
                    </Row>
                    <Row label="Fallback message">
                      <textarea className="form-textarea" value={hil.fallbackMessage ?? ''} onChange={(e) => setHil((h) => ({ ...h, fallbackMessage: e.target.value || null }))} rows={2} placeholder="All agents are currently unavailable." disabled={!isAdmin} />
                    </Row>
                  </Section>
                </>
              )}
            </>
          )}
        </div>

        {/* ── Sticky footer ── */}
        {isAdmin && (
          <div className="sheet-footer">
            <button className="sheet-btn-release" onClick={onRelease}>
              Release Number
            </button>
            <button className="sheet-btn-save" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : saveLabel}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="sheet-section">
      <div className="sheet-section-title">{title}</div>
      {children}
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="sheet-row">
      <div className="sheet-row-label">{label}</div>
      <div className="sheet-row-value">{children}</div>
    </div>
  )
}

function RowToggle({
  label, sub, checked, onChange, disabled = false, indent = false,
}: {
  label: string
  sub?: string
  checked: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
  indent?: boolean
}) {
  return (
    <div className={`sheet-row sheet-row-toggle ${indent ? 'indent' : ''}`}>
      <div className="sheet-row-label-wrap">
        <div className="sheet-row-label">{label}</div>
        {sub && <div className="sheet-row-sub">{sub}</div>}
      </div>
      <button
        role="switch"
        aria-checked={checked}
        className={`toggle-switch ${checked ? 'on' : ''}`}
        onClick={() => !disabled && onChange(!checked)}
        disabled={disabled}
        type="button"
      />
    </div>
  )
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

const TIMEZONES = [
  'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'America/Bogota', 'America/Sao_Paulo', 'America/Mexico_City', 'America/Lima',
  'Europe/London', 'Europe/Paris', 'Europe/Madrid', 'Europe/Berlin',
  'Asia/Tokyo', 'Asia/Shanghai', 'Asia/Kolkata', 'Australia/Sydney',
  'UTC',
]
