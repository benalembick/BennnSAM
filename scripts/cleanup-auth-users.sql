-- Run in Supabase SQL Editor BEFORE re-running seed-auth-users.ts.
-- Removes any directly-inserted auth.users rows that GoTrue can't work with.
-- users_profile rows cascade-delete automatically (ON DELETE CASCADE).

delete from auth.users
where email in (
  'superadmin@bennnsam.local',
  'ava.collins@demo.bennnsam.local',
  'marcus.tan@demo.bennnsam.local',
  'priya.singh@demo.bennnsam.local',
  'admin@acme.mining',
  'assets@acme.mining',
  'finance@acme.mining',
  'viewer@acme.mining',
  'admin@ecu.campus',
  'assets@ecu.campus',
  'admin@donkey.billabong',
  'viewer@donkey.billabong'
);
