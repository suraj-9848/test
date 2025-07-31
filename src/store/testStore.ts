import { create } from "zustand";
import { instructorApi, Test, Question } from "../api/instructorApi";

// Simple stub types for missing interfaces
interface TestStatistics {
  totalTests: number;
  publishedTests: number;
  draftTests: number;
  totalQuestions: number;
}

interface StudentTestAnalytics {
  averageScore: number;
  completionRate: number;
  passRate: number;
}

interface CreateTestRequest {
  title: string;
  description: string;
  courseId: string;
  batchId: string;
}

interface CreateQuestionRequest {
  testId: string;
  question_text: string;
  type: "MCQ" | "DESCRIPTIVE" | "CODE";
  marks: number;
  options?: { text: string; correct: boolean }[];
}

interface TestState {
  tests: Test[];
  questions: Question[];
  statistics: TestStatistics;
  analytics: StudentTestAnalytics;
  loading: boolean;
  error: string | null;

  // Actions
  fetchTests: (batchId: string, courseId: string) => Promise<void>;
  createTest: (testData: CreateTestRequest) => Promise<void>;
  updateTest: (testId: string, testData: Partial<Test>) => Promise<void>;
  deleteTest: (testId: string) => Promise<void>;
  publishTest: (testId: string) => Promise<void>;

  fetchQuestions: (testId: string) => Promise<void>;
  createQuestion: (questionData: CreateQuestionRequest) => Promise<void>;
  updateQuestion: (
    questionId: string,
    questionData: Partial<Question>,
  ) => Promise<void>;
  deleteQuestion: (questionId: string) => Promise<void>;

  fetchStatistics: (batchId: string, courseId: string) => Promise<void>;
  fetchAnalytics: (testId: string) => Promise<void>;

  clearError: () => void;
  reset: () => void;
}

const initialState = {
  tests: [],
  questions: [],
  statistics: {
    totalTests: 0,
    publishedTests: 0,
    draftTests: 0,
    totalQuestions: 0,
  },
  analytics: {
    averageScore: 0,
    completionRate: 0,
    passRate: 0,
  },
  loading: false,
  error: null,
};

export const useTestStore = create<TestState>((set, get) => ({
  ...initialState,

  fetchTests: async (batchId: string, courseId: string) => {
    set({ loading: true, error: null });
    try {
      // Mock implementation - replace with actual API when available
      console.log("Fetching tests for batch:", batchId, "course:", courseId);
      set({
        tests: [], // Mock empty tests
        loading: false,
      });
    } catch (error: any) {
      set({
        error: error.message || "Failed to fetch tests",
        loading: false,
      });
    }
  },

  createTest: async (testData: CreateTestRequest) => {
    set({ loading: true, error: null });
    try {
      // Mock implementation - replace with actual API when available
      console.log("Creating test:", testData);
      set({
        loading: false,
      });
    } catch (error: any) {
      set({
        error: error.message || "Failed to create test",
        loading: false,
      });
    }
  },

  updateTest: async (testId: string, testData: Partial<Test>) => {
    set({ loading: true, error: null });
    try {
      // Mock implementation - replace with actual API when available
      console.log("Updating test:", testId, testData);
      set({
        loading: false,
      });
    } catch (error: any) {
      set({
        error: error.message || "Failed to update test",
        loading: false,
      });
    }
  },

  deleteTest: async (testId: string) => {
    set({ loading: true, error: null });
    try {
      // Mock implementation - replace with actual API when available
      console.log("Deleting test:", testId);
      set({
        tests: get().tests.filter((test) => test.id !== testId),
        loading: false,
      });
    } catch (error: any) {
      set({
        error: error.message || "Failed to delete test",
        loading: false,
      });
    }
  },

  publishTest: async (testId: string) => {
    set({ loading: true, error: null });
    try {
      // Mock implementation - replace with actual API when available
      console.log("Publishing test:", testId);
      set({
        loading: false,
      });
    } catch (error: any) {
      set({
        error: error.message || "Failed to publish test",
        loading: false,
      });
    }
  },

  fetchQuestions: async (testId: string) => {
    set({ loading: true, error: null });
    try {
      // Mock implementation - replace with actual API when available
      console.log("Fetching questions for test:", testId);
      set({
        questions: [], // Mock empty questions
        loading: false,
      });
    } catch (error: any) {
      set({
        error: error.message || "Failed to fetch questions",
        loading: false,
      });
    }
  },

  createQuestion: async (questionData: CreateQuestionRequest) => {
    set({ loading: true, error: null });
    try {
      // Mock implementation - replace with actual API when available
      console.log("Creating question:", questionData);
      set({
        loading: false,
      });
    } catch (error: any) {
      set({
        error: error.message || "Failed to create question",
        loading: false,
      });
    }
  },

  updateQuestion: async (
    questionId: string,
    questionData: Partial<Question>,
  ) => {
    set({ loading: true, error: null });
    try {
      // Mock implementation - replace with actual API when available
      console.log("Updating question:", questionId, questionData);
      set({
        loading: false,
      });
    } catch (error: any) {
      set({
        error: error.message || "Failed to update question",
        loading: false,
      });
    }
  },

  deleteQuestion: async (questionId: string) => {
    set({ loading: true, error: null });
    try {
      // Mock implementation - replace with actual API when available
      console.log("Deleting question:", questionId);
      set({
        questions: get().questions.filter((q) => q.id !== questionId),
        loading: false,
      });
    } catch (error: any) {
      set({
        error: error.message || "Failed to delete question",
        loading: false,
      });
    }
  },

  fetchStatistics: async (batchId: string, courseId: string) => {
    set({ loading: true, error: null });
    try {
      // Mock implementation - replace with actual API when available
      console.log(
        "Fetching statistics for batch:",
        batchId,
        "course:",
        courseId,
      );
      set({
        statistics: {
          totalTests: 5,
          publishedTests: 3,
          draftTests: 2,
          totalQuestions: 25,
        },
        loading: false,
      });
    } catch (error: any) {
      set({
        error: error.message || "Failed to fetch statistics",
        loading: false,
      });
    }
  },

  fetchAnalytics: async (testId: string) => {
    set({ loading: true, error: null });
    try {
      // Mock implementation - replace with actual API when available
      console.log("Fetching analytics for test:", testId);
      set({
        analytics: {
          averageScore: 78.5,
          completionRate: 85.2,
          passRate: 72.1,
        },
        loading: false,
      });
    } catch (error: any) {
      set({
        error: error.message || "Failed to fetch analytics",
        loading: false,
      });
    }
  },

  clearError: () => set({ error: null }),
  reset: () => set(initialState),
}));

export default useTestStore;
