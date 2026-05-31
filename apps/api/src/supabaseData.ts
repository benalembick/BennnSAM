// ---------------------------------------------------------------------------
// supabaseData.ts – Supabase query functions and DB→API shape mappers.
// All queries use the service-role client (bypasses RLS) and always filter
// by tenant_id to prevent cross-tenant data leakage.
// ---------------------------------------------------------------------------

import type { SupabaseClient } from '@supabase/supabase-js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;

// ─── coercion helpers ───────────────────────────────────────────────────────
const s = (v: unknown) => (v != null ? String(v) : '');
const n = (v: unknown) => (v != null ? Number(v) : 0);
const b = (v: unknown) => Boolean(v);
const a = (v: unknown) => (Array.isArray(v) ? v : []);
const today = () => new Date();

export function daysUntil(dateStr: string | null | undefined): number {
  if (!dateStr) return Infinity;
  const target = new Date(`${dateStr}T00:00:00Z`);
  return Math.ceil((target.getTime() - today().getTime()) / 86_400_000);
}

// ─── entity mappers ─────────────────────────────────────────────────────────

function mapApplication(row: Row) {
  const vendor = row.vendors as Row | null;
  const owner = row.owner as Row | null;
  const dept = row.departments as Row | null;
  const bu = dept?.business_units as Row | null;
  return {
    id: s(row.id),
    name: s(row.name),
    vendor: s(vendor?.name),
    category: s(row.category),
    type: s(row.app_type),
    version: s(row.version),
    edition: s(row.edition),
    installCount: n(row.install_count),
    activeUsers: n(row.active_users),
    totalUsageMinutes: n(row.total_usage_minutes),
    activeUsageMinutes: n(row.active_usage_minutes),
    lastDetectedDate: s(row.last_detected_date),
    licenceRequirement: s(row.licence_requirement),
    gdprRisk: b(row.gdpr_risk),
    eolDate: row.eol_date ? s(row.eol_date) : null,
    upgradePath: s(row.upgrade_path),
    downgradePath: s(row.downgrade_path),
    tags: a(row.tags) as string[],
    owner: owner?.full_name ? s(owner.full_name) : null,
    businessUnit: s(bu?.name),
    approved: b(row.approved),
    monthlyCost: n(row.monthly_cost),
    renewalDate: s(row.renewal_date),
    riskRating: s(row.risk_rating),
  };
}

function mapDevice(row: Row) {
  const user = row.assigned_user as Row | null;
  const dept = row.departments as Row | null;
  return {
    id: s(row.id),
    hostname: s(row.hostname),
    os: s(row.os),
    osVersion: s(row.os_version),
    user: s(user?.full_name),
    department: s(dept?.name),
    lastCheckIn: s(row.last_check_in),
    cpuArchitecture: s(row.cpu_architecture),
    installedSoftware: a(row.installed_software) as string[],
    runningProcesses: a(row.running_processes) as string[],
    browserSaasUsageEvents: a(row.browser_saas_usage_events) as string[],
    customAttributes: (row.custom_attributes ?? {}) as Record<string, string>,
    serialNumber: s(row.serial_number),
    assetTag: s(row.asset_tag),
    location: s(row.location),
    warrantyDate: s(row.warranty_date),
    lifecycleStatus: s(row.lifecycle_status) as 'active' | 'refresh due' | 'retired' | 'in repair',
    costCentre: s(row.cost_centre),
    notes: s(row.notes),
  };
}

function mapUsageEvent(row: Row) {
  const app = row.applications as Row | null;
  const user = row.users_profile as Row | null;
  return {
    id: s(row.id),
    appId: s(row.app_id),
    appName: s(app?.name),
    userId: s(row.user_id),
    userName: s(user?.full_name),
    deviceId: s(row.device_id),
    eventType: s(row.event_type) as 'process_open' | 'browser_url' | 'sso_assignment' | 'manual_import',
    startedAt: s(row.started_at),
    endedAt: s(row.ended_at),
    activeMinutes: n(row.active_minutes),
    totalMinutes: n(row.total_minutes),
    source: s(row.source) as 'agent' | 'integration' | 'manual import',
  };
}

