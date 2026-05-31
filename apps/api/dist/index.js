import { existsSync } from 'node:fs';
import { createHash, randomBytes } from 'node:crypto';
import { dirname, join, resolve } from 'node:path';
import { createClient } from '@supabase/supabase-js';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import morgan from 'morgan';
import { nanoid } from 'nanoid';
import { z } from 'zod';
import { applications, auditLog, complianceResults, costRecords, customInventoryRules, departments, devices, exportWorkflows, integrations, licences, normalizationReviewQueue, reports, saasDetections, savingsRecommendations, usageEvents, users } from './demoData.js';
import { runAssistantQuery } from './reportEngine.js';
import { cloudConnections, cloudabilityPayload } from './cloudabilityData.js';
import { getBootstrapData, getApplications, getApplicationById, getDevices, getUsageData, getSaasData, getLicences, getCostsData, getComplianceData, getIntegrations, syncIntegration, getExportWorkflows, createExportWorkflow, runExportWorkflow, getRules, getNormalizationData, getReports, getOverviewData, daysUntil, } from './supabaseData.js';
loadEnvironment();
const app = express();
const port = Number(process.env.PORT ?? process.env.API_PORT ?? 4100);
const defaultTenantId = process.env.BENNSAM_DEFAULT_TENANT_ID ?? '00000000-0000-0000-0000-000000000001';
const defaultTenantName = process.env.BENNSAM_DEFAULT_TENANT_NAME ?? 'Northstar Manufacturing';
const defaultTenantSlug = process.env.BENNSAM_DEFAULT_TENANT_SLUG ?? 'northstar';
const supabaseAdmin = process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
        auth: { persistSession: false, autoRefreshToken: false }
    })
    : null;
