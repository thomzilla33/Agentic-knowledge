import { useState, useEffect } from 'react'
import { sessionsApi } from '../api/voice'
import type { VoiceSession } from '../types/voice'

interface Props {
  workspaceId: string
}

interface Stats {
  totalCalls: number
  activeCalls: number
  humanHandoffs: number
  avgDurationS: number | null
}

export function VoiceOverview({ workspaceId }: Props) {
  const [sessions, setSessions] = useState<VoiceSession[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    sessionsApi.list(workspaceId, { limit: 50 })
      .then((res) => setSessions(res.data))
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Failed to load data'))
      .finally(() => setLoading(false))
  }, [workspaceId])

  const stats = deriveStats(sessions)
  const callsByDay = buildDailyVolume(sessions)
  const recentSessions = sessions.slice(0, 5)

  if (loading) return <div className="loading-block">Loading overview…</div>
  if (error) return <div className="loading-block" style={{ color: 'var(--color-danger)' }}>{error}</div>

  return (
    <div className="overview-layout">
      {/* Stat Cards */}
      <div className="stat-cards">
        <StatCard
          label="Total Calls (7d)"
          value={String(stats.totalCalls)}
          icon="📞"
          color="blue"
        />
        <StatCard
          label="Active Now"
          value={String(stats.activeCalls)}
          icon="🔴"
          color="red"
        />
        <StatCard
          label="Human Handoffs"
          value={String(stats.humanHandoffs)}
          icon="👤"
          color="orange"
        />
        <StatCard
          label="Avg Duration"
          value={stats.avgDurationS != null ? formatDuration(stats.avgDurationS) : '—'}
          icon="⏱"
          color="green"
        />
      </div>

      {/* Chart */}
      <div className="chart-card">
        <div className="chart-header">
          <h3 className="chart-title">Call Volume — Last 7 Days</h3>
        </div>
        <CallVolumeChart data={callsByDay} />
      </div>

      {/* Recent Sessions */}
      <div className="recent-card">
        <div className="recent-header">
          <h3 className="recent-title">Recent Sessions</h3>
        </div>
        {recentSessions.length === 0 ? (
          <p className="muted" style={{ padding: '16px' }}>No calls yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Number</th>
                <th>Contact</th>
                <th>Direction</th>
                <th>Status</th>
                <th>Duration</th>
                <th>Started</th>
              </tr>
            </thead>
            <tbody>
              {recentSessions.map((s) => (
                <tr key={s.id}>
                  <td className="muted">{s.channelLabel || s.channelNumber}</td>
                  <td>{s.contactPhone}</td>
                  <td>
                    <span className={`badge badge-dir-${s.direction}`}>
                      {s.direction === 'inbound' ? '↙ In' : '↗ Out'}
                    </span>
                  </td>
                  <td>
                    <span className={`badge badge-sess-${s.status}`}>
                      {SESSION_STATUS_LABELS[s.status] ?? s.status}
                    </span>
                  </td>
                  <td className="muted">
                    {s.durationS != null ? formatDuration(s.durationS) : '—'}
                  </td>
                  <td className="muted">{formatTime(s.startedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────

function StatCard({
  label, value, icon, color,
}: {
  label: string; value: string; icon: string; color: string
}) {
  return (
    <div className={`stat-card stat-card-${color}`}>
      <div className="stat-card-icon">{icon}</div>
      <div className="stat-card-value">{value}</div>
      <div className="stat-card-label">{label}</div>
    </div>
  )
}

interface DayVolume { day: string; inbound: number; outbound: number }

function CallVolumeChart({ data }: { data: DayVolume[] }) {
  const max = Math.max(...data.map((d) => d.inbound + d.outbound), 1)

  return (
    <div className="bar-chart">
      {data.map((d) => {
        const total = d.inbound + d.outbound
        const heightPct = (total / max) * 100
        return (
          <div key={d.day} className="bar-col">
            <div className="bar-wrap">
              <div className="bar-tip">{total > 0 ? total : ''}</div>
              <div
                className="bar-fill"
                style={{ height: `${heightPct}%` }}
                title={`${d.inbound} inbound, ${d.outbound} outbound`}
              />
            </div>
            <div className="bar-label">{d.day}</div>
          </div>
        )
      })}
    </div>
  )
}

// ── Helpers ────────────────────────────────────────────────────────────────

function deriveStats(sessions: VoiceSession[]): Stats {
  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000
  const recent = sessions.filter((s) => new Date(s.startedAt).getTime() > cutoff)
  const activeCalls = sessions.filter((s) => s.status === 'active' || s.status === 'human_active').length
  const humanHandoffs = recent.filter((s) => s.humanInLoop).length
  const durationsS = recent.filter((s) => s.durationS != null).map((s) => s.durationS as number)
  const avgDurationS = durationsS.length > 0
    ? durationsS.reduce((a, b) => a + b, 0) / durationsS.length
    : null

  return { totalCalls: recent.length, activeCalls, humanHandoffs, avgDurationS }
}

function buildDailyVolume(sessions: VoiceSession[]): DayVolume[] {
  const days: DayVolume[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    const label = d.toLocaleDateString('en', { weekday: 'short' })
    const inbound = sessions.filter((s) => s.startedAt.startsWith(key) && s.direction === 'inbound').length
    const outbound = sessions.filter((s) => s.startedAt.startsWith(key) && s.direction === 'outbound').length
    days.push({ day: label, inbound, outbound })
  }
  return days
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString('en', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const SESSION_STATUS_LABELS: Partial<Record<string, string>> = {
  active: 'Active',
  ended: 'Ended',
  failed: 'Failed',
  transferring: 'Transferring',
  human_active: 'With Agent',
}
