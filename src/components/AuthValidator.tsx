// components/AuthValidator.tsx
"use client";

import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getUserRole, isJWTExpired, getBackendJwt } from "../utils/auth";

export default function AuthValidationWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isValidating, setIsValidating] = useState(true);
  const [validationComplete, setValidationComplete] = useState(false);

  useEffect(() => {
    const validateUser = async () => {
      console.log("=== AuthValidator Debug ===");
      console.log("Session status:", status);

      // Wait for session to load
      if (status === "loading") {
        return;
      }

      // No session = redirect to login
      if (status === "unauthenticated" || !session?.id_token) {
        console.log("No session found, redirecting to /");
        router.push("/");
        return;
      }

      console.log("Session found, validating user role...");

      try {
        // Try to get user role from cached JWT first (fast client-side check)
        let role = await getUserRole();
        
        // If no role from cache, try to get fresh JWT
        if (!role) {
          console.log("No cached role, fetching fresh JWT...");
          const jwt = await getBackendJwt();
          if (jwt) {
            role = await getUserRole();
          }
        }

        if (!role) {
          console.log("Failed to get user role, redirecting to LMS");
          await signOut({ redirect: false });
          window.location.href = "https://lms.nirudhyog.com/";
          return;
        }

        const normalizedRole = role.toLowerCase();
        console.log("User role:", normalizedRole);

        // Handle role-based routing - but respect ViewAs context for admins
        if (normalizedRole === "student") {
          console.log("Student user detected, redirecting to LMS");
          await signOut({ redirect: false });
          window.location.href = "https://lms.nirudhyog.com/";
          return;
        }

        // For admin users, don't force routing - let them use the role picker
        if (normalizedRole === "admin") {
          console.log("Admin user detected - allowing access to all views");
          
          // Reset role picker to admin view on login for admin users
          localStorage.setItem('admin_view_as_role', 'admin');
          
          // Check if user is on a valid admin route
          const currentPath = window.location.pathname;
          if (!currentPath.startsWith('/dashboard/')) {
            // Default to admin dashboard if not on any dashboard route
            router.push("/dashboard/admin");
            return;
          }
          // Otherwise, let them stay on their current route (instructor, admin, etc.)
        }

        // For instructor users, ensure they're on instructor dashboard
        if (normalizedRole === "instructor") {
          console.log("Instructor user, ensuring correct dashboard");
          const currentPath = window.location.pathname;
          if (!currentPath.startsWith('/dashboard/instructor')) {
            router.push("/dashboard/instructor");
            return;
          }
        }

        // For recruiter users, ensure they're on admin dashboard
        if (normalizedRole === "recruiter") {
          console.log("Recruiter user, ensuring correct dashboard");
          const currentPath = window.location.pathname;
          if (!currentPath.startsWith('/dashboard/admin')) {
            router.push("/dashboard/admin");
            return;
          }
        }

        // If we get here, user is valid and on correct page
        console.log("✅ User validation successful");
        setValidationComplete(true);

      } catch (error) {
        console.error("User validation error:", error);
        await signOut({ redirect: false });
        window.location.href = "https://lms.nirudhyog.com/";
      } finally {
        setIsValidating(false);
      }
    };

    validateUser();
  }, [status, session, router]);

  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Validating access...</p>
        </div>
      </div>
    );
  }

  if (!validationComplete) {
    return null;
  }

  return <>{children}</>;
}
