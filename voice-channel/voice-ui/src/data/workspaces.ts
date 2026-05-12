/**
 * Workspace data and helpers — ported from voice-channel-ux.html.
 * In production this would come from the platform API; for Phase 1
 * we keep the same mock list to match the prototype exactly.
 */

export interface Workspace {
  id: string
  name: string
  subdomain: string
  role: 'Owner' | 'Admin' | 'Member' | 'Viewer'
  logo: string | null
  lastUsed: number
}

export const WORKSPACE_PALETTE: readonly string[] = [
  'linear-gradient(135deg,#155DFC 0%,#00C2C2 100%)',
  'linear-gradient(135deg,#6366F1 0%,#8B5CF6 100%)',
  'linear-gradient(135deg,#0EA5E9 0%,#06B6D4 100%)',
  'linear-gradient(135deg,#14B8A6 0%,#10B981 100%)',
  'linear-gradient(135deg,#F59E0B 0%,#EF4444 100%)',
  'linear-gradient(135deg,#EC4899 0%,#F43F5E 100%)',
  'linear-gradient(135deg,#A78BFA 0%,#7C3AED 100%)',
  'linear-gradient(135deg,#22C55E 0%,#84CC16 100%)',
  'linear-gradient(135deg,#0284C7 0%,#0EA5E9 100%)',
  'linear-gradient(135deg,#D946EF 0%,#A855F7 100%)',
]

export const WORKSPACES_DATA: readonly Workspace[] = [
  { id: 'acme',    name: 'Acme Corp',       subdomain: 'acme.aimsos.ai',    role: 'Admin',  logo: null, lastUsed: 100 },
  { id: 'beta',    name: 'Beta Industries', subdomain: 'beta.aimsos.ai',    role: 'Member', logo: null, lastUsed: 90 },
  { id: 'contoso', name: 'Contoso Ltd',     subdomain: 'contoso.aimsos.ai', role: 'Owner',  logo: null, lastUsed: 80 },
  { id: 'demo',    name: 'Demo Org',        subdomain: 'demo.aimsos.ai',    role: 'Viewer', logo: null, lastUsed: 50 },
  { id: 'enerco',  name: 'EnerCo',          subdomain: 'enerco.aimsos.ai',  role: 'Admin',  logo: null, lastUsed: 40 },
  { id: 'factory', name: 'FactoryWorks',    subdomain: 'factory.aimsos.ai', role: 'Admin',  logo: null, lastUsed: 30 },
  { id: 'globex',  name: 'Globex',          subdomain: 'globex.aimsos.ai',  role: 'Member', logo: null, lastUsed: 20 },
  { id: 'gary',    name: 'Gary Crossley Ford Kansas City Dealership & Service Center', subdomain: 'gary.aimsos.ai', role: 'Admin', logo: null, lastUsed: 60 },
]

const STORAGE_KEY = 'aims_active_workspace'
const DEFAULT_WS_ID = 'contoso'

export function wsHashColor(id: string): string {
  let h = 0
  const s = String(id)
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h) + s.charCodeAt(i)
    h |= 0
  }
  return WORKSPACE_PALETTE[Math.abs(h) % WORKSPACE_PALETTE.length]
}

export function wsInitials(name: string): string {
  return name
    .replace(/[^A-Za-z0-9 ]/g, '')
    .trim()
    .split(/\s+/)
    .map(p => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function truncate(s: string, max = 50): string {
  return s && s.length > max ? s.slice(0, max - 1) + '…' : s
}

export function getStoredWorkspaceId(): string {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored && WORKSPACES_DATA.find(w => w.id === stored)) {
      return stored
    }
  } catch {
    // localStorage unavailable (e.g. SSR / private mode) — fall through
  }
  return DEFAULT_WS_ID
}

export function getActiveWorkspace(): Workspace {
  const id = getStoredWorkspaceId()
  return WORKSPACES_DATA.find(w => w.id === id) ?? WORKSPACES_DATA[0]
}

export function setActiveWorkspaceId(id: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, id)
  } catch {
    // Swallow — non-critical persistence
  }
}
