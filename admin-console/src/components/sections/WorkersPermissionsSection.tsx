/**
 * Workers → Permissions — ARP-612 (Admin Configuration — Workers RBAC).
 *
 * §1 Permission matrix   — roles × actions, one toggle per cell, project defaults.
 * §2 Role assignment     — roles come from the platform RBAC registry; admin picks
 *                          the role that owns newly created workers.
 * §3 Validation          — the enforcement preview shows exactly what the Workers UI
 *                          renders for a role; the API note states the server-side rule.
 */

import { useState } from 'react';
import { PA_ROLES } from '../../fixtures/people';
import {
  WORKER_ACTIONS, WORKER_LOCKED_ROLES,
  type WorkerAction,
} from '../../fixtures/workers';
import {
  getRoleActions, setRoleAction, resetWorkerMatrix, isMatrixDirty,
  getDefaultOwnerRole, setDefaultOwnerRole,
} from '../../mockApi/workers';
import { Button } from '../primitives/Button';
import { InlineMessage } from '../primitives/InlineMessage';

const card = 'bg-white border border-[var(--border)] rounded-xl p-5';
const sectionTitle = 'text-[10px] font-semibold uppercase tracking-widest text-[var(--field-supporting)] mb-3';

interface Props {
  canWrite: boolean;
}

