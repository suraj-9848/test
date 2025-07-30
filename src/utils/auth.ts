import axios from "axios";
import { getSession } from "next-auth/react";

const baseUrl = process.env.NEXT_PUBLIC_BACKEND_BASE_URL || "";

// JWT utilities for client-side validation
interface JWTPayload {
  id: string;
  username: string;
  userRole: string;
  email: string;
  exp: number;
  iat: number;
  iss: string;
  aud: string;
}

/**
 * Decode JWT token without verification (client-side only)
 * Note: This is safe for role-based UI logic but should never be trusted for security decisions
 */
export const decodeJWT = (token: string): JWTPayload | null => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Failed to decode JWT:', error);
    return null;
  }
};

/**
 * Check if JWT token is expired
 */
export const isJWTExpired = (token: string): boolean => {
  const payload = decodeJWT(token);
  if (!payload) return true;
  
  const currentTime = Math.floor(Date.now() / 1000);
  return payload.exp < currentTime;
};

/**
 * Check if JWT token will expire soon (within 2 minutes)
 */
export const isJWTExpiringSoon = (token: string): boolean => {
  const payload = decodeJWT(token);
  if (!payload) return true;
  
  const currentTime = Math.floor(Date.now() / 1000);
  const bufferTime = 2 * 60; // 2 minutes
  return payload.exp < (currentTime + bufferTime);
};

/**
 * Extract user role from JWT token
 */
export const getUserRoleFromJWT = (token: string): string | null => {
  const payload = decodeJWT(token);
  return payload?.userRole || null;
};

/**
 * Extract user info from JWT token
 */
export const getUserInfoFromJWT = (token: string) => {
  const payload = decodeJWT(token);
  if (!payload) return null;
  
  return {
    id: payload.id,
    username: payload.username,
    email: payload.email,
    userRole: payload.userRole,
  };
};

// In-memory token cache (no persistence for security)
let cachedBackendJwt: string = "";
let lastTokenFetch: number = 0;
const TOKEN_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Get backend JWT with intelligent caching and validation
 */
export const getBackendJwt = async (): Promise<string> => {
  const now = Date.now();
  
  // Check if we have a valid cached token
  if (cachedBackendJwt && (now - lastTokenFetch) < TOKEN_CACHE_DURATION) {
    if (!isJWTExpired(cachedBackendJwt) && !isJWTExpiringSoon(cachedBackendJwt)) {
      return cachedBackendJwt;
    }
  }

  // Fallback: check sessionStorage (for apiClient compatibility)
  if (typeof window !== 'undefined') {
    const storedToken = sessionStorage.getItem('adminToken');
    if (storedToken && !isJWTExpired(storedToken) && !isJWTExpiringSoon(storedToken)) {
      cachedBackendJwt = storedToken;
      lastTokenFetch = now;
      return cachedBackendJwt;
    }
  }

  // Clear expired/invalid token
  cachedBackendJwt = "";
  
  const session = await getSession();
  if (!session) {
    throw new Error("No session found - user not logged in");
  }

  const googleIdToken = (session as { id_token?: string })?.id_token;
  if (!googleIdToken) {
    throw new Error("No Google ID token found in session");
  }

  try {
    console.log('🔑 Fetching new backend JWT (cached token expired/missing)');
    const loginRes = await axios.post(
      `${baseUrl}/api/auth/admin-login`,
      {},
      {
        headers: { Authorization: `Bearer ${googleIdToken}` },
        withCredentials: true,
      }
    );
    
    cachedBackendJwt = loginRes.data.token;
    lastTokenFetch = now;
    
    // Also store in sessionStorage for apiClient interceptor
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('adminToken', cachedBackendJwt);
    }
    
    console.log('✅ New backend JWT obtained and cached');
    return cachedBackendJwt;
  } catch (err) {
    console.error("Failed to authenticate with backend", err);
    throw new Error("Failed to authenticate with backend");
  }
};

/**
 * Get user role from cached JWT or fetch new one
 */
export const getUserRole = async (): Promise<string | null> => {
  try {
    // Try to get role from cached token first
    if (cachedBackendJwt && !isJWTExpired(cachedBackendJwt)) {
      return getUserRoleFromJWT(cachedBackendJwt);
    }
    
    // If no valid cached token, fetch new one
    const jwt = await getBackendJwt();
    return getUserRoleFromJWT(jwt);
  } catch (error) {
    console.error('Failed to get user role:', error);
    return null;
  }
};

/**
 * Get user info from cached JWT or fetch new one
 */
export const getUserInfo = async () => {
  try {
    // Try to get info from cached token first
    if (cachedBackendJwt && !isJWTExpired(cachedBackendJwt)) {
      return getUserInfoFromJWT(cachedBackendJwt);
    }
    
    // If no valid cached token, fetch new one
    const jwt = await getBackendJwt();
    return getUserInfoFromJWT(jwt);
  } catch (error) {
    console.error('Failed to get user info:', error);
    return null;
  }
};

/**
 * Check if user has admin/recruiter role (client-side check for UI only)
 */
export const hasAdminRole = async (): Promise<boolean> => {
  const role = await getUserRole();
  return role ? ['admin', 'recruiter'].includes(role.toLowerCase()) : false;
};

/**
 * Check if user has instructor role (client-side check for UI only)
 */
export const hasInstructorRole = async (): Promise<boolean> => {
  const role = await getUserRole();
  return role ? role.toLowerCase() === 'instructor' : false;
};

/**
 * Clear cached token (for logout)
 */
export const clearAuthCache = () => {
  cachedBackendJwt = "";
  lastTokenFetch = 0;
  
  // Also clear sessionStorage for apiClient compatibility
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('adminToken');
    sessionStorage.removeItem('adminUser');
  }
};

export const getAuthHeaders = async () => {
  const jwt = await getBackendJwt();
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${jwt}`,
  };
};

// Legacy function for backward compatibility - now uses smart caching
export const validateOAuthUser = async (googleToken: string) => {
  try {
    // First check if we have a valid cached JWT
    if (cachedBackendJwt && !isJWTExpired(cachedBackendJwt)) {
      const userInfo = getUserInfoFromJWT(cachedBackendJwt);
      if (userInfo) {
        console.log('✅ Using cached JWT for validation');
        return {
          valid: true,
          user: userInfo,
          token: cachedBackendJwt,
        };
      }
    }
    
    // If no valid cached token, make API call
    console.log('🔑 Making API call for user validation');
    const response = await axios.post(
      `${baseUrl}/api/auth/admin-login`,
      {},
      {
        headers: { Authorization: `Bearer ${googleToken}` },
        withCredentials: true,
      }
    );
    
    cachedBackendJwt = response.data.token;
    lastTokenFetch = Date.now();
    
    return {
      valid: true,
      user: response.data.user,
      token: response.data.token,
    };
  } catch (error: any) {
    console.error('OAuth validation failed:', error);
    return {
      valid: false,
      error: error.response?.data || error.message,
    };
  }
};
