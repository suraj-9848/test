import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Search,
  ArrowLeft,
  Plus,
  Edit3,
  Trash2,
  BookOpen,
  FileText,
  Calendar,
  Users,
  ChevronRight,
  GraduationCap,
  Layers,
  HelpCircle,
  Eye,
  Settings,
} from "lucide-react";
import apiClient from "@/utils/axiosInterceptor";
import { API_ENDPOINTS } from "@/config/urls";
import ManageModuleContent from "./ManageModuleContent";
import MCQModuleManager from "./MCQModuleManager";
import "@/styles/module-mcq-management.css";
import { CreateModuleModal } from "./CreateModuleModal";

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

interface ModuleMcqManagementProps {
  onBack?: () => void;
}

export const MCQTab: React.FC<{
  module: Module;
  batch: Batch;
  course: Course;
}> = ({ module, batch, course }) => {
  const [mcqs, setMcqs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showManageModal, setShowManageModal] = useState(false);
  const [selectedMCQ, setSelectedMCQ] = useState<any>(null);
  const [manageMode, setManageMode] = useState<"create" | "edit">("create");

  // Helper function to safely render content that might be a rich text object
  const renderSafeContent = (content: any): string => {
    // Handle null, undefined, or empty content
    if (!content) return "";

    // If it's already a string, just clean it
    if (typeof content === "string") {
      return cleanHtmlContent(content);
    }

    // If it's a number or boolean, convert to string
    if (typeof content === "number" || typeof content === "boolean") {
      return String(content);
    }

    if (content && typeof content === "object") {
      // Handle Quill Delta objects
      if (content.ops && Array.isArray(content.ops)) {
        if (content.html && typeof content.html === "string") {
          return cleanHtmlContent(content.html);
        }
        const plainText = content.ops
          .map((op: any) => {
            if (typeof op === "object" && op !== null && op.insert) {
              if (typeof op.insert === "string") {
                return op.insert;
              } else if (typeof op.insert === "object" && op.insert !== null) {
                // Handle embedded objects in Delta (like images, etc.)
                return "[Embedded Content]";
              }
            }
            return "";
          })
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
          .map((op: any) => {
            if (typeof op === "object" && op !== null && op.insert) {
              if (typeof op.insert === "string") {
                return op.insert;
              } else if (typeof op.insert === "object" && op.insert !== null) {
                return "[Embedded Content]";
              }
            }
            return "";
          })
          .join("");
        return plainText;
      }
      // Handle objects that might directly have insert property
      if (content.insert && typeof content.insert === "string") {
        return content.insert;
      }
      // Handle objects that might have a text property as string
      if (content.text && typeof content.text === "string") {
        return cleanHtmlContent(content.text);
      }
      // Handle plain objects by trying to extract meaningful text
      if (content.id && content.text) {
        return renderSafeContent(content.text);
      }
      if (content.id && content.option) {
        return renderSafeContent(content.option);
      }
      // Last resort: try to stringify, but safely
      try {
        const stringified = JSON.stringify(content);
        if (stringified.length > 100) {
          return "[Complex Object]";
        }
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

  // Helper component to render HTML content safely
  const HTMLContentMCQ: React.FC<{ content: any }> = ({ content }) => {
    // Always process content through renderSafeContent first
    const safeContent = renderSafeContent(content);

    // If the safe content contains HTML tags, render as HTML
    if (safeContent && safeContent.includes("<") && safeContent.includes(">")) {
      return (
        <div
          className="html-content"
          dangerouslySetInnerHTML={{ __html: safeContent }}
          style={{
            lineHeight: "1.6",
          }}
        />
      );
    }

    // Otherwise render as plain text
    return <span>{safeContent}</span>;
  };

  const fetchMcqs = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(
        API_ENDPOINTS.INSTRUCTOR.BATCH_COURSE_MODULE_MCQ(
          batch.id,
          course.id,
          module.id,
        ),
      );

      console.log("MCQ API Response:", response.data);

      // Backend returns a single MCQ object with questions array
      if (response.data && response.data.questions) {
        // Store the entire MCQ as a single entity
        const mcqData = [
          {
            id: response.data.id, // Use the actual MCQ database ID
            questions: response.data.questions,
            passingScore: response.data.passingScore,
            module: response.data.module,
          },
        ];
        console.log("MCQ Data:", mcqData);
        setMcqs(mcqData);
      } else {
        setMcqs([]);
      }
    } catch (err: any) {
      console.error("Error fetching MCQs:", err);
      if (err.response?.status === 404) {
        // No MCQ exists for this module yet
        setMcqs([]);
      }
    } finally {
      setLoading(false);
    }
  };

  // Helper function to deeply sanitize MCQ data before passing to modal
  const deepSanitizeMCQData = (data: any): any => {
    if (data === null || data === undefined) {
      return data;
    }

    if (Array.isArray(data)) {
      return data.map((item) => deepSanitizeMCQData(item));
    }

    if (typeof data === "object") {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(data)) {
        // Convert ALL text-like fields to safe strings
        if (
          [
            "question",
            "text",
            "option",
            "explanation",
            "title",
            "description",
            "content",
            "insert",
          ].includes(key)
        ) {
          sanitized[key] = renderSafeContent(value);
        } else if (key === "options" && Array.isArray(value)) {
          // Specifically handle options array - convert ALL fields to primitives
          sanitized[key] = value.map((option: any, index: number) => {
            const safeOption = {
              id: option.id || `option-${index}`,
              text: renderSafeContent(
                option.text || option.option || `Option ${index + 1}`,
              ),
              option: renderSafeContent(
                option.text || option.option || `Option ${index + 1}`,
              ),
              is_correct: Boolean(option.is_correct),
              // Convert any other nested objects to strings
              ...Object.fromEntries(
                Object.entries(option)
                  .filter(
                    ([k]) =>
                      !["id", "text", "option", "is_correct"].includes(k),
                  )
                  .map(([k, v]) => [
                    k,
                    typeof v === "object" ? renderSafeContent(v) : v,
                  ]),
              ),
            };
            return safeOption;
          });
        } else if (key === "questions" && Array.isArray(value)) {
          // Specifically handle questions array - convert ALL fields to primitives
          sanitized[key] = value.map((question: any, index: number) => {
            const safeQuestion = {
              id: question.id || `question-${index}`,
              question: renderSafeContent(
                question.question || `Question ${index + 1}`,
              ),
              explanation: renderSafeContent(question.explanation || ""),
              difficulty: question.difficulty || "medium",
              type: question.type || "multiple-choice",
              options:
                question.options?.map((option: any, optIndex: number) => ({
                  id: option.id || `option-${optIndex}`,
                  text: renderSafeContent(
                    option.text || option.option || `Option ${optIndex + 1}`,
                  ),
                  option: renderSafeContent(
                    option.text || option.option || `Option ${optIndex + 1}`,
                  ),
                  is_correct: Boolean(option.is_correct),
                })) || [],
              // Convert any other nested objects to strings
              ...Object.fromEntries(
                Object.entries(question)
                  .filter(
                    ([k]) =>
                      ![
                        "id",
                        "question",
                        "explanation",
                        "difficulty",
                        "type",
                        "options",
                      ].includes(k),
                  )
                  .map(([k, v]) => [
                    k,
                    typeof v === "object" ? renderSafeContent(v) : v,
                  ]),
              ),
            };
            return safeQuestion;
          });
        } else if (typeof value === "object" && value !== null) {
          // For any other object, either recurse or convert to string
          if (Array.isArray(value)) {
            sanitized[key] = deepSanitizeMCQData(value);
          } else {
            // Convert complex objects to safe strings
            sanitized[key] = renderSafeContent(value);
          }
        } else {
          // For primitives, keep as is
          sanitized[key] = value;
        }
      }
      return sanitized;
    }

    return data;
  };

  // Helper function to validate that data contains no nested objects
  const validateNoNestedObjects = (
    data: any,
    path: string = "root",
  ): boolean => {
    if (data === null || data === undefined) {
      return true;
    }

    if (Array.isArray(data)) {
      return data.every((item, index) =>
        validateNoNestedObjects(item, `${path}[${index}]`),
      );
    }

    if (typeof data === "object") {
      for (const [key, value] of Object.entries(data)) {
        const currentPath = `${path}.${key}`;

        // Allow specific object structures but ensure text fields are strings
        if (key === "options" || key === "questions") {
          if (!validateNoNestedObjects(value, currentPath)) {
            console.error(`Found nested object at ${currentPath}:`, value);
            return false;
          }
        } else if (
          ["question", "text", "option", "explanation"].includes(key) &&
          typeof value === "object" &&
          value !== null
        ) {
          console.error(`Found object in text field at ${currentPath}:`, value);
          return false;
        } else if (
          typeof value === "object" &&
          value !== null &&
          !Array.isArray(value)
        ) {
          // Check if it's a simple object with only primitive values
          const hasNestedObjects = Object.values(value).some(
            (v) => typeof v === "object" && v !== null,
          );
          if (hasNestedObjects) {
            console.error(`Found nested object at ${currentPath}:`, value);
            return false;
          }
        }
      }
    }

    return true;
  };

  // Helper function to sanitize MCQ data before passing to modal
  const sanitizeMCQData = (mcq: any) => {
    if (!mcq) return null;

    console.log("Original MCQ data:", JSON.stringify(mcq, null, 2));

    try {
      const sanitizedMCQ = deepSanitizeMCQData(mcq);

      // Validate the sanitized data
      if (!validateNoNestedObjects(sanitizedMCQ)) {
        console.error("Sanitization failed - still contains nested objects");
        return null;
      }

      console.log("Sanitized MCQ data:", JSON.stringify(sanitizedMCQ, null, 2));
      return sanitizedMCQ;
    } catch (error) {
      console.error("Error sanitizing MCQ data:", error);
      return null;
    }
  };

  const handleCreateMCQ = () => {
    try {
      // Check if MCQ already exists for this module
      if (mcqs.length > 0) {
        // MCQ exists, we're adding questions to existing MCQ
        const sanitizedData = sanitizeMCQData(mcqs[0]);
        if (!sanitizedData) {
          alert(
            "Error: Unable to prepare MCQ data. The data contains complex objects that cannot be safely processed.",
          );
          return;
        }
        console.log("Setting selectedMCQ for create mode:", sanitizedData);
        setSelectedMCQ(sanitizedData);
        setManageMode("create");
      } else {
        // No MCQ exists, creating brand new
        setSelectedMCQ(null);
        setManageMode("create");
      }
      setShowManageModal(true);
    } catch (error) {
      console.error("Error in handleCreateMCQ:", error);
      alert("Error preparing MCQ data. Please try again.");
    }
  };

  const handleEditMCQ = (mcq: any) => {
    try {
      const sanitizedData = sanitizeMCQData(mcq);
      if (!sanitizedData) {
        alert(
          "Error: Unable to prepare MCQ data for editing. The data contains complex objects that cannot be safely processed.",
        );
        return;
      }
      console.log("Setting selectedMCQ for edit mode:", sanitizedData);
      setSelectedMCQ(sanitizedData);
      setManageMode("edit");
      setShowManageModal(true);
    } catch (error) {
      console.error("Error in handleEditMCQ:", error);
      alert("Error preparing MCQ data for editing. Please try again.");
    }
  };

  const handleDeleteMCQ = async (mcq: any) => {
    if (window.confirm("Are you sure you want to delete this MCQ?")) {
      try {
        console.log("Deleting MCQ with ID:", mcq.id);

        await apiClient.delete(
          API_ENDPOINTS.INSTRUCTOR.BATCH_COURSE_MODULE_MCQ_BY_ID(
            batch.id,
            course.id,
            module.id,
            mcq.id,
          ),
        );
        fetchMcqs();
      } catch (err) {
        console.error("Error deleting MCQ:", err);
      }
    }
  };

  const handleModalClose = () => {
    setShowManageModal(false);
    // Use setTimeout to ensure state cleanup happens after modal closes
    setTimeout(() => {
      setSelectedMCQ(null);
    }, 100);
  };

  const handleModalSave = () => {
    fetchMcqs();
  };

  useEffect(() => {
    fetchMcqs();
  }, [module.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            MCQ Management
          </h3>
          <button
            onClick={handleCreateMCQ}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>{mcqs.length > 0 ? "Add Questions" : "Create MCQ"}</span>
          </button>
        </div>

        {mcqs.length === 0 ? (
          <div className="text-center py-12">
            <HelpCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h4 className="text-lg font-semibold text-gray-600 mb-2">
              No MCQ Test yet
            </h4>
            <p className="text-gray-500 mb-4">
              Create an MCQ test for this module. Set the pass percentage once,
              then add multiple questions.
            </p>
            <button
              onClick={handleCreateMCQ}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors mx-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Create MCQ Test</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {mcqs.map((mcq, mcqIndex) => (
              <div
                key={mcq.id || mcqIndex}
                className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-4">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <HelpCircle className="w-4 h-4 text-green-600" />
                      </div>
                      <h4 className="font-medium text-gray-900">
                        MCQ Test for Module
                      </h4>
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                        {mcq.questions?.length || 0} Questions
                      </span>
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                        Passing Score: {mcq.passingScore}%
                      </span>
                    </div>

                    {/* Display questions preview */}
                    {mcq.questions && Array.isArray(mcq.questions) && (
                      <div className="space-y-4">
                        {mcq.questions
                          .slice(0, 3)
                          .map((question: any, qIndex: number) => (
                            <div
                              key={qIndex}
                              className="border-l-4 border-green-200 pl-4"
                            >
                              <div className="flex items-center space-x-2 mb-2">
                                <span className="text-sm font-medium text-gray-600">
                                  Question {qIndex + 1}:
                                </span>
                                {question.difficulty && (
                                  <span
                                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                                      question.difficulty === "easy"
                                        ? "bg-green-100 text-green-700"
                                        : question.difficulty === "medium"
                                          ? "bg-yellow-100 text-yellow-700"
                                          : "bg-red-100 text-red-700"
                                    }`}
                                  >
                                    {question.difficulty}
                                  </span>
                                )}
                              </div>
                              <div className="text-gray-700 mb-2 text-sm">
                                <HTMLContentMCQ
                                  content={
                                    question.question ||
                                    "No question text available"
                                  }
                                />
                              </div>
                              {question.options &&
                                Array.isArray(question.options) && (
                                  <div className="space-y-1">
                                    {question.options
                                      .slice(0, 2)
                                      .map((option: any, optIndex: number) => (
                                        <div
                                          key={optIndex}
                                          className="flex items-center space-x-2 text-sm"
                                        >
                                          <div
                                            className={`w-3 h-3 rounded-full border ${
                                              option.is_correct
                                                ? "bg-green-500 border-green-500"
                                                : "border-gray-300"
                                            }`}
                                          >
                                            {option.is_correct && (
                                              <div className="w-1 h-1 bg-white rounded-full m-1"></div>
                                            )}
                                          </div>
                                          <span
                                            className={`${
                                              option.is_correct
                                                ? "text-green-700 font-medium"
                                                : "text-gray-600"
                                            }`}
                                          >
                                            <HTMLContentMCQ
                                              content={
                                                option.text ||
                                                option.option ||
                                                `Option ${optIndex + 1}`
                                              }
                                            />
                                          </span>
                                        </div>
                                      ))}
                                    {question.options.length > 2 && (
                                      <div className="text-xs text-gray-500">
                                        ... and {question.options.length - 2}{" "}
                                        more options
                                      </div>
                                    )}
                                  </div>
                                )}
                            </div>
                          ))}
                        {mcq.questions.length > 3 && (
                          <div className="text-sm text-gray-500 border-l-4 border-gray-200 pl-4">
                            ... and {mcq.questions.length - 3} more questions
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-1 ml-4">
                    <button className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleEditMCQ(mcq)}
                      className="p-2 text-gray-400 hover:text-green-600 rounded-lg hover:bg-green-50 transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteMCQ(mcq)}
                      className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>Total Questions: {mcq.questions?.length || 0}</span>
                    <span>Passing Score: {mcq.passingScore}%</span>
                  </div>
                  <span className="text-xs text-gray-500">
                    MCQ ID: {mcq.id}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showManageModal && (
        <div key={`mcq-modal-${selectedMCQ?.id || "new"}`}>
          {(() => {
            try {
              // Double-check the selectedMCQ data before rendering
              if (selectedMCQ && !validateNoNestedObjects(selectedMCQ)) {
                console.error(
                  "selectedMCQ contains invalid nested objects, showing fallback",
                );
                return (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6">
                      <h3 className="text-xl font-semibold text-red-600 mb-4">
                        Data Error
                      </h3>
                      <p className="text-gray-600 mb-4">
                        The MCQ data contains complex objects that cannot be
                        safely displayed. Please try refreshing the page or
                        contact support.
                      </p>
                      <div className="text-xs text-gray-500 mb-4 bg-gray-100 p-2 rounded">
                        Error: Complex object structures detected in MCQ data
                      </div>
                      <button
                        onClick={handleModalClose}
                        className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <MCQModuleManager
                  isOpen={showManageModal}
                  onClose={handleModalClose}
                  onSave={handleModalSave}
                  module={module}
                  batch={batch}
                  course={course}
                  mcq={selectedMCQ}
                  mode={manageMode}
                />
              );
            } catch (error) {
              console.error("Error rendering MCQModuleManager:", error);
              console.log("SelectedMCQ causing error:", selectedMCQ);
              return (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6">
                    <h3 className="text-xl font-semibold text-red-600 mb-4">
                      Error Loading MCQ Manager
                    </h3>
                    <p className="text-gray-600 mb-4">
                      There was an error loading the MCQ manager. Please try
                      again.
                    </p>
                    <div className="text-xs text-gray-500 mb-4 bg-gray-100 p-2 rounded">
                      {error?.toString() || "Unknown error occurred"}
                    </div>
                    <button
                      onClick={handleModalClose}
                      className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg"
                    >
                      Close
                    </button>
                  </div>
                </div>
              );
            }
          })()}
        </div>
      )}
    </>
  );
};
