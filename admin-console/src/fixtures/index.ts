import { singleCompanyFixture }  from './singleCompany';
import { multiLocationFixture }  from './multiLocation';
import { verticalPaaSFixture }   from './verticalPaaS';
import { PRINCIPALS, POLICIES, POLICY_MAP }  from './principals';
import { SETTING_REGISTRY, REGISTRY_MAP }    from './settingRegistry';
import { SECTIONS, SECTION_MAP }             from './sections';

export {
  singleCompanyFixture,
  multiLocationFixture,
  verticalPaaSFixture,
  PRINCIPALS,
  POLICIES,
  POLICY_MAP,
  SETTING_REGISTRY,
  REGISTRY_MAP,
  SECTIONS,
  SECTION_MAP,
};

export const ALL_FIXTURES = [singleCompanyFixture, multiLocationFixture, verticalPaaSFixture];

// Resolve placeholder homeScopeIds to real scope IDs per fixture
export function resolvePrincipals(fixtureId: string) {
  const placeholderMap: Record<string, Record<string, string>> = {
    'single-company': {
      'CORPORATE_SCOPE':  'sc-corp',
      'LOCATION_3_SCOPE': 'sc-corp', // only one scope in single-company
      'OPERATOR_SCOPE':   'sc-corp',
    },
    'multi-location': {
      'CORPORATE_SCOPE':  'ml-corp',
      'LOCATION_3_SCOPE': 'ml-loc3',
      'OPERATOR_SCOPE':   'ml-corp',
    },
    'vertical-paas': {
      'CORPORATE_SCOPE':  'vp-sub1',
      'LOCATION_3_SCOPE': 'vp-loc1',
      'OPERATOR_SCOPE':   'vp-op',
    },
  };
  const map = placeholderMap[fixtureId] ?? {};
  return PRINCIPALS.map(p => ({
    ...p,
    homeScopeId: map[p.homeScopeId] ?? p.homeScopeId,
  }));
}
