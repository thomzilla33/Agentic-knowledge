import { useApp } from '../context/AppContext';
import { store } from '../mockApi/store';
import { resolveLanding } from '../core/landing';
import { consoleHref, studioHref } from '../router';
import type { OriginStudio } from '../types';
import { ALL_FIXTURES } from '../fixtures';
import { PRINCIPALS } from '../fixtures/principals';

const STUDIOS: { id: OriginStudio; label: string }[] = [
  { id: 'agentic-studio',          label: 'Agentic Studio' },
  { id: 'helix-governance-studio', label: 'Helix Governance Studio' },
  { id: 'helix-data-studio',       label: 'Helix Data Studio' },
  { id: 'work-surfaces',           label: 'Work Surfaces' },
  { id: 'htl',                     label: 'HTL' },
];

export function OriginStudioScreen({ studioId }: { studioId: OriginStudio }) {
  const { principal, setPrincipalId, fixtureId, setFixtureId } = useApp();
  const studio = STUDIOS.find(s => s.id === studioId)!;

  function openConsole() {
    if (!principal) return;
    const fixture = store.getFixture();
    const scope = fixture.scopes.find(s => s.id === principal.homeScopeId) ?? fixture.scopes[0];
    const landing = resolveLanding(studioId, principal, scope, fixture);
    window.location.hash = consoleHref(landing.sectionId, scope.id, studioId).replace('#', '');
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--ac-surface2)]">
      {/* Stub topbar */}
      <header className="h-12 bg-white border-b border-[var(--border)] flex items-center px-6 gap-4 shrink-0">
        <span className="font-bold text-[13px] text-[var(--field-text)]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
          {studio.label}
        </span>
        <nav className="flex gap-1 ml-4">
          {['Overview', 'Activity', 'Settings'].map(tab => (
            <button key={tab} className="px-3 py-1 text-xs text-[var(--field-supporting)] hover:text-[var(--field-text)] focus-ring rounded">
              {tab}
            </button>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <button
            onClick={openConsole}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--btn-primary-hover-bg)] transition-colors focus-ring"
            aria-label="Open Admin Console"
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M8 1.5l1.2 2.8 3 .3-2.2 2 .7 3L8 8l-2.7 1.6.7-3-2.2-2 3-.3L8 1.5z" fill="currentColor"/><circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.3"/></svg>
            Admin Console
          </button>
          <div className="w-7 h-7 rounded-full bg-[var(--primary)] text-white flex items-center justify-center text-xs font-semibold">
            {principal?.name.charAt(0) ?? '?'}
          </div>
        </div>
      </header>

      {/* Stub body */}
      <div className="flex-1 flex items-center justify-center text-[var(--field-supporting)] text-sm">
        {studio.label} — studio content goes here
      </div>

      {/* Dev toolbar */}
      <DevToolbar
        principalId={principal?.id ?? ''}
        onPrincipalChange={setPrincipalId}
        fixtureId={fixtureId}
        onFixtureChange={setFixtureId}
        studioId={studioId}
      />
    </div>
  );
}

function DevToolbar({
  principalId, onPrincipalChange,
  fixtureId, onFixtureChange,
  studioId,
}: {
  principalId: string;
  onPrincipalChange: (id: string) => void;
  fixtureId: string;
  onFixtureChange: (id: any) => void;
  studioId: OriginStudio;
}) {
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-[var(--field-text)] text-white rounded-xl px-4 py-2 flex items-center gap-4 text-xs shadow-xl z-50">
      <span className="text-[var(--field-supporting)] font-medium">DEV</span>

      <label className="flex items-center gap-2">
        <span className="text-[var(--color-caption)]">Studio</span>
        <select
          value={studioId}
          onChange={e => { window.location.hash = studioHref(e.target.value as OriginStudio).replace('#', ''); }}
          className="bg-[var(--field-text)] text-white rounded px-2 py-0.5 text-xs focus-ring"
        >
          {STUDIOS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
      </label>

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
    </div>
  );
}
