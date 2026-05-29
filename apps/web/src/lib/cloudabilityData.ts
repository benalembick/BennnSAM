export type CloudProviderCode = 'AWS' | 'Azure' | 'GCP' | 'OCI';

export type CloudabilityPayload = ReturnType<typeof cloudabilityPayload>;

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
  { id: 'provider-aws', code: 'AWS' as const, name: 'Amazon Web Services', status: 'Connected', icon: 'AWS', monthlySpend: 74820 },
  { id: 'provider-azure', code: 'Azure' as const, name: 'Microsoft Azure', status: 'Connected', icon: 'AZ', monthlySpend: 58940 },
  { id: 'provider-gcp', code: 'GCP' as const, name: 'Google Cloud Platform', status: 'Connected', icon: 'GC', monthlySpend: 41370 },
  { id: 'provider-oci', code: 'OCI' as const, name: 'Oracle Cloud Infrastructure', status: 'Needs attention', icon: 'OC', monthlySpend: 18860 }
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

export const cloudResources = [
  { id: 'aws-compute-prod-01', name: 'prd-api-worker-01', provider: 'AWS', accountName: 'AWS Production', region: 'ap-southeast-2', service: 'EC2', resourceType: 'Compute instance', sku: 'm6i.2xlarge', monthlyCost: 1480, environment: 'Production', owner: 'Ava Collins', team: 'Platform', application: 'Customer Portal', costCentre: 'CC-100', tags: { application: 'customer-portal', env: 'prod', owner: 'platform' } },
  { id: 'aws-rds-prod-01', name: 'prd-orders-db', provider: 'AWS', accountName: 'AWS Production', region: 'ap-southeast-2', service: 'RDS', resourceType: 'Database', sku: 'db.r6i.2xlarge', monthlyCost: 3920, environment: 'Production', owner: 'Ben Martin', team: 'Engineering', application: 'Order Hub', costCentre: 'CC-210', tags: { application: 'orders', env: 'prod' } },
  { id: 'az-compute-dev-01', name: 'dev-build-agent-03', provider: 'Azure', accountName: 'Azure Engineering', region: 'australiaeast', service: 'Virtual Machines', resourceType: 'Compute instance', sku: 'Standard_D2s_v5', monthlyCost: 360, environment: 'Development', owner: 'Ben Martin', team: 'Engineering', application: 'Build Farm', costCentre: 'CC-210', tags: { application: 'build-farm', env: 'dev' } },
  { id: 'az-disk-test-01', name: 'test-sql-data-disk', provider: 'Azure', accountName: 'Azure Engineering', region: 'australiaeast', service: 'Managed Disks', resourceType: 'Disk volume', sku: 'Premium SSD P30', monthlyCost: 280, environment: 'Test', owner: 'Priya Singh', team: 'ERP', application: 'ERP Test', costCentre: 'CC-110', tags: { env: 'test' } },
  { id: 'gcp-compute-prod-01', name: 'analytics-transformer', provider: 'GCP', accountName: 'GCP Analytics', region: 'australia-southeast1', service: 'Compute Engine', resourceType: 'Compute instance', sku: 'n2-standard-8', monthlyCost: 1180, environment: 'Production', owner: 'Sofia Walsh', team: 'Analytics', application: 'Finance Analytics', costCentre: 'CC-410', tags: { application: 'finance-analytics', env: 'prod' } },
  { id: 'gcp-bq-prod-01', name: 'finance-mart', provider: 'GCP', accountName: 'GCP Analytics', region: 'australia-southeast1', service: 'BigQuery', resourceType: 'Warehouse', sku: 'On demand', monthlyCost: 8640, environment: 'Production', owner: 'Sofia Walsh', team: 'Analytics', application: 'Finance Analytics', costCentre: 'CC-410', tags: { application: 'finance-analytics', env: 'prod' } },
  { id: 'oci-compute-prod-01', name: 'erp-app-node-02', provider: 'OCI', accountName: 'OCI ERP', region: 'ap-sydney-1', service: 'Compute', resourceType: 'Compute instance', sku: 'VM.Standard.E4.Flex-8', monthlyCost: 930, environment: 'Production', owner: 'Priya Singh', team: 'ERP', application: 'ERP Core', costCentre: 'CC-110', tags: { application: 'erp-core' } },
  { id: 'oci-block-idle-01', name: 'legacy-backup-volume', provider: 'OCI', accountName: 'OCI ERP', region: 'ap-sydney-1', service: 'Block Volume', resourceType: 'Disk volume', sku: 'Balanced 4TB', monthlyCost: 410, environment: 'Production', owner: 'Ava Collins', team: 'Platform', application: 'Legacy Backup', costCentre: 'CC-100', tags: {} }
];

