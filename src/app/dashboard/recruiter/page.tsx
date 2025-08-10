"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

import RecruiterSidebar from "@/components/RecruiterSidebar";
import RecruiterDashboard from "@/components/RecruiterDashboard";
import RecruiterJobs from "@/components/RecruiterJobs";
import RecruiterApplications from "@/components/RecruiterApplications";
import RecruiterUsers from "@/components/RecruiterUsers";
import { ToastProvider } from "@/components/ToastContext";

const RecruiterPage: React.FC = () => {
  const { status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [activeSection, setActiveSection] = useState("dashboard");

  // Keep state in sync with query param `tab`
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab && tab !== activeSection) {
      setActiveSection(tab);
    }
  }, [searchParams, activeSection]);

  const navigateTo = useCallback(
    (section: string) => {
      setActiveSection(section);
      const params = new URLSearchParams(Array.from(searchParams.entries()));
      params.set("tab", section);
      router.replace(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams],
  );

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
      case "users":
        return <RecruiterUsers />;
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
          setActiveSection={navigateTo}
        />
        <div className="flex-1 overflow-auto bg-white">{renderContent()}</div>
      </div>
    </ToastProvider>
  );
};

export default RecruiterPage;
