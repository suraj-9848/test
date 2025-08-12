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

interface TestCase {
  input: string;
  expected_output: string;
}

interface Question {
  id: string;
  question_text: string;
  type: "MCQ" | "DESCRIPTIVE" | "CODE";
  marks: number;
  expectedWordCount?: number;
  codeLanguage?: string;
  constraints?: string;
  visible_testcases?: TestCase[];
  hidden_testcases?: TestCase[];
  time_limit_ms?: number;
  memory_limit_mb?: number;
  options?: QuestionOption[];
}

interface QuestionOption {
  id: string;
  text: string;
  correct: boolean;
}

interface CreateQuestionRequestLocal {
  question_text: string;
  type: "MCQ" | "DESCRIPTIVE" | "CODE";
  marks: number;
  options?: { text: string; correct: boolean }[];
  expectedWordCount?: number;
  codeLanguage?: string;
  constraints?: string;
  visible_testcases?: TestCase[];
  hidden_testcases?: TestCase[];
  time_limit_ms?: number;
  memory_limit_mb?: number;
}

interface UpdateTestPayload {
  title: string;
  description: string;
  maxMarks: number;
  passingMarks: number;
  durationInMinutes: number;
  startDate: string;
  endDate: string;
  shuffleQuestions: boolean;
  showResults: boolean;
  showCorrectAnswers: boolean;
}

interface QuestionFormData {
  question_text: string;
  type: "MCQ" | "DESCRIPTIVE" | "CODE";
  marks: number;
  options: { text: string; correct: boolean }[];
  expectedWordCount?: number;
  codeLanguage?: string;
  constraints?: string;
  visible_testcases: TestCase[];
  hidden_testcases: TestCase[];
  time_limit_ms?: number;
  memory_limit_mb?: number;
}

