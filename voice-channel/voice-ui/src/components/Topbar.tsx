import { useEffect, useState } from 'react'
import { ContextMenu } from './ContextMenu'
import { AIAssistant } from './AIAssistant'
import { type AppId } from '../data/apps'

interface TopbarProps {
  currentAppId: AppId
}

function SearchIcon() {
  return (
    <svg className="tb-search-ic" width="14" height="14" viewBox="0 0 14 14" fill="none">
      <circle cx="6" cy="6" r="4" stroke="currentColor" strokeWidth="1.3" />
      <path d="M9.5 9.5L12 12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

function NotificationsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M8 2a4 4 0 014 4c0 3 1 4 1 4H3s1-1 1-4a4 4 0 014-4zM6.5 12.5a1.5 1.5 0 003 0" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

function AssistantIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <defs>
        <linearGradient id="aaDotV" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00C2C2" />
          <stop offset="100%" stopColor="#155DFC" />
        </linearGradient>
      </defs>
      <circle cx="8" cy="2.2" r=".8" fill="currentColor" />
      <path d="M8 3v1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <rect x="2.5" y="4.5" width="11" height="8.5" rx="2.5" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="6" cy="8.5" r=".9" fill="currentColor" />
      <circle cx="10" cy="8.5" r=".9" fill="currentColor" />
      <circle cx="13.5" cy="3" r="1.5" fill="url(#aaDotV)" stroke="rgba(10,13,26,0.9)" strokeWidth=".6" />
    </svg>
  )
}

function SettingsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.3" />
      <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3 3l1.4 1.4M11.6 11.6L13 13M3 13l1.4-1.4M11.6 4.4L13 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

export function Topbar({ currentAppId }: TopbarProps) {
  const [aiOpen, setAiOpen] = useState(false)

  // Cmd/Ctrl+/ toggles the AI Assistant. Esc closes it.
  useEffect(() => {
    function onKey(e: KeyboardEvent): void {
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault()
        setAiOpen(o => !o)
        return
      }
      if (e.key === 'Escape' && aiOpen) {
        setAiOpen(false)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [aiOpen])

  return (
    <header className="topbar">
      <div className="tb-left">
        <ContextMenu currentAppId={currentAppId} />
      </div>

      <div className="tb-search">
        <SearchIcon />
        <input
          placeholder="Search in AIMS-OS Platform..."
          aria-label="Global search"
        />
      </div>

      <div className="tb-right">
        <button
          type="button"
          className={`icon-btn aa-trigger${aiOpen ? ' active' : ''}`}
          aria-label="AI Assistant"
          onClick={() => setAiOpen(o => !o)}
          data-tt="AI Assistant"
          data-tt-desc="Chat with any agent in your workspace · ⌘/"
        >
          <AssistantIcon />
        </button>
        <button
          type="button"
          className="icon-btn"
          aria-label="Notifications"
          data-tt="Notifications"
          data-tt-desc="Recent alerts and system updates."
        >
          <NotificationsIcon />
        </button>
        <button
          type="button"
          className="icon-btn"
          aria-label="Settings"
          data-tt="Settings"
          data-tt-desc="Workspace and account preferences."
        >
          <SettingsIcon />
        </button>
        <button
          type="button"
          className="avatar-sm"
          aria-label="User profile"
          data-tt="Account"
          data-tt-desc="Your profile, preferences, and sign out."
        >
          TH
        </button>
      </div>

      <AIAssistant
        open={aiOpen}
        onClose={() => setAiOpen(false)}
        currentAppId={currentAppId}
      />
    </header>
  )
}
