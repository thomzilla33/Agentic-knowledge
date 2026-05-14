import React, { useEffect, useState } from 'react'
import {
  X, BookOpen, Play, Edit, Unlink, Sparkles,
  Shield, Database, Folder, ChevronRight, ChevronDown, AlertTriangle,
  FileText, GitBranch, UserCheck, Calendar, Quote, Link2, FlaskConical,
  Lock, ArrowUpCircle,
} from 'lucide-react'
import {
  getPacksForWorkflow, getPackLineage, WORKFLOW_ENVIRONMENTS,
  isAttestationExpired, daysOverdue, getRecentRunsForPack,
} from '../../../data/mockKnowledge'

// ════════════════════════════════════════════════════════════════════════════
// Workflow-Knowledge View
// ────────────────────────────────────────────────────────────────────────────
// First surface a user sees when clicking "Knowledge" inside a workflow
// builder. Read-only inspection of the knowledge currently attached to the
// workflow + entry points to test, modify, or detach.
//
// Two states:
//   - HAS attached pack(s) → show pack card + actions row
//   - NO pack → empty state with single CTA "Add knowledge constraint"
//
// Props:
//   workflowId   — string, network id from Agentic Studio (e.g. 'n1')
//   workflowName — string, human-readable workflow name
//   onClose      — () => void, dismiss this view
//   onModify     — () => void, open the Copilot to add/modify the constraint
//   onTest       — () => void, open the test panel (Fase 1 — disabled in F0)
// ════════════════════════════════════════════════════════════════════════════

const AIMS_GRADIENT = 'linear-gradient(135deg,#00C2C2 0%,#155DFC 100%)'

const PLANE_META = {
  truth:   { label: 'Truth',   icon: Shield,   color: '#4ade80', bg: 'rgba(34,197,94,0.10)',  border: 'rgba(34,197,94,0.30)' },
  sandbox: { label: 'Sandbox', icon: Database, color: '#fbbf24', bg: 'rgba(245,158,11,0.10)', border: 'rgba(245,158,11,0.30)' },
  sources: { label: 'Sources', icon: Folder,   color: '#60a5fa', bg: 'rgba(59,130,246,0.10)', border: 'rgba(59,130,246,0.30)' },
}

const INTENT_LABEL = {
  restrict: 'Restrict',
  add:      'Extend',
  both:     'Restrict + extend',
}

export default function WorkflowKnowledgeView({
  open,
  workflowId,
  workflowName,
  // Controlled list of packs attached to this workflow. When omitted (legacy
  // usage), the view falls back to reading mock data directly. Parent should
  // prefer to pass `packs` so detach + recently-updated state can be
  // coordinated.
  packs: packsProp,
  recentlyUpdatedPackIds,
  // F1.2 — environment is 'sandbox' or 'production'. Drives enforcement
  // copy + colors throughout the view. Defaults to production when omitted.
  environment = 'production',
  onChangeEnvironment,
  onClose, onModify, onTest, onDetach,
}) {
  // ESC dismisses the view OR cancels a pending detach confirm, whichever is
  // active. Body scroll is owned by the outer slide-out shell, not here, since
  // this component now renders inline as iframe content.
  const [confirmingDetachId, setConfirmingDetachId] = useState(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key !== 'Escape') return
      if (confirmingDetachId) setConfirmingDetachId(null)
      else                    onClose?.()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose, confirmingDetachId])

  if (!open) return null

  const packs = packsProp ?? getPacksForWorkflow(workflowId)
  const hasPack = packs.length > 0
  const updatedSet = recentlyUpdatedPackIds || new Set()
  const env = WORKFLOW_ENVIRONMENTS[environment] || WORKFLOW_ENVIRONMENTS.production
  const isSandbox = environment === 'sandbox'

  // Inline rendering — fills its container (the slide-out panel from
  // Agentic Studio, or the page itself if launched standalone). No modal
  // wrapper, no backdrop, no centering. Single visual layer.
  return (
    <div
      role="region"
      aria-labelledby="wkv-title"
      className="flex flex-col w-full h-full overflow-hidden"
      style={{ background: 'var(--bg-base, #0b1220)' }}
    >
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="px-5 py-4 flex items-start justify-between gap-3 shrink-0"
        style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'linear-gradient(135deg,rgba(99,102,241,0.20),rgba(139,92,246,0.20))', border: '1px solid rgba(99,102,241,0.35)' }}>
            <BookOpen size={17} style={{ color: '#c4b5fd' }} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold tracking-widest uppercase mb-0.5"
              style={{ color: 'var(--text-muted)' }}>Knowledge</p>
            <p id="wkv-title" className="text-base font-semibold leading-tight truncate"
              style={{ color: 'var(--text-primary)' }}>
              {workflowName || 'Workflow'}
            </p>
            <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Read-only inspection · Modify with the Copilot
            </p>
          </div>
        </div>
        <button onClick={onClose} aria-label="Close"
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer shrink-0"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
          <X size={14} />
        </button>
      </div>

      {/* ── Environment strip (F1.2) ───────────────────────────────── */}
      <EnvironmentStrip
        environment={environment}
        env={env}
        onChange={onChangeEnvironment}
      />

      {/* ── Body ───────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5 min-h-0">
        {hasPack ? (
          <AttachedState
            packs={packs}
            recentlyUpdatedPackIds={updatedSet}
            isSandbox={isSandbox}
            onPromote={isSandbox ? () => onChangeEnvironment?.('production') : null}
            workflowId={workflowId}
          />
        ) : (
          <EmptyState onAdd={onModify} workflowName={workflowName} isSandbox={isSandbox} />
        )}
      </div>

      {/* ── Actions footer (only if pack attached) ─────────────────── */}
      {hasPack && (
        confirmingDetachId ? (
          <DetachConfirm
            workflowName={workflowName}
            onCancel={() => setConfirmingDetachId(null)}
            onConfirm={() => {
              const id = confirmingDetachId
              setConfirmingDetachId(null)
              onDetach?.(id)
            }}
          />
        ) : (
          <div className="px-5 py-4 flex items-center gap-2 shrink-0 flex-wrap"
            style={{ borderTop: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.02)' }}>
            <button
              onClick={onTest}
              title={isSandbox
                ? 'Dry-run in sandbox — pack is advisory, no enforcement'
                : 'Dry-run with the attached pack as an enforced constraint'}
              className="w-full py-2.5 rounded-lg text-[12px] font-semibold flex items-center justify-center gap-2 transition-all hover:brightness-110 cursor-pointer mb-2"
              style={{
                background: AIMS_GRADIENT,
                color: '#fff',
                boxShadow: '0 2px 12px rgba(21,93,252,0.30)',
              }}
            >
              <Play size={12} /> {isSandbox ? 'Test in sandbox' : 'Test workflow with this knowledge'}
            </button>
            <button
              onClick={onModify}
              className="flex-1 py-2.5 rounded-lg text-[12px] font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
            >
              <Edit size={12} /> Modify constraint
            </button>
            <button
              onClick={() => setConfirmingDetachId(packs[0]?.id)}
              className="py-2.5 px-3 rounded-lg text-[12px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.30)', color: '#f87171' }}
              title="Detach pack"
            >
              <Unlink size={12} /> Detach
            </button>
          </div>
        )
      )}
    </div>
  )
}

