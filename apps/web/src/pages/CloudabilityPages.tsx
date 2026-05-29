import {
  CheckCircle2,
  CircleDollarSign,
  Download,
  FileBarChart,
  Gauge,
  LineChart as LineChartIcon,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
  WalletCards
} from 'lucide-react';
import type React from 'react';
import { useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { DataTable, type Column } from '../components/DataTable';
import { ErrorState, LoadingState } from '../components/LoadingState';
import { MetricCard } from '../components/MetricCard';
import { StatusBadge } from '../components/StatusBadge';
import { Badge, Button, ChartCard, PageHeader, cardSurface } from '../components/ui';
import { apiGet, apiPost } from '../lib/api';
import { downloadCsv } from '../lib/csv';
import type { CloudabilityPayload } from '../lib/cloudabilityData';
import type { CloudabilityPageKey } from '../lib/cloudabilityNav';
import { currency, date, number } from '../lib/format';

const palette = ['#0891b2', '#0f766e', '#4f46e5', '#16a34a', '#d97706', '#e11d48', '#64748b'];
const axisTick = { fill: '#64748b', fontSize: 11, fontWeight: 600 };
const tooltipStyle = {
  border: '1px solid #e2e8f0',
  borderRadius: '8px',
  boxShadow: '0 18px 45px rgba(15, 23, 42, 0.12)',
  color: '#0f172a',
  fontSize: '12px'
};

function useCloudabilityData() {
  const [data, setData] = useState<CloudabilityPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    apiGet<CloudabilityPayload>('/cloudability')
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
  }, [version]);

  return { data, loading, error, refresh: () => setVersion((current) => current + 1) };
}

export function CloudabilityRouter({ page, globalSearch }: { page: CloudabilityPageKey; globalSearch: string }) {
  const { data, loading, error, refresh } = useCloudabilityData();
  if (loading) return <LoadingState label="Loading BennnCloudability" />;
  if (error || !data) return <ErrorState message={error ?? 'BennnCloudability unavailable'} />;

  const props = { data, globalSearch, refresh };
  switch (page) {
    case 'cloudability-cost-explorer':
      return <CostExplorerPage {...props} />;
    case 'cloudability-inventory':
      return <CloudInventoryPage {...props} />;
    case 'cloudability-rightsizing':
      return <RightsizingPage {...props} />;
    case 'cloudability-optimisation':
      return <OptimisationPage {...props} />;
    case 'cloudability-budgets':
      return <BudgetsPage {...props} />;
    case 'cloudability-anomalies':
      return <AnomalyPage {...props} />;
    case 'cloudability-allocation':
      return <AllocationPage {...props} />;
    case 'cloudability-chargeback':
      return <ChargebackPage {...props} />;
    case 'cloudability-connectors':
      return <ConnectorsPage {...props} />;
    case 'cloudability-reports':
      return <CloudReportsPage {...props} />;
    case 'cloudability-admin':
      return <CloudAdminPage {...props} />;
    default:
      return <ExecutiveDashboardPage {...props} />;
  }
}

function ModuleFrame({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <section className="overflow-hidden rounded-lg border border-slate-900/10 bg-slate-950 text-white shadow-panel">
        <div className="grid gap-4 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.24),transparent_34%),linear-gradient(135deg,#0f172a_0%,#155e75_54%,#064e3b_100%)] p-4 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-cyan-100">Separate BennnSAM module</div>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">BennnCloudability</h1>
            <p className="mt-1 max-w-3xl text-sm text-cyan-50">
              Multi-cloud FinOps, cloud cost management and optimisation. This area reports cloud billing and resource data separately from BennnSAM agent-based SAM inventory.
            </p>
          </div>
          {action}
        </div>
      </section>
      {children}
    </div>
  );
}

