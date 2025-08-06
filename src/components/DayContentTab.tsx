import React, { useState, useEffect } from "react";
import { Plus, Edit3, Trash2, FileText } from "lucide-react";
import apiClient from "@/utils/axiosInterceptor";
import { API_ENDPOINTS } from "@/config/urls";
import ManageModuleContent from "./ManageModuleContent";
import "@/styles/module-mcq-management.css";

interface Batch {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  studentCount?: number;
}

interface Course {
  id: string;
  title: string;
  description?: string;
  start_date: string;
  end_date: string;
  instructor_name: string;
  moduleCount?: number;
}

interface Module {
  id: string;
  title: string;
  description?: string;
  course_id: string;
  order_index: number;
  created_at: string;
  dayContentCount?: number;
  mcqCount?: number;
}

export const DayContentTab: React.FC<{
  module: Module;
  batch: Batch;
  course: Course;
}> = ({ module, batch, course }) => {
  const [dayContents, setDayContents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showManageModal, setShowManageModal] = useState(false);
  const [selectedDayContent, setSelectedDayContent] = useState<any>(null);
  const [manageMode, setManageMode] = useState<"create" | "edit">("create");

  const renderSafeContent = (content: any): string => {
    if (typeof content === "string") {
      return cleanHtmlContent(content);
    }
    if (content && typeof content === "object") {
      if (content.ops && Array.isArray(content.ops)) {
        if (content.html && typeof content.html === "string") {
          return cleanHtmlContent(content.html);
        }
        const plainText = content.ops
          .map((op: any) => (typeof op.insert === "string" ? op.insert : ""))
          .join("");
        return plainText;
      }
      // Handle nested objects that might have text property
      if (
        content.text &&
        typeof content.text === "object" &&
        content.text.ops
      ) {
        const plainText = content.text.ops
          .map((op: any) => (typeof op.insert === "string" ? op.insert : ""))
          .join("");
        return plainText;
      }
      try {
        const stringified = JSON.stringify(content);
        return stringified;
      } catch {
        return "[Object]";
      }
    }
    return String(content || "");
  };

  // Helper function to clean up malformed HTML
  const cleanHtmlContent = (html: string): string => {
    if (!html) return "";

    let cleaned = html
      .replace(/<h([1-6])><h([1-6])>/g, "<h$1>")
      .replace(/<\/h([1-6])><\/h([1-6])>/g, "</h$1>")
      .replace(/<h([1-6])><blockquote><h([1-6])>/g, "<h$1>")
      .replace(/<\/h([1-6])><\/blockquote><\/h([1-6])>/g, "</h$1>")
      .replace(/<h([1-6])><ul><li><strong><h([1-6])><em><h([1-6])>/g, "<h$1>")
      .replace(
        /<\/h([1-6])><\/em><\/h([1-6])><\/strong><\/li><\/ul><\/h([1-6])>/g,
        "</h$1>",
      );

    cleaned = cleaned.replace(/<h[1-6]><\/h[1-6]>/g, "");

    cleaned = cleaned
      .replace(/<strong><b>/g, "<strong>")
      .replace(/<\/b><\/strong>/g, "</strong>")
      .replace(/<em><i>/g, "<em>")
      .replace(/<\/i><\/em>/g, "</em>");

    return cleaned;
  };

  const HTMLContent: React.FC<{ content: any }> = ({ content }) => {
    const htmlContent = renderSafeContent(content);

    if (htmlContent.includes("<") && htmlContent.includes(">")) {
      return (
        <div
          className="html-content text-sm"
          dangerouslySetInnerHTML={{ __html: htmlContent }}
          style={{
            lineHeight: "1.5",
          }}
        />
      );
    }

    return <span>{htmlContent}</span>;
  };

  const fetchDayContents = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(
        API_ENDPOINTS.INSTRUCTOR.BATCH_COURSE_MODULE_DAY_CONTENT(
          batch.id,
          course.id,
          module.id,
        ),
      );
      setDayContents(response.data.dayContents || response.data.content || []);
    } catch (err) {
      console.error("Error fetching day contents:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateContent = () => {
    setSelectedDayContent(null);
    setManageMode("create");
    setShowManageModal(true);
  };

  const handleEditContent = (dayContent: any) => {
    setSelectedDayContent(dayContent);
    setManageMode("edit");
    setShowManageModal(true);
  };

  const handleDeleteContent = async (dayContentId: string) => {
    if (window.confirm("Are you sure you want to delete this day content?")) {
      try {
        await apiClient.delete(
          API_ENDPOINTS.INSTRUCTOR.BATCH_COURSE_MODULE_DAY_CONTENT_BY_ID(
            batch.id,
            course.id,
            module.id,
            dayContentId,
          ),
        );
        fetchDayContents();
      } catch (err) {
        console.error("Error deleting day content:", err);
      }
    }
  };

  const handleModalClose = () => {
    setShowManageModal(false);
    setSelectedDayContent(null);
  };

  const handleModalSave = () => {
    fetchDayContents();
  };

  useEffect(() => {
    fetchDayContents();
  }, [module.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Day Content</h3>
          <button
            onClick={handleCreateContent}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Day Content</span>
          </button>
        </div>

        {dayContents.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h4 className="text-lg font-semibold text-gray-600 mb-2">
              No day content yet
            </h4>
            <p className="text-gray-500 mb-4">
              Start by adding your first day content for this module.
            </p>
            <button
              onClick={handleCreateContent}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors mx-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Create Day Content</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dayContents.map((dayContent, index) => (
              <div
                key={dayContent.id || index}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600">
                        {dayContent.day_number || index + 1}
                      </span>
                    </div>
                    <h4 className="font-medium text-gray-900">
                      {dayContent.title ||
                        `Day ${dayContent.day_number || index + 1}`}
                    </h4>
                  </div>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleEditContent(dayContent)}
                      className="p-1 text-gray-400 hover:text-green-600 rounded"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteContent(dayContent.id)}
                      className="p-1 text-gray-400 hover:text-red-600 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="text-gray-600 text-sm line-clamp-2">
                  <HTMLContent
                    content={
                      dayContent.content ||
                      dayContent.description ||
                      "No content description available"
                    }
                  />
                </div>
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <span className="text-xs text-gray-500">
                    {dayContent.created_at
                      ? new Date(dayContent.created_at).toLocaleDateString()
                      : "No date"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ManageModuleContent
        isOpen={showManageModal}
        onClose={handleModalClose}
        onSave={handleModalSave}
        module={module}
        batch={batch}
        course={course}
        dayContent={selectedDayContent}
        mode={manageMode}
      />
    </>
  );
};
