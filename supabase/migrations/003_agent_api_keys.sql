-- Tenant-scoped agent API keys.
-- Only key hashes are stored; the generated secret is shown once by the API.

create table if not exists public.agent_api_keys (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  key_prefix text not null,
  key_hash text not null unique,
  created_by uuid references public.users_profile(id) on delete set null,
  created_at timestamptz not null default now(),
  last_used_at timestamptz,
  revoked_at timestamptz
);

create index if not exists agent_api_keys_tenant_created_idx on public.agent_api_keys (tenant_id, created_at desc);
create index if not exists agent_api_keys_hash_active_idx on public.agent_api_keys (key_hash) where revoked_at is null;

alter table public.agent_api_keys enable row level security;

create policy "tenant read agent_api_keys" on public.agent_api_keys
  for select using (tenant_id = app.current_tenant_id());

create policy "tenant insert agent_api_keys" on public.agent_api_keys
  for insert with check (tenant_id = app.current_tenant_id());

create policy "tenant update agent_api_keys" on public.agent_api_keys
  for update using (tenant_id = app.current_tenant_id()) with check (tenant_id = app.current_tenant_id());

create policy "tenant delete agent_api_keys" on public.agent_api_keys
  for delete using (tenant_id = app.current_tenant_id());
