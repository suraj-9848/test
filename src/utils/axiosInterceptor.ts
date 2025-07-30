import axios, { AxiosRequestConfig, AxiosResponse, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { signOut, getSession } from 'next-auth/react';
import { clearAuthCache, isJWTExpired, getBackendJwt } from './auth';
import { BASE_URLS, API_ENDPOINTS, DOMAIN_MAPPINGS, getLMSUrl } from '../config/urls';

// Create axios instance with centralized base URL
const apiClient = axios.create({
  baseURL: BASE_URLS.BACKEND,
  timeout: 30000,
  withCredentials: true, // Important for cookies
});

// Helper function to get stored admin token
const getStoredAdminToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem('adminToken') || localStorage.getItem('adminToken');
};

// Helper function to store admin token
const storeAdminToken = (token: string) => {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem('adminToken', token);
};

// Helper function to get current view-as role
const getCurrentViewAsRole = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('admin_view_as_role');
};

// Helper function to get refresh token from cookies
const getRefreshTokenFromCookies = (): string | null => {
  if (typeof window === 'undefined') return null;
  
  // Parse cookies manually
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'refreshToken') {
      return decodeURIComponent(value);
    }
  }
  return null;
};

// Helper function to handle logout and redirect
const handleLogoutAndRedirect = async () => {
  console.log('🚪 All token refresh attempts failed, logging out and redirecting');
  
  try {
    // Call backend logout to clear refresh token
    await fetch(`${BASE_URLS.BACKEND}${API_ENDPOINTS.AUTH.LOGOUT}`, {
      method: 'POST',
      credentials: 'include',
    }).catch(() => {}); // Ignore errors
    
    // Clear auth cache
    clearAuthCache();
    
    // Clear stored tokens
    sessionStorage.removeItem('adminToken');
    sessionStorage.removeItem('adminUser');
    localStorage.removeItem('adminToken');
    
    // Sign out from NextAuth
    await signOut({ redirect: false });
    
    // Redirect to unified login using centralized URL helper
    const loginUrl = getLMSUrl();
    if (loginUrl) {
      window.location.href = `${loginUrl}/sign-in`;
    } else {
      // Fallback
      window.location.href = '/';
    }
  } catch (error) {
    console.error('Error during logout:', error);
    // Fallback - just redirect
    window.location.href = '/';
  }
};

// Helper function to attempt token refresh using refresh token
const attemptRefreshToken = async (): Promise<string | null> => {
  try {
    console.log('🔄 Attempting to refresh token using refresh token...');
    
    // Get refresh token from cookies
    const refreshToken = getRefreshTokenFromCookies();
    
    if (!refreshToken) {
      console.log('❌ No refresh token found in cookies');
      return null;
    }
    
    // Call refresh endpoint using centralized URL
    const response = await fetch(`${BASE_URLS.BACKEND}${API_ENDPOINTS.AUTH.REFRESH}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Include cookies
      body: JSON.stringify({ refreshToken }),
    });
    
    if (response.ok) {
      const data = await response.json();
      
      if (data.token) {
        console.log('✅ Token refreshed successfully using refresh token');
        storeAdminToken(data.token);
        return data.token;
      }
    } else {
      console.log('❌ Refresh token request failed:', response.status, response.statusText);
      const errorData = await response.json().catch(() => ({}));
      console.log('Refresh error details:', errorData);
    }
    
    return null;
  } catch (error) {
    console.error('❌ Refresh token request error:', error);
    return null;
  }
};

// Helper function to attempt token refresh using Google OAuth (fallback)
const attemptGoogleTokenRefresh = async (): Promise<string | null> => {
  try {
    console.log('🔄 Attempting to refresh token using Google OAuth as fallback...');
    
    // Get fresh token using our smart auth utility
    const newToken = await getBackendJwt();
    
    if (newToken && !isJWTExpired(newToken)) {
      console.log('✅ Token refreshed successfully using Google OAuth');
      storeAdminToken(newToken);
      return newToken;
    } else {
      console.log('❌ Google OAuth token refresh failed - token invalid or expired');
      return null;
    }
  } catch (error) {
    console.error('❌ Google OAuth token refresh failed:', error);
    return null;
  }
};

// Request interceptor - Add authorization header and handle pre-flight token checks
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    let token = getStoredAdminToken();
    
    // If no stored token, try to get one via Google OAuth
    if (!token) {
      try {
        token = await getBackendJwt();  
        if (token) {
          storeAdminToken(token);
        }
      } catch (error) {
        console.log('No valid token available for request');
      }
    }
    
    if (token) {
      // Check if token is expired before making request
      if (isJWTExpired(token)) {
        console.log('⚠️ JWT expired before request, attempting refresh...');
        
        // Try refresh token first, then Google OAuth as fallback
        const refreshedToken = await attemptRefreshToken() || await attemptGoogleTokenRefresh();
        
        if (refreshedToken) {
          token = refreshedToken;
        } else {
          // Both refresh methods failed, logout user
          await handleLogoutAndRedirect();
          return Promise.reject(new Error('Token expired and refresh failed'));
        }
      }
      
      // Add token to request header
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
      
      // Add view-as role header for admin users
      const viewAsRole = getCurrentViewAsRole();
      
      if (viewAsRole && viewAsRole !== 'admin') {
        config.headers['X-View-As-Role'] = viewAsRole;
      }
    }
    
    return config;
  },
  (error: AxiosError) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor - Handle token expiry and authentication errors
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Request successful, return response
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
    
    // Check if error is due to token expiry/invalidity
    if (error.response?.status === 401 && !originalRequest._retry) {
      const errorData = error.response.data as any;
      
      // Check if it's a token-related error
      if (
        errorData?.error?.includes('Token expired') ||
        errorData?.error?.includes('Invalid token') ||
        errorData?.error?.includes('Unauthorized') ||
        errorData?.code === 'TOKEN_EXPIRED' ||
        errorData?.message?.includes('jwt expired')
      ) {
        console.log('🔄 Received 401 error, attempting token refresh...');
        
        // Mark request as retried to prevent infinite loops
        originalRequest._retry = true;
        
        try {
          // Try refresh token first, then Google OAuth as fallback
          let refreshedToken = await attemptRefreshToken();
          
          // If refresh token fails, try Google OAuth
          if (!refreshedToken) {
            refreshedToken = await attemptGoogleTokenRefresh();
          }
          
          if (refreshedToken) {
            // Update the original request with new token
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${refreshedToken}`;
            }
            
            // Retry the original request
            console.log('🔄 Retrying original request with refreshed token');
            return apiClient(originalRequest);
          } else {
            // Both refresh methods failed, logout user
            await handleLogoutAndRedirect();
            return Promise.reject(new Error('Authentication expired. Redirecting to login.'));
          }
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
          await handleLogoutAndRedirect();
          return Promise.reject(new Error('Authentication expired. Redirecting to login.'));
        }
      }
    }
    
    // Handle other errors normally
    console.error('API Request failed:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message: error.message,
      data: error.response?.data,
    });
    
    return Promise.reject(error);
  }
);

// Export the configured axios instance
export default apiClient;

// Export helper functions for use in components
export { 
  getStoredAdminToken, 
  handleLogoutAndRedirect, 
  attemptRefreshToken,
  attemptGoogleTokenRefresh
}; 