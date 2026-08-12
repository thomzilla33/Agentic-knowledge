/**
 * Mutable in-memory store. A single source of truth for the mock runtime.
 * All mockApi modules read/write through this module.
 */

import type { Fixture, FixtureId, Principal, SettingValue, AuditEvent, SettingDef } from '../types';
import { singleCompanyFixture as SC } from '../fixtures/singleCompany';
import { multiLocationFixture as ML } from '../fixtures/multiLocation';
import { verticalPaaSFixture as VP } from '../fixtures/verticalPaaS';
import { SETTING_REGISTRY, REGISTRY_MAP } from '../fixtures/settingRegistry';
import { resolvePrincipals } from '../fixtures';

const FIXTURE_MAP: Record<FixtureId, Fixture> = {
  'single-company':  SC,
  'multi-location':  ML,
  'vertical-paas':   VP,
};

// Mutable working copy of setting values (so writes persist during session)
let activeFixtureId: FixtureId = 'multi-location';
let settingValuesOverride: SettingValue[] = [...ML.settingValues];
let auditLog: AuditEvent[] = [];

// Concurrency tokens: settingId+scopeId → version string
const versionTokens = new Map<string, string>();

function versionKey(settingId: string, scopeId: string) {
  return `${settingId}::${scopeId}`;
}

export const store = {
  getFixture(): Fixture {
    const base = FIXTURE_MAP[activeFixtureId];
    return { ...base, settingValues: settingValuesOverride };
  },

  getFixtureId(): FixtureId { return activeFixtureId; },

  setFixture(id: FixtureId) {
    activeFixtureId = id;
    settingValuesOverride = [...FIXTURE_MAP[id].settingValues];
    versionTokens.clear();
    auditLog = [];
  },

  getPrincipals(): Principal[] {
    return resolvePrincipals(activeFixtureId);
  },

  getPrincipal(id: string): Principal | undefined {
    return this.getPrincipals().find(p => p.id === id);
  },

  getSettingValues(): SettingValue[] { return settingValuesOverride; },

  getSettingValue(settingId: string, scopeId: string): SettingValue | undefined {
    return settingValuesOverride.find(v => v.settingId === settingId && v.scopeId === scopeId);
  },

  issueVersionToken(settingId: string, scopeId: string): string {
    const key = versionKey(settingId, scopeId);
    const existing = versionTokens.get(key);
    if (existing) return existing;
    const token = Math.random().toString(36).slice(2, 10);
    versionTokens.set(key, token);
    return token;
  },

  checkVersionToken(settingId: string, scopeId: string, token: string): boolean {
    const key = versionKey(settingId, scopeId);
    const current = versionTokens.get(key);
    // If no token issued yet, always pass
    if (!current) return true;
    return current === token;
  },

  writeValue(settingId: string, scopeId: string, value: unknown, actorId: string): SettingValue {
    const key = versionKey(settingId, scopeId);
    const newToken = Math.random().toString(36).slice(2, 10);
    versionTokens.set(key, newToken);

    const existing = settingValuesOverride.findIndex(v => v.settingId === settingId && v.scopeId === scopeId);
    const newVal: SettingValue = {
      settingId,
      scopeId,
      value,
      setBy: actorId,
      setAt: new Date().toISOString(),
      packageVersion: '1.0.0',
    };
    if (existing >= 0) {
      settingValuesOverride = settingValuesOverride.map((v, i) => i === existing ? newVal : v);
    } else {
      settingValuesOverride = [...settingValuesOverride, newVal];
    }
    return newVal;
  },

  getAuditLog(): AuditEvent[] { return auditLog; },

  addAuditEvent(event: AuditEvent) {
    auditLog = [event, ...auditLog];
  },

  getSettingDefs(): SettingDef[] { return SETTING_REGISTRY; },

  getSettingDef(id: string): SettingDef | undefined { return REGISTRY_MAP[id]; },

  getValueRecord(settingId: string, scopeId: string): SettingValue | undefined {
    return this.getSettingValue(settingId, scopeId);
  },

  getVersionToken(settingId: string, scopeId: string): string {
    const key = versionKey(settingId, scopeId);
    return versionTokens.get(key) ?? '';
  },
};