// Inline confirmation row that replaces the actions footer while a detach
// is pending. Kept inline (no modal) to avoid stacking layers inside the
// slide-out — the user clicks Detach, sees this row appear, picks one.
function DetachConfirm({ workflowName, onCancel, onConfirm }) {
  return (
    <div className="px-5 py-4 shrink-0"
      style={{ borderTop: '1px solid rgba(239,68,68,0.30)', background: 'rgba(239,68,68,0.06)' }}>
      <div className="flex items-start gap-2 mb-3">
        <AlertTriangle size={14} style={{ color: '#f87171' }} className="shrink-0 mt-0.5" />
        <p className="text-[12px] leading-snug" style={{ color: 'var(--text-primary)' }}>
          Detach this pack? <strong>{workflowName || 'The workflow'}</strong> will see <strong>every fact</strong> in the truth plane again — no constraint.
        </p>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={onCancel}
          className="flex-1 py-2 rounded-lg text-[12px] font-semibold transition-colors cursor-pointer"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
          Cancel
        </button>
        <button onClick={onConfirm}
          className="flex-1 py-2 rounded-lg text-[12px] font-semibold flex items-center justify-center gap-1.5 transition-all hover:brightness-110 cursor-pointer"
          style={{ background: 'rgba(239,68,68,0.20)', border: '1px solid rgba(239,68,68,0.50)', color: '#fca5a5' }}>
          <Unlink size={12} /> Detach pack
        </button>
      </div>
    </div>
  )
}

