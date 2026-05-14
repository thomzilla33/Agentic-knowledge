import React, { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { LayoutTemplate, MessageSquare, Plus, X, ChevronRight, Sparkles } from 'lucide-react'

// ════════════════════════════════════════════════════════════════════════════
// New Knowledge Pack — single-view modal (3 mode cards)
// Triggered from the "New Knowledge Pack" CTA on the Knowledge list.
// Each mode routes to its own dedicated path; the modal closes on selection.
// ════════════════════════════════════════════════════════════════════════════

const AIMS_GRADIENT = 'linear-gradient(135deg,#00C2C2 0%,#155DFC 100%)'

const MODES = [
  {
    id: 'template',
    title: 'Start from a template',
    desc: 'Pre-built blueprints organized by category. Pick one to customize.',
    icon: LayoutTemplate,
    cta: 'Open library',
    // template path opens a modal — handled via onPickTemplate callback
  },
  {
    id: 'conversation',
    title: 'Create with copilot',
    desc: 'Answer a few questions and the copilot builds it with you.',
    icon: MessageSquare,
    cta: 'Start with copilot',
    // Conversation path opens a modal — handled via onPickConversation callback
    recommended: true,
  },
  {
    id: 'scratch',
    title: 'Build from scratch',
    desc: 'Open the manual builder and pick items from each plane.',
    icon: Plus,
    cta: 'Open builder',
    href: '/intelligence-library/knowledge/create/scratch',
  },
]

export default function NewKnowledgePackModal({ open, onClose, onPickTemplate, onPickConversation }) {
  const navigate = useNavigate()
  const closeBtnRef = useRef(null)
  const dialogRef = useRef(null)

  // ESC to close + focus trap entry
  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    // Move focus into the dialog on open
    setTimeout(() => closeBtnRef.current?.focus(), 0)
    // Lock body scroll
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  if (!open) return null

  const handleSelect = (mode) => {
    if (mode.id === 'template') {
      onPickTemplate?.()
      return
    }
    if (mode.id === 'conversation') {
      onPickConversation?.()
      return
    }
    onClose()
    navigate(mode.href)
  }

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-kp-modal-title"
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(8px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        ref={dialogRef}
        className="w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden"
        style={{ background: 'var(--modal-bg, #0b1220)', border: '1px solid var(--modal-border, rgba(255,255,255,0.12))' }}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5"
          style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: AIMS_GRADIENT, boxShadow: '0 4px 18px rgba(21,93,252,0.35)' }}>
              <Sparkles size={18} color="#fff" />
            </div>
            <div>
              <p id="new-kp-modal-title" className="text-base font-semibold"
                style={{ color: 'var(--text-primary)' }}>New Knowledge Pack</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                Choose how to start composing your pack
              </p>
            </div>
          </div>
          <button
            ref={closeBtnRef}
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Mode cards */}
        <div className="p-6">
          <div className="grid grid-cols-3 gap-3">
            {MODES.map((m) => {
              const Icon = m.icon
              return (
                <button
                  key={m.id}
                  onClick={() => handleSelect(m)}
                  className="text-left p-5 rounded-2xl transition-all duration-200 hover:brightness-110 cursor-pointer relative group focus:outline-none focus:ring-2 focus:ring-offset-2"
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    minHeight: '180px',
                  }}
                >
                  {m.recommended && (
                    <span className="absolute top-3 right-3 text-[9px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded-md"
                      style={{ background: 'rgba(43,127,255,0.16)', color: '#80AFFF', border: '1px solid rgba(43,127,255,0.30)' }}>
                      Recommended
                    </span>
                  )}
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                    style={{ background: AIMS_GRADIENT, boxShadow: '0 2px 10px rgba(21,93,252,0.25)' }}>
                    <Icon size={18} color="#fff" />
                  </div>
                  <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                    {m.title}
                  </p>
                  <p className="text-xs leading-snug mb-4" style={{ color: 'var(--text-muted)' }}>
                    {m.desc}
                  </p>
                  <p className="text-[11px] font-semibold flex items-center gap-1 transition-opacity opacity-70 group-hover:opacity-100"
                    style={{ color: '#80AFFF' }}>
                    {m.cta} <ChevronRight size={11} />
                  </p>
                </button>
              )
            })}
          </div>
        </div>

        {/* Footer hint */}
        <div className="px-6 py-3 flex items-center justify-center"
          style={{ borderTop: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.02)' }}>
          <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
            Press <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-subtle)' }}>Esc</kbd> to cancel
          </p>
        </div>
      </div>
    </div>,
    document.body
  )
}
