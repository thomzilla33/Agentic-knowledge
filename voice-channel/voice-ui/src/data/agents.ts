/**
 * Workspace agents — mock list shared across studios.
 * In production this comes from the workspace's installed agents.
 * Ported verbatim from voice-channel-ux.html.
 */

export interface AaAgent {
  id: string
  name: string
  /** Hex color for the agent's chip. Required for non-auto agents. */
  color?: string
  /** True for the orchestrator that picks an agent automatically. */
  isAuto?: boolean
  /** Short description (currently used only for the auto agent). */
  desc?: string
}

export const AA_AGENTS: readonly AaAgent[] = [
  { id: 'auto',        name: 'Auto-route',                 desc: 'Orchestrator picks the best agent', isAuto: true },
  { id: 'sammy',       name: 'Sammy — Service Desk',       color: '#0EA5E9' },
  { id: 'spa-obj',     name: 'Spanish Objection Handling', color: '#F59E0B' },
  { id: 'svc-proc',    name: 'Service Procedures',         color: '#10B981' },
  { id: 'roadside',    name: 'Roadside Triage',            color: '#EF4444' },
  { id: 'warranty',    name: 'Warranty Claims',            color: '#8B5CF6' },
  { id: 'inbound-sdr', name: 'Inbound SDR',                color: '#EC4899' },
  { id: 'faq',         name: 'Customer FAQ Bot',           color: '#06B6D4' },
  { id: 'promo',       name: 'Promo Outbound',             color: '#F97316' },
  { id: 'escalation',  name: 'Escalation Handler',         color: '#D946EF' },
  { id: 'sox',         name: 'SOX Compliance Auditor',     color: '#6366F1' },
  { id: 'vehicle',     name: 'Vehicle Specs Lookup',       color: '#22C55E' },
]

/** Default starter prompts shown in the AI Assistant empty state for Voice. */
export const DEFAULT_SUGGESTIONS: readonly string[] = [
  "Summarize today's call volume and average duration",
  'Find phone numbers with no calls in the last 7 days',
  'Which agents handled the most escalations this week?',
]

export function agentInitials(name: string): string {
  return name.replace(/[^A-Za-z]/g, '').slice(0, 2).toUpperCase()
}
