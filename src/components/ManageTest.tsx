"use client";

import React, { useEffect, useState, useRef } from "react";
import RichTextEditor, { RichTextEditorHandle } from "./RichTextEditor";
import {
  fetchTests,
  updateTest,
  deleteTest,
  publishTest,
  addQuestionToTest,
  updateQuestionInTest,
  deleteQuestionFromTest,
  getQuestions,
} from "../api/testApi";
import { instructorApi, Test, Batch, Course } from "../api/instructorApi";
import {
  CreateQuestionRequestLocal,
  Question,
  QuestionFormData,
  TestCase,
  UpdateTestPayload,
  SUPPORTED_LANGUAGES,
} from "../types/helperInterfaces";
import { createDemoFiles } from "@/types/createDemoFiles";
import "../styles/ManageTest.css";

const ManageTest: React.FC = () => {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedBatch, setSelectedBatch] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [tests, setTests] = useState<Test[]>([]);
  const [selectedTestId, setSelectedTestId] = useState<string>("");

  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editMaxMarks, setEditMaxMarks] = useState<number>(1);
  const [editPassingMarks, setEditPassingMarks] = useState<number>(0);
  const [editDuration, setEditDuration] = useState<number>(1);
  const [editStartDate, setEditStartDate] = useState<string>("");
  const [editEndDate, setEditEndDate] = useState<string>("");
  const [editShuffleQuestions, setEditShuffleQuestions] =
    useState<boolean>(false);
  const [editShowResults, setEditShowResults] = useState<boolean>(false);
  const [editShowCorrectAnswers, setEditShowCorrectAnswers] =
    useState<boolean>(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeTab, setActiveTab] = useState<"tests" | "questions">("tests");
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [selectedTestForQuestions, setSelectedTestForQuestions] =
    useState<string>("");

  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionEditTestId, setQuestionEditTestId] = useState<string>("");
  const [uploadStatus, setUploadStatus] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);

  const [questionForm, setQuestionForm] = useState<QuestionFormData>({
    question_text: "",
    type: "MCQ",
    marks: 1,
    options: [{ text: "", correct: false }],
    expectedWordCount: undefined,
    codeLanguage: "javascript",
    constraints: "",
    visible_testcases: [{ input: "", expected_output: "" }],
    hidden_testcases: [{ input: "", expected_output: "" }],
    time_limit_ms: 5000,
    memory_limit_mb: 256,
  });

  const [editingQuestionId, setEditingQuestionId] = useState<string>("");
  const editorRef = useRef<RichTextEditorHandle>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Effects
  useEffect(() => {
    instructorApi
      .getBatches()
      .then((res) => {
        setBatches(res.batches || []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to fetch batches");
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (selectedBatch) {
      setLoading(true);
      instructorApi
        .getCourses()
        .then((res) => {
          const coursesArray = res?.courses || res || [];

          if (!Array.isArray(coursesArray)) {
            console.error("Courses data is not an array:", coursesArray);
            setCourses([]);
            setLoading(false);
            return;
          }

          const batchIdStr = String(selectedBatch);
          const filtered = coursesArray.filter((course: any) => {
            if (String(course.batch_id) === batchIdStr) return true;
            if (course.batchId && String(course.batchId) === batchIdStr)
              return true;
            if (
              course.batch &&
              course.batch.id &&
              String(course.batch.id) === batchIdStr
            )
              return true;
            return false;
          });

          const sortedCourses = filtered.length === 0 ? coursesArray : filtered;
          setCourses(
            sortedCourses.sort((a: any, b: any) =>
              a.title.localeCompare(b.title),
            ),
          );
          setLoading(false);
        })
        .catch((err) => {
          console.error("Error fetching courses:", err);
          setError(err.message || "Failed to fetch courses");
          setLoading(false);
        });
    } else {
      setCourses([]);
      setSelectedCourse("");
    }
  }, [selectedBatch]);

  useEffect(() => {
    if (selectedBatch && selectedCourse) {
      setLoading(true);
      fetchTests(selectedBatch, selectedCourse)
        .then((res) => {
          const safeTests = Array.isArray(res?.data?.tests)
            ? res.data.tests
            : [];
          setTests(
            safeTests.sort((a: Test, b: Test) =>
              a.title.localeCompare(b.title),
            ),
          );
          setLoading(false);
        })
        .catch((err) => {
          setError(err.message || "Failed to fetch tests");
          setLoading(false);
        });
    } else {
      setTests([]);
    }
  }, [selectedBatch, selectedCourse]);

  // Utility functions
  function utcToLocalDatetimeInput(isoString: string | undefined): string {
    if (!isoString) return "";
    const date = new Date(isoString);
    const pad = (n: number) => n.toString().padStart(2, "0");
    const yyyy = date.getFullYear();
    const mm = pad(date.getMonth() + 1);
    const dd = pad(date.getDate());
    const hh = pad(date.getHours());
    const min = pad(date.getMinutes());
    return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
  }

  function localDatetimeInputToUTC(localString: string): string {
    if (!localString) return "";
    const localDate = new Date(localString);
    return localDate.toISOString();
  }

  const downloadDemoFile = (format: "txt" | "json") => {
    const { demoTxtContent, demoJsonContent } = createDemoFiles();

    const content =
      format === "json"
        ? JSON.stringify(demoJsonContent, null, 2)
        : demoTxtContent;

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `demo_testcases.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setUploadStatus({
      type: "success",
      message: `Demo ${format.toUpperCase()} file downloaded successfully!`,
    });
  };

  const parseCustomFormat = (content: string) => {
    const lines = content
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line);
    const visible_testcases: TestCase[] = [];
    const hidden_testcases: TestCase[] = [];

    let currentSection: "VISIBLE" | "HIDDEN" | null = null;
    let currentInput = "";
    let currentOutput = "";
    let parsingMode: "INPUT" | "OUTPUT" | null = null;

    for (const line of lines) {
      if (line === "VISIBLE") {
        if (currentInput && currentOutput && currentSection) {
          const testCase = {
            input: currentInput.trim(),
            expected_output: currentOutput.trim(),
          };
          if (currentSection === "VISIBLE") {
            visible_testcases.push(testCase);
          } else {
            hidden_testcases.push(testCase);
          }
        }
        currentSection = "VISIBLE";
        currentInput = "";
        currentOutput = "";
        parsingMode = null;
        continue;
      }

      if (line === "HIDDEN") {
        if (currentInput && currentOutput && currentSection) {
          const testCase = {
            input: currentInput.trim(),
            expected_output: currentOutput.trim(),
          };
          if (currentSection === "VISIBLE") {
            visible_testcases.push(testCase);
          } else {
            hidden_testcases.push(testCase);
          }
        }
        currentSection = "HIDDEN";
        currentInput = "";
        currentOutput = "";
        parsingMode = null;
        continue;
      }

      if (line === "INPUT:") {
        if (currentInput && currentOutput && currentSection) {
          const testCase = {
            input: currentInput.trim(),
            expected_output: currentOutput.trim(),
          };
          if (currentSection === "VISIBLE") {
            visible_testcases.push(testCase);
          } else {
            hidden_testcases.push(testCase);
          }
        }
        currentInput = "";
        currentOutput = "";
        parsingMode = "INPUT";
        continue;
      }

      if (line === "OUTPUT:") {
        parsingMode = "OUTPUT";
        continue;
      }

      if (parsingMode === "INPUT") {
        currentInput += (currentInput ? "\n" : "") + line;
      } else if (parsingMode === "OUTPUT") {
        currentOutput += (currentOutput ? "\n" : "") + line;
      }
    }

    if (currentInput && currentOutput && currentSection) {
      const testCase = {
        input: currentInput.trim(),
        expected_output: currentOutput.trim(),
      };
      if (currentSection === "VISIBLE") {
        visible_testcases.push(testCase);
      } else {
        hidden_testcases.push(testCase);
      }
    }

    return { visible_testcases, hidden_testcases };
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploadStatus({ type: "info", message: "Processing file..." });

      const content = await file.text();
      let parsedData;
      if (file.name.endsWith(".json")) {
        parsedData = JSON.parse(content);
      } else {
        parsedData = parseCustomFormat(content);
      }

      if (!parsedData.visible_testcases || !parsedData.hidden_testcases) {
        throw new Error(
          "Invalid file format. Missing visible_testcases or hidden_testcases.",
        );
      }

      if (
        !Array.isArray(parsedData.visible_testcases) ||
        !Array.isArray(parsedData.hidden_testcases)
      ) {
        throw new Error("Test cases must be arrays.");
      }

      const visibleTestCases =
        parsedData.visible_testcases.length > 0
          ? parsedData.visible_testcases
          : [{ input: "", expected_output: "" }];

      const hiddenTestCases =
        parsedData.hidden_testcases.length > 0
          ? parsedData.hidden_testcases
          : [{ input: "", expected_output: "" }];

      setQuestionForm((prev) => ({
        ...prev,
        visible_testcases: visibleTestCases,
        hidden_testcases: hiddenTestCases,
      }));

      setUploadStatus({
        type: "success",
        message: `Successfully loaded ${visibleTestCases.length} visible and ${hiddenTestCases.length} hidden test cases!`,
      });

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      setUploadStatus({
        type: "error",
        message: `Failed to parse file: ${error instanceof Error ? error.message : "Unknown error"}`,
      });
    }
  };

  // Question management functions
  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    const html = editorRef.current?.getContent() || "";

    if (!html || !html.replace(/<[^>]+>/g, "").trim()) {
      setLoading(false);
      setError("Question text cannot be empty.");
      return;
    }

    if (questionForm.type === "CODE") {
      if (!questionForm.codeLanguage) {
        setLoading(false);
        setError("Programming language is required for coding questions.");
        return;
      }

      const hasEmptyVisibleTestCase = questionForm.visible_testcases.some(
        (tc) => !tc.input.trim() || !tc.expected_output.trim(),
      );
      const hasEmptyHiddenTestCase = questionForm.hidden_testcases.some(
        (tc) => !tc.input.trim() || !tc.expected_output.trim(),
      );

      if (hasEmptyVisibleTestCase || hasEmptyHiddenTestCase) {
        setLoading(false);
        setError("All test cases must have input and expected output.");
        return;
      }
    }

    try {
      const payload: CreateQuestionRequestLocal = {
        question_text: html,
        type: questionForm.type,
        marks: questionForm.marks,
      };

      if (questionForm.type === "MCQ") {
        payload.options = questionForm.options;
      }

      if (
        questionForm.type === "DESCRIPTIVE" &&
        questionForm.expectedWordCount
      ) {
        payload.expectedWordCount = questionForm.expectedWordCount;
      }

      if (questionForm.type === "CODE") {
        payload.codeLanguage = questionForm.codeLanguage;
        payload.constraints = questionForm.constraints;
        payload.visible_testcases = questionForm.visible_testcases;
        payload.hidden_testcases = questionForm.hidden_testcases;
        payload.time_limit_ms = questionForm.time_limit_ms;
        payload.memory_limit_mb = questionForm.memory_limit_mb;

        if (questionForm.expectedWordCount) {
          payload.expectedWordCount = questionForm.expectedWordCount;
        }
      }

      if (editingQuestionId) {
        await updateQuestionInTest(
          selectedBatch,
          selectedCourse,
          questionEditTestId,
          editingQuestionId,
          payload as any,
        );
        setSuccess("Question updated successfully!");
      } else {
        await addQuestionToTest(
          selectedBatch,
          selectedCourse,
          questionEditTestId,
          payload as any,
        );
        setSuccess("Question added successfully!");
      }

      const res = await getQuestions(
        selectedBatch,
        selectedCourse,
        questionEditTestId,
      );
      setQuestions(
        Array.isArray(res.data?.questions) ? res.data.questions : [],
      );

      clearQuestionForm();
      setShowQuestionForm(false);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to save question");
      }
    } finally {
      setLoading(false);
    }
  };

  const clearQuestionForm = () => {
    setQuestionForm({
      question_text: "",
      type: "MCQ",
      marks: 1,
      options: [{ text: "", correct: false }],
      expectedWordCount: undefined,
      codeLanguage: "javascript",
      constraints: "",
      visible_testcases: [{ input: "", expected_output: "" }],
      hidden_testcases: [{ input: "", expected_output: "" }],
      time_limit_ms: 5000,
      memory_limit_mb: 256,
    });
    setEditingQuestionId("");
    editorRef.current?.setContent("");
    setUploadStatus(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleEditQuestion = (q: Question) => {
    const parseTestCasesForEdit = (
      testCases: any,
      fieldName: string,
    ): TestCase[] => {
      if (!testCases) {
        return [{ input: "", expected_output: "" }];
      }

      if (Array.isArray(testCases)) {
        return testCases.length > 0
          ? testCases
          : [{ input: "", expected_output: "" }];
      }

      if (typeof testCases === "string") {
        try {
          const parsed = JSON.parse(testCases);
          if (Array.isArray(parsed)) {
            return parsed.length > 0
              ? parsed
              : [{ input: "", expected_output: "" }];
          }
        } catch (error) {
          console.error(`Failed to parse ${fieldName}:`, error);
        }
      }

      return [{ input: "", expected_output: "" }];
    };

    const visibleTestCases = parseTestCasesForEdit(
      q.visible_testcases,
      "VISIBLE_TESTCASES",
    );
    const hiddenTestCases = parseTestCasesForEdit(
      q.hidden_testcases,
      "HIDDEN_TESTCASES",
    );

    setQuestionForm({
      question_text: q.question_text,
      type: q.type,
      marks: q.marks,
      options: q.options
        ? q.options.map((o) => ({ text: o.text, correct: o.correct }))
        : [{ text: "", correct: false }],
      expectedWordCount: q.expectedWordCount,
      codeLanguage: q.codeLanguage || "javascript",
      constraints: q.constraints || "",
      visible_testcases: visibleTestCases,
      hidden_testcases: hiddenTestCases,
      time_limit_ms: q.time_limit_ms || 5000,
      memory_limit_mb: q.memory_limit_mb || 256,
    });

    setEditingQuestionId(q.id);
    editorRef.current?.setContent(q.question_text || "");
    setShowQuestionForm(true);
  };

  // Test case management functions
  const addTestCase = (type: "visible_testcases" | "hidden_testcases") => {
    setQuestionForm((prev) => ({
      ...prev,
      [type]: [...prev[type], { input: "", expected_output: "" }],
    }));
  };

  const removeTestCase = (
    type: "visible_testcases" | "hidden_testcases",
    index: number,
  ) => {
    const testCases = questionForm[type];
    if (testCases.length > 1) {
      setQuestionForm((prev) => ({
        ...prev,
        [type]: testCases.filter((_, i) => i !== index),
      }));
    }
  };

  const updateTestCase = (
    type: "visible_testcases" | "hidden_testcases",
    index: number,
    field: "input" | "expected_output",
    value: string,
  ) => {
    const testCases = questionForm[type];
    setQuestionForm((prev) => ({
      ...prev,
      [type]: testCases.map((tc, i) =>
        i === index ? { ...tc, [field]: value } : tc,
      ),
    }));
  };

  // Handler functions
  const handleSelectTest = (testId: string) => {
    const test = tests.find((t) => t.id === testId);
    setSelectedTestId(testId);
    setEditTitle(test?.title || "");
    setEditDescription(test?.description || "");
    setEditMaxMarks(typeof test?.maxMarks === "number" ? test.maxMarks : 1);
    setEditPassingMarks(
      typeof test?.passingMarks === "number" ? test.passingMarks : 0,
    );
    setEditDuration(
      typeof test?.durationInMinutes === "number" ? test.durationInMinutes : 1,
    );
    setEditStartDate(
      test?.startDate ? utcToLocalDatetimeInput(test.startDate) : "",
    );
    setEditEndDate(test?.endDate ? utcToLocalDatetimeInput(test.endDate) : "");
    setEditShuffleQuestions(!!test?.shuffleQuestions);
    setEditShowResults(!!test?.showResults);
    setEditShowCorrectAnswers(!!test?.showCorrectAnswers);
    setError("");
    setSuccess("");
  };

  const handleUpdateTest = async () => {
    if (!selectedTestId) return;
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const selectedTest = tests.find((t) => t.id === selectedTestId);
      if (!selectedTest) throw new Error("Selected test not found");
      const isPublished = selectedTest.status === "PUBLISHED";
      let payload: UpdateTestPayload;
      if (isPublished) {
        if (!editStartDate || !editEndDate) {
          throw new Error(
            "Both start and end date/time are required for published tests.",
          );
        }
        const startDateISO = localDatetimeInputToUTC(editStartDate) || "";
        const endDateISO = localDatetimeInputToUTC(editEndDate) || "";
        payload = {
          title: selectedTest?.title || "",
          description: selectedTest?.description || "",
          maxMarks: selectedTest?.maxMarks ?? 1,
          passingMarks: selectedTest?.passingMarks ?? 0,
          durationInMinutes: selectedTest?.durationInMinutes ?? 1,
          startDate: startDateISO,
          endDate: endDateISO,
          shuffleQuestions: selectedTest?.shuffleQuestions ?? false,
          showResults: selectedTest?.showResults ?? false,
          showCorrectAnswers: selectedTest?.showCorrectAnswers ?? false,
        };
      } else {
        payload = {
          title: editTitle,
          description: editDescription,
          maxMarks: editMaxMarks,
          passingMarks: editPassingMarks,
          durationInMinutes: editDuration,
          startDate: localDatetimeInputToUTC(editStartDate || ""),
          endDate: localDatetimeInputToUTC(editEndDate || ""),
          shuffleQuestions: editShuffleQuestions,
          showResults: editShowResults,
          showCorrectAnswers: editShowCorrectAnswers,
        };
      }
      await updateTest(selectedBatch, selectedCourse, selectedTestId, payload);
      setSuccess("Test updated successfully!");
      const updatedTests = await fetchTests(selectedBatch, selectedCourse);
      setTests(
        Array.isArray(updatedTests?.data?.tests) ? updatedTests.data.tests : [],
      );
      setSelectedTestId("");
      setEditTitle("");
      setEditDescription("");
      setEditMaxMarks(1);
      setEditPassingMarks(0);
      setEditDuration(1);
      setEditStartDate("");
      setEditEndDate("");
      setEditShuffleQuestions(false);
      setEditShowResults(false);
      setEditShowCorrectAnswers(false);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to update test");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTest = async (testId: string) => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      await deleteTest(selectedBatch, selectedCourse, testId);
      setSuccess("Test deleted successfully!");
      setSelectedTestId("");
      const updatedTests = await fetchTests(selectedBatch, selectedCourse);
      setTests(
        Array.isArray(updatedTests?.data?.tests) ? updatedTests.data.tests : [],
      );
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to delete test");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleManageQuestions = async (testId: string) => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await getQuestions(selectedBatch, selectedCourse, testId);
      const questionsArr = Array.isArray(res.data?.questions)
        ? res.data.questions
        : [];

      setQuestions(questionsArr);
      setQuestionEditTestId(testId);
      setSelectedTestForQuestions(testId);
      setActiveTab("questions");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to fetch questions");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteQuestion = async (qid: string) => {
    setLoading(true);
    setError("");
    try {
      await deleteQuestionFromTest(
        selectedBatch,
        selectedCourse,
        questionEditTestId,
        qid,
      );
      const res = await getQuestions(
        selectedBatch,
        selectedCourse,
        questionEditTestId,
      );
      setQuestions(
        Array.isArray(res.data?.questions) ? res.data.questions : [],
      );
      setSuccess("Question deleted successfully!");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to delete question");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOptionChange = (
    idx: number,
    field: "text" | "correct",
    value: string | boolean,
  ) => {
    setQuestionForm((prev) => {
      const options = [...prev.options];
      options[idx] = { ...options[idx], [field]: value };
      return { ...prev, options };
    });
  };

  const handleAddOption = () => {
    setQuestionForm((prev) => ({
      ...prev,
      options: [...prev.options, { text: "", correct: false }],
    }));
  };

  const handleRemoveOption = (idx: number) => {
    setQuestionForm((prev) => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== idx),
    }));
  };

  const handlePublishTest = async (testId: string) => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await getQuestions(selectedBatch, selectedCourse, testId);
      const testQuestions = Array.isArray(res.data?.questions)
        ? res.data.questions
        : [];
      if (testQuestions.length === 0) {
        setError("Cannot publish: Test must have at least one question.");
        setLoading(false);
        return;
      }
      const mcqWithNoCorrect = testQuestions.filter(
        (q: { type: string; options?: { correct: boolean }[] }) =>
          q.type === "MCQ" &&
          (!q.options || q.options.filter((o) => o.correct).length === 0),
      );
      if (mcqWithNoCorrect.length > 0) {
        setError(
          "Cannot publish: All MCQ questions must have at least one correct answer.",
        );
        setLoading(false);
        return;
      }
      await publishTest(selectedBatch, selectedCourse, testId);
      setSuccess("Test published successfully!");
      const updatedTests = await fetchTests(selectedBatch, selectedCourse);
      setTests(
        Array.isArray(updatedTests?.data?.tests) ? updatedTests.data.tests : [],
      );
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to publish test");
      }
    } finally {
      setLoading(false);
    }
  };

  const renderQuestionList = () => {
    if (questions.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📝</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No questions yet
          </h3>
          <p className="text-gray-500 mb-6">
            Get started by adding your first question
          </p>
          <button
            onClick={() => setShowQuestionForm(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add Question
          </button>
        </div>
      );
    }

    return questions.map((q) => {
      const parseTestCasesForDisplay = (
        testCases: any,
        fieldName: string,
      ): TestCase[] => {
        if (!testCases) return [];
        if (Array.isArray(testCases)) return testCases;
        if (typeof testCases === "string") {
          try {
            const parsed = JSON.parse(testCases);
            return Array.isArray(parsed) ? parsed : [];
          } catch {
            return [];
          }
        }
        return [];
      };

      const visibleTestCases = parseTestCasesForDisplay(
        q.visible_testcases,
        "visible",
      );
      const hiddenTestCases = parseTestCasesForDisplay(
        q.hidden_testcases,
        "hidden",
      );

      return (
        <div
          key={q.id}
          className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  q.type === "MCQ"
                    ? "bg-green-100 text-green-800"
                    : q.type === "DESCRIPTIVE"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-purple-100 text-purple-800"
                }`}
              >
                {q.type}
              </span>
              {q.type === "CODE" && q.codeLanguage && (
                <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs">
                  {q.codeLanguage.toUpperCase()}
                </span>
              )}
              <span className="text-sm text-gray-600 font-medium">
                {q.marks} marks
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleEditQuestion(q)}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Edit
              </button>
              <button
                onClick={() => handleDeleteQuestion(q.id)}
                className="text-red-600 hover:text-red-800 text-sm font-medium"
              >
                Delete
              </button>
            </div>
          </div>

          <div
            dangerouslySetInnerHTML={{ __html: q.question_text }}
            className="prose prose-sm max-w-none mb-4"
          />

          {/* MCQ Options */}
          {q.options && q.options.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                Options:
              </h4>
              <div className="space-y-2">
                {q.options.map((opt, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center text-sm p-2 rounded ${
                      opt.correct
                        ? "bg-green-100 text-green-800 font-medium"
                        : "text-gray-600"
                    }`}
                  >
                    <span className="w-6 h-6 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center text-xs mr-3">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    {opt.text}
                    {opt.correct && (
                      <svg
                        className="w-4 h-4 ml-auto text-green-600"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Coding Question Details */}
          {q.type === "CODE" && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="flex flex-wrap gap-4 text-sm">
                <span className="text-gray-600">
                  <span className="font-medium">Time:</span>{" "}
                  {q.time_limit_ms || 5000}ms
                </span>
                <span className="text-gray-600">
                  <span className="font-medium">Memory:</span>{" "}
                  {q.memory_limit_mb || 256}MB
                </span>
                <span
                  className={`${visibleTestCases.length === 0 ? "text-red-600 font-bold" : "text-gray-600"}`}
                >
                  <span className="font-medium">Visible Cases:</span>{" "}
                  {visibleTestCases.length}
                  {visibleTestCases.length === 0 && " ⚠️"}
                </span>
                <span
                  className={`${hiddenTestCases.length === 0 ? "text-red-600 font-bold" : "text-gray-600"}`}
                >
                  <span className="font-medium">Hidden Cases:</span>{" "}
                  {hiddenTestCases.length}
                  {hiddenTestCases.length === 0 && " ⚠️"}
                </span>
              </div>

              {q.constraints && (
                <div>
                  <span className="text-sm font-medium text-gray-700">
                    Constraints:
                  </span>
                  <p className="text-sm text-gray-600 mt-1">
                    {q.constraints.length > 100
                      ? `${q.constraints.substring(0, 100)}...`
                      : q.constraints}
                  </p>
                </div>
              )}

              {visibleTestCases.length === 0 &&
                hiddenTestCases.length === 0 && (
                  <div className="bg-red-50 border border-red-200 rounded p-3 text-red-800 text-sm font-medium">
                    🚨 CRITICAL: This coding question has no test cases defined!
                  </div>
                )}
            </div>
          )}

          {/* Descriptive Question Details */}
          {q.type === "DESCRIPTIVE" && q.expectedWordCount && (
            <div className="text-sm text-gray-600">
              <span className="font-medium">Expected Word Count:</span>{" "}
              {q.expectedWordCount}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-2xl font-bold text-gray-900">Test Management</h1>
        <p className="text-gray-600 mt-1">
          Create, manage, and publish tests for your courses
        </p>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Batch and Course Selectors */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Select Course
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Batch
              </label>
              <select
                value={selectedBatch}
                onChange={(e) => setSelectedBatch(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Choose a Batch</option>
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
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={!selectedBatch}
              >
                <option value="">Choose a Course</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {selectedBatch && selectedCourse && (
          <div className="bg-white rounded-lg border border-gray-200 mb-6">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6">
                <button
                  onClick={() => setActiveTab("tests")}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === "tests"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  Tests
                </button>
                <button
                  onClick={() => setActiveTab("questions")}
                  disabled={!selectedTestForQuestions}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === "questions"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  } ${!selectedTestForQuestions ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  Questions
                  {selectedTestForQuestions && (
                    <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {questions.length}
                    </span>
                  )}
                </button>
              </nav>
            </div>

            {/* Tab Content */}
            <div className="p-6 pb-12">
              {activeTab === "tests" && (
                <div className="space-y-6">
                  {/* Test Edit Form - MOVED TO TOP */}
                  {selectedTestId &&
                    (() => {
                      const selectedTest = tests.find(
                        (t) => t.id === selectedTestId,
                      );
                      if (!selectedTest) return null;
                      const isPublished = selectedTest.status === "PUBLISHED";

                      return (
                        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
                          <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-semibold text-gray-900">
                              Edit Test: {selectedTest.title}
                            </h3>
                            <button
                              onClick={() => setSelectedTestId("")}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              <svg
                                className="w-6 h-6"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
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

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Title
                              </label>
                              <input
                                type="text"
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                disabled={isPublished}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Description
                              </label>
                              <input
                                type="text"
                                value={editDescription}
                                onChange={(e) =>
                                  setEditDescription(e.target.value)
                                }
                                disabled={isPublished}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Max Marks
                              </label>
                              <input
                                type="number"
                                value={editMaxMarks}
                                onChange={(e) =>
                                  setEditMaxMarks(parseInt(e.target.value) || 1)
                                }
                                disabled={isPublished}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Passing Marks
                              </label>
                              <input
                                type="number"
                                value={editPassingMarks}
                                onChange={(e) =>
                                  setEditPassingMarks(
                                    parseInt(e.target.value) || 0,
                                  )
                                }
                                disabled={isPublished}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Duration (minutes)
                              </label>
                              <input
                                type="number"
                                value={editDuration}
                                onChange={(e) =>
                                  setEditDuration(parseInt(e.target.value) || 1)
                                }
                                disabled={isPublished}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Start Date & Time
                              </label>
                              <input
                                type="datetime-local"
                                value={editStartDate}
                                onChange={(e) =>
                                  setEditStartDate(e.target.value)
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                End Date & Time
                              </label>
                              <input
                                type="datetime-local"
                                value={editEndDate}
                                onChange={(e) => setEditEndDate(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              />
                            </div>
                          </div>

                          {!isPublished && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                              <label className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={editShuffleQuestions}
                                  onChange={(e) =>
                                    setEditShuffleQuestions(e.target.checked)
                                  }
                                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="ml-2 text-sm text-gray-700">
                                  Shuffle Questions
                                </span>
                              </label>
                              <label className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={editShowResults}
                                  onChange={(e) =>
                                    setEditShowResults(e.target.checked)
                                  }
                                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="ml-2 text-sm text-gray-700">
                                  Show Results
                                </span>
                              </label>
                              <label className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={editShowCorrectAnswers}
                                  onChange={(e) =>
                                    setEditShowCorrectAnswers(e.target.checked)
                                  }
                                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="ml-2 text-sm text-gray-700">
                                  Show Correct Answers
                                </span>
                              </label>
                            </div>
                          )}

                          <div className="flex justify-end">
                            <button
                              onClick={handleUpdateTest}
                              disabled={loading}
                              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                            >
                              {loading ? "Updating..." : "Update Test"}
                            </button>
                          </div>
                        </div>
                      );
                    })()}

                  {loading && (
                    <div className="text-center py-8">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <p className="mt-2 text-gray-600">Loading tests...</p>
                    </div>
                  )}

                  {!loading && tests.length === 0 && (
                    <div className="text-center py-12">
                      <div className="text-gray-400 text-6xl mb-4">📋</div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No tests found
                      </h3>
                      <p className="text-gray-500">
                        Create your first test to get started
                      </p>
                    </div>
                  )}

                  {!loading && tests.length > 0 && (
                    <div className="space-y-4">
                      {tests.map((test) => (
                        <div
                          key={test.id}
                          className="bg-gray-50 border border-gray-200 rounded-lg p-6 hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-medium ${
                                  test.status === "PUBLISHED"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-yellow-100 text-yellow-800"
                                }`}
                              >
                                {test.status}
                              </span>
                              <h3 className="text-lg font-semibold text-gray-900">
                                {test.title}
                              </h3>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleSelectTest(test.id)}
                                className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleManageQuestions(test.id)}
                                disabled={test.status === "PUBLISHED"}
                                className="px-3 py-1 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700 disabled:bg-gray-300"
                              >
                                Questions
                              </button>
                              {test.status !== "PUBLISHED" && (
                                <button
                                  onClick={() => handlePublishTest(test.id)}
                                  className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                                >
                                  Publish
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteTest(test.id)}
                                disabled={Boolean(
                                  test.status === "PUBLISHED" &&
                                    test.endDate &&
                                    new Date(test.endDate) > new Date(),
                                )}
                                className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 disabled:bg-gray-300"
                              >
                                Delete
                              </button>
                            </div>
                          </div>

                          <p className="text-gray-600 mb-3">
                            {test.description}
                          </p>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="font-medium text-gray-900">
                                Max Marks:
                              </span>
                              <span className="ml-1 text-gray-600">
                                {test.maxMarks}
                              </span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-900">
                                Passing:
                              </span>
                              <span className="ml-1 text-gray-600">
                                {test.passingMarks}
                              </span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-900">
                                Duration:
                              </span>
                              <span className="ml-1 text-gray-600">
                                {test.durationInMinutes} min
                              </span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-900">
                                Questions:
                              </span>
                              <span className="ml-1 text-gray-600">-</span>
                            </div>
                          </div>

                          {(test.startDate || test.endDate) && (
                            <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-500">
                              {test.startDate && (
                                <div>
                                  Start:{" "}
                                  {new Date(test.startDate).toLocaleString()}
                                </div>
                              )}
                              {test.endDate && (
                                <div>
                                  End: {new Date(test.endDate).toLocaleString()}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "questions" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Questions
                    </h3>
                    {!showQuestionForm && (
                      <button
                        onClick={() => setShowQuestionForm(true)}
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        <svg
                          className="w-5 h-5 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 4v16m8-8H4"
                          />
                        </svg>
                        Add Question
                      </button>
                    )}
                  </div>

                  {!showQuestionForm && (
                    <div className="space-y-4">{renderQuestionList()}</div>
                  )}

                  {/* Question Form */}
                  {showQuestionForm && (
                    <div className="bg-white border border-gray-200 rounded-lg p-6 mb-12">
                      <div className="flex items-center justify-between mb-6">
                        <h4 className="text-lg font-semibold text-gray-900">
                          {editingQuestionId
                            ? "Edit Question"
                            : "Add New Question"}
                        </h4>
                        <button
                          onClick={() => {
                            setShowQuestionForm(false);
                            clearQuestionForm();
                          }}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <svg
                            className="w-6 h-6"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
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

                      <form onSubmit={handleSaveQuestion} className="space-y-6">
                        {/* Question Type Selection */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-3">
                            Question Type *
                          </label>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {["MCQ", "DESCRIPTIVE", "CODE"].map((type) => (
                              <div
                                key={type}
                                onClick={() =>
                                  setQuestionForm((prev) => ({
                                    ...prev,
                                    type: type as any,
                                  }))
                                }
                                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                                  questionForm.type === type
                                    ? "border-blue-500 bg-blue-50"
                                    : "border-gray-200 hover:border-gray-300"
                                }`}
                              >
                                <div className="flex items-center mb-2">
                                  <div
                                    className={`w-3 h-3 rounded-full mr-2 ${
                                      questionForm.type === type
                                        ? "bg-blue-500"
                                        : "bg-gray-300"
                                    }`}
                                  />
                                  <span className="font-medium">{type}</span>
                                </div>
                                <p className="text-sm text-gray-600">
                                  {type === "MCQ" &&
                                    "Multiple choice questions"}
                                  {type === "DESCRIPTIVE" &&
                                    "Text-based answers"}
                                  {type === "CODE" && "Programming challenges"}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Question Text */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Question Text *
                          </label>
                          <RichTextEditor
                            ref={editorRef}
                            value={questionForm.question_text}
                            onChange={(content) =>
                              setQuestionForm((prev) => ({
                                ...prev,
                                question_text: content,
                              }))
                            }
                            placeholder="Enter your question here..."
                            height="200px"
                          />
                        </div>

                        {/* Basic Settings */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Marks *
                            </label>
                            <input
                              type="number"
                              min="1"
                              value={questionForm.marks}
                              onChange={(e) =>
                                setQuestionForm((prev) => ({
                                  ...prev,
                                  marks: parseInt(e.target.value) || 1,
                                }))
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                          {questionForm.type === "DESCRIPTIVE" && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Expected Word Count
                              </label>
                              <input
                                type="number"
                                min="1"
                                value={questionForm.expectedWordCount || ""}
                                onChange={(e) =>
                                  setQuestionForm((prev) => ({
                                    ...prev,
                                    expectedWordCount:
                                      parseInt(e.target.value) || undefined,
                                  }))
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="e.g., 100"
                              />
                            </div>
                          )}
                        </div>

                        {/* MCQ Options */}
                        {questionForm.type === "MCQ" && (
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <label className="block text-sm font-medium text-gray-700">
                                Answer Options *
                              </label>
                              <button
                                type="button"
                                onClick={handleAddOption}
                                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                              >
                                + Add Option
                              </button>
                            </div>
                            <div className="space-y-3">
                              {questionForm.options.map((option, index) => (
                                <div
                                  key={index}
                                  className="flex items-center space-x-3"
                                >
                                  <input
                                    type="checkbox"
                                    checked={option.correct}
                                    onChange={(e) =>
                                      handleOptionChange(
                                        index,
                                        "correct",
                                        e.target.checked,
                                      )
                                    }
                                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                  />
                                  <div className="flex-1">
                                    <input
                                      type="text"
                                      value={option.text}
                                      onChange={(e) =>
                                        handleOptionChange(
                                          index,
                                          "text",
                                          e.target.value,
                                        )
                                      }
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                      placeholder={`Option ${String.fromCharCode(65 + index)}`}
                                    />
                                  </div>
                                  {questionForm.options.length > 2 && (
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveOption(index)}
                                      className="text-red-600 hover:text-red-800 p-1"
                                    >
                                      <svg
                                        className="w-4 h-4"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                        />
                                      </svg>
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* CODE Question Settings */}
                        {questionForm.type === "CODE" && (
                          <div className="space-y-6">
                            {/* Programming Language */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Programming Language *
                              </label>
                              <select
                                value={
                                  questionForm.codeLanguage || "javascript"
                                }
                                onChange={(e) =>
                                  setQuestionForm((prev) => ({
                                    ...prev,
                                    codeLanguage: e.target.value,
                                  }))
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              >
                                {SUPPORTED_LANGUAGES.map((lang) => (
                                  <option key={lang.value} value={lang.value}>
                                    {lang.label}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* Constraints */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Constraints
                              </label>
                              <textarea
                                value={questionForm.constraints || ""}
                                onChange={(e) =>
                                  setQuestionForm((prev) => ({
                                    ...prev,
                                    constraints: e.target.value,
                                  }))
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                rows={3}
                                placeholder="e.g., 1 ≤ n ≤ 10^5, 1 ≤ arr[i] ≤ 10^9"
                              />
                            </div>

                            {/* Time and Memory Limits */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Time Limit (ms)
                                </label>
                                <input
                                  type="number"
                                  min="1000"
                                  max="30000"
                                  value={questionForm.time_limit_ms || 5000}
                                  onChange={(e) =>
                                    setQuestionForm((prev) => ({
                                      ...prev,
                                      time_limit_ms:
                                        parseInt(e.target.value) || 5000,
                                    }))
                                  }
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Memory Limit (MB)
                                </label>
                                <input
                                  type="number"
                                  min="64"
                                  max="1024"
                                  value={questionForm.memory_limit_mb || 256}
                                  onChange={(e) =>
                                    setQuestionForm((prev) => ({
                                      ...prev,
                                      memory_limit_mb:
                                        parseInt(e.target.value) || 256,
                                    }))
                                  }
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                              </div>
                            </div>

                            {/* Test Cases Upload */}
                            <div>
                              <div className="flex items-center justify-between mb-3">
                                <label className="block text-sm font-medium text-gray-700">
                                  Test Cases
                                </label>
                                <div className="flex items-center space-x-4 text-sm text-gray-600">
                                  <span>
                                    Visible:{" "}
                                    {questionForm.visible_testcases.length}
                                  </span>
                                  <span>
                                    Hidden:{" "}
                                    {questionForm.hidden_testcases.length}
                                  </span>
                                </div>
                              </div>

                              {/* Status Message */}
                              {uploadStatus && (
                                <div
                                  className={`mb-4 p-3 rounded-lg text-sm ${
                                    uploadStatus.type === "success"
                                      ? "bg-green-100 text-green-800"
                                      : uploadStatus.type === "error"
                                        ? "bg-red-100 text-red-800"
                                        : "bg-blue-100 text-blue-800"
                                  }`}
                                >
                                  {uploadStatus.message}
                                </div>
                              )}

                              {/* File Upload */}
                              <div className="mb-4">
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                                  <svg
                                    className="mx-auto h-12 w-12 text-gray-400 mb-4"
                                    stroke="currentColor"
                                    fill="none"
                                    viewBox="0 0 48 48"
                                  >
                                    <path
                                      d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                  </svg>
                                  <div>
                                    <label
                                      htmlFor="testcase-upload"
                                      className="cursor-pointer"
                                    >
                                      <span className="font-medium text-blue-600 hover:text-blue-500">
                                        Upload test cases file
                                      </span>
                                      <span className="text-gray-500">
                                        {" "}
                                        or drag and drop
                                      </span>
                                      <input
                                        ref={fileInputRef}
                                        id="testcase-upload"
                                        type="file"
                                        className="sr-only"
                                        accept=".txt,.json"
                                        onChange={handleFileUpload}
                                      />
                                    </label>
                                    <p className="text-xs text-gray-500 mt-1">
                                      TXT or JSON format
                                    </p>
                                  </div>
                                </div>
                              </div>

                              {/* Demo Files */}
                              <div className="mb-6 flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  onClick={() => downloadDemoFile("txt")}
                                  className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded hover:bg-gray-200"
                                >
                                  Download Demo TXT
                                </button>
                                <button
                                  type="button"
                                  onClick={() => downloadDemoFile("json")}
                                  className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded hover:bg-gray-200"
                                >
                                  Download Demo JSON
                                </button>
                              </div>

                              {/* Manual Test Cases - FIXED VERSION */}
                              <div className="space-y-6">
                                {/* Visible Test Cases */}
                                <div className="border border-gray-200 rounded-lg p-4">
                                  <div className="flex items-center justify-between mb-3">
                                    <h4 className="text-sm font-medium text-gray-700">
                                      Visible Test Cases
                                    </h4>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        addTestCase("visible_testcases")
                                      }
                                      className="text-green-600 hover:text-green-800 text-sm"
                                    >
                                      + Add
                                    </button>
                                  </div>
                                  {/* REMOVED: max-h-48 overflow-y-auto */}
                                  <div className="space-y-3">
                                    {questionForm.visible_testcases.map(
                                      (testCase, index) => (
                                        <div
                                          key={index}
                                          className="p-3 bg-green-50 rounded-lg"
                                        >
                                          <div className="flex justify-between items-center mb-2">
                                            <span className="text-xs font-medium text-gray-600">
                                              Test Case {index + 1}
                                            </span>
                                            {questionForm.visible_testcases
                                              .length > 1 && (
                                              <button
                                                type="button"
                                                onClick={() =>
                                                  removeTestCase(
                                                    "visible_testcases",
                                                    index,
                                                  )
                                                }
                                                className="text-red-600 hover:text-red-800 text-xs"
                                              >
                                                Remove
                                              </button>
                                            )}
                                          </div>
                                          <div className="space-y-2">
                                            <div>
                                              <label className="text-xs text-gray-600">
                                                Input
                                              </label>
                                              <textarea
                                                value={testCase.input}
                                                onChange={(e) =>
                                                  updateTestCase(
                                                    "visible_testcases",
                                                    index,
                                                    "input",
                                                    e.target.value,
                                                  )
                                                }
                                                className="w-full text-xs p-2 border border-gray-300 rounded"
                                                rows={2}
                                                placeholder="Input data..."
                                              />
                                            </div>
                                            <div>
                                              <label className="text-xs text-gray-600">
                                                Expected Output
                                              </label>
                                              <textarea
                                                value={testCase.expected_output}
                                                onChange={(e) =>
                                                  updateTestCase(
                                                    "visible_testcases",
                                                    index,
                                                    "expected_output",
                                                    e.target.value,
                                                  )
                                                }
                                                className="w-full text-xs p-2 border border-gray-300 rounded"
                                                rows={2}
                                                placeholder="Expected output..."
                                              />
                                            </div>
                                          </div>
                                        </div>
                                      ),
                                    )}
                                  </div>
                                </div>

                                {/* Hidden Test Cases */}
                                <div className="border border-gray-200 rounded-lg p-4">
                                  <div className="flex items-center justify-between mb-3">
                                    <h4 className="text-sm font-medium text-gray-700">
                                      Hidden Test Cases
                                    </h4>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        addTestCase("hidden_testcases")
                                      }
                                      className="text-blue-600 hover:text-blue-800 text-sm"
                                    >
                                      + Add
                                    </button>
                                  </div>
                                  {/* REMOVED: max-h-48 overflow-y-auto */}
                                  <div className="space-y-3">
                                    {questionForm.hidden_testcases.map(
                                      (testCase, index) => (
                                        <div
                                          key={index}
                                          className="p-3 bg-blue-50 rounded-lg"
                                        >
                                          <div className="flex justify-between items-center mb-2">
                                            <span className="text-xs font-medium text-gray-600">
                                              Test Case {index + 1}
                                            </span>
                                            {questionForm.hidden_testcases
                                              .length > 1 && (
                                              <button
                                                type="button"
                                                onClick={() =>
                                                  removeTestCase(
                                                    "hidden_testcases",
                                                    index,
                                                  )
                                                }
                                                className="text-red-600 hover:text-red-800 text-xs"
                                              >
                                                Remove
                                              </button>
                                            )}
                                          </div>
                                          <div className="space-y-2">
                                            <div>
                                              <label className="text-xs text-gray-600">
                                                Input
                                              </label>
                                              <textarea
                                                value={testCase.input}
                                                onChange={(e) =>
                                                  updateTestCase(
                                                    "hidden_testcases",
                                                    index,
                                                    "input",
                                                    e.target.value,
                                                  )
                                                }
                                                className="w-full text-xs p-2 border border-gray-300 rounded"
                                                rows={2}
                                                placeholder="Input data..."
                                              />
                                            </div>
                                            <div>
                                              <label className="text-xs text-gray-600">
                                                Expected Output
                                              </label>
                                              <textarea
                                                value={testCase.expected_output}
                                                onChange={(e) =>
                                                  updateTestCase(
                                                    "hidden_testcases",
                                                    index,
                                                    "expected_output",
                                                    e.target.value,
                                                  )
                                                }
                                                className="w-full text-xs p-2 border border-gray-300 rounded"
                                                rows={2}
                                                placeholder="Expected output..."
                                              />
                                            </div>
                                          </div>
                                        </div>
                                      ),
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Form Actions */}
                        <div className="flex justify-end space-x-4 pt-6 border-t">
                          <button
                            type="button"
                            onClick={() => {
                              setShowQuestionForm(false);
                              clearQuestionForm();
                            }}
                            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                          >
                            {loading
                              ? "Saving..."
                              : editingQuestionId
                                ? "Update Question"
                                : "Add Question"}
                          </button>
                        </div>
                      </form>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Status Messages */}
      {error && (
        <div className="fixed bottom-4 right-4 max-w-md p-4 bg-red-100 border border-red-200 text-red-800 rounded-lg shadow-lg">
          <div className="flex items-center">
            <svg
              className="w-5 h-5 mr-3 text-red-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-sm">{error}</span>
          </div>
        </div>
      )}

      {success && (
        <div className="fixed bottom-4 right-4 max-w-md p-4 bg-green-100 border border-green-200 text-green-800 rounded-lg shadow-lg">
          <div className="flex items-center">
            <svg
              className="w-5 h-5 mr-3 text-green-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-sm">{success}</span>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 flex items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-4"></div>
            <span className="text-gray-700">Loading...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageTest;
