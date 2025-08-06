import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Save,
  X,
  Plus,
  Trash2,
  HelpCircle,
  Edit3,
  Settings,
  Check,
} from "lucide-react";
import apiClient from "@/utils/axiosInterceptor";
import { API_ENDPOINTS } from "@/config/urls";

interface MCQModuleManagerProps {
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
    questions?: Array<{
      id?: string;
      question_text?: any;
      question?: any;
      options?: any[];
      correct_option_index?: number;
      correct_answer?: number;
      correct_option?: any;
      difficulty?: string;
      explanation?: any;
    }>;
    passingScore?: number;
  } | null;
  mode: "create" | "edit";
}

interface MCQQuestion {
  id?: string;
  question: string;
  options: string[];
  correct_answer: number;
  explanation?: string;
  difficulty?: "easy" | "medium" | "hard";
}

const MCQModuleManager: React.FC<MCQModuleManagerProps> = ({
  isOpen,
  onClose,
  onSave,
  module,
  batch,
  course,
  mcq,
  mode,
}) => {
  useEffect(() => {
    if (mcq && mcq.questions) {
      console.log("MCQModuleManager received MCQ data:", mcq);

      mcq.questions.forEach((question, qIndex) => {
        if (question.options && Array.isArray(question.options)) {
          question.options.forEach((option, oIndex) => {
            if (typeof option === "object" && option !== null) {
              console.warn(
                `Question ${qIndex}, Option ${oIndex} is an object:`,
                option,
              );
            }
          });
        }
        if (
          typeof question.question === "object" &&
          question.question !== null
        ) {
          console.warn(
            `Question ${qIndex} text is an object:`,
            question.question,
          );
        }
      });
    }
  }, [mcq]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState<"setup" | "questions">(
    mode === "edit" && mcq ? "questions" : "setup",
  );
  const [passingScore, setPassingScore] = useState(mcq?.passingScore || 70);
  const [questions, setQuestions] = useState<MCQQuestion[]>([]);
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(-1);
  const [questionForm, setQuestionForm] = useState<MCQQuestion>({
    question: "",
    options: ["", "", "", ""],
    correct_answer: -1,
    difficulty: "medium",
  });

  const extractOptionText = (option: any): string => {
    if (typeof option === "string") {
      return option;
    }
    if (option && typeof option === "object") {
      return option.text || option.option || option.value || "[Option]";
    }
    return String(option || "[Option]");
  };

  const extractTextContent = (content: any): string => {
    if (typeof content === "string") {
      return content;
    }
    if (content && typeof content === "object") {
      if (content.ops && Array.isArray(content.ops)) {
        return content.ops
          .map((op: any) => (typeof op.insert === "string" ? op.insert : ""))
          .join("");
      }
      if (content.text) {
        return extractTextContent(content.text);
      }
      if (content.question) {
        return extractTextContent(content.question);
      }
      return "[Content]";
    }
    return String(content || "");
  };

  useEffect(() => {
    if (mode === "edit" && mcq?.questions) {
      console.log("Loading MCQ questions:", mcq.questions);

      const formattedQuestions = mcq.questions.map((q: any, index: number) => {
        console.log(`Processing question ${index}:`, q);

        const questionText = extractTextContent(
          q.question_text || q.question || "",
        );

        let options: string[] = [];
        if (Array.isArray(q.options)) {
          options = q.options.map((opt: any) => extractOptionText(opt));
        } else {
          options = ["", "", "", ""]; // Default empty options
        }

        while (options.length < 4) {
          options.push("");
        }

        let correctAnswer = 0;
        if (typeof q.correct_option_index === "number") {
          correctAnswer = q.correct_option_index;
        } else if (typeof q.correct_answer === "number") {
          correctAnswer = q.correct_answer;
        } else if (q.correct_option && options.length > 0) {
          const correctText = extractTextContent(q.correct_option);
          const foundIndex = options.findIndex((opt) => opt === correctText);
          correctAnswer = foundIndex >= 0 ? foundIndex : 0;
        }

        const formattedQuestion = {
          id: q.id || `question-${index}`,
          question: questionText,
          options: options,
          correct_answer: correctAnswer,
          difficulty: q.difficulty || "medium",
          explanation: extractTextContent(q.explanation || ""),
        };

        console.log(`Formatted question ${index}:`, formattedQuestion);
        return formattedQuestion;
      });

      console.log("All formatted questions:", formattedQuestions);
      setQuestions(formattedQuestions);
    }
  }, [mode, mcq]);

  const resetQuestionForm = () => {
    setQuestionForm({
      question: "",
      options: ["", "", "", ""],
      correct_answer: -1,
      difficulty: "medium",
    });
  };

  const handleSetupNext = () => {
    if (passingScore >= 1 && passingScore <= 100) {
      setStep("questions");
      setError("");
    } else {
      setError("Pass percentage must be between 1 and 100");
    }
  };

  const handleAddQuestion = () => {
    resetQuestionForm();
    setCurrentQuestionIndex(questions.length);
    setShowQuestionForm(true);
  };

  const handleEditQuestion = (index: number) => {
    const question = questions[index];
    setQuestionForm({
      question: question.question,
      options: [...question.options],
      correct_answer: question.correct_answer,
      difficulty: question.difficulty || "medium",
      explanation: question.explanation || "",
    });
    setCurrentQuestionIndex(index);
    setShowQuestionForm(true);
  };

  const handleDeleteQuestion = (index: number) => {
    const newQuestions = questions.filter((_, i) => i !== index);
    setQuestions(newQuestions);
  };

  const handleSaveQuestion = () => {
    if (
      !questionForm.question.trim() ||
      questionForm.options.some((opt) => !opt.trim()) ||
      questionForm.correct_answer === -1
    ) {
      setError("Please fill in all fields and select a correct answer");
      return;
    }

    const newQuestion: MCQQuestion = {
      question: questionForm.question.trim(),
      options: questionForm.options.map((opt) => opt.trim()),
      correct_answer: questionForm.correct_answer,
      difficulty: questionForm.difficulty,
      explanation: questionForm.explanation?.trim() || "",
    };

    if (currentQuestionIndex < questions.length) {
      const updatedQuestions = [...questions];
      updatedQuestions[currentQuestionIndex] = newQuestion;
      setQuestions(updatedQuestions);
    } else {
      setQuestions([...questions, newQuestion]);
    }

    setShowQuestionForm(false);
    setError("");
  };

  const handleSubmitMCQ = async () => {
    if (questions.length === 0) {
      setError("Please add at least one question");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const mcqData = {
        passingScore,
        questions: questions.map((q, index) => ({
          question_text: q.question,
          options: q.options,
          correct_option: q.options[q.correct_answer],
          correct_option_index: q.correct_answer,
          difficulty: q.difficulty || "medium",
          explanation: q.explanation || "",
          sequence: index + 1,
        })),
      };

      if (mode === "edit" && mcq?.id) {
        await apiClient.put(
          API_ENDPOINTS.INSTRUCTOR.BATCH_COURSE_MODULE_MCQ_BY_ID(
            batch.id,
            course.id,
            module.id,
            mcq.id,
          ),
          mcqData,
        );
      } else {
        await apiClient.post(
          API_ENDPOINTS.INSTRUCTOR.BATCH_COURSE_MODULE_MCQ(
            batch.id,
            course.id,
            module.id,
          ),
          mcqData,
        );
      }

      onSave();
      onClose();
    } catch (error: any) {
      console.error("Error saving MCQ:", error);
      setError(error.response?.data?.message || "Failed to save MCQ test");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center space-x-4">
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                {mode === "edit" ? "Edit MCQ Test" : "Create MCQ Test"}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {course.title} • {batch.name} • {module.title}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                step === "setup"
                  ? "bg-blue-100 text-blue-700"
                  : "bg-green-100 text-green-700"
              }`}
            >
              {step === "setup" ? "Setup" : "Questions"}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(95vh-180px)]">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 text-red-800 px-4 py-3 rounded-lg mb-6 flex items-center space-x-2">
              <div className="w-5 h-5 bg-red-400 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">!</span>
              </div>
              <span>{error}</span>
            </div>
          )}

          {step === "setup" && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-blue-500 rounded-lg">
                    <Settings className="w-5 h-5 text-white" />
                  </div>
                  <h4 className="text-lg font-semibold text-blue-900">
                    MCQ Test Configuration
                  </h4>
                </div>
                <p className="text-blue-800 text-sm leading-relaxed">
                  Set the pass percentage for this module&apos;s MCQ test.
                  Students need to get this percentage of questions correct to
                  pass. For example, if you set 70% and add 100 questions,
                  students need to answer 70+ questions correctly to pass.
                </p>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Pass Percentage (%) *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={passingScore}
                      onChange={(e) =>
                        setPassingScore(parseInt(e.target.value) || 70)
                      }
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-lg font-medium"
                      placeholder="Enter pass percentage (e.g., 70)"
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <span className="text-gray-500 font-medium">%</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2 flex items-center space-x-1">
                    <span>💡</span>
                    <span>
                      Students must score this percentage or higher to pass the
                      MCQ test
                    </span>
                  </p>
                </div>

                {questions.length > 0 && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h5 className="font-semibold text-gray-900 mb-2">
                      Current Questions Preview
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        <span className="text-gray-600">
                          Total Questions:{" "}
                          <span className="font-medium text-gray-900">
                            {questions.length}
                          </span>
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        <span className="text-gray-600">
                          Required to Pass:{" "}
                          <span className="font-medium text-green-700">
                            {Math.ceil((passingScore / 100) * questions.length)}
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {step === "questions" && (
            <div className="space-y-6">
              {/* MCQ Overview */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-500 rounded-lg">
                      <Check className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-green-900">
                        MCQ Test Configured
                      </h4>
                      <p className="text-green-700 text-sm">
                        Pass percentage: {passingScore}% • Questions:{" "}
                        {questions.length}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setStep("setup")}
                    className="flex items-center space-x-2 px-4 py-2 bg-white border border-green-300 rounded-lg hover:bg-green-50 transition-colors"
                  >
                    <Settings className="w-4 h-4 text-green-600" />
                    <span className="text-green-700 font-medium">
                      Edit Settings
                    </span>
                  </button>
                </div>
              </div>

              {/* Questions Management */}
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                      <HelpCircle className="w-5 h-5 text-gray-600" />
                      <span>Question Management</span>
                    </h4>
                    <button
                      onClick={handleAddQuestion}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors shadow-sm"
                    >
                      <Plus className="w-4 h-4" />
                      <span className="font-medium">Add Question</span>
                    </button>
                  </div>
                </div>

                <div className="p-6">
                  {questions.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <HelpCircle className="w-8 h-8 text-gray-400" />
                      </div>
                      <h5 className="text-lg font-medium text-gray-900 mb-2">
                        No Questions Added Yet
                      </h5>
                      <p className="text-gray-600 mb-4 max-w-md mx-auto">
                        Start building your MCQ test by adding your first
                        question. You can add multiple questions and manage them
                        here.
                      </p>
                      <button
                        onClick={handleAddQuestion}
                        className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors shadow-sm"
                      >
                        <Plus className="w-5 h-5" />
                        <span className="font-medium">
                          Add Your First Question
                        </span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {questions.map((question, index) => (
                        <div
                          key={question.id || index}
                          className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-gray-300 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-3">
                                <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full font-semibold text-sm">
                                  {index + 1}
                                </div>
                                <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                                  Question {index + 1}
                                </span>
                                <span
                                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                                    question.difficulty === "easy"
                                      ? "bg-green-100 text-green-700"
                                      : question.difficulty === "hard"
                                        ? "bg-red-100 text-red-700"
                                        : "bg-yellow-100 text-yellow-700"
                                  }`}
                                >
                                  {question.difficulty || "Medium"}
                                </span>
                              </div>
                              <h5 className="font-semibold text-gray-900 mb-2 leading-relaxed">
                                {extractTextContent(question.question)}
                              </h5>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {question.options?.map(
                                  (option, optionIndex) => {
                                    const optionText =
                                      extractOptionText(option);
                                    return (
                                      <div
                                        key={optionIndex}
                                        className={`p-3 rounded-lg border flex items-center space-x-2 ${
                                          optionIndex ===
                                          question.correct_answer
                                            ? "bg-green-50 border-green-300 text-green-800"
                                            : "bg-gray-50 border-gray-200 text-gray-700"
                                        }`}
                                      >
                                        <div
                                          className={`w-2 h-2 rounded-full ${
                                            optionIndex ===
                                            question.correct_answer
                                              ? "bg-green-500"
                                              : "bg-gray-400"
                                          }`}
                                        ></div>
                                        <span className="font-medium text-sm">
                                          {optionText}
                                        </span>
                                        {optionIndex ===
                                          question.correct_answer && (
                                          <Check className="w-4 h-4 text-green-600 ml-auto" />
                                        )}
                                      </div>
                                    );
                                  },
                                )}
                              </div>
                            </div>
                            <div className="flex items-center space-x-2 ml-4">
                              <button
                                onClick={() => handleEditQuestion(index)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Edit Question"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteQuestion(index)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete Question"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Question Form Modal */}
          {showQuestionForm && (
            <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-60 p-4 backdrop-blur-sm">
              <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden border border-gray-200">
                <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-500 rounded-lg">
                      <HelpCircle className="w-5 h-5 text-white" />
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900">
                      {currentQuestionIndex < questions.length
                        ? "Edit Question"
                        : "Add New Question"}
                    </h4>
                  </div>
                  <button
                    onClick={() => setShowQuestionForm(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-6 overflow-y-auto max-h-[calc(85vh-140px)]">
                  <div className="space-y-6">
                    {/* Question Text */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Question *
                      </label>
                      <textarea
                        value={questionForm.question}
                        onChange={(e) =>
                          setQuestionForm({
                            ...questionForm,
                            question: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-base"
                        rows={3}
                        placeholder="Enter your question here..."
                      />
                    </div>

                    {/* Difficulty Level */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Difficulty Level
                      </label>
                      <div className="flex space-x-3">
                        {(["easy", "medium", "hard"] as const).map((level) => (
                          <button
                            key={level}
                            onClick={() =>
                              setQuestionForm({
                                ...questionForm,
                                difficulty: level,
                              })
                            }
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                              questionForm.difficulty === level
                                ? level === "easy"
                                  ? "bg-green-100 text-green-700 border-2 border-green-300"
                                  : level === "medium"
                                    ? "bg-yellow-100 text-yellow-700 border-2 border-yellow-300"
                                    : "bg-red-100 text-red-700 border-2 border-red-300"
                                : "bg-gray-100 text-gray-600 border-2 border-gray-200 hover:bg-gray-200"
                            }`}
                          >
                            {level.charAt(0).toUpperCase() + level.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Options */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Answer Options *
                      </label>
                      <div className="space-y-3">
                        {questionForm.options.map((option, index) => (
                          <div
                            key={index}
                            className={`flex items-center space-x-3 p-3 border-2 rounded-xl transition-all ${
                              questionForm.correct_answer === index
                                ? "border-green-300 bg-green-50"
                                : "border-gray-200 bg-white hover:border-gray-300"
                            }`}
                          >
                            <div className="flex items-center">
                              <input
                                type="radio"
                                name="correct_answer"
                                checked={questionForm.correct_answer === index}
                                onChange={() =>
                                  setQuestionForm({
                                    ...questionForm,
                                    correct_answer: index,
                                  })
                                }
                                className="w-5 h-5 text-green-600 focus:ring-green-500"
                              />
                            </div>
                            <div className="flex-1">
                              <input
                                type="text"
                                value={option}
                                onChange={(e) => {
                                  const newOptions = [...questionForm.options];
                                  newOptions[index] = e.target.value;
                                  setQuestionForm({
                                    ...questionForm,
                                    options: newOptions,
                                  });
                                }}
                                className="w-full px-3 py-2 border-0 bg-transparent focus:outline-none text-gray-800 font-medium"
                                placeholder={`Option ${String.fromCharCode(
                                  65 + index,
                                )}`}
                              />
                            </div>
                            {questionForm.correct_answer === index && (
                              <div className="flex items-center space-x-1 text-green-600">
                                <span className="text-xs font-medium">
                                  Correct
                                </span>
                                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                                  <span className="text-white text-xs">✓</span>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-xs text-blue-800 flex items-center space-x-2">
                          <span>💡</span>
                          <span>
                            Click the radio button to mark the correct answer
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
                  <button
                    onClick={() => setShowQuestionForm(false)}
                    className="px-5 py-2.5 text-gray-600 hover:text-gray-800 border-2 border-gray-300 hover:border-gray-400 rounded-lg hover:bg-white transition-all duration-200 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveQuestion}
                    disabled={
                      !questionForm.question.trim() ||
                      questionForm.options.some((opt) => !opt.trim()) ||
                      questionForm.correct_answer === -1
                    }
                    className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-lg transition-all duration-200 font-medium shadow-sm hover:shadow-md transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed"
                  >
                    {currentQuestionIndex < questions.length
                      ? "Update Question"
                      : "Add Question"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
          <div className="flex items-center space-x-3">
            {step === "questions" && questions.length > 0 && (
              <div className="flex items-center space-x-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg px-3 py-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>
                  {questions.length} question{questions.length > 1 ? "s" : ""}
                </span>
                <span className="text-gray-400">•</span>
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>{passingScore}% pass rate</span>
              </div>
            )}
            {step === "setup" && (
              <div className="flex items-center space-x-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg px-3 py-2">
                <Settings className="w-4 h-4 text-blue-500" />
                <span>Configuring MCQ test settings</span>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 text-gray-600 hover:text-gray-800 border-2 border-gray-300 hover:border-gray-400 rounded-lg hover:bg-white transition-all duration-200 font-medium"
            >
              Cancel
            </button>

            {step === "setup" ? (
              <button
                onClick={handleSetupNext}
                disabled={
                  !passingScore || passingScore < 1 || passingScore > 100
                }
                className="px-6 py-2.5 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-lg transition-all duration-200 font-medium shadow-sm hover:shadow-md transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed"
              >
                Next: Add Questions
              </button>
            ) : (
              <button
                onClick={handleSubmitMCQ}
                disabled={loading || questions.length === 0}
                className="flex items-center space-x-2 px-6 py-2.5 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-lg transition-all duration-200 font-medium shadow-sm hover:shadow-md transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed"
              >
                {loading && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                )}
                <Save className="w-4 h-4" />
                <span>
                  {mode === "edit" ? "Update MCQ Test" : "Save MCQ Test"}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MCQModuleManager;
