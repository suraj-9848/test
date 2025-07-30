import React, { useState, useEffect } from "react";
import {
  FaPlus,
  FaCheck,
  FaTimes,
  FaSpinner,
  FaExchangeAlt,
  FaGraduationCap,
  FaBook,
  FaSearch,
  FaInfoCircle,
  FaLink,
  FaCheckCircle,
  FaMinus,
  FaUnlink,
} from "react-icons/fa";
import { instructorApi, Course, Batch } from "@/api/instructorApi";
import { getCoursesForBatch } from "@/api/batchCourseApi";
import { getAuthHeaders } from "@/utils/auth";

interface CourseWithBatches extends Course {
  batches?: Batch[];
}

const CourseBatchAssignment: React.FC = () => {
  const [courses, setCourses] = useState<CourseWithBatches[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [selectedBatches, setSelectedBatches] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [searchCourse, setSearchCourse] = useState("");
  const [searchBatch, setSearchBatch] = useState("");
  const [batchCourses, setBatchCourses] = useState<Record<string, Course[]>>(
    {}
  );
  const [courseBatches, setCourseBatches] = useState<Record<string, Batch[]>>(
    {}
  );
  const [actionMode, setActionMode] = useState<"assign" | "remove">("assign");

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [coursesData, batchesData] = await Promise.all([
        instructorApi.getCourses(),
        instructorApi.getBatches(),
      ]);

      setCourses(coursesData.courses || []);
      setBatches(batchesData.batches || []);

      const batchCoursesData: Record<string, Course[]> = {};
      const courseBatchesData: Record<string, Batch[]> = {};

      for (const batch of batchesData.batches || []) {
        try {
          const courses = await getCoursesForBatch(batch.id);
          batchCoursesData[batch.id] = courses;

          courses.forEach((course: { id: string | number }) => {
            if (!courseBatchesData[course.id]) {
              courseBatchesData[course.id] = [];
            }
            courseBatchesData[course.id].push(batch);
          });
        } catch (err) {
          console.error(`Error fetching courses for batch ${batch.id}:`, err);
          batchCoursesData[batch.id] = [];
        }
      }

      setBatchCourses(batchCoursesData);
      setCourseBatches(courseBatchesData);
    } catch (err: unknown) {
      console.error("Error fetching data:", err);
      setError("Failed to fetch courses and batches");
    } finally {
      setLoading(false);
    }
  };

  const updateCourseBatchAssignments = async (
    courseId: string,
    batchIds: string[]
  ) => {
    const baseUrl = process.env.NEXT_PUBLIC_BACKEND_BASE_URL;
    if (!baseUrl) {
      throw new Error("Backend URL not configured");
    }

    const headers = await getAuthHeaders();
    const response = await fetch(
      `${baseUrl}/api/instructor/courses/${courseId}`,
      {
        method: "PUT",
        headers: {
          ...headers,
        },
        body: JSON.stringify({
          batch_ids: batchIds,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message ||
          `Failed to update course ${courseId}: HTTP ${response.status}`
      );
    }

    return response.json();
  };

  const handleAssignCoursesToBatches = async () => {
    if (selectedCourses.length === 0 || selectedBatches.length === 0) {
      setError("Please select at least one course and one batch");
      return;
    }

    try {
      setLoading(true);
      setError("");

      if (actionMode === "assign") {
        const updatePromises = selectedCourses.map((courseId) => {
          const existingBatchIds = (courseBatches[courseId] || []).map(
            (batch) => batch.id
          );
          const allBatchIds = [
            ...new Set([...existingBatchIds, ...selectedBatches]),
          ];
          return updateCourseBatchAssignments(courseId, allBatchIds);
        });

        const results = await Promise.allSettled(updatePromises);

        const failures = results.filter(
          (result) => result.status === "rejected"
        ) as PromiseRejectedResult[];

        if (failures.length > 0) {
          const errorMessages = failures.map(
            (failure) => failure.reason?.message || "Unknown error"
          );
          throw new Error(
            `${failures.length} assignment(s) failed: ${errorMessages.join(
              ", "
            )}`
          );
        }

        setSuccessMessage(
          `Successfully assigned ${selectedCourses.length} course(s) to ${selectedBatches.length} batch(es)`
        );
      } else {
        const updatePromises = selectedCourses.map((courseId) => {
          const existingBatchIds = (courseBatches[courseId] || []).map(
            (batch) => batch.id
          );
          const remainingBatchIds = existingBatchIds.filter(
            (batchId) => !selectedBatches.includes(batchId)
          );
          return updateCourseBatchAssignments(courseId, remainingBatchIds);
        });

        const results = await Promise.allSettled(updatePromises);

        const failures = results.filter(
          (result) => result.status === "rejected"
        ) as PromiseRejectedResult[];

        if (failures.length > 0) {
          const errorMessages = failures.map(
            (failure) => failure.reason?.message || "Unknown error"
          );
          throw new Error(
            `${failures.length} removal(s) failed: ${errorMessages.join(", ")}`
          );
        }

        setSuccessMessage(
          `Successfully removed ${selectedCourses.length} course(s) from ${selectedBatches.length} batch(es)`
        );
      }

      setSelectedCourses([]);
      setSelectedBatches([]);

      await fetchInitialData();

      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err: unknown) {
      console.error("Error processing course-batch assignment:", err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to process course-batch assignment";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const toggleCourseSelection = (courseId: string) => {
    setSelectedCourses((prev) =>
      prev.includes(courseId)
        ? prev.filter((id) => id !== courseId)
        : [...prev, courseId]
    );
  };

  const toggleBatchSelection = (batchId: string) => {
    setSelectedBatches((prev) =>
      prev.includes(batchId)
        ? prev.filter((id) => id !== batchId)
        : [...prev, batchId]
    );
  };

  const isCourseAlreadyAssignedToSelectedBatches = (courseId: string) => {
    if (selectedBatches.length === 0) return false;
    const courseCurrentBatches = (courseBatches[courseId] || []).map(
      (batch) => batch.id
    );
    return selectedBatches.every((batchId) =>
      courseCurrentBatches.includes(batchId)
    );
  };

  const isCourseAssignedToSelectedBatches = (courseId: string) => {
    if (selectedBatches.length === 0) return false;
    const courseCurrentBatches = (courseBatches[courseId] || []).map(
      (batch) => batch.id
    );
    return selectedBatches.some((batchId) =>
      courseCurrentBatches.includes(batchId)
    );
  };

  const isBatchAlreadyContainsSelectedCourses = (batchId: string) => {
    if (selectedCourses.length === 0) return false;
    const batchCurrentCourses = (batchCourses[batchId] || []).map(
      (course) => course.id
    );
    return selectedCourses.every((courseId) =>
      batchCurrentCourses.includes(courseId)
    );
  };

  const isBatchContainsSelectedCourses = (batchId: string) => {
    if (selectedCourses.length === 0) return false;
    const batchCurrentCourses = (batchCourses[batchId] || []).map(
      (course) => course.id
    );
    return selectedCourses.some((courseId) =>
      batchCurrentCourses.includes(courseId)
    );
  };

  const filteredCourses = courses.filter(
    (course) =>
      course.title.toLowerCase().includes(searchCourse.toLowerCase()) ||
      (course.description &&
        course.description.toLowerCase().includes(searchCourse.toLowerCase()))
  );

  const filteredBatches = batches.filter(
    (batch) =>
      batch.name.toLowerCase().includes(searchBatch.toLowerCase()) ||
      (batch.description &&
        batch.description.toLowerCase().includes(searchBatch.toLowerCase()))
  );

  const CourseCard: React.FC<{
    course: CourseWithBatches;
    isSelected: boolean;
    onClick: () => void;
  }> = ({ course, isSelected, onClick }) => {
    const assignedBatches = courseBatches[course.id] || [];
    const isAlreadyAssigned =
      actionMode === "assign"
        ? isCourseAlreadyAssignedToSelectedBatches(course.id)
        : isCourseAssignedToSelectedBatches(course.id);

    const canBeRemoved =
      actionMode === "remove" && isCourseAssignedToSelectedBatches(course.id);

    return (
      <div
        onClick={onClick}
        className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 relative ${
          isSelected
            ? actionMode === "assign"
              ? "border-blue-500 bg-blue-50 shadow-md"
              : "border-red-500 bg-red-50 shadow-md"
            : actionMode === "assign" && isAlreadyAssigned
            ? "border-green-300 bg-green-50 opacity-75"
            : actionMode === "remove" && canBeRemoved
            ? "border-orange-300 bg-orange-50 opacity-90"
            : actionMode === "remove" && !canBeRemoved
            ? "border-slate-200 bg-slate-50 opacity-50 cursor-not-allowed"
            : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
        }`}
      >
        {actionMode === "assign" && isAlreadyAssigned && (
          <div className="absolute top-2 right-2">
            <FaCheckCircle
              className="w-4 h-4 text-green-600"
              title="Already assigned to selected batches"
            />
          </div>
        )}
        {actionMode === "remove" && canBeRemoved && (
          <div className="absolute top-2 right-2">
            <FaUnlink
              className="w-4 h-4 text-orange-600"
              title="Can be removed from selected batches"
            />
          </div>
        )}
        {actionMode === "remove" &&
          !canBeRemoved &&
          selectedBatches.length > 0 && (
            <div className="absolute top-2 right-2">
              <FaTimes
                className="w-4 h-4 text-slate-400"
                title="Not assigned to selected batches"
              />
            </div>
          )}

        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <FaBook className="w-4 h-4 text-blue-600" />
            <h3 className="font-semibold text-slate-800 truncate">
              {course.title}
            </h3>
          </div>
          {isSelected && (
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center ${
                actionMode === "assign" ? "bg-blue-500" : "bg-red-500"
              }`}
            >
              <FaCheck className="w-3 h-3 text-white" />
            </div>
          )}
        </div>

        <p className="text-sm text-slate-600 line-clamp-2 mb-2">
          {course.description || "No description available"}
        </p>

        <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
          <span>By: {course.instructor_name}</span>
          <span
            className={`px-2 py-1 rounded ${
              course.is_public
                ? "bg-green-100 text-green-700"
                : "bg-yellow-100 text-yellow-700"
            }`}
          >
            {course.is_public ? "Public" : "Private"}
          </span>
        </div>

        {assignedBatches.length > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-200">
            <div className="flex items-center space-x-1 mb-2">
              <FaLink className="w-3 h-3 text-slate-400" />
              <span className="text-xs font-medium text-slate-600">
                Assigned to {assignedBatches.length} batch(es):
              </span>
            </div>
            <div className="flex flex-wrap gap-1">
              {assignedBatches.map((batch) => (
                <span
                  key={batch.id}
                  className={`inline-block px-2 py-1 text-xs rounded border ${
                    actionMode === "remove" &&
                    selectedBatches.includes(batch.id)
                      ? "bg-red-100 text-red-700 border-red-300"
                      : "bg-slate-100 text-slate-700 border-slate-300"
                  }`}
                  title={batch.description || "No description"}
                >
                  {batch.name}
                  {actionMode === "remove" &&
                    selectedBatches.includes(batch.id) && (
                      <FaTimes className="inline w-2 h-2 ml-1" />
                    )}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const BatchCard: React.FC<{
    batch: Batch;
    isSelected: boolean;
    onClick: () => void;
  }> = ({ batch, isSelected, onClick }) => {
    const assignedCourses = batchCourses[batch.id] || [];
    const isAlreadyContainsCourses =
      actionMode === "assign"
        ? isBatchAlreadyContainsSelectedCourses(batch.id)
        : isBatchContainsSelectedCourses(batch.id);

    const canBeModified =
      actionMode === "remove" && isBatchContainsSelectedCourses(batch.id);

    return (
      <div
        onClick={onClick}
        className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 relative ${
          isSelected
            ? actionMode === "assign"
              ? "border-green-500 bg-green-50 shadow-md"
              : "border-red-500 bg-red-50 shadow-md"
            : actionMode === "assign" && isAlreadyContainsCourses
            ? "border-blue-300 bg-blue-50 opacity-75"
            : actionMode === "remove" && canBeModified
            ? "border-orange-300 bg-orange-50 opacity-90"
            : actionMode === "remove" && !canBeModified
            ? "border-slate-200 bg-slate-50 opacity-50 cursor-not-allowed"
            : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
        }`}
      >
        {actionMode === "assign" && isAlreadyContainsCourses && (
          <div className="absolute top-2 right-2">
            <FaCheckCircle
              className="w-4 h-4 text-blue-600"
              title="Already contains selected courses"
            />
          </div>
        )}
        {actionMode === "remove" && canBeModified && (
          <div className="absolute top-2 right-2">
            <FaUnlink
              className="w-4 h-4 text-orange-600"
              title="Contains selected courses (can remove)"
            />
          </div>
        )}
        {actionMode === "remove" &&
          !canBeModified &&
          selectedCourses.length > 0 && (
            <div className="absolute top-2 right-2">
              <FaTimes
                className="w-4 h-4 text-slate-400"
                title="Doesn't contain selected courses"
              />
            </div>
          )}

        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <FaGraduationCap className="w-4 h-4 text-green-600" />
            <h3 className="font-semibold text-slate-800 truncate">
              {batch.name}
            </h3>
          </div>
          {isSelected && (
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center ${
                actionMode === "assign" ? "bg-green-500" : "bg-red-500"
              }`}
            >
              <FaCheck className="w-3 h-3 text-white" />
            </div>
          )}
        </div>

        <p className="text-sm text-slate-600 line-clamp-2 mb-2">
          {batch.description || "No description available"}
        </p>

        <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
          <span>{assignedCourses.length} courses assigned</span>
          <span>ID: {batch.id.slice(-8)}</span>
        </div>

        {assignedCourses.length > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-200">
            <div className="flex items-center space-x-1 mb-2">
              <FaLink className="w-3 h-3 text-slate-400" />
              <span className="text-xs font-medium text-slate-600">
                Contains {assignedCourses.length} course(s):
              </span>
            </div>
            <div className="flex flex-wrap gap-1">
              {assignedCourses.map((course) => (
                <span
                  key={course.id}
                  className={`inline-block px-2 py-1 text-xs rounded border ${
                    actionMode === "remove" &&
                    selectedCourses.includes(course.id)
                      ? "bg-red-100 text-red-700 border-red-300"
                      : "bg-slate-100 text-slate-700 border-slate-300"
                  }`}
                  title={course.description || "No description"}
                >
                  {course.title}
                  {actionMode === "remove" &&
                    selectedCourses.includes(course.id) && (
                      <FaTimes className="inline w-2 h-2 ml-1" />
                    )}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (loading && courses.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <FaSpinner className="animate-spin text-4xl text-blue-600" />
        <span className="ml-2 text-lg">Loading courses and batches...</span>
      </div>
    );
  }

  const getAssignmentPreview = () => {
    if (selectedCourses.length === 0 || selectedBatches.length === 0) {
      return null;
    }

    const newAssignments: any = [];
    const existingAssignments: any = [];

    selectedCourses.forEach((courseId) => {
      const course = courses.find((c) => c.id === courseId);
      if (!course) return;

      selectedBatches.forEach((batchId) => {
        const batch = batches.find((b) => b.id === batchId);
        if (!batch) return;

        const isAlreadyAssigned = (courseBatches[courseId] || []).some(
          (b) => b.id === batchId
        );

        if (isAlreadyAssigned) {
          existingAssignments.push(`${course.title} → ${batch.name}`);
        } else {
          newAssignments.push(`${course.title} → ${batch.name}`);
        }
      });
    });

    return { newAssignments, existingAssignments };
  };

  const assignmentPreview = getAssignmentPreview();

  return (
    <div className="p-6 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center space-x-3 mb-4">
            <FaExchangeAlt className="text-3xl text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-slate-800">
                Course to Batch Assignment
              </h1>
            </div>
          </div>
          <div className="flex items-center justify-center mb-4">
            <div className="bg-slate-100 rounded-lg p-1 flex">
              <button
                onClick={() => {
                  setActionMode("assign");
                  setSelectedCourses([]);
                  setSelectedBatches([]);
                }}
                className={`px-4 py-2 rounded-md font-medium transition-all duration-200 flex items-center space-x-2 ${
                  actionMode === "assign"
                    ? "bg-blue-600 text-white shadow-md"
                    : "text-slate-600 hover:text-slate-800"
                }`}
              >
                <FaPlus className="w-4 h-4" />
                <span>Assign Mode</span>
              </button>
              <button
                onClick={() => {
                  setActionMode("remove");
                  setSelectedCourses([]);
                  setSelectedBatches([]);
                }}
                className={`px-4 py-2 rounded-md font-medium transition-all duration-200 flex items-center space-x-2 ${
                  actionMode === "remove"
                    ? "bg-red-600 text-white shadow-md"
                    : "text-slate-600 hover:text-slate-800"
                }`}
              >
                <FaMinus className="w-4 h-4" />
                <span>Remove Mode</span>
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
            <div className="text-sm text-slate-600">
              <span className="font-medium text-blue-600">
                {selectedCourses.length}
              </span>{" "}
              courses selected •{" "}
              <span className="font-medium text-green-600">
                {selectedBatches.length}
              </span>{" "}
              batches selected
            </div>
            <button
              onClick={handleAssignCoursesToBatches}
              disabled={
                loading ||
                selectedCourses.length === 0 ||
                selectedBatches.length === 0
              }
              className={`px-6 py-2 text-white rounded-lg font-medium hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center space-x-2 ${
                actionMode === "assign"
                  ? "bg-gradient-to-r from-blue-600 to-purple-600"
                  : "bg-gradient-to-r from-red-600 to-pink-600"
              }`}
            >
              {loading ? (
                <FaSpinner className="animate-spin" />
              ) : actionMode === "assign" ? (
                <FaPlus />
              ) : (
                <FaMinus />
              )}
              <span>
                {loading
                  ? actionMode === "assign"
                    ? "Assigning..."
                    : "Removing..."
                  : actionMode === "assign"
                  ? "Assign Selected"
                  : "Remove Selected"}
              </span>
            </button>
          </div>
          {assignmentPreview && (
            <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
              <div className="flex items-center space-x-2 mb-2">
                <FaInfoCircle className="text-blue-600" />
                <span className="font-medium text-blue-800">
                  Assignment Preview:
                </span>
              </div>

              {assignmentPreview.newAssignments.length > 0 && (
                <div className="mb-2">
                  <span className="text-sm font-medium text-green-700">
                    New assignments ({assignmentPreview.newAssignments.length}):
                  </span>
                  <div className="text-sm text-green-600 ml-4">
                    {assignmentPreview.newAssignments
                      .slice(0, 3)
                      .map(
                        (
                          assignment:
                            | string
                            | number
                            | bigint
                            | boolean
                            | React.ReactElement<
                                unknown,
                                string | React.JSXElementConstructor<any>
                              >
                            | Iterable<React.ReactNode>
                            | React.ReactPortal
                            | Promise<
                                | string
                                | number
                                | bigint
                                | boolean
                                | React.ReactPortal
                                | React.ReactElement<
                                    unknown,
                                    string | React.JSXElementConstructor<any>
                                  >
                                | Iterable<React.ReactNode>
                                | null
                                | undefined
                              >
                            | null
                            | undefined,
                          index: React.Key | null | undefined
                        ) => (
                          <div key={index}>• {assignment}</div>
                        )
                      )}
                    {assignmentPreview.newAssignments.length > 3 && (
                      <div>
                        • ... and {assignmentPreview.newAssignments.length - 3}{" "}
                        more
                      </div>
                    )}
                  </div>
                </div>
              )}

              {assignmentPreview.existingAssignments.length > 0 && (
                <div>
                  <span className="text-sm font-medium text-orange-700">
                    Already assigned (
                    {assignmentPreview.existingAssignments.length}):
                  </span>
                  <div className="text-sm text-orange-600 ml-4">
                    {assignmentPreview.existingAssignments
                      .slice(0, 3)
                      .map(
                        (
                          assignment:
                            | string
                            | number
                            | bigint
                            | boolean
                            | React.ReactElement<
                                unknown,
                                string | React.JSXElementConstructor<any>
                              >
                            | Iterable<React.ReactNode>
                            | React.ReactPortal
                            | Promise<
                                | string
                                | number
                                | bigint
                                | boolean
                                | React.ReactPortal
                                | React.ReactElement<
                                    unknown,
                                    string | React.JSXElementConstructor<any>
                                  >
                                | Iterable<React.ReactNode>
                                | null
                                | undefined
                              >
                            | null
                            | undefined,
                          index: React.Key | null | undefined
                        ) => (
                          <div key={index}>• {assignment}</div>
                        )
                      )}
                    {assignmentPreview.existingAssignments.length > 3 && (
                      <div>
                        • ... and{" "}
                        {assignmentPreview.existingAssignments.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center space-x-2">
            <FaTimes className="text-red-500" />
            <span className="text-red-700">{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-center space-x-2">
            <FaCheck className="text-green-500" />
            <span className="text-green-700">{successMessage}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-800 flex items-center space-x-2">
                <FaBook className="text-blue-600" />
                <span>Select Courses</span>
              </h2>
              <span className="text-sm text-slate-500">
                {selectedCourses.length} selected
              </span>
            </div>
            <div className="relative mb-4">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search courses..."
                value={searchCourse}
                onChange={(e) => setSearchCourse(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex space-x-2 mb-4">
              <button
                onClick={() =>
                  setSelectedCourses(filteredCourses.map((c) => c.id))
                }
                className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
              >
                Select All
              </button>
              <button
                onClick={() => setSelectedCourses([])}
                className="px-3 py-1 text-sm bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
              >
                Clear All
              </button>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredCourses.map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  isSelected={selectedCourses.includes(course.id)}
                  onClick={() => toggleCourseSelection(course.id)}
                />
              ))}
            </div>

            {filteredCourses.length === 0 && (
              <div className="text-center py-8 text-slate-500">
                No courses found matching your search.
              </div>
            )}
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-800 flex items-center space-x-2">
                <FaGraduationCap className="text-green-600" />
                <span>Select Batches</span>
              </h2>
              <span className="text-sm text-slate-500">
                {selectedBatches.length} selected
              </span>
            </div>

            <div className="relative mb-4">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search batches..."
                value={searchBatch}
                onChange={(e) => setSearchBatch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div className="flex space-x-2 mb-4">
              <button
                onClick={() =>
                  setSelectedBatches(filteredBatches.map((b) => b.id))
                }
                className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
              >
                Select All
              </button>
              <button
                onClick={() => setSelectedBatches([])}
                className="px-3 py-1 text-sm bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
              >
                Clear All
              </button>
            </div>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredBatches.map((batch) => (
                <BatchCard
                  key={batch.id}
                  batch={batch}
                  isSelected={selectedBatches.includes(batch.id)}
                  onClick={() => toggleBatchSelection(batch.id)}
                />
              ))}
            </div>

            {filteredBatches.length === 0 && (
              <div className="text-center py-8 text-slate-500">
                No batches found matching your search.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseBatchAssignment;
