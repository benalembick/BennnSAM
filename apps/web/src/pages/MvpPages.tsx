import {
  AlertTriangle,
  ArrowRight,
  Bot,
  CheckCircle2,
  CircleDollarSign,
  CloudCog,
  Cpu,
  Download,
  FileInput,
  FileText,
  Gauge,
  HardDrive,
  KeyRound,
  LibraryBig,
  PackageSearch,
  Play,
  RefreshCw,
  Save,
  ShieldAlert,
  Sparkles,
  Upload,
  Users
} from 'lucide-react';
import type React from 'react';
import { useEffect, useState } from 'react';
import { AssistantChart, SpendChart, UsageChart } from '../components/Charts';
import { DataTable, type Column } from '../components/DataTable';
import { Drawer } from '../components/Drawer';
import { ErrorState, LoadingState } from '../components/LoadingState';
import { MetricCard } from '../components/MetricCard';
import { StatusBadge } from '../components/StatusBadge';
import { apiGet, apiPost } from '../lib/api';
import { downloadCsv, readCsv } from '../lib/csv';
import { currency, date, number, titleCase } from '../lib/format';
import type {
  Application,
  AssistantReport,
  BootstrapData,
  ComplianceResult,
  CostRecord,
  CustomInventoryRule,
  Device,
  ExportWorkflow,
  Integration,
  Licence,
  NormalizationReview,
  Overview,
  ReportDefinition,
  SaaSDetection,
  SavingsRecommendation,
  UsageEvent
} from '../lib/types';

type UsagePayload = {
  events: UsageEvent[];
  underuse: Array<{ app: string; activeUsers: number; activeRatio: number; monthlyCost: number }>;
  zombieApps: Application[];
  heavyUsers: UsageEvent[];
  dormantApps: Application[];
  renewalRecommendations: SavingsRecommendation[];
};

type SaasPayload = {
  detections: SaaSDetection[];
  known: SaaSDetection[];
  unknown: SaaSDetection[];
  domains: Array<{ domain: string; application: string; approved: boolean }>;
};

type CostPayload = {
  records: CostRecord[];
  recommendations: SavingsRecommendation[];
  byVendor: Array<{ name: string; monthlyCost: number }>;
  byApp: Array<{ name: string; monthlyCost: number }>;
  byUser: Array<{ name: string; monthlyCost: number }>;
  byDevice: Array<{ name: string; monthlyCost: number }>;
  byDepartment: Array<{ name: string; monthlyCost: number }>;
};

type CompliancePayload = {
  results: ComplianceResult[];
  rules: Array<{ id: string; name: string; condition: string; weight: number; enabled: boolean }>;
  auditReady: number;
  evidenceExportRows: number;
};

type NormalizationPayload = {
  rawInventory: Array<{ id: string; rawName: string; source: string; firstSeen: string; lastSeen: string }>;
  reviewQueue: NormalizationReview[];
  rules: CustomInventoryRule[];
  normalizedApplications: Application[];
};

function useData<T>(path: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    apiGet<T>(path)
      .then((payload) => {
        if (!cancelled) setData(payload);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [path, version]);

  return { data, loading, error, refresh: () => setVersion((current) => current + 1) };
}

function Panel({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-ink">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-sm text-slate-500">{label}</div>
      <div className="mt-1 text-xl font-semibold text-ink">{value}</div>
    </div>
  );
}

function filterBySearch<T>(rows: T[], search: string) {
  const q = search.trim().toLowerCase();
  if (!q) return rows;
  return rows.filter((row) => JSON.stringify(row).toLowerCase().includes(q));
}

export function DashboardPage({ globalSearch }: { globalSearch: string }) {
  const { data, loading, error } = useData<Overview>('/overview');
  if (loading) return <LoadingState label="Loading dashboard" />;
  if (error || !data) return <ErrorState message={error ?? 'Dashboard unavailable'} />;

  const cardConfig = [
    ['totalSoftwareApplications', 'Total software applications', PackageSearch, '#inventory'],
    ['saasApplications', 'SaaS applications', LibraryBig, '#saas'],
    ['onPremApplications', 'On-prem applications', HardDrive, '#inventory'],
    ['totalDevices', 'Total devices', Cpu, '#devices'],
    ['totalUsers', 'Total users', Users, '#admin'],
    ['monthlySoftwareSpend', 'Monthly software spend', CircleDollarSign, '#costs'],
    ['potentialSavings', 'Potential savings', Sparkles, '#costs'],
    ['underusedLicences', 'Underused licences', Gauge, '#usage'],
    ['complianceRiskCount', 'Compliance risk count', ShieldAlert, '#compliance'],
    ['upcomingRenewals', 'Upcoming renewals', KeyRound, '#licences'],
    ['shadowSaasDetections', 'Shadow SaaS detections', AlertTriangle, '#saas']
  ] as const;

  const filteredRenewals = filterBySearch(data.renewalTimeline, globalSearch);

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-6">
        {cardConfig.map(([key, label, icon, href], index) => (
          <MetricCard
            key={key}
            label={label}
            value={data.cards[key] ?? 0}
            change={data.trends[index % data.trends.length]?.change}
            icon={icon}
            href={href}
            money={key.includes('Spend') || key.includes('Savings')}
          />
        ))}
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        <Panel title="Spend by Vendor">
          <SpendChart data={data.spendByVendor} />
        </Panel>
        <Panel title="Usage by Category">
          <UsageChart data={data.usageByCategory} />
        </Panel>
      </div>
      <DataTable
        title="Renewal Timeline"
        rows={filteredRenewals}
        filename="bennnsam-renewals.csv"
        columns={[
          { key: 'application', header: 'Application' },
          { key: 'vendor', header: 'Vendor' },
          { key: 'renewalDate', header: 'Renewal', render: (row) => date(row.renewalDate) },
          { key: 'days', header: 'Days' },
          { key: 'annualValue', header: 'Annual value', render: (row) => currency.format(row.annualValue) }
        ]}
      />
    </div>
  );
}

