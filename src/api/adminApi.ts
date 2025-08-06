import apiClient from "../utils/axiosInterceptor";
import { API_ENDPOINTS } from "../config/urls";
import type { UserRole, UserStatus } from "@/store/adminStore";

// Organization API functions
export const organizationApi = {
  // Get all organizations
  getAll: async () => {
    const response = await apiClient.get(API_ENDPOINTS.ADMIN.ORGANIZATIONS);
    return response.data;
  },

  // Create organization
  create: async (data: Record<string, any>) => {
    const response = await apiClient.post(
      API_ENDPOINTS.ADMIN.ORGANIZATIONS,
      data,
    );
    return response.data;
  },

  // Delete organization
  delete: async (orgId: string) => {
    const url = API_ENDPOINTS.ADMIN.ORGANIZATION_BY_ID(orgId);
    const response = await apiClient.delete(url);
    return response.data;
  },

  // Update organization
  update: async (orgId: string, data: Record<string, any>) => {
    const url = API_ENDPOINTS.ADMIN.ORGANIZATION_BY_ID(orgId);
    const response = await apiClient.put(url, data);
    return response.data;
  },
};

// User API functions
export const userApi = {
  // Create user with role
  createUser: async (data: Record<string, any>, role: string) => {
    const response = await apiClient.post(API_ENDPOINTS.ADMIN.USERS, {
      ...data,
      role,
    });
    return response.data;
  },

  // Update user by ID, with role
  updateUser: async (
    userId: string,
    data: Record<string, any>,
    role: string,
  ) => {
    const url = API_ENDPOINTS.ADMIN.USER_BY_ID(userId);
    const response = await apiClient.put(url, { ...data, role });
    return response.data;
  },

  // Delete user by ID with unified endpoint
  deleteUser: async (userId: string) => {
    const url = API_ENDPOINTS.ADMIN.USER_BY_ID(userId);
    const response = await apiClient.delete(url);
    return response.data;
  },

  // Get all users, optionally filtered by role
  getAllUsers: async (filter: Record<string, any>) => {
    const response = await apiClient.get(API_ENDPOINTS.ADMIN.USERS, {
      params: filter,
    });
    return response.data;
  },

  // Get user statistics for dashboard
  getUserStats: async () => {
    const response = await apiClient.get(API_ENDPOINTS.ADMIN.USER_STATS);
    return response.data;
  },

  // Add bulkCreateUsers and bulkDeleteUsers to userApi
  bulkCreateUsers: async (users: CreateUserRequest[]) => {
    const response = await apiClient.post(
      API_ENDPOINTS.ADMIN.BULK_CREATE_USERS,
      users,
    );
    return response.data;
  },
  bulkDeleteUsers: async (userIds: string[]) => {
    const response = await apiClient.post(
      API_ENDPOINTS.ADMIN.BULK_DELETE_USERS,
      { userIds },
    );
    return response.data;
  },
};

// Get admin jobs
export const getAdminJobs = async (session: { id_token?: string }) => {
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${session?.id_token}`,
  };
  const response = await apiClient.get(`/api/admin/hiring/jobs`, { headers });
  return response.data;
};

// User management request interfaces
export interface CreateUserRequest {
  username: string;
  email: string;
  password?: string;
  org_id: string;
  batch_id?: string[];
  userRole: UserRole;
  status?: UserStatus;
}

export interface UpdateUserRequest {
  username?: string;
  email?: string;
  password?: string;
  org_id?: string;
  batch_id?: string[];
  userRole?: UserRole;
  status?: UserStatus;
}

// Organization management request interfaces
export interface CreateOrgRequest {
  name: string;
  address: string;
  description?: string;
}

export interface UpdateOrgRequest {
  name?: string;
  address?: string;
  description?: string;
}
