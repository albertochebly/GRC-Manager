import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import type { Organization, Framework, Control } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, CheckCircle, Circle, Eye } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function Frameworks() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [selectedOrgId, setSelectedOrgId] = useState<string>("");
  const [selectedFrameworkId, setSelectedFrameworkId] = useState<string>("");

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

  // Get all available frameworks
  const { data: allFrameworks = [] } = useQuery<Framework[]>({
    queryKey: ["/api/frameworks"],
    enabled: isAuthenticated && !isLoading,
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

  // Get organization frameworks
  const { data: orgFrameworks = [] } = useQuery<any[]>({
    queryKey: ["/api/organizations", selectedOrgId, "frameworks"],
    enabled: !!selectedOrgId,
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
        `/api/organizations/${selectedOrgId}/frameworks/${frameworkId}/activate`
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/organizations", selectedOrgId, "frameworks"] });
      toast({
        title: "Success",
        description: "Framework activated successfully",
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
        description: "Failed to activate framework",
        variant: "destructive",
      });
    },
  });

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
      <Sidebar 
        organizations={organizations} 
        selectedOrgId={selectedOrgId}
        onOrgChange={setSelectedOrgId}
      />
      
      <div className="flex-1 ml-64">
        <Header />
        
        <main className="p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Cybersecurity Frameworks</h1>
            <p className="text-gray-600 mt-2">Manage and map cybersecurity frameworks to your GRC requirements</p>
          </div>

          {!selectedOrgId ? (
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
              </TabsList>

              <TabsContent value="available" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Available Frameworks</CardTitle>
                    <CardDescription>
                      Activate frameworks that apply to your organization's compliance requirements
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {allFrameworks.map((framework: any) => (
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
                                      {controls.map((control: any) => (
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
                              
                              {!isFrameworkActive(framework.id) && (
                                <Button 
                                  size="sm" 
                                  className="flex-1"
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
                      ))}
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
                        {orgFrameworks.map((framework: any) => (
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
                              <Button variant="outline" className="w-full mt-4" size="sm">
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
            </Tabs>
          )}
        </main>
      </div>
    </div>
  );
}
