import React, { useState, useMemo, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import {
  BookOpen, Plus, Filter, LayoutGrid, List, Users, Bot, Network,
  FileText, Clock, TrendingUp, AlertTriangle, Sparkles, X,
  Building2, Search, CheckCircle, Archive, Copy, Edit, Activity,
  Shield, Calendar, Eye, ChevronRight,
} from 'lucide-react'
import {
  truthPacks as SEED, userDrafts,
  getPacksForWorkflow, getWorkflowEnvironmentDefault,
  getTraceForRun,
} from '../../../data/mockKnowledge'
import {
  SearchBar, ThreeDot, AllFiltersPanel, FilterSection, Modal, FormField,
} from '../../ui/index'
import TruthPackSlideOut from './TruthPackSlideOut'
import NewKnowledgePackModal from './NewKnowledgePackModal'
import KnowledgePackTemplateLibrary from './KnowledgePackTemplateLibrary'
import KnowledgePackChat from './KnowledgePackChat'
import WorkflowKnowledgeView from './WorkflowKnowledgeView'
import TestWorkflowView from './TestWorkflowView'

// ── Design-system maps ────────────────────────────────────────────────────────

const STATUS_MAP = {
  active:   { label: 'Active',   bg: 'rgba(34,197,94,0.1)',   border: 'rgba(34,197,94,0.3)',   color: '#4ade80',  dot: '#22c55e' },
  draft:    { label: 'Draft',    bg: 'rgba(59,130,246,0.1)',  border: 'rgba(59,130,246,0.3)',  color: '#60a5fa',  dot: '#3b82f6' },
  archived: { label: 'Archived', bg: 'rgba(100,116,139,0.1)', border: 'rgba(100,116,139,0.3)', color: '#94a3b8', dot: '#64748b' },
}

const ACCESS_MAP = {
  users:             { label: 'Users',             color: '#60a5fa', bg: 'rgba(59,130,246,0.1)',  border: 'rgba(59,130,246,0.3)',  icon: Users   },
  agents:            { label: 'Agents',            color: '#a78bfa', bg: 'rgba(124,92,252,0.1)', border: 'rgba(124,92,252,0.3)', icon: Bot     },
  'agentic-networks':{ label: 'Agentic Networks',  color: '#2dd4bf', bg: 'rgba(20,184,166,0.1)', border: 'rgba(20,184,166,0.3)', icon: Network },
  mixed:             { label: 'Mixed Access',      color: '#fbbf24', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)', icon: Users   },
}

// ── Pill helper ───────────────────────────────────────────────────────────────

function FilterPill({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={clsx('text-[10px] font-medium px-2.5 py-1 rounded-full border transition-all', active && 'ring-1 ring-offset-0')}
      style={active
        ? { background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.45)', color: '#4ade80', ringColor: '#22c55e' }
        : { background: 'var(--filter-pill-bg)', border: '1px solid var(--filter-pill-border)', color: 'var(--filter-pill-color)' }}>
      {label}
    </button>
  )
}

// ── Stat card ─────────────────────────────────────────────────────────────────

function SummaryMetric({ icon: Icon, value, label, color }) {
  return (
    <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl"
      style={{ background: `${color}0d`, border: `1px solid ${color}28` }}>
      <div className="p-1.5 rounded-lg" style={{ background: `${color}18` }}>
        <Icon size={13} style={{ color }} />
      </div>
      <div>
        <p className="text-base font-bold leading-none" style={{ color }}>{value}</p>
        <p className="text-[10px] text-text-muted mt-0.5">{label}</p>
      </div>
    </div>
  )
}

// ── Drafts pill: collapsed banner above the packs table ──────────────────────
// Shows up to 3 drafts as compact chips. Clicking a chip resumes that draft.
// When more than 3 drafts exist, a "+N more" trigger opens a dropdown with
// the full list (scrolls past 6 rows). ESC and click-outside dismiss.
function DraftsPill({ drafts, onResume }) {
  const [showAll, setShowAll] = useState(false)
  const ref = useRef(null)
  const top = drafts.slice(0, 3)
  const overflow = Math.max(0, drafts.length - 3)

  useEffect(() => {
    if (!showAll) return
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setShowAll(false) }
    const onKey = (e) => { if (e.key === 'Escape') setShowAll(false) }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [showAll])

  const resume = (id) => { setShowAll(false); onResume(id) }

  return (
    <div ref={ref} className="relative">
      <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl"
        style={{ background: 'rgba(43,127,255,0.06)', border: '1px solid rgba(43,127,255,0.20)' }}>
        <div className="flex items-center gap-2 shrink-0">
          <Clock size={13} style={{ color: '#80AFFF' }} />
          <p className="text-[11px] font-semibold whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>
            Resume drafts <span style={{ color: 'var(--text-muted)' }}>({drafts.length})</span>
          </p>
        </div>
        <div className="flex items-center gap-2 flex-1 min-w-0 overflow-x-auto">
          {top.map(d => (
            <button
              key={d.id}
              onClick={() => onResume(d.id)}
              className="flex items-center gap-2 px-2.5 py-1 rounded-lg transition-all hover:brightness-125 cursor-pointer shrink-0"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-subtle)' }}
              title={`${d.completion}% complete · saved ${d.savedAgo}`}
            >
              <span className="text-[11px] font-semibold truncate max-w-[180px]"
                style={{ color: 'var(--text-primary)' }}>{d.name}</span>
              <span className="text-[10px] tabular-nums whitespace-nowrap"
                style={{ color: '#80AFFF' }}>{d.completion}%</span>
            </button>
          ))}
          {overflow > 0 && (
            <button
              onClick={() => setShowAll(s => !s)}
              aria-haspopup="listbox"
              aria-expanded={showAll}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold tabular-nums whitespace-nowrap transition-all hover:brightness-125 cursor-pointer shrink-0"
              style={{
                background: showAll ? 'rgba(43,127,255,0.16)' : 'rgba(43,127,255,0.08)',
                border: `1px solid ${showAll ? 'rgba(43,127,255,0.45)' : 'rgba(43,127,255,0.30)'}`,
                color: '#80AFFF',
              }}
            >
              +{overflow} more
              <ChevronRight size={9} className={`transition-transform ${showAll ? 'rotate-90' : ''}`} />
            </button>
          )}
        </div>
      </div>

      {/* Dropdown — full draft list */}
      {showAll && (
        <div
          role="listbox"
          aria-label="All drafts"
          className="absolute top-full left-0 right-0 mt-2 z-40 rounded-xl shadow-2xl overflow-hidden"
          style={{ background: 'var(--modal-bg, #0b1220)', border: '1px solid var(--border-subtle)' }}
        >
          <div className="px-4 py-2.5 flex items-center justify-between"
            style={{ borderBottom: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.02)' }}>
            <p className="text-[10px] font-bold tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>
              All drafts ({drafts.length})
            </p>
            <button onClick={() => setShowAll(false)} aria-label="Close drafts list"
              className="text-[10px] font-semibold cursor-pointer"
              style={{ color: 'var(--text-muted)' }}>
              Close
            </button>
          </div>
          <div className="max-h-[320px] overflow-y-auto">
            {drafts.map(d => (
              <button
                key={d.id}
                role="option"
                onClick={() => resume(d.id)}
                className="w-full grid grid-cols-[1fr_auto_60px] items-center gap-3 px-4 py-2.5 text-left transition-colors hover:brightness-125 cursor-pointer"
                style={{ borderBottom: '1px solid var(--border-subtle)' }}
              >
                <div className="min-w-0">
                  <p className="text-[12px] font-semibold truncate"
                    style={{ color: 'var(--text-primary)' }}>{d.name}</p>
                  <p className="text-[10px] truncate" style={{ color: 'var(--text-muted)' }}>
                    {d.department || 'Cross-departmental'} · {d.itemsCount} items · saved {d.savedAgo}
                  </p>
                </div>
                <span className="text-[10px] font-bold tabular-nums tracking-wide"
                  style={{ color: '#80AFFF' }}>{d.completion}%</span>
                <div className="h-1 rounded-full overflow-hidden"
                  style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <div className="h-full"
                    style={{
                      width: `${d.completion}%`,
                      background: 'linear-gradient(90deg,#00C2C2,#155DFC)',
                    }}
                  />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Grid card ─────────────────────────────────────────────────────────────────

function PackGridCard({ pack, onSelect, onPreview, onEdit, onArchive, onDuplicate }) {
  const st = STATUS_MAP[pack.status] || STATUS_MAP.draft
  const at = ACCESS_MAP[pack.accessType] || ACCESS_MAP.users

  const menuItems = [
    { label: 'Edit',         icon: Edit,     onClick: () => onEdit?.(pack)      },
    { label: 'Preview',      icon: Eye,      onClick: () => onPreview?.(pack)   },
    { label: 'Add Access',   icon: Users,    onClick: () => onSelect?.(pack)    },
    { label: 'Duplicate',    icon: Copy,     onClick: () => onDuplicate?.(pack) },
    { label: 'Archive',      icon: Archive,  onClick: () => onArchive?.(pack), danger: pack.status !== 'archived' },
  ]

  return (
    <div
      className="glass-card p-4 flex flex-col gap-3 cursor-pointer hover:border-white/15 transition-all relative group"
      style={{ borderLeft: `3px solid ${st.dot}` }}
      onClick={() => onSelect?.(pack)}>

      {/* Top row: status + 3-dot */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full"
            style={{ background: st.bg, border: `1px solid ${st.border}`, color: st.color }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: st.dot }} />
            {st.label}
          </span>
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full"
            style={{ background: at.bg, border: `1px solid ${at.border}`, color: at.color }}>
            {at.label}
          </span>
          {pack.isStale && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', color: '#fbbf24' }}>
              <AlertTriangle size={8} /> Stale
            </span>
          )}
        </div>
        <div onClick={e => e.stopPropagation()}>
          <ThreeDot items={menuItems} />
        </div>
      </div>

      {/* Name + description */}
      <div className="space-y-1">
        <p className="text-sm font-semibold text-text-primary leading-snug">{pack.name}</p>
        <p className="text-[11px] text-text-muted leading-relaxed line-clamp-2">{pack.description}</p>
      </div>

      {/* Dept / scope tags */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#64748b' }}>
          <Building2 size={8} /> {pack.department}
        </span>
        <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#64748b' }}>
          {pack.scope}
        </span>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-1.5">
        {[
          { icon: FileText, val: pack.factsCount,   label: 'facts',   color: '#22c55e' },
          { icon: Users,    val: pack.usersCount,   label: 'users',   color: '#60a5fa' },
          { icon: Bot,      val: pack.agentsCount,  label: 'agents',  color: '#a78bfa' },
          { icon: Network,  val: pack.networksCount,label: 'networks',color: '#2dd4bf' },
        ].map(({ icon: Icon, val, label, color }) => (
          <div key={label} className="rounded-lg p-2 text-center"
            style={{ background: `${color}0a`, border: `1px solid ${color}20` }}>
            <p className="text-sm font-bold" style={{ color }}>{val}</p>
            <p className="text-[9px] text-text-muted leading-tight mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Footer: owner + updated + CTA */}
      <div className="flex items-center gap-2 pt-0.5">
        <div className="w-4 h-4 rounded-full flex items-center justify-center text-[7px] font-bold text-white shrink-0"
          style={{ background: pack.ownerGradient }}>{pack.ownerInitials}</div>
        <span className="text-[11px] text-text-muted truncate">{pack.owner}</span>
        <span className="text-text-muted opacity-30">·</span>
        <span className="text-[10px] text-text-muted">{pack.lastUpdated}</span>
        <div className="ml-auto flex items-center gap-1.5 shrink-0">
          <button
            className="btn-ghost p-1.5 rounded-lg"
            title="Preview"
            onClick={e => { e.stopPropagation(); onPreview?.(pack) }}>
            <Eye size={14} />
          </button>
          <button
            className="text-[10px] font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all hover:brightness-110"
            style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)', color: '#4ade80' }}
            onClick={e => { e.stopPropagation(); onSelect?.(pack) }}>
            Manage
          </button>
        </div>
      </div>

    </div>
  )
}

// ── List row card ─────────────────────────────────────────────────────────────

function PackListCard({ pack, selected, onSelect, onPreview, onEdit, onArchive, onDuplicate }) {
  const st = STATUS_MAP[pack.status] || STATUS_MAP.draft
  const at = ACCESS_MAP[pack.accessType] || ACCESS_MAP.users

  const menuItems = [
    { label: 'Edit',         icon: Edit,     onClick: () => onEdit?.(pack)      },
    { label: 'Preview',      icon: Eye,      onClick: () => onPreview?.(pack)   },
    { label: 'Add Access',   icon: Users,    onClick: () => onSelect?.(pack)    },
    { label: 'Duplicate',    icon: Copy,     onClick: () => onDuplicate?.(pack) },
    { label: 'Archive',      icon: Archive,  onClick: () => onArchive?.(pack), danger: pack.status !== 'archived' },
  ]

  return (
    <div
      className={clsx('row-item cursor-pointer', selected && 'selected')}
      style={{ borderLeft: `3px solid ${st.dot}` }}
      onClick={() => onSelect?.(pack)}>
      <div className="flex items-center gap-3 pr-2">

        {/* Icon */}
        <div className="p-2 rounded-lg shrink-0"
          style={{ background: 'rgba(34,197,94,0.1)' }}>
          <BookOpen size={14} style={{ color: '#22c55e' }} />
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <p className="text-sm font-semibold text-text-primary">{pack.name}</p>
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full"
              style={{ background: st.bg, border: `1px solid ${st.border}`, color: st.color }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: st.dot }} />{st.label}
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full"
              style={{ background: at.bg, border: `1px solid ${at.border}`, color: at.color }}>
              {at.label}
            </span>
            {pack.isStale && (
              <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', color: '#fbbf24' }}>
                <AlertTriangle size={8} /> Stale
              </span>
            )}
          </div>
          <p className="text-xs text-text-muted line-clamp-1">{pack.description}</p>

          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            <span className="text-[10px] text-text-muted flex items-center gap-1">
              <Building2 size={9} /> {pack.department} · {pack.scope}
            </span>
            <span className="text-[10px] flex items-center gap-1" style={{ color: '#4ade80' }}>
              <FileText size={9} /> {pack.factsCount} facts
            </span>
            <span className="text-[10px] flex items-center gap-1" style={{ color: '#60a5fa' }}>
              <Users size={9} /> {pack.usersCount}
            </span>
            <span className="text-[10px] flex items-center gap-1" style={{ color: '#a78bfa' }}>
              <Bot size={9} /> {pack.agentsCount}
            </span>
            <span className="text-[10px] flex items-center gap-1" style={{ color: '#2dd4bf' }}>
              <Network size={9} /> {pack.networksCount}
            </span>
            <span className="text-[10px] text-text-muted flex items-center gap-1 ml-auto">
              <div className="w-3.5 h-3.5 rounded-full flex items-center justify-center text-[6px] font-bold text-white"
                style={{ background: pack.ownerGradient }}>{pack.ownerInitials}</div>
              {pack.owner}
              <span className="opacity-40">·</span>
              {pack.lastUpdated}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
          <button
            className="btn-ghost p-1.5 rounded-lg"
            title="Preview"
            onClick={() => onPreview?.(pack)}>
            <Eye size={14} />
          </button>
          <button
            className="text-[10px] font-semibold px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-all hover:brightness-110"
            style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', color: '#4ade80' }}
            onClick={() => onSelect?.(pack)}>
            Manage
          </button>
          <ThreeDot items={menuItems} />
        </div>
      </div>
    </div>
  )
}


// ── All Filters Panel content ─────────────────────────────────────────────────

function KnowledgeFiltersPanel({ filters, setFilters, onClose }) {
  const toggle = (key, val) =>
    setFilters(f => ({ ...f, [key]: f[key] === val ? 'All' : val }))
  const toggleBool = key =>
    setFilters(f => ({ ...f, [key]: !f[key] }))

  const Pill = ({ label, active, onClick }) => (
    <button onClick={onClick}
      className="text-[10px] font-medium px-2.5 py-1 rounded-full border transition-all"
      style={active
        ? { background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.45)', color: '#4ade80' }
        : { background: 'var(--filter-pill-bg)', border: '1px solid var(--filter-pill-border)', color: 'var(--filter-pill-color)' }}>
      {label}
    </button>
  )

  return (
    <AllFiltersPanel onClose={onClose} onClear={() => setFilters(DEFAULT_FILTERS)}>
      <FilterSection label="Status">
        {['active','draft','archived'].map(s => (
          <Pill key={s} label={STATUS_MAP[s].label} active={filters.status === s}
            onClick={() => toggle('status', s)} />
        ))}
      </FilterSection>

      <FilterSection label="Access Type">
        {Object.entries(ACCESS_MAP).map(([id, { label }]) => (
          <Pill key={id} label={label} active={filters.accessType === id}
            onClick={() => toggle('accessType', id)} />
        ))}
      </FilterSection>

      <FilterSection label="Owner">
        {['Me', 'My Team', 'Sarah Chen', 'James Park', 'Alex Rivera', 'Emma Rodriguez'].map(o => (
          <Pill key={o} label={o} active={filters.owner === o}
            onClick={() => toggle('owner', o)} />
        ))}
      </FilterSection>

      <FilterSection label="Department / Scope">
        {['Legal', 'Compliance', 'Sales', 'Procurement', 'Technology', 'Finance', 'Partnerships'].map(d => (
          <Pill key={d} label={d} active={filters.department === d}
            onClick={() => toggle('department', d)} />
        ))}
      </FilterSection>

      <FilterSection label="Usage">
        {['high', 'medium', 'low'].map(u => (
          <Pill key={u} label={u.charAt(0).toUpperCase() + u.slice(1) + ' Usage'}
            active={filters.usage === u} onClick={() => toggle('usage', u)} />
        ))}
      </FilterSection>

      <FilterSection label="State">
        <Pill label="Has Facts"      active={filters.hasFacts}   onClick={() => toggleBool('hasFacts')} />
        <Pill label="Empty Pack"     active={filters.isEmpty}    onClick={() => toggleBool('isEmpty')} />
        <Pill label="Stale"          active={filters.stale}      onClick={() => toggleBool('stale')} />
        <Pill label="High Usage"     active={filters.highUsage}  onClick={() => toggleBool('highUsage')} />
      </FilterSection>
    </AllFiltersPanel>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

const DEFAULT_FILTERS = {
  status: 'All', accessType: 'All', owner: 'All', department: 'All', usage: 'All',
  hasFacts: false, isEmpty: false, stale: false, highUsage: false,
}

export default function Knowledge() {
  const navigate = useNavigate()
  const [packs, setPacks]               = useState(SEED)
  const [search, setSearch]             = useState('')
  const [quickStatus, setQuickStatus]   = useState('All')
  const [quickAccess, setQuickAccess]   = useState('All')
  const [quickOwner, setQuickOwner]     = useState('All')
  const [viewMode, setViewMode]         = useState('list')   // 'grid' | 'list'
  const [showFilters, setShowFilters]   = useState(false)
  // creationView: null | 'modes' | 'templates' | 'copilot' — multi-modal flow.
  const [creationView, setCreationView] = useState(null)

  // Workflow context — captured from URL when launched from Agentic Studio
  // (?workflowId=n1&workflowName=...&intent=restrict). Used to drive the
  // Workflow-Knowledge View as the first layer, instead of jumping straight
  // into the Copilot. This avoids the modal-on-modal-on-modal stack.
  const workflowContext = useMemo(() => {
    try {
      const p = new URLSearchParams(window.location.search)
      const id     = p.get('workflowId')
      const name   = p.get('workflowName')
      const intent = p.get('intent')
      if (!id && !name) return null
      return { workflowId: id, workflowName: name, intent }
    } catch { return null }
  }, [])

  // Mount the Workflow-Knowledge View as the entry point when workflow
  // context is present. The user can still close it (returns to standalone
  // Knowledge list) or click Modify to open the Copilot intentionally.
  const [showWorkflowView, setShowWorkflowView] = useState(() => !!workflowContext)
  const [selected, setSelected]         = useState(null)
  const [allFilters, setAllFilters]     = useState(DEFAULT_FILTERS)
  const [toast, setToast]               = useState(null)

  // D1: packs the user has explicitly detached in this session. Removed from
  // the slide-out view so the workflow visibly returns to "no constraint".
  const [detachedPackIds, setDetachedPackIds] = useState(() => new Set())
  // D2: transient set of pack ids that were just modified via the Copilot.
  // Drives a "Just updated" pill in the pack header. Auto-clears after 8s.
  const [recentlyUpdatedPackIds, setRecentlyUpdatedPackIds] = useState(() => new Set())
  // F1.1: when true, the slide-out replaces the inspection view with the
  // Test viewer. The parent (Agentic Studio) is told to expand to fullscreen
  // via postMessage so the trace tree has room.
  const [testMode, setTestMode] = useState(false)
  // F1.2: workflow environment (sandbox vs production). Seeded from the
  // mock defaults; the slide-out can flip it per session. Mirrors the
  // Truth/Sandbox Plane model — pack enforced in production, advisory in
  // sandbox.
  const [workflowEnvironment, setWorkflowEnvironment] = useState(() =>
    workflowContext ? getWorkflowEnvironmentDefault(workflowContext.workflowId) : 'production'
  )
  // M1 — session-level set of fact ids the user has re-attested in this
  // session. Treated as "not expired" by every check downstream, regardless
  // of the persisted attestation.nextReview. Resets on reload (no backend).
  const [reAttestedFactIds, setReAttestedFactIds] = useState(() => new Set())
  // M3 — when the user clicks "View trace" on an audit row, we open the
  // Test viewer with this historical trace + run id so it shows the past
  // execution instead of computing one fresh. Null means "live test mode".
  const [historicalRun, setHistoricalRun] = useState(null) // { runId, trace }

  // Effective list of packs attached to the active workflow, filtered for
  // session-level detaches. Recomputed when workflowContext or detach set
  // changes.
  const workflowPacks = useMemo(() => {
    if (!workflowContext) return []
    return getPacksForWorkflow(workflowContext.workflowId)
      .filter(p => !detachedPackIds.has(p.id))
  }, [workflowContext, detachedPackIds])

  const showToast = (msg, color = '#4ade80') => {
    setToast({ msg, color })
    setTimeout(() => setToast(null), 3000)
  }

  // ── Filtered packs ─────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return packs.filter(p => {
      // search
      if (search.trim()) {
        const q = search.toLowerCase()
        if (
          !p.name.toLowerCase().includes(q) &&
          !p.description.toLowerCase().includes(q) &&
          !p.department.toLowerCase().includes(q) &&
          !p.id.toLowerCase().includes(q)
        ) return false
      }
      // quick filters
      if (quickStatus !== 'All' && p.status !== quickStatus) return false
      if (quickAccess !== 'All' && p.accessType !== quickAccess) return false
      if (quickOwner === 'Me' && p.owner !== 'Alex Rivera') return false
      // all-filter overrides
      if (allFilters.status !== 'All' && p.status !== allFilters.status) return false
      if (allFilters.accessType !== 'All' && p.accessType !== allFilters.accessType) return false
      if (allFilters.department !== 'All' && p.department !== allFilters.department) return false
      if (allFilters.usage !== 'All' && p.usage !== allFilters.usage) return false
      if (allFilters.hasFacts   && p.factsCount === 0) return false
      if (allFilters.isEmpty    && p.factsCount > 0)  return false
      if (allFilters.stale      && !p.isStale)         return false
      if (allFilters.highUsage  && p.usage !== 'high') return false
      return true
    })
  }, [packs, search, quickStatus, quickAccess, quickOwner, allFilters])

  // ── Summary stats ──────────────────────────────────────────────────────────
  const stats = useMemo(() => ({
    total:   packs.length,
    active:  packs.filter(p => p.status === 'active').length,
    stale:   packs.filter(p => p.isStale).length,
    facts:   packs.reduce((s, p) => s + p.factsCount, 0),
  }), [packs])

  // ── Handlers ──────────────────────────────────────────────────────────────
  // handleCreate removed — creation flow now lives at /create + /create/scratch

  const handleArchive = (pack) => {
    setPacks(prev => prev.map(p => p.id === pack.id ? { ...p, status: 'archived' } : p))
    if (selected?.id === pack.id) setSelected(prev => ({ ...prev, status: 'archived' }))
    showToast(`"${pack.name}" archived`, '#94a3b8')
  }

  const handleDuplicate = (pack) => {
    const copy = {
      ...pack,
      id: `KP-${String(Math.floor(Math.random() * 900) + 100)}`,
      name: `${pack.name} (Copy)`,
      status: 'draft',
      factsCount: 0, usersCount: 0, agentsCount: 0, networksCount: 0,
      lastUpdated: new Date().toISOString().split('T')[0],
      recentActivity: [{ action: 'Duplicated from ' + pack.id, by: 'Alex Rivera', at: new Date().toISOString().split('T')[0] }],
    }
    setPacks(prev => [copy, ...prev])
    showToast(`"${copy.name}" created`)
  }

  const activeFilterCount = Object.entries(allFilters).filter(([k, v]) =>
    (typeof v === 'boolean' && v) || (typeof v === 'string' && v !== 'All')
  ).length

  // When launched from a workflow (Agentic Studio's "Knowledge" CTA), render
  // ONLY the Workflow-Knowledge View — the slide-out content. The generic
  // Knowledge list isn't relevant in this entry path. The Copilot still
  // mounts below (conditionally) for the Modify action.
  if (workflowContext && showWorkflowView) {
    return (
      <>
        <WorkflowKnowledgeView
          open={creationView !== 'copilot' && !testMode}
          workflowId={workflowContext.workflowId}
          workflowName={workflowContext.workflowName}
          packs={workflowPacks}
          recentlyUpdatedPackIds={recentlyUpdatedPackIds}
          reAttestedFactIds={reAttestedFactIds}
          onReAttest={(factIds) => {
            // factIds is an array. Add all to the session set.
            setReAttestedFactIds(prev => new Set([...prev, ...factIds]))
            const label = factIds.length === 1 ? factIds[0] : `${factIds.length} facts`
            showToast(
              `Re-attested ${label} · next review in 6 months · run will resume`,
              '#4ade80',
            )
          }}
          onViewTrace={(runId) => {
            // M3 — open Test viewer with the historical trace for this run.
            const trace = getTraceForRun(runId)
            if (!trace) return
            setHistoricalRun({ runId, trace })
            try { window.parent?.postMessage({ type: 'kc:expand' }, '*') } catch {}
            setTestMode(true)
          }}
          environment={workflowEnvironment}
          onChangeEnvironment={(next) => {
            setWorkflowEnvironment(next)
            if (next === 'production') {
              showToast(`Promoted to production · pack now enforced`, '#4ade80')
            } else {
              showToast(`Switched to sandbox · pack is advisory only`, '#fbbf24')
            }
          }}
          onClose={() => {
            setShowWorkflowView(false)
            // Notify the embedding parent (Agentic Studio) to dismiss the slide-out.
            try { window.parent?.postMessage({ type: 'kc:close' }, '*') } catch {}
          }}
          onModify={() => {
            // Tell the embedding parent to expand the slide-out into a modal
            // so the Copilot has room to breathe.
            try { window.parent?.postMessage({ type: 'kc:expand' }, '*') } catch {}
            setCreationView('copilot')
          }}
          onTest={() => {
            // F1.1: open the Test viewer. Same expand pattern as Modify so
            // the trace tree has room to breathe.
            try { window.parent?.postMessage({ type: 'kc:expand' }, '*') } catch {}
            setTestMode(true)
          }}
          onDetach={(packId) => {
            // Session-level detach: remove the pack from this workflow's
            // visible constraints. Falls back to EmptyState automatically.
            if (!packId) return
            setDetachedPackIds(prev => new Set([...prev, packId]))
            showToast(
              `Constraint detached · ${workflowContext.workflowName} now sees all truth facts`,
              '#fbbf24',
            )
          }}
        />
        {/* Copilot mounts on top when user clicks Modify. Same iframe, just an */}
        {/* internal modal layer — the parent slide-out has already expanded.  */}
        <KnowledgePackChat
          open={creationView === 'copilot'}
          onBack={() => {
            // Notify parent to collapse back to slide-out width.
            try { window.parent?.postMessage({ type: 'kc:collapse' }, '*') } catch {}
            setCreationView(null)
          }}
          onClose={() => {
            try { window.parent?.postMessage({ type: 'kc:collapse' }, '*') } catch {}
            setCreationView(null)
          }}
          onComplete={() => {
            try { window.parent?.postMessage({ type: 'kc:collapse' }, '*') } catch {}
            setCreationView(null)
            // Mark currently-attached packs as "just updated" so the slide-out
            // shows a transient pill confirming the change landed. Clears
            // automatically after 8 seconds.
            const justUpdated = new Set(workflowPacks.map(p => p.id))
            setRecentlyUpdatedPackIds(justUpdated)
            setTimeout(() => setRecentlyUpdatedPackIds(new Set()), 8000)
            showToast(
              `Pack updated · changes published to ${workflowContext.workflowName}`,
              '#4ade80',
            )
          }}
        />
        {/* F1.1 — Test workflow viewer mounts on top when user clicks Test. */}
        {/* Parent slide-out has expanded to fullscreen via kc:expand.       */}
        <TestWorkflowView
          open={testMode}
          workflowId={workflowContext.workflowId}
          workflowName={workflowContext.workflowName}
          packName={workflowPacks[0]?.name}
          environment={workflowEnvironment}
          reAttestedFactIds={reAttestedFactIds}
          historicalRun={historicalRun}
          onExitHistorical={() => setHistoricalRun(null)}
          onClose={() => {
            try { window.parent?.postMessage({ type: 'kc:collapse' }, '*') } catch {}
            setTestMode(false)
            setHistoricalRun(null)
          }}
        />
        {/* Toast (keeps working even in embed mode) */}
        {toast && createPortal(
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[99999] px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xl"
            style={{
              background: 'rgba(15,23,42,0.95)',
              border: `1px solid ${toast.color}50`,
              color: toast.color,
              backdropFilter: 'blur(12px)',
            }}>
            <CheckCircle size={13} /> {toast.msg}
          </div>,
          document.body
        )}
      </>
    )
  }

  return (
    <div className="p-6 space-y-5">

      {/* ── Page header ─────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl" style={{ background: 'rgba(34,197,94,0.14)' }}>
            <BookOpen size={20} style={{ color: '#22c55e' }} />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-text-primary">Knowledge</h1>
            <p className="text-xs text-text-muted mt-0.5 max-w-lg">
              Manage Knowledge Packs to control how validated facts are used by users, agents, and agentic networks.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setCreationView('modes')}
            className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl transition-all hover:brightness-110 cursor-pointer"
            style={{ background: 'linear-gradient(135deg,#00C2C2 0%,#155DFC 100%)', color: '#fff', boxShadow: '0 2px 12px rgba(21,93,252,0.45)' }}>
            <Plus size={14} /> New Knowledge Pack <ChevronRight size={13} />
          </button>
        </div>
      </div>

      {/* ── Summary metrics ─────────────────────────── */}
      <div className="grid grid-cols-4 gap-3">
        <SummaryMetric icon={BookOpen}  value={stats.total}  label="Total Packs"    color="#22c55e" />
        <SummaryMetric icon={CheckCircle} value={stats.active} label="Active Packs" color="#4ade80" />
        <SummaryMetric icon={FileText}  value={stats.facts}  label="Total Facts"    color="#60a5fa" />
        <SummaryMetric icon={AlertTriangle} value={stats.stale} label="Stale Packs" color="#fbbf24" />
      </div>

      {/* ── Resume drafts pill (only if drafts exist) ── */}
      {userDrafts.length > 0 && (
        <DraftsPill drafts={userDrafts} onResume={(id) => navigate(`/intelligence-library/knowledge/create/scratch?draft=${id}`)} />
      )}

      {/* ── Filter bar ──────────────────────────────── */}
      <div className="flex items-center gap-2 flex-wrap">
        <SearchBar placeholder="Search Knowledge Packs..." value={search} onChange={setSearch} />

        <select className="input-base text-xs px-3 py-2" style={{ width: 'auto' }}
          value={quickStatus} onChange={e => setQuickStatus(e.target.value)}>
          <option value="All">Status</option>
          <option value="active">Active</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>

        <select className="input-base text-xs px-3 py-2" style={{ width: 'auto' }}
          value={quickAccess} onChange={e => setQuickAccess(e.target.value)}>
          <option value="All">Access Type</option>
          <option value="users">Users</option>
          <option value="agents">Agents</option>
          <option value="agentic-networks">Agentic Networks</option>
          <option value="mixed">Mixed Access</option>
        </select>

        <select className="input-base text-xs px-3 py-2" style={{ width: 'auto' }}
          value={quickOwner} onChange={e => setQuickOwner(e.target.value)}>
          <option value="All">Owner</option>
          <option value="Me">Me</option>
          <option value="My Team">My Team</option>
        </select>

        <button
          className={clsx('btn-secondary gap-1.5', activeFilterCount > 0 && 'border-green-500/40')}
          style={activeFilterCount > 0 ? { color: '#4ade80' } : {}}
          onClick={() => setShowFilters(true)}>
          <Filter size={13} /> Filters
          {activeFilterCount > 0 && (
            <span className="inline-flex items-center justify-center w-4 h-4 rounded-full text-[9px] font-bold"
              style={{ background: 'rgba(34,197,94,0.25)', color: '#4ade80' }}>
              {activeFilterCount}
            </span>
          )}
        </button>

        {/* View toggle */}
        <div className="ml-auto flex items-center gap-0.5 rounded-lg p-0.5"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <button
            onClick={() => setViewMode('grid')}
            className={clsx('p-1.5 rounded-md transition-all', viewMode === 'grid' && 'bg-white/10')}
            style={{ color: viewMode === 'grid' ? '#e2e8f0' : '#64748b' }}>
            <LayoutGrid size={14} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={clsx('p-1.5 rounded-md transition-all', viewMode === 'list' && 'bg-white/10')}
            style={{ color: viewMode === 'list' ? '#e2e8f0' : '#64748b' }}>
            <List size={14} />
          </button>
        </div>
      </div>

      {/* ── Result count ────────────────────────────── */}
      <div className="flex items-center gap-2">
        <p className="text-xs text-text-muted">
          {filtered.length} pack{filtered.length !== 1 ? 's' : ''}
          {(search || quickStatus !== 'All' || quickAccess !== 'All' || quickOwner !== 'All')
            && <span className="ml-1 opacity-60">(filtered)</span>}
        </p>
        {(search || quickStatus !== 'All' || quickAccess !== 'All' || quickOwner !== 'All' || activeFilterCount > 0) && (
          <button
            className="text-[10px] text-text-muted hover:text-text-secondary underline"
            onClick={() => {
              setSearch(''); setQuickStatus('All'); setQuickAccess('All');
              setQuickOwner('All'); setAllFilters(DEFAULT_FILTERS)
            }}>
            Clear all
          </button>
        )}
      </div>

      {/* ── Card list ───────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <BookOpen size={32} className="mx-auto mb-4 text-text-muted opacity-25" />
          <p className="text-sm text-text-muted">No Knowledge Packs match your filters</p>
          <button className="btn-secondary mt-4" onClick={() => {
            setSearch(''); setQuickStatus('All'); setQuickAccess('All')
            setQuickOwner('All'); setAllFilters(DEFAULT_FILTERS)
          }}>Clear filters</button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(pack => (
            <PackGridCard key={pack.id} pack={pack}
              onSelect={p => navigate(`/intelligence-library/knowledge/${p.id}`)}
              onPreview={setSelected}
              onEdit={() => {}}
              onArchive={handleArchive}
              onDuplicate={handleDuplicate} />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(pack => (
            <PackListCard key={pack.id} pack={pack}
              selected={selected?.id === pack.id}
              onSelect={p => navigate(`/intelligence-library/knowledge/${p.id}`)}
              onPreview={setSelected}
              onEdit={() => {}}
              onArchive={handleArchive}
              onDuplicate={handleDuplicate} />
          ))}
        </div>
      )}

      {/* ── All Filters slide-out ────────────────────── */}
      {showFilters && (
        <KnowledgeFiltersPanel
          filters={allFilters}
          setFilters={setAllFilters}
          onClose={() => setShowFilters(false)} />
      )}

      {/* ── Knowledge Pack slide-out ─────────────────────── */}
      {selected && (
        <TruthPackSlideOut
          pack={selected}
          onClose={() => setSelected(null)}
          onEdit={() => {}}
          onArchive={() => handleArchive(selected)}
          onDuplicate={() => handleDuplicate(selected)} />
      )}

      {/* ── Toast ───────────────────────────────────── */}
      {toast && createPortal(
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[99999] px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xl"
          style={{
            background: 'rgba(15,23,42,0.95)',
            border: `1px solid ${toast.color}50`,
            color: toast.color,
            backdropFilter: 'blur(12px)',
          }}>
          <CheckCircle size={13} /> {toast.msg}
        </div>,
        document.body
      )}

      {/* WorkflowKnowledgeView is rendered up-top when workflowContext exists. */}
      {/* The standalone Knowledge list path below doesn't include it.          */}

      {/* ── New Knowledge Pack — multi-modal creation flow ─── */}
      {/* Step 1: mode picker. Hidden when a sub-modal is up so the dim   */}
      {/* layers don't compound visually.                                  */}
      <NewKnowledgePackModal
        open={creationView === 'modes'}
        onClose={() => setCreationView(null)}
        onPickTemplate={() => setCreationView('templates')}
        onPickConversation={() => setCreationView('copilot')}
      />
      {/* Step 2a: template library (full-screen). */}
      <KnowledgePackTemplateLibrary
        open={creationView === 'templates'}
        onBack={() => setCreationView('modes')}
        onClose={() => setCreationView(null)}
        onUseTemplate={(id) => {
          setCreationView(null)
          navigate(`/intelligence-library/knowledge/create/scratch?template=${id}`)
        }}
      />
      {/* Step 2b: copilot chat (full-screen). When launched from a workflow */}
      {/* (workflowContext present), back/close return to the inspection     */}
      {/* layer (WorkflowKnowledgeView) instead of the generic mode picker.  */}
      <KnowledgePackChat
        open={creationView === 'copilot'}
        onBack={() => {
          if (workflowContext) setCreationView(null)   // reveal WorkflowKnowledgeView
          else setCreationView('modes')
        }}
        onClose={() => setCreationView(null)}
        onComplete={() => {
          setCreationView(null)
          if (workflowContext) {
            showToast(`Draft saved · attached to ${workflowContext.workflowName}`, '#4ade80')
          } else {
            showToast('Draft saved', '#4ade80')
          }
        }}
      />
    </div>
  )
}