function mapSaaSDetection(row: Row) {
  return {
    id: s(row.id),
    saasAppName: s(row.saas_app_name),
    domain: s(row.domain),
    vendor: s(row.vendor),
    category: s(row.category),
    detectedUsers: n(row.detected_users),
    assignedUsers: n(row.assigned_users),
    paidSeats: n(row.paid_seats),
    activeUsers: n(row.active_users),
    inactiveUsers: n(row.inactive_users),
    monthlyCost: n(row.monthly_cost),
    riskRating: s(row.risk_rating),
    renewalDate: s(row.renewal_date),
    approved: b(row.approved),
    source: s(row.source) as 'browser import' | 'SSO import' | 'finance CSV' | 'manual',
  };
}

function mapLicence(row: Row) {
  const app = row.applications as Row | null;
  const appVendor = app?.vendors as Row | null;
  const contract = row.contracts as Row | null;
  const contractOwner = contract?.owner as Row | null;
  return {
    id: s(row.id),
    applicationId: s(row.application_id),
    applicationName: s(app?.name),
    contractName: s(contract?.name),
    vendor: s(appVendor?.name),
    sku: s(row.sku),
    licenceMetric: s(row.licence_metric),
    purchasedQuantity: n(row.purchased_quantity),
    assignedQuantity: n(row.assigned_quantity),
    consumedQuantity: n(row.consumed_quantity),
    complianceStatus: s(row.compliance_status) as 'over-licensed' | 'under-licensed' | 'adequately licensed',
    renewalDate: s(contract?.renewal_date ?? app?.renewal_date),
    contractOwner: s(contractOwner?.full_name),
    costPerLicence: n(row.cost_per_licence),
    trueUpTrueDownNotes: s(row.true_up_true_down_notes),
    rule: s(row.calculation_rule),
  };
}

function mapCostRecord(row: Row) {
  const app = row.applications as Row | null;
  const appVendor = app?.vendors as Row | null;
  const appDept = app?.departments as Row | null;
  const appBu = appDept?.business_units as Row | null;
  const user = row.users_profile as Row | null;
  const device = row.devices as Row | null;
  return {
    id: s(row.id),
    applicationName: s(app?.name),
    vendor: s(appVendor?.name),
    department: s(appDept?.name),
    businessUnit: s(appBu?.name),
    userName: s(user?.full_name),
    deviceName: s(device?.hostname),
    monthlyCost: n(row.monthly_cost),
    allocationMethod: s(row.allocation_method) as 'seat' | 'usage' | 'device' | 'manual',
    negotiatedPrice: row.negotiated_price != null ? n(row.negotiated_price) : null,
  };
}

function mapSavingsRecommendation(row: Row) {
  const app = row.applications as Row | null;
  const dept = row.departments as Row | null;
  return {
    id: s(row.id),
    type: s(row.recommendation_type) as 'cancel unused' | 'downgrade' | 'renewal prep' | 'consolidate vendors',
    applicationName: s(app?.name),
    department: s(dept?.name),
    estimatedAnnualSavings: n(row.estimated_annual_savings),
    reason: s(row.reason),
    status: s(row.status) as 'new' | 'reviewing' | 'approved' | 'dismissed',
  };
}

function mapComplianceResult(row: Row) {
  const app = row.applications as Row | null;
  const owner = row.owner as Row | null;
  return {
    id: s(row.id),
    finding: s(row.finding),
    applicationName: s(app?.name),
    category: s(row.category) as 'under-licensed' | 'EOL' | 'unapproved SaaS' | 'privacy' | 'missing owner' | 'old device version',
    severity: s(row.severity) as 'low' | 'medium' | 'high' | 'critical',
    riskScore: n(row.risk_score),
    owner: owner?.full_name ? s(owner.full_name) : null,
    evidence: s(row.evidence),
    dueDate: s(row.due_date),
  };
}

