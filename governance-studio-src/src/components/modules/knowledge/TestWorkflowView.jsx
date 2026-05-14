import React, { useEffect, useState, useMemo } from 'react'
import {
  X, Play, BookOpen, ChevronDown, ChevronRight, CheckCircle2, AlertTriangle,
  Loader2, Shield, Zap, Wrench, FileOutput, RotateCcw, Quote, Hash,
  GitCompareArrows, ShieldOff, Minus, TrendingUp, TrendingDown,
  FlaskConical,
} from 'lucide-react'
import {
  testWorkflowInputs, testWorkflowTraceLeadA, testWorkflowComparisonLeadA,
  getTraceForWorkflow, getPackLineage, getPacksForWorkflow,
  isAttestationExpired,
} from '../../../data/mockKnowledge'

// ════════════════════════════════════════════════════════════════════════════
// Test Workflow View
// ────────────────────────────────────────────────────────────────────────────
// Dry-run viewer for a workflow with a knowledge pack attached as a
// constraint. LangSmith-style trace: tree of nested runs on the left,
// detail of the selected step on the right. Each run records facts cited
// from the pack and any governance events triggered.
//
// F1.1 ships with one preset (Lead A — clean pass) and no comparison.
// Compare-without-pack lives in F1.4.
//
// Props:
//   open         — bool, mount/unmount
//   workflowName — string
//   packName     — string, attached pack
//   onClose      — () => void, dismiss; parent collapses slide-out back to
//                  inspection size via postMessage('kc:collapse')
// ════════════════════════════════════════════════════════════════════════════

const AIMS_GRADIENT = 'linear-gradient(135deg,#00C2C2 0%,#155DFC 100%)'

const STATUS_META = {
  success: { color: '#4ade80', bg: 'rgba(34,197,94,0.10)',  border: 'rgba(34,197,94,0.30)',  icon: CheckCircle2,  label: 'Success' },
  running: { color: '#60a5fa', bg: 'rgba(59,130,246,0.10)', border: 'rgba(59,130,246,0.30)', icon: Loader2,       label: 'Running' },
  warn:    { color: '#fbbf24', bg: 'rgba(245,158,11,0.10)', border: 'rgba(245,158,11,0.30)', icon: AlertTriangle, label: 'Warning' },
  error:   { color: '#f87171', bg: 'rgba(239,68,68,0.10)',  border: 'rgba(239,68,68,0.30)',  icon: AlertTriangle, label: 'Error'   },
  pending: { color: '#94a3b8', bg: 'rgba(148,163,184,0.10)', border: 'rgba(148,163,184,0.30)', icon: ChevronRight, label: 'Skipped' },
}

const TYPE_META = {
  Trigger: { color: '#fbbf24', icon: Zap },
  Agent:   { color: '#c4b5fd', icon: Shield },
  Tool:    { color: '#60a5fa', icon: Wrench },
  Output:  { color: '#4ade80', icon: FileOutput },
}

