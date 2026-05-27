-- BennnSam SAM/SaaS Management schema.
-- Every operational table carries tenant_id so Supabase RLS can isolate customers.

create extension if not exists "pgcrypto";

create schema if not exists app;

create or replace function app.current_tenant_id()
returns uuid
language sql
stable
as $$
  select coalesce(
    nullif(auth.jwt() ->> 'tenant_id', '')::uuid,
    nullif(auth.jwt() -> 'app_metadata' ->> 'tenant_id', '')::uuid
  )
$$;

create or replace function app.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now()
);

create table public.business_units (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  executive_owner text,
  created_at timestamptz not null default now()
);

create table public.departments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  business_unit_id uuid references public.business_units(id) on delete set null,
  name text not null,
  cost_centre text,
  manager text,
  created_at timestamptz not null default now()
);

create table public.users_profile (
  id uuid primary key references auth.users(id) on delete cascade,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  department_id uuid references public.departments(id) on delete set null,
  full_name text not null,
  email text not null,
  role text not null check (role in ('Platform Admin', 'SAM Manager', 'Licence Manager', 'Security Viewer', 'Finance Viewer', 'Department Owner', 'Read Only')),
  job_title text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.vendors (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  normalized_name text not null,
  website text,
  risk_rating text not null default 'low' check (risk_rating in ('low', 'medium', 'high', 'critical')),
  created_at timestamptz not null default now()
);

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  vendor_id uuid references public.vendors(id) on delete set null,
  owner_id uuid references public.users_profile(id) on delete set null,
  department_id uuid references public.departments(id) on delete set null,
  name text not null,
  category text not null,
  app_type text not null check (app_type in ('SaaS', 'desktop', 'server', 'cloud', 'AI tool', 'browser app')),
  version text,
  edition text,
  install_count integer not null default 0,
  active_users integer not null default 0,
  total_usage_minutes numeric not null default 0,
  active_usage_minutes numeric not null default 0,
  last_detected_date date,
  licence_requirement text,
  gdpr_risk boolean not null default false,
  eol_date date,
  upgrade_path text,
  downgrade_path text,
  tags text[] not null default '{}',
  approved boolean not null default false,
  monthly_cost numeric(14,2) not null default 0,
  renewal_date date,
  risk_rating text not null default 'low' check (risk_rating in ('low', 'medium', 'high', 'critical')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.application_aliases (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  application_id uuid not null references public.applications(id) on delete cascade,
  alias text not null,
  source text not null default 'manual',
  confidence_score numeric(5,2) not null default 100
);

create table public.software_versions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  application_id uuid not null references public.applications(id) on delete cascade,
  version text not null,
  edition text,
  release_date date,
  eol_date date,
  upgrade_path text,
  risk_rating text not null default 'low'
);

create table public.devices (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  assigned_user_id uuid references public.users_profile(id) on delete set null,
  department_id uuid references public.departments(id) on delete set null,
  hostname text not null,
  os text not null,
  os_version text,
  last_check_in timestamptz,
  cpu_architecture text,
  installed_software jsonb not null default '[]',
  running_processes jsonb not null default '[]',
  browser_saas_usage_events jsonb not null default '[]',
  custom_attributes jsonb not null default '{}',
  serial_number text,
  asset_tag text,
  location text,
  warranty_date date,
  lifecycle_status text not null default 'active',
  cost_centre text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.raw_inventory_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  device_id uuid references public.devices(id) on delete set null,
  source text not null check (source in ('agent', 'integration', 'manual import', 'csv', 'api')),
  raw_name text,
  raw_vendor text,
  executable_name text,
  folder_path text,
  registry_key text,
  process_name text,
  file_metadata jsonb not null default '{}',
  payload jsonb not null default '{}',
  detected_at timestamptz not null default now()
);

create table public.software_installations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  device_id uuid not null references public.devices(id) on delete cascade,
  application_id uuid not null references public.applications(id) on delete cascade,
  software_version_id uuid references public.software_versions(id) on delete set null,
  installed_at timestamptz,
  last_seen timestamptz,
  install_path text,
  source text not null default 'agent'
);

create table public.usage_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  app_id uuid references public.applications(id) on delete set null,
  user_id uuid references public.users_profile(id) on delete set null,
  device_id uuid references public.devices(id) on delete set null,
  event_type text not null,
  started_at timestamptz not null,
  ended_at timestamptz not null,
  active_minutes numeric not null default 0,
  total_minutes numeric not null default 0,
  source text not null check (source in ('agent', 'integration', 'manual import'))
);

create table public.usage_daily_summary (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  app_id uuid references public.applications(id) on delete cascade,
  user_id uuid references public.users_profile(id) on delete set null,
  device_id uuid references public.devices(id) on delete set null,
  usage_date date not null,
  active_minutes numeric not null default 0,
  total_minutes numeric not null default 0,
  event_count integer not null default 0,
  unique (tenant_id, app_id, user_id, device_id, usage_date)
);

