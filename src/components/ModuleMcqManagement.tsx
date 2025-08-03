import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Search,
  ArrowLeft,
  Plus,
  Edit3,
  Trash2,
  BookOpen,
  FileText,
  Calendar,
  Users,
  ChevronRight,
  GraduationCap,
  Layers,
  HelpCircle,
  Eye,
  Settings,
} from "lucide-react";
import apiClient from "@/utils/axiosInterceptor";
import { API_ENDPOINTS } from "@/config/urls";
import ManageModuleContent from "./ManageModuleContent";
import ManageMCQ from "./ManageMCQ";
import "@/styles/module-mcq-management.css";

interface Batch {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  studentCount?: number;
}

interface Course {
  id: string;
  title: string;
  description?: string;
  start_date: string;
  end_date: string;
  instructor_name: string;
  moduleCount?: number;
}

interface Module {
  id: string;
  title: string;
  description?: string;
  course_id: string;
  order_index: number;
  created_at: string;
  dayContentCount?: number;
  mcqCount?: number;
}

interface ModuleMcqManagementProps {
  onBack?: () => void;
}

type ViewState = "batches" | "courses" | "modules" | "module-detail";

const ModuleMcqManagement: React.FC<ModuleMcqManagementProps> = ({
  onBack,
}) => {
  const { data: session } = useSession();
  const [currentView, setCurrentView] = useState<ViewState>("batches");
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);

  const [batches, setBatches] = useState<Batch[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [modules, setModules] = useState<Module[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);

  const getBreadcrumb = () => {
    switch (currentView) {
      case "batches":
        return "Module-MCQ Management";
      case "courses":
        return `${selectedBatch?.name} > Courses`;
      case "modules":
        return `${selectedBatch?.name} > ${selectedCourse?.title} > Modules`;
      case "module-detail":
        return `${selectedBatch?.name} > ${selectedCourse?.title} > ${selectedModule?.title}`;
      default:
        return "Module-MCQ Management";
    }
  };

  // Fetch batches
  const fetchBatches = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await apiClient.get(API_ENDPOINTS.INSTRUCTOR.BATCHES);
      setBatches(response.data.batches || []);
    } catch (err) {
      setError("Failed to fetch batches");
      console.error("Error fetching batches:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async (batchId: string) => {
    try {
      setLoading(true);
      setError("");
      const response = await apiClient.get(
        API_ENDPOINTS.INSTRUCTOR.BATCH_COURSES(batchId),
      );
      setCourses(response.data.courses || []);
    } catch (err) {
      setError("Failed to fetch courses");
      console.error("Error fetching courses:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchModules = async (batchId: string, courseId: string) => {
    try {
      setLoading(true);
      setError("");
      const response = await apiClient.get(
        API_ENDPOINTS.INSTRUCTOR.BATCH_COURSE_MODULES(batchId, courseId),
      );

      let modulesData = [];
      if (response.data.modules) {
        modulesData = response.data.modules;
      } else if (Array.isArray(response.data)) {
        modulesData = response.data;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        modulesData = response.data.data;
      }
      const mappedModules = modulesData.map((module: any) => ({
        id: module.id,
        title: module.title,
        description: module.description || "",
        course_id: courseId,
        order_index: module.order || module.order_index || 1,
        created_at: module.created_at || new Date().toISOString(),
        dayContentCount: module.dayContentCount || 0,
        mcqCount: module.mcqCount || 0,
      }));
      mappedModules.sort((a: any, b: any) => a.order_index - b.order_index);
      setModules(mappedModules);
    } catch (err) {
      setError("Failed to fetch modules");
      console.error("Error fetching modules:", err);
    } finally {
      setLoading(false);
    }
  };
  const createModule = async (moduleData: {
    title: string;
    description: string;
    order_index: number;
  }) => {
    try {
      setCreateLoading(true);
      setError("");

      if (!selectedCourse || !selectedBatch) {
        setError("No course or batch selected");
        return;
      }

      const createPayload = {
        title: moduleData.title,
        description: moduleData.description,
        order: moduleData.order_index,
        course_id: selectedCourse.id,
      };

      const response = await apiClient.post(
        API_ENDPOINTS.INSTRUCTOR.BATCH_COURSE_MODULE_CREATE(
          selectedBatch.id,
          selectedCourse.id,
        ),
        createPayload,
      );

      if (response.data.success || response.status === 201) {
        await fetchModules(selectedBatch.id, selectedCourse.id);
        setShowCreateModal(false);
        setError("");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to create module");
      console.error("Error creating module:", err);
    } finally {
      setCreateLoading(false);
    }
  };

  // Delete module
  const deleteModule = async (module: Module) => {
    if (!selectedCourse || !selectedBatch) {
      setError("No course or batch selected");
      return;
    }

    if (
      !window.confirm(
        `Are you sure you want to delete the module "${module.title}"? This action cannot be undone.`,
      )
    ) {
      return;
    }

    try {
      setLoading(true);
      setError("");

      await apiClient.delete(
        API_ENDPOINTS.INSTRUCTOR.BATCH_COURSE_MODULE_BY_ID(
          selectedBatch.id,
          selectedCourse.id,
          module.id,
        ),
      );

      // Refresh modules list
      await fetchModules(selectedBatch.id, selectedCourse.id);
      setError("");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to delete module");
      console.error("Error deleting module:", err);
    } finally {
      setLoading(false);
    }
  };

  // Initialize data
  useEffect(() => {
    fetchBatches();
  }, []);

  // Handle batch selection
  const handleBatchSelect = (batch: Batch) => {
    setSelectedBatch(batch);
    setCurrentView("courses");
    fetchCourses(batch.id);
  };

  // Handle course selection
  const handleCourseSelect = (course: Course) => {
    setSelectedCourse(course);
    setCurrentView("modules");
    if (selectedBatch) {
      fetchModules(selectedBatch.id, course.id);
    }
  };

  // Handle module selection
  const handleModuleSelect = (module: Module) => {
    setSelectedModule(module);
    setCurrentView("module-detail");
  };

  // Navigation handlers
  const handleBack = () => {
    switch (currentView) {
      case "courses":
        setCurrentView("batches");
        setSelectedBatch(null);
        break;
      case "modules":
        setCurrentView("courses");
        setSelectedCourse(null);
        break;
      case "module-detail":
        setCurrentView("modules");
        setSelectedModule(null);
        break;
      default:
        if (onBack) onBack();
        break;
    }
  };

  // Filter data based on search
  const getFilteredBatches = (): Batch[] => {
    const term = searchTerm.toLowerCase();
    return batches.filter(
      (batch) =>
        batch.name.toLowerCase().includes(term) ||
        batch.description?.toLowerCase().includes(term),
    );
  };

  const getFilteredCourses = (): Course[] => {
    const term = searchTerm.toLowerCase();
    return courses.filter(
      (course) =>
        course.title.toLowerCase().includes(term) ||
        course.description?.toLowerCase().includes(term) ||
        course.instructor_name.toLowerCase().includes(term),
    );
  };

  const getFilteredModules = (): Module[] => {
    const term = searchTerm.toLowerCase();
    const filtered = modules.filter(
      (module) =>
        module.title.toLowerCase().includes(term) ||
        module.description?.toLowerCase().includes(term),
    );
    return filtered;
  };

  // Render loading state
  if (loading && currentView === "batches") {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            {currentView !== "batches" && (
              <button
                onClick={handleBack}
                className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {getBreadcrumb()}
              </h1>
              <p className="text-gray-600 mt-1">
                {currentView === "batches" &&
                  "Select a batch to manage modules and MCQs"}
                {currentView === "courses" &&
                  "Select a course to view its modules"}
                {currentView === "modules" &&
                  "Manage modules and their content"}
                {currentView === "module-detail" &&
                  "View and edit module content"}
              </p>
            </div>
          </div>

          {currentView === "modules" && selectedBatch && selectedCourse && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Create Module</span>
            </button>
          )}
        </div>

        {currentView !== "module-detail" && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder={`Search ${currentView}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {currentView === "batches" && (
        <BatchesView
          data={getFilteredBatches()}
          onSelect={handleBatchSelect}
          loading={loading}
        />
      )}
      {currentView === "courses" && (
        <CoursesView
          data={getFilteredCourses()}
          onSelect={handleCourseSelect}
          loading={loading}
        />
      )}
      {currentView === "modules" && (
        <ModulesView
          data={getFilteredModules()}
          onSelect={handleModuleSelect}
          onDelete={deleteModule}
          loading={loading}
        />
      )}
      {currentView === "module-detail" &&
        selectedModule &&
        selectedBatch &&
        selectedCourse && (
          <ModuleDetailView
            module={selectedModule}
            batch={selectedBatch}
            course={selectedCourse}
          />
        )}

      {showCreateModal && (
        <CreateModuleModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onCreate={createModule}
          loading={createLoading}
          courseTitle={selectedCourse?.title || ""}
          nextOrderIndex={
            modules.length > 0
              ? Math.max(...modules.map((m) => m.order_index)) + 1
              : 1
          }
        />
      )}
    </div>
  );
};

// Batches View Component
const BatchesView: React.FC<{
  data: Batch[];
  onSelect: (batch: Batch) => void;
  loading: boolean;
}> = ({ data, onSelect, loading }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse"
          >
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-12">
        <GraduationCap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-600 mb-2">
          No batches found
        </h3>
        <p className="text-gray-500">No batches match your search criteria.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {data.map((batch) => (
        <div
          key={batch.id}
          onClick={() => onSelect(batch)}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg hover:border-blue-300 transition-all duration-200 cursor-pointer group"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                <GraduationCap className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                  {batch.name}
                </h3>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
          </div>

          {batch.description && (
            <p className="text-gray-600 text-sm mb-4 line-clamp-2">
              {batch.description}
            </p>
          )}

          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center space-x-1">
              <Calendar className="w-4 h-4" />
              <span>{new Date(batch.created_at).toLocaleDateString()}</span>
            </div>
            {batch.studentCount !== undefined && (
              <div className="flex items-center space-x-1">
                <Users className="w-4 h-4" />
                <span>{batch.studentCount} students</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

// Courses View Component
const CoursesView: React.FC<{
  data: Course[];
  onSelect: (course: Course) => void;
  loading: boolean;
}> = ({ data, onSelect, loading }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse"
          >
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-12">
        <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-600 mb-2">
          No courses found
        </h3>
        <p className="text-gray-500">No courses found in this batch.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {data.map((course) => (
        <div
          key={course.id}
          onClick={() => onSelect(course)}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg hover:border-green-300 transition-all duration-200 cursor-pointer group"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                <BookOpen className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-green-600 transition-colors">
                  {course.title}
                </h3>
                <p className="text-sm text-gray-500">
                  by {course.instructor_name}
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-green-600 transition-colors" />
          </div>

          {course.description && (
            <p className="text-gray-600 text-sm mb-4 line-clamp-2">
              {course.description}
            </p>
          )}

          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center space-x-1">
              <Calendar className="w-4 h-4" />
              <span>{new Date(course.start_date).toLocaleDateString()}</span>
            </div>
            {course.moduleCount !== undefined && (
              <div className="flex items-center space-x-1">
                <Layers className="w-4 h-4" />
                <span>{course.moduleCount} modules</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

// Modules View Component
const ModulesView: React.FC<{
  data: Module[];
  onSelect: (module: Module) => void;
  onDelete: (module: Module) => void;
  loading: boolean;
}> = ({ data, onSelect, onDelete, loading }) => {
  console.log("ModulesView received data:", data);
  console.log("ModulesView loading state:", loading);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse"
          >
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-12">
        <Layers className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-600 mb-2">
          No modules found
        </h3>
        <p className="text-gray-500">No modules found in this course.</p>
        <div className="mt-4 p-4 bg-gray-100 rounded-lg text-left">
          <p className="text-sm text-gray-600">Debug Info:</p>
          <p className="text-xs text-gray-500">Data length: {data.length}</p>
          <p className="text-xs text-gray-500">Loading: {loading.toString()}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {data.map((module) => (
        <div
          key={module.id}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg hover:border-purple-300 transition-all duration-200 group relative"
        >
          <div className="flex items-start justify-between mb-4">
            <div
              className="flex items-center space-x-3 cursor-pointer flex-1"
              onClick={() => onSelect(module)}
            >
              <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                <Layers className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">
                  {module.title}
                </h3>
                <p className="text-sm text-gray-500">
                  Order: {module.order_index}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(module);
                }}
                className="p-2 text-gray-400 hover:text-purple-600 rounded-lg hover:bg-purple-50 transition-colors"
                title="View Details"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(module);
                }}
                className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                title="Delete Module"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="cursor-pointer" onClick={() => onSelect(module)}>
            {module.description && (
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                {module.description}
              </p>
            )}

            <div className="flex items-center justify-between text-sm text-gray-500">
              <div className="flex items-center space-x-4">
                {module.dayContentCount !== undefined && (
                  <div className="flex items-center space-x-1">
                    <FileText className="w-4 h-4" />
                    <span>{module.dayContentCount} days</span>
                  </div>
                )}
                {module.mcqCount !== undefined && (
                  <div className="flex items-center space-x-1">
                    <HelpCircle className="w-4 h-4" />
                    <span>{module.mcqCount} MCQs</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Module Detail View Component
const ModuleDetailView: React.FC<{
  module: Module;
  batch: Batch;
  course: Course;
}> = ({ module, batch, course }) => {
  const [activeTab, setActiveTab] = useState<"day-content" | "mcq">(
    "day-content",
  );

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Layers className="w-8 h-8 text-purple-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {module.title}
              </h2>
              <p className="text-gray-600">
                {batch.name} {" > "} {course.title} {" > "} Module{" "}
                {module.order_index}
              </p>
            </div>
          </div>
        </div>

        {module.description && (
          <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">
            {module.description}
          </p>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab("day-content")}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "day-content"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4" />
                <span>Day Content</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab("mcq")}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "mcq"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center space-x-2">
                <HelpCircle className="w-4 h-4" />
                <span>MCQ Management</span>
              </div>
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === "day-content" && (
            <DayContentTab module={module} batch={batch} course={course} />
          )}
          {activeTab === "mcq" && (
            <MCQTab module={module} batch={batch} course={course} />
          )}
        </div>
      </div>
    </div>
  );
};

// Day Content Tab Component
const DayContentTab: React.FC<{
  module: Module;
  batch: Batch;
  course: Course;
}> = ({ module, batch, course }) => {
  const [dayContents, setDayContents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showManageModal, setShowManageModal] = useState(false);
  const [selectedDayContent, setSelectedDayContent] = useState<any>(null);
  const [manageMode, setManageMode] = useState<"create" | "edit">("create");

  // Helper function to safely render content that might be a rich text object
  const renderSafeContent = (content: any): string => {
    if (typeof content === "string") {
      return cleanHtmlContent(content);
    }
    if (content && typeof content === "object") {
      if (content.ops && Array.isArray(content.ops)) {
        if (content.html && typeof content.html === "string") {
          return cleanHtmlContent(content.html);
        }
        const plainText = content.ops
          .map((op: any) => (typeof op.insert === "string" ? op.insert : ""))
          .join("");
        return plainText;
      }
      try {
        const stringified = JSON.stringify(content);
        return stringified;
      } catch {
        return "[Object]";
      }
    }
    return String(content || "");
  };

  // Helper function to clean up malformed HTML
  const cleanHtmlContent = (html: string): string => {
    if (!html) return "";

    let cleaned = html
      .replace(/<h([1-6])><h([1-6])>/g, "<h$1>")
      .replace(/<\/h([1-6])><\/h([1-6])>/g, "</h$1>")
      .replace(/<h([1-6])><blockquote><h([1-6])>/g, "<h$1>")
      .replace(/<\/h([1-6])><\/blockquote><\/h([1-6])>/g, "</h$1>")
      .replace(/<h([1-6])><ul><li><strong><h([1-6])><em><h([1-6])>/g, "<h$1>")
      .replace(
        /<\/h([1-6])><\/em><\/h([1-6])><\/strong><\/li><\/ul><\/h([1-6])>/g,
        "</h$1>",
      );

    cleaned = cleaned.replace(/<h[1-6]><\/h[1-6]>/g, "");

    cleaned = cleaned
      .replace(/<strong><b>/g, "<strong>")
      .replace(/<\/b><\/strong>/g, "</strong>")
      .replace(/<em><i>/g, "<em>")
      .replace(/<\/i><\/em>/g, "</em>");

    return cleaned;
  };

  const HTMLContent: React.FC<{ content: any }> = ({ content }) => {
    const htmlContent = renderSafeContent(content);

    if (htmlContent.includes("<") && htmlContent.includes(">")) {
      return (
        <div
          className="html-content text-sm"
          dangerouslySetInnerHTML={{ __html: htmlContent }}
          style={{
            lineHeight: "1.5",
          }}
        />
      );
    }

    return <span>{htmlContent}</span>;
  };

  const fetchDayContents = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(
        API_ENDPOINTS.INSTRUCTOR.BATCH_COURSE_MODULE_DAY_CONTENT(
          batch.id,
          course.id,
          module.id,
        ),
      );
      setDayContents(response.data.dayContents || response.data.content || []);
    } catch (err) {
      console.error("Error fetching day contents:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateContent = () => {
    setSelectedDayContent(null);
    setManageMode("create");
    setShowManageModal(true);
  };

  const handleEditContent = (dayContent: any) => {
    setSelectedDayContent(dayContent);
    setManageMode("edit");
    setShowManageModal(true);
  };

  const handleDeleteContent = async (dayContentId: string) => {
    if (window.confirm("Are you sure you want to delete this day content?")) {
      try {
        await apiClient.delete(
          API_ENDPOINTS.INSTRUCTOR.BATCH_COURSE_MODULE_DAY_CONTENT_BY_ID(
            batch.id,
            course.id,
            module.id,
            dayContentId,
          ),
        );
        fetchDayContents();
      } catch (err) {
        console.error("Error deleting day content:", err);
      }
    }
  };

  const handleModalClose = () => {
    setShowManageModal(false);
    setSelectedDayContent(null);
  };

  const handleModalSave = () => {
    fetchDayContents();
  };

  useEffect(() => {
    fetchDayContents();
  }, [module.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Day Content</h3>
          <button
            onClick={handleCreateContent}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Day Content</span>
          </button>
        </div>

        {dayContents.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h4 className="text-lg font-semibold text-gray-600 mb-2">
              No day content yet
            </h4>
            <p className="text-gray-500 mb-4">
              Start by adding your first day content for this module.
            </p>
            <button
              onClick={handleCreateContent}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors mx-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Create Day Content</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dayContents.map((dayContent, index) => (
              <div
                key={dayContent.id || index}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600">
                        {dayContent.day_number || index + 1}
                      </span>
                    </div>
                    <h4 className="font-medium text-gray-900">
                      {dayContent.title ||
                        `Day ${dayContent.day_number || index + 1}`}
                    </h4>
                  </div>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleEditContent(dayContent)}
                      className="p-1 text-gray-400 hover:text-green-600 rounded"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteContent(dayContent.id)}
                      className="p-1 text-gray-400 hover:text-red-600 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="text-gray-600 text-sm line-clamp-2">
                  <HTMLContent
                    content={
                      dayContent.content ||
                      dayContent.description ||
                      "No content description available"
                    }
                  />
                </div>
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <span className="text-xs text-gray-500">
                    {dayContent.created_at
                      ? new Date(dayContent.created_at).toLocaleDateString()
                      : "No date"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ManageModuleContent
        isOpen={showManageModal}
        onClose={handleModalClose}
        onSave={handleModalSave}
        module={module}
        batch={batch}
        course={course}
        dayContent={selectedDayContent}
        mode={manageMode}
      />
    </>
  );
};

// MCQ Tab Component
const MCQTab: React.FC<{
  module: Module;
  batch: Batch;
  course: Course;
}> = ({ module, batch, course }) => {
  const [mcqs, setMcqs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showManageModal, setShowManageModal] = useState(false);
  const [selectedMCQ, setSelectedMCQ] = useState<any>(null);
  const [manageMode, setManageMode] = useState<"create" | "edit">("create");

  // Helper function to safely render content that might be a rich text object
  const renderSafeContent = (content: any): string => {
    if (typeof content === "string") {
      return cleanHtmlContent(content);
    }
    if (content && typeof content === "object") {
      if (content.ops && Array.isArray(content.ops)) {
        if (content.html && typeof content.html === "string") {
          return cleanHtmlContent(content.html);
        }
        const plainText = content.ops
          .map((op: any) => (typeof op.insert === "string" ? op.insert : ""))
          .join("");
        return plainText;
      }
      try {
        const stringified = JSON.stringify(content);
        return stringified;
      } catch {
        return "[Object]";
      }
    }
    return String(content || "");
  };

  // Helper function to clean up malformed HTML
  const cleanHtmlContent = (html: string): string => {
    if (!html) return "";

    let cleaned = html
      .replace(/<h([1-6])><h([1-6])>/g, "<h$1>")
      .replace(/<\/h([1-6])><\/h([1-6])>/g, "</h$1>")
      .replace(/<h([1-6])><blockquote><h([1-6])>/g, "<h$1>")
      .replace(/<\/h([1-6])><\/blockquote><\/h([1-6])>/g, "</h$1>")
      .replace(/<h([1-6])><ul><li><strong><h([1-6])><em><h([1-6])>/g, "<h$1>")
      .replace(
        /<\/h([1-6])><\/em><\/h([1-6])><\/strong><\/li><\/ul><\/h([1-6])>/g,
        "</h$1>",
      );

    cleaned = cleaned.replace(/<h[1-6]><\/h[1-6]>/g, "");

    cleaned = cleaned
      .replace(/<strong><b>/g, "<strong>")
      .replace(/<\/b><\/strong>/g, "</strong>")
      .replace(/<em><i>/g, "<em>")
      .replace(/<\/i><\/em>/g, "</em>");

    return cleaned;
  };

  // Helper component to render HTML content safely
  const HTMLContentMCQ: React.FC<{ content: any }> = ({ content }) => {
    const htmlContent = renderSafeContent(content);

    if (htmlContent.includes("<") && htmlContent.includes(">")) {
      return (
        <div
          className="html-content"
          dangerouslySetInnerHTML={{ __html: htmlContent }}
          style={{
            lineHeight: "1.6",
          }}
        />
      );
    }

    return <span>{htmlContent}</span>;
  };

  const fetchMcqs = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(
        API_ENDPOINTS.INSTRUCTOR.BATCH_COURSE_MODULE_MCQ(
          batch.id,
          course.id,
          module.id,
        ),
      );

      console.log("MCQ API Response:", response.data);

      // Backend returns a single MCQ object with questions array
      if (response.data && response.data.questions) {
        // Store the entire MCQ as a single entity
        const mcqData = [
          {
            id: response.data.id, // Use the actual MCQ database ID
            questions: response.data.questions,
            passingScore: response.data.passingScore,
            module: response.data.module,
          },
        ];
        console.log("MCQ Data:", mcqData);
        setMcqs(mcqData);
      } else {
        setMcqs([]);
      }
    } catch (err: any) {
      console.error("Error fetching MCQs:", err);
      if (err.response?.status === 404) {
        // No MCQ exists for this module yet
        setMcqs([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMCQ = () => {
    setSelectedMCQ(null);
    setManageMode("create");
    setShowManageModal(true);
  };

  const handleEditMCQ = (mcq: any) => {
    setSelectedMCQ(mcq);
    setManageMode("edit");
    setShowManageModal(true);
  };

  const handleDeleteMCQ = async (mcq: any) => {
    if (window.confirm("Are you sure you want to delete this MCQ?")) {
      try {
        console.log("Deleting MCQ with ID:", mcq.id);

        await apiClient.delete(
          API_ENDPOINTS.INSTRUCTOR.BATCH_COURSE_MODULE_MCQ_BY_ID(
            batch.id,
            course.id,
            module.id,
            mcq.id,
          ),
        );
        fetchMcqs();
      } catch (err) {
        console.error("Error deleting MCQ:", err);
      }
    }
  };

  const handleModalClose = () => {
    setShowManageModal(false);
    setSelectedMCQ(null);
  };

  const handleModalSave = () => {
    fetchMcqs();
  };

  useEffect(() => {
    fetchMcqs();
  }, [module.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            MCQ Management
          </h3>
          <button
            onClick={handleCreateMCQ}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add MCQ</span>
          </button>
        </div>

        {mcqs.length === 0 ? (
          <div className="text-center py-12">
            <HelpCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h4 className="text-lg font-semibold text-gray-600 mb-2">
              No MCQs yet
            </h4>
            <p className="text-gray-500 mb-4">
              Create multiple choice questions for this module.
            </p>
            <button
              onClick={handleCreateMCQ}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors mx-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Create MCQ</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {mcqs.map((mcq, mcqIndex) => (
              <div
                key={mcq.id || mcqIndex}
                className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-4">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <HelpCircle className="w-4 h-4 text-green-600" />
                      </div>
                      <h4 className="font-medium text-gray-900">
                        MCQ Test for Module
                      </h4>
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                        {mcq.questions?.length || 0} Questions
                      </span>
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                        Passing Score: {mcq.passingScore}%
                      </span>
                    </div>

                    {/* Display questions preview */}
                    {mcq.questions && Array.isArray(mcq.questions) && (
                      <div className="space-y-4">
                        {mcq.questions
                          .slice(0, 3)
                          .map((question: any, qIndex: number) => (
                            <div
                              key={qIndex}
                              className="border-l-4 border-green-200 pl-4"
                            >
                              <div className="flex items-center space-x-2 mb-2">
                                <span className="text-sm font-medium text-gray-600">
                                  Question {qIndex + 1}:
                                </span>
                                {question.difficulty && (
                                  <span
                                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                                      question.difficulty === "easy"
                                        ? "bg-green-100 text-green-700"
                                        : question.difficulty === "medium"
                                          ? "bg-yellow-100 text-yellow-700"
                                          : "bg-red-100 text-red-700"
                                    }`}
                                  >
                                    {question.difficulty}
                                  </span>
                                )}
                              </div>
                              <div className="text-gray-700 mb-2 text-sm">
                                <HTMLContentMCQ
                                  content={
                                    question.question ||
                                    "No question text available"
                                  }
                                />
                              </div>
                              {question.options &&
                                Array.isArray(question.options) && (
                                  <div className="space-y-1">
                                    {question.options
                                      .slice(0, 2)
                                      .map((option: any, optIndex: number) => (
                                        <div
                                          key={optIndex}
                                          className="flex items-center space-x-2 text-sm"
                                        >
                                          <div
                                            className={`w-3 h-3 rounded-full border ${
                                              option.is_correct
                                                ? "bg-green-500 border-green-500"
                                                : "border-gray-300"
                                            }`}
                                          >
                                            {option.is_correct && (
                                              <div className="w-1 h-1 bg-white rounded-full m-1"></div>
                                            )}
                                          </div>
                                          <span
                                            className={`${
                                              option.is_correct
                                                ? "text-green-700 font-medium"
                                                : "text-gray-600"
                                            }`}
                                          >
                                            {renderSafeContent(option.text) ||
                                              renderSafeContent(
                                                option.option,
                                              ) ||
                                              `Option ${optIndex + 1}`}
                                          </span>
                                        </div>
                                      ))}
                                    {question.options.length > 2 && (
                                      <div className="text-xs text-gray-500">
                                        ... and {question.options.length - 2}{" "}
                                        more options
                                      </div>
                                    )}
                                  </div>
                                )}
                            </div>
                          ))}
                        {mcq.questions.length > 3 && (
                          <div className="text-sm text-gray-500 border-l-4 border-gray-200 pl-4">
                            ... and {mcq.questions.length - 3} more questions
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-1 ml-4">
                    <button className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleEditMCQ(mcq)}
                      className="p-2 text-gray-400 hover:text-green-600 rounded-lg hover:bg-green-50 transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteMCQ(mcq)}
                      className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>Total Questions: {mcq.questions?.length || 0}</span>
                    <span>Passing Score: {mcq.passingScore}%</span>
                  </div>
                  <span className="text-xs text-gray-500">
                    MCQ ID: {mcq.id}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ManageMCQ
        isOpen={showManageModal}
        onClose={handleModalClose}
        onSave={handleModalSave}
        module={module}
        batch={batch}
        course={course}
        mcq={selectedMCQ}
        mode={manageMode}
      />
    </>
  );
};

export default ModuleMcqManagement;

// Create Module Modal Component
const CreateModuleModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: {
    title: string;
    description: string;
    order_index: number;
  }) => void;
  loading: boolean;
  courseTitle: string;
  nextOrderIndex: number;
}> = ({ isOpen, onClose, onCreate, loading, courseTitle, nextOrderIndex }) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    order_index: nextOrderIndex,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.title.trim()) {
      onCreate(formData);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900">
            Create New Module
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-blue-700">
              <span className="font-medium">Course:</span> {courseTitle}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Module Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter module title"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Enter module description (optional)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Order Index
            </label>
            <input
              type="number"
              value={formData.order_index}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  order_index: parseInt(e.target.value) || 1,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="1"
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formData.title.trim()}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-lg transition-colors flex items-center space-x-2"
            >
              {loading && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              )}
              <span>Create Module</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
