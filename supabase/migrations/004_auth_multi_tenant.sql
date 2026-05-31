-- Multi-tenant auth upgrade.
-- Updates role names, adds tenant status, enriches audit_log, adds is_super_admin.

-- ─── tenants ───────────────────────────────────────────────────────────────
alter table public.tenants
  add column if not exists status         text        not null default 'active'
    check (status in ('active', 'trial', 'disabled')),
  add column if not exists disabled_at    timestamptz,
  add column if not exists enrollment_key text unique
    default encode(gen_random_bytes(24), 'hex'),
  add column if not exists updated_at     timestamptz not null default now();

create trigger touch_tenants_updated
  before update on public.tenants
  for each row execute function app.touch_updated_at();

-- ─── users_profile: add new columns (no constraint change yet) ─────────────
alter table public.users_profile
  add column if not exists is_super_admin boolean     not null default false,
  add column if not exists status         text        not null default 'active'
    check (status in ('active', 'invited', 'disabled')),
  add column if not exists last_login_at  timestamptz,
  add column if not exists invited_at     timestamptz;

-- ─── Migrate existing role values BEFORE touching the check constraint ──────
-- Drop the old constraint first so we can update freely.
alter table public.users_profile
  drop constraint if exists users_profile_role_check;

update public.users_profile set role = 'tenant_admin'  where role in ('Platform Admin', 'SAM Manager');
update public.users_profile set role = 'asset_manager' where role = 'Licence Manager';
update public.users_profile set role = 'finance_user'  where role in ('Finance Viewer', 'Security Viewer');
update public.users_profile set role = 'read_only'     where role in ('Department Owner', 'Read Only');

-- Catch any remaining unknown values (defensive — set to read_only).
update public.users_profile
  set role = 'read_only'
  where role not in ('super_admin', 'tenant_admin', 'asset_manager', 'finance_user', 'read_only');

-- Now safe to add the new constraint.
alter table public.users_profile
  add constraint users_profile_role_check
    check (role in (
      'super_admin',
      'tenant_admin',
      'asset_manager',
      'finance_user',
      'read_only'
    ));

-- ─── audit_log ─────────────────────────────────────────────────────────────
alter table public.audit_log
  add column if not exists ip_address   text,
  add column if not exists user_agent   text,
  add column if not exists before_state jsonb not null default '{}',
  add column if not exists after_state  jsonb not null default '{}';

-- ─── RLS helpers ───────────────────────────────────────────────────────────
create or replace function app.is_super_admin()
returns boolean
language sql
stable
as $$
  select coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'is_super_admin')::boolean,
    false
  )
$$;

-- Super admins can see all tenants.
drop policy if exists "tenant select own tenant"   on public.tenants;
drop policy if exists "super admin manage tenants" on public.tenants;

create policy "tenant select own tenant" on public.tenants
  for select using (id = app.current_tenant_id() or app.is_super_admin());

create policy "super admin manage tenants" on public.tenants
  for all using (app.is_super_admin()) with check (app.is_super_admin());

-- Super admins can see all user profiles.
drop policy if exists "super admin see all profiles" on public.users_profile;

create policy "super admin see all profiles" on public.users_profile
  for all using (app.is_super_admin()) with check (app.is_super_admin());

-- Super admins can see all audit logs.
drop policy if exists "super admin see all audit_log" on public.audit_log;

create policy "super admin see all audit_log" on public.audit_log
  for select using (app.is_super_admin());
