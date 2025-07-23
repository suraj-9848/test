import React, { useState, useEffect } from "react";
import { FaBook, FaSave, FaTimes } from "react-icons/fa";
import { useCourseStore, CreateCourseData } from "@/store/courseStore";
import { useSession } from "next-auth/react";
import { instructorApi } from "@/api/instructorApi";

const CreateCourse: React.FC = () => {
  const { data: session } = useSession();
  const { batches, loading, error, fetchBatches, createCourse, clearError } =
    useCourseStore();

  const [formData, setFormData] = useState<CreateCourseData>({
    title: "",
    logo: "",
    start_date: "",
    end_date: "",
    batch_ids: [], // Changed from batch_id to batch_ids
    is_public: false,
    instructor_name: "", // Will be set from user profile
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  

  // Fetch user profile and get JWT
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const googleIdToken = (session as { id_token?: string })?.id_token;
        if (!googleIdToken) {
          console.error("No Google ID token found");
          return;
        }

        const user = await instructorApi.getCurrentUser();
        setFormData((prev) => ({
          ...prev,
          instructor_name: user.username || user.email || "Unknown",
        }));
      } catch (error) {
        console.error("Error fetching user profile:", error);
      }
    };

    if (session && session.user) {
      console.log("Session found, fetching user profile...");
      fetchProfile();
    } else {
      console.log("No session found, skipping profile fetch");
    }
  }, [session]);

  // Fetch batches when component mounts
  useEffect(() => {
    if (session && session.user) {
      console.log("Session found, fetching batches...");
      fetchBatches().catch((err) => {
        console.error("Failed to fetch batches:", err);
      });
    } else {
      console.log("No session found, skipping batch fetch");
    }
  }, [session, fetchBatches]);

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
    if (!formData.batch_ids || formData.batch_ids.length === 0)
      newErrors.batch_ids = "At least one batch is required";
    if (!formData.instructor_name.trim())
      newErrors.instructor_name = "Instructor name is required";
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
    setSubmitting(true);
    try {
      await createCourse(formData);
      setFormData({
        title: "",
        logo: "",
        start_date: "",
        end_date: "",
        batch_ids: [],
        is_public: false,
        instructor_name: formData.instructor_name,
      });

      alert("Course created successfully!");
    } catch (err: unknown) {
      console.error("Failed to create course:", err);

      // Show detailed error to user
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error occurred";
      alert(`Failed to create course: ${errorMessage}`);
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
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));

    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleBatchChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(
      e.target.selectedOptions,
      (option) => option.value
    );
    setFormData((prev) => ({ ...prev, batch_ids: selectedOptions }));
    if (errors.batch_ids) {
      setErrors((prev) => ({ ...prev, batch_ids: "" }));
    }
  };

  const handleCancel = () => {
    setFormData({
      title: "",
      logo: "",
      start_date: "",
      end_date: "",
      batch_ids: [],
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
                  Select Batches *
                </label>
                <select
                  name="batch_ids"
                  multiple
                  value={formData.batch_ids}
                  onChange={handleBatchChange}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 bg-white/80 backdrop-blur-sm transition-all duration-200 ${
                    errors.batch_ids
                      ? "border-red-300 focus:ring-red-500"
                      : "border-slate-200"
                  }`}
                  disabled={loading || submitting}
                  style={{ minHeight: "100px" }}
                >
                  {batches.map((batch) => (
                    <option key={batch.id} value={batch.id}>
                      {batch.name}
                    </option>
                  ))}
                </select>
                {errors.batch_ids && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.batch_ids}
                  </p>
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
                <label className="course-logo-upload flex items-center space-x-2 block text-sm font-semibold text-slate-700">
                  Course Logo 
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;

                    const formDataObj = new FormData();
                    formDataObj.append("logo", file); 
                    try {
                      const googleIdToken = (session as { id_token?: string })?.id_token;
                      if (!googleIdToken) {
                        console.error("No Google ID token found");
                        return;
                      }
                      const baseUrl = process.env.NEXT_PUBLIC_BACKEND_BASE_URL || "http://localhost:5000";
                      const res = await fetch(`${baseUrl}/api/courseProgress/upload-logo`, {
                        method: "POST",
                        body: formDataObj,
                        headers: {
                          // Add JWT auth only if needed
                          Authorization: `Bearer ${googleIdToken}`, // only if backend requires auth
                        },
                      });
                     if (!res || typeof res.status !== "number") {
                        console.error("Unexpected upload response:", res);
                        throw new Error("Upload response is invalid");
                      }
                      if (![200, 201].includes(res.status)) {
                        const errorText = await res.text?.();
                        console.error("Upload failed with status:", res.status, "| Response:", errorText);
                        throw new Error("Upload failed");
                      }
                      const data = await res.json();
                      console.log("Uploaded!", data);

                      // Save the uploaded logo URL to form state
                      setFormData((prev) => ({
                        ...prev,
                        logo: data.logoUrl, // or adjust to whatever field your backend returns
                      }));

                    } catch (err) {
                      console.error("Upload Error", err);
                    }
                  }}
                  className="text-sm text-slate-700 bg-white/80 border border-slate-300 rounded-xl cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 max-w-[220px]"
                  disabled={submitting}
                />
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
              disabled={submitting || loading}
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