export default function TestWorkflowView({ open, workflowId, workflowName, packName, environment = 'production', onClose }) {
  const isSandboxEnv = environment === 'sandbox'
  const [phase, setPhase]               = useState('idle')       // 'idle' | 'running' | 'complete'
  const [selectedStepId, setSelected]   = useState(null)
  const [expanded, setExpanded]         = useState(() => new Set())  // step ids whose children are open
  // F1.4 — show "what if no pack?" delta.
  // F1.2 v2: in sandbox, this defaults to true because a sandbox run IS
  // conceptually the "without pack" run (no enforcement). Compare panel
  // gives the user the meaningful contrast immediately.
  const [compareMode, setCompareMode]   = useState(isSandboxEnv)

  // ESC closes the test view. Parent listens for the collapse postMessage.
  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') onClose?.() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  // F1.2 v2: when the workflow env flips to sandbox, auto-open the compare
  // panel. A sandbox run is conceptually the same as a "without pack" run,
  // so surfacing the comparison immediately tells the user what they're
  // actually looking at. The user can still toggle it off manually.
  useEffect(() => {
    if (isSandboxEnv) setCompareMode(true)
  }, [isSandboxEnv])

  // F1.5 — detect whether the workflow's pack has any fact with expired
  // attestation. If yes, the Test viewer picks a different trace variant:
  //   - production env → trace halts at the offending step (fail closed)
  //   - sandbox env    → trace warns but completes (advisory)
  const hasExpiredAttestation = (getPacksForWorkflow(workflowId) || [])
    .some(p => (getPackLineage(p.id)?.items || []).some(isAttestationExpired))

  // D6: per-workflow trace lookup. Falls back to null when this workflow
  // has no dry-run mock — the body then renders a NoTraceState so the user
  // sees a clear "not available yet" message instead of an empty trace.
  const trace = getTraceForWorkflow(workflowId, {
    env: environment,
    hasExpiredAttestation,
  }) || testWorkflowTraceLeadA
  const hasTrace = !!getTraceForWorkflow(workflowId, {
    env: environment,
    hasExpiredAttestation,
  })
  const input = testWorkflowInputs.leadA

  // Auto-expand and select the most relevant step when the run completes.
  // Prefer a failed/warn step (likely what the user wants to inspect first);
  // fall back to the first Agent step on a clean pass so the detail panel
  // isn't empty. Declared AFTER `trace` so it doesn't hit TDZ at render.
  useEffect(() => {
    if (phase !== 'complete') return
    const failedStep = trace.steps.find(s => s.status === 'error' || s.status === 'warn')
    const target = failedStep || trace.steps.find(s => s.type === 'Agent')
    if (target) {
      setExpanded(prev => new Set([...prev, target.id]))
      setSelected(target.id)
    }
  }, [phase, trace])

  // Flatten the trace tree for selection lookup. Must be declared before
  // any conditional return — hooks must run on every render.
  const stepIndex = useMemo(() => {
    const m = new Map()
    const walk = (steps, parentId = null) => {
      for (const s of steps) {
        m.set(s.id, { ...s, parentId })
        if (s.children?.length) walk(s.children, s.id)
      }
    }
    walk(trace.steps)
    return m
  }, [trace])

  if (!open) return null

  const runDryRun = () => {
    setPhase('running')
    // Simulate latency. 1.5s is enough to feel real without blocking the demo.
    setTimeout(() => setPhase('complete'), 1500)
  }

  const reset = () => {
    setPhase('idle')
    setSelected(null)
    setExpanded(new Set())
  }

  const selectedStep = selectedStepId ? stepIndex.get(selectedStepId) : null

  return (
    <div
      role="region"
      aria-labelledby="twv-title"
      className="flex flex-col w-full h-full overflow-hidden"
      style={{ background: 'var(--bg-base, #0b1220)' }}
    >
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="px-5 py-4 flex items-start justify-between gap-3 shrink-0"
        style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: AIMS_GRADIENT }}>
            <Play size={17} color="#fff" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold tracking-widest uppercase mb-0.5"
              style={{ color: isSandboxEnv ? '#fbbf24' : 'var(--text-muted)' }}>
              {isSandboxEnv ? 'Test workflow · Sandbox' : 'Test workflow'}
            </p>
            <p id="twv-title" className="text-base font-semibold leading-tight truncate"
              style={{ color: 'var(--text-primary)' }}>
              {workflowName || 'Workflow'}
            </p>
            <p className="text-[11px] mt-0.5 flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
              <BookOpen size={10} />
              {isSandboxEnv ? (
                <>Pack is <strong style={{ color: '#fbbf24' }}>advisory</strong> — no enforcement</>
              ) : (
                <>Constrained by <strong style={{ color: 'var(--text-secondary)' }}>{packName || 'attached pack'}</strong></>
              )}
              <span style={{ opacity: 0.4 }}>·</span>
              Dry-run · no side effects
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {phase === 'complete' && (
            <>
              <button onClick={() => setCompareMode(v => !v)}
                title="Show what this run would look like without the pack constraint"
                className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                style={{
                  background: compareMode ? 'rgba(43,127,255,0.16)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${compareMode ? 'rgba(43,127,255,0.40)' : 'var(--border-subtle)'}`,
                  color: compareMode ? '#80AFFF' : 'var(--text-secondary)',
                }}>
                <GitCompareArrows size={11} /> Compare without pack
              </button>
              <button onClick={reset}
                className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                <RotateCcw size={11} /> Run again
              </button>
            </>
          )}
          <button onClick={onClose} aria-label="Close"
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
            <X size={14} />
          </button>
        </div>
      </div>

      {/* ── Body ───────────────────────────────────────────────────── */}
      {!hasTrace ? (
        <NoTraceState workflowName={workflowName} />
      ) : phase === 'idle' ? (
        <IdleState input={input} onRun={runDryRun} packName={packName} isSandboxEnv={isSandboxEnv} />
      ) : phase === 'running' ? (
        <RunningState input={input} isSandboxEnv={isSandboxEnv} />
      ) : (
        <TraceLayout
          trace={trace}
          input={input}
          selectedStep={selectedStep}
          onSelectStep={setSelected}
          expanded={expanded}
          onToggle={(id) => setExpanded(prev => {
            const next = new Set(prev)
            next.has(id) ? next.delete(id) : next.add(id)
            return next
          })}
          compareMode={compareMode}
          isSandboxEnv={isSandboxEnv}
        />
      )}
    </div>
  )
}

