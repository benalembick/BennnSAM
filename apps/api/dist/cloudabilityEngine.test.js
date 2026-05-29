import assert from 'node:assert/strict';
import { generateRightsizingRecommendations } from './cloudabilityEngine.js';
const resources = [
    {
        id: 'aws-compute-prod-01',
        name: 'prd-api-worker-01',
        provider: 'AWS',
        accountName: 'AWS Production',
        service: 'EC2',
        resourceType: 'Compute instance',
        sku: 'm6i.2xlarge',
        monthlyCost: 1480,
        environment: 'Production',
        owner: 'Ava Collins',
        team: 'Platform'
    },
    {
        id: 'az-compute-dev-01',
        name: 'dev-build-agent-03',
        provider: 'Azure',
        accountName: 'Azure Engineering',
        service: 'Virtual Machines',
        resourceType: 'Compute instance',
        sku: 'Standard_D2s_v5',
        monthlyCost: 360,
        environment: 'Development',
        owner: 'Ben Martin',
        team: 'Engineering'
    }
];
const recommendations = generateRightsizingRecommendations(resources, [
    {
        resourceId: 'aws-compute-prod-01',
        cpuP95: 11,
        cpuP99: 24,
        memoryP95: 42,
        runningHours30d: 720
    },
    {
        resourceId: 'az-compute-dev-01',
        cpuP95: 88,
        cpuP99: 97,
        runningHours30d: 720
    }
]);
assert.equal(recommendations.length, 2);
assert.equal(recommendations[0].recommendationType, 'Downsize oversized compute');
assert.equal(recommendations[0].recommendedSku, 'm6i.xlarge');
assert.match(recommendations[0].supportingMetrics, /CPU p95 11%/);
assert.match(recommendations[0].supportingMetrics, /memory p95 42%/);
assert.equal(recommendations[1].recommendationType, 'Upsize under-provisioned compute');
assert.match(recommendations[1].supportingMetrics, /memory unavailable/);
console.log('BennnCloudability rightsizing engine tests passed.');
