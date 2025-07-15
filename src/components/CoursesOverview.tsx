import React, { useMemo, useEffect, useState } from "react";
import {
  FaEdit,
  FaTrash,
  FaEye,
  FaFilter,
  FaSearch,
  FaBook,
} from "react-icons/fa";
import { useInstructorStore } from "@/store/instructorStore";

const CoursesOverview: React.FC = () => {
  const {
    courses,
    courseSearch,
    statusFilter,
    levelFilter,
    setCourseSearch,
    deleteCourse,
    fetchCourses,
  } = useInstructorStore();

  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      const matchesSearch =
        courseSearch.trim() === "" ||
        course.title.toLowerCase().includes(courseSearch.toLowerCase()) ||
        course.description.toLowerCase().includes(courseSearch.toLowerCase());

      const matchesStatus =
        statusFilter === "ALL" || course.status === statusFilter;
      const matchesLevel =
        levelFilter === "ALL" || course.level === levelFilter;

      return matchesSearch && matchesStatus && matchesLevel;
    });
  }, [courses, courseSearch, statusFilter, levelFilter]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const handleDelete = async (id: number) => {
    setLoadingId(id);
    setErrorMsg(null);
    try {
      await deleteCourse(id);
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || "Failed to delete course");
    } finally {
      setLoadingId(null);
    }
  };

  const handleEdit = (id: number) => {
    // TODO: Implement edit modal or redirect
    alert(`Edit course ${id} clicked!`);
  };

  return (
    <div className="p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
            <FaBook className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              My Courses
            </h1>
            <p className="text-slate-600 mt-1">
              Manage and track your course content
            </p>
          </div>
        </div>
        {/* Removed Create New Course button */}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/50 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">
                Total Courses
              </p>
              <p className="text-3xl font-bold text-slate-900">
                {courses.length}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-xl">
              <FaBook className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        {/* Removed Published, Total Students, Avg. Rating cards */}
      </div>

      {/* Filters */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-slate-200/50 shadow-sm">
        <div className="flex items-center space-x-2 mb-4">
          <FaFilter className="w-4 h-4 text-slate-500" />
          <h3 className="text-lg font-semibold text-slate-800">
            Filters & Search
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search courses..."
              className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/80 backdrop-blur-sm transition-all duration-200"
              value={courseSearch}
              onChange={(e) => setCourseSearch(e.target.value)}
            />
          </div>
          {/* Removed All Status and All Levels dropdowns */}
        </div>
      </div>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCourses.map((course) => (
          <div
            key={course.id}
            className="bg-white/70 backdrop-blur-sm rounded-2xl border border-slate-200/50 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group"
          >
            <div className="relative h-48 bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
              <FaBook className="w-16 h-16 text-slate-400" />
              {/* Batch tags removed: course.batches is not present in data */}
            </div>

            <div className="p-6">
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                  {course.title}
                </h3>
                {/* Removed level badge */}
              </div>

              <p className="text-slate-600 text-sm mb-4 line-clamp-2">
                {course.description}
              </p>

              {/* Removed duration and students info */}

              <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                <div className="flex items-center space-x-2">
                  <button className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200">
                    <FaEye className="w-4 h-4" />
                  </button>
                  <button
                    className="p-2 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all duration-200"
                    onClick={() => handleEdit(course.id)}
                  >
                    <FaEdit className="w-4 h-4" />
                  </button>
                  <button
                    className={`p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 ${
                      loadingId === course.id
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                    }`}
                    onClick={() => handleDelete(course.id)}
                    disabled={loadingId === course.id}
                  >
                    <FaTrash className="w-4 h-4" />
                  </button>
                </div>
                {/* Removed status dropdown from card */}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredCourses.length === 0 && (
        <div className="text-center py-12">
          <FaBook className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-600 mb-2">
            No courses found
          </h3>
          <p className="text-slate-500">
            Create your first course to get started!
          </p>
        </div>
      )}

      {errorMsg && (
        <div className="text-center text-red-500 font-semibold mt-4">
          {errorMsg}
        </div>
      )}
    </div>
  );
};

export default CoursesOverview;
