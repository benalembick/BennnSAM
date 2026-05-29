import {
  AlertTriangle,
  BarChart3,
  Cloud,
  CloudCog,
  FileBarChart,
  Gauge,
  Landmark,
  Layers3,
  Settings,
  SlidersHorizontal,
  Tags,
  WalletCards
} from 'lucide-react';

export type CloudabilityPageKey =
  | 'cloudability'
  | 'cloudability-cost-explorer'
  | 'cloudability-inventory'
  | 'cloudability-rightsizing'
  | 'cloudability-optimisation'
  | 'cloudability-budgets'
  | 'cloudability-anomalies'
  | 'cloudability-allocation'
  | 'cloudability-chargeback'
  | 'cloudability-connectors'
  | 'cloudability-reports'
  | 'cloudability-admin';

export const cloudabilityNav = [
  { key: 'cloudability' as const, label: 'Executive Dashboard', icon: Cloud },
  { key: 'cloudability-cost-explorer' as const, label: 'Cost Explorer', icon: BarChart3 },
  { key: 'cloudability-inventory' as const, label: 'Multi-Cloud Inventory', icon: Layers3 },
  { key: 'cloudability-rightsizing' as const, label: 'Rightsizing', icon: Gauge },
  { key: 'cloudability-optimisation' as const, label: 'Optimisation Opportunities', icon: SlidersHorizontal },
  { key: 'cloudability-budgets' as const, label: 'Budgets & Forecasts', icon: WalletCards },
  { key: 'cloudability-anomalies' as const, label: 'Anomaly Detection', icon: AlertTriangle },
  { key: 'cloudability-allocation' as const, label: 'Cost Allocation', icon: Tags },
  { key: 'cloudability-chargeback' as const, label: 'Chargeback & Showback', icon: Landmark },
  { key: 'cloudability-connectors' as const, label: 'Cloud Connectors', icon: CloudCog },
  { key: 'cloudability-reports' as const, label: 'Reports', icon: FileBarChart },
  { key: 'cloudability-admin' as const, label: 'Administration', icon: Settings }
];
