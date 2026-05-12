import { useEffect, useRef, useState } from 'react'
import {
  WORKSPACES_DATA,
  getStoredWorkspaceId,
  setActiveWorkspaceId,
  truncate,
  wsHashColor,
  wsInitials,
  type Workspace,
} from '../data/workspaces'
import { CTX_APPS, type AppId } from '../data/apps'

interface ContextMenuProps {
  currentAppId: AppId
}

function CheckIcon() {
  return (
    <svg className="cm-item-check" viewBox="0 0 16 16" fill="none">
      <path d="M3.5 8l3.5 3.5 5.5-7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function SettingsIcon() {
  return (
    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 16 16">
      <circle cx="8" cy="8" r="3" />
      <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3 3l1.4 1.4M11.6 11.6L13 13M3 13l1.4-1.4M11.6 4.4L13 3" strokeLinecap="round" />
    </svg>
  )
}

function PeopleIcon() {
  return (
    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 16 16">
      <circle cx="6" cy="6" r="2.5" />
      <path d="M2.5 13.5c0-2 1.6-3.5 3.5-3.5s3.5 1.5 3.5 3.5" />
      <circle cx="11" cy="6" r="2" />
      <path d="M14 13c0-1.6-1-2.5-2.5-2.5" strokeLinecap="round" />
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
      <circle cx="6" cy="6" r="4" stroke="currentColor" strokeWidth="1.3" />
      <path d="M9.5 9.5L12 12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 16 16">
      <path d="M8 3v10M3 8h10" strokeLinecap="round" />
    </svg>
  )
}

function ChevronDown() {
  return (
    <svg className="tb-context-chev" width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M2.5 4.5L6 8l3.5-3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

interface WsAvatarProps {
  workspace: Workspace
}

function WsAvatar({ workspace }: WsAvatarProps) {
  if (workspace.logo) {
    return (
      <div className="cm-item-ico">
        <img src={workspace.logo} alt="" />
      </div>
    )
  }
  return (
    <div className="cm-item-ico" style={{ background: wsHashColor(workspace.id) }}>
      {wsInitials(workspace.name)}
    </div>
  )
}

export function ContextMenu({ currentAppId }: ContextMenuProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [activeId, setActiveId] = useState<string>(() => getStoredWorkspaceId())
  const wrapRef = useRef<HTMLDivElement | null>(null)

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function onDocClick(e: MouseEvent): void {
      const wrap = wrapRef.current
      if (wrap && e.target instanceof Node && !wrap.contains(e.target)) {
        setOpen(false)
      }
    }
    // Defer one tick so the launcher's own click doesn't immediately close
    const id = window.setTimeout(() => {
      document.addEventListener('click', onDocClick)
    }, 0)
    return () => {
      window.clearTimeout(id)
      document.removeEventListener('click', onDocClick)
    }
  }, [open])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent): void {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  // Reset search whenever the menu closes
  useEffect(() => {
    if (!open) setSearch('')
  }, [open])

  const active = WORKSPACES_DATA.find(w => w.id === activeId) ?? WORKSPACES_DATA[0]
  const totalWs = WORKSPACES_DATA.length
  const showSearch = totalWs > 5
  const q = search.trim().toLowerCase()
  const filteredWs = !q
    ? WORKSPACES_DATA
    : WORKSPACES_DATA.filter(w =>
        w.name.toLowerCase().includes(q) ||
        w.subdomain.toLowerCase().includes(q) ||
        w.role.toLowerCase().includes(q),
      )
  const others = filteredWs.filter(w => w.id !== active.id)
  const sortedOthers = [...others].sort((a, b) => b.lastUsed - a.lastUsed)
  const activeInFiltered = filteredWs.some(w => w.id === active.id)

  function pickWs(id: string): void {
    if (id === activeId) {
      setOpen(false)
      return
    }
    setActiveWorkspaceId(id)
    setActiveId(id)
    setOpen(false)
  }

  function handleAction(_action: 'settings' | 'people' | 'create-workspace'): void {
    // Phase 1: real handlers come later. Just close the menu.
    setOpen(false)
  }

  return (
    <div className="tb-context-wrap" ref={wrapRef}>
      <button
        type="button"
        className={`tb-context${open ? ' cm-open' : ''}`}
        onClick={(e) => { e.stopPropagation(); setOpen(o => !o) }}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Switch workspace and app"
        data-tt="Workspace and apps"
        data-tt-desc="Switch workspace, switch app, manage members"
      >
        <div className="tb-context-logo" style={{ background: wsHashColor(active.id) }}>
          {wsInitials(active.name)}
        </div>
        <span className="tb-context-name" title={active.name}>{truncate(active.name, 50)}</span>
        <ChevronDown />
      </button>

      <div
        className={`ctx-menu${open ? ' open' : ''}`}
        role="menu"
        aria-label="Workspace and app switcher"
      >
        {/* Workspace-scoped actions */}
        <div className="cm-actions">
          <button
            type="button"
            className="cm-action-btn"
            onClick={(e) => { e.stopPropagation(); handleAction('settings') }}
          >
            <SettingsIcon />
            Settings
          </button>
          <button
            type="button"
            className="cm-action-btn"
            onClick={(e) => { e.stopPropagation(); handleAction('people') }}
          >
            <PeopleIcon />
            People
          </button>
        </div>

        {/* Applications */}
        <div className="cm-section">
          <div className="cm-section-hd"><span>Applications</span></div>
          {CTX_APPS.map(app => {
            const isActive = app.id === currentAppId
            const className = `cm-item${isActive ? ' is-active' : ''}`
            const inner = (
              <>
                <div className="cm-item-ico" style={{ background: app.gradient }}>{app.initials}</div>
                <div className="cm-item-info">
                  <div className="cm-item-name">{app.name}</div>
                  <div className="cm-item-sub">{app.desc}</div>
                </div>
                <CheckIcon />
              </>
            )
            if (isActive) {
              return (
                <div
                  key={app.id}
                  className={className}
                  role="menuitem"
                  onClick={(e) => { e.stopPropagation(); setOpen(false) }}
                >
                  {inner}
                </div>
              )
            }
            return (
              <a
                key={app.id}
                className={className}
                href={app.href}
                role="menuitem"
                onClick={(e) => e.stopPropagation()}
              >
                {inner}
              </a>
            )
          })}
        </div>

        {/* Switch workspace */}
        {totalWs > 1 && (
          <div className="cm-section">
            <div className="cm-section-hd">
              <span>Switch Workspace</span>
              <span className="cm-section-hd-count">({totalWs})</span>
            </div>
            {showSearch && (
              <div className="cm-search">
                <SearchIcon />
                <input
                  type="text"
                  placeholder="Search workspaces…"
                  aria-label="Search workspaces"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            )}
            <div className="cm-ws-list">
              {filteredWs.length === 0 ? (
                <div className="cm-empty">No workspaces match &ldquo;{q}&rdquo;</div>
              ) : (
                <>
                  {activeInFiltered && (
                    <button
                      type="button"
                      className="cm-item is-active"
                      role="menuitem"
                      onClick={(e) => { e.stopPropagation(); pickWs(active.id) }}
                    >
                      <WsAvatar workspace={active} />
                      <div className="cm-item-info">
                        <div className="cm-item-name" title={active.name}>
                          <span>{truncate(active.name, 50)}</span>
                          {active.role && <span className="cm-item-role">{active.role}</span>}
                        </div>
                      </div>
                      <CheckIcon />
                    </button>
                  )}
                  {sortedOthers.map(w => (
                    <button
                      key={w.id}
                      type="button"
                      className="cm-item"
                      role="menuitem"
                      onClick={(e) => { e.stopPropagation(); pickWs(w.id) }}
                    >
                      <WsAvatar workspace={w} />
                      <div className="cm-item-info">
                        <div className="cm-item-name" title={w.name}>{truncate(w.name, 50)}</div>
                      </div>
                    </button>
                  ))}
                </>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="cm-footer">
          <button
            type="button"
            className="cm-create"
            onClick={(e) => { e.stopPropagation(); handleAction('create-workspace') }}
          >
            <PlusIcon />
            Create workspace
          </button>
        </div>
      </div>
    </div>
  )
}
