import { useAuth } from "@/contexts/AuthContext";

interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  success: boolean;
  status: number;
}

class ApiClient {
  private baseUrl: string;
  private getAuthHeaders: (() => Record<string, string>) | null = null;
  private validateAndRefreshToken: (() => Promise<boolean>) | null = null;
  private initialized: boolean = false;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_BACKEND_BASE_URL || "";
  }

  init(
    getAuthHeaders: () => Record<string, string>,
    validateAndRefreshToken: () => Promise<boolean>
  ) {
    this.getAuthHeaders = getAuthHeaders;
    this.validateAndRefreshToken = validateAndRefreshToken;
    this.initialized = true;
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const headers = this.getAuthHeaders ? this.getAuthHeaders() : {};

      const config: RequestInit = {
        ...options,
        headers: {
          ...headers,
          ...options.headers,
        },
        credentials: "include",
      };

      let response = await fetch(`${this.baseUrl}${endpoint}`, config);

      if (response.status === 401 && this.validateAndRefreshToken) {
        const refreshed = await this.validateAndRefreshToken();

        if (refreshed) {
          const newHeaders = this.getAuthHeaders ? this.getAuthHeaders() : {};
          config.headers = {
            ...newHeaders,
            ...options.headers,
          };

          response = await fetch(`${this.baseUrl}${endpoint}`, config);
        }
      }

      const contentType = response.headers.get("content-type");
      let data = null;

      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      return {
        data,
        success: response.ok,
        status: response.status,
        error: response.ok
          ? undefined
          : data?.error || data?.message || "Request failed",
      };
    } catch (error) {
      console.error("API request failed:", error);
      return {
        success: false,
        status: 0,
        error: error instanceof Error ? error.message : "Network error",
      };
    }
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, { method: "GET" });
  }

  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, { method: "DELETE" });
  }

  async upload<T>(
    endpoint: string,
    formData: FormData
  ): Promise<ApiResponse<T>> {
    const headers = this.getAuthHeaders ? this.getAuthHeaders() : {};
    delete headers["Content-Type"];

    return this.makeRequest<T>(endpoint, {
      method: "POST",
      body: formData,
      headers,
    });
  }
}

export const apiClient = new ApiClient();

export const useApiClient = () => {
  const { getAuthHeaders, validateAndRefreshToken } = useAuth();

  if (!apiClient.isInitialized()) {
    apiClient.init(getAuthHeaders, validateAndRefreshToken);
  }

  return apiClient;
};

export const adminApi = {
  getAllUsers: () => apiClient.get("/api/admin/get-all-users"),
  createUser: (userData: any) =>
    apiClient.post("/api/admin/create-user", userData),
  updateUser: (userId: string, userData: any) =>
    apiClient.put(`/api/admin/update-user/${userId}`, userData),
  deleteUser: (userId: string) =>
    apiClient.delete(`/api/admin/delete-user/${userId}`),
  getAllOrgs: () => apiClient.get("/api/admin/get-all-orgs"),
  createOrg: (orgData: any) => apiClient.post("/api/admin/create-org", orgData),
  updateOrg: (orgId: string, orgData: any) =>
    apiClient.put(`/api/admin/update-org/${orgId}`, orgData),
  deleteOrg: (orgId: string) =>
    apiClient.delete(`/api/admin/delete-org/${orgId}`),
  getAllBatches: () => apiClient.get("/api/admin/fetch-all-batches"),
  createBatch: (batchData: any) =>
    apiClient.post("/api/admin/create-batch", batchData),
  updateBatch: (batchId: string, batchData: any) =>
    apiClient.put(`/api/admin/update-batch/${batchId}`, batchData),
  deleteBatch: (batchId: string) =>
    apiClient.delete(`/api/admin/delete-batch/${batchId}`),
  getJobs: () => apiClient.get("/api/admin/hiring/jobs"),
  createJob: (jobData: any) =>
    apiClient.post("/api/admin/hiring/jobs", jobData),
  updateJob: (jobId: string, jobData: any) =>
    apiClient.put(`/api/admin/hiring/jobs/${jobId}`, jobData),
  deleteJob: (jobId: string) =>
    apiClient.delete(`/api/admin/hiring/jobs/${jobId}`),
  getJobApplications: (jobId: string) =>
    apiClient.get(`/api/admin/hiring/jobs/${jobId}`),
  updateApplicationStatus: (applicationId: string, status: string) =>
    apiClient.put(`/api/admin/hiring/applications/${applicationId}/status`, {
      status,
    }),
};

export const studentApi = {
  getJobs: () => apiClient.get("/api/hiring/jobs"),
  applyForJob: (jobId: string, formData: FormData) =>
    apiClient.upload(`/api/hiring/jobs/${jobId}/apply`, formData),
  getMyApplications: () => apiClient.get("/api/hiring/applications"),
  getCourseProgress: () => apiClient.get("/api/courseProgress"),
  getSessionProgress: () => apiClient.get("/api/sessionProgress"),
};

export const instructorApi = {
  getCourses: () => apiClient.get("/api/instructor/courses"),
  createCourse: (courseData: any) =>
    apiClient.post("/api/instructor/courses", courseData),
  updateCourse: (courseId: string, courseData: any) =>
    apiClient.put(`/api/instructor/courses/${courseId}`, courseData),
  deleteCourse: (courseId: string) =>
    apiClient.delete(`/api/instructor/courses/${courseId}`),

  getBatches: () => apiClient.get("/api/instructor/batches"),
  createBatch: (batchData: any) =>
    apiClient.post("/api/instructor/batches", batchData),
};
