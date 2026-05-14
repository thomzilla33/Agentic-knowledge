import React, { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  ArrowLeft, BookOpen, Search, ChevronRight, LayoutTemplate,
  Shield, Database, Folder, Eye, X,
} from 'lucide-react'
import { packTemplates } from '../../../data/mockKnowledge'

// ════════════════════════════════════════════════════════════════════════════
// Knowledge Pack Template Library — full-screen modal
// Mirrors the Agentic Networks "Knowledge Pack Library" pattern (modal overlay
// with a left rail of categories + main grid). Used only for the template
// path of pack creation; conversation and scratch flows remain as routes.
//
// Props:
//   open           — boolean, modal visibility
//   onBack         — () => void, return to the previous modal (mode picker)
//   onClose        — () => void, dismiss the entire creation flow
//   onUseTemplate  — (id) => void, navigate to the wizard with prefill
// ════════════════════════════════════════════════════════════════════════════

const CATEGORIES = [
  { id: 'all',         label: 'All',                   match: () => true },
  { id: 'sales',       label: 'Sales & GTM',           match: (t) => /sales/i.test(t.department) },
  { id: 'support',     label: 'Customer Support',      match: (t) => /customer (service|support|success)/i.test(t.department) },
  { id: 'legal',       label: 'Legal & Compliance',    match: (t) => /(legal|compliance)/i.test(t.department) },
  { id: 'finance',     label: 'Finance',               match: (t) => /finance/i.test(t.department) },
  { id: 'hr',          label: 'HR & Onboarding',       match: (t) => /(hr|people)/i.test(t.department) },
  { id: 'operations',  label: 'Operations',            match: (t) => /(operations|ops)/i.test(t.department) },
]

const SORT_OPTIONS = [
  { id: 'name-asc',   label: 'Name A → Z' },
  { id: 'name-desc',  label: 'Name Z → A' },
  { id: 'items-desc', label: 'Most items first' },
]

const PLANE_META = {
  truth:   { label: 'Truth',   icon: Shield,   color: '#4ade80', bg: 'rgba(34,197,94,0.10)',  border: 'rgba(34,197,94,0.30)' },
  sandbox: { label: 'Sandbox', icon: Database, color: '#fbbf24', bg: 'rgba(245,158,11,0.10)', border: 'rgba(245,158,11,0.30)' },
  sources: { label: 'Sources', icon: Folder,   color: '#60a5fa', bg: 'rgba(59,130,246,0.10)', border: 'rgba(59,130,246,0.30)' },
}

const AIMS_GRADIENT = 'linear-gradient(135deg,#00C2C2 0%,#155DFC 100%)'

