import { generateRightsizingRecommendations, type CloudResourceForRightsizing, type CloudResourceMetric } from './cloudabilityEngine.js';

export const cloudPermissions = [
  'View Cloud Costs',
  'Manage Cloud Connectors',
  'View Recommendations',
  'Approve Recommendations',
  'Manage Budgets',
  'Export Reports',
  'Administer BennnCloudability'
];

export const cloudProviders = [
  { id: 'provider-aws', code: 'AWS', name: 'Amazon Web Services', status: 'Connected', icon: 'AWS', monthlySpend: 74820 },
  { id: 'provider-azure', code: 'Azure', name: 'Microsoft Azure', status: 'Connected', icon: 'AZ', monthlySpend: 58940 },
  { id: 'provider-gcp', code: 'GCP', name: 'Google Cloud Platform', status: 'Connected', icon: 'GC', monthlySpend: 41370 },
  { id: 'provider-oci', code: 'OCI', name: 'Oracle Cloud Infrastructure', status: 'Needs attention', icon: 'OC', monthlySpend: 18860 }
];

export const cloudAccounts = [
  { id: 'acct-aws-prod', provider: 'AWS', name: 'AWS Production', externalId: '123456789012', owner: 'Ava Collins', team: 'Platform', environment: 'Production' },
  { id: 'acct-aws-shared', provider: 'AWS', name: 'AWS Shared Services', externalId: '210987654321', owner: 'Noah Rivera', team: 'Security', environment: 'Production' },
  { id: 'acct-az-eng', provider: 'Azure', name: 'Azure Engineering', externalId: 'sub-eng-6ac4', owner: 'Ben Martin', team: 'Engineering', environment: 'Development' },
  { id: 'acct-az-corp', provider: 'Azure', name: 'Azure Corporate', externalId: 'sub-corp-912b', owner: 'Marcus Tan', team: 'Finance', environment: 'Production' },
  { id: 'acct-gcp-analytics', provider: 'GCP', name: 'GCP Analytics', externalId: 'northstar-analytics', owner: 'Sofia Walsh', team: 'Analytics', environment: 'Production' },
  { id: 'acct-oci-erp', provider: 'OCI', name: 'OCI ERP', externalId: 'ocid1.tenancy.demo', owner: 'Priya Singh', team: 'ERP', environment: 'Production' }
];

export const cloudConnections = [
  { id: 'conn-aws-cur', provider: 'AWS', name: 'AWS CUR and Cost Explorer', externalId: '123456789012', authMethod: 'Assume role placeholder', enabled: true, lastSync: '2026-05-29T03:20:00+08:00', status: 'Success' },
  { id: 'conn-azure-cma', provider: 'Azure', name: 'Azure Cost Management', externalId: 'sub-eng-6ac4', authMethod: 'Service principal placeholder', enabled: true, lastSync: '2026-05-29T03:35:00+08:00', status: 'Success' },
  { id: 'conn-gcp-billing', provider: 'GCP', name: 'GCP Billing Export', externalId: 'northstar-analytics', authMethod: 'Service account placeholder', enabled: true, lastSync: '2026-05-29T04:05:00+08:00', status: 'Success' },
  { id: 'conn-oci-usage', provider: 'OCI', name: 'OCI Usage API', externalId: 'ocid1.tenancy.demo', authMethod: 'API signing key placeholder', enabled: false, lastSync: '2026-05-27T22:15:00+08:00', status: 'Token review' }
];

