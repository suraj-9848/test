/**
 * Simple API client stub to prevent build errors
 * This file is kept for compatibility but functionality has been moved to axiosInterceptor.ts
 */

import axios from "axios";
import { useAuth } from "../contexts/AuthContext";

// Simple stub class to prevent build errors
class ApiClient {
  private initialized = false;

  isInitialized(): boolean {
    return this.initialized;
  }

  init(): void {
    this.initialized = true;
    console.log("ApiClient initialized (stub implementation)");
  }

  // Stub methods
  get(url: string, config?: any) {
    return axios.get(url, config);
  }

  post(url: string, data?: any, config?: any) {
    return axios.post(url, data, config);
  }

  put(url: string, data?: any, config?: any) {
    return axios.put(url, data, config);
  }

  delete(url: string, config?: any) {
    return axios.delete(url, config);
  }
}

// Create a singleton instance
const apiClient = new ApiClient();

// Hook for using the API client (stub implementation)
export const useApiClient = () => {
  const { isAuthenticated } = useAuth();

  if (!apiClient.isInitialized() && isAuthenticated) {
    apiClient.init();
  }

  return {
    get: (url: string, config?: any) => apiClient.get(url, config),
    post: (url: string, data?: any, config?: any) =>
      apiClient.post(url, data, config),
    put: (url: string, data?: any, config?: any) =>
      apiClient.put(url, data, config),
    delete: (url: string, config?: any) => apiClient.delete(url, config),
  };
};

export default apiClient;
