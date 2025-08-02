import { create } from "zustand";
import axios from "axios";

const baseUrl = process.env.NEXT_PUBLIC_BACKEND_BASE_URL || "";

// Types (same as before)
export interface QuillDelta {
  ops: Array<{
    insert: string | object;
    attributes?: object;
    retain?: number;
    delete?: number;
  }>;
}

export interface CreateModuleData {
  title: string;
  order: number;
  isLocked?: boolean;
}

export interface CreateMCQData {
  questions: MCQQuestion[];
  passingScore: number;
}

export interface CreateDayContentData {
  id?: string;
  content: string;
  dayNumber: number;
  title?: string;
}

export interface MCQQuestion {
  id?: string;
  question: QuillDelta;
  options: Array<{
    id: string;
    text: QuillDelta;
  }>;
  correctAnswer: string;
  explanation?: QuillDelta;
}

export interface Module {
  id: string;
  title: string;
  order: number;
  isLocked: boolean;
  description?: string;
  days?: CreateDayContentData[];
  mcq?: {
    id: string;
    passingScore: number;
    questions: MCQQuestion[];
  };
}

interface ModuleStore {
  modules: Module[];
  selectedModule: Module | null;
  loading: boolean;
  error: string | null;

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
  clearError: () => void;

  setSelectedModule: (module: Module | null) => void;
  reset: () => void;

  createDayContent: (
    batchId: string,
    courseId: string,
    moduleId: string,
    dayData: CreateDayContentData,
    jwt: string,
  ) => Promise<any>;
  updateDayContent: (
    batchId: string,
    courseId: string,
    moduleId: string,
    dayId: string,
    dayData: Partial<CreateDayContentData>,
    jwt: string,
  ) => Promise<any>;
  deleteDayContent: (
    batchId: string,
    courseId: string,
    moduleId: string,
    dayId: string,
    jwt: string,
  ) => Promise<void>;

  createMCQ: (
    batchId: string,
    courseId: string,
    moduleId: string,
    mcqData: CreateMCQData,
    jwt: string,
  ) => Promise<any>;
  deleteMCQ: (
    batchId: string,
    courseId: string,
    moduleId: string,
    mcqId: string,
    jwt: string,
  ) => Promise<void>;
}

