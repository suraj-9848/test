import { create } from "zustand";
import axios from "axios";
const baseUrl = process.env.NEXT_PUBLIC_BACKEND_BASE_URL || "";

export interface Course {
  id: string;
  title: string;
  logo?: string;
  start_date: string;
  end_date: string;
  batch_id: string;
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
  batch_id: string;
  is_public: boolean;
  instructor_name: string;
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
  batch_id?: string;
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
  fetchBatches: (jwt: string) => Promise<void>;

  // Course operations
  createCourse: (
    batchId: string,
    courseData: CreateCourseData,
    jwt: string
  ) => Promise<Course>;
  fetchAllCoursesInBatch: (batchId: string, jwt: string) => Promise<void>;
  fetchCourse: (batchId: string, courseId: string, jwt: string) => Promise<Course>;
  updateCourse: (
    batchId: string,
    courseId: string,
    updateData: UpdateCourseData,
    jwt: string
  ) => Promise<Course>;
  deleteCourse: (batchId: string, courseId: string, jwt: string) => Promise<void>;
  updateCoursePublicStatus: (
    batchId: string,
    courseId: string,
    isPublic: boolean,
    jwt: string
  ) => Promise<Course>;
  assignCourseToStudent: (
    batchId: string,
    courseId: string,
    assignData: AssignCourseData,
    jwt: string
  ) => Promise<void>;

  // State management
  setSelectedCourse: (course: Course | null) => void;
  clearError: () => void;
  reset: () => void;
}

export const useCourseStore = create<CourseStore>((set, get) => ({
  courses: [],
  batches: [],
  selectedCourse: null,
  loading: false,
  error: null,

  // Fetch all batches
  fetchBatches: async (jwt: string) => {
    set({ loading: true, error: null });
    try {
      const response = await axios.get(`${baseUrl}/api/instructor/batches`, {
        headers: { Authorization: `Bearer ${jwt}` }
      });
      set({ batches: response.data.batches || [], loading: false });
    } catch (error: any) {
      set({
        error: error?.response?.data?.message || "Failed to fetch batches",
        loading: false,
      });
      throw error;
    }
  },

  // Create course in a specific batch
  createCourse: async (batchId: string, courseData: CreateCourseData, jwt: string) => {
    set({ loading: true, error: null });
    try {
      const response = await axios.post(
        `${baseUrl}/api/instructor/batches/${batchId}/courses`,
        courseData,
        {
          headers: { Authorization: `Bearer ${jwt}` }
        }
      );
      const newCourse = response.data.course;

      set((state) => ({
        courses: [...state.courses, newCourse],
        loading: false,
      }));

      return newCourse;
    } catch (error: any) {
      set({
        error: error?.response?.data?.message || "Failed to create course",
        loading: false,
      });
      throw error;
    }
  },

  // Fetch all courses in a batch
  fetchAllCoursesInBatch: async (batchId: string, jwt: string) => {
    set({ loading: true, error: null });
    try {
      console.log('Fetching courses for batch:', batchId); // Debug log
      console.log('Using JWT token:', jwt ? 'Token present' : 'No token'); // Debug log
      console.log('Base URL:', baseUrl); // Debug log
      
      const response = await axios.get(
        `${baseUrl}/api/instructor/batches/${batchId}/courses`,
        {
          headers: { Authorization: `Bearer ${jwt}` }
        }
      );
      console.log('Courses response:', response.data); // Debug log
      
      // Handle different response structures
      const courses = response.data.courses || response.data || [];
      set({ courses: Array.isArray(courses) ? courses : [], loading: false });
    } catch (error: any) {
      console.error('Course fetch error - Full error object:', error);
      console.error('Error response:', error.response);
      console.error('Error response status:', error.response?.status);
      console.error('Error response data:', error.response?.data);
      console.error('Error message:', error.message);
      console.error('Error code:', error.code);
      
      let errorMessage = 'Failed to fetch courses';
      
      if (error.response) {
        // Server responded with error status
        console.log('Server error response:', error.response.status, error.response.data);
        errorMessage = error.response.data?.message || `Server error: ${error.response.status}`;
      } else if (error.request) {
        // Request was made but no response received
        console.log('No response received:', error.request);
        errorMessage = 'Network error: No response from server';
      } else {
        // Something else happened
        console.log('Request setup error:', error.message);
        errorMessage = error.message || 'Unknown error occurred';
      }
      
      set({
        error: errorMessage,
        loading: false,
        courses: [], // Set empty array on error
      });
      
      // Log the final error message
      console.warn('Final error message:', errorMessage);
    }
  },

  // Fetch a single course
  fetchCourse: async (batchId: string, courseId: string, jwt: string) => {
    set({ loading: true, error: null });
    try {
      const response = await axios.get(
        `${baseUrl}/api/instructor/batches/${batchId}/courses/${courseId}`,
        {
          headers: { Authorization: `Bearer ${jwt}` }
        }
      );
      const course = response.data.course;

      set({ selectedCourse: course, loading: false });
      return course;
    } catch (error: any) {
      set({
        error: error?.response?.data?.message || "Failed to fetch course",
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
    jwt: string
  ) => {
    set({ loading: true, error: null });
    try {
      const response = await axios.put(
        `${baseUrl}/api/instructor/batches/${batchId}/courses/${courseId}`,
        updateData,
        {
          headers: { Authorization: `Bearer ${jwt}` }
        }
      );
      const updatedCourse = response.data.course;

      set((state) => ({
        courses: state.courses.map((course) =>
          course.id === courseId ? updatedCourse : course
        ),
        selectedCourse:
          state.selectedCourse?.id === courseId
            ? updatedCourse
            : state.selectedCourse,
        loading: false,
      }));

      return updatedCourse;
    } catch (error: any) {
      set({
        error: error?.response?.data?.message || "Failed to update course",
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
          headers: { Authorization: `Bearer ${jwt}` }
        }
      );

      set((state) => ({
        courses: state.courses.filter((course) => course.id !== courseId),
        selectedCourse:
          state.selectedCourse?.id === courseId ? null : state.selectedCourse,
        loading: false,
      }));
    } catch (error: any) {
      set({
        error: error?.response?.data?.message || "Failed to delete course",
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
    jwt: string
  ) => {
    set({ loading: true, error: null });
    try {
      const response = await axios.put(
        `${baseUrl}/api/instructor/batches/${batchId}/courses/${courseId}/public`,
        { is_public: isPublic },
        {
          headers: { Authorization: `Bearer ${jwt}` }
        }
      );
      const updatedCourse = response.data.course;

      set((state) => ({
        courses: state.courses.map((course) =>
          course.id === courseId ? updatedCourse : course
        ),
        selectedCourse:
          state.selectedCourse?.id === courseId
            ? updatedCourse
            : state.selectedCourse,
        loading: false,
      }));

      return updatedCourse;
    } catch (error: any) {
      set({
        error:
          error?.response?.data?.message ||
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
    jwt: string
  ) => {
    set({ loading: true, error: null });
    try {
      await axios.post(
        `${baseUrl}/api/instructor/batches/${batchId}/courses/${courseId}/assign-student`,
        assignData,
        {
          headers: { Authorization: `Bearer ${jwt}` }
        }
      );
      set({ loading: false });
    } catch (error: any) {
      set({
        error:
          error?.response?.data?.message ||
          "Failed to assign course to student",
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
