import { useState, useEffect } from 'react'
import { numbersApi } from '../api/voice'
import { NumberConfigPanel } from './NumberConfigPanel'
import { GetNumberModal } from './GetNumberModal'
import { ReleaseNumberModal } from './ReleaseNumberModal'
import type { PhoneNumber, Toast } from '../types/voice'

interface Props {
  workspaceId: string
  userId: string
  isAdmin: boolean
  onToast: (type: Toast['type'], message: string) => void
}

export function VoiceSettings({ workspaceId, userId, isAdmin, onToast }: Props) {
  const [numbers, setNumbers] = useState<PhoneNumber[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'unassigned'>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showGetNumber, setShowGetNumber] = useState(false)
  const [releaseTarget, setReleaseTarget] = useState<PhoneNumber | null>(null)

  const fetchNumbers = async () => {
    setLoading(true)
    const data = await numbersApi.list(
      workspaceId,
      statusFilter === 'all' ? undefined : statusFilter,
    )
    setNumbers(data)
    setLoading(false)
  }

  useEffect(() => { fetchNumbers() }, [statusFilter, workspaceId])

  const selectedNumber = numbers.find((n) => n.id === selectedId) ?? null

  const handlePurchased = (num: PhoneNumber) => {
    setShowGetNumber(false)
    onToast('success', `✓ Number ${num.number} acquired successfully`)
    fetchNumbers()
  }

  const handleReleased = () => {
    setReleaseTarget(null)
    setSelectedId(null)
    onToast('success', 'Number released')
    fetchNumbers()
  }

  const handleSaved = () => {
    onToast('success', '✓ Configuration saved')
    fetchNumbers()
  }

  return (
    <div className="settings-layout">
      {/* Header */}
      <div className="settings-header">
        <div>
          <h2 className="settings-title">Phone Numbers</h2>
          <p className="settings-sub">Click any number to view and edit its configuration</p>
        </div>
        {isAdmin && (
          <button className="btn-primary" onClick={() => setShowGetNumber(true)}>
            + Get Number
          </button>
        )}
      </div>

      <div className="settings-body">
        {/* Table — full width now, config panel is an overlay sheet */}
        <div className="table-wrap" style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          {/* Status filter */}
          <div className="filter-bar">
            {(['all', 'active', 'unassigned'] as const).map((f) => (
              <button
                key={f}
                className={`filter-btn ${statusFilter === f ? 'active' : ''}`}
                onClick={() => setStatusFilter(f)}
              >
                {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>

          <table>
            <thead>
              <tr>
                <th>Number</th>
                <th>Type</th>
                <th>Label</th>
                <th>Status</th>
                <th>Calls</th>
                <th>Avg Dur</th>
                <th>10DLC</th>
                {isAdmin && <th />}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="loading-cell">Loading numbers...</td></tr>
              ) : numbers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="empty-cell">
                    No numbers found. {isAdmin && 'Click "Get Number" to acquire one.'}
                  </td>
                </tr>
              ) : numbers.map((num) => (
                <tr
                  key={num.id}
                  className={selectedId === num.id ? 'selected' : ''}
                  onClick={() => setSelectedId(num.id === selectedId ? null : num.id)}
                >
                  <td className="num-cell">{num.number}</td>
                  <td className="muted">{num.type}</td>
                  <td>{num.label || <span className="muted">—</span>}</td>
                  <td>
                    <StatusBadge status={num.status} />
                  </td>
                  <td className="muted">
                    {num.stats?.totalCalls7d ?? '—'}
                  </td>
                  <td className="muted">
                    {num.stats?.avgDurationS
                      ? formatDuration(num.stats.avgDurationS)
                      : '—'}
                  </td>
                  <td>
                    <DlcBadge status={num.tenDlcStatus} />
                  </td>
                  {isAdmin && (
                    <td onClick={(e) => e.stopPropagation()}>
                      <button
                        className="gear-btn"
                        onClick={() => setSelectedId(num.id)}
                        title="Configure"
                      >
                        ⚙
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>

      {/* Config Sheet — overlay, slides up from bottom */}
      {selectedNumber && (
        <NumberConfigPanel
          number={selectedNumber}
          workspaceId={workspaceId}
          isAdmin={isAdmin}
          onClose={() => setSelectedId(null)}
          onSaved={handleSaved}
          onRelease={() => setReleaseTarget(selectedNumber)}
        />
      )}

      {/* Modals */}
      {showGetNumber && (
        <GetNumberModal
          workspaceId={workspaceId}
          userId={userId}
          onPurchased={handlePurchased}
          onClose={() => setShowGetNumber(false)}
        />
      )}

      {releaseTarget && (
        <ReleaseNumberModal
          number={releaseTarget}
          workspaceId={workspaceId}
          onReleased={handleReleased}
          onClose={() => setReleaseTarget(null)}
        />
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: PhoneNumber['status'] }) {
  return (
    <span className={`badge badge-${status}`}>
      {status === 'active' ? '● Active' : '○ Unassigned'}
    </span>
  )
}

function DlcBadge({ status }: { status: PhoneNumber['tenDlcStatus'] }) {
  return <span className={`badge badge-dlc-${status}`}>{status}</span>
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}
