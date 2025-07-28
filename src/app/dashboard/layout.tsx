// src/app/dashboard/layout.tsx
"use client";

import AuthWrapper from "@/components/AuthWrapper";
import Navbar from "@/components/Navbar";

export default function DashboardLayout({
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