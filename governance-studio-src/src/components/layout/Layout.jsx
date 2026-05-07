import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Library, Shield, LayoutGrid, Wrench, Rocket, Settings,
  CheckSquare, ChevronDown, Search, Bell, Sun, Moon, Activity, Check,
} from 'lucide-react'

/* Governance Studio nav — names unchanged from current routes. */
const NAV = [
  { icon: LayoutGrid,  label: 'Control Center',       path: null,                   disabled: true },
  { icon: CheckSquare, label: 'My Work',              path: null,                   disabled: true },
  { icon: Library,     label: 'Intelligence Library', path: '/intelligence-library' },
  { icon: Shield,      label: 'Truth Plane',          path: '/truth-plane' },
  { icon: LayoutGrid,  label: 'Sandbox Plane',        path: '/sandbox' },
  { icon: Wrench,      label: 'Builder',              path: null,                   disabled: true },
  { icon: Rocket,      label: 'Deploy',               path: null,                   disabled: true },
  { icon: Settings,    label: 'Admin',                path: null,                   disabled: true },
]

/* ─── Theme helpers ─────────────────────────────────── */

function getStoredTheme() {
  try { return localStorage.getItem('gs-theme') || 'dark' } catch { return 'dark' }
}

function applyTheme(theme, animate = false) {
  const html = document.documentElement
  if (animate) {
    html.classList.add('theme-transitioning')
    setTimeout(() => html.classList.remove('theme-transitioning'), 300)
  }
  if (theme === 'light') {
    html.classList.add('light')
    html.classList.remove('dark')
  } else {
    html.classList.add('dark')
    html.classList.remove('light')
  }
  try { localStorage.setItem('gs-theme', theme) } catch {}
}

/* ─── Component ─────────────────────────────────────── */

