import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import type { Organization, Risk } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import RiskForm from "@/components/risk/risk-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, AlertTriangle, Edit, Eye } from "lucide-react";
import { format } from "date-fns";

export default function RiskRegister() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [selectedOrgId, setSelectedOrgId] = useState<string>("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Get user organizations
  const { data: organizations = [] } = useQuery<Organization[]>({
    queryKey: ["/api/organizations"],
    enabled: isAuthenticated && !isLoading,
  });

  // Set default organization
  useState(() => {
    if (organizations.length > 0 && !selectedOrgId) {
      setSelectedOrgId(organizations[0].id);
    }
  });

  // Get risks for selected organization
  const { data: risks = [], isLoading: risksLoading } = useQuery<Risk[]>({
    queryKey: ["/api/organizations", selectedOrgId, "risks"],
    enabled: !!selectedOrgId,
    retry: (failureCount, error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return false;
      }
      return failureCount < 3;
    },
  });

  const createRiskMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", `/api/organizations/${selectedOrgId}/risks`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/organizations", selectedOrgId, "risks"] });
      setIsDialogOpen(false);
      toast({
        title: "Success",
        description: "Risk created successfully",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to create risk",
        variant: "destructive",
      });
    },
  });

  const getRiskLevel = (score: number): { level: string; color: string } => {
    if (score >= 20) return { level: "Critical", color: "bg-red-100 text-red-800" };
    if (score >= 15) return { level: "High", color: "bg-orange-100 text-orange-800" };
    if (score >= 10) return { level: "Medium", color: "bg-yellow-100 text-yellow-800" };
    if (score >= 5) return { level: "Low", color: "bg-green-100 text-green-800" };
    return { level: "Very Low", color: "bg-blue-100 text-blue-800" };
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      draft: "bg-gray-100 text-gray-800",
      pending: "bg-yellow-100 text-yellow-800",
      published: "bg-green-100 text-green-800",
      archived: "bg-red-100 text-red-800",
    };
    
    return (
      <Badge className={colors[status]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gray-50" data-testid="risk-register-page">
      <Sidebar 
        organizations={organizations} 
        selectedOrgId={selectedOrgId}
        onOrgChange={setSelectedOrgId}
      />
      
      <div className="flex-1 ml-64">
        <Header />
        
        <main className="p-6">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Risk Register</h1>
              <p className="text-gray-600 mt-2">Identify, assess, and manage organizational risks</p>
            </div>
            
            {selectedOrgId && (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button data-testid="button-create-risk">
                    <Plus className="w-4 h-4 mr-2" />
                    New Risk
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
                  <DialogHeader>
                    <DialogTitle>Log New Risk</DialogTitle>
                  </DialogHeader>
                  <RiskForm
                    onSubmit={(data) => createRiskMutation.mutate(data)}
                    isLoading={createRiskMutation.isPending}
                  />
                </DialogContent>
              </Dialog>
            )}
          </div>

          {!selectedOrgId ? (
            <Card>
              <CardContent className="text-center py-12">
                <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select an Organization</h3>
                <p className="text-gray-600">Choose an organization to view and manage its risk register.</p>
              </CardContent>
            </Card>
          ) : risksLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : risks.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Risks Logged</h3>
                <p className="text-gray-600 mb-6">Start by identifying and logging your first organizational risk.</p>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button data-testid="button-create-first-risk">
                      <Plus className="w-4 h-4 mr-2" />
                      Log Your First Risk
                    </Button>
                  </DialogTrigger>
                </Dialog>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Risk Register</CardTitle>
                <CardDescription>All identified risks for the selected organization</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Risk ID</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Impact</TableHead>
                      <TableHead>Likelihood</TableHead>
                      <TableHead>Risk Score</TableHead>
                      <TableHead>Risk Level</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Updated</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {risks.map((risk: any) => {
                      const riskScore = parseFloat(risk.riskScore || "0");
                      const { level, color } = getRiskLevel(riskScore);
                      
                      return (
                        <TableRow key={risk.id} data-testid={`row-risk-${risk.id}`}>
                          <TableCell className="font-medium">{risk.riskId}</TableCell>
                          <TableCell>{risk.title}</TableCell>
                          <TableCell>{risk.impact}/5</TableCell>
                          <TableCell>{risk.likelihood}/5</TableCell>
                          <TableCell className="font-semibold">{riskScore}</TableCell>
                          <TableCell>
                            <Badge className={color}>{level}</Badge>
                          </TableCell>
                          <TableCell>{getStatusBadge(risk.status)}</TableCell>
                          <TableCell>{format(new Date(risk.updatedAt), 'MMM dd, yyyy')}</TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button size="sm" variant="outline" data-testid={`button-view-risk-${risk.id}`}>
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button size="sm" variant="outline" data-testid={`button-edit-risk-${risk.id}`}>
                                <Edit className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </div>
  );
}
