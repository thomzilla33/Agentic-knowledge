import React from 'react'
import ReactDOM from 'react-dom/client'
import { AppShell } from './components/AppShell'
import { VoiceChannel } from './components/VoiceChannel'
import './styles/voice.css'

// Dev harness — in production, VoiceChannel is embedded via the platform shell
const WORKSPACE_ID = import.meta.env.VITE_WORKSPACE_ID ?? 'ws-dev-local'
const USER_ID = import.meta.env.VITE_USER_ID ?? 'user-dev-local'
const IS_ADMIN = import.meta.env.VITE_IS_ADMIN !== 'false'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppShell currentAppId="work-surface">
      <VoiceChannel
        workspaceId={WORKSPACE_ID}
        userId={USER_ID}
        isAdmin={IS_ADMIN}
      />
    </AppShell>
  </React.StrictMode>,
)
