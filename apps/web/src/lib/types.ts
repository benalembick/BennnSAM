export type AppType = 'SaaS' | 'desktop' | 'server' | 'cloud' | 'AI tool' | 'browser app';
export type RiskRating = 'low' | 'medium' | 'high' | 'critical';
export type ComplianceStatus = 'over-licensed' | 'under-licensed' | 'adequately licensed';

export interface Application {
  id: string;
  name: string;
  vendor: string;
  category: string;
  type: AppType;
  version: string;
  edition: string;
  installCount: number;
  activeUsers: number;
  totalUsageMinutes: number;
  activeUsageMinutes: number;
  lastDetectedDate: string;
  licenceRequirement: string;
  gdprRisk: boolean;
  eolDate: string | null;
  upgradePath: string;
  downgradePath: string;
  tags: string[];
  owner: string | null;
  businessUnit: string;
  approved: boolean;
  monthlyCost: number;
  renewalDate: string;
  riskRating: RiskRating;
}

export interface Overview {
  cards: Record<string, number>;
  trends: Array<{ label: string; value: number; change: number }>;
  spendByVendor: Array<{ vendor: string; spend: number }>;
  usageByCategory: Array<{ category: string; active: number; total: number }>;
  renewalTimeline: Array<{ application: string; vendor: string; renewalDate: string; days: number; annualValue: number }>;
}

export interface Device {
  id: string;
  hostname: string;
  os: string;
  osVersion: string;
  user: string;
  department: string;
  lastCheckIn: string;
  cpuArchitecture: string;
  installedSoftware: string[];
  runningProcesses: string[];
  browserSaasUsageEvents: string[];
  customAttributes: Record<string, string>;
  serialNumber: string;
  assetTag: string;
  location: string;
  warrantyDate: string;
  lifecycleStatus: string;
  costCentre: string;
  notes: string;
}

export interface UsageEvent {
  id: string;
  appId: string;
  appName: string;
  userId: string;
  userName: string;
  deviceId: string;
  eventType: string;
  startedAt: string;
  endedAt: string;
  activeMinutes: number;
  totalMinutes: number;
  source: string;
}

export interface SaaSDetection {
  id: string;
  saasAppName: string;
  domain: string;
  vendor: string;
  category: string;
  detectedUsers: number;
  assignedUsers: number;
  paidSeats: number;
  activeUsers: number;
  inactiveUsers: number;
  monthlyCost: number;
  riskRating: RiskRating;
  renewalDate: string;
  approved: boolean;
  source: string;
}

export interface Licence {
  id: string;
  applicationId: string;
  applicationName: string;
  contractName: string;
  vendor: string;
  sku: string;
  licenceMetric: string;
  purchasedQuantity: number;
  assignedQuantity: number;
  consumedQuantity: number;
  complianceStatus: ComplianceStatus;
  renewalDate: string;
  contractOwner: string;
  costPerLicence: number;
  trueUpTrueDownNotes: string;
  rule: string;
}

export interface CostRecord {
  id: string;
  applicationName: string;
  vendor: string;
  department: string;
  businessUnit: string;
  userName: string;
  deviceName: string;
  monthlyCost: number;
  allocationMethod: string;
  negotiatedPrice: number | null;
}

export interface SavingsRecommendation {
  id: string;
  type: string;
  applicationName: string;
  department: string;
  estimatedAnnualSavings: number;
  reason: string;
  status: string;
}

export interface ComplianceResult {
  id: string;
  finding: string;
  applicationName: string;
  category: string;
  severity: RiskRating;
  riskScore: number;
  owner: string | null;
  evidence: string;
  dueDate: string;
}

export interface Integration {
  id: string;
  name: string;
  category: string;
  connectionStatus: 'connected' | 'needs attention' | 'not connected';
  enabled: boolean;
  lastSync: string | null;
  syncLogs: Array<{ at: string; status: string; message: string }>;
  mapping: Array<{ source: string; target: string; transform?: string }>;
}

export interface ExportWorkflow {
  id: string;
  name: string;
  sourceDataset: string;
  filters: string;
  mappedFields: Array<{ source: string; destination: string }>;
  destination: string;
  schedule: string;
  enabled: boolean;
  executionLogs: Array<{ at: string; status: string; records: number; message: string }>;
}

export interface CustomInventoryRule {
  id: string;
  name: string;
  matchType: string;
  matchValue: string;
  normalizedApplication: string;
  edition: string;
  classification: string;
  confidence: number;
  enabled: boolean;
}

export interface NormalizationReview {
  id: string;
  rawName: string;
  suggestedApplication: string;
  vendorSuggestion: string;
  confidenceScore: number;
  duplicateCandidates: string[];
  status: string;
  analyst: string | null;
  overrideHistory: string[];
}

export interface ReportDefinition {
  id: string;
  name: string;
  description: string;
  dataset: string;
  filters: string[];
  exportFormats: string[];
  savedConfigurations: number;
}

export interface AssistantReport {
  title: string;
  queryTemplate: string;
  summary: string;
  chartType: 'bar' | 'pie' | 'line';
  rows: Array<Record<string, string | number | boolean | null>>;
}

export interface BootstrapData {
  departments: Array<{ id: string; name: string; businessUnit: string }>;
  users: Array<{ id: string; name: string; email: string; role: string; department: string }>;
  auditLog: Array<{ id: string; actor: string; action: string; entity: string; at: string }>;
}

export interface AgentKey {
  id: string;
  tenantId: string;
  name: string;
  keyPrefix: string;
  createdAt: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
  status: 'active' | 'revoked';
}

export interface CreatedAgentKey extends AgentKey {
  apiKey: string;
  installCommand: string;
}

export interface AgentUpload {
  id: string;
  receivedAt: string;
  deviceId: string;
  hostname: string;
  installedApplicationCount: number;
  runningProcessCount: number;
}

// ─── Multi-tenant auth types ────────────────────────────────────────────────

export type UserStatus = 'active' | 'invited' | 'disabled';
export type TenantStatus = 'active' | 'trial' | 'disabled';

export interface TenantUser {
  id: string;
  fullName: string;
  email: string;
  role: string;
  status: UserStatus;
  lastLoginAt: string | null;
  invitedAt: string | null;
  createdAt: string;
  departmentId: string | null;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  status: TenantStatus;
  disabledAt: string | null;
  enrollmentKey: string | null;
  logoUrl: string | null;
  createdAt: string;
  updatedAt: string;
  userCount?: number;
  deviceCount?: number;
  agentCount?: number;
}