// ── Attached state — one or more packs linked to this workflow ────────────
function AttachedState({ packs, recentlyUpdatedPackIds, isSandbox, onPromote, workflowId }) {
  // F1.5 — aggregate expired-attestation count across all attached packs.
  // Used by the banner to warn the user before they hit Test or Modify.
  const expiredFactIds = packs.flatMap(p => {
    const lineage = getPackLineage(p.id)
    return (lineage?.items || []).filter(isAttestationExpired).map(f => f.id)
  })
  const expiredCount = expiredFactIds.length

  return (
    <>
      {expiredCount > 0 && (
        <ExpiredAttestationBanner count={expiredCount} ids={expiredFactIds} isSandbox={isSandbox} />
      )}

      <div>
        <p className="text-[10px] font-bold tracking-widest uppercase mb-2"
          style={{ color: 'var(--text-muted)' }}>
          Attached {packs.length === 1 ? 'pack' : `packs (${packs.length})`}
        </p>
        <div className="space-y-3">
          {packs.map(p => (
            <PackSection
              key={p.id}
              pack={p}
              recentlyUpdated={recentlyUpdatedPackIds?.has(p.id)}
              isSandbox={isSandbox}
              workflowId={workflowId}
            />
          ))}
        </div>
      </div>

      {/* Banner: pack-enforcement copy changes with environment */}
      {isSandbox ? (
        <div className="rounded-xl px-4 py-3 flex items-start gap-2"
          style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.30)' }}>
          <FlaskConical size={12} style={{ color: '#fbbf24' }} className="shrink-0 mt-0.5" />
          <p className="text-[11px] leading-snug" style={{ color: 'var(--text-secondary)' }}>
            <strong style={{ color: '#fbbf24' }}>Sandbox mode.</strong> The pack is <strong>advisory</strong> — the workflow can still read the full truth plane and won't be gated. Use this to validate changes before promoting to production.
          </p>
        </div>
      ) : (
        <div className="rounded-xl px-4 py-3 flex items-start gap-2"
          style={{ background: 'rgba(43,127,255,0.06)', border: '1px solid rgba(43,127,255,0.20)' }}>
          <Sparkles size={12} style={{ color: '#80AFFF' }} className="shrink-0 mt-0.5" />
          <p className="text-[11px] leading-snug" style={{ color: 'var(--text-secondary)' }}>
            This workflow only sees the facts listed above. Anything else in the truth plane is invisible to it. Use <strong>Modify</strong> to change scope, or <strong>Detach</strong> to remove the constraint entirely.
          </p>
        </div>
      )}

      {/* Promote CTA — only visible in sandbox */}
      {isSandbox && onPromote && (
        <button onClick={onPromote}
          className="w-full py-2.5 rounded-xl text-[12px] font-semibold flex items-center justify-center gap-2 transition-all hover:brightness-110 cursor-pointer"
          style={{
            background: AIMS_GRADIENT,
            color: '#fff',
            boxShadow: '0 2px 12px rgba(21,93,252,0.30)',
          }}>
          <ArrowUpCircle size={13} /> Promote workflow to production
        </button>
      )}
    </>
  )
}

// ── A single attached pack: compact header + expandable items ─────────────
function PackSection({ pack, recentlyUpdated, isSandbox, workflowId }) {
  // getPackLineage resolves factIds → fully hydrated items with source docs +
  // sandbox claim records. Falls back to a thin shape if enrichment is missing.
  const lineage = getPackLineage(pack.id)
  const items = lineage?.items || []
  // F2.2 — audit log entries for this workflow + pack pair (newest first).
  const recentRuns = workflowId ? getRecentRunsForPack(workflowId, pack.id) : []

  return (
    <div className="rounded-xl"
      style={{
        background: 'var(--bg-card)',
        border: `1px solid ${recentlyUpdated ? 'rgba(74,222,128,0.45)' : 'var(--border-subtle)'}`,
        boxShadow: recentlyUpdated ? '0 0 0 1px rgba(74,222,128,0.15), 0 2px 14px rgba(34,197,94,0.10)' : 'none',
        opacity: isSandbox ? 0.85 : 1,
        transition: 'border-color .3s, box-shadow .3s, opacity .2s',
      }}>
      <PackHeader pack={pack} itemCount={items.length} recentlyUpdated={recentlyUpdated} isSandbox={isSandbox} />

      {items.length > 0 && (
        <div style={{ borderTop: '1px solid var(--border-subtle)' }}>
          <div className="px-4 pt-3 pb-1.5">
            <p className="text-[10px] font-bold tracking-widest uppercase"
              style={{ color: 'var(--text-muted)' }}>
              Inside this pack · {items.length} {items.length === 1 ? 'fact' : 'facts'}
            </p>
          </div>
          <div className="px-2 pb-2 space-y-1.5">
            {items.map(item => <FactRow key={item.id} fact={item} />)}
          </div>
        </div>
      )}

      {/* F2.2 — Audit log section: who ran what with this pack, when, and */}
      {/* what governance gates fired. Closes the CYA pillar in context.   */}
      {recentRuns.length > 0 && (
        <RecentRunsSection runs={recentRuns} />
      )}
    </div>
  )
}

