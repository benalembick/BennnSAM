-- Demo tenants: Acme Mining, ECU City Campus, Donkey Billabong.
-- Super-admin user (no tenant — is_super_admin = true).
-- Passwords: BennnSamDemo!2026

-- ─── Tenants ───────────────────────────────────────────────────────────────
insert into public.tenants (id, name, slug, status) values
  ('00000000-0000-0000-0000-000000000002', 'Acme Mining',       'acme-mining',    'active'),
  ('00000000-0000-0000-0000-000000000003', 'ECU City Campus',   'ecu-city',       'active'),
  ('00000000-0000-0000-0000-000000000004', 'Donkey Billabong',  'donkey-bill',    'active')
on conflict (id) do nothing;

-- ─── Super-admin auth user ─────────────────────────────────────────────────
insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('00000000-0000-0000-0000-000000000099', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated',
   'superadmin@bennnsam.local',
   crypt('BennnSamDemo!2026', gen_salt('bf')),
   now(),
   '{"provider":"email","providers":["email"],"is_super_admin":true}',
   '{"full_name":"Platform Super Admin"}',
   now(), now())
on conflict (id) do nothing;

-- Super-admin profile — tenant_id references Northstar but is_super_admin=true overrides everything.
insert into public.users_profile (id, tenant_id, full_name, email, role, is_super_admin, job_title, status)
values
  ('00000000-0000-0000-0000-000000000099',
   '00000000-0000-0000-0000-000000000001',
   'Platform Super Admin', 'superadmin@bennnsam.local',
   'super_admin', true, 'Platform Administrator', 'active')
on conflict (id) do nothing;

