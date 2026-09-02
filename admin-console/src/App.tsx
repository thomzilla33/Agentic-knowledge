import { useState, useEffect } from 'react';
import { AppProvider } from './context/AppContext';
import { TenantSelectorScreen } from './screens/TenantSelector';
import { OriginStudioScreen } from './screens/OriginStudio';
import { AdminConsole } from './screens/AdminConsole';
import { parseRoute, type Route } from './router';
import type { OriginStudio } from './types';

function parseHash(): Route {
  const hash = window.location.hash.replace(/^#\/?/, '');
  return parseRoute(hash);
}

function AppRouter() {
  const [route, setRoute] = useState<Route>(parseHash);

  useEffect(() => {
    function onHashChange() {
      setRoute(parseHash());
    }
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  if (route.type === 'not-found') {
    window.location.hash = 'studio/agentic-studio';
    return null;
  }

  if (route.type === 'tenant-selector') {
    return <TenantSelectorScreen />;
  }

  if (route.type === 'studio') {
    return <OriginStudioScreen studioId={route.studioId as OriginStudio} />;
  }

  if (route.type === 'console') {
    return (
      <div className="h-screen flex flex-col overflow-hidden">
        <AdminConsole
          sectionId={route.sectionId}
          scopeId={route.scopeId}
          origin={route.origin as OriginStudio}
        />
      </div>
    );
  }

  return null;
}

export default function App() {
  return (
    <AppProvider>
      <AppRouter />
    </AppProvider>
  );
}