function mapIntegration(row: Row) {
  const logs = a(row.integration_sync_logs) as Row[];
  return {
    id: s(row.id),
    name: s(row.name),
    category: s(row.category) as 'identity' | 'endpoint' | 'service management' | 'finance' | 'api',
    connectionStatus: s(row.connection_status) as 'connected' | 'needs attention' | 'not connected',
    enabled: b(row.enabled),
    lastSync: row.last_sync ? s(row.last_sync) : null,
    syncLogs: logs.map(l => ({
      at: s(l.started_at),
      status: s(l.status) as 'success' | 'warning' | 'failed',
      message: s(l.message),
    })),
    mapping: a(row.mapping_config) as Array<{ source: string; target: string; transform?: string }>,
  };
}

function mapExportWorkflow(row: Row) {
  const execLogs = a(row.execution_logs) as Row[];
  const mappedFields = a(row.mapped_fields) as Array<{ source: string; destination: string }>;
  return {
    id: s(row.id),
    name: s(row.name),
    sourceDataset: s(row.source_dataset),
    filters: typeof row.filters === 'string' ? row.filters : JSON.stringify(row.filters ?? {}),
    mappedFields,
    destination: s(row.destination) as 'webhook' | 'CSV' | 'REST API' | 'Supabase table' | 'ServiceNow mock endpoint',
    schedule: s(row.schedule) as 'manual' | 'daily' | 'weekly',
    enabled: b(row.enabled),
    executionLogs: execLogs.map(l => ({
      at: s(l.at ?? l.started_at),
      status: s(l.status) as 'success' | 'failed',
      records: n(l.records ?? l.records_processed),
      message: s(l.message),
    })),
  };
}

function mapCustomInventoryRule(row: Row) {
  const normalizedApp = row.applications as Row | null;
  return {
    id: s(row.id),
    name: s(row.name),
    matchType: s(row.match_type) as 'executable' | 'folder path' | 'registry key' | 'SaaS domain' | 'file metadata' | 'process name',
    matchValue: s(row.match_value),
    normalizedApplication: s(normalizedApp?.name),
    edition: s(row.edition),
    classification: s(row.classification) as 'trial' | 'paid' | 'enterprise' | 'professional',
    confidence: n(row.confidence),
    enabled: b(row.enabled),
  };
}

function mapNormalizationReview(row: Row) {
  const rawEvent = row.raw_inventory_events as Row | null;
  const suggestedApp = row.applications as Row | null;
  const analyst = row.users_profile as Row | null;
  return {
    id: s(row.id),
    rawName: s(rawEvent?.raw_name),
    suggestedApplication: s(suggestedApp?.name),
    vendorSuggestion: s(row.vendor_suggestion),
    confidenceScore: n(row.confidence_score),
    duplicateCandidates: a(row.duplicate_candidates) as string[],
    status: s(row.status) as 'pending' | 'approved' | 'merged' | 'split' | 'overridden',
    analyst: analyst?.full_name ? s(analyst.full_name) : null,
    overrideHistory: a(row.override_history) as string[],
  };
}

function mapReport(row: Row) {
  return {
    id: s(row.id),
    name: s(row.name),
    description: s(row.description),
    dataset: s(row.dataset),
    filters: a(row.filters) as string[],
    exportFormats: a(row.export_formats) as Array<'CSV' | 'JSON'>,
    savedConfigurations: n(row.saved_configuration ? Object.keys(row.saved_configuration ?? {}).length : 0),
  };
}

function mapDepartment(row: Row) {
  const bu = row.business_units as Row | null;
  return {
    id: s(row.id),
    name: s(row.name),
    businessUnit: s(bu?.name),
  };
}

function mapUser(row: Row) {
  const dept = row.departments as Row | null;
  return {
    id: s(row.id),
    name: s(row.full_name),
    email: s(row.email),
    role: s(row.role),
    department: s(dept?.name),
  };
}

function mapAuditEntry(row: Row) {
  return {
    id: s(row.id),
    action: s(row.action),
    entityType: s(row.entity_type),
    entityId: row.entity_id ? s(row.entity_id) : null,
    changes: row.changes ?? {},
    createdAt: s(row.created_at),
  };
}

// ─── query functions ─────────────────────────────────────────────────────────

