import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { PaRole, PaGroup, StudioId } from '../../types';
import type { ScopeKind } from '../../types';
import { PERM_DEFS } from '../../fixtures/people';
import { Button } from '../primitives/Button';
import type { InvitePayload } from '../../mockApi/people';

// ── Constants ─────────────────────────────────────────────────────────────────

const SCOPE_OPTIONS: { id: ScopeKind; label: string; description: string }[] = [
  { id: 'operator',  label: 'Operator',  description: 'Platform-level administrator, manages all tenants' },
  { id: 'corporate', label: 'Corporate', description: 'Tenant-level administrator for one organization' },
  { id: 'region',    label: 'Region',    description: 'Manages a geographic or business region' },
  { id: 'location',  label: 'Location',  description: 'Access limited to a single site or team' },
];

const STUDIO_META: Record<StudioId, { label: string; color: string }> = {
  ag:    { label: 'Agentic Studio',    color: '#06b6d4' },
  gov:   { label: 'Governance Studio', color: '#10b981' },
  helix: { label: 'Helix DS',          color: '#8b5cf6' },
};

const STUDIO_IDS: StudioId[] = ['ag', 'gov', 'helix'];

const PERMS_BY_STUDIO: Record<StudioId, typeof PERM_DEFS> = {
  ag:    PERM_DEFS.filter(p => p.studioId === 'ag'),
  gov:   PERM_DEFS.filter(p => p.studioId === 'gov'),
  helix: PERM_DEFS.filter(p => p.studioId === 'helix'),
};

const ROLE_PERM_IDS: Record<string, string[]> = {
  'super-admin':  PERM_DEFS.map(p => p.id),
  'tenant-admin': PERM_DEFS.map(p => p.id),
  'developer':    ['ag.agents.view','ag.agents.create','ag.agents.edit','ag.workflows.view','ag.workflows.manage','ag.analytics.view','ag.sandbox.use','ag.workers.view','ag.workers.create','ag.workers.edit','ag.workers.execute'],
  'auditor':      ['gov.audit.view','gov.domains.view','gov.policies.view','hx.models.view','hx.pipelines.view'],
  'data-steward': ['gov.domains.view','gov.domains.manage','gov.policies.view','gov.policies.manage','gov.promote.approve','gov.audit.view','hx.models.view','hx.models.create','hx.models.publish','hx.pipelines.view','hx.pipelines.run','hx.connections.view'],
  'viewer':       ['ag.agents.view','ag.analytics.view','gov.domains.view','gov.policies.view','hx.models.view','hx.pipelines.view'],
};

const STEPS = ['Identity', 'Access', 'Groups', 'Review'] as const;
type Step = 0 | 1 | 2 | 3;

// ── Props ─────────────────────────────────────────────────────────────────────

interface InviteSlideOutProps {
  roles: PaRole[];
  groups: PaGroup[];
  onConfirm: (payload: InvitePayload) => void;
  onClose: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function InviteSlideOut({ roles, groups, onConfirm, onClose }: InviteSlideOutProps) {
  // Step 1 — Identity
  const [emails, setEmails] = useState<string[]>([]);
  const [emailDraft, setEmailDraft] = useState('');
  const [scopeKind, setScopeKind] = useState<ScopeKind>('corporate');

  // Step 2 — Access
  const [accessMode, setAccessMode] = useState<'role' | 'custom'>('role');
  const [selectedRoleId, setSelectedRoleId] = useState<string>(roles[2]?.id ?? roles[0]?.id ?? '');

  // Step 3 — Studios
  const [enabledStudios, setEnabledStudios] = useState<Set<StudioId>>(new Set());
  const [customPerms, setCustomPerms] = useState<Set<string>>(new Set());
  const [customScopes, setCustomScopes] = useState<Record<string, string>>({});

  // Step 4 — Groups
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set());

  const [step, setStep] = useState<Step>(0);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // ── Derived ────────────────────────────────────────────────────────────────

  const rolePerms = new Set(ROLE_PERM_IDS[selectedRoleId] ?? []);

