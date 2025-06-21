// app/dashboard/layout.tsx
"use client";

import { useSession, signOut } from "next-auth/react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";import { validateOAuthUser } from "../../utils/auth";

export default function AuthValidationWrapper({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const jwt = session?.id_token;

      if (!jwt || status === "unauthenticated") {
        router.push("/");
        return;
      }

      const resp = await validateOAuthUser(jwt);
      const role = resp.user?.role?.toLowerCase();

      if (!resp.valid || role === "student") {
        await signOut({ redirect: false });
        window.location.href = "https://lms.nirudhyog.com/";
      }
    };

    if (status === "authenticated") {
      checkUser();
    }
  }, [session, status,router]);

  if (status === "loading") return null;

  return <>{children}</>;
}
