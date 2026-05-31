# BennnSam

BennnSam is an original Software Asset Management and SaaS Management MVP for internal demonstration. It is not a copy of any existing SAM product, brand, screen, wording, architecture, or protected implementation detail.

## What is included

- React + Vite + TypeScript web app
- Tailwind CSS enterprise SaaS UI
- Node.js / Express API
- Supabase Postgres schema and seed data
- Supabase Auth-ready user profile model
- RLS-ready multi-tenant database design
- Integrated BennnCloudability multi-cloud FinOps module for AWS, Azure, GCP and OCI demo cost management
- Deterministic AI-style report assistant with optional API-key extension point
- Mock integrations, mock agent upload, CSV import/export, and export workflow runs

## Repository Layout

```text
apps/
  api/        Express API and demo data
  web/        React/Vite frontend
supabase/
  migrations/001_bennnsam_schema.sql
  migrations/002_bennncloudability_schema.sql
  seed.sql
.env.example
```

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Copy the environment file:

```bash
cp .env.example .env
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

3. Start both apps:

```bash
npm run dev
```

The API runs on `http://localhost:4100/api`.
The web app runs on `http://localhost:5173`.

## Demo Login

The frontend MVP uses API demo data by default. If you run Supabase locally and apply `supabase/seed.sql`, a demo Supabase Auth user is seeded:

- Email: `ava.collins@demo.bennnsam.local`
- Password: `BennnSamDemo!2026`
- Tenant: `Northstar Manufacturing`

## Supabase

The schema is in [supabase/migrations/001_bennnsam_schema.sql](supabase/migrations/001_bennnsam_schema.sql). It creates:

- `tenants`
- `users_profile`
- `departments`
- `business_units`
- `vendors`
- `applications`
- `application_aliases`
- `software_versions`
- `devices`
- `raw_inventory_events`
- `software_installations`
- `usage_events`
- `usage_daily_summary`
- `saas_domains`
- `saas_detections`
- `licences`
- `contracts`
- `licence_entitlements`
- `licence_assignments`
- `compliance_results`
- `cost_records`
- `savings_recommendations`
- `integrations`
- `integration_sync_logs`
- `export_workflows`
- `custom_inventory_rules`
- `normalization_review_queue`
- `reports`
- `report_runs`
- `audit_log`

Every operational table has `tenant_id`, RLS is enabled, and policies are prepared around a `tenant_id` claim in the Supabase JWT. The seed places `tenant_id` in `app_metadata` for the demo users.

BennnCloudability schema extensions are in [supabase/migrations/002_bennncloudability_schema.sql](supabase/migrations/002_bennncloudability_schema.sql). Module design, permissions, connector extension notes and rightsizing verification are documented in [docs/BennnCloudability.md](docs/BennnCloudability.md).

To use Supabase locally:

```bash
supabase start
supabase db reset
```

Then update `.env` with the local anon and service role keys shown by the Supabase CLI.

