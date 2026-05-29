// ---------------------------------------------------------------------------
// mockApi.ts – client-side implementations of every Express route so the
// frontend can run as a fully static bundle (VITE_DEMO_MODE=true) on any
// plain web host (cPanel, Netlify, GitHub Pages …) with no Node API needed.
// ---------------------------------------------------------------------------

import {
  applications,
  auditLog,
  complianceResults,
  costRecords,
  customInventoryRules,
  departments,
  devices,
  exportWorkflows,
  integrations,
  licences,
  normalizationReviewQueue,
  reports,
  saasDetections,
  savingsRecommendations,
  usageEvents,
  users
} from './demoData';
import { cloudConnections, cloudabilityPayload } from './cloudabilityData';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TODAY = new Date('2026-05-27T00:00:00+08:00');

function inDays(dateStr: string) {
  const target = new Date(`${dateStr}T00:00:00+08:00`);
  return Math.ceil((target.getTime() - TODAY.getTime()) / 86_400_000);
}

function aggregateCost(field: keyof (typeof costRecords)[number]) {
  return Object.values(
    costRecords.reduce<Record<string, { name: string; monthlyCost: number }>>((acc, record) => {
      const name = String(record[field]);
      acc[name] ??= { name, monthlyCost: 0 };
      acc[name].monthlyCost += record.monthlyCost;
      return acc;
    }, {})
  ).sort((a, b) => b.monthlyCost - a.monthlyCost);
}

function sampleRowsForDataset(dataset: string): unknown[] {
  const lookup: Record<string, unknown[]> = {
    applications,
    saas_detections: saasDetections,
    licence_entitlements: licences,
    savings_recommendations: savingsRecommendations,
    licences,
    usage_events: usageEvents,
    devices,
    cost_records: costRecords
  };
  return lookup[dataset]?.slice(0, 10) ?? applications.slice(0, 10);
}

// Simple deterministic nanoid substitute for demo mode (no package needed)
let _mockIdCounter = 1;
function mockId(prefix: string) {
  return `${prefix}-${(++_mockIdCounter).toString(36).padStart(4, '0')}`;
}

// ---------------------------------------------------------------------------
// Assistant query (ported from apps/api/src/reportEngine.ts)
// ---------------------------------------------------------------------------

const fmt = new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 });

