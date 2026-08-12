import type { Principal, Scope, SectionId, OriginStudio, Fixture } from '../types';
import { SECTIONS } from '../fixtures/sections';
import { visibleSectionIds } from './gate';

const ORIGIN_PREFERRED_SECTION: Record<OriginStudio, SectionId> = {
  'agentic-studio':           'studios-entitlements',
  'helix-governance-studio':  'governance-defaults',
  'helix-data-studio':        'integrations-credentials',
  'work-surfaces':            'notifications',
  'htl':                      'people-access',
};

export type LandingResult = {
  sectionId: SectionId;
  redirected: boolean;        // true if preferred section was gated out
  redirectReason?: string;
};

export function resolveLanding(
  origin: OriginStudio,
  principal: Principal,
  scope: Scope,
  fixture: Fixture
): LandingResult {
  const preferred = ORIGIN_PREFERRED_SECTION[origin];
  const visible = visibleSectionIds(principal, scope, fixture);

  // Preferred section is visible — done
  if (visible.includes(preferred)) {
    return { sectionId: preferred, redirected: false };
  }

  // Resolve to nearest visible section in navigation order
  for (const section of SECTIONS) {
    if (visible.includes(section.id)) {
      return {
        sectionId: section.id,
        redirected: true,
        redirectReason: `You don't have access to the default section for this studio. Showing ${section.label} instead.`,
      };
    }
  }

  // Last resort: My Settings (always visible)
  return {
    sectionId: 'my-settings',
    redirected: true,
    redirectReason: `You don't have administrative access to this scope. Showing your personal settings.`,
  };
}
