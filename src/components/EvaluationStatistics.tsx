import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  FaChartBar,
  FaUsers,
  FaClipboardList,
  FaBook,
  FaGraduationCap,
  FaSpinner,
  FaFilter,
  FaTrophy,
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
  FaFileExport,
  FaExclamationTriangle,
  FaSortUp,
  FaSortDown,
  FaCalculator,
  FaAward,
  FaThumbsUp,
  FaThumbsDown,
  FaEquals,
} from "react-icons/fa";
import { useSession } from "next-auth/react";
import axios from "axios";

// Types
interface EvaluationStatistics {
  testId: string;
  testTitle: string;
  totalQuestions: number;
  totalMarks: number;
  passingMarks: number;
  totalSubmissions: number;
  evaluatedSubmissions: number;
  pendingEvaluations: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  medianScore: number;
  passRate: number;
  failRate: number;
  averageTimeSpent: number;
  submissionTrends: SubmissionTrend[];
  scoreDistribution: ScoreDistribution[];
  questionAnalysis: QuestionAnalysis[];
  difficultyAnalysis: DifficultyAnalysis;
  performanceMetrics: PerformanceMetrics;
  timingAnalysis: TimingAnalysis;
}

interface SubmissionTrend {
  date: string;
  count: number;
  averageScore: number;
}

interface ScoreDistribution {
  scoreRange: string;
  count: number;
  percentage: number;
}

interface QuestionAnalysis {
  questionId: string;
  questionText: string;
  questionType: string;
  marks: number;
  correctAnswers: number;
  incorrectAnswers: number;
  accuracyRate: number;
  averageMarks: number;
  difficulty: "easy" | "medium" | "hard";
}

interface DifficultyAnalysis {
  easy: {
    totalQuestions: number;
    averageAccuracy: number;
    averageMarks: number;
  };
  medium: {
    totalQuestions: number;
    averageAccuracy: number;
    averageMarks: number;
  };
  hard: {
    totalQuestions: number;
    averageAccuracy: number;
    averageMarks: number;
  };
}

interface PerformanceMetrics {
  excellentPerformers: number; // 90-100%
  goodPerformers: number; // 70-89%
  averagePerformers: number; // 50-69%
  poorPerformers: number; // <50%
}

interface TimingAnalysis {
  averageCompletionTime: number;
  fastestCompletion: number;
  slowestCompletion: number;
  timeoutSubmissions: number;
  earlySubmissions: number;
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

interface Test {
  id: string;
  title: string;
  description: string;
  maxMarks: number;
  durationInMinutes: number;
  status: string;
}

const EvaluationStatistics: React.FC = () => {
  const { data: session } = useSession();

  // Use refs to maintain stable references
  const mountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);
  const testsRef = useRef<Test[]>([]);
  const fetchStatisticsRef = useRef<
    | ((batchId: string, courseId: string, testId: string) => Promise<void>)
    | null
  >(null);
  const fetchTestsRef = useRef<
    ((batchId: string, courseId: string) => Promise<void>) | null
  >(null);
  const fetchCoursesRef = useRef<((batchId: string) => Promise<void>) | null>(
    null,
  );

