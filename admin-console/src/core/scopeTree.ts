import type { Scope, ScopeClosure } from '../types';

// All queries operate on the pre-built closure table — no recursion at call time.

export function ancestors(scopeId: string, closure: ScopeClosure[]): string[] {
  return closure
    .filter(e => e.descendantId === scopeId && e.depth > 0)
    .sort((a, b) => a.depth - b.depth)
    .map(e => e.ancestorId);
}

export function descendants(scopeId: string, closure: ScopeClosure[]): string[] {
  return closure
    .filter(e => e.ancestorId === scopeId && e.depth > 0)
    .sort((a, b) => a.depth - b.depth)
    .map(e => e.descendantId);
}

export function ancestorsWithSelf(scopeId: string, closure: ScopeClosure[]): string[] {
  return [scopeId, ...ancestors(scopeId, closure)];
}

export function descendantsWithSelf(scopeId: string, closure: ScopeClosure[]): string[] {
  return [scopeId, ...descendants(scopeId, closure)];
}

export function depth(scopeId: string, closure: ScopeClosure[]): number {
  return closure
    .filter(e => e.descendantId === scopeId && e.ancestorId !== scopeId)
    .reduce((max, e) => Math.max(max, e.depth), 0);
}

export function isDescendantOf(childId: string, parentId: string, closure: ScopeClosure[]): boolean {
  return closure.some(e => e.ancestorId === parentId && e.descendantId === childId && e.depth > 0);
}

// Returns all scope IDs accessible to a principal given their home scope.
// A location-scoped admin sees only their subtree.
// A corporate/operator admin sees their subtree (which includes self).
export function accessibleScopeIds(homeScopeId: string, closure: ScopeClosure[]): string[] {
  return descendantsWithSelf(homeScopeId, closure);
}

export function getScopeById(scopeId: string, scopes: Scope[]): Scope | undefined {
  return scopes.find(s => s.id === scopeId);
}

export function getParent(scopeId: string, scopes: Scope[]): Scope | undefined {
  const scope = getScopeById(scopeId, scopes);
  if (!scope?.parentId) return undefined;
  return getScopeById(scope.parentId, scopes);
}
