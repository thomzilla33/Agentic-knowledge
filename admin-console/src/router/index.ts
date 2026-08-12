import type { SectionId, OriginStudio } from '../types';

const DEFAULT_ORIGIN: OriginStudio = 'agentic-studio';

export type Route =
  | { type: 'tenant-selector' }
  | { type: 'studio'; studioId: OriginStudio }
  | { type: 'console'; sectionId: SectionId; scopeId: string; origin: OriginStudio }
  | { type: 'not-found' };

export function parseRoute(hash: string): Route {
  const path = hash.replace(/^#/, '');
  const [base, queryStr] = path.split('?');
  const parts = base.split('/').filter(Boolean);
  const params = Object.fromEntries(new URLSearchParams(queryStr ?? '').entries());

  // Empty hash or explicit tenant-selector path → workspace selection landing
  if (parts.length === 0 || parts[0] === 'tenant-selector') {
    return { type: 'tenant-selector' };
  }
  if (parts[0] === 'studio' && parts[1]) {
    return { type: 'studio', studioId: parts[1] as OriginStudio };
  }
  if (parts[0] === 'console' && parts[1] && params.scope) {
    return {
      type: 'console',
      sectionId: parts[1] as SectionId,
      scopeId: params.scope,
      origin: (params.origin as OriginStudio) ?? DEFAULT_ORIGIN,
    };
  }
  return { type: 'not-found' };
}

export function studioHref(studioId: OriginStudio): string {
  return `#/studio/${studioId}`;
}

export function consoleHref(sectionId: SectionId, scopeId: string, origin?: OriginStudio): string {
  const originParam = origin ? `&origin=${origin}` : '';
  return `#/console/${sectionId}?scope=${scopeId}${originParam}`;
}
