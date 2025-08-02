import React, { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { FaChartLine, FaUsers, FaBook, FaSpinner } from "react-icons/fa";
import apiClient from "../utils/axiosInterceptor";
import { API_ENDPOINTS } from "../config/urls";

// Simplified types
interface ProgressData {
  studentId: string;
  username: string;
  courseId: string;
  courseName: string;
  progressPercentage: number;
  status: "not-started" | "in-progress" | "completed";
  timeSpent: number;
  lastAccessed: string;
}

interface Batch {
  id: string;
  name: string;
}

interface Course {
  id: string;
  title: string;
}

interface ProgressAnalyticsProps {
  onClose?: () => void;
}

const ProgressAnalytics: React.FC<ProgressAnalyticsProps> = ({ onClose }) => {
  const { data: session, status } = useSession();

  // State
  const [progressData, setProgressData] = useState<ProgressData[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<string>("");
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  // Refs for cleanup
  const mountedRef = useRef(true);

  // Cleanup is now handled in the main useEffect below

  // Fetch progress data
  const fetchProgressData = useCallback(
    async (batchId: string, courseId: string) => {
      if (!batchId || !courseId || !mountedRef.current) {
        return;
      }

      try {
        setLoading(true);
        setError("");

        console.log(
          `Fetching progress for batch: ${batchId}, course: ${courseId}`,
        );

        const progressResponse = await apiClient.get(
          `${API_ENDPOINTS.INSTRUCTOR.BATCHES}/${batchId}/courses/${courseId}/progress`,
        );

        if (mountedRef.current && progressResponse.data) {
          const progressData = progressResponse.data.report || [];
          console.log("Progress data received:", progressData);
          // Transform the data to match the expected ProgressData interface
          const transformedData: ProgressData[] = progressData.map(
            (item: any) => ({
              studentId: item.studentId,
              studentName: item.username,
              progress: item.currentPage || 0,
              modulesCompleted: item.currentPage || 0, // Use currentPage as modules completed
              totalModules: 10, // Mock total - adjust based on your course structure
              lastActivity: new Date().toISOString(), // Mock - backend doesn't provide this
              status: item.status || "not-started",
            }),
          );
          setProgressData(transformedData);
        }
      } catch (err: any) {
        console.error("Error fetching progress data:", err);
        if (mountedRef.current) {
          setError("Failed to load progress data");
        }
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    },
    [],
  );

  // Fetch courses for batch
  const fetchCoursesForBatch = useCallback(
    async (batchId: string) => {
      if (!batchId || !mountedRef.current) {
        return;
      }

      try {
        console.log(`📋 Fetching courses for batch: ${batchId}`);
        const coursesResponse = await apiClient.get(
          API_ENDPOINTS.INSTRUCTOR.BATCH_COURSES(batchId),
        );

        if (!coursesResponse || !mountedRef.current) return;

        const responseData = coursesResponse.data;
        const courseList = responseData.courses || [];

        setCourses(courseList);

        if (courseList.length > 0) {
          setSelectedCourse(courseList[0].id);
          await fetchProgressData(batchId, courseList[0].id);
        }
      } catch (err: any) {
        console.error(" Error fetching courses:", err);
        if (mountedRef.current) {
          setError("Failed to load courses for the selected batch");
        }
      }
    },
    [], // Remove dependency to prevent loops
  );

  // Fetch initial data
  const fetchInitialData = useCallback(async () => {
    if (!mountedRef.current) {
      return;
    }

    // Let axios interceptor handle authentication
    if (status === "loading") {
      return;
    }

    try {
      setLoading(true);
      setError("");

      console.log("🚀 ProgressAnalytics - Fetching batches...");
      const batchesResponse = await apiClient.get(
        API_ENDPOINTS.INSTRUCTOR.BATCHES,
      );

      if (!batchesResponse || !mountedRef.current) return;

      const responseData = batchesResponse.data;
      const batchList = responseData.batches || [];

      console.log(" ProgressAnalytics - Batches received:", batchList.length);
      setBatches(batchList);

      if (batchList.length > 0) {
        setSelectedBatch(batchList[0].id);
        await fetchCoursesForBatch(batchList[0].id);
      }
    } catch (err: any) {
      console.error(" ProgressAnalytics - Error fetching initial data:", err);
      if (mountedRef.current) {
        setError("Failed to load initial data");
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, []); // Remove dependencies

  // Initialize data on component mount
  useEffect(() => {
    console.log("🚀 ProgressAnalytics - Component mounted");

    // Ensure mountedRef is set to true
    mountedRef.current = true;
    console.log("🔧 ProgressAnalytics mountedRef set to:", mountedRef.current);

    fetchInitialData();

    return () => {
      console.log(
        "🧹 ProgressAnalytics - Component cleanup, setting mountedRef to false",
      );
      mountedRef.current = false;
    };
  }, []); // No dependencies - fetchInitialData handles its own conditions

  // Handle batch change
  const handleBatchChange = useCallback((batchId: string) => {
    if (!mountedRef.current) return;

    setSelectedBatch(batchId);
    setSelectedCourse("");
    setCourses([]);
    setProgressData([]);

    if (batchId) {
      fetchCoursesForBatch(batchId);
    }
  }, []); // Remove dependency

  // Handle course change
  const handleCourseChange = useCallback(
    async (courseId: string) => {
      if (!mountedRef.current) return;

      setSelectedCourse(courseId);
      setProgressData([]);

      if (selectedBatch && courseId) {
        console.log(
          "📊 PROGRESS ANALYTICS: Fetching progress data for batch:",
          selectedBatch,
          "course:",
          courseId,
        );
        await fetchProgressData(selectedBatch, courseId);
      }
    },
    [selectedBatch],
  ); // Keep selectedBatch dependency but remove fetchProgressData

  // Calculate statistics
  const calculateStats = () => {
    if (!progressData.length) return null;

    const totalStudents = progressData.length;
    const completedStudents = progressData.filter(
      (p) => p.status === "completed",
    ).length;
    const inProgressStudents = progressData.filter(
      (p) => p.status === "in-progress",
    ).length;
    const averageProgress =
      progressData.reduce((sum, p) => sum + p.progressPercentage, 0) /
      totalStudents;

    return {
      totalStudents,
      completedStudents,
      inProgressStudents,
      averageProgress: Math.round(averageProgress),
    };
  };

  const stats = calculateStats();

  // Show loading for authentication
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="animate-spin text-4xl text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Authenticating...</p>
        </div>
      </div>
    );
  }

  // Render loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="animate-spin text-4xl text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading progress analytics...</p>
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-sm border border-red-200 p-6 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="text-red-600 text-4xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Error Loading Progress Analytics
            </h2>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => {
                setError("");
                fetchInitialData();
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FaChartLine className="text-2xl text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Progress Analytics
                </h1>
                <p className="text-gray-600">
                  Track student progress across courses and modules
                </p>
              </div>
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
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Batch
              </label>
              <select
                value={selectedBatch}
                onChange={(e) => handleBatchChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={!selectedBatch}
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

        {/* Statistics Cards */}
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
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-green-600">
                    {stats.completedStudents}
                  </p>
                </div>
                <FaBook className="text-2xl text-green-600" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    In Progress
                  </p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {stats.inProgressStudents}
                  </p>
                </div>
                <FaSpinner className="text-2xl text-yellow-600" />
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
          </div>
        )}

        {/* Progress Data */}
        {!selectedBatch || !selectedCourse ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <div className="text-gray-400 text-4xl mb-4">📊</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Select Batch and Course
            </h3>
            <p className="text-gray-600">
              Please select both a batch and course to view progress analytics
            </p>
          </div>
        ) : progressData.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <div className="text-gray-400 text-4xl mb-4">📈</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Progress Data
            </h3>
            <p className="text-gray-600">
              No progress data found for the selected batch and course
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Student Progress Details ({progressData.length} students)
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Course
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Progress
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Time Spent
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Accessed
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {progressData.map((progress) => (
                    <tr
                      key={`${progress.studentId}-${progress.courseId}`}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {progress.username}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {progress.courseName}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{
                                width: `${progress.progressPercentage}%`,
                              }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-900">
                            {progress.progressPercentage}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            progress.status === "completed"
                              ? "bg-green-100 text-green-800"
                              : progress.status === "in-progress"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {progress.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {Math.round(progress.timeSpent / 60)}h{" "}
                        {progress.timeSpent % 60}m
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(progress.lastAccessed).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProgressAnalytics;
