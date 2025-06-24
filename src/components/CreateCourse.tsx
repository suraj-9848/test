import React, { useState, useEffect } from "react";
import { FaBook, FaSave, FaTimes } from "react-icons/fa";
import { useCourseStore, CreateCourseData } from "@/store/courseStore";
import { useSession } from "next-auth/react";
import axios from "axios";

const CreateCourse: React.FC = () => {
  const { data: session } = useSession();
  const { batches, loading, error, fetchBatches, createCourse, clearError } =
    useCourseStore();

  const [formData, setFormData] = useState<CreateCourseData>({
    title: "",
    logo: "",
    start_date: "",
    end_date: "",
    batch_id: "",
    is_public: false,
    instructor_name: "", // Will be set from user profile
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [backendJwt, setBackendJwt] = useState<string>("");
  const [userOrgId, setUserOrgId] = useState<string>("");

  // Fetch user profile and get JWT
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_BACKEND_BASE_URL || "";
        const googleIdToken = (session as any)?.id_token;
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
        const backendJwt = loginRes.data.token;
        setBackendJwt(backendJwt);

        const res = await axios.get(`${baseUrl}/api/auth/me`, {
          headers: { Authorization: `Bearer ${backendJwt}` },
          withCredentials: true,
        });
        
        const user = res.data?.user;
        const orgId = user?.org_id || "";
        const instructorName = user?.name || user?.email || "";
        
        setUserOrgId(orgId);
        setFormData(prev => ({
          ...prev,
          instructor_name: instructorName
        }));
      } catch (err) {
        console.error("Failed to fetch user profile:", err);
      }
    };
    
    if (session) fetchProfile();
  }, [session]);

  // Fetch batches after JWT is set
  useEffect(() => {
    if (backendJwt) {
      fetchBatches(backendJwt);
    }
  }, [backendJwt, fetchBatches]);

  // Clear error when component unmounts or when error changes
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        clearError();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) newErrors.title = "Course title is required";
    if (!formData.start_date) newErrors.start_date = "Start date is required";
    if (!formData.end_date) newErrors.end_date = "End date is required";
    if (!formData.batch_id) newErrors.batch_id = "Batch is required";
    if (!formData.instructor_name.trim())
      newErrors.instructor_name = "Instructor name is required";

    // Validate date logic
    if (formData.start_date && formData.end_date) {
      if (new Date(formData.start_date) >= new Date(formData.end_date)) {
        newErrors.end_date = "End date must be after start date";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;
    if (!backendJwt) {
      console.error("No authentication token available");
      return;
    }

    setSubmitting(true);
    try {
      await createCourse(formData.batch_id, formData, backendJwt);

      // Reset form on success
      setFormData({
        title: "",
        logo: "",
        start_date: "",
        end_date: "",
        batch_id: "",
        is_public: false,
        instructor_name: formData.instructor_name, // Keep instructor name
      });

      alert("Course created successfully!");
    } catch (err: any) {
      console.error("Failed to create course:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? (e.target as HTMLInputElement).checked
          : value,
    }));

    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleCancel = () => {
    setFormData({
      title: "",
      logo: "",
      start_date: "",
      end_date: "",
      batch_id: "",
      is_public: false,
      instructor_name: formData.instructor_name, // Keep instructor name
    });
    setErrors({});
  };

  return (
    <div className="p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-8">
        <div className="w-14 h-14 bg-gradient-to-br from-emerald-600 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
          <FaBook className="w-7 h-7 text-white" />
        </div>
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
            Create New Course
          </h1>
          <p className="text-slate-600 mt-1">
            Build and structure your course content
          </p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="max-w-4xl mb-6">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
            {error}
          </div>
        </div>
      )}

      {/* Form */}
      <div className="max-w-4xl">
        <form
          onSubmit={handleSubmit}
          className="bg-white/70 backdrop-blur-sm rounded-2xl border border-slate-200/50 shadow-lg p-8"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Course Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 bg-white/80 backdrop-blur-sm transition-all duration-200 ${
                    errors.title
                      ? "border-red-300 focus:ring-red-500"
                      : "border-slate-200"
                  }`}
                  placeholder="Enter course title"
                  disabled={submitting}
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-600">{errors.title}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Logo URL
                </label>
                <input
                  type="url"
                  name="logo"
                  value={formData.logo}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white/80 backdrop-blur-sm transition-all duration-200"
                  placeholder="https://example.com/logo.jpg"
                  disabled={submitting}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Start Date *
                </label>
                <input
                  type="date"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 bg-white/80 backdrop-blur-sm transition-all duration-200 ${
                    errors.start_date
                      ? "border-red-300 focus:ring-red-500"
                      : "border-slate-200"
                  }`}
                  disabled={submitting}
                />
                {errors.start_date && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.start_date}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  End Date *
                </label>
                <input
                  type="date"
                  name="end_date"
                  value={formData.end_date}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 bg-white/80 backdrop-blur-sm transition-all duration-200 ${
                    errors.end_date
                      ? "border-red-300 focus:ring-red-500"
                      : "border-slate-200"
                  }`}
                  disabled={submitting}
                />
                {errors.end_date && (
                  <p className="mt-1 text-sm text-red-600">{errors.end_date}</p>
                )}
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Select Batch *
                </label>
                <select
                  name="batch_id"
                  value={formData.batch_id}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 bg-white/80 backdrop-blur-sm transition-all duration-200 ${
                    errors.batch_id
                      ? "border-red-300 focus:ring-red-500"
                      : "border-slate-200"
                  }`}
                  disabled={loading || submitting || !backendJwt}
                >
                  <option value="">
                    {loading ? "Loading batches..." : "Select a batch"}
                  </option>
                  {batches.map((batch) => (
                    <option key={batch.id} value={batch.id}>
                      {batch.name}
                    </option>
                  ))}
                </select>
                {errors.batch_id && (
                  <p className="mt-1 text-sm text-red-600">{errors.batch_id}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Instructor Name *
                </label>
                <input
                  type="text"
                  name="instructor_name"
                  value={formData.instructor_name}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 bg-white/80 backdrop-blur-sm transition-all duration-200 ${
                    errors.instructor_name
                      ? "border-red-300 focus:ring-red-500"
                      : "border-slate-200"
                  }`}
                  placeholder="Enter instructor name"
                  disabled={submitting}
                />
                {errors.instructor_name && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.instructor_name}
                  </p>
                )}
              </div>

              <div>
                <label className="flex items-center space-x-2 text-sm font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    name="is_public"
                    checked={formData.is_public}
                    onChange={handleInputChange}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    disabled={submitting}
                  />
                  <span>Make this course public</span>
                </label>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-4 mt-8 pt-6 border-t border-slate-200">
            <button
              type="button"
              onClick={handleCancel}
              className="flex items-center space-x-2 px-6 py-3 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-all duration-200"
              disabled={submitting}
            >
              <FaTimes className="w-4 h-4" />
              <span>Cancel</span>
            </button>
            <button
              type="submit"
              className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-blue-600 text-white rounded-xl hover:shadow-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={submitting || loading || !backendJwt}
            >
              <FaSave className="w-4 h-4" />
              <span>{submitting ? "Creating..." : "Create Course"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateCourse;
