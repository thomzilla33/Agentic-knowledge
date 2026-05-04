import { useState } from 'react'
import { numbersApi } from '../api/voice'
import type { AvailableNumber, PhoneNumber } from '../types/voice'

interface Props {
  workspaceId: string
  userId: string
  onPurchased: (num: PhoneNumber) => void
  onClose: () => void
}

type Step = 'search' | 'confirm'

export function GetNumberModal({ workspaceId, userId, onPurchased, onClose }: Props) {
  const [step, setStep] = useState<Step>('search')

  // Search form
  const [type, setType] = useState('local')
  const [countryCode, setCountryCode] = useState('US')
  const [areaCode, setAreaCode] = useState('')
  const [label, setLabel] = useState('')

  // Results
  const [searching, setSearching] = useState(false)
  const [results, setResults] = useState<AvailableNumber[]>([])
  const [searchError, setSearchError] = useState<string | null>(null)

  // Confirm
  const [selected, setSelected] = useState<AvailableNumber | null>(null)
  const [purchasing, setPurchasing] = useState(false)
  const [purchaseError, setPurchaseError] = useState<string | null>(null)

  const handleSearch = async () => {
    setSearching(true)
    setSearchError(null)
    setResults([])
    try {
      const data = await numbersApi.searchAvailable(workspaceId, {
        type,
        countryCode,
        areaCode: areaCode || undefined,
        limit: 10,
      })
      if (data.length === 0) {
        setSearchError('No numbers found for those criteria. Try a different area code or type.')
      } else {
        setResults(data)
      }
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : 'Search failed')
    } finally {
      setSearching(false)
    }
  }

  const handleSelect = (num: AvailableNumber) => {
    setSelected(num)
    setStep('confirm')
  }

  const handlePurchase = async () => {
    if (!selected) return
    setPurchasing(true)
    setPurchaseError(null)
    try {
      const num = await numbersApi.purchase(workspaceId, userId, {
        phoneNumber: selected.phoneNumber,
        type,
        label: label || undefined,
      })
      onPurchased(num)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Purchase failed'
      if (msg === 'NUMBER_UNAVAILABLE') {
        setPurchaseError('This number was just acquired by someone else. Please go back and choose another.')
      } else {
        setPurchaseError(msg)
      }
      setPurchasing(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 560 }}>
        <div className="modal-header">
          <h3 className="modal-title">
            {step === 'search' ? 'Find a Phone Number' : 'Confirm Purchase'}
          </h3>
          <button className="close-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {step === 'search' && (
          <div className="modal-body">
            <div className="form-row">
              <div className="form-field">
                <label className="form-label">Type</label>
                <select className="form-select" value={type} onChange={(e) => setType(e.target.value)}>
                  <option value="local">Local</option>
                  <option value="toll-free">Toll-Free</option>
                  <option value="mobile">Mobile</option>
                </select>
              </div>
              <div className="form-field">
                <label className="form-label">Country</label>
                <select className="form-select" value={countryCode} onChange={(e) => setCountryCode(e.target.value)}>
                  <option value="US">United States</option>
                  <option value="CA">Canada</option>
                  <option value="GB">United Kingdom</option>
                  <option value="AU">Australia</option>
                  <option value="MX">Mexico</option>
                  <option value="CO">Colombia</option>
                  <option value="BR">Brazil</option>
                </select>
              </div>
            </div>

            <div className="form-field">
              <label className="form-label">Area code (optional)</label>
              <input
                className="form-input"
                value={areaCode}
                onChange={(e) => setAreaCode(e.target.value.replace(/\D/g, '').slice(0, 3))}
                placeholder="e.g. 415"
                maxLength={3}
              />
            </div>

            {searchError && <div className="alert alert-error">{searchError}</div>}

            {results.length > 0 && (
              <div className="number-results">
                <p className="results-heading">{results.length} numbers available — click to select:</p>
                <div className="number-list">
                  {results.map((n) => (
                    <button
                      key={n.phoneNumber}
                      className="number-option"
                      onClick={() => handleSelect(n)}
                    >
                      <div className="number-option-main">
                        <span className="number-option-num">{n.friendlyName}</span>
                        <span className="number-option-region">{n.region}, {n.isoCountry}</span>
                      </div>
                      <div className="number-option-caps">
                        {n.capabilities.voice && <span className="cap-chip">Voice</span>}
                        {n.capabilities.SMS && <span className="cap-chip">SMS</span>}
                        {n.capabilities.MMS && <span className="cap-chip">MMS</span>}
                      </div>
                      <div className="number-option-cost">{n.monthlyRenewCost}/mo</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {step === 'confirm' && selected && (
          <div className="modal-body">
            <div className="confirm-number-card">
              <div className="confirm-number">{selected.friendlyName}</div>
              <div className="confirm-region">{selected.region}, {selected.isoCountry}</div>
              <div className="confirm-cost">Monthly: {selected.monthlyRenewCost}</div>
            </div>

            <div className="form-field" style={{ marginTop: 16 }}>
              <label className="form-label">Label (optional)</label>
              <input
                className="form-input"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g. Sales line, Support"
              />
            </div>

            {purchaseError && <div className="alert alert-error">{purchaseError}</div>}

            <div className="confirm-note">
              By confirming, this number will be provisioned in your Twilio account and billed at the rate above.
              This action can be undone by releasing the number later.
            </div>
          </div>
        )}

        <div className="modal-footer">
          {step === 'search' && (
            <>
              <button className="btn-secondary" onClick={onClose}>Cancel</button>
              <button className="btn-primary" onClick={handleSearch} disabled={searching}>
                {searching ? 'Searching…' : 'Search Numbers'}
              </button>
            </>
          )}
          {step === 'confirm' && (
            <>
              <button className="btn-secondary" onClick={() => { setStep('search'); setPurchaseError(null) }}>
                ← Back
              </button>
              <button className="btn-primary" onClick={handlePurchase} disabled={purchasing}>
                {purchasing ? 'Purchasing…' : 'Confirm & Purchase'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
