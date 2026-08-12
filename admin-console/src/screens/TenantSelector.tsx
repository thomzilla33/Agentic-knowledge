import { useState, useRef, useEffect } from 'react';
import type { Product } from '../types';
import { useApp } from '../context/AppContext';

// ─── Types ──────────────────────────────────────────────────────────────────

type RoleLevel = 'platform-admin' | 'org-admin' | 'member' | 'viewer';

interface StudioMeta {
  label: string;
  short: string;
  hint: string;
  icon: React.ReactNode;
}

interface TenantAccess {
  id: string;
  name: string;
  industry: string;
  role: RoleLevel;
  studios: Product[];
  lastVisited: string;
  recent: boolean;
  initials: string;
  avatarToken: string; // --primary | --ac-teal
}

// ─── Studio registry ─────────────────────────────────────────────────────────

const STUDIO_META: Record<Product, StudioMeta> = {
  'agentic-studio': {
    label: 'Agentic Studio',
    short: 'Agentic',
    hint: 'Agent networks & workflows',
    icon: (
      <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.3"/>
        <path d="M3.5 13c0-2.5 2-4 4.5-4s4.5 1.5 4.5 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      </svg>
    ),
  },
  'helix-data-studio': {
    label: 'Data Studio',
    short: 'Data',
    hint: 'Models, schemas & pipelines',
    icon: (
      <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
        <rect x="2" y="3" width="12" height="10" rx="1.2" stroke="currentColor" strokeWidth="1.3"/>
        <path d="M2 6.5h12M5.5 3v10" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
      </svg>
    ),
  },
  'helix-governance-studio': {
    label: 'Governance Studio',
    short: 'Governance',
    hint: 'Policies & compliance',
    icon: (
      <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
        <path d="M8 2L3 4.5v4C3 11.5 5.2 13.8 8 14c2.8-.2 5-2.5 5-5.5v-4L8 2z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
        <path d="M5.5 8l1.8 1.8 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  'work-surfaces': {
    label: 'Work Surfaces',
    short: 'Work Surfaces',
    hint: 'Workspace & operations',
    icon: (
      <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
        <rect x="2" y="2" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3"/>
        <rect x="9" y="2" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3"/>
        <rect x="2" y="9" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3"/>
        <rect x="9" y="9" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3"/>
      </svg>
    ),
  },
  'htl': {
    label: 'HTL',
    short: 'HTL',
    hint: 'Human-in-the-Loop operations',
    icon: (
      <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.3"/>
        <path d="M8 5v3l2 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      </svg>
    ),
  },
};

// ─── Role badge styles ────────────────────────────────────────────────────────

// All role styles use DS tokens only via color-mix() for tinted surfaces.
// --primary (blue) for platform/admin roles, --ac-teal for org/member roles.
const ROLE_STYLES: Record<RoleLevel, {
  label: string;
  style: React.CSSProperties;
}> = {
  'platform-admin': {
    label: 'Platform Admin',
    style: {
      background: 'color-mix(in srgb, var(--primary) 12%, transparent)',
      borderColor: 'color-mix(in srgb, var(--primary) 22%, transparent)',
      color: 'var(--primary)',
    },
  },
  'org-admin': {
    label: 'Org Admin',
    style: {
      background: 'color-mix(in srgb, var(--ac-teal) 12%, transparent)',
      borderColor: 'color-mix(in srgb, var(--ac-teal) 22%, transparent)',
      color: 'var(--ac-teal)',
    },
  },
  'member': {
    label: 'Member',
    style: {
      background: 'var(--color-surface-success-subtle)',
      borderColor: 'color-mix(in srgb, var(--ac-teal) 22%, transparent)',
      color: 'var(--ac-teal)',
    },
  },
  'viewer': {
    label: 'Viewer',
    style: {
      background: 'var(--field-bg)',
      borderColor: 'var(--field-border)',
      color: 'var(--color-text-subtitle)',
    },
  },
};

// ─── Tenant fixtures ──────────────────────────────────────────────────────────

const TENANTS: TenantAccess[] = [
  {
    id: 'avance',
    name: 'Avance Financial',
    industry: 'FinTech',
    role: 'platform-admin',
    studios: ['agentic-studio', 'helix-data-studio', 'helix-governance-studio', 'work-surfaces'],
    lastVisited: '2h ago',
    recent: true,
    initials: 'AF',
    avatarToken: '--primary',
  },
  {
    id: 'demo',
    name: 'Demo Sandbox',
    industry: 'Sandbox',
    role: 'platform-admin',
    studios: ['agentic-studio', 'helix-data-studio', 'helix-governance-studio', 'work-surfaces'],
    lastVisited: 'Earlier today',
    recent: true,
    initials: 'DS',
    avatarToken: '--ac-teal',
  },
  {
    id: 'meridian',
    name: 'Meridian Health',
    industry: 'Healthcare',
    role: 'member',
    studios: ['helix-data-studio', 'agentic-studio'],
    lastVisited: '3 days ago',
    recent: false,
    initials: 'MH',
    avatarToken: '--ac-teal',
  },
  {
    id: 'solis',
    name: 'Solis Retail Group',
    industry: 'Retail',
    role: 'org-admin',
    studios: ['work-surfaces', 'helix-data-studio', 'agentic-studio'],
    lastVisited: '1 week ago',
    recent: false,
    initials: 'SR',
    avatarToken: '--primary',
  },
  {
    id: 'northbridge',
    name: 'NorthBridge Capital',
    industry: 'Wealth Mgmt',
    role: 'viewer',
    studios: ['helix-data-studio'],
    lastVisited: '2 weeks ago',
    recent: false,
    initials: 'NC',
    avatarToken: '--primary',
  },
];

// ─── TenantSelectorScreen ─────────────────────────────────────────────────────

export function TenantSelectorScreen() {
  const { principal } = useApp();
  const [query, setQuery] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);
  const [dropAnchor, setDropAnchor] = useState<{ top: number; right: number } | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [selectedDests, setSelectedDests] = useState<Record<string, Product | 'home'>>({});
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const firstName = principal?.name.split(' ')[0] ?? 'there';

  const filtered = TENANTS.filter(t => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      t.name.toLowerCase().includes(q) ||
      t.industry.toLowerCase().includes(q) ||
      ROLE_STYLES[t.role].label.toLowerCase().includes(q)
    );
  });

  useEffect(() => {
    function close() { setOpenId(null); setDropAnchor(null); }
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') { setOpenId(null); setDropAnchor(null); }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  function showToast(msg: string) {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }

  function handleSelectDest(tenantId: string, dest: Product | 'home') {
    setSelectedDests(prev => ({ ...prev, [tenantId]: dest }));
    setOpenId(null);
    setDropAnchor(null);
  }

  function handleEnter(tenantId: string, destination: Product | 'home') {
    setOpenId(null);
    setDropAnchor(null);
    const tenant = TENANTS.find(t => t.id === tenantId)!;
    const msg =
      destination === 'home'
        ? `Entering ${tenant.name}`
        : `Opening ${STUDIO_META[destination].label} in ${tenant.name}`;
    showToast(msg);
  }

  function toggleDropdown(tenantId: string, e: React.MouseEvent) {
    e.stopPropagation();
    const btn = (e.target as HTMLElement).closest('button');
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    if (openId === tenantId) {
      setOpenId(null);
      setDropAnchor(null);
    } else {
      setOpenId(tenantId);
      setDropAnchor({ top: rect.bottom + 6, right: window.innerWidth - rect.right });
    }
  }

  const n = filtered.length;
  const isSearching = query.trim() !== '';
  const heroTenant = !isSearching ? (TENANTS.find(t => t.recent) ?? TENANTS[0]) : null;
  const listTenants = !isSearching
    ? filtered.filter(t => t.id !== heroTenant?.id)
    : filtered;

  return (
    <div className="min-h-screen bg-[var(--canvas)]">

      {/* ── Topbar ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 h-14 flex items-center justify-between px-7 bg-[var(--field-bg)] backdrop-blur-sm border-b border-[var(--border)] shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-[7px] bg-[var(--primary)] flex items-center justify-center flex-shrink-0">
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="7" r="2" fill="white"/>
              <circle cx="2.5" cy="2.5" r="1.2" fill="white" opacity=".55"/>
              <circle cx="11.5" cy="2.5" r="1.2" fill="white" opacity=".55"/>
              <circle cx="2.5" cy="11.5" r="1.2" fill="white" opacity=".55"/>
              <circle cx="11.5" cy="11.5" r="1.2" fill="white" opacity=".55"/>
            </svg>
          </div>
          <span className="text-xs font-bold tracking-[0.15em] uppercase text-[var(--color-text-title)]">
            AIMS-OS
          </span>
        </div>

        <div className="flex items-center gap-4">
          <button className="text-xs text-[var(--color-text-subtitle)] hover:text-[var(--color-text-title)] transition-colors focus-ring">
            Help
          </button>
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-[var(--field-bg)] border border-[var(--field-border)] cursor-default hover:border-[var(--field-border-hover)] transition-colors">
            <div className="w-6 h-6 rounded-full bg-[var(--primary)] flex items-center justify-center text-[9px] font-bold text-white">
              {principal?.name.charAt(0) ?? 'T'}
            </div>
            <span className="text-xs text-[var(--color-text-subtitle)]">
              {principal?.email ?? 'thomas.gonzalez@aimsos.ai'}
            </span>
          </div>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-7 pt-14 pb-8">
        <div className="flex items-center gap-2 mb-2.5">
          <div className="h-px w-4 bg-[var(--primary)] opacity-60" />
          <span className="text-[10.5px] font-bold tracking-[0.13em] uppercase text-[var(--primary)]">
            Workspace Selection
          </span>
        </div>
        <h1 className="text-[26px] font-semibold text-[var(--color-text-title)] tracking-tight mb-1.5">
          Welcome back,{' '}
          <span style={{
            color: 'var(--primary)',
            textDecoration: 'underline',
            textDecorationColor: 'color-mix(in srgb, var(--primary) 35%, transparent)',
            textDecorationThickness: '2px',
            textUnderlineOffset: '5px',
          }}>
            {firstName}
          </span>
        </h1>
        <p className="text-sm text-[var(--color-text-subtitle)] mb-7">
          You have access to{' '}
          <strong className="font-semibold text-[var(--color-text-title)]">{TENANTS.length}</strong>{' '}
          organizations. Select a workspace to continue.
        </p>

        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--field-icon)] pointer-events-none"
              width="13" height="13" viewBox="0 0 16 16" fill="none"
            >
              <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.4"/>
              <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search organizations…"
              className="w-full pl-8 pr-3 py-2 text-sm bg-[var(--field-bg)] border border-[var(--field-border)] rounded-lg text-[var(--field-text)] placeholder:text-[var(--field-placeholder)] outline-none focus:border-[var(--field-border-focus)] transition-colors"
            />
          </div>
          <span className="text-xs text-[var(--color-caption)] flex-shrink-0">
            {n} workspace{n !== 1 ? 's' : ''}
          </span>
        </div>
      </section>

      {/* ── List ───────────────────────────────────────────────── */}
      <main className="max-w-5xl mx-auto px-7 pb-24">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-10 h-10 rounded-xl bg-[var(--field-bg)] border border-[var(--field-border)] flex items-center justify-center mb-3 text-[var(--color-caption)]">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.3"/>
                <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
            </div>
            <p className="text-sm font-semibold text-[var(--color-text-subtitle)] mb-1">No workspaces found</p>
            <p className="text-xs text-[var(--color-caption)]">Try a different search term</p>
          </div>
        ) : (
          <>
            {/* ── Hero: pick up where you left off ── */}
            {heroTenant && (
              <div className="mb-5">
                <p className="text-xs text-[var(--color-text-subtitle)] mb-2.5 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] animate-pulse flex-shrink-0" />
                  Pick up where you left off
                </p>
                <TenantCard
                  tenant={heroTenant}
                  featured
                  selectedDest={selectedDests[heroTenant.id] ?? null}
                  isDropdownOpen={openId === heroTenant.id}
                  onEnter={handleEnter}
                  onToggleDropdown={toggleDropdown}
                />
              </div>
            )}

            {/* ── Other workspaces ── */}
            {listTenants.length > 0 && (
              <>
                {heroTenant && (
                  <p className="text-[10.5px] font-semibold tracking-[0.1em] uppercase text-[var(--color-caption)] mb-2">
                    Other workspaces
                  </p>
                )}
                <div className="flex flex-col gap-1.5">
                  {listTenants.map(tenant => (
                    <TenantCard
                      key={tenant.id}
                      tenant={tenant}
                      selectedDest={selectedDests[tenant.id] ?? null}
                      isDropdownOpen={openId === tenant.id}
                      onEnter={handleEnter}
                      onToggleDropdown={toggleDropdown}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </main>

      {/* ── Studio picker dropdown (portal-positioned) ─────────── */}
      {openId !== null && dropAnchor !== null && (() => {
        const tenant = TENANTS.find(t => t.id === openId);
        if (!tenant) return null;
        return (
          <div
            className="fixed z-[10001] bg-[var(--surface-raised)] border border-[var(--border)] rounded-xl shadow-2xl min-w-[215px] py-1.5"
            style={{ top: dropAnchor.top, right: dropAnchor.right }}
            onClick={e => e.stopPropagation()}
          >
            <div className="px-3 pt-1 pb-1.5 text-[10px] font-semibold tracking-[0.08em] uppercase text-[var(--color-caption)]">
              Go directly to
            </div>

            <button
              onClick={() => handleSelectDest(openId, 'home')}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 text-left hover:bg-[var(--field-bg)] transition-colors rounded-lg focus-ring"
            >
              <div className="w-7 h-7 rounded-lg bg-[var(--field-bg)] flex items-center justify-center flex-shrink-0 text-[var(--color-text-subtitle)]">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path d="M2 7l6-5 6 5v7a1 1 0 01-1 1H3a1 1 0 01-1-1V7z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
                  <path d="M6 14V9h4v5" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
                </svg>
              </div>
              <div>
                <div className="text-xs font-medium text-[var(--color-text-title)]">Home</div>
                <div className="text-[10px] text-[var(--color-caption)]">Your work inbox</div>
              </div>
            </button>

            <div className="h-px bg-[var(--border)] mx-2.5 my-1" />

            {tenant.studios.map(studio => {
              const meta = STUDIO_META[studio];
              return (
                <button
                  key={studio}
                  onClick={() => handleSelectDest(openId, studio)}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 text-left hover:bg-[var(--field-bg)] transition-colors rounded-lg focus-ring"
                >
                  <div className="w-7 h-7 rounded-lg bg-[var(--field-bg)] flex items-center justify-center flex-shrink-0 text-[var(--color-text-subtitle)]">
                    {meta.icon}
                  </div>
                  <div>
                    <div className="text-xs font-medium text-[var(--color-text-title)]">{meta.label}</div>
                    <div className="text-[10px] text-[var(--color-caption)]">{meta.hint}</div>
                  </div>
                </button>
              );
            })}
          </div>
        );
      })()}

      {/* ── Toast ──────────────────────────────────────────────── */}
      <div
        className={[
          'fixed bottom-7 left-1/2 -translate-x-1/2',
          'flex items-center gap-2.5 px-4 py-2.5 rounded-xl',
          'bg-[var(--surface-raised)] border border-[var(--border)] shadow-xl',
          'text-sm font-medium text-[var(--color-text-title)]',
          'whitespace-nowrap pointer-events-none z-[9999]',
          'transition-all duration-300',
          toast ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3',
        ].join(' ')}
      >
        <span className="w-2 h-2 rounded-full bg-[var(--primary)] animate-pulse flex-shrink-0" />
        <span>{toast ?? ''}</span>
        <svg className="text-[var(--color-caption)]" width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M2.5 6h7M7 3.5L9.5 6 7 8.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>

    </div>
  );
}

// ─── TenantCard ───────────────────────────────────────────────────────────────

interface TenantCardProps {
  tenant: TenantAccess;
  featured?: boolean;
  selectedDest?: Product | 'home' | null;
  isDropdownOpen: boolean;
  onEnter: (tenantId: string, destination: Product | 'home') => void;
  onToggleDropdown: (tenantId: string, e: React.MouseEvent) => void;
}

function TenantCard({ tenant, featured = false, selectedDest = null, isDropdownOpen, onEnter, onToggleDropdown }: TenantCardProps) {
  const role = ROLE_STYLES[tenant.role];

  return (
    <div
      className={[
        'flex items-center gap-4 bg-[var(--surface)] border rounded-xl transition-all duration-200',
        featured
          ? 'px-6 py-5 border-[var(--primary)]/30 hover:border-[var(--primary)]/55 hover:shadow-md shadow-sm'
          : 'px-5 py-3 border-[var(--border)] hover:border-[var(--primary)]/40 hover:shadow-sm',
      ].join(' ')}
      style={featured
        ? { background: 'color-mix(in srgb, var(--primary) 3%, var(--surface))' }
        : undefined}
    >

      {/* Avatar */}
      <div
        className={[
          'rounded-xl flex items-center justify-center font-bold flex-shrink-0 tracking-wider text-white',
          featured ? 'w-12 h-12 text-[13px]' : 'w-9 h-9 text-[11px]',
        ].join(' ')}
        style={{ background: `var(${tenant.avatarToken})` }}
      >
        {tenant.initials}
      </div>

      {/* Identity */}
      <div className={featured ? 'flex-[0_0_220px] min-w-0' : 'flex-[0_0_190px] min-w-0'}>
        <div className={[
          'font-semibold text-[var(--color-text-title)] tracking-tight truncate mb-1.5',
          featured ? 'text-[15px]' : 'text-[13px]',
        ].join(' ')}>
          {tenant.name}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-[var(--field-bg)] text-[var(--color-text-subtitle)] border border-[var(--field-border)]">
            {tenant.industry}
          </span>
          <span
            className="inline-flex items-center text-[10px] font-semibold px-1.5 py-0.5 rounded-full border"
            style={role.style}
          >
            {role.label}
          </span>
        </div>
      </div>

      {/* Divider */}
      <div className="self-stretch w-px bg-[var(--border)] flex-shrink-0" />

      {/* Studio chips */}
      <div className="flex-1 flex flex-wrap gap-x-4 gap-y-1.5 items-center">
        {tenant.studios.map(studio => {
          const meta = STUDIO_META[studio];
          return (
            <span
              key={studio}
              className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[var(--color-text-subtitle)]"
            >
              <span className="text-[var(--color-caption)]">{meta.icon}</span>
              {meta.label}
            </span>
          );
        })}
      </div>

      {/* Actions */}
      {(() => {
        const destMeta = selectedDest && selectedDest !== 'home'
          ? STUDIO_META[selectedDest as Product]
          : null;
        const btnLabel = destMeta ? `Go to ${destMeta.short}` : 'Enter workspace';
        const base = [
          'inline-flex items-center justify-center font-medium transition-all duration-200',
          'border border-transparent text-white',
          'bg-[var(--btn-primary-bg)] hover:bg-[var(--btn-primary-hover-bg)]',
          'active:bg-[var(--btn-primary-active-bg)] disabled:opacity-50',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--btn-primary-ring)]',
        ].join(' ');
        const szMain = featured ? 'px-4 py-2 text-sm gap-2' : 'px-3 py-1.5 text-xs gap-1.5';
        const szChev = featured ? 'px-2.5 py-2' : 'px-2 py-1.5';
        const rLeft  = featured ? 'rounded-l-lg' : 'rounded-l-md';
        const rRight = featured ? 'rounded-r-lg' : 'rounded-r-md';
        return (
          <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
            <span className="text-[10.5px] text-[var(--color-caption)] whitespace-nowrap">
              Last visited {tenant.lastVisited}
            </span>
            <div className="flex items-center">
              <button
                className={`${base} ${szMain} ${rLeft}`}
                onClick={e => {
                  e.stopPropagation();
                  if (selectedDest) {
                    onEnter(tenant.id, selectedDest);
                  } else {
                    onToggleDropdown(tenant.id, e);
                  }
                }}
              >
                {btnLabel}
              </button>
              <div className="w-px self-stretch bg-white/20 flex-shrink-0" />
              <button
                className={`${base} ${szChev} ${rRight}`}
                onClick={e => onToggleDropdown(tenant.id, e)}
                aria-expanded={isDropdownOpen}
                aria-label="Choose destination"
              >
                <svg
                  width="10" height="10" viewBox="0 0 10 10" fill="none"
                  className={`transition-transform duration-150 ${isDropdownOpen ? 'rotate-180' : ''}`}
                >
                  <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
        );
      })()}

    </div>
  );
}
