"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  getUserInfo, 
  getUserRole, 
  hasAdminRole, 
  hasInstructorRole, 
  clearAuthCache,
  getBackendJwt,
  isJWTExpired,
  decodeJWT,
  getUserInfoFromJWT
} from '../utils/auth';

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
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Auth Provider Component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Removed redirect state management - no longer needed

  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
    error: null,
    backendToken: null,
  });

  // Backend API base URL
  const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_BASE_URL;

  // Smart token validation - uses cached JWT if valid, otherwise fetches new one
  const validateAndRefreshToken = useCallback(async (): Promise<string | null> => {
    try {
      // Try to get a valid JWT (this uses intelligent caching internally)
      const jwt = await getBackendJwt();
      return jwt;
    } catch (error) {
      console.error('Token validation/refresh failed:', error);
      return null;
    }
  }, []);

  // Main authentication check (called once per session and when needed)
  const checkAuth = useCallback(async () => {
    if (status === 'loading') return;

    console.log('🔍 [AUTH CONTEXT] Checking authentication status...');
    console.log('🔍 [AUTH CONTEXT] Session status:', status);
    console.log('🔍 [AUTH CONTEXT] Has session:', !!session);
    console.log('🔍 [AUTH CONTEXT] Has id_token:', !!session?.id_token);
    
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // No session = not authenticated, but don't try to authenticate
      if (status === 'unauthenticated' || !session?.id_token) {
        console.log('🔍 [AUTH CONTEXT] No valid session found - setting unauthenticated state');
        console.log('🔍 [AUTH CONTEXT] This is normal for users who haven\'t logged in yet');
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
      if (authState.backendToken && !isJWTExpired(authState.backendToken) && authState.user) {
        console.log('✅ Using cached authentication state');
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
          isAuthenticated: true,
        }));
        return;
      }

      // Get or refresh backend JWT
      console.log('🔄 Refreshing authentication...');
      const backendToken = await validateAndRefreshToken();
      
      if (!backendToken) {
        console.log('❌ Failed to get valid backend token');
        setAuthState({
          user: null,
          isLoading: false,
          isAuthenticated: false,
          error: 'Authentication failed',
          backendToken: null,
        });
        return;
      }

      // Extract user info from JWT (client-side)
      const userInfo = await getUserInfo();
      
      if (!userInfo) {
        console.log('❌ Failed to extract user info from token');
        setAuthState({
          user: null,
          isLoading: false,
          isAuthenticated: false,
          error: 'Failed to get user information',
          backendToken: null,
        });
        return;
      }

      console.log('✅ Authentication successful:', userInfo.userRole);
      console.log('🔍 [AUTH DEBUG] Full userInfo object:', JSON.stringify(userInfo, null, 2));
      console.log('🔍 [AUTH DEBUG] Backend token length:', backendToken.length);
      console.log('🔍 [AUTH DEBUG] JWT payload:', JSON.stringify(getUserInfoFromJWT(backendToken), null, 2));

      // Success - set authenticated state
      setAuthState({
        user: userInfo,
        isLoading: false,
        isAuthenticated: true,
        error: null,
        backendToken,
      });

      console.log('🔍 [AUTH DEBUG] Auth state updated - isAuthenticated: true, user role:', userInfo.userRole);

      // Handle role-based routing - simplified (no automatic redirects)
      const role = userInfo.userRole.toLowerCase();
      const currentPath = window.location.pathname;

      console.log("🔍 [AUTH DEBUG] User authenticated successfully:");
      console.log("  - Role:", userInfo.userRole);
      console.log("  - Current path:", currentPath);
      console.log("  - No automatic redirects - user stays on current page");

      // Only redirect students to main LMS (they shouldn't access admin panel)
      if (role === "student") {
        console.log("👨‍🎓 Student detected, redirecting to main LMS");
        await signOut({ redirect: false });
        window.location.href = 'https://lms.nirudhyog.com/';
        return;
      }

      // For admin/instructor/recruiter - no automatic redirects
      // They can manually navigate to their dashboard
      console.log("✅ Admin/Instructor/Recruiter authenticated - staying on current page");
    } catch (error) {
      console.error("Auth check error:", error);
      setAuthState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        error: 'Authentication check failed',
        backendToken: null,
      });
    }
  }, [status, session, router, authState.backendToken, authState.user, validateAndRefreshToken]);

  // Regular login (email/password) - kept for backward compatibility
  const login = useCallback(async (credentials: { email: string; password: string }): Promise<boolean> => {
    try {
      const response = await fetch(`${BACKEND_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setAuthState({
          user: data.user,
          isLoading: false,
          isAuthenticated: true,
          error: null,
          backendToken: data.token || data.accessToken,
        });
        return true;
      }

      const errorData = await response.json();
      setAuthState(prev => ({
        ...prev,
        error: errorData.error || 'Login failed',
        isLoading: false,
      }));
      return false;
    } catch (error) {
      console.error('Login error:', error);
      setAuthState(prev => ({
        ...prev,
        error: 'Login failed',
        isLoading: false,
      }));
      return false;
    }
  }, [BACKEND_BASE_URL]);

  // Logout
  const logout = useCallback(async () => {
    try {
      if (authState.backendToken) {
        // Call backend logout to clear any server-side cookies
        await fetch(`${BACKEND_BASE_URL}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authState.backendToken}`,
          },
          credentials: 'include',
        });
      }
      
      // Clear client-side cache
      clearAuthCache();
      
      // Clear role picker localStorage
      localStorage.removeItem('admin_view_as_role');
      sessionStorage.removeItem('admin_viewing_as_student');
      sessionStorage.removeItem('admin_return_url');
      
      setAuthState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        error: null,
        backendToken: null,
      });

      // Sign out from NextAuth
      await signOut({ redirect: false });
      router.push('/');
      
      console.log('🚪 Logout completed successfully');
    } catch (error) {
      console.error('Logout error:', error);
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
      router.push('/');
    }
  }, [authState.backendToken, BACKEND_BASE_URL, router]);

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

    const interval = setInterval(async () => {
      console.log('🔄 Periodic token check...');
      if (authState.backendToken && isJWTExpired(authState.backendToken)) {
        console.log('🔄 Token expired, refreshing...');
        await checkAuth();
      }
    }, 10 * 60 * 1000); // Check every 10 minutes

    return () => clearInterval(interval);
  }, [authState.isAuthenticated, authState.backendToken]); // Removed checkAuth from dependencies

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
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};