function runAssistantQuery(prompt: string) {
  const q = prompt.toLowerCase();

  if (q.includes('unused') || q.includes('underused')) {
    const rows = savingsRecommendations
      .filter(r => r.estimatedAnnualSavings >= 10000 || r.type === 'cancel unused')
      .map(r => ({ application: r.applicationName, department: r.department, recommendation: r.type, annualSavings: r.estimatedAnnualSavings, reason: r.reason, status: r.status }));
    return {
      title: 'Unused and Underused Licence Opportunities',
      queryTemplate: 'savings_recommendations where type in (cancel unused, downgrade) and annual_savings >= threshold',
      summary: `Found ${rows.length} optimisation opportunities with a combined annual value of ${fmt.format(rows.reduce((s, r) => s + Number(r.annualSavings), 0))}.`,
      chartType: 'bar' as const, rows
    };
  }

  if (q.includes('used but not approved') || q.includes('shadow')) {
    const rows = saasDetections
      .filter(r => !r.approved)
      .map(r => ({ app: r.saasAppName, domain: r.domain, detectedUsers: r.detectedUsers, activeUsers: r.activeUsers, riskRating: r.riskRating, source: r.source }));
    return {
      title: 'SaaS Apps Used Without Approval',
      queryTemplate: 'saas_detections where approved = false ordered by detected_users desc',
      summary: `${rows.length} unapproved SaaS applications were detected through browser or import evidence.`,
      chartType: 'pie' as const, rows
    };
  }

  if (q.includes('renewal') || q.includes('90 days')) {
    const ninetyDays = new Date(TODAY);
    ninetyDays.setDate(TODAY.getDate() + 90);
    const rows = licences
      .filter(l => {
        const d = new Date(`${l.renewalDate}T00:00:00+08:00`);
        return d >= TODAY && d <= ninetyDays;
      })
      .map(l => ({ application: l.applicationName, vendor: l.vendor, renewalDate: l.renewalDate, owner: l.contractOwner, status: l.complianceStatus, annualValue: Math.round(l.purchasedQuantity * l.costPerLicence * 12) }));
    return {
      title: 'Renewals Due in the Next 90 Days',
      queryTemplate: 'licence_entitlements where renewal_date between today and today + 90 days',
      summary: `${rows.length} renewals need preparation before ${ninetyDays.toISOString().slice(0, 10)}.`,
      chartType: 'bar' as const, rows
    };
  }

  if (q.includes('expensive') || q.includes('low active usage')) {
    const rows = usageEvents
      .filter(e => e.totalMinutes > 0 && e.activeMinutes / e.totalMinutes < 0.35)
      .map(e => {
        const app = applications.find(a => a.id === e.appId);
        return { user: e.userName, application: e.appName, monthlyAppCost: app?.monthlyCost ?? 0, activeMinutes: e.activeMinutes, totalMinutes: e.totalMinutes, activeRatio: `${Math.round((e.activeMinutes / e.totalMinutes) * 100)}%` };
      })
      .sort((a, b) => Number(b.monthlyAppCost) - Number(a.monthlyAppCost));
    return {
      title: 'Expensive Licences With Low Active Usage',
      queryTemplate: 'usage_events joined applications where active_minutes / total_minutes < 0.35 ordered by monthly_cost desc',
      summary: `${rows.length} user/application combinations show low foreground activity compared with entitlement cost.`,
      chartType: 'bar' as const, rows
    };
  }

  const rows = complianceResults.map(f => ({ finding: f.finding, application: f.applicationName, severity: f.severity, riskScore: f.riskScore, owner: f.owner, dueDate: f.dueDate }));
  return {
    title: 'Compliance and Risk Snapshot',
    queryTemplate: 'compliance_results ordered by risk_score desc',
    summary: `Showing ${rows.length} prioritized compliance findings. Try asking about renewals, shadow SaaS, or unused licences.`,
    chartType: 'bar' as const, rows
  };
}

// ---------------------------------------------------------------------------
// Route table (path → handler)
// ---------------------------------------------------------------------------

/** Matches a path pattern that may include :param segments. */
function matchPath(pattern: string, path: string): Record<string, string> | null {
  const patParts = pattern.split('/');
  const pathParts = path.split('?')[0].split('/');
  if (patParts.length !== pathParts.length) return null;
  const params: Record<string, string> = {};
  for (let i = 0; i < patParts.length; i++) {
    if (patParts[i].startsWith(':')) {
      params[patParts[i].slice(1)] = pathParts[i];
    } else if (patParts[i] !== pathParts[i]) {
      return null;
    }
  }
  return params;
}

// ---------------------------------------------------------------------------
// Public API used by api.ts
// ---------------------------------------------------------------------------

