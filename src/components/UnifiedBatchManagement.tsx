import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  FaChevronDown,
  FaExclamationTriangle,
  FaSearch,
  FaSpinner,
  FaGraduationCap,
  FaBook,
  FaInfoCircle,
  FaUsers,
  FaChartLine,
  FaUserCheck,
  FaTrophy,
  FaEdit,
  FaTrash,
} from "react-icons/fa";
import { useSession } from "next-auth/react";
import { getBackendJwt } from "../utils/auth";
import Link from "next/link";
import { BASE_URLS } from "../config/urls";

// Types
interface Batch {
  id: string;
  name: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
  org_id?: string;
  courseCount?: number;
  studentCount?: number;
}

interface Course {
  id: string;
  title: string;
  instructor_name?: string;
  start_date?: string;
  end_date?: string;
  is_public?: boolean;
  description?: string;
}

interface StudentProgress {
  studentId: string;
  name: string;
  email: string;
  courseProgress: CourseProgress[];
  overallProgress: number;
  lastActive: string;
  totalTimeSpent: number;
  coursesCompleted: number;
  coursesEnrolled: number;
  averageScore: number;
}

interface CourseProgress {
  courseId: string;
  courseName: string;
  progress: number;
  completedModules: number;
  totalModules: number;
  lastAccessed: string;
  timeSpent: number;
  status: "not-started" | "in-progress" | "completed";
}

