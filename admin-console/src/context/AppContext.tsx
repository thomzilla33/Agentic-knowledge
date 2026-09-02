import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { FixtureId, Principal } from '../types';
import { store } from '../mockApi/store';

type AppContextValue = {
  principalId: string;
  setPrincipalId: (id: string) => void;
  principal: Principal | undefined;
  fixtureId: FixtureId;
  setFixtureId: (id: FixtureId) => void;
  // Increment to force re-fetches after a write
  dataRevision: number;
  bumpRevision: () => void;
};

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [fixtureId, setFixtureIdState] = useState<FixtureId>('multi-location');
  const [principalId, setPrincipalIdState] = useState('principal-tenant-admin');
  const [dataRevision, setDataRevision] = useState(0);

  const setFixtureId = useCallback((id: FixtureId) => {
    store.setFixture(id);
    setFixtureIdState(id);
    setDataRevision(r => r + 1);
  }, []);

  const setPrincipalId = useCallback((id: string) => {
    setPrincipalIdState(id);
  }, []);

  const principal = store.getPrincipal(principalId);
  const bumpRevision = useCallback(() => setDataRevision(r => r + 1), []);

  return (
    <AppContext.Provider value={{ principalId, setPrincipalId, principal, fixtureId, setFixtureId, dataRevision, bumpRevision }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
