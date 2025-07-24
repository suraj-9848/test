import { create } from "zustand";
import {
  instructorApi,
  Test,
  Question,
  TestStatistics,
  StudentTestAnalytics,
  CreateTestRequest,
  CreateQuestionRequest,
} from "../api/instructorApi";

export interface TestState {
  tests: Test[];
  selectedTest: Test | null;
  questions: Question[];
  statistics: TestStatistics | null;
  analytics: StudentTestAnalytics | null;
  isLoading: boolean;
  error: string | null;
}

export interface TestActions {
  // Test Management
  fetchTests: () => Promise<void>;
  fetchTestsByCourse: (courseId: string, batchId?: string) => Promise<void>;
  createTest: (
    courseId: string,
    testData: CreateTestRequest,
    batchId?: string
  ) => Promise<void>;
  updateTest: (
    courseId: string,
    testId: string,
    testData: Partial<CreateTestRequest>,
    batchId?: string
  ) => Promise<void>;
  deleteTest: (
    courseId: string,
    testId: string,
    batchId?: string
  ) => Promise<void>;
  publishTest: (
    testId: string,
    courseId: string,
    batchId?: string
  ) => Promise<void>;

  // Test Selection
  setSelectedTest: (test: Test | null) => void;

  // Question Management
  fetchQuestions: (
    courseId: string,
    testId: string,
    batchId?: string
  ) => Promise<void>;
  addQuestion: (
    testId: string,
    questionData: CreateQuestionRequest
  ) => Promise<void>;
  updateQuestion: (
    courseId: string,
    testId: string,
    questionId: string,
    questionData: Partial<CreateQuestionRequest>,
    batchId?: string
  ) => Promise<void>;
  deleteQuestion: (
    courseId: string,
    testId: string,
    questionId: string,
    batchId?: string
  ) => Promise<void>;

  // Analytics
  fetchTestStatistics: (testId: string) => Promise<void>;
  fetchTestAnalytics: (testId: string) => Promise<void>;

  // Utility
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useTestStore = create<TestState & TestActions>((set, get) => ({
  // Initial state
  tests: [],
  selectedTest: null,
  questions: [],
  statistics: null,
  analytics: null,
  isLoading: false,
  error: null,

  // Test Management Actions
  fetchTests: async () => {
    set({ isLoading: true, error: null });
    try {
      // This would fetch tests from all courses
      // For now, we'll use an empty array
      set({ tests: [], isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to fetch tests",
        isLoading: false,
      });
    }
  },

  fetchTestsByCourse: async (courseId: string, batchId?: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await instructorApi.getTestsByCourse(courseId, batchId);
      const currentTests = get().tests;
      // Merge tests from this course with existing tests from other courses
      const otherTests = currentTests.filter(
        (test) => test.course.id !== courseId
      );
      const allTests = [
        ...otherTests,
        ...(Array.isArray(response.tests) ? response.tests : []),
      ];
      set({ tests: allTests, isLoading: false });
    } catch (error) {
      console.warn(`Failed to fetch tests for course ${courseId}:`, error);
      // Don't set error state for 404s, just log them
      if (error instanceof Error && !error.message.includes("404")) {
        set({
          error: error.message,
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }
    }
  },

  createTest: async (
    courseId: string,
    testData: CreateTestRequest,
    batchId?: string
  ) => {
    set({ isLoading: true, error: null });
    try {
      const response = await instructorApi.createTest(
        batchId ?? "",
        courseId,
        testData
      );
      const currentTests = get().tests;
      set({
        tests: [...currentTests, ...(response.tests ?? [])],
        isLoading: false,
        error: null,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to create test",
        isLoading: false,
      });
      throw error;
    }
  },

  updateTest: async (
    courseId: string,
    testId: string,
    testData: Partial<CreateTestRequest>,
    batchId?: string
  ) => {
    set({ isLoading: true, error: null });
    try {
      const response = await instructorApi.updateTest(
        courseId,
        testId,
        testData,
        batchId
      );
      const currentTests = get().tests;
      const updatedTests = currentTests.map((test) =>
        test.id === testId ? response.test : test
      );
      set({
        tests: updatedTests,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to update test",
        isLoading: false,
      });
      throw error;
    }
  },

  deleteTest: async (courseId: string, testId: string, batchId?: string) => {
    set({ isLoading: true, error: null });
    try {
      await instructorApi.deleteTest(courseId, testId, batchId);
      const currentTests = get().tests;
      const filteredTests = currentTests.filter((test) => test.id !== testId);
      set({
        tests: filteredTests,
        selectedTest:
          get().selectedTest?.id === testId ? null : get().selectedTest,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to delete test",
        isLoading: false,
      });
      throw error;
    }
  },

  publishTest: async (testId: string, courseId: string, batchId?: string) => {
    set({ isLoading: true, error: null });
    try {
      await instructorApi.publishTest(testId, courseId, batchId);
      const currentTests = get().tests;
      const updatedTests = currentTests.map((test) =>
        test.id === testId ? { ...test, status: "PUBLISHED" as const } : test
      );
      set({
        tests: updatedTests,
        selectedTest:
          get().selectedTest?.id === testId
            ? { ...get().selectedTest!, status: "PUBLISHED" as const }
            : get().selectedTest,
        isLoading: false,
      });
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Failed to publish test",
        isLoading: false,
      });
      throw error;
    }
  },

  // Test Selection
  setSelectedTest: (test: Test | null) => {
    set({
      selectedTest: test,
      questions: [],
      statistics: null,
      analytics: null,
    });
  },

  // Question Management
  fetchQuestions: async (
    courseId: string,
    testId: string,
    batchId?: string
  ) => {
    set({ isLoading: true, error: null });
    try {
      const response = await instructorApi.getQuestions(
        courseId,
        testId,
        batchId
      );
      set({ questions: response.questions, isLoading: false });
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Failed to fetch questions",
        questions: [],
        isLoading: false,
      });
    }
  },

