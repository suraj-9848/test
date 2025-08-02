/**
 * Simple API client stub to prevent build errors
 * This file is kept for compatibility but functionality has been moved to src/utils/axiosInterceptor.ts
 */

import { useAuth } from "../src/contexts/AuthContext";

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
  get(): Promise<any> {
    return Promise.resolve({});
  }

  post(): Promise<any> {
    return Promise.resolve({});
  }

  put(): Promise<any> {
    return Promise.resolve({});
  }

  delete(): Promise<any> {
    return Promise.resolve({});
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
    get: () => apiClient.get(),
    post: () => apiClient.post(),
    put: () => apiClient.put(),
    delete: () => apiClient.delete(),
  };
};

export default apiClient;