// ── Idle: input preview + Run button ──────────────────────────────────────
function IdleState({ input, onRun, packName, isSandboxEnv }) {
  return (
    <div className="flex-1 overflow-y-auto px-5 py-6 min-h-0">
      <div className="max-w-2xl mx-auto space-y-5">
        <div>
          <p className="text-[10px] font-bold tracking-widest uppercase mb-2"
            style={{ color: 'var(--text-muted)' }}>Sample input</p>
          <InputCard input={input} />
        </div>

        {isSandboxEnv ? (
          <div className="rounded-xl px-4 py-3 flex items-start gap-2.5"
            style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.30)' }}>
            <FlaskConical size={13} style={{ color: '#fbbf24' }} className="shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              <strong style={{ color: '#fbbf24' }}>Sandbox dry-run.</strong> The workflow runs with <strong>full truth-plane access</strong> — {packName || 'the attached pack'} is advisory only and won't be enforced. Compare the panel on the right to see the cost vs production.
            </p>
          </div>
        ) : (
          <div className="rounded-xl px-4 py-3 flex items-start gap-2.5"
            style={{ background: 'rgba(43,127,255,0.06)', border: '1px solid rgba(43,127,255,0.20)' }}>
            <Shield size={13} style={{ color: '#80AFFF' }} className="shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              The dry-run executes against the workflow with <strong>{packName || 'the attached pack'}</strong> applied as a
              constraint. The trace below will show each step, every truth fact cited from the pack, and any governance event
              triggered — without writing to CRM or sending email.
            </p>
          </div>
        )}

        <button onClick={onRun}
          className="w-full py-3 rounded-xl text-[13px] font-semibold flex items-center justify-center gap-2 transition-all hover:brightness-110 cursor-pointer"
          style={{
            background: isSandboxEnv
              ? 'linear-gradient(135deg,#f59e0b 0%,#d97706 100%)'
              : AIMS_GRADIENT,
            color: '#fff',
            boxShadow: isSandboxEnv
              ? '0 2px 14px rgba(245,158,11,0.40)'
              : '0 2px 14px rgba(21,93,252,0.40)',
          }}>
          <Play size={13} /> {isSandboxEnv ? 'Run sandbox dry-run' : 'Run dry-run with this pack'}
        </button>
      </div>
    </div>
  )
}

// ── No-trace state — workflow has no dry-run mock yet (D6) ────────────────
// Honest empty state: not every workflow ships with a hand-authored trace.
// Tells the user clearly that this is a future capability rather than
// silently rendering the wrong workflow's data.
function NoTraceState({ workflowName }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-5 py-10 min-h-0 text-center">
      <div className="w-14 h-14 rounded-2xl mb-4 flex items-center justify-center"
        style={{ background: 'rgba(99,102,241,0.10)', border: '1px solid rgba(99,102,241,0.30)' }}>
        <AlertTriangle size={22} style={{ color: '#c4b5fd' }} />
      </div>
      <p className="text-base font-semibold mb-1.5" style={{ color: 'var(--text-primary)' }}>
        No dry-run trace available yet
      </p>
      <p className="text-[12px] leading-relaxed max-w-md" style={{ color: 'var(--text-muted)' }}>
        Sample dry-runs aren't authored for <strong style={{ color: 'var(--text-secondary)' }}>{workflowName || 'this workflow'}</strong> in
        this prototype. Customer Renewal Pipeline (Lead A) is the reference case — open it from the workflow list to see the full
        trace + governance demo.
      </p>
    </div>
  )
}

// ── Running: spinner + animated step list ─────────────────────────────────
function RunningState({ input, isSandboxEnv }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-5 py-10 min-h-0">
      <Loader2 size={28} className="animate-spin mb-4"
        style={{ color: isSandboxEnv ? '#fbbf24' : '#80AFFF' }} />
      <p className="text-[13px] font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
        {isSandboxEnv ? 'Running sandbox dry-run…' : 'Running dry-run…'}
      </p>
      <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
        Executing <strong>{input.title}</strong> {isSandboxEnv ? 'without pack enforcement' : 'with pack constraints applied'}.
      </p>
    </div>
  )
}

// ── Trace layout: tree on the left, detail on the right ───────────────────
function TraceLayout({ trace, input, selectedStep, onSelectStep, expanded, onToggle, compareMode, isSandboxEnv }) {
  return (
    <div className="flex-1 flex min-h-0 overflow-hidden">
      {/* Tree ──────────────────────────────────────────────────────── */}
      <div className="w-[36%] overflow-y-auto"
        style={{ borderRight: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.01)' }}>
        <RunSummary trace={trace} isSandboxEnv={isSandboxEnv} />
        <div className="px-2 py-2">
          {trace.steps.map(step => (
            <StepNode
              key={step.id}
              step={step}
              depth={0}
              selectedId={selectedStep?.id}
              onSelect={onSelectStep}
              expanded={expanded}
              onToggle={onToggle}
            />
          ))}
        </div>
      </div>

      {/* Detail (+ optional comparison panel on top) ──────────────── */}
      <div className="flex-1 overflow-y-auto px-5 py-5 min-h-0 space-y-5">
        {isSandboxEnv && (
          <SandboxBanner />
        )}
        {compareMode && <ComparisonPanel data={testWorkflowComparisonLeadA} />}
        {selectedStep ? (
          <StepDetail step={selectedStep} />
        ) : (
          <RunOverview trace={trace} input={input} />
        )}
      </div>
    </div>
  )
}

// Sandbox banner shown above the detail panel when env=sandbox. Reinforces
// that the trace below reflects an unenforced run — even though the trace
// data is the same mock, the *meaning* in sandbox is different.
function SandboxBanner() {
  return (
    <div className="rounded-xl px-4 py-3 flex items-start gap-2"
      style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.30)' }}>
      <FlaskConical size={12} style={{ color: '#fbbf24' }} className="shrink-0 mt-0.5" />
      <p className="text-[11px] leading-snug" style={{ color: 'var(--text-secondary)' }}>
        <strong style={{ color: '#fbbf24' }}>Sandbox run.</strong> Governance gates in this trace are advisory — the workflow
        would have run identically without them. Promote the workflow to production for real enforcement and audit logging.
      </p>
    </div>
  )
}

