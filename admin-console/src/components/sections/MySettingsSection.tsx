import { useState } from 'react';

// ── Shared styles ─────────────────────────────────────────────────────────

const card = 'bg-white border border-[var(--border)] rounded-xl p-5 mb-1';
const label = 'block text-xs font-medium text-[var(--field-text)] mb-1';
const input = 'w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--ac-surface2)] text-[var(--field-text)] focus:outline-none focus:border-[var(--primary)] focus:bg-white transition-colors';
const sectionTitle = 'text-[10px] font-semibold uppercase tracking-widest text-[var(--field-supporting)] mb-3';
const saveRow = 'flex justify-end mt-4 pt-4 border-t border-[var(--border)]';
const divider = 'border-t border-[var(--border)] my-4';
const saveBtn = 'px-4 py-2 text-xs font-semibold rounded-lg bg-[var(--primary)] text-white hover:opacity-90 transition-opacity';

function toast(msg: string) { alert(msg); }

// ── Tabs ──────────────────────────────────────────────────────────────────

type Tab = 'profile' | 'security' | 'notifications';

const TABS: { id: Tab; label: string }[] = [
  { id: 'profile', label: 'Profile' },
  { id: 'security', label: 'Security' },
  { id: 'notifications', label: 'Notifications' },
];

// ── Profile tab ───────────────────────────────────────────────────────────

