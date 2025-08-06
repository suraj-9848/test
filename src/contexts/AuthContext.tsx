"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  getUserInfo,
  getUserRole,
  hasAdminRole,
  hasInstructorRole,
  clearAuthCache,
  getBackendJwt,
  isJWTExpired,
  decodeJWT,
  getUserInfoFromJWT,
} from "../utils/auth";
import apiClient from "../utils/axiosInterceptor";
import { API_ENDPOINTS } from "../config/urls";

interface User {
  id: string;
  username: string;
  email: string;
  userRole: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  backendToken: string | null;
}

interface AuthContextType extends AuthState {
  login: (credentials: { email: string; password: string }) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  validateAndRefreshToken: () => Promise<string | null>;
  hasAdminAccess: () => Promise<boolean>;
  hasInstructorAccess: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// Auth Provider Component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Use sessionStorage to persist redirect state across page loads
  const [hasRedirected, setHasRedirected] = useState(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("auth_redirected") === "true";
    }
    return false;
  });

  // Clear redirect flag on logout or auth failure
  useEffect(() => {
    if (status === "unauthenticated") {
      setHasRedirected(false);
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("auth_redirected");
      }
    }
  }, [status]);

  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
    error: null,
    backendToken: null,
  });

  // Smart token validation - uses cached JWT if valid, otherwise fetches new one
  const validateAndRefreshToken = useCallback(async (): Promise<
    string | null
  > => {
    try {
      const jwt = await getBackendJwt();
      return jwt;
    } catch (error) {
      console.error("Token validation/refresh failed:", error);
      return null;
    }
  }, []);

  // Main authentication check (called once per session and when needed)
  const checkAuth = useCallback(async () => {
    if (status === "loading") return;

    console.log("🔍 [AUTH CONTEXT] Checking authentication status...");
    console.log("🔍 [AUTH CONTEXT] Session status:", status);
    console.log("🔍 [AUTH CONTEXT] Has session:", !!session);
    console.log("🔍 [AUTH CONTEXT] Has id_token:", !!session?.id_token);

    setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // No session = not authenticated, but don't try to authenticate
      if (status === "unauthenticated" || !session?.id_token) {
        console.log(
          "🔍 [AUTH CONTEXT] No valid session found - setting unauthenticated state",
        );
        setAuthState({
          user: null,
          isLoading: false,
          isAuthenticated: false,
          error: null,
          backendToken: null,
        });
        return;
      }

      // Check if we already have valid cached user info
      if (
        authState.backendToken &&
        !isJWTExpired(authState.backendToken) &&
        authState.user
      ) {
        console.log(" Using cached authentication state");
        setAuthState((prev) => ({
          ...prev,
          isLoading: false,
          isAuthenticated: true,
        }));
        return;
      }

      // Get or refresh backend JWT
      console.log("🔄 Refreshing authentication...");
      const backendToken = await validateAndRefreshToken();

      if (!backendToken) {
        console.log(" Failed to get valid backend token");
        setAuthState({
          user: null,
          isLoading: false,
          isAuthenticated: false,
          error: "Authentication failed",
          backendToken: null,
        });
        return;
      }

      // Extract user info from JWT (client-side)
      const userInfo = await getUserInfo();

      if (!userInfo) {
        console.log(" Failed to extract user info from token");
        setAuthState({
          user: null,
          isLoading: false,
          isAuthenticated: false,
          error: "Failed to get user information",
          backendToken: null,
        });
        return;
      }

      console.log(" Authentication successful:", userInfo.userRole);
      console.log(
        "🔍 [AUTH DEBUG] Full userInfo object:",
        JSON.stringify(userInfo, null, 2),
      );
      console.log("🔍 [AUTH DEBUG] Backend token length:", backendToken.length);
      console.log(
        "🔍 [AUTH DEBUG] JWT payload:",
        JSON.stringify(getUserInfoFromJWT(backendToken), null, 2),
      );

      // Success - set authenticated state
      setAuthState({
        user: userInfo,
        isLoading: false,
        isAuthenticated: true,
        error: null,
        backendToken,
      });

      console.log(
        "🔍 [AUTH DEBUG] Auth state updated - isAuthenticated: true, user role:",
        userInfo.userRole,
      );

      // Handle role-based routing
      const role = userInfo.userRole.toLowerCase();
      const currentPath = window.location.pathname;

      console.log("🔍 [AUTH DEBUG] Role-based routing analysis:");
      console.log("  - Original role:", userInfo.userRole);
      console.log("  - Normalized role:", role);
      console.log("  - Current path:", currentPath);
      console.log("  - hasRedirected:", hasRedirected);
      console.log(
        "  - sessionStorage auth_redirected:",
        sessionStorage.getItem("auth_redirected"),
      );

      if (role === "student") {
        console.log("👨‍🎓 Student detected, redirecting to main LMS");
        await signOut({ redirect: false });
        window.location.href = "https://lms.nirudhyog.com/";
        return;
      }

      // Route to appropriate dashboard - only redirect once per session
      if (
        (currentPath === "/dashboard" || currentPath === "/") &&
        !hasRedirected
      ) {
        let targetPath = "";

        console.log("🔍 [AUTH DEBUG] Evaluating redirect conditions:");
        console.log(
          "  - Path matches dashboard/root:",
          currentPath === "/dashboard" || currentPath === "/",
        );
        console.log("  - hasRedirected:", hasRedirected);
        console.log("  - Role for routing:", role);

        if (role === "instructor") {
          console.log("👨‍🏫 Routing instructor to instructor dashboard");
          targetPath = "/dashboard/instructor";
        } else if (role === "admin") {
          console.log("‍💼 Routing admin to admin dashboard");
          targetPath = "/dashboard/admin";
        } else if (role === "recruiter") {
          console.log("👨‍💼 Routing recruiter to recruiter dashboard");
          targetPath = "/dashboard/recruiter";
        } else {
          console.log("❓ Unknown role, no specific routing:", role);
        }

        console.log("🔍 [AUTH DEBUG] Target path determined:", targetPath);

        if (targetPath) {
          console.log(`🚀 Redirecting to: ${targetPath}`);
          console.log(
            "🔍 [AUTH DEBUG] Setting hasRedirected = true and updating sessionStorage",
          );
          setHasRedirected(true);
          if (typeof window !== "undefined") {
            sessionStorage.setItem("auth_redirected", "true");
          }

          // Use setTimeout to ensure state is set before redirect
          setTimeout(() => {
            console.log(
              "🔍 [AUTH DEBUG] Executing router.replace to:",
              targetPath,
            );
            router.replace(targetPath);
          }, 100);
        } else {
          console.log(
            "⚠️ [AUTH DEBUG] No target path set - user will stay on current page",
          );
        }
      } else {
        console.log("🔍 [AUTH DEBUG] Skipping redirect due to conditions:");
        console.log(
          "  - Current path is not dashboard/root:",
          !(currentPath === "/dashboard" || currentPath === "/"),
        );
        console.log("  - Already redirected:", hasRedirected);
      }
    } catch (error) {
      console.error("Auth check error:", error);
      setHasRedirected(false); // Reset redirect flag on error
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("auth_redirected");
      }
      setAuthState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        error: "Authentication check failed",
        backendToken: null,
      });
    }
  }, [
    status,
    session,
    router,
    authState.backendToken,
    authState.user,
    validateAndRefreshToken,
    hasRedirected,
  ]);

  // Regular login (email/password) - kept for backward compatibility
  const login = useCallback(
    async (credentials: {
      email: string;
      password: string;
    }): Promise<boolean> => {
      try {
        const loginRes = await apiClient.post(
          API_ENDPOINTS.AUTH.LOGIN,
          credentials,
        );
        const data = loginRes.data;

        setAuthState({
          user: data.user,
          isLoading: false,
          isAuthenticated: true,
          error: null,
          backendToken: data.token || data.accessToken,
        });
        return true;
      } catch (error) {
        console.error("Login error:", error);
        setAuthState((prev) => ({
          ...prev,
          error: "Login failed",
          isLoading: false,
        }));
        return false;
      }
    },
    [],
  );

  // Logout
  const logout = useCallback(async () => {
    try {
      if (authState.backendToken) {
        // Call backend logout to clear any server-side cookies
        await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT);
      }

      // Clear client-side cache
      clearAuthCache();

      // Clear role picker localStorage
      localStorage.removeItem("admin_view_as_role");
      sessionStorage.removeItem("admin_viewing_as_student");
      sessionStorage.removeItem("admin_return_url");

      setAuthState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        error: null,
        backendToken: null,
      });

      // Sign out from NextAuth
      await signOut({ redirect: false });
      router.push("/");

      console.log("🚪 Logout completed successfully");
    } catch (error) {
      console.error("Logout error:", error);
      // Even if server logout fails, still clear client state
      clearAuthCache();
      setAuthState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        error: null,
        backendToken: null,
      });
      await signOut({ redirect: false });
      router.push("/");
    }
  }, [authState.backendToken, router]);

  const refreshAuth = useCallback(async () => {
    await checkAuth();
  }, [checkAuth]);

  // Helper functions for role-based access
  const hasAdminAccess = useCallback(async (): Promise<boolean> => {
    return await hasAdminRole();
  }, []);

  const hasInstructorAccess = useCallback(async (): Promise<boolean> => {
    return await hasInstructorRole();
  }, []);

  // Run auth check when session changes
  useEffect(() => {
    checkAuth();
  }, [session, status]); // Removed checkAuth from dependencies to prevent loops

  // Periodic token refresh for long-running sessions
  useEffect(() => {
    if (!authState.isAuthenticated || !authState.backendToken) return;

    const interval = setInterval(
      async () => {
        console.log("🔄 Periodic token check...");
        if (authState.backendToken && isJWTExpired(authState.backendToken)) {
          console.log("🔄 Token expired, refreshing...");
          await checkAuth();
        }
      },
      10 * 60 * 1000,
    ); // Check every 10 minutes

    return () => clearInterval(interval);
  }, [authState.isAuthenticated, authState.backendToken, checkAuth]);

  const contextValue: AuthContextType = {
    ...authState,
    login,
    logout,
    refreshAuth,
    validateAndRefreshToken,
    hasAdminAccess,
    hasInstructorAccess,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};
