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
import {
  instructorApi,
  Test,
  Batch,
  Course,
  Question,
} from "../api/instructorApi";

const ManageTest: React.FC = () => {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  type UpdateTestPayload = {
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
  };
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
  const [showQuestionManager, setShowQuestionManager] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionEditTestId, setQuestionEditTestId] = useState<string>("");
  const [questionForm, setQuestionForm] = useState<{
    question_text: string;
    type: "MCQ" | "DESCRIPTIVE" | "CODE";
    marks: number;
    options: { text: string; correct: boolean }[];
  }>({
    question_text: "",
    type: "MCQ",
    marks: 1,
    options: [{ text: "", correct: false }],
  });
  const [editingQuestionId, setEditingQuestionId] = useState<string>("");
  const editorRef = useRef<RichTextEditorHandle>(null);

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
          const batchIdStr = String(selectedBatch);
          const filtered = (res.courses || []).filter((course) => {
            if (String(course.batch_id) === batchIdStr) return true;
            if (
              "batchId" in course &&
              typeof course.batchId === "string" &&
              course.batchId === batchIdStr
            )
              return true;
            if (
              "batch" in course &&
              course.batch &&
              typeof course.batch === "object" &&
              course.batch !== null &&
              "id" in course.batch &&
              typeof (course.batch as { id: unknown }).id === "string" &&
              (course.batch as { id: string }).id === batchIdStr
            )
              return true;
            return false;
          });
          const sortedCourses = filtered.length === 0 ? res.courses : filtered;
          setCourses(
            sortedCourses.sort((a, b) => a.title.localeCompare(b.title))
          );
          setLoading(false);
        })
        .catch((err) => {
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
            safeTests.sort((a: Test, b: Test) => a.title.localeCompare(b.title))
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

  // Helper to convert UTC ISO string to local datetime-local string
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

  // Helper to convert local datetime-local string to UTC ISO string
  function localDatetimeInputToUTC(localString: string): string {
    if (!localString) return "";
    const localDate = new Date(localString);
    return localDate.toISOString();
  }

  const handleSelectTest = (testId: string) => {
    const test = tests.find((t) => t.id === testId);
    setSelectedTestId(testId);
    setEditTitle(test?.title || "");
    setEditDescription(test?.description || "");
    setEditMaxMarks(typeof test?.maxMarks === "number" ? test.maxMarks : 1);
    setEditPassingMarks(
      typeof test?.passingMarks === "number" ? test.passingMarks : 0
    );
    setEditDuration(
      typeof test?.durationInMinutes === "number" ? test.durationInMinutes : 1
    );
    setEditStartDate(
      test?.startDate ? utcToLocalDatetimeInput(test.startDate) : ""
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
            "Both start and end date/time are required for published tests."
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
        Array.isArray(updatedTests?.data?.tests) ? updatedTests.data.tests : []
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
        Array.isArray(updatedTests?.data?.tests) ? updatedTests.data.tests : []
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

  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const html = editorRef.current?.getContent() || "";
    if (!html || !html.replace(/<[^>]+>/g, "").trim()) {
      setLoading(false);
      setError("Question text cannot be empty.");
      return;
    }
    try {
      const payload = {
        question_text: html,
        type: questionForm.type,
        marks: questionForm.marks,
        options: questionForm.type === "MCQ" ? questionForm.options : undefined,
      };
      if (editingQuestionId) {
        await updateQuestionInTest(
          selectedBatch,
          selectedCourse,
          questionEditTestId,
          editingQuestionId,
          payload
        );
        setSuccess("Question updated successfully!");
      } else {
        await addQuestionToTest(
          selectedBatch,
          selectedCourse,
          questionEditTestId,
          payload
        );
        setSuccess("Question added successfully!");
      }
      const res = await getQuestions(
        selectedBatch,
        selectedCourse,
        questionEditTestId
      );
      setQuestions(
        Array.isArray(res.data?.questions) ? res.data.questions : []
      );
      setQuestionForm({
        question_text: "",
        type: "MCQ",
        marks: 1,
        options: [{ text: "", correct: false }],
      });
      setEditingQuestionId("");
      editorRef.current?.setContent("");
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
    });
    setEditingQuestionId("");
    editorRef.current?.setContent("");
  };

  const handleEditQuestion = (q: Question) => {
    setQuestionForm({
      question_text: q.question_text,
      type: q.type,
      marks: q.marks,
      options: q.options
        ? q.options.map((o) => ({ text: o.text, correct: o.correct }))
        : [{ text: "", correct: false }],
    });
    setEditingQuestionId(q.id);
    editorRef.current?.setContent(q.question_text || "");
  };

  const handleDeleteQuestion = async (qid: string) => {
    setLoading(true);
    setError("");
    try {
      await deleteQuestionFromTest(
        selectedBatch,
        selectedCourse,
        questionEditTestId,
        qid
      );
      const res = await getQuestions(
        selectedBatch,
        selectedCourse,
        questionEditTestId
      );
      setQuestions(
        Array.isArray(res.data?.questions) ? res.data.questions : []
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
    value: string | boolean
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
      console.log("[DEBUG] testQuestions before publish:", testQuestions);
      if (testQuestions.length === 0) {
        setError("Cannot publish: Test must have at least one question.");
        setLoading(false);
        return;
      }
      const mcqWithNoCorrect = testQuestions.filter(
        (q: { type: string; options?: { correct: boolean }[] }) =>
          q.type === "MCQ" &&
          (!q.options || q.options.filter((o) => o.correct).length === 0)
      );
      if (mcqWithNoCorrect.length > 0) {
        setError(
          "Cannot publish: All MCQ questions must have at least one correct answer. Debug: Offending question(s): " +
            mcqWithNoCorrect
              .map((q: Question) => q.question_text || q.id)
              .join(", ")
        );
        setLoading(false);
        return;
      }
      await publishTest(selectedBatch, selectedCourse, testId);
      setSuccess("Test published successfully!");
      const updatedTests = await fetchTests(selectedBatch, selectedCourse);
      setTests(
        Array.isArray(updatedTests?.data?.tests) ? updatedTests.data.tests : []
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
    <div className="max-w-6xl mx-auto mt-10 p-8 bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100">
      <h2 className="text-3xl font-bold mb-8 text-gray-800">Manage Tests</h2>
      {loading && <div className="text-center text-blue-600">Loading...</div>}
      <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Batch
          </label>
          <select
            value={selectedBatch}
            onChange={(e) => setSelectedBatch(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select Batch</option>
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
            disabled={!selectedBatch}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
          >
            <option value="">Select Course</option>
            {courses.length === 0 && selectedBatch && (
              <option value="" disabled>
                No courses available
              </option>
            )}
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedTestId &&
        (() => {
          const test = tests.find((t) => t.id === selectedTestId);
          const isPublished = test?.status === "PUBLISHED";
          return (
            <div className="mb-8 p-6 bg-gray-50 rounded-lg">
              <h3 className="text-xl font-semibold mb-4 text-gray-800">
                Edit Test
              </h3>
              {isPublished ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-4">
                    <input
                      type="datetime-local"
                      value={editStartDate}
                      onChange={(e) => setEditStartDate(e.target.value)}
                      placeholder="Start Date"
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      step="60"
                      required
                    />
                    <input
                      type="datetime-local"
                      value={editEndDate}
                      onChange={(e) => setEditEndDate(e.target.value)}
                      placeholder="End Date"
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      step="60"
                      required
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-4">
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      placeholder="Test Title"
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      placeholder="Test Description"
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="number"
                      value={editMaxMarks ?? ""}
                      min={1}
                      onChange={(e) => setEditMaxMarks(Number(e.target.value))}
                      placeholder="Max Marks"
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <input
                      type="number"
                      value={editPassingMarks ?? ""}
                      min={0}
                      onChange={(e) =>
                        setEditPassingMarks(Number(e.target.value))
                      }
                      placeholder="Passing Marks"
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <input
                      type="number"
                      value={editDuration ?? ""}
                      min={1}
                      onChange={(e) => setEditDuration(Number(e.target.value))}
                      placeholder="Duration (minutes)"
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-4">
                    <input
                      type="datetime-local"
                      value={editStartDate}
                      onChange={(e) => setEditStartDate(e.target.value)}
                      placeholder="Start Date"
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      step="60"
                    />
                    <input
                      type="datetime-local"
                      value={editEndDate}
                      onChange={(e) => setEditEndDate(e.target.value)}
                      placeholder="End Date"
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      step="60"
                    />
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
                        className={`px-3 py-1 rounded text-xs font-medium ${
                          test.status === "PUBLISHED"
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
                          new Date(test.endDate) > new Date()
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
                  className="flex justify-between items-center p-4 bg-gray-50 rounded-lg"
                >
                  <span
                    className="font-medium"
                    dangerouslySetInnerHTML={{ __html: q.question_text }}
                  />
                  <div className="flex gap-3">
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
          <form
            onSubmit={handleSaveQuestion}
            className="p-6 bg-gray-50 rounded-lg border border-gray-200 shadow-sm mt-8"
          >
            <h4 className="text-lg font-semibold mb-4 border-b pb-2">
              {editingQuestionId ? "Edit" : "Add"} Question
            </h4>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Question Text
              </label>
              <RichTextEditor
                ref={editorRef}
                initialContent={questionForm.question_text}
                onChange={(html: string) => {
                  setQuestionForm((f) => ({ ...f, question_text: html }));
                }}
              />
            </div>
            <input
              type="hidden"
              value={questionForm.question_text}
              required
              readOnly
            />
            <input type="hidden" name="type" value="MCQ" />
            {questionForm.type === "MCQ" && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Options
                </label>
                {questionForm.options.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-3 mb-2">
                    <input
                      type="text"
                      value={opt.text}
                      onChange={(e) =>
                        handleOptionChange(idx, "text", e.target.value)
                      }
                      placeholder={`Option ${idx + 1}`}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={opt.correct}
                        onChange={(e) =>
                          handleOptionChange(idx, "correct", e.target.checked)
                        }
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-gray-700">Correct</span>
                    </label>
                    {questionForm.options.length > 1 && (
                      <button
                        type="button"
                        className="text-red-600 hover:text-red-800"
                        onClick={() => handleRemoveOption(idx)}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  className="text-blue-600 hover:underline mt-2"
                  onClick={handleAddOption}
                >
                  + Add Option
                </button>
              </div>
            )}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Marks
              </label>
              <input
                type="number"
                value={questionForm.marks}
                min={1}
                onChange={(e) =>
                  setQuestionForm((f) => ({
                    ...f,
                    marks: Number(e.target.value),
                  }))
                }
                className="w-24 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300"
              >
                {editingQuestionId ? "Update" : "Add"} Question
              </button>
              {editingQuestionId && (
                <button
                  type="button"
                  className="px-6 py-2 text-gray-600 hover:underline"
                  onClick={clearQuestionForm}
                >
                  Cancel
                </button>
              )}
              <button
                type="button"
                className="px-6 py-2 text-gray-600 hover:underline"
                onClick={clearQuestionForm}
              >
                Clear
              </button>
            </div>
          </form>
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
    </div>
  );
};

export default ManageTest;