const UnifiedBatchManagement: React.FC = () => {
  const { data: session } = useSession();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<string | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [selectedView, setSelectedView] = useState<"courses" | "students">(
    "courses",
  );
  const [loading, setLoading] = useState(false);
  const [studentsData, setStudentsData] = useState<StudentProgress[]>([]);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [backendJwt, setBackendJwt] = useState<string>("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [batchToDelete, setBatchToDelete] = useState<string | null>(null);

  // Edit batch modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editBatchData, setEditBatchData] = useState<{
    id: string;
    name: string;
    description: string;
  }>({
    id: "",
    name: "",
    description: "",
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");
  const [editSuccess, setEditSuccess] = useState("");

  const API_BASE_URL = BASE_URLS.BACKEND;

  // Authentication setup
  useEffect(() => {
    let isMounted = true;

    const fetchProfile = async () => {
      if (!session) return;

      try {
        if (backendJwt) return; // Skip if we already have JWT

        const jwt = await getBackendJwt();
        if (isMounted) {
          console.log("JWT obtained successfully");
          setBackendJwt(jwt);
        }
      } catch (err) {
        console.error("Failed to fetch user profile:", err);
        if (isMounted) {
          setError("Authentication failed. Please try again.");
        }
      }
    };

    fetchProfile();

    return () => {
      isMounted = false;
    };
  }, [session, backendJwt]);

  const fetchBatches = useCallback(async () => {
    if (!backendJwt) {
      console.log("Cannot fetch batches: No JWT available");
      return;
    }

    try {
      setLoading(true);
      setError("");

      console.log("Making API call to fetch batches");
      const response = await axios.get(
        `${BASE_URLS.BACKEND}/api/instructor/batches`,
        {
          headers: { Authorization: `Bearer ${backendJwt}` },
        },
      );

      console.log("Batches API response:", response.data);

      // Handle the API response structure
      const batchesData: Batch[] = response.data.batches || [];
      console.log(`Fetched ${batchesData.length} batches`);

      // Set batches without course counts initially
      setBatches(batchesData);

      // Fetch course counts for each batch
      if (batchesData.length > 0) {
        try {
          // Fetch course counts for each batch
          const batchesWithCourseCount = await Promise.all(
            batchesData.map(async (batch: Batch) => {
              try {
                const courseResponse = await axios.get(
                  `${BASE_URLS.BACKEND}/api/instructor/batches/${batch.id}/courses`,
                  {
                    headers: {
                      Authorization: `Bearer ${backendJwt}`,
                    },
                  },
                );
                const courses = courseResponse.data.courses || [];
                return {
                  ...batch,
                  courseCount: courses.length,
                };
              } catch (err) {
                console.error(
                  `Error fetching courses for batch ${batch.id}:`,
                  err,
                );
                return batch; // Return batch without courseCount if there's an error
              }
            }),
          );

          // Update batches with course counts
          setBatches(batchesWithCourseCount);
          console.log(
            "Updated batches with course counts:",
            batchesWithCourseCount,
          );
        } catch (err) {
          console.error("Error fetching course counts:", err);
        }
      }

      if (batchesData.length === 0) {
        console.log("No batches found in API response");
      }
    } catch (err: any) {
      console.error("Error fetching batches:", err);
      const errorMsg = err.response?.data?.message || "Failed to load batches";
      console.log("Error message:", errorMsg);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL, backendJwt]);

  // Fetch data when JWT is available
  useEffect(() => {
    if (backendJwt) {
      console.log(
        "Fetching batches with JWT:",
        backendJwt.substring(0, 10) + "...",
      );
      fetchBatches();
    } else {
      console.log("No backendJwt available yet");
    }
  }, [backendJwt, fetchBatches]);

  const fetchCoursesForBatch = async (batchId: string) => {
    if (!backendJwt) {
      console.log("Cannot fetch courses: No JWT available");
      return;
    }

    try {
      setLoading(true);
      console.log(`Fetching courses for batch ${batchId}`);
      const response = await axios.get(
        `${API_BASE_URL}/api/instructor/batches/${batchId}/courses`,
        {
          headers: { Authorization: `Bearer ${backendJwt}` },
        },
      );

      // The API returns { message: string, courses: Course[] }
      const courseData = response.data.courses || response.data || [];
      console.log(
        `Successfully fetched ${courseData.length} courses for batch ${batchId}`,
      );
      setCourses(courseData);

      // Update the batch's courseCount in the batches array
      setBatches((prevBatches) =>
        prevBatches.map((batch) =>
          batch.id === batchId
            ? { ...batch, courseCount: courseData.length }
            : batch,
        ),
      );

      // If there are courses, select the first one for student analytics
      if (courseData.length > 0) {
        setSelectedCourse(courseData[0].id);
      } else {
        setSelectedCourse(null);
      }

      return courseData;
    } catch (err: any) {
      console.error("Error fetching courses:", err);
      const errorMsg =
        err.response?.data?.message || "Failed to load courses for batch";
      console.log("Error message:", errorMsg);
      setError(errorMsg);
      setCourses([]);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentAnalytics = async (batchId: string, courseId: string) => {
    if (!backendJwt) {
      console.log("Cannot fetch student analytics: No JWT available");
      return;
    }

    try {
      setLoading(true);
      console.log(
        `Fetching student analytics for batch ${batchId} and course ${courseId}`,
      );

      // First try getting progress data
      try {
        const progressResponse = await axios.get(
          `${API_BASE_URL}/api/instructor/batches/${batchId}/courses/${courseId}/progress`,
          {
            headers: { Authorization: `Bearer ${backendJwt}` },
          },
        );

        // Process student data
        const progressData = progressResponse.data.report || [];
        const studentsData = progressData.map((student: any) => {
          const overallProgress =
            student.status === "completed"
              ? 100
              : student.status === "in-progress"
                ? Math.min((student.currentPage || 0) * 10, 90)
                : 0;

          return {
            studentId: student.studentId,
            name:
              student.username ||
              student.name ||
              `Student ${student.studentId}`,
            email: student.email || `${student.username}@domain.com`,
            courseProgress: [
              {
                courseId: courseId,
                courseName:
                  courses.find((c) => c.id === courseId)?.title || "Course",
                progress: overallProgress,
                completedModules:
                  student.completedModules || Math.floor(overallProgress / 10),
                totalModules: student.totalModules || 10,
                lastAccessed: student.lastAccessed || new Date().toISOString(),
                timeSpent: student.timeSpent || overallProgress * 2, // 2 hours per 10% progress
                status: student.status || "not-started",
              },
            ],
            overallProgress: overallProgress,
            lastActive:
              student.lastAccessed ||
              student.lastActive ||
              new Date().toISOString(),
            totalTimeSpent: student.timeSpent || overallProgress * 2,
            coursesCompleted: student.status === "completed" ? 1 : 0,
            coursesEnrolled: 1,
            averageScore: student.averageScore || 0,
          };
        });

        setStudentsData(studentsData);

        // Update batch studentCount
        setBatches((prevBatches) =>
          prevBatches.map((batch) =>
            batch.id === batchId
              ? { ...batch, studentCount: studentsData.length }
              : batch,
          ),
        );
      } catch (err) {
        console.warn("Failed to fetch progress data:", err);
        setStudentsData([]);
      }
    } catch (err: any) {
      console.error("Error fetching student analytics:", err);
      const errorMsg =
        err.response?.data?.message || "Failed to load student analytics";
      setError(errorMsg);
      setStudentsData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleBatchSelect = async (batchId: string) => {
    if (selectedBatch === batchId) {
      setSelectedBatch(null);
      setSelectedCourse(null);
      setCourses([]);
      setStudentsData([]);
    } else {
      setSelectedBatch(batchId);
      setSelectedView("courses");
      const fetchedCourses = await fetchCoursesForBatch(batchId);
      if (fetchedCourses && fetchedCourses.length > 0) {
        setSelectedCourse(fetchedCourses[0].id);
        fetchStudentAnalytics(batchId, fetchedCourses[0].id);
      }
    }
  };

  const handleCourseSelect = (courseId: string) => {
    setSelectedCourse(courseId);
    if (selectedBatch && courseId) {
      fetchStudentAnalytics(selectedBatch, courseId);
    }
  };

  const handleViewToggle = (view: "courses" | "students") => {
    setSelectedView(view);
  };

  const handleDeleteBatch = (batchId: string) => {
    setBatchToDelete(batchId);
    setShowDeleteConfirm(true);
  };

  const handleEditBatch = (batch: Batch) => {
    setEditBatchData({
      id: batch.id,
      name: batch.name,
      description: batch.description || "",
    });
    setEditError("");
    setEditSuccess("");
    setShowEditModal(true);
  };

  const confirmDeleteBatch = async () => {
    if (!batchToDelete || !backendJwt) return;

    try {
      setLoading(true);
      await axios.delete(
        `${API_BASE_URL}/api/instructor/batches/${batchToDelete}`,
        {
          headers: { Authorization: `Bearer ${backendJwt}` },
        },
      );

      // Remove the batch from the list
      setBatches((prevBatches) =>
        prevBatches.filter((batch) => batch.id !== batchToDelete),
      );

      // Reset selections if the deleted batch was selected
      if (selectedBatch === batchToDelete) {
        setSelectedBatch(null);
        setSelectedCourse(null);
        setCourses([]);
        setStudentsData([]);
      }

      setShowDeleteConfirm(false);
      setBatchToDelete(null);
    } catch (err: any) {
      console.error("Error deleting batch:", err);
      const errorMsg = err.response?.data?.message || "Failed to delete batch";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchBatches();
  };

  const filteredBatches = batches.filter(
    (batch) =>
      batch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      batch.description?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const filteredStudents = studentsData.filter(
    (student) =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Calculate overall stats for the selected batch and course
  const calculateOverallStats = () => {
    if (!Array.isArray(studentsData) || studentsData.length === 0) return null;

    const totalStudents = studentsData.length;
    const activeStudents = studentsData.filter((s) => {
      const lastActive = new Date(s.lastActive);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return lastActive > weekAgo;
    }).length;

    const averageProgress =
      studentsData.reduce((sum, s) => sum + s.overallProgress, 0) /
      totalStudents;
    const averageScore =
      studentsData.reduce((sum, s) => sum + s.averageScore, 0) / totalStudents;

    return {
      totalStudents,
      activeStudents,
      averageProgress: Math.round(averageProgress),
      averageScore: Math.round(averageScore),
    };
  };

  const stats = calculateOverallStats();

  if (loading && batches.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="flex items-center justify-center h-64">
          <FaSpinner className="animate-spin text-4xl text-blue-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              Batch Dashboard
            </h1>
            <p className="text-slate-600">
              Manage and analyze your training batches
            </p>
          </div>
          <div>
            <button
              onClick={handleRefresh}
              className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg border border-blue-200 hover:bg-blue-100 transition flex items-center gap-2"
              disabled={loading}
            >
              {loading ? (
                <FaSpinner className="animate-spin" />
              ) : (
                <FaGraduationCap />
              )}
              Refresh Data
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-grow">
              <FaSearch className="absolute top-1/2 left-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by batch name, description or student..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center gap-3">
            <FaExclamationTriangle className="text-red-500" />
            <p className="text-red-700 font-medium">{error}</p>
            <button
              onClick={() => setError("")}
              className="ml-auto text-red-700 hover:text-red-900"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Delete Confirmation */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-lg p-6 max-w-md mx-auto">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Confirm Delete
              </h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this batch? This action cannot
                be undone.
              </p>
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setBatchToDelete(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteBatch}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Batch Modal */}
        {showEditModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-lg p-6 max-w-md mx-auto">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Edit Batch
              </h3>
              <div className="mb-4">
                <label
                  htmlFor="batchName"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Batch Name
                </label>
                <input
                  type="text"
                  id="batchName"
                  value={editBatchData.name}
                  onChange={(e) =>
                    setEditBatchData({
                      ...editBatchData,
                      name: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 transition"
                  placeholder="Enter batch name"
                />
              </div>
              <div className="mb-4">
                <label
                  htmlFor="batchDescription"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Description
                </label>
                <textarea
                  id="batchDescription"
                  value={editBatchData.description}
                  onChange={(e) =>
                    setEditBatchData({
                      ...editBatchData,
                      description: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 transition"
                  placeholder="Enter batch description"
                  rows={3}
                ></textarea>
              </div>
              {editError && (
                <div className="mb-4">
                  <p className="text-red-600 text-sm font-medium">
                    {editError}
                  </p>
                </div>
              )}
              {editSuccess && (
                <div className="mb-4">
                  <p className="text-green-600 text-sm font-medium">
                    {editSuccess}
                  </p>
                </div>
              )}
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    setEditLoading(true);
                    setEditError("");
                    setEditSuccess("");

                    try {
                      const response = await axios.put(
                        `${API_BASE_URL}/api/instructor/batches/${editBatchData.id}`,
                        {
                          name: editBatchData.name,
                          description: editBatchData.description,
                        },
                        {
                          headers: {
                            Authorization: `Bearer ${backendJwt}`,
                          },
                        },
                      );

                      setEditSuccess("Batch updated successfully!");
                      setTimeout(() => {
                        setShowEditModal(false);
                        setEditBatchData({
                          id: "",
                          name: "",
                          description: "",
                        });
                        setEditSuccess("");
                        fetchBatches();
                      }, 1500);
                    } catch (err: any) {
                      console.error("Error updating batch:", err);
                      const errorMsg =
                        err.response?.data?.message || "Failed to update batch";
                      setEditError(errorMsg);
                    } finally {
                      setEditLoading(false);
                    }
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                  disabled={editLoading}
                >
                  {editLoading && <FaSpinner className="animate-spin" />}
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Batches List */}
        <div className="space-y-6">
          {filteredBatches.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-slate-200">
              <FaGraduationCap className="mx-auto text-4xl text-slate-300 mb-4" />
              <h3 className="text-xl font-semibold text-slate-700">
                No batches found
              </h3>
              <p className="text-slate-500 mt-2 max-w-md mx-auto">
                {loading
                  ? "Loading batches..."
                  : searchTerm
                    ? "No batches match your search criteria."
                    : "No batches found. Click on 'Create Batch' in the sidebar menu to create a new batch."}
              </p>
            </div>
          ) : (
            filteredBatches.map((batch, index) => (
              <div
                key={`batch-${batch.id}-${index}`}
                className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
              >
                {/* Batch Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-200">
                  <div
                    className="flex-1 cursor-pointer"
                    onClick={() => handleBatchSelect(batch.id)}
                  >
                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                      <FaGraduationCap className="text-blue-600" />
                      {batch.name}
                    </h2>
                    <p className="text-slate-600">
                      {batch.description || "No description provided"}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    {/* <div className="text-sm text-slate-500 bg-blue-50 px-3 py-1 rounded-lg border border-blue-100">
                                            <span className="font-semibold text-blue-700">
                                                {batch.created_at
                                                    ? new Date(
                                                          batch.created_at
                                                      ).toLocaleDateString()
                                                    : "N/A"}
                                            </span>
                                        </div> */}
                    {/* <div className="text-sm bg-gradient-to-r from-blue-50 to-purple-50 px-3 py-1 rounded-lg border border-blue-100">
                                            <span className="font-medium bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                                {selectedBatch === batch.id
                                                    ? "Hide Details"
                                                    : "View Details"}
                                            </span>
                                        </div> */}
                    <div className="relative">
                      <button
                        className="p-2 rounded-full hover:bg-slate-100 text-slate-600"
                        onClick={() => handleBatchSelect(batch.id)}
                      >
                        {selectedBatch === batch.id ? (
                          <FaChevronDown className="transform rotate-180" />
                        ) : (
                          <FaChevronDown />
                        )}
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditBatch(batch)}
                        className="p-2 rounded-full hover:bg-blue-50 text-blue-600"
                        title="Edit batch"
                      >
                        <FaEdit />
                      </button>
                      <button
                        className="p-2 rounded-full hover:bg-red-50 text-red-600"
                        onClick={() => handleDeleteBatch(batch.id)}
                        title="Delete batch"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Content */}
                {selectedBatch === batch.id && (
                  <div>
                    {/* Tabs for switching between courses and students */}
                    <div className="flex border-b border-slate-200">
                      <button
                        onClick={() => handleViewToggle("courses")}
                        className={`px-6 py-4 font-medium text-sm ${
                          selectedView === "courses"
                            ? "border-b-2 border-blue-600 text-blue-600"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <FaBook />
                          <span>Courses ({batch.courseCount || 0})</span>
                        </div>
                      </button>
                      <button
                        onClick={() => handleViewToggle("students")}
                        className={`px-6 py-4 font-medium text-sm ${
                          selectedView === "students"
                            ? "border-b-2 border-blue-600 text-blue-600"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <FaUsers />
                          <span>Students ({batch.studentCount || 0})</span>
                        </div>
                      </button>
                    </div>

                    {/* Content based on selected view */}
                    <div className="p-6">
                      {loading ? (
                        <div className="py-8 flex justify-center">
                          <FaSpinner className="animate-spin text-blue-600 text-2xl" />
                        </div>
                      ) : selectedView === "courses" ? (
                        /* Courses View */
                        courses.length > 0 ? (
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {" "}
                            {courses.map((course, index) => (
                              <div
                                key={`course-${course.id}-${index}`}
                                className={`bg-slate-50 p-4 rounded-lg border ${
                                  selectedCourse === course.id
                                    ? "border-blue-300 ring-2 ring-blue-100"
                                    : "border-slate-200"
                                }`}
                                onClick={() => handleCourseSelect(course.id)}
                              >
                                <h4 className="font-semibold text-slate-800">
                                  {course.title}
                                </h4>
                                {course.description && (
                                  <p className="text-sm text-slate-600 mt-1">
                                    {course.description}
                                  </p>
                                )}
                                {course.instructor_name && (
                                  <p className="text-sm text-slate-500 mt-2">
                                    Instructor: {course.instructor_name}
                                  </p>
                                )}
                                {course.start_date && course.end_date && (
                                  <p className="text-sm text-slate-500">
                                    {new Date(
                                      course.start_date,
                                    ).toLocaleDateString()}{" "}
                                    -{" "}
                                    {new Date(
                                      course.end_date,
                                    ).toLocaleDateString()}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 bg-slate-50 rounded-lg border border-slate-200">
                            <FaInfoCircle className="mx-auto text-2xl text-slate-400 mb-2" />
                            <p className="text-slate-500">
                              No courses assigned to this batch yet.
                            </p>
                            <Link
                              href="/dashboard/instructor/create-course"
                              className="inline-block mt-4 text-blue-600 hover:text-blue-800 text-sm"
                            >
                              Create a new course
                            </Link>
                          </div>
                        )
                      ) : (
                        /* Students View */
                        <>
                          {stats && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="text-sm font-medium text-slate-600">
                                      Total Students
                                    </p>
                                    <p className="text-xl font-bold text-slate-900">
                                      {stats.totalStudents}
                                    </p>
                                  </div>
                                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <FaUsers className="w-5 h-5 text-blue-600" />
                                  </div>
                                </div>
                              </div>
                              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="text-sm font-medium text-slate-600">
                                      Active Students
                                    </p>
                                    <p className="text-xl font-bold text-slate-900">
                                      {stats.activeStudents}
                                    </p>
                                  </div>
                                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                    <FaUserCheck className="w-5 h-5 text-green-600" />
                                  </div>
                                </div>
                              </div>
                              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="text-sm font-medium text-slate-600">
                                      Avg Progress
                                    </p>
                                    <p className="text-xl font-bold text-slate-900">
                                      {stats.averageProgress}%
                                    </p>
                                  </div>
                                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                    <FaChartLine className="w-5 h-5 text-purple-600" />
                                  </div>
                                </div>
                              </div>
                              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="text-sm font-medium text-slate-600">
                                      Avg Score
                                    </p>
                                    <p className="text-xl font-bold text-slate-900">
                                      {stats.averageScore}%
                                    </p>
                                  </div>
                                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                                    <FaTrophy className="w-5 h-5 text-orange-600" />
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {selectedCourse ? (
                            filteredStudents.length > 0 ? (
                              <div className="overflow-x-auto bg-white rounded-lg border border-slate-200">
                                <table className="w-full">
                                  <thead>
                                    <tr className="border-b border-slate-200 bg-slate-50">
                                      <th className="text-left py-3 px-4 font-medium text-slate-600">
                                        Student
                                      </th>
                                      <th className="text-left py-3 px-4 font-medium text-slate-600">
                                        Progress
                                      </th>
                                      <th className="text-left py-3 px-4 font-medium text-slate-600">
                                        Score
                                      </th>
                                      <th className="text-left py-3 px-4 font-medium text-slate-600">
                                        Last Active
                                      </th>
                                      <th className="text-left py-3 px-4 font-medium text-slate-600">
                                        Status
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {filteredStudents.map((student, index) => (
                                      <tr
                                        key={`student-${student.studentId}-${index}`}
                                        className={
                                          index % 2 === 0
                                            ? "bg-slate-50"
                                            : "bg-white"
                                        }
                                      >
                                        <td className="py-3 px-4">
                                          <div>
                                            <div className="font-medium text-slate-900">
                                              {student.name}
                                            </div>
                                            <div className="text-sm text-slate-500">
                                              {student.email}
                                            </div>
                                          </div>
                                        </td>
                                        <td className="py-3 px-4">
                                          <div className="flex items-center">
                                            <div className="w-full max-w-[100px] bg-slate-200 rounded-full h-2 mr-3">
                                              <div
                                                className="bg-blue-600 h-2 rounded-full"
                                                style={{
                                                  width: `${student.overallProgress}%`,
                                                }}
                                              ></div>
                                            </div>
                                            <span className="text-sm font-medium text-slate-900">
                                              {student.overallProgress}%
                                            </span>
                                          </div>
                                        </td>
                                        <td className="py-3 px-4">
                                          <span className="text-sm font-medium text-slate-900">
                                            {student.averageScore}%
                                          </span>
                                        </td>
                                        <td className="py-3 px-4">
                                          <span className="text-sm text-slate-600">
                                            {new Date(
                                              student.lastActive,
                                            ).toLocaleDateString()}
                                          </span>
                                        </td>
                                        <td className="py-3 px-4">
                                          <span
                                            className={`px-2 py-1 text-xs font-medium rounded-full ${
                                              student.overallProgress >= 80
                                                ? "bg-green-100 text-green-800"
                                                : student.overallProgress >= 50
                                                  ? "bg-yellow-100 text-yellow-800"
                                                  : "bg-red-100 text-red-800"
                                            }`}
                                          >
                                            {student.overallProgress >= 80
                                              ? "Excellent"
                                              : student.overallProgress >= 50
                                                ? "Good"
                                                : "Needs Attention"}
                                          </span>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            ) : (
                              <div className="text-center py-8 bg-slate-50 rounded-lg border border-slate-200">
                                <FaUsers className="mx-auto text-2xl text-slate-400 mb-2" />
                                <p className="text-slate-500">
                                  No students enrolled in this course yet.
                                </p>
                              </div>
                            )
                          ) : (
                            <div className="text-center py-8 bg-slate-50 rounded-lg border border-slate-200">
                              <FaBook className="mx-auto text-2xl text-slate-400 mb-2" />
                              <p className="text-slate-500">
                                Select a course to view student analytics.
                              </p>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default UnifiedBatchManagement;
