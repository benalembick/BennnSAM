-- Run this in the Supabase SQL Editor (https://supabase.com/dashboard).
-- Creates all BennnSAM demo auth users with the exact UUIDs required by
-- users_profile. Safe to run multiple times — uses ON CONFLICT DO NOTHING.
--
-- Password for every account: BennnSamDemo!2026

-- Hosted Supabase requires ALL of these columns to be populated; omitting
-- the token/change fields causes GoTrue to reject the password on sign-in.

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, last_sign_in_at,
  raw_app_meta_data, raw_user_meta_data,
  is_super_admin, is_sso_user, is_anonymous,
  confirmation_token, recovery_token,
  email_change, email_change_token_new, email_change_token_current,
  phone_change, phone_change_token,
  email_change_confirm_status, reauthentication_token,
  created_at, updated_at
) values

-- Super Admin
( '00000000-0000-0000-0000-000000000099',
  '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
  'superadmin@bennnsam.local',
  crypt('BennnSamDemo!2026', gen_salt('bf')),
  now(), now(),
  '{"provider":"email","providers":["email"],"is_super_admin":true}',
  '{"full_name":"Platform Super Admin"}',
  false, false, false, '', '', '', '', '', '', '', 0, '', now(), now() ),

-- Northstar Manufacturing
( '30000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
  'ava.collins@demo.bennnsam.local',
  crypt('BennnSamDemo!2026', gen_salt('bf')),
  now(), now(),
  '{"provider":"email","providers":["email"],"tenant_id":"00000000-0000-0000-0000-000000000001"}',
  '{"full_name":"Ava Collins"}',
  false, false, false, '', '', '', '', '', '', '', 0, '', now(), now() ),

( '30000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
  'marcus.tan@demo.bennnsam.local',
  crypt('BennnSamDemo!2026', gen_salt('bf')),
  now(), now(),
  '{"provider":"email","providers":["email"],"tenant_id":"00000000-0000-0000-0000-000000000001"}',
  '{"full_name":"Marcus Tan"}',
  false, false, false, '', '', '', '', '', '', '', 0, '', now(), now() ),

( '30000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
  'priya.singh@demo.bennnsam.local',
  crypt('BennnSamDemo!2026', gen_salt('bf')),
  now(), now(),
  '{"provider":"email","providers":["email"],"tenant_id":"00000000-0000-0000-0000-000000000001"}',
  '{"full_name":"Priya Singh"}',
  false, false, false, '', '', '', '', '', '', '', 0, '', now(), now() ),

-- Acme Mining
( '31000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
  'admin@acme.mining',
  crypt('BennnSamDemo!2026', gen_salt('bf')),
  now(), now(),
  '{"provider":"email","providers":["email"],"tenant_id":"00000000-0000-0000-0000-000000000002"}',
  '{"full_name":"Sarah Mitchell"}',
  false, false, false, '', '', '', '', '', '', '', 0, '', now(), now() ),

( '31000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
  'assets@acme.mining',
  crypt('BennnSamDemo!2026', gen_salt('bf')),
  now(), now(),
  '{"provider":"email","providers":["email"],"tenant_id":"00000000-0000-0000-0000-000000000002"}',
  '{"full_name":"Tom Nguyen"}',
  false, false, false, '', '', '', '', '', '', '', 0, '', now(), now() ),

( '31000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
  'finance@acme.mining',
  crypt('BennnSamDemo!2026', gen_salt('bf')),
  now(), now(),
  '{"provider":"email","providers":["email"],"tenant_id":"00000000-0000-0000-0000-000000000002"}',
  '{"full_name":"Lisa Kaur"}',
  false, false, false, '', '', '', '', '', '', '', 0, '', now(), now() ),

( '31000000-0000-0000-0000-000000000004',
  '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
  'viewer@acme.mining',
  crypt('BennnSamDemo!2026', gen_salt('bf')),
  now(), now(),
  '{"provider":"email","providers":["email"],"tenant_id":"00000000-0000-0000-0000-000000000002"}',
  '{"full_name":"Jack Chen"}',
  false, false, false, '', '', '', '', '', '', '', 0, '', now(), now() ),

-- ECU City Campus
( '32000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
  'admin@ecu.campus',
  crypt('BennnSamDemo!2026', gen_salt('bf')),
  now(), now(),
  '{"provider":"email","providers":["email"],"tenant_id":"00000000-0000-0000-0000-000000000003"}',
  '{"full_name":"Dr. Anna Brennan"}',
  false, false, false, '', '', '', '', '', '', '', 0, '', now(), now() ),

( '32000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
  'assets@ecu.campus',
  crypt('BennnSamDemo!2026', gen_salt('bf')),
  now(), now(),
  '{"provider":"email","providers":["email"],"tenant_id":"00000000-0000-0000-0000-000000000003"}',
  '{"full_name":"James Okafor"}',
  false, false, false, '', '', '', '', '', '', '', 0, '', now(), now() ),

-- Donkey Billabong
( '33000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
  'admin@donkey.billabong',
  crypt('BennnSamDemo!2026', gen_salt('bf')),
  now(), now(),
  '{"provider":"email","providers":["email"],"tenant_id":"00000000-0000-0000-0000-000000000004"}',
  '{"full_name":"Bruce Walters"}',
  false, false, false, '', '', '', '', '', '', '', 0, '', now(), now() ),

( '33000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
  'viewer@donkey.billabong',
  crypt('BennnSamDemo!2026', gen_salt('bf')),
  now(), now(),
  '{"provider":"email","providers":["email"],"tenant_id":"00000000-0000-0000-0000-000000000004"}',
  '{"full_name":"Mei Lin"}',
  false, false, false, '', '', '', '', '', '', '', 0, '', now(), now() )

on conflict (id) do update set
  encrypted_password = excluded.encrypted_password,
  email_confirmed_at = coalesce(auth.users.email_confirmed_at, excluded.email_confirmed_at),
  raw_app_meta_data  = excluded.raw_app_meta_data,
  updated_at         = now();
