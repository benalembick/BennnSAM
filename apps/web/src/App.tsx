import { useEffect, useMemo, useState } from 'react';
import { Layout, type RouteKey } from './components/Layout';
import { CloudabilityRouter } from './pages/CloudabilityPages';
import { cloudabilityNav, type CloudabilityPageKey } from './lib/cloudabilityNav';
import {
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
import { AdminPage } from './pages/AdminPages';
import { AccessDeniedPage, LoginPage, SetPasswordPage } from './pages/LoginPage';
import { createAuthProvider, useAuth } from './lib/auth';
import { setTokenGetter } from './lib/api';

const { AuthProvider } = createAuthProvider();

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
  return (
    <AuthProvider>
      <AuthenticatedApp />
    </AuthProvider>
  );
}

function AuthenticatedApp() {
  const { profile, token, isLoading, isPasswordRecovery } = useAuth();
  const [route, setRoute]       = useState<RouteKey>(routeFromHash);
  const [globalSearch, setGlobalSearch] = useState('');

  // Update the token getter during render so child effects see the current
  // token when they fire their API calls (useEffect timing would be too late).
  setTokenGetter(() => token);

  useEffect(() => {
    const listener = () => setRoute(routeFromHash());
    window.addEventListener('hashchange', listener);
    return () => window.removeEventListener('hashchange', listener);
  }, []);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <span className="h-8 w-8 animate-spin rounded-full border-4 border-cyan-600 border-t-transparent" />
      </div>
    );
  }

  if (isPasswordRecovery) {
    return <SetPasswordPage />;
  }

  if (!profile) {
    return (
      <LoginPage onSuccess={() => { window.location.hash = 'dashboard'; setRoute('dashboard'); }} />
    );
  }

  const page = <PageRouter route={route} globalSearch={globalSearch} />;

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

function PageRouter({ route, globalSearch }: { route: RouteKey; globalSearch: string }) {
  const { profile } = useAuth();

  return useMemo(() => {
    if (route.startsWith('cloudability')) {
      // Finance gate for cloudability pages.
      if (profile && !profile.isSuperAdmin && profile.role !== 'tenant_admin' && profile.role !== 'finance_user') {
        return <AccessDeniedPage message="Cloud cost dashboards require Finance or higher access." />;
      }
      return <CloudabilityRouter page={route as CloudabilityPageKey} globalSearch={globalSearch} />;
    }

    switch (route) {
      case 'inventory':      return <InventoryPage      globalSearch={globalSearch} />;
      case 'devices':        return <DevicesPage        globalSearch={globalSearch} />;
      case 'usage':          return <UsagePage          globalSearch={globalSearch} />;
      case 'saas':           return <SaasPage           globalSearch={globalSearch} />;
      case 'licences':       return <LicencesPage       globalSearch={globalSearch} />;
      case 'costs':          return <CostPage           globalSearch={globalSearch} />;
      case 'compliance':     return <CompliancePage     globalSearch={globalSearch} />;
      case 'hardware':       return <HardwarePage       globalSearch={globalSearch} />;
      case 'integrations':   return <IntegrationsPage   globalSearch={globalSearch} />;
      case 'exports':        return <ExportsPage        globalSearch={globalSearch} />;
      case 'assistant':      return <AssistantPage />;
      case 'rules':          return <RulesPage          globalSearch={globalSearch} />;
      case 'normalization':  return <NormalizationPage  globalSearch={globalSearch} />;
      case 'reports':        return <ReportsPage        globalSearch={globalSearch} />;
      case 'admin':          return <AdminPage          globalSearch={globalSearch} />;
      default:               return <DashboardPage      globalSearch={globalSearch} />;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route, globalSearch, profile]);
}
