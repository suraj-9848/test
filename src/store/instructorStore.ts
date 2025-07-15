import { create } from "zustand";
import { instructorApi } from "../api/instructorApi";

export type CourseStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";
export type ModuleType = "CONTENT" | "QUIZ" | "ASSIGNMENT";
export type QuestionType = "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "TRUE_FALSE";

export interface Course {
  id: number;
  title: string;
  description: string;
  duration: string;
  level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  status: CourseStatus;
  thumbnail: string;
  instructor: string;
  enrolled: number;
  createdAt: string;
  updatedAt: string;
}

export interface Module {
  id: number;
  courseId: number;
  title: string;
  description: string;
  type: ModuleType;
  order: number;
  content?: string;
  videoUrl?: string;
  duration?: string;
  isPublished: boolean;
  createdAt: string;
}

export interface Question {
  id: number;
  moduleId: number;
  question: string;
  type: QuestionType;
  options: string[];
  correctAnswers: number[];
  explanation?: string;
  points: number;
}

export interface Test {
  id: number;
  courseId: number;
  title: string;
  description: string;
  duration: number; // in minutes
  totalMarks: number;
  passingMarks: number;
  questions: Question[];
  isPublished: boolean;
  createdAt: string;
}

interface InstructorStoreState {
  courses: Course[];
  modules: Module[];
  tests: Test[];
  questions: Question[];
  isLoading: boolean;
  error: string | null;

  // Filters
  courseSearch: string;
  statusFilter: CourseStatus | "ALL";
  levelFilter: "ALL" | "BEGINNER" | "INTERMEDIATE" | "ADVANCED";

  // Actions
  setCourseSearch: (search: string) => void;
  setStatusFilter: (status: CourseStatus | "ALL") => void;
  setLevelFilter: (
    level: "ALL" | "BEGINNER" | "INTERMEDIATE" | "ADVANCED"
  ) => void;
  fetchCourses: () => void;

  // Course CRUD
  addCourse: (course: Omit<Course, "id" | "createdAt" | "updatedAt">) => void;
  updateCourse: (id: number, course: Partial<Course>) => void;
  deleteCourse: (id: number) => void;

  // Module CRUD
  addModule: (module: Omit<Module, "id" | "createdAt">) => void;
  updateModule: (id: number, module: Partial<Module>) => void;
  deleteModule: (id: number) => void;

  // Test CRUD
  addTest: (test: Omit<Test, "id" | "createdAt">) => void;
  updateTest: (id: number, test: Partial<Test>) => void;
  deleteTest: (id: number) => void;

  // Question CRUD
  addQuestion: (question: Omit<Question, "id">) => void;
  updateQuestion: (id: number, question: Partial<Question>) => void;
  deleteQuestion: (id: number) => void;
}

