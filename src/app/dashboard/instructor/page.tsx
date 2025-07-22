"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

import InstructorSidebar from "../../../components/InstructorSidebar";
import AllCourses from "../../../components/AllCourses";
import CreateCourse from "../../../components/CreateCourse";
import ManageModules from "../../../components/ManageModules";
import MCQManagement from "../../../components/MCQManagement";
import BatchManagement from "../../../components/BatchManagement";
import CreateTest from "../../../components/CreateTest";
import ManageTest from "../../../components/ManageTest";
import TestAnalytics from "@/components/TestAnalytics";

import CourseAssignment from "../../../components/CourseAssignment";
import StudentAnalytics from "../../../components/StudentAnalytics";
import ProgressAnalytics from "../../../components/ProgressAnalytics";
import EvaluationStatistics from "../../../components/EvaluationStatistics";
import CreateBatch from "@/components/CreateBatch";
import BatchAssign from "@/components/BatchAssign";
const InstructorDashboard: React.FC = () => {
  const { status } = useSession();
  const router = useRouter();
  const [activeSection, setActiveSection] = useState("dashboard");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/api/auth/signin");
    }
  }, [status, router]);

  const renderContent = () => {
    switch (activeSection) {
      // Course Management
      case "all-courses":
        return <AllCourses />;
      case "courses-overview": // Legacy support
        return <AllCourses />;
      case "create-course":
        return <CreateCourse />;
      case "manage-modules":
        return <ManageModules />;
      case "mcq-management":
        return <MCQManagement />;
      case "course-assignment":
        return <CourseAssignment />;

      // Test Management
      case "create-test":
        return <CreateTest setActiveSection={setActiveSection} />;
      case "manage-test":
        return <ManageTest />;
      // case "test-questions":
      //   return <TestQuestionManagement />;

      // Analytics & Reports
      case "student-analytics":
        return <StudentAnalytics />;
      case "progress-analytics":
        return <ProgressAnalytics />;
      case "test-analytics":
        return <TestAnalytics />;

      case "evaluation-statistics":
        return <EvaluationStatistics />;

      // Batch Management
      case "batch-management":
      case "create-batch":
        return <CreateBatch />;
      case "batches": // Legacy support
        return <BatchManagement />;
      case "batch-analytics":
        return <StudentAnalytics />; // Can be extended for batch-specific analytics
      case "batch-assignments":
        return <BatchAssign />;

      default:
        return <AllCourses />;
    }
  };

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (status === "unauthenticated") return null;

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <InstructorSidebar
        activeSection={activeSection}
        setActiveSection={setActiveSection}
      />
      <div className="flex-1 overflow-auto">{renderContent()}</div>
    </div>
  );
};

export default InstructorDashboard;
