import {
  applications,
  complianceResults,
  licences,
  saasDetections,
  savingsRecommendations,
  usageEvents
} from './demoData.js';

export interface AssistantReport {
  title: string;
  queryTemplate: string;
  summary: string;
  chartType: 'bar' | 'pie' | 'line';
  rows: Array<Record<string, string | number | boolean | null>>;
}

const currency = new Intl.NumberFormat('en-AU', {
  style: 'currency',
  currency: 'AUD',
  maximumFractionDigits: 0
});

export function runAssistantQuery(prompt: string): AssistantReport {
  const normalized = prompt.toLowerCase();

  if (normalized.includes('unused') || normalized.includes('underused')) {
    const rows = savingsRecommendations
      .filter((item) => item.estimatedAnnualSavings >= 10000 || item.type === 'cancel unused')
      .map((item) => ({
        application: item.applicationName,
        department: item.department,
        recommendation: item.type,
        annualSavings: item.estimatedAnnualSavings,
        reason: item.reason,
        status: item.status
      }));

    return {
      title: 'Unused and Underused Licence Opportunities',
      queryTemplate: 'savings_recommendations where type in (cancel unused, downgrade) and annual_savings >= threshold',
      summary: `Found ${rows.length} optimisation opportunities with a combined annual value of ${currency.format(
        rows.reduce((sum, row) => sum + Number(row.annualSavings), 0)
      )}.`,
      chartType: 'bar',
      rows
    };
  }

  if (normalized.includes('used but not approved') || normalized.includes('shadow')) {
    const rows = saasDetections
      .filter((item) => !item.approved)
      .map((item) => ({
        app: item.saasAppName,
        domain: item.domain,
        detectedUsers: item.detectedUsers,
        activeUsers: item.activeUsers,
        riskRating: item.riskRating,
        source: item.source
      }));

    return {
      title: 'SaaS Apps Used Without Approval',
      queryTemplate: 'saas_detections where approved = false ordered by detected_users desc',
      summary: `${rows.length} unapproved SaaS applications were detected through browser or import evidence.`,
      chartType: 'pie',
      rows
    };
  }

  if (normalized.includes('renewal') || normalized.includes('90 days')) {
    const today = new Date('2026-05-27T00:00:00+08:00');
    const ninetyDays = new Date(today);
    ninetyDays.setDate(today.getDate() + 90);
    const rows = licences
      .filter((licence) => {
        const renewal = new Date(`${licence.renewalDate}T00:00:00+08:00`);
        return renewal >= today && renewal <= ninetyDays;
      })
      .map((licence) => ({
        application: licence.applicationName,
        vendor: licence.vendor,
        renewalDate: licence.renewalDate,
        owner: licence.contractOwner,
        status: licence.complianceStatus,
        annualValue: Math.round(licence.purchasedQuantity * licence.costPerLicence * 12)
      }));

    return {
      title: 'Renewals Due in the Next 90 Days',
      queryTemplate: 'licence_entitlements where renewal_date between today and today + 90 days',
      summary: `${rows.length} renewals need preparation before ${ninetyDays.toISOString().slice(0, 10)}.`,
      chartType: 'bar',
      rows
    };
  }

  if (normalized.includes('expensive') || normalized.includes('low active usage')) {
    const lowUsageByUser = usageEvents
      .filter((event) => event.totalMinutes > 0 && event.activeMinutes / event.totalMinutes < 0.35)
      .map((event) => {
        const app = applications.find((candidate) => candidate.id === event.appId);
        return {
          user: event.userName,
          application: event.appName,
          monthlyAppCost: app?.monthlyCost ?? 0,
          activeMinutes: event.activeMinutes,
          totalMinutes: event.totalMinutes,
          activeRatio: `${Math.round((event.activeMinutes / event.totalMinutes) * 100)}%`
        };
      })
      .sort((a, b) => Number(b.monthlyAppCost) - Number(a.monthlyAppCost));

    return {
      title: 'Expensive Licences With Low Active Usage',
      queryTemplate: 'usage_events joined applications where active_minutes / total_minutes < 0.35 ordered by monthly_cost desc',
      summary: `${lowUsageByUser.length} user/application combinations show low foreground activity compared with entitlement cost.`,
      chartType: 'bar',
      rows: lowUsageByUser
    };
  }

  const rows = complianceResults.map((finding) => ({
    finding: finding.finding,
    application: finding.applicationName,
    severity: finding.severity,
    riskScore: finding.riskScore,
    owner: finding.owner,
    dueDate: finding.dueDate
  }));

  return {
    title: 'Compliance and Risk Snapshot',
    queryTemplate: 'compliance_results ordered by risk_score desc',
    summary: `Showing ${rows.length} prioritized compliance findings. Try asking about renewals, shadow SaaS, or unused licences.`,
    chartType: 'bar',
    rows
  };
}
