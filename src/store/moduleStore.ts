import { create } from "zustand";
import axios from "axios";

const baseUrl = process.env.NEXT_PUBLIC_BACKEND_BASE_URL || "";

export interface Module {
  id: string;
  title: string;
  order: number;
  isLocked: boolean;
  course_id: string;
  created_at?: string;
  updated_at?: string;
  days?: DayContent[];
  mcq?: MCQ;
}

export interface DayContent {
  id: string;
  dayNumber: number;
  content: string;
  title?: string;
  completed: boolean;
  module_id: string;
}

export interface MCQ {
  id: string;
  passingScore: number;
  questions: MCQQuestion[];
  module_id: string;
}

export type QuillDelta = Record<string, unknown>; // Define a type for Quill Delta format

export interface MCQQuestion {
  id: string;
  question: QuillDelta; // Replace `any` with `QuillDelta`
  options: {
    id: string;
    text: QuillDelta; // Replace `any` with `QuillDelta`
  }[];
  correctAnswer: string;
  explanation?: QuillDelta; // Replace `any` with `QuillDelta`
}

export interface CreateModuleData {
  title: string;
  order: number;
  isLocked?: boolean;
}

export interface CreateDayContentData {
  content: string;
  dayNumber?: number;
  title?: string;
  id?: string; // Added optional id property
}

export interface CreateMCQData {
  questions: MCQQuestion[];
  passingScore: number;
}

interface ModuleStore {
  modules: Module[];
  selectedModule: Module | null;
  loading: boolean;
  error: string | null;

  // Module operations
  fetchModules: (
    batchId: string,
    courseId: string,
    jwt: string,
  ) => Promise<void>;
  createModule: (
    batchId: string,
    courseId: string,
    moduleData: CreateModuleData,
    jwt: string,
  ) => Promise<Module>;
  updateModule: (
    batchId: string,
    courseId: string,
    moduleId: string,
    moduleData: Partial<CreateModuleData>,
    jwt: string,
  ) => Promise<Module>;
  deleteModule: (
    batchId: string,
    courseId: string,
    moduleId: string,
    jwt: string,
  ) => Promise<void>;

  // Day Content operations
  createDayContent: (
    batchId: string,
    courseId: string,
    moduleId: string,
    dayData: CreateDayContentData,
    jwt: string,
  ) => Promise<DayContent>;
  updateDayContent: (
    batchId: string,
    courseId: string,
    moduleId: string,
    dayId: string,
    dayData: Partial<CreateDayContentData>,
    jwt: string,
  ) => Promise<DayContent>;
  deleteDayContent: (
    batchId: string,
    courseId: string,
    moduleId: string,
    dayId: string,
    jwt: string,
  ) => Promise<void>;

  // MCQ operations
  createMCQ: (
    batchId: string,
    courseId: string,
    moduleId: string,
    mcqData: CreateMCQData,
    jwt: string,
  ) => Promise<MCQ>;
  updateMCQ: (
    batchId: string,
    courseId: string,
    moduleId: string,
    mcqId: string,
    mcqData: Partial<CreateMCQData>,
    jwt: string,
  ) => Promise<MCQ>;
  deleteMCQ: (
    batchId: string,
    courseId: string,
    moduleId: string,
    mcqId: string,
    jwt: string,
  ) => Promise<void>;

  // State management
  setSelectedModule: (module: Module | null) => void;
  clearError: () => void;
  reset: () => void;
}