-- ─── Acme Mining auth users ────────────────────────────────────────────────
insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('31000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000000','authenticated','authenticated',
   'admin@acme.mining', crypt('BennnSamDemo!2026', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"],"tenant_id":"00000000-0000-0000-0000-000000000002"}',
   '{"full_name":"Sarah Mitchell"}', now(), now()),
  ('31000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000000','authenticated','authenticated',
   'assets@acme.mining', crypt('BennnSamDemo!2026', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"],"tenant_id":"00000000-0000-0000-0000-000000000002"}',
   '{"full_name":"Tom Nguyen"}', now(), now()),
  ('31000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000000','authenticated','authenticated',
   'finance@acme.mining', crypt('BennnSamDemo!2026', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"],"tenant_id":"00000000-0000-0000-0000-000000000002"}',
   '{"full_name":"Lisa Kaur"}', now(), now()),
  ('31000000-0000-0000-0000-000000000004','00000000-0000-0000-0000-000000000000','authenticated','authenticated',
   'viewer@acme.mining', crypt('BennnSamDemo!2026', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"],"tenant_id":"00000000-0000-0000-0000-000000000002"}',
   '{"full_name":"Jack Chen"}', now(), now())
on conflict (id) do nothing;

-- Acme Mining departments
insert into public.business_units (id, tenant_id, name, executive_owner) values
  ('11000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000002','Operations','Sarah Mitchell'),
  ('11000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000002','Mining Technology','Tom Nguyen')
on conflict (id) do nothing;

insert into public.departments (id, tenant_id, business_unit_id, name, cost_centre, manager) values
  ('21000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000002','11000000-0000-0000-0000-000000000001','IT Operations','CC-200','Sarah Mitchell'),
  ('21000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000002','11000000-0000-0000-0000-000000000002','Mine Systems','CC-210','Tom Nguyen'),
  ('21000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000002','11000000-0000-0000-0000-000000000001','Finance','CC-220','Lisa Kaur')
on conflict (id) do nothing;

-- Acme Mining user profiles
insert into public.users_profile (id, tenant_id, department_id, full_name, email, role, job_title, status) values
  ('31000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000002','21000000-0000-0000-0000-000000000001','Sarah Mitchell','admin@acme.mining','tenant_admin','Head of IT','active'),
  ('31000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000002','21000000-0000-0000-0000-000000000002','Tom Nguyen','assets@acme.mining','asset_manager','SAM Analyst','active'),
  ('31000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000002','21000000-0000-0000-0000-000000000003','Lisa Kaur','finance@acme.mining','finance_user','Finance Analyst','active'),
  ('31000000-0000-0000-0000-000000000004','00000000-0000-0000-0000-000000000002','21000000-0000-0000-0000-000000000001','Jack Chen','viewer@acme.mining','read_only','Procurement Coordinator','active')
on conflict (id) do nothing;

-- Acme Mining sample applications
insert into public.vendors (id, tenant_id, name, normalized_name, risk_rating) values
  ('41000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000002','Microsoft','microsoft','medium'),
  ('41000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000002','Trimble','trimble','medium'),
  ('41000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000002','SAP','sap','high')
on conflict (id) do nothing;

insert into public.applications (id, tenant_id, vendor_id, name, category, app_type, version, install_count, active_users, total_usage_minutes, active_usage_minutes, last_detected_date, approved, monthly_cost, renewal_date, risk_rating, tags) values
  ('51000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000002','41000000-0000-0000-0000-000000000001','Microsoft 365','Productivity','SaaS','Evergreen',85,72,64200,48100,'2026-05-24',true,4335,'2026-09-01','medium','{approved,tier-1}'),
  ('51000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000002','41000000-0000-0000-0000-000000000002','Trimble Siteworks','Mining','desktop','2024.1',22,18,28400,19200,'2026-05-22',true,6600,'2026-07-15','medium','{approved,specialist}'),
  ('51000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000002','41000000-0000-0000-0000-000000000003','SAP ERP','Enterprise','server','S4/HANA 2023',8,8,89400,72600,'2026-05-26',true,18500,'2026-12-01','high','{approved,tier-1,critical}')
on conflict (id) do nothing;

insert into public.devices (id, tenant_id, department_id, hostname, os, os_version, last_check_in, cpu_architecture, lifecycle_status, cost_centre) values
  ('61000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000002','21000000-0000-0000-0000-000000000001','ACME-WIN-001','Windows','11 24H2','2026-05-26 07:00:00+08','x64','active','CC-200'),
  ('61000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000002','21000000-0000-0000-0000-000000000002','ACME-RIG-012','Windows','10 22H2','2026-05-25 14:00:00+08','x64','active','CC-210')
on conflict (id) do nothing;

-- ─── ECU City Campus auth users ────────────────────────────────────────────
insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('32000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000000','authenticated','authenticated',
   'admin@ecu.campus', crypt('BennnSamDemo!2026', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"],"tenant_id":"00000000-0000-0000-0000-000000000003"}',
   '{"full_name":"Dr. Anna Brennan"}', now(), now()),
  ('32000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000000','authenticated','authenticated',
   'assets@ecu.campus', crypt('BennnSamDemo!2026', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"],"tenant_id":"00000000-0000-0000-0000-000000000003"}',
   '{"full_name":"James Okafor"}', now(), now())
on conflict (id) do nothing;

insert into public.business_units (id, tenant_id, name, executive_owner) values
  ('12000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000003','Information Technology','Dr. Anna Brennan')
on conflict (id) do nothing;

insert into public.departments (id, tenant_id, business_unit_id, name, cost_centre, manager) values
  ('22000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000003','12000000-0000-0000-0000-000000000001','IT Services','CC-300','Dr. Anna Brennan'),
  ('22000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000003','12000000-0000-0000-0000-000000000001','Library Systems','CC-310','James Okafor')
on conflict (id) do nothing;

insert into public.users_profile (id, tenant_id, department_id, full_name, email, role, job_title, status) values
  ('32000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000003','22000000-0000-0000-0000-000000000001','Dr. Anna Brennan','admin@ecu.campus','tenant_admin','Director of IT Services','active'),
  ('32000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000003','22000000-0000-0000-0000-000000000002','James Okafor','assets@ecu.campus','asset_manager','Software Asset Analyst','active')
on conflict (id) do nothing;

insert into public.vendors (id, tenant_id, name, normalized_name, risk_rating) values
  ('42000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000003','Microsoft','microsoft','medium'),
  ('42000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000003','Atlassian','atlassian','low')
on conflict (id) do nothing;

insert into public.applications (id, tenant_id, vendor_id, name, category, app_type, version, install_count, active_users, total_usage_minutes, active_usage_minutes, last_detected_date, approved, monthly_cost, renewal_date, risk_rating, tags) values
  ('52000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000003','42000000-0000-0000-0000-000000000001','Microsoft 365','Productivity','SaaS','Evergreen',420,380,312000,228000,'2026-05-26',true,19740,'2026-11-01','medium','{approved,tier-1}'),
  ('52000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000003','42000000-0000-0000-0000-000000000002','Confluence','Knowledge Management','SaaS','Cloud',280,210,94200,62800,'2026-05-25',true,4200,'2026-08-20','low','{approved,education}')
on conflict (id) do nothing;

-- ─── Donkey Billabong auth users ───────────────────────────────────────────
insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('33000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000000','authenticated','authenticated',
   'admin@donkey.billabong', crypt('BennnSamDemo!2026', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"],"tenant_id":"00000000-0000-0000-0000-000000000004"}',
   '{"full_name":"Bruce Walters"}', now(), now()),
  ('33000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000000','authenticated','authenticated',
   'viewer@donkey.billabong', crypt('BennnSamDemo!2026', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"],"tenant_id":"00000000-0000-0000-0000-000000000004"}',
   '{"full_name":"Mei Lin"}', now(), now())
on conflict (id) do nothing;

insert into public.business_units (id, tenant_id, name, executive_owner) values
  ('13000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000004','Technology','Bruce Walters')
on conflict (id) do nothing;

insert into public.departments (id, tenant_id, business_unit_id, name, cost_centre, manager) values
  ('23000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000004','13000000-0000-0000-0000-000000000001','IT','CC-400','Bruce Walters')
on conflict (id) do nothing;

insert into public.users_profile (id, tenant_id, department_id, full_name, email, role, job_title, status) values
  ('33000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000004','23000000-0000-0000-0000-000000000001','Bruce Walters','admin@donkey.billabong','tenant_admin','Systems Administrator','active'),
  ('33000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000004','23000000-0000-0000-0000-000000000001','Mei Lin','viewer@donkey.billabong','read_only','IT Coordinator','active')
on conflict (id) do nothing;

insert into public.vendors (id, tenant_id, name, normalized_name, risk_rating) values
  ('43000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000004','Microsoft','microsoft','medium')
on conflict (id) do nothing;

insert into public.applications (id, tenant_id, vendor_id, name, category, app_type, version, install_count, active_users, total_usage_minutes, active_usage_minutes, last_detected_date, approved, monthly_cost, renewal_date, risk_rating, tags) values
  ('53000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000004','43000000-0000-0000-0000-000000000001','Microsoft 365','Productivity','SaaS','Evergreen',38,31,24600,18400,'2026-05-24',true,1890,'2026-10-01','medium','{approved,tier-1}')
on conflict (id) do nothing;

-- ─── Update existing Northstar users to new role names ─────────────────────
-- (Migration 004 already handles the bulk rename; this ensures the seeded
--  Northstar profiles match the new names after a fresh supabase db reset.)
update public.users_profile
set role = 'tenant_admin'
where id = '30000000-0000-0000-0000-000000000001'
  and role not in ('super_admin','tenant_admin','asset_manager','finance_user','read_only');

update public.users_profile
set role = 'asset_manager'
where id = '30000000-0000-0000-0000-000000000002'
  and role not in ('super_admin','tenant_admin','asset_manager','finance_user','read_only');

update public.users_profile
set role = 'finance_user'
where id = '30000000-0000-0000-0000-000000000003'
  and role not in ('super_admin','tenant_admin','asset_manager','finance_user','read_only');