export const cloudResources: CloudResourceForRightsizing[] = [
  { id: 'aws-compute-prod-01', name: 'prd-api-worker-01', provider: 'AWS', accountName: 'AWS Production', service: 'EC2', resourceType: 'Compute instance', sku: 'm6i.2xlarge', monthlyCost: 1480, environment: 'Production', owner: 'Ava Collins', team: 'Platform' },
  { id: 'aws-rds-prod-01', name: 'prd-orders-db', provider: 'AWS', accountName: 'AWS Production', service: 'RDS', resourceType: 'Database', sku: 'db.r6i.2xlarge', monthlyCost: 3920, environment: 'Production', owner: 'Ben Martin', team: 'Engineering' },
  { id: 'az-compute-dev-01', name: 'dev-build-agent-03', provider: 'Azure', accountName: 'Azure Engineering', service: 'Virtual Machines', resourceType: 'Compute instance', sku: 'Standard_D2s_v5', monthlyCost: 360, environment: 'Development', owner: 'Ben Martin', team: 'Engineering' },
  { id: 'az-disk-test-01', name: 'test-sql-data-disk', provider: 'Azure', accountName: 'Azure Engineering', service: 'Managed Disks', resourceType: 'Disk volume', sku: 'Premium SSD P30', monthlyCost: 280, environment: 'Test', owner: 'Priya Singh', team: 'ERP' },
  { id: 'gcp-compute-prod-01', name: 'analytics-transformer', provider: 'GCP', accountName: 'GCP Analytics', service: 'Compute Engine', resourceType: 'Compute instance', sku: 'n2-standard-8', monthlyCost: 1180, environment: 'Production', owner: 'Sofia Walsh', team: 'Analytics' },
  { id: 'gcp-bq-prod-01', name: 'finance-mart', provider: 'GCP', accountName: 'GCP Analytics', service: 'BigQuery', resourceType: 'Warehouse', sku: 'On demand', monthlyCost: 8640, environment: 'Production', owner: 'Sofia Walsh', team: 'Analytics' },
  { id: 'oci-compute-prod-01', name: 'erp-app-node-02', provider: 'OCI', accountName: 'OCI ERP', service: 'Compute', resourceType: 'Compute instance', sku: 'VM.Standard.E4.Flex-8', monthlyCost: 930, environment: 'Production', owner: 'Priya Singh', team: 'ERP' },
  { id: 'oci-block-idle-01', name: 'legacy-backup-volume', provider: 'OCI', accountName: 'OCI ERP', service: 'Block Volume', resourceType: 'Disk volume', sku: 'Balanced 4TB', monthlyCost: 410, environment: 'Production', owner: 'Ava Collins', team: 'Platform' }
];

export const cloudResourceMetrics: CloudResourceMetric[] = [
  { resourceId: 'aws-compute-prod-01', cpuP95: 11, cpuP99: 24, memoryP95: 42, runningHours30d: 720, networkP95: 18 },
  { resourceId: 'aws-rds-prod-01', cpuP95: 71, cpuP99: 88, memoryP95: 76, runningHours30d: 720, iopsP95: 68 },
  { resourceId: 'az-compute-dev-01', cpuP95: 88, cpuP99: 97, runningHours30d: 720, nonProdAfterHoursPercent: 61 },
  { resourceId: 'az-disk-test-01', cpuP95: 0, cpuP99: 0, storageUsedPercent: 22, runningHours30d: 720 },
  { resourceId: 'gcp-compute-prod-01', cpuP95: 9, cpuP99: 19, memoryP95: 36, runningHours30d: 720, networkP95: 11 },
  { resourceId: 'gcp-bq-prod-01', cpuP95: 58, cpuP99: 76, runningHours30d: 720 },
  { resourceId: 'oci-compute-prod-01', cpuP95: 14, cpuP99: 28, memoryP95: 49, runningHours30d: 720 },
  { resourceId: 'oci-block-idle-01', cpuP95: 0, cpuP99: 0, storageUsedPercent: 8, runningHours30d: 720 }
];

export const rightsizingRecommendations = generateRightsizingRecommendations(cloudResources, cloudResourceMetrics);

