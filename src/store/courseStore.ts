import { create } from "zustand";
import axios from "axios";
import { instructorApi } from "@/api/instructorApi";
import { BASE_URLS } from "../config/urls";

const baseUrl = BASE_URLS.BACKEND;

// Debug log the base URL
console.log("Backend base URL:", baseUrl);

export interface Course {
  id: string;
  title: string;
  logo?: string;
  start_date: string;
  end_date: string;
  batches?: Batch[]; // Changed from batch_id to batches
  is_public: boolean;
  instructor_name: string;
  created_at?: string;
  updated_at?: string;
  modules?: Module[];
}

export interface Module {
  id: string;
  title: string;
  order: number;
  isLocked: boolean;
  course_id: string;
  days?: DayContent[];
}

export interface DayContent {
  id: string;
  dayNumber: number;
  content: string;
  completed: boolean;
  module_id: string;
}

export interface Batch {
  id: string;
  name: string;
  description?: string;
}

export interface CreateCourseData {
  title: string;
  logo?: string;
  start_date: string;
  end_date: string;
  batch_ids: string[];
  is_public: boolean;
  instructor_name: string;
  overview?: string;
  trainer_name?: string;
  trainer_bio?: string;
  trainer_avatar?: string;
  trainer_linkedin?: string;
  price?: number;
  duration?: string;
  image?: string;
  features?: string[];
  curriculum?: string[];
  prerequisites?: string[];
  tags?: string[];
  mode?: "online" | "offline" | "hybrid";
  what_you_will_learn?: string[];
  modules?: {
    title: string;
    order: number;
    isLocked: boolean;
    days: {
      dayNumber: number;
      content: string;
      completed?: boolean;
    }[];
  }[];
}

export interface UpdateCourseData {
  title?: string;
  logo?: string;
  start_date?: string;
  end_date?: string;
  batch_ids?: string[]; // Changed from batch_id to batch_ids
  is_public?: boolean;
  instructor_name?: string;
}

export interface AssignCourseData {
  userId: string;
  courseId: string;
}

interface CourseStore {
  courses: Course[];
  batches: Batch[];
  selectedCourse: Course | null;
  loading: boolean;
  error: string | null;

  // Batch operations
  fetchBatches: () => Promise<void>;

  // Course operations
  createCourse: (courseData: CreateCourseData) => Promise<Course>;
  fetchAllCoursesInBatch: (batchId: string, jwt: string) => Promise<void>;
  fetchCourse: (
    batchId: string,
    courseId: string,
    jwt: string,
  ) => Promise<Course>;
  updateCourse: (
    batchId: string,
    courseId: string,
    updateData: UpdateCourseData,
    jwt: string,
  ) => Promise<Course>;
  deleteCourse: (
    batchId: string,
    courseId: string,
    jwt: string,
  ) => Promise<void>;
  updateCoursePublicStatus: (
    batchId: string,
    courseId: string,
    isPublic: boolean,
    jwt: string,
  ) => Promise<Course>;
  assignCourseToStudent: (
    batchId: string,
    courseId: string,
    assignData: AssignCourseData,
    jwt: string,
  ) => Promise<void>;

  // State management
  setSelectedCourse: (course: Course | null) => void;
  clearError: () => void;
  reset: () => void;
}

