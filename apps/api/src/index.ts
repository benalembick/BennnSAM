import { existsSync } from 'node:fs';
import { createHash, randomBytes } from 'node:crypto';
import { dirname, join, resolve } from 'node:path';
import { createClient } from '@supabase/supabase-js';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import type { NextFunction, Request, Response } from 'express';
import morgan from 'morgan';
import { nanoid } from 'nanoid';
import { z } from 'zod';
import {
  applications,
  auditLog,
  complianceResults,
  costRecords,
  customInventoryRules,
  departments,
  devices,
  exportWorkflows,
  integrations,
  licences,
  normalizationReviewQueue,
  reports,
  saasDetections,
  savingsRecommendations,
  usageEvents,
  users
} from './demoData.js';
import { runAssistantQuery } from './reportEngine.js';
import { cloudConnections, cloudabilityPayload } from './cloudabilityData.js';
import {
  getBootstrapData,
  getApplications,
  getApplicationById,
  getDevices,
  getUsageData,
  getSaasData,
  getLicences,
  getCostsData,
  getComplianceData,
  getIntegrations,
  syncIntegration,
  getExportWorkflows,
  createExportWorkflow,
  runExportWorkflow,
  getRules,
  getNormalizationData,
  getReports,
  getOverviewData,
  daysUntil,
} from './supabaseData.js';
import {
  createRequireAuth,
  requireRole,
  requireSuperAdmin,
  getAuth,
  DEMO_CREDENTIALS,
  updateDemoUser,
  type AuthContext
} from './auth.js';
import { sendInviteEmail, smtpConfigured, roleLabel } from './email.js';

loadEnvironment();

const app = express();
const port = Number(process.env.PORT ?? process.env.API_PORT ?? 4100);
const defaultTenantId   = process.env.BENNSAM_DEFAULT_TENANT_ID   ?? '00000000-0000-0000-0000-000000000001';
const defaultTenantName = process.env.BENNSAM_DEFAULT_TENANT_NAME ?? 'Northstar Manufacturing';
const defaultTenantSlug = process.env.BENNSAM_DEFAULT_TENANT_SLUG ?? 'northstar';

const supabaseAdmin =
  process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
        auth: { persistSession: false, autoRefreshToken: false }
      })
    : null;

const currentDir   = dirname(resolve(process.argv[1]));
const webDistPath  = resolve(currentDir, '../../web/dist');
const webIndexPath = join(webDistPath, 'index.html');

const requireAuth = createRequireAuth(supabaseAdmin);

function loadEnvironment() {
  const candidates = [
    resolve(process.cwd(), '.env'),
    resolve(process.cwd(), '..', '.env'),
    resolve(process.cwd(), '..', '..', '.env')
  ];
  for (const path of candidates) {
    if (existsSync(path)) dotenv.config({ path });
  }
}

app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(',') ?? ['http://localhost:5173', 'http://localhost:5172'],
    credentials: true
  })
);
app.use(express.json({ limit: '3mb' }));
app.use(morgan('dev'));

const inDays = (date: string) => daysUntil(date);

// ─── Health ────────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    name: 'BennnSam API',
    mode: supabaseAdmin ? 'supabase-live' : 'demo-memory',
    database: supabaseAdmin ? 'supabase' : 'memory',
    authRequired: true
  });
});

// ─── Auth endpoints ────────────────────────────────────────────────────────

// POST /api/auth/login — email+password login.
// In Supabase mode the client should call supabase.auth.signInWithPassword directly;
// this endpoint exists for demo mode and server-side flows.
app.post('/api/auth/login', async (req, res) => {
  const email    = String(req.body.email ?? '').toLowerCase().trim();
  const password = String(req.body.password ?? '');

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  if (!supabaseAdmin) {
    // Demo mode: accept any password for known demo emails.
    const demoToken = DEMO_CREDENTIALS[email];
    if (!demoToken) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }
    return res.json({ accessToken: demoToken, mode: 'demo' });
  }

  const { data, error } = await supabaseAdmin.auth.signInWithPassword({ email, password });
  if (error || !data.session) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  await writeAuditLog(supabaseAdmin, {
    tenantId: data.user.app_metadata?.tenant_id as string | undefined ?? defaultTenantId,
    actorId: data.user.id,
    action: 'login',
    entityType: 'auth',
    entityId: data.user.id,
    ipAddress: String(req.ip ?? ''),
    userAgent: req.header('user-agent')
  });

  res.json({ accessToken: data.session.access_token, expiresAt: data.session.expires_at });
});

// POST /api/auth/logout
app.post('/api/auth/logout', requireAuth, async (req, res) => {
  const auth = getAuth(res);
  if (supabaseAdmin) {
    await writeAuditLog(supabaseAdmin, {
      tenantId: auth.tenantId,
      actorId: auth.userId,
      action: 'logout',
      entityType: 'auth',
      entityId: auth.userId,
      ipAddress: String(req.ip ?? ''),
      userAgent: req.header('user-agent')
    });
  }
  res.json({ ok: true });
});

// POST /api/auth/set-password — sets password via admin key; used when the browser Supabase
// client is not available (e.g. VITE_SUPABASE_ANON_KEY not loaded by Vite).
const setPasswordSchema = z.object({ password: z.string().min(8).max(72) });

app.post('/api/auth/set-password', requireAuth, async (req, res) => {
  const auth   = getAuth(res);
  const client = requireSupabase(res);
  if (!client) return;

  const parsed = setPasswordSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { error } = await client.auth.admin.updateUserById(auth.userId, {
    password: parsed.data.password
  });
  if (error) return res.status(500).json({ error: error.message });

  await client
    .from('users_profile')
    .update({ status: 'active' })
    .eq('id', auth.userId)
    .eq('status', 'invited');

  res.json({ ok: true });
});

// POST /api/auth/activate — called after the invited user sets their password; marks status active.
app.post('/api/auth/activate', requireAuth, async (_req, res) => {
  const auth = getAuth(res);
  if (!supabaseAdmin) return res.json({ ok: true });

  await supabaseAdmin
    .from('users_profile')
    .update({ status: 'active' })
    .eq('id', auth.userId)
    .eq('status', 'invited');

  res.json({ ok: true });
});

// PATCH /api/auth/profile — update the current user's own name, email, or password.
const updateProfileSchema = z.object({
  fullName: z.string().min(1).max(200).optional(),
  email: z.string().email().optional(),
  password: z.string().min(8).max(72).optional(),
});

app.patch('/api/auth/profile', requireAuth, async (req, res) => {
  const auth = getAuth(res);
  const parsed = updateProfileSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { fullName, email, password } = parsed.data;

  if (!supabaseAdmin) {
    updateDemoUser(auth.userId, { ...(fullName && { fullName }), ...(email && { email }) });
    return res.json({ ok: true });
  }

  const profileUpdates: Record<string, unknown> = {};
  if (fullName) profileUpdates.full_name = fullName;
  if (email) profileUpdates.email = email;

  if (Object.keys(profileUpdates).length > 0) {
    const { error } = await supabaseAdmin
      .from('users_profile')
      .update(profileUpdates)
      .eq('id', auth.userId);
    if (error) return res.status(500).json({ error: error.message });
  }

  const authUpdates: Record<string, string> = {};
  if (email) authUpdates.email = email;
  if (password) authUpdates.password = password;

  if (Object.keys(authUpdates).length > 0) {
    const { error } = await supabaseAdmin.auth.admin.updateUserById(auth.userId, authUpdates);
    if (error) return res.status(500).json({ error: error.message });
  }

  res.json({ ok: true });
});

// PATCH /api/admin/tenant/logo — tenant_admin updates their organisation's logo.
const updateTenantLogoSchema = z.object({
  logoUrl: z.string().max(1_500_000).nullable()
});

