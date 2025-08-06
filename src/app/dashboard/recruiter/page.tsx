"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

import RecruiterSidebar from "@/components/RecruiterSidebar";
import RecruiterDashboard from "@/components/RecruiterDashboard";
import RecruiterJobs from "@/components/RecruiterJobs";
import RecruiterApplications from "@/components/RecruiterApplications";
import RecruiterSubscriptions from "@/components/RecruiterSubscriptions";
import { ToastProvider } from "@/components/ToastContext";

const RecruiterPage: React.FC = () => {
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
        return <RecruiterDashboard />;
      case "jobs":
        return <RecruiterJobs />;
      case "applications":
        return <RecruiterApplications />;
      case "subscriptions":
        return <RecruiterSubscriptions />;
      default:
        return <RecruiterDashboard />;
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
        <RecruiterSidebar
          activeSection={activeSection}
          setActiveSection={setActiveSection}
        />
        <div className="flex-1 overflow-auto bg-white">{renderContent()}</div>
      </div>
    </ToastProvider>
  );
};

export default RecruiterPage;