export async function getBootstrapData(client: SupabaseClient, tenantId: string) {
  const [deptRes, userRes, logRes] = await Promise.all([
    client
      .from('departments')
      .select('id, name, business_units(name)')
      .eq('tenant_id', tenantId),
    client
      .from('users_profile')
      .select('id, full_name, email, role, departments(name)')
      .eq('tenant_id', tenantId),
    client
      .from('audit_log')
      .select('id, action, entity_type, entity_id, changes, created_at')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(50),
  ]);

  return {
    departments: (deptRes.data ?? []).map(mapDepartment),
    users: (userRes.data ?? []).map(mapUser),
    auditLog: (logRes.data ?? []).map(mapAuditEntry),
  };
}

export async function getApplications(client: SupabaseClient, tenantId: string, q?: string, type?: string) {
  let query = client
    .from('applications')
    .select(`
      id, name, category, app_type, version, edition, install_count, active_users,
      total_usage_minutes, active_usage_minutes, last_detected_date, licence_requirement,
      gdpr_risk, eol_date, upgrade_path, downgrade_path, tags, approved, monthly_cost,
      renewal_date, risk_rating,
      vendors(name),
      owner:users_profile(full_name),
      departments(name, business_units(name))
    `)
    .eq('tenant_id', tenantId);

  if (type && type !== 'all') query = query.eq('app_type', type);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  let rows = (data ?? []).map(r => mapApplication(r as Row));

  if (q) {
    const qLow = q.toLowerCase();
    rows = rows.filter(app =>
      [app.name, app.vendor, app.category, app.owner ?? '', app.tags.join(' ')]
        .join(' ')
        .toLowerCase()
        .includes(qLow)
    );
  }
  return rows;
}

export async function getApplicationById(client: SupabaseClient, tenantId: string, id: string) {
  const [appRes, licRes, usageRes, compRes] = await Promise.all([
    client
      .from('applications')
      .select(`
        id, name, category, app_type, version, edition, install_count, active_users,
        total_usage_minutes, active_usage_minutes, last_detected_date, licence_requirement,
        gdpr_risk, eol_date, upgrade_path, downgrade_path, tags, approved, monthly_cost,
        renewal_date, risk_rating,
        vendors(name),
        owner:users_profile(full_name),
        departments(name, business_units(name))
      `)
      .eq('tenant_id', tenantId)
      .eq('id', id)
      .maybeSingle(),
    client
      .from('licences')
      .select(`
        id, application_id, sku, licence_metric, purchased_quantity, assigned_quantity,
        consumed_quantity, compliance_status, cost_per_licence, true_up_true_down_notes,
        calculation_rule,
        applications(name, renewal_date, vendors(name)),
        contracts(name, renewal_date, owner:users_profile(full_name))
      `)
      .eq('tenant_id', tenantId)
      .eq('application_id', id),
    client
      .from('usage_events')
      .select(`
        id, app_id, user_id, device_id, event_type, started_at, ended_at,
        active_minutes, total_minutes, source,
        applications(name),
        users_profile(full_name)
      `)
      .eq('tenant_id', tenantId)
      .eq('app_id', id)
      .limit(200),
    client
      .from('compliance_results')
      .select(`
        id, finding, category, severity, risk_score, evidence, due_date,
        applications(name),
        owner:users_profile(full_name)
      `)
      .eq('tenant_id', tenantId),
  ]);

  if (!appRes.data) return null;
  const app = mapApplication(appRes.data as Row);
  const compResults = (compRes.data ?? []).map(r => mapComplianceResult(r as Row));

  return {
    ...app,
    licences: (licRes.data ?? []).map(r => mapLicence(r as Row)),
    usage: (usageRes.data ?? []).map(r => mapUsageEvent(r as Row)),
    compliance: compResults.filter(c => c.applicationName === app.name),
  };
}

export async function getDevices(client: SupabaseClient, tenantId: string) {
  const { data, error } = await client
    .from('devices')
    .select(`
      id, hostname, os, os_version, last_check_in, cpu_architecture,
      installed_software, running_processes, browser_saas_usage_events,
      custom_attributes, serial_number, asset_tag, location, warranty_date,
      lifecycle_status, cost_centre, notes,
      assigned_user:users_profile(full_name),
      departments(name)
    `)
    .eq('tenant_id', tenantId);
  if (error) throw new Error(error.message);
  return (data ?? []).map(r => mapDevice(r as Row));
}

