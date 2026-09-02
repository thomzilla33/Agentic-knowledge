import { createContext, useContext, type ReactNode } from 'react';
import type { SectionId, OriginStudio } from '../types';

type ConsoleContextValue = {
  origin: OriginStudio;
  activeSectionId: SectionId;
  scopeId: string;
};

const ConsoleContext = createContext<ConsoleContextValue | null>(null);

export function ConsoleProvider({
  origin,
  activeSectionId,
  scopeId,
  children,
}: ConsoleContextValue & { children: ReactNode }) {
  return (
    <ConsoleContext.Provider value={{ origin, activeSectionId, scopeId }}>
      {children}
    </ConsoleContext.Provider>
  );
}

export function useConsole() {
  const ctx = useContext(ConsoleContext);
  if (!ctx) throw new Error('useConsole must be used inside ConsoleProvider');
  return ctx;
}
