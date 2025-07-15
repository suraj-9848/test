import { getSession } from "next-auth/react";
import axios from "axios";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_BASE_URL || "http://localhost:8000";

let cachedBackendJwt: string = "";

const getBackendJwt = async () => {
  if (cachedBackendJwt) return cachedBackendJwt;

  const session = await getSession();
  console.log("Session:", session);

  if (!session) {
    throw new Error("No session found - user not logged in");
  }

  const googleIdToken = (session as { id_token?: string })?.id_token;

  if (!googleIdToken) {
    console.error("Session exists but no Google ID token found:", session);
    throw new Error("No Google ID token found in session");
  }

  try {
    const loginRes = await axios.post(
      `${API_BASE_URL}/api/auth/admin-login`,
      {},
      {
        headers: { Authorization: `Bearer ${googleIdToken}` },
        withCredentials: true,
      }
    );
    cachedBackendJwt = loginRes.data.token;
    return cachedBackendJwt;
  } catch (err) {
    console.error("Failed to authenticate with backend:", err);
    throw new Error("Failed to authenticate with backend");
  }
};

const getAuthHeaders = async () => {
  const jwt = await getBackendJwt();
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${jwt}`,
  };
};

// Test Types
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

export interface TestStatistics {
  testId: string;
  title: string;
  questionCount: number;
  totalMarks: number;
  passingMarks: number;
  totalAttempts: number;
  submittedAttempts: number;
  evaluatedAttempts: number;
  averageScore: number;
  passRate: number;
  highestScore: number;
  lowestScore: number;
}

export interface StudentTestAnalytics {
  testId: string;
  testTitle: string;
  totalStudents: number;
  completedStudents: number;
  pendingStudents: number;
  students: Array<{
    id: string;
    name: string;
    email: string;
    status: "COMPLETED" | "IN_PROGRESS" | "NOT_STARTED";
    score?: number;
    submittedAt?: string;
  }>;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  logo?: string;
  start_date: string;
  end_date: string;
  batch_id: string;
  is_public: boolean;
  instructor_name: string;
  created_at?: string;
  updated_at?: string;
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
  org_id: string;
}

export interface CreateCourseData {
  title: string;
  description?: string;
  logo?: string;
  start_date: string;
  end_date: string;
  batch_ids: string[]; // Changed from batch_id to batch_ids
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

export interface CourseResponse {
  course: Course;
}

export interface StudentProgressData {
  studentId: string;
  username: string;
}

// API functions
export const instructorApi = {
  // User Management
  getCurrentUser: async (): Promise<{
    id: string;
    username: string;
    email: string;
    userRole: string;
  }> => {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to fetch user profile");
    }

    const data = await response.json();
    return data.user;
  },

  getBatches: async (): Promise<{ batches: Batch[] }> => {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/api/instructor/batches`, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to fetch batches");
    }

    return response.json();
  },

  createCourse: async (
    courseData: CreateCourseData
  ): Promise<CourseResponse> => {
    const headers = await getAuthHeaders();
    const requestBody = {
      ...courseData,
    };
    // Debug log the request
    console.log("=== INSTRUCTOR API DEBUG ===");
    console.log("URL:", `${API_BASE_URL}/api/instructor/courses`);
    console.log("Headers:", headers);
    console.log("Body:", JSON.stringify(requestBody, null, 2));
    const response = await fetch(`${API_BASE_URL}/api/instructor/courses`, {
      method: "POST",
      headers,
      body: JSON.stringify(requestBody),
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.error("API Error Response:", response.status, errorText);
      let error;
      try {
        error = JSON.parse(errorText);
      } catch {
        error = { message: errorText || "Failed to create course" };
      }
      throw new Error(error.message || "Failed to create course");
    }
    return response.json();
  },

  // Test Management
  createTest: async (
    courseId: string,
    testData: CreateTestRequest,
    batchId?: string
  ): Promise<{ test: Test }> => {
    const headers = await getAuthHeaders();
    const actualBatchId = batchId || "batch-2024"; // Default to batch-2024 if no batch ID provided
    const response = await fetch(
      `${API_BASE_URL}/api/instructor/batches/${actualBatchId}/courses/${courseId}/tests`,
      {
        method: "POST",
        headers,
        body: JSON.stringify(testData),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to create test");
    }

    return response.json();
  },

  getTestsByCourse: async (
    courseId: string,
    batchId?: string
  ): Promise<{ tests: Test[] }> => {
    const headers = await getAuthHeaders();
    const actualBatchId = batchId || "batch-2024"; // Default to batch-2024 if no batch ID provided
    const response = await fetch(
      `${API_BASE_URL}/api/instructor/batches/${actualBatchId}/courses/${courseId}/tests`,
      {
        method: "GET",
        headers,
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        // Return empty tests array if endpoint doesn't exist
        console.warn(
          `No tests found for course ${courseId} in batch ${actualBatchId}`
        );
        return { tests: [] };
      }
      const error = await response.json();
      throw new Error(error.message || "Failed to fetch tests");
    }

    const data = await response.json();
    return {
      tests: Array.isArray(data.tests)
        ? data.tests
        : Array.isArray(data)
        ? data
        : [],
    };
  },

  getTestById: async (
    testId: string,
    courseId: string,
    batchId?: string
  ): Promise<{ test: Test }> => {
    const headers = await getAuthHeaders();
    const actualBatchId = batchId || "batch-2024"; // Default to batch-2024 if no batch ID provided
    const response = await fetch(
      `${API_BASE_URL}/api/instructor/batches/${actualBatchId}/courses/${courseId}/tests/${testId}`,
      {
        method: "GET",
        headers,
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to fetch test");
    }

    return response.json();
  },

  updateTest: async (
    courseId: string,
    testId: string,
    testData: Partial<CreateTestRequest>,
    batchId?: string
  ): Promise<{ test: Test }> => {
    const headers = await getAuthHeaders();
    const actualBatchId = batchId || "batch-2024"; // Default to batch-2024 if no batch ID provided
    const response = await fetch(
      `${API_BASE_URL}/api/instructor/batches/${actualBatchId}/courses/${courseId}/tests/${testId}`,
      {
        method: "PUT",
        headers,
        body: JSON.stringify(testData),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to update test");
    }

    return response.json();
  },

  publishTest: async (
    testId: string,
    courseId: string,
    batchId?: string
  ): Promise<{ message: string }> => {
    const headers = await getAuthHeaders();
    const actualBatchId = batchId || "batch-2024"; // Default to batch-2024 if no batch ID provided
    const response = await fetch(
      `${API_BASE_URL}/api/instructor/batches/${actualBatchId}/courses/${courseId}/tests/${testId}/publish`,
      {
        method: "PATCH",
        headers,
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to publish test");
    }

    return response.json();
  },

  deleteTest: async (
    courseId: string,
    testId: string,
    batchId?: string
  ): Promise<{ message: string }> => {
    const headers = await getAuthHeaders();
    const actualBatchId = batchId || "batch-2024"; // Default to batch-2024 if no batch ID provided
    const response = await fetch(
      `${API_BASE_URL}/api/instructor/batches/${actualBatchId}/courses/${courseId}/tests/${testId}`,
      {
        method: "DELETE",
        headers,
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to delete test");
    }

    return response.json();
  },

  // Question Management
  addQuestion: async (
    testId: string,
    questionData: CreateQuestionRequest
  ): Promise<{ question: Question }> => {
    const headers = await getAuthHeaders();
    const response = await fetch(
      `${API_BASE_URL}/api/instructor/tests/${testId}/questions`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({ questions: [questionData] }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to add question");
    }

    return response.json();
  },

  getQuestions: async (
    courseId: string,
    testId: string,
    batchId?: string
  ): Promise<{ questions: Question[] }> => {
    const headers = await getAuthHeaders();
    const actualBatchId = batchId || "batch-2024"; // Default to batch-2024 if no batch ID provided
    const response = await fetch(
      `${API_BASE_URL}/api/instructor/batches/${actualBatchId}/courses/${courseId}/tests/${testId}/questions`,
      {
        method: "GET",
        headers,
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to fetch questions");
    }

    return response.json();
  },

  updateQuestion: async (
    courseId: string,
    testId: string,
    questionId: string,
    questionData: Partial<CreateQuestionRequest>,
    batchId?: string
  ): Promise<{ question: Question }> => {
    const headers = await getAuthHeaders();
    const actualBatchId = batchId || "batch-2024"; // Default to batch-2024 if no batch ID provided
    const response = await fetch(
      `${API_BASE_URL}/api/instructor/batches/${actualBatchId}/courses/${courseId}/tests/${testId}/questions/${questionId}`,
      {
        method: "PUT",
        headers,
        body: JSON.stringify(questionData),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to update question");
    }

    return response.json();
  },

  deleteQuestion: async (
    courseId: string,
    testId: string,
    questionId: string,
    batchId?: string
  ): Promise<{ message: string }> => {
    const headers = await getAuthHeaders();
    const actualBatchId = batchId || "batch-2024"; // Default to batch-2024 if no batch ID provided
    const response = await fetch(
      `${API_BASE_URL}/api/instructor/batches/${actualBatchId}/courses/${courseId}/tests/${testId}/questions/${questionId}`,
      {
        method: "DELETE",
        headers,
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to delete question");
    }

    return response.json();
  },

  // Analytics and Statistics
  getTestStatistics: async (
    testId: string
  ): Promise<{ statistics: TestStatistics }> => {
    const headers = await getAuthHeaders();
    const response = await fetch(
      `${API_BASE_URL}/api/instructor/tests/${testId}/statistics`,
      {
        method: "GET",
        headers,
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to fetch test statistics");
    }

    return response.json();
  },

  getTestAnalytics: async (testId: string): Promise<StudentTestAnalytics> => {
    const headers = await getAuthHeaders();
    const response = await fetch(
      `${API_BASE_URL}/api/instructor/tests/${testId}/analytics`,
      {
        method: "GET",
        headers,
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to fetch test analytics");
    }

    return response.json();
  },

  // Course Assignment - Get courses from all instructor batches
  getCourses: async (): Promise<{ courses: Course[] }> => {
    const headers = await getAuthHeaders();

    // First get all batches
    const batchesResponse = await fetch(
      `${API_BASE_URL}/api/instructor/batches`,
      {
        method: "GET",
        headers,
      }
    );

    if (!batchesResponse.ok) {
      const error = await batchesResponse.json();
      throw new Error(error.message || "Failed to fetch batches");
    }

    const batchesData = await batchesResponse.json();
    const batches = batchesData.batches || [];

    // Get courses from all batches
    const allCourses: Course[] = [];
    for (const batch of batches) {
      try {
        const coursesResponse = await fetch(
          `${API_BASE_URL}/api/instructor/batches/${batch.id}/courses`,
          {
            method: "GET",
            headers,
          }
        );

        if (coursesResponse.ok) {
          const coursesData = await coursesResponse.json();
          const courses = coursesData.courses || [];
          allCourses.push(...courses);
        }
      } catch (err) {
        console.warn(`Failed to fetch courses for batch ${batch.id}:`, err);
      }
    }

    return { courses: allCourses };
  },

  getStudents: async (): Promise<{ users: Student[] }> => {
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
  },

  assignCoursesToStudents: async (
    courseIds: string[],
    studentIds: string[]
  ): Promise<{ message: string }> => {
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
          const error = await response.json();
          throw new Error(error.message || "Failed to assign course");
        }

        return response.json();
      })
    );

    const failures = results.filter((result) => result.status === "rejected");
    if (failures.length > 0) {
      console.error("Some assignments failed:", failures);
      throw new Error(`Failed to assign ${failures.length} course(s)`);
    }

    return {
      message: `Successfully assigned ${courseIds.length} course(s) to ${studentIds.length} student(s)`,
    };
  },

  getStudentCourseAssignments: async (
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _studentId: string
  ): Promise<{ courses: Course[] }> => {
    // This endpoint doesn't exist in the current backend
    // For now, return empty array - this feature needs backend implementation
    console.warn(
      "getStudentCourseAssignments: Backend endpoint not implemented"
    );
    return { courses: [] };
  },

  deleteCourse: async (batchId: string, courseId: string) => {
    const headers = await getAuthHeaders();
    const response = await fetch(
      `${API_BASE_URL}/api/instructor/batches/${batchId}/courses/${courseId}`,
      {
        method: "DELETE",
        headers,
      }
    );
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to delete course");
    }
    return response.json();
  },

  updateCourse: async (
    batchId: string,
    courseId: string,
    courseData: Partial<Course>
  ) => {
    const headers = await getAuthHeaders();
    const response = await fetch(
      `${API_BASE_URL}/api/instructor/batches/${batchId}/courses/${courseId}`,
      {
        method: "PUT",
        headers,
        body: JSON.stringify(courseData),
      }
    );
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to update course");
    }
    return response.json();
  },
};
