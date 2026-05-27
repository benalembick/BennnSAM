import {
  BarChart3,
  Blocks,
  Bot,
  BrainCircuit,
  Building2,
  Cable,
  ChevronDown,
  ClipboardCheck,
  Cpu,
  DatabaseZap,
  FileBarChart,
  Filter,
  HardDrive,
  Home,
  KeyRound,
  LibraryBig,
  Menu,
  PackageSearch,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Users,
  X
} from 'lucide-react';
import type React from 'react';
import { useMemo, useState } from 'react';

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

export const navItems = [
  { key: 'dashboard', label: 'Dashboard', icon: Home },
  { key: 'inventory', label: 'Software Inventory', icon: PackageSearch },
  { key: 'devices', label: 'Device and Agent Inventory', icon: Cpu },
  { key: 'usage', label: 'Active Usage Tracking', icon: BarChart3 },
  { key: 'saas', label: 'SaaS Discovery', icon: LibraryBig },
  { key: 'licences', label: 'Licence Management', icon: KeyRound },
  { key: 'costs', label: 'Cost Centre', icon: Building2 },
  { key: 'compliance', label: 'Compliance and Risk', icon: ShieldCheck },
  { key: 'hardware', label: 'Hardware Assets', icon: HardDrive },
  { key: 'integrations', label: 'Integrations Hub', icon: Cable },
  { key: 'exports', label: 'DataBridge Exports', icon: DatabaseZap },
  { key: 'assistant', label: 'AI Report Assistant', icon: Bot },
  { key: 'rules', label: 'Custom Inventory Rules', icon: SlidersHorizontal },
  { key: 'normalization', label: 'Normalization Engine', icon: BrainCircuit },
  { key: 'reports', label: 'Reporting', icon: FileBarChart },
  { key: 'admin', label: 'Roles and Permissions', icon: Users }
] satisfies Array<{ key: RouteKey; label: string; icon: typeof Home }>;

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
  const [open, setOpen] = useState(false);
  const current = useMemo(() => navItems.find((item) => item.key === route) ?? navItems[0], [route]);

  const sidebar = (
    <aside className="flex h-full flex-col border-r border-slate-200 bg-white">
      <div className="flex h-16 items-center gap-3 border-b border-slate-200 px-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-cyan-700 text-white">
          <Blocks className="h-5 w-5" />
        </div>
        <div>
          <div className="text-lg font-semibold tracking-normal text-ink">BennnSam</div>
          <div className="text-xs font-medium text-slate-500">SAM and SaaS Management</div>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto p-3 scrollbar-thin">
        <div className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = route === item.key;
            return (
              <button
                key={item.key}
                className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm font-medium transition ${
                  active ? 'bg-cyan-50 text-cyan-800' : 'text-slate-600 hover:bg-slate-50 hover:text-ink'
                }`}
                onClick={() => {
                  onRouteChange(item.key);
                  setOpen(false);
                }}
                type="button"
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="min-w-0 flex-1 truncate">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
      <div className="border-t border-slate-200 p-4 text-xs text-slate-500">
        <div className="font-semibold text-slate-700">Demo tenant</div>
        <div>Northstar Manufacturing</div>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen bg-slatepanel text-ink">
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col">{sidebar}</div>
      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button className="absolute inset-0 bg-slate-950/30" onClick={() => setOpen(false)} type="button" aria-label="Close navigation" />
          <div className="absolute inset-y-0 left-0 w-80 max-w-[85vw]">{sidebar}</div>
        </div>
      ) : null}
      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="flex min-h-16 flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between md:px-6">
            <div className="flex items-center gap-3">
              <button className="rounded-md p-2 text-slate-600 hover:bg-slate-100 lg:hidden" onClick={() => setOpen(true)} type="button">
                <Menu className="h-5 w-5" />
              </button>
              <div>
                <div className="text-xs font-medium uppercase tracking-wider text-slate-500">Workspace</div>
                <h1 className="text-xl font-semibold tracking-normal text-ink">{current.label}</h1>
              </div>
            </div>
            <div className="flex flex-1 flex-col gap-2 md:max-w-3xl md:flex-row md:items-center md:justify-end">
              <label className="relative flex-1 md:max-w-md">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  className="h-9 w-full rounded-md border-slate-200 pl-9 text-sm focus:border-cyan-500 focus:ring-cyan-500"
                  placeholder="Search software, users, devices"
                  value={globalSearch}
                  onChange={(event) => setGlobalSearch(event.target.value)}
                />
                {globalSearch ? (
                  <button
                    className="absolute right-2 top-2 rounded p-0.5 text-slate-400 hover:text-slate-700"
                    onClick={() => setGlobalSearch('')}
                    type="button"
                  >
                    <X className="h-4 w-4" />
                  </button>
                ) : null}
              </label>
              <div className="flex gap-2">
                <button className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50" type="button">
                  <Filter className="h-4 w-4" />
                  Global filters
                  <ChevronDown className="h-4 w-4" />
                </button>
                <button className="inline-flex h-9 items-center gap-2 rounded-md bg-cyan-700 px-3 text-sm font-semibold text-white hover:bg-cyan-800" type="button">
                  <ClipboardCheck className="h-4 w-4" />
                  Audit pack
                </button>
              </div>
            </div>
          </div>
        </header>
        <main className="px-4 py-5 md:px-6">{children}</main>
      </div>
    </div>
  );
}