  // State
  const [batches, setBatches] = useState<Batch[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [statistics, setStatistics] = useState<EvaluationStatistics | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [selectedBatch, setSelectedBatch] = useState<string>("");
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [selectedTest, setSelectedTest] = useState<string>("");
  const [selectedView, setSelectedView] = useState<
    "overview" | "questions" | "performance" | "timing"
  >("overview");
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<string>("accuracy");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [backendJwt, setBackendJwt] = useState<string>("");

  // API Base URL
  const API_BASE_URL =
    process.env.NEXT_PUBLIC_BACKEND_BASE_URL || "http://localhost:3000";

  // Initialize component mounting and cleanup
  useEffect(() => {
    console.log("🚀 EvaluationStatistics - Component mounted");

    // Ensure mountedRef is set to true
    mountedRef.current = true;
    console.log(
      "🔧 EvaluationStatistics mountedRef set to:",
      mountedRef.current,
    );

    return () => {
      console.log(
        "🧹 EvaluationStatistics - Component cleanup, setting mountedRef to false",
      );
      mountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // API Helper with stable reference
  const apiCall = useCallback(
    async (endpoint: string, options: RequestInit = {}) => {
      const startTime = Date.now();
      const requestId = Math.random().toString(36).substr(2, 9);

      // Abort previous request if exists
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();

      // Log outgoing request
      const isAnalyticsCall =
        endpoint.includes("evaluation-statistics") ||
        endpoint.includes("analytics") ||
        endpoint.includes("tests");
      const logPrefix = isAnalyticsCall ? "📊 EVALUATION API" : "🌐 EVAL API";

      console.log(`${logPrefix} REQUEST [${requestId}]:`, {
        endpoint,
        fullURL: `${API_BASE_URL}${endpoint}`,
        method: options.method || "GET",
        hasToken: !!backendJwt,
        timestamp: new Date().toISOString(),
        isAnalytics: isAnalyticsCall,
      });

      try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
          ...options,
          signal: abortControllerRef.current.signal,
          headers: {
            Authorization: `Bearer ${backendJwt}`,
            "Content-Type": "application/json",
            ...options.headers,
          },
        });

        const duration = Date.now() - startTime;

        if (!response.ok) {
          console.error(`${logPrefix} ERROR [${requestId}]:`, {
            endpoint,
            status: response.status,
            statusText: response.statusText,
            duration: `${duration}ms`,
            timestamp: new Date().toISOString(),
          });
          throw new Error(
            `API Error: ${response.status} ${response.statusText}`,
          );
        }

        const data = await response.json();

        // Log successful response
        console.log(`${logPrefix} RESPONSE [${requestId}]:`, {
          status: response.status,
          statusText: response.statusText,
          endpoint,
          duration: `${duration}ms`,
          dataSize: JSON.stringify(data).length,
          timestamp: new Date().toISOString(),
          isAnalytics: isAnalyticsCall,
        });

        // Log response data for analytics calls
        if (isAnalyticsCall) {
          console.log(`${logPrefix} DATA [${requestId}]:`, {
            dataType: typeof data,
            dataKeys:
              data && typeof data === "object" ? Object.keys(data) : "N/A",
            dataPreview:
              data && typeof data === "object"
                ? JSON.stringify(data).substring(0, 200) + "..."
                : data,
          });
        }

        return data;
      } catch (err: any) {
        const duration = Date.now() - startTime;

        if (err.name === "AbortError") {
          console.log(`${logPrefix} ABORTED [${requestId}]:`, {
            endpoint,
            duration: `${duration}ms`,
            timestamp: new Date().toISOString(),
          });
          return null;
        }

        console.error(`${logPrefix} ERROR [${requestId}]:`, {
          endpoint,
          error: err.message,
          duration: `${duration}ms`,
          timestamp: new Date().toISOString(),
          isAnalytics: isAnalyticsCall,
        });

        throw err;
      }
    },
    [API_BASE_URL, backendJwt],
  );

  // Authentication effect
  useEffect(() => {
    const fetchProfile = async () => {
      if (!session || !mountedRef.current) return;

      try {
        const googleIdToken = (session as { id_token?: string })?.id_token;
        if (!googleIdToken) {
          console.error("No Google ID token found");
          if (mountedRef.current) {
            setError("Authentication failed: No Google ID token found");
          }
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

        if (mountedRef.current) {
          setBackendJwt(loginRes.data.token);
        }
      } catch (err) {
        console.error("Failed to fetch user profile:", err);
        if (mountedRef.current) {
          setError("Failed to authenticate with backend");
        }
      }
    };

    fetchProfile();
  }, [session, API_BASE_URL]);

  // Fetch statistics
  const fetchStatistics = useCallback(
    async (batchId: string, courseId: string, testId: string) => {
      console.log("📊 EVALUATION STATISTICS FETCH START:", {
        batchId,
        courseId,
        testId,
        hasJWT: !!backendJwt,
        mounted: mountedRef.current,
        timestamp: new Date().toISOString(),
      });

      if (
        !batchId ||
        !courseId ||
        !testId ||
        !backendJwt ||
        !mountedRef.current
      ) {
        console.log(
          "⚠️ EVALUATION STATISTICS SKIPPED: Missing required data:",
          {
            batchId: !!batchId,
            courseId: !!courseId,
            testId: !!testId,
            backendJwt: !!backendJwt,
            mounted: mountedRef.current,
          },
        );
        return;
      }

      try {
        setLoading(true);
        setError("");

        const endpoint = `/api/instructor/batches/${batchId}/courses/${courseId}/tests/${testId}/evaluation-statistics`;
        console.log("📊 EVALUATION STATISTICS URL:", {
          endpoint,
          fullURL: `${API_BASE_URL}${endpoint}`,
        });

        console.log("📊 EVALUATION STATISTICS API CALL: Making request...");
        const response = await apiCall(endpoint);

        if (!response || !mountedRef.current) {
          console.log(
            " EVALUATION STATISTICS: No response or component unmounted",
          );
          return;
        }

        console.log("📊 EVALUATION STATISTICS RESPONSE RECEIVED:", {
          status: response.status,
          dataSize: response.data ? JSON.stringify(response.data).length : 0,
          hasData: !!response.data,
          timestamp: new Date().toISOString(),
        });

        // Process the statistics data
        const processedStats: EvaluationStatistics = {
          testId,
          testTitle:
            testsRef.current.find((t) => t.id === testId)?.title || "Test",
          totalQuestions: response.data?.totalQuestions || 0,
          totalMarks: response.data?.totalMarks || 0,
          passingMarks: response.data?.passingMarks || 0,
          totalSubmissions: response.data?.totalSubmissions || 0,
          evaluatedSubmissions: response.data?.evaluatedSubmissions || 0,
          pendingEvaluations: response.data?.pendingEvaluations || 0,
          averageScore: response.data?.averageScore || 0,
          highestScore: response.data?.highestScore || 0,
          lowestScore: response.data?.lowestScore || 0,
          medianScore: response.data?.medianScore || 0,
          passRate: response.data?.passRate || 0,
          failRate: response.data?.failRate || 0,
          averageTimeSpent: response.data?.averageTimeSpent || 0,
          submissionTrends: response.data?.submissionTrends || [],
          scoreDistribution: response.data?.scoreDistribution || [],
          questionAnalysis:
            response.data?.questionAnalysis?.map(
              (q: {
                questionId: string;
                questionText: string;
                totalAttempts: number;
                correctAttempts: number;
                averageTimeSpent: number;
                difficultyLevel: "Easy" | "Medium" | "Hard";
              }) => ({
                questionId: q.questionId,
                questionText: q.questionText,
                questionType: "MCQ", // Default type
                marks: 1, // Default marks
                correctAnswers: q.correctAttempts,
                incorrectAnswers: q.totalAttempts - q.correctAttempts,
                accuracyRate:
                  q.totalAttempts > 0
                    ? (q.correctAttempts / q.totalAttempts) * 100
                    : 0,
                averageMarks:
                  q.totalAttempts > 0 ? q.correctAttempts / q.totalAttempts : 0,
                difficulty: q.difficultyLevel.toLowerCase() as
                  | "easy"
                  | "medium"
                  | "hard",
              }),
            ) || [],
          difficultyAnalysis: response.data?.difficultyAnalysis || {
            easy: { totalQuestions: 0, averageAccuracy: 0, averageMarks: 0 },
            medium: { totalQuestions: 0, averageAccuracy: 0, averageMarks: 0 },
            hard: { totalQuestions: 0, averageAccuracy: 0, averageMarks: 0 },
          },
          performanceMetrics: response.data?.performanceMetrics || {
            excellentPerformers: 0,
            goodPerformers: 0,
            averagePerformers: 0,
            poorPerformers: 0,
          },
          timingAnalysis: response.data?.timingAnalysis || {
            averageCompletionTime: 0,
            fastestCompletion: 0,
            slowestCompletion: 0,
            timeoutSubmissions: 0,
            earlySubmissions: 0,
          },
        };

        if (mountedRef.current) {
          setStatistics(processedStats);
        }
      } catch (err: any) {
        console.error(
          " EVALUATION STATISTICS ERROR: Error fetching evaluation statistics:",
          err,
        );
        console.error(" EVALUATION STATISTICS ERROR DETAILS:", {
          message: err.message,
          status: err.response?.status,
          statusText: err.response?.statusText,
          data: err.response?.data,
          batchId,
          courseId,
          testId,
          timestamp: new Date().toISOString(),
          stack: err.stack,
        });

        if (mountedRef.current && err.name !== "AbortError") {
          setError("Failed to load evaluation statistics");
        }
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    },
    [apiCall, backendJwt],
  );

  // Store fetchStatistics in ref for stable access
  useEffect(() => {
    fetchStatisticsRef.current = fetchStatistics;
  }, [fetchStatistics]);

  // Fetch tests for selected batch and course
  const fetchTests = useCallback(
    async (batchId: string, courseId: string) => {
      if (!batchId || !courseId || !backendJwt || !mountedRef.current) {
        return;
      }

      try {
        const response = await apiCall(
          `/api/instructor/batches/${batchId}/courses/${courseId}/tests`,
        );
        if (!response || !mountedRef.current) return;

        // Handle different response formats: {data: {tests}} or {tests} or direct array
        const testList =
          response.data?.tests ||
          response.tests ||
          response.data ||
          response ||
          [];
        console.log("Tests received for evaluation:", testList);

        setTests(testList);
        testsRef.current = testList; // Keep ref in sync

        if (testList.length > 0) {
          setSelectedTest(testList[0].id);
          if (fetchStatisticsRef.current) {
            await fetchStatisticsRef.current(batchId, courseId, testList[0].id);
          }
        }
      } catch (err: any) {
        console.error("Error fetching tests:", err);
        if (mountedRef.current && err.name !== "AbortError") {
          setError("Failed to load tests for the selected course");
        }
      }
    },
    [apiCall, backendJwt],
  );

  // Store fetchTests in ref for stable access
  useEffect(() => {
    fetchTestsRef.current = fetchTests;
  }, [fetchTests]);

  // Fetch courses for selected batch
  const fetchCourses = useCallback(
    async (batchId: string) => {
      if (!batchId || !backendJwt || !mountedRef.current) {
        return;
      }

      try {
        const response = await apiCall(
          `/api/instructor/batches/${batchId}/courses`,
        );
        if (!response || !mountedRef.current) return;

        // Handle different response formats from backend
        const courseList =
          response.data?.courses ||
          response.courses ||
          response.data ||
          response ||
          [];
        console.log("Courses received for evaluation:", courseList);

        setCourses(courseList);

        if (courseList.length > 0) {
          setSelectedCourse(courseList[0].id);
          if (fetchTestsRef.current) {
            await fetchTestsRef.current(batchId, courseList[0].id);
          }
        }
      } catch (err: any) {
        console.error("Error fetching courses:", err);
        if (mountedRef.current && err.name !== "AbortError") {
          setError("Failed to load courses for the selected batch");
        }
      }
    },
    [apiCall, backendJwt],
  );

  // Store fetchCourses in ref for stable access
  useEffect(() => {
    fetchCoursesRef.current = fetchCourses;
  }, [fetchCourses]);

  // Keep testsRef in sync with tests state
  useEffect(() => {
    testsRef.current = tests;
  }, [tests]);

  // Fetch initial data
  const fetchInitialData = useCallback(async () => {
    console.log("🔄 EvaluationStatistics fetchInitialData called");
    console.log("🔍 EvaluationStatistics Mounted:", mountedRef.current);
    console.log("🔍 EvaluationStatistics Has JWT:", !!backendJwt);

    if (!backendJwt || !mountedRef.current) {
      console.log(
        " EvaluationStatistics: Missing JWT or not mounted, skipping",
      );
      if (!mountedRef.current) {
        console.log("🔧 EvaluationStatistics: Attempting to fix mountedRef...");
        mountedRef.current = true;
        console.log(
          "🔧 EvaluationStatistics: mountedRef after fix:",
          mountedRef.current,
        );
      }
      return;
    }

    try {
      setLoading(true);
      setError("");

      console.log(
        "🚀 EvaluationStatistics: Making API call to fetch batches...",
      );
      const batchesResponse = await apiCall("/api/instructor/batches");

      if (!batchesResponse || !mountedRef.current) {
        console.log(
          " EvaluationStatistics: No response or component unmounted",
        );
        return;
      }

      // Handle different response formats
      const batchList =
        batchesResponse.data?.batches ||
        batchesResponse.batches ||
        batchesResponse.data ||
        batchesResponse ||
        [];
      console.log(" EvaluationStatistics: Batches received:", batchList.length);

      setBatches(batchList);

      if (batchList.length > 0) {
        const firstBatch = batchList[0];
        console.log(
          "🔄 EvaluationStatistics: Setting first batch and fetching courses:",
          firstBatch.id,
        );
        setSelectedBatch(firstBatch.id);
        if (fetchCoursesRef.current) {
          await fetchCoursesRef.current(firstBatch.id);
        }
      } else {
        console.log("⚠️ EvaluationStatistics: No batches available");
      }
    } catch (err: any) {
      console.error(" EvaluationStatistics: Error fetching initial data:", err);
      console.error(" EvaluationStatistics: Error details:", {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
        timestamp: new Date().toISOString(),
      });

      if (mountedRef.current && err.name !== "AbortError") {
        setError("Failed to load initial data");
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [apiCall, backendJwt]);

  // Initialize data when JWT is available
  useEffect(() => {
    if (backendJwt && mountedRef.current) {
      fetchInitialData();
    }
  }, [backendJwt, fetchInitialData]);

  // Handle batch change
  const handleBatchChange = useCallback(
    (batchId: string) => {
      if (!mountedRef.current) return;

      setSelectedBatch(batchId);
      setSelectedCourse("");
      setSelectedTest("");
      setCourses([]);
      setTests([]);
      setStatistics(null);

      if (batchId && backendJwt && fetchCoursesRef.current) {
        fetchCoursesRef.current(batchId);
      }
    },
    [backendJwt],
  );

  // Handle course change
  const handleCourseChange = useCallback(
    (courseId: string) => {
      if (!mountedRef.current) return;

      setSelectedCourse(courseId);
      setSelectedTest("");
      setTests([]);
      setStatistics(null);

      if (selectedBatch && courseId && backendJwt && fetchTestsRef.current) {
        fetchTestsRef.current(selectedBatch, courseId);
      }
    },
    [selectedBatch, backendJwt],
  );

  // Handle test change
  const handleTestChange = useCallback(
    (testId: string) => {
      console.log("🚀 EVALUATION STATISTICS: Test changed to:", testId);
      console.log(
        "📍 EVALUATION STATISTICS: Component state before test change:",
        {
          selectedBatch,
          selectedCourse,
          newTestId: testId,
          mountedRef: mountedRef.current,
          hasJWT: !!backendJwt,
          testsLength: tests.length,
        },
      );

      if (!mountedRef.current) {
        console.log(
          "⚠️ EVALUATION STATISTICS: Component not mounted, skipping",
        );
        return;
      }

      setSelectedTest(testId);
      setStatistics(null);

      if (selectedBatch && selectedCourse && testId && backendJwt) {
        console.log(
          "📊 EVALUATION STATISTICS TRIGGER: About to fetch evaluation statistics for:",
          {
            batchId: selectedBatch,
            courseId: selectedCourse,
            testId: testId,
            timestamp: new Date().toISOString(),
          },
        );

        try {
          if (fetchStatisticsRef.current) {
            fetchStatisticsRef.current(selectedBatch, selectedCourse, testId);
          }
          console.log(
            " EVALUATION STATISTICS TRIGGERED: fetchStatistics called successfully",
          );
        } catch (error) {
          console.error(
            " EVALUATION STATISTICS FAILED: fetchStatistics failed:",
            error,
          );
        }
      } else {
        console.log(
          "⚠️ EVALUATION STATISTICS SKIPPED: Missing required data:",
          {
            selectedBatch: !!selectedBatch,
            selectedCourse: !!selectedCourse,
            testId: !!testId,
            backendJwt: !!backendJwt,
            reason: !selectedBatch
              ? "No batch selected"
              : !selectedCourse
                ? "No course selected"
                : !testId
                  ? "No test provided"
                  : !backendJwt
                    ? "No JWT token"
                    : "Unknown",
          },
        );
      }
    },
    [selectedBatch, selectedCourse, backendJwt],
  );

  const exportStatistics = () => {
    if (!statistics) return;

    const csvData = [
      ["Test Statistics Report"],
      ["Test Title", statistics.testTitle],
      ["Total Questions", statistics.totalQuestions.toString()],
      ["Total Marks", statistics.totalMarks.toString()],
      ["Total Submissions", statistics.totalSubmissions.toString()],
      ["Evaluated Submissions", statistics.evaluatedSubmissions.toString()],
      ["Average Score", statistics.averageScore.toFixed(2)],
      ["Highest Score", statistics.highestScore.toString()],
      ["Lowest Score", statistics.lowestScore.toString()],
      ["Pass Rate", `${statistics.passRate.toFixed(2)}%`],
      [""],
      ["Question Analysis"],
      ["Question", "Type", "Marks", "Accuracy Rate", "Average Marks"],
      ...statistics.questionAnalysis.map((q) => [
        q.questionText,
        q.questionType,
        q.marks.toString(),
        `${q.accuracyRate.toFixed(2)}%`,
        q.averageMarks.toFixed(2),
      ]),
    ];

    const csvContent = csvData.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `evaluation-statistics-${statistics.testTitle.replace(
          /[^a-zA-Z0-9]/g,
          "-",
        )}.csv`,
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const sortQuestions = (questions: QuestionAnalysis[]) => {
    return [...questions].sort((a, b) => {
      let aVal: number, bVal: number;

      switch (sortBy) {
        case "accuracy":
          aVal = a.accuracyRate;
          bVal = b.accuracyRate;
          break;
        case "marks":
          aVal = a.averageMarks;
          bVal = b.averageMarks;
          break;
        case "difficulty":
          const difficultyOrder = { easy: 1, medium: 2, hard: 3 };
          aVal = difficultyOrder[a.difficulty];
          bVal = difficultyOrder[b.difficulty];
          break;
        default:
          aVal = a.accuracyRate;
          bVal = b.accuracyRate;
      }

      return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
    });
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "bg-green-100 text-green-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "hard":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPerformanceColor = (rate: number) => {
    if (rate >= 90) return "text-green-600";
    if (rate >= 70) return "text-blue-600";
    if (rate >= 50) return "text-yellow-600";
    return "text-red-600";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <FaSpinner className="animate-spin text-blue-600" />
          <span>Loading evaluation statistics...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <FaExclamationTriangle className="w-5 h-5 text-red-600" />
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
              Evaluation Statistics
            </h1>
            <p className="text-gray-600">
              Detailed analysis of test performance and evaluation metrics
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
            {statistics && (
              <button
                onClick={exportStatistics}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                <FaFileExport className="w-4 h-4" />
                <span>Export</span>
              </button>
            )}
          </div>
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
                  Test
                </label>
                <select
                  value={selectedTest}
                  onChange={(e) => handleTestChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={!selectedCourse}
                >
                  <option value="">Select Test</option>
                  {tests.map((test) => (
                    <option key={test.id} value={test.id}>
                      {test.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* View Tabs */}
        {statistics && (
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
              onClick={() => setSelectedView("questions")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedView === "questions"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Question Analysis
            </button>
            <button
              onClick={() => setSelectedView("performance")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedView === "performance"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Performance
            </button>
            <button
              onClick={() => setSelectedView("timing")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedView === "timing"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Timing Analysis
            </button>
          </div>
        )}
      </div>

      {/* Content based on selected view */}
      {!statistics ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="text-center py-8">
            <FaChartBar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Select a Test
            </h3>
            <p className="text-gray-600">
              Choose a batch, course, and test to view evaluation statistics.
            </p>
          </div>
        </div>
      ) : (
        <>
          {selectedView === "overview" && (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Total Submissions
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {statistics.totalSubmissions}
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
                        Average Score
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {statistics.averageScore.toFixed(1)}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <FaCalculator className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Pass Rate
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {statistics.passRate.toFixed(1)}%
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <FaAward className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Pending Evaluations
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {statistics.pendingEvaluations}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                      <FaClock className="w-6 h-6 text-orange-600" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Score Distribution */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Score Distribution
                </h3>
                <div className="space-y-4">
                  {statistics.scoreDistribution.map((item, index) => (
                    <div key={index} className="flex items-center space-x-4">
                      <div className="w-24 text-sm font-medium text-gray-600">
                        {item.scoreRange}
                      </div>
                      <div className="flex-1 bg-gray-200 rounded-full h-4">
                        <div
                          className="bg-blue-600 h-4 rounded-full transition-all duration-300"
                          style={{ width: `${item.percentage}%` }}
                        ></div>
                      </div>
                      <div className="w-16 text-sm font-medium text-gray-900">
                        {item.count}
                      </div>
                      <div className="w-16 text-sm text-gray-600">
                        {item.percentage.toFixed(1)}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Performance Breakdown
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <FaThumbsUp className="w-5 h-5 text-green-600" />
                      <span className="text-sm font-medium text-green-800">
                        Excellent (90-100%)
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-green-700">
                      {statistics.performanceMetrics.excellentPerformers}
                    </p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <FaCheckCircle className="w-5 h-5 text-blue-600" />
                      <span className="text-sm font-medium text-blue-800">
                        Good (70-89%)
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-blue-700">
                      {statistics.performanceMetrics.goodPerformers}
                    </p>
                  </div>
                  <div className="bg-yellow-50 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <FaEquals className="w-5 h-5 text-yellow-600" />
                      <span className="text-sm font-medium text-yellow-800">
                        Average (50-69%)
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-yellow-700">
                      {statistics.performanceMetrics.averagePerformers}
                    </p>
                  </div>
                  <div className="bg-red-50 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <FaThumbsDown className="w-5 h-5 text-red-600" />
                      <span className="text-sm font-medium text-red-800">
                        Poor (&lt;50%)
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-red-700">
                      {statistics.performanceMetrics.poorPerformers}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedView === "questions" && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Question Analysis
                </h3>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Sort by:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="accuracy">Accuracy</option>
                    <option value="marks">Average Marks</option>
                    <option value="difficulty">Difficulty</option>
                  </select>
                  <button
                    onClick={() =>
                      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                    }
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    {sortOrder === "asc" ? (
                      <FaSortUp className="w-4 h-4" />
                    ) : (
                      <FaSortDown className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-600">
                        Question
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">
                        Type
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">
                        Difficulty
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">
                        Marks
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">
                        Accuracy
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">
                        Avg Marks
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">
                        Responses
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortQuestions(statistics.questionAnalysis).map(
                      (question, index) => (
                        <tr
                          key={question.questionId}
                          className={
                            index % 2 === 0 ? "bg-gray-50" : "bg-white"
                          }
                        >
                          <td className="py-3 px-4">
                            <div className="max-w-md">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {question.questionText}
                              </p>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-sm text-gray-600">
                              {question.questionType}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded-full ${getDifficultyColor(
                                question.difficulty,
                              )}`}
                            >
                              {question.difficulty}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-sm font-medium text-gray-900">
                              {question.marks}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`text-sm font-medium ${getPerformanceColor(
                                question.accuracyRate,
                              )}`}
                            >
                              {question.accuracyRate.toFixed(1)}%
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-sm text-gray-900">
                              {question.averageMarks.toFixed(1)}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-green-600">
                                {question.correctAnswers}✓
                              </span>
                              <span className="text-xs text-red-600">
                                {question.incorrectAnswers}✗
                              </span>
                            </div>
                          </td>
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {selectedView === "performance" && (
            <div className="space-y-6">
              {/* Difficulty Analysis */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Difficulty Analysis
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-3">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="font-medium text-green-800">
                        Easy Questions
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">
                          Total Questions
                        </span>
                        <span className="text-sm font-medium">
                          {statistics.difficultyAnalysis.easy.totalQuestions}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">
                          Avg Accuracy
                        </span>
                        <span className="text-sm font-medium">
                          {statistics.difficultyAnalysis.easy.averageAccuracy.toFixed(
                            1,
                          )}
                          %
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Avg Marks</span>
                        <span className="text-sm font-medium">
                          {statistics.difficultyAnalysis.easy.averageMarks.toFixed(
                            1,
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-yellow-50 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-3">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <span className="font-medium text-yellow-800">
                        Medium Questions
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">
                          Total Questions
                        </span>
                        <span className="text-sm font-medium">
                          {statistics.difficultyAnalysis.medium.totalQuestions}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">
                          Avg Accuracy
                        </span>
                        <span className="text-sm font-medium">
                          {statistics.difficultyAnalysis.medium.averageAccuracy.toFixed(
                            1,
                          )}
                          %
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Avg Marks</span>
                        <span className="text-sm font-medium">
                          {statistics.difficultyAnalysis.medium.averageMarks.toFixed(
                            1,
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-red-50 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-3">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span className="font-medium text-red-800">
                        Hard Questions
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">
                          Total Questions
                        </span>
                        <span className="text-sm font-medium">
                          {statistics.difficultyAnalysis.hard.totalQuestions}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">
                          Avg Accuracy
                        </span>
                        <span className="text-sm font-medium">
                          {statistics.difficultyAnalysis.hard.averageAccuracy.toFixed(
                            1,
                          )}
                          %
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Avg Marks</span>
                        <span className="text-sm font-medium">
                          {statistics.difficultyAnalysis.hard.averageMarks.toFixed(
                            1,
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Score Statistics */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Score Statistics
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600 mb-2">
                      {statistics.highestScore}
                    </div>
                    <div className="text-sm text-gray-600">Highest Score</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600 mb-2">
                      {statistics.averageScore.toFixed(1)}
                    </div>
                    <div className="text-sm text-gray-600">Average Score</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-red-600 mb-2">
                      {statistics.lowestScore}
                    </div>
                    <div className="text-sm text-gray-600">Lowest Score</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedView === "timing" && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Timing Analysis
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <FaClock className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">
                      Average Time
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-blue-700">
                    {Math.round(
                      statistics.timingAnalysis.averageCompletionTime,
                    )}{" "}
                    min
                  </p>
                </div>

                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <FaTrophy className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-medium text-green-800">
                      Fastest
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-green-700">
                    {Math.round(statistics.timingAnalysis.fastestCompletion)}{" "}
                    min
                  </p>
                </div>

                <div className="bg-red-50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <FaTimesCircle className="w-5 h-5 text-red-600" />
                    <span className="text-sm font-medium text-red-800">
                      Slowest
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-red-700">
                    {Math.round(statistics.timingAnalysis.slowestCompletion)}{" "}
                    min
                  </p>
                </div>

                <div className="bg-orange-50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <FaExclamationTriangle className="w-5 h-5 text-orange-600" />
                    <span className="text-sm font-medium text-orange-800">
                      Timeouts
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-orange-700">
                    {statistics.timingAnalysis.timeoutSubmissions}
                  </p>
                </div>

                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <FaCheckCircle className="w-5 h-5 text-purple-600" />
                    <span className="text-sm font-medium text-purple-800">
                      Early Submissions
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-purple-700">
                    {statistics.timingAnalysis.earlySubmissions}
                  </p>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default EvaluationStatistics;