export const cloudResourceMetrics = [
  { resourceId: 'aws-compute-prod-01', cpuP95: 11, cpuP99: 24, memoryP95: 42, runningHours30d: 720, networkP95: 18 },
  { resourceId: 'aws-rds-prod-01', cpuP95: 71, cpuP99: 88, memoryP95: 76, runningHours30d: 720, iopsP95: 68 },
  { resourceId: 'az-compute-dev-01', cpuP95: 88, cpuP99: 97, runningHours30d: 720, nonProdAfterHoursPercent: 61 },
  { resourceId: 'az-disk-test-01', cpuP95: 0, cpuP99: 0, storageUsedPercent: 22, runningHours30d: 720 },
  { resourceId: 'gcp-compute-prod-01', cpuP95: 9, cpuP99: 19, memoryP95: 36, runningHours30d: 720, networkP95: 11 },
  { resourceId: 'gcp-bq-prod-01', cpuP95: 58, cpuP99: 76, runningHours30d: 720 },
  { resourceId: 'oci-compute-prod-01', cpuP95: 14, cpuP99: 28, memoryP95: 49, runningHours30d: 720 },
  { resourceId: 'oci-block-idle-01', cpuP95: 0, cpuP99: 0, storageUsedPercent: 8, runningHours30d: 720 }
];

export const rightsizingRecommendations = [
  { id: 'rs-aws-compute-prod-01', resourceId: 'aws-compute-prod-01', resourceName: 'prd-api-worker-01', provider: 'AWS', accountName: 'AWS Production', currentSku: 'm6i.2xlarge', recommendedSku: 'm6i.xlarge', recommendationType: 'Downsize oversized compute', reason: 'p95 and p99 utilisation remain materially below policy thresholds.', supportingMetrics: 'CPU p95 11%, CPU p99 24%, memory p95 42%, 30d runtime 720h', estimatedMonthlySaving: 562, estimatedAnnualSaving: 6744, confidenceScore: 86, riskScore: 34, status: 'New', owner: 'Ava Collins', team: 'Platform' },
  { id: 'rs-az-compute-dev-01', resourceId: 'az-compute-dev-01', resourceName: 'dev-build-agent-03', provider: 'Azure', accountName: 'Azure Engineering', currentSku: 'Standard_D2s_v5', recommendedSku: 'Standard_D4s_v5', recommendationType: 'Upsize under-provisioned compute', reason: 'Sustained high p95/p99 CPU indicates performance risk.', supportingMetrics: 'CPU p95 88%, CPU p99 97%, memory unavailable, 30d runtime 720h', estimatedMonthlySaving: -79, estimatedAnnualSaving: -948, confidenceScore: 79, riskScore: 68, status: 'Reviewing', owner: 'Ben Martin', team: 'Engineering' },
  { id: 'rs-az-disk-test-01', resourceId: 'az-disk-test-01', resourceName: 'test-sql-data-disk', provider: 'Azure', accountName: 'Azure Engineering', currentSku: 'Premium SSD P30', recommendedSku: 'Premium SSD P20', recommendationType: 'Resize storage', reason: 'Provisioned storage is materially above p95 usage.', supportingMetrics: 'Storage used 22%, 30d runtime 720h', estimatedMonthlySaving: 78, estimatedAnnualSaving: 936, confidenceScore: 81, riskScore: 26, status: 'New', owner: 'Priya Singh', team: 'ERP' },
  { id: 'rs-gcp-compute-prod-01', resourceId: 'gcp-compute-prod-01', resourceName: 'analytics-transformer', provider: 'GCP', accountName: 'GCP Analytics', currentSku: 'n2-standard-8', recommendedSku: 'n2-standard-4', recommendationType: 'Downsize oversized compute', reason: 'p95 and p99 utilisation remain materially below policy thresholds.', supportingMetrics: 'CPU p95 9%, CPU p99 19%, memory p95 36%, 30d runtime 720h', estimatedMonthlySaving: 448, estimatedAnnualSaving: 5376, confidenceScore: 86, riskScore: 34, status: 'Approved', owner: 'Sofia Walsh', team: 'Analytics' },
  { id: 'rs-oci-compute-prod-01', resourceId: 'oci-compute-prod-01', resourceName: 'erp-app-node-02', provider: 'OCI', accountName: 'OCI ERP', currentSku: 'VM.Standard.E4.Flex-8', recommendedSku: 'VM.Standard.E4.Flex-4', recommendationType: 'Downsize oversized compute', reason: 'p95 and p99 utilisation remain materially below policy thresholds.', supportingMetrics: 'CPU p95 14%, CPU p99 28%, memory p95 49%, 30d runtime 720h', estimatedMonthlySaving: 353, estimatedAnnualSaving: 4236, confidenceScore: 86, riskScore: 34, status: 'New', owner: 'Priya Singh', team: 'ERP' },
  { id: 'rs-oci-block-idle-01', resourceId: 'oci-block-idle-01', resourceName: 'legacy-backup-volume', provider: 'OCI', accountName: 'OCI ERP', currentSku: 'Balanced 4TB', recommendedSku: 'Terminate', recommendationType: 'Terminate idle resources', reason: 'Resource appears idle based on p95 usage and tag evidence.', supportingMetrics: 'Storage used 8%, no attached workload, 30d runtime 720h', estimatedMonthlySaving: 390, estimatedAnnualSaving: 4680, confidenceScore: 92, riskScore: 22, status: 'New', owner: 'Ava Collins', team: 'Platform' }
];