function ProfileTab() {
  const [form, setForm] = useState({
    firstName: 'Thomas', lastName: 'González',
    email: 'thomas.gonzalez@aimsos.ai',
    title: 'CTO', department: 'Engineering',
    timezone: 'America/New_York (UTC-5)', language: 'English (US)',
  });
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(() => {
    try { const v = localStorage.getItem('aims-theme'); return (v === 'light' || v === 'dark') ? v : 'system'; } catch { return 'system'; }
  });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  function applyTheme(t: typeof theme) {
    setTheme(t);
    try { localStorage.setItem('aims-theme', t); } catch {}
    document.documentElement.setAttribute('data-theme', t === 'system' ? '' : t);
  }

  const themes: { id: typeof theme; label: string; bg: string }[] = [
    { id: 'light', label: 'Light', bg: '#f8fafc' },
    { id: 'dark', label: 'Dark', bg: '#0f172a' },
    { id: 'system', label: 'System', bg: 'linear-gradient(135deg,#f8fafc 50%,#0f172a 50%)' },
  ];

  return (
    <div>
      {/* Profile */}
      <div className="mb-6">
        <div className={sectionTitle}>Profile</div>
        <div className={card}>
          <div className="flex items-center gap-4 pb-4 mb-4 border-b border-[var(--border)]">
            <div className="w-14 h-14 rounded-xl bg-[var(--primary)] text-white flex items-center justify-center text-xl font-bold shrink-0">TG</div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-[var(--field-text)]">Thomas González</div>
              <div className="text-xs text-[var(--field-supporting)] mt-0.5">CTO · Engineering</div>
              <div className="text-xs text-[var(--field-supporting)]">thomas.gonzalez@aimsos.ai</div>
            </div>
            <button className="text-xs px-3 py-1.5 border border-[var(--border)] rounded-lg text-[var(--field-text)] hover:bg-[var(--ac-surface2)] transition-colors shrink-0">
              Change photo
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div><label className={label}>First name</label><input className={input} value={form.firstName} onChange={set('firstName')} /></div>
            <div><label className={label}>Last name</label><input className={input} value={form.lastName} onChange={set('lastName')} /></div>
            <div className="col-span-2"><label className={label}>Email</label><input className={`${input} opacity-60 cursor-not-allowed`} type="email" value={form.email} readOnly /></div>
            <div><label className={label}>Job title</label><input className={input} value={form.title} onChange={set('title')} /></div>
            <div><label className={label}>Department</label><input className={input} value={form.department} onChange={set('department')} /></div>
            <div>
              <label className={label}>Timezone</label>
              <select className={input} value={form.timezone} onChange={set('timezone')}>
                {['America/New_York (UTC-5)', 'America/Chicago (UTC-6)', 'America/Los_Angeles (UTC-8)', 'Europe/London (UTC+0)', 'Europe/Madrid (UTC+1)'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className={label}>Language</label>
              <select className={input} value={form.language} onChange={set('language')}>
                {['English (US)', 'English (UK)', 'Español', 'Français', 'Deutsch'].map(l => <option key={l}>{l}</option>)}
              </select>
            </div>
          </div>

          <div className={saveRow}>
            <button className={saveBtn} onClick={() => toast('Profile saved')}>Save changes</button>
          </div>
        </div>
      </div>

      {/* Appearance */}
      <div className="mb-6">
        <div className={sectionTitle}>Appearance</div>
        <div className={card}>
          <div className="flex gap-3">
            {themes.map(t => (
              <button
                key={t.id}
                onClick={() => applyTheme(t.id)}
                className={`flex-1 rounded-lg border-2 overflow-hidden transition-all ${theme === t.id ? 'border-[var(--primary)]' : 'border-[var(--border)] hover:border-[var(--field-supporting)]'}`}
              >
                <div className="h-16 w-full" style={{ background: t.bg }} />
                <div className={`py-2 text-xs font-medium ${theme === t.id ? 'text-[var(--primary)]' : 'text-[var(--field-supporting)]'}`}>
                  {t.label}
                  {theme === t.id && <span className="ml-1.5">✓</span>}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Security tab ──────────────────────────────────────────────────────────

function SecurityTab() {
  const items = [
    {
      icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="7" width="12" height="8" rx="2" stroke="#10b981" strokeWidth="1.4"/><path d="M5 7V5a3 3 0 016 0v2" stroke="#10b981" strokeWidth="1.4" strokeLinecap="round"/></svg>,
      bg: 'rgba(16,185,129,.12)',
      label: 'Multi-factor authentication',
      badge: { label: 'Enabled', color: '#10b981', bg: 'rgba(16,185,129,.1)' },
      sub: 'Authenticator app · Last verified 2 hours ago',
      action: { label: 'Manage', onClick: () => toast('MFA management coming in V1.2') },
    },
    {
      icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="5.5" stroke="var(--primary)" strokeWidth="1.4"/><circle cx="8" cy="8" r="1.5" fill="var(--primary)"/><path d="M8 9.5V12" stroke="var(--primary)" strokeWidth="1.4" strokeLinecap="round"/></svg>,
      bg: 'rgba(99,102,241,.12)',
      label: 'Password',
      badge: null,
      sub: 'Last changed 47 days ago',
      action: { label: 'Change password', onClick: () => toast('A reset link has been sent to thomas.gonzalez@aimsos.ai') },
    },
  ];

  const sessions = [
    { device: 'Chrome on macOS', ip: '184.28.90.1 · New York, US · Just now', current: true },
    { device: 'Safari on iPhone', ip: '98.45.12.7 · New York, US · 3h ago', current: false },
  ];

  return (
    <div className="mb-6">
      <div className={sectionTitle}>Security</div>
      <div className={card}>
        {items.map((item, i) => (
          <div key={item.label}>
            {i > 0 && <div className={divider} />}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: item.bg }}>{item.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-[var(--field-text)] flex items-center gap-2">
                  {item.label}
                  {item.badge && (
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full border" style={{ color: item.badge.color, background: item.badge.bg, borderColor: `${item.badge.color}40` }}>
                      ✓ {item.badge.label}
                    </span>
                  )}
                </div>
                <div className="text-xs text-[var(--field-supporting)] mt-0.5">{item.sub}</div>
              </div>
              <button onClick={item.action.onClick} className="shrink-0 text-xs px-3 py-1.5 border border-[var(--border)] rounded-lg text-[var(--field-text)] hover:bg-[var(--ac-surface2)] transition-colors">
                {item.action.label}
              </button>
            </div>
          </div>
        ))}

        <div className={divider} />

        {/* Active sessions */}
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-[rgba(99,102,241,.12)] mt-0.5">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1.5" y="3" width="13" height="9" rx="2" stroke="var(--primary)" strokeWidth="1.4"/><path d="M5 13h6M8 12v1" stroke="var(--primary)" strokeWidth="1.4" strokeLinecap="round"/></svg>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-[var(--field-text)] mb-2">
              Active sessions <span className="text-xs font-semibold text-[var(--field-supporting)] ml-1">2</span>
            </div>
            <div className="flex flex-col gap-2">
              {sessions.map(s => (
                <div key={s.device} className="flex items-center gap-2.5 text-xs">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-[var(--field-text)] flex items-center gap-1.5">
                      {s.device}
                      {s.current && <span className="font-semibold px-1.5 py-0.5 rounded-full text-emerald-600 bg-emerald-50 border border-emerald-200 text-[10px]">Current</span>}
                    </div>
                    <div className="text-[var(--field-supporting)] mt-0.5">{s.ip}</div>
                  </div>
                  {!s.current && (
                    <button onClick={() => toast('Session revoked')} className="text-red-500 hover:text-red-600 font-medium shrink-0">Revoke</button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Notifications tab ─────────────────────────────────────────────────────

function NotificationsTab() {
  const [channels, setChannels] = useState({ email: true, inapp: true });

  const RULES = [
    { cat: 'Security & Access', events: [
      { id: 'login', label: 'New sign-in from unrecognized device', email: true, inapp: true },
      { id: 'role', label: 'Your role or permissions changed', email: true, inapp: true },
    ]},
    { cat: 'Agent Workflows', events: [
      { id: 'agent-fail', label: 'Agentic workflow failure or timeout', email: false, inapp: true },
      { id: 'agent-complete', label: 'Long-running workflow completed', email: false, inapp: true },
    ]},
    { cat: 'Governance', events: [
      { id: 'gov-req', label: 'Governance approval request', email: true, inapp: true },
      { id: 'gov-approved', label: 'Your submission was approved', email: true, inapp: true },
    ]},
  ];

  return (
    <div className="mb-6">
      <div className={sectionTitle}>Notifications</div>

      {/* Channels */}
      <div className="flex gap-3 mb-4">
        {[
          { id: 'email' as const, label: 'Email', hint: 'thomas.gonzalez@aimsos.ai', color: '#818CF8', bg: 'rgba(99,102,241,.12)' },
          { id: 'inapp' as const, label: 'In-app', hint: 'Bell icon · AIMS-OS', color: '#34D399', bg: 'rgba(16,185,129,.12)' },
        ].map(ch => (
          <div key={ch.id} className={`${card} flex-1 flex items-center gap-3 mb-0`}>
            <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: ch.bg }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                {ch.id === 'email'
                  ? <><rect x="2" y="4" width="20" height="16" rx="2" stroke={ch.color} strokeWidth="1.8"/><path d="M2 7l10 7 10-7" stroke={ch.color} strokeWidth="1.8"/></>
                  : <><path d="M6 10a6 6 0 1112 0v5l2 2H4l2-2v-5z" stroke={ch.color} strokeWidth="1.8" strokeLinejoin="round"/><path d="M10 20a2 2 0 004 0" stroke={ch.color} strokeWidth="1.8" strokeLinecap="round"/></>
                }
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-[var(--field-text)]">{ch.label}</div>
              <div className="text-xs text-[var(--field-supporting)] truncate">{ch.hint}</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input type="checkbox" checked={channels[ch.id]} onChange={e => setChannels(c => ({ ...c, [ch.id]: e.target.checked }))} className="sr-only peer" />
              <div className="w-9 h-5 bg-[var(--border)] peer-checked:bg-[var(--primary)] rounded-full transition-colors" />
              <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-4" />
            </label>
          </div>
        ))}
      </div>

      {/* Rules */}
      <div className={card}>
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[var(--border)]">
              <th className="text-left py-2 font-semibold text-[var(--field-text)]">Event</th>
              <th className="w-16 text-center py-2 font-semibold text-[var(--field-text)]">Email</th>
              <th className="w-16 text-center py-2 font-semibold text-[var(--field-text)]">In-app</th>
            </tr>
          </thead>
          <tbody>
            {RULES.map(group => (
              <>
                <tr key={group.cat}><td colSpan={3} className="pt-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-[var(--field-supporting)]">{group.cat}</td></tr>
                {group.events.map(ev => (
                  <tr key={ev.id} className="border-b border-[var(--border)] last:border-0">
                    <td className="py-2.5 text-[var(--field-text)]">{ev.label}</td>
                    {(['email', 'inapp'] as const).map(ch => (
                      <td key={ch} className="py-2.5 text-center">
                        <input type="checkbox" defaultChecked={ev[ch]} className="w-3.5 h-3.5 accent-[var(--primary)]" />
                      </td>
                    ))}
                  </tr>
                ))}
              </>
            ))}
          </tbody>
        </table>
        <div className={saveRow}>
          <button className={saveBtn} onClick={() => toast('Notification preferences saved')}>Save changes</button>
        </div>
      </div>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────

export function MySettingsSection() {
  const [tab, setTab] = useState<Tab>('profile');

  return (
    <div className="max-w-2xl">
      <div className="mb-5">
        <h1 className="text-lg font-semibold text-[var(--field-text)]">My Settings</h1>
        <p className="text-xs text-[var(--field-supporting)] mt-0.5">Manage your profile, appearance, security, and notification preferences.</p>
      </div>

      {/* Tab nav */}
      <div className="flex border-b border-[var(--border)] mb-6 gap-0">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${
              tab === t.id ? 'border-[var(--primary)] text-[var(--primary)]' : 'border-transparent text-[var(--field-supporting)] hover:text-[var(--field-text)]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'profile' && <ProfileTab />}
      {tab === 'security' && <SecurityTab />}
      {tab === 'notifications' && <NotificationsTab />}
    </div>
  );
}