app.patch('/api/admin/tenant/logo', requireAuth, requireRole('tenant_admin'), async (req, res) => {
  const auth   = getAuth(res);
  const parsed = updateTenantLogoSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { logoUrl } = parsed.data;

  if (logoUrl && !logoUrl.startsWith('data:image/')) {
    return res.status(400).json({ error: 'Logo must be an image data URL.' });
  }

  if (!supabaseAdmin) {
    if (logoUrl) demoTenantLogos.set(auth.tenantId, logoUrl);
    else demoTenantLogos.delete(auth.tenantId);
    return res.json({ ok: true });
  }

  const { error } = await supabaseAdmin
    .from('tenants')
    .update({ logo_url: logoUrl ?? null })
    .eq('id', auth.tenantId);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

// GET /api/auth/me — return authenticated user's profile + tenant.
app.get('/api/auth/me', requireAuth, async (_req, res) => {
  const auth = getAuth(res);

  if (!supabaseAdmin) {
    return res.json({
      userId: auth.userId,
      email: auth.email,
      fullName: auth.fullName,
      role: auth.role,
      isSuperAdmin: auth.isSuperAdmin,
      tenantId: auth.tenantId,
      tenantName: getDemoTenantName(auth.tenantId),
      tenantLogoUrl: getDemoTenantLogoUrl(auth.tenantId)
    });
  }

  const [{ data: profile }, { data: tenant }] = await Promise.all([
    supabaseAdmin.from('users_profile').select('*').eq('id', auth.userId).single(),
    supabaseAdmin.from('tenants').select('*').eq('id', auth.tenantId).single()
  ]);

  res.json({ ...profile, tenant });
});

// ─── Tenant-admin: user management ────────────────────────────────────────

// GET /api/admin/users
app.get('/api/admin/users', requireAuth, requireRole('tenant_admin'), async (_req, res) => {
  const auth = getAuth(res);

  if (!supabaseAdmin) {
    const tenantUsers = demoTenantUsers[auth.tenantId] ?? [];
    return res.json([...tenantUsers].sort((a, b) => a.fullName.localeCompare(b.fullName)));
  }

  const { data, error } = await supabaseAdmin
    .from('users_profile')
    .select('id, full_name, email, role, status, last_login_at, invited_at, created_at, department_id')
    .eq('tenant_id', auth.tenantId)
    .order('full_name');

  if (error) return res.status(500).json({ error: error.message });
  res.json((data ?? []).map(mapUserProfileRow));
});

// POST /api/admin/users/invite
const inviteUserSchema = z.object({
  email:    z.string().email(),
  fullName: z.string().min(1).max(200),
  role:     z.enum(['tenant_admin', 'asset_manager', 'finance_user', 'read_only'])
});

app.post('/api/admin/users/invite', requireAuth, requireRole('tenant_admin'), async (req, res) => {
  const auth = getAuth(res);

  const parsed = inviteUserSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { email, fullName, role } = parsed.data;

  if (!supabaseAdmin) {
    const existing = (demoTenantUsers[auth.tenantId] ?? []).find((u) => u.email === email);
    if (existing) return res.status(409).json({ error: 'A user with that email already exists.' });
    const tenantUsers = demoTenantUsers[auth.tenantId] ?? (demoTenantUsers[auth.tenantId] = []);
    const newUser: DemoUser = {
      id: `demo-${nanoid(8)}`, fullName, email, role, status: 'invited',
      lastLoginAt: null, invitedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(), departmentId: null
    };
    tenantUsers.push(newUser);
    return res.status(201).json(newUser);
  }

  // Guard: reject if already in this tenant (prevents rate-limit triggers on re-invite)
  const { data: existingProfile } = await supabaseAdmin
    .from('users_profile')
    .select('id, status')
    .eq('tenant_id', auth.tenantId)
    .eq('email', email)
    .maybeSingle();

  if (existingProfile) {
    const msg = (existingProfile as Record<string, unknown>).status === 'invited'
      ? 'This user has already been invited and is awaiting acceptance.'
      : 'A user with that email already exists in this organisation.';
    return res.status(409).json({ error: msg });
  }

  const inviteRedirectUrl = resolveInviteRedirectUrl();
  const tenantName = await resolveTenantName(auth.tenantId);

  let authUserId: string;

  if (smtpConfigured()) {
    // Create the auth account directly — avoids the invite email rate-limit bucket entirely.
    // email_confirm: true so the Supabase session is fully valid when the accept link is clicked.
    const { error: createError } = await supabaseAdmin.auth.admin.createUser({
      email, email_confirm: true, user_metadata: { full_name: fullName }
    });
    if (createError && !/already|duplicate|registered/i.test(createError.message)) {
      return res.status(500).json({ error: createError.message });
    }
    // Recovery links use a separate, less-strict rate-limit bucket vs invite links.
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery', email, options: { redirectTo: inviteRedirectUrl }
    });
    if (linkError) return res.status(500).json({ error: linkError.message });
    authUserId = linkData.user.id;
    try {
      await sendInviteEmail({ to: email, fullName, tenantName, role, inviteUrl: linkData.properties.action_link });
    } catch (mailErr) {
      console.error('Invite email send failed:', (mailErr as Error).message);
    }
  } else {
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      data: { full_name: fullName }, redirectTo: inviteRedirectUrl
    });
    if (authError) return res.status(500).json({ error: authError.message });
    authUserId = authUser.user.id;
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('users_profile')
    .insert({
      id: authUserId,
      tenant_id: auth.tenantId,
      full_name: fullName,
      email,
      role,
      status: 'invited',
      invited_at: new Date().toISOString()
    })
    .select()
    .single();

  if (profileError) return res.status(500).json({ error: profileError.message });

  await writeAuditLog(supabaseAdmin, {
    tenantId: auth.tenantId,
    actorId: auth.userId,
    action: 'user_invited',
    entityType: 'user',
    entityId: authUserId,
    afterState: { email, role, fullName },
    ipAddress: String(req.ip ?? '')
  });

  res.status(201).json(mapUserProfileRow(profile as Record<string, unknown>));
});

// PATCH /api/admin/users/:id
const updateUserSchema = z.object({
  role:     z.enum(['tenant_admin', 'asset_manager', 'finance_user', 'read_only']).optional(),
  status:   z.enum(['active', 'disabled']).optional(),
  fullName: z.string().min(1).max(200).optional()
});

app.patch('/api/admin/users/:id', requireAuth, requireRole('tenant_admin'), async (req, res) => {
  const auth = getAuth(res);

  const parsed = updateUserSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  if (!supabaseAdmin) {
    const user = (demoTenantUsers[auth.tenantId] ?? []).find((u) => u.id === String(req.params.id));
    if (!user) return res.status(404).json({ error: 'User not found in your organisation.' });
    if (parsed.data.role)     user.role     = parsed.data.role;
    if (parsed.data.status)   user.status   = parsed.data.status;
    if (parsed.data.fullName) user.fullName = parsed.data.fullName;
    return res.json(user);
  }

  // Fetch current state for audit log.
  const { data: before } = await supabaseAdmin
    .from('users_profile')
    .select('role, status, full_name')
    .eq('id', String(req.params.id))
    .eq('tenant_id', auth.tenantId)
    .maybeSingle();

  if (!before) return res.status(404).json({ error: 'User not found in your organisation.' });

  const updates: Record<string, unknown> = {};
  if (parsed.data.role)     updates.role      = parsed.data.role;
  if (parsed.data.status)   updates.status    = parsed.data.status;
  if (parsed.data.fullName) updates.full_name = parsed.data.fullName;

  const { data, error } = await supabaseAdmin
    .from('users_profile')
    .update(updates)
    .eq('id', String(req.params.id))
    .eq('tenant_id', auth.tenantId)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  await writeAuditLog(supabaseAdmin, {
    tenantId: auth.tenantId,
    actorId: auth.userId,
    action: parsed.data.status === 'disabled' ? 'user_disabled' : 'user_updated',
    entityType: 'user',
    entityId: String(req.params.id),
    beforeState: before,
    afterState: updates,
    ipAddress: String(req.ip ?? '')
  });

  res.json(mapUserProfileRow(data as Record<string, unknown>));
});

// ─── Super-admin: tenant management ───────────────────────────────────────

