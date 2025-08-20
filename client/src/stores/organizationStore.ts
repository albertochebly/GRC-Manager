import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface OrganizationState {
  selectedOrganizationId: string | null;
  setSelectedOrganizationId: (id: string | null) => void;
  resetOrganization: () => void;
}

export const useOrganizationStore = create<OrganizationState>()(
  persist(
    (set) => ({
      selectedOrganizationId: null,
      setSelectedOrganizationId: (id) => set({ selectedOrganizationId: id }),
      resetOrganization: () => set({ selectedOrganizationId: null }),
    }),
    {
      name: 'organization-storage',
      version: 1, // Add version for future migrations
      partialize: (state) => ({ selectedOrganizationId: state.selectedOrganizationId }),
    }
  )
);