export function mockGet<T>(path: string): T {
  const bare = path.split('?')[0];

  // /overview
  if (bare === '/overview') {
    const totalMonthlySpend = applications.reduce((s, a) => s + a.monthlyCost, 0);
    const underusedLicences = licences.reduce((s, l) => {
      if (l.complianceStatus !== 'over-licensed') return s;
      return s + Math.max(l.purchasedQuantity - l.consumedQuantity, 0);
    }, 0);
    return {
      cards: {
        totalSoftwareApplications: applications.length,
        saasApplications: applications.filter(a => a.type === 'SaaS' || a.type === 'browser app').length,
        onPremApplications: applications.filter(a => a.type === 'desktop' || a.type === 'server').length,
        totalDevices: devices.length,
        totalUsers: users.length,
        monthlySoftwareSpend: totalMonthlySpend,
        potentialSavings: savingsRecommendations.reduce((s, r) => s + r.estimatedAnnualSavings, 0),
        underusedLicences,
        complianceRiskCount: complianceResults.length,
        upcomingRenewals: licences.filter(l => inDays(l.renewalDate) <= 90).length,
        shadowSaasDetections: saasDetections.filter(s => !s.approved).length
      },
      trends: [
        { label: 'Spend',        value: totalMonthlySpend, change: 7.4 },
        { label: 'Active usage', value: applications.reduce((s, a) => s + a.activeUsageMinutes, 0), change: 3.1 },
        { label: 'Risk findings',value: complianceResults.length, change: -8.2 },
        { label: 'Shadow SaaS', value: saasDetections.filter(s => !s.approved).length, change: 12.5 }
      ],
      spendByVendor: Object.values(
        applications.reduce<Record<string, { vendor: string; spend: number }>>((acc, a) => {
          acc[a.vendor] ??= { vendor: a.vendor, spend: 0 };
          acc[a.vendor].spend += a.monthlyCost;
          return acc;
        }, {})
      ).sort((a, b) => b.spend - a.spend),
      usageByCategory: Object.values(
        applications.reduce<Record<string, { category: string; active: number; total: number }>>((acc, a) => {
          acc[a.category] ??= { category: a.category, active: 0, total: 0 };
          acc[a.category].active += a.activeUsageMinutes;
          acc[a.category].total += a.totalUsageMinutes;
          return acc;
        }, {})
      ),
      renewalTimeline: licences
        .map(l => ({ application: l.applicationName, vendor: l.vendor, renewalDate: l.renewalDate, days: inDays(l.renewalDate), annualValue: Math.round(l.purchasedQuantity * l.costPerLicence * 12) }))
        .sort((a, b) => a.days - b.days)
    } as unknown as T;
  }

  // /bootstrap
  if (bare === '/bootstrap') {
    return { departments, users, auditLog } as unknown as T;
  }

  // /applications
  if (bare === '/applications') {
    const params = new URLSearchParams(path.includes('?') ? path.split('?')[1] : '');
    const q = (params.get('q') ?? '').toLowerCase();
    const type = params.get('type') ?? 'all';
    return applications.filter(a => {
      const matchQ = !q || [a.name, a.vendor, a.category, a.owner ?? '', a.tags.join(' ')].join(' ').toLowerCase().includes(q);
      const matchT = type === 'all' || a.type === type;
      return matchQ && matchT;
    }) as unknown as T;
  }

  // /applications/:id
  const appMatch = matchPath('/applications/:id', bare);
  if (appMatch) {
    const app = applications.find(a => a.id === appMatch.id);
    if (!app) throw new Error('Application not found');
    return { ...app, licences: licences.filter(l => l.applicationId === app.id), usage: usageEvents.filter(u => u.appId === app.id), compliance: complianceResults.filter(c => c.applicationName === app.name) } as unknown as T;
  }

  // /devices  /hardware
  if (bare === '/devices' || bare === '/hardware') {
    return devices as unknown as T;
  }

  // /usage
  if (bare === '/usage') {
    const underuse = applications
      .filter(a => a.activeUsageMinutes / Math.max(a.totalUsageMinutes, 1) < 0.45)
      .map(a => ({ app: a.name, activeUsers: a.activeUsers, activeRatio: Math.round((a.activeUsageMinutes / Math.max(a.totalUsageMinutes, 1)) * 100), monthlyCost: a.monthlyCost }));
    return {
      events: usageEvents,
      underuse,
      zombieApps: applications.filter(a => a.activeUsers === 0 || a.activeUsageMinutes < 2000),
      heavyUsers: usageEvents.filter(e => e.activeMinutes > 120),
      dormantApps: applications.filter(a => a.activeUsers < 5 || a.lastDetectedDate < '2026-05-19'),
      renewalRecommendations: savingsRecommendations.filter(r => r.type === 'renewal prep' || r.type === 'downgrade')
    } as unknown as T;
  }

  // /saas
  if (bare === '/saas') {
    return {
      detections: saasDetections,
      known: saasDetections.filter(s => s.approved),
      unknown: saasDetections.filter(s => !s.approved),
      domains: saasDetections.map(s => ({ domain: s.domain, application: s.saasAppName, approved: s.approved }))
    } as unknown as T;
  }

  // /licences
  if (bare === '/licences') return licences as unknown as T;

  // /costs
  if (bare === '/costs') {
    return {
      records: costRecords,
      recommendations: savingsRecommendations,
      byVendor: aggregateCost('vendor'),
      byApp: aggregateCost('applicationName'),
      byUser: aggregateCost('userName'),
      byDevice: aggregateCost('deviceName'),
      byDepartment: aggregateCost('department')
    } as unknown as T;
  }

  // /compliance
  if (bare === '/compliance') {
    return {
      results: complianceResults,
      rules: [
        { id: 'risk-001', name: 'EOL software severity',   condition: 'eol_date < today',                              weight: 35, enabled: true },
        { id: 'risk-002', name: 'Unapproved SaaS',         condition: 'approved = false and detected_users > 0',       weight: 30, enabled: true },
        { id: 'risk-003', name: 'Missing owner',            condition: 'owner is null and monthly_cost > 1000',         weight: 20, enabled: true }
      ],
      auditReady: complianceResults.filter(f => f.owner && f.evidence).length,
      evidenceExportRows: complianceResults.length
    } as unknown as T;
  }

  // /integrations
  if (bare === '/integrations') return integrations as unknown as T;

  // /export-workflows
  if (bare === '/export-workflows') return exportWorkflows as unknown as T;

  // /rules
  if (bare === '/rules') return customInventoryRules as unknown as T;

  // /normalization
  if (bare === '/normalization') {
    return {
      rawInventory: [
        { id: 'raw-001', rawName: 'MS Office 365 Apps', source: 'Intune', firstSeen: '2026-05-18', lastSeen: '2026-05-26' },
        { id: 'raw-002', rawName: 'AdobeCC All',         source: 'Jamf',   firstSeen: '2026-05-15', lastSeen: '2026-05-26' },
        { id: 'raw-003', rawName: 'sql std 13.x',        source: 'SCCM',   firstSeen: '2026-05-10', lastSeen: '2026-05-18' }
      ],
      reviewQueue: normalizationReviewQueue,
      rules: customInventoryRules,
      normalizedApplications: applications
    } as unknown as T;
  }

  // /reports
  if (bare === '/reports') return reports as unknown as T;

  // /cloudability
  if (bare === '/cloudability') return cloudabilityPayload() as unknown as T;

  throw new Error(`[demo] No mock GET handler for ${path}`);
}

