import React, { useState, useEffect } from "react";
import { ArrowLeft, Save, X, Plus, Trash2, HelpCircle } from "lucide-react";
import apiClient from "@/utils/axiosInterceptor";
import { API_ENDPOINTS } from "@/config/urls";

interface ManageMCQProps {
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
  mcq?: {
    id: string;
    questions?: any[]; // Array of questions for the entire MCQ
    passingScore?: number;
    // Legacy individual question properties for backward compatibility
    question?: any; // Can be string or rich text object
    options?: any[]; // Can be strings or objects with text/option properties
    correct_answer?: number;
    explanation?: any; // Can be string or rich text object
    difficulty?: "easy" | "medium" | "hard";
    is_correct?: boolean; // For options
  } | null;
  mode: "create" | "edit";
}

const ManageMCQ: React.FC<ManageMCQProps> = ({
  isOpen,
  onClose,
  onSave,
  module,
  batch,
  course,
  mcq,
  mode,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    question: "",
    options: ["", "", "", ""],
    correct_answer: 0,
    explanation: "",
    difficulty: "medium" as "easy" | "medium" | "hard",
  });

  // Helper function to safely extract string content from rich text or plain text
  const extractStringContent = (content: any): string => {
    if (typeof content === "string") {
      return content;
    }
    if (content && typeof content === "object") {
      if (content.ops && Array.isArray(content.ops)) {
        // Quill Delta format
        const plainText = content.ops
          .map((op: any) => (typeof op.insert === "string" ? op.insert : ""))
          .join("");
        return plainText;
      }
      if (content.html && typeof content.html === "string") {
        // HTML format - strip HTML tags for editing
        return content.html.replace(/<[^>]*>/g, "");
      }
      try {
        // Try to stringify if it's an object
        return JSON.stringify(content);
      } catch {
        return "";
      }
    }
    return String(content || "");
  };

  // Helper function to safely extract option text
  const extractOptionText = (option: any): string => {
    if (typeof option === "string") {
      return option;
    }
    if (option && typeof option === "object") {
      if (option.text) return extractStringContent(option.text);
      if (option.option) return extractStringContent(option.option);
      return extractStringContent(option);
    }
    return String(option || "");
  };

  // Initialize form data
  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" && mcq) {
        // Handle new MCQ structure with multiple questions
        if (
          mcq.questions &&
          Array.isArray(mcq.questions) &&
          mcq.questions.length > 0
        ) {
          // For now, edit the first question (we'll need to update this to handle multiple questions properly)
          const firstQuestion = mcq.questions[0];
          const questionText = extractStringContent(firstQuestion.question);
          const optionTexts =
            firstQuestion.options?.map((option: any) =>
              extractOptionText(option),
            ) || [];

          // Ensure we have at least 4 options for the form
          while (optionTexts.length < 4) {
            optionTexts.push("");
          }

          // Find correct answer index
          let correctAnswerIndex = firstQuestion.correct_answer || 0;

          // If options have is_correct property, find the correct one
          if (firstQuestion.options && Array.isArray(firstQuestion.options)) {
            const correctOptionIndex = firstQuestion.options.findIndex(
              (opt: any) => opt.is_correct === true || opt.is_correct === 1,
            );
            if (correctOptionIndex !== -1) {
              correctAnswerIndex = correctOptionIndex;
            }
          }

          setFormData({
            question: questionText,
            options: optionTexts,
            correct_answer: correctAnswerIndex,
            explanation: extractStringContent(firstQuestion.explanation || ""),
            difficulty: firstQuestion.difficulty || "medium",
          });
        } else if (mcq.question) {
          // Legacy individual question format
          const questionText = extractStringContent(mcq.question);
          const optionTexts =
            mcq.options?.map((option: any) => extractOptionText(option)) || [];

          // Ensure we have at least 4 options for the form
          while (optionTexts.length < 4) {
            optionTexts.push("");
          }

          // Find correct answer index
          let correctAnswerIndex = mcq.correct_answer || 0;

          // If options have is_correct property, find the correct one
          if (mcq.options && Array.isArray(mcq.options)) {
            const correctOptionIndex = mcq.options.findIndex(
              (opt: any) => opt.is_correct === true || opt.is_correct === 1,
            );
            if (correctOptionIndex !== -1) {
              correctAnswerIndex = correctOptionIndex;
            }
          }

          setFormData({
            question: questionText,
            options: optionTexts,
            correct_answer: correctAnswerIndex,
            explanation: extractStringContent(mcq.explanation || ""),
            difficulty: mcq.difficulty || "medium",
          });
        }
      } else {
        // For create mode, reset form
        setFormData({
          question: "",
          options: ["", "", "", ""],
          correct_answer: 0,
          explanation: "",
          difficulty: "medium",
        });
      }
      setError("");
    }
  }, [isOpen, mode, mcq]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log("MCQ Form submission started");
    console.log("Form data:", formData);

    // Validation
    const questionText = extractStringContent(formData.question);
    if (!questionText.trim()) {
      setError("Question is required");
      return;
    }

    const validOptions = formData.options.filter(
      (option) => extractStringContent(option).trim() !== "",
    );
    if (validOptions.length < 2) {
      setError("At least 2 options are required");
      return;
    }

    if (formData.correct_answer >= validOptions.length) {
      setError("Please select a valid correct answer");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const payload = {
        questions: [
          {
            question: formData.question.trim(),
            options: validOptions,
            correctAnswer: formData.correct_answer,
            explanation: formData.explanation.trim() || undefined,
            difficulty: formData.difficulty,
          },
        ],
        passingScore: 70,
      };

      if (mode === "create") {
        console.log("Creating MCQ...");
        await apiClient.post(
          API_ENDPOINTS.INSTRUCTOR.BATCH_COURSE_MODULE_MCQ(
            batch.id,
            course.id,
            module.id,
          ),
          payload,
        );
      } else {
        console.log("Updating MCQ...");
        console.log("MCQ ID:", mcq?.id);

        if (!mcq?.id) {
          throw new Error("MCQ ID is required for update operation");
        }

        // For updates, the backend expects the same format as create with questions array
        const updatePayload = {
          questions: [
            {
              question: formData.question.trim(),
              options: validOptions,
              correctAnswer: formData.correct_answer,
              explanation: formData.explanation.trim() || undefined,
              difficulty: formData.difficulty,
            },
          ],
          passingScore: mcq?.passingScore || 70,
        };

        console.log(
          "API Endpoint:",
          API_ENDPOINTS.INSTRUCTOR.BATCH_COURSE_MODULE_MCQ_BY_ID(
            batch.id,
            course.id,
            module.id,
            mcq.id,
          ),
        );
        console.log("Update Payload:", updatePayload);

        await apiClient.put(
          API_ENDPOINTS.INSTRUCTOR.BATCH_COURSE_MODULE_MCQ_BY_ID(
            batch.id,
            course.id,
            module.id,
            mcq.id,
          ),
          updatePayload,
        );
      }

      console.log("MCQ operation successful");
      onSave();
      onClose();
    } catch (err: any) {
      console.error("MCQ operation failed:", err);
      setError(err.response?.data?.message || `Failed to ${mode} MCQ`);
    } finally {
      setLoading(false);
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    setFormData({ ...formData, options: newOptions });
  };

  const addOption = () => {
    if (formData.options.length < 6) {
      setFormData({
        ...formData,
        options: [...formData.options, ""],
      });
    }
  };

  const removeOption = (index: number) => {
    if (formData.options.length > 2) {
      const newOptions = formData.options.filter((_, i) => i !== index);
      setFormData({
        ...formData,
        options: newOptions,
        correct_answer:
          formData.correct_answer >= newOptions.length
            ? 0
            : formData.correct_answer,
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
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
                {mode === "create" ? "Add MCQ" : "Edit MCQ"}
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

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-140px)]"
        >
          {/* Error message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Question */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Question *
            </label>
            <textarea
              value={formData.question}
              onChange={(e) =>
                setFormData({ ...formData, question: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
              placeholder="Enter your question here..."
              rows={3}
              required
            />
          </div>

          {/* Difficulty */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Difficulty Level *
            </label>
            <select
              value={formData.difficulty}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  difficulty: e.target.value as "easy" | "medium" | "hard",
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>

          {/* Options */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">
                Answer Options *
              </label>
              {formData.options.length < 6 && (
                <button
                  type="button"
                  onClick={addOption}
                  className="flex items-center space-x-1 text-sm text-orange-600 hover:text-orange-700"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Option</span>
                </button>
              )}
            </div>

            <div className="space-y-3">
              {formData.options.map((option, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id={`option-${index}`}
                      name="correct_answer"
                      checked={formData.correct_answer === index}
                      onChange={() =>
                        setFormData({ ...formData, correct_answer: index })
                      }
                      className="w-4 h-4 text-orange-600 border-gray-300 focus:ring-orange-500"
                    />
                    <label
                      htmlFor={`option-${index}`}
                      className="ml-2 text-sm text-gray-600"
                    >
                      {String.fromCharCode(65 + index)}
                    </label>
                  </div>

                  <input
                    type="text"
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder={`Option ${String.fromCharCode(65 + index)}`}
                  />

                  {formData.options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeOption(index)}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <p className="text-sm text-gray-500 mt-2">
              Select the radio button next to the correct answer. You can add up
              to 6 options.
            </p>
          </div>

          {/* Explanation */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Explanation (Optional)
            </label>
            <textarea
              value={formData.explanation}
              onChange={(e) =>
                setFormData({ ...formData, explanation: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
              placeholder="Provide an explanation for the correct answer..."
              rows={3}
            />
          </div>

          {/* Form Actions */}
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
                !extractStringContent(formData.question).trim() ||
                formData.options.filter((o) => extractStringContent(o).trim())
                  .length < 2
              }
              className="px-6 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-300 text-white rounded-lg transition-colors flex items-center space-x-2"
            >
              {loading && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              )}
              <Save className="w-4 h-4" />
              <span>{mode === "create" ? "Create" : "Save"} MCQ</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ManageMCQ;