export const useCourseStore = create<CourseStore>((set) => ({
  courses: [],
  batches: [],
  selectedCourse: null,
  loading: false,
  error: null,

  // Fetch all batches
  fetchBatches: async () => {
    set({ loading: true, error: null });
    try {
      const response = await instructorApi.getBatches();
      set({ batches: response.batches || [], loading: false });
    } catch (error: unknown) {
      const err = error as {
        response?: { data?: { message?: string }; status?: number };
        message?: string;
      };
      set({
        error:
          err?.response?.data?.message ||
          err?.message ||
          "Failed to fetch batches",
        loading: false,
      });
      throw error;
    }
  },

  // Create course in a specific batch
  createCourse: async (courseData: CreateCourseData) => {
    set({ loading: true, error: null });
    try {
      const response = await instructorApi.createCourse(courseData);
      set((state) => ({
        courses: [response.course, ...state.courses],
        loading: false,
        error: null,
      }));
      return response.course;
    } catch (err: unknown) {
      set({
        loading: false,
        error: (err as Error).message || "Failed to create course",
      });
      throw err;
    }
  },

  // Fetch all courses in a batch
  fetchAllCoursesInBatch: async (batchId: string, jwt: string) => {
    set({ loading: true, error: null });
    try {
      const response = await axios.get(
        `${baseUrl}/api/instructor/batches/${batchId}/courses`,
        {
          headers: { Authorization: `Bearer ${jwt}` },
        },
      );
      const courses = response.data.courses || response.data || [];
      set({
        courses: Array.isArray(courses) ? courses : [],
        loading: false,
      });
    } catch (error: unknown) {
      const err = error as {
        response?: { data?: { message?: string }; status?: number };
        message?: string;
      };
      set({
        error: err?.response?.data?.message || "Failed to fetch courses",
        loading: false,
        courses: [],
      });
      throw error;
    }
  },

  // Fetch a single course
  fetchCourse: async (batchId: string, courseId: string, jwt: string) => {
    set({ loading: true, error: null });
    try {
      const response = await axios.get(
        `${baseUrl}/api/instructor/batches/${batchId}/courses/${courseId}`,
        {
          headers: { Authorization: `Bearer ${jwt}` },
        },
      );
      const course = response.data.course;

      set({ selectedCourse: course, loading: false });
      return course;
    } catch (error: unknown) {
      const err = error as {
        response?: { data?: { message?: string }; status?: number };
        message?: string;
      };
      set({
        error: err?.response?.data?.message || "Failed to fetch course",
        loading: false,
      });
      throw error;
    }
  },

  // Update course
  updateCourse: async (
    batchId: string,
    courseId: string,
    updateData: UpdateCourseData,
    jwt: string,
  ) => {
    set({ loading: true, error: null });
    try {
      const response = await axios.put(
        `${baseUrl}/api/instructor/batches/${batchId}/courses/${courseId}`,
        updateData,
        {
          headers: { Authorization: `Bearer ${jwt}` },
        },
      );
      const updatedCourse = response.data.course;

      set((state) => ({
        courses: state.courses.map((course) =>
          course.id === courseId ? updatedCourse : course,
        ),
        selectedCourse:
          state.selectedCourse?.id === courseId
            ? updatedCourse
            : state.selectedCourse,
        loading: false,
      }));

      return updatedCourse;
    } catch (error: unknown) {
      const err = error as {
        response?: { data?: { message?: string }; status?: number };
        message?: string;
      };
      set({
        error: err?.response?.data?.message || "Failed to update course",
        loading: false,
      });
      throw error;
    }
  },

  // Delete course
  deleteCourse: async (batchId: string, courseId: string, jwt: string) => {
    set({ loading: true, error: null });
    try {
      await axios.delete(
        `${baseUrl}/api/instructor/batches/${batchId}/courses/${courseId}`,
        {
          headers: { Authorization: `Bearer ${jwt}` },
        },
      );

      set((state) => ({
        courses: state.courses.filter((course) => course.id !== courseId),
        selectedCourse:
          state.selectedCourse?.id === courseId ? null : state.selectedCourse,
        loading: false,
      }));
    } catch (error: unknown) {
      const err = error as {
        response?: { data?: { message?: string }; status?: number };
        message?: string;
      };
      set({
        error: err?.response?.data?.message || "Failed to delete course",
        loading: false,
      });
      throw error;
    }
  },

  // Update course public status
  updateCoursePublicStatus: async (
    batchId: string,
    courseId: string,
    isPublic: boolean,
    jwt: string,
  ) => {
    set({ loading: true, error: null });
    try {
      const response = await axios.put(
        `${baseUrl}/api/instructor/batches/${batchId}/courses/${courseId}/public`,
        { is_public: isPublic },
        {
          headers: { Authorization: `Bearer ${jwt}` },
        },
      );
      const updatedCourse = response.data.course;

      set((state) => ({
        courses: state.courses.map((course) =>
          course.id === courseId ? updatedCourse : course,
        ),
        selectedCourse:
          state.selectedCourse?.id === courseId
            ? updatedCourse
            : state.selectedCourse,
        loading: false,
      }));

      return updatedCourse;
    } catch (error: unknown) {
      const err = error as {
        response?: { data?: { message?: string }; status?: number };
        message?: string;
      };
      set({
        error:
          err?.response?.data?.message ||
          "Failed to update course public status",
        loading: false,
      });
      throw error;
    }
  },

  // Assign course to student
  assignCourseToStudent: async (
    batchId: string,
    courseId: string,
    assignData: AssignCourseData,
    jwt: string,
  ) => {
    set({ loading: true, error: null });
    try {
      await axios.post(
        `${baseUrl}/api/instructor/batches/${batchId}/courses/${courseId}/assign-student`,
        assignData,
        {
          headers: { Authorization: `Bearer ${jwt}` },
        },
      );
      set({ loading: false });
    } catch (error: unknown) {
      const err = error as {
        response?: { data?: { message?: string }; status?: number };
        message?: string;
      };
      set({
        error:
          err?.response?.data?.message || "Failed to assign course to student",
        loading: false,
      });
      throw error;
    }
  },

  // State management
  setSelectedCourse: (course: Course | null) => {
    set({ selectedCourse: course });
  },

  clearError: () => {
    set({ error: null });
  },

  reset: () => {
    set({
      courses: [],
      batches: [],
      selectedCourse: null,
      loading: false,
      error: null,
    });
  },
}));
