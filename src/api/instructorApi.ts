import apiClient from "../utils/axiosInterceptor";
import { API_ENDPOINTS } from "../config/urls";

const parseErrorResponse = async (response: Response): Promise<string> => {
  try {
    const errorData = await response.json();
    return errorData.message || errorData.error || "An error occurred";
  } catch {
    return "An error occurred";
  }
};

// Interfaces (keeping existing ones)
export interface Course {
  id: string;
  title: string;
  logo?: string;
  start_date: string;
  end_date: string;
  is_public: boolean;
  instructor_name: string;
  description?: string;
  modules?: any[];
  batch_ids?: string[];
}

export interface Batch {
  id: string;
  name: string;
  description?: string;
  start_date: string;
  end_date: string;
  max_students: number;
  current_students?: number;
  status: "ACTIVE" | "INACTIVE" | "COMPLETED";
  courses?: Course[];
}

export interface CreateCourseData {
  title: string;
  logo?: string;
  start_date: string;
  end_date: string;
  is_public: boolean;
  instructor_name: string;
  description?: string;
  modules?: any[];
  batch_ids?: string[];
}

export interface CourseResponse {
  course: Course;
  message: string;
}

export interface BatchResponse {
  batches: Batch[];
  totalCount: number;
  page: number;
  limit: number;
}

export interface Test {
  id: string;
  title: string;
  description: string;
  maxMarks: number;
  passingMarks: number;
  durationInMinutes: number;
  startDate: string;
  endDate: string;
  shuffleQuestions: boolean;
  showResults: boolean;
  showCorrectAnswers: boolean;
  status: "DRAFT" | "PUBLISHED" | "ACTIVE" | "COMPLETED";
  course: {
    id: string;
    title: string;
  };
  questions?: Question[];
}

export interface Question {
  id: string;
  question_text: string;
  type: "MCQ" | "DESCRIPTIVE" | "CODE";
  marks: number;
  expectedWordCount?: number;
  codeLanguage?: string;
  options?: QuestionOption[];
}

export interface QuestionOption {
  id: string;
  text: string;
  correct: boolean;
}

export interface CreateTestRequest {
  title: string;
  description: string;
  maxMarks: number;
  passingMarks: number;
  durationInMinutes: number;
  startDate: string;
  endDate: string;
  shuffleQuestions?: boolean;
  showResults?: boolean;
  showCorrectAnswers?: boolean;
}

export interface CreateQuestionRequest {
  question_text: string;
  type: "MCQ" | "DESCRIPTIVE" | "CODE";
  marks: number;
  expectedWordCount?: number;
  codeLanguage?: string;
  options?: Array<{
    text: string;
    correct: boolean;
  }>;
}

