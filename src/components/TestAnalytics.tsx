import React, { useEffect, useState } from "react";
import { fetchTestAnalytics } from "../api/testApi";
import { instructorApi } from "../api/instructorApi";
import { fetchTests } from "../api/testApi";

type Student = {
  id: string;
  username: string;
  email: string;
};

const TestAnalytics: React.FC = () => {
  type Batch = { id: string; name: string };
  type Course = {
    id: string;
    title: string;
    batch_id?: string;
    batchId?: string;
    batch?: { id: string };
  };
  type Test = { id: string; title: string };
  const [batches, setBatches] = useState<Batch[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [selectedBatch, setSelectedBatch] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedTestId, setSelectedTestId] = useState("");
  const [analytics, setAnalytics] = useState<{
    totalEnrolled: number;
    gaveTest: number;
    didNotGiveTest: number;
    studentsGave: Student[];
    studentsNotGave: Student[];
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
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
          const filtered = (res.courses || []).filter((course: Course) => {
            if (String(course.batch_id) === batchIdStr) return true;
            if ("batchId" in course && String(course.batchId) === batchIdStr)
              return true;
            if (
              "batch" in course &&
              course.batch &&
              String(course.batch.id) === batchIdStr
            )
              return true;
            return false;
          });
          const sortedCourses = filtered.length === 0 ? res.courses : filtered;
          setCourses(
            sortedCourses.sort((a: Course, b: Course) =>
              a.title.localeCompare(b.title)
            )
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
          // Support both { data: { tests } } and { tests }
          let safeTests: Test[] = [];
          if (res && Array.isArray(res?.data?.tests)) {
            safeTests = res.data.tests;
          } else if (res && Array.isArray(res?.tests)) {
            safeTests = res.tests;
          }
          setTests(
            safeTests.sort((a: Test, b: Test) => a.title.localeCompare(b.title))
          );
          setLoading(false);
        })
        .catch((err: { message: string }) => {
          setError(err.message || "Failed to fetch tests");
          setLoading(false);
        });
    } else {
      setTests([]);
      setSelectedTestId("");
    }
  }, [selectedBatch, selectedCourse]);

  useEffect(() => {
    if (selectedBatch && selectedCourse && selectedTestId) {
      setLoading(true);
      setError(null);
      fetchTestAnalytics(selectedBatch, selectedCourse, selectedTestId)
        .then(setAnalytics)
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    } else {
      setAnalytics(null);
    }
  }, [selectedBatch, selectedCourse, selectedTestId]);

  return (
    <div className="max-w-2xl mx-auto mt-10 p-8 bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100">
      <h2 className="text-3xl font-bold mb-8 text-gray-800">Test Analytics</h2>
      <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-6">
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
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Test
          </label>
          <select
            value={selectedTestId}
            onChange={(e) => setSelectedTestId(e.target.value)}
            disabled={!selectedBatch || !selectedCourse}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
          >
            <option value="">Select Test</option>
            {tests.length === 0 && selectedBatch && selectedCourse && (
              <option value="" disabled>
                No tests available
              </option>
            )}
            {tests.map((test) => (
              <option key={test.id} value={test.id}>
                {test.title}
              </option>
            ))}
          </select>
        </div>
      </div>
      {loading && <div className="text-center text-blue-600">Loading...</div>}
      {error && (
        <div className="mt-6 p-4 bg-red-100 text-red-800 rounded-lg text-center">
          {error}
        </div>
      )}
      {analytics && !loading && !error && (
        <div className="mt-8 p-6 bg-gray-50 rounded-lg">
          <div className="mb-4">
            <strong>Total Enrolled:</strong> {analytics.totalEnrolled}
          </div>
          <div className="mb-2">
            <span className="text-green-700 font-semibold">
              Gave Test: {analytics.gaveTest}
            </span>
          </div>
          <div className="mb-4">
            <span className="text-red-700 font-semibold">
              Did Not Give Test: {analytics.didNotGiveTest}
            </span>
          </div>
          <div className="mb-4">
            <details>
              <summary className="cursor-pointer font-medium">
                View Students Who Gave Test ({analytics.gaveTest})
              </summary>
              <ul className="list-disc ml-6 mt-2">
                {analytics.studentsGave.map((s) => (
                  <li key={s.id}>{s.username || s.email || s.id}</li>
                ))}
              </ul>
            </details>
          </div>
          <div>
            <details>
              <summary className="cursor-pointer font-medium">
                View Students Who Did Not Give Test ({analytics.didNotGiveTest})
              </summary>
              <ul className="list-disc ml-6 mt-2">
                {analytics.studentsNotGave.map((s) => (
                  <li key={s.id}>{s.username || s.email || s.id}</li>
                ))}
              </ul>
            </details>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestAnalytics;
