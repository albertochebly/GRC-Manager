import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, AlertTriangle, CheckCircle, TrendingUp } from "lucide-react";

interface StatsGridProps {
  stats: {
    documentCount: number;
    pendingApprovals: number;
    riskCount: number;
    highRiskCount: number;
  } | undefined;
  isLoading: boolean;
}

export default function StatsGrid({ stats, isLoading }: StatsGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-12"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statsData = [
    {
      title: "Documents",
      value: stats?.documentCount || 0,
      icon: FileText,
      color: "text-blue-600",
    },
    {
      title: "Pending Approvals",
      value: stats?.pendingApprovals || 0,
      icon: CheckCircle,
      color: "text-orange-600",
    },
    {
      title: "Total Risks",
      value: stats?.riskCount || 0,
      icon: AlertTriangle,
      color: "text-yellow-600",
    },
    {
      title: "High Priority Risks",
      value: stats?.highRiskCount || 0,
      icon: TrendingUp,
      color: "text-red-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      {statsData.map((stat) => (
        <Card key={stat.title} data-testid={`card-${stat.title.toLowerCase().replace(" ", "-")}`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon className={`h-4 w-4 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid={`text-${stat.title.toLowerCase().replace(" ", "-")}-value`}>
              {stat.value}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}