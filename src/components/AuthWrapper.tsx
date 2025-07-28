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
  const { isLoading, isAuthenticated, user, hasRole } = useAuth();
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

  if (requiredRoles.length > 0 && !hasRole(requiredRoles)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-4">
            You don't have permission to access this page.
          </p>
          <p className="text-sm text-gray-500">
            Required roles: {requiredRoles.join(', ')}
          </p>
          <p className="text-sm text-gray-500">
            Your role: {user.userRole}
          </p>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}