// API functions using axios interceptor
export const instructorApi = {
  // Course Management
  createCourse: async (courseData: CreateCourseData): Promise<CourseResponse> => {
    try {
      console.log("=== INSTRUCTOR API DEBUG ===");
      console.log("Course Data:", JSON.stringify(courseData, null, 2));

      // Validation for private courses requiring batches
      if (!courseData.is_public && (!courseData.batch_ids || courseData.batch_ids.length === 0)) {
        throw new Error("Private courses require at least one batch selection");
      }

      const requestBody = {
        title: courseData.title,
        logo: courseData.logo || "",
        start_date: courseData.start_date,
        end_date: courseData.end_date,
        is_public: courseData.is_public,
        instructor_name: courseData.instructor_name,
        description: courseData.description || "Course description",
        modules: courseData.modules || [],
        batch_ids: courseData.is_public ? [] : (courseData.batch_ids || []),
      };

      console.log("Request Body:", JSON.stringify(requestBody, null, 2));

      const response = await apiClient.post(API_ENDPOINTS.INSTRUCTOR.COURSES, requestBody);
      
      console.log("✅ Course created successfully:", response.data);
      return response.data;
    } catch (error: any) {
      console.error("❌ Course creation failed:", error);
      const errorMessage = error.response?.data?.message || error.message || "Failed to create course";
      throw new Error(errorMessage);
    }
  },

  getCourses: async (): Promise<Course[]> => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.INSTRUCTOR.COURSES);
      return response.data.courses || response.data;
    } catch (error: any) {
      console.error("Failed to fetch courses:", error);
      throw new Error(error.response?.data?.message || "Failed to fetch courses");
    }
  },

  getCourseById: async (id: string): Promise<Course> => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.INSTRUCTOR.COURSE_BY_ID(id));
      return response.data.course || response.data;
    } catch (error: any) {
      console.error("Failed to fetch course:", error);
      throw new Error(error.response?.data?.message || "Failed to fetch course");
    }
  },

  updateCourse: async (id: string, courseData: Partial<CreateCourseData>): Promise<CourseResponse> => {
    try {
      const response = await apiClient.put(API_ENDPOINTS.INSTRUCTOR.COURSE_BY_ID(id), courseData);
      return response.data;
    } catch (error: any) {
      console.error("Failed to update course:", error);
      throw new Error(error.response?.data?.message || "Failed to update course");
    }
  },

  deleteCourse: async (id: string): Promise<void> => {
    try {
      await apiClient.delete(API_ENDPOINTS.INSTRUCTOR.COURSE_BY_ID(id));
    } catch (error: any) {
      console.error("Failed to delete course:", error);
      throw new Error(error.response?.data?.message || "Failed to delete course");
    }
  },

  // Batch Management
  getBatches: async (page = 1, limit = 10): Promise<BatchResponse> => {
    try {
      const response = await apiClient.get(`${API_ENDPOINTS.INSTRUCTOR.BATCHES}?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error: any) {
      console.error("Failed to fetch batches:", error);
      throw new Error(error.response?.data?.message || "Failed to fetch batches");
    }
  },

  getBatchById: async (id: string): Promise<Batch> => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.INSTRUCTOR.BATCH_BY_ID(id));
      return response.data.batch || response.data;
    } catch (error: any) {
      console.error("Failed to fetch batch:", error);
      throw new Error(error.response?.data?.message || "Failed to fetch batch");
    }
  },

  // Test Management
  getTests: async (): Promise<Test[]> => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.INSTRUCTOR.TESTS);
      return response.data.tests || response.data;
    } catch (error: any) {
      console.error("Failed to fetch tests:", error);
      throw new Error(error.response?.data?.message || "Failed to fetch tests");
    }
  },

  createTest: async (courseId: string, testData: CreateTestRequest): Promise<Test> => {
    try {
      const response = await apiClient.post(`${API_ENDPOINTS.INSTRUCTOR.TESTS}?courseId=${courseId}`, testData);
      return response.data.test || response.data;
    } catch (error: any) {
      console.error("Failed to create test:", error);
      throw new Error(error.response?.data?.message || "Failed to create test");
    }
  },

  getTestById: async (id: string): Promise<Test> => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.INSTRUCTOR.TEST_BY_ID(id));
      return response.data.test || response.data;
    } catch (error: any) {
      console.error("Failed to fetch test:", error);
      throw new Error(error.response?.data?.message || "Failed to fetch test");
    }
  },

  updateTest: async (id: string, testData: Partial<CreateTestRequest>): Promise<Test> => {
    try {
      const response = await apiClient.put(API_ENDPOINTS.INSTRUCTOR.TEST_BY_ID(id), testData);
      return response.data.test || response.data;
    } catch (error: any) {
      console.error("Failed to update test:", error);
      throw new Error(error.response?.data?.message || "Failed to update test");
    }
  },

  deleteTest: async (id: string): Promise<void> => {
    try {
      await apiClient.delete(API_ENDPOINTS.INSTRUCTOR.TEST_BY_ID(id));
    } catch (error: any) {
      console.error("Failed to delete test:", error);
      throw new Error(error.response?.data?.message || "Failed to delete test");
    }
  },

  // Question Management
  addQuestionToTest: async (testId: string, questionData: CreateQuestionRequest): Promise<Question> => {
    try {
      const response = await apiClient.post(`${API_ENDPOINTS.INSTRUCTOR.TEST_BY_ID(testId)}/questions`, questionData);
      return response.data.question || response.data;
    } catch (error: any) {
      console.error("Failed to add question:", error);
      throw new Error(error.response?.data?.message || "Failed to add question");
    }
  },

  updateQuestion: async (testId: string, questionId: string, questionData: Partial<CreateQuestionRequest>): Promise<Question> => {
    try {
      const response = await apiClient.put(`${API_ENDPOINTS.INSTRUCTOR.TEST_BY_ID(testId)}/questions/${questionId}`, questionData);
      return response.data.question || response.data;
    } catch (error: any) {
      console.error("Failed to update question:", error);
      throw new Error(error.response?.data?.message || "Failed to update question");
    }
  },

  deleteQuestion: async (testId: string, questionId: string): Promise<void> => {
    try {
      await apiClient.delete(`${API_ENDPOINTS.INSTRUCTOR.TEST_BY_ID(testId)}/questions/${questionId}`);
    } catch (error: any) {
      console.error("Failed to delete question:", error);
      throw new Error(error.response?.data?.message || "Failed to delete question");
    }
  },

  // Analytics
  getStudentAnalytics: async (batchId?: string, courseId?: string): Promise<any> => {
    try {
      const params = new URLSearchParams();
      if (batchId) params.append('batchId', batchId);
      if (courseId) params.append('courseId', courseId);
      
      const url = params.toString() ? `${API_ENDPOINTS.INSTRUCTOR.ANALYTICS.STUDENTS}?${params}` : API_ENDPOINTS.INSTRUCTOR.ANALYTICS.STUDENTS;
      const response = await apiClient.get(url);
      return response.data;
    } catch (error: any) {
      console.error("Failed to fetch student analytics:", error);
      throw new Error(error.response?.data?.message || "Failed to fetch student analytics");
    }
  },

  getProgressAnalytics: async (batchId?: string, courseId?: string): Promise<any> => {
    try {
      const params = new URLSearchParams();
      if (batchId) params.append('batchId', batchId);
      if (courseId) params.append('courseId', courseId);
      
      const url = params.toString() ? `${API_ENDPOINTS.INSTRUCTOR.ANALYTICS.PROGRESS}?${params}` : API_ENDPOINTS.INSTRUCTOR.ANALYTICS.PROGRESS;
      const response = await apiClient.get(url);
      return response.data;
    } catch (error: any) {
      console.error("Failed to fetch progress analytics:", error);
      throw new Error(error.response?.data?.message || "Failed to fetch progress analytics");
    }
  },

  getTestAnalytics: async (testId?: string): Promise<any> => {
    try {
      const url = testId ? `${API_ENDPOINTS.INSTRUCTOR.ANALYTICS.TESTS}?testId=${testId}` : API_ENDPOINTS.INSTRUCTOR.ANALYTICS.TESTS;
      const response = await apiClient.get(url);
      return response.data;
    } catch (error: any) {
      console.error("Failed to fetch test analytics:", error);
      throw new Error(error.response?.data?.message || "Failed to fetch test analytics");
    }
  },

  getBatchAnalytics: async (): Promise<any> => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.INSTRUCTOR.ANALYTICS.BATCHES);
      return response.data;
    } catch (error: any) {
      console.error("Failed to fetch batch analytics:", error);
      throw new Error(error.response?.data?.message || "Failed to fetch batch analytics");
    }
  },

  getEvaluationAnalytics: async (): Promise<any> => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.INSTRUCTOR.ANALYTICS.EVALUATION);
      return response.data;
    } catch (error: any) {
      console.error("Failed to fetch evaluation analytics:", error);
      throw new Error(error.response?.data?.message || "Failed to fetch evaluation analytics");
    }
  },
};
