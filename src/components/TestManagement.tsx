"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import axios from "axios";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaClipboard,
  FaClock,
  FaUsers,
  FaChartBar,
  FaQuestion,
  FaPlayCircle,
  FaCheck,
  FaSpinner,
} from "react-icons/fa";
import {
  Test,
  Question,
  CreateTestRequest,
  CreateQuestionRequest,
} from "../api/instructorApi";
import { useTestStore } from "../store/testStore";

interface Batch {
  id: string;
  name: string;
}

interface Course {
  id: string;
  title: string;
}

// TestManagement component doesn't require any props
type TestManagementProps = Record<string, never>;

const TestManagement: React.FC<TestManagementProps> = () => {
  const { data: session } = useSession();
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [activeTab, setActiveTab] = useState<
    "list" | "create" | "questions" | "analytics"
  >("list");

  // Add batch management state
  const [batches, setBatches] = useState<Batch[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<string>("");
  const [backendJwt, setBackendJwt] = useState<string>("");
  const [batchLoading, setBatchLoading] = useState(false);

  const {
    tests,
    selectedTest,
    questions,
    isLoading: loading,
    error,
    fetchTestsByCourse,
    createTest,
    setSelectedTest,
    fetchQuestions: fetchQuestionsFromStore,
    addQuestion,
    publishTest: publishTestInStore,
    deleteTest: deleteTestFromStore,
    setError,
    clearError,
  } = useTestStore();

  // API helper
  const apiCall = useCallback(
    async (endpoint: string, options: RequestInit = {}) => {
      const baseUrl =
        process.env.NEXT_PUBLIC_BACKEND_BASE_URL || "http://localhost:3000";
      const response = await fetch(`${baseUrl}${endpoint}`, {
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
    [backendJwt]
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
  }, [session, setError]);

  const fetchCoursesForBatch = useCallback(
    async (batchId: string) => {
      try {
        const response = await apiCall(
          `/api/instructor/batches/${batchId}/courses`
        );
        const responseData = response.courses || response || [];
        const courseList = Array.isArray(responseData) ? responseData : [];
        setCourses(courseList);
      } catch (err) {
        console.error("Error fetching courses for batch:", err);
        setError("Failed to load courses for the selected batch");
      }
    },
    [apiCall, setError]
  );

  const fetchBatches = useCallback(async () => {
    try {
      setBatchLoading(true);
      const response = await apiCall("/api/instructor/batches");
      const batchList = response.batches || [];
      setBatches(batchList);
      if (batchList.length > 0) {
        setSelectedBatch(batchList[0].id);
        await fetchCoursesForBatch(batchList[0].id);
      }
    } catch (err) {
      console.error("Error fetching batches:", err);
      setError("Failed to load batches");
    } finally {
      setBatchLoading(false);
    }
  }, [apiCall, setError, fetchCoursesForBatch]);

  // Fetch batches when JWT is available
  useEffect(() => {
    if (backendJwt) {
      fetchBatches();
    }
  }, [backendJwt, fetchBatches]);

  const handleBatchChange = (batchId: string) => {
    setSelectedBatch(batchId);
    setCourses([]);
    if (batchId) {
      fetchCoursesForBatch(batchId);
    }
  };

  const fetchTests = useCallback(async () => {
    if (!selectedBatch || courses.length === 0) {
      console.log("No batch selected or no courses available");
      return;
    }

    clearError();
    try {
      // Fetch tests for all courses in the selected batch
      for (const course of courses) {
        try {
          await fetchTestsByCourse(course.id.toString(), selectedBatch);
        } catch (err) {
          console.warn(`Failed to fetch tests for course ${course.id}:`, err);
          // Don't break the loop for individual course failures
        }
      }
    } catch (err) {
      console.error("Error fetching tests:", err);
      // Only set error for critical failures
      if (err instanceof Error && !err.message.includes("404")) {
        setError("Failed to fetch tests");
      }
    }
  }, [selectedBatch, courses, clearError, fetchTestsByCourse, setError]);

  useEffect(() => {
    if (selectedBatch && courses.length > 0) {
      fetchTests();
    }
  }, [selectedBatch, courses, fetchTests]);

  const fetchQuestions = async (testId: string, courseId: string) => {
    try {
      await fetchQuestionsFromStore(courseId, testId, selectedBatch);
    } catch (err) {
      console.error("Error fetching questions:", err);
    }
  };

  const handleCreateTest = async (
    testData: CreateTestRequest & { courseId: string }
  ) => {
    clearError();
    try {
      const { courseId, ...testPayload } = testData;
      await createTest(courseId, testPayload, selectedBatch);
      setActiveTab("list");
    } catch {
      // Error is already set in the store
    }
  };

  const handleAddQuestion = async (questionData: CreateQuestionRequest) => {
    if (!selectedTest) return;

    clearError();
    try {
      await addQuestion(selectedTest.id, questionData);
      await fetchQuestions(selectedTest.id, selectedTest.course.id);
      setShowQuestionForm(false);
      setEditingQuestion(null);
    } catch {
      // Error is already set in the store
    }
  };

  const handlePublishTest = async (test: Test) => {
    clearError();
    try {
      await publishTestInStore(test.id, test.course.id, selectedBatch);
    } catch {
      // Error is already set in the store
    }
  };

  const handleDeleteTest = async (test: Test) => {
    if (!confirm(`Are you sure you want to delete &quot;${test.title}&quot;?`))
      return;

    clearError();
    try {
      await deleteTestFromStore(test.course.id, test.id, selectedBatch);
    } catch {
      // Error is already set in the store
    }
  };

  const TestCard: React.FC<{ test: Test }> = ({ test }) => (
    <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-semibold text-slate-800">{test.title}</h3>
          <p className="text-slate-600 text-sm">{test.course.title}</p>
        </div>
        <div
          className={`px-3 py-1 rounded-full text-xs font-medium ${
            test.status === "PUBLISHED"
              ? "bg-green-100 text-green-700"
              : test.status === "DRAFT"
              ? "bg-yellow-100 text-yellow-700"
              : "bg-blue-100 text-blue-700"
          }`}
        >
          {test.status}
        </div>
      </div>

      <p className="text-slate-600 mb-4">{test.description}</p>

      <div className="flex items-center gap-4 mb-4 text-sm text-slate-500">
        <div className="flex items-center gap-1">
          <FaClock className="w-4 h-4" />
          {test.durationInMinutes} min
        </div>
        <div className="flex items-center gap-1">
          <FaClipboard className="w-4 h-4" />
          {test.maxMarks} marks
        </div>
        <div className="flex items-center gap-1">
          <FaQuestion className="w-4 h-4" />
          {test.questions?.length || 0} questions
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => {
            setSelectedTest(test);
            fetchQuestions(test.id, test.course.id);
            setActiveTab("questions");
          }}
          className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
        >
          <FaEdit className="w-4 h-4" />
          Manage
        </button>

        {test.status === "DRAFT" && (
          <button
            onClick={() => handlePublishTest(test)}
            className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
          >
            <FaPlayCircle className="w-4 h-4" />
            Publish
          </button>
        )}

        <button
          onClick={() => {
            setSelectedTest(test);
            setActiveTab("analytics");
          }}
          className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
        >
          <FaChartBar className="w-4 h-4" />
          Analytics
        </button>

        {test.status === "DRAFT" && (
          <button
            onClick={() => handleDeleteTest(test)}
            className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
          >
            <FaTrash className="w-4 h-4" />
            Delete
          </button>
        )}
      </div>
    </div>
  );

  const CreateTestForm: React.FC = () => {
    const [formData, setFormData] = useState<
      CreateTestRequest & { courseId: string }
    >({
      title: "",
      description: "",
      maxMarks: 100,
      passingMarks: 60,
      durationInMinutes: 60,
      startDate: "",
      endDate: "",
      courseId: "",
      shuffleQuestions: false,
      showResults: true,
      showCorrectAnswers: false,
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      handleCreateTest(formData);
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Test Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Course *
            </label>
            <select
              value={formData.courseId}
              onChange={(e) =>
                setFormData({ ...formData, courseId: e.target.value })
              }
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Select a course</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            rows={3}
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Max Marks *
            </label>
            <input
              type="number"
              value={formData.maxMarks}
              onChange={(e) =>
                setFormData({ ...formData, maxMarks: parseInt(e.target.value) })
              }
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="1"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Passing Marks *
            </label>
            <input
              type="number"
              value={formData.passingMarks}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  passingMarks: parseInt(e.target.value),
                })
              }
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="0"
              max={formData.maxMarks}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Duration (minutes) *
            </label>
            <input
              type="number"
              value={formData.durationInMinutes}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  durationInMinutes: parseInt(e.target.value),
                })
              }
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="1"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Start Date *
            </label>
            <input
              type="datetime-local"
              value={formData.startDate}
              onChange={(e) =>
                setFormData({ ...formData, startDate: e.target.value })
              }
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              End Date *
            </label>
            <input
              type="datetime-local"
              value={formData.endDate}
              onChange={(e) =>
                setFormData({ ...formData, endDate: e.target.value })
              }
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
        </div>

        <div className="space-y-4">
          <label className="block text-sm font-medium text-slate-700">
            Test Settings
          </label>
          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.shuffleQuestions}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    shuffleQuestions: e.target.checked,
                  })
                }
                className="mr-3 h-4 w-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-slate-700">Shuffle Questions</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.showResults}
                onChange={(e) =>
                  setFormData({ ...formData, showResults: e.target.checked })
                }
                className="mr-3 h-4 w-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-slate-700">
                Show Results to Students
              </span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.showCorrectAnswers}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    showCorrectAnswers: e.target.checked,
                  })
                }
                className="mr-3 h-4 w-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-slate-700">
                Show Correct Answers
              </span>
            </label>
          </div>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? (
              <FaSpinner className="w-4 h-4 animate-spin" />
            ) : (
              <FaPlus className="w-4 h-4" />
            )}
            Create Test
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("list")}
            className="px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    );
  };

  const QuestionForm: React.FC = () => {
    const [questionData, setQuestionData] = useState<CreateQuestionRequest>({
      question_text: "",
      type: "MCQ",
      marks: 1,
      options: [
        { text: "", correct: false },
        { text: "", correct: false },
      ],
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      handleAddQuestion(questionData);
    };

    const addOption = () => {
      setQuestionData({
        ...questionData,
        options: [
          ...(questionData.options || []),
          { text: "", correct: false },
        ],
      });
    };

    const removeOption = (index: number) => {
      const newOptions =
        questionData.options?.filter((_, i) => i !== index) || [];
      setQuestionData({ ...questionData, options: newOptions });
    };

    const updateOption = (
      index: number,
      field: "text" | "correct",
      value: string | boolean
    ) => {
      const newOptions = [...(questionData.options || [])];
      newOptions[index] = { ...newOptions[index], [field]: value };
      setQuestionData({ ...questionData, options: newOptions });
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Question Text *
          </label>
          <textarea
            value={questionData.question_text}
            onChange={(e) =>
              setQuestionData({
                ...questionData,
                question_text: e.target.value,
              })
            }
            rows={3}
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Question Type *
            </label>
            <select
              value={questionData.type}
              onChange={(e) =>
                setQuestionData({
                  ...questionData,
                  type: e.target.value as "MCQ" | "DESCRIPTIVE" | "CODE",
                  options:
                    e.target.value === "MCQ" ? questionData.options : undefined,
                })
              }
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="MCQ">Multiple Choice</option>
              <option value="DESCRIPTIVE">Descriptive</option>
              <option value="CODE">Code</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Marks *
            </label>
            <input
              type="number"
              value={questionData.marks}
              onChange={(e) =>
                setQuestionData({
                  ...questionData,
                  marks: parseInt(e.target.value),
                })
              }
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="1"
              required
            />
          </div>
        </div>

        {questionData.type === "DESCRIPTIVE" && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Expected Word Count
            </label>
            <input
              type="number"
              value={questionData.expectedWordCount || ""}
              onChange={(e) =>
                setQuestionData({
                  ...questionData,
                  expectedWordCount: e.target.value
                    ? parseInt(e.target.value)
                    : undefined,
                })
              }
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="1"
            />
          </div>
        )}

        {questionData.type === "CODE" && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Programming Language
            </label>
            <input
              type="text"
              value={questionData.codeLanguage || ""}
              onChange={(e) =>
                setQuestionData({
                  ...questionData,
                  codeLanguage: e.target.value,
                })
              }
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., JavaScript, Python, Java"
            />
          </div>
        )}

        {questionData.type === "MCQ" && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Answer Options *
            </label>
            <div className="space-y-3">
              {questionData.options?.map((option, index) => (
                <div key={index} className="flex items-center gap-3">
                  <input
                    type="text"
                    value={option.text}
                    onChange={(e) =>
                      updateOption(index, "text", e.target.value)
                    }
                    className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={`Option ${index + 1}`}
                    required
                  />
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={option.correct}
                      onChange={(e) =>
                        updateOption(index, "correct", e.target.checked)
                      }
                      className="mr-2 h-4 w-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-slate-700">Correct</span>
                  </label>
                  {questionData.options && questionData.options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeOption(index)}
                      className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <FaTrash className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}

              <button
                type="button"
                onClick={addOption}
                className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <FaPlus className="w-4 h-4" />
                Add Option
              </button>
            </div>
          </div>
        )}

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? (
              <FaSpinner className="w-4 h-4 animate-spin" />
            ) : (
              <FaPlus className="w-4 h-4" />
            )}
            {editingQuestion ? "Update Question" : "Add Question"}
          </button>

          <button
            type="button"
            onClick={() => {
              setShowQuestionForm(false);
              setEditingQuestion(null);
            }}
            className="px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    );
  };

  const QuestionsList: React.FC = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-slate-800">
          Questions for &quot;{selectedTest?.title}&quot;
        </h3>
        <button
          onClick={() => setShowQuestionForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <FaPlus className="w-4 h-4" />
          Add Question
        </button>
      </div>

      {questions.length === 0 ? (
        <div className="text-center py-8 text-slate-500">
          No questions added yet. Click &quot;Add Question&quot; to get started.
        </div>
      ) : (
        <div className="space-y-4">
          {questions.map((question, index) => (
            <div
              key={question.id}
              className="bg-white p-6 rounded-xl border border-slate-200"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                    Q{index + 1}
                  </span>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      question.type === "MCQ"
                        ? "bg-green-100 text-green-700"
                        : question.type === "DESCRIPTIVE"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-purple-100 text-purple-700"
                    }`}
                  >
                    {question.type}
                  </span>
                  <span className="text-sm text-slate-500">
                    {question.marks} marks
                  </span>
                </div>
              </div>

              <p className="text-slate-800 mb-3">{question.question_text}</p>

              {question.type === "MCQ" && question.options && (
                <div className="space-y-2">
                  {question.options.map((option, optIndex) => (
                    <div
                      key={option.id}
                      className={`flex items-center gap-2 p-2 rounded ${
                        option.correct
                          ? "bg-green-50 border border-green-200"
                          : "bg-slate-50"
                      }`}
                    >
                      <span className="w-6 h-6 bg-slate-200 rounded-full flex items-center justify-center text-xs font-medium">
                        {String.fromCharCode(65 + optIndex)}
                      </span>
                      <span
                        className={
                          option.correct
                            ? "text-green-700 font-medium"
                            : "text-slate-700"
                        }
                      >
                        {option.text}
                      </span>
                      {option.correct && (
                        <FaCheck className="w-4 h-4 text-green-600 ml-auto" />
                      )}
                    </div>
                  ))}
                </div>
              )}

              {question.expectedWordCount && (
                <p className="text-sm text-slate-500 mt-2">
                  Expected word count: {question.expectedWordCount}
                </p>
              )}

              {question.codeLanguage && (
                <p className="text-sm text-slate-500 mt-2">
                  Language: {question.codeLanguage}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Test Management</h1>
          <p className="text-slate-600 mt-2">
            Create, manage, and analyze tests for your courses
          </p>
        </div>

        {activeTab === "list" && (
          <button
            onClick={() => setActiveTab("create")}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FaPlus className="w-5 h-5" />
            Create New Test
          </button>
        )}
      </div>

      {/* Batch Selection */}
      <div className="mb-6 bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center gap-4">
          <div className="min-w-0 flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Batch
            </label>
            <select
              value={selectedBatch}
              onChange={(e) => handleBatchChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={batchLoading}
            >
              <option value="">Select a batch</option>
              {batches.map((batch) => (
                <option key={batch.id} value={batch.id}>
                  {batch.name}
                </option>
              ))}
            </select>
          </div>
          {batchLoading && (
            <div className="flex items-center">
              <FaSpinner className="animate-spin w-5 h-5 text-blue-600" />
            </div>
          )}
        </div>
        {selectedBatch && courses.length > 0 && (
          <div className="mt-3 text-sm text-gray-600">
            Found {courses.length} course{courses.length !== 1 ? "s" : ""} in
            this batch
          </div>
        )}
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {!selectedBatch ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <FaUsers className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Batch Selected
          </h3>
          <p className="text-gray-600">
            Please select a batch to view and manage tests.
          </p>
        </div>
      ) : courses.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <FaQuestion className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Courses Found
          </h3>
          <p className="text-gray-600">
            This batch doesn&apos;t have any courses yet.
          </p>
        </div>
      ) : (
        <>
          {/* Navigation Tabs */}
          <div className="flex gap-1 mb-8 bg-slate-100 p-1 rounded-lg w-fit">
            <button
              onClick={() => setActiveTab("list")}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                activeTab === "list"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-slate-600 hover:text-slate-800"
              }`}
            >
              All Tests
            </button>
            <button
              onClick={() => setActiveTab("create")}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                activeTab === "create"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-slate-600 hover:text-slate-800"
              }`}
            >
              Create Test
            </button>
            {selectedTest && (
              <button
                onClick={() => setActiveTab("questions")}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  activeTab === "questions"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-slate-600 hover:text-slate-800"
                }`}
              >
                Questions
              </button>
            )}
            {selectedTest && (
              <button
                onClick={() => setActiveTab("analytics")}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  activeTab === "analytics"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-slate-600 hover:text-slate-800"
                }`}
              >
                Analytics
              </button>
            )}
          </div>

          {/* Content based on active tab */}
          {activeTab === "list" && (
            <div>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <FaSpinner className="w-8 h-8 text-blue-600 animate-spin" />
                </div>
              ) : tests.length === 0 ? (
                <div className="text-center py-12">
                  <FaClipboard className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-slate-800 mb-2">
                    No Tests Created Yet
                  </h3>
                  <p className="text-slate-600 mb-6">
                    Create your first test to get started
                  </p>
                  <button
                    onClick={() => setActiveTab("create")}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mx-auto"
                  >
                    <FaPlus className="w-5 h-5" />
                    Create First Test
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {tests.map((test) => (
                    <TestCard key={test.id} test={test} />
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "create" && (
            <div className="bg-white p-8 rounded-xl shadow-md border border-slate-200">
              <h2 className="text-2xl font-semibold text-slate-800 mb-6">
                Create New Test
              </h2>
              <CreateTestForm />
            </div>
          )}

          {activeTab === "questions" && selectedTest && (
            <div className="bg-white p-8 rounded-xl shadow-md border border-slate-200">
              {showQuestionForm ? (
                <div>
                  <h2 className="text-2xl font-semibold text-slate-800 mb-6">
                    Add New Question
                  </h2>
                  <QuestionForm />
                </div>
              ) : (
                <QuestionsList />
              )}
            </div>
          )}

          {activeTab === "analytics" && selectedTest && (
            <div className="bg-white p-8 rounded-xl shadow-md border border-slate-200">
              <h2 className="text-2xl font-semibold text-slate-800 mb-6">
                Test Analytics
              </h2>
              <div className="text-center py-8 text-slate-500">
                Analytics feature will be implemented in the TestAnalytics
                component
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TestManagement;