export const billingRecords = [
  { id: 'bill-001', provider: 'AWS', account: 'AWS Production', region: 'ap-southeast-2', service: 'EC2', resourceId: 'aws-compute-prod-01', resourceName: 'prd-api-worker-01', resourceType: 'Compute instance', sku: 'm6i.2xlarge', usageQuantity: 720, usageUnit: 'hours', cost: 1480, currency: 'AUD', billingPeriod: '2026-05', owner: 'Ava Collins', team: 'Platform', application: 'Customer Portal', environment: 'Production', costCentre: 'CC-100', tags: { application: 'customer-portal', env: 'prod', owner: 'platform' } },
  { id: 'bill-002', provider: 'AWS', account: 'AWS Production', region: 'ap-southeast-2', service: 'RDS', resourceId: 'aws-rds-prod-01', resourceName: 'prd-orders-db', resourceType: 'Database', sku: 'db.r6i.2xlarge', usageQuantity: 720, usageUnit: 'hours', cost: 3920, currency: 'AUD', billingPeriod: '2026-05', owner: 'Ben Martin', team: 'Engineering', application: 'Order Hub', environment: 'Production', costCentre: 'CC-210', tags: { application: 'orders', env: 'prod' } },
  { id: 'bill-003', provider: 'Azure', account: 'Azure Engineering', region: 'australiaeast', service: 'Virtual Machines', resourceId: 'az-compute-dev-01', resourceName: 'dev-build-agent-03', resourceType: 'Compute instance', sku: 'Standard_D2s_v5', usageQuantity: 720, usageUnit: 'hours', cost: 360, currency: 'AUD', billingPeriod: '2026-05', owner: 'Ben Martin', team: 'Engineering', application: 'Build Farm', environment: 'Development', costCentre: 'CC-210', tags: { application: 'build-farm', env: 'dev' } },
  { id: 'bill-004', provider: 'Azure', account: 'Azure Corporate', region: 'australiaeast', service: 'Microsoft Sentinel', resourceId: 'az-sentinel-01', resourceName: 'soc-sentinel', resourceType: 'Security analytics', sku: 'GB analytics', usageQuantity: 920, usageUnit: 'GB', cost: 6240, currency: 'AUD', billingPeriod: '2026-05', owner: 'Noah Rivera', team: 'Security', application: 'Security Operations', environment: 'Production', costCentre: 'CC-520', tags: { application: 'soc', env: 'prod' } },
  { id: 'bill-005', provider: 'GCP', account: 'GCP Analytics', region: 'australia-southeast1', service: 'BigQuery', resourceId: 'gcp-bq-prod-01', resourceName: 'finance-mart', resourceType: 'Warehouse', sku: 'On demand', usageQuantity: 41, usageUnit: 'TB scanned', cost: 8640, currency: 'AUD', billingPeriod: '2026-05', owner: 'Sofia Walsh', team: 'Analytics', application: 'Finance Analytics', environment: 'Production', costCentre: 'CC-410', tags: { application: 'finance-analytics', env: 'prod' } },
  { id: 'bill-006', provider: 'OCI', account: 'OCI ERP', region: 'ap-sydney-1', service: 'Compute', resourceId: 'oci-compute-prod-01', resourceName: 'erp-app-node-02', resourceType: 'Compute instance', sku: 'VM.Standard.E4.Flex-8', usageQuantity: 720, usageUnit: 'hours', cost: 930, currency: 'AUD', billingPeriod: '2026-05', owner: 'Priya Singh', team: 'ERP', application: 'ERP Core', environment: 'Production', costCentre: 'CC-110', tags: { application: 'erp-core' } }
];

export const dailySpend = [
  { date: '2026-05-01', AWS: 2110, Azure: 1740, GCP: 1280, OCI: 540 },
  { date: '2026-05-08', AWS: 2380, Azure: 1810, GCP: 1440, OCI: 610 },
  { date: '2026-05-15', AWS: 2550, Azure: 1960, GCP: 1890, OCI: 650 },
  { date: '2026-05-22', AWS: 2680, Azure: 2050, GCP: 3120, OCI: 690 },
  { date: '2026-05-29', AWS: 2920, Azure: 2290, GCP: 2010, OCI: 720 }
];

