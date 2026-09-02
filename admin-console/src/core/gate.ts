/**
 * THE gate function. This is the single source of truth for section visibility.
 * No component may decide visibility by any other path.
 *
 * Evaluation order:
 * 1. Entitlement — does the scope's tree hold the product every setting in the section requires?
 * 2. Permission  — do the principal's policies grant at least read on this section at this scope?
 *
 * Both gates filter; they do not block. A failing section is absent from the result.
 * My Settings (id: 'my-settings') has no gate — always visible.
 */

import type { Principal, Scope, SectionId, Fixture } from '../types';
import { SECTIONS } from '../fixtures/sections';
import { SETTING_REGISTRY } from '../fixtures/settingRegistry';
import { POLICY_MAP } from '../fixtures/principals';
import { isEntitled } from './entitlements';
import { accessibleScopeIds, isDescendantOf } from './scopeTree';

export type SectionAccess = {
  sectionId: SectionId;
  access: 'read' | 'write';
};

// Returns sections visible to this principal at this scope, with their access level.
export function visibleSections(
  principal: Principal,
  scope: Scope,
  fixture: Fixture
): SectionAccess[] {
  const result: SectionAccess[] = [];
  const accessible = accessibleScopeIds(principal.homeScopeId, fixture.closure);

  // Principal must be able to reach this scope
  if (!accessible.includes(scope.id)) return [];

  for (const section of SECTIONS) {
    // My Settings has no gate
    if (section.id === 'my-settings') {
      result.push({ sectionId: section.id, access: 'write' });
      continue;
    }

    // Billing: corporate/operator scope only
    if (section.corporateOnly && scope.kind !== 'corporate' && scope.kind !== 'operator') {
      continue;
    }

    // Gate 1: Entitlement — every setting that requires a product must be entitled.
    // A section is visible if at least one setting is not gated out by entitlement.
    const settingsInSection = SETTING_REGISTRY.filter(s => s.sectionId === section.id);
    const visibleSettings = settingsInSection.filter(setting => {
      if (!setting.requiresProduct) return true;
      return isEntitled(scope.id, setting.requiresProduct, fixture.entitlements, fixture.closure);
    });

    if (visibleSettings.length === 0) continue;

    // Gate 2: Permission — principal must have at least read via a policy grant.
    const access = resolveAccess(principal, scope, section.id, fixture, accessible);
    if (!access) continue;

    result.push({ sectionId: section.id, access });
  }

  return result;
}

// Returns the effective access level for a principal on a section at a scope, or null if none.
function resolveAccess(
  principal: Principal,
  scope: Scope,
  sectionId: SectionId,
  fixture: Fixture,
  accessibleIds: string[]
): 'read' | 'write' | null {
  let best: 'read' | 'write' | null = null;

  for (const policyId of principal.policyIds) {
    const policy = POLICY_MAP[policyId];
    if (!policy) continue;

    for (const grant of policy.grants) {
      if (grant.sectionId !== sectionId) continue;

      const grantApplies = doesGrantApply(grant.scopeSelector, principal.homeScopeId, scope.id, fixture, accessibleIds);
      if (!grantApplies) continue;

      if (grant.access === 'write') return 'write'; // write always wins
      best = 'read';
    }
  }

  return best;
}

function doesGrantApply(
  selector: 'self' | 'self+descendants' | 'tree',
  homeScopeId: string,
  targetScopeId: string,
  fixture: Fixture,
  accessibleIds: string[]
): boolean {
  switch (selector) {
    case 'self':
      return homeScopeId === targetScopeId;
    case 'self+descendants':
      return homeScopeId === targetScopeId
        || isDescendantOf(targetScopeId, homeScopeId, fixture.closure);
    case 'tree':
      // Entire accessible subtree
      return accessibleIds.includes(targetScopeId);
  }
}

// Convenience: section IDs only (for nav rendering)
export function visibleSectionIds(principal: Principal, scope: Scope, fixture: Fixture): SectionId[] {
  return visibleSections(principal, scope, fixture).map(s => s.sectionId);
}

// Convenience: does principal have write on a section at a scope?
export function canWrite(principal: Principal, scope: Scope, sectionId: SectionId, fixture: Fixture): boolean {
  return visibleSections(principal, scope, fixture)
    .some(s => s.sectionId === sectionId && s.access === 'write');
}
