import React, { useState, useMemo, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft, ChevronRight, ChevronLeft, Check, Save, Search, X, Plus,
  FileText, Database, Folder, Shield, Sparkles, BookOpen, AlertCircle,
  Users, Building2, Lock, ToggleLeft, ToggleRight, Eye, Tag, CheckCircle, Trash2,
} from 'lucide-react'
import {
  ACCESS_LEVELS,
  packTemplates,
  availableTruthFacts,
  availableSandboxClaims,
  availableSourceDocs,
  availableTenants,
  accessDepartments, accessRoles, accessGroups, accessUsers,
} from '../../../data/mockKnowledge'

// Helper — what the current user can do with an item of a given accessLevel.
// In production this resolves against the user's identity + ACL service. For
// the prototype we mock as Sarah Chen (mid-tier user): public + workspace OK,
// restricted requires request, pii blocked outright.
function getAccessState(level) {
  if (level === 'pii')        return { selectable: false, requiresRequest: false, blocked: true,  label: 'PII',        helper: 'Compliance review required before this can be used in any pack.' }
  if (level === 'restricted') return { selectable: false, requiresRequest: true,  blocked: false, label: 'Restricted', helper: 'Request access from the owner before using in a pack.' }
  if (level === 'workspace')  return { selectable: true,  requiresRequest: false, blocked: false, label: 'Workspace',  helper: null }
  return { selectable: true, requiresRequest: false, blocked: false, label: null, helper: null }  // public
}

// ── Step definitions ──────────────────────────────────────────────────────────
const STEPS = [
  { id: 'basics',      label: 'Basics',          desc: 'Name, owner & department',   icon: FileText },
  { id: 'composition', label: 'Composition',     desc: 'Pick items from each plane', icon: Database },
  { id: 'toggles',     label: 'Default toggles', desc: 'Active planes on attach',    icon: ToggleRight },
  { id: 'access',      label: 'Access',          desc: 'Tenant scope & permissions', icon: Lock },
  { id: 'review',      label: 'Review',          desc: 'Confirm and save',          icon: CheckCircle },
]

const PLANE_META = {
  truth:   { label: 'Truth Plane',   icon: Shield,   color: '#4ade80', bg: 'rgba(34,197,94,0.10)',  border: 'rgba(34,197,94,0.30)',  desc: 'Approved facts and policies' },
  sandbox: { label: 'Sandbox Plane', icon: Database, color: '#fbbf24', bg: 'rgba(245,158,11,0.10)', border: 'rgba(245,158,11,0.30)', desc: 'In-validation claims for testing' },
  sources: { label: 'Sources Plane', icon: Folder,   color: '#60a5fa', bg: 'rgba(59,130,246,0.10)', border: 'rgba(59,130,246,0.30)', desc: 'Raw documents and references' },
}

// Scope options — Global (cross-tenant) vs Workspace (one or more tenants)
const SCOPE_OPTIONS = [
  { id: 'global',    label: 'Global',    desc: 'Available across every tenant in this workspace.' },
  { id: 'workspace', label: 'Workspace', desc: 'Restricted to one or more specific tenants.' },
]
// Tenant scope mode (only when scope === 'workspace')
const TENANT_MODE_OPTIONS = [
  { id: 'all',      label: 'All tenants in this workspace' },
  { id: 'specific', label: 'Specific tenants only' },
]
const DEPARTMENT_OWNER = ['Sales','Customer Success','Support','Legal','Compliance','Marketing','Operations','Engineering','Product']

