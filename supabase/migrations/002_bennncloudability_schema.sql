-- BennnCloudability multi-cloud FinOps schema.
-- These tables follow the existing BennnSAM tenant_id, RLS and audit patterns.

create table public.cloud_providers (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  provider_code text not null check (provider_code in ('AWS', 'Azure', 'GCP', 'OCI')),
  name text not null,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  unique (tenant_id, provider_code)
);

create table public.cloud_accounts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  provider_id uuid not null references public.cloud_providers(id) on delete cascade,
  account_external_id text not null,
  account_name text not null,
  owner_id uuid references public.users_profile(id) on delete set null,
  team text,
  application text,
  environment text,
  cost_centre text,
  created_at timestamptz not null default now(),
  unique (tenant_id, provider_id, account_external_id)
);

create table public.cloud_connections (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  provider_id uuid not null references public.cloud_providers(id) on delete cascade,
  cloud_account_id uuid references public.cloud_accounts(id) on delete cascade,
  connection_name text not null,
  auth_method text not null,
  credential_reference text,
  settings jsonb not null default '{}',
  enabled boolean not null default false,
  last_sync_at timestamptz,
  last_sync_status text not null default 'not synced',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.cloud_resources (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  provider_id uuid not null references public.cloud_providers(id) on delete cascade,
  cloud_account_id uuid not null references public.cloud_accounts(id) on delete cascade,
  provider_resource_id text not null,
  resource_name text,
  resource_type text not null,
  service_name text not null,
  region text,
  sku text,
  owner text,
  team text,
  application text,
  environment text,
  cost_centre text,
  tags jsonb not null default '{}',
  labels jsonb not null default '{}',
  first_seen_at timestamptz,
  last_seen_at timestamptz,
  lifecycle_status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, provider_id, provider_resource_id)
);

create table public.cloud_billing_records (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  provider_id uuid not null references public.cloud_providers(id) on delete cascade,
  cloud_account_id uuid not null references public.cloud_accounts(id) on delete cascade,
  cloud_resource_id uuid references public.cloud_resources(id) on delete set null,
  provider text not null,
  account_identifier text not null,
  region text,
  service text not null,
  resource_id text,
  resource_name text,
  resource_type text,
  sku text,
  usage_quantity numeric(18,6) not null default 0,
  usage_unit text,
  cost numeric(18,6) not null default 0,
  amortised_cost numeric(18,6),
  currency text not null default 'AUD',
  billing_period date not null,
  usage_start_at timestamptz,
  usage_end_at timestamptz,
  tags jsonb not null default '{}',
  labels jsonb not null default '{}',
  owner text,
  team text,
  application text,
  environment text,
  cost_centre text,
  created_at timestamptz not null default now()
);

