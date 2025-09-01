import React from "react";
import { useQuery } from "@tanstack/react-query";
import { calculateRiskMetrics } from "./risk-metrics-util";
import RiskMetricsDashboard from "./RiskMetricsDashboard";
import type { Risk } from "@shared/schema";

interface Props {
  organizationId: string;
}

const RiskMetricsSection: React.FC<Props> = ({ organizationId }) => {
  const { data: risks = [], isLoading } = useQuery<Risk[]>({
    queryKey: ["/api/organizations", organizationId, "risks"],
    queryFn: async (): Promise<Risk[]> => {
      const response = await fetch(`/api/organizations/${organizationId}/risks`);
      if (!response.ok) throw new Error("Failed to fetch risks");
      return response.json();
    },
    enabled: !!organizationId,
    staleTime: 0,
  });

  if (isLoading) return <div className="mb-8">Loading risk metrics...</div>;
  const metrics = calculateRiskMetrics(risks);
  return <RiskMetricsDashboard metrics={metrics} />;
};

export default RiskMetricsSection;