// GET /api/superadmin/tenants
app.get('/api/superadmin/tenants', requireAuth, requireSuperAdmin, async (_req, res) => {
  const client = requireSupabase(res);
  if (!client) return;

  const { data: tenants, error } = await client
    .from('tenants')
    .select('*')
    .order('name');

  if (error) return res.status(500).json({ error: error.message });

  // Attach usage counts.
  const tenantIds = (tenants ?? []).map((t: Record<string, unknown>) => t.id as string);

  const [usersResult, devicesResult, agentResult] = await Promise.all([
    client.from('users_profile').select('tenant_id').in('tenant_id', tenantIds),
    client.from('devices').select('tenant_id').in('tenant_id', tenantIds),
    client.from('agent_api_keys').select('tenant_id').in('tenant_id', tenantIds).is('revoked_at', null)
  ]);

  const countBy = (rows: Array<{ tenant_id: string }> | null) =>
    (rows ?? []).reduce<Record<string, number>>((acc, r) => {
      acc[r.tenant_id] = (acc[r.tenant_id] ?? 0) + 1;
      return acc;
    }, {});

  const userCounts   = countBy(usersResult.data as Array<{ tenant_id: string }> | null);
  const deviceCounts = countBy(devicesResult.data as Array<{ tenant_id: string }> | null);
  const agentCounts  = countBy(agentResult.data as Array<{ tenant_id: string }> | null);

  const enriched = (tenants ?? []).map((t: Record<string, unknown>) => ({
    ...t,
    logoUrl:     (t.logo_url as string | null) ?? null,
    disabledAt:  (t.disabled_at as string | null) ?? null,
    enrollmentKey: (t.enrollment_key as string | null) ?? null,
    userCount:   userCounts[t.id as string]   ?? 0,
    deviceCount: deviceCounts[t.id as string] ?? 0,
    agentCount:  agentCounts[t.id as string]  ?? 0
  }));

  res.json(enriched);
});

// POST /api/superadmin/tenants
const createTenantSchema = z.object({
  name: z.string().min(1).max(200),
  slug: z.string().min(1).max(80).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens')
});

app.post('/api/superadmin/tenants', requireAuth, requireSuperAdmin, async (req, res) => {
  const auth   = getAuth(res);
  const client = requireSupabase(res);
  if (!client) return;

  const parsed = createTenantSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { data, error } = await client
    .from('tenants')
    .insert({ name: parsed.data.name, slug: parsed.data.slug })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  await writeAuditLog(client, {
    tenantId: auth.tenantId,
    actorId: auth.userId,
    action: 'tenant_created',
    entityType: 'tenant',
    entityId: (data as Record<string, unknown>).id as string,
    afterState: parsed.data,
    ipAddress: String(req.ip ?? '')
  });

  res.status(201).json(data);
});

// PATCH /api/superadmin/tenants/:id
const updateTenantSchema = z.object({
  name:    z.string().min(1).max(200).optional(),
  status:  z.enum(['active', 'trial', 'disabled']).optional(),
  logoUrl: z.string().max(1_500_000).nullable().optional()
});

app.patch('/api/superadmin/tenants/:id', requireAuth, requireSuperAdmin, async (req, res) => {
  const auth     = getAuth(res);
  const tenantId = String(req.params.id);

  const parsed = updateTenantSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  if (parsed.data.logoUrl !== undefined) {
    const logoUrl = parsed.data.logoUrl;
    if (logoUrl && !logoUrl.startsWith('data:image/')) {
      return res.status(400).json({ error: 'Logo must be an image data URL.' });
    }
    if (!supabaseAdmin) {
      if (logoUrl) demoTenantLogos.set(tenantId, logoUrl);
      else demoTenantLogos.delete(tenantId);
      return res.json({ ok: true });
    }
    const { error } = await supabaseAdmin
      .from('tenants')
      .update({ logo_url: logoUrl ?? null })
      .eq('id', tenantId);
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ ok: true });
  }

  const client = requireSupabase(res);
  if (!client) return;

  const updates: Record<string, unknown> = {};
  if (parsed.data.name)   updates.name = parsed.data.name;
  if (parsed.data.status) {
    updates.status = parsed.data.status;
    if (parsed.data.status === 'disabled') updates.disabled_at = new Date().toISOString();
  }

  const { data, error } = await client
    .from('tenants')
    .update(updates)
    .eq('id', tenantId)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  await writeAuditLog(client, {
    tenantId: auth.tenantId,
    actorId: auth.userId,
    action: parsed.data.status === 'disabled' ? 'tenant_disabled' : 'tenant_updated',
    entityType: 'tenant',
    entityId: tenantId,
    afterState: updates,
    ipAddress: String(req.ip ?? '')
  });

  res.json(data);
});

// ─── Super-admin: per-tenant user management ──────────────────────────────

// GET /api/superadmin/tenants/:tenantId/users
app.get('/api/superadmin/tenants/:tenantId/users', requireAuth, requireSuperAdmin, async (req, res) => {
  const tenantId = String(req.params.tenantId);

  if (!supabaseAdmin) {
    const tenantUsers = demoTenantUsers[tenantId] ?? [];
    return res.json([...tenantUsers].sort((a, b) => a.fullName.localeCompare(b.fullName)));
  }

  const { data, error } = await supabaseAdmin
    .from('users_profile')
    .select('id, full_name, email, role, status, last_login_at, invited_at, created_at, department_id')
    .eq('tenant_id', tenantId)
    .order('full_name');

  if (error) return res.status(500).json({ error: error.message });
  res.json((data ?? []).map(mapUserProfileRow));
});

// POST /api/superadmin/tenants/:tenantId/users/invite
app.post('/api/superadmin/tenants/:tenantId/users/invite', requireAuth, requireSuperAdmin, async (req, res) => {
  const auth = getAuth(res);
  const tenantId = String(req.params.tenantId);

  const parsed = inviteUserSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { email, fullName, role } = parsed.data;

  if (!supabaseAdmin) {
    const existing = (demoTenantUsers[tenantId] ?? []).find((u) => u.email === email);
    if (existing) return res.status(409).json({ error: 'A user with that email already exists.' });
    const tenantUsers = demoTenantUsers[tenantId] ?? (demoTenantUsers[tenantId] = []);
    const newUser: DemoUser = {
      id: `demo-${nanoid(8)}`, fullName, email, role, status: 'invited',
      lastLoginAt: null, invitedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(), departmentId: null
    };
    tenantUsers.push(newUser);
    return res.status(201).json(newUser);
  }

  // Guard: reject if already in this tenant
  const { data: existingProfile } = await supabaseAdmin
    .from('users_profile')
    .select('id, status')
    .eq('tenant_id', tenantId)
    .eq('email', email)
    .maybeSingle();

  if (existingProfile) {
    const msg = (existingProfile as Record<string, unknown>).status === 'invited'
      ? 'This user has already been invited and is awaiting acceptance.'
      : 'A user with that email already exists in this organisation.';
    return res.status(409).json({ error: msg });
  }

  const inviteRedirectUrl = resolveInviteRedirectUrl();
  const tenantName = await resolveTenantName(tenantId);

  let authUserId: string;

  if (smtpConfigured()) {
    const { error: createError } = await supabaseAdmin.auth.admin.createUser({
      email, email_confirm: false, user_metadata: { full_name: fullName }
    });
    if (createError && !/already|duplicate|registered/i.test(createError.message)) {
      return res.status(500).json({ error: createError.message });
    }
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery', email, options: { redirectTo: inviteRedirectUrl }
    });
    if (linkError) return res.status(500).json({ error: linkError.message });
    authUserId = linkData.user.id;
    try {
      await sendInviteEmail({ to: email, fullName, tenantName, role, inviteUrl: linkData.properties.action_link });
    } catch (mailErr) {
      console.error('Invite email send failed:', (mailErr as Error).message);
    }
  } else {
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      data: { full_name: fullName }, redirectTo: inviteRedirectUrl
    });
    if (authError) return res.status(500).json({ error: authError.message });
    authUserId = authUser.user.id;
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('users_profile')
    .insert({
      id: authUserId, tenant_id: tenantId,
      full_name: fullName, email, role, status: 'invited',
      invited_at: new Date().toISOString()
    })
    .select()
    .single();

  if (profileError) return res.status(500).json({ error: profileError.message });

  await writeAuditLog(supabaseAdmin, {
    tenantId, actorId: auth.userId, action: 'user_invited',
    entityType: 'user', entityId: authUserId,
    afterState: { email, role, fullName },
    ipAddress: String(req.ip ?? '')
  });

  res.status(201).json(mapUserProfileRow(profile as Record<string, unknown>));
});

