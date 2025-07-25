import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  FaBook,
  FaUsers,
  FaCalendarAlt,
  FaEdit,
  FaTrash,
  FaEye,
  FaPlus,
  FaSearch,
  FaFilter,
  FaSpinner,
  FaGraduationCap,
  FaChartLine,
  FaUser,
  FaTimes,
  FaSave,
} from "react-icons/fa";
import { useSession } from "next-auth/react";
import axios from "axios";
import { useRouter, useSearchParams } from "next/navigation";

interface Course {
  id: string;
  title: string;
  logo?: string;
  start_date: string;
  end_date: string;
  batches?: Batch[]; // Changed from batch_id to batches array, made optional
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

// Define analytics type
interface CourseAnalytics {
  totalStudents: number;
  averageProgress: number;
  batchAnalytics: Array<{
    batchName: string;
    studentCount: number;
    averageProgress: number;
  }>;
}

const AllCourses: React.FC<AllCoursesProps> = ({ onCreateCourse }) => {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  // State
  const [courses, setCourses] = useState<Course[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
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
  const [selectedCourseForBatchAssign, setSelectedCourseForBatchAssign] =
    useState<Course | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [analyticsData, setAnalyticsData] = useState<CourseAnalytics | null>(null);

  // API Base URL
  const API_BASE_URL =
    process.env.NEXT_PUBLIC_BACKEND_BASE_URL || "http://localhost:3000";

  // Handle success message from URL parameters
  useEffect(() => {
    const success = searchParams.get('success');
    if (success) {
      setSuccessMessage(success);
      // Remove the success parameter from URL without triggering a reload
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('success');
      window.history.replaceState({}, '', newUrl.toString());
      
      // Clear success message after 5 seconds
      const timer = setTimeout(() => {
        setSuccessMessage("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  // Fetch user profile and get JWT
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
          },
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

  const fetchAllCoursesWithBatches = useCallback(async (batchList: Batch[]) => {
    try {
      // Use the direct course endpoint instead of fetching from individual batches
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
      // Fallback to the old batch-based approach if direct endpoint fails
      console.log("Falling back to batch-based approach...");
      
      try {
        const courseMap = new Map<string, Course>();
        
        // Fetch courses for each batch and merge by course ID
        for (const batch of batchList) {
          try {
            const response = await axios.get(
              `${API_BASE_URL}/api/instructor/batches/${batch.id}/courses`,
              {
                headers: { Authorization: `Bearer ${backendJwt}` },
              }
            );

            const batchCourses = response.data.courses || response.data || [];
            console.log(`Fetched courses for batch ${batch.name}:`, batchCourses);
            
            // Merge courses by ID to avoid duplicates
            batchCourses.forEach((course: Course) => {
              if (courseMap.has(course.id)) {
                // Course already exists, add this batch to its batches array
                const existingCourse = courseMap.get(course.id)!;
                if (!existingCourse.batches) {
                  existingCourse.batches = [];
                }
                const batchExists = existingCourse.batches.some(b => b.id === batch.id);
                if (!batchExists) {
                  existingCourse.batches.push(batch);
                }
              } else {
                // New course, add it with this batch
                courseMap.set(course.id, {
                  ...course,
                  batches: course.batches || [batch],
                });
              }
            });
          } catch (err) {
            console.warn(`Failed to fetch courses for batch ${batch.id}:`, err);
          }
        }

        // Convert map to array
        const uniqueCourses = Array.from(courseMap.values());
        setCourses(uniqueCourses);
      } catch (fallbackErr) {
        console.error("Fallback also failed:", fallbackErr);
        setError("Failed to load courses");
      }
    }
  }, [API_BASE_URL, backendJwt]);

  const fetchBatches = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${API_BASE_URL}/api/instructor/batches`,
        {
          headers: { Authorization: `Bearer ${backendJwt}` },
        },
      );

      // Extract batches from response structure
      const batchList = response.data.batches || [];
      setBatches(batchList);

      // Fetch all courses after batches are loaded
      if (batchList.length > 0) {
        await fetchAllCoursesWithBatches(batchList);
      }
    } catch (err) {
      console.error("Error fetching batches:", err);
      setError("Failed to load batches");
    } finally {
      setLoading(false);
    }
  }, [backendJwt, API_BASE_URL, fetchAllCoursesWithBatches]);

  // Fetch data
  useEffect(() => {
    if (backendJwt) {
      fetchBatches();
    }
  }, [backendJwt, fetchBatches]);

  const handleDeleteCourse = async (courseId: string) => {
    setCourseToDelete(courseId);
    setShowDeleteConfirmModal(true);
  };

  const confirmDeleteCourse = async () => {
    if (!courseToDelete) return;
    
    try {
      setLoading(true);
      await axios.delete(
        `${API_BASE_URL}/api/instructor/courses/${courseToDelete}`,
        {
          headers: { Authorization: `Bearer ${backendJwt}` },
        },
      );

      // Remove course from local state
      setCourses((prev) => prev.filter((course) => course.id !== courseToDelete));
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

  const updateCourseBatches = async (courseId: string, newBatchIds: string[]) => {
    try {
      setLoading(true);
      // Update the course with new batch assignments using the direct course update endpoint
      const response = await axios.put(
        `${API_BASE_URL}/api/instructor/courses/${courseId}`,
        { batch_ids: newBatchIds },
        {
          headers: { Authorization: `Bearer ${backendJwt}` },
        }
      );

      // Update local state with the response data
      if (response.data && response.data.course) {
        setCourses(prev => prev.map(course => {
          if (course.id === courseId) {
            return { 
              ...course, 
              batches: response.data.course.batches || []
            };
          }
          return course;
        }));
      } else {
        // Fallback: update local state manually
        setCourses(prev => prev.map(course => {
          if (course.id === courseId) {
            const updatedBatches = batches.filter(batch => newBatchIds.includes(batch.id));
            return { ...course, batches: updatedBatches };
          }
          return course;
        }));
      }

      setShowBatchAssignModal(false);
      setSelectedCourseForBatchAssign(null);
      
      // Show success message
      setSuccessMessage("Course batch assignments updated successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      console.error("Error updating course batch assignments:", err);
      if (axios.isAxiosError(err)) {
        const errorMessage = err.response?.data?.message || "Failed to update course batch assignments";
        setError(`Error: ${errorMessage}`);
      } else {
        setError("Failed to update course batch assignments");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleViewCourse = (course: Course) => {
    setSelectedCourse(course);
    setShowViewModal(true);
  };

  const handleEditCourse = (course: Course) => {
    setSelectedCourse(course);
    setShowEditModal(true);
  };

  const handleViewAnalytics = async (course: Course) => {
    try {
      setLoading(true);
      
      // Use the new analytics API endpoint
      const analyticsResponse = await axios.get(
        `${API_BASE_URL}/api/instructor/courses/${course.id}/analytics`,
        { headers: { Authorization: `Bearer ${backendJwt}` } }
      );

      const analyticsData = analyticsResponse.data.analytics;
      
      // Transform the data to match the expected format for the modal
      const transformedData = {
        totalStudents: analyticsData.totalStudents || 0,
        averageProgress: analyticsData.averageProgress || 0,
        batchAnalytics: analyticsData.batchesProgress || [],
      };

      setAnalyticsData(transformedData);
      setSelectedCourse(course);
      setShowAnalyticsModal(true);
    } catch (err) {
      console.error("Error fetching course analytics:", err);
      alert("Failed to fetch course analytics.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCourse = async (courseId: string, updatedData: Partial<Course>) => {
    try {
      setLoading(true);
      
      // Use the new direct course update endpoint
      const response = await axios.put(
        `${API_BASE_URL}/api/instructor/courses/${courseId}`,
        updatedData,
        { headers: { Authorization: `Bearer ${backendJwt}` } }
      );

      // Refresh the courses list
      await fetchBatches();
      
      setSuccessMessage("Course updated successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
      
      return response.data;
    } catch (error) {
      console.error("Error updating course:", error);
      setError("Failed to update course. Please try again.");
      setTimeout(() => setError(""), 5000);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const filteredCourses = courses.filter((course) => {
    const matchesSearch =
      course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.instructor_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBatch =
      selectedBatch === "" || 
      (course.batches && course.batches.some(batch => batch.id === selectedBatch));
    return matchesSearch && matchesBatch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <FaSpinner className="animate-spin text-blue-600" />
          <span>Loading courses...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <span className="text-red-600">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">All Courses</h1>
            <p className="text-gray-600">
              Manage all your courses across batches
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <FaFilter className="w-4 h-4" />
              <span>Filters</span>
            </button>
            <button
              onClick={() => {
                if (onCreateCourse) {
                  onCreateCourse();
                } else {
                  router.push('/dashboard/instructor/courses/new');
                }
              }}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <FaPlus className="w-4 h-4" />
              <span>New Course</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search Courses
                </label>
                <div className="relative">
                  <FaSearch className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by title or instructor..."
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filter by Batch
                </label>
                <select
                  value={selectedBatch}
                  onChange={(e) => setSelectedBatch(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Batches</option>
                  {batches.map((batch) => (
                    <option key={batch.id} value={batch.id}>
                      {batch.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100">Total Courses</p>
                <p className="text-2xl font-bold">{courses.length}</p>
              </div>
              <FaBook className="w-8 h-8 text-blue-200" />
            </div>
          </div>
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100">Active Batches</p>
                <p className="text-2xl font-bold">{batches.length}</p>
              </div>
              <FaGraduationCap className="w-8 h-8 text-green-200" />
            </div>
          </div>
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100">Public Courses</p>
                <p className="text-2xl font-bold">
                  {courses.filter((c) => c.is_public).length}
                </p>
              </div>
              <FaUsers className="w-8 h-8 text-purple-200" />
            </div>
          </div>
        </div>
      </div>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCourses.map((course) => (
          <div
            key={course.id}
            className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col h-full"
          >
            <div className="p-6 flex flex-col h-full">
              <div className="flex items-center gap-4 mb-4">
                {course.logo && course.logo.startsWith("http") ? (
                  <Image
                    src={course.logo}
                    alt={course.title}
                    width={48}
                    height={48}
                    className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                    unoptimized
                  />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                    <FaBook className="w-6 h-6 text-white" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900 truncate">
                    {course.title}
                  </h3>
                  <div className="text-xs text-slate-500 truncate">
                    {course.batches && course.batches.length > 0 ? (
                      <span>{course.batches.map(batch => batch.name).join(", ")}</span>
                    ) : (
                      <span>No batches assigned</span>
                    )}
                  </div>
                </div>
                <span
                  className={`px-2 py-1 text-xs rounded-full whitespace-nowrap ${
                    course.is_public
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {course.is_public ? "Public" : "Private"}
                </span>
              </div>

              <div className="flex flex-col gap-1 mb-4">
                <div className="flex items-center text-xs text-slate-600">
                  <FaUser className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span className="truncate">{course.instructor_name || "Not assigned"}</span>
                </div>
                <div className="flex items-center text-xs text-slate-600">
                  <FaCalendarAlt className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span className="truncate">
                    {new Date(course.start_date).toLocaleDateString()} - {new Date(course.end_date).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="mt-auto pt-4 border-t border-slate-100 flex flex-col gap-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => handleViewCourse(course)}
                      className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 text-xs font-medium px-2 py-1 rounded-lg transition-colors"
                      title="View Details"
                    >
                      <FaEye className="w-4 h-4" />
                      <span>View</span>
                    </button>
                    <button
                      onClick={() => handleEditCourse(course)}
                      className="flex items-center space-x-1 text-green-600 hover:text-green-800 text-xs font-medium px-2 py-1 rounded-lg transition-colors"
                      title="Edit Course"
                    >
                      <FaEdit className="w-4 h-4" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleViewAnalytics(course)}
                      className="flex items-center space-x-1 text-orange-600 hover:text-orange-800 text-xs font-medium px-2 py-1 rounded-lg transition-colors"
                      title="Analytics"
                    >
                      <FaChartLine className="w-4 h-4" />
                      <span>Analytics</span>
                    </button>
                  </div>
                  <button
                    onClick={() => handleDeleteCourse(course.id)}
                    className="flex items-center space-x-1 text-red-600 hover:text-red-800 text-xs font-medium px-2 py-1 rounded-lg transition-colors"
                    title="Delete Course"
                  >
                    <FaTrash className="w-4 h-4" />
                    <span>Delete</span>
                  </button>
                </div>
                <button
                  onClick={() => handleBatchAssign(course)}
                  className="flex items-center space-x-1 justify-center w-full px-3 py-1.5 bg-purple-50 text-purple-600 hover:bg-purple-100 rounded-lg text-xs font-medium transition-colors mt-1"
                  title="Assign to Batches"
                >
                  <FaUsers className="w-4 h-4" />
                  <span>Manage Batches</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredCourses.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <FaBook className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Courses Found
          </h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || selectedBatch
              ? "No courses match your filters."
              : "Start by creating your first course."}
          </p>
          {!searchTerm && !selectedBatch && (
            <button 
              onClick={() => {
                if (onCreateCourse) {
                  onCreateCourse();
                } else {
                  router.push('/dashboard/instructor/courses/new');
                }
              }}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors mx-auto"
            >
              <FaPlus className="w-4 h-4" />
              <span>Create Course</span>
            </button>
          )}
        </div>
      )}

      {/* Success Message */}
      {successMessage && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-3 rounded-lg shadow-lg z-50 animate-fadeIn">
          <div className="flex items-center">
            <span>{successMessage}</span>
          </div>
        </div>
      )}

      {/* Batch Assignment Modal */}
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

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmModal && (
        <DeleteConfirmationModal
          onConfirm={confirmDeleteCourse}
          onCancel={() => {
            setShowDeleteConfirmModal(false);
            setCourseToDelete(null);
          }}
        />
      )}

      {showViewModal && selectedCourse && (
        <CourseDetailsModal
          course={selectedCourse}
          onClose={() => {
            setShowViewModal(false);
            setSelectedCourse(null);
          }}
        />
      )}

      {showAnalyticsModal && selectedCourse && analyticsData && (
        <CourseAnalyticsModal
          course={selectedCourse}
          analytics={analyticsData}
          onClose={() => {
            setShowAnalyticsModal(false);
            setSelectedCourse(null);
            setAnalyticsData(null);
          }}
        />
      )}

      {showEditModal && selectedCourse && (
        <EditCourseModal
          course={selectedCourse}
          batches={batches}
          onClose={() => {
            setShowEditModal(false);
            setSelectedCourse(null);
          }}
          onSave={handleUpdateCourse}
        />
      )}
    </div>
  );
};

// Course Details Modal Component
const CourseDetailsModal: React.FC<{
  course: Course;
  onClose: () => void;
}> = ({ course, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl transform transition-all">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <FaBook className="text-blue-600" />
              {course.title}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <FaTimes className="w-6 h-6" />
            </button>
          </div>
        </div>
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-700 mb-2">
                Basic Information
              </h4>
              <p>
                <strong>Instructor:</strong> {course.instructor_name}
              </p>
              <p>
                <strong>Status:</strong>{" "}
                <span
                  className={`font-medium ${
                    course.is_public ? "text-green-600" : "text-gray-600"
                  }`}
                >
                  {course.is_public ? "Public" : "Private"}
                </span>
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-700 mb-2">Schedule</h4>
              <p>
                <strong>Start Date:</strong> {new Date(course.start_date).toLocaleDateString()}
              </p>
              <p>
                <strong>End Date:</strong> {new Date(course.end_date).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-gray-700 mb-3">
              Assigned Batches
            </h4>
            <div className="flex flex-wrap gap-2">
              {course.batches && course.batches.length > 0 ? (
                course.batches.map((batch) => (
                  <span
                    key={batch.id}
                    className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium"
                  >
                    {batch.name}
                  </span>
                ))
              ) : (
                <p className="text-gray-500">No batches assigned yet.</p>
              )}
            </div>
          </div>
        </div>
        <div className="p-6 bg-gray-50 rounded-b-xl flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// Course Analytics Modal Component
const CourseAnalyticsModal: React.FC<{
  course: Course;
  analytics: CourseAnalytics;
  onClose: () => void;
}> = ({ course, analytics, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl transform transition-all">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <FaChartLine className="text-purple-600" />
              Analytics: {course.title}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <FaTimes className="w-6 h-6" />
            </button>
          </div>
        </div>
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-700">Total Students</p>
              <p className="text-3xl font-bold text-blue-900">
                {analytics.totalStudents}
              </p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-green-700">Avg. Progress</p>
              <p className="text-3xl font-bold text-green-900">
                {analytics.averageProgress}%
              </p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-sm text-purple-700">Assigned Batches</p>
              <p className="text-3xl font-bold text-purple-900">
                {course.batches?.length || 0}
              </p>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-gray-700 mb-3">
              Batch Breakdown
            </h4>
            <div className="space-y-3">
              {analytics.batchAnalytics.length > 0 ? (
                analytics.batchAnalytics.map((batch: {
                  batchName: string;
                  studentCount: number;
                  averageProgress: number;
                }) => (
                  <div
                    key={batch.batchName}
                    className="bg-gray-50 p-4 rounded-lg flex justify-between items-center"
                  >
                    <div>
                      <p className="font-medium text-gray-800">
                        {batch.batchName}
                      </p>
                      <p className="text-sm text-gray-600">
                        {batch.studentCount} students
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-lg text-gray-800">
                        {batch.averageProgress}%
                      </p>
                      <p className="text-sm text-gray-500">Avg. Progress</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">
                  No progress data available yet.
                </p>
              )}
            </div>
          </div>
        </div>
        <div className="p-6 bg-gray-50 rounded-b-xl flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
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
    course.batches?.map(b => b.id) || []
  );
  const [modalError, setModalError] = useState<string>("");

  const handleBatchToggle = (batchId: string) => {
    setSelectedBatchIds(prev => 
      prev.includes(batchId) 
        ? prev.filter(id => id !== batchId)
        : [...prev, batchId]
    );
    // Clear any previous error when user makes a selection
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

          <div className="space-y-3 mb-6">
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
              Are you sure you want to delete this course? This action cannot be undone.
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

// Edit Course Modal Component
const EditCourseModal: React.FC<{
  course: Course;
  batches: Batch[];
  onClose: () => void;
  onSave: (courseId: string, updatedData: Partial<Course>) => void;
}> = ({ course, batches, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    title: course.title,
    logo: course.logo || '',
    start_date: course.start_date ? new Date(course.start_date).toISOString().split('T')[0] : '',
    end_date: course.end_date ? new Date(course.end_date).toISOString().split('T')[0] : '',
    batch_ids: course.batches?.map(b => b.id) || [],
    is_public: course.is_public,
    instructor_name: course.instructor_name
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.title?.trim()) {
      errors.title = 'Course title is required';
    }
    
    if (!formData.start_date) {
      errors.start_date = 'Start date is required';
    }
    
    if (!formData.end_date) {
      errors.end_date = 'End date is required';
    }
    
    if (formData.start_date && formData.end_date && 
        new Date(formData.start_date) >= new Date(formData.end_date)) {
      errors.end_date = 'End date must be after start date';
    }
    
    if (!formData.batch_ids || formData.batch_ids.length === 0) {
      errors.batch_ids = 'At least one batch must be assigned';
    }
    
    if (!formData.instructor_name?.trim()) {
      errors.instructor_name = 'Instructor name is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setSaving(true);
    try {
      await onSave(course.id, formData);
      onClose();
    } catch (error) {
      console.error('Error updating course:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' 
        ? (e.target as HTMLInputElement).checked 
        : value
    }));
    
    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleBatchChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(
      e.target.selectedOptions,
      option => option.value
    );
    
    setFormData(prev => ({ ...prev, batch_ids: selectedOptions }));
    
    if (formErrors.batch_ids) {
      setFormErrors(prev => ({ ...prev, batch_ids: '' }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Edit Course: {course.title}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <FaTimes className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Course Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      formErrors.title ? "border-red-300" : "border-gray-300"
                    }`}
                    placeholder="Enter course title"
                    disabled={saving}
                  />
                  {formErrors.title && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.title}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Logo URL
                  </label>
                  <input
                    type="url"
                    name="logo"
                    value={formData.logo}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="https://example.com/logo.jpg"
                    disabled={saving}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    name="start_date"
                    value={formData.start_date}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      formErrors.start_date ? "border-red-300" : "border-gray-300"
                    }`}
                    disabled={saving}
                  />
                  {formErrors.start_date && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.start_date}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date *
                  </label>
                  <input
                    type="date"
                    name="end_date"
                    value={formData.end_date}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      formErrors.end_date ? "border-red-300" : "border-gray-300"
                    }`}
                    disabled={saving}
                  />
                  {formErrors.end_date && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.end_date}</p>
                  )}
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Batches *
                  </label>
                  <select
                    name="batch_ids"
                    multiple
                    value={formData.batch_ids}
                    onChange={handleBatchChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      formErrors.batch_ids ? "border-red-300" : "border-gray-300"
                    }`}
                    disabled={saving}
                    style={{ minHeight: "120px" }}
                  >
                    {batches.map((batch) => (
                      <option key={batch.id} value={batch.id}>
                        {batch.name}
                      </option>
                    ))}
                  </select>
                  {formErrors.batch_ids && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.batch_ids}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    Hold Ctrl/Cmd to select multiple batches
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Instructor Name *
                  </label>
                  <input
                    type="text"
                    name="instructor_name"
                    value={formData.instructor_name}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      formErrors.instructor_name ? "border-red-300" : "border-gray-300"
                    }`}
                    placeholder="Enter instructor name"
                    disabled={saving}
                  />
                  {formErrors.instructor_name && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.instructor_name}</p>
                  )}
                </div>

                <div>
                  <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                    <input
                      type="checkbox"
                      name="is_public"
                      checked={formData.is_public}
                      onChange={handleInputChange}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      disabled={saving}
                    />
                    <span>Make this course public</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <FaSpinner className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <FaSave className="w-4 h-4" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AllCourses;
