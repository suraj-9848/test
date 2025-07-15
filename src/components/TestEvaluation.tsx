import React, { useState, useEffect, useCallback } from "react";
import {
  FaClipboardCheck,
  FaSearch,
  FaFilter,
  FaSpinner,
  FaEye,
  FaCheck,
  FaTimes,
  FaClipboardList,
  FaUser,
  FaClock,
  FaCalendarAlt,
  FaCheckCircle,
} from "react-icons/fa";
import { useSession } from "next-auth/react";
import axios from "axios";

interface TestSubmission {
  id: string;
  student_id: string;
  test_id: string;
  submitted_at: string;
  is_evaluated: boolean;
  total_marks?: number;
  obtained_marks?: number;
  percentage?: number;
  student?: {
    id: string;
    username: string;
    email: string;
  };
  test?: {
    id: string;
    title: string;
    maxMarks: number;
    durationInMinutes: number;
  };
}

interface TestResponse {
  id: string;
  question_id: string;
  student_response: string;
  marks_obtained?: number;
  is_correct?: boolean;
  feedback?: string;
  question?: {
    id: string;
    question_text: string;
    type: string;
    marks: number;
    correct_answer?: string;
  };
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
  maxMarks: number;
  durationInMinutes: number;
}

const TestEvaluation: React.FC = () => {
  const { data: session } = useSession();

  // State
  const [submissions, setSubmissions] = useState<TestSubmission[]>([]);
  const [responses, setResponses] = useState<TestResponse[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setError] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBatch, setSelectedBatch] = useState<string>("");
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [selectedTest, setSelectedTest] = useState<string>("");
  const [selectedSubmission, setSelectedSubmission] =
    useState<TestSubmission | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [backendJwt, setBackendJwt] = useState<string>("");

  // API Base URL
  const API_BASE_URL =
    process.env.NEXT_PUBLIC_BACKEND_BASE_URL || "http://localhost:3000";

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

  const fetchBatches = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${API_BASE_URL}/api/instructor/batches`,
        {
          headers: { Authorization: `Bearer ${backendJwt}` },
        }
      );
      setBatches(response.data.batches || []);
    } catch (err) {
      console.error("Error fetching batches:", err);
      setError("Failed to load batches");
    } finally {
      setLoading(false);
    }
  }, [backendJwt, API_BASE_URL]);

  // Fetch initial data
  useEffect(() => {
    if (backendJwt) {
      fetchBatches();
    }
  }, [backendJwt, fetchBatches]);

  const fetchCourses = async (batchId: string) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/instructor/batches/${batchId}/courses`,
        {
          headers: { Authorization: `Bearer ${backendJwt}` },
        }
      );
      setCourses(response.data.courses || []);
    } catch (err) {
      console.error("Error fetching courses:", err);
    }
  };

  const fetchTests = async (batchId: string, courseId: string) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/instructor/batches/${batchId}/courses/${courseId}/tests`,
        {
          headers: { Authorization: `Bearer ${backendJwt}` },
        }
      );
      setTests(response.data.data?.tests || []);
    } catch (err) {
      console.error("Error fetching tests:", err);
    }
  };

  const fetchSubmissions = async (
    batchId: string,
    courseId: string,
    testId: string
  ) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/instructor/batches/${batchId}/courses/${courseId}/tests/${testId}/submissions`,
        {
          headers: { Authorization: `Bearer ${backendJwt}` },
        }
      );
      setSubmissions(response.data.data?.submissions || []);
    } catch (err) {
      console.error("Error fetching submissions:", err);
    }
  };

  const fetchResponses = async (
    batchId: string,
    courseId: string,
    testId: string,
    submissionId: string
  ) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/instructor/batches/${batchId}/courses/${courseId}/tests/${testId}/responses`,
        {
          headers: { Authorization: `Bearer ${backendJwt}` },
          params: { submissionId },
        }
      );
      setResponses(response.data.data?.responses || []);
    } catch (err) {
      console.error("Error fetching responses:", err);
    }
  };

  const handleBatchChange = (batchId: string) => {
    setSelectedBatch(batchId);
    setSelectedCourse("");
    setSelectedTest("");
    setCourses([]);
    setTests([]);
    setSubmissions([]);
    if (batchId) {
      fetchCourses(batchId);
    }
  };

  const handleCourseChange = (courseId: string) => {
    setSelectedCourse(courseId);
    setSelectedTest("");
    setTests([]);
    setSubmissions([]);
    if (selectedBatch && courseId) {
      fetchTests(selectedBatch, courseId);
    }
  };

  const handleTestChange = (testId: string) => {
    setSelectedTest(testId);
    setSubmissions([]);
    if (selectedBatch && selectedCourse && testId) {
      fetchSubmissions(selectedBatch, selectedCourse, testId);
    }
  };

  const handleViewSubmission = async (submission: TestSubmission) => {
    setSelectedSubmission(submission);
    if (selectedBatch && selectedCourse && selectedTest) {
      await fetchResponses(
        selectedBatch,
        selectedCourse,
        selectedTest,
        submission.id
      );
    }
    setShowResponseModal(true);
  };

  const handleEvaluateResponse = async (
    responseId: string,
    marks: number,
    feedback: string
  ) => {
    try {
      setEvaluating(true);
      await axios.put(
        `${API_BASE_URL}/api/instructor/batches/${selectedBatch}/courses/${selectedCourse}/tests/${selectedTest}/responses/${responseId}/evaluate`,
        {
          marks_obtained: marks,
          feedback: feedback,
        },
        {
          headers: { Authorization: `Bearer ${backendJwt}` },
        }
      );

      // Refresh responses
      if (selectedSubmission) {
        await fetchResponses(
          selectedBatch,
          selectedCourse,
          selectedTest,
          selectedSubmission.id
        );
      }

      alert("Response evaluated successfully!");
    } catch (err) {
      console.error("Error evaluating response:", err);
      alert("Failed to evaluate response");
    } finally {
      setEvaluating(false);
    }
  };

  const handleBulkEvaluate = async () => {
    if (
      !window.confirm(
        "Are you sure you want to auto-evaluate all submissions for this test?"
      )
    ) {
      return;
    }

    try {
      setEvaluating(true);
      await axios.post(
        `${API_BASE_URL}/api/instructor/batches/${selectedBatch}/courses/${selectedCourse}/tests/${selectedTest}/submissions/bulk-evaluate`,
        {},
        {
          headers: { Authorization: `Bearer ${backendJwt}` },
        }
      );

      // Refresh submissions
      if (selectedBatch && selectedCourse && selectedTest) {
        await fetchSubmissions(selectedBatch, selectedCourse, selectedTest);
      }

      alert("Bulk evaluation completed successfully!");
    } catch (err) {
      console.error("Error in bulk evaluation:", err);
      alert("Failed to perform bulk evaluation");
    } finally {
      setEvaluating(false);
    }
  };

  const filteredSubmissions = submissions.filter((submission) => {
    if (searchTerm) {
      return (
        submission.student?.username
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        submission.student?.email
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase())
      );
    }
    return true;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusBadge = (submission: TestSubmission) => {
    if (submission.is_evaluated) {
      return (
        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full flex items-center">
          <FaCheckCircle className="w-3 h-3 mr-1" />
          Evaluated
        </span>
      );
    } else {
      return (
        <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full flex items-center">
          <FaClock className="w-3 h-3 mr-1" />
          Pending
        </span>
      );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <FaSpinner className="animate-spin text-blue-600" />
          <span>Loading test evaluations...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Test Evaluation
            </h1>
            <p className="text-gray-600">
              Review and evaluate student test submissions
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
            {selectedTest && (
              <button
                onClick={handleBulkEvaluate}
                disabled={evaluating}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                <FaClipboardCheck className="w-4 h-4" />
                <span>{evaluating ? "Evaluating..." : "Bulk Evaluate"}</span>
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                    placeholder="Search students..."
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stats */}
        {selectedTest && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100">Total Submissions</p>
                  <p className="text-2xl font-bold">{submissions.length}</p>
                </div>
                <FaClipboardList className="w-8 h-8 text-blue-200" />
              </div>
            </div>
            <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100">Evaluated</p>
                  <p className="text-2xl font-bold">
                    {submissions.filter((s) => s.is_evaluated).length}
                  </p>
                </div>
                <FaCheckCircle className="w-8 h-8 text-green-200" />
              </div>
            </div>
            <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-100">Pending</p>
                  <p className="text-2xl font-bold">
                    {submissions.filter((s) => !s.is_evaluated).length}
                  </p>
                </div>
                <FaClock className="w-8 h-8 text-yellow-200" />
              </div>
            </div>
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100">Avg Score</p>
                  <p className="text-2xl font-bold">
                    {submissions.filter((s) => s.percentage).length > 0
                      ? Math.round(
                          submissions
                            .filter((s) => s.percentage)
                            .reduce((sum, s) => sum + (s.percentage || 0), 0) /
                            submissions.filter((s) => s.percentage).length
                        )
                      : 0}
                    %
                  </p>
                </div>
                <FaClipboardCheck className="w-8 h-8 text-purple-200" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Submissions List */}
      {selectedTest ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Test Submissions
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-600">
                    Student
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">
                    Submitted
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">
                    Score
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredSubmissions.map((submission, index) => (
                  <tr
                    key={submission.id}
                    className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <FaUser className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {submission.student?.username || "Unknown Student"}
                          </div>
                          <div className="text-sm text-gray-500">
                            {submission.student?.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <FaCalendarAlt className="w-4 h-4 mr-2" />
                        {formatDate(submission.submitted_at)}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {submission.is_evaluated ? (
                        <div>
                          <span className="text-lg font-bold text-gray-900">
                            {submission.obtained_marks}/{submission.total_marks}
                          </span>
                          <div className="text-sm text-gray-500">
                            {submission.percentage}%
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400">Not evaluated</span>
                      )}
                    </td>
                    <td className="py-3 px-4">{getStatusBadge(submission)}</td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleViewSubmission(submission)}
                        className="flex items-center space-x-1 px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded text-sm transition-colors"
                      >
                        <FaEye className="w-3 h-3" />
                        <span>Review</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredSubmissions.length === 0 && (
            <div className="text-center py-8">
              <FaClipboardList className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Submissions Found
              </h3>
              <p className="text-gray-600">
                {searchTerm
                  ? "No submissions match your search."
                  : "No students have submitted this test yet."}
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <FaClipboardCheck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Select a Test
          </h3>
          <p className="text-gray-600">
            Please select a batch, course, and test to view submissions for
            evaluation.
          </p>
        </div>
      )}

      {/* Response Review Modal */}
      {showResponseModal && selectedSubmission && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                Review Submission - {selectedSubmission.student?.username}
              </h2>
              <button
                onClick={() => setShowResponseModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              {responses.map((response, index) => (
                <div
                  key={response.id}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 mb-2">
                        Question {index + 1} ({response.question?.marks} marks)
                      </h3>
                      <p className="text-gray-700 mb-3">
                        {response.question?.question_text}
                      </p>

                      <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-3">
                        <h4 className="font-medium text-blue-900 mb-1">
                          Student Answer:
                        </h4>
                        <p className="text-blue-800">
                          {response.student_response}
                        </p>
                      </div>

                      {response.question?.correct_answer && (
                        <div className="bg-green-50 border border-green-200 rounded p-3 mb-3">
                          <h4 className="font-medium text-green-900 mb-1">
                            Correct Answer:
                          </h4>
                          <p className="text-green-800">
                            {response.question.correct_answer}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Marks Obtained
                      </label>
                      <input
                        type="number"
                        value={response.marks_obtained || 0}
                        onChange={(e) => {
                          const newResponses = responses.map((r) =>
                            r.id === response.id
                              ? {
                                  ...r,
                                  marks_obtained: parseInt(e.target.value),
                                }
                              : r
                          );
                          setResponses(newResponses);
                        }}
                        max={response.question?.marks}
                        min="0"
                        className="w-20 px-2 py-1 border border-gray-300 rounded text-center"
                      />
                      <span className="text-sm text-gray-500 ml-1">
                        / {response.question?.marks}
                      </span>
                    </div>

                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Feedback (Optional)
                      </label>
                      <input
                        type="text"
                        value={response.feedback || ""}
                        onChange={(e) => {
                          const newResponses = responses.map((r) =>
                            r.id === response.id
                              ? { ...r, feedback: e.target.value }
                              : r
                          );
                          setResponses(newResponses);
                        }}
                        className="w-full px-3 py-1 border border-gray-300 rounded"
                        placeholder="Add feedback for student..."
                      />
                    </div>

                    <button
                      onClick={() =>
                        handleEvaluateResponse(
                          response.id,
                          response.marks_obtained || 0,
                          response.feedback || ""
                        )
                      }
                      disabled={evaluating}
                      className="flex items-center space-x-1 px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm transition-colors disabled:opacity-50"
                    >
                      <FaCheck className="w-3 h-3" />
                      <span>Save</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={() => setShowResponseModal(false)}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
              >
                <FaTimes className="w-4 h-4" />
                <span>Close</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestEvaluation;
