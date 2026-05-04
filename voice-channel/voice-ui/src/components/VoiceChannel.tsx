import { useState } from 'react'
import { VoiceOverview } from './VoiceOverview'
import { VoiceLogs } from './VoiceLogs'
import { VoiceSettings } from './VoiceSettings'
import { ToastContainer } from './ToastContainer'
import { useToast } from '../hooks/useToast'

type Tab = 'overview' | 'logs' | 'settings'

interface Props {
  workspaceId: string
  userId: string
  isAdmin: boolean
}

export function VoiceChannel({ workspaceId, userId, isAdmin }: Props) {
  const [tab, setTab] = useState<Tab>('overview')
  const { toasts, toast, dismiss } = useToast()

  return (
    <div className="voice-channel">
      <header className="page-header">
        <div className="page-title-row">
          <div className="page-icon">📞</div>
          <h1 className="page-title">Voice</h1>
        </div>
        <p className="page-subtitle">
          Phone call performance, conversations, and telephony settings
        </p>

        <nav className="page-tabs">
          <TabButton id="overview" active={tab} label="Overview" icon="📊" onClick={setTab} />
          <TabButton id="logs"     active={tab} label="Logs"     icon="📋" onClick={setTab} />
          <TabButton id="settings" active={tab} label="Settings" icon="⚙️" onClick={setTab} />
        </nav>
      </header>

      <main className="page-content">
        {tab === 'overview' && (
          <VoiceOverview workspaceId={workspaceId} />
        )}
        {tab === 'logs' && (
          <VoiceLogs workspaceId={workspaceId} />
        )}
        {tab === 'settings' && (
          <VoiceSettings
            workspaceId={workspaceId}
            userId={userId}
            isAdmin={isAdmin}
            onToast={toast}
          />
        )}
      </main>

      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </div>
  )
}

function TabButton({
  id, active, label, icon, onClick,
}: {
  id: Tab; active: Tab; label: string; icon: string; onClick: (id: Tab) => void
}) {
  return (
    <button
      className={`tab-btn ${active === id ? 'active' : ''}`}
      onClick={() => onClick(id)}
    >
      <span>{icon}</span>
      {label}
    </button>
  )
}