function ExecutiveDashboardPage({ data }: PageProps) {
  const providerData = data.providers.map((provider) => ({ name: provider.code, value: provider.monthlySpend }));
  const byService = aggregate(data.billingRecords, 'service', 'cost');
  const byTeam = aggregate(data.billingRecords, 'team', 'cost');
  const byApp = aggregate(data.billingRecords, 'application', 'cost');
  const topIncreases = [
    { item: 'BigQuery finance-mart', driver: 'Backfill workload', increase: 1710 },
    { item: 'Azure Sentinel', driver: 'Duplicated firewall logs', increase: 890 },
    { item: 'AWS NAT Gateway', driver: 'Cross-AZ processing', increase: 460 }
  ];

  return (
    <ModuleFrame action={<Button icon={RefreshCw} onClick={() => window.location.hash = 'cloudability-connectors'} type="button">Cloud sync</Button>}>
      <PageHeader
        eyebrow="Executive dashboard"
        title="Cloud financial control centre"
        description="Cross-provider spend, forecast, allocation quality, savings pipeline and active anomalies."
      />
      <div className="grid gap-3 min-[520px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <MetricCard label="Total cloud spend" value={data.summary.totalSpend} change={7.4} icon={CircleDollarSign} money />
        <MetricCard label="Month-to-date spend" value={data.summary.monthToDateSpend} change={5.9} icon={TrendingUp} money />
        <MetricCard label="Forecast month-end" value={data.summary.forecastMonthEndSpend} change={8.1} icon={LineChartIcon} money />
        <MetricCard label="Budget variance" value={Math.abs(data.summary.budgetVariance)} change={data.summary.budgetVariance >= 0 ? 6.2 : -3.1} icon={WalletCards} money />
        <MetricCard label="Identified savings" value={data.summary.identifiedSavings} change={12.4} icon={Gauge} money />
        <MetricCard label="Realised savings" value={data.summary.realisedSavings} change={4.5} icon={CheckCircle2} money />
      </div>
      <div className="grid gap-4 xl:grid-cols-[1fr_1fr_420px]">
        <ChartCard title="Spend by provider" insight="Normalised cloud cost model across AWS, Azure, GCP and OCI">
          <ProviderPie data={providerData} />
        </ChartCard>
        <ChartCard title="Spend trend" insight="Weekly run-rate with a GCP anomaly spike">
          <SpendTrendChart data={data.dailySpend} />
        </ChartCard>
        <section className={`${cardSurface} rounded-lg p-4`}>
          <h2 className="text-sm font-semibold text-slate-950">Module boundary</h2>
          <p className="mt-2 text-sm text-slate-600">
            BennnCloudability uses cloud billing, usage and resource telemetry. It does not infer cloud spend from endpoint agents or software recognition records.
          </p>
          <div className="mt-4 grid gap-2">
            {data.permissions.map((permission) => <Badge key={permission} tone="brand">{permission}</Badge>)}
          </div>
        </section>
      </div>
      <div className="grid gap-4 xl:grid-cols-3">
        <ChartCard title="Spend by service"><SimpleBar data={byService} /></ChartCard>
        <ChartCard title="Spend by team"><SimpleBar data={byTeam} /></ChartCard>
        <ChartCard title="Spend by application"><SimpleBar data={byApp} /></ChartCard>
      </div>
      <div className="grid gap-4 xl:grid-cols-3">
        <DataTable title="Top cost increases" rows={topIncreases} filename="bennncloudability-cost-increases.csv" columns={[
          { key: 'item', header: 'Item' },
          { key: 'driver', header: 'Driver' },
          { key: 'increase', header: 'Increase', render: (row) => currency.format(row.increase) }
        ]} />
        <DataTable title="Top optimisation opportunities" rows={data.optimisationOpportunities.slice(0, 5)} filename="bennncloudability-opportunities.csv" columns={opportunityColumns()} />
        <DataTable title="Recent anomalies" rows={data.anomalies} filename="bennncloudability-anomalies.csv" columns={anomalyColumns()} />
      </div>
    </ModuleFrame>
  );
}

function CostExplorerPage({ data, globalSearch }: PageProps) {
  const [groupBy, setGroupBy] = useState<'Daily' | 'Weekly' | 'Monthly' | 'Quarterly'>('Weekly');
  const rows = filterRows(data.billingRecords, globalSearch);
  const grouped = aggregate(rows, 'provider', 'cost');

  return (
    <CloudPage title="Cost Explorer" description="Filter, group and drill into normalised billing records across providers.">
      <FilterStrip items={['Date range: May 2026', 'Provider', 'Account / Subscription / Project', 'Region', 'Service', 'Team', 'Application', 'Environment', 'Cost Centre', 'Tags']} />
      <section className={`${cardSurface} rounded-lg p-4`}>
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-950">Explorer view</h2>
            <p className="text-xs text-slate-500">Current grain: {groupBy}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {(['Daily', 'Weekly', 'Monthly', 'Quarterly'] as const).map((item) => (
              <button key={item} className={`rounded-md border px-3 py-2 text-sm font-semibold ${groupBy === item ? 'border-cyan-600 bg-cyan-50 text-cyan-800' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`} onClick={() => setGroupBy(item)} type="button">
                {item}
              </button>
            ))}
          </div>
        </div>
        <SpendTrendChart data={data.dailySpend} />
      </section>
      <div className="grid gap-4 xl:grid-cols-[420px_1fr]">
        <ChartCard title="Spend by provider"><SimpleBar data={grouped} /></ChartCard>
        <DataTable title="Billing drill-down" rows={rows} filename="bennncloudability-cost-explorer.csv" columns={billingColumns()} />
      </div>
    </CloudPage>
  );
}