export function InventoryPage({ globalSearch }: { globalSearch: string }) {
  const { data, loading, error } = useData<Application[]>('/applications');
  const [type, setType] = useState('all');
  const [selected, setSelected] = useState<Application | null>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  if (loading) return <LoadingState label="Loading software inventory" />;
  if (error || !data) return <ErrorState message={error ?? 'Inventory unavailable'} />;

  const rows = filterBySearch(data, globalSearch).filter((row) => type === 'all' || row.type === type);
  const columns: Array<Column<Application>> = [
    { key: 'name', header: 'Application' },
    { key: 'vendor', header: 'Vendor' },
    { key: 'category', header: 'Category' },
    { key: 'type', header: 'Type' },
    { key: 'version', header: 'Version' },
    { key: 'edition', header: 'Edition' },
    { key: 'installCount', header: 'Installs' },
    { key: 'activeUsers', header: 'Active users' },
    { key: 'activeUsageMinutes', header: 'Active min', render: (row) => number.format(row.activeUsageMinutes) },
    { key: 'lastDetectedDate', header: 'Last detected', render: (row) => date(row.lastDetectedDate) },
    { key: 'licenceRequirement', header: 'Licence requirement' },
    { key: 'gdprRisk', header: 'Data risk', render: (row) => <StatusBadge value={row.gdprRisk ? 'high' : 'low'} /> },
    { key: 'eolDate', header: 'EOL', render: (row) => date(row.eolDate) },
    { key: 'owner', header: 'Owner', render: (row) => row.owner ?? <StatusBadge value="missing owner" /> }
  ];

  async function handleCsv(file: File) {
    const rows = await readCsv(file);
    const response = await apiPost<{ rowsReceived: number; importId: string }>('/imports/csv?dataset=raw_inventory_events', { rows });
    setImportStatus(`${response.rowsReceived} rows staged as ${response.importId}`);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-wrap gap-2">
          {['all', 'SaaS', 'desktop', 'server', 'cloud', 'AI tool', 'browser app'].map((item) => (
            <button
              className={`rounded-md border px-3 py-2 text-sm font-medium ${
                type === item ? 'border-cyan-600 bg-cyan-50 text-cyan-800' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
              key={item}
              onClick={() => setType(item)}
              type="button"
            >
              {item}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {['Executive view', 'EOL watchlist', 'Owner gaps', 'Renewal prep'].map((view) => (
            <span key={view} className="rounded-md bg-slate-100 px-3 py-2 text-sm font-medium text-slate-600">
              {view}
            </span>
          ))}
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-cyan-700 px-3 py-2 text-sm font-semibold text-white hover:bg-cyan-800">
            <Upload className="h-4 w-4" />
            Import CSV
            <input className="hidden" type="file" accept=".csv" onChange={(event) => event.target.files?.[0] && handleCsv(event.target.files[0])} />
          </label>
        </div>
      </div>
      {importStatus ? <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{importStatus}</div> : null}
      <DataTable title="Normalized Software Records" rows={rows} columns={columns} filename="bennnsam-software-inventory.csv" onRowClick={setSelected} />
      {selected ? (
        <Drawer title={selected.name} onClose={() => setSelected(null)}>
          <div className="grid gap-3 sm:grid-cols-2">
            <MiniStat label="Vendor" value={selected.vendor} />
            <MiniStat label="Monthly cost" value={currency.format(selected.monthlyCost)} />
            <MiniStat label="Total usage" value={`${number.format(selected.totalUsageMinutes)} min`} />
            <MiniStat label="Active usage" value={`${number.format(selected.activeUsageMinutes)} min`} />
          </div>
          <div className="mt-5 space-y-4 text-sm">
            <Detail label="Upgrade path" value={selected.upgradePath} />
            <Detail label="Downgrade path" value={selected.downgradePath} />
            <Detail label="Tags" value={selected.tags.join(', ')} />
            <Detail label="Business unit" value={selected.businessUnit} />
          </div>
        </Drawer>
      ) : null}
    </div>
  );
}

export function DevicesPage({ globalSearch }: { globalSearch: string }) {
  const { data, loading, error } = useData<Device[]>('/devices');
  const [uploadState, setUploadState] = useState<string | null>(null);
  if (loading) return <LoadingState label="Loading devices" />;
  if (error || !data) return <ErrorState message={error ?? 'Devices unavailable'} />;
  const rows = filterBySearch(data, globalSearch);

  async function uploadMockAgent() {
    const response = await apiPost<{ uploadId: string; message: string }>('/agent/upload', {
      hostname: 'BSAM-DEMO-UPLOAD',
      installedSoftware: ['Microsoft 365', 'Slack'],
      runningProcesses: ['outlook.exe', 'slack.exe'],
      browserEvents: ['slack.com', 'office.com']
    });
    setUploadState(`${response.uploadId}: ${response.message}`);
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-4">
        <MiniStat label="CSV ingestion" value="enabled" />
        <MiniStat label="API ingestion" value="enabled" />
        <MiniStat label="Mock agent uploads" value="enabled" />
        <MiniStat label="Endpoint monitoring" value="not included" />
      </div>
      <Panel
        title="Agent Data Ingestion"
        action={
          <button className="inline-flex items-center gap-2 rounded-md bg-cyan-700 px-3 py-2 text-sm font-semibold text-white hover:bg-cyan-800" onClick={uploadMockAgent} type="button">
            <FileInput className="h-4 w-4" />
            Mock upload
          </button>
        }
      >
        <div className="grid gap-3 md:grid-cols-3">
          {['installed software', 'running processes', 'browser/SaaS events', 'custom attributes', 'OS inventory', 'last check-in'].map((item) => (
            <div key={item} className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm font-medium text-slate-700">
              {item}
            </div>
          ))}
        </div>
        {uploadState ? <div className="mt-3 rounded-md bg-emerald-50 p-3 text-sm text-emerald-700">{uploadState}</div> : null}
      </Panel>
      <DataTable
        title="Device Inventory"
        rows={rows}
        filename="bennnsam-devices.csv"
        columns={[
          { key: 'hostname', header: 'Hostname' },
          { key: 'os', header: 'OS' },
          { key: 'osVersion', header: 'OS version' },
          { key: 'user', header: 'User' },
          { key: 'department', header: 'Department' },
          { key: 'lastCheckIn', header: 'Last check-in', render: (row) => date(row.lastCheckIn) },
          { key: 'cpuArchitecture', header: 'CPU' },
          { key: 'installedSoftware', header: 'Installed software', render: (row) => row.installedSoftware.join(', ') },
          { key: 'runningProcesses', header: 'Processes', render: (row) => row.runningProcesses.join(', ') },
          { key: 'browserSaasUsageEvents', header: 'Browser/SaaS events', render: (row) => row.browserSaasUsageEvents.join(', ') }
        ]}
      />
    </div>
  );
}

export function UsagePage({ globalSearch }: { globalSearch: string }) {
  const { data, loading, error } = useData<UsagePayload>('/usage');
  if (loading) return <LoadingState label="Loading usage analytics" />;
  if (error || !data) return <ErrorState message={error ?? 'Usage unavailable'} />;
  const events = filterBySearch(data.events, globalSearch);

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-4">
        <MiniStat label="Underuse candidates" value={data.underuse.length} />
        <MiniStat label="Zombie apps" value={data.zombieApps.length} />
        <MiniStat label="Heavy users" value={data.heavyUsers.length} />
        <MiniStat label="Renewal recommendations" value={data.renewalRecommendations.length} />
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        <DataTable
          title="Underuse"
          rows={data.underuse}
          filename="bennnsam-underuse.csv"
          columns={[
            { key: 'app', header: 'Application' },
            { key: 'activeUsers', header: 'Active users' },
            { key: 'activeRatio', header: 'Active ratio', render: (row) => `${row.activeRatio}%` },
            { key: 'monthlyCost', header: 'Monthly cost', render: (row) => currency.format(row.monthlyCost) }
          ]}
        />
        <DataTable
          title="Renewal Recommendations"
          rows={data.renewalRecommendations}
          filename="bennnsam-renewal-recommendations.csv"
          columns={[
            { key: 'applicationName', header: 'Application' },
            { key: 'type', header: 'Recommendation' },
            { key: 'department', header: 'Department' },
            { key: 'estimatedAnnualSavings', header: 'Savings', render: (row) => currency.format(row.estimatedAnnualSavings) },
            { key: 'status', header: 'Status', render: (row) => <StatusBadge value={row.status} /> }
          ]}
        />
      </div>
      <DataTable
        title="Usage Events"
        rows={events}
        filename="bennnsam-usage-events.csv"
        columns={[
          { key: 'appName', header: 'Application' },
          { key: 'userName', header: 'User' },
          { key: 'deviceId', header: 'Device' },
          { key: 'eventType', header: 'Event' },
          { key: 'activeMinutes', header: 'Active minutes' },
          { key: 'totalMinutes', header: 'Total minutes' },
          { key: 'source', header: 'Source' },
          { key: 'startedAt', header: 'Started', render: (row) => date(row.startedAt) }
        ]}
      />
    </div>
  );
}

export function SaasPage({ globalSearch }: { globalSearch: string }) {
  const { data, loading, error } = useData<SaasPayload>('/saas');
  if (loading) return <LoadingState label="Loading SaaS discovery" />;
  if (error || !data) return <ErrorState message={error ?? 'SaaS discovery unavailable'} />;
  const rows = filterBySearch(data.detections, globalSearch);

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-4">
        <MiniStat label="Known SaaS apps" value={data.known.length} />
        <MiniStat label="Unknown SaaS apps" value={data.unknown.length} />
        <MiniStat label="Detected domains" value={data.domains.length} />
        <MiniStat label="Monthly SaaS cost" value={currency.format(data.detections.reduce((sum, item) => sum + item.monthlyCost, 0))} />
      </div>
      <DataTable
        title="SaaS Detections"
        rows={rows}
        filename="bennnsam-saas-discovery.csv"
        columns={[
          { key: 'saasAppName', header: 'SaaS app' },
          { key: 'domain', header: 'Domain' },
          { key: 'vendor', header: 'Vendor' },
          { key: 'category', header: 'Category' },
          { key: 'detectedUsers', header: 'Detected users' },
          { key: 'assignedUsers', header: 'Assigned users' },
          { key: 'paidSeats', header: 'Paid seats' },
          { key: 'activeUsers', header: 'Active users' },
          { key: 'inactiveUsers', header: 'Inactive users' },
          { key: 'monthlyCost', header: 'Monthly cost', render: (row) => currency.format(row.monthlyCost) },
          { key: 'riskRating', header: 'Risk', render: (row) => <StatusBadge value={row.riskRating} /> },
          { key: 'approved', header: 'Approval', render: (row) => <StatusBadge value={row.approved ? 'approved' : 'shadow'} /> },
          { key: 'source', header: 'Source' }
        ]}
      />
    </div>
  );
}

export function LicencesPage({ globalSearch }: { globalSearch: string }) {
  const { data, loading, error } = useData<Licence[]>('/licences');
  const [selectedRule, setSelectedRule] = useState('');
  if (loading) return <LoadingState label="Loading licence data" />;
  if (error || !data) return <ErrorState message={error ?? 'Licences unavailable'} />;
  const rows = filterBySearch(data, globalSearch);

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-3">
        <MiniStat label="Over-licensed" value={data.filter((item) => item.complianceStatus === 'over-licensed').length} />
        <MiniStat label="Under-licensed" value={data.filter((item) => item.complianceStatus === 'under-licensed').length} />
        <MiniStat label="Adequately licensed" value={data.filter((item) => item.complianceStatus === 'adequately licensed').length} />
      </div>
      <DataTable
        title="Licence Entitlements"
        rows={rows}
        filename="bennnsam-licences.csv"
        columns={[
          { key: 'applicationName', header: 'Application' },
          { key: 'vendor', header: 'Vendor' },
          { key: 'contractName', header: 'Contract' },
          { key: 'sku', header: 'SKU' },
          { key: 'licenceMetric', header: 'Metric' },
          { key: 'purchasedQuantity', header: 'Purchased' },
          { key: 'assignedQuantity', header: 'Assigned' },
          { key: 'consumedQuantity', header: 'Consumed' },
          { key: 'complianceStatus', header: 'Compliance', render: (row) => <StatusBadge value={row.complianceStatus} /> },
          { key: 'renewalDate', header: 'Renewal', render: (row) => date(row.renewalDate) },
          { key: 'costPerLicence', header: 'Unit cost', render: (row) => currency.format(row.costPerLicence) }
        ]}
      />
      <Panel title="Editable Compliance Rule">
        <select
          className="mb-3 rounded-md border-slate-200 text-sm focus:border-cyan-500 focus:ring-cyan-500"
          value={selectedRule}
          onChange={(event) => setSelectedRule(event.target.value)}
        >
          <option value="">Select application rule</option>
          {data.map((item) => (
            <option value={item.rule} key={item.id}>
              {item.applicationName}
            </option>
          ))}
        </select>
        <textarea
          className="min-h-24 w-full rounded-md border-slate-200 text-sm focus:border-cyan-500 focus:ring-cyan-500"
          value={selectedRule}
          onChange={(event) => setSelectedRule(event.target.value)}
        />
        <button className="mt-3 inline-flex items-center gap-2 rounded-md bg-cyan-700 px-3 py-2 text-sm font-semibold text-white hover:bg-cyan-800" type="button">
          <Save className="h-4 w-4" />
          Save rule draft
        </button>
      </Panel>
    </div>
  );
}

export function CostPage({ globalSearch }: { globalSearch: string }) {
  const { data, loading, error } = useData<CostPayload>('/costs');
  if (loading) return <LoadingState label="Loading cost centre" />;
  if (error || !data) return <ErrorState message={error ?? 'Cost data unavailable'} />;
  const rows = filterBySearch(data.records, globalSearch);

  return (
    <div className="space-y-5">
      <div className="grid gap-5 xl:grid-cols-2">
        <Panel title="Cost by Vendor">
          <SpendChart data={data.byVendor.map((item) => ({ vendor: item.name, spend: item.monthlyCost }))} />
        </Panel>
        <DataTable
          title="Savings Recommendations"
          rows={data.recommendations}
          filename="bennnsam-savings.csv"
          columns={[
            { key: 'type', header: 'Type' },
            { key: 'applicationName', header: 'Application' },
            { key: 'department', header: 'Department' },
            { key: 'estimatedAnnualSavings', header: 'Annual savings', render: (row) => currency.format(row.estimatedAnnualSavings) },
            { key: 'status', header: 'Status', render: (row) => <StatusBadge value={row.status} /> }
          ]}
        />
      </div>
      <DataTable
        title="Cost Allocation"
        rows={rows}
        filename="bennnsam-cost-allocation.csv"
        columns={[
          { key: 'applicationName', header: 'Application' },
          { key: 'vendor', header: 'Vendor' },
          { key: 'department', header: 'Department' },
          { key: 'businessUnit', header: 'Business unit' },
          { key: 'userName', header: 'User' },
          { key: 'deviceName', header: 'Device' },
          { key: 'monthlyCost', header: 'Monthly cost', render: (row) => currency.format(row.monthlyCost) },
          { key: 'allocationMethod', header: 'Allocation' },
          { key: 'negotiatedPrice', header: 'Negotiated price', render: (row) => (row.negotiatedPrice ? currency.format(row.negotiatedPrice) : 'Manual') }
        ]}
      />
    </div>
  );
}

export function CompliancePage({ globalSearch }: { globalSearch: string }) {
  const { data, loading, error } = useData<CompliancePayload>('/compliance');
  if (loading) return <LoadingState label="Loading compliance hub" />;
  if (error || !data) return <ErrorState message={error ?? 'Compliance unavailable'} />;
  const rows = filterBySearch(data.results, globalSearch);

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-4">
        <MiniStat label="Audit-ready findings" value={data.auditReady} />
        <MiniStat label="Evidence export rows" value={data.evidenceExportRows} />
        <MiniStat label="Configurable rules" value={data.rules.length} />
        <MiniStat label="Critical findings" value={data.results.filter((item) => item.severity === 'critical').length} />
      </div>
      <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <DataTable
          title="Compliance Findings"
          rows={rows}
          filename="bennnsam-compliance.csv"
          columns={[
            { key: 'finding', header: 'Finding' },
            { key: 'applicationName', header: 'Application' },
            { key: 'category', header: 'Category' },
            { key: 'severity', header: 'Severity', render: (row) => <StatusBadge value={row.severity} /> },
            { key: 'riskScore', header: 'Risk score' },
            { key: 'owner', header: 'Owner', render: (row) => row.owner ?? 'Unassigned' },
            { key: 'dueDate', header: 'Due', render: (row) => date(row.dueDate) }
          ]}
        />
        <Panel title="Risk Rules">
          <div className="space-y-3">
            {data.rules.map((rule) => (
              <div key={rule.id} className="rounded-md border border-slate-200 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-medium text-ink">{rule.name}</div>
                  <StatusBadge value={rule.enabled ? 'approved' : 'not connected'} />
                </div>
                <div className="mt-2 text-sm text-slate-500">{rule.condition}</div>
                <div className="mt-2 text-xs font-semibold text-slate-600">Weight {rule.weight}</div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

export function HardwarePage({ globalSearch }: { globalSearch: string }) {
  const { data, loading, error } = useData<Device[]>('/hardware');
  if (loading) return <LoadingState label="Loading hardware assets" />;
  if (error || !data) return <ErrorState message={error ?? 'Hardware unavailable'} />;
  const rows = filterBySearch(data, globalSearch);

  return (
    <DataTable
      title="Hardware Inventory"
      rows={rows}
      filename="bennnsam-hardware.csv"
      columns={[
        { key: 'hostname', header: 'Device name' },
        { key: 'serialNumber', header: 'Serial number' },
        { key: 'assetTag', header: 'Asset tag' },
        { key: 'user', header: 'User' },
        { key: 'department', header: 'Department' },
        { key: 'location', header: 'Location' },
        { key: 'warrantyDate', header: 'Warranty', render: (row) => date(row.warrantyDate) },
        { key: 'lifecycleStatus', header: 'Lifecycle', render: (row) => <StatusBadge value={row.lifecycleStatus} /> },
        { key: 'installedSoftware', header: 'Linked installed software', render: (row) => row.installedSoftware.join(', ') },
        { key: 'lastCheckIn', header: 'Last seen', render: (row) => date(row.lastCheckIn) },
        { key: 'costCentre', header: 'Cost centre' },
        { key: 'notes', header: 'Notes' }
      ]}
    />
  );
}

export function IntegrationsPage({ globalSearch }: { globalSearch: string }) {
  const { data, loading, error, refresh } = useData<Integration[]>('/integrations');
  const [syncing, setSyncing] = useState<string | null>(null);
  if (loading) return <LoadingState label="Loading integrations" />;
  if (error || !data) return <ErrorState message={error ?? 'Integrations unavailable'} />;
  const rows = filterBySearch(data, globalSearch);

  async function sync(id: string) {
    setSyncing(id);
    await apiPost(`/integrations/${id}/sync`, {});
    setSyncing(null);
    refresh();
  }

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {rows.map((integration) => (
        <section key={integration.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-semibold text-ink">{integration.name}</h2>
              <div className="mt-1 text-sm text-slate-500">{integration.category}</div>
            </div>
            <StatusBadge value={integration.connectionStatus} />
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <MiniStat label="Enabled" value={integration.enabled ? 'yes' : 'no'} />
            <MiniStat label="Last sync" value={date(integration.lastSync)} />
            <MiniStat label="Mappings" value={integration.mapping.length} />
          </div>
          <div className="mt-4 rounded-md border border-slate-200">
            {integration.mapping.map((field) => (
              <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2 text-sm last:border-b-0" key={`${field.source}-${field.target}`}>
                <span className="font-medium text-slate-700">{field.source}</span>
                <ArrowRight className="h-4 w-4 text-slate-400" />
                <span className="text-slate-600">{field.target}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              className="inline-flex items-center gap-2 rounded-md bg-cyan-700 px-3 py-2 text-sm font-semibold text-white hover:bg-cyan-800 disabled:opacity-60"
              onClick={() => sync(integration.id)}
              type="button"
              disabled={syncing === integration.id}
            >
              <RefreshCw className={`h-4 w-4 ${syncing === integration.id ? 'animate-spin' : ''}`} />
              Manual sync
            </button>
            <button className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50" type="button">
              <CloudCog className="h-4 w-4" />
              Field mapping
            </button>
          </div>
        </section>
      ))}
    </div>
  );
}

export function ExportsPage({ globalSearch }: { globalSearch: string }) {
  const { data, loading, error, refresh } = useData<ExportWorkflow[]>('/export-workflows');
  const [form, setForm] = useState({ name: 'Application owners to webhook', sourceDataset: 'applications', destination: 'webhook', schedule: 'manual' });
  if (loading) return <LoadingState label="Loading export workflows" />;
  if (error || !data) return <ErrorState message={error ?? 'Export workflows unavailable'} />;
  const rows = filterBySearch(data, globalSearch);

  async function createWorkflow() {
    await apiPost('/export-workflows', {
      ...form,
      filters: 'owner is not null',
      mappedFields: [
        { source: 'name', destination: 'application_name' },
        { source: 'owner', destination: 'owner' }
      ]
    });
    refresh();
  }

  async function runWorkflow(id: string) {
    await apiPost(`/export-workflows/${id}/run`, {});
    refresh();
  }

  return (
    <div className="space-y-5">
      <Panel title="No-code Export Builder">
        <div className="grid gap-3 md:grid-cols-4">
          <input className="rounded-md border-slate-200 text-sm focus:border-cyan-500 focus:ring-cyan-500" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
          <select className="rounded-md border-slate-200 text-sm focus:border-cyan-500 focus:ring-cyan-500" value={form.sourceDataset} onChange={(event) => setForm({ ...form, sourceDataset: event.target.value })}>
            {['applications', 'devices', 'licences', 'saas_detections', 'compliance_results'].map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
          <select className="rounded-md border-slate-200 text-sm focus:border-cyan-500 focus:ring-cyan-500" value={form.destination} onChange={(event) => setForm({ ...form, destination: event.target.value })}>
            {['webhook', 'CSV', 'REST API', 'Supabase table', 'ServiceNow mock endpoint'].map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
          <button className="inline-flex items-center justify-center gap-2 rounded-md bg-cyan-700 px-3 py-2 text-sm font-semibold text-white hover:bg-cyan-800" onClick={createWorkflow} type="button">
            <Save className="h-4 w-4" />
            Save workflow
          </button>
        </div>
      </Panel>
      <div className="grid gap-4 xl:grid-cols-2">
        {rows.map((flow) => (
          <section key={flow.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold text-ink">{flow.name}</h2>
                <div className="mt-1 text-sm text-slate-500">{flow.sourceDataset} to {flow.destination}</div>
              </div>
              <StatusBadge value={flow.enabled ? 'approved' : 'not connected'} />
            </div>
            <div className="mt-4 text-sm text-slate-600">{flow.filters}</div>
            <div className="mt-4 space-y-2">
              {flow.mappedFields.map((field) => (
                <div key={`${field.source}-${field.destination}`} className="flex items-center gap-2 rounded-md bg-slate-50 px-3 py-2 text-sm">
                  <span className="font-medium">{field.source}</span>
                  <ArrowRight className="h-4 w-4 text-slate-400" />
                  <span>{field.destination}</span>
                </div>
              ))}
            </div>
            <button className="mt-4 inline-flex items-center gap-2 rounded-md bg-cyan-700 px-3 py-2 text-sm font-semibold text-white hover:bg-cyan-800" onClick={() => runWorkflow(flow.id)} type="button">
              <Play className="h-4 w-4" />
              Run now
            </button>
          </section>
        ))}
      </div>
    </div>
  );
}

export function AssistantPage() {
  const [prompt, setPrompt] = useState('Show unused licences over $10,000');
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([
    { role: 'assistant', content: 'BennnSam reporting assistant ready.' }
  ]);
  const [report, setReport] = useState<AssistantReport | null>(null);
  const [loading, setLoading] = useState(false);

  const examples = [
    'Show unused licences over $10,000',
    'Which SaaS apps are used but not approved?',
    'Which renewals are due in the next 90 days?',
    'Which users have expensive licences but low active usage?'
  ];

  async function submit(nextPrompt = prompt) {
    setLoading(true);
    setMessages((current) => [...current, { role: 'user', content: nextPrompt }]);
    const response = await apiPost<AssistantReport>('/assistant/query', { prompt: nextPrompt });
    setReport(response);
    setMessages((current) => [...current, { role: 'assistant', content: response.summary }]);
    setPrompt(nextPrompt);
    setLoading(false);
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[360px_1fr]">
      <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-4">
          <h2 className="font-semibold text-ink">Chat</h2>
        </div>
        <div className="h-[440px] space-y-3 overflow-y-auto p-4 scrollbar-thin">
          {messages.map((message, index) => (
            <div key={`${message.role}-${index}`} className={`rounded-lg p-3 text-sm ${message.role === 'assistant' ? 'bg-slate-100 text-slate-700' : 'bg-cyan-700 text-white'}`}>
              {message.content}
            </div>
          ))}
        </div>
        <div className="border-t border-slate-200 p-4">
          <textarea className="min-h-24 w-full rounded-md border-slate-200 text-sm focus:border-cyan-500 focus:ring-cyan-500" value={prompt} onChange={(event) => setPrompt(event.target.value)} />
          <button className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-md bg-cyan-700 px-3 py-2 text-sm font-semibold text-white hover:bg-cyan-800 disabled:opacity-60" onClick={() => submit()} disabled={loading} type="button">
            <Bot className="h-4 w-4" />
            Run report
          </button>
        </div>
      </section>
      <div className="space-y-5">
        <div className="grid gap-2 md:grid-cols-2">
          {examples.map((example) => (
            <button key={example} className="rounded-lg border border-slate-200 bg-white p-3 text-left text-sm font-medium text-slate-700 shadow-sm hover:border-cyan-300 hover:bg-cyan-50" onClick={() => submit(example)} type="button">
              {example}
            </button>
          ))}
        </div>
        {report ? (
          <Panel
            title={report.title}
            action={
              <button className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50" onClick={() => downloadCsv('bennnsam-ai-report.csv', report.rows)} type="button">
                <Download className="h-4 w-4" />
                Export
              </button>
            }
          >
            <p className="mb-3 text-sm text-slate-600">{report.summary}</p>
            <div className="mb-4 rounded-md bg-slate-50 p-3 font-mono text-xs text-slate-600">{report.queryTemplate}</div>
            <AssistantChart rows={report.rows} />
            <DataTable title="Generated Report" rows={report.rows} columns={columnsFromRows(report.rows)} filename="bennnsam-generated-report.csv" />
          </Panel>
        ) : (
          <Panel title="Generated Report">
            <div className="flex h-64 items-center justify-center text-sm text-slate-500">No report run yet.</div>
          </Panel>
        )}
      </div>
    </div>
  );
}

export function RulesPage({ globalSearch }: { globalSearch: string }) {
  const { data, loading, error } = useData<CustomInventoryRule[]>('/rules');
  const [ruleValue, setRuleValue] = useState('acad.exe');
  const [sample, setSample] = useState('Process list: code.exe, acad.exe, slack.exe');
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  if (loading) return <LoadingState label="Loading inventory rules" />;
  if (error || !data) return <ErrorState message={error ?? 'Rules unavailable'} />;
  const rows = filterBySearch(data, globalSearch);

  async function testRule() {
    const response = await apiPost<Record<string, unknown>>('/rules/test', { matchValue: ruleValue, sample });
    setResult(response);
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-5 xl:grid-cols-[1fr_420px]">
        <DataTable
          title="Recognition Rules"
          rows={rows}
          filename="bennnsam-rules.csv"
          columns={[
            { key: 'name', header: 'Rule' },
            { key: 'matchType', header: 'Match type' },
            { key: 'matchValue', header: 'Match value' },
            { key: 'normalizedApplication', header: 'Application' },
            { key: 'edition', header: 'Edition' },
            { key: 'classification', header: 'Classification' },
            { key: 'confidence', header: 'Confidence', render: (row) => `${row.confidence}%` },
            { key: 'enabled', header: 'Enabled', render: (row) => <StatusBadge value={row.enabled ? 'approved' : 'not connected'} /> }
          ]}
        />
        <Panel title="Test Rule">
          <label className="mb-2 block text-sm font-medium text-slate-700">Match value</label>
          <input className="mb-3 w-full rounded-md border-slate-200 text-sm focus:border-cyan-500 focus:ring-cyan-500" value={ruleValue} onChange={(event) => setRuleValue(event.target.value)} />
          <label className="mb-2 block text-sm font-medium text-slate-700">Sample inventory data</label>
          <textarea className="min-h-32 w-full rounded-md border-slate-200 text-sm focus:border-cyan-500 focus:ring-cyan-500" value={sample} onChange={(event) => setSample(event.target.value)} />
          <button className="mt-3 inline-flex items-center gap-2 rounded-md bg-cyan-700 px-3 py-2 text-sm font-semibold text-white hover:bg-cyan-800" onClick={testRule} type="button">
            <Play className="h-4 w-4" />
            Run test
          </button>
          {result ? <pre className="mt-4 overflow-auto rounded-md bg-slate-950 p-3 text-xs text-white">{JSON.stringify(result, null, 2)}</pre> : null}
        </Panel>
      </div>
    </div>
  );
}

export function NormalizationPage({ globalSearch }: { globalSearch: string }) {
  const { data, loading, error } = useData<NormalizationPayload>('/normalization');
  if (loading) return <LoadingState label="Loading normalization engine" />;
  if (error || !data) return <ErrorState message={error ?? 'Normalization unavailable'} />;
  const queue = filterBySearch(data.reviewQueue, globalSearch);

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-4">
        <MiniStat label="Raw inventory rows" value={data.rawInventory.length} />
        <MiniStat label="Recognition rules" value={data.rules.length} />
        <MiniStat label="Review queue" value={data.reviewQueue.length} />
        <MiniStat label="Normalized apps" value={data.normalizedApplications.length} />
      </div>
      <DataTable
        title="Analyst Review Queue"
        rows={queue}
        filename="bennnsam-normalization-queue.csv"
        columns={[
          { key: 'rawName', header: 'Raw name' },
          { key: 'suggestedApplication', header: 'Suggestion' },
          { key: 'vendorSuggestion', header: 'Vendor' },
          { key: 'confidenceScore', header: 'Confidence', render: (row) => `${row.confidenceScore}%` },
          { key: 'duplicateCandidates', header: 'Duplicates', render: (row) => row.duplicateCandidates.join(', ') },
          { key: 'status', header: 'Status', render: (row) => <StatusBadge value={row.status} /> },
          { key: 'analyst', header: 'Analyst', render: (row) => row.analyst ?? 'Unassigned' }
        ]}
      />
      <Panel title="Normalization Pipeline">
        <div className="grid gap-3 md:grid-cols-5">
          {['Raw inventory', 'Recognition rules', 'Confidence score', 'Review queue', 'Analyst approval'].map((stage, index) => (
            <div key={stage} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="text-xs font-semibold text-cyan-700">Step {index + 1}</div>
              <div className="mt-2 font-medium text-ink">{stage}</div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {['Merge records', 'Split application', 'Vendor override', 'Duplicate scan'].map((action) => (
            <button key={action} className="rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50" type="button">
              {action}
            </button>
          ))}
        </div>
      </Panel>
    </div>
  );
}

export function ReportsPage({ globalSearch }: { globalSearch: string }) {
  const { data, loading, error } = useData<ReportDefinition[]>('/reports');
  const [run, setRun] = useState<{ report: ReportDefinition; rows: Array<Record<string, unknown>>; ranAt: string } | null>(null);
  if (loading) return <LoadingState label="Loading reports" />;
  if (error || !data) return <ErrorState message={error ?? 'Reports unavailable'} />;
  const rows = filterBySearch(data, globalSearch);

  async function runReport(reportId: string) {
    const response = await apiPost<{ report: ReportDefinition; rows: Array<Record<string, unknown>>; ranAt: string }>('/reports/run', { reportId });
    setRun(response);
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-4 xl:grid-cols-2">
        {rows.map((report) => (
          <section key={report.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold text-ink">{report.name}</h2>
                <p className="mt-1 text-sm text-slate-500">{report.description}</p>
              </div>
              <FileText className="h-5 w-5 text-cyan-700" />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {report.filters.map((filter) => (
                <span key={filter} className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                  {filter}
                </span>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm text-slate-500">{report.savedConfigurations} saved configurations</span>
              <button className="inline-flex items-center gap-2 rounded-md bg-cyan-700 px-3 py-2 text-sm font-semibold text-white hover:bg-cyan-800" onClick={() => runReport(report.id)} type="button">
                <Play className="h-4 w-4" />
                Run
              </button>
            </div>
          </section>
        ))}
      </div>
      {run ? (
        <DataTable title={`${run.report.name} Run`} rows={run.rows} columns={columnsFromRows(run.rows)} filename="bennnsam-report-run.csv" />
      ) : null}
    </div>
  );
}

export function AdminPage({ globalSearch }: { globalSearch: string }) {
  const { data, loading, error } = useData<BootstrapData>('/bootstrap');
  if (loading) return <LoadingState label="Loading roles" />;
  if (error || !data) return <ErrorState message={error ?? 'Admin unavailable'} />;
  const users = filterBySearch(data.users, globalSearch);
  const roles = ['Platform Admin', 'SAM Manager', 'Licence Manager', 'Security Viewer', 'Finance Viewer', 'Department Owner', 'Read Only'];

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-3">
        <MiniStat label="Demo login" value="ava.collins@demo.bennnsam.local" />
        <MiniStat label="Tenant isolation" value="RLS ready" />
        <MiniStat label="Roles" value={roles.length} />
      </div>
      <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <DataTable
          title="Users and Profiles"
          rows={users}
          filename="bennnsam-users.csv"
          columns={[
            { key: 'name', header: 'Name' },
            { key: 'email', header: 'Email' },
            { key: 'role', header: 'Role' },
            { key: 'department', header: 'Department' }
          ]}
        />
        <Panel title="Permission Roles">
          <div className="space-y-2">
            {roles.map((role) => (
              <div key={role} className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2">
                <span className="text-sm font-medium text-slate-700">{role}</span>
                {role.includes('Viewer') || role === 'Read Only' ? <StatusBadge value="low" /> : <StatusBadge value="approved" />}
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</div>
      <div className="mt-1 text-slate-700">{value}</div>
    </div>
  );
}

function columnsFromRows<T extends Record<string, unknown>>(rows: T[]): Array<Column<T>> {
  const first = rows[0];
  if (!first) return [];
  return Object.keys(first).slice(0, 8).map((key) => ({
    key,
    header: titleCase(key),
    render: (row) => {
      const value = row[key];
      if (typeof value === 'boolean') return value ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <AlertTriangle className="h-4 w-4 text-amber-600" />;
      if (typeof value === 'number' && key.toLowerCase().includes('cost')) return currency.format(value);
      return String(value ?? '');
    }
  }));
}