// ── Comparison panel: with-pack vs without-pack deltas ────────────────────
// Pedagogical view. Shows the *cost* (latency, noise) and *risk* (missing
// governance gates) of running the same workflow without the pack
// constraint. Not a full parallel trace — just the differences that matter.
function ComparisonPanel({ data }) {
  const { withPack, withoutPack, contextBleedFacts, missingGovernanceGates } = data

  const deltaLatency  = withoutPack.latencyMs - withPack.latencyMs
  const deltaLatencyPct = Math.round((deltaLatency / withPack.latencyMs) * 100)
  const deltaCited    = withoutPack.factsCited - withPack.factsCited
  const deltaGov      = withPack.governanceEvents - withoutPack.governanceEvents

  return (
    <section className="rounded-xl overflow-hidden"
      style={{ border: '1px solid rgba(43,127,255,0.30)', background: 'rgba(43,127,255,0.04)' }}>
      <header className="px-4 py-3 flex items-center gap-2"
        style={{ borderBottom: '1px solid rgba(43,127,255,0.20)' }}>
        <GitCompareArrows size={12} style={{ color: '#80AFFF' }} />
        <p className="text-[10px] font-bold tracking-widest uppercase" style={{ color: '#80AFFF' }}>
          What if no pack?
        </p>
      </header>

      {/* Side-by-side summary stats */}
      <div className="grid grid-cols-2 gap-px"
        style={{ background: 'var(--border-subtle)' }}>
        <CompareColumn
          label="With pack"
          accent="#4ade80"
          stats={[
            { label: 'Facts in scope',  value: withPack.factsAvailable.toLocaleString() },
            { label: 'Facts cited',     value: withPack.factsCited },
            { label: 'Governance gates', value: withPack.governanceEvents },
            { label: 'Latency',          value: `${withPack.latencyMs} ms` },
          ]}
        />
        <CompareColumn
          label="Without pack"
          accent="#f87171"
          stats={[
            { label: 'Facts in scope',  value: withoutPack.factsAvailable.toLocaleString() },
            { label: 'Facts cited',     value: withoutPack.factsCited, delta: `+${deltaCited}` },
            { label: 'Governance gates', value: withoutPack.governanceEvents, delta: `-${deltaGov}`, deltaNegative: true },
            { label: 'Latency',          value: `${withoutPack.latencyMs} ms`, delta: `+${deltaLatencyPct}%`, deltaNegative: true },
          ]}
        />
      </div>

      {/* Final recommendation comparison */}
      {withPack.recommendation === withoutPack.recommendation && (
        <div className="px-4 py-2.5 flex items-start gap-2"
          style={{ background: 'rgba(255,255,255,0.02)', borderTop: '1px solid var(--border-subtle)' }}>
          <Minus size={11} style={{ color: 'var(--text-muted)' }} className="shrink-0 mt-0.5" />
          <p className="text-[11px] leading-snug" style={{ color: 'var(--text-secondary)' }}>
            <strong>Same final recommendation</strong> for this lead — but only because Lead A is a clean pass.
            The cost is paid in <strong>extra context bleed</strong> and <strong>weaker governance</strong>, surfaced below.
          </p>
        </div>
      )}

      {/* Context bleed list */}
      {contextBleedFacts?.length > 0 && (
        <div className="px-4 py-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
          <div className="flex items-center gap-1.5 mb-2">
            <TrendingUp size={10} style={{ color: '#fbbf24' }} />
            <p className="text-[9px] font-bold tracking-widest uppercase" style={{ color: '#fbbf24' }}>
              Context bleed ({contextBleedFacts.length} extra facts cited)
            </p>
          </div>
          <p className="text-[10px] mb-2" style={{ color: 'var(--text-muted)' }}>
            Truth-plane facts the model picked up without the pack — irrelevant to this workflow but consumed context.
          </p>
          <div className="space-y-1">
            {contextBleedFacts.map(f => (
              <div key={f.id} className="rounded-md px-2.5 py-1.5"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)' }}>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-mono text-[10px]" style={{ color: '#fbbf24' }}>{f.id}</span>
                  <span className="text-[11px] font-semibold" style={{ color: 'var(--text-primary)' }}>{f.title}</span>
                </div>
                <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{f.irrelevanceNote}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Missing governance gates */}
      {missingGovernanceGates?.length > 0 && (
        <div className="px-4 py-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
          <div className="flex items-center gap-1.5 mb-2">
            <ShieldOff size={10} style={{ color: '#f87171' }} />
            <p className="text-[9px] font-bold tracking-widest uppercase" style={{ color: '#f87171' }}>
              Missing governance gates
            </p>
          </div>
          <div className="space-y-1.5">
            {missingGovernanceGates.map(g => (
              <div key={g.factId} className="rounded-md px-2.5 py-2"
                style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.30)' }}>
                <div className="flex items-center gap-2 mb-1">
                  <ShieldOff size={11} style={{ color: '#f87171' }} className="shrink-0" />
                  <span className="font-mono text-[10px]" style={{ color: '#fca5a5' }}>{g.factId}</span>
                  <span className="text-[11px] font-semibold" style={{ color: 'var(--text-primary)' }}>{g.label}</span>
                </div>
                <p className="text-[10px] leading-snug" style={{ color: 'var(--text-secondary)' }}>
                  <strong style={{ color: '#fca5a5' }}>If removed:</strong> {g.consequenceIfMissing}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}

function CompareColumn({ label, accent, stats }) {
  return (
    <div className="px-4 py-3"
      style={{ background: 'rgba(15,23,42,0.40)' }}>
      <p className="text-[9px] font-bold tracking-widest uppercase mb-2" style={{ color: accent }}>
        {label}
      </p>
      <div className="space-y-1.5">
        {stats.map(s => (
          <div key={s.label} className="flex items-baseline justify-between gap-2">
            <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{s.label}</span>
            <span className="text-[12px] font-bold tabular-nums inline-flex items-baseline gap-1"
              style={{ color: 'var(--text-primary)' }}>
              {s.value}
              {s.delta && (
                <span className="text-[10px]"
                  style={{ color: s.deltaNegative ? '#f87171' : '#fbbf24' }}>
                  {s.delta}
                </span>
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function RunSummary({ trace, isSandboxEnv }) {
  // F1.5 — total run state drives top-of-tree color + label. Error overrides
  // sandbox styling because a halted run is the dominant signal.
  const isError = trace.status === 'error'
  const isWarn  = trace.status === 'warn'

  const color = isError ? '#f87171'
              : isWarn  ? '#fbbf24'
              : isSandboxEnv ? '#fbbf24'
              : '#4ade80'
  const bg = isError ? 'rgba(239,68,68,0.06)'
           : isWarn  ? 'rgba(245,158,11,0.06)'
           : isSandboxEnv ? 'rgba(245,158,11,0.04)'
           : 'rgba(34,197,94,0.04)'
  const Icon = (isError || isWarn) ? AlertTriangle
             : isSandboxEnv ? FlaskConical
             : CheckCircle2
  const label = isError ? 'Run halted'
              : isWarn  ? 'Run completed with warnings'
              : isSandboxEnv ? 'Sandbox run complete'
              : 'Run complete'

  return (
    <div className="px-4 py-3"
      style={{ borderBottom: '1px solid var(--border-subtle)', background: bg }}>
      <div className="flex items-center gap-2 mb-1">
        <Icon size={12} style={{ color }} />
        <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color }}>
          {label}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2 mt-2">
        <SummaryStat label="Latency" value={`${trace.totalLatencyMs} ms`} />
        <SummaryStat
          label={isError ? 'Facts before halt' : isSandboxEnv ? 'Facts would-cite' : 'Facts used'}
          value={
            // Drop the X/Y denominator unless we actually blocked something —
            // showing "3/3" with no blocked facts adds noise without meaning.
            (trace.factsBlocked?.length || 0) > 0
              ? `${trace.factsUsed.length} / ${trace.factsUsed.length + trace.factsBlocked.length}`
              : `${trace.factsUsed.length}`
          }
        />
      </div>
    </div>
  )
}

function SummaryStat({ label, value }) {
  return (
    <div className="rounded-md px-2 py-1.5"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)' }}>
      <p className="text-[9px] uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>{label}</p>
      <p className="text-[13px] font-bold tabular-nums leading-tight" style={{ color: 'var(--text-primary)' }}>{value}</p>
    </div>
  )
}

// Recursive node — LangSmith style: indent per depth, chevron when has
// children, status icon, type label, latency. Click selects + expands.
function StepNode({ step, depth, selectedId, onSelect, expanded, onToggle }) {
  const hasChildren = (step.children?.length || 0) > 0
  const isExpanded  = expanded.has(step.id)
  const isSelected  = selectedId === step.id
  const status      = STATUS_META[step.status] || STATUS_META.pending
  const type        = TYPE_META[step.type]     || TYPE_META.Tool
  const StatusIcon  = status.icon
  const TypeIcon    = type.icon

  return (
    <div>
      <button
        onClick={() => {
          onSelect(step.id)
          if (hasChildren) onToggle(step.id)
        }}
        className="w-full flex items-start gap-1.5 py-1.5 px-2 rounded-md text-left transition-colors cursor-pointer"
        style={{
          background: isSelected ? 'rgba(43,127,255,0.10)' : 'transparent',
          border: `1px solid ${isSelected ? 'rgba(43,127,255,0.35)' : 'transparent'}`,
          marginLeft: depth * 12,
        }}
      >
        <span className="shrink-0 w-3.5 flex justify-center mt-0.5" style={{ color: 'var(--text-muted)' }}>
          {hasChildren ? (isExpanded ? <ChevronDown size={11} /> : <ChevronRight size={11} />) : null}
        </span>
        <StatusIcon size={11}
          className={step.status === 'running' ? 'animate-spin shrink-0 mt-0.5' : 'shrink-0 mt-0.5'}
          style={{ color: status.color }} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <TypeIcon size={10} style={{ color: type.color }} className="shrink-0" />
            <span className="text-[10px] font-bold uppercase tracking-wider shrink-0" style={{ color: type.color }}>{step.type}</span>
            <span className="text-[11px] font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{step.name}</span>
          </div>
          <div className="flex items-center gap-2 mt-0.5 text-[10px]" style={{ color: 'var(--text-muted)' }}>
            <span className="tabular-nums">{step.latencyMs} ms</span>
            {step.factsCited?.length > 0 && <>
              <span style={{ opacity: 0.4 }}>·</span>
              <span><Quote size={8} className="inline mr-0.5" />{step.factsCited.length} cited</span>
            </>}
            {step.governanceEvents?.length > 0 && <>
              <span style={{ opacity: 0.4 }}>·</span>
              <span style={{ color: '#fbbf24' }}>{step.governanceEvents.length} gov</span>
            </>}
          </div>
        </div>
      </button>
      {hasChildren && isExpanded && (
        <div>
          {step.children.map(child => (
            <StepNode key={child.id} step={child} depth={depth + 1}
              selectedId={selectedId} onSelect={onSelect}
              expanded={expanded} onToggle={onToggle} />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Detail panel ──────────────────────────────────────────────────────────
function StepDetail({ step }) {
  const status = STATUS_META[step.status] || STATUS_META.pending
  const type   = TYPE_META[step.type]     || TYPE_META.Tool
  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded"
            style={{ background: 'rgba(255,255,255,0.06)', color: type.color, border: `1px solid ${type.color}40` }}>
            {step.type}
          </span>
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold"
            style={{ color: status.color }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: status.color }} />
            {status.label}
          </span>
          <span className="text-[10px] tabular-nums" style={{ color: 'var(--text-muted)' }}>
            {step.latencyMs} ms
          </span>
        </div>
        <p className="text-[14px] font-semibold" style={{ color: 'var(--text-primary)' }}>
          {step.name}
        </p>
      </div>

      {/* Governance events */}
      {step.governanceEvents?.length > 0 && (
        <DetailSection title={`Governance events (${step.governanceEvents.length})`} icon={Shield}>
          <div className="space-y-1.5">
            {step.governanceEvents.map((ev, i) => (
              <GovernanceRow key={i} ev={ev} />
            ))}
          </div>
        </DetailSection>
      )}

      {/* Facts cited from pack */}
      {step.factsCited?.length > 0 && (
        <DetailSection title={`Facts cited from pack (${step.factsCited.length})`} icon={Quote}>
          <div className="flex flex-wrap gap-1.5">
            {step.factsCited.map(id => (
              <span key={id} className="font-mono text-[10px] px-2 py-1 rounded-md inline-flex items-center gap-1"
                style={{ background: 'rgba(34,197,94,0.10)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.30)' }}>
                <Hash size={8} />{id}
              </span>
            ))}
          </div>
        </DetailSection>
      )}

      {/* Input */}
      {step.input && Object.keys(step.input).length > 0 && (
        <DetailSection title="Input" icon={null}>
          <DataPanel data={step.input} />
        </DetailSection>
      )}

      {/* Output */}
      {step.output && Object.keys(step.output).length > 0 && (
        <DetailSection title="Output" icon={null}>
          <DataPanel data={step.output} />
        </DetailSection>
      )}
    </div>
  )
}

function DetailSection({ title, icon: Icon, children }) {
  return (
    <section>
      <div className="flex items-center gap-1.5 mb-2">
        {Icon && <Icon size={10} style={{ color: 'var(--text-muted)' }} />}
        <p className="text-[9px] font-bold tracking-widest uppercase"
          style={{ color: 'var(--text-muted)' }}>{title}</p>
      </div>
      {children}
    </section>
  )
}

function GovernanceRow({ ev }) {
  const map = {
    pass: { bg: 'rgba(34,197,94,0.08)',  border: 'rgba(34,197,94,0.30)',  color: '#4ade80', icon: CheckCircle2 },
    fail: { bg: 'rgba(239,68,68,0.08)',  border: 'rgba(239,68,68,0.30)',  color: '#f87171', icon: AlertTriangle },
    info: { bg: 'rgba(99,102,241,0.08)', border: 'rgba(99,102,241,0.30)', color: '#a5b4fc', icon: Shield },
    warn: { bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.30)', color: '#fbbf24', icon: AlertTriangle },
  }[ev.result] || { bg: 'rgba(255,255,255,0.04)', border: 'var(--border-subtle)', color: 'var(--text-secondary)', icon: Shield }
  const Icon = map.icon
  return (
    <div className="rounded-md px-2.5 py-2 flex items-start gap-2"
      style={{ background: map.bg, border: `1px solid ${map.border}` }}>
      <Icon size={11} style={{ color: map.color }} className="shrink-0 mt-0.5" />
      <p className="text-[11px] leading-snug" style={{ color: 'var(--text-primary)' }}>
        {ev.message}
      </p>
    </div>
  )
}

function CodeBlock({ data }) {
  return (
    <pre className="rounded-md px-3 py-2 text-[10px] overflow-x-auto max-h-[260px]"
      style={{
        background: 'rgba(0,0,0,0.35)',
        border: '1px solid var(--border-subtle)',
        color: 'var(--text-secondary)',
        fontFamily: 'ui-monospace, SFMono-Regular, monospace',
      }}>
      {JSON.stringify(data, null, 2)}
    </pre>
  )
}

// ── DataPanel ─────────────────────────────────────────────────────────────
// Two-view wrapper for Input/Output blocks. Structured (default) renders the
// payload as human-friendly key/value rows with type-aware formatting; Raw
// drops to JSON for power users / debug. Per-block state — independent
// toggles let you read structured Input + raw Output simultaneously.
function DataPanel({ data }) {
  const [view, setView] = useState('structured')   // 'structured' | 'raw'
  const isEmpty = data === null || data === undefined ||
    (typeof data === 'object' && Object.keys(data).length === 0)

  return (
    <div>
      <div className="flex justify-end mb-1.5">
        <div className="inline-flex rounded-md overflow-hidden"
          style={{ border: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.02)' }}>
          <ViewPill active={view === 'structured'} onClick={() => setView('structured')}>Structured</ViewPill>
          <ViewPill active={view === 'raw'}        onClick={() => setView('raw')}>Raw</ViewPill>
        </div>
      </div>
      {isEmpty ? (
        <p className="text-[11px] italic px-3 py-2 rounded-md"
          style={{ color: 'var(--text-muted)', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)' }}>
          (empty)
        </p>
      ) : view === 'structured'
        ? <StructuredRenderer data={data} />
        : <CodeBlock data={data} />
      }
    </div>
  )
}

function ViewPill({ active, onClick, children }) {
  return (
    <button onClick={onClick}
      className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest transition-colors cursor-pointer"
      style={{
        background: active ? 'rgba(43,127,255,0.16)' : 'transparent',
        color: active ? '#80AFFF' : 'var(--text-muted)',
        borderRight: '1px solid var(--border-subtle)',
      }}>
      {children}
    </button>
  )
}

// ── StructuredRenderer ────────────────────────────────────────────────────
// Generic, type-aware payload renderer. Walks the data tree and chooses a
// presentation per node based on shape + key hints:
//   - object             → vertical key/value rows
//   - nested object      → indented sub-card
//   - array of strings   → inline chips
//   - array of objects   → vertical list of sub-cards
//   - boolean            → ● Yes / ○ No badge with color
//   - number + _usd/_pct/_days/_ms key → unit-aware formatting
//   - string + _id key   → monospace
//   - long string        → prose
// Falls back gracefully on unknown shapes.
function StructuredRenderer({ data, depth = 0 }) {
  if (data === null || data === undefined) {
    return <span className="text-[11px] italic" style={{ color: 'var(--text-muted)' }}>—</span>
  }
  if (Array.isArray(data)) return <ArrayRender items={data} depth={depth} />
  if (typeof data === 'object') return <ObjectRender obj={data} depth={depth} />
  return <PrimitiveValue value={data} />
}

function ObjectRender({ obj, depth }) {
  const entries = Object.entries(obj)
  if (entries.length === 0) {
    return <span className="text-[11px] italic" style={{ color: 'var(--text-muted)' }}>(empty)</span>
  }
  return (
    <div className="rounded-md overflow-hidden"
      style={{
        background: depth === 0 ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.03)',
        border: '1px solid var(--border-subtle)',
      }}>
      {entries.map(([k, v], i) => (
        <div key={k}
          className="flex items-start gap-3 px-3 py-1.5"
          style={{ borderTop: i === 0 ? 'none' : '1px solid var(--border-subtle)' }}>
          <span className="text-[10px] font-semibold shrink-0 mt-0.5"
            style={{ color: 'var(--text-muted)', minWidth: '110px', maxWidth: '160px' }}
            title={k}>
            {formatKey(k)}
          </span>
          <div className="flex-1 min-w-0 text-[11px]" style={{ color: 'var(--text-primary)' }}>
            <ValueRender value={v} keyHint={k} depth={depth + 1} />
          </div>
        </div>
      ))}
    </div>
  )
}

function ValueRender({ value, keyHint, depth }) {
  if (value === null || value === undefined) {
    return <span className="italic" style={{ color: 'var(--text-muted)' }}>—</span>
  }
  if (typeof value === 'boolean')  return <BoolBadge value={value} keyHint={keyHint} />
  if (typeof value === 'number')   return <NumberValue value={value} keyHint={keyHint} />
  if (typeof value === 'string')   return <StringValue value={value} keyHint={keyHint} />
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return <span className="italic" style={{ color: 'var(--text-muted)' }}>(none)</span>
    }
    const allStrings = value.every(v => typeof v === 'string')
    if (allStrings) return <ChipList items={value} keyHint={keyHint} />
    return (
      <div className="space-y-1">
        {value.map((item, i) => (
          <div key={i}>
            <StructuredRenderer data={item} depth={depth} />
          </div>
        ))}
      </div>
    )
  }
  if (typeof value === 'object') return <StructuredRenderer data={value} depth={depth} />
  return <PrimitiveValue value={value} />
}

function ArrayRender({ items, depth }) {
  if (items.length === 0) {
    return <span className="italic" style={{ color: 'var(--text-muted)' }}>(empty)</span>
  }
  const allStrings = items.every(v => typeof v === 'string')
  if (allStrings) return <ChipList items={items} />
  return (
    <div className="space-y-1.5">
      {items.map((item, i) => (
        <StructuredRenderer key={i} data={item} depth={depth + 1} />
      ))}
    </div>
  )
}

function BoolBadge({ value, keyHint }) {
  // For verbs like "qualified", "passed", "confirmed", reuse pass/fail palette.
  const positive = value === true
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded"
      style={{
        background: positive ? 'rgba(34,197,94,0.10)' : 'rgba(148,163,184,0.10)',
        color:      positive ? '#4ade80' : '#94a3b8',
        border:     `1px solid ${positive ? 'rgba(34,197,94,0.30)' : 'rgba(148,163,184,0.30)'}`,
      }}>
      <span className="w-1.5 h-1.5 rounded-full"
        style={{ background: positive ? '#22c55e' : '#64748b' }} />
      {positive ? 'Yes' : 'No'}
    </span>
  )
}

function NumberValue({ value, keyHint }) {
  // Key-suffix-driven unit formatting. Keeps the renderer generic without
  // requiring per-step custom code for common patterns.
  const k = keyHint?.toLowerCase() || ''
  let formatted = value.toLocaleString('en-US')
  if (k.endsWith('_usd')   || k === 'arr' || k.includes('value_usd') || k.endsWith('_revenue')) {
    formatted = '$' + value.toLocaleString('en-US')
  } else if (k.endsWith('_pct') || k.includes('percent') || k.endsWith('_rate')) {
    formatted = value + '%'
  } else if (k.endsWith('_days') || k === 'days') {
    formatted = value + (value === 1 ? ' day' : ' days')
  } else if (k.endsWith('_ms') || k === 'latencyms') {
    formatted = value.toLocaleString('en-US') + ' ms'
  } else if (k.endsWith('_count') || k === 'employees') {
    formatted = value.toLocaleString('en-US')
  } else if (k === 'score' && value >= 0 && value <= 1) {
    formatted = (value * 100).toFixed(0) + '%'
  }
  return <span className="tabular-nums" style={{ color: 'var(--text-primary)' }}>{formatted}</span>
}

function StringValue({ value, keyHint }) {
  const k = keyHint?.toLowerCase() || ''
  // ID-like keys get monospace treatment for legibility / copy-paste.
  if (k.endsWith('_id') || k === 'id' || /^[A-Z]{2,5}-\d+/.test(value)) {
    return <span className="font-mono text-[10px] px-1.5 py-0.5 rounded"
      style={{ background: 'rgba(255,255,255,0.04)', color: 'var(--text-secondary)' }}>{value}</span>
  }
  // ISO timestamps → render compact local.
  if (k.endsWith('_at') && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
    try {
      const d = new Date(value)
      if (!Number.isNaN(d.getTime())) {
        return <span className="tabular-nums">{d.toLocaleString()}</span>
      }
    } catch {}
  }
  // Long prose: render in its own line for readability.
  if (value.length > 80) {
    return <span className="leading-relaxed block" style={{ color: 'var(--text-primary)' }}>{value}</span>
  }
  return <span style={{ color: 'var(--text-primary)' }}>{value}</span>
}

function ChipList({ items }) {
  return (
    <div className="flex flex-wrap gap-1">
      {items.map((s, i) => (
        <span key={i} className="text-[10px] px-1.5 py-0.5 rounded"
          style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)' }}>
          {s}
        </span>
      ))}
    </div>
  )
}

function PrimitiveValue({ value }) {
  return <span style={{ color: 'var(--text-primary)' }}>{String(value)}</span>
}

// snake_case / camelCase → "Title case", with smart small-word acronyms.
function formatKey(key) {
  if (!key) return ''
  // Camel to snake first
  const snakey = key.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase()
  const words = snakey.split(/[_\s]+/).filter(Boolean)
  const ACRONYMS = new Set(['id', 'usd', 'eur', 'gbp', 'arr', 'mrr', 'icp', 'bant', 'crm', 'sla', 'api', 'url', 'ms', 'pct'])
  return words.map((w, i) => {
    if (ACRONYMS.has(w)) return w.toUpperCase()
    if (i === 0) return w.charAt(0).toUpperCase() + w.slice(1)
    return w
  }).join(' ')
}

// ── Run overview (when no step selected) ──────────────────────────────────
function RunOverview({ trace, input }) {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-[10px] font-bold tracking-widest uppercase mb-2"
          style={{ color: 'var(--text-muted)' }}>Final recommendation</p>
        <div className="rounded-xl px-4 py-3"
          style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.30)' }}>
          <p className="text-[12px] leading-relaxed" style={{ color: 'var(--text-primary)' }}>
            {trace.finalRecommendation?.rationale}
          </p>
          <div className="flex flex-wrap gap-3 mt-2 text-[10px]" style={{ color: 'var(--text-muted)' }}>
            <span>Action: <strong style={{ color: 'var(--text-secondary)' }}>{trace.finalRecommendation?.action}</strong></span>
            <span>Tier: <strong style={{ color: 'var(--text-secondary)' }}>{trace.finalRecommendation?.tier}</strong></span>
            <span>Discount: <strong style={{ color: 'var(--text-secondary)' }}>{trace.finalRecommendation?.discount_pct}%</strong></span>
          </div>
        </div>
      </div>

      <div>
        <p className="text-[10px] font-bold tracking-widest uppercase mb-2"
          style={{ color: 'var(--text-muted)' }}>Sample input</p>
        <InputCard input={input} />
      </div>

      <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
        Click a step in the tree to see the full run trace, governance events, and citations.
      </p>
    </div>
  )
}

function InputCard({ input }) {
  return (
    <div className="rounded-xl p-4"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
      <p className="text-[12px] font-semibold mb-0.5" style={{ color: 'var(--text-primary)' }}>{input.title}</p>
      <p className="text-[11px] mb-3" style={{ color: 'var(--text-muted)' }}>{input.summary}</p>
      <DataPanel data={input.payload} />
    </div>
  )
}
