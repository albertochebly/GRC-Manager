import { Risk } from "@shared/schema";

export function calculateRiskMetrics(risks: Risk[]): {
  active: number;
  mitigated: number;
  aboveTolerance: number;
  accepted: number;
  overdue: number;
  averageRiskScoreTrend: { month: string; score: number }[];
  riskLevelDistribution: { level: string; count: number; percentage: number }[];
  riskCategoryDistribution: { category: string; count: number }[];
} {
  const TOLERANCE_THRESHOLD = 8;
  const now = new Date();
  const last12Months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
  });

  const active = risks.filter(r => r.status !== 'closed').length;
  
  // Mitigated risks: have risk response strategy as "Mitigate" and status as "remediated", "monitoring", or "closed"
  const mitigated = Math.round((risks.filter(r => 
    (r as any).riskResponseStrategy === 'Mitigate' && 
    ['remediated', 'monitoring', 'closed'].includes(r.status)
  ).length / (risks.length || 1)) * 100);
  
  const aboveTolerance = Math.round((risks.filter(r => Number(r.riskScore) > TOLERANCE_THRESHOLD).length / (risks.length || 1)) * 100);
  
  // Accepted risks: have risk response strategy as "Accept" and status as "remediated", "monitoring", or "closed"
  const accepted = Math.round((risks.filter(r => 
    (r as any).riskResponseStrategy === 'Accept' && 
    ['remediated', 'monitoring', 'closed'].includes(r.status)
  ).length / (risks.length || 1)) * 100);
  
  // Overdue risks: have overdue field populated (not empty) and status is NOT "remediated", "monitoring", or "closed"
  const overdue = risks.filter(r => {
    const overdueField = (r as any).overdue;
    const hasOverdueInfo = overdueField && overdueField.trim() !== '';
    const isNotCompleted = !['remediated', 'monitoring', 'closed'].includes(r.status);
    return hasOverdueInfo && isNotCompleted;
  }).length;

  const averageRiskScoreTrend = last12Months.map(month => {
    const monthRisks = risks.filter(r => {
      if (!r.createdAt) return false;
      const dateStr = typeof r.createdAt === 'string' ? r.createdAt : r.createdAt.toISOString();
      return dateStr.startsWith(month.slice(0, 7));
    });
    const avg = monthRisks.length ? (monthRisks.reduce((sum, r) => sum + Number(r.riskScore || 0), 0) / monthRisks.length) : 0;
    return { month, score: Number(avg.toFixed(1)) };
  });

  // Calculate risk level distribution for pie chart
  const getRiskLevel = (score: number): string => {
    if (score >= 20) return "Critical";
    if (score >= 15) return "High";
    if (score >= 10) return "Medium";
    if (score >= 5) return "Low";
    return "Very Low";
  };

  const activeRisks = risks.filter(r => r.status !== 'closed');
  const riskLevels = activeRisks.reduce((acc, risk) => {
    const level = getRiskLevel(Number(risk.riskScore || 0));
    acc[level] = (acc[level] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const riskLevelDistribution = Object.entries(riskLevels).map(([level, count]) => ({
    level,
    count,
    percentage: Math.round((count / (activeRisks.length || 1)) * 100)
  }));

  // Calculate risk category distribution for bar chart
  const categoryMap: Record<string, string> = {
    'Physical & Environmental Controls': 'System Vulnerabilities',
    'Access Control': 'Identity and Access',
    'Cryptography': 'Data Breach',
    'Systems Security': 'System Vulnerabilities',
    'Network Security Controls': 'System Vulnerabilities',
    'Application & Interface Controls': 'System Vulnerabilities',
    'Asset Management': 'Supply Chain',
    'Human Resource Security': 'Insider Threats',
    'Information Classification & Handling': 'Data Breach',
    'Operations Security': 'Non-compliance',
    'Communications Security': 'System Vulnerabilities',
    'Incident Management': 'Non-compliance',
    'Information Security Aspects of Business Continuity Management': 'Non-compliance',
    'Compliance': 'Non-compliance',
    'Supplier Relationships': 'Supply Chain'
  };

  const riskCategories = activeRisks.reduce((acc, risk) => {
    let category = 'Other';
    
    if (risk.assetCategory && categoryMap[risk.assetCategory]) {
      category = categoryMap[risk.assetCategory];
    } else if (risk.assetCategory) {
      category = risk.assetCategory;
    }
    
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Only include categories that have risks (count > 0)
  const riskCategoryDistribution = Object.entries(riskCategories)
    .filter(([category, count]) => count > 0)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);

  return { 
    active, 
    mitigated, 
    aboveTolerance, 
    accepted, 
    overdue, 
    averageRiskScoreTrend,
    riskLevelDistribution,
    riskCategoryDistribution
  };
}
