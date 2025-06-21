import React, { useMemo, useState } from "react";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaEye,
  FaUsers,
  FaClock,
  FaFilter,
  FaSearch,
  FaBook,
  FaStar,
} from "react-icons/fa";
import {
  useInstructorStore,
  Course,
  CourseStatus,
} from "@/store/instructorStore";

const CoursesOverview: React.FC = () => {
  const {
    courses,
    courseSearch,
    statusFilter,
    levelFilter,
    setCourseSearch,
    setStatusFilter,
    setLevelFilter,
    deleteCourse,
    updateCourse,
  } = useInstructorStore();

  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [showModal, setShowModal] = useState(false);

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

  const getStatusBadge = (status: CourseStatus) => {
    const badges = {
      PUBLISHED: "bg-emerald-100 text-emerald-800 border-emerald-200",
      DRAFT: "bg-amber-100 text-amber-800 border-amber-200",
      ARCHIVED: "bg-slate-100 text-slate-800 border-slate-200",
    };

    return (
      <span
        className={`px-3 py-1 text-xs font-semibold rounded-full border ${badges[status]}`}
      >
        {status}
      </span>
    );
  };

  const getLevelBadge = (level: string) => {
    const badges = {
      BEGINNER: "bg-green-100 text-green-800",
      INTERMEDIATE: "bg-blue-100 text-blue-800",
      ADVANCED: "bg-purple-100 text-purple-800",
    };

    return (
      <span
        className={`px-2 py-1 text-xs font-medium rounded-lg ${
          badges[level as keyof typeof badges]
        }`}
      >
        {level}
      </span>
    );
  };

  const handleStatusChange = (courseId: number, newStatus: CourseStatus) => {
    updateCourse(courseId, { status: newStatus });
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
        <button
          className="flex items-center space-x-3 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl hover:shadow-lg transition-all duration-200 transform hover:scale-105"
          onClick={() => setShowModal(true)}
        >
          <FaPlus className="w-4 h-4" />
          <span className="font-semibold">Create New Course</span>
        </button>
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

        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/50 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Published</p>
              <p className="text-3xl font-bold text-emerald-600">
                {courses.filter((c) => c.status === "PUBLISHED").length}
              </p>
            </div>
            <div className="p-3 bg-emerald-100 rounded-xl">
              <FaEye className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/50 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">
                Total Students
              </p>
              <p className="text-3xl font-bold text-purple-600">
                {courses.reduce((sum, course) => sum + course.enrolled, 0)}
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-xl">
              <FaUsers className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/50 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Avg. Rating</p>
              <p className="text-3xl font-bold text-amber-600">4.8</p>
            </div>
            <div className="p-3 bg-amber-100 rounded-xl">
              <FaStar className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </div>
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

          <select
            className="px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/80 backdrop-blur-sm transition-all duration-200"
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as CourseStatus | "ALL")
            }
          >
            <option value="ALL">All Status</option>
            <option value="PUBLISHED">Published</option>
            <option value="DRAFT">Draft</option>
            <option value="ARCHIVED">Archived</option>
          </select>

          <select
            className="px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/80 backdrop-blur-sm transition-all duration-200"
            value={levelFilter}
            onChange={(e) =>
              setLevelFilter(
                e.target.value as
                  | "ALL"
                  | "BEGINNER"
                  | "INTERMEDIATE"
                  | "ADVANCED"
              )
            }
          >
            <option value="ALL">All Levels</option>
            <option value="BEGINNER">Beginner</option>
            <option value="INTERMEDIATE">Intermediate</option>
            <option value="ADVANCED">Advanced</option>
          </select>
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
              <div className="absolute top-4 right-4">
                {getStatusBadge(course.status)}
              </div>
            </div>

            <div className="p-6">
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                  {course.title}
                </h3>
                {getLevelBadge(course.level)}
              </div>

              <p className="text-slate-600 text-sm mb-4 line-clamp-2">
                {course.description}
              </p>

              <div className="flex items-center space-x-4 text-sm text-slate-500 mb-4">
                <div className="flex items-center space-x-1">
                  <FaClock className="w-4 h-4" />
                  <span>{course.duration}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <FaUsers className="w-4 h-4" />
                  <span>{course.enrolled} students</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                <div className="flex items-center space-x-2">
                  <button className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200">
                    <FaEye className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all duration-200">
                    <FaEdit className="w-4 h-4" />
                  </button>
                  <button
                    className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                    onClick={() => deleteCourse(course.id)}
                  >
                    <FaTrash className="w-4 h-4" />
                  </button>
                </div>

                <select
                  className="text-xs px-2 py-1 border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500"
                  value={course.status}
                  onChange={(e) =>
                    handleStatusChange(
                      course.id,
                      e.target.value as CourseStatus
                    )
                  }
                >
                  <option value="DRAFT">Draft</option>
                  <option value="PUBLISHED">Published</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
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
    </div>
  );
};

export default CoursesOverview;
