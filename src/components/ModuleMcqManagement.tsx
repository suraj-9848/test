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
import MCQModuleManager from "./MCQModuleManager";
import "@/styles/module-mcq-management.css";
import { CreateModuleModal } from "./CreateModuleModal";
import { BatchesView } from "./BatchesView";
import { ModuleDetailView } from "./ModuleDetailView";
import { CoursesView } from "./CourseView";
import { ModulesView } from "./ModuleView";

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
export default ModuleMcqManagement;