create table public.saas_domains (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  application_id uuid references public.applications(id) on delete set null,
  domain text not null,
  approved boolean not null default false,
  source text not null default 'manual',
  unique (tenant_id, domain)
);

create table public.saas_detections (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  application_id uuid references public.applications(id) on delete set null,
  saas_app_name text not null,
  domain text not null,
  vendor text,
  category text,
  detected_users integer not null default 0,
  assigned_users integer not null default 0,
  paid_seats integer not null default 0,
  active_users integer not null default 0,
  inactive_users integer not null default 0,
  monthly_cost numeric(14,2) not null default 0,
  risk_rating text not null default 'low',
  renewal_date date,
  approved boolean not null default false,
  source text not null
);

create table public.contracts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  vendor_id uuid references public.vendors(id) on delete set null,
  name text not null,
  owner_id uuid references public.users_profile(id) on delete set null,
  start_date date,
  end_date date,
  renewal_date date,
  total_value numeric(14,2),
  notes text
);

create table public.licences (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  application_id uuid references public.applications(id) on delete cascade,
  contract_id uuid references public.contracts(id) on delete set null,
  sku text not null,
  licence_metric text not null check (licence_metric in ('user', 'device', 'install', 'core', 'processor', 'subscription', 'consumption')),
  purchased_quantity numeric not null default 0,
  assigned_quantity numeric not null default 0,
  consumed_quantity numeric not null default 0,
  compliance_status text not null check (compliance_status in ('over-licensed', 'under-licensed', 'adequately licensed')),
  cost_per_licence numeric(14,2) not null default 0,
  true_up_true_down_notes text,
  calculation_rule text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.licence_entitlements (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  licence_id uuid not null references public.licences(id) on delete cascade,
  entitlement_name text not null,
  quantity numeric not null,
  valid_from date,
  valid_to date,
  rights jsonb not null default '{}'
);

create table public.licence_assignments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  licence_id uuid not null references public.licences(id) on delete cascade,
  user_id uuid references public.users_profile(id) on delete set null,
  device_id uuid references public.devices(id) on delete set null,
  assigned_at timestamptz not null default now(),
  assignment_source text not null default 'integration',
  active boolean not null default true
);

create table public.compliance_results (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  application_id uuid references public.applications(id) on delete set null,
  finding text not null,
  category text not null,
  severity text not null check (severity in ('low', 'medium', 'high', 'critical')),
  risk_score numeric not null default 0,
  owner_id uuid references public.users_profile(id) on delete set null,
  evidence text,
  due_date date,
  status text not null default 'open',
  created_at timestamptz not null default now()
);

create table public.cost_records (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  application_id uuid references public.applications(id) on delete set null,
  user_id uuid references public.users_profile(id) on delete set null,
  device_id uuid references public.devices(id) on delete set null,
  department_id uuid references public.departments(id) on delete set null,
  business_unit_id uuid references public.business_units(id) on delete set null,
  monthly_cost numeric(14,2) not null,
  allocation_method text not null check (allocation_method in ('seat', 'usage', 'device', 'manual')),
  negotiated_price numeric(14,2),
  effective_from date not null default current_date,
  notes text
);

create table public.savings_recommendations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  application_id uuid references public.applications(id) on delete set null,
  department_id uuid references public.departments(id) on delete set null,
  recommendation_type text not null,
  estimated_annual_savings numeric(14,2) not null default 0,
  reason text not null,
  status text not null default 'new',
  created_at timestamptz not null default now()
);

create table public.integrations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  category text not null,
  connection_status text not null default 'not connected',
  enabled boolean not null default false,
  last_sync timestamptz,
  mapping_config jsonb not null default '[]',
  settings jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.integration_sync_logs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  integration_id uuid not null references public.integrations(id) on delete cascade,
  status text not null,
  message text not null,
  records_processed integer not null default 0,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);