// Pack header row: icon, name, intent + status, description, owner footer.
// Plane breakdown moved out (the item list below is more informative).
function PackHeader({ pack, itemCount, recentlyUpdated, isSandbox }) {
  return (
    <div className="p-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: pack.ownerGradient || AIMS_GRADIENT }}>
          <BookOpen size={16} color="#fff" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <p className="text-[13px] font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
              {pack.name}
            </p>
            <span className="text-[9px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded-md"
              style={{
                background: pack.intent === 'restrict' ? 'rgba(99,102,241,0.16)' :
                            pack.intent === 'add'      ? 'rgba(34,211,238,0.16)' :
                                                          'rgba(43,127,255,0.16)',
                color:      pack.intent === 'restrict' ? '#c4b5fd' :
                            pack.intent === 'add'      ? '#22d3ee' :
                                                          '#80AFFF',
              }}>
              {INTENT_LABEL[pack.intent] || INTENT_LABEL.both}
            </span>
            {pack.status === 'active' && !isSandbox && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold"
                style={{ color: '#4ade80' }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#22c55e' }} />
                Active
              </span>
            )}
            {isSandbox && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md"
                style={{
                  background: 'rgba(245,158,11,0.16)',
                  color: '#fbbf24',
                  border: '1px solid rgba(245,158,11,0.40)',
                }}>
                <FlaskConical size={9} /> Advisory
              </span>
            )}
            {recentlyUpdated && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md"
                style={{
                  background: 'rgba(74,222,128,0.16)',
                  color: '#4ade80',
                  border: '1px solid rgba(74,222,128,0.40)',
                }}>
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#4ade80' }} />
                Just updated
              </span>
            )}
          </div>
          <p className="text-[11px] leading-snug" style={{ color: 'var(--text-muted)' }}>
            {pack.description}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-3 pt-3 text-[10px] flex-wrap"
        style={{ borderTop: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
        <span>Owner: <strong style={{ color: 'var(--text-secondary)' }}>{pack.owner}</strong></span>
        <span style={{ opacity: 0.4 }}>·</span>
        <span>Attached <strong style={{ color: 'var(--text-secondary)' }}>{relativeTime(pack.attachedAt || pack.lastUpdated)}</strong>
          {pack.attachedBy ? <> by <strong style={{ color: 'var(--text-secondary)' }}>{pack.attachedBy}</strong></> : null}
        </span>
        <span style={{ opacity: 0.4 }}>·</span>
        <span className="font-mono">{pack.id}</span>
      </div>
    </div>
  )
}

// F1.5 — surfaces expired attestations before the user enters Test or
// Modify. Different copy + color in sandbox (advisory) vs production (must
// fix before next run). Click cycle would scroll to the offending row — for
// now it just highlights the banner.
function ExpiredAttestationBanner({ count, ids, isSandbox }) {
  const tone = isSandbox
    ? { bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.30)', accent: '#fbbf24', label: 'Advisory' }
    : { bg: 'rgba(239,68,68,0.06)',  border: 'rgba(239,68,68,0.30)',  accent: '#fca5a5', label: 'Blocking' }
  return (
    <div className="rounded-xl px-4 py-3"
      style={{ background: tone.bg, border: `1px solid ${tone.border}` }}>
      <div className="flex items-start gap-2">
        <AlertTriangle size={13} style={{ color: tone.accent }} className="shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-widest mb-1" style={{ color: tone.accent }}>
            Attestation overdue · {tone.label} in {isSandbox ? 'sandbox' : 'production'}
          </p>
          <p className="text-[11px] leading-snug" style={{ color: 'var(--text-secondary)' }}>
            <strong style={{ color: 'var(--text-primary)' }}>{count} {count === 1 ? 'fact needs' : 'facts need'} re-attestation.</strong>{' '}
            {isSandbox
              ? <>Runs will continue in sandbox but governance won't be enforced. Re-attest before promoting to production.</>
              : <>Runs that cite {ids.length === 1 ? 'this fact' : 'these facts'} will <strong>halt at the governance gate</strong> until re-attested. Affected: <ExpiredFactLinks ids={ids} />.</>
            }
          </p>
        </div>
      </div>
    </div>
  )
}

// Inline list of clickable fact IDs in the expired-attestation banner.
// Click scrolls the matching FactRow into view + opens it briefly so the
// user can re-attest without hunting.
function ExpiredFactLinks({ ids }) {
  const onClick = (id) => {
    const row = document.getElementById(`fact-row-${id}`)
    if (!row) return
    row.scrollIntoView({ block: 'center', behavior: 'smooth' })
    // Brief outline pulse to draw the eye.
    row.classList.add('fact-row-pulse')
    setTimeout(() => row.classList.remove('fact-row-pulse'), 1400)
  }
  return (
    <>
      {ids.map((id, i) => (
        <React.Fragment key={id}>
          {i > 0 && ', '}
          <button onClick={() => onClick(id)}
            className="font-mono cursor-pointer hover:underline underline-offset-2 transition-colors"
            style={{ color: '#fca5a5' }}>
            {id}
          </button>
        </React.Fragment>
      ))}
    </>
  )
}

