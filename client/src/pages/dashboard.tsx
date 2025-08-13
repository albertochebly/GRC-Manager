import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import type { Organization } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import StatsGrid from "@/components/dashboard/stats-grid";
import ActivityPanel from "@/components/dashboard/activity-panel";
import SidebarWidgets from "@/components/dashboard/sidebar-widgets";

export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [selectedOrgId, setSelectedOrgId] = useState<string>("");

  // Get user organizations
  const { data: organizations = [] } = useQuery<Organization[]>({
    queryKey: ["/api/organizations"],
    enabled: isAuthenticated && !isLoading,
  });

  // Set default organization
  useEffect(() => {
    if (organizations.length > 0 && !selectedOrgId) {
      setSelectedOrgId(organizations[0].id);
    }
  }, [organizations, selectedOrgId]);

  // Get dashboard stats for selected organization
  const { data: stats, isLoading: statsLoading } = useQuery<any>({
    queryKey: ["/api/organizations", selectedOrgId, "stats"],
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

  // Get pending approvals
  const { data: pendingApprovals = [] } = useQuery<any[]>({
    queryKey: ["/api/organizations", selectedOrgId, "approvals", "pending"],
    enabled: !!selectedOrgId,
    retry: (failureCount, error) => {
      if (isUnauthorizedError(error as Error)) {
        return false;
      }
      return failureCount < 3;
    },
  });

  // Get organization frameworks
  const { data: frameworks = [] } = useQuery<any[]>({
    queryKey: ["/api/organizations", selectedOrgId, "frameworks"],
    enabled: !!selectedOrgId,
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
      <Sidebar 
        organizations={organizations} 
        selectedOrgId={selectedOrgId}
        onOrgChange={setSelectedOrgId}
      />
      
      <div className="flex-1 ml-64">
        <Header />
        
        <main className="p-6">
          {statsLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              <StatsGrid stats={stats} />
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
                <ActivityPanel pendingApprovals={pendingApprovals} />
                <SidebarWidgets frameworks={frameworks} />
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