export const useModuleStore = create<ModuleStore>((set) => ({
  modules: [],
  selectedModule: null,
  loading: false,
  error: null,

  // Fetch all modules for a course
  fetchModules: async (batchId: string, courseId: string, jwt: string) => {
    set({ loading: true, error: null });
    try {
      const response = await axios.get(
        `${baseUrl}/api/instructor/courses/${courseId}/modules`,
        {
          headers: { Authorization: `Bearer ${jwt}` },
        },
      );
      set({ modules: response.data || [], loading: false });
    } catch (error: unknown) {
      const err = error as {
        response?: { data?: { message?: string }; status?: number };
        message?: string;
      };
      console.error("Module fetch error:", err.response?.data || err.message);
      set({
        error: err?.response?.data?.message || "Failed to fetch modules",
        loading: false,
      });
      throw error;
    }
  },

  // Create module
  createModule: async (
    batchId: string,
    courseId: string,
    moduleData: CreateModuleData,
    jwt: string,
  ) => {
    set({ loading: true, error: null });
    try {
      const response = await axios.post(
        `${baseUrl}/api/instructor/courses/${courseId}/modules`,
        moduleData,
        {
          headers: { Authorization: `Bearer ${jwt}` },
        },
      );
      const newModule = response.data;

      set((state) => ({
        modules: [...state.modules, newModule],
        loading: false,
      }));

      return newModule;
    } catch (error: unknown) {
      const err = error as {
        response?: { data?: { message?: string }; status?: number };
        message?: string;
      };
      console.error("Module create error:", err.response?.data || err.message);
      set({
        error: err?.response?.data?.message || "Failed to create module",
        loading: false,
      });
      throw error;
    }
  },

  // Update module
  updateModule: async (
    batchId: string,
    courseId: string,
    moduleId: string,
    moduleData: Partial<CreateModuleData>,
    jwt: string,
  ) => {
    set({ loading: true, error: null });
    try {
      const response = await axios.put(
        `${baseUrl}/api/instructor/courses/${courseId}/modules/${moduleId}`,
        moduleData,
        {
          headers: { Authorization: `Bearer ${jwt}` },
        },
      );
      const updatedModule = response.data;

      set((state) => ({
        modules: state.modules.map((module) =>
          module.id === moduleId ? updatedModule : module,
        ),
        selectedModule:
          state.selectedModule?.id === moduleId
            ? updatedModule
            : state.selectedModule,
        loading: false,
      }));

      return updatedModule;
    } catch (error: unknown) {
      const err = error as {
        response?: { data?: { message?: string }; status?: number };
        message?: string;
      };
      console.error("Module update error:", err.response?.data || err.message);
      set({
        error: err?.response?.data?.message || "Failed to update module",
        loading: false,
      });
      throw error;
    }
  },

  // Delete module
  deleteModule: async (
    batchId: string,
    courseId: string,
    moduleId: string,
    jwt: string,
  ) => {
    set({ loading: true, error: null });
    try {
      await axios.delete(
        `${baseUrl}/api/instructor/courses/${courseId}/modules/${moduleId}`,
        {
          headers: { Authorization: `Bearer ${jwt}` },
        },
      );

      set((state) => ({
        modules: state.modules.filter((module) => module.id !== moduleId),
        selectedModule:
          state.selectedModule?.id === moduleId ? null : state.selectedModule,
        loading: false,
      }));
    } catch (error: unknown) {
      const err = error as {
        response?: { data?: { message?: string }; status?: number };
        message?: string;
      };
      console.error("Module delete error:", err.response?.data || err.message);
      set({
        error: err?.response?.data?.message || "Failed to delete module",
        loading: false,
      });
      throw error;
    }
  },

  // Create day content
  createDayContent: async (
    batchId: string,
    courseId: string,
    moduleId: string,
    dayData: CreateDayContentData,
    jwt: string,
  ) => {
    set({ loading: true, error: null });
    try {
      const response = await axios.post(
        `${baseUrl}/api/instructor/batches/${batchId}/courses/${courseId}/modules/${moduleId}/day-content`,
        dayData,
        {
          headers: { Authorization: `Bearer ${jwt}` },
        },
      );
      const newDayContent = response.data.dayContent;

      set((state) => ({
        modules: state.modules.map((module) =>
          module.id === moduleId
            ? {
                ...module,
                days: [...(module.days || []), newDayContent],
              }
            : module,
        ),
        selectedModule:
          state.selectedModule?.id === moduleId
            ? {
                ...state.selectedModule,
                days: [...(state.selectedModule.days || []), newDayContent],
              }
            : state.selectedModule,
        loading: false,
      }));

      return newDayContent;
    } catch (error: unknown) {
      const err = error as {
        response?: { data?: { message?: string }; status?: number };
        message?: string;
      };
      console.error(
        "Day content create error:",
        err.response?.data || err.message,
      );
      set({
        error: err?.response?.data?.message || "Failed to create day content",
        loading: false,
      });
      throw error;
    }
  },

  // Update day content
  updateDayContent: async (
    batchId: string,
    courseId: string,
    moduleId: string,
    dayId: string,
    dayData: Partial<CreateDayContentData>,
    jwt: string,
  ) => {
    set({ loading: true, error: null });
    try {
      const response = await axios.put(
        `${baseUrl}/api/instructor/batches/${batchId}/courses/${courseId}/modules/${moduleId}/day-content/${dayId}`,
        dayData,
        {
          headers: { Authorization: `Bearer ${jwt}` },
        },
      );
      const updatedDayContent = response.data.dayContent;

      set((state) => ({
        modules: state.modules.map((module) =>
          module.id === moduleId
            ? {
                ...module,
                days: module.days?.map((day) =>
                  day.id === dayId ? updatedDayContent : day,
                ),
              }
            : module,
        ),
        selectedModule:
          state.selectedModule?.id === moduleId
            ? {
                ...state.selectedModule,
                days: state.selectedModule.days?.map((day) =>
                  day.id === dayId ? updatedDayContent : day,
                ),
              }
            : state.selectedModule,
        loading: false,
      }));

      return updatedDayContent;
    } catch (error: unknown) {
      const err = error as {
        response?: { data?: { message?: string }; status?: number };
        message?: string;
      };
      console.error(
        "Day content update error:",
        err.response?.data || err.message,
      );
      set({
        error: err?.response?.data?.message || "Failed to update day content",
        loading: false,
      });
      throw error;
    }
  },

  // Delete day content
  deleteDayContent: async (
    batchId: string,
    courseId: string,
    moduleId: string,
    dayId: string,
    jwt: string,
  ) => {
    set({ loading: true, error: null });
    try {
      await axios.delete(
        `${baseUrl}/api/instructor/batches/${batchId}/courses/${courseId}/modules/${moduleId}/day-content/${dayId}`,
        {
          headers: { Authorization: `Bearer ${jwt}` },
        },
      );

      set((state) => ({
        modules: state.modules.map((module) =>
          module.id === moduleId
            ? {
                ...module,
                days: module.days?.filter((day) => day.id !== dayId),
              }
            : module,
        ),
        selectedModule:
          state.selectedModule?.id === moduleId
            ? {
                ...state.selectedModule,
                days: state.selectedModule.days?.filter(
                  (day) => day.id !== dayId,
                ),
              }
            : state.selectedModule,
        loading: false,
      }));
    } catch (error: unknown) {
      const err = error as {
        response?: { data?: { message?: string }; status?: number };
        message?: string;
      };
      console.error(
        "Day content delete error:",
        err.response?.data || err.message,
      );
      set({
        error: err?.response?.data?.message || "Failed to delete day content",
        loading: false,
      });
      throw error;
    }
  },

  // Create MCQ
  createMCQ: async (
    batchId: string,
    courseId: string,
    moduleId: string,
    mcqData: CreateMCQData,
    jwt: string,
  ) => {
    set({ loading: true, error: null });
    try {
      const response = await axios.post(
        `${baseUrl}/api/instructor/batches/${batchId}/courses/${courseId}/modules/${moduleId}/mcq`,
        mcqData,
        {
          headers: { Authorization: `Bearer ${jwt}` },
        },
      );
      const newMCQ = response.data.mcq;

      set((state) => ({
        modules: state.modules.map((module) =>
          module.id === moduleId ? { ...module, mcq: newMCQ } : module,
        ),
        selectedModule:
          state.selectedModule?.id === moduleId
            ? { ...state.selectedModule, mcq: newMCQ }
            : state.selectedModule,
        loading: false,
      }));

      return newMCQ;
    } catch (error: unknown) {
      const err = error as {
        response?: { data?: { message?: string }; status?: number };
        message?: string;
      };
      console.error("MCQ create error:", err.response?.data || err.message);
      set({
        error: err?.response?.data?.message || "Failed to create MCQ",
        loading: false,
      });
      throw error;
    }
  },

  // Update MCQ
  updateMCQ: async (
    batchId: string,
    courseId: string,
    moduleId: string,
    mcqId: string,
    mcqData: Partial<CreateMCQData>,
    jwt: string,
  ) => {
    set({ loading: true, error: null });
    try {
      const response = await axios.put(
        `${baseUrl}/api/instructor/batches/${batchId}/courses/${courseId}/modules/${moduleId}/mcq/${mcqId}`,
        mcqData,
        {
          headers: { Authorization: `Bearer ${jwt}` },
        },
      );
      const updatedMCQ = response.data.mcq;

      set((state) => ({
        modules: state.modules.map((module) =>
          module.id === moduleId ? { ...module, mcq: updatedMCQ } : module,
        ),
        selectedModule:
          state.selectedModule?.id === moduleId
            ? { ...state.selectedModule, mcq: updatedMCQ }
            : state.selectedModule,
        loading: false,
      }));

      return updatedMCQ;
    } catch (error: unknown) {
      const err = error as {
        response?: { data?: { message?: string }; status?: number };
        message?: string;
      };
      console.error("MCQ update error:", err.response?.data || err.message);
      set({
        error: err?.response?.data?.message || "Failed to update MCQ",
        loading: false,
      });
      throw error;
    }
  },

  // Delete MCQ
  deleteMCQ: async (
    batchId: string,
    courseId: string,
    moduleId: string,
    mcqId: string,
    jwt: string,
  ) => {
    set({ loading: true, error: null });
    try {
      await axios.delete(
        `${baseUrl}/api/instructor/batches/${batchId}/courses/${courseId}/modules/${moduleId}/mcq/${mcqId}`,
        {
          headers: { Authorization: `Bearer ${jwt}` },
        },
      );

      set((state) => ({
        modules: state.modules.map((module) =>
          module.id === moduleId ? { ...module, mcq: undefined } : module,
        ),
        selectedModule:
          state.selectedModule?.id === moduleId
            ? { ...state.selectedModule, mcq: undefined }
            : state.selectedModule,
        loading: false,
      }));
    } catch (error: unknown) {
      const err = error as {
        response?: { data?: { message?: string }; status?: number };
        message?: string;
      };
      console.error("MCQ delete error:", err.response?.data || err.message);
      set({
        error: err?.response?.data?.message || "Failed to delete MCQ",
        loading: false,
      });
      throw error;
    }
  },

  // State management
  setSelectedModule: (module: Module | null) => {
    set({ selectedModule: module });
  },

  clearError: () => {
    set({ error: null });
  },

  reset: () => {
    set({
      modules: [],
      selectedModule: null,
      loading: false,
      error: null,
    });
  },
}));
