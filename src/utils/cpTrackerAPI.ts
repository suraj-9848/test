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
    // This endpoint should trigger a refresh for all users (admin/instructor only)
    const url = buildApiUrl(API_ENDPOINTS.CP_TRACKER.ADMIN_REFRESH_ALL);
    await apiClient.post(url);
  }
  static async getCPTrackerLeaderboard(): Promise<CPTrackerLeaderboard[]> {
    const url = buildApiUrl(API_ENDPOINTS.CP_TRACKER.ALL);
    const res = await apiClient.get(url);
    // Support both array and paginated object { trackers: [] }
    if (Array.isArray(res.data.data)) {
      return res.data.data;
    } else if (res.data.data && Array.isArray(res.data.data.trackers)) {
      return res.data.data.trackers;
    } else {
      return [];
    }
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
