"use client";

import React, { useState, useEffect } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { FaBook, FaGraduationCap, FaChartLine, FaUsers } from "react-icons/fa";

import InstructorSidebar from "../../../components/InstructorSidebar";
import AllCourses from "../../../components/AllCourses";
import CreateCourse from "../../../components/CreateCourse";
import ManageModules from "../../../components/ManageModules";
import ModuleContent from "../../../components/ModuleContent";
import MCQManagement from "../../../components/MCQManagement";
import ModuleMcqManagement from "../../../components/ModuleMcqManagement";

import UnifiedBatchManagement from "@/components/UnifiedBatchManagement";
import CreateTest from "../../../components/CreateTest";
import ManageTest from "../../../components/ManageTest";
import TestAnalytics from "@/components/TestAnalytics";
import CourseAnalytics from "@/components/CourseAnalytics";
import CourseAssignment from "../../../components/CourseAssignment";
import CreateBatch from "@/components/CreateBatch";
import BatchAssign from "@/components/BatchAssign";
import CourseBatchAssignment from "@/components/CourseBatchAssignment";
import MeetingManagement from "@/components/MeetingManagement";
import { API_ENDPOINTS, buildUrl } from "@/config/urls";
import apiClient from "@/utils/axiosInterceptor";

interface StudentsPerCourse {
  courseId: string;
  title: string;
  studentCount: number;
}

interface StudentsPerBatch {
  batchId: string;
  name: string;
  studentCount: number;
}

interface DashboardStats {
  totalCourses: number;
  totalBatches: number;
  totalStudents: number;
  averageStudentsPerCourse: number;
  studentsPerCourse: StudentsPerCourse[];
  studentsPerBatch: StudentsPerBatch[];
}