export default function KnowledgePackTemplateLibrary({ open, onBack, onClose, onUseTemplate }) {
  const [search, setSearch]         = useState('')
  const [sortBy, setSortBy]         = useState('name-asc')
  const [activeCat, setActiveCat]   = useState('all')
  const [previewing, setPreviewing] = useState(null)

  // Exclude the "Empty Pack" pseudo-template — the picker already exposes
  // "Build from scratch" as its own dedicated path.
  const templates = useMemo(
    () => packTemplates.filter(t => t.id !== 'tpl-empty'),
    []
  )

  // ESC closes the topmost modal. If a preview is open, close that first;
  // otherwise step back to the mode picker.
  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key !== 'Escape') return
      if (previewing) setPreviewing(null)
      else onBack?.()
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, previewing, onBack])

  if (!open) return null

  const catCounts = CATEGORIES.reduce((acc, c) => {
    acc[c.id] = c.id === 'all' ? templates.length : templates.filter(c.match).length
    return acc
  }, {})

  const visible = (() => {
    const cat = CATEGORIES.find(c => c.id === activeCat)
    let list = templates.filter(cat.match)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(t =>
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.department.toLowerCase().includes(q)
      )
    }
    return [...list].sort((a, b) => {
      if (sortBy === 'name-asc')   return a.name.localeCompare(b.name)
      if (sortBy === 'name-desc')  return b.name.localeCompare(a.name)
      if (sortBy === 'items-desc') {
        const sumA = a.seedTruth.length + a.seedSandbox.length + a.seedSources.length
        const sumB = b.seedTruth.length + b.seedSandbox.length + b.seedSources.length
        return sumB - sumA
      }
      return 0
    })
  })()

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="kp-tpl-modal-title"
      className="fixed inset-0 z-[9000] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(8px)', padding: '20px 60px' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose?.() }}
    >
      <div
        className="rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        style={{
          width: 'calc(100vw - 120px)',
          height: 'calc(100vh - 40px)',
          background: 'var(--modal-bg, #0b1220)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 shrink-0"
          style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                onClick={onBack}
                aria-label="Back to mode picker"
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}
              >
                <ArrowLeft size={14} />
              </button>
            )}
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,rgba(43,127,255,0.20),rgba(167,139,250,0.20))', border: '1px solid rgba(43,127,255,0.30)' }}>
              <LayoutTemplate size={18} style={{ color: '#80AFFF' }} />
            </div>
            <div>
              <p id="kp-tpl-modal-title" className="text-base font-semibold"
                style={{ color: 'var(--text-primary)' }}>Knowledge Pack Library</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                Pre-built blueprints organized by category. Pick one to customize.
              </p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Close library"
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Body: rail + main grid */}
        <div className="flex flex-1 min-h-0">
          {/* Rail */}
          <aside className="w-[240px] shrink-0 border-r flex flex-col"
            style={{ borderColor: 'var(--border-subtle)' }}>
            <div className="p-4 space-y-3" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
              <label className="block">
                <span className="sr-only">Search templates</span>
                <div className="relative">
                  <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2"
                    style={{ color: 'var(--text-muted)' }} />
                  <input
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search templates..."
                    className="w-full text-[12px] pl-7 pr-2.5 py-2 rounded-lg outline-none focus:ring-1"
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>
              </label>
              <label className="block">
                <span className="text-[10px] font-bold tracking-widest uppercase block mb-1.5"
                  style={{ color: 'var(--text-muted)' }}>Sort by</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full text-[12px] px-2.5 py-2 rounded-lg outline-none cursor-pointer"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)',
                  }}
                >
                  {SORT_OPTIONS.map(o => (<option key={o.id} value={o.id}>{o.label}</option>))}
                </select>
              </label>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-0.5">
              <p className="text-[10px] font-bold tracking-widest uppercase px-2 pb-2"
                style={{ color: 'var(--text-muted)' }}>Categories</p>
              {CATEGORIES.map(c => {
                const count = catCounts[c.id]
                const isActive = activeCat === c.id
                const disabled = count === 0 && c.id !== 'all'
                return (
                  <button
                    key={c.id}
                    onClick={() => !disabled && setActiveCat(c.id)}
                    disabled={disabled}
                    className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-left transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
                    style={{
                      background: isActive ? 'rgba(43,127,255,0.14)' : 'transparent',
                      color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                      fontWeight: isActive ? 700 : 500,
                    }}
                  >
                    <span className="text-[12px] truncate">{c.label}</span>
                    <span className="text-[10px] font-bold tabular-nums px-1.5 py-0.5 rounded-md min-w-[24px] text-center"
                      style={{ background: 'rgba(255,255,255,0.07)', color: isActive ? '#80AFFF' : 'var(--text-muted)' }}>
                      {count}
                    </span>
                  </button>
                )
              })}
            </div>
          </aside>

          {/* Main grid */}
          <main className="flex-1 overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
                Showing <span className="font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>{visible.length}</span> of {templates.length} templates
              </p>
            </div>

            {visible.length === 0 && (
              <div className="rounded-2xl p-10 text-center"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
                <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>No templates match</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Try a different category or clear the search.
                </p>
              </div>
            )}

            <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
              {visible.map(t => (
                <TemplateCard
                  key={t.id}
                  t={t}
                  onPreview={() => setPreviewing(t)}
                  onUse={() => onUseTemplate?.(t.id)}
                />
              ))}
            </div>
          </main>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 flex items-center justify-between shrink-0"
          style={{ borderTop: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.02)' }}>
          <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
            Click a template to use it · Press <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-subtle)' }}>Esc</kbd> to go back
          </p>
        </div>
      </div>

      {/* Preview side panel */}
      {previewing && (
        <PreviewPanel template={previewing} onClose={() => setPreviewing(null)} onUse={() => onUseTemplate?.(previewing.id)} />
      )}
    </div>,
    document.body
  )
}

// ── Template Card ──────────────────────────────────────────────────────────
function TemplateCard({ t, onPreview, onUse }) {
  const stats = [
    { key: 'truth',   count: t.seedTruth.length },
    { key: 'sandbox', count: t.seedSandbox.length },
    { key: 'sources', count: t.seedSources.length },
  ]
  const totalItems = stats.reduce((s, x) => s + x.count, 0)

  return (
    <div className="rounded-2xl p-4 flex flex-col gap-3 transition-all hover:brightness-110"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: t.iconBg, boxShadow: '0 2px 8px rgba(0,0,0,0.20)' }}>
          <BookOpen size={15} color="#fff" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold mb-0.5 truncate"
            style={{ color: 'var(--text-primary)' }}>{t.name}</p>
          <p className="text-[10px] font-semibold tracking-wide uppercase"
            style={{ color: 'var(--text-muted)' }}>{t.department}</p>
        </div>
      </div>

      <p className="text-[11px] leading-snug line-clamp-3" style={{ color: 'var(--text-secondary)' }}>
        {t.description}
      </p>

      <div className="flex items-center gap-1 flex-wrap">
        {stats.map(s => {
          const meta = PLANE_META[s.key]
          const Icon = meta.icon
          const dim = s.count === 0
          return (
            <span key={s.key}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold tabular-nums"
              style={{
                background: dim ? 'rgba(255,255,255,0.03)' : meta.bg,
                border: `1px solid ${dim ? 'var(--border-subtle)' : meta.border}`,
                color: dim ? 'var(--text-muted)' : meta.color,
              }}
            >
              <Icon size={9} /> {s.count}
            </span>
          )
        })}
        <span className="ml-auto text-[10px]" style={{ color: 'var(--text-muted)' }}>
          {totalItems} item{totalItems === 1 ? '' : 's'} seeded
        </span>
      </div>

      <div className="flex items-center gap-2 pt-1" style={{ borderTop: '1px solid var(--border-subtle)' }}>
        <button
          onClick={onPreview}
          className="px-2.5 py-1.5 rounded-lg flex items-center gap-1 text-[11px] font-semibold transition-colors hover:brightness-125 cursor-pointer min-h-[32px]"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}
        >
          <Eye size={11} /> Preview
        </button>
        <button
          onClick={onUse}
          className="ml-auto px-3 py-1.5 rounded-lg flex items-center gap-1 text-[11px] font-semibold transition-all hover:brightness-110 cursor-pointer min-h-[32px]"
          style={{ background: AIMS_GRADIENT, color: '#fff', boxShadow: '0 1px 6px rgba(21,93,252,0.25)' }}
        >
          Use template <ChevronRight size={11} />
        </button>
      </div>
    </div>
  )
}

