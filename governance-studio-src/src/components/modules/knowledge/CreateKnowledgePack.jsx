import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft, LayoutTemplate, MessageSquare, Plus, ChevronRight,
  Sparkles, Send, FileText, BookOpen, Database, Bot, CheckCircle,
} from 'lucide-react'
import { packTemplates, availableTruthFacts, availableSandboxClaims, availableSourceDocs, userDrafts } from '../../../data/mockKnowledge'

// ── Mode definitions ──────────────────────────────────────────────────────────
const MODES = [
  {
    id: 'template',
    icon: LayoutTemplate,
    iconBg: 'linear-gradient(135deg,#6366F1,#8B5CF6)',
    glow:       '0 0 0 1px rgba(124,92,252,0.20), 0 8px 28px rgba(124,92,252,0.18)',
    glowActive: 'rgba(124,92,252,0.45)',
    title: 'Start from a Template',
    sub:   'Pre-built packs for the most common agent scenarios',
  },
  {
    id: 'conversation',
    icon: MessageSquare,
    iconBg: 'linear-gradient(135deg,#0d9488,#0891b2)',
    glow:       '0 0 0 1px rgba(20,184,166,0.20), 0 8px 28px rgba(20,184,166,0.18)',
    glowActive: 'rgba(20,184,166,0.45)',
    title: 'Start with a Conversation',
    sub:   'Describe your agent and AI suggests the right composition',
  },
  {
    id: 'scratch',
    icon: Plus,
    iconBg: 'linear-gradient(135deg,#00C2C2,#155DFC)',
    glow:       '0 0 0 1px rgba(43,127,255,0.20), 0 8px 28px rgba(43,127,255,0.18)',
    glowActive: 'rgba(43,127,255,0.45)',
    title: 'Start from Scratch',
    sub:   'Build the pack manually — pick items from each plane yourself',
  },
]

// ── AI conversation step list (prototype) ─────────────────────────────────────
const AI_PROMPTS = [
  { q: 'What kind of agent will use this Knowledge Pack?',                                             chips: ['Sales SDR','Support agent','Customer success','Compliance reviewer'] },
  { q: 'What domain or function does the agent focus on?',                                             chips: ['Outbound prospecting','Renewal intervention','Tier-1 support','GDPR compliance review'] },
  { q: 'Which planes should be active by default when this pack is attached?',                         chips: ['Truth only','Truth + Sources','All three','Truth + Sandbox + Sources (recommended)'] },
]