export const optimisationOpportunities = [
  { id: 'opt-001', category: 'Idle resources', resourceName: 'legacy-backup-volume', provider: 'OCI', savingOpportunity: 390, risk: 'Low', effort: 'Low', owner: 'Ava Collins', recommendedAction: 'Archive required data and delete idle block volume.' },
  { id: 'opt-002', category: 'Oversized compute', resourceName: 'analytics-transformer', provider: 'GCP', savingOpportunity: 448, risk: 'Medium', effort: 'Medium', owner: 'Sofia Walsh', recommendedAction: 'Move from n2-standard-8 to n2-standard-4 after batch test.' },
  { id: 'opt-003', category: 'Unused public IPs', resourceName: 'pip-old-vpn', provider: 'Azure', savingOpportunity: 72, risk: 'Low', effort: 'Low', owner: 'Noah Rivera', recommendedAction: 'Release unattached static public IP.' },
  { id: 'opt-004', category: 'Tagging issues', resourceName: 'prd-orders-db', provider: 'AWS', savingOpportunity: 0, risk: 'Medium', effort: 'Low', owner: 'Ben Martin', recommendedAction: 'Add cost centre and owner tags to improve allocation.' },
  { id: 'opt-005', category: 'Unused commitments', resourceName: 'EC2 regional compute', provider: 'AWS', savingOpportunity: 2860, risk: 'Low', effort: 'Medium', owner: 'Marcus Tan', recommendedAction: 'Buy one-year no-upfront compute savings plan for stable baseline.' }
];

export const budgets = [
  { id: 'bud-001', scopeType: 'Team', scopeName: 'Platform', budgetAmount: 82000, actualSpend: 74820, forecastSpend: 79600, variance: -2400, burnRate: 94, alertThreshold: 90 },
  { id: 'bud-002', scopeType: 'Team', scopeName: 'Engineering', budgetAmount: 62000, actualSpend: 67950, forecastSpend: 70400, variance: 8400, burnRate: 114, alertThreshold: 90 },
  { id: 'bud-003', scopeType: 'Application', scopeName: 'Finance Analytics', budgetAmount: 36000, actualSpend: 41370, forecastSpend: 45200, variance: 9200, burnRate: 126, alertThreshold: 85 },
  { id: 'bud-004', scopeType: 'Cost Centre', scopeName: 'CC-110', budgetAmount: 24000, actualSpend: 18860, forecastSpend: 19900, variance: -4100, burnRate: 83, alertThreshold: 90 }
];

export const anomalies = [
  { id: 'ano-001', detectedAt: '2026-05-22', provider: 'GCP', service: 'BigQuery', ownerTeam: 'Analytics', expectedCost: 1410, actualCost: 3120, variance: 1710, likelyDriver: 'Finance mart backfill scanned 18 TB more than baseline.', status: 'Reviewing' },
  { id: 'ano-002', detectedAt: '2026-05-18', provider: 'Azure', service: 'Microsoft Sentinel', ownerTeam: 'Security', expectedCost: 950, actualCost: 1840, variance: 890, likelyDriver: 'Diagnostic logs duplicated from firewall workspace.', status: 'New' },
  { id: 'ano-003', detectedAt: '2026-05-11', provider: 'AWS', service: 'NAT Gateway', ownerTeam: 'Platform', expectedCost: 420, actualCost: 880, variance: 460, likelyDriver: 'Cross-AZ data processing from image pipeline.', status: 'Approved' }
];

export const allocationRules = [
  { id: 'alloc-001', ruleType: 'Tag-based allocation', rule: 'tag.application maps to application', allocatedSpend: 128400, unallocatedSpend: 9400, qualityScore: 93, missingTags: 7 },
  { id: 'alloc-002', ruleType: 'Shared cost split by percentage', rule: 'Security shared services split Platform 50%, Engineering 30%, Finance 20%', allocatedSpend: 18400, unallocatedSpend: 0, qualityScore: 100, missingTags: 0 },
  { id: 'alloc-003', ruleType: 'Cost centre allocation', rule: 'costCentre from tag or account default', allocatedSpend: 47200, unallocatedSpend: 6800, qualityScore: 87, missingTags: 11 }
];