// process.argv[1] is the path to this script — works in both CJS bundles and ESM
const currentDir = dirname(resolve(process.argv[1]));
const webDistPath = resolve(currentDir, '../../web/dist');
const webIndexPath = join(webDistPath, 'index.html');
function loadEnvironment() {
    const candidates = [
        resolve(process.cwd(), '.env'),
        resolve(process.cwd(), '..', '.env'),
        resolve(process.cwd(), '..', '..', '.env')
    ];
    for (const path of candidates) {
        if (existsSync(path))
            dotenv.config({ path });
    }
}
app.use(cors({
    origin: process.env.CORS_ORIGIN?.split(',') ?? ['http://localhost:5173'],
    credentials: true
}));
app.use(express.json({ limit: '3mb' }));
app.use(morgan('dev'));
const inDays = (date) => daysUntil(date);
app.get('/api/health', (_req, res) => {
    res.json({
        ok: true,
        name: 'BennnSam API',
        mode: supabaseAdmin ? 'supabase-live' : 'demo-memory',
        database: supabaseAdmin ? 'supabase' : 'memory'
    });
});
app.get('/api/bootstrap', async (req, res) => {
    if (supabaseAdmin) {
        try {
            const data = await getBootstrapData(supabaseAdmin, getTenantId(req));
            return res.json(data);
        }
        catch (err) {
            return res.status(500).json({ error: err.message });
        }
    }
    res.json({ departments, users, auditLog });
});
app.get('/api/overview', async (req, res) => {
    if (supabaseAdmin) {
        try {
            const data = await getOverviewData(supabaseAdmin, getTenantId(req));
            return res.json(data);
        }
        catch (err) {
            return res.status(500).json({ error: err.message });
        }
    }
    const totalMonthlySpend = applications.reduce((sum, appItem) => sum + appItem.monthlyCost, 0);
    const underusedLicences = licences.reduce((sum, licence) => {
        if (licence.complianceStatus !== 'over-licensed')
            return sum;
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
        spendByVendor: Object.values(applications.reduce((acc, appItem) => {
            acc[appItem.vendor] ??= { vendor: appItem.vendor, spend: 0 };
            acc[appItem.vendor].spend += appItem.monthlyCost;
            return acc;
        }, {})).sort((a, b) => b.spend - a.spend),
        usageByCategory: Object.values(applications.reduce((acc, appItem) => {
            acc[appItem.category] ??= { category: appItem.category, active: 0, total: 0 };
            acc[appItem.category].active += appItem.activeUsageMinutes;
            acc[appItem.category].total += appItem.totalUsageMinutes;
            return acc;
        }, {})),
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
app.get('/api/applications', async (req, res) => {
    if (supabaseAdmin) {
        try {
            const q = String(req.query.q ?? '');
            const type = String(req.query.type ?? 'all');
            const data = await getApplications(supabaseAdmin, getTenantId(req), q, type);
            return res.json(data);
        }
        catch (err) {
            return res.status(500).json({ error: err.message });
        }
    }
    const q = String(req.query.q ?? '').toLowerCase();
    const type = String(req.query.type ?? 'all');
    const filtered = applications.filter((appItem) => {
        const matchesQuery = !q ||
            [appItem.name, appItem.vendor, appItem.category, appItem.owner ?? '', appItem.tags.join(' ')]
                .join(' ')
                .toLowerCase()
                .includes(q);
        const matchesType = type === 'all' || appItem.type === type;
        return matchesQuery && matchesType;
    });
    res.json(filtered);
});
app.get('/api/applications/:id', async (req, res) => {
    if (supabaseAdmin) {
        try {
            const data = await getApplicationById(supabaseAdmin, getTenantId(req), req.params.id);
            if (!data)
                return res.status(404).json({ error: 'Application not found' });
            return res.json(data);
        }
        catch (err) {
            return res.status(500).json({ error: err.message });
        }
    }
    const appItem = applications.find((candidate) => candidate.id === req.params.id);
    if (!appItem)
        return res.status(404).json({ error: 'Application not found' });
    res.json({
        ...appItem,
        licences: licences.filter((licence) => licence.applicationId === appItem.id),
        usage: usageEvents.filter((usage) => usage.appId === appItem.id),
        compliance: complianceResults.filter((finding) => finding.applicationName === appItem.name)
    });
});
app.get('/api/devices', async (req, res) => {
    if (supabaseAdmin) {
        try {
            const data = await getDevices(supabaseAdmin, getTenantId(req));
            return res.json(data);
        }
        catch (err) {
            return res.status(500).json({ error: err.message });
        }
    }
    res.json(devices);
});
app.get('/api/usage', async (req, res) => {
    if (supabaseAdmin) {
        try {
            const data = await getUsageData(supabaseAdmin, getTenantId(req));
            return res.json(data);
        }
        catch (err) {
            return res.status(500).json({ error: err.message });
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
app.get('/api/saas', async (req, res) => {
    if (supabaseAdmin) {
        try {
            const data = await getSaasData(supabaseAdmin, getTenantId(req));
            return res.json(data);
        }
        catch (err) {
            return res.status(500).json({ error: err.message });
        }
    }
    res.json({
        detections: saasDetections,
        known: saasDetections.filter((item) => item.approved),
        unknown: saasDetections.filter((item) => !item.approved),
        domains: saasDetections.map((item) => ({ domain: item.domain, application: item.saasAppName, approved: item.approved }))
    });
});
app.get('/api/licences', async (req, res) => {
    if (supabaseAdmin) {
        try {
            const data = await getLicences(supabaseAdmin, getTenantId(req));
            return res.json(data);
        }
        catch (err) {
            return res.status(500).json({ error: err.message });
        }
    }
    res.json(licences);
});
app.get('/api/costs', async (req, res) => {
    if (supabaseAdmin) {
        try {
            const data = await getCostsData(supabaseAdmin, getTenantId(req));
            return res.json(data);
        }
        catch (err) {
            return res.status(500).json({ error: err.message });
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
app.get('/api/compliance', async (req, res) => {
    if (supabaseAdmin) {
        try {
            const data = await getComplianceData(supabaseAdmin, getTenantId(req));
            return res.json(data);
        }
        catch (err) {
            return res.status(500).json({ error: err.message });
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
app.get('/api/hardware', async (req, res) => {
    if (supabaseAdmin) {
        try {
            const data = await getDevices(supabaseAdmin, getTenantId(req));
            return res.json(data);
        }
        catch (err) {
            return res.status(500).json({ error: err.message });
        }
    }
    res.json(devices);
});
app.get('/api/integrations', async (req, res) => {
    if (supabaseAdmin) {
        try {
            const data = await getIntegrations(supabaseAdmin, getTenantId(req));
            return res.json(data);
        }
        catch (err) {
            return res.status(500).json({ error: err.message });
        }
    }
    res.json(integrations);
});
app.post('/api/integrations/:id/sync', async (req, res) => {
    if (supabaseAdmin) {
        try {
            const updated = await syncIntegration(supabaseAdmin, getTenantId(req), req.params.id);
            if (!updated)
                return res.status(404).json({ error: 'Integration not found' });
            return res.json(updated);
        }
        catch (err) {
            return res.status(500).json({ error: err.message });
        }
    }
    const integration = integrations.find((candidate) => candidate.id === req.params.id);
    if (!integration)
        return res.status(404).json({ error: 'Integration not found' });
    const log = {
        at: new Date().toISOString(),
        status: 'success',
        message: `Manual sync queued for ${integration.name}. Demo sync completed with ${Math.floor(Math.random() * 25) + 5} records.`
    };
    integration.lastSync = log.at;
    integration.connectionStatus = 'connected';
    integration.syncLogs.unshift(log);
    res.json(integration);
});
app.get('/api/export-workflows', async (req, res) => {
    if (supabaseAdmin) {
        try {
            const data = await getExportWorkflows(supabaseAdmin, getTenantId(req));
            return res.json(data);
        }
        catch (err) {
            return res.status(500).json({ error: err.message });
        }
    }
    res.json(exportWorkflows);
});
app.post('/api/export-workflows', async (req, res) => {
    if (supabaseAdmin) {
        try {
            const data = await createExportWorkflow(supabaseAdmin, getTenantId(req), req.body);
            return res.status(201).json(data);
        }
        catch (err) {
            return res.status(500).json({ error: err.message });
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
app.post('/api/export-workflows/:id/run', async (req, res) => {
    if (supabaseAdmin) {
        try {
            const data = await runExportWorkflow(supabaseAdmin, getTenantId(req), req.params.id);
            if (!data)
                return res.status(404).json({ error: 'Workflow not found' });
            return res.json(data);
        }
        catch (err) {
            return res.status(500).json({ error: err.message });
        }
    }
    const workflow = exportWorkflows.find((candidate) => candidate.id === req.params.id);
    if (!workflow)
        return res.status(404).json({ error: 'Workflow not found' });
    workflow.executionLogs.unshift({
        at: new Date().toISOString(),
        status: 'success',
        records: Math.floor(Math.random() * 80) + 8,
        message: `Manual ${workflow.destination} export completed.`
    });
    res.json(workflow);
});
app.get('/api/rules', async (req, res) => {
    if (supabaseAdmin) {
        try {
            const data = await getRules(supabaseAdmin, getTenantId(req));
            return res.json(data);
        }
        catch (err) {
            return res.status(500).json({ error: err.message });
        }
    }
    res.json(customInventoryRules);
});
app.post('/api/rules/test', (req, res) => {
    const schema = z.object({
        matchValue: z.string().min(1),
        sample: z.string().min(1)
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: parsed.error.flatten() });
    const matched = parsed.data.sample.toLowerCase().includes(parsed.data.matchValue.toLowerCase());
    res.json({
        matched,
        confidence: matched ? 91 : 22,
        normalizedApplication: matched
            ? customInventoryRules.find((rule) => rule.matchValue.toLowerCase() === parsed.data.matchValue.toLowerCase())
                ?.normalizedApplication ?? 'Review required'
            : 'No match',
        evidence: matched ? `Sample contained "${parsed.data.matchValue}".` : 'No configured token was found in the sample.'
    });
});
app.get('/api/normalization', async (req, res) => {
    if (supabaseAdmin) {
        try {
            const data = await getNormalizationData(supabaseAdmin, getTenantId(req));
            return res.json(data);
        }
        catch (err) {
            return res.status(500).json({ error: err.message });
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
app.get('/api/reports', async (req, res) => {
    if (supabaseAdmin) {
        try {
            const data = await getReports(supabaseAdmin, getTenantId(req));
            return res.json(data);
        }
        catch (err) {
            return res.status(500).json({ error: err.message });
        }
    }
    res.json(reports);
});
app.get('/api/cloudability', (_req, res) => res.json(cloudabilityPayload()));
app.post('/api/cloudability/connections/:id/test', (req, res) => {
    const connection = cloudConnections.find((candidate) => candidate.id === req.params.id);
    if (!connection)
        return res.status(404).json({ error: 'Cloud connection not found' });
    res.json({
        ...connection,
        status: connection.enabled ? 'Success' : 'Configuration required',
        message: connection.enabled
            ? `${connection.provider} connector credentials validated in demo mode.`
            : `${connection.provider} connector is disabled; enable it before syncing.`
    });
});
app.post('/api/cloudability/connections/:id/sync', (req, res) => {
    const connection = cloudConnections.find((candidate) => candidate.id === req.params.id);
    if (!connection)
        return res.status(404).json({ error: 'Cloud connection not found' });
    connection.lastSync = new Date().toISOString();
    connection.status = 'Success';
    res.json({ ...connection, message: `Demo ${connection.provider} cost sync completed.` });
});
app.post('/api/reports/run', (req, res) => {
    const report = reports.find((candidate) => candidate.id === req.body.reportId) ?? reports[0];
    res.json({
        id: `run-${nanoid(6)}`,
        report,
        ranAt: new Date().toISOString(),
        rows: sampleRowsForDataset(report.dataset),
        exportUrl: `/api/reports/${report.id}/export.csv`
    });
});
app.post('/api/imports/csv', (req, res) => {
    res.json({
        importId: `imp-${nanoid(6)}`,
        dataset: req.query.dataset ?? 'raw_inventory_events',
        accepted: true,
        rowsReceived: Array.isArray(req.body.rows) ? req.body.rows.length : 0,
        message: 'Demo import accepted. In production this route validates CSV headers and writes staging rows for review.'
    });
});
const createAgentKeySchema = z.object({
    name: z.string().trim().min(1).max(120),
    tenantId: z.string().uuid().optional()
});
app.get('/api/admin/agent-keys', async (req, res) => {
    const tenantId = getTenantId(req);
    const client = requireSupabase(res);
    if (!client)
        return;
    const { data, error } = await client
        .from('agent_api_keys')
        .select('id, tenant_id, name, key_prefix, created_at, last_used_at, revoked_at')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });
    if (error)
        return res.status(500).json({ error: error.message });
    res.json((data ?? []).map(mapAgentKeyRow));
});
app.post('/api/admin/agent-keys', async (req, res) => {
    const parsed = createAgentKeySchema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: parsed.error.flatten() });
    const tenantId = parsed.data.tenantId ?? getTenantId(req);
    const client = requireSupabase(res);
    if (!client)
        return;
    const apiKey = generateAgentApiKey();
    const tenantError = await ensureTenantExists(client, tenantId);
    if (tenantError)
        return res.status(500).json({ error: tenantError.message });
    const row = {
        tenant_id: tenantId,
        name: parsed.data.name,
        key_prefix: getKeyPrefix(apiKey),
        key_hash: hashAgentApiKey(apiKey)
    };
    const { data, error } = await client
        .from('agent_api_keys')
        .insert(row)
        .select('id, tenant_id, name, key_prefix, created_at, last_used_at, revoked_at')
        .single();
    if (error)
        return res.status(500).json({ error: error.message });
    res.status(201).json({
        ...mapAgentKeyRow(data),
        apiKey,
        installCommand: buildAgentInstallCommand(apiKey)
    });
});
app.delete('/api/admin/agent-keys/:id', async (req, res) => {
    const tenantId = getTenantId(req);
    const client = requireSupabase(res);
    if (!client)
        return;
    const { data, error } = await client
        .from('agent_api_keys')
        .update({ revoked_at: new Date().toISOString() })
        .eq('tenant_id', tenantId)
        .eq('id', req.params.id)
        .is('revoked_at', null)
        .select('id, tenant_id, name, key_prefix, created_at, last_used_at, revoked_at')
        .maybeSingle();
    if (error)
        return res.status(500).json({ error: error.message });
    if (!data)
        return res.status(404).json({ error: 'Agent key not found or already revoked.' });
    res.json(mapAgentKeyRow(data));
});
const agentPayloadSchema = z
    .object({
    AgentVersion: z.string().optional(),
    CollectedAtUtc: z.string().optional(),
    DeviceId: z.string().optional(),
    DeviceFingerprint: z.string().optional(),
    System: z
        .object({
        DeviceName: z.string().optional(),
        OsVersion: z.string().optional(),
        SerialNumber: z.string().optional()
    })
        .passthrough()
        .optional(),
    InstalledApplications: z.array(z.unknown()).optional(),
    WindowsUpdates: z.array(z.unknown()).optional(),
    BrowserExtensions: z.array(z.unknown()).optional(),
    RunningProcesses: z.array(z.unknown()).optional(),
    Hardware: z.unknown().optional(),
    Licensing: z.unknown().optional(),
    Compliance: z.unknown().optional()
})
    .passthrough();
const agentUploads = [];
app.post('/api/agent/upload', requireAgentApiKey, handleAgentUpload);
app.post('/v1/agents/:deviceId/inventory', requireAgentApiKey, handleAgentUpload);
async function requireAgentApiKey(req, res, next) {
    const suppliedKey = getSuppliedAgentApiKey(req);
    if (!supabaseAdmin) {
        // Demo mode: accept any non-empty key, use the default demo tenant.
        if (!suppliedKey)
            return res.status(401).json({ error: 'Invalid or missing agent API key.' });
        res.locals.agentTenantId = defaultTenantId;
        res.locals.agentKeyId = 'demo';
        return next();
    }
    const keyRecord = suppliedKey ? await findAgentKey(suppliedKey) : null;
    if (!keyRecord) {
        return res.status(401).json({ error: 'Invalid or missing agent API key.' });
    }
    res.locals.agentTenantId = keyRecord.tenantId;
    res.locals.agentKeyId = keyRecord.id;
    return next();
}
function handleAgentUpload(req, res) {
    const parsed = agentPayloadSchema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: parsed.error.flatten() });
    const payload = parsed.data;
    const routeDeviceId = Array.isArray(req.params.deviceId) ? req.params.deviceId[0] : req.params.deviceId;
    const payloadDeviceId = payload.DeviceId;
    if (routeDeviceId && payloadDeviceId && routeDeviceId !== payloadDeviceId) {
        return res.status(400).json({ error: 'Route device id does not match payload DeviceId.' });
    }
    const upload = {
        id: `agent-${nanoid(6)}`,
        receivedAt: new Date().toISOString(),
        deviceId: payloadDeviceId ?? routeDeviceId ?? 'unknown-device',
        hostname: payload.System?.DeviceName ?? req.body.hostname ?? 'unknown-host',
        installedApplicationCount: payload.InstalledApplications?.length ?? 0,
        runningProcessCount: payload.RunningProcesses?.length ?? 0
    };
    agentUploads.unshift(upload);
    recordAgentInventoryUpload({
        keyId: res.locals.agentKeyId,
        tenantId: res.locals.agentTenantId,
        upload,
        payload
    }).catch((error) => {
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
        message: 'Agent inventory payload accepted for inventory normalization. No endpoint monitoring is performed.'
    });
}
function getSuppliedAgentApiKey(req) {
    const auth = req.header('authorization') ?? '';
    const bearerMatch = auth.match(/^Bearer\s+(.+)$/i);
    return bearerMatch?.[1]?.trim() || req.header('x-api-key')?.trim();
}
function requireSupabase(res) {
    if (supabaseAdmin)
        return supabaseAdmin;
    res.status(503).json({
        error: 'Live Supabase database is not configured.',
        message: 'Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY on the BennnSAM API server.'
    });
    return null;
}
function getTenantId(req) {
    const requestedTenant = req.header('x-tenant-id') ?? req.query.tenantId;
    if (typeof requestedTenant === 'string' && requestedTenant.trim())
        return requestedTenant.trim();
    return defaultTenantId;
}
function generateAgentApiKey() {
    return `bsam_agent_${randomBytes(32).toString('base64url')}`;
}
function hashAgentApiKey(apiKey) {
    return createHash('sha256').update(apiKey, 'utf8').digest('hex');
}
function getKeyPrefix(apiKey) {
    return `${apiKey.slice(0, 18)}...`;
}
function buildAgentInstallCommand(apiKey) {
    return `.\\_inventory-agent\\scripts\\install-user.ps1 -SourceExe .\\_inventory-agent\\publish\\win-x64\\agent.exe -Config .\\_inventory-agent\\agent-config.json -ApiKey "${apiKey}" -RunInitialScan`;
}
function mapAgentKeyRow(row) {
    return {
        id: String(row.id),
        tenantId: String(row.tenant_id),
        name: String(row.name),
        keyPrefix: String(row.key_prefix),
        createdAt: String(row.created_at),
        lastUsedAt: row.last_used_at ? String(row.last_used_at) : null,
        revokedAt: row.revoked_at ? String(row.revoked_at) : null,
        status: row.revoked_at ? 'revoked' : 'active'
    };
}
async function ensureTenantExists(client, tenantId) {
    const { data, error } = await client.from('tenants').select('id').eq('id', tenantId).maybeSingle();
    if (error)
        return error;
    if (data)
        return null;
    const { error: insertError } = await client.from('tenants').insert({
        id: tenantId,
        name: defaultTenantName,
        slug: defaultTenantSlug
    });
    return insertError;
}
async function findAgentKey(apiKey) {
    if (!supabaseAdmin)
        return null;
    const hash = hashAgentApiKey(apiKey);
    const { data, error } = await supabaseAdmin
        .from('agent_api_keys')
        .select('id, tenant_id')
        .eq('key_hash', hash)
        .is('revoked_at', null)
        .maybeSingle();
    if (error) {
        console.error(`Agent key lookup failed: ${error.message}`);
        return null;
    }
    if (data)
        return { id: data.id, tenantId: data.tenant_id };
    return null;
}
async function recordAgentInventoryUpload({ keyId, tenantId, upload, payload }) {
    if (!supabaseAdmin)
        return;
    await supabaseAdmin.from('agent_api_keys').update({ last_used_at: upload.receivedAt }).eq('id', keyId);
    await supabaseAdmin.from('raw_inventory_events').insert({
        tenant_id: tenantId,
        source: 'agent',
        raw_name: upload.hostname,
        payload: {
            uploadId: upload.id,
            deviceId: upload.deviceId,
            hostname: upload.hostname,
            installedApplicationCount: upload.installedApplicationCount,
            runningProcessCount: upload.runningProcessCount,
            inventory: payload
        },
        detected_at: payload.CollectedAtUtc ?? upload.receivedAt
    });
}
app.post('/api/assistant/query', (req, res) => {
    const prompt = String(req.body.prompt ?? '');
    if (!prompt.trim())
        return res.status(400).json({ error: 'Prompt is required' });
    res.json(runAssistantQuery(prompt));
});
if (existsSync(webIndexPath)) {
    app.use(express.static(webDistPath));
    app.use((req, res, next) => {
        if (req.path.startsWith('/api'))
            return next();
        res.sendFile(webIndexPath);
    });
}
else {
    app.get('/', (_req, res) => {
        res.json({
            ok: true,
            name: 'BennnSam API',
            message: 'Build the web app with npm run build to serve the dashboard from this Node application.'
        });
    });
}
function aggregateCost(field) {
    return Object.values(costRecords.reduce((acc, record) => {
        const name = String(record[field]);
        acc[name] ??= { name, monthlyCost: 0 };
        acc[name].monthlyCost += record.monthlyCost;
        return acc;
    }, {})).sort((a, b) => b.monthlyCost - a.monthlyCost);
}
function sampleRowsForDataset(dataset) {
    const lookup = {
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
app.listen(port, () => {
    console.log(`BennnSam API listening on http://localhost:${port}`);
});
