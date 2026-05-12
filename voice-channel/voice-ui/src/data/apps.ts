/**
 * Applications shown in the unified Context Menu.
 * Ported verbatim from voice-channel-ux.html.
 */

export type AppId = 'work-surface' | 'governance' | 'agentic-studio'

export interface CtxApp {
  id: AppId
  name: string
  desc: string
  href: string
  gradient: string
  initials: string
}

export const CTX_APPS: readonly CtxApp[] = [
  {
    id: 'work-surface',
    name: 'Work Surface',
    desc: 'Unified workspace',
    href: 'voice-channel-ux.html',
    gradient: 'linear-gradient(135deg,#0EA5E9 0%,#06B6D4 100%)',
    initials: 'WS',
  },
  {
    id: 'governance',
    name: 'Governance',
    desc: 'Policies & knowledge',
    href: 'governance-studio.html',
    gradient: 'linear-gradient(135deg,#6366F1 0%,#8B5CF6 100%)',
    initials: 'GS',
  },
  {
    id: 'agentic-studio',
    name: 'Agentic Studio',
    desc: 'Agents & workflows',
    href: 'agentic-studio.html',
    gradient: 'linear-gradient(135deg,#00C2C2 0%,#155DFC 100%)',
    initials: 'AS',
  },
]
