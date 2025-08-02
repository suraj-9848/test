import React, { useEffect, useState, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import apiClient from "../utils/axiosInterceptor";
import { API_ENDPOINTS } from "../config/urls";

// Simplified types
interface TestResult {
  studentId: string;
  studentName: string;
  testId: string;
  testName: string;
  score: number;
  maxScore: number;
  percentage: number;
  submittedAt: string;
  status: "submitted" | "evaluated" | "pending";
}

interface Batch {
  id: string;
  name: string;
}

interface Course {
  id: string;
  title: string;
}

interface Test {
  id: string;
  title: string;
}

interface TestAnalyticsProps {
  onClose?: () => void;
}

const TestAnalytics: React.FC<TestAnalyticsProps> = ({ onClose }) => {
  const { data: session, status } = useSession();

  // State
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<string>("");
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [selectedTest, setSelectedTest] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  // Refs for cleanup
  const mountedRef = useRef(true);

  // Cleanup is now handled in the main useEffect below

  // Fetch test results
  const fetchTestResults = useCallback(
    async (batchId: string, courseId: string, testId?: string) => {
      if (!batchId || !courseId || !mountedRef.current) {
        return;
      }

      try {
        setLoading(true);
        setError("");

        console.log(
          `Fetching test analytics for batch: ${batchId}, course: ${courseId}, test: ${testId || "all"}`,
        );

        if (testId) {
          // Get analytics for specific test
          const endpoint = `${API_ENDPOINTS.INSTRUCTOR.BATCHES}/${batchId}/courses/${courseId}/tests/${testId}/analytics`;
          const response = await apiClient.get(endpoint);

          if (mountedRef.current && response.data) {
            // Transform backend data to frontend format
            const analyticsData = response.data;
            console.log("Test analytics received:", analyticsData);

            // Get test results to obtain actual scores
            try {
              const testResultsEndpoint = `${API_ENDPOINTS.INSTRUCTOR.BATCHES}/${batchId}/courses/${courseId}/tests/${testId}/responses`;
              const testResultsResponse =
                await apiClient.get(testResultsEndpoint);
              const testResults = testResultsResponse.data?.responses || [];

              // Create a map of student scores
              const scoreMap = new Map();
              testResults.forEach((result: any) => {
                scoreMap.set(result.userId || result.studentId, {
                  score: result.score || 0,
                  maxScore: result.maxScore || 100,
                  submittedAt: result.submittedAt || new Date().toISOString(),
                });
              });

              const transformedResults: TestResult[] = [
                ...(analyticsData.studentsGave?.map((student: any) => {
                  const scoreData = scoreMap.get(student.id) || {
                    score: 0,
                    maxScore: 100,
                    submittedAt: new Date().toISOString(),
                  };
                  return {
                    studentId: student.id,
                    studentName: student.username,
                    testId: testId,
                    testName:
                      tests.find((t) => t.id === testId)?.title || "Test",
                    score: scoreData.score,
                    maxScore: scoreData.maxScore,
                    percentage:
                      scoreData.maxScore > 0
                        ? Math.round(
                            (scoreData.score / scoreData.maxScore) * 100,
                          )
                        : 0,
                    submittedAt: scoreData.submittedAt,
                    status: "evaluated" as const,
                  };
                }) || []),
                ...(analyticsData.studentsNotGave?.map((student: any) => ({
                  studentId: student.id,
                  studentName: student.username,
                  testId: testId,
                  testName: tests.find((t) => t.id === testId)?.title || "Test",
                  score: 0,
                  maxScore: 100,
                  percentage: 0,
                  submittedAt: "",
                  status: "pending" as const,
                })) || []),
              ];

              setTestResults(transformedResults);
            } catch (scoreErr) {
              console.warn(
                "Could not fetch test scores, using basic analytics:",
                scoreErr,
              );
              // Fallback to basic analytics without scores
              const basicResults: TestResult[] = [
                ...(analyticsData.studentsGave?.map((student: any) => ({
                  studentId: student.id,
                  studentName: student.username,
                  testId: testId,
                  testName: tests.find((t) => t.id === testId)?.title || "Test",
                  score: 0,
                  maxScore: 100,
                  percentage: 0,
                  submittedAt: new Date().toISOString(),
                  status: "evaluated" as const,
                })) || []),
                ...(analyticsData.studentsNotGave?.map((student: any) => ({
                  studentId: student.id,
                  studentName: student.username,
                  testId: testId,
                  testName: tests.find((t) => t.id === testId)?.title || "Test",
                  score: 0,
                  maxScore: 100,
                  percentage: 0,
                  submittedAt: "",
                  status: "pending" as const,
                })) || []),
              ];

              setTestResults(basicResults);
            }
          }
        } else {
          // Get all test results - mock for now since we don't have aggregated endpoint
          setTestResults([]);
        }
      } catch (err: any) {
        console.error("Error fetching test results:", err);
        if (mountedRef.current) {
          setError("Failed to load test results");
        }
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    },
    [tests],
  );

  // Fetch tests for course
  const fetchTestsForCourse = useCallback(
    async (batchId: string, courseId: string) => {
      if (!batchId || !courseId || !mountedRef.current) {
        return;
      }

      try {
        console.log(
          `📋 Fetching tests for batch: ${batchId}, course: ${courseId}`,
        );
        const response = await apiClient.get(
          API_ENDPOINTS.INSTRUCTOR.ANALYTICS.BATCH_COURSE_TESTS(
            batchId,
            courseId,
          ),
        );

        if (!response || !mountedRef.current) return;

        const responseData = response.data;
        const testList = responseData.data?.tests || responseData.tests || [];

        setTests(testList);

        // If there are tests, fetch results for the first test by default
        if (testList.length > 0) {
          setSelectedTest(testList[0].id);
          await fetchTestResults(batchId, courseId, testList[0].id);
        }
      } catch (err: any) {
        console.error(" Error fetching tests:", err);
        if (mountedRef.current) {
          setError("Failed to load tests for the selected course");
        }
      }
    },
    [], // Remove dependency
  );

  // Fetch courses for batch
  const fetchCoursesForBatch = useCallback(
    async (batchId: string) => {
      if (!batchId || !mountedRef.current) {
        return;
      }

      try {
        console.log(
          `🔄 TEST ANALYTICS: Fetching courses for batch: ${batchId}`,
        );
        const coursesResponse = await apiClient.get(
          `${API_ENDPOINTS.INSTRUCTOR.BATCHES}/${batchId}/courses`,
        );

        if (!coursesResponse || !mountedRef.current) return;

        const responseData = coursesResponse.data;
        console.log("📦 TEST ANALYTICS: Courses API response:", responseData);

        // Handle different response formats
        const courseList = responseData.courses || [];

        setCourses(courseList);

        if (courseList.length > 0) {
          setSelectedCourse(courseList[0].id);
          await fetchTestsForCourse(batchId, courseList[0].id);
        }
      } catch (err: any) {
        console.error(" Error fetching courses:", err);
        if (mountedRef.current) {
          setError("Failed to load courses for the selected batch");
        }
      }
    },
    [], // Remove dependency
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

      console.log("🚀 TestAnalytics - Fetching batches...");
      const batchesResponse = await apiClient.get(
        API_ENDPOINTS.INSTRUCTOR.BATCHES,
      );

      if (!batchesResponse || !mountedRef.current) return;

      const responseData = batchesResponse.data;
      const batchList = responseData.batches || [];

      console.log(" TestAnalytics - Batches received:", batchList.length);
      setBatches(batchList);

      if (batchList.length > 0) {
        setSelectedBatch(batchList[0].id);
        await fetchCoursesForBatch(batchList[0].id);
      }
    } catch (err: any) {
      console.error(" TestAnalytics - Error fetching initial data:", err);
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
    console.log("🚀 TestAnalytics - Component mounted");

    // Ensure mountedRef is set to true
    mountedRef.current = true;
    console.log("🔧 TestAnalytics mountedRef set to:", mountedRef.current);

    fetchInitialData();

    return () => {
      console.log(
        "🧹 TestAnalytics - Component cleanup, setting mountedRef to false",
      );
      mountedRef.current = false;
    };
  }, []); // No dependencies - fetchInitialData handles its own conditions

  // Handle batch change
  const handleBatchChange = useCallback(
    (batchId: string) => {
      if (!mountedRef.current) return;

      setSelectedBatch(batchId);
      setSelectedCourse("");
      setSelectedTest("");
      setCourses([]);
      setTests([]);
      setTestResults([]);

      if (batchId) {
        fetchCoursesForBatch(batchId);
      }
    },
    [fetchCoursesForBatch],
  );

  // Handle course change
  const handleCourseChange = useCallback(
    (courseId: string) => {
      if (!mountedRef.current) return;

      setSelectedCourse(courseId);
      setSelectedTest("");
      setTests([]);
      setTestResults([]);

      if (selectedBatch && courseId) {
        fetchTestsForCourse(selectedBatch, courseId);
      }
    },
    [selectedBatch, fetchTestsForCourse],
  );

  // Handle test change
  const handleTestChange = useCallback(
    (testId: string) => {
      if (!mountedRef.current) return;

      setSelectedTest(testId);

      if (selectedBatch && selectedCourse) {
        fetchTestResults(selectedBatch, selectedCourse, testId || undefined);
      }
    },
    [selectedBatch, selectedCourse, fetchTestResults],
  );

  // Calculate statistics
  const calculateStats = () => {
    if (!testResults.length) return null;

    const totalSubmissions = testResults.length;
    const evaluatedSubmissions = testResults.filter(
      (r) => r.status === "evaluated",
    ).length;
    const pendingSubmissions = testResults.filter(
      (r) => r.status === "pending",
    ).length;
    const averageScore =
      testResults
        .filter((r) => r.status === "evaluated")
        .reduce((sum, r) => sum + r.percentage, 0) /
      (evaluatedSubmissions || 1);

    return {
      totalSubmissions,
      evaluatedSubmissions,
      pendingSubmissions,
      averageScore: Math.round(averageScore),
    };
  };

  const stats = calculateStats();

  // Show loading for authentication
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading test analytics...</p>
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
              Error Loading Test Analytics
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
              <div className="text-2xl">📊</div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Test Analytics
                </h1>
                <p className="text-gray-600">
                  Track test performance and student results
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Test
              </label>
              <select
                value={selectedTest}
                onChange={(e) => handleTestChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={!selectedCourse}
              >
                <option value="">All Tests</option>
                {tests.map((test) => (
                  <option key={test.id} value={test.id}>
                    {test.title}
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
                    Total Submissions
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.totalSubmissions}
                  </p>
                </div>
                <div className="text-2xl">📝</div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Evaluated</p>
                  <p className="text-2xl font-bold text-green-600">
                    {stats.evaluatedSubmissions}
                  </p>
                </div>
                <div className="text-2xl"></div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {stats.pendingSubmissions}
                  </p>
                </div>
                <div className="text-2xl">⏳</div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Score</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {stats.averageScore}%
                  </p>
                </div>
                <div className="text-2xl">🎯</div>
              </div>
            </div>
          </div>
        )}

        {/* Test Results */}
        {!selectedBatch || !selectedCourse ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <div className="text-gray-400 text-4xl mb-4">📊</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Select Batch and Course
            </h3>
            <p className="text-gray-600">
              Please select both a batch and course to view test analytics
            </p>
          </div>
        ) : testResults.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <div className="text-gray-400 text-4xl mb-4">📋</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Test Results
            </h3>
            <p className="text-gray-600">
              No test results found for the selected filters
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Test Results ({testResults.length} submissions)
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
                      Test
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Percentage
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Submitted
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {testResults.map((result, index) => (
                    <tr
                      key={`${result.studentId}-${result.testId}-${index}`}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {result.studentName}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {result.testName}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {result.score}/{result.maxScore}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                            <div
                              className={`h-2 rounded-full ${
                                result.percentage >= 80
                                  ? "bg-green-600"
                                  : result.percentage >= 60
                                    ? "bg-yellow-600"
                                    : "bg-red-600"
                              }`}
                              style={{ width: `${result.percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-900">
                            {result.percentage}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            result.status === "evaluated"
                              ? "bg-green-100 text-green-800"
                              : result.status === "submitted"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {result.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(result.submittedAt).toLocaleDateString()}
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

export default TestAnalytics;