// PATCH /api/superadmin/tenants/:tenantId/users/:userId
app.patch('/api/superadmin/tenants/:tenantId/users/:userId', requireAuth, requireSuperAdmin, async (req, res) => {
  const auth = getAuth(res);
  const tenantId = String(req.params.tenantId);
  const userId   = String(req.params.userId);

  const parsed = updateUserSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  if (!supabaseAdmin) {
    const user = (demoTenantUsers[tenantId] ?? []).find((u) => u.id === userId);
    if (!user) return res.status(404).json({ error: 'User not found.' });
    if (parsed.data.role)     user.role     = parsed.data.role;
    if (parsed.data.status)   user.status   = parsed.data.status;
    if (parsed.data.fullName) user.fullName = parsed.data.fullName;
    return res.json(user);
  }

  const { data: before } = await supabaseAdmin
    .from('users_profile')
    .select('role, status, full_name')
    .eq('id', userId).eq('tenant_id', tenantId)
    .maybeSingle();

  if (!before) return res.status(404).json({ error: 'User not found.' });

  const updates: Record<string, unknown> = {};
  if (parsed.data.role)     updates.role      = parsed.data.role;
  if (parsed.data.status)   updates.status    = parsed.data.status;
  if (parsed.data.fullName) updates.full_name = parsed.data.fullName;

  const { data, error } = await supabaseAdmin
    .from('users_profile')
    .update(updates)
    .eq('id', userId).eq('tenant_id', tenantId)
    .select().single();

  if (error) return res.status(500).json({ error: error.message });

  await writeAuditLog(supabaseAdmin, {
    tenantId, actorId: auth.userId,
    action: parsed.data.status === 'disabled' ? 'user_disabled' : 'user_updated',
    entityType: 'user', entityId: userId,
    beforeState: before, afterState: updates,
    ipAddress: String(req.ip ?? '')
  });

  res.json(mapUserProfileRow(data as Record<string, unknown>));
});

