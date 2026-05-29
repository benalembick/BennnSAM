const downsizeMap = {
    'm6i.2xlarge': 'm6i.xlarge',
    'Standard_D8s_v5': 'Standard_D4s_v5',
    'n2-standard-8': 'n2-standard-4',
    'VM.Standard.E4.Flex-8': 'VM.Standard.E4.Flex-4',
    'Premium SSD P30': 'Premium SSD P20'
};
const upsizeMap = {
    'm6i.large': 'm6i.xlarge',
    'Standard_D2s_v5': 'Standard_D4s_v5',
    'n2-standard-2': 'n2-standard-4',
    'VM.Standard.E4.Flex-2': 'VM.Standard.E4.Flex-4'
};
export function generateRightsizingRecommendations(resources, metrics) {
    const metricsByResource = new Map(metrics.map((metric) => [metric.resourceId, metric]));
    return resources.flatMap((resource) => {
        const metric = metricsByResource.get(resource.id);
        if (!metric)
            return [];
        if (metric.runningHours30d < 24 || metric.cpuP95 < 2) {
            return [
                recommendation(resource, {
                    type: 'Terminate idle resources',
                    sku: 'Terminate',
                    reason: 'Resource appears idle based on p95 CPU and runtime telemetry.',
                    metrics: metricSummary(metric),
                    savingRate: 0.95,
                    confidence: 92,
                    risk: resource.environment.toLowerCase() === 'production' ? 48 : 22
                })
            ];
        }
        if (isCompute(resource) && metric.cpuP95 <= 18 && metric.cpuP99 <= 35 && metric.memoryP95 !== undefined && metric.memoryP95 <= 55) {
            return [
                recommendation(resource, {
                    type: 'Downsize oversized compute',
                    sku: downsizeMap[resource.sku] ?? `${resource.sku} - one size smaller`,
                    reason: 'p95 and p99 utilisation remain materially below policy thresholds.',
                    metrics: metricSummary(metric),
                    savingRate: 0.38,
                    confidence: 86,
                    risk: 34
                })
            ];
        }
        if (isCompute(resource) && (metric.cpuP95 >= 82 || metric.cpuP99 >= 94)) {
            return [
                recommendation(resource, {
                    type: 'Upsize under-provisioned compute',
                    sku: upsizeMap[resource.sku] ?? `${resource.sku} - one size larger`,
                    reason: 'Sustained high p95/p99 CPU indicates performance risk.',
                    metrics: metricSummary(metric),
                    savingRate: -0.22,
                    confidence: 79,
                    risk: 68
                })
            ];
        }
        if (resource.environment.toLowerCase() !== 'production' && (metric.nonProdAfterHoursPercent ?? 0) > 45) {
            return [
                recommendation(resource, {
                    type: 'Stop non-production resources out of hours',
                    sku: resource.sku,
                    reason: 'Non-production workload is running heavily outside business hours.',
                    metrics: metricSummary(metric),
                    savingRate: 0.31,
                    confidence: 83,
                    risk: 18
                })
            ];
        }
        if (resource.resourceType.toLowerCase().includes('disk') && (metric.storageUsedPercent ?? 100) < 30) {
            return [
                recommendation(resource, {
                    type: 'Resize storage',
                    sku: downsizeMap[resource.sku] ?? 'Lower capacity tier',
                    reason: 'Provisioned storage is materially above p95 usage.',
                    metrics: metricSummary(metric),
                    savingRate: 0.28,
                    confidence: 81,
                    risk: 26
                })
            ];
        }
        return [];
    });
}
function isCompute(resource) {
    return resource.resourceType.toLowerCase().includes('compute') || resource.service.toLowerCase().includes('compute');
}
function recommendation(resource, input) {
    const monthlySaving = Math.round(resource.monthlyCost * input.savingRate);
    return {
        id: `rs-${resource.id}`,
        resourceId: resource.id,
        resourceName: resource.name,
        provider: resource.provider,
        accountName: resource.accountName,
        currentSku: resource.sku,
        recommendedSku: input.sku,
        recommendationType: input.type,
        reason: input.reason,
        supportingMetrics: input.metrics,
        estimatedMonthlySaving: monthlySaving,
        estimatedAnnualSaving: monthlySaving * 12,
        confidenceScore: input.confidence,
        riskScore: input.risk,
        status: input.risk > 60 ? 'Reviewing' : 'New',
        owner: resource.owner,
        team: resource.team
    };
}
function metricSummary(metric) {
    const memory = metric.memoryP95 === undefined ? 'memory unavailable' : `memory p95 ${metric.memoryP95}%`;
    return `CPU p95 ${metric.cpuP95}%, CPU p99 ${metric.cpuP99}%, ${memory}, 30d runtime ${metric.runningHours30d}h`;
}
