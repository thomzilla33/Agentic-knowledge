import { useState, useEffect, useCallback } from 'react'
import { sessionsApi } from '../api/voice'
import type { VoiceSession, TranscriptEntry, SessionDirection } from '../types/voice'

interface Props {
  workspaceId: string
}

type DirectionFilter = 'all' | SessionDirection
type DetailTab = 'conversation' | 'transcript'

export function VoiceLogs({ workspaceId }: Props) {
  const [sessions, setSessions] = useState<VoiceSession[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [direction, setDirection] = useState<DirectionFilter>('all')

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [detail, setDetail] = useState<(VoiceSession & { transcript: TranscriptEntry[] }) | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [detailError, setDetailError] = useState<string | null>(null)
  const [detailTab, setDetailTab] = useState<DetailTab>('conversation')
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)

  const LIMIT = 20

  const fetchSessions = useCallback(async () => {
    setLoading(true)
    try {
      const res = await sessionsApi.list(workspaceId, {
        direction: direction === 'all' ? undefined : direction,
        page,
        limit: LIMIT,
      })
      setSessions(res.data)
      setTotal(res.meta.total)
    } finally {
      setLoading(false)
    }
  }, [workspaceId, direction, page])

  useEffect(() => { fetchSessions() }, [fetchSessions])

  useEffect(() => {
    if (!selectedId) { setDetail(null); setDetailError(null); return }
    setLoadingDetail(true)
    setDetailError(null)
    sessionsApi.get(workspaceId, selectedId)
      .then(setDetail)
      .catch((err: unknown) => setDetailError(err instanceof Error ? err.message : 'Failed to load session'))
      .finally(() => setLoadingDetail(false))
  }, [workspaceId, selectedId])

  const handleExport = async () => {
    if (!selectedId) return
    setExporting(true)
    setExportError(null)
    try {
      const text = await sessionsApi.exportText(workspaceId, selectedId)
      const blob = new Blob([text], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `session-${selectedId}.txt`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err: unknown) {
      setExportError(err instanceof Error ? err.message : 'Export failed')
    } finally {
      setExporting(false)
    }
  }

  const totalPages = Math.ceil(total / LIMIT)

  return (
    <div className="logs-layout">
      {/* Table panel */}
      <div className="logs-table-panel">
        {/* Direction filter */}
        <div className="filter-bar">
          {(['all', 'inbound', 'outbound'] as const).map((f) => (
            <button
              key={f}
              className={`filter-btn ${direction === f ? 'active' : ''}`}
              onClick={() => { setDirection(f); setPage(1) }}
            >
              {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
          <span className="filter-count">{total} sessions</span>
        </div>

        <table>
          <thead>
            <tr>
              <th>Contact</th>
              <th>Direction</th>
              <th>Status</th>
              <th>Duration</th>
              <th>Language</th>
              <th>HiL</th>
              <th>Sentiment</th>
              <th>Started</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="loading-cell">Loading sessions…</td></tr>
            ) : sessions.length === 0 ? (
              <tr><td colSpan={8} className="empty-cell">No sessions found.</td></tr>
            ) : sessions.map((s) => (
              <tr
                key={s.id}
                className={selectedId === s.id ? 'selected' : ''}
                onClick={() => setSelectedId(s.id === selectedId ? null : s.id)}
              >
                <td className="num-cell">{s.contactPhone}</td>
                <td>
                  <span className={`badge badge-dir-${s.direction}`}>
                    {s.direction === 'inbound' ? '↙ In' : '↗ Out'}
                  </span>
                </td>
                <td>
                  <span className={`badge badge-sess-${s.status}`}>
                    {STATUS_LABELS[s.status] ?? s.status}
                  </span>
                </td>
                <td className="muted">{s.durationS != null ? formatDuration(s.durationS) : '—'}</td>
                <td className="muted">{s.language}</td>
                <td>{s.humanInLoop ? <span className="badge badge-hil">HiL</span> : <span className="muted">—</span>}</td>
                <td>
                  {s.sentiment
                    ? <span className={`badge badge-sentiment-${s.sentiment}`}>{s.sentiment}</span>
                    : <span className="muted">—</span>}
                </td>
                <td className="muted">{formatTime(s.startedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination">
            <button className="page-btn" onClick={() => setPage((p) => p - 1)} disabled={page === 1}>
              ‹ Prev
            </button>
            <span className="page-info">Page {page} of {totalPages}</span>
            <button className="page-btn" onClick={() => setPage((p) => p + 1)} disabled={page >= totalPages}>
              Next ›
            </button>
          </div>
        )}
      </div>

      {/* Detail panel */}
      {selectedId && (
        <div className="logs-detail-panel">
          {loadingDetail ? (
            <div className="loading-block">Loading session…</div>
          ) : detailError ? (
            <div className="loading-block" style={{ color: 'var(--color-danger)' }}>{detailError}</div>
          ) : detail ? (
            <>
              <div className="detail-header">
                <div>
                  <div className="detail-contact">{detail.contactPhone}</div>
                  <div className="detail-meta muted">
                    {detail.channelLabel || detail.channelNumber} · {formatTime(detail.startedAt)}
                    {detail.durationS != null && ` · ${formatDuration(detail.durationS)}`}
                  </div>
                </div>
                <div className="detail-actions">
                  {exportError && <span style={{ color: 'var(--color-danger)', fontSize: 12 }}>{exportError}</span>}
                  <button className="btn-secondary" onClick={handleExport} disabled={exporting}>
                    {exporting ? 'Exporting…' : '⬇ Export'}
                  </button>
                  <button className="close-btn" onClick={() => setSelectedId(null)} aria-label="Close">✕</button>
                </div>
              </div>

              {/* Detail highlights */}
              <div className="detail-chips">
                <span className={`badge badge-dir-${detail.direction}`}>
                  {detail.direction === 'inbound' ? '↙ Inbound' : '↗ Outbound'}
                </span>
                <span className={`badge badge-sess-${detail.status}`}>
                  {STATUS_LABELS[detail.status] ?? detail.status}
                </span>
                {detail.humanInLoop && <span className="badge badge-hil">Human in the Loop</span>}
                {detail.sentiment && (
                  <span className={`badge badge-sentiment-${detail.sentiment}`}>{detail.sentiment}</span>
                )}
                {detail.costUsd != null && (
                  <span className="badge badge-cost">${detail.costUsd.toFixed(4)}</span>
                )}
              </div>

              {/* Sub-tabs */}
              <div className="detail-tabs">
                <button
                  className={`detail-tab-btn ${detailTab === 'conversation' ? 'active' : ''}`}
                  onClick={() => setDetailTab('conversation')}
                >
                  Conversation
                </button>
                <button
                  className={`detail-tab-btn ${detailTab === 'transcript' ? 'active' : ''}`}
                  onClick={() => setDetailTab('transcript')}
                >
                  Full Transcript
                </button>
              </div>

              <div className="detail-body">
                {detailTab === 'conversation' && (
                  <div className="conversation-view">
                    {detail.transcript.length === 0 ? (
                      <p className="muted">No transcript available.</p>
                    ) : (
                      detail.transcript.map((entry) => (
                        <div key={entry.id} className={`bubble bubble-${entry.role}`}>
                          <div className="bubble-role">{ROLE_LABELS[entry.role]}</div>
                          <div className="bubble-content">{entry.content}</div>
                          <div className="bubble-time muted">{formatMs(entry.audioStartMs)}</div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {detailTab === 'transcript' && (
                  <div className="transcript-view">
                    {detail.transcript.length === 0 ? (
                      <p className="muted">No transcript available.</p>
                    ) : (
                      detail.transcript.map((entry) => (
                        <div key={entry.id} className="transcript-line">
                          <span className={`transcript-role role-${entry.role}`}>
                            {ROLE_LABELS[entry.role]}:
                          </span>
                          <span className="transcript-text">{entry.content}</span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>
      )}
    </div>
  )
}

// ── Helpers ────────────────────────────────────────────────────────────────

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString('en', {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function formatMs(ms: number): string {
  const totalS = Math.floor(ms / 1000)
  const m = Math.floor(totalS / 60)
  const s = totalS % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

const STATUS_LABELS: Partial<Record<string, string>> = {
  active: 'Active',
  ended: 'Ended',
  failed: 'Failed',
  transferring: 'Transferring',
  human_active: 'With Agent',
}

const ROLE_LABELS: Record<string, string> = {
  user: 'Caller',
  agent: 'AI Agent',
  human_agent: 'Agent',
}
