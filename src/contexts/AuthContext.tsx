// contexts/AuthContext.tsx - Centralized auth state management
"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

// Types
interface User {
  id: string;
  username: string;
  email: string;
  userRole: 'admin' | 'instructor' | 'recruiter' | 'student';
  org_id?: string;
  batch_id?: string[];
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
  validateAndRefreshToken: () => Promise<boolean>;
  isAdmin: boolean;
  isInstructor: boolean;
  isRecruiter: boolean;
  isStudent: boolean;
  hasRole: (roles: string[]) => boolean;
  getAuthHeaders: () => Record<string, string>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Custom hook to use auth context
export const useAuth = () => {
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
  
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
    error: null,
    backendToken: null,
  });

  // Backend API base URL
  const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_BASE_URL;

  // Validate user with backend (single API call)
  const validateUser = useCallback(async (googleToken: string): Promise<{ valid: boolean; user?: User; token?: string; error?: any }> => {
    try {
      // First try admin login for Google OAuth users
      const adminResponse = await fetch(`${BACKEND_BASE_URL}/api/auth/admin-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${googleToken}`,
        },
      });

      if (adminResponse.ok) {
        const data = await adminResponse.json();
        return {
          valid: true,
          user: data.user,
          token: data.token || data.accessToken,
        };
      }

      // If admin login fails, try regular token exchange
      const exchangeResponse = await fetch(`${BACKEND_BASE_URL}/api/auth/exchange`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: googleToken }),
      });

      if (exchangeResponse.ok) {
        const data = await exchangeResponse.json();
        return {
          valid: true,
          user: data.user,
          token: data.token || data.accessToken,
        };
      }

      const errorData = await adminResponse.json();
      return { valid: false, error: errorData };
    } catch (error) {
      console.error('Auth validation error:', error);
      return { valid: false, error };
    }
  }, [BACKEND_BASE_URL]);

  // Get current user info using existing token
  const getCurrentUser = useCallback(async (token: string): Promise<User | null> => {
    try {
      const response = await fetch(`${BACKEND_BASE_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        return data.user;
      }
      return null;
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }, [BACKEND_BASE_URL]);

  // Refresh tokens
  const refreshTokens = useCallback(async (): Promise<string | null> => {
    try {
      const response = await fetch(`${BACKEND_BASE_URL}/api/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        return data.token || data.accessToken;
      }
      return null;
    } catch (error) {
      console.error('Token refresh error:', error);
      return null;
    }
  }, [BACKEND_BASE_URL]);

  // Main authentication check (called once per session)
  const checkAuth = useCallback(async () => {
    if (status === 'loading') return;

    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // No session = not authenticated
      if (status === 'unauthenticated' || !session?.id_token) {
        setAuthState({
          user: null,
          isLoading: false,
          isAuthenticated: false,
          error: null,
          backendToken: null,
        });
        return;
      }

      // Check if we already have a valid backend token
      if (authState.backendToken && authState.user) {
        const currentUser = await getCurrentUser(authState.backendToken);
        if (currentUser) {
          // Token is still valid
          setAuthState(prev => ({
            ...prev,
            isLoading: false,
            isAuthenticated: true,
          }));
          return;
        }
      }

      // Try to refresh tokens first
      let backendToken = await refreshTokens();
      
      // If refresh fails, validate with Google token
      if (!backendToken) {
        const validation = await validateUser(session.id_token);
        
        if (!validation.valid) {
          // Handle different error cases
          if (validation.error?.userRole === 'student') {
            // Redirect students to main LMS
            await signOut({ redirect: false });
            window.location.href = 'https://lms.nirudhyog.com/';
            return;
          }
          
          setAuthState({
            user: null,
            isLoading: false,
            isAuthenticated: false,
            error: validation.error?.error || 'Authentication failed',
            backendToken: null,
          });
          return;
        }
        
        backendToken = validation.token!;
      }

      // Get user info with the valid token
      const user = await getCurrentUser(backendToken);
      
      if (!user) {
        setAuthState({
          user: null,
          isLoading: false,
          isAuthenticated: false,
          error: 'Failed to get user information',
          backendToken: null,
        });
        return;
      }

      // Success - set authenticated state
      setAuthState({
        user,
        isLoading: false,
        isAuthenticated: true,
        error: null,
        backendToken,
      });

      // Handle role-based routing
      const role = user.userRole.toLowerCase();
      const currentPath = window.location.pathname;

      if (role === 'student') {
        await signOut({ redirect: false });
        window.location.href = 'https://lms.nirudhyog.com/';
        return;
      }

      // Route to appropriate dashboard
      if (currentPath === '/dashboard' || currentPath === '/') {
        if (role === 'instructor') {
          router.replace('/dashboard/instructor');
        } else if (['admin', 'recruiter'].includes(role)) {
          router.replace('/dashboard/admin');
        }
      }

    } catch (error) {
      console.error('Auth check error:', error);
      setAuthState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        error: 'Authentication check failed',
        backendToken: null,
      });
    }
  }, [session, status, authState.backendToken, authState.user, validateUser, getCurrentUser, refreshTokens, router]);

  // Regular login (email/password)
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
        await fetch(`${BACKEND_BASE_URL}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authState.backendToken}`,
          },
          credentials: 'include',
        });
      }
      setAuthState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        error: null,
        backendToken: null,
      });

      await signOut({ redirect: false });
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, [authState.backendToken, BACKEND_BASE_URL, router]);

  const refreshAuth = useCallback(async () => {
    await checkAuth();
  }, [checkAuth]);

  const validateAndRefreshToken = useCallback(async (): Promise<boolean> => {
    if (!authState.backendToken) return false;

    try {
      const user = await getCurrentUser(authState.backendToken);
      if (user) return true;
      const newToken = await refreshTokens();
      if (newToken) {
        const newUser = await getCurrentUser(newToken);
        if (newUser) {
          setAuthState(prev => ({
            ...prev,
            user: newUser,
            backendToken: newToken,
          }));
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('Token validation error:', error);
      return false;
    }
  }, [authState.backendToken, getCurrentUser, refreshTokens]);
  const getAuthHeaders = useCallback((): Record<string, string> => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (authState.backendToken) {
      headers.Authorization = `Bearer ${authState.backendToken}`;
    }

    return headers;
  }, [authState.backendToken]);

  const isAdmin = authState.user?.userRole === 'admin';
  const isInstructor = authState.user?.userRole === 'instructor';
  const isRecruiter = authState.user?.userRole === 'recruiter';
  const isStudent = authState.user?.userRole === 'student';

  const hasRole = useCallback((roles: string[]): boolean => {
    if (!authState.user) return false;
    return roles.includes(authState.user.userRole.toLowerCase());
  }, [authState.user]);
  useEffect(() => {
    checkAuth();
  }, [session, status]); 

  const contextValue: AuthContextType = {
    ...authState,
    login,
    logout,
    refreshAuth,
    validateAndRefreshToken,
    isAdmin,
    isInstructor,
    isRecruiter,
    isStudent,
    hasRole,
    getAuthHeaders,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};