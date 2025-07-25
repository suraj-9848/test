import { getSession } from "next-auth/react";
import { UserRole } from "@/store/adminStore";

const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_BASE_URL;

// Types
export interface User {
  id: string;
  username: string;
  email: string | null;
  password: string | null;
  org_id: string | null;
  batch_id: string[];
  userRole: "student" | "admin" | "instructor" | "recruiter";
}

export interface Organization {
  id: string;
  name: string;
  address: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserRequest {
  username: string;
  email?: string;
  password?: string;
  org_id: string;
  batch_id?: string[];
}

export interface UpdateUserRequest {
  username?: string;
  email?: string;
  password?: string;
  batch_id?: string[];
}

export interface CreateOrgRequest {
  name: string;
  description?: string;
  address?: string;
}

export interface UpdateOrgRequest {
  name?: string;
  description?: string;
  address?: string;
}

export interface BulkCreateErrorDetail {
  user: CreateUserRequest;
  error: string;
  field?: string;
}

// Helper function to get auth headers
const getAuthHeaders = async () => {
  const session = await getSession();
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${session?.id_token}`,
  };
};

// Helper function to handle API responses
const handleApiResponse = async (response: Response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error ||
        errorData.message ||
        `HTTP error! status: ${response.status}`,
    );
  }
  return response.json();
};

// Organization API functions
export const organizationApi = {
  // Get all organizations
  getAll: async (): Promise<{ message: string; orgs: Organization[] }> => {
    const headers = await getAuthHeaders();
    const response = await fetch(`${BACKEND_BASE_URL}/api/admin/get-all-org`, {
      method: "GET",
      headers,
    });
    return handleApiResponse(response);
  },

  // Create organization
  create: async (
    data: CreateOrgRequest,
  ): Promise<{ message: string; org: Organization }> => {
    const headers = await getAuthHeaders();
    const response = await fetch(`${BACKEND_BASE_URL}/api/admin/create-org`, {
      method: "POST",
      headers,
      body: JSON.stringify(data),
    });
    return handleApiResponse(response);
  },

  // Delete organization
  delete: async (orgId: string): Promise<{ message: string }> => {
    const headers = await getAuthHeaders();
    const response = await fetch(
      `${BACKEND_BASE_URL}/api/admin/delete-org/${orgId}`,
      {
        method: "DELETE",
        headers,
      },
    );
    return handleApiResponse(response);
  },

  // Update organization
  update: async (
    orgId: string,
    data: UpdateOrgRequest,
  ): Promise<{ message: string; org: Organization }> => {
    const headers = await getAuthHeaders();
    const response = await fetch(
      `${BACKEND_BASE_URL}/api/admin/update-org/${orgId}`,
      {
        method: "PUT",
        headers,
        body: JSON.stringify(data),
      },
    );
    return handleApiResponse(response);
  },
};

// User API functions
export const userApi = {
  // Create college admin
  createCollegeAdmin: async (
    data: CreateUserRequest,
  ): Promise<{ message: string; user: User }> => {
    const headers = await getAuthHeaders();
    const response = await fetch(
      `${BACKEND_BASE_URL}/api/admin/create-college-admin`,
      {
        method: "POST",
        headers,
        body: JSON.stringify(data),
      },
    );
    return handleApiResponse(response);
  },

  // Update college admin
  updateCollegeAdmin: async (
    userId: string,
    data: UpdateUserRequest,
  ): Promise<{ message: string; user: User }> => {
    const headers = await getAuthHeaders();
    const response = await fetch(
      `${BACKEND_BASE_URL}/api/admin/update-college-admin/${userId}`,
      {
        method: "PUT",
        headers,
        body: JSON.stringify(data),
      },
    );
    return handleApiResponse(response);
  },

  // Delete college admin
  deleteCollegeAdmin: async (userId: string): Promise<{ message: string }> => {
    const headers = await getAuthHeaders();
    const response = await fetch(
      `${BACKEND_BASE_URL}/api/admin/delete-college-admin/${userId}`,
      {
        method: "DELETE",
        headers,
      },
    );
    return handleApiResponse(response);
  },

  // Create instructor
  createInstructor: async (
    data: CreateUserRequest,
  ): Promise<{ message: string; user: User }> => {
    const headers = await getAuthHeaders();
    const response = await fetch(
      `${BACKEND_BASE_URL}/api/admin/create-instructor`,
      {
        method: "POST",
        headers,
        body: JSON.stringify(data),
      },
    );
    return handleApiResponse(response);
  },

  // Update instructor
  updateInstructor: async (
    userId: string,
    data: UpdateUserRequest,
  ): Promise<{ message: string; user: User }> => {
    const headers = await getAuthHeaders();
    const response = await fetch(
      `${BACKEND_BASE_URL}/api/admin/update-instructor/${userId}`,
      {
        method: "PUT",
        headers,
        body: JSON.stringify(data),
      },
    );
    return handleApiResponse(response);
  },

  // Delete instructor
  deleteInstructor: async (userId: string): Promise<{ message: string }> => {
    const headers = await getAuthHeaders();
    const response = await fetch(
      `${BACKEND_BASE_URL}/api/admin/delete-instructor/${userId}`,
      {
        method: "DELETE",
        headers,
      },
    );
    return handleApiResponse(response);
  },

  // Create student
  createStudent: async (
    data: CreateUserRequest,
  ): Promise<{ message: string; user: User }> => {
    const headers = await getAuthHeaders();
    const response = await fetch(
      `${BACKEND_BASE_URL}/api/admin/create-student`,
      {
        method: "POST",
        headers,
        body: JSON.stringify(data),
      },
    );
    return handleApiResponse(response);
  },

  // Update student
  updateStudent: async (
    userId: string,
    data: UpdateUserRequest,
  ): Promise<{ message: string; user: User }> => {
    const headers = await getAuthHeaders();
    const response = await fetch(
      `${BACKEND_BASE_URL}/api/admin/update-student/${userId}`,
      {
        method: "PUT",
        headers,
        body: JSON.stringify(data),
      },
    );
    return handleApiResponse(response);
  },

  // Delete student
  deleteStudent: async (userId: string): Promise<{ message: string }> => {
    const headers = await getAuthHeaders();
    const response = await fetch(
      `${BACKEND_BASE_URL}/api/admin/delete-student/${userId}`,
      {
        method: "DELETE",
        headers,
      },
    );
    return handleApiResponse(response);
  },

  // Get all users, optionally filtered by role
  getAllUsers: async (
    role?: string,
  ): Promise<{ message: string; users: User[] }> => {
    const headers = await getAuthHeaders();
    const response = await fetch(
      `${BACKEND_BASE_URL}/api/admin/get-all-users`,
      {
        method: "POST",
        headers,
        body: JSON.stringify(role ? { role } : {}),
      },
    );
    return handleApiResponse(response);
  },

  // Get users with optional role filter
  getUsers: async (
    role?: string,
  ): Promise<{ message: string; users: User[] }> => {
    const headers = await getAuthHeaders();
    const url = new URL(`${BACKEND_BASE_URL}/api/admin/get-users`);

    // Append role as a query parameter if it's provided and not "All"
    if (role && role !== "All") {
      url.searchParams.append("role", role);
    }

    console.log(`Fetching users with URL: ${url.toString()}`);

    try {
      const response = await fetch(url.toString(), {
        method: "GET",
        headers,
      });

      if (!response.ok) {
        console.error(
          `Error fetching users: ${response.status} ${response.statusText}`,
        );

        // If we get a 404, log more details and throw a clear error
        if (response.status === 404) {
          console.error(`API endpoint not found: ${url.toString()}`);
          throw new Error(`API endpoint not found: ${url.toString()}`);
        }
      }

      const data = await handleApiResponse(response);
      console.log(`Received ${data.users?.length || 0} users`);
      return data;
    } catch (error) {
      console.error("Error fetching users:", error);
      throw error;
    }
  },

  // Bulk create users
  bulkCreateUsers: async (
    users: CreateUserRequest[],
  ): Promise<{
    message: string;
    created: number;
    errors: number;
    createdUsers: User[];
    errorDetails: BulkCreateErrorDetail[];
  }> => {
    const headers = await getAuthHeaders();
    const response = await fetch(
      `${BACKEND_BASE_URL}/api/admin/bulk-create-users`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({ users }),
      },
    );
    return handleApiResponse(response);
  },

  // Bulk delete users
  bulkDeleteUsers: async (
    userIds: string[],
  ): Promise<{
    message: string;
    deletedCount: number;
  }> => {
    const headers = await getAuthHeaders();
    const response = await fetch(
      `${BACKEND_BASE_URL}/api/admin/bulk-delete-users`,
      {
        method: "DELETE",
        headers,
        body: JSON.stringify({ userIds }),
      },
    );
    return handleApiResponse(response);
  },

  // Get user statistics
  getUserStats: async (): Promise<{
    message: string;
    stats: {
      totalUsers: number;
      students: number;
      instructors: number;
      collegeAdmins: number;
      breakdown: {
        students: string;
        instructors: string;
        collegeAdmins: string;
      };
    };
  }> => {
    const headers = await getAuthHeaders();
    const response = await fetch(`${BACKEND_BASE_URL}/api/admin/user-stats`, {
      method: "GET",
      headers,
    });
    return handleApiResponse(response);
  },

  // Create user with role
  createUser: async (
    data: CreateUserRequest,
    role: UserRole,
  ): Promise<{ message: string; user: User }> => {
    const headers = await getAuthHeaders();
    const response = await fetch(`${BACKEND_BASE_URL}/api/admin/create-user`, {
      method: "POST",
      headers,
      body: JSON.stringify({ ...data, role }),
    });
    return handleApiResponse(response);
  },

  // Update user by ID, with role
  updateUser: async (
    userId: string,
    data: UpdateUserRequest,
    role: UserRole,
  ): Promise<{ message: string; user: User }> => {
    // Validate userId before making the API call
    if (
      !userId ||
      userId === "undefined" ||
      userId === "null" ||
      userId === "NaN"
    ) {
      console.error(
        `Invalid user ID detected: ${userId}, type: ${typeof userId}`,
      );
      throw new Error(`Invalid user ID: ${userId}`);
    }

    // Check if it looks like a valid UUID
    const isUuidFormat =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        userId,
      );
    if (!isUuidFormat) {
      console.warn(
        `Warning: User ID ${userId} does not match UUID format expected by the backend`,
      );
    }

    const headers = await getAuthHeaders();
    console.log("=== FRONTEND ADMIN API UPDATE ===");
    console.log(`Updating user ${userId} with role ${role}`, data);
    console.log(
      "Request URL:",
      `${BACKEND_BASE_URL}/api/admin/update-user/${userId}`,
    );
    console.log("Request body:", JSON.stringify({ ...data, role }));
    console.log("Request headers:", headers);

    const response = await fetch(
      `${BACKEND_BASE_URL}/api/admin/update-user/${userId}`,
      {
        method: "PUT",
        headers,
        body: JSON.stringify({ ...data, role }),
      },
    );
    return handleApiResponse(response);
  },

  // Delete user by ID with unified endpoint
  deleteUser: async (
    userId: string,
    role: UserRole,
  ): Promise<{ message: string }> => {
    const headers = await getAuthHeaders();

    console.log(`Deleting user ${userId} with role ${role}`);

    const response = await fetch(
      `${BACKEND_BASE_URL}/api/admin/delete-user/${userId}`,
      {
        method: "DELETE",
        headers,
      },
    );
    return handleApiResponse(response);
  },
};