// ── Preview side panel ─────────────────────────────────────────────────────
function PreviewPanel({ template, onClose, onUse }) {
  const items = [
    ...template.seedTruth.map(id => ({ plane: 'truth', id })),
    ...template.seedSandbox.map(id => ({ plane: 'sandbox', id })),
    ...template.seedSources.map(id => ({ plane: 'sources', id })),
  ]
  return (
    <div className="absolute inset-0 z-10 flex items-stretch justify-end"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
      role="dialog" aria-modal="true" aria-label={`Preview of ${template.name} template`}
    >
      <div className="w-[420px] h-full overflow-y-auto"
        style={{ background: 'var(--modal-bg, #0b1220)', borderLeft: '1px solid var(--border-subtle)' }}>
        <div className="px-5 py-4 flex items-start justify-between"
          style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: template.iconBg }}>
              <BookOpen size={15} color="#fff" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold tracking-widest uppercase"
                style={{ color: 'var(--text-muted)' }}>Template preview</p>
              <p className="text-base font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{template.name}</p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Close preview"
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}
          >
            <X size={14} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            {template.description}
          </p>

          <div className="grid grid-cols-3 gap-2">
            {Object.entries(PLANE_META).map(([k, m]) => {
              const count = template[k === 'truth' ? 'seedTruth' : k === 'sandbox' ? 'seedSandbox' : 'seedSources'].length
              const Icon = m.icon
              return (
                <div key={k} className="rounded-xl p-3 text-center"
                  style={{ background: m.bg, border: `1px solid ${m.border}` }}>
                  <Icon size={14} style={{ color: m.color }} className="mx-auto mb-1" />
                  <p className="text-base font-bold tabular-nums" style={{ color: m.color }}>{count}</p>
                  <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{m.label}</p>
                </div>
              )
            })}
          </div>

          <div>
            <p className="text-[10px] font-bold tracking-widest uppercase mb-2"
              style={{ color: 'var(--text-muted)' }}>Default toggles on attach</p>
            <div className="space-y-1.5">
              {Object.entries(PLANE_META).map(([k, m]) => {
                const on = template.toggles[k]
                const Icon = m.icon
                return (
                  <div key={k} className="flex items-center justify-between px-3 py-2 rounded-lg"
                    style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)' }}>
                    <div className="flex items-center gap-2">
                      <Icon size={11} style={{ color: m.color }} />
                      <span className="text-[12px]" style={{ color: 'var(--text-primary)' }}>{m.label} Plane</span>
                    </div>
                    <span className="text-[10px] font-semibold"
                      style={{ color: on ? '#4ade80' : 'var(--text-muted)' }}>
                      {on ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          <div>
            <p className="text-[10px] font-bold tracking-widest uppercase mb-2"
              style={{ color: 'var(--text-muted)' }}>Seeded items ({items.length})</p>
            <div className="space-y-1">
              {items.length === 0 && (
                <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>No items pre-seeded.</p>
              )}
              {items.map((it, i) => {
                const meta = PLANE_META[it.plane]
                const Icon = meta.icon
                return (
                  <div key={i} className="flex items-center gap-2 px-2.5 py-1.5 rounded-md"
                    style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)' }}>
                    <Icon size={10} style={{ color: meta.color }} />
                    <span className="text-[11px] font-mono" style={{ color: 'var(--text-secondary)' }}>{it.id}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 px-5 py-4 flex items-center gap-2"
          style={{ background: 'var(--modal-bg, #0b1220)', borderTop: '1px solid var(--border-subtle)' }}>
          <button onClick={onClose}
            className="flex-1 py-2 rounded-lg text-[12px] font-semibold transition-colors cursor-pointer"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}
          >
            Close
          </button>
          <button onClick={onUse}
            className="flex-1 py-2 rounded-lg text-[12px] font-semibold flex items-center justify-center gap-1.5 transition-all hover:brightness-110 cursor-pointer"
            style={{ background: AIMS_GRADIENT, color: '#fff' }}
          >
            Use template <ChevronRight size={12} />
          </button>
        </div>
      </div>
    </div>
  )
}
