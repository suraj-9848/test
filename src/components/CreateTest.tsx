
import React, { useEffect, useState } from "react";
import { createTest } from "../api/testApi";
import { instructorApi, Course, Batch } from "../api/instructorApi";

interface CreateTestProps {
  setActiveSection?: (section: string) => void;
}

const CreateTest: React.FC<CreateTestProps> = ({ setActiveSection }) => {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedBatch, setSelectedBatch] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [form, setForm] = useState({
    title: "",
    description: "",
    maxMarks: 100,
    passingMarks: 40,
    durationInMinutes: 60,
    startDate: "",
    endDate: "",
    shuffleQuestions: false,
    showResults: true,
    showCorrectAnswers: false,
    maxAttempts: 1, // FIELD for backend
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    instructorApi
      .getBatches()
      .then((res) => setBatches(res.batches))
      .catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    if (selectedBatch) {
      instructorApi
        .getCourses()
        .then((res: { courses: import("../api/instructorApi").Course[] }) => {
          const batchIdStr = String(selectedBatch);
          const filtered = res.courses.filter((course) => {
            // Accept possible batch_id, batchId, or batch.id fields
            const batch_id = (course as { batch_id?: string }).batch_id;
            const batchId = (course as { batchId?: string }).batchId;
            const batch = (course as { batch?: { id?: string } }).batch;
            return (
              (typeof batch_id === "string" && batch_id === batchIdStr) ||
              (typeof batchId === "string" && batchId === batchIdStr) ||
              (batch && typeof batch.id === "string" && batch.id === batchIdStr)
            );
          });
          setCourses(filtered.length === 0 ? res.courses : filtered);
        })
        .catch((err: unknown) => {
          if (err instanceof Error) setError(err.message);
          else setError("Failed to fetch courses");
        });
    } else {
      setCourses([]);
      setSelectedCourse("");
    }
  }, [selectedBatch]);

  // Change Start/End Date to support date+time
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, type, value } = e.target;
    if (type === "checkbox") {
      setForm({
        ...form,
        [name]: (e.target as HTMLInputElement).checked,
      });
    } else if (name === "numberOfAttempts" || name === "maxAttempts") {
      // Always store as a number, fallback to 1 if empty or invalid
      const num = value === "" ? 1 : Math.max(1, Number(value));
      setForm({
        ...form,
        maxAttempts: num,
      });
    } else {
      setForm({
        ...form,
        [name]: value,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    // Validate required fields
    if (
      !form.title ||
      !form.maxMarks ||
      !form.passingMarks ||
      !form.durationInMinutes ||
      !form.startDate ||
      !form.endDate ||
      !form.maxAttempts ||
      isNaN(form.maxAttempts) ||
      form.maxAttempts < 1
    ) {
      setError(
        "Please fill all required fields, including number of attempts."
      );
      setLoading(false);
      return;
    }
    try {
      await createTest(selectedBatch, selectedCourse, form);
      setSuccess("Test created successfully!");
      setForm({
        title: "",
        description: "",
        maxMarks: 100,
        passingMarks: 40,
        durationInMinutes: 60,
        startDate: "",
        endDate: "",
        shuffleQuestions: false,
        showResults: true,
        showCorrectAnswers: false,
        maxAttempts: 1,
      });
      // Redirect to Manage Test if setActiveSection is provided
      if (setActiveSection) {
        setTimeout(() => setActiveSection("manage-test"), 800); // short delay for UX
      }
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError("Failed to create test");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-10 bg-white/60 backdrop-blur-sm rounded-2xl shadow-2xl border border-slate-200/50 p-8">
      <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
        Create Test
      </h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-semibold mb-2 text-slate-700">
              Batch
            </label>
            <select
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
              required
              className="w-full px-4 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm"
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
            <label className="block text-sm font-semibold mb-2 text-slate-700">
              Course
            </label>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              required
              disabled={!selectedBatch}
              className="w-full px-4 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm"
            >
              <option value="">Select Course</option>
              {courses.length === 0 && selectedBatch && (
                <option value="" disabled>
                  No courses available for this batch
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
        {selectedBatch && selectedCourse && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold mb-2 text-slate-700">
                Test Title
              </label>
              <input
                type="text"
                name="title"
                placeholder="Test Title"
                value={form.title}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-slate-700">
                Description
              </label>
              <textarea
                name="description"
                placeholder="Description"
                value={form.description}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-slate-700">
                Max Marks
              </label>
              <input
                type="number"
                name="maxMarks"
                placeholder="Max Marks"
                value={form.maxMarks}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-slate-700">
                Passing Marks
              </label>
              <input
                type="number"
                name="passingMarks"
                placeholder="Passing Marks"
                value={form.passingMarks}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-slate-700">
                Duration (minutes)
              </label>
              <input
                type="number"
                name="durationInMinutes"
                placeholder="Duration (minutes)"
                value={form.durationInMinutes}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-slate-700">
                Start Date & Time
              </label>
              <input
                type="datetime-local"
                name="startDate"
                value={form.startDate}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-slate-700">
                End Date & Time
              </label>
              <input
                type="datetime-local"
                name="endDate"
                value={form.endDate}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-slate-700">
                Shuffle Questions
              </label>
              <input
                type="checkbox"
                name="shuffleQuestions"
                checked={form.shuffleQuestions}
                onChange={(e) =>
                  setForm({ ...form, shuffleQuestions: e.target.checked })
                }
                className="mr-2 h-4 w-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-slate-600">
                Enable random order for questions
              </span>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-slate-700">
                Show Results After Submission
              </label>
              <input
                type="checkbox"
                name="showResults"
                checked={form.showResults}
                onChange={(e) =>
                  setForm({ ...form, showResults: e.target.checked })
                }
                className="mr-2 h-4 w-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-slate-600">
                Show score to student after test
              </span>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-slate-700">
                Show Correct Answers
              </label>
              <input
                type="checkbox"
                name="showCorrectAnswers"
                checked={form.showCorrectAnswers}
                onChange={(e) =>
                  setForm({ ...form, showCorrectAnswers: e.target.checked })
                }
                className="mr-2 h-4 w-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-slate-600">
                Reveal correct answers after test
              </span>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-slate-700">
                Max Attempts
              </label>
              <input
                type="number"
                name="maxAttempts"
                min={1}
                value={form.maxAttempts}
                onChange={handleChange}
                required
                inputMode="numeric"
                pattern="[0-9]*"
                className="w-full px-4 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm"
              />
            </div>
          </div>
        )}
        <div className="flex justify-end mt-8">
          <button
            type="submit"
            disabled={loading}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold px-8 py-3 rounded-xl shadow-lg hover:scale-[1.03] transition-transform duration-200 disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Test"}
          </button>
        </div>
      </form>
      {error && (
        <p className="mt-6 text-red-600 font-semibold text-center bg-red-100 rounded-xl p-3 shadow">
          {error}
        </p>
      )}
      {success && (
        <p className="mt-6 text-green-600 font-semibold text-center bg-green-100 rounded-xl p-3 shadow">
          {success}
        </p>
      )}
    </div>
  );
};

export default CreateTest;
