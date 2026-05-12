import { useEffect, useRef, useState } from 'react'
import { AA_AGENTS, DEFAULT_SUGGESTIONS, agentInitials, type AaAgent } from '../data/agents'
import { getActiveWorkspace } from '../data/workspaces'
import { type AppId } from '../data/apps'

interface AIAssistantProps {
  open: boolean
  onClose: () => void
  /** Reserved for future per-studio prompt sets. */
  currentAppId: AppId
}

interface Message {
  role: 'user' | 'assistant'
  /** Plain text for user messages, HTML string for assistant. */
  text: string
}

const MOCK_REPLY_DELAY_MS = 1100

function BotIcon({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="2.2" r=".8" fill="currentColor" />
      <path d="M8 3v1.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <rect x="2.5" y="4.5" width="11" height="8.5" rx="2.5" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="6" cy="8.5" r=".9" fill="currentColor" />
      <circle cx="10" cy="8.5" r=".9" fill="currentColor" />
    </svg>
  )
}

function SparkleIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
      <path d="M8 1l1.4 4.6L14 7l-4.6 1.4L8 13l-1.4-4.6L2 7l4.6-1.4L8 1z" fill="currentColor" />
    </svg>
  )
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function mockReply(_userText: string, routeName: string): string {
  return (
    "I'd route this to <strong>" +
    escapeHtml(routeName) +
    '</strong> and pull context from your workspace.<br><br>' +
    '<em style="opacity:.65">Phase 1 mock — real agent routing and streaming responses come in Phase 2.</em>'
  )
}

interface AgentRouterProps {
  activeId: string
  onPick: (id: string) => void
}

function AgentRouter({ activeId, onPick }: AgentRouterProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const wrapRef = useRef<HTMLSpanElement | null>(null)

  useEffect(() => {
    if (!open) return
    function onDocClick(e: MouseEvent): void {
      const wrap = wrapRef.current
      if (wrap && e.target instanceof Node && !wrap.contains(e.target)) {
        setOpen(false)
      }
    }
    const id = window.setTimeout(() => {
      document.addEventListener('click', onDocClick)
    }, 0)
    return () => {
      window.clearTimeout(id)
      document.removeEventListener('click', onDocClick)
    }
  }, [open])

  useEffect(() => {
    if (!open) setSearch('')
  }, [open])

  const active = AA_AGENTS.find(a => a.id === activeId) ?? AA_AGENTS[0]
  const q = search.trim().toLowerCase()
  const filtered = !q ? AA_AGENTS : AA_AGENTS.filter(a => a.name.toLowerCase().includes(q))
  const auto = filtered.find(a => a.isAuto)
  const rest = filtered.filter(a => !a.isAuto)

  return (
    <span className="aa-route-pill-wrap" ref={wrapRef}>
      <button
        type="button"
        className={`aa-route-pill${open ? ' is-open' : ''}`}
        onClick={(e) => { e.stopPropagation(); setOpen(o => !o) }}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="aa-route-pill__ico">
          {active.isAuto ? (
            <SparkleIcon />
          ) : (
            <span
              style={{
                display: 'inline-flex',
                width: 13,
                height: 13,
                borderRadius: 3,
                background: active.color ?? '#2B7FFF',
                color: '#fff',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 7,
                fontWeight: 700,
                letterSpacing: '-.3px',
              }}
            >
              {agentInitials(active.name)}
            </span>
          )}
        </span>
        <span>{active.name}</span>
        <svg className="aa-route-chev" width="9" height="9" viewBox="0 0 12 12" fill="none">
          <path d="M2.5 4.5L6 8l3.5-3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <div className={`aa-route-sw${open ? ' open' : ''}`} role="menu" onClick={(e) => e.stopPropagation()}>
        <div className="aa-route-sw__search">
          <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
            <circle cx="6" cy="6" r="4" stroke="currentColor" strokeWidth="1.3" />
            <path d="M9.5 9.5L12 12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            placeholder="Search agents…"
            aria-label="Search agents"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
        <div className="aa-route-sw__list">
          {filtered.length === 0 ? (
            <div className="aa-route-sw__empty">No agents match &ldquo;{q}&rdquo;</div>
          ) : (
            <>
              {auto && <AgentRouterItem agent={auto} activeId={activeId} onPick={onPick} setOpen={setOpen} />}
              {auto && rest.length > 0 && <div className="aa-route-sw__divider" />}
              {rest.map(a => (
                <AgentRouterItem key={a.id} agent={a} activeId={activeId} onPick={onPick} setOpen={setOpen} />
              ))}
            </>
          )}
        </div>
      </div>
    </span>
  )
}

interface AgentRouterItemProps {
  agent: AaAgent
  activeId: string
  onPick: (id: string) => void
  setOpen: (open: boolean) => void
}

