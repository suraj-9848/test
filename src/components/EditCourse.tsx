import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import axios from "axios";
import { BASE_URLS } from "../config/urls";
import {
  FaSave,
  FaTimes,
  FaSpinner,
  FaBook,
  FaCalendar,
  FaUser,
  FaGlobe,
  FaLock,
  FaGraduationCap,
  FaImage,
  FaInfoCircle,
  FaCheck,
  FaPlus,
  FaMinus,
  FaArrowLeft,
  FaEdit,
  FaTrash,
  FaExchangeAlt,
} from "react-icons/fa";

interface Course {
  id: string;
  title: string;
  description?: string;
  logo?: string;
  start_date: string;
  end_date: string;
  is_public: boolean;
  instructor_name: string;
  batch_ids?: string[];
  batches?: Batch[];
}

interface Batch {
  id: string;
  name: string;
  description?: string;
}

interface CourseFormData {
  title: string;
  description: string;
  logo: string;
  start_date: string;
  end_date: string;
  is_public: boolean;
  instructor_name: string;
  batch_ids: string[];
}

interface EditCourseProps {
  courseId: string;
}

const EditCourse: React.FC<EditCourseProps> = ({ courseId }) => {
  const router = useRouter();
  const { data: session } = useSession();

  // State
  const [course, setCourse] = useState<Course | null>(null);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [backendJwt, setBackendJwt] = useState<string>("");

  // Form state
  const [formData, setFormData] = useState<CourseFormData>({
    title: "",
    description: "",
    logo: "",
    start_date: "",
    end_date: "",
    is_public: false,
    instructor_name: "",
    batch_ids: [],
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [showBatchManager, setShowBatchManager] = useState(false);

  const API_BASE_URL = BASE_URLS.BACKEND;

  // Initialize authentication
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const googleIdToken = (session as { id_token?: string })?.id_token;
        if (!googleIdToken) return;

        const loginRes = await axios.post(
          `${BASE_URLS.BACKEND}/api/auth/admin-login`,
          {},
          {
            headers: { Authorization: `Bearer ${googleIdToken}` },
            withCredentials: true,
          },
        );
        setBackendJwt(loginRes.data.token);
      } catch (err) {
        console.error("Failed to fetch user profile:", err);
        setError("Failed to authenticate");
      }
    };

    if (session) fetchProfile();
  }, [session, API_BASE_URL]);

  // Fetch course and batch data
  useEffect(() => {
    const fetchData = async () => {
      if (!backendJwt) return;

      try {
        setLoading(true);

        // Fetch batches
        const batchesResponse = await axios.get(
          `${BASE_URLS.BACKEND}/api/instructor/batches`,
          { headers: { Authorization: `Bearer ${backendJwt}` } },
        );
        setBatches(batchesResponse.data.batches || []);

        // Fetch course details
        const courseResponse = await axios.get(
          `${BASE_URLS.BACKEND}/api/instructor/courses/${courseId}`,
          { headers: { Authorization: `Bearer ${backendJwt}` } },
        );

        const courseData = courseResponse.data.course || courseResponse.data;
        setCourse(courseData);

        // Initialize form data
        setFormData({
          title: courseData.title || "",
          description: courseData.description || "",
          logo: courseData.logo || "",
          start_date: formatDateForInput(courseData.start_date) || "",
          end_date: formatDateForInput(courseData.end_date) || "",
          is_public: courseData.is_public || false,
          instructor_name: courseData.instructor_name || "",
          batch_ids:
            courseData.batches?.map((b: Batch) => b.id) ||
            courseData.batch_ids ||
            [],
        });
      } catch (err) {
        console.error("Error fetching course data:", err);
        setError("Failed to load course data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [courseId, backendJwt, API_BASE_URL]);

  // Format date for input field
  const formatDateForInput = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toISOString().split("T")[0];
    } catch {
      return "";
    }
  };

  // Validate form
  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.title?.trim()) {
      errors.title = "Course title is required";
    }

    if (!formData.start_date) {
      errors.start_date = "Start date is required";
    }

    if (!formData.end_date) {
      errors.end_date = "End date is required";
    }

    if (
      formData.start_date &&
      formData.end_date &&
      new Date(formData.start_date) >= new Date(formData.end_date)
    ) {
      errors.end_date = "End date must be after start date";
    }

    if (!formData.instructor_name?.trim()) {
      errors.instructor_name = "Instructor name is required";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSaving(true);
    setError("");

    try {
      await axios.put(
        `${API_BASE_URL}/api/instructor/courses/${courseId}`,
        formData,
        { headers: { Authorization: `Bearer ${backendJwt}` } },
      );

      setSuccessMessage("Course updated successfully!");
      setTimeout(() => {
        router.push("/dashboard/instructor");
      }, 1500);
    } catch (err: any) {
      console.error("Error updating course:", err);
      setError(
        err.response?.data?.message ||
          "Failed to update course. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  // Handle input changes
  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value, type } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));

    // Clear specific field error when user starts typing
    if (formErrors[name]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  // Batch management functions
  const handleBatchToggle = (batchId: string) => {
    setFormData((prev) => ({
      ...prev,
      batch_ids: prev.batch_ids.includes(batchId)
        ? prev.batch_ids.filter((id) => id !== batchId)
        : [...prev.batch_ids, batchId],
    }));
  };

  const handleSelectAllBatches = () => {
    setFormData((prev) => ({
      ...prev,
      batch_ids:
        prev.batch_ids.length === batches.length
          ? []
          : batches.map((b) => b.id),
    }));
  };

  const getSelectedBatches = () => {
    return batches.filter((batch) => formData.batch_ids.includes(batch.id));
  };

  const getUnselectedBatches = () => {
    return batches.filter((batch) => !formData.batch_ids.includes(batch.id));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center space-x-3">
          <FaSpinner className="animate-spin text-4xl text-blue-600" />
          <span className="text-lg text-gray-700">Loading course data...</span>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <FaTimes className="text-6xl text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Course Not Found
          </h2>
          <p className="text-gray-600 mb-4">
            The requested course could not be found.
          </p>
          <button
            onClick={() => router.push("/dashboard/instructor/courses")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Courses
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push("/dashboard/instructor")}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <FaArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-3">
                <FaEdit className="text-blue-600" />
                <span>Edit Course</span>
              </h1>
              <p className="text-gray-600 mt-1">
                Update course details and batch assignments
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() =>
                router.push(`/dashboard/instructor/courses/${courseId}`)
              }
              className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <FaBook className="w-4 h-4" />
              <span>View Course</span>
            </button>
          </div>
        </div>

        {/* Current Course Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FaBook className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-900">{course.title}</h3>
              <p className="text-sm text-blue-700">
                Currently assigned to {course.batches?.length || 0} batch(es)
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-2">
            <FaTimes className="text-red-500" />
            <span className="text-red-700">{error}</span>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-2">
            <FaCheck className="text-green-500" />
            <span className="text-green-700">{successMessage}</span>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center space-x-2">
            <FaInfoCircle className="text-blue-600" />
            <span>Basic Information</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Course Title */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Course Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  formErrors.title ? "border-red-300" : "border-gray-300"
                }`}
                placeholder="Enter course title"
              />
              {formErrors.title && (
                <p className="text-red-500 text-sm mt-1">{formErrors.title}</p>
              )}
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter course description"
              />
            </div>

            {/* Logo URL */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Course Logo URL
              </label>
              <div className="flex items-center space-x-3">
                <FaImage className="text-gray-400" />
                <input
                  type="url"
                  name="logo"
                  value={formData.logo}
                  onChange={handleInputChange}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="https://example.com/logo.png"
                />
              </div>
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date *
              </label>
              <div className="flex items-center space-x-3">
                <FaCalendar className="text-gray-400" />
                <input
                  type="date"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleInputChange}
                  className={`flex-1 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    formErrors.start_date ? "border-red-300" : "border-gray-300"
                  }`}
                />
              </div>
              {formErrors.start_date && (
                <p className="text-red-500 text-sm mt-1">
                  {formErrors.start_date}
                </p>
              )}
            </div>

            {/* End Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date *
              </label>
              <div className="flex items-center space-x-3">
                <FaCalendar className="text-gray-400" />
                <input
                  type="date"
                  name="end_date"
                  value={formData.end_date}
                  onChange={handleInputChange}
                  className={`flex-1 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    formErrors.end_date ? "border-red-300" : "border-gray-300"
                  }`}
                />
              </div>
              {formErrors.end_date && (
                <p className="text-red-500 text-sm mt-1">
                  {formErrors.end_date}
                </p>
              )}
            </div>

            {/* Instructor Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Instructor Name *
              </label>
              <div className="flex items-center space-x-3">
                <FaUser className="text-gray-400" />
                <input
                  type="text"
                  name="instructor_name"
                  value={formData.instructor_name}
                  onChange={handleInputChange}
                  className={`flex-1 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    formErrors.instructor_name
                      ? "border-red-300"
                      : "border-gray-300"
                  }`}
                  placeholder="Enter instructor name"
                />
              </div>
              {formErrors.instructor_name && (
                <p className="text-red-500 text-sm mt-1">
                  {formErrors.instructor_name}
                </p>
              )}
            </div>

            {/* Visibility */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Course Visibility
              </label>
              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="is_public"
                    checked={formData.is_public}
                    onChange={() =>
                      setFormData((prev) => ({
                        ...prev,
                        is_public: true,
                      }))
                    }
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <FaGlobe className="text-green-600" />
                  <span className="text-sm font-medium text-gray-700">
                    Public
                  </span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="is_public"
                    checked={!formData.is_public}
                    onChange={() =>
                      setFormData((prev) => ({
                        ...prev,
                        is_public: false,
                      }))
                    }
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <FaLock className="text-yellow-600" />
                  <span className="text-sm font-medium text-gray-700">
                    Private
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Batch Management */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
              <FaGraduationCap className="text-green-600" />
              <span>Batch Assignments</span>
            </h2>
            <button
              type="button"
              onClick={() => setShowBatchManager(!showBatchManager)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FaExchangeAlt className="w-4 h-4" />
              <span>{showBatchManager ? "Hide" : "Manage"} Batches</span>
            </button>
          </div>

          {/* Current Batch Assignments */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              Currently Assigned Batches ({formData.batch_ids.length})
            </h3>
            {formData.batch_ids.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {getSelectedBatches().map((batch) => (
                  <div
                    key={batch.id}
                    className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <FaGraduationCap className="text-green-600" />
                      <div>
                        <h4 className="font-medium text-green-900">
                          {batch.name}
                        </h4>
                        {batch.description && (
                          <p className="text-sm text-green-700">
                            {batch.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleBatchToggle(batch.id)}
                      className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                      title="Remove from batch"
                    >
                      <FaMinus className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                <FaGraduationCap className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">
                  No batches assigned to this course
                </p>
              </div>
            )}
          </div>

          {/* Batch Manager */}
          {showBatchManager && (
            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">
                  Available Batches ({getUnselectedBatches().length})
                </h3>
                <button
                  type="button"
                  onClick={handleSelectAllBatches}
                  className="flex items-center space-x-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  {formData.batch_ids.length === batches.length ? (
                    <>
                      <FaMinus className="w-3 h-3" />
                      <span>Deselect All</span>
                    </>
                  ) : (
                    <>
                      <FaPlus className="w-3 h-3" />
                      <span>Select All</span>
                    </>
                  )}
                </button>
              </div>

              {getUnselectedBatches().length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {getUnselectedBatches().map((batch) => (
                    <div
                      key={batch.id}
                      className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <FaGraduationCap className="text-gray-600" />
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {batch.name}
                          </h4>
                          {batch.description && (
                            <p className="text-sm text-gray-700">
                              {batch.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleBatchToggle(batch.id)}
                        className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                        title="Add to batch"
                      >
                        <FaPlus className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                  <FaCheck className="w-12 h-12 text-green-500 mx-auto mb-3" />
                  <p className="text-gray-600">
                    All available batches are already assigned
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Form Actions */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => router.push("/dashboard/instructor")}
              className="flex items-center space-x-2 px-6 py-3 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <FaTimes className="w-4 h-4" />
              <span>Cancel</span>
            </button>

            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="flex items-center space-x-2 px-4 py-3 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <span>Reset</span>
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <FaSpinner className="w-4 h-4 animate-spin" />
                ) : (
                  <FaSave className="w-4 h-4" />
                )}
                <span>{saving ? "Saving..." : "Save Changes"}</span>
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default EditCourse;