export async function getUsageData(client: SupabaseClient, tenantId: string) {
  const [eventsRes, appsRes, savingsRes] = await Promise.all([
    client
      .from('usage_events')
      .select(`
        id, app_id, user_id, device_id, event_type, started_at, ended_at,
        active_minutes, total_minutes, source,
        applications(name),
        users_profile(full_name)
      `)
      .eq('tenant_id', tenantId)
      .limit(500),
    client
      .from('applications')
      .select('id, name, active_users, active_usage_minutes, total_usage_minutes, monthly_cost, last_detected_date')
      .eq('tenant_id', tenantId),
    client
      .from('savings_recommendations')
      .select(`
        id, recommendation_type, estimated_annual_savings, reason, status,
        applications(name),
        departments(name)
      `)
      .eq('tenant_id', tenantId),
  ]);

  const events = (eventsRes.data ?? []).map(r => mapUsageEvent(r as Row));
  const apps = appsRes.data ?? [];
  const savings = (savingsRes.data ?? []).map(r => mapSavingsRecommendation(r as Row));

  const underuse = apps
    .filter(app => n(app.active_usage_minutes) / Math.max(n(app.total_usage_minutes), 1) < 0.45)
    .map(app => ({
      app: s(app.name),
      activeUsers: n(app.active_users),
      activeRatio: Math.round((n(app.active_usage_minutes) / Math.max(n(app.total_usage_minutes), 1)) * 100),
      monthlyCost: n(app.monthly_cost),
    }));

  return {
    events,
    underuse,
    zombieApps: apps
      .filter(app => n(app.active_users) === 0 || n(app.active_usage_minutes) < 2000)
      .map(r => mapApplication(r as Row)),
    heavyUsers: events.filter(e => e.activeMinutes > 120),
    dormantApps: apps
      .filter(app => n(app.active_users) < 5)
      .map(r => mapApplication(r as Row)),
    renewalRecommendations: savings.filter(r => r.type === 'renewal prep' || r.type === 'downgrade'),
  };
}

export async function getSaasData(client: SupabaseClient, tenantId: string) {
  const { data, error } = await client
    .from('saas_detections')
    .select('*')
    .eq('tenant_id', tenantId);
  if (error) throw new Error(error.message);

  const detections = (data ?? []).map(r => mapSaaSDetection(r as Row));
  return {
    detections,
    known: detections.filter(d => d.approved),
    unknown: detections.filter(d => !d.approved),
    domains: detections.map(d => ({ domain: d.domain, application: d.saasAppName, approved: d.approved })),
  };
}

export async function getLicences(client: SupabaseClient, tenantId: string) {
  const { data, error } = await client
    .from('licences')
    .select(`
      id, application_id, sku, licence_metric, purchased_quantity, assigned_quantity,
      consumed_quantity, compliance_status, cost_per_licence, true_up_true_down_notes,
      calculation_rule,
      applications(name, renewal_date, vendors(name)),
      contracts(name, renewal_date, owner:users_profile(full_name))
    `)
    .eq('tenant_id', tenantId);
  if (error) throw new Error(error.message);
  return (data ?? []).map(r => mapLicence(r as Row));
}

