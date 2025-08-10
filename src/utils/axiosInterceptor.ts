import axios, {
  AxiosRequestConfig,
  AxiosResponse,
  AxiosError,
  InternalAxiosRequestConfig,
} from "axios";
import { signOut } from "next-auth/react";
import { clearAuthCache, isJWTExpired, getBackendJwt } from "./auth";
import { BASE_URLS, API_ENDPOINTS, getLMSUrl } from "../config/urls";

// Interface for error response data
interface ErrorResponseData {
  error?: string;
  message?: string;
  code?: string;
}

// Create axios instance with centralized base URL
const apiClient = axios.create({
  baseURL: BASE_URLS.BACKEND,
  timeout: 30000,
  withCredentials: true, // Important for cookies
});

// Helper function to get stored admin token
const getStoredAdminToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return (
    sessionStorage.getItem("adminToken") || localStorage.getItem("adminToken")
  );
};

// Helper function to store admin token
const storeAdminToken = (token: string) => {
  if (typeof window === "undefined") return;
  sessionStorage.setItem("adminToken", token);
};

// Helper function to get current view-as role
const getCurrentViewAsRole = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("admin_view_as_role");
};

// Helper function to get refresh token from cookies
const getRefreshTokenFromCookies = (): string | null => {
  if (typeof window === "undefined") return null;

  // Parse cookies manually
  const cookies = document.cookie.split(";");
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split("=");
    if (name === "refreshToken") {
      return decodeURIComponent(value);
    }
  }
  return null;
};

// Helper function to handle logout and redirect
const handleLogoutAndRedirect = async () => {
  console.log(
    "🚪 All token refresh attempts failed, logging out and redirecting",
  );

  try {
    // Call backend logout to clear refresh token
    await fetch(`${BASE_URLS.BACKEND}${API_ENDPOINTS.AUTH.LOGOUT}`, {
      method: "POST",
      credentials: "include",
    }).catch(() => {}); // Ignore errors

    // Clear auth cache
    clearAuthCache();

    // Clear stored tokens
    sessionStorage.removeItem("adminToken");
    sessionStorage.removeItem("adminUser");
    localStorage.removeItem("adminToken");

    // Sign out from NextAuth
    await signOut({ redirect: false });

    // Redirect to unified login using centralized URL helper
    const loginUrl = getLMSUrl();
    if (loginUrl) {
      window.location.href = `${loginUrl}/sign-in`;
    } else {
      // Fallback
      window.location.href = "/";
    }
  } catch (error) {
    console.error("Error during logout:", error);
    // Fallback - just redirect
    window.location.href = "/";
  }
};

