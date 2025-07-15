import React, { useState, useEffect, useCallback } from "react";
import {
  FaChartLine,
  FaUsers,
  FaBook,
  FaGraduationCap,
  FaSpinner,
  FaClock,
  FaFilter,
  FaSearch,
  FaChevronDown,
  FaChevronUp,
  FaFileExport,
  FaClipboardList,
  FaChartBar,
  FaPercent,
  FaCheckCircle,
  FaTimesCircle,
} from "react-icons/fa";
import { useSession } from "next-auth/react";
import axios from "axios";

// Types
interface ProgressData {
  studentId: string;
  username: string;
  courseId: string;
  courseName: string;
  moduleId: string;
  moduleName: string;
  currentPage: number;
  totalPages: number;
  status: "not-started" | "in-progress" | "completed";
  progressPercentage: number;
  timeSpent: number;
  lastAccessed: string;
  startDate: string;
  completionDate?: string;
}

interface SessionProgress {
  sessionId: string;
  sessionName: string;
  students: Array<{
    studentId: string;
    username: string;
    status: "not-started" | "in-progress" | "completed";
    progressPercentage: number;
    timeSpent: number;
    lastAccessed: string;
  }>;
  totalStudents: number;
  completedStudents: number;
  inProgressStudents: number;
  notStartedStudents: number;
}

interface Batch {
  id: string;
  name: string;
  description: string;
}

interface Course {
  id: string;
  title: string;
  description: string;
}

interface Module {
  id: string;
  title: string;
  order: number;
  isLocked: boolean;
}

interface Session {
  id: string;
  name: string;
  description: string;
}

