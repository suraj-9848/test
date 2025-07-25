import React, { useState, useEffect } from "react";
import { FaSave } from "react-icons/fa";
import { useCourseStore, CreateCourseData } from "@/store/courseStore";
import { useSession } from "next-auth/react";
import { instructorApi } from "@/api/instructorApi";

interface CreateCourseProps {
  onCancel?: () => void;
  onSuccess?: () => void;
}

const CreateCourse: React.FC<CreateCourseProps> = ({ onCancel, onSuccess }) => {
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
    if (!formData.is_public && (!formData.batch_ids || formData.batch_ids.length === 0))
      newErrors.batch_ids = "At least one batch is required for private courses";
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
      
      // Call success callback if provided (for dashboard usage)
      if (onSuccess) {
        onSuccess();
      } else {
        alert("Course created successfully!");
      }
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
    >,
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
      (option) => option.value,
    );
    setFormData((prev) => ({ ...prev, batch_ids: selectedOptions }));
    if (errors.batch_ids) {
      setErrors((prev) => ({ ...prev, batch_ids: "" }));
    }
  };

  const handleCancel = () => {
    // Call cancel callback if provided (for dashboard usage)
    if (onCancel) {
      onCancel();
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-100">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden w-full max-w-3xl">
        {/* Tab-like Header */}
        <div className="flex border-b border-slate-200">
          <button
            className="flex-1 px-6 py-4 text-sm font-medium transition-colors bg-purple-50 text-purple-700 border-b-2 border-purple-600 cursor-default"
            style={{ outline: "none" }}
            tabIndex={-1}
          >
            <div className="flex items-center justify-center space-x-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Create Course</span>
            </div>
          </button>
        </div>
        {/* Form Content */}
        <div className="p-6">
          {/* Error Message */}
          {error && (
            <div className="mb-6">
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
                {error}
              </div>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Course Title *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white text-slate-900 transition-all duration-200 ${errors.title ? "border-red-300 focus:ring-red-500" : ""}`}
                  placeholder="Enter course title"
                  disabled={submitting}
                />
                {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Logo URL</label>
                <input
                  type="url"
                  name="logo"
                  value={formData.logo}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white text-slate-900 transition-all duration-200"
                  placeholder="https://example.com/logo.jpg"
                  disabled={submitting}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Start Date *</label>
                <input
                  type="date"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white text-slate-900 transition-all duration-200 ${errors.start_date ? "border-red-300 focus:ring-red-500" : ""}`}
                  disabled={submitting}
                />
                {errors.start_date && <p className="mt-1 text-sm text-red-600">{errors.start_date}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">End Date *</label>
                <input
                  type="date"
                  name="end_date"
                  value={formData.end_date}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white text-slate-900 transition-all duration-200 ${errors.end_date ? "border-red-300 focus:ring-red-500" : ""}`}
                  disabled={submitting}
                />
                {errors.end_date && <p className="mt-1 text-sm text-red-600">{errors.end_date}</p>}
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Select Batches {formData.is_public ? "(optional for public courses)" : "*"}</label>
                {!formData.is_public && (
                  <select
                    name="batch_ids"
                    multiple
                    value={formData.batch_ids}
                    onChange={handleBatchChange}
                    className={`w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white text-slate-900 transition-all duration-200 ${errors.batch_ids ? "border-red-300 focus:ring-red-500" : ""}`}
                    disabled={loading || submitting}
                    style={{ minHeight: "100px" }}
                  >
                    {batches.map((batch) => (
                      <option key={batch.id} value={batch.id}>
                        {batch.name}
                      </option>
                    ))}
                  </select>
                )}
                {errors.batch_ids && <p className="mt-1 text-sm text-red-600">{errors.batch_ids}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Instructor Name *</label>
                <input
                  type="text"
                  name="instructor_name"
                  value={formData.instructor_name}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white text-slate-900 transition-all duration-200 ${errors.instructor_name ? "border-red-300 focus:ring-red-500" : ""}`}
                  placeholder="Enter instructor name"
                  disabled={submitting}
                />
                {errors.instructor_name && <p className="mt-1 text-sm text-red-600">{errors.instructor_name}</p>}
              </div>
              <div className="flex items-center h-full">
                <label className="flex items-center space-x-2 text-sm font-medium text-slate-700">
                  <input
                    type="checkbox"
                    name="is_public"
                    checked={formData.is_public}
                    onChange={handleInputChange}
                    className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                    disabled={submitting}
                  />
                  <span>Make this course public</span>
                </label>
              </div>
            </div>
            {/* Actions */}
            <div className="flex items-center justify-end space-x-4 pt-4">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={submitting || loading}
              >
                <FaSave className="w-4 h-4" />
                <span>{submitting ? "Creating..." : "Create Course"}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateCourse;
