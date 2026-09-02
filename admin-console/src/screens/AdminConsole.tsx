import { useState, useEffect, useCallback } from 'react';
import type { SectionId, Scope, OriginStudio } from '../types';
import { useApp } from '../context/AppContext';
import { store } from '../mockApi/store';
import { visibleSections, type SectionAccess } from '../core/gate';
import { resolveLanding } from '../core/landing';
import { descendants, descendantsWithSelf } from '../core/scopeTree';
import { consoleHref, studioHref } from '../router';
import { SECTION_MAP } from '../fixtures/sections';
import { ALL_FIXTURES, PRINCIPALS } from '../fixtures';
import { SettingsPanel } from '../components/sections/SettingsPanel';
import { AuditPanel } from '../components/sections/AuditPanel';
import { PeopleAccessScreen } from './PeopleAccess';
import { Spinner } from '../components/primitives/Spinner';
import { InlineMessage } from '../components/primitives/InlineMessage';

const STUDIO_LABELS: Record<OriginStudio, string> = {
  'agentic-studio':          'Agentic Studio',
  'helix-governance-studio': 'Helix Governance Studio',
  'helix-data-studio':       'Helix Data Studio',
  'work-surfaces':           'Work Surfaces',
  'htl':                     'HTL',
};

interface AdminConsoleProps {
  sectionId: SectionId;
  scopeId: string;
  origin: OriginStudio;
}

export function AdminConsole({ sectionId, scopeId, origin }: AdminConsoleProps) {
  const { principal, setPrincipalId, fixtureId, setFixtureId, dataRevision, bumpRevision } = useApp();
  const [scope, setScope] = useState<Scope | null>(null);
  const [activeSectionId, setActiveSectionId] = useState<SectionId>(sectionId);
  const [activeScopeId, setActiveScopeId] = useState(scopeId);
  const [redirectNote, setRedirectNote] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Load scope
  useEffect(() => {
    const fixture = store.getFixture();
    const found = fixture.scopes.find(s => s.id === activeScopeId);
    setScope(found ?? null);
  }, [activeScopeId, dataRevision, fixtureId]);

  // Resolve landing when principal or fixture changes
  useEffect(() => {
    if (!principal || !scope) return;
    const fixture = store.getFixture();
    const visible = visibleSections(principal, scope, fixture);
    const landing = resolveLanding(origin, principal, scope, fixture);
    if (!visible.find(s => s.sectionId === activeSectionId)) {
      setActiveSectionId(landing.sectionId);
      setRedirectNote(landing.redirected ? (landing.redirectReason ?? null) : null);
    }
  }, [principal?.id, scope?.id, fixtureId]);

  // Update URL when section/scope changes
  useEffect(() => {
    const newHash = consoleHref(activeSectionId, activeScopeId).replace('#', '');
    if (window.location.hash !== '#' + newHash) {
      window.history.pushState(null, '', '#' + newHash);
    }
  }, [activeSectionId, activeScopeId]);

  if (!principal || !scope) {
    return <div className="flex-1 flex items-center justify-center"><Spinner size={24} /></div>;
  }

  const fixture = store.getFixture();
  const sectionAccess = visibleSections(principal, scope, fixture);
  const sectionIds = sectionAccess.map(s => s.sectionId);

  function navigate(sec: SectionId) {
    setActiveSectionId(sec);
    setRedirectNote(null);
  }

  function navigateScope(newScopeId: string) {
    setActiveScopeId(newScopeId);
    const newScope = fixture.scopes.find(s => s.id === newScopeId);
    if (!newScope) return;
    const visible = visibleSections(principal!, newScope, fixture);
    if (!visible.find(s => s.sectionId === activeSectionId)) {
      const landing = resolveLanding(origin, principal!, newScope, fixture);
      setActiveSectionId(landing.sectionId);
      setRedirectNote(landing.redirected ? (landing.redirectReason ?? null) : null);
    }
  }

  const accessibleScopes = fixture.scopes.filter(s => {
    const accessible = descendantsWithSelf(principal.homeScopeId, fixture.closure);
    return accessible.includes(s.id);
  });
  const isMultiScope = accessibleScopes.length > 1;

  const currentAccess = sectionAccess.find(s => s.sectionId === activeSectionId);
  const canWriteSection = currentAccess?.access === 'write';

  return (
    <div className="flex flex-col h-full">
      {/* Topbar */}
      <Topbar
        origin={origin}
        scope={scope}
        principal={principal}
        isMultiScope={isMultiScope}
        accessibleScopes={accessibleScopes}
        activeScopeId={activeScopeId}
        onScopeChange={navigateScope}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        sectionAccess={sectionAccess}
        onSearchNavigate={(sec, sid) => { navigate(sec); setActiveScopeId(sid ?? activeScopeId); }}
      />

      <div className="flex flex-1 min-h-0">
        {/* Left nav */}
        <LeftNav
          sectionAccess={sectionAccess}
          activeSectionId={activeSectionId}
          onNavigate={navigate}
        />

        {/* Main content */}
        <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Scope context strip */}
          <ScopeStrip scope={scope} fixture={fixture} principal={principal} activeScopeId={activeScopeId} />

          <div className="flex-1 overflow-y-auto p-6">
            {redirectNote && (
              <div className="mb-4">
                <InlineMessage kind="info">{redirectNote}</InlineMessage>
              </div>
            )}

            {sectionIds.length === 0 ? (
              <EmptyConsole />
            ) : activeSectionId === 'audit-compliance' ? (
              <AuditPanel />
            ) : activeSectionId === 'people-access' ? (
              <PeopleAccessScreen />
            ) : (
              <SettingsPanel
                key={`${activeSectionId}-${activeScopeId}-${dataRevision}`}
                sectionId={activeSectionId}
                scope={scope}
                principal={principal}
                canWrite={canWriteSection}
                onWrite={bumpRevision}
              />
            )}
          </div>
        </main>
      </div>

      {/* Dev toolbar */}
      <DevToolbar
        principalId={principal.id}
        onPrincipalChange={setPrincipalId}
        fixtureId={fixtureId}
        onFixtureChange={setFixtureId}
        origin={origin}
      />
    </div>
  );
}

