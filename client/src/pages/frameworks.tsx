import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useOrganizations } from "@/hooks/useOrganizations";
import type { Framework, Control } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import ControlTemplatesManager from "@/components/frameworks/control-templates-manager";
import ControlsManager from "@/components/frameworks/controls-manager";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, CheckCircle, Circle, Eye, Settings, X, Plus, Edit3, Trash2, RefreshCw } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export default function Frameworks() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const { selectedOrganizationId, selectedOrganization } = useOrganizations();
  const [selectedFrameworkId, setSelectedFrameworkId] = useState<string>("");
  const [selectedFrameworkForTemplates, setSelectedFrameworkForTemplates] = useState<Framework | null>(null);
  const [selectedFrameworkForControls, setSelectedFrameworkForControls] = useState<Framework | null>(null);
  const [isTemplatesDialogOpen, setIsTemplatesDialogOpen] = useState(false);
  const [isControlsDialogOpen, setIsControlsDialogOpen] = useState(false);
  
  // Framework Management states
  const [isCreateFrameworkDialogOpen, setIsCreateFrameworkDialogOpen] = useState(false);
  const [isEditFrameworkDialogOpen, setIsEditFrameworkDialogOpen] = useState(false);
  const [editingFramework, setEditingFramework] = useState<Framework | null>(null);
  const [frameworkForm, setFrameworkForm] = useState({
    name: "",
    version: "",
    description: ""
  });

  useEffect(() => {
    console.log("Selected organization changed:", selectedOrganizationId);
  }, [selectedOrganizationId]);

  // Get all available frameworks
  const { data: allFrameworks = [], isLoading: isLoadingFrameworks, refetch: refetchFrameworks } = useQuery<Framework[]>({
    queryKey: ["/api/frameworks"],
    enabled: isAuthenticated && !isLoading && !!selectedOrganizationId,
    staleTime: 0,
    queryFn: async () => {
      try {
        console.log("Fetching frameworks for org:", selectedOrganizationId);
        const response = await apiRequest("GET", "/api/frameworks");
        if (!response.ok) {
          throw new Error("Failed to fetch frameworks");
        }
        const data = await response.json();
        console.log("Fetched frameworks:", data);
        return data;
      } catch (error) {
        console.error('Failed to fetch frameworks:', error);
        throw error;
      }
    }
  });

  // Get organization frameworks
  const { data: orgFrameworks = [] } = useQuery<Framework[]>({
    queryKey: ["/api/organizations", selectedOrganizationId, "frameworks"],
    enabled: !!selectedOrganizationId,
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", `/api/organizations/${selectedOrganizationId}/frameworks`);
        if (!response.ok) {
          throw new Error("Failed to fetch organization frameworks");
        }
        const data = await response.json();
        console.log("Fetched org frameworks:", data);
        return data;
      } catch (error) {
        console.error('Failed to fetch org frameworks:', error);
        throw error;
      }
    }
  });

  // Get framework controls
  const { data: controls = [] } = useQuery<Control[]>({
    queryKey: ["/api/frameworks", selectedFrameworkId, "controls"],
    enabled: !!selectedFrameworkId,
  });

  const activateFrameworkMutation = useMutation({
    mutationFn: async (frameworkId: string) => {
      const response = await apiRequest(
        "POST", 
        `/api/organizations/${selectedOrganizationId}/frameworks`,
        { frameworkId }
      );
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/organizations", selectedOrganizationId, "frameworks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/organizations", selectedOrganizationId, "stats"] });
      
      const documentsCreated = data?.documentsCreated || 0;
      const documentsExisted = data?.documentsExisted || 0;
      const totalTemplates = data?.totalTemplates || 0;
      const isReactivation = data?.isReactivation || false;
      
      let title = "";
      let description = "";

      if (isReactivation) {
        title = "Framework Reactivated Successfully";
        if (documentsCreated === 0 && documentsExisted > 0) {
          description = `Framework reactivated. All ${documentsExisted} documents were already available.`;
        } else if (documentsCreated > 0 && documentsExisted > 0) {
          description = `Framework reactivated. ${documentsCreated} missing documents were recreated, ${documentsExisted} documents were already available.`;
        } else if (documentsCreated > 0 && documentsExisted === 0) {
          description = `Framework reactivated. ${documentsCreated} documents were recreated.`;
        } else {
          description = "Framework reactivated successfully.";
        }
      } else {
        title = "Framework Activated Successfully";
        if (documentsCreated > 0) {
          description = `Framework activated and ${documentsCreated} document drafts were created automatically.`;
        } else {
          description = "Framework activated successfully.";
        }
      }
      
      toast({
        title,
        description,
      });
    },
  });

  const deactivateFrameworkMutation = useMutation({
    mutationFn: async (frameworkId: string) => {
      const response = await apiRequest(
        "DELETE", 
        `/api/organizations/${selectedOrganizationId}/frameworks/${frameworkId}`
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/organizations", selectedOrganizationId, "frameworks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/organizations", selectedOrganizationId, "stats"] });
      toast({
        title: "Framework Deactivated",
        description: "Framework has been deactivated successfully. The documents created from this framework remain available.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to deactivate framework",
        variant: "destructive",
      });
    }
  });

  // Framework CRUD mutations
  const createFrameworkMutation = useMutation({
    mutationFn: async (frameworkData: { name: string; version: string; description: string }) => {
      const response = await apiRequest("POST", "/api/frameworks", frameworkData);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create framework");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/frameworks"] });
      setIsCreateFrameworkDialogOpen(false);
      setFrameworkForm({ name: "", version: "", description: "" });
      toast({
        title: "Framework Created",
        description: "Framework has been created successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const updateFrameworkMutation = useMutation({
    mutationFn: async ({ id, ...frameworkData }: { id: string; name: string; version: string; description: string }) => {
      const response = await apiRequest("PUT", `/api/frameworks/${id}`, frameworkData);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update framework");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/frameworks"] });
      setIsEditFrameworkDialogOpen(false);
      setEditingFramework(null);
      setFrameworkForm({ name: "", version: "", description: "" });
      toast({
        title: "Framework Updated",
        description: "Framework has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const deleteFrameworkMutation = useMutation({
    mutationFn: async (frameworkId: string) => {
      const response = await apiRequest("DELETE", `/api/frameworks/${frameworkId}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete framework");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/frameworks"] });
      toast({
        title: "Framework Deleted",
        description: "Framework has been deleted successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Framework management functions
  const handleCreateFramework = (e: React.FormEvent) => {
    e.preventDefault();
    if (!frameworkForm.name || !frameworkForm.version) {
      toast({
        title: "Error",
        description: "Framework name and version are required.",
        variant: "destructive",
      });
      return;
    }
    createFrameworkMutation.mutate(frameworkForm);
  };

  const handleEditFramework = (framework: Framework) => {
    setEditingFramework(framework);
    setFrameworkForm({
      name: framework.name,
      version: framework.version || "",
      description: framework.description || "",
    });
    setIsEditFrameworkDialogOpen(true);
  };

  const handleUpdateFramework = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFramework || !frameworkForm.name || !frameworkForm.version) {
      toast({
        title: "Error",
        description: "Framework name and version are required.",
        variant: "destructive",
      });
      return;
    }
    updateFrameworkMutation.mutate({
      id: editingFramework.id,
      ...frameworkForm,
    });
  };

  const handleDeleteFramework = (frameworkId: string) => {
    deleteFrameworkMutation.mutate(frameworkId);
  };

  const isFrameworkActive = (frameworkId: string) => {
    return orgFrameworks.some((f: any) => f.id === frameworkId);
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
    <div className="min-h-screen flex bg-gray-50" data-testid="frameworks-page">
      <Sidebar />
      
      <div className="flex-1 ml-64">
        <Header />
        
        <main className="p-6">
          <div className="mb-8">
            {/* Title and description now handled by Header component */}
          </div>

          {!selectedOrganizationId ? (
            <Card>
              <CardContent className="text-center py-12">
                <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select an Organization</h3>
                <p className="text-gray-600">Choose an organization to manage its cybersecurity frameworks.</p>
              </CardContent>
            </Card>
          ) : (
            <Tabs defaultValue="available" className="space-y-6">
              <TabsList>
                <TabsTrigger value="available" data-testid="tab-available-frameworks">Available Frameworks</TabsTrigger>
                <TabsTrigger value="active" data-testid="tab-active-frameworks">Active Frameworks</TabsTrigger>
                <TabsTrigger value="templates" data-testid="tab-template-management">Template Management</TabsTrigger>
                <TabsTrigger value="controls" data-testid="tab-controls-management">Controls Management</TabsTrigger>
                <TabsTrigger value="manage" data-testid="tab-framework-management">Framework Management</TabsTrigger>
              </TabsList>

              <TabsContent value="available" className="space-y-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Available Frameworks</CardTitle>
                      <CardDescription>
                        Activate frameworks that apply to your organization's compliance requirements
                      </CardDescription>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => {
                        refetchFrameworks();
                        queryClient.invalidateQueries({ queryKey: ["/api/frameworks"] });
                      }}
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Refresh
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {isLoadingFrameworks ? (
                        // Loading skeletons
                        Array.from({ length: 3 }).map((_, i) => (
                          <Card key={`skeleton-${i}`} className="animate-pulse">
                            <CardHeader className="pb-3">
                              <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                              <div className="h-5 bg-gray-200 rounded w-1/4"></div>
                            </CardHeader>
                            <CardContent>
                              <div className="h-4 bg-gray-200 rounded w-full mb-4"></div>
                              <div className="h-8 bg-gray-200 rounded w-full"></div>
                            </CardContent>
                          </Card>
                        ))
                      ) : allFrameworks.length === 0 ? (
                        <div className="col-span-3 text-center py-12">
                          <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">No Frameworks Available</h3>
                          <p className="text-gray-600">There are no frameworks available at the moment.</p>
                        </div>
                      ) : (
                        allFrameworks.map((framework: Framework) => (
                          <Card 
                            key={framework.id} 
                            className={`transition-all ${isFrameworkActive(framework.id) ? 'ring-2 ring-green-500' : ''}`}
                            data-testid={`card-framework-${framework.id}`}
                          >
                            <CardHeader className="pb-3">
                              <div className="flex items-center justify-between">
                                <CardTitle className="text-lg">{framework.name}</CardTitle>
                                {isFrameworkActive(framework.id) ? (
                                  <CheckCircle className="w-5 h-5 text-green-500" />
                                ) : (
                                  <Circle className="w-5 h-5 text-gray-400" />
                                )}
                              </div>
                              <Badge variant="outline">{framework.version}</Badge>
                            </CardHeader>
                            <CardContent>
                              <p className="text-sm text-gray-600 mb-4">{framework.description}</p>
                              <div className="space-y-2">
                                <div className="flex space-x-2">
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button 
                                        size="sm" 
                                        variant="outline" 
                                        className="flex-1"
                                        onClick={() => setSelectedFrameworkId(framework.id)}
                                        data-testid={`button-view-controls-${framework.id}`}
                                      >
                                        <Eye className="w-4 h-4 mr-2" />
                                        View Controls
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
                                      <DialogHeader>
                                        <DialogTitle>{framework.name} - Controls</DialogTitle>
                                        <DialogDescription>
                                          Available controls for this framework
                                        </DialogDescription>
                                      </DialogHeader>
                                      <Table>
                                        <TableHeader>
                                          <TableRow>
                                            <TableHead>Control ID</TableHead>
                                            <TableHead>Title</TableHead>
                                            <TableHead>Category</TableHead>
                                            <TableHead>Description</TableHead>
                                          </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                          {controls.map((control: Control) => (
                                            <TableRow key={control.id}>
                                              <TableCell className="font-mono text-sm">{control.controlId}</TableCell>
                                              <TableCell className="font-medium">{control.title}</TableCell>
                                              <TableCell>
                                                <Badge variant="outline">{control.category}</Badge>
                                              </TableCell>
                                              <TableCell className="max-w-md truncate">{control.description}</TableCell>
                                            </TableRow>
                                          ))}
                                        </TableBody>
                                      </Table>
                                    </DialogContent>
                                  </Dialog>
                                  
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="flex-1"
                                    onClick={() => {
                                      setSelectedFrameworkForTemplates(framework);
                                      setIsTemplatesDialogOpen(true);
                                    }}
                                    data-testid={`button-manage-templates-${framework.id}`}
                                  >
                                    <Settings className="w-4 h-4 mr-2" />
                                    Manage Templates
                                  </Button>
                                </div>
                                
                                {!isFrameworkActive(framework.id) && (
                                  <Button 
                                    size="sm" 
                                    className="w-full"
                                    onClick={() => activateFrameworkMutation.mutate(framework.id)}
                                    disabled={activateFrameworkMutation.isPending}
                                    data-testid={`button-activate-${framework.id}`}
                                  >
                                    {activateFrameworkMutation.isPending ? "Activating..." : "Activate"}
                                  </Button>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="active" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Active Frameworks</CardTitle>
                    <CardDescription>
                      Frameworks currently active for this organization
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {orgFrameworks.length === 0 ? (
                      <div className="text-center py-12">
                        <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Frameworks</h3>
                        <p className="text-gray-600">Activate frameworks from the Available tab to start compliance mapping.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {orgFrameworks.map((framework: Framework) => (
                          <Card 
                            key={framework.id} 
                            className="ring-2 ring-green-500"
                            data-testid={`card-active-framework-${framework.id}`}
                          >
                            <CardHeader className="pb-3">
                              <div className="flex items-center justify-between">
                                <CardTitle className="text-lg">{framework.name}</CardTitle>
                                <CheckCircle className="w-5 h-5 text-green-500" />
                              </div>
                              <Badge variant="outline">{framework.version}</Badge>
                            </CardHeader>
                            <CardContent>
                              <p className="text-sm text-gray-600 mb-4">{framework.description}</p>
                              <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-600">Coverage:</span>
                                  <span className="font-medium">0% (Not mapped)</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div className="bg-gray-300 h-2 rounded-full w-0"></div>
                                </div>
                              </div>
                              <div className="space-y-2 mt-4">
                                <Button 
                                  variant="outline" 
                                  className="w-full" 
                                  size="sm"
                                  onClick={() => {
                                    setSelectedFrameworkForTemplates(framework);
                                    setIsTemplatesDialogOpen(true);
                                  }}
                                >
                                  <Settings className="w-4 h-4 mr-2" />
                                  Manage Templates
                                </Button>
                                
                                <Button 
                                  variant="destructive" 
                                  className="w-full" 
                                  size="sm"
                                  onClick={() => {
                                    if (confirm(`Are you sure you want to deactivate "${framework.name}"? This will remove the framework from your active compliance programs, but all documents created from this framework will remain available.`)) {
                                      deactivateFrameworkMutation.mutate(framework.id);
                                    }
                                  }}
                                  disabled={deactivateFrameworkMutation.isPending}
                                  data-testid={`button-deactivate-${framework.id}`}
                                >
                                  <X className="w-4 h-4 mr-2" />
                                  {deactivateFrameworkMutation.isPending ? "Deactivating..." : "Deactivate Framework"}
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="templates" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Template Management</CardTitle>
                    <CardDescription>
                      Configure document templates for framework controls. These templates will be used to automatically create document drafts when frameworks are activated.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {allFrameworks.length === 0 ? (
                      <div className="text-center py-12">
                        <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Frameworks Available</h3>
                        <p className="text-gray-600">There are no frameworks available to configure templates for.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {allFrameworks.map((framework: Framework) => (
                          <Card 
                            key={framework.id} 
                            className="cursor-pointer hover:shadow-md transition-shadow"
                            onClick={() => {
                              setSelectedFrameworkForTemplates(framework);
                              setIsTemplatesDialogOpen(true);
                            }}
                            data-testid={`card-template-framework-${framework.id}`}
                          >
                            <CardHeader className="pb-3">
                              <CardTitle className="text-lg">{framework.name}</CardTitle>
                              <Badge variant="outline">{framework.version}</Badge>
                            </CardHeader>
                            <CardContent>
                              <p className="text-sm text-gray-600 mb-4">{framework.description}</p>
                              <Button variant="outline" className="w-full" size="sm">
                                <Settings className="w-4 h-4 mr-2" />
                                Configure Templates
                              </Button>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="controls" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Controls Management</CardTitle>
                    <CardDescription>
                      Manage framework controls (sections) - add, edit, or delete individual controls within frameworks.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {allFrameworks.length === 0 ? (
                      <div className="text-center py-12">
                        <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Frameworks Available</h3>
                        <p className="text-gray-600">There are no frameworks available to manage controls for.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {allFrameworks.map((framework: Framework) => (
                          <Card 
                            key={framework.id} 
                            className="cursor-pointer hover:shadow-md transition-shadow"
                            onClick={() => {
                              setSelectedFrameworkForControls(framework);
                              setIsControlsDialogOpen(true);
                            }}
                            data-testid={`card-controls-framework-${framework.id}`}
                          >
                            <CardHeader className="pb-3">
                              <CardTitle className="text-lg">{framework.name}</CardTitle>
                              <Badge variant="outline">{framework.version}</Badge>
                            </CardHeader>
                            <CardContent>
                              <p className="text-sm text-gray-600 mb-4">{framework.description}</p>
                              <Button variant="outline" className="w-full" size="sm">
                                <Settings className="w-4 h-4 mr-2" />
                                Manage Controls
                              </Button>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="manage" className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Framework Management</CardTitle>
                        <CardDescription>
                          Create, edit, or delete frameworks. Note: Frameworks that are currently activated by organizations cannot be deleted.
                        </CardDescription>
                      </div>
                      <Dialog open={isCreateFrameworkDialogOpen} onOpenChange={setIsCreateFrameworkDialogOpen}>
                        <DialogTrigger asChild>
                          <Button>
                            <Plus className="w-4 h-4 mr-2" />
                            Create Framework
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                          <DialogHeader>
                            <DialogTitle>Create New Framework</DialogTitle>
                            <DialogDescription>
                              Create a new compliance framework that organizations can activate.
                            </DialogDescription>
                          </DialogHeader>
                          <form onSubmit={handleCreateFramework} className="space-y-4">
                            <div>
                              <Label htmlFor="name">Framework Name</Label>
                              <Input
                                id="name"
                                value={frameworkForm.name}
                                onChange={(e) => setFrameworkForm(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="e.g., ISO 27001"
                                required
                              />
                            </div>
                            <div>
                              <Label htmlFor="version">Version</Label>
                              <Input
                                id="version"
                                value={frameworkForm.version}
                                onChange={(e) => setFrameworkForm(prev => ({ ...prev, version: e.target.value }))}
                                placeholder="e.g., 2022"
                                required
                              />
                            </div>
                            <div>
                              <Label htmlFor="description">Description</Label>
                              <Textarea
                                id="description"
                                value={frameworkForm.description}
                                onChange={(e) => setFrameworkForm(prev => ({ ...prev, description: e.target.value }))}
                                placeholder="Brief description of the framework..."
                                rows={3}
                              />
                            </div>
                            <div className="flex justify-end space-x-2">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsCreateFrameworkDialogOpen(false)}
                              >
                                Cancel
                              </Button>
                              <Button type="submit" disabled={createFrameworkMutation.isPending}>
                                {createFrameworkMutation.isPending ? "Creating..." : "Create Framework"}
                              </Button>
                            </div>
                          </form>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {isLoadingFrameworks ? (
                      <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                        <p className="mt-4 text-gray-600">Loading frameworks...</p>
                      </div>
                    ) : allFrameworks.length === 0 ? (
                      <div className="text-center py-12">
                        <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Frameworks Available</h3>
                        <p className="text-gray-600">Create your first framework to get started.</p>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Version</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {allFrameworks.map((framework: Framework) => (
                            <TableRow key={framework.id}>
                              <TableCell className="font-medium">{framework.name}</TableCell>
                              <TableCell>
                                <Badge variant="outline">{framework.version}</Badge>
                              </TableCell>
                              <TableCell className="max-w-md truncate">{framework.description}</TableCell>
                              <TableCell className="text-sm text-gray-500">
                                {new Date(framework.createdAt || "").toLocaleDateString()}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end space-x-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleEditFramework(framework)}
                                  >
                                    <Edit3 className="w-4 h-4" />
                                  </Button>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button size="sm" variant="outline">
                                        <Trash2 className="w-4 h-4 text-destructive" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Delete Framework</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Are you sure you want to delete "{framework.name} {framework.version}"? 
                                          This action cannot be undone. Note: Frameworks that are currently activated 
                                          by organizations cannot be deleted.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => handleDeleteFramework(framework.id)}
                                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                          disabled={deleteFrameworkMutation.isPending}
                                        >
                                          {deleteFrameworkMutation.isPending ? "Deleting..." : "Delete"}
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}

          {/* Edit Framework Dialog */}
          <Dialog open={isEditFrameworkDialogOpen} onOpenChange={setIsEditFrameworkDialogOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Edit Framework</DialogTitle>
                <DialogDescription>
                  Update the framework details.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleUpdateFramework} className="space-y-4">
                <div>
                  <Label htmlFor="edit-name">Framework Name</Label>
                  <Input
                    id="edit-name"
                    value={frameworkForm.name}
                    onChange={(e) => setFrameworkForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., ISO 27001"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-version">Version</Label>
                  <Input
                    id="edit-version"
                    value={frameworkForm.version}
                    onChange={(e) => setFrameworkForm(prev => ({ ...prev, version: e.target.value }))}
                    placeholder="e.g., 2022"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea
                    id="edit-description"
                    value={frameworkForm.description}
                    onChange={(e) => setFrameworkForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description of the framework..."
                    rows={3}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditFrameworkDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={updateFrameworkMutation.isPending}>
                    {updateFrameworkMutation.isPending ? "Updating..." : "Update Framework"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {/* Template Management Dialog */}
          <Dialog open={isTemplatesDialogOpen} onOpenChange={setIsTemplatesDialogOpen}>
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto p-0">
              <DialogHeader className="p-6 pb-0">
                <DialogTitle>
                  {selectedFrameworkForTemplates ? `${selectedFrameworkForTemplates.name} - Template Management` : "Template Management"}
                </DialogTitle>
                <DialogDescription>
                  Configure document templates that will be automatically created when this framework is activated.
                </DialogDescription>
              </DialogHeader>
              <div className="p-6 pt-0">
                {selectedFrameworkForTemplates && (
                  <ControlTemplatesManager
                    frameworkId={selectedFrameworkForTemplates.id}
                    frameworkName={selectedFrameworkForTemplates.name}
                  />
                )}
              </div>
            </DialogContent>
          </Dialog>

          {/* Controls Management Dialog */}
          <Dialog open={isControlsDialogOpen} onOpenChange={setIsControlsDialogOpen}>
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden p-0">
              <DialogHeader className="p-6 pb-0">
                <DialogTitle>
                  {selectedFrameworkForControls ? `${selectedFrameworkForControls.name} - Controls Management` : "Controls Management"}
                </DialogTitle>
                <DialogDescription>
                  Add, edit, or delete framework controls (sections). These are the individual requirements or control points within the framework.
                </DialogDescription>
              </DialogHeader>
              <div className="flex-1 overflow-auto p-6 pt-0">
                {selectedFrameworkForControls && (
                  <ControlsManager
                    frameworkId={selectedFrameworkForControls.id}
                    frameworkName={selectedFrameworkForControls.name}
                  />
                )}
              </div>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
}
