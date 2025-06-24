import { create } from 'zustand';
import { useOrganizationStore } from './organizationStore';
import { userApi, User as ApiUser, CreateUserRequest, UpdateUserRequest } from '@/api/adminApi';

export enum UserRole {
  STUDENT = "student",
  ADMIN = "admin",
  COLLEGE_ADMIN = "college_admin",
  INSTRUCTOR = "instructor",
}

export interface User {
  id: string;
  username: string;
  email: string | null;
  password: string | null;
  org_id: string | null;
  batch_id: string[];
  userRole: UserRole;
}

// Utility to map API user to store user
function mapApiUserToStoreUser(apiUser: ApiUser): User {
  return {
    ...apiUser,
    userRole: apiUser.userRole as UserRole,
  };
}

interface AdminStoreState {
  users: User[];
  search: string;
  orgFilter: string;
  roleFilter: UserRole | 'All';
  selectedOrg: string | null;
  loading: boolean;
  error: string | null;

  setSearch: (search: string) => void;
  setOrgFilter: (org: string) => void;
  setRoleFilter: (role: UserRole | 'All') => void;
  setSelectedOrg: (org: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // User management functions
  addUser: (userData: CreateUserRequest, role: UserRole) => Promise<void>;
  deleteUser: (id: string, role: UserRole) => Promise<void>;
  editUser: (id: string, userData: UpdateUserRequest, role: UserRole) => Promise<void>;
  fetchUsers: (role?: UserRole | 'All') => Promise<void>;
}

// Mock batch data
const mockBatches = [
  '2024-Batch-A',
  '2024-Batch-B', 
  '2023-Batch-A',
  '2023-Batch-B',
  '2022-Batch-A',
  '2022-Batch-B'
];

export const useAdminStore = create<AdminStoreState>((set, get) => ({
  users: [],
  search: '',
  orgFilter: 'All Organizations',
  roleFilter: 'All',
  selectedOrg: null,
  loading: false,
  error: null,

  setSearch: (search) => set({ search }),
  setOrgFilter: (org) => set({ orgFilter: org }),
  setRoleFilter: (role) => set({ roleFilter: role }),
  setSelectedOrg: (org) => set({ selectedOrg: org }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  addUser: async (userData, role) => {
    try {
      set({ loading: true, error: null });
      let response;
      
      switch (role) {
        case UserRole.COLLEGE_ADMIN:
          response = await userApi.createCollegeAdmin(userData);
          break;
        case UserRole.INSTRUCTOR:
          response = await userApi.createInstructor(userData);
          break;
        case UserRole.STUDENT:
          response = await userApi.createStudent(userData);
          break;
        default:
          throw new Error('Invalid user role');
      }
      
      set((state) => ({
        users: [...state.users, mapApiUserToStoreUser(response.user)],
        loading: false,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create user';
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },

  deleteUser: async (id, role) => {
    try {
      set({ loading: true, error: null });
      
      switch (role) {
        case UserRole.COLLEGE_ADMIN:
          await userApi.deleteCollegeAdmin(id);
          break;
        case UserRole.INSTRUCTOR:
          await userApi.deleteInstructor(id);
          break;
        case UserRole.STUDENT:
          await userApi.deleteStudent(id);
          break;
        default:
          throw new Error('Invalid user role');
      }
      
      set((state) => ({
        users: state.users.filter((u) => u.id !== id),
        loading: false,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete user';
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },

  editUser: async (id, userData, role) => {
    try {
      set({ loading: true, error: null });
      let response;
      
      switch (role) {
        case UserRole.COLLEGE_ADMIN:
          response = await userApi.updateCollegeAdmin(id, userData);
          break;
        case UserRole.INSTRUCTOR:
          response = await userApi.updateInstructor(id, userData);
          break;
        case UserRole.STUDENT:
          response = await userApi.updateStudent(id, userData);
          break;
        default:
          throw new Error('Invalid user role');
      }
      
      set((state) => ({
        users: state.users.map((u) => u.id === id ? mapApiUserToStoreUser(response.user) : u),
        loading: false,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update user';
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },

  fetchUsers: async (role) => {
    try {
      set({ loading: true, error: null });
      const apiRole = role && role !== 'All' ? role : undefined;
      const response = await userApi.getAllUsers(apiRole);
      set({
        users: response.users.map(mapApiUserToStoreUser),
        loading: false,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch users';
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },
}));

// Export helper functions
export const getOrgs = () => {
  const { organizations } = useOrganizationStore.getState();
  return organizations.map(org => ({ id: org.id, name: org.name }));
};
export const getBatches = () => mockBatches; 