export async function getCostsData(client: SupabaseClient, tenantId: string) {
  const [recordsRes, savingsRes] = await Promise.all([
    client
      .from('cost_records')
      .select(`
        id, monthly_cost, allocation_method, negotiated_price,
        applications(name, vendors(name), departments(name, business_units(name))),
        users_profile(full_name),
        devices(hostname)
      `)
      .eq('tenant_id', tenantId),
    client
      .from('savings_recommendations')
      .select(`
        id, recommendation_type, estimated_annual_savings, reason, status,
        applications(name),
        departments(name)
      `)
      .eq('tenant_id', tenantId),
  ]);

  const records = (recordsRes.data ?? []).map(r => mapCostRecord(r as Row));
  const savings = (savingsRes.data ?? []).map(r => mapSavingsRecommendation(r as Row));

  function aggregateCost(field: keyof (typeof records)[number]) {
    return Object.values(
      records.reduce<Record<string, { name: string; monthlyCost: number }>>((acc, rec) => {
        const name = String(rec[field] ?? '');
        acc[name] ??= { name, monthlyCost: 0 };
        acc[name].monthlyCost += rec.monthlyCost;
        return acc;
      }, {})
    ).sort((a, b) => b.monthlyCost - a.monthlyCost);
  }

  return {
    records,
    recommendations: savings,
    byVendor: aggregateCost('vendor'),
    byApp: aggregateCost('applicationName'),
    byUser: aggregateCost('userName'),
    byDevice: aggregateCost('deviceName'),
    byDepartment: aggregateCost('department'),
  };
}

export async function getComplianceData(client: SupabaseClient, tenantId: string) {
  const { data, error } = await client
    .from('compliance_results')
    .select(`
      id, finding, category, severity, risk_score, evidence, due_date, status,
      applications(name),
      owner:users_profile(full_name)
    `)
    .eq('tenant_id', tenantId);
  if (error) throw new Error(error.message);

  const results = (data ?? []).map(r => mapComplianceResult(r as Row));
  return {
    results,
    rules: [
      { id: 'risk-001', name: 'EOL software severity', condition: 'eol_date < today', weight: 35, enabled: true },
      { id: 'risk-002', name: 'Unapproved SaaS', condition: 'approved = false and detected_users > 0', weight: 30, enabled: true },
      { id: 'risk-003', name: 'Missing owner', condition: 'owner is null and monthly_cost > 1000', weight: 20, enabled: true },
    ],
    auditReady: results.filter(r => r.owner && r.evidence).length,
    evidenceExportRows: results.length,
  };
}

export async function getIntegrations(client: SupabaseClient, tenantId: string) {
  const { data, error } = await client
    .from('integrations')
    .select(`
      id, name, category, connection_status, enabled, last_sync, mapping_config,
      integration_sync_logs(id, status, message, records_processed, started_at)
    `)
    .eq('tenant_id', tenantId);
  if (error) throw new Error(error.message);
  return (data ?? []).map(r => mapIntegration(r as Row));
}

export async function syncIntegration(client: SupabaseClient, tenantId: string, id: string) {
  const now = new Date().toISOString();

  const { data: integration, error: fetchError } = await client
    .from('integrations')
    .select('id, name')
    .eq('tenant_id', tenantId)
    .eq('id', id)
    .maybeSingle();

  if (fetchError) throw new Error(fetchError.message);
  if (!integration) return null;

  const logEntry = {
    tenant_id: tenantId,
    integration_id: id,
    status: 'success',
    message: `Manual sync queued for ${integration.name}. Sync completed.`,
    records_processed: Math.floor(Math.random() * 25) + 5,
    started_at: now,
    finished_at: now,
  };

  await Promise.all([
    client.from('integration_sync_logs').insert(logEntry),
    client.from('integrations').update({ last_sync: now, connection_status: 'connected' }).eq('id', id).eq('tenant_id', tenantId),
  ]);

  const { data: updated } = await client
    .from('integrations')
    .select(`
      id, name, category, connection_status, enabled, last_sync, mapping_config,
      integration_sync_logs(id, status, message, records_processed, started_at)
    `)
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .maybeSingle();

  return updated ? mapIntegration(updated as Row) : null;
}

export async function getExportWorkflows(client: SupabaseClient, tenantId: string) {
  const { data, error } = await client
    .from('export_workflows')
    .select('*')
    .eq('tenant_id', tenantId);
  if (error) throw new Error(error.message);
  return (data ?? []).map(r => mapExportWorkflow(r as Row));
}

