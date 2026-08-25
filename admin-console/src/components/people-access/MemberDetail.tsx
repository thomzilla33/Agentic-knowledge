import { useState } from 'react';
import type { Member, PaRole, PaGroup } from '../../types';
import { Button } from '../primitives/Button';
import { PERM_DEFS, getMemberPerms, getMemberActivity } from '../../fixtures/people';

const STATUS_STYLE: Record<string, string> = {
  active:    'text-green-700 bg-green-50 border-green-200',
  invited:   'text-blue-700  bg-blue-50  border-blue-200',
  suspended: 'text-amber-700 bg-amber-50 border-amber-200',
};

const STUDIO_META: Record<string, { label: string; color: string }> = {
  ag:    { label: 'Agentic Studio',    color: '#06b6d4' },
  gov:   { label: 'Governance Studio', color: '#10b981' },
  helix: { label: 'Helix DS',          color: '#8b5cf6' },
};

type DetailTab = 'overview' | 'permissions' | 'groups' | 'activity';
type StudioTab = 'ag' | 'gov' | 'helix';

interface MemberDetailProps {
  member: Member;
  roles: PaRole[];
  groups: PaGroup[];
  memberRoles: string[];
  onBack: () => void;
  onAssignRole: () => void;
  onRemoveRole: (roleId: string) => void;
}

// ── Permission state indicator ───────────────────────────────────────────────

