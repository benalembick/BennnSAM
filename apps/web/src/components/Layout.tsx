import clsx from 'clsx';
import {
  BarChart3,
  Bot,
  BrainCircuit,
  Building2,
  Cable,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Cpu,
  DatabaseZap,
  Download,
  FileBarChart,
  Filter,
  HardDrive,
  Home,
  KeyRound,
  LibraryBig,
  Menu,
  PackageSearch,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Users,
  X
} from 'lucide-react';
import type React from 'react';
import { useMemo, useState } from 'react';
import bennnSamLogo from '../assets/bennnsam-logo-cropped.png';
import bennnSamMark from '../assets/bennnsam-mark.png';
import { Badge, Button, SearchInput } from './ui';

export type RouteKey =
  | 'dashboard'
  | 'inventory'
  | 'devices'
  | 'usage'
  | 'saas'
  | 'licences'
  | 'costs'
  | 'compliance'
  | 'hardware'
  | 'integrations'
  | 'exports'
  | 'assistant'
  | 'rules'
  | 'normalization'
  | 'reports'
  | 'admin';

const navItems = [
  { key: 'dashboard', label: 'Dashboard', icon: Home, group: 'Overview' },
  { key: 'inventory', label: 'Software Inventory', icon: PackageSearch, group: 'Inventory' },
  { key: 'devices', label: 'Device and Agent Inventory', icon: Cpu, group: 'Inventory' },
  { key: 'usage', label: 'Active Usage Tracking', icon: BarChart3, group: 'Inventory' },
  { key: 'saas', label: 'SaaS Discovery', icon: LibraryBig, group: 'Inventory' },
  { key: 'licences', label: 'Licence Management', icon: KeyRound, group: 'Licensing & Cost' },
  { key: 'costs', label: 'Cost Centre', icon: Building2, group: 'Licensing & Cost' },
  { key: 'compliance', label: 'Compliance and Risk', icon: ShieldCheck, group: 'Governance' },
  { key: 'hardware', label: 'Hardware Assets', icon: HardDrive, group: 'Governance' },
  { key: 'integrations', label: 'Integrations Hub', icon: Cable, group: 'Data & Automation' },
  { key: 'exports', label: 'DataBridge Exports', icon: DatabaseZap, group: 'Data & Automation' },
  { key: 'assistant', label: 'AI Report Assistant', icon: Bot, group: 'Data & Automation' },
  { key: 'rules', label: 'Custom Inventory Rules', icon: SlidersHorizontal, group: 'Admin' },
  { key: 'normalization', label: 'Normalization Engine', icon: BrainCircuit, group: 'Admin' },
  { key: 'reports', label: 'Reporting', icon: FileBarChart, group: 'Admin' },
  { key: 'admin', label: 'Roles and Permissions', icon: Users, group: 'Admin' }
] satisfies Array<{ key: RouteKey; label: string; icon: typeof Home; group: string }>;

const navGroups = ['Overview', 'Inventory', 'Licensing & Cost', 'Governance', 'Data & Automation', 'Admin'];

export function Layout({
  route,
  onRouteChange,
  globalSearch,
  setGlobalSearch,
  children
}: {
  route: RouteKey;
  onRouteChange: (route: RouteKey) => void;
  globalSearch: string;
  setGlobalSearch: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <AppShell route={route} onRouteChange={onRouteChange} globalSearch={globalSearch} setGlobalSearch={setGlobalSearch}>
      {children}
    </AppShell>
  );
}

