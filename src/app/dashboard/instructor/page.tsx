"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { FaBook, FaGraduationCap, FaChartLine, FaUsers } from "react-icons/fa";

import InstructorSidebar from "../../../components/InstructorSidebar";
import AllCourses from "../../../components/AllCourses";
import CreateCourse from "../../../components/CreateCourse";
import ManageModules from "../../../components/ManageModules";
import ModuleContent from "../../../components/ModuleContent";
import MCQManagement from "../../../components/MCQManagement";
import BatchManagement from "../../../components/BatchManagement";
import UnifiedBatchManagement from "@/components/UnifiedBatchManagement";
import CreateTest from "../../../components/CreateTest";
import ManageTest from "../../../components/ManageTest";
import TestAnalytics from "@/components/TestAnalytics";
import CourseAssignment from "../../../components/CourseAssignment";
import StudentAnalytics from "../../../components/StudentAnalytics";
import ProgressAnalytics from "../../../components/ProgressAnalytics";
import EvaluationStatistics from "../../../components/EvaluationStatistics";
import CreateBatch from "@/components/CreateBatch";
import BatchAssign from "@/components/BatchAssign";
import { instructorApi } from "@/api/instructorApi";

interface DashboardStats {
  totalCourses: number;
  totalBatches: number;
  totalStudents: number;
  averageProgress: number;
  recentActivity: number;
  publicCourses: number;
  privateCourses: number;
}

const InstructorDashboard: React.FC = () => {
  const { status } = useSession();
  const router = useRouter();
  const [activeSection, setActiveSection] = useState("dashboard");
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/api/auth/signin");
    }
  }, [status, router]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await instructorApi.getDashboardStats();
        setStats(response.stats);
        setError("");
      } catch (err: unknown) {
        console.error("Error fetching dashboard stats:", err);
        if (err instanceof Error) {
          setError(err.message || "Failed to load dashboard statistics");
        } else {
          setError("Failed to load dashboard statistics");
        }
        setStats({
          totalCourses: 0,
          totalBatches: 0,
          totalStudents: 0,
          averageProgress: 0,
          recentActivity: 0,
          publicCourses: 0,
          privateCourses: 0,
        });
      } finally {
        setLoading(false);
      }
    };

    if (status === "authenticated") {
      fetchStats();
    }
  }, [status]);

  const renderContent = () => {
    switch (activeSection) {
      case "dashboard":
        return (
          <div className="p-6 space-y-6">
            {/* Welcome Header */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Welcome to Instructor Dashboard
              </h1>
              <p className="text-gray-600">
                Manage your courses, students, and track progress from here.
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100">Total Courses</p>
                    <p className="text-2xl font-bold">{loading ? "-" : (stats?.totalCourses || 0)}</p>
                  </div>
                  <FaBook className="w-8 h-8 text-blue-200" />
                </div>
              </div>
              <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100">Active Students</p>
                    <p className="text-2xl font-bold">{loading ? "-" : (stats?.totalStudents || 0)}</p>
                  </div>
                  <FaUsers className="w-8 h-8 text-green-200" />
                </div>
              </div>
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100">Batches</p>
                    <p className="text-2xl font-bold">{loading ? "-" : (stats?.totalBatches || 0)}</p>
                  </div>
                  <FaGraduationCap className="w-8 h-8 text-purple-200" />
                </div>
              </div>
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-4 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100">Avg. Progress</p>
                    <p className="text-2xl font-bold">{loading ? "-" : (stats?.averageProgress || 0)}%</p>
                  </div>
                  <FaChartLine className="w-8 h-8 text-orange-200" />
                </div>
              </div>
            </div>

            {/* Additional Stats */}
            {stats && !loading && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Course Visibility</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Public Courses:</span>
                      <span className="font-medium">{stats.publicCourses}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Private Courses:</span>
                      <span className="font-medium">{stats.privateCourses}</span>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Recent Activity</h3>
                  <p className="text-2xl font-bold text-blue-600">{stats.recentActivity}</p>
                  <p className="text-sm text-gray-500">Student interactions (30 days)</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Quick Actions</h3>
                  <div className="space-y-2">
                    <button
                      onClick={() => setActiveSection("create-course")}
                      className="w-full text-left px-3 py-2 text-sm bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                    >
                      Create New Course
                    </button>
                    <button
                      onClick={() => setActiveSection("all-courses")}
                      className="w-full text-left px-3 py-2 text-sm bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                    >
                      Manage Courses
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      // Course Management
      case "all-courses":
      case "courses-overview": // Legacy support
        return <AllCourses onCreateCourse={() => setActiveSection("create-course")} />;
      case "create-course":
        return (
          <CreateCourse
            onCancel={() => setActiveSection("all-courses")}
            onSuccess={() => setActiveSection("all-courses")}
          />
        );
      case "manage-modules":
        return <ManageModules />;
      case "module-content":
        return <ModuleContent onClose={() => setActiveSection("dashboard")} />;
      case "mcq-management":
        return <MCQManagement />;
      case "course-assignment":
        return <CourseAssignment />;

      // Batch Management
      case "batch-management":
      case "batches": // Legacy support
      case "batch-analytics": // Unified component handles analytics
        return <UnifiedBatchManagement />;
      case "create-batch":
        return <CreateBatch />;
      case "batch-assignments":
        return <BatchAssign />;

      // Test Management
      case "create-test":
        return <CreateTest setActiveSection={setActiveSection} />;
      case "manage-tests": // Consistent with bugfix branch
      case "manage-test": // Consistent with main branch
        return <ManageTest />;
      // case "test-questions":
      //   return <TestQuestionManagement />; // Commented out as component is undefined
      // case "test-evaluation":
      //   return <TestEvaluation />; // Commented out as component is undefined
      // case "test-publishing":
      //   return <TestPublishing />; // Commented out as component is undefined

      // Analytics & Reports
      case "student-analytics":
        return <StudentAnalytics />;
      case "progress-analytics":
        return <ProgressAnalytics />;
      case "test-analytics":
        return <TestAnalytics />;
      case "evaluation-statistics":
        return <EvaluationStatistics />;

      default:
        return (
          <div className="p-6 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Feature Coming Soon
              </h2>
              <p className="text-gray-600">
                This section is under development. Please check back later.
              </p>
            </div>
          </div>
        );
    }
  };

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (status === "unauthenticated") return null;

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-50 to-slate-100">
      <InstructorSidebar
        activeSection={activeSection}
        setActiveSection={setActiveSection}
      />
      <div className="flex-1 overflow-auto">{renderContent()}</div>
    </div>
  );
};

export default InstructorDashboard;