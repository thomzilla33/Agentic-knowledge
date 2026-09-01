import { useState } from 'react';

const card = 'bg-white border border-[var(--border)] rounded-xl p-5 mb-1';
const label = 'block text-xs font-medium text-[var(--field-text)] mb-1';
const input = 'w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--ac-surface2)] text-[var(--field-text)] focus:outline-none focus:border-[var(--primary)] focus:bg-white transition-colors';
const sectionTitle = 'text-[10px] font-semibold uppercase tracking-widest text-[var(--field-supporting)] mb-3';
const divider = 'border-t border-[var(--border)] my-4';

function toast(msg: string) { alert(msg); }

// ── Data ────────────────────────────────────────────────────────────────

const PLAN = {
  name: 'Enterprise', color: '#6366f1',
  seats: { used: 38, total: 50 },
  storage: { used: 47, total: 100 },
  api: { used: 820, total: 1000 },
  nextBilling: 'Oct 1, 2026', amount: '$4,850 / month',
};

const BAR_COLOR = (pct: number) => pct > 80 ? '#f97316' : '#6366f1';

function UsageBar({ label: l, used, total, unit = '' }: { label: string; used: number; total: number; unit?: string }) {
  const pct = Math.round((used / total) * 100);
  return (
    <div className="mb-4 last:mb-0">
      <div className="flex justify-between text-xs mb-1.5">
        <span className="font-medium text-[var(--field-text)]">{l}</span>
        <span className="text-[var(--field-supporting)]">{used}{unit} of {total}{unit}</span>
      </div>
      <div className="h-2 rounded-full bg-[var(--ac-surface2)] overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: BAR_COLOR(pct) }} />
      </div>
      {pct > 80 && (
        <div className="mt-1 text-[10px] font-medium text-orange-500">
          ⚠ {pct}% used — consider upgrading to avoid overages
        </div>
      )}
    </div>
  );
}

// ── Plan card ─────────────────────────────────────────────────────────────