// ── Initial state ─────────────────────────────────────────────────────────────
const INITIAL_STATE = {
  name:        '',
  description: '',
  scope:       'global',           // 'global' | 'workspace'
  tenantMode:  'all',              // 'all' | 'specific' (only used when scope === 'workspace')
  tenants:     [],                 // tenant ids (only used when tenantMode === 'specific')
  department:  '',                 // '' = Cross-departmental (optional)
  owner:       'Sarah Chen',
  truth:       [],
  sandbox:     [],
  sources:     [],
  toggles:     { truth: true, sandbox: false, sources: true },
  access: {
    tier:        'workspace',
    departments: [],
    roles:       [],
    groups:      [],
    users:       [],
  },
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function KnowledgePackBuilder() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const templateId = searchParams.get('template')
  const fromAI     = searchParams.get('source') === 'ai'

  // Seed state from template if provided
  const [data, setData] = useState(() => {
    if (templateId) {
      const tpl = packTemplates.find(t => t.id === templateId)
      if (tpl) {
        return {
          ...INITIAL_STATE,
          name: tpl.id === 'tpl-empty' ? '' : tpl.name,
          description: tpl.description,
          department: tpl.department === '—' ? '' : tpl.department,
          truth: [...tpl.seedTruth],
          sandbox: [...tpl.seedSandbox],
          sources: [...tpl.seedSources],
          toggles: { ...tpl.toggles },
        }
      }
    }
    if (fromAI) {
      // AI-suggested seed (prototype): a sensible default mix
      return {
        ...INITIAL_STATE,
        name: 'AI-suggested pack',
        description: 'Suggested composition based on the AI conversation.',
        truth:   ['TF-0010','TF-0013','TF-0017'],
        sandbox: ['SC-0006','SC-0014'],
        sources: ['SRC-0006','SRC-0010'],
        toggles: { truth: true, sandbox: true, sources: true },
      }
    }
    return INITIAL_STATE
  })

  const [stepIdx, setStepIdx] = useState(0)
  const step    = STEPS[stepIdx]

  // Validation per step
  const validation = useMemo(() => {
    const errors = {}
    if (!data.name.trim())       errors.name = 'Pack name is required'
    if (!data.owner.trim())      errors.owner = 'Owner is required'
    const totalItems = data.truth.length + data.sandbox.length + data.sources.length
    if (totalItems === 0)        errors.composition = 'Pick at least one item from any plane'
    return errors
  }, [data])

  const canProceedFromBasics      = !validation.name && !validation.owner
  const canProceedFromComposition = !validation.composition
  const isReviewValid             = canProceedFromBasics && canProceedFromComposition

  const goNext = () => setStepIdx(i => Math.min(i + 1, STEPS.length - 1))
  const goPrev = () => setStepIdx(i => Math.max(i - 1, 0))

  const handleSaveDraft = () => {
    // Prototype: navigate back with toast intent
    navigate('/intelligence-library/knowledge', { state: { saved: true, status: 'draft', name: data.name || 'Untitled pack' } })
  }
  const handlePublish = () => {
    navigate('/intelligence-library/knowledge', { state: { saved: true, status: 'active', name: data.name || 'Untitled pack' } })
  }

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--bg-base)' }}>

      {/* ── Top bar ── */}
      <div className="shrink-0 flex items-center justify-between px-6 py-3"
        style={{ borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-base)' }}>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/intelligence-library/knowledge/create')}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-secondary)' }}>
            <ArrowLeft size={14} />
          </button>
          <div>
            <p className="text-[10px] font-bold tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>Knowledge Pack Builder</p>
            <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{data.name || 'Untitled pack'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(245,158,11,0.12)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.3)' }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#fbbf24' }} /> Draft
          </span>
          <button onClick={handleSaveDraft}
            className="text-xs font-medium px-3 py-1.5 rounded-lg transition-all"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
            <Save size={12} className="inline mr-1.5" /> Save draft
          </button>
        </div>
      </div>

      {/* ── Stepper ── */}
      <div className="shrink-0 flex items-center gap-1 px-6 py-3 overflow-x-auto"
        style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        {STEPS.map((s, i) => {
          const Icon = s.icon
          const isActive    = i === stepIdx
          const isCompleted = i < stepIdx
          return (
            <React.Fragment key={s.id}>
              <button type="button" onClick={() => setStepIdx(i)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all whitespace-nowrap"
                style={{
                  background: isActive ? 'rgba(43,127,255,0.12)' : 'transparent',
                  border:     isActive ? '1px solid rgba(43,127,255,0.45)' : '1px solid transparent',
                  cursor:     'pointer',
                }}>
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                  style={{
                    background: isActive    ? 'linear-gradient(135deg,#00C2C2 0%,#155DFC 100%)'
                              : isCompleted ? 'rgba(34,197,94,0.18)'
                              :               'rgba(255,255,255,0.06)',
                    color:      isActive    ? '#fff'
                              : isCompleted ? '#4ade80'
                              :               'var(--text-muted)',
                  }}>
                  {isCompleted ? <Check size={11} /> : i + 1}
                </div>
                <span className="text-xs font-semibold"
                  style={{ color: isActive ? 'var(--text-primary)' : isCompleted ? '#4ade80' : 'var(--text-muted)' }}>
                  {s.label}
                </span>
              </button>
              {i < STEPS.length - 1 && (
                <ChevronRight size={12} style={{ color: 'var(--text-muted)', opacity: 0.4 }} className="shrink-0" />
              )}
            </React.Fragment>
          )
        })}
      </div>

      {/* ── Step content + persistent preview pane ── */}
      <div className="flex-1 flex overflow-hidden">
        <div className={step.id === 'composition' ? 'flex-1 min-w-0 flex overflow-hidden' : 'flex-1 min-w-0 overflow-y-auto'}>
          {step.id === 'basics'      && <BasicsStep data={data} setData={setData} validation={validation} />}
          {step.id === 'composition' && <CompositionStep data={data} setData={setData} />}
          {step.id === 'toggles'     && <TogglesStep data={data} setData={setData} />}
          {step.id === 'access'      && <AccessStep data={data} setData={setData} />}
          {step.id === 'review'      && <ReviewStep data={data} valid={isReviewValid} />}
        </div>
        {/* Hide global preview on Composition (the cart serves the same purpose there) */}
        {step.id !== 'composition' && (
          <PackPreviewPane data={data} validation={validation} isReviewValid={isReviewValid} />
        )}
      </div>

      {/* ── Footer ── */}
      <div className="shrink-0 flex items-center justify-between px-6 py-3.5"
        style={{ borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-base)' }}>
        <button onClick={goPrev}
          disabled={stepIdx === 0}
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg transition-all"
          style={{
            background: 'transparent', border: '1px solid var(--border-subtle)',
            color: 'var(--text-secondary)',
            opacity: stepIdx === 0 ? 0.4 : 1,
            cursor: stepIdx === 0 ? 'not-allowed' : 'pointer',
          }}>
          <ChevronLeft size={13} /> Back
        </button>
        <FooterValidationSummary data={data} validation={validation} isReviewValid={isReviewValid} />
        {step.id !== 'review' ? (
          <button onClick={goNext}
            disabled={(step.id === 'basics' && !canProceedFromBasics) || (step.id === 'composition' && !canProceedFromComposition)}
            className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg transition-all hover:brightness-110"
            style={{
              background: 'linear-gradient(135deg,#00C2C2 0%,#155DFC 100%)',
              color: '#fff',
              boxShadow: '0 2px 12px rgba(21,93,252,0.4)',
              opacity: ((step.id === 'basics' && !canProceedFromBasics) || (step.id === 'composition' && !canProceedFromComposition)) ? 0.4 : 1,
              cursor: ((step.id === 'basics' && !canProceedFromBasics) || (step.id === 'composition' && !canProceedFromComposition)) ? 'not-allowed' : 'pointer',
            }}>
            Continue <ChevronRight size={13} />
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button onClick={handleSaveDraft}
              className="text-xs font-semibold px-4 py-2 rounded-lg transition-all"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
              Save as Draft
            </button>
            <button onClick={handlePublish}
              disabled={!isReviewValid}
              className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg transition-all hover:brightness-110"
              style={{
                background: 'linear-gradient(135deg,#22c55e,#16a34a)',
                color: '#fff', boxShadow: '0 2px 12px rgba(34,197,94,0.4)',
                opacity: isReviewValid ? 1 : 0.4, cursor: isReviewValid ? 'pointer' : 'not-allowed',
              }}>
              <Check size={13} /> Publish now
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// PACK PREVIEW PANE — sticky right rail, visible across all steps except
// Composition (where the existing cart serves the same purpose).
// ═══════════════════════════════════════════════════════════════════════════
function PackPreviewPane({ data, validation, isReviewValid }) {
  const totalItems    = data.truth.length + data.sandbox.length + data.sources.length
  const togglesActive = Object.values(data.toggles).filter(Boolean).length
  const stage         = data.department || 'Cross-departmental'

  // Resolve scope label
  const scopeLabel =
    data.scope === 'global'
      ? 'Global · all tenants'
      : data.tenantMode === 'all'
      ? 'Workspace · all tenants'
      : `Workspace · ${data.tenants.length} tenant${data.tenants.length === 1 ? '' : 's'}`

  // Resolve access label
  const accessTier   = data.access.tier
  const accessLabel  =
    accessTier === 'workspace' ? 'Workspace (everyone)'
    : accessTier === 'departments'
      ? `${data.access.departments.length || 0} department${data.access.departments.length === 1 ? '' : 's'}`
      : `Custom (${[
          ...data.access.departments, ...data.access.roles, ...data.access.groups, ...data.access.users
        ].length} entries)`

  // Validation issues (used by both this pane and the footer)
  const issues = []
  if (validation.name)       issues.push('Name required')
  if (validation.owner)      issues.push('Owner required')
  if (validation.composition)issues.push('Pick at least 1 item')
  if (data.scope === 'workspace' && data.tenantMode === 'specific' && data.tenants.length === 0)
    issues.push('No tenants selected')

  return (
    <aside className="shrink-0 flex flex-col overflow-hidden"
      style={{ width: 300, borderLeft: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.02)' }}>

      {/* Header */}
      <div className="shrink-0 px-4 py-2.5 flex items-center justify-between"
        style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        <span className="text-[10px] font-bold tracking-widest uppercase"
          style={{ color: 'var(--text-muted)' }}>Pack preview</span>
        {isReviewValid && issues.length === 0 && (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full"
            style={{ background: 'rgba(34,197,94,0.12)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.3)' }}>
            <Check size={9} /> Ready
          </span>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">

        {/* Identity card */}
        <div>
          <p className="text-[13px] font-bold leading-snug" style={{ color: data.name ? 'var(--text-primary)' : 'var(--text-muted)' }}>
            {data.name || 'Untitled pack'}
          </p>
          {data.description && (
            <p className="text-[11px] mt-1 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
              {data.description}
            </p>
          )}
        </div>

        {/* Owner + dept inline */}
        <div className="flex items-center gap-1.5 text-[10px]" style={{ color: 'var(--text-muted)' }}>
          <span>{data.owner}</span>
          <span style={{ opacity: 0.4 }}>·</span>
          <span>{stage}</span>
        </div>

        {/* Scope + access */}
        <div className="space-y-1.5 pt-2.5" style={{ borderTop: '1px solid var(--border-subtle)' }}>
          <PreviewKV label="Scope"   value={scopeLabel} />
          <PreviewKV label="Access"  value={accessLabel} />
        </div>

        {/* Composition counters */}
        <div className="space-y-1 pt-2.5" style={{ borderTop: '1px solid var(--border-subtle)' }}>
          <p className="text-[10px] font-bold tracking-wider uppercase mb-1.5"
            style={{ color: 'var(--text-muted)' }}>Composition</p>
          <PreviewPlaneRow plane="truth"   count={data.truth.length}   active={data.toggles.truth} />
          <PreviewPlaneRow plane="sandbox" count={data.sandbox.length} active={data.toggles.sandbox} />
          <PreviewPlaneRow plane="sources" count={data.sources.length} active={data.toggles.sources} />
          <p className="text-[10px] mt-1.5" style={{ color: 'var(--text-muted)' }}>
            {totalItems} item{totalItems === 1 ? '' : 's'} · {togglesActive} of 3 planes active
          </p>
        </div>

        {/* Validation summary */}
        {issues.length > 0 && (
          <div className="pt-2.5 space-y-1" style={{ borderTop: '1px solid var(--border-subtle)' }}>
            <p className="text-[10px] font-bold tracking-wider uppercase mb-1.5"
              style={{ color: '#fbbf24' }}>Needs attention</p>
            {issues.map(i => (
              <div key={i} className="flex items-center gap-1.5 text-[11px]" style={{ color: '#fbbf24' }}>
                <AlertCircle size={10} className="shrink-0" />
                {i}
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  )
}

function PreviewKV({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span className="text-[11px] text-right truncate" style={{ color: 'var(--text-primary)' }}>{value}</span>
    </div>
  )
}

function PreviewPlaneRow({ plane, count, active }) {
  const m = PLANE_META[plane]
  const Icon = m.icon
  return (
    <div className="flex items-center gap-2 text-[11px]">
      <Icon size={10} style={{ color: m.color, opacity: active ? 1 : 0.35 }} />
      <span className="flex-1" style={{ color: active ? 'var(--text-primary)' : 'var(--text-muted)' }}>
        {m.label}
      </span>
      <span className="text-[10px] font-mono" style={{ color: 'var(--text-secondary)' }}>{count}</span>
      <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
        style={{
          background: active ? 'rgba(34,197,94,0.12)' : 'rgba(255,255,255,0.04)',
          color:      active ? '#4ade80' : 'var(--text-muted)',
          border: `1px solid ${active ? 'rgba(34,197,94,0.3)' : 'var(--border-subtle)'}`,
        }}>
        {active ? 'on' : 'off'}
      </span>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// FOOTER VALIDATION SUMMARY — replaces "Step N of 5 · {desc}" with a live
// state pill that tells the user WHAT they have, not WHERE they are.
// (The stepper at top already shows where they are.)
// ═══════════════════════════════════════════════════════════════════════════
function FooterValidationSummary({ data, validation, isReviewValid }) {
  const totalItems = data.truth.length + data.sandbox.length + data.sources.length

  // Issue priority — show the most important blocker first
  const issues = []
  if (validation.name)        issues.push({ tone: 'warn',  text: 'Name required' })
  if (validation.owner)       issues.push({ tone: 'warn',  text: 'Owner required' })
  if (validation.composition) issues.push({ tone: 'warn',  text: 'Pick at least 1 item' })
  if (data.scope === 'workspace' && data.tenantMode === 'specific' && data.tenants.length === 0) {
    issues.push({ tone: 'warn', text: 'Pick tenants or switch to All' })
  }

  const scopeShort =
    data.scope === 'global'                                 ? 'Global' :
    data.tenantMode === 'all'                               ? 'Workspace' :
                                                              `Workspace · ${data.tenants.length}`

  if (issues.length > 0) {
    return (
      <div className="flex items-center gap-1.5 text-[11px] font-medium" style={{ color: '#fbbf24' }}>
        <AlertCircle size={11} className="shrink-0" />
        <span>{issues[0].text}</span>
        {issues.length > 1 && (
          <span className="text-[10px] opacity-70">+ {issues.length - 1} more</span>
        )}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--text-muted)' }}>
      <span className="font-semibold" style={{ color: 'var(--text-secondary)' }}>
        {data.name || 'Untitled'}
      </span>
      <span style={{ opacity: 0.4 }}>·</span>
      <span>{totalItems} item{totalItems === 1 ? '' : 's'}</span>
      <span style={{ opacity: 0.4 }}>·</span>
      <span>{scopeShort}</span>
      {isReviewValid && (
        <>
          <span style={{ opacity: 0.4 }}>·</span>
          <span className="inline-flex items-center gap-0.5 font-semibold" style={{ color: '#4ade80' }}>
            <Check size={10} /> Ready to publish
          </span>
        </>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// STEP 1 — BASICS (identity only — scope moved to Access step)
// ═══════════════════════════════════════════════════════════════════════════
function BasicsStep({ data, setData, validation }) {
  return (
    <div className="px-8 py-6 max-w-3xl">
      <p className="text-[10px] font-bold tracking-widest uppercase mb-1.5"
        style={{ color: 'var(--text-muted)' }}>Step 1 · Basics</p>
      <h2 className="text-xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Name and identify this pack</h2>
      <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
        These are the fields that show up in lists, search, and when this pack is attached to an agent.
      </p>

      <div className="space-y-5">
        <Field label="Pack name" required error={validation.name}>
          <input type="text" value={data.name}
            onChange={e => setData(d => ({ ...d, name: e.target.value }))}
            placeholder="e.g. Sales Discovery Pack — Mid-Market"
            className="w-full px-3 py-2 rounded-lg outline-none text-sm"
            style={{ background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-primary)' }} />
        </Field>

        <Field label="Description" hint="Help future editors and consumers understand what this pack is for.">
          <textarea value={data.description}
            onChange={e => setData(d => ({ ...d, description: e.target.value }))}
            rows={3} placeholder="Briefly describe the agent or scenario this pack is built for…"
            className="w-full px-3 py-2 rounded-lg outline-none text-sm resize-y"
            style={{ background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-primary)' }} />
        </Field>

        <div className="grid grid-cols-2 gap-3 items-start">
          <Field label="Owner" required error={validation.owner}
            hint="Has full edit access on this pack.">
            <select value={data.owner}
              onChange={e => setData(d => ({ ...d, owner: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg outline-none text-sm cursor-pointer"
              style={{ background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-primary)', colorScheme: 'dark' }}>
              {accessUsers.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
            </select>
          </Field>

          <Field label="Department"
            hint="Optional — skip for cross-team packs.">
            <select value={data.department}
              onChange={e => setData(d => ({ ...d, department: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg outline-none text-sm cursor-pointer"
              style={{ background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-primary)', colorScheme: 'dark' }}>
              <option value="">Cross-departmental</option>
              {DEPARTMENT_OWNER.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </Field>
        </div>

        <div className="px-3.5 py-2.5 rounded-lg flex items-start gap-2"
          style={{ background: 'rgba(43,127,255,0.06)', border: '1px solid rgba(43,127,255,0.20)' }}>
          <AlertCircle size={12} style={{ color: '#80AFFF' }} className="mt-0.5 shrink-0" />
          <p className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
            You'll choose <strong>tenant scope</strong> (where the pack lives) and <strong>permissions</strong> (who can use it) together in step 4 — Access.
          </p>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// STEP 2 — COMPOSITION (split-pane: browser + cart)
// ═══════════════════════════════════════════════════════════════════════════
function CompositionStep({ data, setData }) {
  const [planeTab, setPlaneTab] = useState('truth')
  const [search, setSearch]     = useState('')
  const [previewing, setPreviewing] = useState(null)         // item being previewed
  const [accessRequest, setAccessRequest] = useState(null)   // item the user is requesting access for

  const sources = {
    truth:   availableTruthFacts,
    sandbox: availableSandboxClaims,
    sources: availableSourceDocs,
  }

  const filtered = useMemo(() => {
    const items = sources[planeTab] || []
    const q = search.trim().toLowerCase()
    if (!q) return items
    return items.filter(it =>
      it.title.toLowerCase().includes(q) ||
      it.planeName?.toLowerCase().includes(q) ||
      it.tags?.some(t => t.toLowerCase().includes(q))
    )
  }, [planeTab, search])

  const isPicked = (id) => data[planeTab].includes(id)
  // Selection guard: items below the user's access tier cannot be added.
  // Restricted → opens the access-request dialog. PII → blocked outright.
  const togglePick = (id) => {
    const item = (sources[planeTab] || []).find(x => x.id === id)
    if (!item) return
    const access = getAccessState(item.accessLevel)
    if (access.blocked) return                  // PII — no-op
    if (access.requiresRequest && !isPicked(id)) {
      setAccessRequest(item)                    // open request modal instead of toggling
      return
    }
    setData(d => ({
      ...d,
      [planeTab]: d[planeTab].includes(id) ? d[planeTab].filter(x => x !== id) : [...d[planeTab], id],
    }))
  }
  const removeFromPack = (plane, id) => {
    setData(d => ({ ...d, [plane]: d[plane].filter(x => x !== id) }))
  }
  const totalItems = data.truth.length + data.sandbox.length + data.sources.length

  return (
    <div className="flex h-full">

      {/* ── Left pane: browser ── */}
      <div className="flex-1 min-w-0 flex flex-col" style={{ borderRight: '1px solid var(--border-subtle)' }}>

        {/* Header */}
        <div className="shrink-0 px-6 pt-5 pb-3">
          <p className="text-[10px] font-bold tracking-widest uppercase mb-1.5"
            style={{ color: 'var(--text-muted)' }}>Step 2 · Composition</p>
          <h2 className="text-xl font-bold mb-0.5" style={{ color: 'var(--text-primary)' }}>Pick items from each governance plane</h2>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Browse across Truth, Sandbox, and Sources — selections build the pack on the right.
          </p>
        </div>

        {/* Plane tabs */}
        <div className="shrink-0 flex items-center gap-1 px-6"
          style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          {Object.entries(PLANE_META).map(([k, m]) => {
            const isActive = planeTab === k
            const Icon = m.icon
            const count = data[k].length
            return (
              <button key={k} type="button" onClick={() => setPlaneTab(k)}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold transition-all relative"
                style={{ color: isActive ? m.color : 'var(--text-muted)' }}>
                <Icon size={12} />
                {m.label}
                {count > 0 && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-0.5"
                    style={{ background: m.bg, border: `1px solid ${m.border}`, color: m.color }}>
                    {count}
                  </span>
                )}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-px"
                    style={{ background: m.color }} />
                )}
              </button>
            )
          })}
        </div>

        {/* Search */}
        <div className="shrink-0 px-6 py-3">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg max-w-md"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-subtle)' }}>
            <Search size={13} style={{ color: 'var(--text-muted)' }} />
            <input
              className="flex-1 bg-transparent outline-none text-xs"
              style={{ color: 'var(--text-primary)' }}
              placeholder={`Search ${planeTab === 'truth' ? 'facts' : planeTab === 'sandbox' ? 'claims' : 'sources'}…`}
              value={search} onChange={e => setSearch(e.target.value)} />
            {search && <button onClick={() => setSearch('')}><X size={11} style={{ color: 'var(--text-muted)' }} /></button>}
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-1.5">
          {filtered.length === 0 ? (
            <div className="text-center py-12">
              <Search size={24} style={{ color: 'var(--text-muted)', opacity: 0.4 }} className="mx-auto mb-2" />
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No matches in this plane</p>
            </div>
          ) : filtered.map(it => {
            const picked = isPicked(it.id)
            const access = getAccessState(it.accessLevel)
            const meta   = ACCESS_LEVELS[it.accessLevel] || {}
            // Visual state: locked (PII / restricted) dims the row; picked
            // keeps the cyan emphasis; default has subtle hover affordance.
            const dimmed = (access.blocked || access.requiresRequest) && !picked
            return (
              <div key={it.id}
                className="group w-full flex items-start gap-3 px-3.5 py-2.5 rounded-lg transition-all relative"
                style={{
                  background: picked ? 'rgba(43,127,255,0.08)' : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${picked ? 'rgba(43,127,255,0.40)' : 'var(--border-subtle)'}`,
                  opacity: dimmed ? 0.62 : 1,
                }}
                onMouseEnter={e => { if (!picked && !access.blocked) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.16)' }}
                onMouseLeave={e => { if (!picked) e.currentTarget.style.borderColor = 'var(--border-subtle)' }}
              >
                {/* Click target — sized to body region only. Behavior:        */}
                {/* public/workspace → toggle; restricted → request modal;     */}
                {/* pii → blocked (no-op).                                     */}
                <button type="button" onClick={() => togglePick(it.id)}
                  disabled={access.blocked}
                  className="absolute inset-0"
                  style={{ borderRadius: 8, background: 'transparent', cursor: access.blocked ? 'not-allowed' : 'pointer' }}
                  aria-label={
                    access.blocked      ? `${it.title} — PII, compliance review required` :
                    access.requiresRequest ? `${it.title} — request access to use` :
                    picked              ? `Deselect ${it.title}` :
                                          `Select ${it.title}`
                  }
                  title={access.helper || undefined}
                />

                {/* Checkbox — replaced by lock icon for restricted/pii items */}
                <div className="w-4 h-4 rounded shrink-0 flex items-center justify-center mt-0.5 relative pointer-events-none"
                  style={{
                    background:
                      picked                ? 'linear-gradient(135deg,#00C2C2 0%,#155DFC 100%)' :
                      access.blocked        ? 'rgba(239,68,68,0.10)' :
                      access.requiresRequest? 'rgba(251,191,36,0.10)' :
                                              'transparent',
                    border:
                      picked                ? '1.5px solid transparent' :
                      access.blocked        ? '1.5px solid rgba(239,68,68,0.45)' :
                      access.requiresRequest? '1.5px solid rgba(251,191,36,0.45)' :
                                              '1.5px solid rgba(255,255,255,0.20)',
                  }}>
                  {picked && <Check size={10} color="#fff" strokeWidth={3} />}
                  {!picked && (access.blocked || access.requiresRequest) && (
                    <Lock size={9} style={{ color: access.blocked ? '#f87171' : '#fbbf24' }} />
                  )}
                </div>
                {/* Body */}
                <div className="flex-1 min-w-0 relative pointer-events-none">
                  <p className="text-[13px] font-semibold leading-snug" style={{ color: 'var(--text-primary)' }}>{it.title}</p>
                  <div className="flex items-center gap-1.5 mt-1 text-[10px] flex-wrap" style={{ color: 'var(--text-muted)' }}>
                    <span className="font-mono">{it.id}</span>
                    <span style={{ opacity: 0.4 }}>·</span>
                    <span>{it.planeName}</span>
                    {it.type && (<><span style={{ opacity: 0.4 }}>·</span><span>{it.type}</span></>)}
                    {it.status && (<><span style={{ opacity: 0.4 }}>·</span>
                      <span className="font-semibold" style={{ color: it.status === 'verified' ? '#4ade80' : it.status === 'verifying' ? '#fbbf24' : '#60a5fa' }}>
                        {it.status}
                      </span></>)}
                    {typeof it.confidence === 'number' && (<><span style={{ opacity: 0.4 }}>·</span><span>{it.confidence}% confidence</span></>)}
                    {it.size && (<><span style={{ opacity: 0.4 }}>·</span><span>{it.size}</span></>)}
                    <span style={{ opacity: 0.4 }}>·</span>
                    <span>updated {it.updated}</span>
                    {/* Access badge — only renders for non-public items */}
                    {meta.badgeColor && (
                      <>
                        <span style={{ opacity: 0.4 }}>·</span>
                        <span className="inline-flex items-center gap-1 font-semibold px-1.5 py-0.5 rounded-md"
                          style={{
                            color: meta.badgeColor,
                            background: `${meta.badgeColor}1a`,
                            border: `1px solid ${meta.badgeColor}55`,
                          }}>
                          {access.blocked && <Lock size={8} />}
                          {access.requiresRequest && !access.blocked && <Lock size={8} />}
                          {meta.label}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Preview button — sits above the click overlay */}
                <button type="button"
                  onClick={(e) => { e.stopPropagation(); setPreviewing(it) }}
                  aria-label={`Preview ${it.title}`}
                  className="relative w-7 h-7 rounded-md flex items-center justify-center shrink-0 transition-all opacity-60 hover:opacity-100 cursor-pointer"
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-secondary)',
                  }}
                  title="Preview"
                >
                  <Eye size={11} />
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Right pane: cart ── */}
      <div className="shrink-0 flex flex-col" style={{ width: 360, background: 'rgba(255,255,255,0.02)' }}>
        <div className="shrink-0 px-5 pt-5 pb-3">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[10px] font-bold tracking-widest uppercase"
              style={{ color: 'var(--text-muted)' }}>Pack composition</p>
            <span className="text-[11px] font-semibold" style={{ color: 'var(--text-primary)' }}>{totalItems} items</span>
          </div>
          <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
            Items selected across all 3 planes. Toggles in step 3 control what's active when attached.
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-4">
          {Object.entries(PLANE_META).map(([k, m]) => {
            const Icon  = m.icon
            const items = data[k]
            const all = sources[k] || []
            return (
              <div key={k}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <Icon size={11} style={{ color: m.color }} />
                    <span className="text-[10px] font-bold tracking-wider uppercase" style={{ color: m.color }}>
                      {m.label}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold" style={{ color: 'var(--text-muted)' }}>
                    {items.length}
                  </span>
                </div>
                {items.length === 0 ? (
                  <p className="text-[11px] italic px-2 py-2 rounded-lg"
                    style={{ color: 'var(--text-muted)', background: 'rgba(255,255,255,0.02)', border: '1px dashed var(--border-subtle)' }}>
                    No items yet — pick from the {m.label.toLowerCase()} tab.
                  </p>
                ) : items.map(id => {
                  const it = all.find(x => x.id === id)
                  if (!it) return null
                  return (
                    <div key={id} className="flex items-start gap-2 px-2.5 py-2 rounded-lg mb-1"
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)' }}>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-semibold leading-snug truncate" style={{ color: 'var(--text-primary)' }}>{it.title}</p>
                        <p className="text-[10px] font-mono mt-0.5" style={{ color: 'var(--text-muted)' }}>{it.id}</p>
                      </div>
                      <button type="button" onClick={() => removeFromPack(k, id)}
                        className="w-5 h-5 rounded flex items-center justify-center shrink-0 transition-colors"
                        style={{ color: 'var(--text-muted)' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.12)'; e.currentTarget.style.color = '#f87171' }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)' }}>
                        <X size={11} />
                      </button>
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>

      {/* Item preview side panel — overlays the cart on the right edge */}
      {previewing && (
        <ItemPreviewPanel
          item={previewing}
          plane={previewing.plane}
          isPicked={isPicked(previewing.id)}
          onClose={() => setPreviewing(null)}
          onTogglePick={() => togglePick(previewing.id)}
        />
      )}

      {/* Access request modal — opens when a restricted item is clicked */}
      {accessRequest && (
        <AccessRequestDialog
          item={accessRequest}
          onClose={() => setAccessRequest(null)}
          onSubmit={() => {
            // In production: POST to access-request API. For prototype just dismiss.
            setAccessRequest(null)
          }}
        />
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// ACCESS REQUEST DIALOG — opens when the user tries to select a restricted
// item. Captures the reason and submits to the item owner for approval. In
// prototype this just dismisses; in production it would POST to an ACL API.
// ═══════════════════════════════════════════════════════════════════════════
function AccessRequestDialog({ item, onClose, onSubmit }) {
  const [reason, setReason] = useState('')
  const meta = ACCESS_LEVELS[item.accessLevel] || {}

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [onClose])

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6"
      style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      role="dialog" aria-modal="true" aria-labelledby="access-req-title">
      <div className="w-full max-w-md rounded-2xl overflow-hidden"
        style={{ background: 'var(--modal-bg, #0b1220)', border: '1px solid var(--border-subtle)' }}>
        {/* Header */}
        <div className="px-5 py-4 flex items-start gap-3"
          style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: `${meta.badgeColor}1a`, border: `1px solid ${meta.badgeColor}55` }}>
            <Lock size={14} style={{ color: meta.badgeColor }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold tracking-widest uppercase mb-0.5"
              style={{ color: 'var(--text-muted)' }}>{meta.label} · Access required</p>
            <p id="access-req-title" className="text-sm font-semibold leading-snug"
              style={{ color: 'var(--text-primary)' }}>{item.title}</p>
          </div>
          <button onClick={onClose} aria-label="Close"
            className="w-7 h-7 rounded-md flex items-center justify-center transition-colors cursor-pointer"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
            <X size={12} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <div className="rounded-lg p-3 text-[12px]"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
            {meta.description}
            <div className="mt-2 grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <p className="font-semibold tracking-wide uppercase text-[9px] mb-0.5" style={{ color: 'var(--text-muted)' }}>Owner</p>
                <p style={{ color: 'var(--text-primary)' }}>{item.owner}</p>
              </div>
              <div>
                <p className="font-semibold tracking-wide uppercase text-[9px] mb-0.5" style={{ color: 'var(--text-muted)' }}>Item ID</p>
                <p className="font-mono" style={{ color: 'var(--text-primary)' }}>{item.id}</p>
              </div>
            </div>
          </div>

          <label className="block">
            <span className="text-[11px] font-semibold tracking-wide block mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Why do you need this in the pack?
            </span>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Briefly describe the workflow this supports. The owner sees this when they review the request."
              rows={3}
              className="w-full text-[12px] px-3 py-2 rounded-lg outline-none resize-none"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
              }}
            />
          </label>

          <p className="text-[10px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            <strong style={{ color: 'var(--text-secondary)' }}>{item.owner}</strong> reviews access requests within 1 business day. Until approved, this item won't be added to your pack.
          </p>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 flex items-center gap-2"
          style={{ borderTop: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.02)' }}>
          <button onClick={onClose}
            className="flex-1 py-2 rounded-lg text-[12px] font-semibold transition-colors cursor-pointer"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
            Cancel
          </button>
          <button onClick={onSubmit} disabled={!reason.trim()}
            className="flex-1 py-2 rounded-lg text-[12px] font-semibold transition-all hover:brightness-110 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: 'linear-gradient(135deg,#00C2C2 0%,#155DFC 100%)', color: '#fff' }}>
            Send request
          </button>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// ITEM PREVIEW PANEL — full-bleed view of a Truth fact / Sandbox claim /
// Sources doc, opened from the eye icon in the Composition list.
// ═══════════════════════════════════════════════════════════════════════════
function ItemPreviewPanel({ item, plane, isPicked, onClose, onTogglePick }) {
  // Lock body scroll + ESC to close
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [onClose])

  const meta = PLANE_META[plane]
  const Icon = meta.icon

  // Body content — mock placeholder per plane. In production this would render
  // the verified statement / claim / file viewer from the actual data source.
  const body = renderItemBody(item, plane)

  // Status pill colors mirror the list row.
  const statusColor =
    item.status === 'verified'      ? '#4ade80' :
    item.status === 'verifying'     ? '#fbbf24' :
    item.status === 'in-validation' ? '#60a5fa' :
                                      'var(--text-muted)'

  return (
    <div
      className="fixed inset-0 z-[150] flex items-stretch justify-end"
      style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      role="dialog" aria-modal="true" aria-label={`Preview of ${item.title}`}
    >
      <div
        className="w-[480px] h-full overflow-y-auto flex flex-col"
        style={{ background: 'var(--modal-bg, #0b1220)', borderLeft: '1px solid var(--border-subtle)' }}
      >
        {/* Header */}
        <div className="shrink-0 px-5 py-4 flex items-start justify-between gap-3"
          style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: meta.bg, border: `1px solid ${meta.border}` }}>
              <Icon size={15} style={{ color: meta.color }} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold tracking-widest uppercase mb-0.5"
                style={{ color: 'var(--text-muted)' }}>
                {meta.label} preview · <span className="font-mono normal-case tracking-normal">{item.id}</span>
              </p>
              <p className="text-base font-semibold leading-snug" style={{ color: 'var(--text-primary)' }}>
                {item.title}
              </p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Close preview"
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer shrink-0"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Status / metadata strip */}
        <div className="shrink-0 px-5 py-3 flex flex-wrap items-center gap-1.5"
          style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-subtle)' }}>
          {item.status && (
            <span className="text-[10px] font-bold tracking-wide uppercase px-2 py-0.5 rounded-md"
              style={{ background: `${statusColor}1f`, border: `1px solid ${statusColor}55`, color: statusColor }}>
              {item.status}
            </span>
          )}
          {item.type && (
            <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-md"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
              {item.type}
            </span>
          )}
          {typeof item.confidence === 'number' && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md tabular-nums"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
              {item.confidence}% confidence
            </span>
          )}
          {item.size && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
              {item.size}
            </span>
          )}
          {typeof item.evidence === 'number' && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md tabular-nums"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
              {item.evidence} evidence pts
            </span>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
          {/* Content section */}
          <section>
            <p className="text-[10px] font-bold tracking-widest uppercase mb-2"
              style={{ color: 'var(--text-muted)' }}>{body.label}</p>
            <div className="rounded-xl p-4"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)' }}>
              <p className="text-[12px] leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                {body.text}
              </p>
            </div>
          </section>

          {/* Metadata grid */}
          <section>
            <p className="text-[10px] font-bold tracking-widest uppercase mb-2"
              style={{ color: 'var(--text-muted)' }}>Metadata</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[11px]">
              <PreviewMetaRow label="Plane"     value={item.planeName} />
              <PreviewMetaRow label="Owner"     value={item.owner} />
              {item.type      && <PreviewMetaRow label="Type" value={item.type} />}
              {item.updated   && <PreviewMetaRow label="Last updated" value={item.updated} />}
              {typeof item.confidence === 'number' && <PreviewMetaRow label="Confidence" value={`${item.confidence}%`} />}
              {item.size      && <PreviewMetaRow label="Size" value={item.size} />}
              {typeof item.evidence === 'number'   && <PreviewMetaRow label="Evidence pts" value={item.evidence} />}
            </div>
          </section>

          {/* Tags */}
          {item.tags?.length > 0 && (
            <section>
              <p className="text-[10px] font-bold tracking-widest uppercase mb-2"
                style={{ color: 'var(--text-muted)' }}>Tags</p>
              <div className="flex flex-wrap gap-1.5">
                {item.tags.map(t => (
                  <span key={t} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold"
                    style={{ background: 'rgba(43,127,255,0.10)', border: '1px solid rgba(43,127,255,0.30)', color: '#80AFFF' }}>
                    <Tag size={9} /> {t}
                  </span>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Footer actions */}
        <div className="sticky bottom-0 shrink-0 px-5 py-4 flex items-center gap-2"
          style={{ background: 'var(--modal-bg, #0b1220)', borderTop: '1px solid var(--border-subtle)' }}>
          <button onClick={onClose}
            className="flex-1 py-2 rounded-lg text-[12px] font-semibold transition-colors cursor-pointer"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}
          >
            Close
          </button>
          <button onClick={() => { onTogglePick(); onClose() }}
            className="flex-1 py-2 rounded-lg text-[12px] font-semibold flex items-center justify-center gap-1.5 transition-all hover:brightness-110 cursor-pointer"
            style={{
              background: isPicked
                ? 'rgba(239,68,68,0.16)'
                : 'linear-gradient(135deg,#00C2C2 0%,#155DFC 100%)',
              border: isPicked ? '1px solid rgba(239,68,68,0.40)' : 'none',
              color: isPicked ? '#f87171' : '#fff',
            }}
          >
            {isPicked ? <><Trash2 size={12} /> Remove from pack</> : <><Plus size={12} /> Add to pack</>}
          </button>
        </div>
      </div>
    </div>
  )
}

function PreviewMetaRow({ label, value }) {
  return (
    <div>
      <p className="text-[9px] font-semibold tracking-wider uppercase mb-0.5"
        style={{ color: 'var(--text-muted)' }}>{label}</p>
      <p style={{ color: 'var(--text-primary)' }}>{value}</p>
    </div>
  )
}

// Per-plane mock body content — adapts to the data shape of each plane.
function renderItemBody(item, plane) {
  if (plane === 'truth') {
    return {
      label: 'Verified statement',
      text: `${item.title}. This statement has been verified by ${item.owner} with ${item.confidence}% confidence and is currently ${item.status}. Audit trail and supporting context would render here in production — including review history, source citations, and any flagged exceptions.`,
    }
  }
  if (plane === 'sandbox') {
    return {
      label: 'Hypothesis under validation',
      text: `${item.title}. Backed by ${item.evidence} evidence point${item.evidence === 1 ? '' : 's'} so far, with a current confidence score of ${item.confidence}%. Owned by ${item.owner}. The full validation log — experiments run, sample sizes, and statistical significance — would render here in production.`,
    }
  }
  // sources
  return {
    label: 'File',
    text: `${item.title} — ${item.size} ${item.type?.toUpperCase() ?? 'file'}, last updated ${item.updated} by ${item.owner}. In production, an inline document viewer (or a quick-link to open in the source drive) would render here.`,
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// STEP 3 — DEFAULT TOGGLES
// ═══════════════════════════════════════════════════════════════════════════
function TogglesStep({ data, setData }) {
  const counts = { truth: data.truth.length, sandbox: data.sandbox.length, sources: data.sources.length }
  return (
    <div className="px-8 py-6 max-w-3xl">
      <p className="text-[10px] font-bold tracking-widest uppercase mb-1.5"
        style={{ color: 'var(--text-muted)' }}>Step 3 · Default toggles</p>
      <h2 className="text-xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Which planes are active when this pack is attached?</h2>
      <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
        Set the defaults — attachers can override these per agent at attachment time.
      </p>

      <div className="rounded-xl overflow-hidden"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
        {Object.entries(PLANE_META).map(([k, m], idx) => {
          const Icon = m.icon
          const enabled = data.toggles[k]
          return (
            <div key={k}
              className="flex items-center gap-4 px-5 py-4"
              style={{ borderTop: idx > 0 ? '1px solid var(--border-subtle)' : 'none' }}>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: m.bg, border: `1px solid ${m.border}` }}>
                <Icon size={16} style={{ color: m.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>{m.label}</p>
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                    style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-secondary)' }}>
                    {counts[k]} item{counts[k] === 1 ? '' : 's'}
                  </span>
                </div>
                <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{m.desc}</p>
              </div>
              <button type="button"
                onClick={() => setData(d => ({ ...d, toggles: { ...d.toggles, [k]: !d.toggles[k] } }))}
                className="shrink-0 transition-all"
                aria-pressed={enabled}
                style={{
                  width: 44, height: 24, borderRadius: 999,
                  background: enabled ? 'linear-gradient(135deg,#00C2C2 0%,#155DFC 100%)' : 'rgba(255,255,255,0.10)',
                  border: '1px solid', borderColor: enabled ? 'transparent' : 'var(--border-subtle)',
                  position: 'relative', cursor: 'pointer',
                }}>
                <span style={{
                  position: 'absolute', top: 2, left: enabled ? 22 : 2,
                  width: 18, height: 18, borderRadius: '50%',
                  background: '#fff', transition: 'left .15s ease',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
                }} />
              </button>
            </div>
          )
        })}
      </div>

      <div className="mt-4 px-3.5 py-2.5 rounded-lg flex items-start gap-2"
        style={{ background: 'rgba(43,127,255,0.06)', border: '1px solid rgba(43,127,255,0.20)' }}>
        <AlertCircle size={12} style={{ color: '#80AFFF' }} className="mt-0.5 shrink-0" />
        <p className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
          A plane being toggled OFF means its items are bundled but not delivered to attached agents — until an attacher overrides this default at attachment time.
        </p>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// STEP 4 — ACCESS (Tenant scope + Permissions in cascade)
// ═══════════════════════════════════════════════════════════════════════════
function AccessStep({ data, setData }) {
  const TIERS = [
    { id: 'workspace',   icon: Building2, label: 'Anyone with tenant access', desc: 'Anyone who has access to the tenant(s) above can use this pack.' },
    { id: 'departments', icon: Users,     label: 'Specific departments',      desc: 'Limit to selected departments within the tenant(s).' },
    { id: 'custom',      icon: Lock,      label: 'Custom rule',               desc: 'Mix of departments, roles, groups, and named users.' },
  ]
  const tier = data.access.tier
  const setTier = (id) => setData(d => ({ ...d, access: { ...d.access, tier: id } }))
  const toggleInList = (key, value) => setData(d => {
    const list = d.access[key]
    return { ...d, access: { ...d.access, [key]: list.includes(value) ? list.filter(x => x !== value) : [...list, value] } }
  })

  // Scope handlers (moved from Basics)
  const setScope = (id) => setData(d => ({
    ...d,
    scope: id,
    ...(id === 'global' ? { tenantMode: 'all', tenants: [] } : {}),
  }))
  const setTenantMode = (id) => setData(d => ({
    ...d,
    tenantMode: id,
    ...(id === 'all' ? { tenants: [] } : {}),
  }))
  const toggleTenant = (id) => setData(d => ({
    ...d,
    tenants: d.tenants.includes(id) ? d.tenants.filter(x => x !== id) : [...d.tenants, id],
  }))

  // Reactive permissions question text
  const permissionsContext =
    data.scope === 'global'
      ? 'Within this workspace, who can use this pack?'
      : data.tenantMode === 'all'
      ? 'Within all tenants in this workspace, who can use this pack?'
      : data.tenants.length === 0
      ? 'Pick tenants above first, then choose who within them can use the pack.'
      : data.tenants.length === 1
      ? `Within ${availableTenants.find(t => t.id === data.tenants[0])?.name || 'the selected tenant'}, who can use this pack?`
      : `Within the ${data.tenants.length} selected tenants, who can use this pack?`

  return (
    <div className="px-8 py-6 max-w-3xl">
      <p className="text-[10px] font-bold tracking-widest uppercase mb-1.5"
        style={{ color: 'var(--text-muted)' }}>Step 4 · Access</p>
      <h2 className="text-xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Who can see and use this pack?</h2>
      <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
        Two decisions in cascade — first the tenant scope, then permissions within those tenants. Pack owners always have full access.
      </p>

      {/* ════════════════════════════════════════════════ */}
      {/*  SUB-SECTION 1 · TENANT SCOPE                    */}
      {/* ════════════════════════════════════════════════ */}
      <fieldset className="border-0 p-0 m-0 mb-5">
        <legend className="text-[10px] font-bold tracking-widest uppercase mb-2.5"
          style={{ color: 'var(--text-muted)' }}>Tenant scope</legend>

        <div className="grid grid-cols-2 gap-2">
          {SCOPE_OPTIONS.map(opt => {
            const isActive = data.scope === opt.id
            return (
              <button key={opt.id} type="button" onClick={() => setScope(opt.id)}
                className="text-left px-4 py-3 rounded-xl transition-all min-h-[44px]"
                style={{
                  background: isActive ? 'rgba(43,127,255,0.08)' : 'var(--bg-card)',
                  border: `1px solid ${isActive ? 'rgba(43,127,255,0.45)' : 'var(--border-subtle)'}`,
                  cursor: 'pointer',
                }}>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-4 h-4 rounded-full shrink-0 flex items-center justify-center"
                    style={{
                      background: isActive ? 'linear-gradient(135deg,#00C2C2 0%,#155DFC 100%)' : 'transparent',
                      border: `1.5px solid ${isActive ? 'transparent' : 'rgba(255,255,255,0.20)'}`,
                    }}>
                    {isActive && <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#fff' }} />}
                  </div>
                  <span className="text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>{opt.label}</span>
                </div>
                <p className="text-[11px] leading-snug ml-6" style={{ color: 'var(--text-muted)' }}>{opt.desc}</p>
              </button>
            )
          })}
        </div>

        {/* Tenant picker (only when scope === 'workspace') */}
        {data.scope === 'workspace' && (
          <div className="mt-3 rounded-xl px-4 py-3.5"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
            aria-live="polite">
            <p className="text-[11px] font-semibold mb-2.5" style={{ color: 'var(--text-secondary)' }}>
              Which tenants?
            </p>
            <div className="flex flex-col gap-1.5 mb-3">
              {TENANT_MODE_OPTIONS.map(opt => {
                const isActive = data.tenantMode === opt.id
                return (
                  <button key={opt.id} type="button" onClick={() => setTenantMode(opt.id)}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition-colors min-h-[44px]"
                    style={{
                      background: isActive ? 'rgba(43,127,255,0.06)' : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${isActive ? 'rgba(43,127,255,0.3)' : 'transparent'}`,
                      cursor: 'pointer',
                    }}>
                    <div className="w-4 h-4 rounded-full shrink-0 flex items-center justify-center"
                      style={{
                        background: isActive ? 'linear-gradient(135deg,#00C2C2 0%,#155DFC 100%)' : 'transparent',
                        border: `1.5px solid ${isActive ? 'transparent' : 'rgba(255,255,255,0.20)'}`,
                      }}>
                      {isActive && <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#fff' }} />}
                    </div>
                    <span className="text-[12px]" style={{ color: 'var(--text-primary)' }}>{opt.label}</span>
                  </button>
                )
              })}
            </div>

            {data.tenantMode === 'specific' && (
              <>
                <p className="text-[10px] font-semibold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                  Pick tenants <span className="normal-case">({data.tenants.length} selected)</span>
                </p>
                <div className="grid grid-cols-2 gap-1.5">
                  {availableTenants.map(t => {
                    const isSelected = data.tenants.includes(t.id)
                    return (
                      <button key={t.id} type="button" onClick={() => toggleTenant(t.id)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-all min-h-[44px]"
                        style={{
                          background: isSelected ? 'rgba(43,127,255,0.10)' : 'rgba(255,255,255,0.03)',
                          border: `1px solid ${isSelected ? 'rgba(43,127,255,0.40)' : 'var(--border-subtle)'}`,
                          cursor: 'pointer',
                        }}>
                        <div className="w-3.5 h-3.5 rounded shrink-0 flex items-center justify-center"
                          style={{
                            background: isSelected ? 'linear-gradient(135deg,#00C2C2 0%,#155DFC 100%)' : 'transparent',
                            border: `1.5px solid ${isSelected ? 'transparent' : 'rgba(255,255,255,0.20)'}`,
                          }}>
                          {isSelected && <Check size={9} color="#fff" strokeWidth={3} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{t.name}</p>
                          <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{t.region}</p>
                        </div>
                      </button>
                    )
                  })}
                </div>
                {data.tenants.length === 0 && (
                  <p className="text-[10px] mt-2 flex items-center gap-1" style={{ color: '#fbbf24' }}>
                    <AlertCircle size={10} /> Pick at least one tenant or switch to "All tenants".
                  </p>
                )}
              </>
            )}
          </div>
        )}
      </fieldset>

      {/* ════════════════════════════════════════════════ */}
      {/*  SUB-SECTION 2 · PERMISSIONS (cascade indented)  */}
      {/* ════════════════════════════════════════════════ */}
      <div className="relative pl-5">
        {/* Cascade vertical line */}
        <div className="absolute left-1 top-0 bottom-0 w-px"
          style={{ background: 'linear-gradient(180deg, rgba(43,127,255,0.4) 0%, var(--border-subtle) 100%)' }} />

        <fieldset className="border-0 p-0 m-0">
          <legend className="text-[10px] font-bold tracking-widest uppercase mb-1"
            style={{ color: 'var(--text-muted)' }}>Permissions</legend>
          <p className="text-[12px] mb-3" style={{ color: 'var(--text-secondary)' }} aria-live="polite">
            {permissionsContext}
          </p>

          {/* Tiers */}
          <div className="space-y-2 mb-4">
            {TIERS.map(t => {
              const Icon = t.icon
              const isActive = tier === t.id
              return (
                <button key={t.id} type="button" onClick={() => setTier(t.id)}
                  className="w-full flex items-start gap-3 px-4 py-3 rounded-xl text-left transition-all min-h-[44px]"
                  style={{
                    background: isActive ? 'rgba(43,127,255,0.08)' : 'var(--bg-card)',
                    border: `1px solid ${isActive ? 'rgba(43,127,255,0.45)' : 'var(--border-subtle)'}`,
                    cursor: 'pointer',
                  }}>
                  <div className="w-4 h-4 rounded-full shrink-0 mt-0.5 flex items-center justify-center"
                    style={{
                      background: isActive ? 'linear-gradient(135deg,#00C2C2 0%,#155DFC 100%)' : 'transparent',
                      border: `1.5px solid ${isActive ? 'transparent' : 'rgba(255,255,255,0.20)'}`,
                    }}>
                    {isActive && <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#fff' }} />}
                  </div>
                  <Icon size={14} style={{ color: isActive ? '#80AFFF' : 'var(--text-secondary)' }} className="shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>{t.label}</p>
                    <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{t.desc}</p>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Tier-specific pickers */}
          {tier === 'departments' && (
            <ChipPicker
              label="Departments with access"
              options={accessDepartments}
              selected={data.access.departments}
              onToggle={v => toggleInList('departments', v)} />
          )}

          {tier === 'custom' && (
            <div className="space-y-4">
              <ChipPicker label="Departments" options={accessDepartments}
                selected={data.access.departments} onToggle={v => toggleInList('departments', v)} />
              <ChipPicker label="Roles" options={accessRoles}
                selected={data.access.roles} onToggle={v => toggleInList('roles', v)} />
              <ChipPicker label="Groups" options={accessGroups}
                selected={data.access.groups} onToggle={v => toggleInList('groups', v)} />
              <UserPicker label="Specific users" options={accessUsers}
                selected={data.access.users} onToggle={v => toggleInList('users', v)} />
            </div>
          )}
        </fieldset>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// STEP 5 — REVIEW
// ═══════════════════════════════════════════════════════════════════════════
function ReviewStep({ data, valid }) {
  const totalItems = data.truth.length + data.sandbox.length + data.sources.length
  return (
    <div className="px-8 py-6 max-w-4xl">
      <p className="text-[10px] font-bold tracking-widest uppercase mb-1.5"
        style={{ color: 'var(--text-muted)' }}>Step 5 · Review</p>
      <h2 className="text-xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Confirm the pack and save</h2>
      <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
        Review everything below. Save as draft to revise later, or publish to make this pack attachable to agents.
      </p>

      {!valid && (
        <div className="mb-4 px-3.5 py-2.5 rounded-lg flex items-start gap-2"
          style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.25)' }}>
          <AlertCircle size={12} style={{ color: '#f87171' }} className="mt-0.5 shrink-0" />
          <p className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
            Some required fields are missing. Go back to Basics or Composition to complete the pack before publishing.
          </p>
        </div>
      )}

      {/* Identity card */}
      <SummaryCard title="Identity" icon={FileText}>
        <SummaryRow label="Name" value={data.name || <em style={{ color: 'var(--text-muted)' }}>(not set)</em>} />
        {data.description && <SummaryRow label="Description" value={data.description} />}
        <SummaryRow label="Owner" value={data.owner} />
        <SummaryRow label="Department" value={data.department || <em style={{ color: 'var(--text-muted)' }}>Cross-departmental</em>} />
      </SummaryCard>

      {/* Composition */}
      <SummaryCard title={`Composition (${totalItems} items)`} icon={Database}>
        {Object.entries(PLANE_META).map(([k, m]) => {
          const Icon = m.icon
          const ids = data[k]
          return (
            <div key={k} className="flex items-start justify-between py-2"
              style={{ borderTop: '1px solid var(--border-subtle)' }}>
              <div className="flex items-center gap-2">
                <Icon size={12} style={{ color: m.color }} />
                <span className="text-[12px] font-semibold" style={{ color: 'var(--text-primary)' }}>{m.label}</span>
              </div>
              <span className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
                {ids.length} item{ids.length === 1 ? '' : 's'}
              </span>
            </div>
          )
        })}
      </SummaryCard>

      {/* Toggles */}
      <SummaryCard title="Default toggles" icon={ToggleRight}>
        {Object.entries(PLANE_META).map(([k, m]) => (
          <SummaryRow key={k} label={m.label} value={
            <span style={{ color: data.toggles[k] ? '#4ade80' : 'var(--text-muted)' }}>
              {data.toggles[k] ? 'Active by default' : 'Inactive by default'}
            </span>
          } />
        ))}
      </SummaryCard>

      {/* Access — tenant scope cascades into permissions */}
      <SummaryCard title="Access" icon={Lock}>
        <SummaryRow label="Tenant scope" value={
          data.scope === 'global' ? 'Global (all tenants)' :
          data.tenantMode === 'all' ? 'Workspace — all tenants' :
          `Workspace — ${data.tenants.length} tenant${data.tenants.length === 1 ? '' : 's'}`
        } />
        {data.scope === 'workspace' && data.tenantMode === 'specific' && data.tenants.length > 0 && (
          <SummaryRow label="Tenants" value={
            data.tenants.map(id => availableTenants.find(t => t.id === id)?.name).filter(Boolean).join(', ')
          } />
        )}
        <SummaryRow label="Permissions" value={
          data.access.tier === 'workspace' ? 'Anyone with tenant access' :
          data.access.tier === 'departments' ? 'Specific departments' :
          'Custom rule'
        } />
        {data.access.departments.length > 0 && <SummaryRow label="Departments" value={data.access.departments.join(', ')} />}
        {data.access.roles.length       > 0 && <SummaryRow label="Roles"       value={data.access.roles.join(', ')} />}
        {data.access.groups.length      > 0 && <SummaryRow label="Groups"      value={data.access.groups.join(', ')} />}
        {data.access.users.length       > 0 && <SummaryRow label="Users"       value={data.access.users.length + ' selected'} />}
      </SummaryCard>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// SHARED HELPERS
// ═══════════════════════════════════════════════════════════════════════════
function Field({ label, required, error, hint, children }) {
  return (
    <label className="block">
      <div className="flex items-center gap-1.5 mb-1.5">
        <span className="text-[11px] font-semibold" style={{ color: 'var(--text-secondary)' }}>{label}</span>
        {required && <span style={{ color: '#f87171' }}>*</span>}
      </div>
      {children}
      {hint && !error && <p className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>{hint}</p>}
      {error && <p className="text-[10px] mt-1" style={{ color: '#f87171' }}>{error}</p>}
    </label>
  )
}

function ChipPicker({ label, options, selected, onToggle }) {
  return (
    <div>
      <p className="text-[11px] font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
        {label} <span style={{ color: 'var(--text-muted)' }}>({selected.length} selected)</span>
      </p>
      <div className="flex flex-wrap gap-1.5">
        {options.map(opt => {
          const isSelected = selected.includes(opt)
          return (
            <button key={opt} type="button" onClick={() => onToggle(opt)}
              className="text-[11px] font-semibold px-2.5 py-1 rounded-full transition-all"
              style={{
                background: isSelected ? 'rgba(43,127,255,0.16)' : 'rgba(255,255,255,0.04)',
                color: isSelected ? '#80AFFF' : 'var(--text-secondary)',
                border: `1px solid ${isSelected ? 'rgba(43,127,255,0.40)' : 'var(--border-subtle)'}`,
                cursor: 'pointer',
              }}>
              {isSelected && <Check size={10} className="inline -mt-0.5 mr-1" />}
              {opt}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function UserPicker({ label, options, selected, onToggle }) {
  return (
    <div>
      <p className="text-[11px] font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
        {label} <span style={{ color: 'var(--text-muted)' }}>({selected.length} selected)</span>
      </p>
      <div className="grid grid-cols-2 gap-1.5">
        {options.map(u => {
          const isSelected = selected.includes(u.id)
          return (
            <button key={u.id} type="button" onClick={() => onToggle(u.id)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-all"
              style={{
                background: isSelected ? 'rgba(43,127,255,0.08)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${isSelected ? 'rgba(43,127,255,0.40)' : 'var(--border-subtle)'}`,
                cursor: 'pointer',
              }}>
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0"
                style={{ background: 'linear-gradient(135deg,#a78bfa,#60a5fa)' }}>
                {u.initials}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-[11px] font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{u.name}</p>
                <p className="text-[9px]" style={{ color: 'var(--text-muted)' }}>{u.dept}</p>
              </div>
              {isSelected && <Check size={11} style={{ color: '#80AFFF' }} className="shrink-0" />}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function SummaryCard({ title, icon: Icon, children }) {
  return (
    <div className="rounded-xl overflow-hidden mb-3"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
      <div className="flex items-center gap-2 px-4 py-2.5"
        style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        <Icon size={12} style={{ color: 'var(--text-muted)' }} />
        <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>{title}</span>
      </div>
      <div className="px-4 py-2">{children}</div>
    </div>
  )
}

function SummaryRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-3 py-1.5">
      <span className="text-[11px] shrink-0" style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span className="text-[11px] text-right" style={{ color: 'var(--text-primary)' }}>{value}</span>
    </div>
  )
}
