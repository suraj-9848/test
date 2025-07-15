import React, { useState, useEffect, useCallback } from "react";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaSpinner,
  FaSave,
  FaQuestionCircle,
  FaCheck,
  FaTimes,
} from "react-icons/fa";
import { useSession } from "next-auth/react";
import axios from "axios";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import TextStyle from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";

// Types matching backend structure
interface QuillDelta {
  ops: Array<{
    insert: string | object;
    attributes?: object;
    retain?: number;
    delete?: number;
  }>;
}

interface MCQOption {
  id: string;
  text: QuillDelta;
}

interface MCQQuestion {
  id?: string;
  question: QuillDelta;
  options: MCQOption[];
  correctAnswer: string; // ID of the correct option
  explanation?: QuillDelta;
}

interface MCQSet {
  id: string;
  passingScore: number;
  questions: MCQQuestion[];
  module: {
    id: string;
    title: string;
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

interface Module {
  id: string;
  title: string;
  course_id: string;
}

// Helper functions for Quill Delta conversion
const htmlToQuillDelta = (html: string): QuillDelta => {
  // Simple conversion from HTML to Quill Delta
  // For production, you'd want a more robust conversion
  return {
    ops: [{ insert: html.replace(/<[^>]*>/g, "") }],
  };
};

const quillDeltaToHtml = (delta: QuillDelta): string => {
  if (!delta || !delta.ops) return "";
  return delta.ops
    .map((op) => {
      if (typeof op.insert === "string") {
        return op.insert;
      }
      return "";
    })
    .join("");
};

const quillDeltaToText = (delta: QuillDelta): string => {
  if (!delta || !delta.ops) return "";
  return delta.ops
    .map((op) => {
      if (typeof op.insert === "string") {
        return op.insert;
      }
      return "";
    })
    .join("");
};

// Custom styles for the editor
const editorStyles = `
  .ProseMirror {
    outline: none;
    border: 1px solid #d1d5db;
    border-radius: 0.375rem;
    padding: 0.75rem;
    min-height: 100px;
    max-height: 200px;
    overflow-y: auto;
  }
  .ProseMirror:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

// Rich Text Editor Component
const RichTextEditor: React.FC<{
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  minHeight?: string;
}> = ({ content, onChange, minHeight = "100px" }) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image,
      Link.configure({
        openOnClick: false,
      }),
      TextStyle,
      Color,
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    immediatelyRender: false,
  });

  if (!editor) {
    return <div>Loading editor...</div>;
  }

  return (
    <div className="border border-gray-300 rounded-lg">
      <style dangerouslySetInnerHTML={{ __html: editorStyles }} />
      {/* Toolbar */}
      <div className="border-b border-gray-300 p-2 flex flex-wrap gap-1">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`px-2 py-1 rounded text-sm ${
            editor.isActive("bold") ? "bg-blue-500 text-white" : "bg-gray-100"
          }`}
        >
          Bold
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`px-2 py-1 rounded text-sm ${
            editor.isActive("italic") ? "bg-blue-500 text-white" : "bg-gray-100"
          }`}
        >
          Italic
        </button>
        <button
          type="button"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
          className={`px-2 py-1 rounded text-sm ${
            editor.isActive("heading", { level: 3 })
              ? "bg-blue-500 text-white"
              : "bg-gray-100"
          }`}
        >
          H3
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`px-2 py-1 rounded text-sm ${
            editor.isActive("bulletList")
              ? "bg-blue-500 text-white"
              : "bg-gray-100"
          }`}
        >
          List
        </button>
      </div>
      {/* Editor */}
      <div style={{ minHeight }}>
        <EditorContent editor={editor} className="prose max-w-none" />
      </div>
    </div>
  );
};

// MCQ Editor Component
const MCQEditor: React.FC<{
  isEditing: boolean;
  existingMCQSet: MCQSet | null;
  onSave: (mcqId: string, mcqData: Partial<MCQSet>) => void;
  onCancel: () => void;
  submitting: boolean;
}> = ({ isEditing, existingMCQSet, onSave, onCancel, submitting }) => {
  const [passingScore, setPassingScore] = useState(
    existingMCQSet?.passingScore || 60
  );
  const [questions, setQuestions] = useState<MCQQuestion[]>(
    existingMCQSet?.questions || []
  );
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);

  // Initialize with existing data if editing
  useEffect(() => {
    if (isEditing && existingMCQSet) {
      setPassingScore(existingMCQSet.passingScore);
      setQuestions(existingMCQSet.questions);
    }
  }, [isEditing, existingMCQSet]);

  const addQuestion = () => {
    const newQuestion: MCQQuestion = {
      id: `temp-${Date.now()}`,
      question: { ops: [{ insert: "" }] },
      options: [
        { id: `option-${Date.now()}-1`, text: { ops: [{ insert: "" }] } },
        { id: `option-${Date.now()}-2`, text: { ops: [{ insert: "" }] } },
        { id: `option-${Date.now()}-3`, text: { ops: [{ insert: "" }] } },
        { id: `option-${Date.now()}-4`, text: { ops: [{ insert: "" }] } },
      ],
      correctAnswer: `option-${Date.now()}-1`,
      explanation: { ops: [{ insert: "" }] },
    };
    setQuestions([...questions, newQuestion]);
    setActiveQuestionIndex(questions.length);
  };

  const removeQuestion = (index: number) => {
    const newQuestions = questions.filter((_, i) => i !== index);
    setQuestions(newQuestions);
    if (activeQuestionIndex >= newQuestions.length) {
      setActiveQuestionIndex(Math.max(0, newQuestions.length - 1));
    }
  };

  const updateQuestion = (
    index: number,
    field: keyof MCQQuestion,
    value: QuillDelta | string | MCQOption[]
  ) => {
    const newQuestions = [...questions];
    newQuestions[index] = { ...newQuestions[index], [field]: value };
    setQuestions(newQuestions);
  };

  const updateQuestionText = (index: number, html: string) => {
    updateQuestion(index, "question", htmlToQuillDelta(html));
  };

  const updateOptionText = (
    questionIndex: number,
    optionIndex: number,
    html: string
  ) => {
    const newQuestions = [...questions];
    newQuestions[questionIndex].options[optionIndex].text =
      htmlToQuillDelta(html);
    setQuestions(newQuestions);
  };

  const updateExplanation = (index: number, html: string) => {
    updateQuestion(index, "explanation", htmlToQuillDelta(html));
  };

  const setCorrectAnswer = (questionIndex: number, optionId: string) => {
    updateQuestion(questionIndex, "correctAnswer", optionId);
  };

  const handleSave = () => {
    if (questions.length === 0) {
      alert("Please add at least one question.");
      return;
    }

    // Validate questions
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      if (!quillDeltaToText(question.question).trim()) {
        alert(`Question ${i + 1} text is required.`);
        return;
      }

      const validOptions = question.options.filter((opt) =>
        quillDeltaToText(opt.text).trim()
      );
      if (validOptions.length < 2) {
        alert(`Question ${i + 1} must have at least 2 options.`);
        return;
      }
    }

    const mcqData = {
      passingScore,
      questions: questions.map((q) => ({
        ...q,
        id: q.id && q.id.startsWith("temp-") ? undefined : q.id, // Remove temp IDs
      })),
    };

    if (isEditing && existingMCQSet) {
      onSave(existingMCQSet.id, mcqData);
    } else {
      onSave("", mcqData);
    }
  };

  const activeQuestion = questions[activeQuestionIndex];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">
            {isEditing ? "Edit MCQ Set" : "Create MCQ Set"}
          </h3>
          <p className="text-sm text-gray-600">
            {questions.length} question{questions.length !== 1 ? "s" : ""} added
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={submitting}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 flex items-center space-x-2"
          >
            {submitting ? (
              <>
                <FaSpinner className="animate-spin w-4 h-4" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <FaSave className="w-4 h-4" />
                <span>Save MCQ Set</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Settings */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center space-x-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Passing Score (%)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={passingScore}
              onChange={(e) => setPassingScore(parseInt(e.target.value) || 0)}
              className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex-1 flex justify-end">
            <button
              onClick={addQuestion}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
            >
              <FaPlus className="w-4 h-4" />
              <span>Add Question</span>
            </button>
          </div>
        </div>
      </div>

      {/* Questions */}
      {questions.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
          <FaQuestionCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Questions Added
          </h3>
          <p className="text-gray-600 mb-4">
            Click &quot;Add Question&quot; to create your first question.
          </p>
          <button
            onClick={addQuestion}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg mx-auto"
          >
            <FaPlus className="w-4 h-4" />
            <span>Add Question</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Question List */}
          <div className="lg:col-span-1">
            <h4 className="text-sm font-medium text-gray-700 mb-3">
              Questions
            </h4>
            <div className="space-y-2">
              {questions.map((question, index) => (
                <div
                  key={question.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    activeQuestionIndex === index
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => setActiveQuestionIndex(index)}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Q{index + 1}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeQuestion(index);
                      }}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <FaTrash className="w-3 h-3" />
                    </button>
                  </div>
                  <p className="text-xs text-gray-600 mt-1 truncate">
                    {quillDeltaToText(question.question) || "Untitled Question"}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Question Editor */}
          <div className="lg:col-span-3">
            {activeQuestion && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-medium text-gray-900">
                    Question {activeQuestionIndex + 1}
                  </h4>
                </div>

                {/* Question Text */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Question Text
                  </label>
                  <RichTextEditor
                    content={quillDeltaToHtml(activeQuestion.question)}
                    onChange={(html) =>
                      updateQuestionText(activeQuestionIndex, html)
                    }
                    placeholder="Enter your question..."
                    minHeight="120px"
                  />
                </div>

                {/* Options */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Answer Options
                  </label>
                  <div className="space-y-3">
                    {activeQuestion.options.map((option, optionIndex) => (
                      <div
                        key={option.id}
                        className="flex items-start space-x-3"
                      >
                        <button
                          onClick={() =>
                            setCorrectAnswer(activeQuestionIndex, option.id)
                          }
                          className={`mt-2 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            activeQuestion.correctAnswer === option.id
                              ? "border-green-500 bg-green-100"
                              : "border-gray-300 hover:border-gray-400"
                          }`}
                        >
                          {activeQuestion.correctAnswer === option.id && (
                            <FaCheck className="w-3 h-3 text-green-600" />
                          )}
                        </button>
                        <div className="flex-1">
                          <div className="flex items-center mb-1">
                            <span className="text-sm font-medium text-gray-700">
                              Option {String.fromCharCode(65 + optionIndex)}
                            </span>
                            {activeQuestion.correctAnswer === option.id && (
                              <span className="ml-2 text-xs text-green-600 font-medium">
                                (Correct Answer)
                              </span>
                            )}
                          </div>
                          <RichTextEditor
                            content={quillDeltaToHtml(option.text)}
                            onChange={(html) =>
                              updateOptionText(
                                activeQuestionIndex,
                                optionIndex,
                                html
                              )
                            }
                            placeholder={`Enter option ${String.fromCharCode(
                              65 + optionIndex
                            )}...`}
                            minHeight="80px"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Explanation */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Explanation (Optional)
                  </label>
                  <RichTextEditor
                    content={quillDeltaToHtml(
                      activeQuestion.explanation || { ops: [{ insert: "" }] }
                    )}
                    onChange={(html) =>
                      updateExplanation(activeQuestionIndex, html)
                    }
                    placeholder="Explain why this is the correct answer..."
                    minHeight="100px"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

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

  const fetchMCQSet = useCallback(
    async (batchId: string, courseId: string, moduleId: string) => {
      try {
        // Backend endpoint: GET /api/instructor/batches/:batchId/courses/:courseId/modules/:moduleId/mcq
        const response = await apiCall(
          `/api/instructor/batches/${batchId}/courses/${courseId}/modules/${moduleId}/mcq`
        );
        setMcqSet(response);
      } catch (err) {
        console.error("Error fetching MCQ set:", err);
        // Don't set error here, as it's normal to not have an MCQ set yet
        setMcqSet(null);
      }
    },
    [apiCall]
  );

  const fetchModules = useCallback(
    async (batchId: string, courseId: string) => {
      try {
        // Backend endpoint: GET /api/instructor/batches/:batchId/courses/:courseId/modules
        const response = await apiCall(
          `/api/instructor/batches/${batchId}/courses/${courseId}/modules`
        );
        setModules(response.modules || response || []);
        if (
          (response.modules || response) &&
          (response.modules || response).length > 0
        ) {
          const moduleList = response.modules || response;
          setSelectedModule(moduleList[0].id);
          await fetchMCQSet(batchId, courseId, moduleList[0].id);
        }
      } catch (err) {
        console.error("Error fetching modules:", err);
        setError("Failed to load modules");
      }
    },
    [apiCall, fetchMCQSet]
  );

  const fetchCourses = useCallback(
    async (batchId: string) => {
      try {
        // Backend endpoint: GET /api/instructor/batches/:batchId/courses
        const response = await apiCall(
          `/api/instructor/batches/${batchId}/courses`
        );
        setCourses(response.courses || response || []);
        if (
          (response.courses || response) &&
          (response.courses || response).length > 0
        ) {
          const courseList = response.courses || response;
          setSelectedCourse(courseList[0].id);
          await fetchModules(batchId, courseList[0].id);
        }
      } catch (err) {
        console.error("Error fetching courses:", err);
        setError("Failed to load courses");
      }
    },
    [apiCall, fetchModules]
  );

  const fetchBatches = useCallback(async () => {
    try {
      setLoading(true);
      // Backend returns { message: "Fetched batches", batches: Batch[] }
      const response = await apiCall("/api/instructor/batches");
      setBatches(response.batches || []);
      if (response.batches && response.batches.length > 0) {
        setSelectedBatch(response.batches[0].id);
        await fetchCourses(response.batches[0].id);
      }
    } catch (err) {
      console.error("Error fetching batches:", err);
      setError("Failed to load batches");
    } finally {
      setLoading(false);
    }
  }, [apiCall, fetchCourses]);

  // Fetch initial data
  useEffect(() => {
    if (backendJwt) {
      fetchBatches();
    }
  }, [backendJwt, fetchBatches]);

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
    setMcqSet(null);
    if (selectedBatch && selectedCourse && moduleId) {
      fetchMCQSet(selectedBatch, selectedCourse, moduleId);
    }
  };

  const createMCQSet = async (mcqId: string, mcqData: Partial<MCQSet>) => {
    try {
      setSubmitting(true);
      await apiCall(
        `/api/instructor/batches/${selectedBatch}/courses/${selectedCourse}/modules/${selectedModule}/mcq`,
        {
          method: "POST",
          body: JSON.stringify(mcqData),
        }
      );
      await fetchMCQSet(selectedBatch, selectedCourse, selectedModule);
      setIsCreating(false);
    } catch (err) {
      console.error("Error creating MCQ set:", err);
      setError("Failed to create MCQ set");
    } finally {
      setSubmitting(false);
    }
  };

  const updateMCQSet = async (mcqId: string, mcqData: Partial<MCQSet>) => {
    try {
      setSubmitting(true);
      await apiCall(
        `/api/instructor/batches/${selectedBatch}/courses/${selectedCourse}/modules/${selectedModule}/mcq/${mcqId}`,
        {
          method: "PUT",
          body: JSON.stringify(mcqData),
        }
      );
      await fetchMCQSet(selectedBatch, selectedCourse, selectedModule);
      setIsEditing(false);
    } catch (err) {
      console.error("Error updating MCQ set:", err);
      setError("Failed to update MCQ set");
    } finally {
      setSubmitting(false);
    }
  };

  const deleteMCQSet = async (mcqId: string) => {
    try {
      if (confirm("Are you sure you want to delete this MCQ set?")) {
        await apiCall(
          `/api/instructor/batches/${selectedBatch}/courses/${selectedCourse}/modules/${selectedModule}/mcq/${mcqId}`,
          {
            method: "DELETE",
          }
        );
        await fetchMCQSet(selectedBatch, selectedCourse, selectedModule);
      }
    } catch (err) {
      console.error("Error deleting MCQ set:", err);
      setError("Failed to delete MCQ set");
    }
  };

  // Helper function to extract text from Quill Delta format
  const extractText = (delta: QuillDelta | undefined) => {
    if (!delta || !delta.ops) return "";
    return delta.ops
      .map((op: { insert?: string | object }) => op.insert || "")
      .join("");
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
              Manage Multiple Choice Questions for modules using real backend
              data
            </p>
          </div>
          <div className="flex items-center space-x-3">
            {mcqSet ? (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <FaEdit className="w-4 h-4" />
                <span>Edit MCQ Set</span>
              </button>
            ) : (
              <button
                onClick={() => setIsCreating(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                <FaPlus className="w-4 h-4" />
                <span>Create MCQ Set</span>
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
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

      {/* MCQ Set Display */}
      {!selectedModule ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="text-center">
            <FaQuestionCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Select a Module
            </h3>
            <p className="text-gray-600">
              Please select a batch, course, and module to view MCQ sets.
            </p>
          </div>
        </div>
      ) : mcqSet ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                MCQ Set for {mcqSet.module.title}
              </h2>
              <p className="text-gray-600">
                Passing Score: {mcqSet.passingScore}%
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <FaEdit className="w-4 h-4" />
                <span>Edit</span>
              </button>
              <button
                onClick={() => deleteMCQSet(mcqSet.id)}
                className="flex items-center space-x-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                <FaTrash className="w-4 h-4" />
                <span>Delete</span>
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">
              Questions ({mcqSet.questions.length})
            </h3>
            {mcqSet.questions.length === 0 ? (
              <div className="text-center py-8">
                <FaQuestionCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No questions added yet.</p>
              </div>
            ) : (
              mcqSet.questions.map((question, index) => (
                <div
                  key={question.id}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 mb-2">
                        Question {index + 1}
                      </h4>
                      <p className="text-gray-700 mb-3">
                        {extractText(question.question)}
                      </p>
                      <div className="space-y-2">
                        {question.options.map((option, optIndex) => (
                          <div
                            key={option.id}
                            className="flex items-center space-x-2"
                          >
                            <div
                              className={`w-4 h-4 rounded-full flex items-center justify-center ${
                                option.id === question.correctAnswer
                                  ? "bg-green-100 border-2 border-green-500"
                                  : "bg-gray-100 border-2 border-gray-300"
                              }`}
                            >
                              {option.id === question.correctAnswer && (
                                <FaCheck className="w-2 h-2 text-green-600" />
                              )}
                            </div>
                            <span className="text-gray-700">
                              {String.fromCharCode(65 + optIndex)}.{" "}
                              {extractText(option.text)}
                            </span>
                          </div>
                        ))}
                      </div>
                      {question.explanation && (
                        <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                          <p className="text-sm text-blue-800">
                            <strong>Explanation:</strong>{" "}
                            {extractText(question.explanation)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <div className="text-center">
            <FaQuestionCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No MCQ Set Found
            </h3>
            <p className="text-gray-600 mb-4">
              There are no MCQ sets for this module yet.
            </p>
            <button
              onClick={() => setIsCreating(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors mx-auto"
            >
              <FaPlus className="w-4 h-4" />
              <span>Create MCQ Set</span>
            </button>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {(isCreating || isEditing) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  {isCreating ? "Create MCQ Set" : "Edit MCQ Set"}
                </h2>
                <button
                  onClick={() => {
                    setIsCreating(false);
                    setIsEditing(false);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FaTimes className="w-5 h-5" />
                </button>
              </div>

              <MCQEditor
                isEditing={isEditing}
                existingMCQSet={mcqSet}
                onSave={isEditing ? updateMCQSet : createMCQSet}
                onCancel={() => {
                  setIsCreating(false);
                  setIsEditing(false);
                }}
                submitting={submitting}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MCQManagement;
