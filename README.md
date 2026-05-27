# BennnSam

BennnSam is an original Software Asset Management and SaaS Management MVP for internal demonstration. It is not a copy of any existing SAM product, brand, screen, wording, architecture, or protected implementation detail.

## What is included

- React + Vite + TypeScript web app
- Tailwind CSS enterprise SaaS UI
- Node.js / Express API
- Supabase Postgres schema and seed data
- Supabase Auth-ready user profile model
- RLS-ready multi-tenant database design
- Deterministic AI-style report assistant with optional API-key extension point
- Mock integrations, mock agent upload, CSV import/export, and export workflow runs

## Repository Layout

```text
apps/
  api/        Express API and demo data
  web/        React/Vite frontend
supabase/
  migrations/001_bennnsam_schema.sql
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

To use Supabase locally:

```bash
supabase start
supabase db reset
```

Then update `.env` with the local anon and service role keys shown by the Supabase CLI.

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
- `POST /api/reports/run`
- `POST /api/imports/csv`
- `POST /api/agent/upload`
- `POST /api/assistant/query`

## MVP Notes

The mock agent upload is intentionally lightweight. It accepts inventory-style facts such as installed software, running processes, browser/SaaS events, and local attributes, then stages them for normalization. It does not perform invasive endpoint monitoring.

The AI report assistant uses safe deterministic templates unless an LLM integration is later added behind `OPENAI_API_KEY`. The current implementation maps natural-language prompts to predefined report templates and returns rows, charts, and CSV export.

## Scripts

```bash
npm run dev        # API and web together
npm run dev:api    # API only
npm run dev:web    # web only
npm run build      # TypeScript and production build
npm run typecheck  # TypeScript checks
```
