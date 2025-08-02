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
      console.log("🔍 [VALIDATOR] Session status:", status);
      console.log("🔍 [VALIDATOR] Current URL:", window.location.href);
      console.log("🔍 [VALIDATOR] Timestamp:", new Date().toISOString());

      // Wait for session to load
      if (status === "loading") {
        console.log("🔍 [VALIDATOR] Still loading authentication...");
        return;
      }

      // No session = don't validate, just allow SignIn component to show
      if (status === "unauthenticated" || !session?.id_token) {
        console.log(
          "🔍 [VALIDATOR] No session found - allowing SignIn component to show",
        );
        console.log(
          "🔍 [VALIDATOR] Status:",
          status,
          "Has id_token:",
          !!session?.id_token,
        );
        console.log(
          "🔍 [VALIDATOR] ✅ Setting validation complete = true (for SignIn page)",
        );
        setValidationComplete(true);
        setIsValidating(false);
        return;
      }

      console.log("🔍 [VALIDATOR] Session found, validating user role...");
      console.log("🔍 [VALIDATOR] Session details:", {
        id_token: !!session.id_token,
        accessToken: !!(session as any).accessToken,
        user: session.user,
      });

      try {
        console.log("🔍 [VALIDATOR] Starting role validation process...");

        // Try to get user role from cached JWT first (fast client-side check)
        let role = await getUserRole();
        console.log("🔍 [VALIDATOR] Cached role from getUserRole():", role);

        // If no role from cache, try to get fresh JWT
        if (!role) {
          console.log("🔍 [VALIDATOR] No cached role, fetching fresh JWT...");
          try {
            const jwt = await getBackendJwt();
            console.log(
              "🔍 [VALIDATOR] Fresh JWT obtained, length:",
              jwt?.length,
            );
            if (jwt) {
              role = await getUserRole();
              console.log("🔍 [VALIDATOR] Role after fresh JWT fetch:", role);
            }
          } catch (jwtError) {
            console.error("🔍 [VALIDATOR] Error fetching JWT:", jwtError);
          }
        }

        if (!role) {
          console.log(
            "🔍 [VALIDATOR] Failed to get user role, redirecting to LMS",
          );
          console.log(
            "🔍 [VALIDATOR] This indicates either JWT fetch failed or role extraction failed",
          );
          await signOut({ redirect: false });
          window.location.href = "https://lms.nirudhyog.com/";
          return;
        }

        const normalizedRole = role.toLowerCase();
        console.log("🔍 [VALIDATOR] User role extracted successfully:");
        console.log("  - Original role:", role);
        console.log("  - Normalized role:", normalizedRole);

        // Handle role-based routing - but respect ViewAs context for admins
        if (normalizedRole === "student") {
          console.log(
            "🔍 [VALIDATOR] Student user detected, redirecting to LMS",
          );
          await signOut({ redirect: false });
          window.location.href = "https://lms.nirudhyog.com/";
          return;
        }

        // Let AuthContext handle all routing - AuthValidator should only validate
        // Just reset role picker for admin users
        if (normalizedRole === "admin") {
          console.log(
            "🔍 [VALIDATOR] Admin user detected - allowing access to all views",
          );
          console.log(
            "🔍 [VALIDATOR] Setting admin_view_as_role to 'admin' in localStorage",
          );
          // Reset role picker to admin view on login for admin users
          localStorage.setItem("admin_view_as_role", "admin");
        } else if (normalizedRole === "instructor") {
          console.log("🔍 [VALIDATOR] Instructor user detected");
        } else if (normalizedRole === "recruiter") {
          console.log("🔍 [VALIDATOR] Recruiter user detected");
        } else {
          console.log("🔍 [VALIDATOR] Unknown role detected:", normalizedRole);
        }

        // If we get here, user is valid and on correct page
        console.log(
          "✅ [VALIDATOR] User validation successful - role:",
          normalizedRole,
        );
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