// ── Component ─────────────────────────────────────────────────────────────────
export default function CreateKnowledgePack() {
  const navigate = useNavigate()
  const [mode, setMode] = useState(null)              // 'template' | 'conversation' | 'scratch'
  const [hovered, setHovered] = useState(null)
  const [selectedTemplateId, setSelectedTemplateId] = useState(null)
  const [chatStep, setChatStep] = useState(0)
  const [chatAnswers, setChatAnswers] = useState([])
  const [chatInput, setChatInput] = useState('')
  const chatEndRef = useRef(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatStep, chatAnswers])

  const handleContinue = () => {
    const params = new URLSearchParams()
    if (mode === 'template' && selectedTemplateId) params.set('template', selectedTemplateId)
    if (mode === 'conversation') params.set('source', 'ai')
    const qs = params.toString()
    navigate(`/intelligence-library/knowledge/create/scratch${qs ? '?' + qs : ''}`)
  }

  const sendChip = (text) => {
    setChatAnswers(prev => [...prev, { q: AI_PROMPTS[chatStep].q, a: text }])
    setChatStep(s => s + 1)
    setChatInput('')
  }

  const sendInput = () => {
    if (!chatInput.trim()) return
    sendChip(chatInput.trim())
  }

  const canContinue =
    (mode === 'scratch') ||
    (mode === 'template' && selectedTemplateId) ||
    (mode === 'conversation' && chatStep >= AI_PROMPTS.length)

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--bg-base)' }}>

      {/* ── Breadcrumb + back ── */}
      <div className="px-8 pt-5 pb-0 shrink-0">
        <div className="flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--text-muted)' }}>
          <button onClick={() => navigate('/intelligence-library')}
            className="hover:opacity-80 cursor-pointer transition-opacity">Intelligence Library</button>
          <ChevronRight size={11} style={{ opacity: 0.4 }} />
          <button onClick={() => navigate('/intelligence-library/knowledge')}
            className="hover:opacity-80 cursor-pointer transition-opacity">Knowledge</button>
          <ChevronRight size={11} style={{ opacity: 0.4 }} />
          <span style={{ color: 'var(--text-secondary)' }}>New Knowledge Pack</span>
        </div>
      </div>

      {/* ── Header ── */}
      <div className="px-8 pt-4 pb-5 shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/intelligence-library/knowledge')}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-secondary)' }}>
            <ArrowLeft size={14} />
          </button>
          <div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>New Knowledge Pack</h1>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Choose how you want to start composing your pack
            </p>
          </div>
        </div>
      </div>

      {/* ── Resume drafts (only when user has any) ── */}
      {userDrafts.length > 0 && (
        <div className="px-8 pb-4">
          <div className="max-w-5xl">
            <p className="text-[10px] font-bold tracking-widest uppercase mb-2.5"
              style={{ color: 'var(--text-muted)' }}>Resume where you left off</p>
            <div className="grid grid-cols-3 gap-2.5">
              {userDrafts.slice(0, 3).map(d => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => navigate(`/intelligence-library/knowledge/create/scratch?draft=${d.id}`)}
                  className="text-left p-3 rounded-xl transition-all"
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(43,127,255,0.45)'; e.currentTarget.style.background = 'rgba(43,127,255,0.04)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-subtle)';   e.currentTarget.style.background = 'var(--bg-card)' }}>

                  <div className="flex items-start gap-2 mb-1.5">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)' }}>
                      <FileText size={12} style={{ color: '#fbbf24' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-semibold leading-snug truncate" style={{ color: 'var(--text-primary)' }}>{d.name}</p>
                      <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        {d.savedAgo} · {d.itemsCount} items · {d.department}
                      </p>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex-1 h-1 rounded-full overflow-hidden"
                      style={{ background: 'rgba(255,255,255,0.06)' }}>
                      <div className="h-full rounded-full transition-all"
                        style={{
                          width: `${d.completion}%`,
                          background: 'linear-gradient(90deg,#00C2C2 0%,#155DFC 100%)',
                        }} />
                    </div>
                    <span className="text-[10px] font-semibold shrink-0" style={{ color: 'var(--text-muted)' }}>
                      {d.completion}%
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Mode picker ── */}
      <div className="px-8 pb-5">
        <p className="text-[10px] font-bold tracking-widest uppercase mb-2.5 max-w-5xl"
          style={{ color: 'var(--text-muted)' }}>Start fresh</p>
        <div className="grid grid-cols-3 gap-3 max-w-5xl">
          {MODES.map(m => {
            const Icon = m.icon
            const isActive  = mode === m.id
            const isHovered = hovered === m.id
            return (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                onMouseEnter={() => setHovered(m.id)}
                onMouseLeave={() => setHovered(null)}
                className="text-left p-5 rounded-2xl transition-all duration-200"
                style={{
                  background: isActive ? 'rgba(255,255,255,0.05)' : 'var(--bg-card)',
                  border: `1px solid ${isActive ? 'rgba(255,255,255,0.16)' : 'var(--border-subtle)'}`,
                  boxShadow: isActive ? `0 0 0 1px ${m.glowActive}, 0 8px 32px ${m.glowActive}` : isHovered ? m.glow : 'none',
                  transform: isHovered && !isActive ? 'translateY(-2px)' : 'none',
                  cursor: 'pointer',
                }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                  style={{ background: m.iconBg }}>
                  <Icon size={18} color="#fff" />
                </div>
                <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>{m.title}</p>
                <p className="text-xs leading-snug" style={{ color: 'var(--text-muted)' }}>{m.sub}</p>
                {isActive && (
                  <div className="flex items-center gap-1 mt-3 text-[11px] font-semibold" style={{ color: '#80AFFF' }}>
                    <CheckCircle size={11} /> Selected
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Mode-specific body (scrollable) ── */}
      <div className="flex-1 overflow-y-auto px-8 pb-6">

        {/* TEMPLATE MODE */}
        {mode === 'template' && (
          <div className="max-w-5xl">
            <p className="text-[10px] font-bold tracking-widest uppercase mb-3"
              style={{ color: 'var(--text-muted)' }}>Pick a template</p>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {packTemplates.map(t => {
                const isSelected = selectedTemplateId === t.id
                const totalItems = t.seedTruth.length + t.seedSandbox.length + t.seedSources.length
                return (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTemplateId(t.id)}
                    className="text-left p-4 rounded-xl transition-all"
                    style={{
                      background: isSelected ? 'rgba(43,127,255,0.08)' : 'var(--bg-card)',
                      border: `1px solid ${isSelected ? 'rgba(43,127,255,0.45)' : 'var(--border-subtle)'}`,
                      cursor: 'pointer',
                    }}
                    onMouseEnter={e => { if (!isSelected) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.16)' }}
                    onMouseLeave={e => { if (!isSelected) e.currentTarget.style.borderColor = 'var(--border-subtle)' }}>
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: t.iconBg }}>
                        <BookOpen size={15} color="#fff" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-semibold leading-snug" style={{ color: 'var(--text-primary)' }}>{t.name}</p>
                        <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{t.department}</p>
                      </div>
                      {isSelected && <CheckCircle size={14} style={{ color: '#2B7FFF' }} className="shrink-0" />}
                    </div>
                    <p className="text-[11px] leading-relaxed mb-3" style={{ color: 'var(--text-secondary)' }}>{t.description}</p>
                    <div className="flex items-center gap-2 text-[10px]" style={{ color: 'var(--text-muted)' }}>
                      <span className="flex items-center gap-1"><FileText size={10} />{t.seedTruth.length} truth</span>
                      <span style={{ opacity: 0.4 }}>·</span>
                      <span className="flex items-center gap-1"><Database size={10} />{t.seedSandbox.length} sandbox</span>
                      <span style={{ opacity: 0.4 }}>·</span>
                      <span className="flex items-center gap-1"><FileText size={10} />{t.seedSources.length} sources</span>
                      <span className="ml-auto font-semibold" style={{ color: 'var(--text-secondary)' }}>{totalItems} items</span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* CONVERSATION MODE */}
        {mode === 'conversation' && (
          <div className="max-w-3xl">
            <div className="rounded-xl p-4 mb-3"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg,#0d9488,#0891b2)' }}>
                  <Sparkles size={12} color="#fff" />
                </div>
                <p className="text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>AI Pack Composer</p>
              </div>
              <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                Tell me about the agent that will use this pack, and I'll suggest a composition from your governance planes.
              </p>
            </div>

            {/* Conversation transcript */}
            <div className="space-y-2.5 mb-3">
              {chatAnswers.map((m, i) => (
                <React.Fragment key={i}>
                  <ChatBubble role="ai">{m.q}</ChatBubble>
                  <ChatBubble role="user">{m.a}</ChatBubble>
                </React.Fragment>
              ))}
              {chatStep < AI_PROMPTS.length && (
                <ChatBubble role="ai">
                  {AI_PROMPTS[chatStep].q}
                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    {AI_PROMPTS[chatStep].chips.map(c => (
                      <button key={c} type="button" onClick={() => sendChip(c)}
                        className="text-[11px] font-medium px-2.5 py-1 rounded-full transition-colors"
                        style={{ background: 'rgba(43,127,255,0.08)', color: '#80AFFF', border: '1px solid rgba(43,127,255,0.25)' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(43,127,255,0.16)' }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(43,127,255,0.08)' }}>
                        {c} <ChevronRight size={9} className="inline ml-0.5" />
                      </button>
                    ))}
                  </div>
                </ChatBubble>
              )}
              {chatStep >= AI_PROMPTS.length && (
                <div className="rounded-xl p-3.5 flex items-start gap-2.5"
                  style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)' }}>
                  <CheckCircle size={14} style={{ color: '#4ade80' }} className="mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[12px] font-semibold" style={{ color: '#4ade80' }}>Composition ready</p>
                    <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                      I've suggested a starting composition. Click <strong>Continue</strong> to review and adjust in the builder.
                    </p>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            {chatStep < AI_PROMPTS.length && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)' }}>
                <input
                  className="flex-1 bg-transparent outline-none text-xs"
                  style={{ color: 'var(--text-primary)' }}
                  placeholder="Type your answer or pick a chip above…"
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') sendInput() }} />
                <button type="button" onClick={sendInput}
                  disabled={!chatInput.trim()}
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                  style={{
                    background: chatInput.trim() ? 'linear-gradient(135deg,#00C2C2 0%,#155DFC 100%)' : 'rgba(255,255,255,0.06)',
                    color: '#fff', cursor: chatInput.trim() ? 'pointer' : 'not-allowed', opacity: chatInput.trim() ? 1 : 0.4,
                  }}>
                  <Send size={13} />
                </button>
              </div>
            )}
          </div>
        )}

        {/* SCRATCH MODE */}
        {mode === 'scratch' && (
          <div className="max-w-3xl">
            <div className="rounded-xl p-5"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
              <div className="flex items-center gap-2 mb-3">
                <Plus size={16} style={{ color: '#80AFFF' }} />
                <p className="text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>Empty pack — you choose everything</p>
              </div>
              <p className="text-[12px] leading-relaxed mb-3.5" style={{ color: 'var(--text-secondary)' }}>
                You'll go through 5 steps to compose your Knowledge Pack:
              </p>
              <ol className="space-y-1.5 mb-1">
                {[
                  '1. Basics — name, description, scope, owner',
                  '2. Composition — pick items from Truth, Sandbox, and Sources planes',
                  '3. Default toggles — set which planes activate when attached',
                  '4. Access — choose who can see and use the pack',
                  '5. Review — confirm and save as draft',
                ].map(s => (
                  <li key={s} className="text-[12px] flex items-start gap-2" style={{ color: 'var(--text-muted)' }}>
                    <span className="mt-1 w-1 h-1 rounded-full shrink-0" style={{ background: 'currentColor' }} />
                    {s}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        )}

        {/* DEFAULT EMPTY STATE */}
        {!mode && (
          <div className="text-center py-12 max-w-md mx-auto">
            <div className="inline-flex w-12 h-12 rounded-xl items-center justify-center mb-3"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-subtle)' }}>
              <Bot size={20} style={{ color: 'var(--text-muted)' }} />
            </div>
            <p className="text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>Pick how you want to start</p>
            <p className="text-[12px] mt-1" style={{ color: 'var(--text-muted)' }}>
              Choose Template, Conversation, or Scratch above. You can always switch later.
            </p>
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <div className="shrink-0 flex items-center justify-between px-8 py-3.5"
        style={{ borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-base)' }}>
        <button onClick={() => navigate('/intelligence-library/knowledge')}
          className="text-xs font-medium transition-colors"
          style={{ color: 'var(--text-muted)' }}>
          Cancel
        </button>
        <button
          onClick={handleContinue}
          disabled={!canContinue}
          className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl transition-all hover:brightness-110"
          style={{
            background: canContinue ? 'linear-gradient(135deg,#00C2C2 0%,#155DFC 100%)' : 'rgba(255,255,255,0.06)',
            color: '#fff',
            cursor: canContinue ? 'pointer' : 'not-allowed',
            opacity: canContinue ? 1 : 0.4,
            boxShadow: canContinue ? '0 2px 12px rgba(21,93,252,0.45)' : 'none',
          }}>
          Continue <ChevronRight size={13} />
        </button>
      </div>
    </div>
  )
}

// ── Chat bubble helper ────────────────────────────────────────────────────────
function ChatBubble({ role, children }) {
  if (role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[70%] px-3 py-2 rounded-xl text-[12px]"
          style={{ background: 'rgba(43,127,255,0.12)', border: '1px solid rgba(43,127,255,0.3)', color: 'var(--text-primary)' }}>
          {children}
        </div>
      </div>
    )
  }
  return (
    <div className="flex gap-2 items-start">
      <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
        style={{ background: 'linear-gradient(135deg,#0d9488,#0891b2)' }}>
        <Sparkles size={11} color="#fff" />
      </div>
      <div className="flex-1 min-w-0 px-3 py-2 rounded-xl text-[12px]"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
        {children}
      </div>
    </div>
  )
}