create table public.export_workflows (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  source_dataset text not null,
  filters jsonb not null default '{}',
  mapped_fields jsonb not null default '[]',
  destination text not null check (destination in ('webhook', 'CSV', 'REST API', 'Supabase table', 'ServiceNow mock endpoint')),
  schedule text not null check (schedule in ('manual', 'daily', 'weekly')),
  enabled boolean not null default true,
  execution_logs jsonb not null default '[]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.custom_inventory_rules (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  match_type text not null,
  match_value text not null,
  normalized_application_id uuid references public.applications(id) on delete set null,
  edition text,
  module_or_add_on text,
  classification text,
  confidence numeric not null default 80,
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.normalization_review_queue (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  raw_inventory_event_id uuid references public.raw_inventory_events(id) on delete cascade,
  suggested_application_id uuid references public.applications(id) on delete set null,
  vendor_suggestion text,
  confidence_score numeric not null default 0,
  duplicate_candidates jsonb not null default '[]',
  status text not null default 'pending',
  analyst_id uuid references public.users_profile(id) on delete set null,
  override_history jsonb not null default '[]',
  created_at timestamptz not null default now()
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  description text,
  dataset text not null,
  filters jsonb not null default '[]',
  export_formats text[] not null default '{CSV}',
  saved_configuration jsonb not null default '{}',
  created_by uuid references public.users_profile(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.report_runs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  report_id uuid not null references public.reports(id) on delete cascade,
  run_by uuid references public.users_profile(id) on delete set null,
  filters jsonb not null default '{}',
  row_count integer not null default 0,
  export_url text,
  status text not null default 'complete',
  ran_at timestamptz not null default now()
);

create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  actor_id uuid references public.users_profile(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  changes jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index on public.applications (tenant_id, name);
create index on public.devices (tenant_id, hostname);
create index on public.usage_events (tenant_id, app_id, started_at);
create index on public.saas_detections (tenant_id, approved, risk_rating);
create index on public.licences (tenant_id, compliance_status);
create index on public.compliance_results (tenant_id, severity, risk_score desc);
create index on public.cost_records (tenant_id, department_id);

create trigger touch_users_profile_updated before update on public.users_profile for each row execute function app.touch_updated_at();
create trigger touch_applications_updated before update on public.applications for each row execute function app.touch_updated_at();
create trigger touch_devices_updated before update on public.devices for each row execute function app.touch_updated_at();
create trigger touch_licences_updated before update on public.licences for each row execute function app.touch_updated_at();
create trigger touch_integrations_updated before update on public.integrations for each row execute function app.touch_updated_at();
create trigger touch_export_workflows_updated before update on public.export_workflows for each row execute function app.touch_updated_at();

alter table public.tenants enable row level security;
alter table public.business_units enable row level security;
alter table public.departments enable row level security;
alter table public.users_profile enable row level security;
alter table public.vendors enable row level security;
alter table public.applications enable row level security;
alter table public.application_aliases enable row level security;
alter table public.software_versions enable row level security;
alter table public.devices enable row level security;
alter table public.raw_inventory_events enable row level security;
alter table public.software_installations enable row level security;
alter table public.usage_events enable row level security;
alter table public.usage_daily_summary enable row level security;
alter table public.saas_domains enable row level security;
alter table public.saas_detections enable row level security;
alter table public.contracts enable row level security;
alter table public.licences enable row level security;
alter table public.licence_entitlements enable row level security;
alter table public.licence_assignments enable row level security;
alter table public.compliance_results enable row level security;
alter table public.cost_records enable row level security;
alter table public.savings_recommendations enable row level security;
alter table public.integrations enable row level security;
alter table public.integration_sync_logs enable row level security;
alter table public.export_workflows enable row level security;
alter table public.custom_inventory_rules enable row level security;
alter table public.normalization_review_queue enable row level security;
alter table public.reports enable row level security;
alter table public.report_runs enable row level security;
alter table public.audit_log enable row level security;

create policy "tenant select own tenant" on public.tenants
  for select using (id = app.current_tenant_id());

create policy "profile self or tenant" on public.users_profile
  for select using (tenant_id = app.current_tenant_id() or id = auth.uid());

create policy "profile update self" on public.users_profile
  for update using (id = auth.uid()) with check (id = auth.uid());

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'business_units',
    'departments',
    'vendors',
    'applications',
    'application_aliases',
    'software_versions',
    'devices',
    'raw_inventory_events',
    'software_installations',
    'usage_events',
    'usage_daily_summary',
    'saas_domains',
    'saas_detections',
    'contracts',
    'licences',
    'licence_entitlements',
    'licence_assignments',
    'compliance_results',
    'cost_records',
    'savings_recommendations',
    'integrations',
    'integration_sync_logs',
    'export_workflows',
    'custom_inventory_rules',
    'normalization_review_queue',
    'reports',
    'report_runs',
    'audit_log'
  ]
  loop
    execute format('create policy "tenant read %1$s" on public.%1$I for select using (tenant_id = app.current_tenant_id())', table_name);
    execute format('create policy "tenant insert %1$s" on public.%1$I for insert with check (tenant_id = app.current_tenant_id())', table_name);
    execute format('create policy "tenant update %1$s" on public.%1$I for update using (tenant_id = app.current_tenant_id()) with check (tenant_id = app.current_tenant_id())', table_name);
    execute format('create policy "tenant delete %1$s" on public.%1$I for delete using (tenant_id = app.current_tenant_id())', table_name);
  end loop;
end $$;
