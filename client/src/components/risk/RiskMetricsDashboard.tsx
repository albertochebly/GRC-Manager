import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, LabelList } from "recharts";

export interface RiskMetrics {
  active: number;
  mitigated: number;
  aboveTolerance: number;
  accepted: number;
  overdue: number;
  averageRiskScoreTrend: { month: string; score: number }[];
  riskLevelDistribution: { level: string; count: number; percentage: number }[];
  riskCategoryDistribution: { category: string; count: number }[];
}

interface Props {
  metrics: RiskMetrics;
}

const COLORS = {
  Critical: "#dc2626", // red-600
  High: "#ea580c",    // orange-600
  Medium: "#ca8a04",  // yellow-600
  Low: "#16a34a",     // green-600
  "Very Low": "#2563eb" // blue-600
};

const chartConfig = {
  score: { label: "Risk Score", color: "#2563eb" },
  Critical: { label: "Critical", color: "#dc2626" },
  High: { label: "High", color: "#ea580c" },
  Medium: { label: "Medium", color: "#ca8a04" },
  Low: { label: "Low", color: "#16a34a" },
  "Very Low": { label: "Very Low", color: "#2563eb" }
};

const RiskMetricsDashboard: React.FC<Props> = ({ metrics }) => {
  // Format month labels for the line chart
  const formattedTrendData = metrics.averageRiskScoreTrend.map(item => ({
    ...item,
    monthLabel: new Date(item.month).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
  }));

  return (
    <div className="space-y-6">
      {/* Basic Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Active Risks</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">{metrics.active}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Mitigated Risks</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">{metrics.mitigated}%</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Risk above tolerance</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">{metrics.aboveTolerance}%</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Accepted Risks</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">{metrics.accepted}%</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Overdue Risks</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">{metrics.overdue}</CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Average Risk Score Trend Chart */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Average Risk Score</CardTitle>
            <p className="text-sm text-muted-foreground">Shows the average of all risks, over a 12 month period</p>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={formattedTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="monthLabel" 
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    domain={[0, 25]}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip 
                    formatter={(value) => [value, "Risk Score"]}
                    labelFormatter={(label) => `Month: ${label}`}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="score" 
                    stroke="#2563eb" 
                    strokeWidth={2}
                    dot={{ fill: "#2563eb", strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Active Risks by Risk Levels Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Active Risks - by Risk Levels</CardTitle>
            <p className="text-sm text-muted-foreground">Shows the number of risks according to each Level</p>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <Pie
                    data={metrics.riskLevelDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="count"
                  >
                    {metrics.riskLevelDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[entry.level as keyof typeof COLORS] || "#8884d8"} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value, name) => [value, "Count"]}
                    labelFormatter={(label) => `${label} Risk`}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Legend */}
            <div className="mt-4 flex flex-wrap justify-center gap-4">
              {metrics.riskLevelDistribution.map((entry, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: COLORS[entry.level as keyof typeof COLORS] || "#8884d8" }}
                  ></div>
                  <span className="text-sm text-gray-700">
                    {entry.level} ({entry.count}, {entry.percentage}%)
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Risk Categories Bar Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-pink-500">Risk Categories</CardTitle>
            <p className="text-sm text-muted-foreground">Shows the count of active risks under each Category</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 p-4">
              {metrics.riskCategoryDistribution.map((item, index) => (
                <div key={index} className="flex items-center gap-4">
                  <div className="w-32 text-right text-sm font-medium text-gray-700">
                    {item.category}
                  </div>
                  <div className="flex-1 flex items-center">
                    <div 
                      className="h-6 bg-purple-500 rounded-r-md flex items-center justify-end pr-2"
                      style={{ 
                        width: `${Math.max((item.count / Math.max(...metrics.riskCategoryDistribution.map(x => x.count))) * 200, 50)}px`
                      }}
                    >
                      <span className="text-white text-xs font-bold">{item.count}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RiskMetricsDashboard;