const SUPPORTED_LANGUAGES = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
  { value: 'c', label: 'C' },
  { value: 'csharp', label: 'C#' },
  { value: 'php', label: 'PHP' },
  { value: 'ruby', label: 'Ruby' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'kotlin', label: 'Kotlin' },
  { value: 'swift', label: 'Swift' },
  { value: 'typescript', label: 'TypeScript' },
];

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
  const [editShuffleQuestions, setEditShuffleQuestions] = useState<boolean>(false);
  const [editShowResults, setEditShowResults] = useState<boolean>(false);
  const [editShowCorrectAnswers, setEditShowCorrectAnswers] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showQuestionManager, setShowQuestionManager] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionEditTestId, setQuestionEditTestId] = useState<string>("");
  const [uploadStatus, setUploadStatus] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  const [questionForm, setQuestionForm] = useState<QuestionFormData>({
    question_text: "",
    type: "MCQ",
    marks: 1,
    options: [{ text: "", correct: false }],
    expectedWordCount: undefined,
    codeLanguage: 'javascript',
    constraints: '',
    visible_testcases: [{ input: '', expected_output: '' }],
    hidden_testcases: [{ input: '', expected_output: '' }],
    time_limit_ms: 5000,
    memory_limit_mb: 256,
  });

  const [editingQuestionId, setEditingQuestionId] = useState<string>("");
  const editorRef = useRef<RichTextEditorHandle>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ... (keeping all your existing useEffect hooks and utility functions)
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

  const downloadDemoFile = (format: 'txt' | 'json') => {
    const demoContent = format === 'json'
      ? JSON.stringify({
        visible_testcases: [
          { input: "5 3", expected_output: "8" },
          { input: "10 20", expected_output: "30" }
        ],
        hidden_testcases: [
          { input: "100 200", expected_output: "300" },
          { input: "-5 10", expected_output: "5" }
        ]
      }, null, 2)
      : `VISIBLE
INPUT:
5 3
OUTPUT:
8
INPUT:
10 20
OUTPUT:
30
HIDDEN
INPUT:
100 200
OUTPUT:
300
INPUT:
-5 10
OUTPUT:
5`;

    const blob = new Blob([demoContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `demo_testcases.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploadStatus({ type: 'info', message: 'Processing file...' });

      const content = await file.text();

      // Parse the file content
      let parsedData;
      if (file.name.endsWith('.json')) {
        parsedData = JSON.parse(content);
      } else {
        // Parse custom format
        parsedData = parseCustomFormat(content);
      }

      // Update form data
      setQuestionForm(prev => ({
        ...prev,
        visible_testcases: parsedData.visible_testcases || [],
        hidden_testcases: parsedData.hidden_testcases || [],
      }));

      setUploadStatus({ type: 'success', message: 'Test cases loaded successfully!' });
    } catch (error) {
      setUploadStatus({ type: 'error', message: 'Failed to parse file. Please check the format.' });
    }
  };

// Add this function to ManageTest.tsx if it doesn't exist
const parseCustomFormat = (content: string) => {
  const lines = content.split('\n').map(line => line.trim()).filter(line => line);
  const visible_testcases: TestCase[] = [];
  const hidden_testcases: TestCase[] = [];
  
  let currentSection: 'VISIBLE' | 'HIDDEN' | null = null;
  let currentInput = '';
  let currentOutput = '';
  let parsingMode: 'INPUT' | 'OUTPUT' | null = null;
  
  for (const line of lines) {
    if (line === 'VISIBLE') {
      currentSection = 'VISIBLE';
      continue;
    }
    
    if (line === 'HIDDEN') {
      currentSection = 'HIDDEN';
      continue;
    }
    
    if (line === 'INPUT:') {
      // Save previous test case if exists
      if (currentInput && currentOutput && currentSection) {
        const testCase = { input: currentInput.trim(), expected_output: currentOutput.trim() };
        if (currentSection === 'VISIBLE') {
          visible_testcases.push(testCase);
        } else {
          hidden_testcases.push(testCase);
        }
      }
      currentInput = '';
      currentOutput = '';
      parsingMode = 'INPUT';
      continue;
    }
    
    if (line === 'OUTPUT:') {
      parsingMode = 'OUTPUT';
      continue;
    }
    
    if (parsingMode === 'INPUT') {
      currentInput += (currentInput ? '\n' : '') + line;
    } else if (parsingMode === 'OUTPUT') {
      currentOutput += (currentOutput ? '\n' : '') + line;
    }
  }
  
  // Save last test case
  if (currentInput && currentOutput && currentSection) {
    const testCase = { input: currentInput.trim(), expected_output: currentOutput.trim() };
    if (currentSection === 'VISIBLE') {
      visible_testcases.push(testCase);
    } else {
      hidden_testcases.push(testCase);
    }
  }
  
  return { visible_testcases, hidden_testcases };
};

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

    // Validation for coding questions
    if (questionForm.type === "CODE") {
      if (!questionForm.codeLanguage) {
        setLoading(false);
        setError("Programming language is required for coding questions.");
        return;
      }

      const hasEmptyVisibleTestCase = questionForm.visible_testcases.some(
        tc => !tc.input.trim() || !tc.expected_output.trim()
      );
      const hasEmptyHiddenTestCase = questionForm.hidden_testcases.some(
        tc => !tc.input.trim() || !tc.expected_output.trim()
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

      // Add conditional fields based on question type
      if (questionForm.type === "MCQ") {
        payload.options = questionForm.options;
      }

      if (questionForm.type === "DESCRIPTIVE" && questionForm.expectedWordCount) {
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

      // Reset form
      clearQuestionForm();
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
      codeLanguage: 'javascript',
      constraints: '',
      visible_testcases: [{ input: '', expected_output: '' }],
      hidden_testcases: [{ input: '', expected_output: '' }],
      time_limit_ms: 5000,
      memory_limit_mb: 256,
    });
    setEditingQuestionId("");
    editorRef.current?.setContent("");
    setUploadStatus(null);
  };

// Add this improved handleEditQuestion function to ManageTest.tsx
// Replace the existing handleEditQuestion function with this enhanced version

const handleEditQuestion = (q: Question) => {
  console.log('Editing question:', q);
  
  // Enhanced parsing for test cases
  const parseTestCasesForEdit = (testCases: any): TestCase[] => {
    if (!testCases) return [{ input: '', expected_output: '' }];
    
    if (Array.isArray(testCases)) {
      return testCases.length > 0 ? testCases : [{ input: '', expected_output: '' }];
    }
    
    if (typeof testCases === 'string') {
      try {
        const parsed = JSON.parse(testCases);
        return Array.isArray(parsed) && parsed.length > 0 ? parsed : [{ input: '', expected_output: '' }];
      } catch {
        return [{ input: '', expected_output: '' }];
      }
    }
    
    return [{ input: '', expected_output: '' }];
  };

  // Parse test cases with enhanced error handling
  const visibleTestCases = parseTestCasesForEdit(q.visible_testcases);
  const hiddenTestCases = parseTestCasesForEdit(q.hidden_testcases);

  console.log('Parsed test cases for editing:', {
    visible: visibleTestCases,
    hidden: hiddenTestCases,
    originalVisible: q.visible_testcases,
    originalHidden: q.hidden_testcases
  });

  setQuestionForm({
    question_text: q.question_text,
    type: q.type,
    marks: q.marks,
    options: q.options
      ? q.options.map((o) => ({ text: o.text, correct: o.correct }))
      : [{ text: "", correct: false }],
    expectedWordCount: q.expectedWordCount,
    codeLanguage: q.codeLanguage || 'javascript',
    constraints: q.constraints || '',
    visible_testcases: visibleTestCases,
    hidden_testcases: hiddenTestCases,
    time_limit_ms: q.time_limit_ms || 5000,
    memory_limit_mb: q.memory_limit_mb || 256,
  });
  
  setEditingQuestionId(q.id);
  editorRef.current?.setContent(q.question_text || "");
};

// Also update the question display section to show correct counts
// Replace the existing question list rendering section with this enhanced version:

const renderQuestionListWithEnhancedDetails = () => {
  if (questions.length === 0) {
    return (
      <li className="text-gray-500 text-center">No questions yet.</li>
    );
  }

  return questions.map((q) => {
    // Enhanced parsing for display
    const parseTestCasesForDisplay = (testCases: any): TestCase[] => {
      if (!testCases) return [];
      if (Array.isArray(testCases)) return testCases;
      if (typeof testCases === 'string') {
        try {
          const parsed = JSON.parse(testCases);
          return Array.isArray(parsed) ? parsed : [];
        } catch {
          return [];
        }
      }
      return [];
    };

    const visibleTestCases = parseTestCasesForDisplay(q.visible_testcases);
    const hiddenTestCases = parseTestCasesForDisplay(q.hidden_testcases);

    return (
      <li
        key={q.id}
        className="flex justify-between items-start p-4 bg-gray-50 rounded-lg"
      >
        <div className="content-display flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              q.type === 'MCQ' ? 'bg-green-100 text-green-800' :
              q.type === 'DESCRIPTIVE' ? 'bg-blue-100 text-blue-800' :
              'bg-purple-100 text-purple-800'
            }`}>
              {q.type}
            </span>
            {q.type === 'CODE' && q.codeLanguage && (
              <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">
                {q.codeLanguage.toUpperCase()}
              </span>
            )}
            <span className="text-sm text-gray-600">Marks: {q.marks}</span>
          </div>
          
          <div
            dangerouslySetInnerHTML={{ __html: q.question_text }}
            className="font-medium prose prose-sm max-w-none mb-2"
          />

          {/* MCQ Options */}
          {q.options && q.options.length > 0 && (
            <div className="mt-2">
              <div className="text-sm text-gray-600 mb-1">Options:</div>
              <div className="space-y-1">
                {q.options.map((opt, idx) => (
                  <div key={idx} className={`text-sm ${
                    opt.correct ? 'font-semibold text-green-600' : 'text-gray-600'
                  }`}>
                    {String.fromCharCode(65 + idx)}. {opt.text}
                    {opt.correct && ' ✓'}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Coding Question Details - Enhanced */}
          {q.type === 'CODE' && (
            <div className="mt-2 space-y-2 text-sm text-gray-600">
              {q.constraints && (
                <div>
                  <span className="font-medium">Constraints:</span> 
                  <span className="ml-1">
                    {q.constraints.length > 100 ? 
                      `${q.constraints.substring(0, 100)}...` : 
                      q.constraints
                    }
                  </span>
                </div>
              )}
              
              <div className="flex flex-wrap gap-4">
                <span className={`${visibleTestCases.length === 0 ? 'text-red-600 font-medium' : ''}`}>
                  Visible Test Cases: {visibleTestCases.length}
                  {visibleTestCases.length === 0 && ' ⚠️'}
                </span>
                <span className={`${hiddenTestCases.length === 0 ? 'text-red-600 font-medium' : ''}`}>
                  Hidden Test Cases: {hiddenTestCases.length}
                  {hiddenTestCases.length === 0 && ' ⚠️'}
                </span>
                <span>Time Limit: {q.time_limit_ms || 5000}ms</span>
                <span>Memory: {q.memory_limit_mb || 256}MB</span>
              </div>

              {/* Show warning if no test cases */}
              {visibleTestCases.length === 0 && hiddenTestCases.length === 0 && (
                <div className="bg-red-50 border border-red-200 rounded p-2 text-red-800 text-xs">
                  ⚠️ Warning: This coding question has no test cases defined!
                </div>
              )}

              {/* Show test case previews for debugging */}
              {process.env.NODE_ENV === 'development' && (
                <details className="text-xs">
                  <summary className="cursor-pointer text-gray-500">Debug: Show test case data</summary>
                  <div className="mt-2 bg-gray-100 p-2 rounded">
                    <div>Raw visible_testcases: {JSON.stringify(q.visible_testcases)}</div>
                    <div>Raw hidden_testcases: {JSON.stringify(q.hidden_testcases)}</div>
                    <div>Parsed visible count: {visibleTestCases.length}</div>
                    <div>Parsed hidden count: {hiddenTestCases.length}</div>
                  </div>
                </details>
              )}
            </div>
          )}

          {/* Descriptive Question Details */}
          {q.type === 'DESCRIPTIVE' && q.expectedWordCount && (
            <div className="mt-2 text-sm text-gray-600">
              Expected Word Count: {q.expectedWordCount}
            </div>
          )}
        </div>
        
        <div className="flex gap-3 ml-4">
          <button
            className="text-blue-600 hover:underline"
            onClick={() => handleEditQuestion(q)}
          >
            Edit
          </button>
          <button
            className="text-red-600 hover:underline"
            onClick={() => handleDeleteQuestion(q.id)}
          >
            Delete
          </button>
        </div>
      </li>
    );
  });
};

  // Test case management functions
  const addTestCase = (type: 'visible_testcases' | 'hidden_testcases') => {
    setQuestionForm(prev => ({
      ...prev,
      [type]: [...prev[type], { input: '', expected_output: '' }]
    }));
  };

  const removeTestCase = (type: 'visible_testcases' | 'hidden_testcases', index: number) => {
    const testCases = questionForm[type];
    if (testCases.length > 1) {
      setQuestionForm(prev => ({
        ...prev,
        [type]: testCases.filter((_, i) => i !== index)
      }));
    }
  };

  const updateTestCase = (
    type: 'visible_testcases' | 'hidden_testcases',
    index: number,
    field: 'input' | 'expected_output',
    value: string
  ) => {
    const testCases = questionForm[type];
    setQuestionForm(prev => ({
      ...prev,
      [type]: testCases.map((tc, i) =>
        i === index ? { ...tc, [field]: value } : tc
      )
    }));
  };

  // ... (keeping all your existing handler functions)
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
      setShowQuestionManager(true);
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
          "Cannot publish: All MCQ questions must have at least one correct answer. Debug: Offending question(s): " +
          mcqWithNoCorrect
            .map((q: Question) => q.question_text || q.id)
            .join(", "),
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

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h2 className="text-3xl font-bold text-gray-800 mb-8">Test Management</h2>

      {/* Batch and Course Selectors */}
      <div className="mb-8 grid gap-4 md:grid-cols-2">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Select Batch:
          </label>
          <select
            value={selectedBatch}
            onChange={(e) => setSelectedBatch(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
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
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Select Course:
          </label>
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
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

      {loading && (
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      )}

      {/* ... keeping your existing test editing form ... */}
      {selectedTestId &&
        (() => {
          const selectedTest = tests.find((t) => t.id === selectedTestId);
          if (!selectedTest) return null;
          const isPublished = selectedTest.status === "PUBLISHED";
          return (
            <div className="mb-8 p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold mb-4 text-gray-800">
                Edit Test: {selectedTest.title}
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    disabled={isPublished}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <input
                    type="text"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    disabled={isPublished}
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    disabled={isPublished}
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
                      setEditPassingMarks(parseInt(e.target.value) || 0)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    disabled={isPublished}
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    disabled={isPublished}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={editStartDate}
                    onChange={(e) => setEditStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              {!isPublished && (
                <div className="mt-4 space-y-3">
                  <div className="flex flex-wrap gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={editShuffleQuestions}
                        onChange={(e) =>
                          setEditShuffleQuestions(e.target.checked)
                        }
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-gray-700">Shuffle Questions</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={editShowResults}
                        onChange={(e) => setEditShowResults(e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-gray-700">
                        Show Results After Submission
                      </span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={editShowCorrectAnswers}
                        onChange={(e) =>
                          setEditShowCorrectAnswers(e.target.checked)
                        }
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-gray-700">
                        Show Correct Answers After Submission
                      </span>
                    </label>
                  </div>
                </div>
              )}
              <div className="mt-4">
                <button
                  onClick={handleUpdateTest}
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300"
                >
                  Update Test
                </button>
              </div>
            </div>
          );
        })()}

      {!showQuestionManager ? (
        <div className="space-y-6">
          {tests.length === 0 ? (
            <p className="text-gray-500 text-center">
              No tests available for this batch and course.
            </p>
          ) : (
            tests.map((test) => (
              <div
                key={test.id}
                className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition"
              >
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                  <div
                    className="flex-1"
                    onClick={() => handleSelectTest(test.id)}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <span
                        className={`px-3 py-1 rounded text-xs font-medium ${test.status === "PUBLISHED"
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                          }`}
                      >
                        {test.status}
                      </span>
                      <h3 className="text-lg font-semibold">{test.title}</h3>
                    </div>
                    <p className="text-gray-600">{test.description}</p>
                    <p className="text-sm text-gray-500">
                      Max Marks: {test.maxMarks} | Passing: {test.passingMarks}{" "}
                      | Duration: {test.durationInMinutes} min
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Start:{" "}
                      {test.startDate
                        ? new Date(test.startDate).toLocaleString()
                        : "-"}{" "}
                      <br />
                      End:{" "}
                      {test.endDate
                        ? new Date(test.endDate).toLocaleString()
                        : "-"}
                    </p>
                  </div>
                  <div className="flex gap-3 mt-4 md:mt-0">
                    <button
                      onClick={() => handleSelectTest(test.id)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteTest(test.id)}
                      disabled={Boolean(
                        test.status === "PUBLISHED" &&
                        test.endDate &&
                        new Date(test.endDate) > new Date(),
                      )}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => handleManageQuestions(test.id)}
                      disabled={test.status === "PUBLISHED"}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300"
                    >
                      Manage Questions
                    </button>
                    {test.status !== "PUBLISHED" && (
                      <button
                        onClick={() => handlePublishTest(test.id)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        Publish
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="p-6 bg-white rounded-lg shadow-sm">
          <button
            className="mb-6 text-blue-600 hover:underline"
            onClick={() => setShowQuestionManager(false)}
          >
            ← Back to Tests
          </button>
          <h3 className="text-xl font-semibold mb-6 text-gray-800 border-b pb-2">
            Questions for Test
          </h3>
          <ul className="mb-8 space-y-4">
            {questions.length === 0 ? (
              <li className="text-gray-500 text-center">No questions yet.</li>
            ) : (
              questions.map((q) => (
                <li
                  key={q.id}
                  className="flex justify-between items-start p-4 bg-gray-50 rounded-lg"
                >
                  <div className="content-display flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${q.type === 'MCQ' ? 'bg-green-100 text-green-800' :
                        q.type === 'DESCRIPTIVE' ? 'bg-blue-100 text-blue-800' :
                          'bg-purple-100 text-purple-800'
                        }`}>
                        {q.type}
                      </span>
                      {q.type === 'CODE' && q.codeLanguage && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">
                          {q.codeLanguage.toUpperCase()}
                        </span>
                      )}
                      <span className="text-sm text-gray-600">Marks: {q.marks}</span>
                    </div>
                    <div
                      dangerouslySetInnerHTML={{ __html: q.question_text }}
                      className="font-medium prose prose-sm max-w-none mb-2"
                    />

                    {/* MCQ Options */}
                    {q.options && q.options.length > 0 && (
                      <div className="mt-2">
                        <div className="text-sm text-gray-600 mb-1">Options:</div>
                        <div className="space-y-1">
                          {q.options.map((opt, idx) => (
                            <div key={idx} className={`text-sm ${opt.correct ? 'font-semibold text-green-600' : 'text-gray-600'}`}>
                              {String.fromCharCode(65 + idx)}. {opt.text}
                              {opt.correct && ' ✓'}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Coding Question Details */}
                    {q.type === 'CODE' && (
                      <div className="mt-2 space-y-2 text-sm text-gray-600">
                        {q.constraints && (
                          <div>
                            <span className="font-medium">Constraints:</span> {q.constraints.substring(0, 100)}...
                          </div>
                        )}
                        <div className="flex space-x-4">
                          <span>Visible Test Cases: {q.visible_testcases?.length || 0}</span>
                          <span>Hidden Test Cases: {q.hidden_testcases?.length || 0}</span>
                          <span>Time Limit: {q.time_limit_ms}ms</span>
                          <span>Memory: {q.memory_limit_mb}MB</span>
                        </div>
                      </div>
                    )}

                    {/* Descriptive Question Details */}
                    {q.type === 'DESCRIPTIVE' && q.expectedWordCount && (
                      <div className="mt-2 text-sm text-gray-600">
                        Expected Word Count: {q.expectedWordCount}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-3 ml-4">
                    <button
                      className="text-blue-600 hover:underline"
                      onClick={() => handleEditQuestion(q)}
                    >
                      Edit
                    </button>
                    <button
                      className="text-red-600 hover:underline"
                      onClick={() => handleDeleteQuestion(q.id)}
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))
            )}
          </ul>
<div className="p-6 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
  <h4 className="text-lg font-semibold mb-4 border-b pb-2">
    {editingQuestionId ? "Edit Question" : "Add New Question"}
  </h4>

  {/* Question Type Selection */}
  <div className="mb-6">
    <label className="block text-sm font-medium text-gray-700 mb-3">
      Question Type *
    </label>
    <div className="grid grid-cols-2 gap-4">
      {/* MCQ Option */}
      <div
        onClick={() => setQuestionForm(prev => ({ ...prev, type: 'MCQ' }))}
        className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
          questionForm.type === 'MCQ'
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-200 hover:border-gray-300'
        }`}
      >
        <div className="flex items-center mb-2">
          <div className={`w-3 h-3 rounded-full mr-2 ${
            questionForm.type === 'MCQ' ? 'bg-blue-500' : 'bg-gray-300'
          }`} />
          <span className="font-medium">Multiple Choice</span>
        </div>
        <p className="text-sm text-gray-600">Questions with predefined options</p>
      </div>

      {/* CODE Option */}
      <div
        onClick={() => setQuestionForm(prev => ({ ...prev, type: 'CODE' }))}
        className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
          questionForm.type === 'CODE'
            ? 'border-purple-500 bg-purple-50'
            : 'border-gray-200 hover:border-gray-300'
        }`}
      >
        <div className="flex items-center mb-2">
          <div className={`w-3 h-3 rounded-full mr-2 ${
            questionForm.type === 'CODE' ? 'bg-purple-500' : 'bg-gray-300'
          }`} />
          <span className="font-medium">Coding Question</span>
        </div>
        <p className="text-sm text-gray-600">Programming challenges with Judge0</p>
      </div>
    </div>
  </div>

  {/* Question Text */}
  <div className="mb-6">
    <label className="block text-sm font-medium text-gray-700 mb-2">
      Question Text *
    </label>
    <RichTextEditor
      ref={editorRef}
      value={questionForm.question_text}
      onChange={(content) => setQuestionForm(prev => ({ ...prev, question_text: content }))}
      placeholder="Enter your question here..."
      height="200px"
    />
  </div>

  {/* Basic Question Settings */}
  <div className="grid grid-cols-2 gap-4 mb-6">
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Marks *
      </label>
      <input
        type="number"
        min="1"
        value={questionForm.marks}
        onChange={(e) => setQuestionForm(prev => ({ ...prev, marks: parseInt(e.target.value) || 1 }))}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      />
    </div>
    {questionForm.type === 'DESCRIPTIVE' && (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Expected Word Count
        </label>
        <input
          type="number"
          min="1"
          value={questionForm.expectedWordCount || ''}
          onChange={(e) => setQuestionForm(prev => ({ ...prev, expectedWordCount: parseInt(e.target.value) || undefined }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="e.g., 100"
        />
      </div>
    )}
  </div>

  {/* MCQ Options */}
  {questionForm.type === 'MCQ' && (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <label className="block text-sm font-medium text-gray-700">
          Answer Options *
        </label>
        <button
          type="button"
          onClick={() => setQuestionForm(prev => ({
            ...prev,
            options: [...prev.options, { text: '', correct: false }]
          }))}
          className="text-blue-600 hover:text-blue-800 text-sm"
        >
          + Add Option
        </button>
      </div>
      <div className="space-y-3">
        {questionForm.options.map((option, index) => (
          <div key={index} className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={option.correct}
              onChange={(e) => {
                const newOptions = [...questionForm.options];
                newOptions[index] = { ...option, correct: e.target.checked };
                setQuestionForm(prev => ({ ...prev, options: newOptions }));
              }}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <input
              type="text"
              value={option.text}
              onChange={(e) => {
                const newOptions = [...questionForm.options];
                newOptions[index] = { ...option, text: e.target.value };
                setQuestionForm(prev => ({ ...prev, options: newOptions }));
              }}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder={`Option ${String.fromCharCode(65 + index)}`}
            />
            {questionForm.options.length > 2 && (
              <button
                type="button"
                onClick={() => {
                  const newOptions = questionForm.options.filter((_, i) => i !== index);
                  setQuestionForm(prev => ({ ...prev, options: newOptions }));
                }}
                className="text-red-600 hover:text-red-800"
              >
                Remove
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )}

  {/* CODE Question Settings */}
  {questionForm.type === 'CODE' && (
    <div className="space-y-6">
      {/* Constraints */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Constraints
        </label>
        <textarea
          value={questionForm.constraints || ''}
          onChange={(e) => setQuestionForm(prev => ({ ...prev, constraints: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          rows={3}
          placeholder="e.g., 1 ≤ n ≤ 10^5, 1 ≤ arr[i] ≤ 10^9"
        />
      </div>

      {/* Time and Memory Limits */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Time Limit (ms)
          </label>
          <input
            type="number"
            min="1000"
            max="30000"
            value={questionForm.time_limit_ms || 5000}
            onChange={(e) => setQuestionForm(prev => ({ ...prev, time_limit_ms: parseInt(e.target.value) || 5000 }))}
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
            onChange={(e) => setQuestionForm(prev => ({ ...prev, memory_limit_mb: parseInt(e.target.value) || 256 }))}
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
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">Visible: {questionForm.visible_testcases.length}</span>
            <span className="text-sm text-gray-500">Hidden: {questionForm.hidden_testcases.length}</span>
          </div>
        </div>

        {/* File Upload Section */}
        <div className="mb-4 p-4 border-2 border-dashed border-gray-300 rounded-lg">
          <div className="text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
              <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div className="mt-4">
              <label htmlFor="testcase-upload" className="cursor-pointer">
                <span className="mt-2 block text-sm font-medium text-gray-900">
                  Upload test cases file (.txt)
                </span>
                <span className="mt-1 block text-sm text-gray-500">
                  Or drag and drop
                </span>
                <input
                  id="testcase-upload"
                  type="file"
                  className="sr-only"
                  accept=".txt"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        const content = event.target?.result as string;
                        try {
                          // Parse the custom format
                          const lines = content.split('\n').map(line => line.trim()).filter(line => line);
                          const visible_testcases: TestCase[] = [];
                          const hidden_testcases: TestCase[] = [];
                          
                          let currentSection: 'VISIBLE' | 'HIDDEN' | null = null;
                          let currentInput = '';
                          let currentOutput = '';
                          let parsingMode: 'INPUT' | 'OUTPUT' | null = null;
                          
                          for (const line of lines) {
                            if (line === 'VISIBLE') {
                              // Save previous test case if exists
                              if (currentInput && currentOutput && currentSection) {
                                const testCase = { input: currentInput.trim(), expected_output: currentOutput.trim() };
                                if (currentSection === 'VISIBLE') {
                                  visible_testcases.push(testCase);
                                } else {
                                  hidden_testcases.push(testCase);
                                }
                              }
                              currentSection = 'VISIBLE';
                              currentInput = '';
                              currentOutput = '';
                              parsingMode = null;
                              continue;
                            }
                            
                            if (line === 'HIDDEN') {
                              // Save previous test case if exists
                              if (currentInput && currentOutput && currentSection) {
                                const testCase = { input: currentInput.trim(), expected_output: currentOutput.trim() };
                                if (currentSection === 'VISIBLE') {
                                  visible_testcases.push(testCase);
                                } else {
                                  hidden_testcases.push(testCase);
                                }
                              }
                              currentSection = 'HIDDEN';
                              currentInput = '';
                              currentOutput = '';
                              parsingMode = null;
                              continue;
                            }
                            
                            if (line === 'INPUT:') {
                              // Save previous test case if exists
                              if (currentInput && currentOutput && currentSection) {
                                const testCase = { input: currentInput.trim(), expected_output: currentOutput.trim() };
                                if (currentSection === 'VISIBLE') {
                                  visible_testcases.push(testCase);
                                } else {
                                  hidden_testcases.push(testCase);
                                }
                              }
                              currentInput = '';
                              currentOutput = '';
                              parsingMode = 'INPUT';
                              continue;
                            }
                            
                            if (line === 'OUTPUT:') {
                              parsingMode = 'OUTPUT';
                              continue;
                            }
                            
                            if (parsingMode === 'INPUT') {
                              currentInput += (currentInput ? '\n' : '') + line;
                            } else if (parsingMode === 'OUTPUT') {
                              currentOutput += (currentOutput ? '\n' : '') + line;
                            }
                          }
                          
                          // Save last test case
                          if (currentInput && currentOutput && currentSection) {
                            const testCase = { input: currentInput.trim(), expected_output: currentOutput.trim() };
                            if (currentSection === 'VISIBLE') {
                              visible_testcases.push(testCase);
                            } else {
                              hidden_testcases.push(testCase);
                            }
                          }
                          
                          // Update the form state
                          setQuestionForm(prev => ({
                            ...prev,
                            visible_testcases: visible_testcases.length > 0 ? visible_testcases : prev.visible_testcases,
                            hidden_testcases: hidden_testcases.length > 0 ? hidden_testcases : prev.hidden_testcases
                          }));
                          
                          setUploadStatus({ 
                            type: 'success', 
                            message: `Successfully loaded ${visible_testcases.length} visible and ${hidden_testcases.length} hidden test cases` 
                          });
                        } catch (error) {
                          setUploadStatus({ type: 'error', message: 'Failed to parse file. Please check the format.' });
                        }
                      };
                      reader.readAsText(file);
                    }
                  }}
                />
              </label>
            </div>
          </div>
          
          {uploadStatus && (
            <div className={`mt-2 text-sm ${uploadStatus.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
              {uploadStatus.message}
            </div>
          )}
        </div>

        {/* Demo Format */}
        <div className="mb-4 p-3 bg-gray-100 rounded-lg">
          <div className="text-sm font-medium text-gray-700 mb-2">Expected File Format:</div>
          <pre className="text-xs text-gray-600 whitespace-pre-wrap">
{`VISIBLE
INPUT:
2 3
OUTPUT:
5

INPUT:
10 20
OUTPUT:
30

HIDDEN
INPUT:
1 1
OUTPUT:
2

INPUT:
100 200
OUTPUT:
300`}
          </pre>
          <div className="mt-2">
            <button
              type="button"
              className="text-blue-600 hover:text-blue-800 text-sm"
              onClick={() => {
                const element = document.createElement('a');
                const file = new Blob([`VISIBLE
INPUT:
2 3
OUTPUT:
5

INPUT:
10 20
OUTPUT:
30

HIDDEN
INPUT:
1 1
OUTPUT:
2

INPUT:
100 200
OUTPUT:
300`], {type: 'text/plain'});
                element.href = URL.createObjectURL(file);
                element.download = 'demo-testcases.txt';
                document.body.appendChild(element);
                element.click();
                document.body.removeChild(element);
              }}
            >
              Download Demo File
            </button>
          </div>
        </div>

        {/* Manual Test Case Entry */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Visible Test Cases */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-gray-700">Visible Test Cases</h4>
              <button
                type="button"
                onClick={() => addTestCase('visible_testcases')}
                className="text-green-600 hover:text-green-800 text-sm"
              >
                + Add
              </button>
            </div>
            <div className="space-y-3 max-h-40 overflow-y-auto">
              {questionForm.visible_testcases.map((testCase, index) => (
                <div key={index} className="p-3 border border-gray-200 rounded bg-green-50">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-medium text-gray-600">Test Case {index + 1}</span>
                    {questionForm.visible_testcases.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeTestCase('visible_testcases', index)}
                        className="text-red-600 hover:text-red-800 text-xs"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div>
                      <label className="text-xs text-gray-600">Input</label>
                      <textarea
                        value={testCase.input}
                        onChange={(e) => updateTestCase('visible_testcases', index, 'input', e.target.value)}
                        className="w-full text-xs p-2 border border-gray-300 rounded"
                        rows={2}
                        placeholder="Input data..."
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600">Expected Output</label>
                      <textarea
                        value={testCase.expected_output}
                        onChange={(e) => updateTestCase('visible_testcases', index, 'expected_output', e.target.value)}
                        className="w-full text-xs p-2 border border-gray-300 rounded"
                        rows={2}
                        placeholder="Expected output..."
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Hidden Test Cases */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-gray-700">Hidden Test Cases</h4>
              <button
                type="button"
                onClick={() => addTestCase('hidden_testcases')}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                + Add
              </button>
            </div>
            <div className="space-y-3 max-h-40 overflow-y-auto">
              {questionForm.hidden_testcases.map((testCase, index) => (
                <div key={index} className="p-3 border border-gray-200 rounded bg-blue-50">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-medium text-gray-600">Test Case {index + 1}</span>
                    {questionForm.hidden_testcases.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeTestCase('hidden_testcases', index)}
                        className="text-red-600 hover:text-red-800 text-xs"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div>
                      <label className="text-xs text-gray-600">Input</label>
                      <textarea
                        value={testCase.input}
                        onChange={(e) => updateTestCase('hidden_testcases', index, 'input', e.target.value)}
                        className="w-full text-xs p-2 border border-gray-300 rounded"
                        rows={2}
                        placeholder="Input data..."
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600">Expected Output</label>
                      <textarea
                        value={testCase.expected_output}
                        onChange={(e) => updateTestCase('hidden_testcases', index, 'expected_output', e.target.value)}
                        className="w-full text-xs p-2 border border-gray-300 rounded"
                        rows={2}
                        placeholder="Expected output..."
                      />
                    </div>
                  </div>
                </div>
              ))}
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
      onClick={clearQuestionForm}
      className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
    >
      Cancel
    </button>
    <button
      type="button"
      onClick={handleSaveQuestion}
      disabled={loading}
      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
    >
      {loading ? 'Saving...' : editingQuestionId ? 'Update Question' : 'Add Question'}
    </button>
  </div>
</div>
        </div>
      )}

      {error && (
        <div className="mt-6 p-4 bg-red-100 text-red-800 rounded-lg text-center">
          {error}
        </div>
      )}
      {success && (
        <div className="mt-6 p-4 bg-green-100 text-green-800 rounded-lg text-center">
          {success}
        </div>
      )}

      {/* Global styles for content rendering */}
      <style jsx global>{`
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

        .content-display pre code {
          background-color: transparent !important;
          padding: 0 !important;
          border-radius: 0 !important;
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
      `}</style>
    </div>
  );
};

export default ManageTest;
