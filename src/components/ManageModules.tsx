import React, { useState, useMemo } from "react";
import {
  FaBook,
  FaPlus,
  FaEdit,
  FaTrash,
  FaQuestionCircle,
  FaEye,
  FaEyeSlash,
  FaFileExport,
} from "react-icons/fa";
import {
  useInstructorStore,
  Module,
  ModuleType,
} from "@/store/instructorStore";

const ManageModules: React.FC = () => {
  const { courses, modules, addModule, updateModule, deleteModule } =
    useInstructorStore();

  const [selectedCourseId, setSelectedCourseId] = useState<number>(0);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);

  const [moduleForm, setModuleForm] = useState({
    title: "",
    description: "",
    type: "CONTENT" as ModuleType,
    content: "",
    videoUrl: "",
    duration: "",
    isPublished: false,
  });

  const filteredModules = useMemo(() => {
    if (selectedCourseId === 0) return modules;
    return modules.filter((module) => module.courseId === selectedCourseId);
  }, [modules, selectedCourseId]);

  const resetForm = () => {
    setModuleForm({
      title: "",
      description: "",
      type: "CONTENT",
      content: "",
      videoUrl: "",
      duration: "",
      isPublished: false,
    });
    setEditingModule(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCourseId) {
      alert("Please select a course first");
      return;
    }

    if (editingModule) {
      updateModule(editingModule.id, moduleForm);
    } else {
      const maxOrder = Math.max(...filteredModules.map((m) => m.order), 0);
      addModule({
        ...moduleForm,
        courseId: selectedCourseId,
        order: maxOrder + 1,
      });
    }

    resetForm();
    setShowCreateModal(false);
  };

  const handleEdit = (module: Module) => {
    setEditingModule(module);
    setModuleForm({
      title: module.title,
      description: module.description,
      type: module.type,
      content: module.content || "",
      videoUrl: module.videoUrl || "",
      duration: module.duration || "",
      isPublished: module.isPublished,
    });
    setShowCreateModal(true);
  };

  const getModuleIcon = (type: ModuleType) => {
    switch (type) {
      case "CONTENT":
        return <FaFileExport className="w-5 h-5 text-blue-600" />;
      case "QUIZ":
        return <FaQuestionCircle className="w-5 h-5 text-purple-600" />;
      case "ASSIGNMENT":
        return <FaBook className="w-5 h-5 text-emerald-600" />;
      default:
        return <FaFileExport className="w-5 h-5 text-blue-600" />;
    }
  };

  const getTypeBadge = (type: ModuleType) => {
    const badges = {
      CONTENT: "bg-blue-100 text-blue-800",
      QUIZ: "bg-purple-100 text-purple-800",
      ASSIGNMENT: "bg-emerald-100 text-emerald-800",
    };

    return (
      <span
        className={`px-2 py-1 text-xs font-medium rounded-lg ${badges[type]}`}
      >
        {type}
      </span>
    );
  };

  return (
    <div className="p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
            <FaBook className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Manage Modules
            </h1>
            <p className="text-slate-600 mt-1">
              Create and organize course content
            </p>
          </div>
        </div>
        <button
          className="flex items-center space-x-3 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-2xl hover:shadow-lg transition-all duration-200 transform hover:scale-105"
          onClick={() => setShowCreateModal(true)}
          disabled={!selectedCourseId}
        >
          <FaPlus className="w-4 h-4" />
          <span className="font-semibold">Add Module</span>
        </button>
      </div>

      {/* Course Selection */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-slate-200/50 shadow-sm">
        <label className="block text-sm font-semibold text-slate-700 mb-3">
          Select Course
        </label>
        <select
          className="w-full max-w-md px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 bg-white/80 backdrop-blur-sm transition-all duration-200"
          value={selectedCourseId}
          onChange={(e) => setSelectedCourseId(Number(e.target.value))}
        >
          <option value={0}>Select a course...</option>
          {courses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.title}
            </option>
          ))}
        </select>
      </div>

      {/* Modules List */}
      {selectedCourseId > 0 && (
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-slate-200/50 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-200/50">
            <h3 className="text-xl font-bold text-slate-900">
              Course Modules ({filteredModules.length})
            </h3>
            <p className="text-slate-600 mt-1">
              Manage content, quizzes, and assignments
            </p>
          </div>

          {filteredModules.length === 0 ? (
            <div className="text-center py-12">
              <FaBook className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-600 mb-2">
                No modules yet
              </h3>
              <p className="text-slate-500">
                Create your first module to get started!
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200/50">
              {filteredModules
                .sort((a, b) => a.order - b.order)
                .map((module) => (
                  <div
                    key={module.id}
                    className="p-6 hover:bg-slate-50/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center justify-center w-12 h-12 bg-slate-100 rounded-xl">
                          {getModuleIcon(module.type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h4 className="text-lg font-semibold text-slate-900">
                              {module.order}. {module.title}
                            </h4>
                            {getTypeBadge(module.type)}
                            <div className="flex items-center space-x-1">
                              {module.isPublished ? (
                                <FaEye className="w-4 h-4 text-emerald-600" />
                              ) : (
                                <FaEyeSlash className="w-4 h-4 text-slate-400" />
                              )}
                              <span
                                className={`text-xs font-medium ${
                                  module.isPublished
                                    ? "text-emerald-600"
                                    : "text-slate-400"
                                }`}
                              >
                                {module.isPublished ? "Published" : "Draft"}
                              </span>
                            </div>
                          </div>
                          <p className="text-slate-600 text-sm">
                            {module.description}
                          </p>
                          {module.duration && (
                            <p className="text-slate-500 text-xs mt-1">
                              Duration: {module.duration}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                          onClick={() => handleEdit(module)}
                        >
                          <FaEdit className="w-4 h-4" />
                        </button>
                        <button
                          className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                          onClick={() => deleteModule(module.id)}
                        >
                          <FaTrash className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* Create/Edit Module Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold text-slate-900 mb-6">
              {editingModule ? "Edit Module" : "Create New Module"}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Module Title *
                  </label>
                  <input
                    type="text"
                    value={moduleForm.title}
                    onChange={(e) =>
                      setModuleForm((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500"
                    placeholder="Enter module title"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Module Type
                  </label>
                  <select
                    value={moduleForm.type}
                    onChange={(e) =>
                      setModuleForm((prev) => ({
                        ...prev,
                        type: e.target.value as ModuleType,
                      }))
                    }
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="CONTENT">Content</option>
                    <option value="QUIZ">Quiz</option>
                    <option value="ASSIGNMENT">Assignment</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Description *
                </label>
                <textarea
                  value={moduleForm.description}
                  onChange={(e) =>
                    setModuleForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 resize-none"
                  rows={3}
                  placeholder="Describe this module"
                  required
                />
              </div>

              {moduleForm.type === "CONTENT" && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Content
                    </label>
                    <textarea
                      value={moduleForm.content}
                      onChange={(e) =>
                        setModuleForm((prev) => ({
                          ...prev,
                          content: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 resize-none"
                      rows={6}
                      placeholder="Write your content here..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Video URL
                    </label>
                    <input
                      type="url"
                      value={moduleForm.videoUrl}
                      onChange={(e) =>
                        setModuleForm((prev) => ({
                          ...prev,
                          videoUrl: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500"
                      placeholder="https://example.com/video.mp4"
                    />
                  </div>
                </>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Duration
                  </label>
                  <input
                    type="text"
                    value={moduleForm.duration}
                    onChange={(e) =>
                      setModuleForm((prev) => ({
                        ...prev,
                        duration: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500"
                    placeholder="e.g., 30 minutes"
                  />
                </div>

                <div className="flex items-end">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={moduleForm.isPublished}
                      onChange={(e) =>
                        setModuleForm((prev) => ({
                          ...prev,
                          isPublished: e.target.checked,
                        }))
                      }
                      className="w-4 h-4 text-purple-600 border-slate-300 rounded focus:ring-purple-500"
                    />
                    <span className="text-sm font-medium text-slate-700">
                      Publish immediately
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-4 pt-6 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="px-6 py-3 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:shadow-lg transition-all duration-200"
                >
                  {editingModule ? "Update Module" : "Create Module"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageModules;