function CloudInventoryPage({ data, globalSearch }: PageProps) {
  return (
    <CloudPage title="Multi-Cloud Inventory" description="Cloud accounts, resources, SKUs, labels and p95/p99 telemetry.">
      <div className="grid gap-3 md:grid-cols-4">
        {data.providers.map((provider) => <ProviderCard key={provider.id} provider={provider} />)}
      </div>
      <DataTable title="Cloud resources" rows={filterRows(data.resources, globalSearch)} filename="bennncloudability-inventory.csv" columns={[
        { key: 'name', header: 'Resource' },
        { key: 'provider', header: 'Provider', render: (row) => <ProviderBadge value={row.provider} /> },
        { key: 'accountName', header: 'Account' },
        { key: 'region', header: 'Region' },
        { key: 'service', header: 'Service' },
        { key: 'resourceType', header: 'Type' },
        { key: 'sku', header: 'SKU' },
        { key: 'team', header: 'Team' },
        { key: 'application', header: 'Application' },
        { key: 'monthlyCost', header: 'Monthly cost', render: (row) => currency.format(row.monthlyCost) }
      ]} />
    </CloudPage>
  );
}

function RightsizingPage({ data, globalSearch }: PageProps) {
  return (
    <CloudPage title="Rightsizing" description="p95/p99-driven recommendations with no memory rightsizing unless memory metrics are present.">
      <div className="grid gap-3 md:grid-cols-4">
        <MiniStat label="Recommendations" value={data.rightsizingRecommendations.length} />
        <MiniStat label="Monthly saving" value={currency.format(data.rightsizingRecommendations.reduce((sum, item) => sum + Math.max(item.estimatedMonthlySaving, 0), 0))} />
        <MiniStat label="Average confidence" value={`${Math.round(avg(data.rightsizingRecommendations.map((item) => item.confidenceScore)))}%`} />
        <MiniStat label="Requires approval" value={data.rightsizingRecommendations.filter((item) => item.status === 'Reviewing').length} />
      </div>
      <DataTable title="Rightsizing recommendations" rows={filterRows(data.rightsizingRecommendations, globalSearch)} filename="bennncloudability-rightsizing.csv" columns={[
        { key: 'resourceName', header: 'Resource' },
        { key: 'provider', header: 'Provider', render: (row) => <ProviderBadge value={row.provider} /> },
        { key: 'currentSku', header: 'Current size / SKU' },
        { key: 'recommendedSku', header: 'Recommended size / SKU' },
        { key: 'recommendationType', header: 'Type' },
        { key: 'supportingMetrics', header: 'Supporting metrics' },
        { key: 'estimatedMonthlySaving', header: 'Monthly saving', render: (row) => currency.format(row.estimatedMonthlySaving) },
        { key: 'estimatedAnnualSaving', header: 'Annual saving', render: (row) => currency.format(row.estimatedAnnualSaving) },
        { key: 'confidenceScore', header: 'Confidence', render: (row) => <ScoreBadge value={row.confidenceScore} kind="confidence" /> },
        { key: 'riskScore', header: 'Risk', render: (row) => <ScoreBadge value={row.riskScore} kind="risk" /> },
        { key: 'status', header: 'Status', render: (row) => <StatusBadge value={row.status} /> }
      ]} />
    </CloudPage>
  );
}

function OptimisationPage({ data, globalSearch }: PageProps) {
  return (
    <CloudPage title="Optimisation Opportunities" description="Idle, orphaned, oversized and commitment opportunities with risk and effort signals.">
      <FilterStrip items={['Idle resources', 'Orphaned storage', 'Oversized compute', 'Oversized disks', 'Unused public IPs', 'Underused databases', 'Unused commitments', 'Tagging issues']} />
      <DataTable title="Optimisation backlog" rows={filterRows(data.optimisationOpportunities, globalSearch)} filename="bennncloudability-optimisation.csv" columns={opportunityColumns()} />
    </CloudPage>
  );
}