export async function createExportWorkflow(client: SupabaseClient, tenantId: string, body: Record<string, unknown>) {
  const row = {
    tenant_id: tenantId,
    name: body.name ?? 'Untitled export workflow',
    source_dataset: body.sourceDataset ?? 'applications',
    filters: body.filters ?? {},
    mapped_fields: body.mappedFields ?? [{ source: 'name', destination: 'name' }],
    destination: body.destination ?? 'CSV',
    schedule: body.schedule ?? 'manual',
    enabled: true,
    execution_logs: [],
  };
  const { data, error } = await client.from('export_workflows').insert(row).select('*').single();
  if (error) throw new Error(error.message);
  return mapExportWorkflow(data as Row);
}

export async function runExportWorkflow(client: SupabaseClient, tenantId: string, id: string) {
  const { data: wf, error: fetchErr } = await client
    .from('export_workflows')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('id', id)
    .maybeSingle();

  if (fetchErr) throw new Error(fetchErr.message);
  if (!wf) return null;

  const logEntry = {
    at: new Date().toISOString(),
    status: 'success',
    records: Math.floor(Math.random() * 80) + 8,
    message: `Manual ${wf.destination} export completed.`,
  };
  const updatedLogs = [logEntry, ...a(wf.execution_logs)];

  const { data: updated, error: updErr } = await client
    .from('export_workflows')
    .update({ execution_logs: updatedLogs })
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .select('*')
    .single();

  if (updErr) throw new Error(updErr.message);
  return mapExportWorkflow(updated as Row);
}

export async function getRules(client: SupabaseClient, tenantId: string) {
  const { data, error } = await client
    .from('custom_inventory_rules')
    .select(`
      id, name, match_type, match_value, edition, classification, confidence, enabled,
      applications(name)
    `)
    .eq('tenant_id', tenantId);
  if (error) throw new Error(error.message);
  return (data ?? []).map(r => mapCustomInventoryRule(r as Row));
}

export async function getNormalizationData(client: SupabaseClient, tenantId: string) {
  const [rawRes, queueRes, rulesRes, appsRes] = await Promise.all([
    client
      .from('raw_inventory_events')
      .select('id, raw_name, source, detected_at')
      .eq('tenant_id', tenantId)
      .order('detected_at', { ascending: false })
      .limit(50),
    client
      .from('normalization_review_queue')
      .select(`
        id, vendor_suggestion, confidence_score, duplicate_candidates, status,
        override_history,
        raw_inventory_events(raw_name, source),
        applications(name),
        users_profile(full_name)
      `)
      .eq('tenant_id', tenantId),
    client
      .from('custom_inventory_rules')
      .select('id, name, match_type, match_value, edition, classification, confidence, enabled, applications(name)')
      .eq('tenant_id', tenantId),
    client
      .from('applications')
      .select(`
        id, name, category, app_type, version, edition, install_count, active_users,
        total_usage_minutes, active_usage_minutes, last_detected_date, licence_requirement,
        gdpr_risk, eol_date, upgrade_path, downgrade_path, tags, approved, monthly_cost,
        renewal_date, risk_rating,
        vendors(name),
        owner:users_profile(full_name),
        departments(name, business_units(name))
      `)
      .eq('tenant_id', tenantId),
  ]);

  const rawInventory = (rawRes.data ?? []).map(r => ({
    id: s(r.id),
    rawName: s(r.raw_name),
    source: s(r.source),
    firstSeen: s(r.detected_at).slice(0, 10),
    lastSeen: s(r.detected_at).slice(0, 10),
  }));

  return {
    rawInventory,
    reviewQueue: (queueRes.data ?? []).map(r => mapNormalizationReview(r as Row)),
    rules: (rulesRes.data ?? []).map(r => mapCustomInventoryRule(r as Row)),
    normalizedApplications: (appsRes.data ?? []).map(r => mapApplication(r as Row)),
  };
}

export async function getReports(client: SupabaseClient, tenantId: string) {
  const { data, error } = await client
    .from('reports')
    .select('id, name, description, dataset, filters, export_formats, saved_configuration')
    .eq('tenant_id', tenantId);
  if (error) throw new Error(error.message);
  return (data ?? []).map(r => mapReport(r as Row));
}