create table public.cloud_usage_records (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  provider_id uuid not null references public.cloud_providers(id) on delete cascade,
  cloud_account_id uuid not null references public.cloud_accounts(id) on delete cascade,
  cloud_resource_id uuid references public.cloud_resources(id) on delete set null,
  usage_date date not null,
  service text not null,
  metric_name text not null,
  usage_quantity numeric(18,6) not null default 0,
  usage_unit text,
  raw_payload jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table public.cloud_resource_metrics (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  cloud_resource_id uuid not null references public.cloud_resources(id) on delete cascade,
  metric_date date not null,
  cpu_p95 numeric(7,2),
  cpu_p99 numeric(7,2),
  memory_p95 numeric(7,2),
  memory_p99 numeric(7,2),
  iops_p95 numeric(12,2),
  network_p95 numeric(12,2),
  storage_used_percent numeric(7,2),
  running_hours_30d numeric(8,2),
  non_prod_after_hours_percent numeric(7,2),
  created_at timestamptz not null default now(),
  unique (tenant_id, cloud_resource_id, metric_date)
);

create table public.cloud_tags (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  cloud_resource_id uuid references public.cloud_resources(id) on delete cascade,
  tag_key text not null,
  tag_value text,
  tag_source text not null default 'provider',
  protected boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.cloud_cost_allocation_rules (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  rule_type text not null check (rule_type in ('tag', 'team', 'application', 'environment', 'cost centre', 'shared percentage')),
  rule_config jsonb not null default '{}',
  allocated_spend numeric(18,2) not null default 0,
  unallocated_spend numeric(18,2) not null default 0,
  allocation_quality_score numeric(5,2) not null default 0,
  missing_tag_count integer not null default 0,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.cloud_budgets (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  scope_type text not null check (scope_type in ('provider', 'team', 'application', 'cost centre', 'environment')),
  scope_value text not null,
  budget_amount numeric(18,2) not null,
  actual_spend numeric(18,2) not null default 0,
  forecast_spend numeric(18,2) not null default 0,
  variance numeric(18,2) generated always as (forecast_spend - budget_amount) stored,
  burn_rate numeric(7,2) not null default 0,
  alert_threshold numeric(5,2) not null default 90,
  currency text not null default 'AUD',
  period_start date not null,
  period_end date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.cloud_forecasts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  budget_id uuid references public.cloud_budgets(id) on delete cascade,
  forecast_date date not null,
  forecast_period_end date not null,
  forecast_spend numeric(18,2) not null,
  confidence_score numeric(5,2) not null default 0,
  model_version text not null default 'demo-linear-v1',
  created_at timestamptz not null default now()
);

create table public.cloud_rightsizing_recommendations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  cloud_resource_id uuid references public.cloud_resources(id) on delete cascade,
  recommendation_type text not null,
  current_sku text,
  recommended_sku text,
  reason text not null,
  supporting_metrics jsonb not null default '{}',
  estimated_monthly_saving numeric(18,2) not null default 0,
  estimated_annual_saving numeric(18,2) not null default 0,
  confidence_score numeric(5,2) not null default 0,
  risk_score numeric(5,2) not null default 0,
  status text not null default 'New' check (status in ('New', 'Reviewing', 'Approved', 'Rejected', 'Implemented', 'Snoozed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.cloud_optimisation_opportunities (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  cloud_resource_id uuid references public.cloud_resources(id) on delete set null,
  category text not null,
  saving_opportunity numeric(18,2) not null default 0,
  risk text not null default 'Low',
  effort text not null default 'Low',
  owner text,
  recommended_action text not null,
  status text not null default 'New',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.cloud_anomalies (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  provider_id uuid references public.cloud_providers(id) on delete set null,
  detected_at date not null,
  affected_service text,
  affected_owner_team text,
  expected_cost numeric(18,2) not null,
  actual_cost numeric(18,2) not null,
  variance numeric(18,2) not null,
  likely_driver text,
  status text not null default 'New',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.cloud_reports (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  description text,
  dataset text not null,
  filters jsonb not null default '[]',
  export_formats text[] not null default '{CSV,XLSX,PDF}',
  schedule text,
  created_by uuid references public.users_profile(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.cloud_governance_actions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  actor_id uuid references public.users_profile(id) on delete set null,
  status text not null default 'open',
  notes text,
  created_at timestamptz not null default now()
);

create index on public.cloud_billing_records (tenant_id, billing_period, provider, service);
create index on public.cloud_billing_records (tenant_id, team, application, environment, cost_centre);
create index on public.cloud_resources (tenant_id, provider_id, service_name, resource_type);
create index on public.cloud_resource_metrics (tenant_id, cloud_resource_id, metric_date);
create index on public.cloud_rightsizing_recommendations (tenant_id, status, risk_score desc);
create index on public.cloud_optimisation_opportunities (tenant_id, category, status);
create index on public.cloud_anomalies (tenant_id, detected_at desc, status);

create trigger touch_cloud_connections_updated before update on public.cloud_connections for each row execute function app.touch_updated_at();
create trigger touch_cloud_resources_updated before update on public.cloud_resources for each row execute function app.touch_updated_at();
create trigger touch_cloud_cost_allocation_rules_updated before update on public.cloud_cost_allocation_rules for each row execute function app.touch_updated_at();
create trigger touch_cloud_budgets_updated before update on public.cloud_budgets for each row execute function app.touch_updated_at();
create trigger touch_cloud_rightsizing_recommendations_updated before update on public.cloud_rightsizing_recommendations for each row execute function app.touch_updated_at();
create trigger touch_cloud_optimisation_opportunities_updated before update on public.cloud_optimisation_opportunities for each row execute function app.touch_updated_at();
create trigger touch_cloud_anomalies_updated before update on public.cloud_anomalies for each row execute function app.touch_updated_at();
create trigger touch_cloud_reports_updated before update on public.cloud_reports for each row execute function app.touch_updated_at();

alter table public.cloud_providers enable row level security;
alter table public.cloud_accounts enable row level security;
alter table public.cloud_connections enable row level security;
alter table public.cloud_billing_records enable row level security;
alter table public.cloud_usage_records enable row level security;
alter table public.cloud_resources enable row level security;
alter table public.cloud_resource_metrics enable row level security;
alter table public.cloud_tags enable row level security;
alter table public.cloud_cost_allocation_rules enable row level security;
alter table public.cloud_budgets enable row level security;
alter table public.cloud_forecasts enable row level security;
alter table public.cloud_rightsizing_recommendations enable row level security;
alter table public.cloud_optimisation_opportunities enable row level security;
alter table public.cloud_anomalies enable row level security;
alter table public.cloud_reports enable row level security;
alter table public.cloud_governance_actions enable row level security;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'cloud_providers',
    'cloud_accounts',
    'cloud_connections',
    'cloud_billing_records',
    'cloud_usage_records',
    'cloud_resources',
    'cloud_resource_metrics',
    'cloud_tags',
    'cloud_cost_allocation_rules',
    'cloud_budgets',
    'cloud_forecasts',
    'cloud_rightsizing_recommendations',
    'cloud_optimisation_opportunities',
    'cloud_anomalies',
    'cloud_reports',
    'cloud_governance_actions'
  ]
  loop
    execute format('create policy "tenant read %1$s" on public.%1$I for select using (tenant_id = app.current_tenant_id())', table_name);
    execute format('create policy "tenant insert %1$s" on public.%1$I for insert with check (tenant_id = app.current_tenant_id())', table_name);
    execute format('create policy "tenant update %1$s" on public.%1$I for update using (tenant_id = app.current_tenant_id()) with check (tenant_id = app.current_tenant_id())', table_name);
    execute format('create policy "tenant delete %1$s" on public.%1$I for delete using (tenant_id = app.current_tenant_id())', table_name);
  end loop;
end $$;