Agent API keys are managed from the BennnSAM Admin page and stored in Supabase as SHA-256 hashes. The API server needs a service-role connection so it can create, revoke and validate tenant-scoped agent keys:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
BENNSAM_DEFAULT_TENANT_ID=00000000-0000-0000-0000-000000000001
BENNSAM_DEFAULT_TENANT_NAME=Northstar Manufacturing
BENNSAM_DEFAULT_TENANT_SLUG=northstar
```

Run all migrations, including [supabase/migrations/003_agent_api_keys.sql](supabase/migrations/003_agent_api_keys.sql), before generating keys.

## API Routes

- `GET /api/overview`
- `GET /api/applications`
- `GET /api/applications/:id`
- `GET /api/devices`
- `GET /api/usage`
- `GET /api/saas`
- `GET /api/licences`
- `GET /api/costs`
- `GET /api/compliance`
- `GET /api/hardware`
- `GET /api/integrations`
- `POST /api/integrations/:id/sync`
- `GET /api/export-workflows`
- `POST /api/export-workflows`
- `POST /api/export-workflows/:id/run`
- `GET /api/rules`
- `POST /api/rules/test`
- `GET /api/normalization`
- `GET /api/reports`
- `GET /api/cloudability`
- `POST /api/cloudability/connections/:id/test`
- `POST /api/cloudability/connections/:id/sync`
- `POST /api/reports/run`
- `POST /api/imports/csv`
- `POST /api/agent/upload`
- `POST /v1/agents/:deviceId/inventory`
- `POST /api/assistant/query`

## MVP Notes

The Windows inventory agent lives in [_inventory-agent](_inventory-agent). Create tenant-scoped agent keys in the Admin page. BennnSAM stores only hashed keys in Supabase and shows the full API key once, together with the install command. The agent sends compressed JSON inventory to `/v1/agents/{deviceId}/inventory`; `/api/agent/upload` is kept as a compatible upload endpoint. Payloads are staged for normalization and do not perform invasive endpoint monitoring.

For local testing:

```powershell
npm run dev:api
```

In another PowerShell session:

```powershell
cd .\_inventory-agent
(Get-Content .\agent-config.json) -replace 'https://api.bennsam.io', 'http://localhost:4100' | Set-Content .\agent-config.local.json -Encoding utf8
dotnet publish .\BennnSAM.Agent.csproj -c Release -r win-x64 --self-contained true /p:PublishSingleFile=true -o .\publish\win-x64
Copy-Item .\agent-config.local.json .\publish\win-x64\agent-config.json -Force
.\_inventory-agent\scripts\install-user.ps1 -SourceExe .\_inventory-agent\publish\win-x64\agent.exe -Config .\_inventory-agent\agent-config.json -ApiKey "key-generated-from-admin" -RunInitialScan
```

The AI report assistant uses safe deterministic templates unless an LLM integration is later added behind `OPENAI_API_KEY`. The current implementation maps natural-language prompts to predefined report templates and returns rows, charts, and CSV export.

## Scripts

```bash
npm run dev        # API and web together
npm run dev:api    # API only
npm run dev:web    # web only
npm run build      # TypeScript and production build
npm run typecheck  # TypeScript checks
```

## cPanel Deployment

cPanel's Git Version Control button can time out after a few seconds on `git pull`. If that happens, use cPanel Terminal instead.

```bash
cd /home/YOUR_CPANEL_USER/path/to/BennnSAM
git pull --ff-only origin main
npm ci
npm run build
```

For a single-domain cPanel Node.js deployment, use these Node app settings:

```text
Node.js version: 20.24.1
Application mode: Production
Application root: /home/YOUR_CPANEL_USER/bennnsam.donkeybillabong.com/apps/api
Application URL: bennnsam.donkeybillabong.com
Application startup file: dist/index.js
```

In this setup, Express serves both:

```text
https://bennnsam.donkeybillabong.com/
https://bennnsam.donkeybillabong.com/api/health
```

The built frontend must exist at:

```text
/home/YOUR_CPANEL_USER/bennnsam.donkeybillabong.com/apps/web/dist/
```

Set these environment variables in cPanel:

```env
NODE_ENV=production
CORS_ORIGIN=https://yourdomain.com
```

cPanel usually provides `PORT` automatically. BennnSam also supports `API_PORT` for local development.

Because the frontend and API are on the same domain in this setup, you do not need `VITE_API_URL`; the web app defaults to `/api`.

If the frontend calls an API on another domain or subdomain, set this before building the web app:

```env
VITE_API_URL=https://api.yourdomain.com/api
```

Then rebuild and upload `apps/web/dist` again.

If the dashboard shows a LiteSpeed or cPanel `404 Not Found` message inside the app, the frontend is running but `/api` is not reaching the Node API. Fix one of these:

- Mount the cPanel Node.js app so `https://yourdomain.com/api/health` returns JSON.
- Or host the API on a subdomain, for example `https://api.yourdomain.com/api`, set `VITE_API_URL` to that URL, rebuild the web app, and upload the new `apps/web/dist` files.
