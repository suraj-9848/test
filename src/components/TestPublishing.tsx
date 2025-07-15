import React, { useState, useEffect, useCallback } from "react";
import {
  FaEyeSlash,
  FaEdit,
  FaCalendarAlt,
  FaCheckCircle,
  FaTimesCircle,
  FaSpinner,
  FaBook,
  FaGraduationCap,
  FaClipboardList,
  FaStop,
  FaSearch,
  FaFilter,
  FaChevronDown,
  FaChevronUp,
  FaQuestionCircle,
  FaExclamationTriangle,
  FaInfoCircle,
  FaCheck,
  FaTimes,
  FaGlobe,
  FaCloudUploadAlt,
  FaCogs,
} from "react-icons/fa";
import { useSession } from "next-auth/react";
import axios from "axios";

// Types
interface RawTestData {
  id: string;
  title: string;
  description: string;
  maxMarks: number;
  passingMarks: number;
  durationInMinutes: number;
  startDate: string;
  endDate: string;
  shuffleQuestions: boolean;
  showResults: boolean;
  showCorrectAnswers: boolean;
  status: "DRAFT" | "PUBLISHED" | "ACTIVE" | "COMPLETED" | "EXPIRED";
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  questions?: unknown[];
  submissions?: unknown[];
}

interface Test {
  id: string;
  title: string;
  description: string;
  maxMarks: number;
  passingMarks: number;
  durationInMinutes: number;
  startDate: string;
  endDate: string;
  shuffleQuestions: boolean;
  showResults: boolean;
  showCorrectAnswers: boolean;
  status: "DRAFT" | "PUBLISHED" | "ACTIVE" | "COMPLETED" | "EXPIRED";
  isPublished: boolean;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  questionsCount: number;
  submissionsCount: number;
  course: {
    id: string;
    title: string;
  };
  batch: {
    id: string;
    name: string;
  };
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

const TestPublishing: React.FC = () => {
  const { data: session } = useSession();

  // State
  const [batches, setBatches] = useState<Batch[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [selectedBatch, setSelectedBatch] = useState<string>("");
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);
  const [expandedTests, setExpandedTests] = useState<Set<string>>(new Set());
  const [publishingTest, setPublishingTest] = useState<string>("");
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

  const fetchInitialData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiCall("/api/instructor/batches");
      setBatches(response);
      if (response.length > 0) {
        setSelectedBatch(response[0].id);
        // Fetch courses for the first batch
        try {
          const coursesResponse = await apiCall(
            `/api/instructor/batches/${response[0].id}/courses`
          );
          setCourses(coursesResponse);
          if (coursesResponse.length > 0) {
            setSelectedCourse(coursesResponse[0].id);
            // Fetch tests for the first course
            const testsResponse = await apiCall(
              `/api/instructor/batches/${response[0].id}/courses/${coursesResponse[0].id}/tests`
            );
            const processedTests: Test[] = testsResponse.map(
              (test: RawTestData) => ({
                ...test,
                isPublished:
                  test.status === "PUBLISHED" || test.status === "ACTIVE",
                publishedAt: test.publishedAt || null,
                questionsCount: test.questions?.length || 0,
                submissionsCount: test.submissions?.length || 0,
                course: {
                  id: coursesResponse[0].id,
                  title: coursesResponse[0].title || "Course",
                },
                batch: {
                  id: response[0].id,
                  name: response[0].name || "Batch",
                },
              })
            );
            setTests(processedTests);
          }
        } catch (coursesErr) {
          console.error("Error fetching courses:", coursesErr);
        }
      }
    } catch (err) {
      console.error("Error fetching initial data:", err);
      setError("Failed to load initial data");
    } finally {
      setLoading(false);
    }
  }, [apiCall]);

  // Fetch initial data
  useEffect(() => {
    if (backendJwt) {
      fetchInitialData();
    }
  }, [backendJwt, fetchInitialData]);

  const fetchCourses = async (batchId: string) => {
    try {
      const response = await apiCall(
        `/api/instructor/batches/${batchId}/courses`
      );
      setCourses(response);
      if (response.length > 0) {
        setSelectedCourse(response[0].id);
        await fetchTests(batchId, response[0].id);
      }
    } catch (err) {
      console.error("Error fetching courses:", err);
      setError("Failed to load courses");
    }
  };

  const fetchTests = async (batchId: string, courseId: string) => {
    try {
      const response = await apiCall(
        `/api/instructor/batches/${batchId}/courses/${courseId}/tests`
      );

      // Process the tests data to include publishing status
      const processedTests: Test[] = response.map((test: RawTestData) => ({
        ...test,
        isPublished: test.status === "PUBLISHED" || test.status === "ACTIVE",
        publishedAt: test.publishedAt || null,
        questionsCount: test.questions?.length || 0,
        submissionsCount: test.submissions?.length || 0,
        course: {
          id: courseId,
          title: courses.find((c) => c.id === courseId)?.title || "Course",
        },
        batch: {
          id: batchId,
          name: batches.find((b) => b.id === batchId)?.name || "Batch",
        },
      }));

      setTests(processedTests);
    } catch (err) {
      console.error("Error fetching tests:", err);
      setError("Failed to load tests");
    }
  };

  const handleBatchChange = (batchId: string) => {
    setSelectedBatch(batchId);
    setSelectedCourse("");
    setCourses([]);
    setTests([]);
    if (batchId) {
      fetchCourses(batchId);
    }
  };

  const handleCourseChange = (courseId: string) => {
    setSelectedCourse(courseId);
    setTests([]);
    if (selectedBatch && courseId) {
      fetchTests(selectedBatch, courseId);
    }
  };

  const handlePublishTest = async (testId: string) => {
    try {
      setPublishingTest(testId);

      if (!selectedBatch || !selectedCourse) {
        setError("Please select batch and course");
        return;
      }

      await apiCall(
        `/api/instructor/batches/${selectedBatch}/courses/${selectedCourse}/tests/${testId}/publish`,
        {
          method: "PATCH",
        }
      );

      // Refresh tests list
      await fetchTests(selectedBatch, selectedCourse);

      setPublishingTest("");
    } catch (err) {
      console.error("Error publishing test:", err);
      setError("Failed to publish test");
      setPublishingTest("");
    }
  };

  const handleUnpublishTest = async (testId: string) => {
    try {
      setPublishingTest(testId);

      if (!selectedBatch || !selectedCourse) {
        setError("Please select batch and course");
        return;
      }

      // Unpublish by updating status to DRAFT
      await apiCall(
        `/api/instructor/batches/${selectedBatch}/courses/${selectedCourse}/tests/${testId}`,
        {
          method: "PUT",
          body: JSON.stringify({ status: "DRAFT" }),
        }
      );

      // Refresh tests list
      await fetchTests(selectedBatch, selectedCourse);

      setPublishingTest("");
    } catch (err) {
      console.error("Error unpublishing test:", err);
      setError("Failed to unpublish test");
      setPublishingTest("");
    }
  };

  const toggleTestExpansion = (testId: string) => {
    setExpandedTests((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(testId)) {
        newSet.delete(testId);
      } else {
        newSet.add(testId);
      }
      return newSet;
    });
  };

  const filteredTests = tests.filter((test) => {
    if (
      searchTerm &&
      !test.title.toLowerCase().includes(searchTerm.toLowerCase())
    ) {
      return false;
    }
    if (statusFilter && test.status !== statusFilter) {
      return false;
    }
    return true;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PUBLISHED":
      case "ACTIVE":
        return <FaCheckCircle className="w-5 h-5 text-green-500" />;
      case "DRAFT":
        return <FaEdit className="w-5 h-5 text-yellow-500" />;
      case "COMPLETED":
        return <FaStop className="w-5 h-5 text-blue-500" />;
      case "EXPIRED":
        return <FaTimesCircle className="w-5 h-5 text-red-500" />;
      default:
        return <FaQuestionCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PUBLISHED":
      case "ACTIVE":
        return "bg-green-100 text-green-800";
      case "DRAFT":
        return "bg-yellow-100 text-yellow-800";
      case "COMPLETED":
        return "bg-blue-100 text-blue-800";
      case "EXPIRED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const canPublish = (test: Test) => {
    return test.status === "DRAFT" && test.questionsCount > 0;
  };

  const canUnpublish = (test: Test) => {
    return test.status === "PUBLISHED" && test.submissionsCount === 0;
  };

  const isTestActive = (test: Test) => {
    const now = new Date();
    const startDate = new Date(test.startDate);
    const endDate = new Date(test.endDate);
    return now >= startDate && now <= endDate;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <FaSpinner className="animate-spin text-blue-600" />
          <span>Loading test publishing...</span>
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
              Test Publishing
            </h1>
            <p className="text-gray-600">
              Manage test publishing and visibility
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
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Status</option>
                  <option value="DRAFT">Draft</option>
                  <option value="PUBLISHED">Published</option>
                  <option value="ACTIVE">Active</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="EXPIRED">Expired</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search
                </label>
                <div className="relative">
                  <FaSearch className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search tests..."
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tests List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Tests ({filteredTests.length})
        </h2>

        {filteredTests.length === 0 ? (
          <div className="text-center py-8">
            <FaClipboardList className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Tests Found
            </h3>
            <p className="text-gray-600">
              {selectedBatch && selectedCourse
                ? "No tests available for the selected batch and course."
                : "Select a batch and course to view tests."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTests.map((test) => (
              <div
                key={test.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => toggleTestExpansion(test.id)}
                    className="flex items-center space-x-3 text-left flex-1"
                  >
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(test.status)}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {test.title}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {test.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>{test.questionsCount} questions</span>
                      <span>{test.submissionsCount} submissions</span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          test.status
                        )}`}
                      >
                        {test.status}
                      </span>
                    </div>
                    {expandedTests.has(test.id) ? (
                      <FaChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <FaChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </button>

                  <div className="flex items-center space-x-2 ml-4">
                    {canPublish(test) && (
                      <button
                        onClick={() => handlePublishTest(test.id)}
                        disabled={publishingTest === test.id}
                        className="flex items-center space-x-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50"
                      >
                        {publishingTest === test.id ? (
                          <FaSpinner className="animate-spin w-4 h-4" />
                        ) : (
                          <FaCloudUploadAlt className="w-4 h-4" />
                        )}
                        <span>Publish</span>
                      </button>
                    )}

                    {canUnpublish(test) && (
                      <button
                        onClick={() => handleUnpublishTest(test.id)}
                        disabled={publishingTest === test.id}
                        className="flex items-center space-x-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
                      >
                        {publishingTest === test.id ? (
                          <FaSpinner className="animate-spin w-4 h-4" />
                        ) : (
                          <FaEyeSlash className="w-4 h-4" />
                        )}
                        <span>Unpublish</span>
                      </button>
                    )}

                    {test.isPublished && (
                      <div className="flex items-center space-x-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg">
                        <FaGlobe className="w-4 h-4" />
                        <span>Live</span>
                      </div>
                    )}
                  </div>
                </div>

                {expandedTests.has(test.id) && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center space-x-2 mb-2">
                          <FaCalendarAlt className="w-4 h-4 text-gray-500" />
                          <span className="text-sm font-medium text-gray-700">
                            Schedule
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">
                          <div>
                            Start: {new Date(test.startDate).toLocaleString()}
                          </div>
                          <div>
                            End: {new Date(test.endDate).toLocaleString()}
                          </div>
                        </div>
                        {isTestActive(test) && (
                          <div className="mt-2 px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                            Currently Active
                          </div>
                        )}
                      </div>

                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center space-x-2 mb-2">
                          <FaQuestionCircle className="w-4 h-4 text-gray-500" />
                          <span className="text-sm font-medium text-gray-700">
                            Test Details
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">
                          <div>Max Marks: {test.maxMarks}</div>
                          <div>Passing: {test.passingMarks}</div>
                          <div>Duration: {test.durationInMinutes} minutes</div>
                        </div>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center space-x-2 mb-2">
                          <FaCogs className="w-4 h-4 text-gray-500" />
                          <span className="text-sm font-medium text-gray-700">
                            Settings
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">
                          <div className="flex items-center space-x-2">
                            {test.shuffleQuestions ? (
                              <FaCheck className="w-3 h-3 text-green-500" />
                            ) : (
                              <FaTimes className="w-3 h-3 text-red-500" />
                            )}
                            <span>Shuffle Questions</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            {test.showResults ? (
                              <FaCheck className="w-3 h-3 text-green-500" />
                            ) : (
                              <FaTimes className="w-3 h-3 text-red-500" />
                            )}
                            <span>Show Results</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            {test.showCorrectAnswers ? (
                              <FaCheck className="w-3 h-3 text-green-500" />
                            ) : (
                              <FaTimes className="w-3 h-3 text-red-500" />
                            )}
                            <span>Show Correct Answers</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {test.publishedAt && (
                      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                        <div className="flex items-center space-x-2 text-blue-700">
                          <FaInfoCircle className="w-4 h-4" />
                          <span className="text-sm font-medium">
                            Published on{" "}
                            {new Date(test.publishedAt).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    )}

                    {!canPublish(test) && test.status === "DRAFT" && (
                      <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                        <div className="flex items-center space-x-2 text-yellow-700">
                          <FaExclamationTriangle className="w-4 h-4" />
                          <span className="text-sm font-medium">
                            Cannot publish: Test needs at least one question
                          </span>
                        </div>
                      </div>
                    )}

                    {!canUnpublish(test) &&
                      test.isPublished &&
                      test.submissionsCount > 0 && (
                        <div className="mt-4 p-3 bg-red-50 rounded-lg">
                          <div className="flex items-center space-x-2 text-red-700">
                            <FaExclamationTriangle className="w-4 h-4" />
                            <span className="text-sm font-medium">
                              Cannot unpublish: Test has submissions
                            </span>
                          </div>
                        </div>
                      )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TestPublishing;
