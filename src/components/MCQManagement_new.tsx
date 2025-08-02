import React, { useState, useEffect, useCallback } from "react";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaSpinner,
  FaChevronDown,
  FaChevronUp,
  FaSave,
  FaUndo,
  FaQuestionCircle,
  FaCheck,
  FaTimes,
} from "react-icons/fa";
import { useSession } from "next-auth/react";
import axios from "axios";

// Types based on backend structure
interface MCQQuestion {
  id: string;
  question: {
    ops: Array<{
      insert: string;
      attributes?: object;
    }>;
  };
  options: Array<{
    id: string;
    text: {
      ops: Array<{
        insert: string;
        attributes?: object;
      }>;
    };
  }>;
  correctAnswer: string;
  explanation?: {
    ops: Array<{
      insert: string;
      attributes?: object;
    }>;
  };
}

interface MCQSet {
  id: string;
  questions: MCQQuestion[];
  passingScore: number;
  module: {
    id: string;
    title: string;
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

interface Module {
  id: string;
  title: string;
  order: number;
  isLocked: boolean;
}

const MCQManagement: React.FC = () => {
  const { data: session } = useSession();

  // State
  const [batches, setBatches] = useState<Batch[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [mcqSet, setMcqSet] = useState<MCQSet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [selectedBatch, setSelectedBatch] = useState<string>("");
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [selectedModule, setSelectedModule] = useState<string>("");
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(
    new Set(),
  );
  const [backendJwt, setBackendJwt] = useState<string>("");

  // Form state for creating/editing MCQ
  const [mcqForm, setMcqForm] = useState({
    questions: [] as MCQQuestion[],
    passingScore: 70,
  });

  // Form state for individual question
  const [questionForm, setQuestionForm] = useState({
    question: "",
    options: ["", "", "", ""],
    correctAnswer: 0,
    explanation: "",
  });

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
          },
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
        },
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
        },
      );
      setCourses(response.data.courses || []);
    } catch (err) {
      console.error("Error fetching courses:", err);
    }
  };

  const fetchModules = async (batchId: string, courseId: string) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/instructor/batches/${batchId}/courses/${courseId}/modules`,
        {
          headers: { Authorization: `Bearer ${backendJwt}` },
        },
      );
      setModules(response.data.modules || []);
    } catch (err) {
      console.error("Error fetching modules:", err);
    }
  };

  const fetchMCQ = async (
    batchId: string,
    courseId: string,
    moduleId: string,
  ) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/instructor/batches/${batchId}/courses/${courseId}/modules/${moduleId}/mcq`,
        {
          headers: { Authorization: `Bearer ${backendJwt}` },
        },
      );
      setMcqSet(response.data || null);
    } catch (err) {
      console.error("Error fetching MCQ:", err);
      setMcqSet(null);
    }
  };

  const handleBatchChange = (batchId: string) => {
    setSelectedBatch(batchId);
    setSelectedCourse("");
    setSelectedModule("");
    setCourses([]);
    setModules([]);
    setMcqSet(null);
    if (batchId) {
      fetchCourses(batchId);
    }
  };

  const handleCourseChange = (courseId: string) => {
    setSelectedCourse(courseId);
    setSelectedModule("");
    setModules([]);
    setMcqSet(null);
    if (selectedBatch && courseId) {
      fetchModules(selectedBatch, courseId);
    }
  };

  const handleModuleChange = (moduleId: string) => {
    setSelectedModule(moduleId);
    if (selectedBatch && selectedCourse && moduleId) {
      fetchMCQ(selectedBatch, selectedCourse, moduleId);
    }
  };

  // Helper function to convert plain text to Quill Delta format
  const textToQuillDelta = (text: string) => ({
    ops: [{ insert: text }],
  });

  // Helper function to convert Quill Delta to plain text
  const quillDeltaToText = (delta: {
    ops?: Array<{ insert?: string }>;
  }): string => {
    if (!delta || !delta.ops) return "";
    return delta.ops.map((op) => op.insert || "").join("");
  };

  const addQuestion = () => {
    if (!questionForm.question.trim()) {
      alert("Question text is required");
      return;
    }

    const filledOptions = questionForm.options.filter(
      (opt) => opt.trim() !== "",
    );
    if (filledOptions.length < 2) {
      alert("At least 2 options are required");
      return;
    }

    const timestamp = Date.now();
    const newQuestion = {
      id: timestamp.toString(),
      question: textToQuillDelta(questionForm.question),
      options: filledOptions.map((text, index) => ({
        id: `opt_${timestamp}_${index}`,
        text: textToQuillDelta(text),
      })),
      correctAnswer: `opt_${timestamp}_${questionForm.correctAnswer}`,
      explanation: questionForm.explanation
        ? textToQuillDelta(questionForm.explanation)
        : undefined,
    };

    setMcqForm((prev) => ({
      ...prev,
      questions: [...prev.questions, newQuestion],
    }));

    // Reset form
    setQuestionForm({
      question: "",
      options: ["", "", "", ""],
      correctAnswer: 0,
      explanation: "",
    });
  };

  const removeQuestion = (questionId: string) => {
    setMcqForm((prev) => ({
      ...prev,
      questions: prev.questions.filter((q) => q.id !== questionId),
    }));
  };

  const createMCQ = async () => {
    if (mcqForm.questions.length === 0) {
      alert("At least one question is required");
      return;
    }

    try {
      setSubmitting(true);
      const response = await axios.post(
        `${API_BASE_URL}/api/instructor/batches/${selectedBatch}/courses/${selectedCourse}/modules/${selectedModule}/mcq`,
        {
          questions: mcqForm.questions,
          passingScore: mcqForm.passingScore,
        },
        {
          headers: { Authorization: `Bearer ${backendJwt}` },
        },
      );

      setMcqSet(response.data);
      setIsCreating(false);
      setMcqForm({ questions: [], passingScore: 70 });
      alert("MCQ created successfully!");
    } catch (err) {
      console.error("Error creating MCQ:", err);
      alert("Failed to create MCQ");
    } finally {
      setSubmitting(false);
    }
  };

  const updateMCQ = async () => {
    if (!mcqSet) return;

    try {
      setSubmitting(true);
      const response = await axios.put(
        `${API_BASE_URL}/api/instructor/batches/${selectedBatch}/courses/${selectedCourse}/modules/${selectedModule}/mcq/${mcqSet.id}`,
        {
          questions: mcqForm.questions,
          passingScore: mcqForm.passingScore,
        },
        {
          headers: { Authorization: `Bearer ${backendJwt}` },
        },
      );

      setMcqSet(response.data);
      setIsEditing(false);
      alert("MCQ updated successfully!");
    } catch (err) {
      console.error("Error updating MCQ:", err);
      alert("Failed to update MCQ");
    } finally {
      setSubmitting(false);
    }
  };

  const deleteMCQ = async () => {
    if (!mcqSet || !confirm("Are you sure you want to delete this MCQ?"))
      return;

    try {
      await axios.delete(
        `${API_BASE_URL}/api/instructor/batches/${selectedBatch}/courses/${selectedCourse}/modules/${selectedModule}/mcq/${mcqSet.id}`,
        {
          headers: { Authorization: `Bearer ${backendJwt}` },
        },
      );

      setMcqSet(null);
      alert("MCQ deleted successfully!");
    } catch (err) {
      console.error("Error deleting MCQ:", err);
      alert("Failed to delete MCQ");
    }
  };

  const startEdit = () => {
    if (mcqSet) {
      setMcqForm({
        questions: mcqSet.questions || [],
        passingScore: mcqSet.passingScore || 70,
      });
      setIsEditing(true);
    }
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setMcqForm({ questions: [], passingScore: 70 });
  };

  const toggleQuestionExpansion = (questionId: string) => {
    const newExpanded = new Set(expandedQuestions);
    if (newExpanded.has(questionId)) {
      newExpanded.delete(questionId);
    } else {
      newExpanded.add(questionId);
    }
    setExpandedQuestions(newExpanded);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <FaSpinner className="animate-spin text-blue-600" />
          <span>Loading MCQ management...</span>
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
            <h1 className="text-2xl font-bold text-gray-900">MCQ Management</h1>
            <p className="text-gray-600">
              Manage multiple choice questions for modules
            </p>
          </div>
          {mcqSet && !isCreating && !isEditing && (
            <div className="flex items-center space-x-3">
              <button
                onClick={startEdit}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <FaEdit className="w-4 h-4" />
                <span>Edit MCQ</span>
              </button>
              <button
                onClick={deleteMCQ}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                <FaTrash className="w-4 h-4" />
                <span>Delete MCQ</span>
              </button>
            </div>
          )}
        </div>

        {/* Selection Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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
              Module
            </label>
            <select
              value={selectedModule}
              onChange={(e) => handleModuleChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={!selectedCourse}
            >
              <option value="">Select Module</option>
              {modules.map((module) => (
                <option key={module.id} value={module.id}>
                  {module.title}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Content based on selection and state */}
      {!selectedModule ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="text-center">
            <FaQuestionCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Select Module
            </h3>
            <p className="text-gray-600">
              Please select a batch, course, and module to manage MCQs.
            </p>
          </div>
        </div>
      ) : !mcqSet && !isCreating ? (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="text-center">
            <FaQuestionCircle className="w-16 h-16 text-blue-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No MCQ Found
            </h3>
            <p className="text-gray-600 mb-4">
              No MCQ exists for this module yet.
            </p>
            <button
              onClick={() => setIsCreating(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors mx-auto"
            >
              <FaPlus className="w-4 h-4" />
              <span>Create MCQ</span>
            </button>
          </div>
        </div>
      ) : isCreating || isEditing ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              {isCreating ? "Create MCQ" : "Edit MCQ"}
            </h2>
            <div className="flex items-center space-x-3">
              <button
                onClick={isCreating ? createMCQ : updateMCQ}
                disabled={submitting}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {submitting ? (
                  <FaSpinner className="w-4 h-4 animate-spin" />
                ) : (
                  <FaSave className="w-4 h-4" />
                )}
                <span>{isCreating ? "Create" : "Update"}</span>
              </button>
              <button
                onClick={isCreating ? () => setIsCreating(false) : cancelEdit}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                <FaUndo className="w-4 h-4" />
                <span>Cancel</span>
              </button>
            </div>
          </div>

          {/* Passing Score */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Passing Score (%)
            </label>
            <input
              type="number"
              value={mcqForm.passingScore}
              onChange={(e) =>
                setMcqForm((prev) => ({
                  ...prev,
                  passingScore: parseInt(e.target.value) || 70,
                }))
              }
              min="0"
              max="100"
              className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Add Question Form */}
          <div className="border border-gray-200 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Add Question
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Question
                </label>
                <textarea
                  value={questionForm.question}
                  onChange={(e) =>
                    setQuestionForm((prev) => ({
                      ...prev,
                      question: e.target.value,
                    }))
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your question..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Options
                </label>
                {questionForm.options.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2 mb-2">
                    <input
                      type="radio"
                      name="correctAnswer"
                      checked={questionForm.correctAnswer === index}
                      onChange={() =>
                        setQuestionForm((prev) => ({
                          ...prev,
                          correctAnswer: index,
                        }))
                      }
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => {
                        const newOptions = [...questionForm.options];
                        newOptions[index] = e.target.value;
                        setQuestionForm((prev) => ({
                          ...prev,
                          options: newOptions,
                        }));
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder={`Option ${index + 1}`}
                    />
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Explanation (Optional)
                </label>
                <textarea
                  value={questionForm.explanation}
                  onChange={(e) =>
                    setQuestionForm((prev) => ({
                      ...prev,
                      explanation: e.target.value,
                    }))
                  }
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Explain the correct answer..."
                />
              </div>

              <button
                onClick={addQuestion}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <FaPlus className="w-4 h-4" />
                <span>Add Question</span>
              </button>
            </div>
          </div>

          {/* Questions List */}
          {mcqForm.questions.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Questions ({mcqForm.questions.length})
              </h3>
              <div className="space-y-4">
                {mcqForm.questions.map((question, index) => (
                  <div
                    key={question.id}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">
                        Question {index + 1}
                      </h4>
                      <button
                        onClick={() => removeQuestion(question.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <FaTrash className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-gray-700 mb-2">
                      {quillDeltaToText(question.question)}
                    </p>
                    <div className="space-y-1">
                      {question.options.map((option) => (
                        <div
                          key={option.id}
                          className="flex items-center space-x-2"
                        >
                          {question.correctAnswer === option.id ? (
                            <FaCheck className="w-4 h-4 text-green-600" />
                          ) : (
                            <FaTimes className="w-4 h-4 text-gray-400" />
                          )}
                          <span
                            className={
                              question.correctAnswer === option.id
                                ? "text-green-700 font-medium"
                                : "text-gray-600"
                            }
                          >
                            {quillDeltaToText(option.text)}
                          </span>
                        </div>
                      ))}
                    </div>
                    {question.explanation && (
                      <div className="mt-2 p-2 bg-blue-50 rounded">
                        <span className="text-sm text-blue-800">
                          <strong>Explanation:</strong>{" "}
                          {quillDeltaToText(question.explanation)}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        mcqSet && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  MCQ Details
                </h2>
                <p className="text-gray-600">
                  Passing Score: {mcqSet.passingScore}%
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">
                  {mcqSet.questions?.length || 0} Questions
                </span>
              </div>
            </div>

            {/* Questions Display */}
            {mcqSet.questions && mcqSet.questions.length > 0 ? (
              <div className="space-y-4">
                {mcqSet.questions.map((question, index) => (
                  <div
                    key={question.id}
                    className="border border-gray-200 rounded-lg"
                  >
                    <div
                      className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
                      onClick={() => toggleQuestionExpansion(question.id)}
                    >
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">
                          Question {index + 1}
                        </h4>
                        <p className="text-gray-600 line-clamp-2">
                          {quillDeltaToText(question.question)}
                        </p>
                      </div>
                      {expandedQuestions.has(question.id) ? (
                        <FaChevronUp className="w-4 h-4 text-gray-400" />
                      ) : (
                        <FaChevronDown className="w-4 h-4 text-gray-400" />
                      )}
                    </div>

                    {expandedQuestions.has(question.id) && (
                      <div className="px-4 pb-4 border-t border-gray-200">
                        <div className="mt-4">
                          <p className="text-gray-800 font-medium mb-3">
                            {quillDeltaToText(question.question)}
                          </p>
                          <div className="space-y-2">
                            {question.options.map((option) => (
                              <div
                                key={option.id}
                                className="flex items-center space-x-2"
                              >
                                {question.correctAnswer === option.id ? (
                                  <FaCheck className="w-4 h-4 text-green-600" />
                                ) : (
                                  <FaTimes className="w-4 h-4 text-gray-400" />
                                )}
                                <span
                                  className={
                                    question.correctAnswer === option.id
                                      ? "text-green-700 font-medium"
                                      : "text-gray-600"
                                  }
                                >
                                  {quillDeltaToText(option.text)}
                                </span>
                              </div>
                            ))}
                          </div>
                          {question.explanation && (
                            <div className="mt-3 p-3 bg-blue-50 rounded">
                              <span className="text-sm text-blue-800">
                                <strong>Explanation:</strong>{" "}
                                {quillDeltaToText(question.explanation)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FaQuestionCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No Questions
                </h3>
                <p className="text-gray-600">
                  This MCQ doesn&apos;t have any questions yet.
                </p>
              </div>
            )}
          </div>
        )
      )}
    </div>
  );
};

export default MCQManagement;
