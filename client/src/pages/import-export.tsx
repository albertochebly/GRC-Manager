import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import type { Organization } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import CSVImport from "@/components/shared/csv-import";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Upload, FileText, AlertTriangle } from "lucide-react";

export default function ImportExport() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [selectedOrgId, setSelectedOrgId] = useState<string>("");

  // Get user organizations
  const { data: organizations = [] } = useQuery<Organization[]>({
    queryKey: ["/api/organizations"],
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

  // Set default organization
  useState(() => {
    if (organizations.length > 0 && !selectedOrgId) {
      setSelectedOrgId(organizations[0].id);
    }
  });

  const downloadTemplate = (templateType: string) => {
    let csvContent = "";
    let filename = "";

    switch (templateType) {
      case "frameworks":
        csvContent = "Framework Name,Version,Description,Control ID,Control Title,Control Description,Category\n" +
                    "Sample Framework,1.0,Sample framework description,CTRL-001,Sample Control,Sample control description,General";
        filename = "framework-template.csv";
        break;
      case "risks":
        csvContent = "Risk ID,Title,Description,Impact (1-5),Likelihood (1-5),Mitigation Plan,Owner Email\n" +
                    "RISK-001,Sample Risk,Sample risk description,3,2,Sample mitigation plan,owner@example.com";
        filename = "risk-template.csv";
        break;
      case "documents":
        csvContent = "Title,Document Type,Version,Content,Owner Email\n" +
                    "Sample Policy,policy,1.0,Sample policy content,owner@example.com";
        filename = "document-template.csv";
        break;
    }

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
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
    <div className="min-h-screen flex bg-gray-50" data-testid="import-export-page">
      <Sidebar />
      
      <div className="flex-1 ml-64">
        <Header />
        
        <main className="p-6">
          <div className="mb-8">
            {/* Title and description now handled by Header component */}
          </div>

          {!selectedOrgId ? (
            <Card>
              <CardContent className="text-center py-12">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select an Organization</h3>
                <p className="text-gray-600">Choose an organization to import or export data.</p>
              </CardContent>
            </Card>
          ) : (
            <Tabs defaultValue="import" className="space-y-6">
              <TabsList>
                <TabsTrigger value="import" data-testid="tab-import">Import Data</TabsTrigger>
                <TabsTrigger value="export" data-testid="tab-export">Export Data</TabsTrigger>
                <TabsTrigger value="templates" data-testid="tab-templates">Download Templates</TabsTrigger>
              </TabsList>

              <TabsContent value="import" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <FileText className="w-5 h-5 text-blue-600 mr-2" />
                        Framework Controls
                      </CardTitle>
                      <CardDescription>
                        Import cybersecurity framework controls from CSV
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <CSVImport
                        title="Import Framework Controls"
                        description="Import cybersecurity framework controls from CSV"
                        onImport={(data: any[]) => {
                          toast({
                            title: "Import Started",
                            description: `Processing ${data.length} framework controls...`,
                          });
                        }}
                        expectedColumns={["Framework Name", "Control ID", "Control Title", "Control Description"]}
                        data-testid="csv-import-frameworks"
                      />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
                        Risk Register
                      </CardTitle>
                      <CardDescription>
                        Import risk entries from CSV
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <CSVImport
                        title="Import Risk Entries"
                        description="Import risk entries from CSV"
                        onImport={(data: any[]) => {
                          toast({
                            title: "Import Started",
                            description: `Processing ${data.length} risk entries...`,
                          });
                        }}
                        expectedColumns={["Risk ID", "Title", "Impact", "Likelihood"]}
                        data-testid="csv-import-risks"
                      />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <FileText className="w-5 h-5 text-green-600 mr-2" />
                        Documents
                      </CardTitle>
                      <CardDescription>
                        Import GRC documents from CSV
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <CSVImport
                        title="Import Documents"
                        description="Import GRC documents from CSV"
                        onImport={(data: any[]) => {
                          toast({
                            title: "Import Started",
                            description: `Processing ${data.length} documents...`,
                          });
                        }}
                        expectedColumns={["Title", "Document Type", "Content"]}
                        data-testid="csv-import-documents"
                      />
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="export" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Export Documents</CardTitle>
                      <CardDescription>
                        Download all documents for this organization
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button className="w-full" data-testid="button-export-documents">
                        <Download className="w-4 h-4 mr-2" />
                        Export Documents CSV
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Export Risk Register</CardTitle>
                      <CardDescription>
                        Download all risks for this organization
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button className="w-full" data-testid="button-export-risks">
                        <Download className="w-4 h-4 mr-2" />
                        Export Risks CSV
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Export Frameworks</CardTitle>
                      <CardDescription>
                        Download active framework controls
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button className="w-full" data-testid="button-export-frameworks">
                        <Download className="w-4 h-4 mr-2" />
                        Export Frameworks CSV
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="templates" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>CSV Templates</CardTitle>
                    <CardDescription>
                      Download properly formatted CSV templates for data import
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Button 
                        variant="outline" 
                        className="flex items-center justify-center p-4 h-auto flex-col space-y-2"
                        onClick={() => downloadTemplate("frameworks")}
                        data-testid="button-template-frameworks"
                      >
                        <FileText className="w-8 h-8 text-blue-600" />
                        <span>Framework Template</span>
                      </Button>

                      <Button 
                        variant="outline" 
                        className="flex items-center justify-center p-4 h-auto flex-col space-y-2"
                        onClick={() => downloadTemplate("risks")}
                        data-testid="button-template-risks"
                      >
                        <AlertTriangle className="w-8 h-8 text-red-600" />
                        <span>Risk Template</span>
                      </Button>

                      <Button 
                        variant="outline" 
                        className="flex items-center justify-center p-4 h-auto flex-col space-y-2"
                        onClick={() => downloadTemplate("documents")}
                        data-testid="button-template-documents"
                      >
                        <FileText className="w-8 h-8 text-green-600" />
                        <span>Document Template</span>
                      </Button>
                    </div>
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
