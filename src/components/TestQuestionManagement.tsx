import React, { useState, useEffect, useCallback } from "react";
import {
  FaQuestionCircle,
  FaPlus,
  FaEdit,
  FaTrash,
  FaSearch,
  FaSpinner,
  FaSave,
  FaTimes,
  FaList,
  FaBook,
  FaClipboardList,
} from "react-icons/fa";
import { useSession } from "next-auth/react";
import axios from "axios";

interface Question {
  id: string;
  question_text: string;
  type: "multiple_choice" | "true_false" | "short_answer" | "essay";
  marks: number;
  options?: string[];
  correct_answer?: string;
  explanation?: string;
  test_id: string;
}

interface Test {
  id: string;
  title: string;
  description?: string;
  maxMarks: number;
  durationInMinutes: number;
  course_id: string;
  batch_id: string;
  isPublished: boolean;
}

interface Course {
  id: string;
  title: string;
  batch_id: string;
}

interface Batch {
  id: string;
  name: string;
}

interface QuestionFormData {
  question_text: string;
  type: "multiple_choice" | "true_false" | "short_answer" | "essay";
  marks: number;
  options: string[];
  correct_answer: string;
  explanation: string;
}

const TestQuestionManagement: React.FC = () => {
  const { data: session } = useSession();

  // State
  const [questions, setQuestions] = useState<Question[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBatch, setSelectedBatch] = useState<string>("");
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [selectedTest, setSelectedTest] = useState<string>("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [formData, setFormData] = useState<QuestionFormData>({
    question_text: "",
    type: "multiple_choice",
    marks: 1,
    options: ["", "", "", ""],
    correct_answer: "",
    explanation: "",
  });
  const [submitting, setSubmitting] = useState(false);
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
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL, backendJwt]);

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

  const fetchQuestions = async (
    batchId: string,
    courseId: string,
    testId: string
  ) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/instructor/batches/${batchId}/courses/${courseId}/tests/${testId}/questions`,
        {
          headers: { Authorization: `Bearer ${backendJwt}` },
        }
      );
      setQuestions(response.data.data?.questions || []);
    } catch (err) {
      console.error("Error fetching questions:", err);
    }
  };

  const handleBatchChange = (batchId: string) => {
    setSelectedBatch(batchId);
    setSelectedCourse("");
    setSelectedTest("");
    setCourses([]);
    setTests([]);
    setQuestions([]);
    if (batchId) {
      fetchCourses(batchId);
    }
  };

  const handleCourseChange = (courseId: string) => {
    setSelectedCourse(courseId);
    setSelectedTest("");
    setTests([]);
    setQuestions([]);
    if (selectedBatch && courseId) {
      fetchTests(selectedBatch, courseId);
    }
  };

  const handleTestChange = (testId: string) => {
    setSelectedTest(testId);
    setQuestions([]);
    if (selectedBatch && selectedCourse && testId) {
      fetchQuestions(selectedBatch, selectedCourse, testId);
    }
  };

  const handleCreateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBatch || !selectedCourse || !selectedTest) {
      alert("Please select a batch, course, and test first");
      return;
    }

    try {
      setSubmitting(true);
      const questionData = {
        ...formData,
        options:
          formData.type === "multiple_choice"
            ? formData.options.filter((opt) => opt.trim())
            : undefined,
      };

      const response = await axios.post(
        `${API_BASE_URL}/api/instructor/batches/${selectedBatch}/courses/${selectedCourse}/tests/${selectedTest}/questions`,
        questionData,
        {
          headers: { Authorization: `Bearer ${backendJwt}` },
        }
      );

      setQuestions((prev) => [...prev, response.data.data?.question]);
      resetForm();
      setShowCreateForm(false);
      alert("Question created successfully!");
    } catch (err) {
      console.error("Error creating question:", err);
      alert("Failed to create question");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !editingQuestion ||
      !selectedBatch ||
      !selectedCourse ||
      !selectedTest
    ) {
      return;
    }

    try {
      setSubmitting(true);
      const questionData = {
        ...formData,
        options:
          formData.type === "multiple_choice"
            ? formData.options.filter((opt) => opt.trim())
            : undefined,
      };

      const response = await axios.put(
        `${API_BASE_URL}/api/instructor/batches/${selectedBatch}/courses/${selectedCourse}/tests/${selectedTest}/questions/${editingQuestion.id}`,
        questionData,
        {
          headers: { Authorization: `Bearer ${backendJwt}` },
        }
      );

      setQuestions((prev) =>
        prev.map((q) =>
          q.id === editingQuestion.id
            ? { ...q, ...response.data.data?.question }
            : q
        )
      );
      setEditingQuestion(null);
      resetForm();
      alert("Question updated successfully!");
    } catch (err) {
      console.error("Error updating question:", err);
      alert("Failed to update question");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!window.confirm("Are you sure you want to delete this question?")) {
      return;
    }

    try {
      await axios.delete(
        `${API_BASE_URL}/api/instructor/batches/${selectedBatch}/courses/${selectedCourse}/tests/${selectedTest}/questions/${questionId}`,
        {
          headers: { Authorization: `Bearer ${backendJwt}` },
        }
      );

      setQuestions((prev) => prev.filter((q) => q.id !== questionId));
      alert("Question deleted successfully!");
    } catch (err) {
      console.error("Error deleting question:", err);
      alert("Failed to delete question");
    }
  };

  const handleEditQuestion = (question: Question) => {
    setEditingQuestion(question);
    setFormData({
      question_text: question.question_text,
      type: question.type,
      marks: question.marks,
      options: question.options || ["", "", "", ""],
      correct_answer: question.correct_answer || "",
      explanation: question.explanation || "",
    });
  };

  const resetForm = () => {
    setFormData({
      question_text: "",
      type: "multiple_choice",
      marks: 1,
      options: ["", "", "", ""],
      correct_answer: "",
      explanation: "",
    });
  };

  const handleCancel = () => {
    setShowCreateForm(false);
    setEditingQuestion(null);
    resetForm();
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    setFormData({ ...formData, options: newOptions });
  };

  const filteredQuestions = questions.filter((question) =>
    question.question_text.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderQuestionForm = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">
            {editingQuestion ? "Edit Question" : "Create New Question"}
          </h2>
          <button
            onClick={handleCancel}
            className="text-gray-500 hover:text-gray-700"
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>

        <form
          onSubmit={
            editingQuestion ? handleUpdateQuestion : handleCreateQuestion
          }
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Question Text *
            </label>
            <textarea
              value={formData.question_text}
              onChange={(e) =>
                setFormData({ ...formData, question_text: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Question Type *
              </label>
              <select
                value={formData.type}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    type: e.target.value as QuestionFormData["type"],
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="multiple_choice">Multiple Choice</option>
                <option value="true_false">True/False</option>
                <option value="short_answer">Short Answer</option>
                <option value="essay">Essay</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Marks *
              </label>
              <input
                type="number"
                value={formData.marks}
                onChange={(e) =>
                  setFormData({ ...formData, marks: parseInt(e.target.value) })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min="1"
                required
              />
            </div>
          </div>

          {formData.type === "multiple_choice" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Options *
              </label>
              <div className="space-y-2">
                {formData.options.map((option, index) => (
                  <input
                    key={index}
                    type="text"
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder={`Option ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Correct Answer *
            </label>
            {formData.type === "multiple_choice" ? (
              <select
                value={formData.correct_answer}
                onChange={(e) =>
                  setFormData({ ...formData, correct_answer: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select correct answer</option>
                {formData.options.map(
                  (option, index) =>
                    option.trim() && (
                      <option key={index} value={option}>
                        {option}
                      </option>
                    )
                )}
              </select>
            ) : formData.type === "true_false" ? (
              <select
                value={formData.correct_answer}
                onChange={(e) =>
                  setFormData({ ...formData, correct_answer: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select correct answer</option>
                <option value="true">True</option>
                <option value="false">False</option>
              </select>
            ) : (
              <textarea
                value={formData.correct_answer}
                onChange={(e) =>
                  setFormData({ ...formData, correct_answer: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={2}
                required
              />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Explanation (Optional)
            </label>
            <textarea
              value={formData.explanation}
              onChange={(e) =>
                setFormData({ ...formData, explanation: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={2}
              placeholder="Explain the correct answer..."
            />
          </div>

          <div className="flex items-center space-x-3 pt-4">
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              <FaSave className="w-4 h-4" />
              <span>
                {submitting
                  ? "Saving..."
                  : editingQuestion
                  ? "Update Question"
                  : "Create Question"}
              </span>
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
            >
              <FaTimes className="w-4 h-4" />
              <span>Cancel</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <FaSpinner className="animate-spin text-blue-600" />
          <span>Loading test questions...</span>
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
              Test Question Management
            </h1>
            <p className="text-gray-600">Create and manage test questions</p>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            disabled={!selectedTest}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaPlus className="w-4 h-4" />
            <span>Add Question</span>
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
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
                placeholder="Search questions..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Stats */}
        {selectedTest && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100">Total Questions</p>
                  <p className="text-2xl font-bold">{questions.length}</p>
                </div>
                <FaQuestionCircle className="w-8 h-8 text-blue-200" />
              </div>
            </div>
            <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100">Multiple Choice</p>
                  <p className="text-2xl font-bold">
                    {
                      questions.filter((q) => q.type === "multiple_choice")
                        .length
                    }
                  </p>
                </div>
                <FaList className="w-8 h-8 text-green-200" />
              </div>
            </div>
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100">True/False</p>
                  <p className="text-2xl font-bold">
                    {questions.filter((q) => q.type === "true_false").length}
                  </p>
                </div>
                <FaClipboardList className="w-8 h-8 text-purple-200" />
              </div>
            </div>
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100">Total Marks</p>
                  <p className="text-2xl font-bold">
                    {questions.reduce((sum, q) => sum + q.marks, 0)}
                  </p>
                </div>
                <FaBook className="w-8 h-8 text-orange-200" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Questions List */}
      {selectedTest ? (
        <div className="space-y-4">
          {filteredQuestions.map((question, index) => (
            <div
              key={question.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded">
                      Q{index + 1}
                    </span>
                    <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2 py-1 rounded">
                      {question.type.replace("_", " ").toUpperCase()}
                    </span>
                    <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded">
                      {question.marks} marks
                    </span>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {question.question_text}
                  </h3>

                  {question.type === "multiple_choice" && question.options && (
                    <div className="space-y-1 mb-3">
                      {question.options.map((option, optIndex) => (
                        <div
                          key={optIndex}
                          className={`p-2 rounded ${
                            option === question.correct_answer
                              ? "bg-green-50 border border-green-200"
                              : "bg-gray-50"
                          }`}
                        >
                          <span className="text-sm">
                            {String.fromCharCode(65 + optIndex)}. {option}
                            {option === question.correct_answer && (
                              <span className="text-green-600 ml-2">✓</span>
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {question.type !== "multiple_choice" && (
                    <div className="bg-green-50 border border-green-200 p-2 rounded mb-3">
                      <span className="text-sm font-medium text-green-800">
                        Correct Answer: {question.correct_answer}
                      </span>
                    </div>
                  )}

                  {question.explanation && (
                    <div className="bg-blue-50 border border-blue-200 p-2 rounded">
                      <span className="text-sm text-blue-800">
                        <strong>Explanation:</strong> {question.explanation}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => handleEditQuestion(question)}
                    className="flex items-center space-x-1 px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded text-sm transition-colors"
                  >
                    <FaEdit className="w-3 h-3" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => handleDeleteQuestion(question.id)}
                    className="flex items-center space-x-1 px-3 py-1 bg-red-100 hover:bg-red-200 text-red-800 rounded text-sm transition-colors"
                  >
                    <FaTrash className="w-3 h-3" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))}

          {filteredQuestions.length === 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <FaQuestionCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Questions Found
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm
                  ? "No questions match your search."
                  : "Start by adding your first question to this test."}
              </p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors mx-auto"
              >
                <FaPlus className="w-4 h-4" />
                <span>Add Question</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <FaClipboardList className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Select a Test
          </h3>
          <p className="text-gray-600">
            Please select a batch, course, and test to view and manage
            questions.
          </p>
        </div>
      )}

      {/* Create/Edit Form Modal */}
      {(showCreateForm || editingQuestion) && renderQuestionForm()}
    </div>
  );
};

export default TestQuestionManagement;