export default function Layout({ children }) {
  const [expanded, setExpanded] = useState(true)
  const [theme,    setTheme]    = useState(getStoredTheme)
  const [swOpen,   setSwOpen]   = useState(false)
  const launcherRef = useRef(null)
  const navigate = useNavigate()
  const location = useLocation()

  /* Apply theme on mount (no animation — avoids FOUC) */
  useEffect(() => { applyTheme(theme, false) }, [])

  const toggleTheme = useCallback(() => {
    setTheme(prev => {
      const next = prev === 'dark' ? 'light' : 'dark'
      applyTheme(next, true)
      return next
    })
  }, [])

  /* Click-outside closes the studio switcher */
  useEffect(() => {
    if (!swOpen) return
    const onDocClick = (e) => {
      if (launcherRef.current && !launcherRef.current.contains(e.target)) setSwOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [swOpen])

  /* Embed mode: when loaded inside an iframe with ?embed=1, render only the
     route content (no sidebar, no topbar) so the host app's chrome shows. */
  const isEmbedded = typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('embed') === '1'

  if (isEmbedded) {
    return (
      <main
        className="h-screen overflow-y-auto"
        style={{ background: 'var(--bg-base)' }}
      >
        {children}
      </main>
    )
  }

  const isActive = (path) => path && location.pathname.startsWith(path)
  const isLight  = theme === 'light'

  /* Path back to the parent prototype hub. The React app is served at
     /<repoBase>/governance-studio/, so the hub root is one directory up. */
  const hubBase = '../'

  return (
    <div className="gs-app">

      {/* ── Sidebar (matches Agentic Studio sb-* pattern) ── */}
      <aside className={expanded ? 'gs-sidebar gs-sb-expanded' : 'gs-sidebar'}>
        <nav className="gs-sb-nav">
          {NAV.map(({ icon: Icon, label, path, disabled }) => {
            const active = isActive(path)
            return (
              <button
                key={label}
                disabled={disabled}
                aria-disabled={disabled || undefined}
                onClick={() => path && navigate(path)}
                title={!expanded ? label : undefined}
                className={`gs-sb-item${active ? ' gs-active' : ''}`}>
                <span className="gs-sb-item-icon">
                  <Icon size={17} />
                </span>
                <span className="gs-sb-label">{label}</span>
              </button>
            )
          })}
        </nav>

        {/* Bottom: collapse toggle (Agentic .sb-bottom pattern) */}
        <div className="gs-sb-bottom">
          <button
            onClick={() => setExpanded(e => !e)}
            title={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
            className="gs-sb-toggle">
            <svg className="gs-sb-toggle-icon" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4L6 9l5 5"/>
              <line x1="3" y1="3" x2="3" y2="15"/>
            </svg>
            <span className="gs-sb-toggle-label">Collapse</span>
          </button>
        </div>
      </aside>

      {/* ── Main column ── */}
      <div className="gs-main">

        {/* Topbar (fixed, glass) */}
        <header className="gs-topbar">

          {/* Left: launcher */}
          <div className="gs-tb-left">
            <button
              ref={launcherRef}
              type="button"
              onClick={() => setSwOpen(o => !o)}
              aria-label="Switch studio"
              aria-haspopup="true"
              className={`gs-tb-launcher${swOpen ? ' gs-sw-open' : ''}`}>
              <div className="gs-tb-launcher-logo">GS</div>
              <span className="gs-tb-launcher-name">AIMS OS</span>
              <ChevronDown size={12} className="gs-tb-launcher-chevron" />

              {/* Studio switcher dropdown */}
              <div
                role="menu"
                className={`gs-studio-sw${swOpen ? ' gs-open' : ''}`}
                onClick={e => e.stopPropagation()}>
                <div className="gs-studio-sw-hd">
                  <span className="gs-studio-sw-title">Switch Studio</span>
                </div>
                <a
                  className="gs-studio-item"
                  href={`${hubBase}agentic-studio.html`}
                  role="menuitem">
                  <div className="gs-studio-item-ico" style={{ background: 'linear-gradient(135deg,#00C2C2 0%,#155DFC 100%)' }}>AS</div>
                  <div className="gs-studio-item-info">
                    <div className="gs-studio-item-name">Agentic Studio</div>
                    <div className="gs-studio-item-desc">Agents &amp; workflows</div>
                  </div>
                </a>
                <button
                  type="button"
                  className="gs-studio-item gs-s-active"
                  role="menuitem"
                  onClick={() => setSwOpen(false)}>
                  <div className="gs-studio-item-ico" style={{ background: 'linear-gradient(135deg,#6366F1 0%,#8B5CF6 100%)' }}>GS</div>
                  <div className="gs-studio-item-info">
                    <div className="gs-studio-item-name">Governance Studio</div>
                    <div className="gs-studio-item-desc">Policies &amp; knowledge</div>
                  </div>
                  <Check size={16} className="gs-studio-item-badge" />
                </button>
                <a
                  className="gs-studio-item"
                  href="#"
                  role="menuitem"
                  onClick={e => { e.preventDefault(); setSwOpen(false) }}>
                  <div className="gs-studio-item-ico" style={{ background: 'linear-gradient(135deg,#0EA5E9 0%,#06B6D4 100%)' }}>WS</div>
                  <div className="gs-studio-item-info">
                    <div className="gs-studio-item-name">Work-surface</div>
                    <div className="gs-studio-item-desc">Unified workspace</div>
                  </div>
                </a>
              </div>
            </button>
          </div>

          {/* Center: search */}
          <div className="gs-tb-search">
            <Search size={14} className="gs-tb-search-ic" />
            <input placeholder="Search in AIMS-OS Platform..." />
          </div>

          {/* Right: actions */}
          <div className="gs-tb-right">
            <button className="gs-icon-btn" title="Notifications" type="button"><Bell size={16} /></button>
            <button className="gs-icon-btn" title="Activity"      type="button"><Activity size={16} /></button>
            <button
              className="gs-icon-btn"
              title={isLight ? 'Switch to dark mode' : 'Switch to light mode'}
              type="button"
              onClick={toggleTheme}>
              {isLight ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <div className="gs-avatar-sm">JJ</div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto" style={{ background: 'var(--bg-base)', borderRadius: 12 }}>
          {children}
        </main>
      </div>
    </div>
  )
}
