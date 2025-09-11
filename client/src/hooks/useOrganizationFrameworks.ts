import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useOrganizations } from "@/hooks/useOrganizations";
import { apiRequest } from "@/lib/queryClient";
import type { Framework } from "@shared/schema";

export function useOrganizationFrameworks() {
  const { isAuthenticated } = useAuth();
  const { selectedOrganizationId } = useOrganizations();

  const { data: organizationFrameworks = [], isLoading } = useQuery<Framework[]>({
    queryKey: ["/api/organizations", selectedOrganizationId, "frameworks"],
    enabled: isAuthenticated && !!selectedOrganizationId,
    staleTime: 1 * 60 * 1000, // 1 minute (reduced from 5 minutes for more real-time updates)
    gcTime: 2 * 60 * 1000, // 2 minutes cache time
    refetchOnMount: true, // Always refetch when component mounts
    refetchOnWindowFocus: true, // Refetch when window gains focus
    retry: (failureCount, error: any) => {
      // Don't retry on auth errors
      if (error?.status === 401) {
        return false;
      }
      return failureCount < 3;
    },
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/organizations/${selectedOrganizationId}/frameworks`);
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Unauthorized");
        }
        throw new Error("Failed to fetch organization frameworks");
      }
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
  });

  // Helper functions to check specific frameworks
  const isPCIDSSActive = organizationFrameworks.some(
    framework => framework.name === "PCI DSS" && framework.isActive
  );

  const isISO27001Active = organizationFrameworks.some(
    framework => framework.name === "ISO27001" && framework.isActive
  );

  return {
    organizationFrameworks,
    isLoading,
    isPCIDSSActive,
    isISO27001Active,
    isFrameworkActive: (frameworkName: string) => 
      organizationFrameworks.some(f => f.name === frameworkName && f.isActive)
  };
}
