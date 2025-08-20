import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useOrganizationStore } from '@/stores/organizationStore';

export interface Organization {
  id: string;
  name: string;
  description?: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export function useOrganizations() {
  const { selectedOrganizationId, setSelectedOrganizationId } = useOrganizationStore();

  const { data: organizations = [], isLoading, error, refetch } = useQuery<Organization[]>({
    queryKey: ['organizations'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/organizations');
      const orgs = await response.json();
      
      // If we have orgs but no selection, select the first one
      if (orgs.length > 0 && !selectedOrganizationId) {
        setSelectedOrganizationId(orgs[0].id);
      }
      
      return orgs;
    },
  });

  const selectedOrganization = organizations.find(org => org.id === selectedOrganizationId);

  return {
    organizations,
    selectedOrganization,
    selectedOrganizationId,
    setSelectedOrganizationId,
    isLoading,
    error,
    refetch,
  };
}
