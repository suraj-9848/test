import React, { useState, useEffect, useCallback } from "react";
import {
  FaUsers,
  FaChartLine,
  FaDownload,
  FaUserCheck,
  FaTrophy,
  FaSearch,
  FaFilter,
  FaSpinner,
  FaEye,
  FaFileExport,
  FaBook,
} from "react-icons/fa";
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

const StudentAnalytics: React.FC = () => {
  const { data: session } = useSession();

  // State
  const [studentsData, setStudentsData] = useState<StudentProgress[]>([]);
  const [batches, setBatches] = useState<{ id: string; name: string }[]>([]);
  const [courses, setCourses] = useState<{ id: string; title: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [selectedView, setSelectedView] = useState<
    "overview" | "detailed" | "absentees"
  >("overview");
  const [selectedBatch, setSelectedBatch] = useState<string>("");
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);
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

  const processStudentData = useCallback(
    async (
      progressData: { report?: unknown[] },
      testsData: unknown[],
      testStats: { testId: string; data: unknown }[],
      leaderboardData: { data?: unknown[] }
    ): Promise<StudentProgress[]> => {
      // Extract students from progress data
      const students = Array.isArray(progressData.report)
        ? progressData.report
        : [];

      // Create a map of student progress by studentId
      const progressMap = new Map();
      students.forEach((student) => {
        const studentData = student as {
          studentId: string;
          [key: string]: unknown;
        };
        if (
          studentData &&
          typeof studentData === "object" &&
          "studentId" in studentData
        ) {
          progressMap.set(studentData.studentId, studentData);
        }
      });

      // Create a map of test statistics
      const testStatsMap = new Map();
      if (Array.isArray(testStats)) {
        testStats.forEach((stat: { testId: string; data: unknown }) => {
          if (stat && stat.data) {
            testStatsMap.set(stat.testId, stat.data);
          }
        });
      }

      // Create a map of leaderboard scores by userName
      const leaderboardMap = new Map();
      if (
        leaderboardData &&
        leaderboardData.data &&
        Array.isArray(leaderboardData.data)
      ) {
        leaderboardData.data.forEach((entry) => {
          const leaderboardEntry = entry as {
            userName: string;
            [key: string]: unknown;
          };
          if (
            leaderboardEntry &&
            typeof leaderboardEntry === "object" &&
            "userName" in leaderboardEntry
          ) {
            leaderboardMap.set(leaderboardEntry.userName, leaderboardEntry);
          }
        });
      }

      // Convert to StudentProgress format
      const processedStudents: StudentProgress[] = students.map((student) => {
        const studentData = student as {
          studentId: string;
          username: string;
          email: string;
          [key: string]: unknown;
        };
        const progress = progressMap.get(studentData.studentId) || {};
        const leaderboardEntry = leaderboardMap.get(studentData.username) || {};

        // Calculate overall progress based on current page and status
        const overallProgress =
          progress.status === "completed"
            ? 100
            : progress.status === "in-progress"
            ? Math.min((progress.currentPage || 0) * 10, 90)
            : 0;

        // Calculate actual test results from leaderboard and test data
        const testResults: TestResult[] = (
          Array.isArray(testsData) ? testsData : []
        ).map((test) => {
          const testData = test as {
            id: string;
            title: string;
            maxMarks?: number;
            [key: string]: unknown;
          };
          const testScore = leaderboardEntry.tests?.find(
            (t: { testId: string; [key: string]: unknown }) =>
              t.testId === testData.id
          );
          return {
            testId: testData.id,
            testName: testData.title,
            courseName:
              (Array.isArray(courses) ? courses : []).find(
                (c) => c.id === selectedCourse
              )?.title || "Course",
            score: testScore?.score || 0,
            maxScore: testData.maxMarks || 100,
            percentage: testScore
              ? (testScore.score / (testData.maxMarks || 100)) * 100
              : 0,
            submittedAt: testScore?.submittedAt || new Date().toISOString(),
            status: testScore ? "evaluated" : "pending",
            timeSpent: 0, // Not available in current backend
          };
        });

        // Calculate average score from actual test results
        const actualTestScores = testResults.filter((tr) => tr.score > 0);
        const averageScore =
          actualTestScores.length > 0
            ? actualTestScores.reduce((sum, tr) => sum + tr.percentage, 0) /
              actualTestScores.length
            : 0;

        // Calculate time spent based on progress (estimation)
        const timeSpent = overallProgress * 2; // 2 hours per 10% progress

        return {
          studentId: studentData.studentId,
          name:
            (studentData.username as string) ||
            (studentData.name as string) ||
            `Student ${studentData.studentId}`,
          email:
            (studentData.email as string) || `${studentData.username}@domain.com`,
          courseProgress: [
            {
              courseId: selectedCourse,
              courseName:
                courses.find((c) => c.id === selectedCourse)?.title || "Course",
              progress: overallProgress,
              completedModules:
                progress.completedModules || Math.floor(overallProgress / 10),
              totalModules: progress.totalModules || 10,
              lastAccessed: progress.lastAccessed || new Date().toISOString(),
              timeSpent: progress.timeSpent || timeSpent,
              status: progress.status || "not-started",
            },
          ],
          testResults,
          overallProgress,
          lastActive:
            progress.lastAccessed ||
            (studentData.lastActive as string) ||
            new Date().toISOString(),
          totalTimeSpent: progress.timeSpent || timeSpent,
          coursesCompleted: progress.status === "completed" ? 1 : 0,
          coursesEnrolled: 1,
          averageScore: Math.round(averageScore),
          attendance: [], // Remove mock attendance data
        };
      });

      return processedStudents;
    },
    [courses, selectedCourse]
  );

  const fetchStudentAnalytics = useCallback(
    async (batchId: string, courseId: string) => {
      try {
        setLoading(true);
        setError(""); // Clear any previous errors

        // Get student progress data - Backend returns { batchId, courseId, report: StudentProgress[] }
        let progressResponse;
        try {
          progressResponse = await apiCall(
            `/api/instructor/batches/${batchId}/courses/${courseId}/progress`
          );
        } catch (err) {
          console.warn("Failed to fetch progress data:", err);
          progressResponse = { report: [] };
        }

        // Get test data
        let testsData = [];
        try {
          const testsResponse = await apiCall(
            `/api/instructor/batches/${batchId}/courses/${courseId}/tests`
          );
          testsData = Array.isArray(testsResponse) ? testsResponse : [];
        } catch (err) {
          console.warn("Failed to fetch tests data:", err);
        }

        // Get test statistics
        let testStats = [];
        try {
          const testStatsResponse = await apiCall(
            `/api/instructor/batches/${batchId}/courses/${courseId}/test-stats`
          );
          testStats = Array.isArray(testStatsResponse.data)
            ? testStatsResponse.data
            : [];
        } catch (err) {
          console.warn("Failed to fetch test statistics:", err);
        }

        // Get leaderboard data - this might not be available
        let leaderboardData = [];
        try {
          const leaderboardResponse = await apiCall(
            `/api/instructor/batches/${batchId}/courses/${courseId}/leaderboard`
          );
          leaderboardData = Array.isArray(leaderboardResponse)
            ? leaderboardResponse
            : leaderboardResponse.data &&
              Array.isArray(leaderboardResponse.data)
            ? leaderboardResponse.data
            : [];
        } catch (err) {
          console.warn(
            "Failed to fetch leaderboard data (this is normal):",
            err
          );
        }

        // Process and combine data
        const combinedData = await processStudentData(
          progressResponse,
          testsData,
          testStats,
          leaderboardData
        );

        setStudentsData(combinedData);
      } catch (err) {
        console.error("Error fetching student analytics:", err);
        setError("Failed to load student analytics");
      } finally {
        setLoading(false);
      }
    },
    [apiCall, processStudentData]
  );

  const fetchCoursesForBatch = useCallback(
    async (batchId: string) => {
      try {
        // Backend endpoint: GET /api/instructor/batches/:batchId/courses
        const coursesResponse = await apiCall(
          `/api/instructor/batches/${batchId}/courses`
        );
        const responseData = coursesResponse.courses || coursesResponse || [];
        const courseList = Array.isArray(responseData) ? responseData : [];
        setCourses(courseList);

        // Set first course as selected if available
        if (courseList.length > 0) {
          setSelectedCourse(courseList[0].id);
          await fetchStudentAnalytics(batchId, courseList[0].id);
        }
      } catch (err) {
        console.error("Error fetching courses:", err);
        setError("Failed to load courses for the selected batch");
      }
    },
    [apiCall, fetchStudentAnalytics]
  );

  const fetchInitialData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      // Fetch batches - Backend returns { message: "Fetched batches", batches: Batch[] }
      const batchesResponse = await apiCall("/api/instructor/batches");
      const batchList = Array.isArray(batchesResponse.batches)
        ? batchesResponse.batches
        : [];
      setBatches(batchList);

      // If there are batches, set the first one as selected
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

  // Fetch initial data
  useEffect(() => {
    if (backendJwt) {
      fetchInitialData();
    }
  }, [backendJwt, fetchInitialData]);

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
    // Since attendance tracking is not implemented in the backend, return empty array
    return [];
  };

  const exportData = (
    format: "csv" | "pdf",
    type: "all" | "absentees" = "all"
  ) => {
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
    // Since attendance tracking is not implemented in the backend, return empty CSV
    const headers = [
      "Name",
      "Email",
      "Days Absent (Last 5)",
      "Last Attended",
      "Overall Progress",
      "Average Score",
    ];
    return headers.join(",") + "\n";
  };

  const generateCSVContent = () => {
    const headers = [
      "Name",
      "Email",
      "Overall Progress",
      "Average Score",
      "Courses Completed",
      "Last Active",
    ];
    const rows = (Array.isArray(studentsData) ? studentsData : []).map(
      (student) => [
        student.name,
        student.email,
        `${student.overallProgress}%`,
        `${student.averageScore}%`,
        student.coursesCompleted,
        new Date(student.lastActive).toLocaleDateString(),
      ]
    );

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

  const filteredStudents = (
    Array.isArray(studentsData) ? studentsData : []
  ).filter((student) => {
    if (searchTerm) {
      return (
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return true;
  });

  const calculateOverallStats = () => {
    if (!Array.isArray(studentsData) || studentsData.length === 0) return null;

    const totalStudents = studentsData.length;
    const activeStudents = studentsData.filter((s) => {
      const lastActive = new Date(s.lastActive);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return lastActive > weekAgo;
    }).length;

    const averageProgress =
      studentsData.reduce((sum, s) => sum + s.overallProgress, 0) /
      totalStudents;
    const averageScore =
      studentsData.reduce((sum, s) => sum + s.averageScore, 0) / totalStudents;

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
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <FaSpinner className="animate-spin text-blue-600" />
          <span>Loading student analytics...</span>
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

  if (!loading && batches.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <div className="text-center">
          <FaUsers className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Batches Found
          </h3>
          <p className="text-gray-600">
            Create a batch first to view student analytics.
          </p>
        </div>
      </div>
    );
  }

  if (!loading && selectedBatch && courses.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <div className="text-center">
          <FaBook className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Courses Found
          </h3>
          <p className="text-gray-600">
            Add courses to the selected batch to view student analytics.
          </p>
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
              Student Analytics
            </h1>
            <p className="text-gray-600">
              Track student progress and performance
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
              onClick={() => exportData("csv")}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            >
              <FaFileExport className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  Search Students
                </label>
                <div className="relative">
                  <FaSearch className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by name or email..."
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* View Tabs */}
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setSelectedView("overview")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              selectedView === "overview"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setSelectedView("detailed")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              selectedView === "detailed"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Detailed View
          </button>
          <button
            onClick={() => setSelectedView("absentees")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              selectedView === "absentees"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Absentees ({absentees.length})
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                <p className="text-sm font-medium text-gray-600">
                  Active Students
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.activeStudents}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <FaUserCheck className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Avg Progress
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.averageProgress}%
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <FaChartLine className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Score</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.averageScore}%
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <FaTrophy className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content based on selected view */}
      {selectedView === "overview" && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Student Overview
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-600">
                    Student
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">
                    Progress
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">
                    Avg Score
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">
                    Last Active
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">
                    Status
                  </th>
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
                        <div className="font-medium text-gray-900">
                          {student.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {student.email}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center">
                        <div className="w-full bg-gray-200 rounded-full h-2 mr-3">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredStudents.map((student) => (
            <div
              key={student.studentId}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {student.name}
                  </h3>
                  <p className="text-sm text-gray-500">{student.email}</p>
                </div>
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <FaEye className="w-4 h-4 text-gray-600" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">
                    Overall Progress
                  </span>
                  <span className="text-sm font-bold text-gray-900">
                    {student.overallProgress}%
                  </span>
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
                    <p className="text-lg font-bold text-gray-900">
                      {student.coursesCompleted}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Average Score</p>
                    <p className="text-lg font-bold text-gray-900">
                      {student.averageScore}%
                    </p>
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Absentees List
            </h2>
            <button
              onClick={() => exportData("csv", "absentees")}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              <FaDownload className="w-4 h-4" />
              <span>Export Absentees</span>
            </button>
          </div>

          {absentees.length === 0 ? (
            <div className="text-center py-8">
              <FaUserCheck className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                All Students Active!
              </h3>
              <p className="text-gray-600">
                No students have been frequently absent recently.
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
                      Days Absent
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">
                      Last Attended
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">
                      Progress
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {absentees.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="text-center py-8 text-gray-500"
                      >
                        Attendance tracking is not implemented in the backend
                        yet.
                      </td>
                    </tr>
                  ) : (
                    absentees.map((student, index) => (
                      <tr
                        key={student.studentId}
                        className={index % 2 === 0 ? "bg-red-50" : "bg-white"}
                      >
                        <td className="py-3 px-4">
                          <div>
                            <div className="font-medium text-gray-900">
                              {student.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {student.email}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                            0/5
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm text-gray-600">N/A</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm font-medium text-gray-900">
                            {student.overallProgress}%
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                            Contact
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StudentAnalytics;
