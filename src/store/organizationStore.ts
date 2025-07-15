import { create } from 'zustand';
import { organizationApi, Organization as ApiOrganization, CreateOrgRequest, UpdateOrgRequest } from '@/api/adminApi';

export interface Organization {
  id: string;
  name: string;
  address: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

interface OrganizationStoreState {
  organizations: Organization[];
  search: string;
  loading: boolean;
  error: string | null;

  setSearch: (search: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // API functions
  fetchOrganizations: () => Promise<void>;
  addOrganization: (org: CreateOrgRequest) => Promise<void>;
  deleteOrganization: (id: string) => Promise<void>;
  editOrganization: (id: string, org: UpdateOrgRequest) => Promise<void>;
}

export const useOrganizationStore = create<OrganizationStoreState>((set) => ({
  organizations: [],
  search: "",
  loading: false,
  error: null,

  setSearch: (search) => set({ search }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  fetchOrganizations: async () => {
    try {
      set({ loading: true, error: null });
      const response = await organizationApi.getAll();
      set({ organizations: response.orgs, loading: false });
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to fetch organizations";
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },

  addOrganization: async (orgData) => {
    try {
      set({ loading: true, error: null });
      const response = await organizationApi.create(orgData);
      set((state) => ({
        organizations: [...state.organizations, response.org],
        loading: false,
      }));
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to create organization";
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },

  deleteOrganization: async (id) => {
    try {
      set({ loading: true, error: null });
      await organizationApi.delete(id);
      set((state) => ({
        organizations: state.organizations.filter((org) => org.id !== id),
        loading: false,
      }));
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to delete organization";
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },

  editOrganization: async (id, orgData) => {
    try {
      set({ loading: true, error: null });
      const response = await organizationApi.update(id, orgData);
      set((state) => ({
        organizations: state.organizations.map((org) =>
          org.id === id ? response.org : org
        ),
        loading: false,
      }));
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to update organization";
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },
}));