export const useModuleStore = create<ModuleStore>((set, get) => ({
  modules: [],
  selectedModule: null,
  loading: false,
  error: null,

  setSelectedModule: (module: Module | null) => {
    console.log(
      "Setting selected module:",
      module
        ? {
            id: module.id,
            title: module.title,
            daysCount: module.days?.length || 0,
          }
        : null,
    );
    set({ selectedModule: module });
  },

  fetchModules: async (batchId: string, courseId: string, jwt: string) => {
    set({ loading: true, error: null });
    try {
      console.log("Fetching modules with params:", { batchId, courseId });

      const response = await axios.get(
        `${baseUrl}/api/instructor/batches/${batchId}/courses/${courseId}/modules`,
        {
          headers: {
            Authorization: `Bearer ${jwt}`,
            "Content-Type": "application/json",
          },
          timeout: 30000,
        },
      );

      const fetchedModules = response.data.modules || response.data || [];
      console.log(
        "Fetched modules:",
        fetchedModules.map((m: Module) => ({
          id: m.id,
          title: m.title,
          order: m.order || 1,
          isLocked: m.isLocked || false,
          daysCount: m.days?.length || 0,
        })),
      );

      const modulesWithDefaults = fetchedModules.map((module: any) => ({
        ...module,
        order: module.order || 1,
        isLocked: module.isLocked || false,
      }));

      set({
        modules: modulesWithDefaults,
        loading: false,
      });
    } catch (error: unknown) {
      const err = error as {
        response?: { data?: { message?: string }; status?: number };
        message?: string;
      };
      console.error("Modules fetch error:", err.response?.data || err.message);
      set({
        error: err?.response?.data?.message || "Failed to fetch modules",
        loading: false,
      });
    }
  },

  createModule: async (
    batchId: string,
    courseId: string,
    moduleData: CreateModuleData,
    jwt: string,
  ): Promise<Module> => {
    set({ loading: true, error: null });
    try {
      console.log("Creating module:", moduleData);

      const response = await axios.post(
        `${baseUrl}/api/instructor/batches/${batchId}/courses/${courseId}/modules`,
        moduleData,
        {
          headers: {
            Authorization: `Bearer ${jwt}`,
            "Content-Type": "application/json",
          },
          timeout: 30000,
        },
      );

      const newModule = response.data.module || response.data;

      const moduleWithDefaults = {
        ...newModule,
        order: newModule.order || moduleData.order || 1,
        isLocked:
          newModule.isLocked !== undefined
            ? newModule.isLocked
            : moduleData.isLocked || false,
      };

      console.log("Created module successfully:", {
        id: moduleWithDefaults.id,
        title: moduleWithDefaults.title,
        order: moduleWithDefaults.order,
        isLocked: moduleWithDefaults.isLocked,
      });

      set((state) => ({
        modules: [...state.modules, moduleWithDefaults].sort(
          (a, b) => a.order - b.order,
        ),
        loading: false,
      }));

      return moduleWithDefaults;
    } catch (error: unknown) {
      const err = error as {
        response?: { data?: { message?: string }; status?: number };
        message?: string;
      };
      console.error("Module create error:", err.response?.data || err.message);

      const errorMessage =
        err?.response?.data?.message ||
        err.message ||
        "Failed to create module";
      set({
        error: errorMessage,
        loading: false,
      });
      throw new Error(errorMessage);
    }
  },

  updateModule: async (
    batchId: string,
    courseId: string,
    moduleId: string,
    moduleData: Partial<CreateModuleData>,
    jwt: string,
  ): Promise<Module> => {
    set({ loading: true, error: null });
    try {
      console.log("Updating module:", { moduleId, moduleData });

      const response = await axios.put(
        `${baseUrl}/api/instructor/batches/${batchId}/courses/${courseId}/modules/${moduleId}`,
        moduleData,
        {
          headers: {
            Authorization: `Bearer ${jwt}`,
            "Content-Type": "application/json",
          },
          timeout: 30000,
        },
      );

      const updatedModule = response.data.module || response.data;

      const moduleWithDefaults = {
        ...updatedModule,
        order: updatedModule.order || 1,
        isLocked: updatedModule.isLocked || false,
      };

      console.log("Updated module successfully:", {
        id: moduleWithDefaults.id,
        title: moduleWithDefaults.title,
        order: moduleWithDefaults.order,
        isLocked: moduleWithDefaults.isLocked,
      });

      set((state) => ({
        modules: state.modules
          .map((module) =>
            module.id === moduleId ? moduleWithDefaults : module,
          )
          .sort((a, b) => a.order - b.order),
        selectedModule:
          state.selectedModule?.id === moduleId
            ? moduleWithDefaults
            : state.selectedModule,
        loading: false,
      }));

      return moduleWithDefaults;
    } catch (error: unknown) {
      const err = error as {
        response?: { data?: { message?: string }; status?: number };
        message?: string;
      };
      console.error("Module update error:", err.response?.data || err.message);

      const errorMessage =
        err?.response?.data?.message ||
        err.message ||
        "Failed to update module";
      set({
        error: errorMessage,
        loading: false,
      });
      throw new Error(errorMessage);
    }
  },

  deleteModule: async (
    batchId: string,
    courseId: string,
    moduleId: string,
    jwt: string,
  ): Promise<void> => {
    set({ loading: true, error: null });
    try {
      console.log("Deleting module:", { moduleId });

      await axios.delete(
        `${baseUrl}/api/instructor/batches/${batchId}/courses/${courseId}/modules/${moduleId}`,
        {
          headers: {
            Authorization: `Bearer ${jwt}`,
            "Content-Type": "application/json",
          },
          timeout: 30000,
        },
      );

      console.log("Deleted module successfully");

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

      const errorMessage =
        err?.response?.data?.message ||
        err.message ||
        "Failed to delete module";
      set({
        error: errorMessage,
        loading: false,
      });
      throw new Error(errorMessage);
    }
  },

  clearError: () => {
    console.log("Clearing module store error");
    set({ error: null });
  },

  reset: () => {
    console.log("Resetting module store");
    set({
      modules: [],
      selectedModule: null,
      loading: false,
      error: null,
    });
  },

  createDayContent: async (
    batchId: string,
    courseId: string,
    moduleId: string,
    dayData: CreateDayContentData,
    jwt: string,
  ) => {
    set({ loading: true, error: null });
    try {
      console.log("Creating day content:", {
        moduleId,
        title: dayData.title,
        dayNumber: dayData.dayNumber,
        contentLength: dayData.content.length,
      });

      const response = await axios.post(
        `${baseUrl}/api/instructor/batches/${batchId}/courses/${courseId}/modules/${moduleId}/day-content`,
        {
          content: dayData.content,
          dayNumber: dayData.dayNumber,
          title: dayData.title,
        },
        {
          headers: {
            Authorization: `Bearer ${jwt}`,
            "Content-Type": "application/json",
          },
          timeout: 30000,
        },
      );

      const newDayContent = response.data.dayContent;
      console.log("Created day content successfully:", {
        id: newDayContent.id,
        title: newDayContent.title,
        dayNumber: newDayContent.dayNumber,
        contentLength: newDayContent.content?.length || 0,
      });

      set((state) => {
        const updatedModules = state.modules.map((module) =>
          module.id === moduleId
            ? {
                ...module,
                days: [...(module.days || []), newDayContent].sort(
                  (a, b) => a.dayNumber - b.dayNumber,
                ),
              }
            : module,
        );

        const updatedSelectedModule =
          state.selectedModule?.id === moduleId
            ? {
                ...state.selectedModule,
                days: [
                  ...(state.selectedModule.days || []),
                  newDayContent,
                ].sort((a, b) => a.dayNumber - b.dayNumber),
              }
            : state.selectedModule;

        return {
          modules: updatedModules,
          selectedModule: updatedSelectedModule,
          loading: false,
        };
      });

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

      const errorMessage =
        err?.response?.data?.message ||
        err.message ||
        "Failed to create day content";
      set({
        error: errorMessage,
        loading: false,
      });
      throw new Error(errorMessage);
    }
  },

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
      console.log("Updating day content:", {
        dayId,
        moduleId,
        updates: {
          hasContent: !!dayData.content,
          hasTitle: !!dayData.title,
          hasDayNumber: !!dayData.dayNumber,
          contentLength: dayData.content?.length || 0,
        },
      });

      const response = await axios.put(
        `${baseUrl}/api/instructor/batches/${batchId}/courses/${courseId}/modules/${moduleId}/day-content/${dayId}`,
        dayData,
        {
          headers: {
            Authorization: `Bearer ${jwt}`,
            "Content-Type": "application/json",
          },
          timeout: 30000,
        },
      );

      const updatedDayContent = response.data.dayContent;
      console.log("Updated day content successfully:", {
        id: updatedDayContent.id,
        title: updatedDayContent.title,
        dayNumber: updatedDayContent.dayNumber,
        contentLength: updatedDayContent.content?.length || 0,
        contentPreview:
          updatedDayContent.content?.substring(0, 100) + "..." || "No content",
      });

      set((state) => {
        const updatedModules = state.modules.map((module) =>
          module.id === moduleId
            ? {
                ...module,
                days: module.days
                  ?.map((day) => (day.id === dayId ? updatedDayContent : day))
                  .sort((a, b) => a.dayNumber - b.dayNumber),
              }
            : module,
        );

        const updatedSelectedModule =
          state.selectedModule?.id === moduleId
            ? {
                ...state.selectedModule,
                days: state.selectedModule.days
                  ?.map((day) => (day.id === dayId ? updatedDayContent : day))
                  .sort((a, b) => a.dayNumber - b.dayNumber),
              }
            : state.selectedModule;

        console.log("State updated with new content:", {
          moduleId,
          updatedDayId: updatedDayContent.id,
          newContentLength: updatedDayContent.content?.length || 0,
        });

        return {
          modules: updatedModules,
          selectedModule: updatedSelectedModule,
          loading: false,
        };
      });

      return updatedDayContent;
    } catch (error: unknown) {
      const err = error as {
        response?: { data?: { message?: string }; status?: number };
        message?: string;
      };
      console.error("Day content update error:", {
        status: err.response?.status,
        message: err.response?.data?.message || err.message,
        data: err.response?.data,
      });

      const errorMessage =
        err?.response?.data?.message ||
        err.message ||
        "Failed to update day content";
      set({
        error: errorMessage,
        loading: false,
      });
      throw new Error(errorMessage);
    }
  },

  deleteDayContent: async (
    batchId: string,
    courseId: string,
    moduleId: string,
    dayId: string,
    jwt: string,
  ) => {
    set({ loading: true, error: null });
    try {
      console.log("Deleting day content:", { dayId, moduleId });

      await axios.delete(
        `${baseUrl}/api/instructor/batches/${batchId}/courses/${courseId}/modules/${moduleId}/day-content/${dayId}`,
        {
          headers: {
            Authorization: `Bearer ${jwt}`,
            "Content-Type": "application/json",
          },
          timeout: 30000,
        },
      );

      console.log("Day content deleted successfully");

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

      const errorMessage =
        err?.response?.data?.message ||
        err.message ||
        "Failed to delete day content";
      set({
        error: errorMessage,
        loading: false,
      });
      throw new Error(errorMessage);
    }
  },

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
          headers: {
            Authorization: `Bearer ${jwt}`,
            "Content-Type": "application/json",
          },
          timeout: 30000,
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

      const errorMessage =
        err?.response?.data?.message || err.message || "Failed to create MCQ";
      set({
        error: errorMessage,
        loading: false,
      });
      throw new Error(errorMessage);
    }
  },

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
          headers: {
            Authorization: `Bearer ${jwt}`,
            "Content-Type": "application/json",
          },
          timeout: 30000,
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

      const errorMessage =
        err?.response?.data?.message || err.message || "Failed to delete MCQ";
      set({
        error: errorMessage,
        loading: false,
      });
      throw new Error(errorMessage);
    }
  },
}));
