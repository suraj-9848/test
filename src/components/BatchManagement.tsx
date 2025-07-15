import React, { useState, useEffect, useCallback } from "react";
import {
  FaEdit,
  FaUsers,
  FaBook,
  FaCalendarAlt,
  FaSearch,
  FaSpinner,
  FaEye,
  FaChevronDown,
  FaChevronRight,
} from "react-icons/fa";
import { useSession } from "next-auth/react";
import axios from "axios";

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
  instructor_name: string;
  start_date: string;
  end_date: string;
  is_public: boolean;
}

const BatchManagement: React.FC = () => {
  const { data: session } = useSession();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [expandedBatch, setExpandedBatch] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [backendJwt, setBackendJwt] = useState<string>("");

  const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_BASE_URL || "";

  // Authentication setup
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const googleIdToken = (session as { id_token: string })?.id_token;
        if (!googleIdToken) return;

        const loginRes = await axios.post(
          `${API_BASE_URL}/api/auth/admin-login`,
          {},
          {
            headers: { Authorization: `Bearer ${googleIdToken}` },
          }
        );

        if (loginRes.data?.jwt) {
          setBackendJwt(loginRes.data.jwt);
        }
      } catch (err) {
        console.error("Failed to fetch user profile:", err);
      }
    };

    if (session) fetchProfile();
  }, [session, API_BASE_URL]);

  const fetchBatches = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${API_BASE_URL}/api/instructor/batches`,
        {
          headers: { Authorization: `Bearer ${backendJwt}` },
        }
      );
      setBatches(response.data.batches || []);
    } catch (err) {
      console.error("Error fetching batches:", err);
      setError("Failed to load batches");
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL, backendJwt]);

  // Fetch data when JWT is available
  useEffect(() => {
    if (backendJwt) {
      fetchBatches();
    }
  }, [backendJwt, fetchBatches]);

  const fetchCoursesForBatch = async (batchId: string) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/instructor/batches/${batchId}/courses`,
        {
          headers: { Authorization: `Bearer ${backendJwt}` },
        }
      );
      setCourses(response.data.courses || response.data || []);
    } catch (err) {
      console.error("Error fetching courses:", err);
      setError("Failed to load courses for batch");
    }
  };

  const handleBatchExpand = async (batchId: string) => {
    if (expandedBatch === batchId) {
      setExpandedBatch(null);
      setCourses([]);
    } else {
      setExpandedBatch(batchId);
      await fetchCoursesForBatch(batchId);
    }
  };

  const filteredBatches = batches.filter(
    (batch) =>
      batch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      batch.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Batch Management
          </h1>
          <p className="text-slate-600">
            Manage your batches and view courses within each batch
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search batches..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Batches List */}
        <div className="space-y-4">
          {filteredBatches.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
              <FaUsers className="mx-auto text-4xl text-slate-400 mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                No Batches Found
              </h3>
              <p className="text-slate-600">
                {searchTerm
                  ? "No batches match your search criteria."
                  : "You don't have access to any batches yet."}
              </p>
            </div>
          ) : (
            filteredBatches.map((batch) => (
              <div
                key={batch.id}
                className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
              >
                {/* Batch Header */}
                <div
                  className="p-6 cursor-pointer hover:bg-slate-50 transition-colors"
                  onClick={() => handleBatchExpand(batch.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        {expandedBatch === batch.id ? (
                          <FaChevronDown className="text-slate-400" />
                        ) : (
                          <FaChevronRight className="text-slate-400" />
                        )}
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                          <FaUsers className="text-blue-600 text-xl" />
                        </div>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">
                          {batch.name}
                        </h3>
                        {batch.description && (
                          <p className="text-slate-600 mt-1">
                            {batch.description}
                          </p>
                        )}
                        <div className="flex items-center space-x-4 mt-2 text-sm text-slate-500">
                          <span className="flex items-center space-x-1">
                            <FaCalendarAlt />
                            <span>
                              Created{" "}
                              {batch.created_at
                                ? new Date(
                                    batch.created_at
                                  ).toLocaleDateString()
                                : "Unknown"}
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-slate-900">
                          {batch.courseCount || 0}
                        </div>
                        <div className="text-sm text-slate-500">Courses</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-slate-900">
                          {batch.studentCount || 0}
                        </div>
                        <div className="text-sm text-slate-500">Students</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded Courses */}
                {expandedBatch === batch.id && (
                  <div className="border-t border-slate-200 bg-slate-50">
                    <div className="p-6">
                      <h4 className="text-lg font-semibold text-slate-900 mb-4 flex items-center space-x-2">
                        <FaBook />
                        <span>Courses in this Batch</span>
                      </h4>
                      {courses.length === 0 ? (
                        <div className="text-center py-8">
                          <FaBook className="mx-auto text-3xl text-slate-400 mb-3" />
                          <p className="text-slate-600">
                            No courses found in this batch
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {courses.map((course) => (
                            <div
                              key={course.id}
                              className="bg-white rounded-lg border border-slate-200 p-4 hover:shadow-md transition-shadow"
                            >
                              <div className="flex items-start justify-between mb-3">
                                <h5 className="font-semibold text-slate-900 line-clamp-2">
                                  {course.title}
                                </h5>
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    course.is_public
                                      ? "bg-green-100 text-green-700"
                                      : "bg-gray-100 text-gray-700"
                                  }`}
                                >
                                  {course.is_public ? "Public" : "Private"}
                                </span>
                              </div>
                              <div className="space-y-2 text-sm text-slate-600">
                                <div>
                                  <strong>Instructor:</strong>{" "}
                                  {course.instructor_name}
                                </div>
                                <div>
                                  <strong>Duration:</strong>{" "}
                                  {new Date(
                                    course.start_date
                                  ).toLocaleDateString()}{" "}
                                  -{" "}
                                  {new Date(
                                    course.end_date
                                  ).toLocaleDateString()}
                                </div>
                              </div>
                              <div className="mt-4 flex space-x-2">
                                <button className="flex items-center space-x-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors text-sm">
                                  <FaEye />
                                  <span>View</span>
                                </button>
                                <button className="flex items-center space-x-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm">
                                  <FaEdit />
                                  <span>Edit</span>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
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

export default BatchManagement;
