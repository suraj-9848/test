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
} from "react-icons/fa";
import { useSession } from "next-auth/react";
import axios from "axios";

interface Course {
  id: string;
  title: string;
  logo?: string;
  start_date: string;
  end_date: string;
  batch_id: string;
  is_public: boolean;
  instructor_name: string;
  created_at: string;
  updated_at: string;
  batch?: {
    id: string;
    name: string;
    description?: string;
  };
  studentCount?: number;
  moduleCount?: number;
}

interface Batch {
  id: string;
  name: string;
  description?: string;
}

const AllCourses: React.FC = () => {
  const { data: session } = useSession();

  // State
  const [courses, setCourses] = useState<Course[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBatch, setSelectedBatch] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);
  const [backendJwt, setBackendJwt] = useState<string>("");

  // API Base URL
  const API_BASE_URL =
    process.env.NEXT_PUBLIC_BACKEND_BASE_URL || "http://localhost:3000";

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

  const fetchAllCourses = useCallback(
    async (batchList: Batch[]) => {
      try {
        const allCourses: Course[] = [];

        for (const batch of batchList) {
          try {
            const response = await axios.get(
              `${API_BASE_URL}/api/instructor/batches/${batch.id}/courses`,
              {
                headers: { Authorization: `Bearer ${backendJwt}` },
              }
            );

            // Extract courses from response structure
            const batchCourses = response.data.courses || [];

            // Add batch info to each course
            const coursesWithBatch = batchCourses.map((course: Course) => ({
              ...course,
              batch: batch,
            }));

            allCourses.push(...coursesWithBatch);
          } catch (err) {
            console.warn(`Failed to fetch courses for batch ${batch.id}:`, err);
          }
        }

        setCourses(allCourses);
      } catch (err) {
        console.error("Error fetching courses:", err);
        setError("Failed to load courses");
      }
    },
    [API_BASE_URL, backendJwt]
  );

  const fetchBatches = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${API_BASE_URL}/api/instructor/batches`,
        {
          headers: { Authorization: `Bearer ${backendJwt}` },
        }
      );

      // Extract batches from response structure
      const batchList = response.data.batches || [];
      setBatches(batchList);

      // Fetch courses for all batches
      await fetchAllCourses(batchList);
    } catch (err) {
      console.error("Error fetching batches:", err);
      setError("Failed to load batches");
    } finally {
      setLoading(false);
    }
  }, [backendJwt, API_BASE_URL, fetchAllCourses]); // Dependencies for useCallback

  // Fetch data
  useEffect(() => {
    if (backendJwt) {
      fetchBatches();
    }
  }, [backendJwt, fetchBatches]);

  const handleDeleteCourse = async (batchId: string, courseId: string) => {
    if (!window.confirm("Are you sure you want to delete this course?")) {
      return;
    }

    try {
      await axios.delete(
        `${API_BASE_URL}/api/instructor/batches/${batchId}/courses/${courseId}`,
        {
          headers: { Authorization: `Bearer ${backendJwt}` },
        }
      );

      // Remove course from local state
      setCourses((prev) => prev.filter((course) => course.id !== courseId));
      alert("Course deleted successfully!");
    } catch (err) {
      console.error("Error deleting course:", err);
      alert("Failed to delete course");
    }
  };

  const filteredCourses = courses.filter((course) => {
    const matchesSearch =
      course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.instructor_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBatch =
      selectedBatch === "" || course.batch_id === selectedBatch;
    return matchesSearch && matchesBatch;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

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
            className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  {course.logo && course.logo.startsWith("http") ? (
                    <Image
                      src={course.logo}
                      alt={course.title}
                      width={40}
                      height={40}
                      className="w-10 h-10 rounded-lg object-cover"
                      unoptimized
                    />
                  ) : (
                    <Image
                      src="/default-logo.png"
                      alt={course.title}
                      width={40}
                      height={40}
                      className="w-10 h-10 rounded-lg object-cover"
                      unoptimized
                    />
                  )}
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {course.title}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {course.batch?.name}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      course.is_public
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {course.is_public ? "Public" : "Private"}
                  </span>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <FaUser className="w-4 h-4 mr-2" />
                  {course.instructor_name}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <FaCalendarAlt className="w-4 h-4 mr-2" />
                  {formatDate(course.start_date)} -{" "}
                  {formatDate(course.end_date)}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="flex items-center space-x-4">
                  <button
                    className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 text-sm"
                    title="View Details"
                  >
                    <FaEye className="w-4 h-4" />
                    <span>View</span>
                  </button>
                  <button
                    className="flex items-center space-x-1 text-green-600 hover:text-green-800 text-sm"
                    title="Edit Course"
                  >
                    <FaEdit className="w-4 h-4" />
                    <span>Edit</span>
                  </button>
                  <button
                    className="flex items-center space-x-1 text-orange-600 hover:text-orange-800 text-sm"
                    title="Analytics"
                  >
                    <FaChartLine className="w-4 h-4" />
                    <span>Analytics</span>
                  </button>
                </div>
                <button
                  onClick={() => handleDeleteCourse(course.batch_id, course.id)}
                  className="flex items-center space-x-1 text-red-600 hover:text-red-800 text-sm"
                  title="Delete Course"
                >
                  <FaTrash className="w-4 h-4" />
                  <span>Delete</span>
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
            <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors mx-auto">
              <FaPlus className="w-4 h-4" />
              <span>Create Course</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default AllCourses;