export function WorkersPermissionsSection({ canWrite }: Props) {
  const [rev, setRev] = useState(0);
  const bump = () => setRev(r => r + 1);
  const [saved, setSaved] = useState(false);
  const [previewRole, setPreviewRole] = useState<string>('developer');

  const dirty = isMatrixDirty();

  function toggleCell(roleId: string, action: WorkerAction, next: boolean) {
    if (!canWrite) return;
    setRoleAction(roleId, action, next);
    setSaved(false);
    bump();
  }

  function handleSave() {
    setSaved(true);
    bump();
  }

  function handleReset() {
    resetWorkerMatrix();
    setSaved(false);
    setPreviewRole('developer');
    bump();
  }

  return (
    <div className="flex flex-col gap-4" data-rev={rev}>
      {/* ── Intro ─────────────────────────────────────────────────────────── */}
      <div>
        <h2 className="text-base font-semibold text-[var(--field-text)]">Workers permissions</h2>
        <p className="text-xs text-[var(--field-supporting)] mt-1 max-w-2xl leading-relaxed">
          Decide which roles can view, build, publish and run the Workers in Agentic Studio.
          These grants are the project-level default — every worker inherits them unless it is
          overridden individually.
        </p>
      </div>

      {!canWrite && (
        <InlineMessage kind="info">
          You have read-only access to this section at the current scope. Grants are shown but cannot be changed.
        </InlineMessage>
      )}

      {/* ── §1 Permission matrix ──────────────────────────────────────────── */}
      <div className={`${card} p-0 overflow-hidden`}>
        <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-b border-[var(--border)] bg-[var(--ac-surface2)]">
          <div>
            <h3 className="text-xs font-semibold text-[var(--field-text)]">Permission matrix</h3>
            <p className="text-[11px] text-[var(--field-supporting)] mt-0.5">
              {PA_ROLES.length} roles · {WORKER_ACTIONS.length} actions
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {dirty && !saved && (
              <span className="px-2 py-0.5 text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-full">
                Unsaved changes
              </span>
            )}
            {saved && (
              <span className="px-2 py-0.5 text-[11px] font-medium text-green-700 bg-green-50 border border-green-200 rounded-full">
                Saved
              </span>
            )}
            <Button variant="secondary" size="sm" onClick={handleReset} disabled={!canWrite || !dirty}>
              Restore defaults
            </Button>
            <Button variant="primary" size="sm" onClick={handleSave} disabled={!canWrite || !dirty || saved}>
              Save changes
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="text-left px-5 py-2.5 text-[10px] font-semibold uppercase tracking-widest text-[var(--field-supporting)] sticky left-0 bg-white z-10">
                  Role
                </th>
                {WORKER_ACTIONS.map(a => (
                  <th key={a.id} className="px-2 py-2.5 text-center" title={a.description}>
                    <div className="text-[10px] font-semibold uppercase tracking-widest text-[var(--field-supporting)]">
                      {a.label}
                    </div>
                    {a.sensitive && (
                      <div className="text-[9px] font-medium text-amber-600 mt-0.5">sensitive</div>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PA_ROLES.map(role => {
                const locked = WORKER_LOCKED_ROLES.includes(role.id);
                const actions = getRoleActions(role.id);
                return (
                  <tr key={role.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--ac-surface2)]/50">
                    <td className="px-5 py-3 sticky left-0 bg-white z-10">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-[var(--field-text)]">{role.name}</span>
                        {role.isBuiltIn && (
                          <span className="px-1.5 py-0.5 text-[10px] font-medium text-[var(--field-supporting)] bg-[var(--ac-surface2)] border border-[var(--border)] rounded">
                            Built-in
                          </span>
                        )}
                        {locked && (
                          <span
                            title="Administrator roles always hold every Workers action"
                            className="text-[var(--field-supporting)]"
                          >
                            <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                              <rect x="2.5" y="5.5" width="7" height="5" rx="1.3" stroke="currentColor" strokeWidth="1.2"/>
                              <path d="M4 5.5V4a2 2 0 014 0v1.5" stroke="currentColor" strokeWidth="1.2"/>
                            </svg>
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-[var(--field-supporting)] mt-0.5">{role.description}</div>
                    </td>
                    {WORKER_ACTIONS.map(a => {
                      const on = actions.includes(a.id);
                      const disabled = !canWrite || locked;
                      return (
                        <td key={a.id} className="px-2 py-3 text-center">
                          <MatrixCell
                            on={on}
                            disabled={disabled}
                            sensitive={a.sensitive}
                            label={`${a.label} for ${role.name}`}
                            onChange={next => toggleCell(role.id, a.id, next)}
                          />
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="px-5 py-3 border-t border-[var(--border)] bg-[var(--ac-surface2)] text-[11px] text-[var(--field-supporting)] leading-relaxed">
          Actions depend on one another: granting <b>Publish</b> also grants <b>Edit</b> and <b>View</b>,
          and revoking <b>View</b> revokes everything. Super Admin and Tenant Admin always hold every action.
        </div>
      </div>

      {/* ── §2 Role assignment ────────────────────────────────────────────── */}
      <div className={card}>
        <div className={sectionTitle}>Role assignment</div>
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <div className="min-w-0 flex-1">
            <div className="text-xs font-medium text-[var(--field-text)]">Default owner role for new workers</div>
            <p className="text-[11px] text-[var(--field-supporting)] mt-0.5 max-w-md leading-relaxed">
              Whoever creates a worker is granted this role on it, on top of whatever their
              platform roles already allow.
            </p>
          </div>
          <select
            value={getDefaultOwnerRole()}
            disabled={!canWrite}
            onChange={e => { setDefaultOwnerRole(e.target.value); setSaved(false); bump(); }}
            className="shrink-0 h-8 px-2.5 text-xs rounded-lg border border-[var(--border)] bg-white text-[var(--field-text)] focus-ring disabled:opacity-50"
          >
            {PA_ROLES.map(r => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </div>
        <div className="mt-4 pt-4 border-t border-[var(--border)] text-[11px] text-[var(--field-supporting)] leading-relaxed">
          Roles are read from the platform RBAC registry. To add a role or change who belongs to it,
          go to <b>People &amp; Access → Roles</b>.
        </div>
      </div>

      {/* ── §3 Enforcement preview ────────────────────────────────────────── */}
      <div className={card}>
        <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
          <div>
            <div className={`${sectionTitle} mb-0`}>Enforcement preview</div>
            <p className="text-[11px] text-[var(--field-supporting)] mt-1">
              What a member holding only this role sees in Agentic Studio → Workers.
            </p>
          </div>
          <select
            value={previewRole}
            onChange={e => setPreviewRole(e.target.value)}
            className="shrink-0 h-8 px-2.5 text-xs rounded-lg border border-[var(--border)] bg-white text-[var(--field-text)] focus-ring"
          >
            {PA_ROLES.map(r => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </div>

        <EnforcementPreview roleId={previewRole} />

        <div className="mt-4 pt-4 border-t border-[var(--border)] text-[11px] text-[var(--field-supporting)] leading-relaxed">
          The UI hides or disables what a role cannot do, but that is a convenience, not the control.
          The Workers API re-checks every call against this matrix and answers <code>403</code> when
          the caller is not permitted.
        </div>
      </div>
    </div>
  );
}

/* ── Matrix cell ────────────────────────────────────────────────────────── */

function MatrixCell({
  on, disabled, sensitive, label, onChange,
}: {
  on: boolean;
  disabled: boolean;
  sensitive?: boolean;
  label: string;
  onChange: (next: boolean) => void;
}) {
  const accent = sensitive ? 'var(--priority-high, #ea580c)' : 'var(--primary)';
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={() => onChange(!on)}
      className={[
        'w-6 h-6 rounded-md border inline-flex items-center justify-center transition-all focus-ring',
        disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:scale-105',
        on ? 'border-transparent text-white' : 'border-[var(--border)] bg-white text-transparent hover:border-[var(--field-supporting)]',
      ].join(' ')}
      style={on ? { background: accent } : undefined}
    >
      <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
        <path d="M2.5 6.2L4.8 8.5 9.5 3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </button>
  );
}

/* ── §3 Enforcement preview ─────────────────────────────────────────────── */

type UiControl = { label: string; where: string; needs: WorkerAction; mode: 'hidden' | 'disabled' };

const UI_CONTROLS: UiControl[] = [
  { label: 'Workers in the sidebar',   where: 'Agentic Studio shell', needs: 'view',    mode: 'hidden' },
  { label: '"New Worker"',             where: 'Workers list',         needs: 'create',  mode: 'hidden' },
  { label: '"Edit worker"',            where: 'Flow tab',             needs: 'edit',    mode: 'disabled' },
  { label: '"Publish"',                where: 'Builder · Lifecycle',  needs: 'publish', mode: 'disabled' },
  { label: '"Archive"',                where: 'Lifecycle tab',        needs: 'archive', mode: 'disabled' },
  { label: 'Row menu → Delete',        where: 'Workers list',         needs: 'delete',  mode: 'hidden' },
  { label: '"Run test" / "Run worker"',where: 'Test mode · Playground',needs: 'execute', mode: 'disabled' },
];

function EnforcementPreview({ roleId }: { roleId: string }) {
  const actions = getRoleActions(roleId);
  const role = PA_ROLES.find(r => r.id === roleId);
  const noView = !actions.includes('view');

  if (noView) {
    return (
      <InlineMessage kind="warning">
        {role?.name ?? roleId} cannot view Workers, so the module does not appear in Agentic Studio at all
        and every Workers API call returns 403.
      </InlineMessage>
    );
  }

  return (
    <div className="border border-[var(--border)] rounded-lg overflow-hidden">
      {UI_CONTROLS.map(c => {
        const allowed = actions.includes(c.needs);
        return (
          <div
            key={c.label}
            className="flex items-center gap-3 px-4 py-2.5 border-b border-[var(--border)] last:border-0"
          >
            <span
              className={`w-1.5 h-1.5 rounded-full shrink-0 ${allowed ? 'bg-green-500' : 'bg-[var(--field-supporting)]'}`}
              aria-hidden="true"
            />
            <span className="text-xs font-medium text-[var(--field-text)] min-w-0 flex-1 truncate">{c.label}</span>
            <span className="text-[11px] text-[var(--field-supporting)] shrink-0 hidden sm:block">{c.where}</span>
            <span
              className={[
                'px-2 py-0.5 rounded-full border text-[11px] font-medium capitalize shrink-0',
                allowed
                  ? 'text-green-700 bg-green-50 border-green-200'
                  : 'text-[var(--field-supporting)] bg-[var(--ac-surface2)] border-[var(--border)]',
              ].join(' ')}
            >
              {allowed ? 'Available' : c.mode}
            </span>
          </div>
        );
      })}
    </div>
  );
}
