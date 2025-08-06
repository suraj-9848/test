import React, { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import axios from "axios";
import { useModuleStore } from "@/store/moduleStore";
import { useCourseStore } from "@/store/courseStore";
import { BASE_URLS } from "../config/urls";
import type {
  CreateDayContentData,
  CreateMCQData,
  MCQQuestion,
  QuillDelta,
} from "@/store/moduleStore";

// Import the improved RichTextEditor
import { RichTextEditor, RichTextEditorHandle } from "./RichTextEditor";

interface ModuleContentProps {
  batchId?: string;
  courseId?: string;
  module?: { id: string; name: string; description: string };
  onClose: () => void;
}

// BULLETPROOF Day Content Modal that NEVER loses content
const DayContentModal: React.FC<{
  show: boolean;
  content: boolean;
  onClose: () => void;
  onSubmit: (formData: CreateDayContentData) => Promise<CreateDayContentData>;
  formData: CreateDayContentData;
  setFormData: React.Dispatch<React.SetStateAction<CreateDayContentData>>;
  editingDay: CreateDayContentData | null;
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
  const editorRef = useRef<RichTextEditorHandle>(null);
  const [editorContent, setEditorContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalKey, setModalKey] = useState(0); // Force re-render when needed

  // Initialize content when modal opens or editing day changes
  useEffect(() => {
    if (show) {
      const initialContent = editingDay?.content || formData.content || "";
      console.log("🔄 Modal content initialization:", {
        hasEditingDay: !!editingDay,
        editingDayContent:
          editingDay?.content?.substring(0, 100) + "..." || "None",
        formDataContent: formData.content?.substring(0, 100) + "..." || "None",
        finalContent: initialContent?.substring(0, 100) + "..." || "None",
        modalKey,
      });

      setEditorContent(initialContent);

      // Set editor content with a small delay to ensure it's mounted
      const timer = setTimeout(() => {
        if (editorRef.current) {
          editorRef.current.setContent(initialContent);
          console.log(" Editor content set successfully");
        }
      }, 50);

      return () => clearTimeout(timer);
    }
  }, [show, editingDay, modalKey]);

  // CRITICAL: Track ALL content changes
  const handleContentChange = (content: string) => {
    console.log("📝 Content changed:", {
      newLength: content.length,
      preview: content.substring(0, 100) + "...",
    });

    setEditorContent(content);
    setFormData((prev) => ({
      ...prev,
      content,
    }));
  };

  // BULLETPROOF form submission
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      // Get content from ALL possible sources
      let finalContent = editorContent || formData.content;

      if (editorRef.current) {
        const editorRefContent = editorRef.current.getContent();
        if (editorRefContent && editorRefContent.trim() !== "") {
          finalContent = editorRefContent;
        }
      }

      // Last resort: get from DOM
      if (!finalContent || finalContent.trim() === "") {
        const editorElement = document.querySelector(
          '[contenteditable="true"]',
        );
        if (editorElement && editorElement.closest(".fixed")) {
          finalContent = editorElement.innerHTML || "";
        }
      }

      console.log("💾 Final content sources check:", {
        editorContent: editorContent?.length || 0,
        formDataContent: formData.content?.length || 0,
        editorRefContent: editorRef.current?.getContent()?.length || 0,
        finalContentLength: finalContent?.length || 0,
        finalPreview: finalContent?.substring(0, 200) + "...",
      });

      // Validate we have content
      const textContent = finalContent.replace(/<[^>]*>/g, "").trim();
      if (!textContent || textContent.length === 0) {
        alert("Please enter some content before saving.");
        setIsSubmitting(false);
        return;
      }

      const submissionData = {
        ...formData,
        content: finalContent,
        title: formData.title || `Day ${formData.dayNumber}`,
      };

      console.log("🚀 Submitting data:", {
        title: submissionData.title,
        dayNumber: submissionData.dayNumber,
        contentLength: submissionData.content.length,
        isEdit: !!editingDay,
      });

      // Submit and wait for response
      const result = await onSubmit(submissionData);

      console.log(" Submission successful:", {
        resultId: result?.id,
        resultContentLength: result?.content?.length || 0,
      });

      // Don't close immediately - let parent handle it
    } catch (error) {
      console.error(" Submission failed:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Failed to save content. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;

    console.log("🚪 Closing modal");
    setEditorContent("");
    setModalKey((prev) => prev + 1); // Force fresh render next time
    onClose();
  };

  if (!show) return null;

  return (
    <div
      key={modalKey}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4"
    >
      <div className="bg-white rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-slate-700">
            {editingDay ? "Edit Day Content" : "Add Day Content"}
          </h3>
          <button
            onClick={handleClose}
            className="text-slate-500 hover:text-slate-700"
            disabled={isSubmitting}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Day Number *
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
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    title: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Day title..."
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Content *{" "}
              <span className="text-xs text-slate-500">
                ({editorContent.length} chars)
              </span>
            </label>
            <RichTextEditor
              ref={editorRef}
              value={editorContent}
              onChange={handleContentChange}
              placeholder="Enter the day's content here..."
              height="350px"
            />
          </div>

          <div className="flex items-center justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300"
              disabled={loading || isSubmitting}
            >
              {isSubmitting
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
  } = useModuleStore();

  const { courses, batches, fetchBatches, fetchAllCoursesInBatch } =
    useCourseStore();

  const [selectedBatchId, setSelectedBatchId] = useState<string>("");
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [selectedModuleId, setSelectedModuleId] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"content" | "mcq">("content");
  const [backendJwt, setBackendJwt] = useState<string>("");
  const [showContentModal, setShowContentModal] = useState(false);
  const [showMCQModal, setShowMCQModal] = useState(false);
  const [editingDay, setEditingDay] = useState<CreateDayContentData | null>(
    null,
  );
  const [authError, setAuthError] = useState<string>("");

  const [dayContentForm, setDayContentForm] = useState<CreateDayContentData>({
    content: "",
    dayNumber: 1,
    title: "",
  });

  const [mcqForm, setMCQForm] = useState<CreateMCQData>({
    questions: [],
    passingScore: 70,
  });

  // Utility functions
  const deltaToHtml = (
    delta: QuillDelta | string | { ops: { insert: string }[] } | undefined,
  ): string => {
    if (!delta) return "";
    if (typeof delta === "string") return delta;
    if (
      typeof delta === "object" &&
      "ops" in delta &&
      Array.isArray((delta as { ops: { insert: string }[] }).ops)
    ) {
      return (delta as { ops: { insert: string }[] }).ops
        .map((op: { insert: string }) => op.insert)
        .join("");
    }
    return "";
  };

  const resetDayContentForm = () => {
    setDayContentForm({
      content: "",
      dayNumber: selectedModule?.days ? selectedModule.days.length + 1 : 1,
      title: "",
    });
    setEditingDay(null);
  };

  // Auth setup
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setAuthError("");
        const baseUrl = process.env.NEXT_PUBLIC_BACKEND_BASE_URL || "";
        const googleIdToken = (session as { id_token?: string })?.id_token;

        if (!googleIdToken) {
          setAuthError(
            "Authentication token not found. Please try logging out and back in.",
          );
          return;
        }

        const response = await axios({
          method: "post",
          url: `${baseUrl}/api/auth/admin-login`,
          headers: {
            Authorization: `Bearer ${googleIdToken}`,
            "Content-Type": "application/json",
          },
          withCredentials: true,
          timeout: 15000,
        });

        setBackendJwt(response.data.token);
        setAuthError("");
      } catch (err: any) {
        console.error("Failed to fetch user profile:", err);
        const errorMessage =
          err?.response?.data?.message ||
          err.message ||
          "Authentication failed";
        setAuthError(errorMessage);
      }
    };

    if (session?.id_token) {
      fetchProfile();
    } else if (session === null) {
      setAuthError("Not authenticated. Please log in.");
    }
  }, [session]);

  // Data fetching effects
  useEffect(() => {
    if (backendJwt && batches.length === 0) {
      fetchBatches();
    }
  }, [backendJwt, fetchBatches, batches.length]);

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
      const selectedModuleData = modules.find((m) => m.id === selectedModuleId);
      if (selectedModuleData && selectedModuleData.id !== selectedModule?.id) {
        setSelectedModule(selectedModuleData);
      }
    }
  }, [selectedModuleId, modules, setSelectedModule, selectedModule?.id]);

  // BULLETPROOF content save handler with correct function signatures
  const handleCreateDayContent = async (
    formDataToSubmit: CreateDayContentData,
  ): Promise<CreateDayContentData> => {
    if (
      !backendJwt ||
      !selectedBatchId ||
      !selectedCourseId ||
      !selectedModuleId
    ) {
      throw new Error("Required parameters missing");
    }

    console.log(" BULLETPROOF SAVE START:", {
      isEdit: !!(editingDay && editingDay.id),
      contentLength: formDataToSubmit.content.length,
      contentPreview: formDataToSubmit.content.substring(0, 200) + "...",
    });

    try {
      let result;

      if (editingDay && editingDay.id) {
        console.log("🔄 Updating existing content...");
        //  Use correct function signature from store
        result = await updateDayContent(
          selectedBatchId,
          selectedCourseId,
          selectedModuleId,
          editingDay.id,
          formDataToSubmit, // This is Partial<CreateDayContentData>
          backendJwt,
        );
      } else {
        console.log("➕ Creating new content...");
        //  Use correct function signature from store
        result = await createDayContent(
          selectedBatchId,
          selectedCourseId,
          selectedModuleId,
          formDataToSubmit, // This is CreateDayContentData
          backendJwt,
        );
      }

      console.log(" Save completed:", {
        resultId: result?.id,
        resultContentLength: result?.content?.length || 0,
        resultPreview:
          result?.content?.substring(0, 200) + "..." || "No content",
      });

      // Close modal and reset
      setShowContentModal(false);
      resetDayContentForm();

      // Force refresh modules to get latest data
      setTimeout(() => {
        console.log("🔄 Refreshing modules to ensure latest data...");
        fetchModules(selectedBatchId, selectedCourseId, backendJwt);
      }, 100);

      return result;
    } catch (error: any) {
      console.error(" Save failed:", error);
      throw error;
    }
  };

  // SAFE edit handler
  const handleEditDay = (day: CreateDayContentData) => {
    console.log("✏️ Starting edit for day:", {
      id: day.id,
      title: day.title,
      dayNumber: day.dayNumber,
      contentLength: day.content?.length || 0,
      contentPreview: day.content?.substring(0, 200) + "..." || "No content",
    });

    // Set all the state properly
    setEditingDay(day);
    setDayContentForm({
      content: day.content || "",
      dayNumber: day.dayNumber,
      title: day.title || "",
    });

    // Open modal
    setShowContentModal(true);
  };

  const handleDeleteDay = async (dayId: any) => {
    if (
      !selectedBatchId ||
      !selectedCourseId ||
      !selectedModuleId ||
      !backendJwt ||
      !selectedModule
    ) {
      alert("Required information missing. Please refresh the page.");
      return;
    }

    if (window.confirm("Are you sure you want to delete this day content?")) {
      try {
        await deleteDayContent(
          selectedBatchId,
          selectedCourseId,
          selectedModuleId,
          dayId,
          backendJwt,
        );
        console.log("🗑️ Day content deleted successfully");
      } catch (err: any) {
        console.error("Failed to delete day content:", err);
        alert("Failed to delete content. Please try again.");
      }
    }
  };

  // Auth error screen
  if (authError) {
    return (
      <div className="p-8 bg-gradient-to-br from-slate-50 to-slate-100 h-[calc(100vh-4rem)] overflow-y-auto">
        <div className="flex items-center justify-center h-full">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
            <div className="flex items-center space-x-3">
              <svg
                className="w-6 h-6 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
              <div>
                <h3 className="text-lg font-medium text-red-800">
                  Authentication Error
                </h3>
                <p className="text-red-600 mt-1">{authError}</p>
              </div>
            </div>
            <div className="mt-4 flex space-x-3">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Refresh Page
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gradient-to-br from-slate-50 to-slate-100 h-[calc(100vh-4rem)] overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
            <svg
              className="h-7 w-7 text-white"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Module Content
            </h1>
            <p className="text-slate-600 mt-1">
              Manage your module content and MCQs
            </p>
            {moduleError && (
              <p className="text-red-500 text-sm mt-1">Error: {moduleError}</p>
            )}
          </div>
        </div>
        <button
          onClick={onClose}
          className="flex items-center space-x-2 px-4 py-2 text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-xl transition-all duration-200"
        >
          <span>Close</span>
        </button>
      </div>

      {/* Selection Controls */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          Select Module
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Batch
            </label>
            <select
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white text-slate-900"
              disabled={!backendJwt}
            >
              <option value="">Select batch...</option>
              {batches.map((batch) => (
                <option key={batch.id} value={batch.id}>
                  {batch.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Course
            </label>
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white text-slate-900 disabled:bg-slate-100 disabled:text-slate-500"
              disabled={!selectedBatchId || !backendJwt}
            >
              <option value="">Select course...</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Module
            </label>
            <select
              value={selectedModuleId}
              onChange={(e) => setSelectedModuleId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white text-slate-900 disabled:bg-slate-100 disabled:text-slate-500"
              disabled={!selectedCourseId || !backendJwt}
            >
              <option value="">Select module...</option>
              {modules.map((module) => (
                <option key={module.id} value={module.id}>
                  {module.title}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Content Display */}
      {selectedModule && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">
                  Day Content ({selectedModule.days?.length || 0} days)
                </h3>
                <button
                  onClick={() => {
                    resetDayContentForm();
                    setShowContentModal(true);
                  }}
                  className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:bg-purple-400"
                  disabled={!backendJwt}
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  <span>Add Day Content</span>
                </button>
              </div>

              {selectedModule.days && selectedModule.days.length > 0 ? (
                <div className="space-y-4">
                  {selectedModule.days
                    .sort((a, b) => a.dayNumber - b.dayNumber)
                    .map((day) => (
                      <div
                        key={`${day.id}-${day.content?.length}`}
                        className="bg-slate-50 rounded-xl border border-slate-200 p-6"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h4 className="text-lg font-semibold text-slate-900">
                              Day {day.dayNumber}: {day.title}
                            </h4>
                            <div className="text-sm text-slate-500 mt-1 space-x-4">
                              <span>
                                Content: {day.content?.length || 0} chars
                              </span>
                              <span>ID: {day.id}</span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleEditDay(day)}
                              className="flex items-center space-x-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                              disabled={!backendJwt}
                            >
                              <svg
                                className="w-3 h-3"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                />
                              </svg>
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => handleDeleteDay(day.id)}
                              className="flex items-center space-x-1 px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                              disabled={!backendJwt}
                            >
                              <svg
                                className="w-3 h-3"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                              <span>Delete</span>
                            </button>
                          </div>
                        </div>

                        {/*  Content rendering with proper styles */}
                        <div className="content-display">
                          <div
                            dangerouslySetInnerHTML={{ __html: day.content }}
                            className="min-h-[50px] p-4 bg-white rounded border border-slate-200"
                          />
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <svg
                    className="w-16 h-16 text-gray-400 mx-auto mb-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <h3 className="text-lg font-medium text-slate-900 mb-2">
                    No content yet
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Start by adding your first day of content for this module.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      <DayContentModal
        show={showContentModal}
        content={true}
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

      {/* CRITICAL: Global styles for content rendering */}
      <style jsx global>{`
        /* Content Display Styles */
        .content-display h1 {
          font-size: 1.875rem !important;
          font-weight: 700 !important;
          line-height: 1.2 !important;
          margin: 16px 0 12px 0 !important;
          color: #1f2937 !important;
          display: block !important;
        }

        .content-display h2 {
          font-size: 1.5rem !important;
          font-weight: 600 !important;
          line-height: 1.3 !important;
          margin: 14px 0 10px 0 !important;
          color: #374151 !important;
          display: block !important;
        }

        .content-display h3 {
          font-size: 1.25rem !important;
          font-weight: 600 !important;
          line-height: 1.4 !important;
          margin: 12px 0 8px 0 !important;
          color: #4b5563 !important;
          display: block !important;
        }

        .content-display p {
          margin: 8px 0 !important;
          line-height: 1.6 !important;
          display: block !important;
        }

        .content-display ul {
          padding-left: 24px !important;
          margin: 8px 0 !important;
          list-style-type: disc !important;
          display: block !important;
        }

        .content-display ol {
          padding-left: 24px !important;
          margin: 8px 0 !important;
          list-style-type: decimal !important;
          display: block !important;
        }

        .content-display li {
          margin: 4px 0 !important;
          line-height: 1.5 !important;
          display: list-item !important;
          list-style-position: outside !important;
        }

        .content-display ul li {
          list-style-type: disc !important;
        }

        .content-display ol li {
          list-style-type: decimal !important;
        }

        .content-display pre {
          background-color: #f1f5f9 !important;
          border: 1px solid #e2e8f0 !important;
          border-radius: 8px !important;
          padding: 16px !important;
          margin: 16px 0 !important;
          overflow-x: auto !important;
          font-family: Monaco, Consolas, "Courier New", monospace !important;
          font-size: 14px !important;
          line-height: 1.5 !important;
          display: block !important;
          width: 100% !important;
          box-sizing: border-box !important;
          clear: both !important;
          white-space: pre-wrap !important;
        }

        .content-display code {
          background-color: #f1f5f9 !important;
          padding: 2px 4px !important;
          border-radius: 4px !important;
          font-family: Monaco, Consolas, "Courier New", monospace !important;
          font-size: 0.9em !important;
        }

        .content-display blockquote {
          border-left: 4px solid #3b82f6 !important;
          background-color: #eff6ff !important;
          padding: 12px 16px !important;
          margin: 16px 0 !important;
          border-radius: 4px !important;
          font-style: italic !important;
          display: block !important;
        }

        .content-display strong,
        .content-display b {
          font-weight: 700 !important;
        }

        .content-display em,
        .content-display i {
          font-style: italic !important;
        }

        .content-display u {
          text-decoration: underline !important;
        }

        .content-display s {
          text-decoration: line-through !important;
        }

        /* Ensure proper spacing and formatting */
        .content-display div {
          min-height: auto;
        }

        /* Fix any potential conflicts */
        .content-display * {
          box-sizing: border-box;
        }
      `}</style>
    </div>
  );
};

export default ModuleContent;
