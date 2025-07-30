"use client";

import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';

interface AuthWrapperProps {
  children: React.ReactNode;
  requiredRoles?: string[];
  redirectTo?: string;
  fallback?: React.ReactNode;
}

export default function AuthWrapper({ 
  children, 
  requiredRoles = [], 
  redirectTo = '/',
  fallback 
}: AuthWrapperProps) {
  const { isLoading, isAuthenticated, user } = useAuth();
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    if (fallback) return <>{fallback}</>;
    
    router.push(redirectTo);
    return null;
  }

  // Admin users can access any role's view, others must match required roles
  const hasAccess = requiredRoles.length === 0 || 
                   requiredRoles.includes(user.userRole) || 
                   user.userRole === 'admin';

  if (!hasAccess) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-4">
            You don&apos;t have permission to access this page.
          </p>
          <p className="text-sm text-gray-500">
            Required roles: {requiredRoles.join(', ')}
          </p>
          <p className="text-sm text-gray-500">
            Your role: {user.userRole}
          </p>
          {user.userRole === 'admin' && (
            <p className="text-sm text-blue-500 mt-2">
              Note: As an admin, you should have access to all views.
            </p>
          )}
        </div>
      </div>
    );
  }

  return <>{children}</>;
}