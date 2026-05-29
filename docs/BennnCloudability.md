# BennnCloudability

BennnCloudability is an integrated BennnSAM module for multi-cloud FinOps, cloud cost management, optimisation and reporting. It is intentionally separated in the navigation and page treatment from the agent-based SAM inventory, because it works from cloud billing, cloud usage and cloud resource telemetry.

## First build scope

- Navigation and routing for Executive Dashboard, Cost Explorer, Multi-Cloud Inventory, Rightsizing, Optimisation Opportunities, Budgets & Forecasts, Anomaly Detection, Cost Allocation, Chargeback & Showback, Cloud Connectors, Reports and Administration.
- Demo connector framework for AWS, Microsoft Azure, Google Cloud Platform and Oracle Cloud Infrastructure.
- Normalised demo cloud cost records across provider, account/subscription/project, region, service, resource, SKU, usage, cost, currency, billing period, tags, owner, team, application, environment and cost centre.
- Tenant-scoped Supabase schema in `supabase/migrations/002_bennncloudability_schema.sql`.
- Demo API/static payload at `/api/cloudability`.
- p95/p99 rightsizing logic in `apps/api/src/cloudabilityEngine.ts`, with tests in `apps/api/src/cloudabilityEngine.test.ts`.

## Permissions

The module defines these module-level permissions:

- View Cloud Costs
- Manage Cloud Connectors
- View Recommendations
- Approve Recommendations
- Manage Budgets
- Export Reports
- Administer BennnCloudability

Map these permissions into the production role system when auth claims are wired to feature gates.

## Connector extension pattern

Each provider connector should write into the normalised model rather than building provider-specific reporting screens:

1. Sync provider account metadata into `cloud_accounts`.
2. Sync provider resources into `cloud_resources`.
3. Write billing lines into `cloud_billing_records`.
4. Write usage and monitoring facts into `cloud_usage_records` and `cloud_resource_metrics`.
5. Preserve raw provider fields in JSONB fields where useful, but report from the normalised columns.

Memory-based rightsizing must only run when memory metrics exist. CPU-only data can support CPU-based downsize/upsize recommendations, idle detection and scheduling recommendations.

## Local verification

Run:

```bash
npm run typecheck --workspace @bennnsam/api
npm run typecheck --workspace @bennnsam/web
npm run test:cloudability --workspace @bennnsam/api
npm run build
```
