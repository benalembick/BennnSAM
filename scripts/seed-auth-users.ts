/**
 * Creates BennnSAM demo auth users via the Supabase Admin API.
 * This is the only reliable method for hosted Supabase — direct SQL inserts
 * into auth.users bypass GoTrue's password hashing and often break sign-in.
 *
 * Run from the project root:
 *   npx tsx scripts/seed-auth-users.ts
 */

import { existsSync } from 'node:fs';
import { resolve }    from 'node:path';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

for (const p of ['.env', '../.env']) {
  const full = resolve(process.cwd(), p);
  if (existsSync(full)) { dotenv.config({ path: full }); break; }
}

const URL = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!URL || !KEY) {
  console.error('❌  SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be in .env');
  process.exit(1);
}

const supabase: SupabaseClient = createClient(URL, KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

const PASSWORD = 'BennnSamDemo!2026';

// Each entry: email → { fullName, tenantId, role, isSuperAdmin? }
const DEMO_USERS = [
  // ── Super Admin ──────────────────────────────────────────────
  { email: 'superadmin@bennnsam.local',
    fullName: 'Platform Super Admin',
    tenantId: '00000000-0000-0000-0000-000000000001',
    role: 'super_admin', isSuperAdmin: true },

  // ── Northstar Manufacturing ───────────────────────────────────
  { email: 'ava.collins@demo.bennnsam.local',
    fullName: 'Ava Collins',
    tenantId: '00000000-0000-0000-0000-000000000001',
    role: 'tenant_admin' },
  { email: 'marcus.tan@demo.bennnsam.local',
    fullName: 'Marcus Tan',
    tenantId: '00000000-0000-0000-0000-000000000001',
    role: 'asset_manager' },
  { email: 'priya.singh@demo.bennnsam.local',
    fullName: 'Priya Singh',
    tenantId: '00000000-0000-0000-0000-000000000001',
    role: 'finance_user' },

  // ── Acme Mining ──────────────────────────────────────────────
  { email: 'admin@acme.mining',
    fullName: 'Sarah Mitchell',
    tenantId: '00000000-0000-0000-0000-000000000002',
    role: 'tenant_admin' },
  { email: 'assets@acme.mining',
    fullName: 'Tom Nguyen',
    tenantId: '00000000-0000-0000-0000-000000000002',
    role: 'asset_manager' },
  { email: 'finance@acme.mining',
    fullName: 'Lisa Kaur',
    tenantId: '00000000-0000-0000-0000-000000000002',
    role: 'finance_user' },
  { email: 'viewer@acme.mining',
    fullName: 'Jack Chen',
    tenantId: '00000000-0000-0000-0000-000000000002',
    role: 'read_only' },

  // ── ECU City Campus ───────────────────────────────────────────
  { email: 'admin@ecu.campus',
    fullName: 'Dr. Anna Brennan',
    tenantId: '00000000-0000-0000-0000-000000000003',
    role: 'tenant_admin' },
  { email: 'assets@ecu.campus',
    fullName: 'James Okafor',
    tenantId: '00000000-0000-0000-0000-000000000003',
    role: 'asset_manager' },

  // ── Donkey Billabong ─────────────────────────────────────────
  { email: 'admin@donkey.billabong',
    fullName: 'Bruce Walters',
    tenantId: '00000000-0000-0000-0000-000000000004',
    role: 'tenant_admin' },
  { email: 'viewer@donkey.billabong',
    fullName: 'Mei Lin',
    tenantId: '00000000-0000-0000-0000-000000000004',
    role: 'read_only' },
] as const;

async function run() {
  console.log(`\n🔑  Seeding ${DEMO_USERS.length} demo users → ${URL}\n`);

  let created = 0;
  let updated = 0;
  let failed  = 0;

  for (const u of DEMO_USERS) {
    // ── 1. Look up or create the auth user ───────────────────────
    let authId: string;

    const { data: { users: existing } } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    const found = existing.find(au => au.email?.toLowerCase() === u.email.toLowerCase());

    if (found) {
      authId = found.id;
      // Update the password so it's definitely correct.
      const { error: updateErr } = await supabase.auth.admin.updateUserById(authId, {
        password:      PASSWORD,
        email_confirm: true,
        app_metadata: {
          provider:       'email',
          providers:      ['email'],
          tenant_id:      u.tenantId,
          is_super_admin: u.isSuperAdmin ?? false,
        },
        user_metadata: { full_name: u.fullName },
      });
      if (updateErr) {
        console.error(`  ❌  ${u.email} update failed: ${updateErr.message}`);
        failed++; continue;
      }
      console.log(`  🔄  ${u.email} — updated password + metadata`);
      updated++;
    } else {
      const { data, error: createErr } = await supabase.auth.admin.createUser({
        email:         u.email,
        password:      PASSWORD,
        email_confirm: true,
        app_metadata: {
          provider:       'email',
          providers:      ['email'],
          tenant_id:      u.tenantId,
          is_super_admin: u.isSuperAdmin ?? false,
        },
        user_metadata: { full_name: u.fullName },
      });
      if (createErr || !data.user) {
        console.error(`  ❌  ${u.email} create failed: ${createErr?.message ?? 'no user returned'}`);
        failed++; continue;
      }
      authId = data.user.id;
      console.log(`  ✅  ${u.email} — created (id: ${authId})`);
      created++;
    }

    // ── 2. Upsert users_profile with the real auth ID ────────────
    const { error: profileErr } = await supabase
      .from('users_profile')
      .upsert({
        id:            authId,
        tenant_id:     u.tenantId,
        full_name:     u.fullName,
        email:         u.email,
        role:          u.role,
        is_super_admin: u.isSuperAdmin ?? false,
        status:        'active',
      }, { onConflict: 'id' });

    if (profileErr) {
      console.warn(`  ⚠  ${u.email} — profile upsert failed: ${profileErr.message}`);
    }
  }

  console.log(`\n✔  Done — Created: ${created}  Updated: ${updated}  Failed: ${failed}`);
  if (failed > 0) process.exit(1);
}

run().catch((err: Error) => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
