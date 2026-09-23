import { useState } from 'react';

// ── Mock data (matches HTML prototype's MOCK_ORG) ─────────────────────────

const ORG_DATA = {
  name: 'Contoso Ltd',
  displayName: 'Contoso',
  website: 'https://contoso.com',
  industry: 'Financial Services',
  size: '1,001–5,000',
  supportEmail: 'it-admin@contoso.com',
  billingEmail: 'billing@contoso.com',
  legalName: 'Contoso Financial Group, Inc.',
  taxId: 'US-84-1234567',
  address: '350 Fifth Avenue, Suite 6700\nNew York, NY 10118\nUnited States',
  workspaceId: 'ws_contoso_a1b2c3d4',
  region: 'US East (AWS us-east-1)',
  plan: 'Enterprise',
  created: 'Jan 12, 2025',
  memberCount: 13,
};

const INDUSTRIES = ['Financial Services', 'Healthcare', 'Technology', 'Manufacturing', 'Retail', 'Education', 'Government', 'Other'];
const COMPANY_SIZES = ['1–50', '51–200', '201–1,000', '1,001–5,000', '5,001–10,000', '10,000+'];
const VERIFIED_DOMAINS = [
  { domain: 'contoso.com', status: 'verified', added: 'Jan 12, 2025' },
  { domain: 'contosoltd.com', status: 'pending', added: 'Aug 20, 2026' },
];

// ── Shared styles ─────────────────────────────────────────────────────────

const card = 'bg-white border border-[var(--border)] rounded-xl p-5 mb-1';
const label = 'block text-xs font-medium text-[var(--field-text)] mb-1';
const input = 'w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--ac-surface2)] text-[var(--field-text)] focus:outline-none focus:border-[var(--primary)] focus:bg-white transition-colors';
const sectionTitle = 'text-[10px] font-semibold uppercase tracking-widest text-[var(--field-supporting)] mb-3';
const saveRow = 'flex justify-end mt-4 pt-4 border-t border-[var(--border)]';

function toast(msg: string) { alert(msg); }

// ── Sub-components ────────────────────────────────────────────────────────

