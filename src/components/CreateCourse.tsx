import React, { useState } from "react";
import { FaBook, FaSave, FaTimes } from "react-icons/fa";
import { useInstructorStore, Course } from "@/store/instructorStore";

const CreateCourse: React.FC = () => {
  const { addCourse } = useInstructorStore();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    duration: "",
    level: "BEGINNER" as Course["level"],
    status: "DRAFT" as Course["status"],
    thumbnail: "",
    instructor: "Prof. Amit Sharma", // This would come from user context
    enrolled: 0,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) newErrors.title = "Course title is required";
    if (!formData.description.trim())
      newErrors.description = "Course description is required";
    if (!formData.duration.trim()) newErrors.duration = "Duration is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      addCourse(formData);
      setFormData({
        title: "",
        description: "",
        duration: "",
        level: "BEGINNER",
        status: "DRAFT",
        thumbnail: "",
        instructor: "Prof. Amit Sharma",
        enrolled: 0,
      });
      alert("Course created successfully!");
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
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
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-600">{errors.title}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Duration *
                </label>
                <input
                  type="text"
                  name="duration"
                  value={formData.duration}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 bg-white/80 backdrop-blur-sm transition-all duration-200 ${
                    errors.duration
                      ? "border-red-300 focus:ring-red-500"
                      : "border-slate-200"
                  }`}
                  placeholder="e.g., 8 weeks, 3 months"
                />
                {errors.duration && (
                  <p className="mt-1 text-sm text-red-600">{errors.duration}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Course Level
                </label>
                <select
                  name="level"
                  value={formData.level}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white/80 backdrop-blur-sm transition-all duration-200"
                >
                  <option value="BEGINNER">Beginner</option>
                  <option value="INTERMEDIATE">Intermediate</option>
                  <option value="ADVANCED">Advanced</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Course Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white/80 backdrop-blur-sm transition-all duration-200"
                >
                  <option value="DRAFT">Draft</option>
                  <option value="PUBLISHED">Published</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Course Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={6}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 bg-white/80 backdrop-blur-sm transition-all duration-200 resize-none ${
                    errors.description
                      ? "border-red-300 focus:ring-red-500"
                      : "border-slate-200"
                  }`}
                  placeholder="Describe what students will learn in this course..."
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.description}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Course Thumbnail URL
                </label>
                <input
                  type="url"
                  name="thumbnail"
                  value={formData.thumbnail}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white/80 backdrop-blur-sm transition-all duration-200"
                  placeholder="https://example.com/thumbnail.jpg"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Instructor
                </label>
                <input
                  type="text"
                  name="instructor"
                  value={formData.instructor}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white/80 backdrop-blur-sm transition-all duration-200"
                  disabled
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-4 mt-8 pt-6 border-t border-slate-200">
            <button
              type="button"
              className="flex items-center space-x-2 px-6 py-3 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-all duration-200"
            >
              <FaTimes className="w-4 h-4" />
              <span>Cancel</span>
            </button>
            <button
              type="submit"
              className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-blue-600 text-white rounded-xl hover:shadow-lg transition-all duration-200 transform hover:scale-105"
            >
              <FaSave className="w-4 h-4" />
              <span>Create Course</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateCourse;
