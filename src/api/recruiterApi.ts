import apiClient from "../utils/axiosInterceptor";
import { API_ENDPOINTS } from "../config/urls";

export const recruiterApi = {
  // Dashboard stats
  getDashboardStats: async () => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.RECRUITER.DASHBOARD);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 403) {
        throw new Error(
          error.response.data?.message ||
            "Access denied. Recruiter role required.",
        );
      }
      console.error("Error fetching dashboard stats:", error);
      throw error;
    }
  },

  getCandidateInsights: async () => {
    try {
      const response = await apiClient.get(
        API_ENDPOINTS.RECRUITER.CANDIDATE_INSIGHTS,
      );
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 403) {
        throw new Error(
          error.response.data?.message ||
            "Access denied. Recruiter role required.",
        );
      }
      console.error("Error fetching candidate insights:", error);
      throw error;
    }
  },

  // Jobs
  getJobs: async (query = {}) => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.RECRUITER.JOBS, {
        params: query,
      });
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 403) {
        throw new Error(
          error.response.data?.message ||
            "Access denied. Recruiter role required.",
        );
      }
      console.error("Error fetching jobs:", error);
      throw error;
    }
  },

  getJob: async (jobId: string) => {
    try {
      const url = API_ENDPOINTS.RECRUITER.JOB_BY_ID(jobId);
      const response = await apiClient.get(url);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 403) {
        throw new Error(
          error.response.data?.message ||
            "Access denied. Recruiter role required.",
        );
      }
      console.error("Error fetching job details:", error);
      throw error;
    }
  },

  createJob: async (jobData: Record<string, unknown>) => {
    try {
      const response = await apiClient.post(
        API_ENDPOINTS.RECRUITER.JOBS,
        jobData,
      );
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 403) {
        throw new Error(
          error.response.data?.message ||
            "Access denied. Recruiter role required.",
        );
      }
      console.error("Error creating job:", error);
      throw error;
    }
  },

  updateJob: async (jobId: string, jobData: Record<string, unknown>) => {
    try {
      const url = API_ENDPOINTS.RECRUITER.JOB_BY_ID(jobId);
      const response = await apiClient.put(url, jobData);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 403) {
        throw new Error(
          error.response.data?.message ||
            "Access denied. Recruiter role required.",
        );
      }
      console.error("Error updating job:", error);
      throw error;
    }
  },

  deleteJob: async (jobId: string) => {
    try {
      const url = API_ENDPOINTS.RECRUITER.JOB_BY_ID(jobId);
      const response = await apiClient.delete(url);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 403) {
        throw new Error(
          error.response.data?.message ||
            "Access denied. Recruiter role required.",
        );
      }
      console.error("Error deleting job:", error);
      throw error;
    }
  },

  // Applications
  getApplications: async () => {
    try {
      const response = await apiClient.get(
        API_ENDPOINTS.RECRUITER.APPLICATIONS,
      );
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 403) {
        throw new Error(
          error.response.data?.message ||
            "Access denied. Recruiter role required.",
        );
      }
      console.error("Error fetching applications:", error);
      throw error;
    }
  },

  // Subscriptions
  getSubscriptions: async () => {
    try {
      const response = await apiClient.get(
        API_ENDPOINTS.RECRUITER.SUBSCRIPTIONS,
      );
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 403) {
        throw new Error(
          error.response.data?.message ||
            "Access denied. Recruiter role required.",
        );
      }
      console.error("Error fetching subscriptions:", error);
      throw error;
    }
  },

  createSubscription: async (subscriptionData: Record<string, unknown>) => {
    try {
      const response = await apiClient.post(
        API_ENDPOINTS.RECRUITER.SUBSCRIPTIONS,
        subscriptionData,
      );
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 403) {
        throw new Error(
          error.response.data?.message ||
            "Access denied. Recruiter role required.",
        );
      }
      console.error("Error creating subscription:", error);
      throw error;
    }
  },

  updateSubscription: async (
    subscriptionId: string,
    subscriptionData: Record<string, unknown>,
  ) => {
    try {
      const url = API_ENDPOINTS.RECRUITER.SUBSCRIPTION_BY_ID(subscriptionId);
      const response = await apiClient.put(url, subscriptionData);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 403) {
        throw new Error(
          error.response.data?.message ||
            "Access denied. Recruiter role required.",
        );
      }
      console.error("Error updating subscription:", error);
      throw error;
    }
  },

  deleteSubscription: async (subscriptionId: string) => {
    try {
      const url = API_ENDPOINTS.RECRUITER.SUBSCRIPTION_BY_ID(subscriptionId);
      const response = await apiClient.delete(url);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 403) {
        throw new Error(
          error.response.data?.message ||
            "Access denied. Recruiter role required.",
        );
      }
      console.error("Error deleting subscription:", error);
      throw error;
    }
  },

  // Recruiter Users
  getRecruiterUsers: async (proOnly = false) => {
    try {
      const response = await apiClient.get(
        proOnly
          ? `${API_ENDPOINTS.RECRUITER.USERS}?pro=1`
          : API_ENDPOINTS.RECRUITER.USERS,
      );
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 403) {
        throw new Error(
          error.response.data?.message ||
            "Access denied. Recruiter role required.",
        );
      }
      console.error("Error fetching recruiter users:", error);
      throw error;
    }
  },
};
