import type { Scope } from '../types';
import { delay } from './delay';
import { store } from './store';
import { accessibleScopeIds } from '../core/scopeTree';

export async function getScope(id: string): Promise<Scope | undefined> {
  await delay(80);
  return store.getFixture().scopes.find(s => s.id === id);
}

export async function getAccessibleScopes(principalId: string): Promise<Scope[]> {
  await delay();
  const principal = store.getPrincipal(principalId);
  if (!principal) return [];
  const fixture = store.getFixture();
  const accessibleIds = accessibleScopeIds(principal.homeScopeId, fixture.closure);
  return fixture.scopes.filter(s => accessibleIds.includes(s.id));
}

export async function getAllScopes(): Promise<Scope[]> {
  await delay(80);
  return store.getFixture().scopes;
}
