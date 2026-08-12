import type { AuditEvent } from '../types';
import { delay } from './delay';
import { store } from './store';

export type AuditFilters = {
  actorId?: string;
  scopeId?: string;
  settingId?: string;
  from?: string;
  to?: string;
};

export async function getAuditEvents(filters: AuditFilters = {}): Promise<AuditEvent[]> {
  await delay();
  let events = store.getAuditLog();

  if (filters.actorId) events = events.filter(e => e.actorId === filters.actorId);
  if (filters.scopeId) events = events.filter(e => e.scopeId === filters.scopeId || e.affectedScopeIds.includes(filters.scopeId!));
  if (filters.settingId) events = events.filter(e => e.settingId === filters.settingId);
  if (filters.from) events = events.filter(e => e.at >= filters.from!);
  if (filters.to) events = events.filter(e => e.at <= filters.to!);

  return events;
}