// ── Topbar ─────────────────────────────────────────────────────────────────

function Topbar({
  origin, scope, principal, isMultiScope, accessibleScopes,
  activeScopeId, onScopeChange, searchQuery, onSearchChange,
  sectionAccess, onSearchNavigate,
}: {
  origin: OriginStudio;
  scope: Scope;
  principal: any;
  isMultiScope: boolean;
  accessibleScopes: Scope[];
  activeScopeId: string;
  onScopeChange: (id: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  sectionAccess: SectionAccess[];
  onSearchNavigate: (sec: SectionId, scopeId?: string) => void;
}) {
  const fixture = store.getFixture();
  const isMultiScopeFixture = fixture.scopes.length > 1;

  return (
    <header className="h-11 bg-white border-b border-[var(--border)] flex items-center px-5 gap-4 shrink-0 z-20">
      {/* Product mark */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="w-6 h-6 rounded-md bg-gradient-to-br from-[var(--primary)] to-[#09E2AB] flex items-center justify-center">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <rect x="1" y="1" width="4" height="4" rx="1" fill="white" fillOpacity=".9"/>
            <rect x="7" y="1" width="4" height="4" rx="1" fill="white" fillOpacity=".6"/>
            <rect x="1" y="7" width="4" height="4" rx="1" fill="white" fillOpacity=".6"/>
            <rect x="7" y="7" width="4" height="4" rx="1" fill="white" fillOpacity=".9"/>
          </svg>
        </div>
        <span className="text-[12px] font-semibold text-[var(--field-text)]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
          AIMS OS Admin Console
        </span>
      </div>

      {/* Scope switcher — absent for single scope fixture */}
      {isMultiScopeFixture && isMultiScope && (
        <select
          value={activeScopeId}
          onChange={e => onScopeChange(e.target.value)}
          className="text-xs border border-[var(--border)] rounded-md px-2 py-1 text-[var(--field-text)] bg-white focus-ring ml-2"
          aria-label="Switch scope"
        >
          {accessibleScopes.map(s => (
            <option key={s.id} value={s.id}>
              {s.name}{s.status === 'suspended' ? ' (suspended)' : ''}
            </option>
          ))}
        </select>
      )}

      {/* Settings search */}
      <div className="relative flex-1 max-w-xs">
        <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--field-supporting)]" width="12" height="12" viewBox="0 0 16 16" fill="none">
          <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M10.5 10.5L13 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        <input
          type="search"
          placeholder="Search settings"
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
          className="w-full pl-7 pr-3 py-1.5 text-xs border border-[var(--border)] rounded-lg bg-[var(--ac-surface2)] focus:outline-none focus:border-[var(--primary)] focus:bg-white transition-colors focus-ring"
        />
      </div>

      <div className="ml-auto flex items-center gap-3">
        {/* Back to origin */}
        <a
          href={studioHref(origin)}
          className="text-xs text-[var(--primary)] hover:underline focus-ring rounded"
          aria-label={`Back to ${STUDIO_LABELS[origin]}`}
        >
          ← Back to {STUDIO_LABELS[origin]}
        </a>
        {/* Avatar */}
        <div className="w-7 h-7 rounded-full bg-[var(--primary)] text-white flex items-center justify-center text-xs font-semibold shrink-0">
          {principal.name.charAt(0)}
        </div>
      </div>
    </header>
  );
}