const InstructorDashboard: React.FC = () => {
  const { status } = useSession();
  const [collapsed, setCollapsed] = useState(false);
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
        setError("");
        const url = buildUrl(API_ENDPOINTS.INSTRUCTOR.DASHBOARD.STATS);
        const response = await apiClient.get(url);
        if (response.data && response.data.stats) {
          setStats(response.data.stats);
        } else {
          setError("No dashboard stats found");
        }
      } catch (err: any) {
        setError(err?.message || "Failed to load dashboard statistics");
        setStats(null);
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
          <div className="p-0 md:p-6 space-y-8 md:space-y-10">
            {/* Header Section */}
            <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-2xl shadow-lg border border-gray-200 p-8 flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-2 drop-shadow-lg">
                  Instructor Dashboard
                </h1>
                <p className="text-white/80 text-lg md:text-xl font-medium">
                  Welcome! Manage your courses, students, and batches with
                  powerful analytics.
                </p>
              </div>
              <div className="flex gap-6">
                <div className="flex flex-col items-center">
                  <FaBook className="w-10 h-10 text-white/80 mb-1" />
                  <span className="text-white font-bold text-xl">
                    {loading ? "-" : stats?.totalCourses || 0}
                  </span>
                  <span className="text-white/70 text-sm">Courses</span>
                </div>
                <div className="flex flex-col items-center">
                  <FaUsers className="w-10 h-10 text-white/80 mb-1" />
                  <span className="text-white font-bold text-xl">
                    {loading ? "-" : stats?.totalStudents || 0}
                  </span>
                  <span className="text-white/70 text-sm">Students</span>
                </div>
                <div className="flex flex-col items-center">
                  <FaGraduationCap className="w-10 h-10 text-white/80 mb-1" />
                  <span className="text-white font-bold text-xl">
                    {loading ? "-" : stats?.totalBatches || 0}
                  </span>
                  <span className="text-white/70 text-sm">Batches</span>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg shadow-md">
                {error}
              </div>
            )}

            {/* Analytics Section */}
            {stats && !loading && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">
                    Course & Batch Analytics
                  </h2>
                  <div className="flex flex-col md:flex-row gap-8">
                    {/* Students Per Course Pie Chart */}
                    <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 flex-1 min-w-[320px] flex flex-col items-center justify-center">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">
                        Students Per Course
                      </h3>
                      <ResponsiveContainer width="100%" height={240}>
                        <PieChart>
                          <Pie
                            data={stats.studentsPerCourse}
                            dataKey="studentCount"
                            nameKey="title"
                            cx="50%"
                            cy="50%"
                            outerRadius={90}
                            innerRadius={50}
                            label={({ title }) => title}
                          >
                            {stats.studentsPerCourse.map((entry, idx) => (
                              <Cell
                                key={`cell-course-${idx}`}
                                fill={
                                  [
                                    "#6366f1",
                                    "#818cf8",
                                    "#a5b4fc",
                                    "#f472b6",
                                    "#fbbf24",
                                    "#34d399",
                                    "#60a5fa",
                                  ][idx % 7]
                                }
                              />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend verticalAlign="bottom" height={36} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    {/* Students Per Batch Pie Chart */}
                    <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 flex-1 min-w-[320px] flex flex-col items-center justify-center">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">
                        Students Per Batch
                      </h3>
                      <ResponsiveContainer width="100%" height={240}>
                        <PieChart>
                          <Pie
                            data={stats.studentsPerBatch}
                            dataKey="studentCount"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={90}
                            innerRadius={50}
                            label={({ name }) => name}
                          >
                            {stats.studentsPerBatch.map((entry, idx) => (
                              <Cell
                                key={`cell-batch-${idx}`}
                                fill={
                                  [
                                    "#ec4899",
                                    "#f472b6",
                                    "#fbbf24",
                                    "#34d399",
                                    "#60a5fa",
                                    "#818cf8",
                                    "#6366f1",
                                  ][idx % 7]
                                }
                              />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend verticalAlign="bottom" height={36} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Quick Actions Section */}
                <div className="bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 rounded-2xl shadow-md border border-gray-100 p-6 flex flex-col md:flex-row gap-6 items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Quick Actions
                    </h3>
                    <div className="space-y-2">
                      <button
                        onClick={() => setActiveSection("create-course")}
                        className="w-full text-left px-4 py-2 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors font-semibold shadow"
                      >
                        + Create New Course
                      </button>
                      <button
                        onClick={() => setActiveSection("all-courses")}
                        className="w-full text-left px-4 py-2 text-sm bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors font-semibold shadow"
                      >
                        Manage Courses
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 items-center">
                    <span className="text-gray-700 text-sm">
                      Tip: Scroll charts horizontally for more data
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      // Course Management
      case "all-courses":
      case "courses-overview": // Legacy support
        return (
          <AllCourses
            onCreateCourse={() => setActiveSection("create-course")}
          />
        );
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
      case "module-mcq-management":
        return <ModuleMcqManagement />;

      // Test Management
      case "create-test":
        return <CreateTest setActiveSection={setActiveSection} />;
      case "test-management":
        return <ManageTest />;

      case "course-assignment":
        return <CourseAssignment />;
      case "batch-assignments":
        return <BatchAssign />;
      case "course-batch-assignment":
        return <CourseBatchAssignment />;
      case "meeting-management":
        return <MeetingManagement />;

      // Analytics & Reports
      // case "student-analytics":
      //   return <StudentAnalytics />;
      // case "progress-analytics":
      //   return <ProgressAnalytics />;
      // case "evaluation-statistics":
      //   return <EvaluationStatistics />;
      case "test-analytics":
        return <TestAnalytics />;
      case "course-analytics":
        return <CourseAnalytics />;

      // Batch Management
      case "batch-management":
      case "batches": // Legacy support
      case "batch-analytics": // Unified component handles analytics
        return <UnifiedBatchManagement />;
      case "create-batch":
        return <CreateBatch />;

      // NEW: Assigning Section

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
        collapsed={collapsed}
        setCollapsed={setCollapsed}
      />
      <div className="flex-1 overflow-auto">{renderContent()}</div>
    </div>
  );
};

export default InstructorDashboard;