const ProgressAnalytics: React.FC = () => {
  const { data: session } = useSession();

  // State
  const [batches, setBatches] = useState<Batch[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [sessions] = useState<Session[]>([]);
  const [progressData, setProgressData] = useState<ProgressData[]>([]);
  const [sessionProgress, setSessionProgress] = useState<SessionProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [selectedView, setSelectedView] = useState<"course" | "session">(
    "course"
  );
  const [selectedBatch, setSelectedBatch] = useState<string>("");
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [selectedModule, setSelectedModule] = useState<string>("");
  const [selectedSession, setSelectedSession] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(
    new Set()
  );
  const [backendJwt, setBackendJwt] = useState<string>("");

  // API Base URL
  const API_BASE_URL =
    process.env.NEXT_PUBLIC_BACKEND_BASE_URL || "http://localhost:3000";

  // API Helper
  const apiCall = useCallback(
    async (endpoint: string, options: RequestInit = {}) => {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
          Authorization: `Bearer ${backendJwt}`,
          "Content-Type": "application/json",
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      return response.json();
    },
    [API_BASE_URL, backendJwt]
  );

  const fetchCourseProgress = useCallback(
    async (batchId: string, courseId: string) => {
      try {
        const response = await apiCall(
          `/api/instructor/batches/${batchId}/courses/${courseId}/progress`
        );

        // Process the progress data
        const processedData: ProgressData[] =
          response.report?.map(
            (item: {
              studentId: string;
              username: string;
              moduleId?: string;
              moduleName?: string;
              currentPage?: number;
              totalPages?: number;
              status?: string;
              progressPercentage?: number;
              timeSpent?: number;
              lastAccessed?: string;
              startDate?: string;
              completionDate?: string;
            }) => ({
              studentId: item.studentId,
              username: item.username,
              courseId: courseId,
              courseName:
                courses.find((c) => c.id === courseId)?.title || "Course",
              moduleId: item.moduleId || "",
              moduleName: item.moduleName || "",
              currentPage: item.currentPage || 0,
              totalPages: item.totalPages || 0,
              status:
                (item.status as "not-started" | "in-progress" | "completed") ||
                "not-started",
              progressPercentage: item.progressPercentage || 0,
              timeSpent: item.timeSpent || 0,
              lastAccessed: item.lastAccessed || new Date().toISOString(),
              startDate: item.startDate || new Date().toISOString(),
              completionDate: item.completionDate,
            })
          ) || [];

        setProgressData(processedData);
      } catch (err) {
        console.error("Error fetching course progress:", err);
        setError("Failed to load course progress");
      }
    },
    [apiCall, courses]
  );

  const fetchModules = useCallback(
    async (batchId: string, courseId: string) => {
      try {
        const response = await apiCall(
          `/api/instructor/batches/${batchId}/courses/${courseId}/modules`
        );
        setModules(response);
      } catch (err) {
        console.error("Error fetching modules:", err);
        setError("Failed to load modules");
      }
    },
    [apiCall]
  );

  const fetchCourses = useCallback(
    async (batchId: string) => {
      try {
        const response = await apiCall(
          `/api/instructor/batches/${batchId}/courses`
        );
        setCourses(response);
        if (response.length > 0) {
          setSelectedCourse(response[0].id);
          await fetchModules(batchId, response[0].id);
          await fetchCourseProgress(batchId, response[0].id);
        }
      } catch (err) {
        console.error("Error fetching courses:", err);
        setError("Failed to load courses");
      }
    },
    [apiCall, fetchModules, fetchCourseProgress]
  );

  const fetchInitialData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiCall("/api/instructor/batches");
      setBatches(response);
      if (response.length > 0) {
        setSelectedBatch(response[0].id);
        await fetchCourses(response[0].id);
      }
    } catch (err) {
      console.error("Error fetching initial data:", err);
      setError("Failed to load initial data");
    } finally {
      setLoading(false);
    }
  }, [apiCall, fetchCourses]);

  // Fetch user profile and get JWT
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_BACKEND_BASE_URL || "";
        const googleIdToken = (session as { id_token?: string })?.id_token;
        if (!googleIdToken) {
          console.error("No Google ID token found");
          return;
        }

        const loginRes = await axios.post(
          `${baseUrl}/api/auth/admin-login`,
          {},
          {
            headers: { Authorization: `Bearer ${googleIdToken}` },
            withCredentials: true,
          }
        );
        const jwt = loginRes.data.token;
        setBackendJwt(jwt);
      } catch (err) {
        console.error("Failed to fetch user profile:", err);
        setError("Failed to authenticate");
      }
    };

    if (session) fetchProfile();
  }, [session]);

  // Fetch initial data
  useEffect(() => {
    if (backendJwt) {
      fetchInitialData();
    }
  }, [backendJwt, fetchInitialData]);

  const fetchSessionProgress = useCallback(
    async (sessionId: string) => {
      try {
        const response = await apiCall(
          `/api/instructor/sessions/${sessionId}/progress`
        );

        // Process the session progress data
        const processedData: SessionProgress[] =
          response.sessions?.map(
            (session: {
              id: string;
              name: string;
              students?: unknown[];
              totalStudents?: number;
              completedStudents?: number;
              inProgressStudents?: number;
              notStartedStudents?: number;
            }) => ({
              sessionId: session.id,
              sessionName: session.name,
              students: session.students || [],
              totalStudents: session.totalStudents || 0,
              completedStudents: session.completedStudents || 0,
              inProgressStudents: session.inProgressStudents || 0,
              notStartedStudents: session.notStartedStudents || 0,
            })
          ) || [];

        setSessionProgress(processedData);
      } catch (err) {
        console.error("Error fetching session progress:", err);
        setError("Failed to load session progress");
      }
    },
    [apiCall]
  );

  const handleBatchChange = (batchId: string) => {
    setSelectedBatch(batchId);
    setSelectedCourse("");
    setSelectedModule("");
    setCourses([]);
    setModules([]);
    setProgressData([]);
    if (batchId) {
      fetchCourses(batchId);
    }
  };

  const handleCourseChange = (courseId: string) => {
    setSelectedCourse(courseId);
    setSelectedModule("");
    setModules([]);
    setProgressData([]);
    if (selectedBatch && courseId) {
      fetchModules(selectedBatch, courseId);
      fetchCourseProgress(selectedBatch, courseId);
    }
  };

  const handleModuleChange = (moduleId: string) => {
    setSelectedModule(moduleId);
    // Filter progress data by module if needed
    if (moduleId) {
      const filteredData = progressData.filter(
        (item) => item.moduleId === moduleId
      );
      setProgressData(filteredData);
    } else {
      // Reload all course progress
      if (selectedBatch && selectedCourse) {
        fetchCourseProgress(selectedBatch, selectedCourse);
      }
    }
  };

  const handleSessionChange = (sessionId: string) => {
    setSelectedSession(sessionId);
    if (sessionId) {
      fetchSessionProgress(sessionId);
    }
  };

  const filteredProgressData = progressData.filter((item) => {
    if (
      searchTerm &&
      !item.username.toLowerCase().includes(searchTerm.toLowerCase())
    ) {
      return false;
    }
    if (statusFilter && item.status !== statusFilter) {
      return false;
    }
    return true;
  });

  const calculateOverallStats = () => {
    if (filteredProgressData.length === 0) return null;

    const totalStudents = filteredProgressData.length;
    const completedStudents = filteredProgressData.filter(
      (s) => s.status === "completed"
    ).length;
    const inProgressStudents = filteredProgressData.filter(
      (s) => s.status === "in-progress"
    ).length;
    const notStartedStudents = filteredProgressData.filter(
      (s) => s.status === "not-started"
    ).length;

    const averageProgress =
      filteredProgressData.reduce((sum, s) => sum + s.progressPercentage, 0) /
      totalStudents;
    const totalTimeSpent = filteredProgressData.reduce(
      (sum, s) => sum + s.timeSpent,
      0
    );
    const averageTimeSpent = totalTimeSpent / totalStudents;

    return {
      totalStudents,
      completedStudents,
      inProgressStudents,
      notStartedStudents,
      averageProgress: Math.round(averageProgress),
      averageTimeSpent: Math.round(averageTimeSpent),
      completionRate: Math.round((completedStudents / totalStudents) * 100),
    };
  };

  const exportProgressData = () => {
    const headers = [
      "Student ID",
      "Username",
      "Course",
      "Module",
      "Status",
      "Progress %",
      "Time Spent (mins)",
      "Last Accessed",
    ];
    const rows = filteredProgressData.map((item) => [
      item.studentId,
      item.username,
      item.courseName,
      item.moduleName,
      item.status,
      `${item.progressPercentage}%`,
      item.timeSpent,
      new Date(item.lastAccessed).toLocaleDateString(),
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.join(","))
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", "progress-analytics.csv");
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const toggleSessionExpansion = (sessionId: string) => {
    setExpandedSessions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(sessionId)) {
        newSet.delete(sessionId);
      } else {
        newSet.add(sessionId);
      }
      return newSet;
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <FaCheckCircle className="w-5 h-5 text-green-500" />;
      case "in-progress":
        return <FaClock className="w-5 h-5 text-yellow-500" />;
      case "not-started":
        return <FaTimesCircle className="w-5 h-5 text-red-500" />;
      default:
        return <FaClock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "in-progress":
        return "bg-yellow-100 text-yellow-800";
      case "not-started":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const stats = calculateOverallStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <FaSpinner className="animate-spin text-blue-600" />
          <span>Loading progress analytics...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <span className="text-red-600">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Progress Analytics
            </h1>
            <p className="text-gray-600">
              Track student progress across courses and sessions
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <FaFilter className="w-4 h-4" />
              <span>Filters</span>
            </button>
            <button
              onClick={exportProgressData}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            >
              <FaFileExport className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1 mb-6">
          <button
            onClick={() => setSelectedView("course")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              selectedView === "course"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Course Progress
          </button>
          <button
            onClick={() => setSelectedView("session")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              selectedView === "session"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Session Progress
          </button>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FaGraduationCap className="inline w-4 h-4 mr-2" />
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

              {selectedView === "course" && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <FaBook className="inline w-4 h-4 mr-2" />
                      Course
                    </label>
                    <select
                      value={selectedCourse}
                      onChange={(e) => handleCourseChange(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <FaClipboardList className="inline w-4 h-4 mr-2" />
                      Module
                    </label>
                    <select
                      value={selectedModule}
                      onChange={(e) => handleModuleChange(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={!selectedCourse}
                    >
                      <option value="">All Modules</option>
                      {modules.map((module) => (
                        <option key={module.id} value={module.id}>
                          {module.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {selectedView === "session" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Session
                  </label>
                  <select
                    value={selectedSession}
                    onChange={(e) => handleSessionChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Session</option>
                    {sessions.map((session) => (
                      <option key={session.id} value={session.id}>
                        {session.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search Students
                </label>
                <div className="relative">
                  <FaSearch className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by username..."
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status Filter
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Status</option>
                  <option value="not-started">Not Started</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      {stats && selectedView === "course" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Students
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalStudents}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <FaUsers className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.completedStudents}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <FaCheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {stats.inProgressStudents}
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <FaClock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Avg Progress
                </p>
                <p className="text-2xl font-bold text-blue-600">
                  {stats.averageProgress}%
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <FaPercent className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Completion Rate
                </p>
                <p className="text-2xl font-bold text-purple-600">
                  {stats.completionRate}%
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <FaChartBar className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Course Progress View */}
      {selectedView === "course" && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Course Progress Details
          </h2>

          {filteredProgressData.length === 0 ? (
            <div className="text-center py-8">
              <FaChartLine className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Progress Data
              </h3>
              <p className="text-gray-600">
                Select a batch and course to view progress analytics.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-600">
                      Student
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">
                      Status
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">
                      Progress
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">
                      Pages
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">
                      Time Spent
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">
                      Last Accessed
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProgressData.map((item, index) => (
                    <tr
                      key={`${item.studentId}-${item.courseId}`}
                      className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-3">
                          {getStatusIcon(item.status)}
                          <div>
                            <div className="font-medium text-gray-900">
                              {item.username}
                            </div>
                            <div className="text-sm text-gray-500">
                              {item.studentId}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                            item.status
                          )}`}
                        >
                          {item.status.replace("-", " ").toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${item.progressPercentage}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium text-gray-900">
                            {item.progressPercentage}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-gray-600">
                          {item.currentPage}/{item.totalPages}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-gray-600">
                          {Math.round(item.timeSpent / 60)}h{" "}
                          {item.timeSpent % 60}m
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-gray-600">
                          {new Date(item.lastAccessed).toLocaleDateString()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Session Progress View */}
      {selectedView === "session" && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Session Progress Details
          </h2>

          {sessionProgress.length === 0 ? (
            <div className="text-center py-8">
              <FaChartLine className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Session Data
              </h3>
              <p className="text-gray-600">
                Select a session to view progress analytics.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {sessionProgress.map((session) => (
                <div
                  key={session.sessionId}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <button
                    onClick={() => toggleSessionExpansion(session.sessionId)}
                    className="w-full flex items-center justify-between text-left"
                  >
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {session.sessionName}
                      </h3>
                      <span className="text-sm text-gray-500">
                        ({session.totalStudents} students)
                      </span>
                    </div>
                    {expandedSessions.has(session.sessionId) ? (
                      <FaChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <FaChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </button>

                  <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-green-50 rounded-lg p-3">
                      <div className="text-sm text-green-600">Completed</div>
                      <div className="text-2xl font-bold text-green-700">
                        {session.completedStudents}
                      </div>
                    </div>
                    <div className="bg-yellow-50 rounded-lg p-3">
                      <div className="text-sm text-yellow-600">In Progress</div>
                      <div className="text-2xl font-bold text-yellow-700">
                        {session.inProgressStudents}
                      </div>
                    </div>
                    <div className="bg-red-50 rounded-lg p-3">
                      <div className="text-sm text-red-600">Not Started</div>
                      <div className="text-2xl font-bold text-red-700">
                        {session.notStartedStudents}
                      </div>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-3">
                      <div className="text-sm text-blue-600">
                        Completion Rate
                      </div>
                      <div className="text-2xl font-bold text-blue-700">
                        {Math.round(
                          (session.completedStudents / session.totalStudents) *
                            100
                        )}
                        %
                      </div>
                    </div>
                  </div>

                  {expandedSessions.has(session.sessionId) && (
                    <div className="mt-4 overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-2 px-3 text-sm font-medium text-gray-600">
                              Student
                            </th>
                            <th className="text-left py-2 px-3 text-sm font-medium text-gray-600">
                              Status
                            </th>
                            <th className="text-left py-2 px-3 text-sm font-medium text-gray-600">
                              Progress
                            </th>
                            <th className="text-left py-2 px-3 text-sm font-medium text-gray-600">
                              Time Spent
                            </th>
                            <th className="text-left py-2 px-3 text-sm font-medium text-gray-600">
                              Last Accessed
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {session.students.map((student, index) => (
                            <tr
                              key={student.studentId}
                              className={
                                index % 2 === 0 ? "bg-gray-50" : "bg-white"
                              }
                            >
                              <td className="py-2 px-3">
                                <div className="flex items-center space-x-2">
                                  {getStatusIcon(student.status)}
                                  <span className="text-sm font-medium text-gray-900">
                                    {student.username}
                                  </span>
                                </div>
                              </td>
                              <td className="py-2 px-3">
                                <span
                                  className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                                    student.status
                                  )}`}
                                >
                                  {student.status
                                    .replace("-", " ")
                                    .toUpperCase()}
                                </span>
                              </td>
                              <td className="py-2 px-3">
                                <div className="flex items-center space-x-2">
                                  <div className="w-16 bg-gray-200 rounded-full h-2">
                                    <div
                                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                      style={{
                                        width: `${student.progressPercentage}%`,
                                      }}
                                    ></div>
                                  </div>
                                  <span className="text-xs font-medium text-gray-900">
                                    {student.progressPercentage}%
                                  </span>
                                </div>
                              </td>
                              <td className="py-2 px-3">
                                <span className="text-sm text-gray-600">
                                  {Math.round(student.timeSpent / 60)}h
                                </span>
                              </td>
                              <td className="py-2 px-3">
                                <span className="text-sm text-gray-600">
                                  {new Date(
                                    student.lastAccessed
                                  ).toLocaleDateString()}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProgressAnalytics;