// ── Left nav ──────────────────────────────────────────────────────────────────

const GROUP_LABELS = { personal: 'Personal', tenant: 'Tenant', platform: 'Platform' };

function LeftNav({
  sectionAccess, activeSectionId, onNavigate,
}: {
  sectionAccess: SectionAccess[];
  activeSectionId: SectionId;
  onNavigate: (id: SectionId) => void;
}) {
  const grouped = ['personal', 'tenant', 'platform'] as const;

  return (
    <nav className="w-52 shrink-0 border-r border-[var(--ac-sidebar-border)] bg-[var(--ac-sidebar)] overflow-y-auto py-4" aria-label="Console navigation">
      {grouped.map(group => {
        const items = sectionAccess.filter(s => SECTION_MAP[s.sectionId]?.group === group);
        if (items.length === 0) return null;
        return (
          <div key={group} className="mb-4">
            <div className="px-4 pb-1 text-[10px] font-semibold text-[var(--ac-sidebar-text-muted)] uppercase tracking-wider">
              {GROUP_LABELS[group]}
            </div>
            {items.map(({ sectionId, access }) => (
              <button
                key={sectionId}
                onClick={() => onNavigate(sectionId)}
                className={`
                  w-full text-left px-4 py-1.5 text-xs flex items-center gap-2 transition-colors focus-ring
                  ${activeSectionId === sectionId
                    ? 'bg-[var(--ac-sidebar-active-bg)] text-[var(--ac-sidebar-active-text)] font-semibold border-r-2 border-[var(--primary)]'
                    : 'text-[var(--ac-sidebar-text)] hover:bg-[var(--ac-sidebar-hover-bg)]'
                  }
                `}
              >
                {SECTION_MAP[sectionId]?.label ?? sectionId}
                {access === 'read' && (
                  <span className="ml-auto text-[9px] text-[var(--ac-sidebar-text-muted)] font-normal">read</span>
                )}
              </button>
            ))}
          </div>
        );
      })}
    </nav>
  );
}

// ── Scope context strip ────────────────────────────────────────────────────────