export const reportTemplates = [
  { id: 'cl-rpt-001', name: 'Executive Cloud Summary', description: 'Board-ready cloud spend, forecast, variance and savings summary.', dataset: 'cloud_billing_records', filters: ['period', 'provider', 'team'], exportFormats: ['CSV', 'XLSX', 'PDF'] },
  { id: 'cl-rpt-002', name: 'Monthly Cloud Spend', description: 'Normalised spend by provider, account, service, team and application.', dataset: 'cloud_billing_records', filters: ['month', 'account', 'service'], exportFormats: ['CSV', 'XLSX', 'PDF'] },
  { id: 'cl-rpt-003', name: 'Rightsizing Opportunities', description: 'p95/p99 based recommendations with confidence, risk and savings.', dataset: 'cloud_rightsizing_recommendations', filters: ['provider', 'status', 'risk'], exportFormats: ['CSV', 'XLSX', 'PDF'] },
  { id: 'cl-rpt-004', name: 'Optimisation Savings', description: 'Idle, orphaned and commitment optimisation pipeline.', dataset: 'cloud_optimisation_opportunities', filters: ['category', 'owner', 'effort'], exportFormats: ['CSV', 'XLSX', 'PDF'] },
  { id: 'cl-rpt-005', name: 'Budget Variance', description: 'Budget, actual, forecast, variance and burn-rate reporting.', dataset: 'cloud_budgets', filters: ['scope', 'threshold'], exportFormats: ['CSV', 'XLSX', 'PDF'] },
  { id: 'cl-rpt-006', name: 'Anomaly Report', description: 'Daily spend, service, account and team-level anomalies.', dataset: 'cloud_anomalies', filters: ['date', 'provider', 'status'], exportFormats: ['CSV', 'XLSX', 'PDF'] }
];

export const governanceActions = [
  { id: 'gov-001', action: 'Approved rightsizing pilot', actor: 'Ava Collins', entity: 'analytics-transformer', status: 'Approved', createdAt: '2026-05-28T10:00:00+08:00' },
  { id: 'gov-002', action: 'Snoozed production database recommendation', actor: 'Ben Martin', entity: 'prd-orders-db', status: 'Snoozed', createdAt: '2026-05-27T15:20:00+08:00' },
  { id: 'gov-003', action: 'Updated protected tags', actor: 'Priya Singh', entity: 'costCentre, application, owner', status: 'Implemented', createdAt: '2026-05-26T13:35:00+08:00' }
];

export function cloudabilityPayload() {
  const totalSpend = cloudProviders.reduce((sum, provider) => sum + provider.monthlySpend, 0);
  const identifiedSavings = rightsizingRecommendations.reduce((sum, rec) => sum + Math.max(rec.estimatedMonthlySaving, 0), 0) + optimisationOpportunities.reduce((sum, item) => sum + item.savingOpportunity, 0);
  return {
    permissions: cloudPermissions,
    providers: cloudProviders,
    accounts: cloudAccounts,
    connections: cloudConnections,
    billingRecords,
    dailySpend,
    resources: cloudResources.map((resource) => ({ ...resource, metrics: cloudResourceMetrics.find((metric) => metric.resourceId === resource.id) })),
    rightsizingRecommendations,
    optimisationOpportunities,
    budgets,
    anomalies,
    allocationRules,
    reportTemplates,
    governanceActions,
    summary: {
      totalSpend,
      monthToDateSpend: Math.round(totalSpend * 0.94),
      forecastMonthEndSpend: Math.round(totalSpend * 1.07),
      budgetVariance: budgets.reduce((sum, budget) => sum + budget.variance, 0),
      identifiedSavings,
      realisedSavings: 4120
    }
  };
}