// GET /api/superadmin/audit-log
app.get('/api/superadmin/audit-log', requireAuth, requireSuperAdmin, async (req, res) => {
  const client = requireSupabase(res);
  if (!client) return;

  const limit = Number(req.query.limit ?? 200);
  const { data, error } = await client
    .from('audit_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) return res.status(500).json({ error: error.message });
  res.json(data ?? []);
});

// ─── Tenant data routes (auth + tenant-scoped) ─────────────────────────────

app.get('/api/bootstrap', requireAuth, async (_req, res) => {
  const auth = getAuth(res);
  if (supabaseAdmin) {
    try {
      const data = await getBootstrapData(supabaseAdmin, auth.tenantId);
      return res.json(data);
    } catch (err) {
      return res.status(500).json({ error: (err as Error).message });
    }
  }
  res.json({ departments, users, auditLog });
});

app.get('/api/overview', requireAuth, async (_req, res) => {
  const auth = getAuth(res);
  if (supabaseAdmin) {
    try {
      const data = await getOverviewData(supabaseAdmin, auth.tenantId);
      return res.json(data);
    } catch (err) {
      return res.status(500).json({ error: (err as Error).message });
    }
  }
  const totalMonthlySpend = applications.reduce((sum, appItem) => sum + appItem.monthlyCost, 0);
  const underusedLicences = licences.reduce((sum, licence) => {
    if (licence.complianceStatus !== 'over-licensed') return sum;
    return sum + Math.max(licence.purchasedQuantity - licence.consumedQuantity, 0);
  }, 0);
  res.json({
    cards: {
      totalSoftwareApplications: applications.length,
      saasApplications: applications.filter((a) => a.type === 'SaaS' || a.type === 'browser app').length,
      onPremApplications: applications.filter((a) => a.type === 'desktop' || a.type === 'server').length,
      totalDevices: devices.length,
      totalUsers: users.length,
      monthlySoftwareSpend: totalMonthlySpend,
      potentialSavings: savingsRecommendations.reduce((sum, item) => sum + item.estimatedAnnualSavings, 0),
      underusedLicences,
      complianceRiskCount: complianceResults.length,
      upcomingRenewals: licences.filter((l) => inDays(l.renewalDate) <= 90).length,
      shadowSaasDetections: saasDetections.filter((item) => !item.approved).length
    },
    trends: [
      { label: 'Spend', value: totalMonthlySpend, change: 7.4 },
      { label: 'Active usage', value: applications.reduce((sum, a) => sum + a.activeUsageMinutes, 0), change: 3.1 },
      { label: 'Risk findings', value: complianceResults.length, change: -8.2 },
      { label: 'Shadow SaaS', value: saasDetections.filter((item) => !item.approved).length, change: 12.5 }
    ],
    spendByVendor: Object.values(
      applications.reduce<Record<string, { vendor: string; spend: number }>>((acc, appItem) => {
        acc[appItem.vendor] ??= { vendor: appItem.vendor, spend: 0 };
        acc[appItem.vendor].spend += appItem.monthlyCost;
        return acc;
      }, {})
    ).sort((a, b) => b.spend - a.spend),
    usageByCategory: Object.values(
      applications.reduce<Record<string, { category: string; active: number; total: number }>>((acc, appItem) => {
        acc[appItem.category] ??= { category: appItem.category, active: 0, total: 0 };
        acc[appItem.category].active += appItem.activeUsageMinutes;
        acc[appItem.category].total += appItem.totalUsageMinutes;
        return acc;
      }, {})
    ),
    renewalTimeline: licences
      .map((l) => ({
        application: l.applicationName,
        vendor: l.vendor,
        renewalDate: l.renewalDate,
        days: inDays(l.renewalDate),
        annualValue: Math.round(l.purchasedQuantity * l.costPerLicence * 12)
      }))
      .sort((a, b) => a.days - b.days)
  });
});

app.get('/api/applications', requireAuth, async (req, res) => {
  const auth = getAuth(res);
  if (supabaseAdmin) {
    try {
      const q    = String(req.query.q    ?? '');
      const type = String(req.query.type ?? 'all');
      const data = await getApplications(supabaseAdmin, auth.tenantId, q, type);
      return res.json(data);
    } catch (err) {
      return res.status(500).json({ error: (err as Error).message });
    }
  }
  const q    = String(req.query.q    ?? '').toLowerCase();
  const type = String(req.query.type ?? 'all');
  const filtered = applications.filter((appItem) => {
    const matchesQuery = !q || [appItem.name, appItem.vendor, appItem.category, appItem.owner ?? '', appItem.tags.join(' ')].join(' ').toLowerCase().includes(q);
    const matchesType  = type === 'all' || appItem.type === type;
    return matchesQuery && matchesType;
  });
  res.json(filtered);
});

app.get('/api/applications/:id', requireAuth, async (req, res) => {
  const auth = getAuth(res);
  if (supabaseAdmin) {
    try {
      const data = await getApplicationById(supabaseAdmin, auth.tenantId, String(req.params.id));
      if (!data) return res.status(404).json({ error: 'Application not found' });
      return res.json(data);
    } catch (err) {
      return res.status(500).json({ error: (err as Error).message });
    }
  }
  const appItem = applications.find((candidate) => candidate.id === String(req.params.id));
  if (!appItem) return res.status(404).json({ error: 'Application not found' });
  res.json({
    ...appItem,
    licences: licences.filter((licence) => licence.applicationId === appItem.id),
    usage: usageEvents.filter((usage) => usage.appId === appItem.id),
    compliance: complianceResults.filter((finding) => finding.applicationName === appItem.name)
  });
});

app.get('/api/devices', requireAuth, async (_req, res) => {
  const auth = getAuth(res);
  if (supabaseAdmin) {
    try {
      const data = await getDevices(supabaseAdmin, auth.tenantId);
      return res.json(data);
    } catch (err) {
      return res.status(500).json({ error: (err as Error).message });
    }
  }
  res.json(devices);
});

app.get('/api/usage', requireAuth, async (_req, res) => {
  const auth = getAuth(res);
  if (supabaseAdmin) {
    try {
      const data = await getUsageData(supabaseAdmin, auth.tenantId);
      return res.json(data);
    } catch (err) {
      return res.status(500).json({ error: (err as Error).message });
    }
  }
  const underuse = applications
    .filter((appItem) => appItem.activeUsageMinutes / Math.max(appItem.totalUsageMinutes, 1) < 0.45)
    .map((appItem) => ({
      app: appItem.name,
      activeUsers: appItem.activeUsers,
      activeRatio: Math.round((appItem.activeUsageMinutes / Math.max(appItem.totalUsageMinutes, 1)) * 100),
      monthlyCost: appItem.monthlyCost
    }));
  res.json({
    events: usageEvents,
    underuse,
    zombieApps: applications.filter((appItem) => appItem.activeUsers === 0 || appItem.activeUsageMinutes < 2000),
    heavyUsers: usageEvents.filter((event) => event.activeMinutes > 120),
    dormantApps: applications.filter((appItem) => appItem.activeUsers < 5 || appItem.lastDetectedDate < '2026-05-19'),
    renewalRecommendations: savingsRecommendations.filter((item) => item.type === 'renewal prep' || item.type === 'downgrade')
  });
});

app.get('/api/saas', requireAuth, async (_req, res) => {
  const auth = getAuth(res);
  if (supabaseAdmin) {
    try {
      const data = await getSaasData(supabaseAdmin, auth.tenantId);
      return res.json(data);
    } catch (err) {
      return res.status(500).json({ error: (err as Error).message });
    }
  }
  res.json({
    detections: saasDetections,
    known: saasDetections.filter((item) => item.approved),
    unknown: saasDetections.filter((item) => !item.approved),
    domains: saasDetections.map((item) => ({ domain: item.domain, application: item.saasAppName, approved: item.approved }))
  });
});

app.get('/api/licences', requireAuth, async (_req, res) => {
  const auth = getAuth(res);
  if (supabaseAdmin) {
    try {
      const data = await getLicences(supabaseAdmin, auth.tenantId);
      return res.json(data);
    } catch (err) {
      return res.status(500).json({ error: (err as Error).message });
    }
  }
  res.json(licences);
});

app.get('/api/costs', requireAuth, async (_req, res) => {
  const auth = getAuth(res);
  if (supabaseAdmin) {
    try {
      const data = await getCostsData(supabaseAdmin, auth.tenantId);
      return res.json(data);
    } catch (err) {
      return res.status(500).json({ error: (err as Error).message });
    }
  }
  res.json({
    records: costRecords,
    recommendations: savingsRecommendations,
    byVendor: aggregateCost('vendor'),
    byApp: aggregateCost('applicationName'),
    byUser: aggregateCost('userName'),
    byDevice: aggregateCost('deviceName'),
    byDepartment: aggregateCost('department')
  });
});

app.get('/api/compliance', requireAuth, async (_req, res) => {
  const auth = getAuth(res);
  if (supabaseAdmin) {
    try {
      const data = await getComplianceData(supabaseAdmin, auth.tenantId);
      return res.json(data);
    } catch (err) {
      return res.status(500).json({ error: (err as Error).message });
    }
  }
  res.json({
    results: complianceResults,
    rules: [
      { id: 'risk-001', name: 'EOL software severity', condition: 'eol_date < today', weight: 35, enabled: true },
      { id: 'risk-002', name: 'Unapproved SaaS', condition: 'approved = false and detected_users > 0', weight: 30, enabled: true },
      { id: 'risk-003', name: 'Missing owner', condition: 'owner is null and monthly_cost > 1000', weight: 20, enabled: true }
    ],
    auditReady: complianceResults.filter((finding) => finding.owner && finding.evidence).length,
    evidenceExportRows: complianceResults.length
  });
});

app.get('/api/hardware', requireAuth, async (_req, res) => {
  const auth = getAuth(res);
  if (supabaseAdmin) {
    try {
      const data = await getDevices(supabaseAdmin, auth.tenantId);
      return res.json(data);
    } catch (err) {
      return res.status(500).json({ error: (err as Error).message });
    }
  }
  res.json(devices);
});

app.get('/api/integrations', requireAuth, async (_req, res) => {
  const auth = getAuth(res);
  if (supabaseAdmin) {
    try {
      const data = await getIntegrations(supabaseAdmin, auth.tenantId);
      return res.json(data);
    } catch (err) {
      return res.status(500).json({ error: (err as Error).message });
    }
  }
  res.json(integrations);
});

app.post('/api/integrations/:id/sync', requireAuth, requireRole('tenant_admin', 'asset_manager'), async (req, res) => {
  const auth = getAuth(res);
  if (supabaseAdmin) {
    try {
      const updated = await syncIntegration(supabaseAdmin, auth.tenantId, String(req.params.id));
      if (!updated) return res.status(404).json({ error: 'Integration not found' });
      return res.json(updated);
    } catch (err) {
      return res.status(500).json({ error: (err as Error).message });
    }
  }
  const integration = integrations.find((candidate) => candidate.id === String(req.params.id));
  if (!integration) return res.status(404).json({ error: 'Integration not found' });
  const log = {
    at: new Date().toISOString(),
    status: 'success' as const,
    message: `Manual sync queued for ${integration.name}. Demo sync completed with ${Math.floor(Math.random() * 25) + 5} records.`
  };
  integration.lastSync = log.at;
  integration.connectionStatus = 'connected';
  integration.syncLogs.unshift(log);
  res.json(integration);
});

app.get('/api/export-workflows', requireAuth, async (_req, res) => {
  const auth = getAuth(res);
  if (supabaseAdmin) {
    try {
      const data = await getExportWorkflows(supabaseAdmin, auth.tenantId);
      return res.json(data);
    } catch (err) {
      return res.status(500).json({ error: (err as Error).message });
    }
  }
  res.json(exportWorkflows);
});

app.post('/api/export-workflows', requireAuth, requireRole('tenant_admin', 'asset_manager'), async (req, res) => {
  const auth = getAuth(res);
  if (supabaseAdmin) {
    try {
      const data = await createExportWorkflow(supabaseAdmin, auth.tenantId, req.body as Record<string, unknown>);
      return res.status(201).json(data);
    } catch (err) {
      return res.status(500).json({ error: (err as Error).message });
    }
  }
  const workflow = {
    id: `flow-${nanoid(6)}`,
    name: req.body.name ?? 'Untitled export workflow',
    sourceDataset: req.body.sourceDataset ?? 'applications',
    filters: req.body.filters ?? 'approved = true',
    mappedFields: req.body.mappedFields ?? [{ source: 'name', destination: 'name' }],
    destination: req.body.destination ?? 'CSV',
    schedule: req.body.schedule ?? 'manual',
    enabled: true,
    executionLogs: []
  };
  exportWorkflows.unshift(workflow);
  res.status(201).json(workflow);
});

app.post('/api/export-workflows/:id/run', requireAuth, requireRole('tenant_admin', 'asset_manager'), async (req, res) => {
  const auth = getAuth(res);
  if (supabaseAdmin) {
    try {
      const data = await runExportWorkflow(supabaseAdmin, auth.tenantId, String(req.params.id));
      if (!data) return res.status(404).json({ error: 'Workflow not found' });
      return res.json(data);
    } catch (err) {
      return res.status(500).json({ error: (err as Error).message });
    }
  }
  const workflow = exportWorkflows.find((candidate) => candidate.id === String(req.params.id));
  if (!workflow) return res.status(404).json({ error: 'Workflow not found' });
  workflow.executionLogs.unshift({
    at: new Date().toISOString(),
    status: 'success',
    records: Math.floor(Math.random() * 80) + 8,
    message: `Manual ${workflow.destination} export completed.`
  });
  res.json(workflow);
});

app.get('/api/rules', requireAuth, async (_req, res) => {
  const auth = getAuth(res);
  if (supabaseAdmin) {
    try {
      const data = await getRules(supabaseAdmin, auth.tenantId);
      return res.json(data);
    } catch (err) {
      return res.status(500).json({ error: (err as Error).message });
    }
  }
  res.json(customInventoryRules);
});

app.post('/api/rules/test', requireAuth, (req, res) => {
  const schema = z.object({ matchValue: z.string().min(1), sample: z.string().min(1) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const matched = parsed.data.sample.toLowerCase().includes(parsed.data.matchValue.toLowerCase());
  res.json({
    matched,
    confidence: matched ? 91 : 22,
    normalizedApplication: matched
      ? customInventoryRules.find((rule) => rule.matchValue.toLowerCase() === parsed.data.matchValue.toLowerCase())?.normalizedApplication ?? 'Review required'
      : 'No match',
    evidence: matched ? `Sample contained "${parsed.data.matchValue}".` : 'No configured token was found in the sample.'
  });
});

app.get('/api/normalization', requireAuth, async (_req, res) => {
  const auth = getAuth(res);
  if (supabaseAdmin) {
    try {
      const data = await getNormalizationData(supabaseAdmin, auth.tenantId);
      return res.json(data);
    } catch (err) {
      return res.status(500).json({ error: (err as Error).message });
    }
  }
  res.json({
    rawInventory: [
      { id: 'raw-001', rawName: 'MS Office 365 Apps', source: 'Intune', firstSeen: '2026-05-18', lastSeen: '2026-05-26' },
      { id: 'raw-002', rawName: 'AdobeCC All', source: 'Jamf', firstSeen: '2026-05-15', lastSeen: '2026-05-26' },
      { id: 'raw-003', rawName: 'sql std 13.x', source: 'SCCM', firstSeen: '2026-05-10', lastSeen: '2026-05-18' }
    ],
    reviewQueue: normalizationReviewQueue,
    rules: customInventoryRules,
    normalizedApplications: applications
  });
});

app.get('/api/reports', requireAuth, async (_req, res) => {
  const auth = getAuth(res);
  if (supabaseAdmin) {
    try {
      const data = await getReports(supabaseAdmin, auth.tenantId);
      return res.json(data);
    } catch (err) {
      return res.status(500).json({ error: (err as Error).message });
    }
  }
  res.json(reports);
});

app.get('/api/cloudability', requireAuth, requireRole('tenant_admin', 'finance_user'), (_req, res) =>
  res.json(cloudabilityPayload())
);

app.post('/api/cloudability/connections/:id/test', requireAuth, requireRole('tenant_admin', 'finance_user'), (req, res) => {
  const connection = cloudConnections.find((candidate) => candidate.id === String(req.params.id));
  if (!connection) return res.status(404).json({ error: 'Cloud connection not found' });
  res.json({
    ...connection,
    status: connection.enabled ? 'Success' : 'Configuration required',
    message: connection.enabled
      ? `${connection.provider} connector credentials validated in demo mode.`
      : `${connection.provider} connector is disabled; enable it before syncing.`
  });
});

app.post('/api/cloudability/connections/:id/sync', requireAuth, requireRole('tenant_admin', 'finance_user'), (req, res) => {
  const connection = cloudConnections.find((candidate) => candidate.id === String(req.params.id));
  if (!connection) return res.status(404).json({ error: 'Cloud connection not found' });
  connection.lastSync = new Date().toISOString();
  connection.status   = 'Success';
  res.json({ ...connection, message: `Demo ${connection.provider} cost sync completed.` });
});

app.post('/api/reports/run', requireAuth, (req, res) => {
  const report = reports.find((candidate) => candidate.id === req.body.reportId) ?? reports[0];
  res.json({
    id: `run-${nanoid(6)}`,
    report,
    ranAt: new Date().toISOString(),
    rows: sampleRowsForDataset(report.dataset),
    exportUrl: `/api/reports/${report.id}/export.csv`
  });
});

app.post('/api/imports/csv', requireAuth, requireRole('tenant_admin', 'asset_manager'), (req, res) => {
  res.json({
    importId: `imp-${nanoid(6)}`,
    dataset: req.query.dataset ?? 'raw_inventory_events',
    accepted: true,
    rowsReceived: Array.isArray(req.body.rows) ? req.body.rows.length : 0,
    message: 'Demo import accepted.'
  });
});

// ─── Agent API keys (tenant-scoped) ───────────────────────────────────────

const createAgentKeySchema = z.object({ name: z.string().trim().min(1).max(120) });

app.get('/api/admin/agent-keys', requireAuth, requireRole('tenant_admin'), async (_req, res) => {
  const auth   = getAuth(res);
  const client = requireSupabase(res);
  if (!client) return;

  const { data, error } = await client
    .from('agent_api_keys')
    .select('id, tenant_id, name, key_prefix, created_at, last_used_at, revoked_at')
    .eq('tenant_id', auth.tenantId)
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json((data ?? []).map(mapAgentKeyRow));
});

app.post('/api/admin/agent-keys', requireAuth, requireRole('tenant_admin'), async (req, res) => {
  const auth   = getAuth(res);
  const client = requireSupabase(res);
  if (!client) return;

  const parsed = createAgentKeySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const apiKey     = generateAgentApiKey();
  const tenantError = await ensureTenantExists(client, auth.tenantId);
  if (tenantError) return res.status(500).json({ error: tenantError.message });

  const { data, error } = await client
    .from('agent_api_keys')
    .insert({
      tenant_id:  auth.tenantId,
      name:       parsed.data.name,
      key_prefix: getKeyPrefix(apiKey),
      key_hash:   hashAgentApiKey(apiKey),
      created_by: auth.userId
    })
    .select('id, tenant_id, name, key_prefix, created_at, last_used_at, revoked_at')
    .single();

  if (error) return res.status(500).json({ error: error.message });

  await writeAuditLog(client, {
    tenantId: auth.tenantId,
    actorId: auth.userId,
    action: 'agent_key_created',
    entityType: 'agent_api_key',
    entityId: (data as Record<string, unknown>).id as string,
    afterState: { name: parsed.data.name },
    ipAddress: String(req.ip ?? '')
  });

  res.status(201).json({
    ...mapAgentKeyRow(data as Record<string, unknown>),
    apiKey,
    installCommand: buildAgentInstallCommand(apiKey)
  });
});

app.delete('/api/admin/agent-keys/:id', requireAuth, requireRole('tenant_admin'), async (req, res) => {
  const auth   = getAuth(res);
  const client = requireSupabase(res);
  if (!client) return;

  const { data, error } = await client
    .from('agent_api_keys')
    .update({ revoked_at: new Date().toISOString() })
    .eq('tenant_id', auth.tenantId)
    .eq('id', String(req.params.id))
    .is('revoked_at', null)
    .select('id, tenant_id, name, key_prefix, created_at, last_used_at, revoked_at')
    .maybeSingle();

  if (error) return res.status(500).json({ error: error.message });
  if (!data)  return res.status(404).json({ error: 'Agent key not found or already revoked.' });

  await writeAuditLog(client, {
    tenantId: auth.tenantId,
    actorId: auth.userId,
    action: 'agent_key_revoked',
    entityType: 'agent_api_key',
    entityId: String(req.params.id),
    ipAddress: String(req.ip ?? '')
  });

  res.json(mapAgentKeyRow(data as Record<string, unknown>));
});

// GET /api/admin/agent-uploads — recent agent upload log for the current tenant
app.get('/api/admin/agent-uploads', requireAuth, requireRole('tenant_admin', 'asset_manager'), async (_req, res) => {
  const auth = getAuth(res);

  if (!supabaseAdmin) {
    const uploads = agentUploads
      .filter((u) => u.tenantId === auth.tenantId)
      .slice(0, 100)
      .map(({ tenantId: _tid, ...rest }) => rest);
    return res.json(uploads);
  }

  const { data, error } = await supabaseAdmin
    .from('raw_inventory_events')
    .select('id, raw_name, payload, detected_at')
    .eq('tenant_id', auth.tenantId)
    .eq('source', 'agent')
    .order('detected_at', { ascending: false })
    .limit(100);

  if (error) return res.status(500).json({ error: error.message });

  const uploads = (data ?? []).map((row: Record<string, unknown>) => {
    const p = (row.payload as Record<string, unknown>) ?? {};
    return {
      id:                        String(p.uploadId ?? row.id),
      receivedAt:                String(row.detected_at),
      deviceId:                  String(p.deviceId ?? ''),
      hostname:                  String(p.hostname ?? row.raw_name ?? ''),
      installedApplicationCount: Number(p.installedApplicationCount ?? 0),
      runningProcessCount:       Number(p.runningProcessCount ?? 0)
    };
  });

  res.json(uploads);
});

// ─── Agent upload (API-key auth, NOT session auth) ─────────────────────────

const agentPayloadSchema = z
  .object({
    AgentVersion:          z.string().optional(),
    CollectedAtUtc:        z.string().optional(),
    DeviceId:              z.string().optional(),
    DeviceFingerprint:     z.string().optional(),
    System:                z.object({ DeviceName: z.string().optional(), OsVersion: z.string().optional(), SerialNumber: z.string().optional() }).passthrough().optional(),
    InstalledApplications: z.array(z.unknown()).optional(),
    WindowsUpdates:        z.array(z.unknown()).optional(),
    BrowserExtensions:     z.array(z.unknown()).optional(),
    RunningProcesses:      z.array(z.unknown()).optional(),
    Hardware:              z.unknown().optional(),
    Licensing:             z.unknown().optional(),
    Compliance:            z.unknown().optional()
  })
  .passthrough();

const agentUploads: Array<{
  id: string; tenantId: string; receivedAt: string; deviceId: string; hostname: string;
  installedApplicationCount: number; runningProcessCount: number;
}> = [];

// In-memory demo users per tenant (mutated by invite/patch in demo mode)
type DemoUser = {
  id: string; fullName: string; email: string; role: string;
  status: string; lastLoginAt: string | null; invitedAt: string | null;
  createdAt: string; departmentId: string | null;
};
const demoTenantUsers: Record<string, DemoUser[]> = {
  '00000000-0000-0000-0000-000000000001': [
    { id: '30000000-0000-0000-0000-000000000001', fullName: 'Ava Collins',    email: 'ava.collins@demo.bennnsam.local', role: 'tenant_admin',  status: 'active',   lastLoginAt: '2026-05-30T10:00:00Z', invitedAt: null, createdAt: '2026-01-01T00:00:00Z', departmentId: null },
    { id: '30000000-0000-0000-0000-000000000002', fullName: 'Marcus Tan',     email: 'marcus.tan@demo.bennnsam.local',  role: 'asset_manager', status: 'active',   lastLoginAt: '2026-05-29T08:30:00Z', invitedAt: null, createdAt: '2026-01-01T00:00:00Z', departmentId: null },
    { id: '30000000-0000-0000-0000-000000000003', fullName: 'Priya Singh',    email: 'priya.singh@demo.bennnsam.local', role: 'finance_user',  status: 'active',   lastLoginAt: '2026-05-28T14:15:00Z', invitedAt: null, createdAt: '2026-01-01T00:00:00Z', departmentId: null },
  ],
  '00000000-0000-0000-0000-000000000002': [
    { id: '31000000-0000-0000-0000-000000000001', fullName: 'Sarah Mitchell', email: 'admin@acme.mining',               role: 'tenant_admin',  status: 'active',   lastLoginAt: '2026-05-30T09:00:00Z', invitedAt: null, createdAt: '2026-01-15T00:00:00Z', departmentId: null },
    { id: '31000000-0000-0000-0000-000000000002', fullName: 'Tom Nguyen',     email: 'assets@acme.mining',              role: 'asset_manager', status: 'active',   lastLoginAt: '2026-05-27T11:00:00Z', invitedAt: null, createdAt: '2026-01-15T00:00:00Z', departmentId: null },
    { id: '31000000-0000-0000-0000-000000000003', fullName: 'Lisa Kaur',      email: 'finance@acme.mining',             role: 'finance_user',  status: 'active',   lastLoginAt: '2026-05-25T16:00:00Z', invitedAt: null, createdAt: '2026-01-15T00:00:00Z', departmentId: null },
    { id: '31000000-0000-0000-0000-000000000004', fullName: 'Jack Chen',      email: 'viewer@acme.mining',              role: 'read_only',     status: 'active',   lastLoginAt: null,                   invitedAt: '2026-04-01T00:00:00Z', createdAt: '2026-04-01T00:00:00Z', departmentId: null },
  ],
  '00000000-0000-0000-0000-000000000003': [
    { id: '32000000-0000-0000-0000-000000000001', fullName: 'Dr. Anna Brennan', email: 'admin@ecu.campus',              role: 'tenant_admin',  status: 'active',   lastLoginAt: '2026-05-29T09:00:00Z', invitedAt: null, createdAt: '2026-02-01T00:00:00Z', departmentId: null },
    { id: '32000000-0000-0000-0000-000000000002', fullName: 'James Okafor',   email: 'assets@ecu.campus',               role: 'asset_manager', status: 'active',   lastLoginAt: '2026-05-26T13:00:00Z', invitedAt: null, createdAt: '2026-02-01T00:00:00Z', departmentId: null },
  ],
  '00000000-0000-0000-0000-000000000004': [
    { id: '33000000-0000-0000-0000-000000000001', fullName: 'Bruce Walters',  email: 'admin@donkey.billabong',          role: 'tenant_admin',  status: 'active',   lastLoginAt: '2026-05-28T08:00:00Z', invitedAt: null, createdAt: '2026-03-01T00:00:00Z', departmentId: null },
    { id: '33000000-0000-0000-0000-000000000002', fullName: 'Mei Lin',        email: 'viewer@donkey.billabong',         role: 'read_only',     status: 'disabled', lastLoginAt: null,                   invitedAt: '2026-03-15T00:00:00Z', createdAt: '2026-03-15T00:00:00Z', departmentId: null },
  ],
};

app.post('/api/agent/upload',              requireAgentApiKey, handleAgentUpload);
app.post('/v1/agents/:deviceId/inventory', requireAgentApiKey, handleAgentUpload);

async function requireAgentApiKey(req: Request, res: Response, next: NextFunction) {
  const suppliedKey = getSuppliedAgentApiKey(req);

  if (!supabaseAdmin) {
    if (!suppliedKey) return res.status(401).json({ error: 'Invalid or missing agent API key.' });
    res.locals.agentTenantId = defaultTenantId;
    res.locals.agentKeyId    = 'demo';
    return next();
  }

  const keyRecord = suppliedKey ? await findAgentKey(suppliedKey) : null;
  if (!keyRecord) return res.status(401).json({ error: 'Invalid or missing agent API key.' });

  res.locals.agentTenantId = keyRecord.tenantId;
  res.locals.agentKeyId    = keyRecord.id;
  return next();
}

function handleAgentUpload(req: Request, res: Response) {
  const parsed = agentPayloadSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const payload      = parsed.data;
  const routeDeviceId   = Array.isArray(req.params.deviceId) ? req.params.deviceId[0] : req.params.deviceId;
  const payloadDeviceId = payload.DeviceId;
  if (routeDeviceId && payloadDeviceId && routeDeviceId !== payloadDeviceId) {
    return res.status(400).json({ error: 'Route device id does not match payload DeviceId.' });
  }

  const upload = {
    id: `agent-${nanoid(6)}`,
    tenantId: res.locals.agentTenantId as string,
    receivedAt: new Date().toISOString(),
    deviceId: payloadDeviceId ?? routeDeviceId ?? 'unknown-device',
    hostname: payload.System?.DeviceName ?? (req.body.hostname as string | undefined) ?? 'unknown-host',
    installedApplicationCount: payload.InstalledApplications?.length ?? 0,
    runningProcessCount: payload.RunningProcesses?.length ?? 0
  };
  agentUploads.unshift(upload);

  recordAgentInventoryUpload({
    keyId: res.locals.agentKeyId as string,
    tenantId: res.locals.agentTenantId as string,
    upload,
    payload
  }).catch((error: Error) => {
    console.error(`Failed to persist agent upload ${upload.id}: ${error.message}`);
  });

  res.json({
    uploadId: upload.id,
    receivedAt: upload.receivedAt,
    accepted: true,
    deviceId: upload.deviceId,
    hostname: upload.hostname,
    installedApplicationCount: upload.installedApplicationCount,
    runningProcessCount: upload.runningProcessCount,
    message: 'Agent inventory payload accepted.'
  });
}

app.post('/api/assistant/query', requireAuth, (req, res) => {
  const prompt = String(req.body.prompt ?? '');
  if (!prompt.trim()) return res.status(400).json({ error: 'Prompt is required' });
  res.json(runAssistantQuery(prompt));
});

// ─── SPA fallback ──────────────────────────────────────────────────────────

if (existsSync(webIndexPath)) {
  app.use(express.static(webDistPath));
  app.use((req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/v1')) return next();
    res.sendFile(webIndexPath);
  });
} else {
  app.get('/', (_req, res) => {
    res.json({ ok: true, name: 'BennnSam API', message: 'Build the web app to serve the dashboard.' });
  });
}

app.listen(port, () => {
  console.log(`BennnSam API listening on http://localhost:${port}`);
});

// ─── Helpers ───────────────────────────────────────────────────────────────

function requireSupabase(res: Response): NonNullable<typeof supabaseAdmin> | null {
  if (supabaseAdmin) return supabaseAdmin;
  res.status(503).json({
    error: 'Live Supabase database is not configured.',
    message: 'Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.'
  });
  return null;
}

function aggregateCost(field: keyof (typeof costRecords)[number]) {
  return Object.values(
    costRecords.reduce<Record<string, { name: string; monthlyCost: number }>>((acc, record) => {
      const name = String(record[field]);
      acc[name] ??= { name, monthlyCost: 0 };
      acc[name].monthlyCost += record.monthlyCost;
      return acc;
    }, {})
  ).sort((a, b) => b.monthlyCost - a.monthlyCost);
}

function sampleRowsForDataset(dataset: string) {
  const lookup: Record<string, unknown[]> = {
    applications,
    saas_detections: saasDetections,
    licence_entitlements: licences,
    savings_recommendations: savingsRecommendations,
    licences,
    usage_events: usageEvents,
    devices,
    cost_records: costRecords
  };
  return lookup[dataset]?.slice(0, 10) ?? applications.slice(0, 10);
}

function generateAgentApiKey() { return `bsam_agent_${randomBytes(32).toString('base64url')}`; }
function hashAgentApiKey(k: string) { return createHash('sha256').update(k, 'utf8').digest('hex'); }
function getKeyPrefix(k: string) { return `${k.slice(0, 18)}...`; }
function buildAgentInstallCommand(k: string) {
  return `.\\_inventory-agent\\scripts\\install-user.ps1 -SourceExe .\\_inventory-agent\\publish\\win-x64\\agent.exe -Config .\\_inventory-agent\\agent-config.json -ApiKey "${k}" -RunInitialScan`;
}
function mapAgentKeyRow(row: Record<string, unknown>) {
  return {
    id: String(row.id), tenantId: String(row.tenant_id), name: String(row.name),
    keyPrefix: String(row.key_prefix), createdAt: String(row.created_at),
    lastUsedAt: row.last_used_at ? String(row.last_used_at) : null,
    revokedAt: row.revoked_at ? String(row.revoked_at) : null,
    status: row.revoked_at ? 'revoked' : 'active'
  };
}

async function ensureTenantExists(client: NonNullable<typeof supabaseAdmin>, tenantId: string) {
  const { data, error } = await client.from('tenants').select('id').eq('id', tenantId).maybeSingle();
  if (error) return error;
  if (data) return null;
  const { error: insertError } = await client.from('tenants').insert({ id: tenantId, name: defaultTenantName, slug: defaultTenantSlug });
  return insertError;
}

async function findAgentKey(apiKey: string): Promise<{ id: string; tenantId: string } | null> {
  if (!supabaseAdmin) return null;
  const hash = hashAgentApiKey(apiKey);
  const { data, error } = await supabaseAdmin
    .from('agent_api_keys').select('id, tenant_id')
    .eq('key_hash', hash).is('revoked_at', null).maybeSingle();
  if (error) { console.error(`Agent key lookup failed: ${error.message}`); return null; }
  if (data) return { id: data.id as string, tenantId: data.tenant_id as string };
  return null;
}

async function recordAgentInventoryUpload({
  keyId, tenantId, upload, payload
}: {
  keyId: string; tenantId: string;
  upload: { id: string; receivedAt: string; deviceId: string; hostname: string; installedApplicationCount: number; runningProcessCount: number };
  payload: z.infer<typeof agentPayloadSchema>;
}) {
  if (!supabaseAdmin) return;
  await supabaseAdmin.from('agent_api_keys').update({ last_used_at: upload.receivedAt }).eq('id', keyId);
  await supabaseAdmin.from('raw_inventory_events').insert({
    tenant_id: tenantId, source: 'agent', raw_name: upload.hostname,
    payload: { uploadId: upload.id, deviceId: upload.deviceId, hostname: upload.hostname,
      installedApplicationCount: upload.installedApplicationCount,
      runningProcessCount: upload.runningProcessCount, inventory: payload },
    detected_at: payload.CollectedAtUtc ?? upload.receivedAt
  });
}

function getSuppliedAgentApiKey(req: Request): string | null {
  const auth = req.header('authorization') ?? '';
  const bearerMatch = auth.match(/^Bearer\s+(.+)$/i);
  return bearerMatch?.[1]?.trim() || req.header('x-api-key')?.trim() || null;
}

async function writeAuditLog(
  client: NonNullable<typeof supabaseAdmin>,
  opts: {
    tenantId?: string; actorId?: string; action: string; entityType: string;
    entityId?: string; beforeState?: object; afterState?: object;
    ipAddress?: string; userAgent?: string;
  }
) {
  try {
    await client.from('audit_log').insert({
      tenant_id:    opts.tenantId   ?? defaultTenantId,
      actor_id:     opts.actorId    ?? null,
      action:       opts.action,
      entity_type:  opts.entityType,
      entity_id:    opts.entityId   ?? null,
      before_state: opts.beforeState ?? {},
      after_state:  opts.afterState  ?? {},
      ip_address:   opts.ipAddress  ?? null,
      user_agent:   opts.userAgent  ?? null,
      changes:      opts.afterState  ?? {}
    });
  } catch (err) {
    console.error('Audit log write failed:', (err as Error).message);
  }
}

function resolveInviteRedirectUrl(): string {
  if (process.env.INVITE_REDIRECT_URL) return process.env.INVITE_REDIRECT_URL;
  // Derive from VITE_API_URL by stripping the /api suffix, otherwise fall back to the web dev port.
  const apiUrl = process.env.VITE_API_URL ?? '';
  return apiUrl ? apiUrl.replace(/\/api$/, '') : 'http://localhost:5172';
}

async function resolveTenantName(tenantId: string): Promise<string> {
  if (!supabaseAdmin) return getDemoTenantName(tenantId);
  const { data } = await supabaseAdmin.from('tenants').select('name').eq('id', tenantId).maybeSingle();
  return (data?.name as string | undefined) ?? 'Your Organisation';
}

function mapUserProfileRow(row: Record<string, unknown>) {
  return {
    id:          String(row.id),
    fullName:    String(row.full_name   ?? ''),
    email:       String(row.email       ?? ''),
    role:        String(row.role        ?? 'read_only'),
    status:      String(row.status      ?? 'active'),
    lastLoginAt: row.last_login_at  ? String(row.last_login_at)  : null,
    invitedAt:   row.invited_at     ? String(row.invited_at)     : null,
    createdAt:   String(row.created_at ?? new Date().toISOString()),
    departmentId: row.department_id ? String(row.department_id)  : null
  };
}

function getDemoTenantName(tenantId: string): string {
  const map: Record<string, string> = {
    '00000000-0000-0000-0000-000000000001': 'Northstar Manufacturing',
    '00000000-0000-0000-0000-000000000002': 'Acme Mining',
    '00000000-0000-0000-0000-000000000003': 'ECU City Campus',
    '00000000-0000-0000-0000-000000000004': 'Donkey Billabong'
  };
  return map[tenantId] ?? 'Unknown Organisation';
}

const demoTenantLogos = new Map<string, string | null>();

function getDemoTenantLogoUrl(tenantId: string): string | null {
  return demoTenantLogos.get(tenantId) ?? null;
}