function ScopeStrip({
  scope, fixture, principal, activeScopeId,
}: {
  scope: Scope;
  fixture: any;
  principal: any;
  activeScopeId: string;
}) {
  const descIds = descendants(activeScopeId, fixture.closure);
  const descScopes = descIds.map((id: string) => fixture.scopes.find((s: Scope) => s.id === id)).filter(Boolean) as Scope[];
  const withOverrides = descScopes.filter(s =>
    fixture.settingValues.some((v: any) => v.scopeId === s.id)
  );
  const isEditing = principal.homeScopeId !== activeScopeId;

  let message = '';
  if (scope.kind === 'operator') {
    message = `Editing ${scope.name}. Inherited by ${descScopes.filter(s => s.kind === 'corporate').length} subscriber${descScopes.filter(s => s.kind === 'corporate').length !== 1 ? 's' : ''}. Subscriber private layers are not visible from this scope.`;
  } else if (descScopes.length === 0) {
    message = `Editing ${scope.name}. Changes apply only to this location.`;
    if (scope.status === 'suspended') message += ' This scope is suspended — configuration is read-only.';
  } else if (withOverrides.length > 0) {
    message = `Editing ${scope.name}. Inherited by ${descScopes.length} location${descScopes.length !== 1 ? 's' : ''}. ${withOverrides.length} have local overrides.`;
  } else {
    message = `Editing ${scope.name}. Inherited by ${descScopes.length} location${descScopes.length !== 1 ? 's' : ''}.`;
  }

  if (isEditing) {
    message = `You are editing ${scope.name} on behalf of another scope. Changes will be attributed to your account.`;
  }

  const bgColor = scope.status === 'suspended'
    ? 'bg-amber-50 border-amber-200 text-amber-900'
    : isEditing
    ? 'bg-blue-50 border-blue-200 text-blue-900'
    : 'bg-[var(--ac-surface2)] border-[var(--border)] text-[var(--field-supporting)]';

  return (
    <div className={`px-6 py-2 border-b text-xs ${bgColor}`} role="status" aria-live="polite">
      {message}
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyConsole() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center gap-3 py-16">
      <div className="w-12 h-12 rounded-xl bg-[var(--ac-surface2)] flex items-center justify-center">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <rect x="3" y="3" width="6" height="6" rx="1.5" fill="var(--color-caption)"/>
          <rect x="11" y="3" width="6" height="6" rx="1.5" fill="var(--field-scrollbar-thumb)"/>
          <rect x="3" y="11" width="6" height="6" rx="1.5" fill="var(--field-scrollbar-thumb)"/>
          <rect x="11" y="11" width="6" height="6" rx="1.5" fill="var(--color-caption)"/>
        </svg>
      </div>
      <div>
        <p className="text-sm font-semibold text-[var(--field-text)]">My Settings</p>
        <p className="text-xs text-[var(--field-supporting)] mt-1 max-w-xs">
          You have access to your personal settings. Administrative sections require additional permissions.
        </p>
      </div>
    </div>
  );
}

// ── Dev toolbar ───────────────────────────────────────────────────────────────

function DevToolbar({
  principalId, onPrincipalChange,
  fixtureId, onFixtureChange,
  origin,
}: {
  principalId: string;
  onPrincipalChange: (id: string) => void;
  fixtureId: string;
  onFixtureChange: (id: any) => void;
  origin: OriginStudio;
}) {
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-[var(--field-text)] text-white rounded-xl px-4 py-2 flex items-center gap-4 text-xs shadow-xl z-50">
      <span className="text-[var(--field-supporting)] font-medium">DEV</span>
      <label className="flex items-center gap-2">
        <span className="text-[var(--color-caption)]">Principal</span>
        <select
          value={principalId}
          onChange={e => onPrincipalChange(e.target.value)}
          className="bg-[var(--field-text)] text-white rounded px-2 py-0.5 text-xs focus-ring"
        >
          {PRINCIPALS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </label>
      <label className="flex items-center gap-2">
        <span className="text-[var(--color-caption)]">Fixture</span>
        <select
          value={fixtureId}
          onChange={e => onFixtureChange(e.target.value)}
          className="bg-[var(--field-text)] text-white rounded px-2 py-0.5 text-xs focus-ring"
        >
          {ALL_FIXTURES.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
        </select>
      </label>
      <a href={studioHref(origin)} className="text-[var(--color-caption)] hover:text-white transition-colors">
        → Studio
      </a>
    </div>
  );
}