export function AppShell({
  route,
  onRouteChange,
  globalSearch,
  setGlobalSearch,
  children
}: {
  route: RouteKey;
  onRouteChange: (route: RouteKey) => void;
  globalSearch: string;
  setGlobalSearch: (value: string) => void;
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const current = useMemo(() => navItems.find((item) => item.key === route) ?? navItems[0], [route]);

  const sidebar = (
    <Sidebar
      collapsed={collapsed}
      route={route}
      onCollapse={() => setCollapsed((value) => !value)}
      onRouteChange={(nextRoute) => {
        onRouteChange(nextRoute);
        setMobileOpen(false);
      }}
    />
  );

  return (
    <div className="min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top_left,rgba(8,145,178,0.10),transparent_34%),linear-gradient(180deg,#f8fafc_0%,#eef6f8_100%)] text-slate-900">
      <div className={clsx('hidden lg:fixed lg:inset-y-0 lg:z-40 lg:flex lg:flex-col', collapsed ? 'lg:w-[76px]' : 'lg:w-64')}>
        {sidebar}
      </div>
      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button className="absolute inset-0 bg-slate-950/35 backdrop-blur-sm" onClick={() => setMobileOpen(false)} type="button" aria-label="Close navigation" />
          <div className="absolute inset-y-0 left-0 w-80 max-w-[86vw]">
            <Sidebar
              collapsed={false}
              route={route}
              onCollapse={() => setMobileOpen(false)}
              onRouteChange={(nextRoute) => {
                onRouteChange(nextRoute);
                setMobileOpen(false);
              }}
            />
          </div>
        </div>
      ) : null}
      <div className={clsx('transition-[padding] duration-200', collapsed ? 'lg:pl-[76px]' : 'lg:pl-64')}>
        <TopBar
          currentLabel={current.label}
          globalSearch={globalSearch}
          onMobileMenu={() => setMobileOpen(true)}
          onRouteChange={onRouteChange}
          onToggleFilters={() => setFiltersOpen(true)}
          setGlobalSearch={setGlobalSearch}
        />
        <main className="mx-auto w-full max-w-[1680px] px-3 py-4 sm:px-4 md:px-6 lg:px-7">{children}</main>
      </div>
      <FilterDrawer open={filtersOpen} onClose={() => setFiltersOpen(false)} />
    </div>
  );
}

