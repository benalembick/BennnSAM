import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import morgan from 'morgan';
import { nanoid } from 'nanoid';
import { z } from 'zod';
import { applications, auditLog, complianceResults, costRecords, customInventoryRules, departments, devices, exportWorkflows, integrations, licences, normalizationReviewQueue, reports, saasDetections, savingsRecommendations, usageEvents, users } from './demoData.js';
import { runAssistantQuery } from './reportEngine.js';
dotenv.config();
const app = express();
const port = Number(process.env.PORT ?? process.env.API_PORT ?? 4100);
// process.argv[1] is the path to this script — works in both CJS bundles and ESM
const currentDir = dirname(resolve(process.argv[1]));
const webDistPath = resolve(currentDir, '../../web/dist');
const webIndexPath = join(webDistPath, 'index.html');
app.use(cors({
    origin: process.env.CORS_ORIGIN?.split(',') ?? ['http://localhost:5173'],
    credentials: true
}));
app.use(express.json({ limit: '3mb' }));
app.use(morgan('dev'));
const inDays = (date) => {
    const today = new Date('2026-05-27T00:00:00+08:00');
    const target = new Date(`${date}T00:00:00+08:00`);
    return Math.ceil((target.getTime() - today.getTime()) / 86_400_000);
};
app.get('/api/health', (_req, res) => {
    res.json({
        ok: true,
        name: 'BennnSam API',
        mode: process.env.SUPABASE_URL ? 'supabase-ready' : 'demo-memory'
    });
});
app.get('/api/bootstrap', (_req, res) => {
    res.json({ departments, users, auditLog });
});
app.get('/api/overview', (_req, res) => {
    const totalMonthlySpend = applications.reduce((sum, appItem) => sum + appItem.monthlyCost, 0);
    const underusedLicences = licences.reduce((sum, licence) => {
        if (licence.complianceStatus !== 'over-licensed')
            return sum;
        return sum + Math.max(licence.purchasedQuantity - licence.consumedQuantity, 0);
    }, 0);
    res.json({
        cards: {
            totalSoftwareApplications: applications.length,
            saasApplications: applications.filter((appItem) => appItem.type === 'SaaS' || appItem.type === 'browser app').length,
            onPremApplications: applications.filter((appItem) => appItem.type === 'desktop' || appItem.type === 'server').length,
            totalDevices: devices.length,
            totalUsers: users.length,
            monthlySoftwareSpend: totalMonthlySpend,
            potentialSavings: savingsRecommendations.reduce((sum, item) => sum + item.estimatedAnnualSavings, 0),
            underusedLicences,
            complianceRiskCount: complianceResults.length,
            upcomingRenewals: licences.filter((licence) => inDays(licence.renewalDate) <= 90).length,
            shadowSaasDetections: saasDetections.filter((item) => !item.approved).length
        },
        trends: [
            { label: 'Spend', value: totalMonthlySpend, change: 7.4 },
            { label: 'Active usage', value: applications.reduce((sum, appItem) => sum + appItem.activeUsageMinutes, 0), change: 3.1 },
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
            .map((licence) => ({
            application: licence.applicationName,
            vendor: licence.vendor,
            renewalDate: licence.renewalDate,
            days: inDays(licence.renewalDate),
            annualValue: Math.round(licence.purchasedQuantity * licence.costPerLicence * 12)
        }))
            .sort((a, b) => a.days - b.days)
    });
});
app.get('/api/applications', (req, res) => {
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
app.get('/api/applications/:id', (req, res) => {
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
app.get('/api/devices', (_req, res) => res.json(devices));
app.get('/api/usage', (_req, res) => {
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
app.get('/api/saas', (_req, res) => {
    res.json({
        detections: saasDetections,
        known: saasDetections.filter((item) => item.approved),
        unknown: saasDetections.filter((item) => !item.approved),
        domains: saasDetections.map((item) => ({ domain: item.domain, application: item.saasAppName, approved: item.approved }))
    });
});
app.get('/api/licences', (_req, res) => res.json(licences));
app.get('/api/costs', (_req, res) => {
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
app.get('/api/compliance', (_req, res) => {
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
app.get('/api/hardware', (_req, res) => res.json(devices));
app.get('/api/integrations', (_req, res) => res.json(integrations));
app.post('/api/integrations/:id/sync', (req, res) => {
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
app.get('/api/export-workflows', (_req, res) => res.json(exportWorkflows));
app.post('/api/export-workflows', (req, res) => {
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
app.post('/api/export-workflows/:id/run', (req, res) => {
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
app.get('/api/rules', (_req, res) => res.json(customInventoryRules));
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
app.get('/api/normalization', (_req, res) => {
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
app.get('/api/reports', (_req, res) => res.json(reports));
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
app.post('/api/agent/upload', (req, res) => {
    res.json({
        uploadId: `agent-${nanoid(6)}`,
        receivedAt: new Date().toISOString(),
        accepted: true,
        hostname: req.body.hostname ?? 'unknown-host',
        message: 'Mock agent payload accepted for inventory normalization. No endpoint monitoring is performed.'
    });
});
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