function AgentRouterItem({ agent, activeId, onPick, setOpen }: AgentRouterItemProps) {
  const isActive = agent.id === activeId
  return (
    <button
      type="button"
      className={`aa-route-item${isActive ? ' is-active' : ''}`}
      role="menuitem"
      onClick={() => { onPick(agent.id); setOpen(false) }}
    >
      {agent.isAuto ? (
        <div className="aa-route-item__ico is-auto">
          <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
            <path d="M8 1l1.4 4.6L14 7l-4.6 1.4L8 13l-1.4-4.6L2 7l4.6-1.4L8 1z" fill="#fff" />
          </svg>
        </div>
      ) : (
        <div className="aa-route-item__ico" style={{ background: agent.color ?? '#2B7FFF' }}>
          {agentInitials(agent.name)}
        </div>
      )}
      <span className="aa-route-item__name">{agent.name}</span>
      <svg className="aa-route-item__check" viewBox="0 0 16 16" fill="none">
        <path d="M3.5 8l3.5 3.5 5.5-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  )
}

export function AIAssistant({ open, onClose, currentAppId: _currentAppId }: AIAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [routeId, setRouteId] = useState<string>('auto')
  const [draft, setDraft] = useState('')
  const [typing, setTyping] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement | null>(null)
  const threadRef = useRef<HTMLDivElement | null>(null)

  const wsName = getActiveWorkspace().name
  const activeAgent = AA_AGENTS.find(a => a.id === routeId) ?? AA_AGENTS[0]

  // Autofocus input when opening
  useEffect(() => {
    if (open) {
      const id = window.setTimeout(() => { inputRef.current?.focus() }, 220)
      return () => window.clearTimeout(id)
    }
    return undefined
  }, [open])

  // Auto-grow textarea
  useEffect(() => {
    const el = inputRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 120) + 'px'
  }, [draft])

  // Scroll thread to bottom on new messages or typing indicator
  useEffect(() => {
    const el = threadRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages, typing])

  function send(): void {
    const text = draft.trim()
    if (!text) return
    setMessages(prev => [...prev, { role: 'user', text }])
    setDraft('')
    setTyping(true)
    const routeName = activeAgent.name
    window.setTimeout(() => {
      setTyping(false)
      setMessages(prev => [...prev, { role: 'assistant', text: mockReply(text, routeName) }])
    }, MOCK_REPLY_DELAY_MS)
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>): void {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  function useSuggestion(text: string): void {
    setDraft(text)
    inputRef.current?.focus()
  }

  const isEmpty = messages.length === 0 && !typing
  const canSend = draft.trim().length > 0

  return (
    <>
      <div
        className={`aa-overlay${open ? ' open' : ''}`}
        onClick={onClose}
        aria-hidden={!open}
      />
      <aside
        className={`ai-assistant${open ? ' open' : ''}`}
        role="dialog"
        aria-label="AI Assistant"
        aria-hidden={!open}
      >
        <header className="aa-header">
          <div className="aa-title-wrap">
            <div className="aa-title-icon">
              <BotIcon size={18} />
            </div>
            <div>
              <div className="aa-title">AI Assistant</div>
              <div className="aa-subtitle">Workspace: <span>{wsName}</span></div>
            </div>
          </div>
          <div className="aa-header-actions">
            <button
              type="button"
              className="btn-icon-sm"
              aria-label="Close"
              onClick={onClose}
              data-tt="Close"
              data-tt-desc="Press Esc or ⌘/ to close"
            >
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 16 16">
                <path d="M3 3l10 10M3 13L13 3" />
              </svg>
            </button>
          </div>
        </header>

        <div className="aa-context">
          <span className="aa-context-label">Talking to:</span>
          <AgentRouter activeId={routeId} onPick={setRouteId} />
        </div>

        <div className="aa-body">
          {isEmpty ? (
            <div className="aa-empty">
              <div className="aa-empty-hero">
                <BotIcon size={28} />
              </div>
              <h3 className="aa-empty-title">AI Assistant</h3>
              <p className="aa-empty-desc">
                Ask anything across your agents in <span>{wsName}</span>.
              </p>
              <div className="aa-suggestions-wrap">
                <div className="aa-suggestions-label">Try asking</div>
                <div>
                  {DEFAULT_SUGGESTIONS.map((s, i) => (
                    <button
                      key={i}
                      type="button"
                      className="aa-sug"
                      onClick={() => useSuggestion(s)}
                    >
                      <span className="aa-sug-text">{s}</span>
                      <svg className="aa-sug-arrow" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 16 16">
                        <path d="M5 3l5 5-5 5" />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="aa-thread" ref={threadRef}>
              {messages.map((m, i) => (
                m.role === 'user' ? (
                  <div key={i} className="aa-msg user">
                    <div className="aa-msg-avatar">TH</div>
                    <div className="aa-msg-bubble">{m.text}</div>
                  </div>
                ) : (
                  <div key={i} className="aa-msg assistant">
                    <div className="aa-msg-avatar"><BotIcon /></div>
                    <div className="aa-msg-bubble" dangerouslySetInnerHTML={{ __html: m.text }} />
                  </div>
                )
              ))}
              {typing && (
                <div className="aa-msg assistant">
                  <div className="aa-msg-avatar"><BotIcon /></div>
                  <div className="aa-msg-bubble">
                    <div className="aa-typing"><span /><span /><span /></div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <footer className="aa-composer">
          <div className="aa-composer-row">
            <button
              type="button"
              className="aa-attach-btn"
              aria-label="Attach context"
              data-tt="Attach context"
              data-tt-desc="Add files or screen context"
            >
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 16 16">
                <path d="M11 5L6.5 9.5a2 2 0 002.8 2.8L13 9a3.5 3.5 0 00-5-5L4 8a5 5 0 007 7" />
              </svg>
            </button>
            <textarea
              ref={inputRef}
              className="aa-input"
              placeholder="Ask anything…"
              rows={1}
              aria-label="Message"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={onKeyDown}
            />
            <button
              type="button"
              className="aa-send-btn"
              aria-label="Send message"
              disabled={!canSend}
              onClick={send}
            >
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 16 16">
                <path d="M8 13V3M3.5 7.5L8 3l4.5 4.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
          <div className="aa-hint">
            Type <kbd>@</kbd> to mention an agent · Press <kbd>⌘/</kbd> to toggle
          </div>
        </footer>
      </aside>
    </>
  )
}