export function Sidebar({
  collapsed,
  route,
  onRouteChange,
  onCollapse
}: {
  collapsed: boolean;
  route: RouteKey;
  onRouteChange: (route: RouteKey) => void;
  onCollapse: () => void;
}) {
  return (
    <aside className="flex h-full flex-col border-r border-slate-200/80 bg-white/90 shadow-[12px_0_35px_rgba(15,23,42,0.04)] backdrop-blur-xl">
      <div className={clsx('flex h-16 items-center border-b border-slate-200/80 px-3', collapsed ? 'justify-center' : 'justify-between gap-3')}>
        <div className={clsx('flex min-w-0 items-center', collapsed ? 'justify-center' : 'flex-1')}>
          {!collapsed ? (
            <img
              alt="BennnSam - SAM & SaaS Intelligence Platform"
              className="h-11 w-auto max-w-[178px] object-contain"
              src={bennnSamLogo}
            />
          ) : (
            <img alt="BennnSam" className="h-10 w-10 rounded-lg object-contain shadow-sm" src={bennnSamMark} />
          )}
        </div>
        {!collapsed ? (
          <Button aria-label="Collapse sidebar" icon={ChevronLeft} onClick={onCollapse} size="icon" type="button" variant="ghost" />
        ) : null}
      </div>
      {collapsed ? (
        <div className="flex justify-center border-b border-slate-200/80 py-2">
          <Button aria-label="Expand sidebar" icon={ChevronRight} onClick={onCollapse} size="icon" type="button" variant="ghost" />
        </div>
      ) : null}
      <nav className="flex-1 overflow-y-auto px-2 py-3 scrollbar-thin" aria-label="Primary navigation">
        {navGroups.map((group) => {
          const groupItems = navItems.filter((item) => item.group === group);
          return (
            <div className="mb-4 last:mb-0" key={group}>
              {!collapsed ? <div className="mb-1 px-2 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">{group}</div> : null}
              <div className="space-y-1">
                {groupItems.map((item) => {
                  const Icon = item.icon;
                  const active = route === item.key;
                  return (
                    <button
                      aria-current={active ? 'page' : undefined}
                      className={clsx(
                        'group/nav relative flex w-full items-center rounded-md text-left text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500',
                        collapsed ? 'justify-center px-2 py-2.5' : 'gap-3 px-3 py-2',
                        active ? 'bg-cyan-50 text-cyan-800 shadow-[inset_0_0_0_1px_rgba(103,232,249,0.42)]' : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-950'
                      )}
                      key={item.key}
                      onClick={() => onRouteChange(item.key)}
                      title={collapsed ? item.label : undefined}
                      type="button"
                    >
                      <span className={clsx('absolute left-0 h-5 w-0.5 rounded-r-full bg-cyan-600 transition-opacity', active ? 'opacity-100' : 'opacity-0')} />
                      <Icon className="h-4 w-4 shrink-0" />
                      {!collapsed ? <span className="min-w-0 flex-1 truncate">{item.label}</span> : null}
                      {collapsed ? (
                        <span className="pointer-events-none absolute left-[calc(100%+10px)] z-50 hidden whitespace-nowrap rounded-md bg-slate-950 px-2 py-1 text-xs font-semibold text-white shadow-lg group-hover/nav:block">
                          {item.label}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>
      <div className={clsx('border-t border-slate-200/80 p-3', collapsed && 'flex justify-center')}>
        <Badge tone="brand" className={collapsed ? 'px-2' : undefined}>
          {collapsed ? 'Demo' : 'Demo tenant'}
        </Badge>
        {!collapsed ? <div className="mt-2 truncate text-xs font-medium text-slate-500">Northstar Manufacturing</div> : null}
      </div>
    </aside>
  );
}

export function TopBar({
  currentLabel,
  globalSearch,
  setGlobalSearch,
  onMobileMenu,
  onToggleFilters,
  onRouteChange
}: {
  currentLabel: string;
  globalSearch: string;
  setGlobalSearch: (value: string) => void;
  onMobileMenu: () => void;
  onToggleFilters: () => void;
  onRouteChange: (route: RouteKey) => void;
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex min-h-16 w-full max-w-[1680px] flex-col gap-3 px-3 py-3 sm:px-4 md:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-7">
        <div className="flex min-w-0 items-center gap-3">
          <Button aria-label="Open navigation" icon={Menu} onClick={onMobileMenu} size="icon" type="button" variant="ghost" className="lg:hidden" />
          <div className="min-w-0">
            <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Workspace</div>
            <h1 className="truncate text-lg font-semibold tracking-tight text-slate-950">{currentLabel}</h1>
          </div>
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-2 lg:max-w-5xl lg:flex-row lg:items-center lg:justify-end">
          <SearchInput
            className="min-w-0 lg:max-w-md lg:flex-1"
            leadingIcon={Search}
            placeholder="Search software, users, devices"
            value={globalSearch}
            onChange={setGlobalSearch}
          />
          <div className="grid w-full grid-cols-1 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:items-center">
            <Button className="w-full sm:w-auto" icon={Plus} onClick={() => onRouteChange('reports')} type="button" variant="secondary">
              New report
            </Button>
            <Button className="w-full sm:w-auto" icon={RefreshCw} onClick={() => onRouteChange('integrations')} type="button" variant="secondary">
              Sync data
            </Button>
            <Button className="w-full sm:w-auto" icon={Download} onClick={() => onRouteChange('exports')} type="button" variant="primary">
              Export audit pack
            </Button>
            <Button className="w-full sm:w-auto" icon={Filter} onClick={onToggleFilters} type="button" variant="secondary">
              Filters
            </Button>
            <button
              aria-label="Open user menu"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-cyan-600 to-slate-900 text-xs font-bold text-white shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2"
              type="button"
            >
              AC
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

export function FilterDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <button className="absolute inset-0 bg-slate-950/35 backdrop-blur-sm" onClick={onClose} type="button" aria-label="Close filters" />
      <aside className="absolute right-0 top-0 h-full w-full max-w-md overflow-y-auto border-l border-slate-200 bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/95 p-4 backdrop-blur">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-cyan-700">Global filters</div>
            <h2 className="mt-1 text-base font-semibold text-slate-950">Portfolio scope</h2>
          </div>
          <Button aria-label="Close filters" icon={X} onClick={onClose} size="icon" type="button" variant="ghost" />
        </div>
        <div className="space-y-5 p-4">
          <FilterGroup title="Business units" options={['Manufacturing', 'Finance', 'Operations', 'Information Technology']} />
          <FilterGroup title="Risk posture" options={['High and critical', 'Missing owner', 'Shadow SaaS', 'Renewal exposure']} />
          <FilterGroup title="Time horizon" options={['Next 30 days', 'Next 90 days', 'Current quarter', 'FY planning']} />
          <div className="rounded-lg border border-cyan-100 bg-cyan-50 p-3 text-sm text-cyan-900">
            <div className="font-semibold">Current tenant</div>
            <div className="mt-1 text-cyan-800">Northstar Manufacturing demo estate</div>
          </div>
          <Button className="w-full" icon={ClipboardCheck} onClick={onClose} type="button" variant="primary">
            Apply filters
          </Button>
        </div>
      </aside>
    </div>
  );
}

function FilterGroup({ title, options }: { title: string; options: string[] }) {
  return (
    <fieldset>
      <legend className="text-sm font-semibold text-slate-950">{title}</legend>
      <div className="mt-2 space-y-2">
        {options.map((option, index) => (
          <label className="flex cursor-pointer items-center justify-between rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50" key={option}>
            <span>{option}</span>
            <input
              className="rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
              defaultChecked={index === 0}
              type="checkbox"
            />
          </label>
        ))}
      </div>
    </fieldset>
  );
}
