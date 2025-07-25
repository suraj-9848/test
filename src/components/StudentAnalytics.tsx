import React, { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import axios from "axios";

// Types
interface StudentProgress {
  studentId: string;
  name: string;
  email: string;
  courseProgress: CourseProgress[];
  testResults: TestResult[];
  overallProgress: number;
  lastActive: string;
  totalTimeSpent: number;
  coursesCompleted: number;
  coursesEnrolled: number;
  averageScore: number;
  attendance: AttendanceRecord[];
}

interface CourseProgress {
  courseId: string;
  courseName: string;
  progress: number;
  completedModules: number;
  totalModules: number;
  lastAccessed: string;
  timeSpent: number;
  status: "not-started" | "in-progress" | "completed";
}

interface TestResult {
  testId: string;
  testName: string;
  courseName: string;
  score: number;
  maxScore: number;
  percentage: number;
  submittedAt: string;
  status: "submitted" | "evaluated" | "pending";
  timeSpent: number;
}

interface AttendanceRecord {
  date: string;
  courseId: string;
  courseName: string;
  present: boolean;
  duration: number;
}

interface StudentAnalyticsProps {
  onClose: () => void;
}

const StudentAnalytics: React.FC<StudentAnalyticsProps> = ({ onClose }) => {
  const { data: session } = useSession();

  // State
  const [studentsData, setStudentsData] = useState<StudentProgress[]>([]);
  const [batches, setBatches] = useState<{ id: string; name: string }[]>([]);
  const [courses, setCourses] = useState<{ id: string; title: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [selectedView, setSelectedView] = useState<"overview" | "detailed" | "absentees">("overview");
  const [selectedBatch, setSelectedBatch] = useState<string>("");
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);
  const [backendJwt, setBackendJwt] = useState<string>("");

  // API Base URL
  const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_BASE_URL || "http://localhost:3000";

  // API Helper
  const apiCall = useCallback(
    async (endpoint: string, options: RequestInit = {}) => {
      try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
          ...options,
          headers: {
            Authorization: `Bearer ${backendJwt}`,
            "Content-Type": "application/json",
            ...options.headers,
          },
        });

        if (!response.ok) {
          throw new Error(`API Error: ${response.status} - ${response.statusText}`);
        }

        return response.json();
      } catch (err) {
        console.error(`Failed to fetch ${endpoint}:`, err);
        throw err;
      }
    },
    [API_BASE_URL, backendJwt],
  );

  // Fetch user profile and get JWT
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const googleIdToken = (session as { id_token?: string })?.id_token;
        if (!googleIdToken) {
          console.error("No Google ID token found");
          setError("Authentication failed: No Google ID token found");
          return;
        }

        const loginRes = await axios.post(
          `${API_BASE_URL}/api/auth/admin-login`,
          {},
          {
            headers: { Authorization: `Bearer ${googleIdToken}` },
            withCredentials: true,
          },
        );
        setBackendJwt(loginRes.data.token);
      } catch (err) {
        console.error("Failed to fetch user profile:", err);
        setError("Failed to authenticate with backend");
      }
    };

    if (session) fetchProfile();
  }, [session, API_BASE_URL]);

  const processStudentData = useCallback(
    async (
      progressData: { report?: unknown[] },
      testsData: unknown[],
      testStats: { testId: string; data: unknown }[],
      leaderboardData: { data?: unknown[] },
    ): Promise<StudentProgress[]> => {
      const students = Array.isArray(progressData.report) ? progressData.report : [];
      const progressMap = new Map<string, any>();
      students.forEach((student) => {
        const studentData = student as { studentId: string; [key: string]: unknown };
        if (studentData?.studentId) {
          progressMap.set(studentData.studentId, studentData);
        }
      });

      const testStatsMap = new Map<string, any>();
      if (Array.isArray(testStats)) {
        testStats.forEach((stat) => {
          if (stat?.testId && stat.data) {
            testStatsMap.set(stat.testId, stat.data);
          }
        });
      }

      const leaderboardMap = new Map<string, any>();
      if (leaderboardData?.data && Array.isArray(leaderboardData.data)) {
        leaderboardData.data.forEach((entry) => {
          const leaderboardEntry = entry as { userName: string; [key: string]: unknown };
          if (leaderboardEntry?.userName) {
            leaderboardMap.set(leaderboardEntry.userName, leaderboardEntry);
          }
        });
      }

      return students.map((student) => {
        const studentData = student as {
          studentId: string;
          username: string;
          email: string;
          [key: string]: unknown;
        };
        const progress = progressMap.get(studentData.studentId) || {};
        const leaderboardEntry = leaderboardMap.get(studentData.username) || {};

        const overallProgress =
          progress.status === "completed"
            ? 100
            : progress.status === "in-progress"
              ? Math.min((progress.currentPage || 0) * 10, 90)
              : 0;

        const testResults: TestResult[] = (Array.isArray(testsData) ? testsData : []).map((test) => {
          const testData = test as { id: string; title: string; maxMarks?: number };
          const testScore = Array.isArray(leaderboardEntry.tests)
            ? leaderboardEntry.tests.find((t: any) => t.testId === testData.id)
            : null;
          return {
            testId: testData.id,
            testName: testData.title,
            courseName: courses.find((c) => c.id === selectedCourse)?.title || "Unknown Course",
            score: testScore?.score || 0,
            maxScore: testData.maxMarks || 100,
            percentage: testScore ? (testScore.score / (testData.maxMarks || 100)) * 100 : 0,
            submittedAt: testScore?.submittedAt || new Date().toISOString(),
            status: testScore ? "evaluated" : "pending",
            timeSpent: 0,
          };
        });

        const actualTestScores = testResults.filter((tr) => tr.score > 0);
        const averageScore =
          actualTestScores.length > 0
            ? actualTestScores.reduce((sum, tr) => sum + tr.percentage, 0) / actualTestScores.length
            : 0;

        const timeSpent = overallProgress * 2; // Estimation: 2 hours per 10% progress

        return {
          studentId: studentData.studentId,
          name: String(studentData.username || studentData.name || `Student ${studentData.studentId}`),
          email: studentData.email || `${studentData.username}@domain.com`,
          courseProgress: [
            {
              courseId: selectedCourse,
              courseName: courses.find((c) => c.id === selectedCourse)?.title || "Unknown Course",
              progress: overallProgress,
              completedModules: progress.completedModules || Math.floor(overallProgress / 10),
              totalModules: progress.totalModules || 10,
              lastAccessed: progress.lastAccessed || new Date().toISOString(),
              timeSpent: progress.timeSpent || timeSpent,
              status: progress.status || "not-started",
            },
          ],
          testResults,
          overallProgress,
          lastActive: progress.lastAccessed || studentData.lastActive || new Date().toISOString(),
          totalTimeSpent: progress.timeSpent || timeSpent,
          coursesCompleted: progress.status === "completed" ? 1 : 0,
          coursesEnrolled: 1,
          averageScore: Math.round(averageScore),
          attendance: [],
        };
      });
    },
    [courses, selectedCourse],
  );

  const fetchStudentAnalytics = useCallback(
    async (batchId: string, courseId: string) => {
      try {
        setLoading(true);
        setError("");

        const progressResponse = await apiCall(`/api/instructor/batches/${batchId}/courses/${courseId}/progress`).catch((err) => {
          console.warn("Failed to fetch progress data:", err);
          return { report: [] };
        });

        const testsData = await apiCall(`/api/instructor/batches/${batchId}/courses/${courseId}/tests`).catch((err) => {
          console.warn("Failed to fetch tests data:", err);
          return [];
        });

        const testStats = await apiCall(`/api/instructor/batches/${batchId}/courses/${courseId}/test-stats`).catch((err) => {
          console.warn("Failed to fetch test statistics:", err);
          return [];
        });

        const leaderboardData = await apiCall(`/api/instructor/batches/${batchId}/courses/${courseId}/leaderboard`).catch((err) => {
          console.warn("Failed to fetch leaderboard data:", err);
          return { data: [] };
        });

        const combinedData = await processStudentData(progressResponse, testsData, testStats, leaderboardData);
        setStudentsData(combinedData);
      } catch (err) {
        console.error("Error fetching student analytics:", err);
        setError("Failed to load student analytics data");
      } finally {
        setLoading(false);
      }
    },
    [apiCall, processStudentData],
  );

  const fetchCoursesForBatch = useCallback(
    async (batchId: string) => {
      try {
        const coursesResponse = await apiCall(`/api/instructor/batches/${batchId}/courses`);
        const courseList = Array.isArray(coursesResponse.courses) ? coursesResponse.courses : Array.isArray(coursesResponse) ? coursesResponse : [];
        setCourses(courseList);

        if (courseList.length > 0) {
          setSelectedCourse(courseList[0].id);
          await fetchStudentAnalytics(batchId, courseList[0].id);
        }
      } catch (err) {
        console.error("Error fetching courses:", err);
        setError("Failed to load courses for the selected batch");
      }
    },
    [apiCall, fetchStudentAnalytics],
  );

  const fetchInitialData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const batchesResponse = await apiCall("/api/instructor/batches");
      const batchList = Array.isArray(batchesResponse.batches) ? batchesResponse.batches : [];
      setBatches(batchList);

      if (batchList.length > 0) {
        setSelectedBatch(batchList[0].id);
        await fetchCoursesForBatch(batchList[0].id);
      }
    } catch (err) {
      console.error("Error fetching initial data:", err);
      setError("Failed to load initial data");
    } finally {
      setLoading(false);
    }
  }, [apiCall, fetchCoursesForBatch]);

  useEffect(() => {
    if (backendJwt) {
      fetchInitialData();
    }
  }, [backendJwt, fetchInitialData]);

  useEffect(() => {
    if (selectedBatch && selectedCourse && backendJwt) {
      fetchStudentAnalytics(selectedBatch, selectedCourse);
    }
  }, [selectedBatch, selectedCourse, backendJwt, fetchStudentAnalytics]);

  const handleBatchChange = (batchId: string) => {
    setSelectedBatch(batchId);
    setSelectedCourse("");
    setCourses([]);
    setStudentsData([]);
    if (batchId) {
      fetchCoursesForBatch(batchId);
    }
  };

  const handleCourseChange = (courseId: string) => {
    setSelectedCourse(courseId);
    if (selectedBatch && courseId) {
      fetchStudentAnalytics(selectedBatch, courseId);
    }
  };

  const generateAbsenteesList = (): StudentProgress[] => {
    return [];
  };

  const exportData = (format: "csv" | "pdf", type: "all" | "absentees" = "all") => {
    if (format === "csv") {
      let csvContent = "";
      let filename = "";

      if (type === "absentees") {
        csvContent = generateAbsenteesCSVContent();
        filename = "absentees-list.csv";
      } else {
        csvContent = generateCSVContent();
        filename = "student-analytics.csv";
      }

      downloadCSV(csvContent, filename);
    }
  };

  const generateAbsenteesCSVContent = () => {
    const headers = ["Name", "Email", "Days Absent (Last 5)", "Last Attended", "Overall Progress", "Average Score"];
    return headers.join(",") + "\n";
  };

  const generateCSVContent = () => {
    const headers = ["Name", "Email", "Overall Progress", "Average Score", "Courses Completed", "Last Active"];
    const rows = studentsData.map((student) => [
      student.name,
      student.email,
      `${student.overallProgress}%`,
      `${student.averageScore}%`,
      student.coursesCompleted,
      new Date(student.lastActive).toLocaleDateString(),
    ]);

    return [headers, ...rows].map((row) => row.join(",")).join("\n");
  };

  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const filteredStudents = studentsData.filter((student) =>
    searchTerm
      ? student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase())
      : true
  );

  const calculateOverallStats = () => {
    if (!studentsData.length) return null;

    const totalStudents = studentsData.length;
    const activeStudents = studentsData.filter((s) => {
      const lastActive = new Date(s.lastActive);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return lastActive > weekAgo;
    }).length;

    const averageProgress = studentsData.reduce((sum, s) => sum + s.overallProgress, 0) / totalStudents;
    const averageScore = studentsData.reduce((sum, s) => sum + s.averageScore, 0) / totalStudents;

    return {
      totalStudents,
      activeStudents,
      averageProgress: Math.round(averageProgress),
      averageScore: Math.round(averageScore),
    };
  };

  const stats = calculateOverallStats();
  const absentees = generateAbsenteesList();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="flex items-center space-x-2 text-slate-600">
          <svg
            className="animate-spin h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.385 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <span>Loading student analytics...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-5 bg-gradient-to-br from-slate-50 to-slate-100 h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-md p-4 shadow-sm">
          <div className="flex items-center space-x-2 text-red-600">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <span>{error}</span>
          </div>
        </div>
      </div>
    );
  }

  if (batches.length === 0) {
    return (
      <div className="p-5 bg-gradient-to-br from-slate-50 to-slate-100 h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-6 shadow-sm text-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-16 h-16 text-yellow-500 mx-auto mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 1.857a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Batches Found</h3>
          <p className="text-gray-600">Create a batch first to view student analytics.</p>
        </div>
      </div>
    );
  }

  if (selectedBatch && courses.length === 0) {
    return (
      <div className="p-5 bg-gradient-to-br from-slate-50 to-slate-100 h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-6 shadow-sm text-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-16 h-16 text-yellow-500 mx-auto mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.747 0-3.332.477-4.5 1.253"
            />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Courses Found</h3>
          <p className="text-gray-600">Add courses to the selected batch to view student analytics.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 bg-gradient-to-br from-slate-50 to-slate-100 h-[calc(100vh-4rem)] overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 bg-gradient-to-br from-purple-600 to-blue-600 rounded-md flex items-center justify-center shadow-lg">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-7 w-7 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Student Analytics</h1>
            <p className="text-gray-600 mt-1">Track student progress and performance</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-all duration-200"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
          <span>Close</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-md shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                />
              </svg>
              <span>{showFilters ? "Hide Filters" : "Show Filters"}</span>
            </button>
            <button
              onClick={() => exportData("csv")}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="bg-gray-50 rounded-md p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Batch</label>
                <select
                  value={selectedBatch}
                  onChange={(e) => handleBatchChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Course</label>
                <select
                  value={selectedCourse}
                  onChange={(e) => handleCourseChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 disabled:bg-gray-100 disabled:text-gray-500"
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Search Students</label>
                <div className="relative">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="absolute left-3 top-3 text-gray-400 w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by name or email..."
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* View Tabs */}
      <div className="bg-white rounded-md shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setSelectedView("overview")}
            className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
              selectedView === "overview"
                ? "bg-blue-50 text-blue-700 border-b-2 border-blue-600"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                />
              </svg>
              <span>Overview</span>
            </div>
          </button>
          <button
            onClick={() => setSelectedView("detailed")}
            className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
              selectedView === "detailed"
                ? "bg-blue-50 text-blue-700 border-b-2 border-blue-600"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <span>Detailed View</span>
            </div>
          </button>
          <button
            onClick={() => setSelectedView("absentees")}
            className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
              selectedView === "absentees"
                ? "bg-blue-50 text-blue-700 border-b-2 border-blue-600"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                />
              </svg>
              <span>Absentees ({absentees.length})</span>
            </div>
          </button>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-md shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Students</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalStudents}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-md flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-6 h-6 text-blue-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 1.857a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-md shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Students</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.activeStudents}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-md flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-6 h-6 text-green-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-md shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Progress</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.averageProgress}%</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-md flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-6 h-6 text-purple-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-md shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Score</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.averageScore}%</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-md flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-6 h-6 text-orange-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab Content */}
        <div className="p-4">
          {selectedView === "overview" && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Student Overview</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Student</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Progress</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Avg Score</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Last Active</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((student, index) => (
                      <tr
                        key={student.studentId}
                        className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}
                      >
                        <td className="py-3 px-4">
                          <div>
                            <div className="font-medium text-gray-900">{student.name}</div>
                            <div className="text-sm text-gray-500">{student.email}</div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            <div className="w-full bg-gray-200 rounded-full h-2 mr-3">
                              <div
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${student.overallProgress}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium text-gray-900">
                              {student.overallProgress}%
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm font-medium text-gray-900">
                            {student.averageScore}%
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm text-gray-600">
                            {new Date(student.lastActive).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${
                              student.overallProgress >= 80
                                ? "bg-green-100 text-green-800"
                                : student.overallProgress >= 50
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {student.overallProgress >= 80
                              ? "Excellent"
                              : student.overallProgress >= 50
                              ? "Good"
                              : "Needs Attention"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {selectedView === "detailed" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredStudents.map((student) => (
                <div
                  key={student.studentId}
                  className="bg-white rounded-md shadow-sm border border-gray-200 p-4"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{student.name}</h3>
                      <p className="text-sm text-gray-500">{student.email}</p>
                    </div>
                    <button className="p-2 hover:bg-gray-100 rounded-md transition-colors">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-4 h-4 text-gray-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    </button>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">Overall Progress</span>
                      <span className="text-sm font-bold text-gray-900">{student.overallProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${student.overallProgress}%` }}
                      ></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-4">
                      <div>
                        <p className="text-xs text-gray-500">Courses Completed</p>
                        <p className="text-lg font-bold text-gray-900">{student.coursesCompleted}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Average Score</p>
                        <p className="text-lg font-bold text-gray-900">{student.averageScore}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Time Spent</p>
                        <p className="text-lg font-bold text-gray-900">
                          {Math.round(student.totalTimeSpent / 60)}h
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Last Active</p>
                        <p className="text-lg font-bold text-gray-900">
                          {new Date(student.lastActive).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {selectedView === "absentees" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Absentees List</h3>
                <button
                  onClick={() => exportData("csv", "absentees")}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <span>Export Absentees</span>
                </button>
              </div>
              <div className="text-center py-8">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-16 h-16 text-green-500 mx-auto mb-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Attendance Tracking Not Implemented
                </h3>
                <p className="text-gray-600">
                  Attendance tracking is not currently available in the backend. This feature will be added in a future update.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentAnalytics;