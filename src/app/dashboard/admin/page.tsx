"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

import Sidebar from "@/components/AdminSidebar";
import AdminDashboard from "@/components/AdminDashboard";
import ComprehensiveUserManagement from "@/components/ComprehensiveUserManagement";
import OrganizationManagement from "@/components/OrganizationManagement";
import ManageHiring from "@/components/ManageHiring";
import PaymentApproval from "@/components/PaymentApproval";
import { ToastProvider } from "@/components/ToastContext";

const Index: React.FC = () => {
  const { status } = useSession();
  const router = useRouter();

  const [activeSection, setActiveSection] = useState("dashboard");

  // Redirect if unauthenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/api/auth/signin");
    }
  }, [status, router]);

  const renderContent = () => {
    switch (activeSection) {
      case "dashboard":
        return <AdminDashboard />;
      case "users":
        return <ComprehensiveUserManagement type="all" />;
      case "admins":
        return <ComprehensiveUserManagement type="admins" />;
      case "recruiters":
        return <ComprehensiveUserManagement type="recruiters" />;
      case "instructors":
        return <ComprehensiveUserManagement type="instructors" />;
      case "students":
        return <ComprehensiveUserManagement type="students" />;
      case "organizations":
        return <OrganizationManagement />;
      case "manage-hiring":
        return <ManageHiring />;
      case "payments":
      default:
        return <PaymentApproval />;
    }
  };

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center h-screen">
        Loading...
      </div>
    );
  }

  if (status === "unauthenticated") return null;

  return (
    <ToastProvider>
      <div className="flex h-screen bg-white">
        <Sidebar
          activeSection={activeSection}
          setActiveSection={setActiveSection}
        />
        <div className="flex-1 overflow-auto bg-white">{renderContent()}</div>
      </div>
    </ToastProvider>
  );
};

export default Index;