export async function getOverviewData(client: SupabaseClient, tenantId: string) {
  const [appsRes, licRes, devRes, userRes, compRes, saasRes, savingsRes] = await Promise.all([
    client
      .from('applications')
      .select('id, name, app_type, monthly_cost, total_usage_minutes, active_usage_minutes, renewal_date, vendors(name), category')
      .eq('tenant_id', tenantId),
    client
      .from('licences')
      .select(`
        id, purchased_quantity, consumed_quantity, compliance_status, cost_per_licence,
        applications(name, renewal_date, vendors(name)),
        contracts(renewal_date)
      `)
      .eq('tenant_id', tenantId),
    client.from('devices').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId),
    client.from('users_profile').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId),
    client.from('compliance_results').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId),
    client.from('saas_detections').select('id, approved').eq('tenant_id', tenantId),
    client
      .from('savings_recommendations')
      .select('id, estimated_annual_savings')
      .eq('tenant_id', tenantId),
  ]);

  const apps = appsRes.data ?? [];
  const licences = licRes.data ?? [];
  const saasDetections = saasRes.data ?? [];
  const savings = savingsRes.data ?? [];

  const totalMonthlySpend = apps.reduce((sum, app) => sum + n(app.monthly_cost), 0);
  const underusedLicences = licences.reduce((sum, lic) => {
    if (lic.compliance_status !== 'over-licensed') return sum;
    return sum + Math.max(n(lic.purchased_quantity) - n(lic.consumed_quantity), 0);
  }, 0);
  const potentialSavings = savings.reduce((sum, s) => sum + n(s.estimated_annual_savings), 0);

  const spendByVendor = Object.values(
    apps.reduce<Record<string, { vendor: string; spend: number }>>((acc, app) => {
      const vendor = s((app.vendors as Row | null)?.name) || 'Unknown';
      acc[vendor] ??= { vendor, spend: 0 };
      acc[vendor].spend += n(app.monthly_cost);
      return acc;
    }, {})
  ).sort((a, b) => b.spend - a.spend);

  const usageByCategory = Object.values(
    apps.reduce<Record<string, { category: string; active: number; total: number }>>((acc, app) => {
      const cat = s(app.category) || 'Other';
      acc[cat] ??= { category: cat, active: 0, total: 0 };
      acc[cat].active += n(app.active_usage_minutes);
      acc[cat].total += n(app.total_usage_minutes);
      return acc;
    }, {})
  );

  const renewalTimeline = licences
    .map(lic => {
      const app = lic.applications as Row | null;
      const contract = lic.contracts as Row | null;
      const renewalDate = s(contract?.renewal_date ?? app?.renewal_date);
      const vendor = s((app?.vendors as Row | null)?.name) || 'Unknown';
      return {
        application: s(app?.name),
        vendor,
        renewalDate,
        days: daysUntil(renewalDate),
        annualValue: Math.round(n(lic.purchased_quantity) * n(lic.cost_per_licence) * 12),
      };
    })
    .filter(r => r.renewalDate)
    .sort((a, b) => a.days - b.days);

  const upcomingRenewals = renewalTimeline.filter(r => r.days <= 90).length;
  const shadowSaas = saasDetections.filter(d => !d.approved).length;

  return {
    cards: {
      totalSoftwareApplications: apps.length,
      saasApplications: apps.filter(app => app.app_type === 'SaaS' || app.app_type === 'browser app').length,
      onPremApplications: apps.filter(app => app.app_type === 'desktop' || app.app_type === 'server').length,
      totalDevices: devRes.count ?? 0,
      totalUsers: userRes.count ?? 0,
      monthlySoftwareSpend: totalMonthlySpend,
      potentialSavings,
      underusedLicences,
      complianceRiskCount: compRes.count ?? 0,
      upcomingRenewals,
      shadowSaasDetections: shadowSaas,
    },
    trends: [
      { label: 'Spend', value: totalMonthlySpend, change: 0 },
      { label: 'Active usage', value: apps.reduce((sum, app) => sum + n(app.active_usage_minutes), 0), change: 0 },
      { label: 'Risk findings', value: compRes.count ?? 0, change: 0 },
      { label: 'Shadow SaaS', value: shadowSaas, change: 0 },
    ],
    spendByVendor,
    usageByCategory,
    renewalTimeline,
  };
}
