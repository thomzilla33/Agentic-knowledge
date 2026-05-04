import { useState } from 'react'
import { numbersApi } from '../api/voice'
import type { PhoneNumber } from '../types/voice'

interface Props {
  number: PhoneNumber
  workspaceId: string
  onReleased: () => void
  onClose: () => void
}

export function ReleaseNumberModal({ number, workspaceId, onReleased, onClose }: Props) {
  const [releasing, setReleasing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmed, setConfirmed] = useState(false)

  const handleRelease = async () => {
    if (!confirmed) return
    setReleasing(true)
    setError(null)
    try {
      await numbersApi.release(workspaceId, number.id)
      onReleased()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Release failed')
      setReleasing(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 440 }}>
        <div className="modal-header">
          <h3 className="modal-title danger-title">⚠ Release Phone Number</h3>
          <button className="close-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="modal-body">
          <div className="release-number-display">{number.number}</div>
          {number.label && <div className="release-label">{number.label}</div>}

          <div className="alert alert-warning">
            <strong>This action is irreversible.</strong> Releasing this number will:
            <ul className="warning-list">
              <li>Remove it from your Twilio account immediately</li>
              <li>Stop all inbound calls and messages</li>
              <li>Delete all associated configurations</li>
              <li>The number may be reassigned to another account</li>
            </ul>
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <label className="confirm-checkbox">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
            />
            I understand this action cannot be undone
          </label>
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose} disabled={releasing}>
            Cancel
          </button>
          <button
            className="btn-danger"
            onClick={handleRelease}
            disabled={!confirmed || releasing}
          >
            {releasing ? 'Releasing…' : 'Release Number'}
          </button>
        </div>
      </div>
    </div>
  )
}
