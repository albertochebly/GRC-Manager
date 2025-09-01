import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useOrganizations } from "@/hooks/useOrganizations";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import StatsGrid from "@/components/dashboard/stats-grid";
import RiskMetricsSection from "@/components/risk/RiskMetricsSection";
import ActivityPanel from "@/components/dashboard/activity-panel";
import SidebarWidgets from "@/components/dashboard/sidebar-widgets";

export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const { selectedOrganizationId, organizations } = useOrganizations();

  // Get dashboard stats for selected organization
  const { data: stats, isLoading: statsLoading } = useQuery<any>({
    queryKey: ["/api/organizations", selectedOrganizationId, "stats"],
    queryFn: async (): Promise<any> => {
      if (!selectedOrganizationId) throw new Error('No organization selected');
      const response = await fetch(`/api/organizations/${selectedOrganizationId}/stats`);
      if (!response.ok) throw new Error('Failed to fetch stats');
      return response.json();
    },
    enabled: !!selectedOrganizationId && isAuthenticated && !isLoading,
    staleTime: 0, // Always refetch when query is accessed
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

  // Get pending approvals (documents with pending status)
  const { data: recentActivities = [] } = useQuery<any[]>({
    queryKey: ["/api/organizations", selectedOrganizationId, "documents", "pending"],
    queryFn: async (): Promise<any[]> => {
      if (!selectedOrganizationId) return [];
      const response = await fetch(`/api/organizations/${selectedOrganizationId}/documents`);
      if (!response.ok) throw new Error('Failed to fetch documents');
      const allDocuments = await response.json();
      // Filter to only pending status documents
      return allDocuments.filter((doc: any) => doc.status === 'pending');
    },
    enabled: !!selectedOrganizationId && isAuthenticated && !isLoading,
    retry: (failureCount, error) => {
      if (isUnauthorizedError(error as Error)) {
        return false;
      }
      return failureCount < 3;
    },
  });

  // Get all documents for compliance calculation
  const { data: allDocuments = [] } = useQuery<any[]>({
    queryKey: ["/api/organizations", selectedOrganizationId, "documents", "all"],
    queryFn: async (): Promise<any[]> => {
      if (!selectedOrganizationId) return [];
      const response = await fetch(`/api/organizations/${selectedOrganizationId}/documents`);
      if (!response.ok) throw new Error('Failed to fetch documents');
      return response.json();
    },
    enabled: !!selectedOrganizationId && isAuthenticated && !isLoading,
    retry: (failureCount, error) => {
      if (isUnauthorizedError(error as Error)) {
        return false;
      }
      return failureCount < 3;
    },
  });

  // Get organization frameworks
  const { data: frameworks = [] } = useQuery<any[]>({
    queryKey: ["/api/organizations", selectedOrganizationId, "frameworks"],
    queryFn: async () => {
      const response = await fetch(`/api/organizations/${selectedOrganizationId}/frameworks`);
      if (!response.ok) throw new Error('Failed to fetch frameworks');
      return response.json();
    },
    enabled: !!selectedOrganizationId && isAuthenticated && !isLoading,
    retry: (failureCount, error) => {
      if (isUnauthorizedError(error as Error)) {
        return false;
      }
      return failureCount < 3;
    },
  });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
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
  }, [isAuthenticated, isLoading, toast]);

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
    <div className="min-h-screen flex bg-gray-50" data-testid="dashboard-page">
      <Sidebar />
      
      <div className="flex-1 ml-64">
        <Header />
        
        <main className="p-6">
          <div className="mb-6">
            {/* Title and description now handled by Header component */}
          </div>

          <StatsGrid stats={stats} isLoading={statsLoading} />

          {/* --- Risk Metrics Section --- */}
          {selectedOrganizationId && (
            <div className="mt-8">
              <h2 className="text-xl font-bold mb-4">Risk Register Metrics</h2>
              <div className="mb-8">
                <RiskMetricsSection organizationId={selectedOrganizationId} />
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
            <div className="lg:col-span-2">
              <ActivityPanel 
                pendingApprovals={recentActivities} 
                isLoading={statsLoading}
              />
            </div>
            <div>
              <SidebarWidgets 
                frameworks={frameworks} 
                documents={allDocuments}
                selectedOrgName={organizations.find(org => org.id === selectedOrganizationId)?.name || ""}
                isLoading={statsLoading}
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
