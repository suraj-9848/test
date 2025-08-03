import React, { useState, useEffect, useRef } from "react";
import { ArrowLeft, Save, X } from "lucide-react";
import apiClient from "@/utils/axiosInterceptor";
import { RichTextEditor, RichTextEditorHandle } from "./RichTextEditor";

interface ManageModuleContentProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  module: {
    id: string;
    title: string;
  };
  batch: {
    id: string;
    name: string;
  };
  course: {
    id: string;
    title: string;
  };
  dayContent?: {
    id: string;
    content: string;
    day_number: number;
    title?: string;
  } | null;
  mode: "create" | "edit";
}

const ManageModuleContent: React.FC<ManageModuleContentProps> = ({
  isOpen,
  onClose,
  onSave,
  module,
  batch,
  course,
  dayContent,
  mode,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [editorContent, setEditorContent] = useState("");
  const editorRef = useRef<RichTextEditorHandle>(null);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    day_number: 1,
  });

  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" && dayContent) {
        const contentToEdit =
          typeof dayContent.content === "string"
            ? dayContent.content
            : String(dayContent.content || "");

        setFormData({
          title: dayContent.title || `Day ${dayContent.day_number}`,
          content: contentToEdit,
          day_number: dayContent.day_number,
        });
        setEditorContent(contentToEdit);

        const timer = setTimeout(() => {
          if (editorRef.current) {
            editorRef.current.setContent(contentToEdit);
          }
        }, 50);

        return () => clearTimeout(timer);
      } else {
        setFormData({
          title: "",
          content: "",
          day_number: 1,
        });
        setEditorContent("");

        const timer = setTimeout(() => {
          if (editorRef.current) {
            editorRef.current.setContent("");
          }
        }, 50);

        return () => clearTimeout(timer);
      }
      setError("");
    }
  }, [isOpen, mode, dayContent]);

  const handleContentChange = (content: string) => {
    setEditorContent(content);
    setFormData((prev) => ({
      ...prev,
      content,
    }));
  };

  const hasTextContent = (htmlContent: string): boolean => {
    if (!htmlContent) return false;
    if (htmlContent === "<p><br></p>" || htmlContent === "<p></p>")
      return false;

    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = htmlContent;
    const textContent = tempDiv.textContent || tempDiv.innerText || "";
    return textContent.trim().length > 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let finalContent = editorContent || formData.content;

    if (editorRef.current) {
      const editorRefContent = editorRef.current.getContent();
      if (editorRefContent && editorRefContent.trim() !== "") {
        finalContent = editorRefContent;
      }
    }

    if (!finalContent || finalContent.trim() === "") {
      const editorElement = document.querySelector('[contenteditable="true"]');
      if (editorElement && editorElement.closest(".fixed")) {
        finalContent = editorElement.innerHTML || "";
      }
    }

    if (!formData.title.trim() || !hasTextContent(finalContent)) {
      setError("Please fill in all required fields");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const payload = {
        title: formData.title.trim(),
        content: finalContent,
        day_number: formData.day_number,
      };

      if (mode === "create") {
        await apiClient.post(
          `/api/instructor/batches/${batch.id}/courses/${course.id}/modules/${module.id}/day-content`,
          payload,
        );
      } else {
        await apiClient.put(
          `/api/instructor/batches/${batch.id}/courses/${course.id}/modules/${module.id}/day-content/${dayContent?.id}`,
          payload,
        );
      }
      onSave();
      onClose();
    } catch (err: any) {
      console.error("Content operation failed:", err);
      setError(err.response?.data?.message || `Failed to ${mode} day content`);
      console.error(`Error ${mode}ing day content:`, err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {mode === "create" ? "Add Day Content" : "Edit Day Content"}
              </h2>
              <p className="text-sm text-gray-600">
                {batch.name} → {course.title} → {module.title}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-140px)]"
        >
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Day Title *
              </label>
              <input
                type="text"
                value={formData.title || ""}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter day title"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Day Number *
              </label>
              <input
                type="number"
                value={formData.day_number || 1}
                onChange={(e) => {
                  const value = e.target.value;
                  const numValue = value === "" ? 1 : parseInt(value) || 1;
                  setFormData({ ...formData, day_number: numValue });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="1"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Content *
              <span className="text-xs text-gray-500 ml-2">
                ({editorContent.length} chars)
              </span>
            </label>
            <div className="border border-gray-300 rounded-lg overflow-hidden">
              <RichTextEditor
                ref={editorRef}
                value={editorContent}
                onChange={handleContentChange}
                placeholder="Enter the day content..."
                height="300px"
                minHeight="200px"
              />
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Use the rich text editor to format your content with headings,
              lists, links, and more.
            </p>
          </div>

          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 hover:border-gray-400 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                loading ||
                !formData.title.trim() ||
                !hasTextContent(editorContent || formData.content)
              }
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-lg transition-colors flex items-center space-x-2"
            >
              {loading && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              )}
              <Save className="w-4 h-4" />
              <span>{mode === "create" ? "Create" : "Save"} Content</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ManageModuleContent;