export const useInstructorStore = create<InstructorStoreState>((set, get) => ({
  courses: [],
  modules: [],
  tests: [],
  questions: [],

  courseSearch: "",
  statusFilter: "ALL",
  levelFilter: "ALL",
  isLoading: false,
  error: null,

  setCourseSearch: (search) => set({ courseSearch: search }),
  setStatusFilter: (status) => set({ statusFilter: status }),
  setLevelFilter: (level) => set({ levelFilter: level }),
  fetchCourses: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await instructorApi.getCourses();
      const backendCourses = response.courses || [];

      // Get total students count
      let totalStudents = 0;
      try {
        const studentsResponse = await instructorApi.getStudents();
        totalStudents = (studentsResponse.users || []).length;
      } catch (err) {
        console.warn("Failed to get students count:", err);
      }

      // Transform backend course data to match the store interface
      const transformedCourses: Course[] = backendCourses.map(
        (course, index) => {
          // Distribute students roughly equally across courses for display purposes
          const estimatedEnrollment =
            backendCourses.length > 0
              ? Math.floor(totalStudents / backendCourses.length) +
                (index < totalStudents % backendCourses.length ? 1 : 0)
              : 0;

          return {
            id: parseInt(course.id) || index + 1,
            title: course.title,
            description: course.description || "No description available",
            duration: "8 weeks", // Default since backend doesn't have duration
            level: "BEGINNER" as const, // Default level
            status: "PUBLISHED" as CourseStatus, // Default status
            thumbnail: "/course-placeholder.jpg",
            instructor: "Instructor", // Default since backend doesn't have instructor name
            enrolled: estimatedEnrollment,
            createdAt: new Date().toISOString().split("T")[0],
            updatedAt: new Date().toISOString().split("T")[0],
          };
        }
      );

      set({
        courses: transformedCourses,
        isLoading: false,
      });
    } catch (error) {
      console.error("Failed to fetch courses:", error);
      set({
        error:
          error instanceof Error ? error.message : "Failed to fetch courses",
        isLoading: false,
      });
    }
  },

  addCourse: (course) =>
    set((state) => ({
      courses: [
        ...state.courses,
        {
          ...course,
          id: Date.now(),
          createdAt: new Date().toISOString().split("T")[0],
          updatedAt: new Date().toISOString().split("T")[0],
        },
      ],
    })),

  updateCourse: async (id, course) => {
    set(() => ({ isLoading: true, error: null }));
    try {
      const currentState = get();
      const targetCourse = currentState.courses.find(
        (c: Course) => c.id === id
      );
      if (!targetCourse) throw new Error("Course not found");
      const batchId = (targetCourse as { batchId?: string }).batchId;
      if (!batchId) throw new Error("Batch ID not found for course");
      const { id, ...coursePayload } = course;
      console.log("Calling updateCourse API", { batchId, id, coursePayload });
      await instructorApi.updateCourse(batchId, String(id), coursePayload);
      set(() => ({
        courses: currentState.courses.map((c: Course) =>
          c.id === id
            ? {
                ...c,
                ...course,
                updatedAt: new Date().toISOString().split("T")[0],
              }
            : c
        ),
        isLoading: false,
        error: null,
      }));
    } catch (err: unknown) {
      set(() => ({ isLoading: false, error: (err as Error).message }));
    }
  },

  deleteCourse: async (id) => {
    set(() => ({ isLoading: true, error: null }));
    try {
      const currentState = get();
      const targetCourse = currentState.courses.find(
        (c: Course) => c.id === id
      );
      if (!targetCourse) throw new Error("Course not found");
      const batchId = (targetCourse as { batchId?: string }).batchId;
      if (!batchId) throw new Error("Batch ID not found for course");
      console.log("Calling deleteCourse API", { batchId, id });
      await instructorApi.deleteCourse(batchId, String(id));
      set(() => ({
        courses: currentState.courses.filter((c: Course) => c.id !== id),
        modules: currentState.modules.filter((m) => m.courseId !== id),
        tests: currentState.tests.filter((t) => t.courseId !== id),
        isLoading: false,
        error: null,
      }));
    } catch (err: unknown) {
      set(() => ({ isLoading: false, error: (err as Error).message }));
    }
  },

  addModule: (module) =>
    set((state) => ({
      modules: [
        ...state.modules,
        {
          ...module,
          id: Date.now(),
          createdAt: new Date().toISOString().split("T")[0],
        },
      ],
    })),

  updateModule: (id, module) =>
    set((state) => ({
      modules: state.modules.map((m) =>
        m.id === id ? { ...m, ...module } : m
      ),
    })),

  deleteModule: (id) =>
    set((state) => ({
      modules: state.modules.filter((m) => m.id !== id),
      questions: state.questions.filter((q) => q.moduleId !== id),
    })),

  addTest: (test) =>
    set((state) => ({
      tests: [
        ...state.tests,
        {
          ...test,
          id: Date.now(),
          createdAt: new Date().toISOString().split("T")[0],
        },
      ],
    })),

  updateTest: (id, test) =>
    set((state) => ({
      tests: state.tests.map((t) => (t.id === id ? { ...t, ...test } : t)),
    })),

  deleteTest: (id) =>
    set((state) => ({
      tests: state.tests.filter((t) => t.id !== id),
    })),

  addQuestion: (question) =>
    set((state) => ({
      questions: [...state.questions, { ...question, id: Date.now() }],
    })),

  updateQuestion: (id, question) =>
    set((state) => ({
      questions: state.questions.map((q) =>
        q.id === id ? { ...q, ...question } : q
      ),
    })),

  deleteQuestion: (id) =>
    set((state) => ({
      questions: state.questions.filter((q) => q.id !== id),
    })),
}));
