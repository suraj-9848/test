// app/dashboard/layout.tsx
"use client";

import { useSession, signOut } from "next-auth/react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { validateOAuthUser } from "../../utils/auth";

export default function AuthValidationWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const jwt = session?.id_token;

      console.log("=== AuthValidator Debug ===");
      console.log("JWT token:", jwt ? "Present" : "Missing");
      console.log("Session status:", status);

      if (!jwt || status === "unauthenticated") {
        console.log("No JWT or unauthenticated, redirecting to /");
        router.push("/");
        return;
      }

      console.log("Calling validateOAuthUser...");
      const resp = await validateOAuthUser(jwt);
      console.log("Validation response:", resp);

      const role = resp.user?.userRole?.toLowerCase();
      console.log("User role (lowercase):", role);

      // Check if user is valid and has admin privileges
      const adminRoles = ["admin", "recruiter"];

      if (!resp.valid) {
        console.log("Invalid user, redirecting to LMS");
        await signOut({ redirect: false });
        window.location.href = "https://lms.nirudhyog.com/";
        return;
      }

      if (role === "student") {
        console.log("Student user, redirecting to LMS");
        await signOut({ redirect: false });
        window.location.href = "https://lms.nirudhyog.com/";
        return;
      }

      if (role === "instructor") {
        console.log("Instructor user, redirecting to instructor dashboard");
        router.push("/dashboard/instructor");
        return;
      }

      if (adminRoles.includes(role)) {
        console.log(
          `Valid admin user with role ${role}, allowing access to admin dashboard`,
        );
        // Redirect admin users to the admin dashboard if they're on the generic dashboard page
        if (window.location.pathname === "/dashboard") {
          console.log("Redirecting admin user to admin dashboard");
          router.replace("/dashboard/admin");
          return;
        }
        return;
      }

      // If we get here, it's an unknown role
      console.log(`Unknown role ${role}, redirecting to LMS`);
      await signOut({ redirect: false });
      window.location.href = "https://lms.nirudhyog.com/";
    };

    if (status === "authenticated") {
      checkUser();
    }
  }, [session, status, router]);

  if (status === "loading") return null;

  return <>{children}</>;
}
