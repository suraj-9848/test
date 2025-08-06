import React, { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import apiClient from "../utils/axiosInterceptor";
import { API_ENDPOINTS } from "../config/urls";
import {
  FaUsers,
  FaGraduationCap,
  FaBook,
  FaChartLine,
  FaTrophy,
  FaClipboardCheck,
  FaExclamationTriangle,
  FaEye,
  FaDownload,
} from "react-icons/fa";
import * as XLSX from "xlsx";

// Interfaces based on the API response
interface MCQData {
  id: string;
  passingScore: number;
  totalQuestions: number;
  attempted: boolean;
  score: number;
  percentage: number;
  passed: boolean;
}

interface ModuleAnalytics {
  moduleId: string;
  moduleTitle: string;
  completedDays: number;
  totalDays: number;
  allDaysCompleted: boolean;
  mcq: MCQData;
  moduleFullyCompleted: boolean;
}

interface StudentAnalytics {
  studentId: string;
  studentName: string;
  modulesCompleted: number;
  totalModules: number;
  courseCompleted: boolean;
  completionPercentage: number;
  modules: ModuleAnalytics[];
}

interface CourseAnalyticsData {
  message: string;
  courseId: string;
  courseTitle: string;
  analytics: StudentAnalytics[];
}

interface Batch {
  id: string;
  name: string;
  description?: string;
}

interface Course {
  id: string;
  title: string;
  description?: string;
}

interface CourseAnalyticsProps {
  onClose?: () => void;
}

const CourseAnalytics: React.FC<CourseAnalyticsProps> = ({ onClose }) => {
  const { data: session, status } = useSession();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<string>("");
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [analyticsData, setAnalyticsData] =
    useState<CourseAnalyticsData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const mountedRef = useRef<boolean>(true);

  // Fetch batches
  const fetchBatches = useCallback(async () => {
    if (!mountedRef.current) return;

    try {
      setLoading(true);
      setError("");

      const response = await apiClient.get(API_ENDPOINTS.INSTRUCTOR.BATCHES);

      if (!mountedRef.current) return;

      const batchList = response?.data?.batches || [];
      setBatches(batchList);

      if (batchList.length > 0) {
        setSelectedBatch(batchList[0].id);
        await fetchCoursesForBatch(batchList[0].id);
      }
    } catch (err: any) {
      console.error("Error fetching batches:", err);
      if (mountedRef.current) {
        setError("Failed to load batches");
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  // Fetch courses for selected batch
  const fetchCoursesForBatch = useCallback(async (batchId: string) => {
    if (!batchId || !mountedRef.current) return;

    try {
      setLoading(true);
      setError("");

      const response = await apiClient.get(
        API_ENDPOINTS.INSTRUCTOR.BATCH_COURSES(batchId),
      );

      if (!mountedRef.current) return;

      const courseList = response?.data?.courses || [];
      setCourses(courseList);

      if (courseList.length > 0) {
        setSelectedCourse(courseList[0].id);
        await fetchCourseAnalytics(batchId, courseList[0].id);
      } else {
        setSelectedCourse("");
        setAnalyticsData(null);
      }
    } catch (err: any) {
      console.error("Error fetching courses:", err);
      if (mountedRef.current) {
        setError("Failed to load courses for the selected batch");
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  // Fetch course analytics
  const fetchCourseAnalytics = useCallback(
    async (batchId: string, courseId: string) => {
      if (!batchId || !courseId || !mountedRef.current) return;

      try {
        setLoading(true);
        setError("");

        const response = await apiClient.get(
          API_ENDPOINTS.INSTRUCTOR.ANALYTICS.COURSE_ANALYTICS(
            batchId,
            courseId,
          ),
        );

        if (!mountedRef.current) return;

        setAnalyticsData(response.data);
      } catch (err: any) {
        console.error("Error fetching course analytics:", err);
        if (mountedRef.current) {
          setError("Failed to load course analytics");
          setAnalyticsData(null);
        }
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    },
    [],
  );

  // Initialize component
  useEffect(() => {
    mountedRef.current = true;

    if (status === "authenticated") {
      fetchBatches();
    }

    return () => {
      mountedRef.current = false;
    };
  }, [status, fetchBatches]);

  // Handle batch selection
  const handleBatchChange = useCallback(
    (batchId: string) => {
      setSelectedBatch(batchId);
      setSelectedCourse("");
      setCourses([]);
      setAnalyticsData(null);
      if (batchId) {
        fetchCoursesForBatch(batchId);
      }
    },
    [fetchCoursesForBatch],
  );

  // Handle course selection
  const handleCourseChange = useCallback(
    (courseId: string) => {
      setSelectedCourse(courseId);
      setAnalyticsData(null);
      if (selectedBatch && courseId) {
        fetchCourseAnalytics(selectedBatch, courseId);
      }
    },
    [selectedBatch, fetchCourseAnalytics],
  );

  // Calculate summary statistics
  const calculateSummaryStats = () => {
    if (!analyticsData?.analytics) return null;

    const students = analyticsData.analytics;
    const totalStudents = students.length;
    const completedStudents = students.filter((s) => s.courseCompleted).length;
    const averageProgress =
      totalStudents > 0
        ? Math.round(
            students.reduce((sum, s) => sum + s.completionPercentage, 0) /
              totalStudents,
          )
        : 0;

    // Module completion stats
    const allModules = students.flatMap((s) => s.modules);
    const totalModules = allModules.length;
    const completedModules = allModules.filter(
      (m) => m.moduleFullyCompleted,
    ).length;

    // MCQ stats
    const mcqAttempts = allModules.filter((m) => m.mcq?.attempted);
    const mcqPassed = allModules.filter((m) => m.mcq?.passed);
    const averageMcqScore =
      mcqAttempts.length > 0
        ? Math.round(
            mcqAttempts.reduce((sum, m) => sum + (m.mcq?.percentage || 0), 0) /
              mcqAttempts.length,
          )
        : 0;

    return {
      totalStudents,
      completedStudents,
      averageProgress,
      totalModules,
      completedModules,
      mcqAttempts: mcqAttempts.length,
      mcqPassed: mcqPassed.length,
      averageMcqScore,
    };
  };

  // Export analytics data to Excel
  const exportToExcel = () => {
    if (!analyticsData?.analytics) return;

    const exportData = analyticsData.analytics.map((student) => ({
      "Student Name": student.studentName,
      "Student ID": student.studentId,
      "Modules Completed": student.modulesCompleted,
      "Total Modules": student.totalModules,
      "Completion Percentage": `${student.completionPercentage}%`,
      "Course Completed": student.courseCompleted ? "Yes" : "No",
      "Module Details": student.modules
        .map(
          (m) =>
            `${m.moduleTitle}: ${m.completedDays}/${m.totalDays} days, MCQ: ${
              m.mcq?.attempted ? `${m.mcq.percentage}%` : "Not attempted"
            }`,
        )
        .join(" | "),
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Course Analytics");

    const fileName = `course-analytics-${analyticsData.courseTitle.replace(
      /\s+/g,
      "-",
    )}-${new Date().toISOString().split("T")[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  const stats = calculateSummaryStats();

  // Loading state
  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {status === "loading"
              ? "Authenticating..."
              : "Loading analytics..."}
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full mx-4 bg-white border border-red-200 rounded-lg shadow-sm p-6">
          <div className="flex items-center mb-4">
            <FaExclamationTriangle className="text-red-500 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">Error</h2>
          </div>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => {
              setError("");
              fetchBatches();
            }}
            className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <FaChartLine className="text-blue-600" />
                Course Analytics
              </h1>
              <p className="text-gray-600 mt-1">
                Track student progress and performance across course modules
              </p>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Batch
              </label>
              <select
                value={selectedBatch}
                onChange={(e) => handleBatchChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Batch</option>
                {batches.map((batch) => (
                  <option key={batch.id} value={batch.id}>
                    {batch.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Course
              </label>
              <select
                value={selectedCourse}
                onChange={(e) => handleCourseChange(e.target.value)}
                disabled={!selectedBatch}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
              >
                <option value="">Select Course</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Analytics Content */}
        {analyticsData ? (
          <>
            {/* Course Title */}
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                {analyticsData.courseTitle}
              </h2>
              <p className="text-gray-600">
                {batches.find((b) => b.id === selectedBatch)?.name}
              </p>
            </div>

            {/* Summary Statistics */}
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Total Students
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {stats.totalStudents}
                      </p>
                    </div>
                    <FaUsers className="text-2xl text-blue-600" />
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Completed
                      </p>
                      <p className="text-2xl font-bold text-green-600">
                        {stats.completedStudents}
                      </p>
                    </div>
                    <FaTrophy className="text-2xl text-green-600" />
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Avg Progress
                      </p>
                      <p className="text-2xl font-bold text-purple-600">
                        {stats.averageProgress}%
                      </p>
                    </div>
                    <FaChartLine className="text-2xl text-purple-600" />
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        MCQ Avg Score
                      </p>
                      <p className="text-2xl font-bold text-orange-600">
                        {stats.averageMcqScore}%
                      </p>
                    </div>
                    <FaClipboardCheck className="text-2xl text-orange-600" />
                  </div>
                </div>
              </div>
            )}

            {/* Export Button */}
            <div className="flex justify-end mb-6">
              <button
                onClick={exportToExcel}
                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                <FaDownload />
                Export to Excel
              </button>
            </div>

            {/* Student Analytics Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h3 className="text-lg font-semibold text-gray-900">
                  Student Progress Details
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Progress
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Modules Completed
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Course Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {analyticsData.analytics.map((student) => (
                      <tr key={student.studentId} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <FaGraduationCap className="text-blue-500 mr-3" />
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {student.studentName}
                              </div>
                              <div className="text-sm text-gray-500">
                                ID: {student.studentId}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-full bg-gray-200 rounded-full h-2 mr-3">
                              <div
                                className={`h-2 rounded-full ${
                                  student.completionPercentage >= 80
                                    ? "bg-green-500"
                                    : student.completionPercentage >= 60
                                      ? "bg-yellow-500"
                                      : student.completionPercentage >= 40
                                        ? "bg-orange-500"
                                        : "bg-red-500"
                                }`}
                                style={{
                                  width: `${student.completionPercentage}%`,
                                }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium text-gray-900 min-w-0">
                              {student.completionPercentage}%
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {student.modulesCompleted}/{student.totalModules}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              student.courseCompleted
                                ? "bg-green-100 text-green-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {student.courseCompleted
                              ? "Completed"
                              : "In Progress"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button className="text-blue-600 hover:text-blue-900 flex items-center gap-1">
                            <FaEye />
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Module-wise Analytics */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Module-wise Performance
              </h3>
              {analyticsData.analytics.length > 0 &&
                analyticsData.analytics[0].modules.map((module) => {
                  const moduleStats = analyticsData.analytics.map((student) =>
                    student.modules.find((m) => m.moduleId === module.moduleId),
                  );
                  const completedCount = moduleStats.filter(
                    (m) => m?.moduleFullyCompleted,
                  ).length;
                  const mcqAttemptedCount = moduleStats.filter(
                    (m) => m?.mcq?.attempted,
                  ).length;
                  const mcqPassedCount = moduleStats.filter(
                    (m) => m?.mcq?.passed,
                  ).length;

                  return (
                    <div
                      key={module.moduleId}
                      className="border border-gray-200 rounded-lg p-4 mb-4"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="text-md font-semibold text-gray-900">
                            {module.moduleTitle}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {module.totalDays} days •{" "}
                            {module.mcq.totalQuestions} MCQ questions
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">
                            {completedCount}/{analyticsData.analytics.length}{" "}
                            completed
                          </p>
                          <p className="text-xs text-gray-500">
                            MCQ: {mcqPassedCount}/{mcqAttemptedCount} passed
                          </p>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{
                            width: `${
                              (completedCount /
                                analyticsData.analytics.length) *
                              100
                            }%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </>
        ) : selectedBatch && selectedCourse ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <div className="text-gray-400 text-4xl mb-4">📊</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Analytics Data
            </h3>
            <p className="text-gray-600">
              No analytics data available for the selected course
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <div className="text-gray-400 text-4xl mb-4">🎯</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Select Course
            </h3>
            <p className="text-gray-600">
              Please select both a batch and course to view analytics
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseAnalytics;
