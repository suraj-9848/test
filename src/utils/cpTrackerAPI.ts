import apiClient from "../utils/axiosInterceptor";
import { buildApiUrl, API_ENDPOINTS } from "../config/urls";
import {
  CPTrackerLeaderboard,
  CPTrackerProfile,
  CPTrackerConnection,
  CPTrackerApiResponse,
} from "../types/cptracker";

export class CPTrackerAPI {
  static async refreshAllCPTrackers(): Promise<void> {
    const url = buildApiUrl(API_ENDPOINTS.CP_TRACKER.ADMIN_REFRESH_ALL);
    await apiClient.post(url);
  }

  static async getCPTrackerLeaderboard(filters?: {
    batch?: string;
    sortBy?: string;
    sortOrder?: string;
    limit?: number;
    offset?: number;
    page?: number;
  }): Promise<{
    leaderboard: CPTrackerLeaderboard[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      itemsPerPage: number;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
      offset: number;
    };
  }> {
    const params = new URLSearchParams();
    if (filters?.batch) params.append("batch_id", filters.batch);
    if (filters?.sortBy) params.append("sortBy", filters.sortBy);
    if (filters?.sortOrder) params.append("sortOrder", filters.sortOrder);
    if (filters?.limit) params.append("limit", filters.limit.toString());
    if (filters?.page) params.append("page", filters.page.toString());
    if (filters?.offset) params.append("offset", filters.offset.toString());
    const url = `${API_ENDPOINTS.CP_TRACKER.ALL}${params.toString() ? "?" + params.toString() : ""}`;
    const res = await apiClient.get(url);
    if (!res.data.success) {
      throw new Error(res.data.message || "Failed to fetch leaderboard");
    }
    return {
      leaderboard: res.data.data?.leaderboard || [],
      pagination: res.data.data?.pagination || {
        currentPage: 1,
        totalPages: 0,
        totalItems: 0,
        itemsPerPage: filters?.limit || 50,
        hasNextPage: false,
        hasPreviousPage: false,
        offset: 0,
      },
    };
  }

  // Get all CPTrackers with pagination (Admin only)
  static async getAllCPTrackers(filters?: {
    batch?: string;
    is_active?: boolean;
    platform?: string;
    search?: string;
    limit?: number;
    page?: number;
    offset?: number;
  }): Promise<{
    trackers: any[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      itemsPerPage: number;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
      offset: number;
    };
  }> {
    const params = new URLSearchParams();
    if (filters?.batch) params.append("batch_id", filters.batch);
    if (filters?.is_active !== undefined)
      params.append("is_active", filters.is_active.toString());
    if (filters?.platform) params.append("platform", filters.platform);
    if (filters?.search) params.append("search", filters.search);
    if (filters?.limit) params.append("limit", filters.limit.toString());
    if (filters?.page) params.append("page", filters.page.toString());
    if (filters?.offset) params.append("offset", filters.offset.toString());
    const url = `${API_ENDPOINTS.CP_TRACKER.ALL}${params.toString() ? "?" + params.toString() : ""}`;
    const res = await apiClient.get(url);
    if (!res.data.success) {
      throw new Error(res.data.message || "Failed to fetch CP trackers");
    }
    return {
      trackers: res.data.data?.trackers || [],
      pagination: res.data.data?.pagination || {
        currentPage: 1,
        totalPages: 0,
        totalItems: 0,
        itemsPerPage: filters?.limit || 100,
        hasNextPage: false,
        hasPreviousPage: false,
        offset: 0,
      },
    };
  }

  static async deleteCPTrackerByUserId(userId: string): Promise<void> {
    const url = buildApiUrl(API_ENDPOINTS.CP_TRACKER.USER_BY_ID(userId));
    await apiClient.delete(url);
  }

  static async getCPTrackerByUserId(userId: string): Promise<CPTrackerProfile> {
    const url = buildApiUrl(API_ENDPOINTS.CP_TRACKER.USER_BY_ID(userId));
    const res = await apiClient.get(url);
    return res.data.data;
  }

  static async updateCPTrackerByUserId(
    userId: string,
    data: CPTrackerConnection,
  ): Promise<CPTrackerProfile> {
    const url = buildApiUrl(API_ENDPOINTS.CP_TRACKER.UPDATE_USER(userId));
    const res = await apiClient.put(url, data);
    return res.data.data;
  }

  static async refreshCPTrackerByUserId(
    userId: string,
  ): Promise<CPTrackerApiResponse> {
    const url = buildApiUrl(API_ENDPOINTS.CP_TRACKER.REFRESH_USER(userId));
    const res = await apiClient.post(url);
    return res.data;
  }
}