function BudgetsPage({ data, globalSearch }: PageProps) {
  return (
    <CloudPage title="Budgets & Forecasts" description="Budget controls by provider, team, application, cost centre and environment.">
      <div className="grid gap-4 xl:grid-cols-[420px_1fr]">
        <ChartCard title="Budget burn rate">
          <SimpleBar data={data.budgets.map((budget) => ({ name: budget.scopeName, value: budget.burnRate }))} valueSuffix="%" />
        </ChartCard>
        <DataTable title="Budget and forecast register" rows={filterRows(data.budgets, globalSearch)} filename="bennncloudability-budgets.csv" columns={[
          { key: 'scopeType', header: 'Scope type' },
          { key: 'scopeName', header: 'Scope' },
          { key: 'budgetAmount', header: 'Budget', render: (row) => currency.format(row.budgetAmount) },
          { key: 'actualSpend', header: 'Actual', render: (row) => currency.format(row.actualSpend) },
          { key: 'forecastSpend', header: 'Forecast', render: (row) => currency.format(row.forecastSpend) },
          { key: 'variance', header: 'Variance', render: (row) => currency.format(row.variance) },
          { key: 'burnRate', header: 'Burn rate', render: (row) => `${row.burnRate}%` },
          { key: 'alertThreshold', header: 'Alert threshold', render: (row) => `${row.alertThreshold}%` }
        ]} />
      </div>
    </CloudPage>
  );
}

function AnomalyPage({ data, globalSearch }: PageProps) {
  return (
    <CloudPage title="Anomaly Detection" description="Daily spend spikes, service spikes, account spikes, team spikes and unusual usage growth.">
      <DataTable title="Detected anomalies" rows={filterRows(data.anomalies, globalSearch)} filename="bennncloudability-anomaly-detection.csv" columns={anomalyColumns()} />
    </CloudPage>
  );
}

function AllocationPage({ data, globalSearch }: PageProps) {
  const allocated = data.allocationRules.reduce((sum, item) => sum + item.allocatedSpend, 0);
  const unallocated = data.allocationRules.reduce((sum, item) => sum + item.unallocatedSpend, 0);
  return (
    <CloudPage title="Cost Allocation" description="Rules engine for tags, teams, applications, environments, cost centres and shared-cost splits.">
      <div className="grid gap-3 md:grid-cols-4">
        <MiniStat label="Allocated spend" value={currency.format(allocated)} />
        <MiniStat label="Unallocated spend" value={currency.format(unallocated)} />
        <MiniStat label="Quality score" value={`${Math.round((allocated / Math.max(allocated + unallocated, 1)) * 100)}%`} />
        <MiniStat label="Missing tags" value={data.allocationRules.reduce((sum, item) => sum + item.missingTags, 0)} />
      </div>
      <DataTable title="Allocation rules" rows={filterRows(data.allocationRules, globalSearch)} filename="bennncloudability-allocation.csv" columns={[
        { key: 'ruleType', header: 'Rule type' },
        { key: 'rule', header: 'Rule' },
        { key: 'allocatedSpend', header: 'Allocated', render: (row) => currency.format(row.allocatedSpend) },
        { key: 'unallocatedSpend', header: 'Unallocated', render: (row) => currency.format(row.unallocatedSpend) },
        { key: 'qualityScore', header: 'Quality score', render: (row) => <ScoreBadge value={row.qualityScore} kind="confidence" /> },
        { key: 'missingTags', header: 'Missing tags' }
      ]} />
    </CloudPage>
  );
}

