import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import type { Risk } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useOrganizations } from "@/hooks/useOrganizations";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import RiskForm from "@/components/risk/risk-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, AlertTriangle, Edit, Eye, Trash2, Shield, Users } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import html2pdf from "html2pdf.js";

export default function RiskRegister() {
  // Print all risks as a table to PDF
  const handlePrintRiskList = () => {
    const orgName = selectedOrganization?.name || "";
    const today = format(new Date(), 'MMM dd, yyyy');
    const safeOrgName = orgName.replace(/[^a-zA-Z0-9-_]/g, "_");
    const filename = `${safeOrgName}_${today}_risk-register-list.pdf`;
    const tempDiv = document.createElement("div");
    tempDiv.style.fontSize = "12px";
    tempDiv.style.maxWidth = "900px";
    tempDiv.style.lineHeight = "1.5";
    tempDiv.style.padding = "16px";
    tempDiv.style.background = "#fff";
    tempDiv.style.color = "#222";
    let html = `<div style='margin-bottom:16px;'>`;
    html += `<div style='font-size:18px; font-weight:bold;'>${orgName}</div>`;
    html += `<div style='font-size:14px; color:#555;'>${today}</div>`;
    html += `</div>`;
    html += `<h2 style='margin-bottom:16px;'>Risk Register List</h2>`;
    html += `<table style='width:100%; border-collapse:collapse;'>`;
    html += `<thead><tr style='background:#f5f5f5;'>`;
    html += `<th style='border:1px solid #ccc; padding:8px;'>Title</th>`;
    html += `<th style='border:1px solid #ccc; padding:8px;'>Asset Category</th>`;
    html += `<th style='border:1px solid #ccc; padding:8px;'>CIA Impact</th>`;
    html += `<th style='border:1px solid #ccc; padding:8px;'>Likelihood</th>`;
    html += `<th style='border:1px solid #ccc; padding:8px;'>Risk Score</th>`;
    html += `<th style='border:1px solid #ccc; padding:8px;'>Risk Level</th>`;
    html += `<th style='border:1px solid #ccc; padding:8px;'>Status</th>`;
    html += `<th style='border:1px solid #ccc; padding:8px;'>Last Updated</th>`;
    html += `</tr></thead><tbody>`;
    risks.forEach((risk: any) => {
      // Format CIA Impact to match webapp: C{confidentialityImpact} I{integrityImpact} A{availabilityImpact} ({impact})
      let ciaImpact = "";
      if (
        risk.confidentialityImpact != null &&
        risk.integrityImpact != null &&
        risk.availabilityImpact != null &&
        risk.impact != null
      ) {
        ciaImpact = `C${risk.confidentialityImpact} I${risk.integrityImpact} A${risk.availabilityImpact} (${risk.impact})`;
      } else {
        ciaImpact = "";
      }
      // Format Risk Level to match webapp
      let riskLevel = "";
      if (risk.riskScore != null && !isNaN(Number(risk.riskScore))) {
        riskLevel = getRiskLevel(Number(risk.riskScore)).level;
      } else {
        riskLevel = "";
      }
      // Map status to new values
      const statusMap: Record<string, string> = {
        identified: "Identified",
        in_assessment: "In Assessment",
        pending_treatment: "Pending Treatment",
        in_progress: "In Progress",
        remediated: "Remediated",
        monitoring: "Monitoring",
        closed: "Closed"
      };
      let statusLabel = statusMap[risk.status?.toLowerCase()] || risk.status || "";
      html += `<tr>`;
      html += `<td style='border:1px solid #ccc; padding:8px;'>${risk.title || ""}</td>`;
      html += `<td style='border:1px solid #ccc; padding:8px;'>${risk.assetCategory || ""}</td>`;
      html += `<td style='border:1px solid #ccc; padding:8px;'>${ciaImpact}</td>`;
      html += `<td style='border:1px solid #ccc; padding:8px;'>${risk.likelihood != null ? risk.likelihood : ""}</td>`;
      html += `<td style='border:1px solid #ccc; padding:8px;'>${risk.riskScore != null ? risk.riskScore : ""}</td>`;
      html += `<td style='border:1px solid #ccc; padding:8px;'>${riskLevel}</td>`;
      html += `<td style='border:1px solid #ccc; padding:8px;'>${statusLabel}</td>`;
      html += `<td style='border:1px solid #ccc; padding:8px;'>${risk.updatedAt ? format(new Date(risk.updatedAt), 'MMM dd, yyyy') : ""}</td>`;
      html += `</tr>`;
    });
    html += `</tbody></table>`;
    tempDiv.innerHTML = html;
    document.body.appendChild(tempDiv);
    html2pdf()
      .set({
        margin: 0.5,
        filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'landscape' }
      })
      .from(tempDiv)
      .save()
      .then(() => {
        document.body.removeChild(tempDiv);
      });
  };
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const { selectedOrganization, selectedOrganizationId } = useOrganizations();
  const [isAssetDialogOpen, setIsAssetDialogOpen] = useState(false);
  const [isScenarioDialogOpen, setIsScenarioDialogOpen] = useState(false);
  const [riskToDelete, setRiskToDelete] = useState<string | null>(null);
  const [selectedRisk, setSelectedRisk] = useState<Risk | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  // Get user role in selected organization
  const userRole = selectedOrganization?.role || "read-only";
  
  // Permission checks
  const canCreateRisks = userRole !== "read-only";
  const canEditRisks = userRole !== "read-only";
  const canDeleteRisks = userRole === "admin";

  // Get risks for selected organization
  const { data: risks = [], isLoading: risksLoading } = useQuery<Risk[]>({
    queryKey: ["/api/organizations", selectedOrganizationId, "risks"],
    queryFn: async (): Promise<Risk[]> => {
      if (!selectedOrganizationId) {
        throw new Error('No organization selected');
      }

      const response = await apiRequest(
        "GET",
        `/api/organizations/${selectedOrganizationId}/risks`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch risks');
      }
      const data = await response.json();
      return data;
    },
    enabled: !!selectedOrganizationId,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: "always",
    refetchInterval: 1000,
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

  // Filter risks by type
  const assetRisks = risks.filter((risk: any) => (risk.riskType || 'asset') === 'asset');
  const scenarioRisks = risks.filter((risk: any) => (risk.riskType || 'asset') === 'scenario');

  const deleteRiskMutation = useMutation({
    mutationFn: async (riskId: string) => {
      if (!selectedOrganizationId) {
        throw new Error('No organization selected');
      }

      const response = await apiRequest(
        "DELETE",
        `/api/organizations/${selectedOrganizationId}/risks/${riskId}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to delete risk');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/organizations", selectedOrganizationId, "risks"],
      });
      setRiskToDelete(null);
      toast({
        title: "Success",
        description: "Risk deleted successfully",
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
        description: "Failed to delete risk",
        variant: "destructive",
      });
    },
  });

  const createRiskMutation = useMutation({
    mutationFn: async (formData: any) => {
      if (!selectedOrganizationId) {
        throw new Error('No organization selected');
      }

      const response = await apiRequest(
        "POST",
        `/api/organizations/${selectedOrganizationId}/risks`,
        formData
      );
      
      if (!response.ok) {
        throw new Error('Failed to create risk');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/organizations", selectedOrganizationId, "risks"],
      });
      setIsAssetDialogOpen(false);
      setIsScenarioDialogOpen(false);
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

  const updateRiskMutation = useMutation({
    mutationFn: async (formData: any) => {
      if (!selectedOrganizationId || !selectedRisk) {
        throw new Error('No organization or risk selected');
      }

      const response = await apiRequest(
        "PUT",
        `/api/organizations/${selectedOrganizationId}/risks/${selectedRisk.id}`,
        formData
      );
      
      if (!response.ok) {
        throw new Error('Failed to update risk');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/organizations", selectedOrganizationId, "risks"],
      });
      setIsEditDialogOpen(false);
      setSelectedRisk(null);
      toast({
        title: "Success",
        description: "Risk updated successfully",
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
        description: "Failed to update risk",
        variant: "destructive",
      });
    },
  });

  const getRiskLevel = (score: number): { level: string; color: string } => {
    if (score >= 20) return { level: "Critical", color: "text-red-600 bg-red-50" };
    if (score >= 15) return { level: "High", color: "text-orange-600 bg-orange-50" };
    if (score >= 10) return { level: "Medium", color: "text-yellow-600 bg-yellow-50" };
    if (score >= 5) return { level: "Low", color: "text-green-600 bg-green-50" };
    return { level: "Very Low", color: "text-blue-600 bg-blue-50" };
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { label: "Draft", color: "bg-gray-100 text-gray-600" },
      identified: { label: "Identified", color: "bg-blue-100 text-blue-700" },
      in_assessment: { label: "In Assessment", color: "bg-yellow-100 text-yellow-700" },
      pending_treatment: { label: "Pending Treatment", color: "bg-orange-100 text-orange-700" },
      in_progress: { label: "In Progress", color: "bg-purple-100 text-purple-700" },
      remediated: { label: "Remediated", color: "bg-green-100 text-green-700" },
      monitoring: { label: "Monitoring", color: "bg-cyan-100 text-cyan-700" },
      closed: { label: "Closed", color: "bg-gray-200 text-gray-700" },
      pending: { label: "Pending Review", color: "bg-yellow-100 text-yellow-700" },
      published: { label: "Published", color: "bg-green-100 text-green-700" },
      archived: { label: "Archived", color: "bg-gray-100 text-gray-600" },
    };
    const normalized = (status || '').toLowerCase();
    const config = statusConfig[normalized as keyof typeof statusConfig] || statusConfig.draft;
    return <Badge className={config.color}>{config.label}</Badge>;
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

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Please log in</h1>
          <p className="text-gray-600">You need to be logged in to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gray-50" data-testid="risk-register-page">
      <Sidebar />
      
      <div className="flex-1 ml-64">
        <Header />
        
        <main className="p-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8 flex items-center justify-between">
              {/* Title and description now handled by Header component */}
              <Button
                variant="outline"
                className="bg-green-50 hover:bg-green-100 text-green-600"
                onClick={handlePrintRiskList}
                data-testid="button-print-risk-register-list"
              >
                Print Risk Register List
              </Button>
            </div>

            {risksLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <span className="ml-2 text-gray-600">Loading risks...</span>
              </div>
            ) : (
              <Tabs defaultValue="asset" className="space-y-6">
                <TabsList>
                  <TabsTrigger value="asset" className="flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Asset-Based Risks
                    <Badge variant="outline">{assetRisks.length}</Badge>
                  </TabsTrigger>
                  <TabsTrigger value="scenario" className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Scenario-Based Risks
                    <Badge variant="outline">{scenarioRisks.length}</Badge>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="asset">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>Asset-Based Risk Register</CardTitle>
                          <CardDescription>
                            Risks associated with specific organizational assets (systems, data, facilities, etc.)
                          </CardDescription>
                        </div>
                        {canCreateRisks && (
                          <Dialog open={isAssetDialogOpen} onOpenChange={setIsAssetDialogOpen}>
                            <DialogTrigger asChild>
                              <Button data-testid="button-add-risk">
                                <Plus className="w-4 h-4 mr-2" />
                                Add Asset Risk
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
                              <DialogHeader>
                                <DialogTitle>Create New Asset-Based Risk</DialogTitle>
                              </DialogHeader>
                              <RiskForm 
                                initialData={{ riskType: 'asset' }}
                                onSubmit={(data) => createRiskMutation.mutate(data)}
                                isLoading={createRiskMutation.isPending}
                              />
                            </DialogContent>
                          </Dialog>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <RiskTable 
                        riskList={assetRisks} 
                        emptyMessage="No asset-based risks identified yet"
                        setSelectedRisk={setSelectedRisk}
                        setIsViewDialogOpen={setIsViewDialogOpen}
                        setIsEditDialogOpen={setIsEditDialogOpen}
                        setRiskToDelete={setRiskToDelete}
                        getRiskLevel={getRiskLevel}
                        getStatusBadge={getStatusBadge}
                        canEditRisks={canEditRisks}
                        canDeleteRisks={canDeleteRisks}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="scenario">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>Scenario-Based Risk Register</CardTitle>
                          <CardDescription>
                            Risks based on specific threat scenarios or business situations
                          </CardDescription>
                        </div>
                        {canCreateRisks && (
                          <Dialog open={isScenarioDialogOpen} onOpenChange={setIsScenarioDialogOpen}>
                            <DialogTrigger asChild>
                              <Button data-testid="button-add-scenario-risk">
                                <Plus className="w-4 h-4 mr-2" />
                                Add Scenario Risk
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
                              <DialogHeader>
                                <DialogTitle>Create New Scenario-Based Risk</DialogTitle>
                              </DialogHeader>
                              <RiskForm 
                                initialData={{ riskType: 'scenario' }}
                                onSubmit={(data) => createRiskMutation.mutate(data)}
                                isLoading={createRiskMutation.isPending}
                              />
                            </DialogContent>
                          </Dialog>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <RiskTable 
                        riskList={scenarioRisks} 
                        emptyMessage="No scenario-based risks identified yet"
                        setSelectedRisk={setSelectedRisk}
                        setIsViewDialogOpen={setIsViewDialogOpen}
                        setIsEditDialogOpen={setIsEditDialogOpen}
                        setRiskToDelete={setRiskToDelete}
                        getRiskLevel={getRiskLevel}
                        getStatusBadge={getStatusBadge}
                        canEditRisks={canEditRisks}
                        canDeleteRisks={canDeleteRisks}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            )}

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!riskToDelete} onOpenChange={() => setRiskToDelete(null)}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Risk</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this risk? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => riskToDelete && deleteRiskMutation.mutate(riskToDelete)}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {/* Edit Risk Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
                <DialogHeader>
                  <DialogTitle>Edit Risk</DialogTitle>
                </DialogHeader>
                {selectedRisk && (
                  <RiskForm 
                    initialData={{
                      title: selectedRisk.title,
                      description: selectedRisk.description || '',
                      riskId: selectedRisk.riskId,
                      riskType: (selectedRisk.riskType as 'asset' | 'scenario') || 'asset',
                      assetCategory: (selectedRisk as any).assetCategory || '',
                      assetDescription: (selectedRisk as any).assetDescription || '',
                      confidentialityImpact: (selectedRisk as any).confidentialityImpact || 1,
                      integrityImpact: (selectedRisk as any).integrityImpact || 1,
                      availabilityImpact: (selectedRisk as any).availabilityImpact || 1,
                      impact: selectedRisk.impact,
                      likelihood: selectedRisk.likelihood,
                      mitigationPlan: selectedRisk.mitigationPlan || '',
                      status: (selectedRisk.status as
                        | "identified"
                        | "in_assessment"
                        | "pending_treatment"
                        | "in_progress"
                        | "remediated"
                        | "monitoring"
                        | "closed") || "identified",
                    }}
                    onSubmit={(data) => updateRiskMutation.mutate(data)}
                    isLoading={updateRiskMutation.isPending}
                  />
                )}
              </DialogContent>
            </Dialog>

            {/* View Risk Dialog */}
            <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
                <DialogHeader>
                  <DialogTitle>Risk Details</DialogTitle>
                </DialogHeader>
                {selectedRisk && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h3 className="font-medium text-gray-900">Risk ID</h3>
                        <p className="mt-1 text-sm text-gray-900">{selectedRisk.riskId}</p>
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">Status</h3>
                        <div className="mt-1">{getStatusBadge(selectedRisk.status || 'draft')}</div>
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">Type</h3>
                        <p className="mt-1 text-sm text-gray-900">
                          <Badge variant="outline">
                            {(selectedRisk.riskType || 'asset') === 'asset' ? 'Asset-Based' : 'Scenario-Based'}
                          </Badge>
                        </p>
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">Risk Score</h3>
                        <p className="mt-1 text-sm text-gray-900 font-semibold">
                          {parseFloat(selectedRisk.riskScore || "0")} ({getRiskLevel(parseFloat(selectedRisk.riskScore || "0")).level})
                        </p>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="font-medium text-gray-900">Title</h3>
                      <p className="mt-1 text-sm text-gray-900">{selectedRisk.title}</p>
                    </div>
                    
                    <div>
                      <h3 className="font-medium text-gray-900">Description</h3>
                      <p className="mt-1 text-sm text-gray-900">{selectedRisk.description || 'No description provided'}</p>
                    </div>
                    
                    {/* Asset-specific information - only show for asset-based risks */}
                    {(selectedRisk.riskType || 'asset') === 'asset' && (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <h3 className="font-medium text-gray-900">Asset Category</h3>
                            <p className="mt-1 text-sm text-gray-900">{(selectedRisk as any).assetCategory || 'Not specified'}</p>
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900">Asset Description</h3>
                            <p className="mt-1 text-sm text-gray-900">{(selectedRisk as any).assetDescription || 'Not specified'}</p>
                          </div>
                        </div>
                      </>
                    )}
                    
                    <div>
                      <h3 className="font-medium text-gray-900">Mitigation Plan</h3>
                      <p className="mt-1 text-sm text-gray-900">{selectedRisk.mitigationPlan || 'No mitigation plan provided'}</p>
                    </div>
                    
                    {/* CIA Impact Breakdown */}
                    <div>
                      <h3 className="font-medium text-gray-900">Impact Assessment (CIA)</h3>
                      <div className="mt-2 grid grid-cols-3 gap-4">
                        <div className="text-center">
                          <p className="text-xs text-gray-500">Confidentiality</p>
                          <p className="text-lg font-semibold text-blue-600">{(selectedRisk as any).confidentialityImpact || 1}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-500">Integrity</p>
                          <p className="text-lg font-semibold text-green-600">{(selectedRisk as any).integrityImpact || 1}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-500">Availability</p>
                          <p className="text-lg font-semibold text-orange-600">{(selectedRisk as any).availabilityImpact || 1}</p>
                        </div>
                      </div>
                      <div className="mt-2 p-2 bg-gray-50 rounded text-center">
                        <p className="text-xs text-gray-500">Overall Impact (Average)</p>
                        <p className="text-xl font-bold text-gray-800">{selectedRisk.impact}/5</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h3 className="font-medium text-gray-900">Likelihood</h3>
                        <p className="mt-1 text-sm text-gray-900">{selectedRisk.likelihood}/5</p>
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">Risk Score</h3>
                        <p className="mt-1 text-lg font-bold text-red-600">{selectedRisk.impact * selectedRisk.likelihood}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h3 className="font-medium text-gray-900">Created</h3>
                        <p className="mt-1 text-sm text-gray-900">
                          {selectedRisk.createdAt ? format(new Date(selectedRisk.createdAt), 'MMM dd, yyyy HH:mm') : 'Unknown'}
                        </p>
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">Last Updated</h3>
                        <p className="mt-1 text-sm text-gray-900">
                          {selectedRisk.updatedAt ? format(new Date(selectedRisk.updatedAt), 'MMM dd, yyyy HH:mm') : 'Unknown'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>
        </main>
      </div>
    </div>
  );
}

// Reusable RiskTable component
function RiskTable({ 
  riskList, 
  emptyMessage, 
  setSelectedRisk, 
  setIsViewDialogOpen, 
  setIsEditDialogOpen, 
  setRiskToDelete,
  getRiskLevel,
  getStatusBadge,
  canEditRisks = true,
  canDeleteRisks = true
}: { 
  riskList: any[]; 
  emptyMessage: string;
  setSelectedRisk: (risk: any) => void;
  setIsViewDialogOpen: (open: boolean) => void;
  setIsEditDialogOpen: (open: boolean) => void;
  setRiskToDelete: (id: string | null) => void;
  getRiskLevel: (score: number) => { level: string; color: string };
  getStatusBadge: (status: string) => JSX.Element;
  canEditRisks?: boolean;
  canDeleteRisks?: boolean;
}) {
  if (riskList.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Risk ID</TableHead>
          <TableHead>Title</TableHead>
          <TableHead>Asset Category</TableHead>
          <TableHead>CIA Impact</TableHead>
          <TableHead>Likelihood</TableHead>
          <TableHead>Risk Score</TableHead>
          <TableHead>Risk Level</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Last Updated</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {riskList.map((risk: any) => {
          const riskScore = parseFloat(risk.riskScore || "0");
          const { level, color } = getRiskLevel(riskScore);
          
          return (
            <TableRow key={risk.id} data-testid={`row-risk-${risk.id}`}>
              <TableCell className="font-medium">{risk.riskId}</TableCell>
              <TableCell>{risk.title}</TableCell>
              <TableCell>{risk.assetCategory || 'N/A'}</TableCell>
              <TableCell>
                <div className="flex space-x-1 text-xs">
                  <span className="text-blue-600">C:{risk.confidentialityImpact || 1}</span>
                  <span className="text-green-600">I:{risk.integrityImpact || 1}</span>
                  <span className="text-orange-600">A:{risk.availabilityImpact || 1}</span>
                  <span className="text-gray-800 font-semibold">({risk.impact})</span>
                </div>
              </TableCell>
              <TableCell>{risk.likelihood}/5</TableCell>
              <TableCell className="font-semibold">{riskScore}</TableCell>
              <TableCell>
                <Badge className={color}>{level}</Badge>
              </TableCell>
              <TableCell>{getStatusBadge(risk.status || 'draft')}</TableCell>
              <TableCell>{format(new Date(risk.updatedAt), 'MMM dd, yyyy')}</TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    data-testid={`button-view-risk-${risk.id}`}
                    onClick={() => {
                      setSelectedRisk(risk);
                      setIsViewDialogOpen(true);
                    }}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  {canEditRisks && (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      data-testid={`button-edit-risk-${risk.id}`}
                      onClick={() => {
                        setSelectedRisk(risk);
                        setIsEditDialogOpen(true);
                      }}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  )}
                  {canDeleteRisks && (
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => setRiskToDelete(risk.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      data-testid={`button-delete-risk-${risk.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
