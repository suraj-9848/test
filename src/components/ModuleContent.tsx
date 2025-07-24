import React, { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { useSession } from "next-auth/react";
import axios from "axios";
import { useModuleStore } from "@/store/moduleStore";
import { useCourseStore } from "@/store/courseStore";
import type {
  CreateDayContentData,
  CreateMCQData,
  MCQQuestion,
  QuillDelta,
} from "@/store/moduleStore";

// Custom Rich Text Editor compatible with React 19
const SafeRichTextEditor: React.FC<{
  value: string;
  onChange: (content: string) => void;
  placeholder: string;
  className?: string;
}> = ({ value, onChange, placeholder, className }) => {
  const [isMounted, setIsMounted] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (editorRef.current && isMounted) {
      if (editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value;
      }
    }
  }, [value, isMounted]);

  const handleInput = () => {
    if (editorRef.current) {
      const content = editorRef.current.innerHTML;
      onChange(content);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      range.insertNode(document.createTextNode(text));
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
      handleInput();
    }
  };

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleInput();
  };

  const insertCode = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const pre = document.createElement("pre");
      pre.style.backgroundColor = "#f1f5f9";
      pre.style.border = "1px solid #e2e8f0";
      pre.style.borderRadius = "4px";
      pre.style.padding = "12px";
      pre.style.margin = "8px 0";
      pre.style.overflow = "auto";
      pre.style.fontFamily = "monospace";
      pre.textContent = "Your code here...";

      range.deleteContents();
      range.insertNode(pre);

      // Place cursor at the end
      range.setStartAfter(pre);
      range.setEndAfter(pre);
      selection.removeAllRanges();
      selection.addRange(range);

      handleInput();
    }
  };

  const insertList = (ordered: boolean) => {
    execCommand(`insert${ordered ? "Ordered" : "Unordered"}List`);
  };

  if (!isMounted) {
    return (
      <div className="border border-slate-300 rounded-lg p-4 bg-white">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full h-48 resize-none border-none outline-none bg-transparent"
          style={{ minHeight: "200px" }}
        />
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="border border-slate-300 rounded-lg bg-white">
        {/* Toolbar */}
        <div className="border-b border-slate-300 p-2 flex flex-wrap gap-1 bg-slate-50 rounded-t-lg">
          <button
            type="button"
            onClick={() => execCommand("bold")}
            className="px-2 py-1 hover:bg-slate-200 rounded text-sm font-medium"
            title="Bold"
          >
            <strong>B</strong>
          </button>
          <button
            type="button"
            onClick={() => execCommand("italic")}
            className="px-2 py-1 hover:bg-slate-200 rounded text-sm italic"
            title="Italic"
          >
            I
          </button>
          <button
            type="button"
            onClick={() => execCommand("underline")}
            className="px-2 py-1 hover:bg-slate-200 rounded text-sm underline"
            title="Underline"
          >
            U
          </button>
          <div className="w-px bg-slate-300 mx-1"></div>
          <button
            type="button"
            onClick={() => execCommand("formatBlock", "h1")}
            className="px-2 py-1 hover:bg-slate-200 rounded text-sm font-bold"
            title="Heading 1"
          >
            H1
          </button>
          <button
            type="button"
            onClick={() => execCommand("formatBlock", "h2")}
            className="px-2 py-1 hover:bg-slate-200 rounded text-sm font-bold"
            title="Heading 2"
          >
            H2
          </button>
          <button
            type="button"
            onClick={() => execCommand("formatBlock", "h3")}
            className="px-2 py-1 hover:bg-slate-200 rounded text-sm font-bold"
            title="Heading 3"
          >
            H3
          </button>
          <div className="w-px bg-slate-300 mx-1"></div>
          <button
            type="button"
            onClick={() => insertList(false)}
            className="px-2 py-1 hover:bg-slate-200 rounded text-sm"
            title="Bullet List"
          >
            •
          </button>
          <button
            type="button"
            onClick={() => insertList(true)}
            className="px-2 py-1 hover:bg-slate-200 rounded text-sm"
            title="Numbered List"
          >
            1.
          </button>
          <div className="w-px bg-slate-300 mx-1"></div>
          <button
            type="button"
            onClick={insertCode}
            className="px-2 py-1 hover:bg-slate-200 rounded text-sm font-mono bg-slate-100"
            title="Code Block"
          >
            {"</>"}
          </button>
          <button
            type="button"
            onClick={() => execCommand("formatBlock", "blockquote")}
            className="px-2 py-1 hover:bg-slate-200 rounded text-sm"
            title="Quote"
          >
            ok
          </button>
          <div className="w-px bg-slate-300 mx-1"></div>
          <button
            type="button"
            onClick={() => execCommand("justifyLeft")}
            className="px-2 py-1 hover:bg-slate-200 rounded text-sm"
            title="Align Left"
          >
            ⫷
          </button>
          <button
            type="button"
            onClick={() => execCommand("justifyCenter")}
            className="px-2 py-1 hover:bg-slate-200 rounded text-sm"
            title="Align Center"
          >
            ⫸
          </button>
          <button
            type="button"
            onClick={() => execCommand("justifyRight")}
            className="px-2 py-1 hover:bg-slate-200 rounded text-sm"
            title="Align Right"
          >
            ⫸
          </button>
        </div>

        {/* Editor */}
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning={true}
          onInput={handleInput}
          onPaste={handlePaste}
          className="p-4 min-h-[200px] outline-none prose prose-sm max-w-none focus:ring-2 focus:ring-blue-500"
          style={{ minHeight: "200px" }}
          data-placeholder={placeholder}
        />
      </div>

      <style jsx>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #94a3b8;
          font-style: italic;
          pointer-events: none;
        }

        [contenteditable] pre {
          background-color: #f1f5f9 !important;
          border: 1px solid #e2e8f0 !important;
          border-radius: 4px !important;
          padding: 12px !important;
          margin: 8px 0 !important;
          overflow: auto !important;
          font-family: "Courier New", monospace !important;
        }

        [contenteditable] blockquote {
          border-left: 4px solid #3b82f6 !important;
          padding-left: 16px !important;
          margin: 16px 0 !important;
          background-color: #eff6ff !important;
          border-radius: 4px !important;
          padding: 12px 16px !important;
        }

        [contenteditable] ul,
        [contenteditable] ol {
          padding-left: 20px !important;
          margin: 8px 0 !important;
        }

        [contenteditable] li {
          margin: 4px 0 !important;
        }

        [contenteditable] h1,
        [contenteditable] h2,
        [contenteditable] : h3 {
          margin: 16px 0 8px !important;
          font-weight: bold !important;
        }

        [contenteditable] h1 {
          font-size: 1.5em !important;
        }

        [contenteditable] h2 {
          font-size: 1.3em !important;
        }

        h3 {
          font-size: 1em !important;
        }
      `}</style>
    </div>
  );
};

// Dynamic import for SSR
const DynamicRichTextEditor = dynamic(
  () => Promise.resolve(SafeRichTextEditor),
  {
    ssr: false,
    loading: () => (
      <div className="h-[200px] bg-slate-100 animate-pulse rounded-lg flex items-center justify-center">
        <span className="text-slate-500">Loading editor...</span>
      </div>
    ),
  }
);

interface ModuleContentProps {
  batchId?: string;
  courseId?: string;
  module?: { id: string; name: string; description: string };
  onClose: () => void;
}

// Day Content Modal Component
const DayContentModal: React.FC<{
  show: boolean;
  content: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
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
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-slate-700">
            {editingDay ? "Edit Day Content" : "Add Day Content"}
          </h3>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
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
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
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
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Title
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, title: e.target.value }))
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Day title..."
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Content
            </label>
            <div className="border border-slate-300 rounded-lg overflow-hidden">
              <DynamicRichTextEditor
                value={formData.content}
                onChange={(content: string) =>
                  setFormData((prev) => ({ ...prev, content }))
                }
                placeholder="Enter day content..."
                className="h-[300px]"
              />
            </div>
          </div>
          <div className="flex items-center justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
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

  const updateQuestion = (
    index: number,
    field: keyof MCQQuestion,
    value: QuillDelta | string | { id: string; text: QuillDelta }[]
  ) => {
    setFormData((prev) => ({
      ...prev,
      questions: prev.questions.map((q, i) =>
        i === index ? { ...q, [field]: value } : q
      ),
    }));
  };

  const removeQuestion = (index: number) => {
    setFormData((prev: CreateMCQData) => ({
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

  // Modified deltaToHtml to handle both Quill deltas and plain HTML
  const deltaToHtml = (
    delta: QuillDelta | string | { ops: { insert: string }[] } | undefined
  ): string => {
    if (!delta) return "";
    if (typeof delta === "string") return delta; // Handle plain HTML from SafeRichTextEditor
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

  // Modified htmlToDelta to store HTML directly or as Quill delta
  const htmlToDelta = (html: string): QuillDelta => {
    return { ops: [{ insert: html }] }; // Store HTML as a single insert operation
  };

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
            <svg
              xmlns="http://www.w3.org/2000/svg"
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
                className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
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
                <span>Add Question</span>
              </button>
            </div>
            {formData.questions.map((question, qIndex) => (
              <div
                key={question.id}
                className="border border-slate-600 rounded-lg p-6 mb-6 bg-slate-50/50"
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
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-4 h-4"
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
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Question Text
                    </label>
                    <div className="border border-slate-300 rounded-lg overflow-hidden">
                      <DynamicRichTextEditor
                        value={deltaToHtml(question.question)}
                        onChange={(content: string) =>
                          updateQuestion(
                            qIndex,
                            "question",
                            htmlToDelta(content)
                          )
                        }
                        placeholder="Enter question..."
                        className="h-[150px]"
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <label className="block text-sm font-medium text-slate-700">
                        Options
                      </label>
                      <button
                        type="button"
                        onClick={() => addOption(qIndex)}
                        className="text-sm text-purple-600 hover:text-purple-700"
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
                            <DynamicRichTextEditor
                              value={deltaToHtml(option.text)}
                              onChange={(content) => {
                                const newOptions = [...question.options];
                                newOptions[oIndex] = {
                                  ...option,
                                  text: htmlToDelta(content),
                                };
                                updateQuestion(qIndex, "options", newOptions);
                              }}
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
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="w-4 h-4"
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
                        )}
                      </div>
                    ))}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Explanation (optional)
                    </label>
                    <div className="border border-slate-300 rounded-lg overflow-hidden">
                      <DynamicRichTextEditor
                        value={deltaToHtml(question.explanation)}
                        onChange={(content: string) =>
                          updateQuestion(
                            qIndex,
                            "explanation",
                            htmlToDelta(content)
                          )
                        }
                        placeholder="Enter explanation..."
                        className="h-[150px]"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              disabled={loading || !formData.questions.length}
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
    null
  );
  const [dayContentForm, setDayContentForm] = useState<CreateDayContentData>({
    content: "",
    dayNumber: 1,
    title: "",
  });
  const [mcqForm, setMCQForm] = useState<CreateMCQData>({
    questions: [],
    passingScore: 70,
  });

  const deltaToHtml = (
    delta: QuillDelta | string | { ops: { insert: string }[] } | undefined
  ): string => {
    if (!delta) return "";
    if (typeof delta === "string") return delta; // Handle plain HTML from SafeRichTextEditor
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

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_BACKEND_BASE_URL || "";
        const googleIdToken = (session as { id_token?: string })?.id_token;
        if (!googleIdToken) {
          console.error("No Google ID token found");
          return;
        }

        const response = await axios({
          method: "post",
          url: `${baseUrl}/api/auth/admin-login`,
          headers: { Authorization: `Bearer ${googleIdToken}` },
          withCredentials: true,
        });
        setBackendJwt(response.data.token);
      } catch (err) {
        console.error("Failed to fetch user profile:", err);
      }
    };

    if (session) fetchProfile();
  }, [session]);

  useEffect(() => {
    if (backendJwt) fetchBatches();
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
      const selectedModuleData = modules.find((m) => m.id === selectedModuleId);
      if (selectedModuleData && selectedModuleData.id !== selectedModule?.id) {
        setSelectedModule(selectedModuleData);
      }
    }
  }, [selectedModuleId, modules, setSelectedModule, selectedModule?.id]);

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
      !selectedModuleId ||
      !selectedModule
    )
      return;

    try {
      if (editingDay && editingDay.id) {
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
      console.error(error);
    }
  };

  const handleEditDay = (day: CreateDayContentData) => {
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
      !backendJwt ||
      !selectedModule
    )
      return;

    if (window.confirm("Are you sure you want to delete this day content?")) {
      try {
        await deleteDayContent(
          selectedBatchId,
          selectedCourseId,
          selectedModuleId,
          dayId,
          backendJwt
        );
      } catch (err) {
        console.error(err);
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
      !selectedModule ||
      !mcqForm.questions.length
    ) {
      return;
    }

    try {
      await createMCQ(
        selectedBatchId,
        selectedCourseId,
        selectedModuleId,
        mcqForm,
        backendJwt
      );
      setShowMCQModal(false);
      setMCQForm({
        questions: [],
        passingScore: 70,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteMCQ = async () => {
    if (
      !selectedModule?.mcq ||
      !selectedBatchId ||
      !selectedCourseId ||
      !selectedModuleId ||
      !backendJwt
    ) {
      return;
    }

    if (window.confirm("Confirm delete MCQ?")) {
      try {
        await deleteMCQ(
          selectedBatchId,
          selectedCourseId,
          selectedModuleId,
          selectedModule.mcq.id,
          backendJwt
        );
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div className="p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-7 w-7 text-white"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
            </svg>
          </div>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Module Content
            </h1>
            <p className="text-slate-600 mt-1">
              Manage your module content and MCQs
            </p>
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
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Select Module</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Batch</label>
            <select
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white text-slate-900"
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
            <label className="block text-sm font-medium text-slate-700 mb-2">Course</label>
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white text-slate-900 disabled:bg-slate-100 disabled:text-slate-500"
              disabled={!selectedBatchId}
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
            <label className="block text-sm font-medium text-slate-700 mb-2">Module</label>
            <select
              value={selectedModuleId}
              onChange={(e) => setSelectedModuleId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white text-slate-900 disabled:bg-slate-100 disabled:text-slate-500"
              disabled={!selectedCourseId}
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

      {/* Tabs */}
      {selectedModule && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Tab Navigation */}
          <div className="flex border-b border-slate-200">
            <button
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === "content"
                  ? "bg-purple-50 text-purple-700 border-b-2 border-purple-600"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
              onClick={() => setActiveTab("content")}
            >
              <div className="flex items-center justify-center space-x-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Day Content</span>
              </div>
            </button>
            <button
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === "mcq"
                  ? "bg-purple-50 text-purple-700 border-b-2 border-purple-600"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
              onClick={() => setActiveTab("mcq")}
            >
              <div className="flex items-center justify-center space-x-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>MCQ Tests</span>
              </div>
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === "content" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-900">Day Content</h3>
                  <button
                    onClick={() => {
                      resetDayContentForm();
                      setShowContentModal(true);
                    }}
                    className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span>Add Day Content</span>
                  </button>
                </div>
                
                {selectedModule.days && selectedModule.days.length > 0 ? (
                  <div className="space-y-4">
                    {selectedModule.days.map((day) => (
                      <div key={day.id} className="bg-slate-50 rounded-xl border border-slate-200 p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h4 className="text-lg font-semibold text-slate-900">
                              Day {day.dayNumber}: {day.title}
                            </h4>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleEditDay(day)}
                              className="flex items-center space-x-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => handleDeleteDay(day.id)}
                              className="flex items-center space-x-1 px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              <span>Delete</span>
                            </button>
                          </div>
                        </div>
                        <div className="prose prose-slate max-w-none">
                          <div dangerouslySetInnerHTML={{ __html: day.content }} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16 text-slate-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 className="text-lg font-medium text-slate-900 mb-2">No content yet</h3>
                    <p className="text-slate-600 mb-4">Start by adding your first day of content for this module.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "mcq" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-900">MCQ Tests</h3>
                  {!selectedModule.mcq && (
                    <button
                      onClick={() => setShowMCQModal(true)}
                      className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      <span>Create MCQ</span>
                    </button>
                  )}
                </div>

                {selectedModule.mcq ? (
                  <div className="bg-slate-50 rounded-xl border border-slate-200 p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 className="text-lg font-semibold text-slate-900">MCQ Test</h4>
                        <p className="text-slate-600">Passing Score: {selectedModule.mcq.passingScore}%</p>
                      </div>
                      <button
                        onClick={handleDeleteMCQ}
                        className="flex items-center space-x-1 px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        <span>Delete</span>
                      </button>
                    </div>
                    
                    <div className="space-y-4">
                      <h5 className="font-medium text-slate-900">Questions ({selectedModule.mcq.questions.length})</h5>
                      {selectedModule.mcq.questions.map((q, i) => (
                        <div key={q.id} className="bg-white rounded-lg border border-slate-200 p-4">
                          <h6 className="font-medium text-slate-900 mb-3">
                            Question {i + 1}: {deltaToHtml(q.question)}
                          </h6>
                          <div className="space-y-2">
                            {q.options.map((opt, optIdx) => (
                              <div key={opt.id} className="flex items-center space-x-2">
                                <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                                  opt.id === q.correctAnswer 
                                    ? "bg-green-100 border-2 border-green-500" 
                                    : "bg-slate-100 border-2 border-slate-300"
                                }`}>
                                  {opt.id === q.correctAnswer && (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-2 h-2 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  )}
                                </div>
                                <span className="text-slate-700">
                                  {String.fromCharCode(65 + optIdx)}. {deltaToHtml(opt.text)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16 text-slate-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="text-lg font-medium text-slate-900 mb-2">No MCQ test yet</h3>
                    <p className="text-slate-600 mb-4">Create your first MCQ test for this module.</p>
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