function PlanCard() {
  const [showChangePlan, setShowChangePlan] = useState(false);

  return (
    <div className="mb-6">
      <div className={sectionTitle}>Current plan</div>
      <div className={card}>
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-white text-xs font-bold" style={{ background: PLAN.color }}>E</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-sm font-semibold text-[var(--field-text)]">{PLAN.name}</span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: 'rgba(99,102,241,.1)', color: PLAN.color }}>Active</span>
            </div>
            <div className="text-xs text-[var(--field-supporting)]">Up to {PLAN.seats.total} seats · {PLAN.storage.total} GB storage · 1,000 k API calls/mo</div>
            <div className="mt-2 flex items-center gap-3 text-xs">
              <span className="font-semibold text-[var(--field-text)]">{PLAN.amount}</span>
              <span className="text-[var(--field-supporting)]">Next billing: {PLAN.nextBilling}</span>
            </div>
          </div>
          <button onClick={() => setShowChangePlan(v => !v)} className="shrink-0 text-xs px-3 py-1.5 border border-[var(--border)] rounded-lg text-[var(--field-text)] hover:bg-[var(--ac-surface2)] transition-colors">
            Change plan
          </button>
        </div>

        {showChangePlan && (
          <>
            <div className={divider} />
            <div className="text-xs font-semibold text-[var(--field-text)] mb-3">Available plans</div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { name: 'Starter', seats: '5', price: '$150/mo', color: '#34d399', current: false },
                { name: 'Business', seats: '25', price: '$1,200/mo', color: '#818cf8', current: false },
                { name: 'Enterprise', seats: '50+', price: 'Custom', color: '#6366f1', current: true },
              ].map(p => (
                <div key={p.name} className={`rounded-lg border-2 p-3 ${p.current ? 'border-[var(--primary)] bg-[var(--ac-surface2)]' : 'border-[var(--border)] hover:border-[var(--field-supporting)] cursor-pointer'} transition-colors`}
                  onClick={() => !p.current && toast(`Contact sales to switch to the ${p.name} plan.`)}
                >
                  <div className="text-xs font-semibold mb-0.5" style={{ color: p.color }}>{p.name}</div>
                  <div className="text-[10px] text-[var(--field-supporting)]">{p.seats} seats</div>
                  <div className="text-xs font-semibold text-[var(--field-text)] mt-1">{p.price}</div>
                  {p.current && <div className="text-[10px] font-semibold mt-1" style={{ color: p.color }}>Current plan</div>}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Usage ─────────────────────────────────────────────────────────────────

function UsageSection() {
  return (
    <div className="mb-6">
      <div className={sectionTitle}>Usage</div>
      <div className={card}>
        <UsageBar label="Seats" used={PLAN.seats.used} total={PLAN.seats.total} />
        <UsageBar label="Storage" used={PLAN.storage.used} total={PLAN.storage.total} unit=" GB" />
        <UsageBar label="API calls" used={PLAN.api.used} total={PLAN.api.total} unit="k" />
      </div>
    </div>
  );
}

// ── Payment method ────────────────────────────────────────────────────────

function PaymentSection() {
  return (
    <div className="mb-6">
      <div className={sectionTitle}>Payment method</div>
      <div className={card}>
        <div className="flex items-center gap-3">
          <div className="w-12 h-8 rounded-md flex items-center justify-center bg-[var(--ac-surface2)] border border-[var(--border)] text-xs font-bold text-[var(--field-supporting)] shrink-0">VISA</div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-[var(--field-text)]">•••• •••• •••• 4242</div>
            <div className="text-xs text-[var(--field-supporting)]">Expires 09/28 · Thomas González</div>
          </div>
          <button onClick={() => toast('Payment card update coming in V1.2')} className="shrink-0 text-xs px-3 py-1.5 border border-[var(--border)] rounded-lg text-[var(--field-text)] hover:bg-[var(--ac-surface2)] transition-colors">
            Update card
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Billing contact ───────────────────────────────────────────────────────

function BillingContactSection() {
  const [form, setForm] = useState({ name: 'Thomas González', email: 'billing@contoso.com' });
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <div className="mb-6">
      <div className={sectionTitle}>Billing contact</div>
      <div className={card}>
        <div className="grid grid-cols-2 gap-4">
          <div><label className={label}>Name</label><input className={input} value={form.name} onChange={set('name')} /></div>
          <div><label className={label}>Email</label><input className={input} type="email" value={form.email} onChange={set('email')} /></div>
        </div>
        <div className="flex justify-end mt-4 pt-4 border-t border-[var(--border)]">
          <button onClick={() => toast('Billing contact saved')} className="px-4 py-2 text-xs font-semibold rounded-lg bg-[var(--primary)] text-white hover:opacity-90 transition-opacity">
            Save changes
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Invoices ──────────────────────────────────────────────────────────────

const INVOICES = [
  { id: 'INV-2026-009', date: 'Sep 1, 2026', amount: '$4,850', status: 'Paid' },
  { id: 'INV-2026-008', date: 'Aug 1, 2026', amount: '$4,850', status: 'Paid' },
  { id: 'INV-2026-007', date: 'Jul 1, 2026', amount: '$4,850', status: 'Paid' },
];

function InvoicesSection() {
  return (
    <div className="mb-6">
      <div className={sectionTitle}>Recent invoices</div>
      <div className={card} style={{ padding: 0, overflow: 'hidden' }}>
        <table className="w-full text-xs">
          <thead className="border-b border-[var(--border)]">
            <tr>
              <th className="text-left px-5 py-3 font-semibold text-[var(--field-text)]">Invoice</th>
              <th className="text-left px-5 py-3 font-semibold text-[var(--field-text)]">Date</th>
              <th className="text-left px-5 py-3 font-semibold text-[var(--field-text)]">Amount</th>
              <th className="text-left px-5 py-3 font-semibold text-[var(--field-text)]">Status</th>
              <th className="w-16" />
            </tr>
          </thead>
          <tbody>
            {INVOICES.map(inv => (
              <tr key={inv.id} className="border-b border-[var(--border)] last:border-0">
                <td className="px-5 py-3 font-medium text-[var(--field-text)]">{inv.id}</td>
                <td className="px-5 py-3 text-[var(--field-supporting)]">{inv.date}</td>
                <td className="px-5 py-3 font-medium text-[var(--field-text)]">{inv.amount}</td>
                <td className="px-5 py-3">
                  <span className="font-semibold px-2 py-0.5 rounded-full text-emerald-600 bg-emerald-50 border border-emerald-200 text-[10px]">✓ {inv.status}</span>
                </td>
                <td className="px-5 py-3 text-right">
                  <button onClick={() => toast(`Downloading ${inv.id}…`)} className="text-[var(--primary)] hover:underline font-medium">Download</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────

export function BillingSection() {
  return (
    <div className="max-w-2xl">
      <div className="mb-5">
        <h1 className="text-lg font-semibold text-[var(--field-text)]">Billing & Subscription</h1>
        <p className="text-xs text-[var(--field-supporting)] mt-0.5">Manage your plan, usage, payment method, and invoices.</p>
      </div>
      <PlanCard />
      <UsageSection />
      <PaymentSection />
      <BillingContactSection />
      <InvoicesSection />
    </div>
  );
}
