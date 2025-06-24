import React, { useState, useEffect } from "react";
import {
  FaFileExport,
  FaQuestionCircle,
  FaPlus,
  FaEdit,
  FaTrash,
  FaTimes,
  FaBook,
  FaChevronDown,
} from "react-icons/fa";
import { useSession } from "next-auth/react";
import axios from "axios";
import dynamic from "next/dynamic";
import "react-quill/dist/quill.snow.css";

import { useModuleStore } from "@/store/moduleStore";
import { useCourseStore } from "@/store/courseStore";
import type {
  Module,
  CreateDayContentData,
  CreateMCQData,
  MCQQuestion,
} from "@/store/moduleStore";

// Dynamically import ReactQuill to avoid SSR issues
const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });

interface ModuleContentProps {
  batchId?: string;
  courseId?: string;
  module?: { id: string; name: string; description: string };
  onClose: () => void;
}

// Day Content Modal Component
const DayContentModal: React.FC<{
  show: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  formData: CreateDayContentData;
  setFormData: React.Dispatch<React.SetStateAction<CreateDayContentData>>;
  editingDay: any;
  loading: boolean;
}> = ({
  show,
  onClose,
  onSubmit,
  formData,
  setFormData,
  editingDay,
  loading,
}) => {
  const quillModules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ["bold", "italic", "underline", "strike"],
      [{ list: "ordered" }, { list: "bullet" }],
      [{ color: [] }, { background: [] }],
      ["link", "image"],
      ["clean"],
    ],
  };

  const quillFormats = [
    "header",
    "bold",
    "italic",
    "underline",
    "strike",
    "list",
    "bullet",
    "color",
    "background",
    "link",
    "image",
  ];

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-slate-900">
            {editingDay ? "Edit Day Content" : "Add Day Content"}
          </h3>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700"
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={onSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Day Number
              </label>
              <input
                type="number"
                value={formData.dayNumber}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    dayNumber: parseInt(e.target.value) || 1,
                  }))
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                min="1"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Title
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, title: e.target.value }))
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Day title"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Content
            </label>
            <div className="border border-slate-300 rounded-lg overflow-hidden">
              <ReactQuill
                value={formData.content}
                onChange={(content) =>
                  setFormData((prev) => ({ ...prev, content }))
                }
                modules={quillModules}
                formats={quillFormats}
                placeholder="Enter day content..."
                className="h-[300px]"
              />
            </div>
          </div>
          <div className="flex items-center justify-end space-x-4 pt-16">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:shadow-lg"
              disabled={loading}
            >
              {loading
                ? "Saving..."
                : editingDay
                ? "Update Day Content"
                : "Create Day Content"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// MCQ Modal Component
const MCQModal: React.FC<{
  show: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  formData: CreateMCQData;
  setFormData: React.Dispatch<React.SetStateAction<CreateMCQData>>;
  loading: boolean;
}> = ({ show, onClose, onSubmit, formData, setFormData, loading }) => {
  const quillModules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ["bold", "italic", "underline", "strike"],
      [{ list: "ordered" }, { list: "bullet" }],
      [{ color: [] }, { background: [] }],
      ["link", "image"],
      ["clean"],
    ],
  };

  const quillFormats = [
    "header",
    "bold",
    "italic",
    "underline",
    "strike",
    "list",
    "bullet",
    "color",
    "background",
    "link",
    "image",
  ];

  const addQuestion = () => {
    const newQuestion: MCQQuestion = {
      id: `q_${Date.now()}`,
      question: { ops: [{ insert: "" }] },
      options: [
        { id: `opt_${Date.now()}_1`, text: { ops: [{ insert: "" }] } },
        { id: `opt_${Date.now()}_2`, text: { ops: [{ insert: "" }] } },
      ],
      correctAnswer: "",
      explanation: { ops: [{ insert: "" }] },
    };
    setFormData((prev) => ({
      ...prev,
      questions: [...prev.questions, newQuestion],
    }));
  };

  const updateQuestion = (index: number, field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      questions: prev.questions.map((q, i) =>
        i === index ? { ...q, [field]: value } : q
      ),
    }));
  };

  const removeQuestion = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index),
    }));
  };

  const addOption = (questionIndex: number) => {
    const newOption = {
      id: `opt_${Date.now()}`,
      text: { ops: [{ insert: "" }] },
    };
    setFormData((prev) => ({
      ...prev,
      questions: prev.questions.map((q, i) =>
        i === questionIndex ? { ...q, options: [...q.options, newOption] } : q
      ),
    }));
  };

  const removeOption = (questionIndex: number, optionIndex: number) => {
    setFormData((prev) => ({
      ...prev,
      questions: prev.questions.map((q, i) =>
        i === questionIndex
          ? { ...q, options: q.options.filter((_, oi) => oi !== optionIndex) }
          : q
      ),
    }));
  };

  const deltaToHtml = (delta: any) => {
    if (!delta || !delta.ops) return "";
    return delta.ops.map((op: any) => op.insert).join("");
  };

  const htmlToDelta = (html: string) => ({ ops: [{ insert: html }] });

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-slate-900">Create MCQ Test</h3>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700"
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={onSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Passing Score (%)
            </label>
            <input
              type="number"
              value={formData.passingScore}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  passingScore: parseInt(e.target.value) || 70,
                }))
              }
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              min="0"
              max="100"
              required
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-medium text-slate-900">
                Questions ({formData.questions.length})
              </h4>
              <button
                type="button"
                onClick={addQuestion}
                className="flex items-center space-x-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                <FaPlus className="w-4 h-4" />
                <span>Add Question</span>
              </button>
            </div>
            {formData.questions.map((question, qIndex) => (
              <div
                key={question.id}
                className="border border-slate-200 rounded-lg p-6 mb-6 bg-slate-50/50"
              >
                <div className="flex items-center justify-between mb-4">
                  <h5 className="font-medium text-slate-900">
                    Question {qIndex + 1}
                  </h5>
                  <button
                    type="button"
                    onClick={() => removeQuestion(qIndex)}
                    className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                  >
                    <FaTrash className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Question Text
                    </label>
                    <div className="border border-slate-300 rounded-lg overflow-hidden">
                      <ReactQuill
                        value={deltaToHtml(question.question)}
                        onChange={(content) =>
                          updateQuestion(
                            qIndex,
                            "question",
                            htmlToDelta(content)
                          )
                        }
                        modules={quillModules}
                        formats={quillFormats}
                        placeholder="Enter question..."
                        className="h-[150px]"
                      />
                    </div>
                  </div>
                  <div className="pt-12">
                    <div className="flex items-center justify-between mb-4">
                      <label className="block text-sm font-medium text-slate-700">
                        Options
                      </label>
                      <button
                        type="button"
                        onClick={() => addOption(qIndex)}
                        className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                      >
                        Add Option
                      </button>
                    </div>
                    {question.options.map((option, oIndex) => (
                      <div
                        key={option.id}
                        className="flex items-start space-x-3 mb-3"
                      >
                        <input
                          type="radio"
                          name={`correct_${qIndex}`}
                          checked={question.correctAnswer === option.id}
                          onChange={() =>
                            updateQuestion(qIndex, "correctAnswer", option.id)
                          }
                          className="mt-2 text-purple-600 focus:ring-purple-500"
                        />
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Option {String.fromCharCode(65 + oIndex)}
                          </label>
                          <div className="border border-slate-300 rounded-lg overflow-hidden">
                            <ReactQuill
                              value={deltaToHtml(option.text)}
                              onChange={(content) => {
                                const newOptions = [...question.options];
                                newOptions[oIndex] = {
                                  ...option,
                                  text: htmlToDelta(content),
                                };
                                updateQuestion(qIndex, "options", newOptions);
                              }}
                              modules={quillModules}
                              formats={quillFormats}
                              placeholder="Enter option..."
                              className="h-[100px]"
                            />
                          </div>
                        </div>
                        {question.options.length > 2 && (
                          <button
                            type="button"
                            onClick={() => removeOption(qIndex, oIndex)}
                            className="mt-8 p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                          >
                            <FaTrash className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="pt-4">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Explanation (Optional)
                    </label>
                    <div className="border border-slate-300 rounded-lg overflow-hidden">
                      <ReactQuill
                        value={deltaToHtml(question.explanation)}
                        onChange={(content) =>
                          updateQuestion(
                            qIndex,
                            "explanation",
                            htmlToDelta(content)
                          )
                        }
                        modules={quillModules}
                        formats={quillFormats}
                        placeholder="Explain the correct answer..."
                        className="h-[120px]"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-end space-x-4 pt-8 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:shadow-lg"
              disabled={loading || formData.questions.length === 0}
            >
              {loading ? "Creating..." : "Create MCQ"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Main ModuleContent Component
const ModuleContent: React.FC<ModuleContentProps> = ({ onClose }) => {
  const { data: session } = useSession();
  const {
    modules,
    selectedModule,
    setSelectedModule,
    fetchModules,
    createDayContent,
    updateDayContent,
    deleteDayContent,
    createMCQ,
    deleteMCQ,
    loading: moduleLoading,
    error: moduleError,
    clearError,
  } = useModuleStore();

  const {
    courses,
    batches,
    loading: courseLoading,
    fetchBatches,
    fetchAllCoursesInBatch,
  } = useCourseStore();

  const [selectedBatchId, setSelectedBatchId] = useState<string>("");
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [selectedModuleId, setSelectedModuleId] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"content" | "mcq">("content");
  const [backendJwt, setBackendJwt] = useState<string>("");
  const [showContentModal, setShowContentModal] = useState(false);
  const [showMCQModal, setShowMCQModal] = useState(false);
  const [editingDay, setEditingDay] = useState<any>(null);
  const [dayContentForm, setDayContentForm] = useState<CreateDayContentData>({
    content: "",
    dayNumber: 1,
    title: "",
  });
  const [mcqForm, setMCQForm] = useState<CreateMCQData>({
    questions: [],
    passingScore: 70,
  });

  const deltaToHtml = (delta: any) => {
    if (!delta || !delta.ops) return "";
    return delta.ops.map((op: any) => op.insert).join("");
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_BACKEND_BASE_URL || "";
        const googleIdToken = (session as any)?.id_token;
        if (!googleIdToken) return;

        const loginRes = await axios.post(
          `${baseUrl}/api/auth/admin-login`,
          {},
          {
            headers: { Authorization: `Bearer ${googleIdToken}` },
            withCredentials: true,
          }
        );
        setBackendJwt(loginRes.data.token);
      } catch (err) {
        console.error("Failed to fetch authentication:", err);
      }
    };

    if (session) fetchProfile();
  }, [session]);

  useEffect(() => {
    if (backendJwt) fetchBatches(backendJwt);
  }, [backendJwt, fetchBatches]);

  useEffect(() => {
    if (selectedBatchId && backendJwt) {
      fetchAllCoursesInBatch(selectedBatchId, backendJwt);
      setSelectedCourseId("");
      setSelectedModuleId("");
      setSelectedModule(null);
    }
  }, [selectedBatchId, backendJwt, fetchAllCoursesInBatch, setSelectedModule]);

  useEffect(() => {
    if (selectedBatchId && selectedCourseId && backendJwt) {
      fetchModules(selectedBatchId, selectedCourseId, backendJwt);
      setSelectedModuleId("");
      setSelectedModule(null);
    }
  }, [
    selectedBatchId,
    selectedCourseId,
    backendJwt,
    fetchModules,
    setSelectedModule,
  ]);

  useEffect(() => {
    if (selectedModuleId && modules.length > 0) {
      const module = modules.find((m) => m.id === selectedModuleId);
      if (module) setSelectedModule(module);
    }
  }, [selectedModuleId, modules, setSelectedModule]);

  const resetDayContentForm = () => {
    setDayContentForm({
      content: "",
      dayNumber: selectedModule?.days ? selectedModule.days.length + 1 : 1,
      title: "",
    });
    setEditingDay(null);
  };

  const handleCreateDayContent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !backendJwt ||
      !selectedBatchId ||
      !selectedCourseId ||
      !selectedModuleId
    )
      return;

    try {
      if (editingDay) {
        await updateDayContent(
          selectedBatchId,
          selectedCourseId,
          selectedModuleId,
          editingDay.id,
          dayContentForm,
          backendJwt
        );
      } else {
        await createDayContent(
          selectedBatchId,
          selectedCourseId,
          selectedModuleId,
          dayContentForm,
          backendJwt
        );
      }
      setShowContentModal(false);
      resetDayContentForm();
    } catch (error) {
      console.error("Error saving day content:", error);
    }
  };

  const handleEditDay = (day: any) => {
    setEditingDay(day);
    setDayContentForm({
      content: day.content,
      dayNumber: day.dayNumber,
      title: day.title || "",
    });
    setShowContentModal(true);
  };

  const handleDeleteDay = async (dayId: string) => {
    if (
      !selectedBatchId ||
      !selectedCourseId ||
      !selectedModuleId ||
      !backendJwt
    )
      return;
    if (confirm("Are you sure you want to delete this day content?")) {
      try {
        await deleteDayContent(
          selectedBatchId,
          selectedCourseId,
          selectedModuleId,
          dayId,
          backendJwt
        );
      } catch (error) {
        console.error("Error deleting day content:", error);
      }
    }
  };

  const handleCreateMCQ = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !backendJwt ||
      !selectedBatchId ||
      !selectedCourseId ||
      !selectedModuleId ||
      mcqForm.questions.length === 0
    )
      return;

    try {
      await createMCQ(
        selectedBatchId,
        selectedCourseId,
        selectedModuleId,
        mcqForm,
        backendJwt
      );
      setShowMCQModal(false);
      setMCQForm({ questions: [], passingScore: 70 });
    } catch (error) {
      console.error("Error creating MCQ:", error);
    }
  };

  const handleDeleteMCQ = async () => {
    if (
      !selectedModule?.mcq ||
      !selectedBatchId ||
      !selectedCourseId ||
      !selectedModuleId ||
      !backendJwt
    )
      return;
    if (confirm("Are you sure you want to delete this MCQ?")) {
      try {
        await deleteMCQ(
          selectedBatchId,
          selectedCourseId,
          selectedModuleId,
          selectedModule.mcq.id,
          backendJwt
        );
      } catch (error) {
        console.error("Error deleting MCQ:", error);
      }
    }
  };

  return (
    <div className="p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
            <FaBook className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Module Content Manager
            </h1>
            <p className="text-slate-600 mt-1">
              Manage day content and MCQs for modules
            </p>
          </div>
        </div>
        <button onClick={onClose} className="p-3 hover:bg-slate-200 rounded-xl">
          <FaTimes className="w-6 h-6 text-slate-500" />
        </button>
      </div>

      {/* Error Display */}
      {moduleError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center justify-between">
          <span>{moduleError}</span>
          <button
            onClick={clearError}
            className="text-red-500 hover:text-red-700"
          >
            <FaTimes className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Selection Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/50 shadow-sm">
          <label className="block text-sm font-semibold text-slate-700 mb-3">
            Select Batch
          </label>
          <div className="relative">
            <select
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white/80 appearance-none pr-10"
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
              disabled={courseLoading}
            >
              <option value="">
                {courseLoading ? "Loading batches..." : "Select a batch..."}
              </option>
              {batches.map((batch) => (
                <option key={batch.id} value={batch.id}>
                  {batch.name}
                </option>
              ))}
            </select>
            <FaChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
          </div>
        </div>
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/50 shadow-sm">
          <label className="block text-sm font-semibold text-slate-700 mb-3">
            Select Course
          </label>
          <div className="relative">
            <select
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white/80 appearance-none pr-10"
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              disabled={!selectedBatchId || courseLoading}
            >
              <option value="">
                {!selectedBatchId
                  ? "Select a batch first..."
                  : courseLoading
                  ? "Loading courses..."
                  : "Select a course..."}
              </option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>
            <FaChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
          </div>
        </div>
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/50 shadow-sm">
          <label className="block text-sm font-semibold text-slate-700 mb-3">
            Select Module
          </label>
          <div className="relative">
            <select
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white/80 appearance-none pr-10"
              value={selectedModuleId}
              onChange={(e) => setSelectedModuleId(e.target.value)}
              disabled={!selectedCourseId || moduleLoading}
            >
              <option value="">
                {!selectedCourseId
                  ? "Select a course first..."
                  : moduleLoading
                  ? "Loading modules..."
                  : "Select a module..."}
              </option>
              {modules.map((module) => (
                <option key={module.id} value={module.id}>
                  Module {module.order}: {module.title}
                </option>
              ))}
            </select>
            <FaChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Module Content Management */}
      {selectedModule && (
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-slate-200/50 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-200/50">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  {selectedModule.title}
                </h2>
                <p className="text-slate-600 mt-1">
                  Module {selectedModule.order} - Content Management
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <span
                  className={`px-3 py-1 text-sm font-medium rounded-lg ${
                    selectedModule.isLocked
                      ? "bg-red-100 text-red-800"
                      : "bg-green-100 text-green-800"
                  }`}
                >
                  {selectedModule.isLocked ? "Locked" : "Unlocked"}
                </span>
              </div>
            </div>
          </div>
          <div className="flex border-b border-slate-200/50">
            <button
              onClick={() => setActiveTab("content")}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === "content"
                  ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50/50"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50/50"
              }`}
            >
              <FaFileExport className="w-4 h-4 inline mr-2" />
              Day Content ({selectedModule.days?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab("mcq")}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === "mcq"
                  ? "text-purple-600 border-b-2 border-purple-600 bg-purple-50/50"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50/50"
              }`}
            >
              <FaQuestionCircle className="w-4 h-4 inline mr-2" />
              MCQ {selectedModule.mcq ? "(Created)" : "(Not Created)"}
            </button>
          </div>
          <div className="p-6">
            {activeTab === "content" ? (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-slate-900">
                    Day Content
                  </h3>
                  <button
                    onClick={() => {
                      resetDayContentForm();
                      setShowContentModal(true);
                    }}
                    className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:shadow-lg transition-all duration-200 transform hover:scale-105"
                  >
                    <FaPlus className="w-4 h-4" />
                    <span>Add Day Content</span>
                  </button>
                </div>
                <div className="space-y-4">
                  {selectedModule.days && selectedModule.days.length > 0 ? (
                    selectedModule.days
                      .sort((a, b) => a.dayNumber - b.dayNumber)
                      .map((day) => (
                        <div
                          key={day.id}
                          className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50/50 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium text-slate-900 mb-1">
                                Day {day.dayNumber}: {day.title || "Untitled"}
                              </h4>
                              <div
                                className="text-sm text-slate-600 prose prose-sm max-w-none"
                                dangerouslySetInnerHTML={{
                                  __html:
                                    day.content.length > 150
                                      ? `${day.content.substring(0, 150)}...`
                                      : day.content,
                                }}
                              />
                              <div className="flex items-center space-x-4 mt-2">
                                <span
                                  className={`px-2 py-1 text-xs font-medium rounded-lg ${
                                    day.completed
                                      ? "bg-green-100 text-green-800"
                                      : "bg-yellow-100 text-yellow-800"
                                  }`}
                                >
                                  {day.completed ? "Completed" : "In Progress"}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleEditDay(day)}
                                className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                              >
                                <FaEdit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteDay(day.id)}
                                className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                              >
                                <FaTrash className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                  ) : (
                    <div className="text-center py-12">
                      <FaFileExport className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-slate-600 mb-2">
                        No day content yet
                      </h3>
                      <p className="text-slate-500">
                        Add day-by-day content for this module
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-slate-900">
                    Module MCQ
                  </h3>
                  {!selectedModule.mcq && (
                    <button
                      onClick={() => setShowMCQModal(true)}
                      className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:shadow-lg transition-all duration-200 transform hover:scale-105"
                    >
                      <FaPlus className="w-4 h-4" />
                      <span>Create MCQ</span>
                    </button>
                  )}
                </div>
                {selectedModule.mcq ? (
                  <div className="space-y-6">
                    <div className="p-6 border border-slate-200 rounded-lg bg-gradient-to-br from-purple-50 to-blue-50">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-medium text-slate-900">
                          MCQ Test
                        </h4>
                        <div className="flex items-center space-x-2">
                          <span className="px-3 py-1 text-sm font-medium bg-purple-100 text-purple-800 rounded-lg">
                            Passing Score: {selectedModule.mcq.passingScore}%
                          </span>
                          <button
                            onClick={handleDeleteMCQ}
                            className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <FaTrash className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center p-4 bg-white/50 rounded-lg">
                          <div className="text-2xl font-bold text-purple-600">
                            {selectedModule.mcq.questions.length}
                          </div>
                          <div className="text-sm text-slate-600">
                            Questions
                          </div>
                        </div>
                        <div className="text-center p-4 bg-white/50 rounded-lg">
                          <div className="text-2xl font-bold text-blue-600">
                            {selectedModule.mcq.passingScore}%
                          </div>
                          <div className="text-sm text-slate-600">
                            Passing Score
                          </div>
                        </div>
                        <div className="text-center p-4 bg-white/50 rounded-lg">
                          <div className="text-2xl font-bold text-green-600">
                            Active
                          </div>
                          <div className="text-sm text-slate-600">Status</div>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h4 className="text-lg font-semibold text-slate-900">
                        Questions
                      </h4>
                      {selectedModule.mcq.questions.map((question, index) => (
                        <div
                          key={question.id}
                          className="p-6 border border-slate-200 rounded-lg bg-white"
                        >
                          <div className="mb-4">
                            <h5 className="font-medium text-slate-900 mb-2">
                              Question {index + 1}:
                            </h5>
                            <div
                              className="text-slate-700 prose prose-sm max-w-none"
                              dangerouslySetInnerHTML={{
                                __html: deltaToHtml(question.question),
                              }}
                            />
                          </div>
                          <div className="mb-4">
                            <h6 className="font-medium text-slate-700 mb-2">
                              Options:
                            </h6>
                            <div className="space-y-2">
                              {question.options.map((option, optIndex) => (
                                <div
                                  key={option.id}
                                  className={`p-3 rounded-lg border ${
                                    question.correctAnswer === option.id
                                      ? "bg-green-50 border-green-200"
                                      : "bg-slate-50 border-slate-200"
                                  }`}
                                >
                                  <div className="flex items-center space-x-2">
                                    <span
                                      className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium ${
                                        question.correctAnswer === option.id
                                          ? "bg-green-600 text-white"
                                          : "bg-slate-300 text-slate-700"
                                      }`}
                                    >
                                      {String.fromCharCode(65 + optIndex)}
                                    </span>
                                    <div
                                      className="flex-1 prose prose-sm max-w-none"
                                      dangerouslySetInnerHTML={{
                                        __html: deltaToHtml(option.text),
                                      }}
                                    />
                                    {question.correctAnswer === option.id && (
                                      <span className="text-green-600 text-sm font-medium">
                                        ✓ Correct
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                          {question.explanation &&
                            deltaToHtml(question.explanation) && (
                              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                <h6 className="font-medium text-blue-900 mb-1">
                                  Explanation:
                                </h6>
                                <div
                                  className="text-blue-800 prose prose-sm max-w-none"
                                  dangerouslySetInnerHTML={{
                                    __html: deltaToHtml(question.explanation),
                                  }}
                                />
                              </div>
                            )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FaQuestionCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-600 mb-2">
                      No MCQ created yet
                    </h3>
                    <p className="text-slate-500">
                      Create an MCQ test for this module
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      <DayContentModal
        show={showContentModal}
        onClose={() => {
          setShowContentModal(false);
          resetDayContentForm();
        }}
        onSubmit={handleCreateDayContent}
        formData={dayContentForm}
        setFormData={setDayContentForm}
        editingDay={editingDay}
        loading={moduleLoading}
      />
      <MCQModal
        show={showMCQModal}
        onClose={() => setShowMCQModal(false)}
        onSubmit={handleCreateMCQ}
        formData={mcqForm}
        setFormData={setMCQForm}
        loading={moduleLoading}
      />
    </div>
  );
};

export default ModuleContent;
