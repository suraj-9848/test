import React, { useState, useMemo, useEffect } from "react";
import {
  FaBook,
  FaPlus,
  FaEdit,
  FaTrash,
  FaQuestionCircle,
  FaEye,
  FaEyeSlash,
  FaFileExport,
  FaTimes,
  FaSave,
  FaChevronDown,
  FaChevronRight,
} from "react-icons/fa";
import { useSession } from "next-auth/react";
import axios from "axios";
import { useModuleStore, Module, CreateModuleData } from "@/store/moduleStore";
import { useCourseStore } from "@/store/courseStore";
import dynamic from "next/dynamic";

// Dynamically import ReactQuill to avoid SSR issues
const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });
import "react-quill/dist/quill.snow.css";

interface MCQQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

interface DayContent {
  id: string;
  dayNumber: number;
  content: string;
  completed: boolean;
}

const ManageModules: React.FC = () => {
  const { data: session } = useSession();
  const {
    modules,
    loading: moduleLoading,
    error: moduleError,
    fetchModules,
    createModule,
    updateModule,
    deleteModule,
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
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [backendJwt, setBackendJwt] = useState<string>("");
  const [expandedModules, setExpandedModules] = useState<Set<string>>(
    new Set()
  );

  // Content Management States
  const [showContentModal, setShowContentModal] = useState(false);
  const [showMCQModal, setShowMCQModal] = useState(false);
  const [selectedModuleForContent, setSelectedModuleForContent] =
    useState<Module | null>(null);
  const [selectedModuleForMCQ, setSelectedModuleForMCQ] =
    useState<Module | null>(null);

  // Content Form State
  const [contentForm, setContentForm] = useState({
    dayNumber: 1,
    content: "",
  });

  // MCQ Form State
  const [mcqForm, setMCQForm] = useState({
    question: "",
    options: ["", "", "", ""],
    correctAnswer: 0,
    explanation: "",
  });

  const [moduleForm, setModuleForm] = useState({
    title: "",
    order: 1,
    isLocked: false,
  });

  // Quill configuration
  const quillModules = {
    toolbar: [
      [{ header: [1, 2, 3, 4, 5, 6, false] }],
      ["bold", "italic", "underline", "strike"],
      [{ list: "ordered" }, { list: "bullet" }],
      [{ script: "sub" }, { script: "super" }],
      [{ indent: "-1" }, { indent: "+1" }],
      ["link", "image", "video"],
      [{ color: [] }, { background: [] }],
      [{ align: [] }],
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
    "script",
    "indent",
    "link",
    "image",
    "video",
    "color",
    "background",
    "align",
  ];

  // Authentication setup
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
        const backendJwt = loginRes.data.token;
        setBackendJwt(backendJwt);
      } catch (err) {
        console.error("Failed to fetch user profile:", err);
      }
    };

    if (session) fetchProfile();
  }, [session]);

  // Fetch batches when JWT is available
  useEffect(() => {
    if (backendJwt) {
      fetchBatches(backendJwt);
    }
  }, [backendJwt, fetchBatches]);

  // Fetch courses when batch is selected
  useEffect(() => {
    if (selectedBatchId && backendJwt) {
      fetchAllCoursesInBatch(selectedBatchId, backendJwt);
      setSelectedCourseId(""); // Reset course selection
    }
  }, [selectedBatchId, backendJwt, fetchAllCoursesInBatch]);

  // Fetch modules when course is selected
  useEffect(() => {
    if (selectedBatchId && selectedCourseId && backendJwt) {
      fetchModules(selectedBatchId, selectedCourseId, backendJwt);
    }
  }, [selectedBatchId, selectedCourseId, backendJwt, fetchModules]);

  const sortedModules = useMemo(() => {
    return [...modules].sort((a, b) => a.order - b.order);
  }, [modules]);

  const resetForm = () => {
    setModuleForm({
      title: "",
      order: modules.length + 1,
      isLocked: false,
    });
    setEditingModule(null);
  };

  const resetContentForm = () => {
    setContentForm({
      dayNumber: 1,
      content: "",
    });
  };

  const resetMCQForm = () => {
    setMCQForm({
      question: "",
      options: ["", "", "", ""],
      correctAnswer: 0,
      explanation: "",
    });
  };

  const toggleModuleExpansion = (moduleId: string) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(moduleId)) {
      newExpanded.delete(moduleId);
    } else {
      newExpanded.add(moduleId);
    }
    setExpandedModules(newExpanded);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedBatchId || !selectedCourseId) {
      alert("Please select a batch and course first");
      return;
    }

    if (!backendJwt) {
      alert("Authentication required");
      return;
    }

    try {
      if (editingModule) {
        await updateModule(
          selectedBatchId,
          selectedCourseId,
          editingModule.id,
          moduleForm,
          backendJwt
        );
      } else {
        await createModule(
          selectedBatchId,
          selectedCourseId,
          moduleForm,
          backendJwt
        );
      }

      resetForm();
      setShowCreateModal(false);
    } catch (error) {
      console.error("Error saving module:", error);
    }
  };

  // Handle content submission
  const handleContentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedModuleForContent || !backendJwt) return;

    try {
      const baseUrl = process.env.NEXT_PUBLIC_BACKEND_BASE_URL || "";
      await axios.post(
        `${baseUrl}/api/instructor/batches/${selectedBatchId}/courses/${selectedCourseId}/modules/${selectedModuleForContent.id}/content`,
        contentForm,
        {
          headers: { Authorization: `Bearer ${backendJwt}` },
        }
      );

      // Refresh modules to get updated content
      await fetchModules(selectedBatchId, selectedCourseId, backendJwt);

      resetContentForm();
      setShowContentModal(false);
      setSelectedModuleForContent(null);
    } catch (error) {
      console.error("Error adding content:", error);
    }
  };

  // Handle MCQ submission
  const handleMCQSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedModuleForMCQ || !backendJwt) return;

    try {
      const baseUrl = process.env.NEXT_PUBLIC_BACKEND_BASE_URL || "";
      await axios.post(
        `${baseUrl}/api/instructor/batches/${selectedBatchId}/courses/${selectedCourseId}/modules/${selectedModuleForMCQ.id}/mcq`,
        mcqForm,
        {
          headers: { Authorization: `Bearer ${backendJwt}` },
        }
      );

      // Refresh modules to get updated MCQ
      await fetchModules(selectedBatchId, selectedCourseId, backendJwt);

      resetMCQForm();
      setShowMCQModal(false);
      setSelectedModuleForMCQ(null);
    } catch (error) {
      console.error("Error adding MCQ:", error);
    }
  };

  const handleEdit = (module: Module) => {
    setEditingModule(module);
    setModuleForm({
      title: module.title,
      order: module.order,
      isLocked: module.isLocked,
    });
    setShowCreateModal(true);
  };

  const handleDelete = async (moduleId: string) => {
    if (!selectedBatchId || !selectedCourseId || !backendJwt) return;

    if (confirm("Are you sure you want to delete this module?")) {
      try {
        await deleteModule(
          selectedBatchId,
          selectedCourseId,
          moduleId,
          backendJwt
        );
      } catch (error) {
        console.error("Error deleting module:", error);
      }
    }
  };

  // Handle adding content to module
  const handleAddContent = (module: Module) => {
    setSelectedModuleForContent(module);
    setContentForm({
      dayNumber: (module.days?.length || 0) + 1,
      content: "",
    });
    setShowContentModal(true);
  };

  // Handle adding MCQ to module
  const handleAddMCQ = (module: Module) => {
    setSelectedModuleForMCQ(module);
    resetMCQForm();
    setShowMCQModal(true);
  };

  const getModuleIcon = (hasContent: boolean, hasMCQ: boolean) => {
    if (hasContent && hasMCQ) {
      return <FaBook className="w-5 h-5 text-emerald-600" />;
    } else if (hasContent) {
      return <FaFileExport className="w-5 h-5 text-blue-600" />;
    } else if (hasMCQ) {
      return <FaQuestionCircle className="w-5 h-5 text-purple-600" />;
    }
    return <FaFileExport className="w-5 h-5 text-slate-400" />;
  };

  const getStatusBadge = (isLocked: boolean) => {
    return isLocked ? (
      <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-lg">
        <FaEyeSlash className="w-3 h-3 inline mr-1" />
        Locked
      </span>
    ) : (
      <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-lg">
        <FaEye className="w-3 h-3 inline mr-1" />
        Unlocked
      </span>
    );
  };

  return (
    <div className="p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
            <FaBook className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Manage Modules
            </h1>
            <p className="text-slate-600 mt-1">
              Create and organize course content
            </p>
          </div>
        </div>
        <button
          className="flex items-center space-x-3 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-2xl hover:shadow-lg transition-all duration-200 transform hover:scale-105"
          onClick={() => setShowCreateModal(true)}
          disabled={!selectedBatchId || !selectedCourseId}
        >
          <FaPlus className="w-4 h-4" />
          <span className="font-semibold">Add Module</span>
        </button>
      </div>

      {/* Error Display */}
      {moduleError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl">
          {moduleError}
          <button
            onClick={clearError}
            className="ml-2 text-red-500 hover:text-red-700"
          >
            <FaTimes className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Selection Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Batch Selection */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/50 shadow-sm">
          <label className="block text-sm font-semibold text-slate-700 mb-3">
            Select Batch
          </label>
          <select
            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 bg-white/80"
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
        </div>

        {/* Course Selection */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/50 shadow-sm">
          <label className="block text-sm font-semibold text-slate-700 mb-3">
            Select Course
          </label>
          <select
            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 bg-white/80"
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
        </div>
      </div>

      {/* Modules List */}
      {selectedBatchId && selectedCourseId && (
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-slate-200/50 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-200/50">
            <h3 className="text-xl font-bold text-slate-900">
              Course Modules ({sortedModules.length})
            </h3>
            <p className="text-slate-600 mt-1">
              Manage content, quizzes, and assignments
            </p>
          </div>

          {moduleLoading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-slate-600">Loading modules...</p>
            </div>
          ) : sortedModules.length === 0 ? (
            <div className="text-center py-12">
              <FaBook className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-600 mb-2">
                No modules yet
              </h3>
              <p className="text-slate-500">
                Create your first module to get started!
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200/50">
              {sortedModules.map((module) => (
                <div key={module.id} className="transition-colors">
                  {/* Module Header */}
                  <div className="p-6 hover:bg-slate-50/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 flex-1">
                        <button
                          onClick={() => toggleModuleExpansion(module.id)}
                          className="p-1 hover:bg-slate-200 rounded"
                        >
                          {expandedModules.has(module.id) ? (
                            <FaChevronDown className="w-4 h-4 text-slate-500" />
                          ) : (
                            <FaChevronRight className="w-4 h-4 text-slate-500" />
                          )}
                        </button>

                        <div className="flex items-center space-x-2">
                          {getModuleIcon(
                            (module.days?.length || 0) > 0,
                            !!module.mcq
                          )}
                          <div className="text-sm font-medium text-slate-500">
                            Module {module.order}
                          </div>
                        </div>

                        <div className="flex-1">
                          <h4 className="text-lg font-semibold text-slate-900 mb-1">
                            {module.title}
                          </h4>
                          <div className="flex items-center space-x-4 text-sm text-slate-500">
                            <span>{module.days?.length || 0} days</span>
                            <span>{module.mcq ? "Has MCQ" : "No MCQ"}</span>
                            {getStatusBadge(module.isLocked)}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          className="p-2 text-slate-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all duration-200"
                          onClick={() => handleAddContent(module)}
                          title="Add Content"
                        >
                          <FaFileExport className="w-4 h-4" />
                        </button>
                        <button
                          className="p-2 text-slate-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all duration-200"
                          onClick={() => handleAddMCQ(module)}
                          title="Add MCQ"
                        >
                          <FaQuestionCircle className="w-4 h-4" />
                        </button>
                        <button
                          className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                          onClick={() => handleEdit(module)}
                          title="Edit Module"
                        >
                          <FaEdit className="w-4 h-4" />
                        </button>
                        <button
                          className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                          onClick={() => handleDelete(module.id)}
                          title="Delete Module"
                        >
                          <FaTrash className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {expandedModules.has(module.id) && (
                    <div className="px-6 pb-6 bg-slate-50/30">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Day Content */}
                        <div className="bg-white rounded-xl p-4 border border-slate-200">
                          <h5 className="font-semibold text-slate-700 mb-3 flex items-center">
                            <FaFileExport className="w-4 h-4 mr-2 text-blue-600" />
                            Content ({module.days?.length || 0} days)
                          </h5>
                          {module.days && module.days.length > 0 ? (
                            <div className="space-y-2 max-h-40 overflow-y-auto">
                              {module.days.map((day) => (
                                <div
                                  key={day.id}
                                  className="p-2 bg-slate-50 rounded text-sm"
                                >
                                  <div className="font-medium">
                                    Day {day.dayNumber}
                                  </div>
                                  <div
                                    className="text-slate-600 line-clamp-2"
                                    dangerouslySetInnerHTML={{
                                      __html:
                                        day.content.substring(0, 100) + "...",
                                    }}
                                  />
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-slate-500 text-sm">
                              No content added yet
                            </p>
                          )}
                        </div>

                        {/* MCQ Content */}
                        <div className="bg-white rounded-xl p-4 border border-slate-200">
                          <h5 className="font-semibold text-slate-700 mb-3 flex items-center">
                            <FaQuestionCircle className="w-4 h-4 mr-2 text-purple-600" />
                            MCQ Questions
                          </h5>
                          {module.mcq ? (
                            <div className="space-y-2 max-h-40 overflow-y-auto">
                              <div className="p-2 bg-slate-50 rounded text-sm">
                                <div className="font-medium line-clamp-2">
                                  {module.mcq.questions[0]?.question}
                                </div>
                                <div className="text-slate-600 text-xs mt-1">
                                  {module.mcq.questions[0]?.options?.length || 0} options
                                </div>
                              </div>
                            </div>
                          ) : (
                            <p className="text-slate-500 text-sm">
                              No MCQ added yet
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create/Edit Module Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold text-slate-900 mb-6">
              {editingModule ? "Edit Module" : "Create New Module"}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Module Title *
                  </label>
                  <input
                    type="text"
                    value={moduleForm.title}
                    onChange={(e) =>
                      setModuleForm((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500"
                    placeholder="Enter module title"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Order
                  </label>
                  <input
                    type="number"
                    value={moduleForm.order}
                    onChange={(e) =>
                      setModuleForm((prev) => ({
                        ...prev,
                        order: parseInt(e.target.value) || 1,
                      }))
                    }
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500"
                    min="1"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={moduleForm.isLocked}
                    onChange={(e) =>
                      setModuleForm((prev) => ({
                        ...prev,
                        isLocked: e.target.checked,
                      }))
                    }
                    className="w-4 h-4 text-purple-600 border-slate-300 rounded focus:ring-purple-500"
                  />
                  <span className="text-sm font-medium text-slate-700">
                    Lock this module (students need to complete previous
                    modules)
                  </span>
                </label>
              </div>

              <div className="flex items-center justify-end space-x-4 pt-6 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="px-6 py-3 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:shadow-lg transition-all duration-200"
                  disabled={moduleLoading}
                >
                  {moduleLoading
                    ? "Saving..."
                    : editingModule
                    ? "Update Module"
                    : "Create Module"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Content Modal */}
      {showContentModal && selectedModuleForContent && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold text-slate-900 mb-6">
              Add Content to Module: {selectedModuleForContent.title}
            </h3>

            <form onSubmit={handleContentSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Day Number *
                </label>
                <input
                  type="number"
                  value={contentForm.dayNumber}
                  onChange={(e) =>
                    setContentForm((prev) => ({
                      ...prev,
                      dayNumber: parseInt(e.target.value) || 1,
                    }))
                  }
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                  min="1"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Content *
                </label>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <ReactQuill
                    theme="snow"
                    value={contentForm.content}
                    onChange={(content) =>
                      setContentForm((prev) => ({ ...prev, content }))
                    }
                    modules={quillModules}
                    formats={quillFormats}
                    style={{ minHeight: "300px" }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-4 pt-6 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowContentModal(false);
                    resetContentForm();
                    setSelectedModuleForContent(null);
                  }}
                  className="px-6 py-3 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-xl hover:shadow-lg transition-all duration-200"
                >
                  Add Content
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add MCQ Modal */}
      {showMCQModal && selectedModuleForMCQ && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold text-slate-900 mb-6">
              Add MCQ to Module: {selectedModuleForMCQ.title}
            </h3>

            <form onSubmit={handleMCQSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Question *
                </label>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <ReactQuill
                    theme="snow"
                    value={mcqForm.question}
                    onChange={(question) =>
                      setMCQForm((prev) => ({ ...prev, question }))
                    }
                    modules={quillModules}
                    formats={quillFormats}
                    style={{ minHeight: "150px" }}
                    placeholder="Enter your question here..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Options *
                </label>
                <div className="space-y-3">
                  {mcqForm.options.map((option, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <input
                        type="radio"
                        name="correctAnswer"
                        value={index}
                        checked={mcqForm.correctAnswer === index}
                        onChange={(e) =>
                          setMCQForm((prev) => ({
                            ...prev,
                            correctAnswer: parseInt(e.target.value),
                          }))
                        }
                        className="w-4 h-4 text-purple-600 border-slate-300 focus:ring-purple-500"
                      />
                      <span className="text-sm font-medium text-slate-700 w-2">
                        {String.fromCharCode(65 + index)}.
                      </span>
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => {
                          const newOptions = [...mcqForm.options];
                          newOptions[index] = e.target.value;
                          setMCQForm((prev) => ({
                            ...prev,
                            options: newOptions,
                          }));
                        }}
                        className="flex-1 px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500"
                        placeholder={`Option ${String.fromCharCode(
                          65 + index
                        )}`}
                        required
                      />
                    </div>
                  ))}
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Select the radio button next to the correct answer
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Explanation (Optional)
                </label>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <ReactQuill
                    theme="snow"
                    value={mcqForm.explanation}
                    onChange={(explanation) =>
                      setMCQForm((prev) => ({ ...prev, explanation }))
                    }
                    modules={quillModules}
                    formats={quillFormats}
                    style={{ minHeight: "100px" }}
                    placeholder="Provide an explanation for the correct answer..."
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-4 pt-6 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowMCQModal(false);
                    resetMCQForm();
                    setSelectedModuleForMCQ(null);
                  }}
                  className="px-6 py-3 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:shadow-lg transition-all duration-200"
                >
                  Add MCQ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageModules;
