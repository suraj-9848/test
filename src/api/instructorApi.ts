import apiClient from "../utils/axiosInterceptor";
import { API_ENDPOINTS } from "../config/urls";
import { getAuthHeaders } from "@/utils/auth";

const parseErrorResponse = async (response: Response): Promise<string> => {
  try {
    const errorData = await response.json();
    return errorData.message || errorData.error || "An error occurred";
  } catch {
    return "An error occurred";
  }
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_BASE_URL || "http://localhost:3000";


const safeApiCall = async (url: string, options: RequestInit = {}) => {
  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      const errorMessage = await parseErrorResponse(response);
      throw new Error(errorMessage);
    }

    return await response.json();
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Network request failed");
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

export interface StudentProgressData {
  studentId: string;
  username: string;
}

export interface Student {
  id: string;
  name: string;
  email: string;
  username: string;
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
  createCourse: async (
    courseData: CreateCourseData
  ): Promise<CourseResponse> => {
    try {
      console.log("=== INSTRUCTOR API DEBUG ===");
      console.log("Course Data:", JSON.stringify(courseData, null, 2));

      // Validation for private courses requiring batches
      if (
        !courseData.is_public &&
        (!courseData.batch_ids || courseData.batch_ids.length === 0)
      ) {
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
        batch_ids: courseData.is_public ? [] : courseData.batch_ids || [],
      };

      console.log("Request Body:", JSON.stringify(requestBody, null, 2));

      const response = await apiClient.post(
        API_ENDPOINTS.INSTRUCTOR.COURSES,
        requestBody
      );

      console.log("✅ Course created successfully:", response.data);
      return response.data;
    } catch (error: any) {
      console.error("❌ Course creation failed:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to create course";
      throw new Error(errorMessage);
    }
  },
  assignCoursesToStudents: async (
    courseIds: string[],
    studentIds: string[]
  ): Promise<{
    message: string;
    details?: { successful: number; failed: number; skipped: number };
  }> => {
    const headers = await getAuthHeaders();

    // Since the backend only supports single course-student assignments,
    // we need to make multiple calls
    const assignments = [];
    for (const courseId of courseIds) {
      for (const studentId of studentIds) {
        assignments.push({ courseId, studentId });
      }
    }

    const results = await Promise.allSettled(
      assignments.map(async ({ courseId, studentId }) => {
        // We need a batch ID - use the first batch from the courses
        // Get the batch ID from the first available batch
        const batchesResponse = await fetch(
          `${API_BASE_URL}/api/instructor/batches`,
          {
            method: "GET",
            headers,
          }
        );

        if (!batchesResponse.ok) {
          throw new Error("Failed to fetch batches");
        }

        const batchesData = await batchesResponse.json();
        const batches = batchesData.batches || [];

        if (batches.length === 0) {
          throw new Error("No batches available");
        }

        const batchId = batches[0].id;

        const response = await fetch(
          `${API_BASE_URL}/api/instructor/batches/${batchId}/courses/${courseId}/assign-student`,
          {
            method: "POST",
            headers,
            body: JSON.stringify({ userId: studentId, courseId }),
          }
        );

        if (!response.ok) {
          const errorMessage = await parseErrorResponse(response);

          // If it's already assigned, we'll treat it as a warning, not an error
          if (errorMessage.includes("already assigned")) {
            return {
              skipped: true,
              courseId,
              studentId,
              message: errorMessage,
            };
          }

          throw new Error(
            `${errorMessage} (Course: ${courseId}, Student: ${studentId})`
          );
        }

        return { success: true, courseId, studentId };
      })
    );

    const successful = results.filter(
      (result) => result.status === "fulfilled" && result.value.success
    ).length;
    const skipped = results.filter(
      (result) => result.status === "fulfilled" && result.value.skipped
    ).length;
    const failures = results.filter((result) => result.status === "rejected");

    let message = `Assignment completed: ${successful} successful`;
    if (skipped > 0) {
      message += `, ${skipped} already assigned`;
    }
    if (failures.length > 0) {
      message += `, ${failures.length} failed`;
    }

    if (failures.length > 0) {
      console.error("Some assignments failed:", failures);

      // Get detailed error messages
      const errorMessages = failures.map((failure, index) => {
        const reason =
          failure.reason instanceof Error
            ? failure.reason.message
            : String(failure.reason);
        return `Assignment ${index + 1}: ${reason}`;
      });

      // If we have some successes, don't throw an error, just warn
      if (successful > 0 || skipped > 0) {
        console.warn("Partial assignment failure:", errorMessages);
        return {
          message: `${message}. Some assignments failed: ${errorMessages.join(
            "; "
          )}`,
          details: { successful, failed: failures.length, skipped },
        };
      } else {
        throw new Error(`All assignments failed:\n${errorMessages.join("\n")}`);
      }
    }

    return {
      message: `Successfully assigned ${courseIds.length} course(s) to ${studentIds.length} student(s)`,
      details: { successful, failed: 0, skipped },
    };
  },


  getCourses: async (): Promise<{ courses: Course[] }> => {
    try {
      const headers = await getAuthHeaders();
      const result = await safeApiCall(
        `${API_BASE_URL}/api/instructor/courses`,
        {
          method: "GET",
          headers,
        }
      );

      return { courses: result.courses || [] };
    } catch (err) {
      console.error("Error fetching courses:", err);
      return { courses: [] };
    }
  },

  getCourseById: async (id: string): Promise<Course> => {
    try {
      const response = await apiClient.get(
        API_ENDPOINTS.INSTRUCTOR.COURSE_BY_ID(id)
      );
      return response.data.course || response.data;
    } catch (error: any) {
      console.error("Failed to fetch course:", error);
      throw new Error(
        error.response?.data?.message || "Failed to fetch course"
      );
    }
  },

  getStudents: async (): Promise<{ users: Student[] }> => {
    try {
      const headers = await getAuthHeaders();

      // Get all batches first
      const batchesResponse = await fetch(
        `${API_BASE_URL}/api/instructor/batches`,
        {
          method: "GET",
          headers,
        }
      );

      if (!batchesResponse.ok) {
        throw new Error("Failed to fetch batches");
      }

      const batchesData = await batchesResponse.json();
      const batches = batchesData.batches || [];

      // Get students from all batch/course combinations using progress endpoint
      const allStudents = new Map<string, Student>(); // Use Map to avoid duplicates

      for (const batch of batches) {
        try {
          // Get courses for this batch
          const coursesResponse = await fetch(
            `${API_BASE_URL}/api/instructor/batches/${batch.id}/courses`,
            {
              method: "GET",
              headers,
            }
          );

          if (!coursesResponse.ok) continue;

          const coursesData = await coursesResponse.json();
          const courses = coursesData.courses || [];

          // Get students from each course's progress
          for (const course of courses) {
            try {
              const progressResponse = await fetch(
                `${API_BASE_URL}/api/instructor/batches/${batch.id}/courses/${course.id}/progress`,
                {
                  method: "GET",
                  headers,
                }
              );

              if (!progressResponse.ok) continue;

              const progressData = await progressResponse.json();
              const students = progressData.report || [];

              // Add unique students to our collection
              students.forEach((student: StudentProgressData) => {
                if (student.studentId && !allStudents.has(student.studentId)) {
                  allStudents.set(student.studentId, {
                    id: student.studentId,
                    name: student.username || `Student ${student.studentId}`,
                    email: "", // No email needed for course assignment
                    username: student.username || student.studentId,
                  });
                }
              });
            } catch (err) {
              console.warn(
                `Failed to fetch progress for course ${course.id}:`,
                err
              );
            }
          }
        } catch (err) {
          console.warn(`Failed to fetch courses for batch ${batch.id}:`, err);
        }
      }

      // Convert Map to array
      const uniqueStudents = Array.from(allStudents.values());

      return { users: uniqueStudents };
    } catch (error) {
      console.error("Error fetching students:", error);
      return { users: [] };
    }
  },

  updateCourse: async (
    id: string,
    courseData: Partial<CreateCourseData>
  ): Promise<CourseResponse> => {
    try {
      const response = await apiClient.put(
        API_ENDPOINTS.INSTRUCTOR.COURSE_BY_ID(id),
        courseData
      );
      return response.data;
    } catch (error: any) {
      console.error("Failed to update course:", error);
      throw new Error(
        error.response?.data?.message || "Failed to update course"
      );
    }
  },

  deleteCourse: async (id: string): Promise<void> => {
    try {
      await apiClient.delete(API_ENDPOINTS.INSTRUCTOR.COURSE_BY_ID(id));
    } catch (error: any) {
      console.error("Failed to delete course:", error);
      throw new Error(
        error.response?.data?.message || "Failed to delete course"
      );
    }
  },

  // Batch Management
  getBatches: async (page = 1, limit = 10): Promise<BatchResponse> => {
    try {
      const response = await apiClient.get(
        `${API_ENDPOINTS.INSTRUCTOR.BATCHES}?page=${page}&limit=${limit}`
      );
      return response.data;
    } catch (error: any) {
      console.error("Failed to fetch batches:", error);
      throw new Error(
        error.response?.data?.message || "Failed to fetch batches"
      );
    }
  },

  getBatchById: async (id: string): Promise<Batch> => {
    try {
      const response = await apiClient.get(
        API_ENDPOINTS.INSTRUCTOR.BATCH_BY_ID(id)
      );
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

  createTest: async (
    courseId: string,
    testData: CreateTestRequest
  ): Promise<Test> => {
    try {
      const response = await apiClient.post(
        `${API_ENDPOINTS.INSTRUCTOR.TESTS}?courseId=${courseId}`,
        testData
      );
      return response.data.test || response.data;
    } catch (error: any) {
      console.error("Failed to create test:", error);
      throw new Error(error.response?.data?.message || "Failed to create test");
    }
  },

  getTestById: async (id: string): Promise<Test> => {
    try {
      const response = await apiClient.get(
        API_ENDPOINTS.INSTRUCTOR.TEST_BY_ID(id)
      );
      return response.data.test || response.data;
    } catch (error: any) {
      console.error("Failed to fetch test:", error);
      throw new Error(error.response?.data?.message || "Failed to fetch test");
    }
  },

  updateTest: async (
    id: string,
    testData: Partial<CreateTestRequest>
  ): Promise<Test> => {
    try {
      const response = await apiClient.put(
        API_ENDPOINTS.INSTRUCTOR.TEST_BY_ID(id),
        testData
      );
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
  addQuestionToTest: async (
    testId: string,
    questionData: CreateQuestionRequest
  ): Promise<Question> => {
    try {
      const response = await apiClient.post(
        `${API_ENDPOINTS.INSTRUCTOR.TEST_BY_ID(testId)}/questions`,
        questionData
      );
      return response.data.question || response.data;
    } catch (error: any) {
      console.error("Failed to add question:", error);
      throw new Error(
        error.response?.data?.message || "Failed to add question"
      );
    }
  },

  updateQuestion: async (
    testId: string,
    questionId: string,
    questionData: Partial<CreateQuestionRequest>
  ): Promise<Question> => {
    try {
      const response = await apiClient.put(
        `${API_ENDPOINTS.INSTRUCTOR.TEST_BY_ID(
          testId
        )}/questions/${questionId}`,
        questionData
      );
      return response.data.question || response.data;
    } catch (error: any) {
      console.error("Failed to update question:", error);
      throw new Error(
        error.response?.data?.message || "Failed to update question"
      );
    }
  },

  deleteQuestion: async (testId: string, questionId: string): Promise<void> => {
    try {
      await apiClient.delete(
        `${API_ENDPOINTS.INSTRUCTOR.TEST_BY_ID(testId)}/questions/${questionId}`
      );
    } catch (error: any) {
      console.error("Failed to delete question:", error);
      throw new Error(
        error.response?.data?.message || "Failed to delete question"
      );
    }
  },

  // Analytics
  getStudentAnalytics: async (
    batchId?: string,
    courseId?: string
  ): Promise<any> => {
    try {
      const params = new URLSearchParams();
      if (batchId) params.append("batchId", batchId);
      if (courseId) params.append("courseId", courseId);

      const url = params.toString()
        ? `${API_ENDPOINTS.INSTRUCTOR.ANALYTICS.STUDENTS}?${params}`
        : API_ENDPOINTS.INSTRUCTOR.ANALYTICS.STUDENTS;
      const response = await apiClient.get(url);
      return response.data;
    } catch (error: any) {
      console.error("Failed to fetch student analytics:", error);
      throw new Error(
        error.response?.data?.message || "Failed to fetch student analytics"
      );
    }
  },

  getProgressAnalytics: async (
    batchId?: string,
    courseId?: string
  ): Promise<any> => {
    try {
      const params = new URLSearchParams();
      if (batchId) params.append("batchId", batchId);
      if (courseId) params.append("courseId", courseId);

      const url = params.toString()
        ? `${API_ENDPOINTS.INSTRUCTOR.ANALYTICS.PROGRESS}?${params}`
        : API_ENDPOINTS.INSTRUCTOR.ANALYTICS.PROGRESS;
      const response = await apiClient.get(url);
      return response.data;
    } catch (error: any) {
      console.error("Failed to fetch progress analytics:", error);
      throw new Error(
        error.response?.data?.message || "Failed to fetch progress analytics"
      );
    }
  },

  getTestAnalytics: async (testId?: string): Promise<any> => {
    try {
      const url = testId
        ? `${API_ENDPOINTS.INSTRUCTOR.ANALYTICS.TESTS}?testId=${testId}`
        : API_ENDPOINTS.INSTRUCTOR.ANALYTICS.TESTS;
      const response = await apiClient.get(url);
      return response.data;
    } catch (error: any) {
      console.error("Failed to fetch test analytics:", error);
      throw new Error(
        error.response?.data?.message || "Failed to fetch test analytics"
      );
    }
  },

  getBatchAnalytics: async (): Promise<any> => {
    try {
      const response = await apiClient.get(
        API_ENDPOINTS.INSTRUCTOR.ANALYTICS.BATCHES
      );
      return response.data;
    } catch (error: any) {
      console.error("Failed to fetch batch analytics:", error);
      throw new Error(
        error.response?.data?.message || "Failed to fetch batch analytics"
      );
    }
  },

  getEvaluationAnalytics: async (): Promise<any> => {
    try {
      const response = await apiClient.get(
        API_ENDPOINTS.INSTRUCTOR.ANALYTICS.EVALUATION
      );
      return response.data;
    } catch (error: any) {
      console.error("Failed to fetch evaluation analytics:", error);
      throw new Error(
        error.response?.data?.message || "Failed to fetch evaluation analytics"
      );
    }
  },
  safeApiCall: safeApiCall,
  parseErrorResponse: parseErrorResponse,

};