// Collapsed: scannable summary line.
// Expanded: full statement, source documents (with section anchors), lineage
// chain (sandbox → truth → pack), attestation, justification.
function FactRow({ fact }) {
  const [expanded, setExpanded] = useState(false)

  const attestor      = fact.attestation?.attestor
  const attestorRole  = fact.attestation?.attestorRole
  const nextReview    = fact.attestation?.nextReview
  const sourceCount   = fact.sourceDocuments?.length || 0
  const hasFullData   = !!fact.statement   // enrichment present?
  const expired       = isAttestationExpired(fact)
  const overdueDays   = expired ? daysOverdue(fact) : 0

  return (
    <div id={`fact-row-${fact.id}`} className="rounded-lg overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)' }}>
      {/* ── Compact summary row ────────────────────────────────────── */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full px-3 py-2.5 flex items-start gap-2.5 text-left transition-colors cursor-pointer"
        style={{ background: expanded ? 'rgba(255,255,255,0.03)' : 'transparent' }}
        aria-expanded={expanded}
        aria-controls={`fact-detail-${fact.id}`}
      >
        <div className="w-7 h-7 rounded-md flex items-center justify-center shrink-0 mt-0.5"
          style={{
            background: expired ? 'rgba(239,68,68,0.12)' : 'rgba(34,197,94,0.12)',
            border:     `1px solid ${expired ? 'rgba(239,68,68,0.30)' : 'rgba(34,197,94,0.30)'}`,
          }}>
          {expired
            ? <AlertTriangle size={12} style={{ color: '#f87171' }} />
            : <Shield size={12} style={{ color: '#4ade80' }} />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <span className="font-mono text-[10px]" style={{ color: 'var(--text-muted)' }}>{fact.id}</span>
            <p className="text-[12px] font-semibold leading-tight" style={{ color: 'var(--text-primary)' }}>
              {fact.title}
            </p>
            {expired && (
              <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md"
                style={{
                  background: 'rgba(239,68,68,0.16)',
                  color: '#fca5a5',
                  border: '1px solid rgba(239,68,68,0.40)',
                }}>
                <AlertTriangle size={9} /> Review overdue {overdueDays}d
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-[10px] flex-wrap" style={{ color: 'var(--text-muted)' }}>
            {expired ? (
              <span className="inline-flex items-center gap-1" style={{ color: '#f87171' }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#f87171' }} />
                Re-attestation required
              </span>
            ) : (
              <span className="inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#22c55e' }} />
                {fact.status === 'verified' ? 'Verified' : fact.status}
              </span>
            )}
            <span style={{ opacity: 0.4 }}>·</span>
            <span>{fact.confidence}% confidence</span>
            {sourceCount > 0 && <>
              <span style={{ opacity: 0.4 }}>·</span>
              <span>{sourceCount} source {sourceCount === 1 ? 'doc' : 'docs'}</span>
            </>}
            {attestor && <>
              <span style={{ opacity: 0.4 }}>·</span>
              <span>Attested by <strong style={{ color: 'var(--text-secondary)' }}>{attestor}</strong></span>
            </>}
          </div>
        </div>
        <span className="shrink-0 mt-1.5" style={{ color: 'var(--text-muted)' }}>
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </span>
      </button>

      {/* ── Expanded detail ────────────────────────────────────────── */}
      {expanded && (
        <div id={`fact-detail-${fact.id}`} className="px-3 pb-3 space-y-3"
          style={{ borderTop: '1px solid var(--border-subtle)' }}>

          {!hasFullData && (
            <p className="text-[11px] mt-3" style={{ color: 'var(--text-muted)' }}>
              No additional context recorded for this fact.
            </p>
          )}

          {hasFullData && <>
            {/* Verbatim statement */}
            <section className="pt-3">
              <SectionHeader icon={Quote} label="Statement" />
              <p className="text-[12px] leading-relaxed mt-1.5"
                style={{ color: 'var(--text-primary)' }}>
                {fact.statement}
              </p>
            </section>

            {/* Source documents */}
            {sourceCount > 0 && (
              <section>
                <SectionHeader icon={FileText} label={`Source ${sourceCount === 1 ? 'document' : 'documents'} (${sourceCount})`} />
                <div className="mt-1.5 space-y-1">
                  {fact.sourceDocuments.map(srcRef => (
                    <SourceDocRow key={srcRef.id} docRef={srcRef} />
                  ))}
                </div>
              </section>
            )}

            {/* Lineage chain */}
            <section>
              <SectionHeader icon={GitBranch} label="Lineage" />
              <LineageChain
                sandboxClaim={fact.sandboxClaim}
                promotionDate={fact.promotionDate}
                factId={fact.id}
              />
            </section>

            {/* Attestation */}
            {attestor && (
              <section>
                <SectionHeader icon={UserCheck} label="Attestation" />
                <div className="mt-1.5 rounded-md px-2.5 py-2"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)' }}>
                  <p className="text-[11px]" style={{ color: 'var(--text-primary)' }}>
                    <strong>{attestor}</strong>
                    {attestorRole && <span style={{ color: 'var(--text-muted)' }}> · {attestorRole}</span>}
                  </p>
                  <p className="text-[10px] mt-0.5 flex items-center gap-1.5 flex-wrap"
                    style={{ color: 'var(--text-muted)' }}>
                    <Calendar size={9} />
                    Attested {relativeTime(fact.attestation.attestedAt)}
                    {nextReview && <>
                      <span style={{ opacity: 0.4 }}>·</span>
                      {expired ? (
                        <span style={{ color: '#f87171', fontWeight: 600 }}>
                          Next review · OVERDUE {overdueDays}d
                        </span>
                      ) : (
                        <>Next review {relativeTime(nextReview)}</>
                      )}
                    </>}
                    {fact.attestation.cadence && <>
                      <span style={{ opacity: 0.4 }}>·</span>
                      {fact.attestation.cadence}
                    </>}
                  </p>
                </div>
              </section>
            )}

            {/* Why in this pack */}
            {fact.justification && (
              <section>
                <SectionHeader icon={Link2} label="Why this fact is in this pack" />
                <p className="text-[11px] leading-relaxed mt-1.5"
                  style={{ color: 'var(--text-secondary)' }}>
                  {fact.justification}
                </p>
              </section>
            )}
          </>}
        </div>
      )}
    </div>
  )
}

function SectionHeader({ icon: Icon, label }) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon size={10} style={{ color: 'var(--text-muted)' }} />
      <p className="text-[9px] font-bold tracking-widest uppercase"
        style={{ color: 'var(--text-muted)' }}>{label}</p>
    </div>
  )
}

function SourceDocRow({ docRef }) {
  const doc = docRef.doc
  if (!doc) {
    // Reference to a doc we don't have a record for. Render gracefully.
    return (
      <div className="rounded-md px-2.5 py-1.5 text-[11px]"
        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
        <span className="font-mono">{docRef.id}</span> · referenced but not indexed
      </div>
    )
  }
  return (
    <div className="rounded-md px-2.5 py-2 flex items-start gap-2"
      style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.20)' }}>
      <Folder size={10} style={{ color: '#60a5fa' }} className="shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-semibold leading-tight truncate"
          style={{ color: 'var(--text-primary)' }}>
          {doc.title}
        </p>
        <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
          {docRef.section ? <>{docRef.section} · </> : null}
          <span style={{ color: 'var(--text-secondary)' }}>{docRef.role}</span>
          <span style={{ opacity: 0.4 }}> · </span>
          {doc.type?.toUpperCase()}
          {doc.size && <> · {doc.size}</>}
          {doc.owner && <> · {doc.owner}</>}
        </p>
      </div>
    </div>
  )
}

function LineageChain({ sandboxClaim, promotionDate, factId }) {
  // Visual chain:  [Sandbox claim]  →  [Truth fact]  →  [Pack]
  // Skip the Sandbox node when the fact didn't come up through validation
  // (direct-policy facts go straight from source documents to truth).
  return (
    <div className="mt-1.5 space-y-1.5">
      {sandboxClaim ? (
        <>
          <LineageNode
            id={sandboxClaim.id}
            label={sandboxClaim.title}
            sub={`Sandbox · promoted ${relativeTime(promotionDate)}`}
            color="#fbbf24"
            bg="rgba(245,158,11,0.10)"
            border="rgba(245,158,11,0.30)"
            Icon={Database}
          />
          <ChainArrow />
        </>
      ) : (
        <p className="text-[10px] italic" style={{ color: 'var(--text-muted)' }}>
          Direct from source policy — never went through sandbox validation.
        </p>
      )}
      <LineageNode
        id={factId}
        label="Promoted to Truth Plane"
        sub="Governed · visible to scoped agents only"
        color="#4ade80"
        bg="rgba(34,197,94,0.10)"
        border="rgba(34,197,94,0.30)"
        Icon={Shield}
      />
    </div>
  )
}

function LineageNode({ id, label, sub, color, bg, border, Icon }) {
  return (
    <div className="rounded-md px-2.5 py-2 flex items-start gap-2"
      style={{ background: bg, border: `1px solid ${border}` }}>
      <Icon size={10} style={{ color }} className="shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-semibold leading-tight truncate"
          style={{ color: 'var(--text-primary)' }}>
          <span className="font-mono text-[10px] mr-1.5" style={{ color }}>{id}</span>
          {label}
        </p>
        <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{sub}</p>
      </div>
    </div>
  )
}

function ChainArrow() {
  return (
    <div className="flex items-center gap-1 pl-3" style={{ color: 'var(--text-muted)' }}>
      <span className="text-[10px]">↓</span>
      <span className="text-[9px] uppercase tracking-widest">Promoted</span>
    </div>
  )
}

// ── Empty state — no knowledge attached yet ────────────────────────────────
function EmptyState({ onAdd, workflowName, isSandbox }) {
  return (
    <div className="text-center py-10 px-2">
      <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
        style={{
          background: isSandbox ? 'rgba(245,158,11,0.10)' : 'rgba(99,102,241,0.10)',
          border:     `1px solid ${isSandbox ? 'rgba(245,158,11,0.30)' : 'rgba(99,102,241,0.30)'}`,
        }}>
        {isSandbox
          ? <FlaskConical size={22} style={{ color: '#fbbf24' }} />
          : <AlertTriangle size={22} style={{ color: '#c4b5fd' }} />}
      </div>
      <p className="text-base font-semibold mb-1.5" style={{ color: 'var(--text-primary)' }}>
        {isSandbox ? 'Sandbox · no constraint applied' : 'No knowledge constraint yet'}
      </p>
      <p className="text-[12px] leading-relaxed max-w-md mx-auto mb-6" style={{ color: 'var(--text-muted)' }}>
        {isSandbox ? (
          <>
            <strong style={{ color: 'var(--text-secondary)' }}>{workflowName || 'This workflow'}</strong> is running in sandbox — it has free access to the truth plane by design. Attach a pack to preview what production enforcement would look like before promoting.
          </>
        ) : (
          <>
            <strong style={{ color: 'var(--text-secondary)' }}>{workflowName || 'This workflow'}</strong> currently sees <strong style={{ color: 'var(--text-secondary)' }}>every fact</strong> in the truth plane. Add a constraint to scope what it can use, or add tribal knowledge that isn't in the plane yet.
          </>
        )}
      </p>
      <button onClick={onAdd}
        className="px-5 py-2.5 rounded-xl text-[13px] font-semibold inline-flex items-center gap-2 transition-all hover:brightness-110 cursor-pointer"
        style={{ background: AIMS_GRADIENT, color: '#fff', boxShadow: '0 2px 14px rgba(21,93,252,0.40)' }}
      >
        <Sparkles size={13} /> {isSandbox ? 'Preview a pack constraint' : 'Add knowledge constraint'}
        <ChevronRight size={13} />
      </button>
      <p className="text-[10px] mt-3" style={{ color: 'var(--text-muted)' }}>
        Opens the Copilot — pre-poblated with this workflow's context.
      </p>
    </div>
  )
}

// ── Environment strip (F1.2) ─────────────────────────────────────────────
// Two-pill toggle that flips the workflow between Sandbox and Production.
// Mirrors the Truth/Sandbox Plane model for facts: in production the pack
// is enforced, in sandbox it's advisory. The active pill carries the
// environment color; the inactive one is muted. Below the pills, one line
// of context copy explains what's enforced right now.
function EnvironmentStrip({ environment, env, onChange }) {
  const isSandbox = environment === 'sandbox'
  return (
    <div className="px-5 py-3 shrink-0"
      style={{
        borderBottom: '1px solid var(--border-subtle)',
        background: isSandbox ? 'rgba(245,158,11,0.04)' : 'rgba(34,197,94,0.04)',
      }}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <p className="text-[10px] font-bold tracking-widest uppercase shrink-0"
            style={{ color: 'var(--text-muted)' }}>
            Environment
          </p>
          <div className="inline-flex rounded-lg overflow-hidden shrink-0"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-subtle)' }}>
            <EnvPill
              active={!isSandbox}
              icon={Lock}
              label="Production"
              activeColor="#4ade80"
              activeBg="rgba(34,197,94,0.16)"
              activeBorder="rgba(34,197,94,0.40)"
              onClick={() => onChange?.('production')}
            />
            <EnvPill
              active={isSandbox}
              icon={FlaskConical}
              label="Sandbox"
              activeColor="#fbbf24"
              activeBg="rgba(245,158,11,0.16)"
              activeBorder="rgba(245,158,11,0.40)"
              onClick={() => onChange?.('sandbox')}
              isLast
            />
          </div>
        </div>
      </div>
      <p className="text-[10px] mt-2 leading-snug" style={{ color: 'var(--text-muted)' }}>
        {env.description}
      </p>
    </div>
  )
}

