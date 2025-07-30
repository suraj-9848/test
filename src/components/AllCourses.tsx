import React, { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import {
  FaPlus,
  FaTrash,
  FaEdit,
  FaEye,
  FaSearch,
  FaFilter,
  FaSpinner,
  FaBook,
  FaTimes,
  FaCheck,
  FaCalendar,
  FaGlobe,
  FaLock,
  FaExchangeAlt,
  FaCheckSquare,
  FaSquare,
  FaMinusSquare,
} from "react-icons/fa";

interface Course {
  id: string;
  title: string;
  description?: string;
  logo?: string;
  start_date: string;
  end_date: string;
  batches?: Batch[];
  is_public: boolean;
  instructor_name: string;
  created_at: string;
  updated_at: string;
  studentCount?: number;
  moduleCount?: number;
}

interface Batch {
  id: string;
  name: string;
  description?: string;
}

interface AllCoursesProps {
  onCreateCourse?: () => void;
}

const AllCourses: React.FC<AllCoursesProps> = ({ onCreateCourse }) => {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [courses, setCourses] = useState<Course[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBatch, setSelectedBatch] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);
  const [backendJwt, setBackendJwt] = useState<string>("");

  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<string | null>(null);
  const [showBatchAssignModal, setShowBatchAssignModal] = useState(false);
  const [showBulkBatchAssignModal, setShowBulkBatchAssignModal] =
    useState(false);
  const [selectedCourseForBatchAssign, setSelectedCourseForBatchAssign] =
    useState<Course | null>(null);

  const API_BASE_URL =
    process.env.NEXT_PUBLIC_BACKEND_BASE_URL || "http://localhost:3000";

  useEffect(() => {
    const success = searchParams.get("success");
    if (success) {
      setSuccessMessage(success);
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("success");
      window.history.replaceState({}, "", newUrl.toString());

      const timer = setTimeout(() => {
        setSuccessMessage("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_BACKEND_BASE_URL || "";
        const googleIdToken = (session as { id_token?: string })?.id_token;
        if (!googleIdToken) {
          console.error("No Google ID token found");
          return;
        }

        const loginRes = await axios.post(
          `${baseUrl}/api/auth/admin-login`,
          {},
          {
            headers: { Authorization: `Bearer ${googleIdToken}` },
            withCredentials: true,
          }
        );
        const jwt = loginRes.data.token;
        setBackendJwt(jwt);
      } catch (err) {
        console.error("Failed to fetch user profile:", err);
        setError("Failed to authenticate");
      }
    };

    if (session) fetchProfile();
  }, [session]);

  const fetchBatches = useCallback(async () => {
    if (!backendJwt) return;

    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/instructor/batches`,
        {
          headers: { Authorization: `Bearer ${backendJwt}` },
        }
      );

      const batchList = response.data.batches || [];
      setBatches(batchList);
      await fetchAllCoursesWithBatches(batchList);
    } catch (err) {
      console.error("Error fetching batches:", err);
      setError("Failed to fetch batches");
    } finally {
      setLoading(false);
    }
  }, [backendJwt]);

  const fetchAllCoursesWithBatches = useCallback(
    async (batchList: Batch[]) => {
      try {
        console.log("Fetching all courses directly...");
        const response = await axios.get(
          `${API_BASE_URL}/api/instructor/courses`,
          {
            headers: { Authorization: `Bearer ${backendJwt}` },
          }
        );

        const allCourses = response.data.courses || response.data || [];
        console.log("Fetched courses directly:", allCourses);

        setCourses(allCourses);
      } catch (err) {
        console.error("Error fetching courses:", err);
        setError("Failed to fetch courses");
      }
    },
    [backendJwt, API_BASE_URL]
  );

  useEffect(() => {
    if (backendJwt) {
      fetchBatches();
    }
  }, [backendJwt, fetchBatches]);

  const handleSelectAll = () => {
    if (selectedCourses.length === filteredCourses.length) {
      setSelectedCourses([]);
    } else {
      setSelectedCourses(filteredCourses.map((course) => course.id));
    }
  };

  const handleCourseToggle = (courseId: string) => {
    setSelectedCourses((prev) =>
      prev.includes(courseId)
        ? prev.filter((id) => id !== courseId)
        : [...prev, courseId]
    );
  };

  const handleBulkBatchAssign = () => {
    if (selectedCourses.length === 0) {
      setError("Please select at least one course");
      return;
    }
    setShowBulkBatchAssignModal(true);
  };

  const handleBulkDelete = async () => {
    if (selectedCourses.length === 0) {
      setError("Please select at least one course");
      return;
    }

    if (
      !confirm(
        `Are you sure you want to delete ${selectedCourses.length} courses? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      setLoading(true);

      const deletePromises = selectedCourses.map((courseId) => {
        const course = courses.find((c) => c.id === courseId);
        const batchId = course?.batches?.[0]?.id || batches[0]?.id;
        return axios.delete(
          `${API_BASE_URL}/api/instructor/batches/${batchId}/courses/${courseId}`,
          { headers: { Authorization: `Bearer ${backendJwt}` } }
        );
      });

      await Promise.all(deletePromises);

      await fetchBatches();
      setSelectedCourses([]);
      setSuccessMessage(
        `Successfully deleted ${selectedCourses.length} courses`
      );
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      console.error("Error deleting courses:", err);
      setError("Failed to delete some courses");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCourse = (courseId: string) => {
    setCourseToDelete(courseId);
    setShowDeleteConfirmModal(true);
  };

  const confirmDeleteCourse = async () => {
    if (!courseToDelete) return;

    try {
      setLoading(true);
      const course = courses.find((c) => c.id === courseToDelete);
      const batchId = course?.batches?.[0]?.id || batches[0]?.id;

      await axios.delete(
        `${API_BASE_URL}/api/instructor/batches/${batchId}/courses/${courseToDelete}`,
        { headers: { Authorization: `Bearer ${backendJwt}` } }
      );

      await fetchBatches();
      setSuccessMessage("Course deleted successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      console.error("Error deleting course:", err);
      setError("Failed to delete course");
    } finally {
      setShowDeleteConfirmModal(false);
      setCourseToDelete(null);
      setLoading(false);
    }
  };

  const handleBatchAssign = (course: Course) => {
    setSelectedCourseForBatchAssign(course);
    setShowBatchAssignModal(true);
  };

  const updateCourseBatches = async (
    courseId: string,
    newBatchIds: string[]
  ) => {
    try {
      setLoading(true);
      const response = await axios.put(
        `${API_BASE_URL}/api/instructor/courses/${courseId}`,
        { batch_ids: newBatchIds },
        { headers: { Authorization: `Bearer ${backendJwt}` } }
      );

      if (response.data && response.data.course) {
        setCourses((prev) =>
          prev.map((course) => {
            if (course.id === courseId) {
              return {
                ...course,
                batches: response.data.course.batches || [],
              };
            }
            return course;
          })
        );
      }

      setShowBatchAssignModal(false);
      setSelectedCourseForBatchAssign(null);
      setSuccessMessage("Course batch assignments updated successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      console.error("Error updating course batch assignments:", err);
      setError("Failed to update course batch assignments");
    } finally {
      setLoading(false);
    }
  };

  const updateBulkCourseBatches = async (batchIds: string[]) => {
    try {
      setLoading(true);

      const updatePromises = selectedCourses.map((courseId) =>
        axios.put(
          `${API_BASE_URL}/api/instructor/courses/${courseId}`,
          { batch_ids: batchIds },
          { headers: { Authorization: `Bearer ${backendJwt}` } }
        )
      );

      await Promise.all(updatePromises);
      await fetchBatches();

      setSelectedCourses([]);
      setShowBulkBatchAssignModal(false);
      setSuccessMessage(
        `Successfully updated batch assignments for ${selectedCourses.length} courses`
      );
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      console.error("Error updating bulk course batch assignments:", err);
      setError("Failed to update course batch assignments");
    } finally {
      setLoading(false);
    }
  };

  const filteredCourses = courses.filter((course) => {
    const matchesSearch =
      course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.instructor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (course.description &&
        course.description.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesBatch =
      selectedBatch === "" ||
      (course.batches &&
        course.batches.some((batch) => batch.id === selectedBatch));

    return matchesSearch && matchesBatch;
  });

  const getSelectionState = () => {
    if (selectedCourses.length === 0) return "none";
    if (selectedCourses.length === filteredCourses.length) return "all";
    return "partial";
  };

  const selectionState = getSelectionState();

  if (loading && courses.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <FaSpinner className="animate-spin text-blue-600" />
          <span>Loading courses...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Manage Courses</h1>
            <p className="text-gray-600">
              View, edit, and organize all your courses across batches
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => {
                if (onCreateCourse) {
                  onCreateCourse();
                } else {
                  router.push("/dashboard/instructor/courses/new");
                }
              }}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <FaPlus className="w-4 h-4" />
              <span>Create Course</span>
            </button>
          </div>
        </div>

        {/* Selection Summary and Bulk Actions */}
        {selectedCourses.length > 0 && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FaCheckSquare className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-blue-800">
                  {selectedCourses.length} courses selected
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleBulkBatchAssign}
                  className="flex items-center space-x-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-colors"
                >
                  <FaExchangeAlt className="w-4 h-4" />
                  <span>Assign to Batches</span>
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="flex items-center space-x-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors"
                >
                  <FaTrash className="w-4 h-4" />
                  <span>Delete Selected</span>
                </button>
                <button
                  onClick={() => setSelectedCourses([])}
                  className="flex items-center space-x-2 px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm transition-colors"
                >
                  <FaTimes className="w-4 h-4" />
                  <span>Clear Selection</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search courses by title, instructor, or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Batch Filter */}
          <div className="relative">
            <select
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white min-w-[200px]"
            >
              <option value="">All Batches</option>
              {batches.map((batch) => (
                <option key={batch.id} value={batch.id}>
                  {batch.name}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              showFilters
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <FaFilter className="w-4 h-4" />
            <span>Filters</span>
          </button>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Course Status
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="draft">Draft</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Visibility
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">All</option>
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date Range
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">All Time</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="year">This Year</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Courses Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FaBook className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Courses</p>
              <p className="text-2xl font-bold text-gray-900">
                {courses.length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <FaGlobe className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Public Courses
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {courses.filter((c) => c.is_public).length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <FaLock className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Private Courses
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {courses.filter((c) => !c.is_public).length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <FaCheckSquare className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Selected</p>
              <p className="text-2xl font-bold text-gray-900">
                {selectedCourses.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Courses Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={handleSelectAll}
                className="flex items-center space-x-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                {selectionState === "all" ? (
                  <FaCheckSquare className="w-4 h-4 text-blue-600" />
                ) : selectionState === "partial" ? (
                  <FaMinusSquare className="w-4 h-4 text-blue-600" />
                ) : (
                  <FaSquare className="w-4 h-4 text-gray-400" />
                )}
                <span>
                  {selectionState === "all" ? "Deselect All" : "Select All"}
                </span>
              </button>
              <span className="text-sm text-gray-500">
                {filteredCourses.length} courses found
              </span>
            </div>
            <div className="text-sm text-gray-500">
              {selectedCourses.length > 0 &&
                `${selectedCourses.length} selected`}
            </div>
          </div>
        </div>

        {filteredCourses.length === 0 ? (
          <div className="text-center py-12">
            <FaBook className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              No courses found
            </h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || selectedBatch
                ? "No courses match your current filters."
                : "Start by creating your first course."}
            </p>
            {!searchTerm && !selectedBatch && (
              <button
                onClick={() => {
                  if (onCreateCourse) {
                    onCreateCourse();
                  } else {
                    router.push("/dashboard/instructor/courses/new");
                  }
                }}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors mx-auto"
              >
                <FaPlus className="w-4 h-4" />
                <span>Create Course</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={selectionState === "all"}
                      ref={(input) => {
                        if (input)
                          input.indeterminate = selectionState === "partial";
                      }}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Course
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Batches
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Visibility
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCourses.map((course) => (
                  <tr
                    key={course.id}
                    className={`hover:bg-gray-50 ${
                      selectedCourses.includes(course.id) ? "bg-blue-50" : ""
                    }`}
                  >
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedCourses.includes(course.id)}
                        onChange={() => handleCourseToggle(course.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {course.title}
                          </div>
                          <div className="text-sm text-gray-500">
                            By: {course.instructor_name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {course.batches && course.batches.length > 0 ? (
                          course.batches.map((batch) => (
                            <span
                              key={batch.id}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              {batch.name}
                            </span>
                          ))
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            No batches
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          course.is_public
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {course.is_public ? (
                          <>
                            Public
                          </>
                        ) : (
                          <>
                            Private
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <FaCalendar className="w-3 h-3" />
                        <span>
                          {new Date(course.start_date).toLocaleDateString()} -{" "}
                          {new Date(course.end_date).toLocaleDateString()}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleBatchAssign(course)}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                          title="Assign to Batches"
                        >
                          <FaExchangeAlt className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() =>
                            router.push(
                              `/dashboard/instructor/courses/${course.id}/edit`
                            )
                          }
                          className="p-2 text-yellow-600 hover:bg-yellow-100 rounded-lg transition-colors"
                          title="Edit Course"
                        >
                          <FaEdit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCourse(course.id)}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                          title="Delete Course"
                        >
                          <FaTrash className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-3 rounded-lg shadow-lg z-50">
          <div className="flex items-center space-x-2">
            <FaCheck className="w-4 h-4" />
            <span>{successMessage}</span>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white px-4 py-3 rounded-lg shadow-lg z-50">
          <div className="flex items-center space-x-2">
            <FaTimes className="w-4 h-4" />
            <span>{error}</span>
            <button onClick={() => setError("")} className="ml-2">
              <FaTimes className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      {showBatchAssignModal && selectedCourseForBatchAssign && (
        <BatchAssignmentModal
          course={selectedCourseForBatchAssign}
          batches={batches}
          onClose={() => {
            setShowBatchAssignModal(false);
            setSelectedCourseForBatchAssign(null);
          }}
          onSave={updateCourseBatches}
        />
      )}

      {showBulkBatchAssignModal && (
        <BulkBatchAssignmentModal
          courseCount={selectedCourses.length}
          batches={batches}
          onClose={() => setShowBulkBatchAssignModal(false)}
          onSave={updateBulkCourseBatches}
        />
      )}

      {showDeleteConfirmModal && (
        <DeleteConfirmationModal
          onConfirm={confirmDeleteCourse}
          onCancel={() => {
            setShowDeleteConfirmModal(false);
            setCourseToDelete(null);
          }}
        />
      )}
    </div>
  );
};

// Batch Assignment Modal Component
const BatchAssignmentModal: React.FC<{
  course: Course;
  batches: Batch[];
  onClose: () => void;
  onSave: (courseId: string, batchIds: string[]) => void;
}> = ({ course, batches, onClose, onSave }) => {
  const [selectedBatchIds, setSelectedBatchIds] = useState<string[]>(
    course.batches?.map((b) => b.id) || []
  );
  const [modalError, setModalError] = useState<string>("");

  const handleBatchToggle = (batchId: string) => {
    setSelectedBatchIds((prev) =>
      prev.includes(batchId)
        ? prev.filter((id) => id !== batchId)
        : [...prev, batchId]
    );
    if (modalError) setModalError("");
  };

  const handleSave = () => {
    if (selectedBatchIds.length === 0) {
      setModalError("Please select at least one batch");
      return;
    }
    onSave(course.id, selectedBatchIds);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Assign Course to Batches
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <FaTimes className="w-5 h-5" />
            </button>
          </div>

          <div className="mb-4">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {course.title}
            </h3>
            <p className="text-sm text-gray-600">
              Select which batches should have access to this course.
            </p>
          </div>

          {modalError && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg">
              {modalError}
            </div>
          )}

          <div className="space-y-3 mb-6 max-h-60 overflow-y-auto">
            {batches.map((batch) => (
              <div key={batch.id} className="flex items-center">
                <input
                  type="checkbox"
                  id={`batch-${batch.id}`}
                  checked={selectedBatchIds.includes(batch.id)}
                  onChange={() => handleBatchToggle(batch.id)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label
                  htmlFor={`batch-${batch.id}`}
                  className="ml-3 text-sm font-medium text-gray-700 cursor-pointer"
                >
                  {batch.name}
                  {batch.description && (
                    <span className="block text-xs text-gray-500">
                      {batch.description}
                    </span>
                  )}
                </label>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
            >
              Save Assignment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Bulk Batch Assignment Modal Component
const BulkBatchAssignmentModal: React.FC<{
  courseCount: number;
  batches: Batch[];
  onClose: () => void;
  onSave: (batchIds: string[]) => void;
}> = ({ courseCount, batches, onClose, onSave }) => {
  const [selectedBatchIds, setSelectedBatchIds] = useState<string[]>([]);
  const [modalError, setModalError] = useState<string>("");

  const handleBatchToggle = (batchId: string) => {
    setSelectedBatchIds((prev) =>
      prev.includes(batchId)
        ? prev.filter((id) => id !== batchId)
        : [...prev, batchId]
    );
    if (modalError) setModalError("");
  };

  const handleSave = () => {
    if (selectedBatchIds.length === 0) {
      setModalError("Please select at least one batch");
      return;
    }
    onSave(selectedBatchIds);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Bulk Assign to Batches
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <FaTimes className="w-5 h-5" />
            </button>
          </div>

          <div className="mb-4">
            <p className="text-sm text-gray-600">
              Assign <strong>{courseCount}</strong> selected courses to the
              following batches:
            </p>
          </div>

          {modalError && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg">
              {modalError}
            </div>
          )}

          <div className="space-y-3 mb-6 max-h-60 overflow-y-auto">
            {batches.map((batch) => (
              <div key={batch.id} className="flex items-center">
                <input
                  type="checkbox"
                  id={`bulk-batch-${batch.id}`}
                  checked={selectedBatchIds.includes(batch.id)}
                  onChange={() => handleBatchToggle(batch.id)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label
                  htmlFor={`bulk-batch-${batch.id}`}
                  className="ml-3 text-sm font-medium text-gray-700 cursor-pointer"
                >
                  {batch.name}
                  {batch.description && (
                    <span className="block text-xs text-gray-500">
                      {batch.description}
                    </span>
                  )}
                </label>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
            >
              Assign to Batches
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Delete Confirmation Modal Component
const DeleteConfirmationModal: React.FC<{
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ onConfirm, onCancel }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Confirm Deletion
            </h2>
            <p className="text-gray-600">
              Are you sure you want to delete this course? This action cannot be
              undone.
            </p>
          </div>

          <div className="flex items-center justify-end space-x-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
            >
              Delete Course
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AllCourses;