  addQuestion: async (testId: string, questionData: CreateQuestionRequest) => {
    set({ isLoading: true, error: null });
    try {
      const response = await instructorApi.addQuestion(testId, questionData);
      const currentQuestions = get().questions;
      set({
        questions: [...currentQuestions, response.question],
        isLoading: false,
      });
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Failed to add question",
        isLoading: false,
      });
      throw error;
    }
  },

  updateQuestion: async (
    courseId: string,
    testId: string,
    questionId: string,
    questionData: Partial<CreateQuestionRequest>,
    batchId?: string
  ) => {
    set({ isLoading: true, error: null });
    try {
      const response = await instructorApi.updateQuestion(
        courseId,
        testId,
        questionId,
        questionData,
        batchId
      );
      const currentQuestions = get().questions;
      const updatedQuestions = currentQuestions.map((question) =>
        question.id === questionId ? response.question : question
      );
      set({
        questions: updatedQuestions,
        isLoading: false,
      });
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Failed to update question",
        isLoading: false,
      });
      throw error;
    }
  },

  deleteQuestion: async (
    courseId: string,
    testId: string,
    questionId: string,
    batchId?: string
  ) => {
    set({ isLoading: true, error: null });
    try {
      await instructorApi.deleteQuestion(courseId, testId, questionId, batchId);
      const currentQuestions = get().questions;
      const filteredQuestions = currentQuestions.filter(
        (question) => question.id !== questionId
      );
      set({
        questions: filteredQuestions,
        isLoading: false,
      });
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Failed to delete question",
        isLoading: false,
      });
      throw error;
    }
  },

  // Analytics
  fetchTestStatistics: async (testId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await instructorApi.getTestStatistics(testId);
      set({ statistics: response.statistics, isLoading: false });
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch test statistics",
        statistics: null,
        isLoading: false,
      });
    }
  },

  fetchTestAnalytics: async (testId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await instructorApi.getTestAnalytics(testId);
      set({ analytics: response, isLoading: false });
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch test analytics",
        analytics: null,
        isLoading: false,
      });
    }
  },

  // Utility
  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },

  setError: (error: string | null) => {
    set({ error });
  },

  clearError: () => {
    set({ error: null });
  },
}));