function EnvPill({ active, icon: Icon, label, activeColor, activeBg, activeBorder, onClick, isLast }) {
  return (
    <button onClick={onClick}
      className="px-2.5 py-1.5 text-[11px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
      style={{
        background: active ? activeBg : 'transparent',
        color: active ? activeColor : 'var(--text-muted)',
        // Inner divider between pills only — the last pill gets no border
        // so the parent rounded container doesn't end with a dangling line.
        borderRight: isLast ? 'none' : '1px solid var(--border-subtle)',
      }}>
      <Icon size={11} /> {label}
    </button>
  )
}

// ── Recent runs (F2.2) ────────────────────────────────────────────────────
// Audit log of the last N runs of this workflow + pack pair. Each row
// shows status + env, when it ran, who triggered it, governance event
// summary, and the final recommendation in one line. Click a row to
// expand a small detail block with the halt reason / facts cited list.
function RecentRunsSection({ runs }) {
  return (
    <div style={{ borderTop: '1px solid var(--border-subtle)' }}>
      <div className="px-4 pt-3 pb-1.5">
        <p className="text-[10px] font-bold tracking-widest uppercase"
          style={{ color: 'var(--text-muted)' }}>
          Recent runs · {runs.length} {runs.length === 1 ? 'execution' : 'executions'}
        </p>
        <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
          Chain of custody for every workflow execution gated by this pack.
        </p>
      </div>
      <div className="px-2 pb-2 space-y-1">
        {runs.map(r => <AuditRow key={r.id} run={r} />)}
      </div>
    </div>
  )
}

