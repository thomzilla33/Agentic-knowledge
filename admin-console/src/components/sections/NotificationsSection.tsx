import { useState } from 'react';

const card = 'bg-white border border-[var(--border)] rounded-xl p-5 mb-1';
const sectionTitle = 'text-[10px] font-semibold uppercase tracking-widest text-[var(--field-supporting)] mb-3';
const saveBtn = 'px-4 py-2 text-xs font-semibold rounded-lg bg-[var(--primary)] text-white hover:opacity-90 transition-opacity';

function toast(msg: string) { alert(msg); }

// ── Toggle ────────────────────────────────────────────────────────────────

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="relative inline-flex items-center cursor-pointer shrink-0">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="sr-only peer" />
      <div className="w-9 h-5 bg-[var(--border)] peer-checked:bg-[var(--primary)] rounded-full transition-colors" />
      <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-4" />
    </label>
  );
}

// ── Channels ──────────────────────────────────────────────────────────────

type ChannelId = 'inapp' | 'email' | 'slack' | 'webhook';


const InAppIcon = ({ color }: { color: string }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <path d="M6 10a6 6 0 1112 0v5l2 2H4l2-2v-5z" stroke={color} strokeWidth="1.8" strokeLinejoin="round"/>
    <path d="M10 20a2 2 0 004 0" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
);
const EmailIcon = ({ color }: { color: string }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <rect x="2" y="4" width="20" height="16" rx="2" stroke={color} strokeWidth="1.8"/>
    <path d="M2 7l10 7 10-7" stroke={color} strokeWidth="1.8"/>
  </svg>
);
const SlackIcon = ({ color }: { color: string }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <path d="M9 3a2 2 0 11-2 2v-2h2zM9 3h6a2 2 0 110 2H9V3zM3 9a2 2 0 112 2H3V9zM3 9v6a2 2 0 102 0V9H3zM9 21a2 2 0 11-2-2v2h2zM9 21h6a2 2 0 100-2H9v2zM21 15a2 2 0 11-2-2h2v2zM21 15v-6a2 2 0 10-2 0v6h2z" stroke={color} strokeWidth="1.5"/>
  </svg>
);
const WebhookIcon = ({ color }: { color: string }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

interface ChannelDef {
  id: ChannelId;
  label: string;
  icon: React.ReactNode;
  bg: string;
}

const CHANNEL_DEFS: ChannelDef[] = [
  { id: 'inapp',   label: 'In-app',  icon: <InAppIcon color="#34d399" />,   bg: 'rgba(52,211,153,.12)' },
  { id: 'email',   label: 'Email',   icon: <EmailIcon color="#818cf8" />,    bg: 'rgba(129,140,248,.12)' },
  { id: 'slack',   label: 'Slack',   icon: <SlackIcon color="#e2a541" />,    bg: 'rgba(226,165,65,.12)' },
  { id: 'webhook', label: 'Webhook', icon: <WebhookIcon color="#f87171" />,  bg: 'rgba(248,113,113,.12)' },
];

function channelHint(id: ChannelId, enabled: boolean): string {
  if (id === 'inapp')   return 'Bell icon in the AIMS-OS navigation';
  if (id === 'email')   return 'workspace-notifications@contoso.com';
  if (id === 'slack')   return enabled ? '#aims-alerts connected' : 'Not connected';
  return 'POST to a custom endpoint';
}

function ChannelsSection() {
  const [channels, setChannels] = useState<Record<ChannelId, boolean>>({
    inapp: true, email: true, slack: false, webhook: false,
  });
  const [webhookUrl, setWebhookUrl] = useState('');

  const toggle = (id: ChannelId) => setChannels(c => ({ ...c, [id]: !c[id] }));

  return (
    <div className="mb-6">
      <div className={sectionTitle}>Delivery channels</div>
      <div className="flex flex-col gap-2">
        {CHANNEL_DEFS.map(ch => (
          <div key={ch.id} className="bg-white border border-[var(--border)] rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: ch.bg }}>{ch.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-[var(--field-text)]">{ch.label}</div>
                <div className="text-xs text-[var(--field-supporting)] truncate">{channelHint(ch.id, channels[ch.id])}</div>
              </div>
              {ch.id === 'slack' && !channels.slack && (
                <button onClick={() => toast('Slack OAuth coming in V1.2')} className="text-xs px-3 py-1.5 border border-[var(--border)] rounded-lg text-[var(--field-text)] hover:bg-[var(--ac-surface2)] transition-colors shrink-0">
                  Connect
                </button>
              )}
              <Toggle checked={channels[ch.id]} onChange={() => toggle(ch.id)} />
            </div>
            {ch.id === 'webhook' && channels.webhook && (
              <div className="mt-3 pt-3 border-t border-[var(--border)]">
                <input
                  className="w-full px-3 py-2 text-xs border border-[var(--border)] rounded-lg bg-[var(--ac-surface2)] text-[var(--field-text)] focus:outline-none focus:border-[var(--primary)] transition-colors"
                  placeholder="https://your-endpoint.com/hook"
                  value={webhookUrl}
                  onChange={e => setWebhookUrl(e.target.value)}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Rules table ───────────────────────────────────────────────────────────

const RULES = [
  { cat: 'Security & Access', events: [
    { id: 'sign-in', label: 'New sign-in from unrecognized device', email: true, inapp: true, slack: false, webhook: false },
    { id: 'mfa', label: 'MFA configuration changed', email: true, inapp: true, slack: false, webhook: false },
    { id: 'role-change', label: 'User role or permissions changed', email: true, inapp: true, slack: false, webhook: false },
  ]},
  { cat: 'Agent Workflows', events: [
    { id: 'agent-fail', label: 'Agentic workflow failure or timeout', email: false, inapp: true, slack: true, webhook: true },
    { id: 'agent-complete', label: 'Long-running workflow completed', email: false, inapp: true, slack: false, webhook: false },
    { id: 'hitl', label: 'Human-in-the-Loop handoff required', email: true, inapp: true, slack: true, webhook: false },
  ]},
  { cat: 'Governance', events: [
    { id: 'gov-req', label: 'Governance approval request', email: true, inapp: true, slack: true, webhook: false },
    { id: 'gov-approved', label: 'Your submission was approved/rejected', email: true, inapp: true, slack: false, webhook: false },
    { id: 'policy-change', label: 'Global policy setting changed', email: true, inapp: true, slack: false, webhook: true },
  ]},
  { cat: 'Digest', events: [
    { id: 'weekly', label: 'Weekly activity digest', email: true, inapp: false, slack: false, webhook: false },
    { id: 'monthly', label: 'Monthly usage & billing summary', email: true, inapp: false, slack: false, webhook: false },
  ]},
];

const COLS: { id: 'inapp' | 'email' | 'slack' | 'webhook'; label: string }[] = [
  { id: 'inapp', label: 'In-app' },
  { id: 'email', label: 'Email' },
  { id: 'slack', label: 'Slack' },
  { id: 'webhook', label: 'Webhook' },
];

function RulesTable() {
  const [rules, setRules] = useState(() => {
    const map: Record<string, Record<string, boolean>> = {};
    RULES.forEach(g => g.events.forEach(e => {
      map[e.id] = { inapp: e.inapp, email: e.email, slack: e.slack, webhook: e.webhook };
    }));
    return map;
  });

  const toggle = (evId: string, col: string) => {
    setRules(r => ({ ...r, [evId]: { ...r[evId], [col]: !r[evId][col] } }));
  };

  return (
    <div className="mb-6">
      <div className={sectionTitle}>Notification rules</div>
      <div className={card} style={{ padding: 0, overflow: 'hidden' }}>
        <table className="w-full text-xs">
          <thead className="border-b border-[var(--border)]">
            <tr>
              <th className="text-left px-5 py-3 font-semibold text-[var(--field-text)]">Event</th>
              {COLS.map(c => <th key={c.id} className="w-16 text-center py-3 font-semibold text-[var(--field-text)]">{c.label}</th>)}
            </tr>
          </thead>
          <tbody>
            {RULES.map(group => (
              <>
                <tr key={group.cat}>
                  <td colSpan={5} className="px-5 pt-4 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-[var(--field-supporting)] bg-[var(--ac-surface2)]">
                    {group.cat}
                  </td>
                </tr>
                {group.events.map(ev => (
                  <tr key={ev.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--ac-surface2)] transition-colors">
                    <td className="px-5 py-2.5 text-[var(--field-text)]">{ev.label}</td>
                    {COLS.map(c => (
                      <td key={c.id} className="py-2.5 text-center">
                        <input
                          type="checkbox"
                          checked={rules[ev.id]?.[c.id] ?? false}
                          onChange={() => toggle(ev.id, c.id)}
                          className="w-3.5 h-3.5 accent-[var(--primary)]"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </>
            ))}
          </tbody>
        </table>
        <div className="flex justify-end px-5 py-4 border-t border-[var(--border)]">
          <button className={saveBtn} onClick={() => toast('Notification rules saved')}>Save changes</button>
        </div>
      </div>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────

export function NotificationsSection() {
  return (
    <div className="max-w-2xl">
      <div className="mb-5">
        <h1 className="text-lg font-semibold text-[var(--field-text)]">Notifications</h1>
        <p className="text-xs text-[var(--field-supporting)] mt-0.5">Configure how and when your workspace receives notifications.</p>
      </div>
      <ChannelsSection />
      <RulesTable />
    </div>
  );
}