export function mockPost<T>(path: string, body: unknown): T {
  const bare = path.split('?')[0];
  const b = body as Record<string, unknown>;

  // /imports/csv
  if (bare === '/imports/csv') {
    const rows = Array.isArray(b.rows) ? b.rows : [];
    return { importId: mockId('imp'), dataset: 'raw_inventory_events', accepted: true, rowsReceived: rows.length, message: 'Demo import accepted.' } as unknown as T;
  }

  // /agent/upload
  if (bare === '/agent/upload') {
    return { uploadId: mockId('agent'), receivedAt: new Date().toISOString(), accepted: true, hostname: (b.hostname as string) ?? 'unknown-host', message: 'Mock agent payload accepted for inventory normalization. No endpoint monitoring is performed.' } as unknown as T;
  }

  // /integrations/:id/sync
  const syncMatch = matchPath('/integrations/:id/sync', bare);
  if (syncMatch) {
    const integration = integrations.find(i => i.id === syncMatch.id);
    if (!integration) throw new Error('Integration not found');
    const log = { at: new Date().toISOString(), status: 'success' as const, message: `Manual sync queued for ${integration.name}. Demo sync completed with ${Math.floor(Math.random() * 25) + 5} records.` };
    integration.lastSync = log.at;
    integration.connectionStatus = 'connected';
    (integration.syncLogs as Array<{ at: string; status: string; message: string }>).unshift(log);
    return integration as unknown as T;
  }

  // /export-workflows  (create)
  if (bare === '/export-workflows') {
    const workflow = {
      id: mockId('flow'),
      name: (b.name as string) ?? 'Untitled export workflow',
      sourceDataset: (b.sourceDataset as string) ?? 'applications',
      filters: (b.filters as string) ?? 'approved = true',
      mappedFields: (b.mappedFields as Array<{ source: string; destination: string }>) ?? [{ source: 'name', destination: 'name' }],
      destination: (b.destination as string) ?? 'CSV',
      schedule: (b.schedule as string) ?? 'manual',
      enabled: true,
      executionLogs: [] as Array<{ at: string; status: string; records: number; message: string }>
    };
    exportWorkflows.unshift(workflow);
    return workflow as unknown as T;
  }

  // /export-workflows/:id/run
  const runWorkflowMatch = matchPath('/export-workflows/:id/run', bare);
  if (runWorkflowMatch) {
    const workflow = exportWorkflows.find(w => w.id === runWorkflowMatch.id);
    if (!workflow) throw new Error('Workflow not found');
    workflow.executionLogs.unshift({ at: new Date().toISOString(), status: 'success', records: Math.floor(Math.random() * 80) + 8, message: `Manual ${workflow.destination} export completed.` });
    return workflow as unknown as T;
  }

  // /assistant/query
  if (bare === '/assistant/query') {
    const prompt = String(b.prompt ?? '');
    if (!prompt.trim()) throw new Error('Prompt is required');
    return runAssistantQuery(prompt) as unknown as T;
  }

  // /rules/test
  if (bare === '/rules/test') {
    const matchValue = String(b.matchValue ?? '');
    const sample = String(b.sample ?? '');
    const matched = sample.toLowerCase().includes(matchValue.toLowerCase());
    return {
      matched,
      confidence: matched ? 91 : 22,
      normalizedApplication: matched ? (customInventoryRules.find(r => r.matchValue.toLowerCase() === matchValue.toLowerCase())?.normalizedApplication ?? 'Review required') : 'No match',
      evidence: matched ? `Sample contained "${matchValue}".` : 'No configured token was found in the sample.'
    } as unknown as T;
  }

  // /reports/run
  if (bare === '/reports/run') {
    const report = reports.find(r => r.id === b.reportId) ?? reports[0];
    return { id: mockId('run'), report, ranAt: new Date().toISOString(), rows: sampleRowsForDataset(report.dataset), exportUrl: `/api/reports/${report.id}/export.csv` } as unknown as T;
  }

  // /cloudability/connections/:id/test
  const cloudTestMatch = matchPath('/cloudability/connections/:id/test', bare);
  if (cloudTestMatch) {
    const connection = cloudConnections.find(c => c.id === cloudTestMatch.id);
    if (!connection) throw new Error('Cloud connection not found');
    return {
      ...connection,
      status: connection.enabled ? 'Success' : 'Configuration required',
      message: connection.enabled
        ? `${connection.provider} connector credentials validated in demo mode.`
        : `${connection.provider} connector is disabled; enable it before syncing.`
    } as unknown as T;
  }

  // /cloudability/connections/:id/sync
  const cloudSyncMatch = matchPath('/cloudability/connections/:id/sync', bare);
  if (cloudSyncMatch) {
    const connection = cloudConnections.find(c => c.id === cloudSyncMatch.id);
    if (!connection) throw new Error('Cloud connection not found');
    connection.lastSync = new Date().toISOString();
    connection.status = 'Success';
    return { ...connection, message: `Demo ${connection.provider} cost sync completed.` } as unknown as T;
  }

  throw new Error(`[demo] No mock POST handler for ${path}`);
}