function ProfileSection() {
  const [form, setForm] = useState({
    name: ORG_DATA.name,
    displayName: ORG_DATA.displayName,
    website: ORG_DATA.website,
    industry: ORG_DATA.industry,
    size: ORG_DATA.size,
    supportEmail: ORG_DATA.supportEmail,
  });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <div className="mb-6">
      <div className={sectionTitle}>Organization profile</div>
      <div className={card}>
        {/* Logo row */}
        <div className="flex items-center gap-4 pb-4 mb-4 border-b border-[var(--border)]">
          <div className="w-14 h-14 rounded-xl bg-[var(--primary)] text-white flex items-center justify-center text-xl font-bold shrink-0">
            CO
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold text-[var(--field-text)]">{form.name}</div>
            <div className="text-xs text-[var(--field-supporting)] mt-0.5">Workspace logo · Shown to members and in emails</div>
          </div>
          <button className="text-xs px-3 py-1.5 border border-[var(--border)] rounded-lg text-[var(--field-text)] hover:bg-[var(--ac-surface2)] transition-colors">
            Upload logo
          </button>
        </div>

        {/* Form grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className={label}>Organization name</label>
            <input className={input} type="text" value={form.name} onChange={set('name')} />
          </div>
          <div>
            <label className={label}>Display name</label>
            <input className={input} type="text" value={form.displayName} onChange={set('displayName')} />
          </div>
          <div>
            <label className={label}>Website</label>
            <input className={input} type="url" value={form.website} onChange={set('website')} />
          </div>
          <div>
            <label className={label}>Industry</label>
            <select className={input} value={form.industry} onChange={set('industry')}>
              {INDUSTRIES.map(i => <option key={i}>{i}</option>)}
            </select>
          </div>
          <div>
            <label className={label}>Company size</label>
            <select className={input} value={form.size} onChange={set('size')}>
              {COMPANY_SIZES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="col-span-2">
            <label className={label}>Support contact email</label>
            <input className={input} type="email" value={form.supportEmail} onChange={set('supportEmail')} />
          </div>
        </div>

        <div className={saveRow}>
          <button
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-[var(--primary)] text-white hover:opacity-90 transition-opacity"
            onClick={() => toast('Organization profile saved')}
          >
            Save changes
          </button>
        </div>
      </div>
    </div>
  );
}

function WorkspaceInfoSection() {
  const tiles = [
    { label: 'Workspace ID', value: ORG_DATA.workspaceId, mono: true, copyable: true },
    { label: 'Plan', value: `★ ${ORG_DATA.plan}`, badge: true },
    { label: 'Region', value: ORG_DATA.region },
    { label: 'Created', value: ORG_DATA.created },
    { label: 'Members', value: String(ORG_DATA.memberCount) },
    { label: 'Data residency', value: 'United States' },
  ];

  return (
    <div className="mb-6">
      <div className={sectionTitle}>Workspace</div>
      <div className={card}>
        <div className="grid grid-cols-3 gap-3">
          {tiles.map(t => (
            <div key={t.label} className="bg-[var(--ac-surface2)] rounded-lg px-3 py-2.5">
              <div className="text-[10px] text-[var(--field-supporting)] font-medium mb-1">{t.label}</div>
              <div className="flex items-center gap-2">
                {t.mono ? (
                  <code className="text-xs text-[var(--field-text)] font-mono">{t.value}</code>
                ) : t.badge ? (
                  <span className="text-xs font-semibold text-[var(--primary)]">{t.value}</span>
                ) : (
                  <span className="text-xs text-[var(--field-text)] font-medium">{t.value}</span>
                )}
                {t.copyable && (
                  <button
                    onClick={() => { navigator.clipboard.writeText(ORG_DATA.workspaceId); toast('Copied'); }}
                    className="text-[var(--field-supporting)] hover:text-[var(--field-text)] transition-colors"
                    title="Copy"
                  >
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                      <rect x="5" y="5" width="9" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
                      <path d="M11 5V3.5A1.5 1.5 0 0 0 9.5 2h-6A1.5 1.5 0 0 0 2 3.5v6A1.5 1.5 0 0 0 3.5 11H5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function VerifiedDomainsSection() {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className={sectionTitle} style={{ marginBottom: 0 }}>Verified domains</div>
        <button className="text-xs font-medium text-[var(--primary)] hover:opacity-80 transition-opacity">
          + Add domain
        </button>
      </div>
      <div className={card}>
        <p className="text-xs text-[var(--field-supporting)] mb-3">
          Members with verified domain email addresses can join your workspace automatically. DNS verification required.
        </p>
        <div className="divide-y divide-[var(--border)]">
          {VERIFIED_DOMAINS.map(d => (
            <div key={d.domain} className="flex items-center justify-between py-2.5">
              <div className="flex items-center gap-2.5">
                <div className={`w-1.5 h-1.5 rounded-full ${d.status === 'verified' ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                <span className="text-sm font-medium text-[var(--field-text)]">{d.domain}</span>
                <span className="text-xs text-[var(--field-supporting)]">Added {d.added}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-medium capitalize ${d.status === 'verified' ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {d.status === 'verified' ? 'Verified' : 'Pending verification'}
                </span>
                <button className="text-xs text-[var(--field-supporting)] hover:text-red-500 transition-colors px-1">Remove</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ContactLegalSection() {
  const [form, setForm] = useState({
    billingEmail: ORG_DATA.billingEmail,
    legalName: ORG_DATA.legalName,
    taxId: ORG_DATA.taxId,
    address: ORG_DATA.address,
  });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <div className="mb-6">
      <div className={sectionTitle}>Contact &amp; Legal</div>
      <div className={card}>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={label}>Billing contact email</label>
            <input className={input} type="email" value={form.billingEmail} onChange={set('billingEmail')} />
          </div>
          <div>
            <label className={label}>Legal entity name</label>
            <input className={input} type="text" value={form.legalName} onChange={set('legalName')} />
          </div>
          <div>
            <label className={label}>VAT / Tax ID</label>
            <input className={input} type="text" value={form.taxId} onChange={set('taxId')} />
          </div>
          <div className="col-span-2">
            <label className={label}>Billing address</label>
            <textarea
              className={`${input} resize-y`}
              rows={3}
              value={form.address}
              onChange={set('address')}
            />
          </div>
        </div>
        <div className={saveRow}>
          <button
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-[var(--primary)] text-white hover:opacity-90 transition-opacity"
            onClick={() => toast('Contact details saved')}
          >
            Save changes
          </button>
        </div>
      </div>
    </div>
  );
}

function DangerZoneSection() {
  const actions = [
    {
      label: 'Transfer workspace ownership',
      desc: 'The recipient becomes the primary owner. Your role will be adjusted to Tenant Admin.',
      btnLabel: 'Transfer ownership',
      onClick: () => toast('Transfer ownership — contact support to proceed'),
    },
    {
      label: 'Export workspace data',
      desc: 'Download a full archive of members, models, agents, and audit logs.',
      btnLabel: 'Request export',
      onClick: () => toast('Export queued — you will receive an email when ready'),
    },
    {
      label: 'Delete this workspace',
      desc: 'Permanently removes all data. This action cannot be undone.',
      btnLabel: 'Delete workspace',
      destructive: true,
      onClick: () => toast('Please confirm workspace deletion'),
    },
  ];

  return (
    <div className="mb-6">
      <div className={sectionTitle}>Danger zone</div>
      <div className="border border-red-200 rounded-xl overflow-hidden">
        {actions.map((a, i) => (
          <div key={a.label} className={`flex items-center justify-between gap-4 p-4 ${i < actions.length - 1 ? 'border-b border-red-100' : ''} bg-red-50/50`}>
            <div>
              <div className="text-sm font-medium text-[var(--field-text)]">{a.label}</div>
              <div className="text-xs text-[var(--field-supporting)] mt-0.5">{a.desc}</div>
            </div>
            <button
              onClick={a.onClick}
              className={`shrink-0 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${
                a.destructive
                  ? 'border-red-400 text-red-600 hover:bg-red-600 hover:text-white'
                  : 'border-[var(--border)] text-[var(--field-text)] hover:bg-[var(--ac-surface2)]'
              }`}
            >
              {a.btnLabel}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────

export function OrganizationSection() {
  return (
    <div className="max-w-2xl">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-[var(--field-text)]">Organization</h1>
        <p className="text-xs text-[var(--field-supporting)] mt-0.5">
          Workspace profile, verified domains, and regional settings for Contoso Ltd.
        </p>
      </div>

      <ProfileSection />
      <WorkspaceInfoSection />
      <VerifiedDomainsSection />
      <ContactLegalSection />
      <DangerZoneSection />
    </div>
  );
}
