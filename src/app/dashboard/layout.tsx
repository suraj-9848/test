"use client";

import AuthValidationWrapper from "@/components/AuthValidator";
import AuthWrapper from "@/components/AuthWrapper";
import Navbar from "@/components/Navbar";

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex flex-col">
      <AuthWrapper requiredRoles={["admin", "instructor", "recruiter"]}>
        <Navbar />
        <div className="dashboard-layout">{children}</div>
      </AuthWrapper>
    </div>
  );
}