// Helper function to attempt token refresh using refresh token
const attemptRefreshToken = async (): Promise<string | null> => {
  try {
    console.log("🔄 Attempting to refresh token using refresh token...");

    // Get refresh token from cookies
    const refreshToken = getRefreshTokenFromCookies();

    if (!refreshToken) {
      console.log(" No refresh token found in cookies");
      return null;
    }

    // Call refresh endpoint using centralized URL
    const response = await fetch(
      `${BASE_URLS.BACKEND}${API_ENDPOINTS.AUTH.REFRESH}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Include cookies
        body: JSON.stringify({ refreshToken }),
      },
    );

    if (response.ok) {
      const data = await response.json();

      if (data.token) {
        console.log(" Token refreshed successfully using refresh token");
        storeAdminToken(data.token);
        return data.token;
      }
    } else {
      console.log(
        " Refresh token request failed:",
        response.status,
        response.statusText,
      );
      const errorData = await response.json().catch(() => ({}));
      console.log("Refresh error details:", errorData);
    }

    return null;
  } catch (error) {
    console.error(" Refresh token request error:", error);
    return null;
  }
};

// Helper function to attempt token refresh using Google OAuth (fallback)
const attemptGoogleTokenRefresh = async (): Promise<string | null> => {
  try {
    console.log(
      "🔄 Attempting to refresh token using Google OAuth as fallback...",
    );

    // Get fresh token using our smart auth utility
    const newToken = await getBackendJwt();

    if (newToken && !isJWTExpired(newToken)) {
      console.log(" Token refreshed successfully using Google OAuth");
      storeAdminToken(newToken);
      return newToken;
    } else {
      console.log(
        " Google OAuth token refresh failed - token invalid or expired",
      );
      return null;
    }
  } catch (error) {
    console.error(" Google OAuth token refresh failed:", error);
    return null;
  }
};

// Request interceptor - Add authorization header and handle pre-flight token checks
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const startTime = Date.now();
    const requestId = Math.random().toString(36).substr(2, 9);

    // Add request tracking
    (config as unknown as Record<string, unknown>)["_requestId"] = requestId;
    (config as unknown as Record<string, unknown>)["_startTime"] = startTime;

    // Log all outgoing requests with detailed info
    const isAnalyticsCall =
      config.url?.includes("analytics") ||
      config.url?.includes("progress") ||
      config.url?.includes("students") ||
      config.url?.includes("tests");
    const logPrefix = isAnalyticsCall ? "📊 ANALYTICS API" : "🌐 API";

    console.log(`${logPrefix} REQUEST [${requestId}]:`, {
      method: config.method?.toUpperCase(),
      url: config.url,
      fullURL: `${config.baseURL}${config.url}`,
      headers: {
        ...config.headers,
        Authorization: config.headers?.Authorization
          ? "[PRESENT]"
          : "[MISSING]",
      },
      timestamp: new Date().toISOString(),
      isAnalytics: isAnalyticsCall,
    });

    let token = getStoredAdminToken();

    // If no stored token, try to get one via Google OAuth
    if (!token) {
      console.log(
        `${logPrefix} [${requestId}]: No stored token, attempting to get via Google OAuth...`,
      );
      try {
        token = await getBackendJwt();
        if (token) {
          storeAdminToken(token);
          console.log(
            `${logPrefix} [${requestId}]:  Got token via Google OAuth`,
          );
        }
      } catch (error) {
        console.log(
          `${logPrefix} [${requestId}]:  No valid token available for request:`,
          error,
        );
      }
    }

    if (token) {
      // Check if token is expired before making request
      if (isJWTExpired(token)) {
        console.log(
          `${logPrefix} [${requestId}]: ⚠️ JWT expired before request, attempting refresh...`,
        );

        // Try refresh token first, then Google OAuth as fallback
        const refreshedToken =
          (await attemptRefreshToken()) || (await attemptGoogleTokenRefresh());

        if (refreshedToken) {
          token = refreshedToken;
          console.log(
            `${logPrefix} [${requestId}]:  Token refreshed successfully`,
          );
        } else {
          console.log(
            `${logPrefix} [${requestId}]:  Token refresh failed, logging out`,
          );
          // Both refresh methods failed, logout user
          await handleLogoutAndRedirect();
          return Promise.reject(new Error("Token expired and refresh failed"));
        }
      }

      // Add token to request header
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;

      // Add view-as role header for admin users
      const viewAsRole = getCurrentViewAsRole();

      if (viewAsRole && viewAsRole !== "admin") {
        config.headers["X-View-As-Role"] = viewAsRole;
        console.log(
          `${logPrefix} [${requestId}]: Adding view-as role header: ${viewAsRole}`,
        );
      }

      console.log(
        `${logPrefix} [${requestId}]:  Request prepared with auth token`,
      );
    } else {
      console.log(
        `${logPrefix} [${requestId}]: ⚠️ No token available for request`,
      );
    }

    return config;
  },
  (error: AxiosError) => {
    console.warn(" Request interceptor error:", error);
    return Promise.reject(error);
  },
);

// Response interceptor - Handle token expiry and authentication errors
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Extract request tracking info
    const requestId = (response.config as unknown as Record<string, unknown>)[
      "_requestId"
    ];
    const startTime = (response.config as unknown as Record<string, unknown>)[
      "_startTime"
    ];
    const duration = typeof startTime === "number" ? Date.now() - startTime : 0;

    // Log response details
    const isAnalyticsCall =
      response.config.url?.includes("analytics") ||
      response.config.url?.includes("progress") ||
      response.config.url?.includes("students") ||
      response.config.url?.includes("tests");
    const logPrefix = isAnalyticsCall ? "📊 ANALYTICS API" : "🌐 API";

    console.log(`${logPrefix} RESPONSE [${requestId}]:`, {
      status: response.status,
      statusText: response.statusText,
      url: response.config.url,
      method: response.config.method?.toUpperCase(),
      duration: `${duration}ms`,
      dataSize: response.data ? JSON.stringify(response.data).length : 0,
      timestamp: new Date().toISOString(),
      isAnalytics: isAnalyticsCall,
    });

    // Log response data for analytics calls (truncated for readability)
    if (isAnalyticsCall) {
      console.log(`${logPrefix} DATA [${requestId}]:`, {
        dataType: typeof response.data,
        dataKeys:
          response.data && typeof response.data === "object"
            ? Object.keys(response.data)
            : "N/A",
        dataPreview:
          response.data && typeof response.data === "object"
            ? JSON.stringify(response.data).substring(0, 200) + "..."
            : response.data,
      });
    }

    return response;
  },
  async (error: AxiosError) => {
    // Extract request tracking info
    const requestId = (error.config as unknown as Record<string, unknown>)[
      "_requestId"
    ];
    const startTime = (error.config as unknown as Record<string, unknown>)[
      "_startTime"
    ];
    const duration = typeof startTime === "number" ? Date.now() - startTime : 0;

    const originalRequest = error.config as AxiosRequestConfig & {
      _retry?: boolean;
    };
    const isAnalyticsCall =
      error.config?.url?.includes("analytics") ||
      error.config?.url?.includes("progress") ||
      error.config?.url?.includes("students") ||
      error.config?.url?.includes("tests");
    const logPrefix = isAnalyticsCall ? "📊 ANALYTICS API" : "🌐 API";

    // Log detailed error information (warn to avoid Next.js error overlay)
    console.warn(`${logPrefix} ERROR [${requestId}]:`, {
      url: error.config?.url,
      method:
        (error.config?.method || "").toUpperCase?.() || error.config?.method,
      status: error.response?.status,
      statusText: error.response?.statusText,
      duration: `${duration}ms`,
      message: error.message,
      errorType: error.name,
      responseData: error.response?.data,
      timestamp: new Date().toISOString(),
      isAnalytics: isAnalyticsCall,
    });

    // Check if error is due to token expiry/invalidity
    if (error.response?.status === 401 && !originalRequest._retry) {
      const errorData = error.response.data as ErrorResponseData;

      // Check if it's a token-related error
      if (
        errorData?.error?.includes("Token expired") ||
        errorData?.error?.includes("Invalid token") ||
        errorData?.error?.includes("Unauthorized") ||
        errorData?.code === "TOKEN_EXPIRED" ||
        errorData?.message?.includes("jwt expired")
      ) {
        console.log(
          `${logPrefix} [${requestId}]: 🔄 Received 401 error, attempting token refresh...`,
        );

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
            console.log(
              `${logPrefix} [${requestId}]: 🔄 Retrying original request with refreshed token`,
            );
            return apiClient(originalRequest);
          } else {
            // Both refresh methods failed, logout user
            console.log(
              `${logPrefix} [${requestId}]:  Both refresh methods failed, logging out`,
            );
            await handleLogoutAndRedirect();
            return Promise.reject(
              new Error("Authentication expired. Redirecting to login."),
            );
          }
        } catch (refreshError) {
          console.warn(
            `${logPrefix} [${requestId}]: Token refresh failed:`,
            refreshError,
          );
          await handleLogoutAndRedirect();
          return Promise.reject(
            new Error("Authentication expired. Redirecting to login."),
          );
        }
      }
    }

    return Promise.reject(error);
  },
);

// Export the configured axios instance
export default apiClient;

// Export helper functions for use in components
export {
  getStoredAdminToken,
  handleLogoutAndRedirect,
  attemptRefreshToken,
  attemptGoogleTokenRefresh,
};