function PermBadge({ state, sourceRole }: { state: string; sourceRole?: string }) {
  if (state === 'granted') {
    return (
      <span title="Directly granted" className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
        Granted
      </span>
    );
  }
  if (state === 'inherited') {
    return (
      <span title={`Inherited from role: ${sourceRole}`} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
        Inherited{sourceRole ? ` · ${sourceRole}` : ''}
      </span>
    );
  }
  if (state === 'denied') {
    return (
      <span title="Explicitly denied" className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-red-50 text-red-700 border border-red-200">
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1.5 1.5l7 7M8.5 1.5l-7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
        Denied
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-[var(--ac-surface2)] text-[var(--field-supporting)] border border-[var(--border)]">
      <span className="w-1.5 h-1.5 rounded-full bg-[var(--field-supporting)] opacity-40 flex-shrink-0" />
      No access
    </span>
  );
}

// ── Activity icon ─────────────────────────────────────────────────────────────

function ActivityIcon({ type }: { type: string }) {
  const paths: Record<string, string> = {
    auth:  'M12 2a5 5 0 0 1 5 5v2h1a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1h1V7a5 5 0 0 1 5-5zm0 2a3 3 0 0 0-3 3v2h6V7a3 3 0 0 0-3-3z',
    edit:  'M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z',
    group: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm8 4a4 4 0 0 1 0 7.75M23 21v-2a4 4 0 0 0-3-3.87',
    role:  'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm0 2c-5.33 0-8 2.67-8 4v1h16v-1c0-1.33-2.67-4-8-4z',
    check: 'M20 6L9 17l-5-5',
  };
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={paths[type] ?? paths.check} />
    </svg>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function MemberDetail({ member, roles, groups, memberRoles, onBack, onAssignRole, onRemoveRole }: MemberDetailProps) {
  const [tab, setTab] = useState<DetailTab>('overview');
  const [studioTab, setStudioTab] = useState<StudioTab>('ag');

  const assignedRoles = roles.filter(r => memberRoles.includes(r.id));
  const memberGroups  = groups.filter(g => g.memberIds.includes(member.id));
  const allPerms      = getMemberPerms(member.id, memberRoles);
  const activity      = getMemberActivity(member.id);

  const permsForStudio = allPerms.filter(ps => PERM_DEFS.find(d => d.id === ps.permId)?.studioId === studioTab);
  const grantedCount   = allPerms.filter(ps => ps.state !== 'none').length;

  const tabs: { id: DetailTab; label: string; count?: number }[] = [
    { id: 'overview',     label: 'Overview' },
    { id: 'permissions',  label: 'Permissions', count: grantedCount },
    { id: 'groups',       label: 'Groups',      count: memberGroups.length },
    { id: 'activity',     label: 'Activity' },
  ];

  return (
    <div className="flex flex-col min-h-0">
      {/* ── Header ── */}
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="text-xs text-[var(--primary)] hover:underline flex items-center gap-1 focus-ring rounded"
          >
            ← Members
          </button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => {}}>Reset password</Button>
          <Button variant="danger" size="sm" onClick={() => {}}>Deactivate</Button>
        </div>
      </div>

      {/* ── Profile strip ── */}
      <div className="bg-white border border-[var(--border)] rounded-lg p-4 mb-4 flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-[var(--primary)] text-white text-sm font-semibold flex items-center justify-center shrink-0">
          {member.initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-sm font-semibold text-[var(--field-text)]">{member.name}</h2>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[11px] font-medium capitalize ${STATUS_STYLE[member.status]}`}>
              {member.status}
            </span>
          </div>
          <p className="text-xs text-[var(--field-supporting)] mt-0.5">{member.email}</p>
        </div>
        <div className="text-xs text-[var(--field-supporting)] shrink-0">
          Joined {new Date(member.joinedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
        </div>
      </div>

      {/* ── Tab bar ── */}
      <div className="flex items-center gap-0 border-b border-[var(--border)] mb-5">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-xs font-medium border-b-2 -mb-px transition-colors flex items-center gap-1.5 ${
              tab === t.id
                ? 'border-[var(--primary)] text-[var(--primary)]'
                : 'border-transparent text-[var(--field-supporting)] hover:text-[var(--field-text)]'
            }`}
          >
            {t.label}
            {t.count !== undefined && t.count > 0 && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                tab === t.id ? 'bg-[var(--primary)] text-white' : 'bg-[var(--ac-surface2)] text-[var(--field-supporting)]'
              }`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Tab: Overview ── */}
      {tab === 'overview' && (
        <div className="flex flex-col gap-4">
          {/* Stats row */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'Studios with access', value: member.studios.length },
              { label: 'Permissions active',  value: grantedCount },
              { label: 'Roles assigned',      value: assignedRoles.length },
              { label: 'Groups',              value: memberGroups.length },
            ].map(s => (
              <div key={s.label} className="bg-white border border-[var(--border)] rounded-lg p-3 text-center">
                <div className="text-xl font-bold text-[var(--field-text)]">{s.value}</div>
                <div className="text-[11px] text-[var(--field-supporting)] mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Studio access */}
            <div className="bg-white border border-[var(--border)] rounded-lg overflow-hidden">
              <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--ac-surface2)]">
                <span className="text-xs font-semibold text-[var(--field-text)]">Studio access</span>
              </div>
              <div>
                {Object.entries(STUDIO_META).map(([key, meta]) => {
                  const hasAccess = member.studios.includes(key as 'ag' | 'gov' | 'helix');
                  return (
                    <div
                      key={key}
                      onClick={() => { setTab('permissions'); setStudioTab(key as StudioTab); }}
                      className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border)] last:border-0 cursor-pointer hover:bg-[var(--ac-surface2)] transition-colors"
                    >
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: meta.color }} />
                      <span className="text-xs text-[var(--field-text)] flex-1">{meta.label}</span>
                      {hasAccess
                        ? <span className="text-[11px] text-emerald-600 font-medium">Access granted</span>
                        : <span className="text-[11px] text-[var(--field-supporting)]">No access</span>
                      }
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--field-supporting)" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recent activity */}
            <div className="bg-white border border-[var(--border)] rounded-lg overflow-hidden">
              <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--ac-surface2)]">
                <span className="text-xs font-semibold text-[var(--field-text)]">Recent activity</span>
              </div>
              <div>
                {activity.slice(0, 4).map((a, i) => (
                  <div key={i} className="flex items-start gap-3 px-4 py-2.5 border-b border-[var(--border)] last:border-0">
                    <div className="w-6 h-6 rounded-full bg-[var(--ac-surface2)] border border-[var(--border)] flex items-center justify-center flex-shrink-0 text-[var(--field-supporting)] mt-0.5">
                      <ActivityIcon type={a.type} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[11px] text-[var(--field-text)] leading-snug">{a.msg}</div>
                      <div className="text-[10px] text-[var(--field-supporting)] mt-0.5">{a.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Roles quick view */}
          <div className="bg-white border border-[var(--border)] rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--border)] bg-[var(--ac-surface2)]">
              <span className="text-xs font-semibold text-[var(--field-text)]">Roles ({assignedRoles.length})</span>
              <Button variant="secondary" size="sm" onClick={onAssignRole}>+ Assign role</Button>
            </div>
            {assignedRoles.length === 0 ? (
              <div className="py-8 text-center text-xs text-[var(--field-supporting)]">No roles assigned.</div>
            ) : (
              assignedRoles.map(role => (
                <div key={role.id} className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--border)] last:border-0">
                  <div>
                    <div className="text-xs font-medium text-[var(--field-text)]">{role.name}</div>
                    <div className="text-[11px] text-[var(--field-supporting)]">{role.description}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {role.isBuiltIn && <span className="px-1.5 py-0.5 text-[10px] text-[var(--field-supporting)] bg-[var(--ac-surface2)] border border-[var(--border)] rounded">Built-in</span>}
                    <button onClick={() => onRemoveRole(role.id)} className="w-5 h-5 rounded flex items-center justify-center text-[var(--field-supporting)] hover:bg-red-50 hover:text-red-600 transition-colors">
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1.5 1.5l7 7M8.5 1.5l-7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ── Tab: Permissions ── */}
      {tab === 'permissions' && (
        <div className="flex gap-4">
          {/* Legend sidebar */}
          <div className="w-48 flex-shrink-0 flex flex-col gap-3">
            <div className="bg-white border border-[var(--border)] rounded-lg p-3">
              <div className="text-[10px] font-semibold text-[var(--field-supporting)] uppercase tracking-wider mb-2">Permission states</div>
              <div className="flex flex-col gap-1.5">
                <PermBadge state="granted" />
                <PermBadge state="inherited" />
                <PermBadge state="denied" />
                <PermBadge state="none" />
              </div>
            </div>
            <div className="bg-white border border-[var(--border)] rounded-lg p-3">
              <div className="text-[10px] font-semibold text-[var(--field-supporting)] uppercase tracking-wider mb-2">Summary</div>
              <div className="text-xl font-bold text-[var(--field-text)]">{grantedCount}</div>
              <div className="text-[11px] text-[var(--field-supporting)]">active permissions</div>
              <div className="mt-2 text-[11px] text-[var(--field-supporting)]">{PERM_DEFS.length - grantedCount} not granted</div>
            </div>
          </div>

          {/* Permission list */}
          <div className="flex-1 min-w-0">
            {/* Studio sub-tabs */}
            <div className="flex items-center gap-0 border-b border-[var(--border)] mb-0">
              {(['ag', 'gov', 'helix'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setStudioTab(s)}
                  className={`px-3 py-2 text-[11px] font-medium border-b-2 -mb-px flex items-center gap-1.5 transition-colors ${
                    studioTab === s
                      ? 'border-[var(--primary)] text-[var(--primary)]'
                      : 'border-transparent text-[var(--field-supporting)] hover:text-[var(--field-text)]'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: STUDIO_META[s].color }} />
                  {STUDIO_META[s].label}
                </button>
              ))}
            </div>

            <div className="bg-white border border-[var(--border)] border-t-0 rounded-b-lg overflow-hidden">
              {/* Table header */}
              <div className="grid grid-cols-[1fr_auto] px-4 py-2 bg-[var(--ac-surface2)] border-b border-[var(--border)]">
                <span className="text-[10px] font-semibold text-[var(--field-supporting)] uppercase tracking-wider">Permission</span>
                <span className="text-[10px] font-semibold text-[var(--field-supporting)] uppercase tracking-wider">State</span>
              </div>
              {permsForStudio.map(ps => {
                const def = PERM_DEFS.find(d => d.id === ps.permId);
                if (!def) return null;
                return (
                  <div key={ps.permId} className="grid grid-cols-[1fr_auto] items-center px-4 py-3 border-b border-[var(--border)] last:border-0 gap-4">
                    <div>
                      <div className="text-xs font-medium text-[var(--field-text)]">{def.name}</div>
                      <div className="text-[11px] text-[var(--field-supporting)] mt-0.5">{def.description}</div>
                      <div className="text-[10px] text-[var(--field-supporting)] font-mono mt-0.5 opacity-60">{def.code}</div>
                    </div>
                    <div className="flex-shrink-0">
                      <PermBadge state={ps.state} sourceRole={ps.sourceRole} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Tab: Groups ── */}
      {tab === 'groups' && (
        <div className="flex flex-col gap-2">
          {memberGroups.length === 0 ? (
            <div className="py-16 text-center text-xs text-[var(--field-supporting)]">
              <div className="font-medium text-[var(--field-text)] mb-1">No groups</div>
              This member hasn't been added to any group yet.
            </div>
          ) : (
            memberGroups.map(group => (
              <div key={group.id} className="bg-white border border-[var(--border)] rounded-lg px-4 py-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: group.color + '22', border: `1px solid ${group.color}44` }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={group.color} strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-[var(--field-text)]">{group.name}</div>
                  <div className="text-[11px] text-[var(--field-supporting)]">{group.description}</div>
                </div>
                <span className="text-[11px] text-[var(--field-supporting)] flex-shrink-0">{group.memberIds.length} members</span>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── Tab: Activity ── */}
      {tab === 'activity' && (
        <div className="bg-white border border-[var(--border)] rounded-lg overflow-hidden">
          {activity.map((a, i) => (
            <div key={i} className="flex items-start gap-3 px-4 py-3 border-b border-[var(--border)] last:border-0">
              <div className="w-7 h-7 rounded-full bg-[var(--ac-surface2)] border border-[var(--border)] flex items-center justify-center flex-shrink-0 text-[var(--field-supporting)] mt-0.5">
                <ActivityIcon type={a.type} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-[var(--field-text)]">{a.msg}</div>
                <div className="text-[11px] text-[var(--field-supporting)] mt-0.5">{a.time}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