  function studioHasAnyRolePerms(sid: StudioId): boolean {
    return PERMS_BY_STUDIO[sid].some(p => rolePerms.has(p.id));
  }

  // ── Navigation ─────────────────────────────────────────────────────────────

  function canProceed(): boolean {
    if (step === 0) return emails.length > 0;
    if (step === 1) return accessMode === 'custom' || selectedRoleId.length > 0;
    return true;
  }

  function handleNext() {
    if (step < 3) setStep(s => (s + 1) as Step);
  }

  function handleBack() {
    if (step > 0) setStep(s => (s - 1) as Step);
  }

  function handleSend() {
    const list = emailDraft.trim().includes('@')
      ? [...emails, emailDraft.trim()]
      : emails;
    list.forEach(addr => {
      onConfirm({
        name: addr.split('@')[0],
        email: addr,
        roleId: accessMode === 'role' ? selectedRoleId : null,
        studioIds: Array.from(enabledStudios),
        groupIds: Array.from(selectedGroups),
      });
    });
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  function toggleStudio(sid: StudioId) {
    setEnabledStudios(prev => {
      const next = new Set(prev);
      if (next.has(sid)) {
        next.delete(sid);
        // clear custom perms for this studio
        const studioPermIds = new Set(PERMS_BY_STUDIO[sid].map(p => p.id));
        setCustomPerms(cp => {
          const ncp = new Set(cp);
          studioPermIds.forEach(id => ncp.delete(id));
          return ncp;
        });
      } else {
        next.add(sid);
        // auto-select inherited perms for that studio if role mode
        if (accessMode === 'role') {
          setCustomPerms(cp => {
            const ncp = new Set(cp);
            PERMS_BY_STUDIO[sid].filter(p => rolePerms.has(p.id)).forEach(p => ncp.add(p.id));
            return ncp;
          });
        }
      }
      return next;
    });
  }

  function togglePerm(permId: string) {
    setCustomPerms(prev => {
      const next = new Set(prev);
      if (next.has(permId)) next.delete(permId); else next.add(permId);
      return next;
    });
  }

  function setPermScope(permId: string, scope: string) {
    setCustomScopes(prev => ({ ...prev, [permId]: scope }));
  }

  function toggleGroup(gid: string) {
    setSelectedGroups(prev => {
      const next = new Set(prev);
      if (next.has(gid)) next.delete(gid); else next.add(gid);
      return next;
    });
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return createPortal(
    <div className="fixed inset-0 z-[9000] flex flex-col bg-white">

      {/* Page header */}
      <div className="flex items-center gap-3 px-8 py-4 border-b border-[var(--border)] shrink-0">
        <button
          onClick={onClose}
          className="w-7 h-7 rounded-md flex items-center justify-center text-[var(--field-supporting)] hover:bg-[var(--ac-surface2)] hover:text-[var(--field-text)] transition-colors"
          aria-label="Back"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M9 1L2 7l7 6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div>
          <div className="text-sm font-semibold text-[var(--field-text)]">Invite member</div>
          <div className="text-[11px] text-[var(--field-supporting)] mt-0.5">
            Step {step + 1} of {STEPS.length} — {STEPS[step]}
          </div>
        </div>
      </div>

      {/* Page-level Stepper */}
      <div className="flex items-center px-8 pt-5 gap-1.5 shrink-0">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-1.5 flex-1 last:flex-none">
            <div className={`flex items-center gap-1.5 ${i <= step ? 'opacity-100' : 'opacity-40'}`}>
              <div className={`w-5 h-5 rounded-full text-[10px] font-semibold flex items-center justify-center shrink-0 ${
                i < step ? 'bg-[var(--primary)] text-white' :
                i === step ? 'border-2 border-[var(--primary)] text-[var(--primary)]' :
                'border border-[var(--border)] text-[var(--field-supporting)]'
              }`}>
                {i < step ? (
                  <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                    <path d="M1 4l2 2 4-4" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : i + 1}
              </div>
              <span className={`text-[10px] font-medium hidden sm:block ${i === step ? 'text-[var(--primary)]' : 'text-[var(--field-supporting)]'}`}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-px mx-1 ${i < step ? 'bg-[var(--primary)]' : 'bg-[var(--border)]'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Scrollable step content */}
      <div className="flex-1 overflow-y-auto px-8 py-6 max-w-2xl w-full mx-auto">
        {step === 0 && <StepIdentity emails={emails} setEmails={setEmails} emailDraft={emailDraft} setEmailDraft={setEmailDraft} scopeKind={scopeKind} setScopeKind={setScopeKind} />}
        {step === 1 && (
          <StepAccess
            accessMode={accessMode} setAccessMode={setAccessMode}
            selectedRoleId={selectedRoleId} setSelectedRoleId={setSelectedRoleId}
            roles={roles} rolePerms={rolePerms}
            enabledStudios={enabledStudios} customPerms={customPerms}
            studioHasAnyRolePerms={studioHasAnyRolePerms}
            toggleStudio={toggleStudio} togglePerm={togglePerm}
            customScopes={customScopes} setPermScope={setPermScope}
          />
        )}
        {step === 2 && <StepGroups groups={groups} selectedGroups={selectedGroups} toggleGroup={toggleGroup} />}
        {step === 3 && (
          <StepReview
            emails={emailDraft.trim().includes('@') ? [...emails, emailDraft.trim()] : emails}
            scopeKind={scopeKind}
            accessMode={accessMode}
            roleName={roles.find(r => r.id === selectedRoleId)?.name}
            enabledStudios={enabledStudios}
            customPerms={customPerms}
            selectedGroups={selectedGroups}
            groups={groups}
            rolePerms={rolePerms}
          />
        )}
      </div>

      {/* Page-level sticky footer */}
      <div className="flex items-center justify-between gap-3 px-8 py-4 border-t border-[var(--border)] shrink-0 bg-white">
        <Button variant="ghost" size="sm" onClick={step === 0 ? onClose : handleBack}>
          {step === 0 ? 'Cancel' : '← Back'}
        </Button>
        {step < 3 ? (
          <Button variant="primary" size="sm" onClick={handleNext} disabled={!canProceed()}>
            Continue →
          </Button>
        ) : (
          <Button variant="primary" size="sm" onClick={handleSend}>
            {emails.length > 1 ? `Send ${emails.length} invites` : 'Send invite'}
          </Button>
        )}
      </div>
    </div>,
    document.body
  );
}

// ── Step 1: Identity ──────────────────────────────────────────────────────────

function StepIdentity({ emails, setEmails, emailDraft, setEmailDraft, scopeKind, setScopeKind }: {
  emails: string[];
  setEmails: (v: string[]) => void;
  emailDraft: string;
  setEmailDraft: (v: string) => void;
  scopeKind: ScopeKind;
  setScopeKind: (v: ScopeKind) => void;
}) {
  function addEmail(raw: string) {
    const addr = raw.trim().toLowerCase();
    if (addr.includes('@') && !emails.includes(addr)) {
      setEmails([...emails, addr]);
    }
    setEmailDraft('');
  }

  function removeEmail(addr: string) {
    setEmails(emails.filter(e => e !== addr));
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',' || e.key === ' ') {
      e.preventDefault();
      addEmail(emailDraft);
    } else if (e.key === 'Backspace' && emailDraft === '' && emails.length > 0) {
      setEmails(emails.slice(0, -1));
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <label className="block text-xs font-medium text-[var(--field-text)] mb-1.5">
          Work email{emails.length > 1 ? 's' : ''}
          {emails.length > 0 && (
            <span className="ml-2 text-[var(--field-supporting)] font-normal">
              {emails.length} added
            </span>
          )}
        </label>
        {/* Tag input container */}
        <div
          className="min-h-[42px] w-full flex flex-wrap items-center gap-1.5 px-2.5 py-2 border border-[var(--border)] rounded-lg bg-[var(--ac-surface2)] focus-within:border-[var(--primary)] focus-within:bg-white transition-colors cursor-text"
          onClick={e => (e.currentTarget.querySelector('input') as HTMLInputElement | null)?.focus()}
        >
          {emails.map(addr => (
            <span
              key={addr}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-[var(--primary)]/10 border border-[var(--primary)]/30 text-[var(--primary)] shrink-0"
            >
              {addr}
              <button
                type="button"
                onClick={e => { e.stopPropagation(); removeEmail(addr); }}
                className="hover:opacity-70 transition-opacity leading-none"
                aria-label={`Remove ${addr}`}
              >
                ×
              </button>
            </span>
          ))}
          <input
            type="email"
            autoFocus
            placeholder={emails.length === 0 ? 'name@company.com — press Enter or comma to add more' : 'Add another…'}
            value={emailDraft}
            onChange={e => setEmailDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => { if (emailDraft.includes('@')) addEmail(emailDraft); }}
            className="flex-1 min-w-[180px] bg-transparent text-xs outline-none text-[var(--field-text)] placeholder:text-[var(--field-supporting)]"
          />
        </div>
        <p className="mt-1.5 text-[11px] text-[var(--field-supporting)]">
          Press Enter, comma, or space after each address.
        </p>
      </div>
      <fieldset>
        <legend className="block text-xs font-medium text-[var(--field-text)] mb-2">User type</legend>
        <p className="text-[11px] text-[var(--field-supporting)] mb-3 leading-relaxed">
          Determines which settings cascade to this user and where they can manage the platform.
        </p>
        <div className="flex flex-col gap-2">
          {SCOPE_OPTIONS.map(opt => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setScopeKind(opt.id)}
              className={`text-left flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                scopeKind === opt.id
                  ? 'border-[var(--primary)] bg-[var(--primary)]/5'
                  : 'border-[var(--border)] bg-white hover:border-[var(--field-supporting)]'
              }`}
            >
              <span className={`mt-0.5 w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${
                scopeKind === opt.id ? 'border-[var(--primary)]' : 'border-[var(--border)]'
              }`}>
                {scopeKind === opt.id && (
                  <span className="w-2 h-2 rounded-full bg-[var(--primary)] block" />
                )}
              </span>
              <div>
                <div className="text-xs font-medium text-[var(--field-text)]">{opt.label}</div>
                <div className="text-[11px] text-[var(--field-supporting)] mt-0.5">{opt.description}</div>
              </div>
            </button>
          ))}
        </div>
      </fieldset>
    </div>
  );
}

// ── Step 2: Access ────────────────────────────────────────────────────────────

function StepAccess({ accessMode, setAccessMode, selectedRoleId, setSelectedRoleId, roles, rolePerms, enabledStudios, customPerms, studioHasAnyRolePerms, toggleStudio, togglePerm, customScopes, setPermScope }: {
  accessMode: 'role' | 'custom';
  setAccessMode: (v: 'role' | 'custom') => void;
  selectedRoleId: string;
  setSelectedRoleId: (v: string) => void;
  roles: PaRole[];
  rolePerms: Set<string>;
  enabledStudios: Set<StudioId>;
  customPerms: Set<string>;
  studioHasAnyRolePerms: (sid: StudioId) => boolean;
  toggleStudio: (sid: StudioId) => void;
  togglePerm: (permId: string) => void;
  customScopes: Record<string, string>;
  setPermScope: (permId: string, scope: string) => void;
}) {
  const selectedRole = roles.find(r => r.id === selectedRoleId);

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-[var(--field-supporting)] leading-relaxed">
        Assign a preset role to inherit its permissions, or configure custom permissions per studio.
      </p>

      {/* Mode selector */}
      <div className="flex flex-col gap-2">
        {(['role', 'custom'] as const).map(mode => (
          <button
            key={mode}
            type="button"
            onClick={() => setAccessMode(mode)}
            className={`text-left flex items-start gap-3 p-3 rounded-lg border transition-colors ${
              accessMode === mode
                ? 'border-[var(--primary)] bg-[var(--primary)]/5'
                : 'border-[var(--border)] bg-white hover:border-[var(--field-supporting)]'
            }`}
          >
            <span className={`mt-0.5 w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${
              accessMode === mode ? 'border-[var(--primary)]' : 'border-[var(--border)]'
            }`}>
              {accessMode === mode && (
                <span className="w-2 h-2 rounded-full bg-[var(--primary)] block" />
              )}
            </span>
            <div>
              <div className="text-xs font-medium text-[var(--field-text)]">
                {mode === 'role' ? 'Assign a role' : 'Custom permissions'}
              </div>
              <div className="text-[11px] text-[var(--field-supporting)] mt-0.5">
                {mode === 'role'
                  ? 'User inherits all permissions from the selected role'
                  : 'Choose exactly which permissions to grant, per studio'}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Role mode: role list + per-studio permissions preview */}
      {accessMode === 'role' && (
        <div className="flex flex-col gap-4">
          <div>
            <div className="grid grid-cols-2 gap-2">
              {roles.map(role => {
                const sel = selectedRoleId === role.id;
                const permCount = (ROLE_PERM_IDS[role.id] ?? []).length;
                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => setSelectedRoleId(role.id)}
                    className={`text-left flex flex-col gap-2 p-3 rounded-xl border transition-colors ${
                      sel
                        ? 'border-[var(--primary)] bg-[var(--primary)]/5'
                        : 'border-[var(--border)] bg-white hover:border-[var(--field-supporting)]'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full shrink-0 bg-[var(--primary)]" />
                      <span className={`text-xs font-semibold flex-1 min-w-0 truncate ${sel ? 'text-[var(--primary)]' : 'text-[var(--field-text)]'}`}>{role.name}</span>
                      <span className="px-1.5 py-0.5 text-[10px] font-medium text-[var(--field-supporting)] bg-[var(--ac-surface2)] border border-[var(--border)] rounded shrink-0">
                        {role.isBuiltIn ? 'System' : 'Custom'}
                      </span>
                    </div>
                    <div className="text-[11px] text-[var(--field-supporting)] leading-snug line-clamp-2">{role.description}</div>
                    <div className={`text-[11px] font-medium ${sel ? 'text-[var(--primary)]' : 'text-[var(--field-supporting)]'}`}>
                      {permCount} permissions
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Per-studio permissions breakdown (read-only) */}
          {selectedRole && (
            <div className="flex flex-col gap-2">
              <div className="text-[10px] font-semibold uppercase tracking-widest text-[var(--field-supporting)]">
                Permissions included per studio
              </div>
              {STUDIO_IDS.map(sid => {
                const perms = PERMS_BY_STUDIO[sid].filter(p => rolePerms.has(p.id));
                if (perms.length === 0) return null;
                const meta = STUDIO_META[sid];
                return (
                  <div key={sid} className="rounded-lg border border-[var(--border)] overflow-hidden">
                    <div className="flex items-center gap-2 px-3 py-2 bg-[var(--ac-surface2)] border-b border-[var(--border)]">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: meta.color }} />
                      <span className="text-[11px] font-semibold text-[var(--field-text)]">{meta.label}</span>
                    </div>
                    <div className="px-3 py-2 flex flex-wrap gap-1.5">
                      {perms.map(p => (
                        <span
                          key={p.id}
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border"
                          style={{ background: `${meta.color}18`, borderColor: `${meta.color}40`, color: meta.color }}
                        >
                          {p.name}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Custom mode: studio toggles */}
      {accessMode === 'custom' && (
        <div>
          <div className="text-xs font-medium text-[var(--field-text)] mb-2">Studio access & permissions</div>
          <StepStudios
            accessMode={accessMode}
            enabledStudios={enabledStudios}
            customPerms={customPerms}
            rolePerms={rolePerms}
            studioHasAnyRolePerms={studioHasAnyRolePerms}
            toggleStudio={toggleStudio}
            togglePerm={togglePerm}
            customScopes={customScopes}
            setPermScope={setPermScope}
          />
        </div>
      )}
    </div>
  );
}

// ── Step 3: Studios ───────────────────────────────────────────────────────────

const PERM_SCOPE_OPTS = ['Own', 'Department', 'Tenant'] as const;

function StepStudios({ accessMode, enabledStudios, customPerms, rolePerms, studioHasAnyRolePerms, toggleStudio, togglePerm, customScopes, setPermScope }: {
  accessMode: 'role' | 'custom';
  enabledStudios: Set<StudioId>;
  customPerms: Set<string>;
  rolePerms: Set<string>;
  studioHasAnyRolePerms: (sid: StudioId) => boolean;
  toggleStudio: (sid: StudioId) => void;
  togglePerm: (permId: string) => void;
  customScopes: Record<string, string>;
  setPermScope: (permId: string, scope: string) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-[var(--field-supporting)] leading-relaxed">
        Select which studios this user can access.
        {accessMode === 'role'
          ? ' Permissions are inherited from the selected role and shown for reference.'
          : ' Then choose exactly which permissions to grant within each studio.'}
      </p>

      {STUDIO_IDS.map(sid => {
        const meta = STUDIO_META[sid];
        const enabled = enabledStudios.has(sid);
        const perms = PERMS_BY_STUDIO[sid];

        return (
          <div key={sid} className={`border rounded-xl overflow-hidden transition-colors ${enabled ? 'border-[var(--primary)]/40' : 'border-[var(--border)]'}`}>
            {/* Studio header / toggle */}
            <button
              type="button"
              onClick={() => toggleStudio(sid)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                enabled ? 'bg-[var(--primary)]/5' : 'bg-[var(--ac-surface2)] hover:bg-[var(--ac-surface2)]'
              }`}
            >
              {/* Toggle — DS Toggle sm spec */}
              <span
                className="relative shrink-0 rounded-full transition-colors"
                style={{
                  width: 26, height: 16,
                  background: enabled ? 'var(--primary)' : 'rgba(242,242,242,1)',
                  border: enabled ? 'none' : '2px solid rgba(92,92,92,1)',
                  boxSizing: 'border-box',
                }}
              >
                <span
                  className="absolute top-1/2 rounded-full transition-all duration-200"
                  style={{
                    width: 8, height: 8,
                    background: enabled ? '#fff' : 'rgba(42,42,42,1)',
                    left: 4,
                    transform: `translate(${enabled ? 10 : 0}px, -50%)`,
                  }}
                />
              </span>
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: meta.color }} />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-[var(--field-text)]">{meta.label}</div>
                {accessMode === 'role' && studioHasAnyRolePerms(sid) && (
                  <div className="text-[10px] text-[var(--field-supporting)] mt-0.5">
                    {perms.filter(p => rolePerms.has(p.id)).length} of {perms.length} permissions inherited from role
                  </div>
                )}
              </div>
              {!enabled && <span className="text-[11px] text-[var(--field-supporting)]">Off</span>}
              {enabled && <span className="text-[11px] font-medium" style={{ color: meta.color }}>Enabled</span>}
            </button>

            {/* Permissions list (when enabled) */}
            {enabled && (
              <div className="border-t border-[var(--border)]">
                {perms.map(perm => {
                  const fromRole = rolePerms.has(perm.id);
                  const checked = accessMode === 'role' ? fromRole : customPerms.has(perm.id);
                  const isReadOnly = accessMode === 'role';
                  const scope = customScopes[perm.id] ?? 'Own';

                  return (
                    <div key={perm.id} className="flex flex-col px-4 py-2.5 gap-2 border-t border-[var(--border)] first:border-0">
                      <div className="flex items-center gap-3">
                        {/* Toggle sm (hand-rolled inline spec) */}
                        {isReadOnly ? (
                          <span className="relative shrink-0 rounded-full" style={{ width: 26, height: 16, background: checked ? 'var(--primary)' : 'rgba(242,242,242,1)', border: checked ? 'none' : '2px solid rgba(92,92,92,0.5)', boxSizing: 'border-box', flexShrink: 0 }}>
                            <span className="absolute rounded-full" style={{ width: 8, height: 8, background: checked ? '#fff' : 'rgba(42,42,42,1)', top: '50%', left: 4, transform: `translate(${checked ? 10 : 0}px, -50%)` }} />
                          </span>
                        ) : (
                          <button
                            type="button"
                            role="switch"
                            aria-checked={checked}
                            onClick={() => togglePerm(perm.id)}
                            className="relative shrink-0 rounded-full cursor-pointer transition-colors"
                            style={{ width: 26, height: 16, background: checked ? 'var(--primary)' : 'rgba(242,242,242,1)', border: checked ? 'none' : '2px solid rgba(92,92,92,1)', boxSizing: 'border-box' }}
                          >
                            <span className="absolute rounded-full transition-all duration-200" style={{ width: 8, height: 8, background: checked ? '#fff' : 'rgba(42,42,42,1)', top: '50%', left: 4, transform: `translate(${checked ? 10 : 0}px, -50%)` }} />
                          </button>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium text-[var(--field-text)]">{perm.name}</div>
                          <div className="text-[10px] text-[var(--field-supporting)] truncate">{perm.description}</div>
                        </div>
                        {isReadOnly && fromRole && (
                          <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                            Inherited
                          </span>
                        )}
                      </div>
                      {/* Scope selector — custom mode + enabled */}
                      {!isReadOnly && checked && (
                        <div className="flex gap-1.5 pl-9">
                          {PERM_SCOPE_OPTS.map(opt => {
                            const sel = scope === opt;
                            return (
                              <button
                                key={opt}
                                type="button"
                                onClick={() => setPermScope(perm.id, opt)}
                                className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                                  sel
                                    ? 'border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)] font-semibold'
                                    : 'border-[var(--border)] text-[var(--field-supporting)] hover:border-[var(--primary)]/40'
                                }`}
                              >
                                {opt}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Step 4: Groups ────────────────────────────────────────────────────────────

function StepGroups({ groups, selectedGroups, toggleGroup }: {
  groups: PaGroup[];
  selectedGroups: Set<string>;
  toggleGroup: (gid: string) => void;
}) {
  const [search, setSearch] = useState('');
  const filtered = groups.filter(g => !search || g.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-[var(--field-supporting)] leading-relaxed">
        Optionally add this member to one or more groups. Groups can inherit additional permissions and are used for bulk management.
      </p>
      <div className="relative">
        <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--field-supporting)]" width="12" height="12" viewBox="0 0 16 16" fill="none">
          <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M10.5 10.5L13 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        <input
          type="search"
          placeholder="Search groups…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-7 pr-3 py-1.5 text-xs border border-[var(--border)] rounded-lg bg-[var(--ac-surface2)] focus:outline-none focus:border-[var(--primary)] focus:bg-white transition-colors"
        />
      </div>
      <div className="flex flex-col gap-2">
        {filtered.map(group => {
          const selected = selectedGroups.has(group.id);
          return (
            <button
              key={group.id}
              type="button"
              onClick={() => toggleGroup(group.id)}
              className={`text-left flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-colors ${
                selected
                  ? 'border-[var(--primary)] bg-[var(--primary)]/5'
                  : 'border-[var(--border)] bg-white hover:border-[var(--field-supporting)]'
              }`}
            >
              <span className={`w-4 h-4 rounded border shrink-0 flex items-center justify-center transition-colors ${
                selected ? 'bg-[var(--primary)] border-[var(--primary)]' : 'bg-[var(--ac-surface2)] border-[var(--border)]'
              }`}>
                {selected && (
                  <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                    <path d="M1 4l2 2 4-4" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </span>
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: group.color }} />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-[var(--field-text)]">{group.name}</div>
                <div className="text-[11px] text-[var(--field-supporting)] truncate">{group.description}</div>
              </div>
              <span className="text-[11px] text-[var(--field-supporting)] shrink-0">
                {group.memberIds.length} member{group.memberIds.length !== 1 ? 's' : ''}
              </span>
            </button>
          );
        })}
        {filtered.length === 0 && (
          <div className="py-8 text-center text-xs text-[var(--field-supporting)]">No groups match your search.</div>
        )}
      </div>
      {selectedGroups.size === 0 && (
        <p className="text-[11px] text-[var(--field-supporting)] italic">
          No groups selected — the member won't belong to any group initially.
        </p>
      )}
    </div>
  );
}

// ── Step 5: Review ────────────────────────────────────────────────────────────

function StepReview({ emails, scopeKind, accessMode, roleName, enabledStudios, customPerms, selectedGroups, groups, rolePerms }: {
  emails: string[];
  scopeKind: ScopeKind;
  accessMode: 'role' | 'custom';
  roleName?: string;
  enabledStudios: Set<StudioId>;
  customPerms: Set<string>;
  selectedGroups: Set<string>;
  groups: PaGroup[];
  rolePerms: Set<string>;
}) {
  const scopeLabel = SCOPE_OPTIONS.find(s => s.id === scopeKind)?.label ?? scopeKind;

  function Row({ label, children }: { label: string; children: React.ReactNode }) {
    return (
      <div className="flex items-start gap-4 py-3 border-b border-[var(--border)] last:border-0">
        <span className="text-[11px] font-medium text-[var(--field-supporting)] w-28 shrink-0 pt-0.5">{label}</span>
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Recipients */}
      <div>
        <div className="text-[10px] font-semibold uppercase tracking-widest text-[var(--field-supporting)] mb-2">
          {emails.length} recipient{emails.length !== 1 ? 's' : ''}
        </div>
        <div className="border border-[var(--border)] rounded-xl overflow-hidden divide-y divide-[var(--border)]">
          {emails.map(addr => (
            <div key={addr} className="flex items-center gap-3 px-4 py-2.5">
              <div className="w-7 h-7 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] text-[10px] font-semibold flex items-center justify-center shrink-0 border border-[var(--primary)]/20">
                {addr[0].toUpperCase()}
              </div>
              <span className="text-xs text-[var(--field-text)] flex-1 min-w-0 truncate">{addr}</span>
              <span className="px-2 py-0.5 text-[10px] font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-full shrink-0">
                Invited
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Summary rows — same settings apply to all */}
      <div className="border border-[var(--border)] rounded-xl overflow-hidden">
        <Row label="User type">
          <span className="text-xs font-medium text-[var(--field-text)]">{scopeLabel}</span>
        </Row>
        <Row label="Access">
          {accessMode === 'role' ? (
            <div>
              <span className="text-xs font-medium text-[var(--field-text)]">{roleName ?? '—'}</span>
              <span className="ml-2 text-[11px] text-[var(--field-supporting)]">
                · {PERM_DEFS.filter(p => rolePerms.has(p.id)).length} permissions inherited
              </span>
            </div>
          ) : (
            <span className="text-xs font-medium text-[var(--field-text)]">
              Custom · {customPerms.size} permission{customPerms.size !== 1 ? 's' : ''}
            </span>
          )}
        </Row>
        <Row label="Studios">
          {enabledStudios.size === 0 ? (
            <span className="text-xs text-[var(--field-supporting)] italic">No studio access</span>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {Array.from(enabledStudios).map(sid => (
                <span key={sid} className="flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium bg-white border border-[var(--border)] rounded-full text-[var(--field-text)]">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: STUDIO_META[sid].color }} />
                  {STUDIO_META[sid].label}
                </span>
              ))}
            </div>
          )}
        </Row>
        <Row label="Groups">
          {selectedGroups.size === 0 ? (
            <span className="text-xs text-[var(--field-supporting)] italic">No groups</span>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {Array.from(selectedGroups).map(gid => {
                const g = groups.find(g => g.id === gid);
                return g ? (
                  <span key={gid} className="flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium bg-white border border-[var(--border)] rounded-full text-[var(--field-text)]">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: g.color }} />
                    {g.name}
                  </span>
                ) : null;
              })}
            </div>
          )}
        </Row>
      </div>

      <p className="text-[11px] text-[var(--field-supporting)] leading-relaxed">
        Invitation emails will be sent to all {emails.length} recipient{emails.length !== 1 ? 's' : ''}. Links expire in 72 hours. Permissions take effect as soon as each member accepts.
      </p>
    </div>
  );
}