function ChargebackPage({ data, globalSearch }: PageProps) {
  const departmentCosts = aggregate(data.billingRecords, 'team', 'cost');
  const appCosts = aggregate(data.billingRecords, 'application', 'cost');
  return (
    <CloudPage title="Chargeback & Showback" description="Department, team, application, project and environment cost reports.">
      <div className="flex flex-wrap gap-2">
        {['CSV', 'XLSX', 'PDF'].map((format) => (
          <Button key={format} icon={Download} onClick={() => downloadCsv(`bennncloudability-showback-${format.toLowerCase()}.csv`, data.billingRecords)} type="button">{format}</Button>
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <DataTable title="Team showback" rows={filterRows(departmentCosts, globalSearch)} filename="bennncloudability-team-showback.csv" columns={[
          { key: 'name', header: 'Team' },
          { key: 'value', header: 'Spend', render: (row) => currency.format(row.value) }
        ]} />
        <DataTable title="Application showback" rows={filterRows(appCosts, globalSearch)} filename="bennncloudability-application-showback.csv" columns={[
          { key: 'name', header: 'Application' },
          { key: 'value', header: 'Spend', render: (row) => currency.format(row.value) }
        ]} />
      </div>
    </CloudPage>
  );
}

function ConnectorsPage({ data, globalSearch, refresh }: PageProps) {
  const [message, setMessage] = useState<string | null>(null);
  async function connectorAction(id: string, action: 'test' | 'sync') {
    const response = await apiPost<{ message: string }>(`/cloudability/connections/${id}/${action}`, {});
    setMessage(response.message);
    refresh();
  }

  return (
    <CloudPage title="Cloud Connectors" description="Connector framework configuration for AWS, Azure, GCP and OCI. Real provider API integrations can be added behind these contracts.">
      {message ? <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">{message}</div> : null}
      <div className="grid gap-4 xl:grid-cols-2">
        {filterRows(data.connections, globalSearch).map((connection) => (
          <section key={connection.id} className={`${cardSurface} rounded-lg p-4`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <ProviderBadge value={connection.provider} />
                <h2 className="mt-2 font-semibold text-slate-950">{connection.name}</h2>
                <p className="mt-1 text-sm text-slate-500">{connection.externalId}</p>
              </div>
              <StatusBadge value={connection.status} />
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <Field label="Authentication method" value={connection.authMethod} />
              <Field label="Last sync" value={date(connection.lastSync)} />
              <Field label="Enabled" value={connection.enabled ? 'Enabled' : 'Disabled'} />
              <Field label="Provider selection" value={connection.provider} />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button icon={ShieldCheck} onClick={() => connectorAction(connection.id, 'test')} type="button">Test connection</Button>
              <Button icon={RefreshCw} onClick={() => connectorAction(connection.id, 'sync')} type="button">Sync now</Button>
            </div>
          </section>
        ))}
      </div>
    </CloudPage>
  );
}

function CloudReportsPage({ data, globalSearch }: PageProps) {
  return (
    <CloudPage title="Reports" description="Reusable cloud report templates with filters and export actions.">
      <div className="grid gap-4 xl:grid-cols-2">
        {filterRows(data.reportTemplates, globalSearch).map((report) => (
          <section key={report.id} className={`${cardSurface} rounded-lg p-4`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold text-slate-950">{report.name}</h2>
                <p className="mt-1 text-sm text-slate-500">{report.description}</p>
              </div>
              <FileBarChart className="h-5 w-5 text-cyan-700" />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {report.filters.map((filter) => <Badge key={filter}>{filter}</Badge>)}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {report.exportFormats.map((format) => (
                <Button key={format} icon={Download} onClick={() => downloadCsv(`bennncloudability-${report.id}-${format.toLowerCase()}.csv`, data.billingRecords)} type="button">{format}</Button>
              ))}
            </div>
          </section>
        ))}
      </div>
    </CloudPage>
  );
}

function CloudAdminPage({ data, globalSearch }: PageProps) {
  const settings = [
    { area: 'Connector settings', value: 'Provider credentials, sync windows, retry policy' },
    { area: 'Cost allocation rules', value: `${data.allocationRules.length} active rules` },
    { area: 'Rightsizing policy thresholds', value: 'Downsize below CPU p95 20%, p99 40%, memory p95 60% when available' },
    { area: 'Budget settings', value: 'Alert at 85%, 90% and forecast breach' },
    { area: 'Protected tags', value: 'application, environment, owner, team, costCentre' },
    { area: 'Report schedules', value: 'Executive monthly, FinOps weekly, anomaly daily' },
    { area: 'Currency settings', value: 'AUD reporting currency, provider native currency retained' },
    { area: 'Data retention', value: '36 months billing, 13 months resource metrics' }
  ];
  return (
    <CloudPage title="Administration" description="BennnCloudability settings, roles, governance actions and module controls.">
      <DataTable title="Module permissions" rows={data.permissions.map((permission) => ({ permission, module: 'BennnCloudability' }))} filename="bennncloudability-permissions.csv" columns={[
        { key: 'permission', header: 'Permission' },
        { key: 'module', header: 'Module' }
      ]} />
      <div className="grid gap-4 xl:grid-cols-2">
        <DataTable title="Administration settings" rows={filterRows(settings, globalSearch)} filename="bennncloudability-admin-settings.csv" columns={[
          { key: 'area', header: 'Area' },
          { key: 'value', header: 'Setting' }
        ]} />
        <DataTable title="Governance actions" rows={data.governanceActions} filename="bennncloudability-governance.csv" columns={[
          { key: 'action', header: 'Action' },
          { key: 'actor', header: 'Actor' },
          { key: 'entity', header: 'Entity' },
          { key: 'status', header: 'Status', render: (row) => <StatusBadge value={row.status} /> },
          { key: 'createdAt', header: 'Created', render: (row) => date(row.createdAt) }
        ]} />
      </div>
    </CloudPage>
  );
}

type PageProps = { data: CloudabilityPayload; globalSearch: string; refresh: () => void };

function CloudPage({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <ModuleFrame>
      <PageHeader eyebrow="BennnCloudability" title={title} description={description} />
      {children}
    </ModuleFrame>
  );
}

function ProviderCard({ provider }: { provider: CloudabilityPayload['providers'][number] }) {
  return (
    <section className={`${cardSurface} rounded-lg p-4`}>
      <div className="flex items-center justify-between">
        <ProviderBadge value={provider.code} />
        <StatusBadge value={provider.status} />
      </div>
      <div className="mt-3 text-sm font-semibold text-slate-950">{provider.name}</div>
      <div className="mt-2 font-mono text-2xl font-semibold text-slate-950">{currency.format(provider.monthlySpend)}</div>
    </section>
  );
}

function MiniStat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className={`${cardSurface} rounded-lg p-3.5`}>
      <div className="text-xs font-semibold text-slate-500">{label}</div>
      <div className="mt-1 font-mono text-lg font-semibold tracking-tight text-slate-950">{value}</div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
      <div className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 text-sm font-semibold text-slate-800">{value}</div>
    </div>
  );
}

function ProviderBadge({ value }: { value: string }) {
  const tone = value === 'AWS' ? 'warning' : value === 'Azure' ? 'brand' : value === 'GCP' ? 'info' : 'risk';
  return <Badge tone={tone}>{value}</Badge>;
}

function ScoreBadge({ value, kind }: { value: number; kind: 'risk' | 'confidence' }) {
  const risk = kind === 'risk';
  const tone = risk ? (value >= 60 ? 'risk' : value >= 35 ? 'warning' : 'success') : value >= 85 ? 'success' : value >= 70 ? 'warning' : 'risk';
  return <Badge tone={tone}>{value}%</Badge>;
}

function FilterStrip({ items }: { items: string[] }) {
  return (
    <section className={`${cardSurface} rounded-lg p-3`}>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => <Badge key={item} tone="neutral">{item}</Badge>)}
      </div>
    </section>
  );
}

function SpendTrendChart({ data }: { data: CloudabilityPayload['dailySpend'] }) {
  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" vertical={false} />
          <XAxis dataKey="date" tickLine={false} axisLine={false} tick={axisTick} />
          <YAxis tickFormatter={(value) => `$${Math.round(Number(value) / 1000)}k`} tickLine={false} axisLine={false} tick={axisTick} width={48} />
          <Tooltip contentStyle={tooltipStyle} formatter={(value) => currency.format(Number(value))} />
          <Legend iconType="circle" wrapperStyle={{ color: '#475569', fontSize: 12, fontWeight: 600, paddingTop: 12 }} />
          {(['AWS', 'Azure', 'GCP', 'OCI'] as const).map((provider, index) => (
            <Line key={provider} type="monotone" dataKey={provider} stroke={palette[index]} strokeWidth={2.5} dot={{ r: 3 }} isAnimationActive={false} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function ProviderPie({ data }: { data: Array<{ name: string; value: number }> }) {
  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" outerRadius={92} innerRadius={46} paddingAngle={3} isAnimationActive={false}>
            {data.map((_entry, index) => <Cell key={index} fill={palette[index % palette.length]} />)}
          </Pie>
          <Tooltip contentStyle={tooltipStyle} formatter={(value) => currency.format(Number(value))} />
          <Legend iconType="circle" wrapperStyle={{ color: '#475569', fontSize: 12, fontWeight: 600 }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

function SimpleBar({ data, valueSuffix }: { data: Array<{ name: string; value: number }>; valueSuffix?: string }) {
  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data.slice(0, 7)} margin={{ top: 8, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" vertical={false} />
          <XAxis dataKey="name" tickLine={false} axisLine={false} tick={axisTick} />
          <YAxis tickFormatter={(value) => valueSuffix ? `${value}${valueSuffix}` : `$${Number(value) / 1000}k`} tickLine={false} axisLine={false} tick={axisTick} width={48} />
          <Tooltip contentStyle={tooltipStyle} formatter={(value) => valueSuffix ? `${number.format(Number(value))}${valueSuffix}` : currency.format(Number(value))} />
          <Bar dataKey="value" radius={[5, 5, 0, 0]} isAnimationActive={false}>
            {data.map((_entry, index) => <Cell key={index} fill={palette[index % palette.length]} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function aggregate<T extends Record<string, unknown>>(rows: T[], labelKey: keyof T & string, valueKey: keyof T & string) {
  return Object.values(rows.reduce<Record<string, { name: string; value: number }>>((acc, row) => {
    const name = String(row[labelKey] ?? 'Unassigned');
    acc[name] ??= { name, value: 0 };
    acc[name].value += Number(row[valueKey] ?? 0);
    return acc;
  }, {})).sort((a, b) => b.value - a.value);
}

function filterRows<T>(rows: T[], globalSearch: string) {
  const q = globalSearch.trim().toLowerCase();
  if (!q) return rows;
  return rows.filter((row) => JSON.stringify(row).toLowerCase().includes(q));
}

function avg(values: number[]) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function billingColumns(): Array<Column<CloudabilityPayload['billingRecords'][number]>> {
  return [
    { key: 'provider', header: 'Provider', render: (row) => <ProviderBadge value={row.provider} /> },
    { key: 'account', header: 'Account / Subscription / Project' },
    { key: 'region', header: 'Region' },
    { key: 'service', header: 'Service' },
    { key: 'resourceName', header: 'Resource' },
    { key: 'resourceType', header: 'Type' },
    { key: 'sku', header: 'SKU / Instance type' },
    { key: 'usageQuantity', header: 'Usage qty' },
    { key: 'usageUnit', header: 'Usage unit' },
    { key: 'cost', header: 'Cost', render: (row) => currency.format(row.cost) },
    { key: 'currency', header: 'Currency' },
    { key: 'billingPeriod', header: 'Billing period' },
    { key: 'owner', header: 'Owner' },
    { key: 'team', header: 'Team' },
    { key: 'application', header: 'Application' },
    { key: 'environment', header: 'Environment' },
    { key: 'costCentre', header: 'Cost centre' }
  ];
}

function opportunityColumns(): Array<Column<CloudabilityPayload['optimisationOpportunities'][number]>> {
  return [
    { key: 'category', header: 'Category' },
    { key: 'resourceName', header: 'Resource' },
    { key: 'provider', header: 'Provider', render: (row) => <ProviderBadge value={row.provider} /> },
    { key: 'savingOpportunity', header: 'Saving opportunity', render: (row) => currency.format(row.savingOpportunity) },
    { key: 'risk', header: 'Risk', render: (row) => <StatusBadge value={row.risk} /> },
    { key: 'effort', header: 'Effort' },
    { key: 'owner', header: 'Owner' },
    { key: 'recommendedAction', header: 'Recommended action' }
  ];
}

function anomalyColumns(): Array<Column<CloudabilityPayload['anomalies'][number]>> {
  return [
    { key: 'detectedAt', header: 'Date detected', render: (row) => date(row.detectedAt) },
    { key: 'provider', header: 'Affected provider', render: (row) => <ProviderBadge value={row.provider} /> },
    { key: 'service', header: 'Affected service' },
    { key: 'ownerTeam', header: 'Affected owner/team' },
    { key: 'expectedCost', header: 'Expected cost', render: (row) => currency.format(row.expectedCost) },
    { key: 'actualCost', header: 'Actual cost', render: (row) => currency.format(row.actualCost) },
    { key: 'variance', header: 'Variance', render: (row) => currency.format(row.variance) },
    { key: 'likelyDriver', header: 'Likely driver' },
    { key: 'status', header: 'Status', render: (row) => <StatusBadge value={row.status} /> }
  ];
}