export const billingRecords = cloudResources.map((resource, index) => ({
  id: `bill-${String(index + 1).padStart(3, '0')}`,
  provider: resource.provider,
  account: resource.accountName,
  region: resource.region,
  service: resource.service,
  resourceId: resource.id,
  resourceName: resource.name,
  resourceType: resource.resourceType,
  sku: resource.sku,
  usageQuantity: resource.service === 'BigQuery' ? 41 : 720,
  usageUnit: resource.service === 'BigQuery' ? 'TB scanned' : 'hours',
  cost: resource.monthlyCost,
  currency: 'AUD',
  billingPeriod: '2026-05',
  tags: resource.tags,
  owner: resource.owner,
  team: resource.team,
  application: resource.application,
  environment: resource.environment,
  costCentre: resource.costCentre
}));

export const dailySpend = [
  { date: '2026-05-01', AWS: 2110, Azure: 1740, GCP: 1280, OCI: 540 },
  { date: '2026-05-08', AWS: 2380, Azure: 1810, GCP: 1440, OCI: 610 },
  { date: '2026-05-15', AWS: 2550, Azure: 1960, GCP: 1890, OCI: 650 },
  { date: '2026-05-22', AWS: 2680, Azure: 2050, GCP: 3120, OCI: 690 },
  { date: '2026-05-29', AWS: 2920, Azure: 2290, GCP: 2010, OCI: 720 }
];

export const optimisationOpportunities = [
  { id: 'opt-001', category: 'Idle resources', resourceName: 'legacy-backup-volume', provider: 'OCI', savingOpportunity: 390, risk: 'Low', effort: 'Low', owner: 'Ava Collins', recommendedAction: 'Archive required data and delete idle block volume.' },
  { id: 'opt-002', category: 'Orphaned storage', resourceName: 'test-sql-data-disk', provider: 'Azure', savingOpportunity: 78, risk: 'Low', effort: 'Low', owner: 'Priya Singh', recommendedAction: 'Confirm backup retention and resize disk.' },
  { id: 'opt-003', category: 'Oversized compute', resourceName: 'analytics-transformer', provider: 'GCP', savingOpportunity: 448, risk: 'Medium', effort: 'Medium', owner: 'Sofia Walsh', recommendedAction: 'Move from n2-standard-8 to n2-standard-4 after batch test.' },
  { id: 'opt-004', category: 'Unused public IPs', resourceName: 'pip-old-vpn', provider: 'Azure', savingOpportunity: 72, risk: 'Low', effort: 'Low', owner: 'Noah Rivera', recommendedAction: 'Release unattached static public IP.' },
  { id: 'opt-005', category: 'Underused databases', resourceName: 'prd-orders-db', provider: 'AWS', savingOpportunity: 640, risk: 'Medium', effort: 'High', owner: 'Ben Martin', recommendedAction: 'Evaluate reserved capacity and storage tier mix.' },
  { id: 'opt-006', category: 'Unused commitments', resourceName: 'EC2 regional compute', provider: 'AWS', savingOpportunity: 2860, risk: 'Low', effort: 'Medium', owner: 'Marcus Tan', recommendedAction: 'Buy one-year no-upfront compute savings plan for stable baseline.' },
  { id: 'opt-007', category: 'Tagging issues', resourceName: 'OCI ERP estate', provider: 'OCI', savingOpportunity: 0, risk: 'Medium', effort: 'Low', owner: 'Priya Singh', recommendedAction: 'Add application, owner and cost centre labels.' }
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
  { id: 'cl-rpt-006', name: 'Forecast Report', description: 'Month-end forecast and quarterly run-rate model.', dataset: 'cloud_forecasts', filters: ['scope', 'provider'], exportFormats: ['CSV', 'XLSX', 'PDF'] },
  { id: 'cl-rpt-007', name: 'Cost Allocation', description: 'Allocated, unallocated and shared-cost allocation detail.', dataset: 'cloud_allocation_rules', filters: ['team', 'quality'], exportFormats: ['CSV', 'XLSX', 'PDF'] },
  { id: 'cl-rpt-008', name: 'Anomaly Report', description: 'Daily spend, service, account and team-level anomalies.', dataset: 'cloud_anomalies', filters: ['date', 'provider', 'status'], exportFormats: ['CSV', 'XLSX', 'PDF'] },
  { id: 'cl-rpt-009', name: 'Tag Compliance', description: 'Protected tags, missing labels and allocation quality.', dataset: 'cloud_tags', filters: ['provider', 'tag'], exportFormats: ['CSV', 'XLSX', 'PDF'] }
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
