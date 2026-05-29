import { useEffect, useMemo, useState } from 'react';
import { Layout, type RouteKey } from './components/Layout';
import { CloudabilityRouter } from './pages/CloudabilityPages';
import { cloudabilityNav, type CloudabilityPageKey } from './lib/cloudabilityNav';
import {
  AdminPage,
  AssistantPage,
  CompliancePage,
  CostPage,
  DashboardPage,
  DevicesPage,
  ExportsPage,
  HardwarePage,
  IntegrationsPage,
  InventoryPage,
  LicencesPage,
  NormalizationPage,
  ReportsPage,
  RulesPage,
  SaasPage,
  UsagePage
} from './pages/MvpPages';

const routes = new Set<RouteKey>([
  'dashboard',
  'inventory',
  'devices',
  'usage',
  'saas',
  'licences',
  'costs',
  'compliance',
  'hardware',
  'integrations',
  'exports',
  'assistant',
  'rules',
  'normalization',
  'reports',
  'admin',
  ...cloudabilityNav.map((item) => item.key)
]);

function routeFromHash(): RouteKey {
  const hash = window.location.hash.replace('#', '') as RouteKey;
  return routes.has(hash) ? hash : 'dashboard';
}

export default function App() {
  const [route, setRoute] = useState<RouteKey>(routeFromHash);
  const [globalSearch, setGlobalSearch] = useState('');

  useEffect(() => {
    const listener = () => setRoute(routeFromHash());
    window.addEventListener('hashchange', listener);
    return () => window.removeEventListener('hashchange', listener);
  }, []);

  const page = useMemo(() => {
    if (route.startsWith('cloudability')) {
      return <CloudabilityRouter page={route as CloudabilityPageKey} globalSearch={globalSearch} />;
    }

    switch (route) {
      case 'inventory':
        return <InventoryPage globalSearch={globalSearch} />;
      case 'devices':
        return <DevicesPage globalSearch={globalSearch} />;
      case 'usage':
        return <UsagePage globalSearch={globalSearch} />;
      case 'saas':
        return <SaasPage globalSearch={globalSearch} />;
      case 'licences':
        return <LicencesPage globalSearch={globalSearch} />;
      case 'costs':
        return <CostPage globalSearch={globalSearch} />;
      case 'compliance':
        return <CompliancePage globalSearch={globalSearch} />;
      case 'hardware':
        return <HardwarePage globalSearch={globalSearch} />;
      case 'integrations':
        return <IntegrationsPage globalSearch={globalSearch} />;
      case 'exports':
        return <ExportsPage globalSearch={globalSearch} />;
      case 'assistant':
        return <AssistantPage />;
      case 'rules':
        return <RulesPage globalSearch={globalSearch} />;
      case 'normalization':
        return <NormalizationPage globalSearch={globalSearch} />;
      case 'reports':
        return <ReportsPage globalSearch={globalSearch} />;
      case 'admin':
        return <AdminPage globalSearch={globalSearch} />;
      default:
        return <DashboardPage globalSearch={globalSearch} />;
    }
  }, [globalSearch, route]);

  return (
    <Layout
      route={route}
      onRouteChange={(nextRoute) => {
        window.location.hash = nextRoute;
        setRoute(nextRoute);
      }}
      globalSearch={globalSearch}
      setGlobalSearch={setGlobalSearch}
    >
      {page}
    </Layout>
  );
}
