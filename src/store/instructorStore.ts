import { create } from "zustand";

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

export const useInstructorStore = create<InstructorStoreState>((set) => ({
  courses: [
    {
      id: 1,
      title: "Introduction to React",
      description:
        "Learn the fundamentals of React.js and build modern web applications.",
      duration: "8 weeks",
      level: "BEGINNER",
      status: "PUBLISHED",
      thumbnail: "/course-react.jpg",
      instructor: "Prof. Amit Sharma",
      enrolled: 156,
      createdAt: "2024-01-15",
      updatedAt: "2024-01-20",
    },
    {
      id: 2,
      title: "Advanced JavaScript Concepts",
      description:
        "Deep dive into advanced JavaScript topics and ES6+ features.",
      duration: "6 weeks",
      level: "ADVANCED",
      status: "DRAFT",
      thumbnail: "/course-js.jpg",
      instructor: "Prof. Amit Sharma",
      enrolled: 89,
      createdAt: "2024-02-01",
      updatedAt: "2024-02-05",
    },
  ],
  modules: [
    {
      id: 1,
      courseId: 1,
      title: "Getting Started with React",
      description: "Introduction to React components and JSX",
      type: "CONTENT",
      order: 1,
      content: "React is a JavaScript library...",
      videoUrl: "https://example.com/video1",
      duration: "45 minutes",
      isPublished: true,
      createdAt: "2024-01-16",
    },
    {
      id: 2,
      courseId: 1,
      title: "React Basics Quiz",
      description: "Test your knowledge of React basics",
      type: "QUIZ",
      order: 2,
      duration: "15 minutes",
      isPublished: true,
      createdAt: "2024-01-17",
    },
  ],
  tests: [
    {
      id: 1,
      courseId: 1,
      title: "React Fundamentals Test",
      description: "Comprehensive test covering React basics",
      duration: 60,
      totalMarks: 100,
      passingMarks: 70,
      questions: [],
      isPublished: true,
      createdAt: "2024-01-18",
    },
  ],
  questions: [
    {
      id: 1,
      moduleId: 2,
      question: "What is JSX?",
      type: "SINGLE_CHOICE",
      options: [
        "JavaScript XML",
        "JavaScript eXtended",
        "Java Syntax Extension",
        "JavaScript eXecution",
      ],
      correctAnswers: [0],
      explanation:
        "JSX stands for JavaScript XML and allows you to write HTML-like syntax in JavaScript.",
      points: 10,
    },
  ],

  courseSearch: "",
  statusFilter: "ALL",
  levelFilter: "ALL",
  isLoading: false,
  error: null,

  setCourseSearch: (search) => set({ courseSearch: search }),
  setStatusFilter: (status) => set({ statusFilter: status }),
  setLevelFilter: (level) => set({ levelFilter: level }),
  fetchCourses: () => {
    // Mock implementation - in a real app this would fetch from an API
    set({ isLoading: true, error: null });
    // Simulate API call
    setTimeout(() => {
      set({ isLoading: false });
    }, 1000);
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

  updateCourse: (id, course) =>
    set((state) => ({
      courses: state.courses.map((c) =>
        c.id === id
          ? {
              ...c,
              ...course,
              updatedAt: new Date().toISOString().split("T")[0],
            }
          : c
      ),
    })),

  deleteCourse: (id) =>
    set((state) => ({
      courses: state.courses.filter((c) => c.id !== id),
      modules: state.modules.filter((m) => m.courseId !== id),
      tests: state.tests.filter((t) => t.courseId !== id),
    })),

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
