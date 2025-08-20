import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, AlertTriangle, CheckCircle, TrendingUp, Users, Shield } from "lucide-react";

interface StatsGridProps {
  stats: {
    frameworks?: {
      total: number;
      active: number;
      inactive: number;
    };
    documents?: {
      total: number;
      pendingApproval: number;
    };
    risks?: {
      total: number;
      high: number;
      low: number;
    };
    users?: {
      total: number;
    };
    overview?: {
      totalFrameworks: number;
      totalDocuments: number;
      totalRisks: number;
      totalUsers: number;
    };
  } | undefined;
  isLoading: boolean;
}

export default function StatsGrid({ stats, isLoading }: StatsGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
        {[1, 2, 3, 4, 5, 6].map((i) => (
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
      title: "Active Frameworks",
      value: stats?.frameworks?.active || 0,
      icon: Shield,
      color: "text-green-600",
    },
    {
      title: "Total Documents", 
      value: stats?.documents?.total || 0,
      icon: FileText,
      color: "text-blue-600",
    },
    {
      title: "Pending Approvals",
      value: stats?.documents?.pendingApproval || 0,
      icon: CheckCircle,
      color: "text-orange-600",
    },
    {
      title: "Total Risks",
      value: stats?.risks?.total || 0,
      icon: AlertTriangle,
      color: "text-yellow-600",
    },
    {
      title: "High Priority Risks",
      value: stats?.risks?.high || 0,
      icon: TrendingUp,
      color: "text-red-600",
    },
    {
      title: "Team Members",
      value: stats?.users?.total || 0,
      icon: Users,
      color: "text-purple-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
      {statsData.map((stat) => (
        <Card key={stat.title} data-testid={`card-${stat.title.toLowerCase().replace(/\s+/g, "-")}`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon className={`h-4 w-4 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid={`text-${stat.title.toLowerCase().replace(/\s+/g, "-")}-value`}>
              {stat.value}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}