function AuditRow({ run }) {
  const [expanded, setExpanded] = useState(false)

  // Status palette: success / halted / warn / running.
  const STATUS = {
    success: { color: '#4ade80', bg: 'rgba(34,197,94,0.10)',  border: 'rgba(34,197,94,0.30)',  label: 'Success' },
    halted:  { color: '#f87171', bg: 'rgba(239,68,68,0.10)',  border: 'rgba(239,68,68,0.30)',  label: 'Halted'  },
    warn:    { color: '#fbbf24', bg: 'rgba(245,158,11,0.10)', border: 'rgba(245,158,11,0.30)', label: 'Warning' },
    running: { color: '#60a5fa', bg: 'rgba(59,130,246,0.10)', border: 'rgba(59,130,246,0.30)', label: 'Running' },
  }[run.status] || {
    color: 'var(--text-muted)', bg: 'rgba(255,255,255,0.04)', border: 'var(--border-subtle)', label: run.status,
  }

  const envBadgeStyle = run.environment === 'sandbox'
    ? { color: '#fbbf24', bg: 'rgba(245,158,11,0.10)', border: 'rgba(245,158,11,0.30)' }
    : { color: '#4ade80', bg: 'rgba(34,197,94,0.10)',  border: 'rgba(34,197,94,0.30)'  }

  const gov = run.governanceEvents || { pass: 0, warn: 0, fail: 0 }

  return (
    <div className="rounded-lg overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)' }}>
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full px-3 py-2 flex items-start gap-2.5 text-left transition-colors cursor-pointer"
        aria-expanded={expanded}
      >
        <div className="w-7 h-7 rounded-md flex items-center justify-center shrink-0 mt-0.5"
          style={{ background: STATUS.bg, border: `1px solid ${STATUS.border}` }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: STATUS.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <span className="font-mono text-[10px]" style={{ color: 'var(--text-muted)' }}>{run.id}</span>
            <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md"
              style={{ background: STATUS.bg, color: STATUS.color, border: `1px solid ${STATUS.border}` }}>
              {STATUS.label}
            </span>
            <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md"
              style={{ background: envBadgeStyle.bg, color: envBadgeStyle.color, border: `1px solid ${envBadgeStyle.border}` }}>
              {run.environment === 'sandbox' ? 'Sandbox' : 'Production'}
            </span>
            <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
              v{run.packVersion}
            </span>
          </div>
          <p className="text-[11px] leading-snug" style={{ color: 'var(--text-primary)' }}>
            {run.recommendation}
          </p>
          <div className="flex items-center gap-2 mt-1 text-[10px] flex-wrap" style={{ color: 'var(--text-muted)' }}>
            <span>{relativeTime(run.startedAt)}</span>
            <span style={{ opacity: 0.4 }}>·</span>
            <span>{run.triggeredBy?.label || 'Unknown trigger'}</span>
            <span style={{ opacity: 0.4 }}>·</span>
            <span>{run.latencyMs} ms</span>
            <span style={{ opacity: 0.4 }}>·</span>
            <span>{run.factsCited?.length || 0} cited</span>
            <span style={{ opacity: 0.4 }}>·</span>
            <span><GovBadges gov={gov} /></span>
          </div>
        </div>
        <span className="shrink-0 mt-1.5" style={{ color: 'var(--text-muted)' }}>
          {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        </span>
      </button>
      {expanded && (
        <div className="px-3 pb-3 pt-1 space-y-2"
          style={{ borderTop: '1px solid var(--border-subtle)' }}>
          {run.haltReason && (
            <div className="rounded-md px-2.5 py-2 flex items-start gap-2"
              style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.30)' }}>
              <AlertTriangle size={11} style={{ color: '#f87171' }} className="shrink-0 mt-0.5" />
              <p className="text-[11px]" style={{ color: 'var(--text-primary)' }}>
                <strong style={{ color: '#fca5a5' }}>Halt reason:</strong> {run.haltReason}
              </p>
            </div>
          )}
          <div>
            <p className="text-[9px] font-bold tracking-widest uppercase mb-1"
              style={{ color: 'var(--text-muted)' }}>
              Facts cited ({run.factsCited?.length || 0})
            </p>
            <div className="flex flex-wrap gap-1">
              {(run.factsCited || []).map(id => (
                <span key={id} className="font-mono text-[10px] px-1.5 py-0.5 rounded-md"
                  style={{ background: 'rgba(34,197,94,0.10)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.30)' }}>
                  {id}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Compact pass/warn/fail counter row. Hides zero counts so the line stays
// short in the common all-pass case.
function GovBadges({ gov }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      {gov.pass > 0 && (
        <span style={{ color: '#4ade80' }}>✓ {gov.pass}</span>
      )}
      {gov.warn > 0 && (
        <span style={{ color: '#fbbf24' }}>⚠ {gov.warn}</span>
      )}
      {gov.fail > 0 && (
        <span style={{ color: '#f87171' }}>✕ {gov.fail}</span>
      )}
      {gov.pass === 0 && gov.warn === 0 && gov.fail === 0 && (
        <span>0 gates</span>
      )}
    </span>
  )
}

// Tiny human-readable timestamp. Doesn't need to be precise — mock data only.
function relativeTime(iso) {
  if (!iso) return 'recently'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  const days = Math.floor((Date.now() - d.getTime()) / 86_400_000)
  if (days < 1)   return 'today'
  if (days === 1) return 'yesterday'
  if (days < 7)   return `${days}d ago`
  if (days < 30)  return `${Math.floor(days / 7)}w ago`
  return `${Math.floor(days / 30)}mo ago`
}
