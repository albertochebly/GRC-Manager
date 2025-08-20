import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shield, CheckCircle, AlertCircle, Activity } from "lucide-react";

interface SidebarWidgetsProps {
  frameworks: any[];
  documents: any[];
  selectedOrgName: string;
  isLoading: boolean;
}

export default function SidebarWidgets({ frameworks, documents, selectedOrgName, isLoading }: SidebarWidgetsProps) {
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-32 mb-4"></div>
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded w-24"></div>
                <div className="h-3 bg-gray-200 rounded w-20"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const activeFrameworks = frameworks.filter(f => f.isActive);
  
  // Calculate compliance score based on document completion
  // Completed documents are those with status 'published' or 'archived'
  const completedDocuments = documents.filter(doc => 
    doc.status === 'published' || doc.status === 'archived'
  ).length;
  const totalDocuments = documents.length;
  const complianceScore = totalDocuments > 0 ? 
    Math.round((completedDocuments / totalDocuments) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Organization Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Organization Status
          </CardTitle>
          <CardDescription>{selectedOrgName}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Compliance Score</span>
              <Badge variant={complianceScore >= 80 ? "default" : complianceScore >= 60 ? "secondary" : "destructive"}>
                {complianceScore}%
              </Badge>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  complianceScore >= 80 ? 'bg-green-500' : 
                  complianceScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${complianceScore}%` }}
              ></div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Frameworks */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-600" />
            Active Frameworks
          </CardTitle>
          <CardDescription>Currently implemented compliance frameworks</CardDescription>
        </CardHeader>
        <CardContent>
          {activeFrameworks.length === 0 ? (
            <div className="text-center py-4">
              <AlertCircle className="h-8 w-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No active frameworks</p>
              <p className="text-xs text-gray-400">Activate frameworks to start compliance tracking</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeFrameworks.slice(0, 3).map((framework: any) => (
                <div key={framework.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{framework.name}</p>
                  </div>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </div>
              ))}
              {activeFrameworks.length > 3 && (
                <Button variant="ghost" size="sm" className="w-full">
                  View All ({activeFrameworks.length - 3} more)
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}