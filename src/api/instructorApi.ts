import { getSession } from "next-auth/react";
import axios from "axios";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_BASE_URL || "http://localhost:3000";

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
const parseErrorResponse = async (response: Response): Promise<string> => {
  try {
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      const errorData = await response.json();
      return (
        errorData.message ||
        errorData.error ||
        `HTTP ${response.status}: ${response.statusText}`
      );
    } else {
      const errorText = await response.text();
      return errorText || `HTTP ${response.status}: ${response.statusText}`;
    }
  } catch (parseError) {
    console.warn("Failed to parse error response:", parseError);
    return `HTTP ${response.status}: ${response.statusText}`;
  }
};

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

// Define analytics type for course analytics
export interface CourseAnalytics {
  totalStudents: number;
  averageProgress: number;
  batchAnalytics: Array<{
    batchName: string;
    studentCount: number;
    averageProgress: number;
  }>;
}

// Define MCQ type for module MCQ APIs
export interface MCQData {
  questions: Array<{
    id?: string;
    question: { ops: Array<{ insert: string; attributes?: object }> };
    options: Array<{
      id?: string;
      text: { ops: Array<{ insert: string; attributes?: object }> };
    }>;
    correctAnswer: string;
    explanation?: { ops: Array<{ insert: string; attributes?: object }> };
  }>;
  passingScore: number;
}

// API functions
export const instructorApi = {
  // Authentication
  getBackendJwt: async (): Promise<string> => {
    return getBackendJwt();
  },

  // Dashboard Statistics with proper error handling
  getDashboardStats: async (): Promise<{
    stats: {
      totalCourses: number;
      totalBatches: number;
      totalStudents: number;
      averageProgress: number;
      recentActivity: number;
      publicCourses: number;
      privateCourses: number;
    };
  }> => {
    try {
      const headers = await getAuthHeaders();

      const result = await safeApiCall(
        `${API_BASE_URL}/api/instructor/dashboard/stats`,
        {
          method: "GET",
          headers,
        }
      );

      // Ensure we return the expected structure
      return {
        stats: {
          totalCourses: result.stats?.totalCourses || 0,
          totalBatches: result.stats?.totalBatches || 0,
          totalStudents: result.stats?.totalStudents || 0,
          averageProgress: result.stats?.averageProgress || 0,
          recentActivity: result.stats?.recentActivity || 0,
          publicCourses: result.stats?.publicCourses || 0,
          privateCourses: result.stats?.privateCourses || 0,
        },
      };
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);

      // Return default stats instead of throwing
      return {
        stats: {
          totalCourses: 0,
          totalBatches: 0,
          totalStudents: 0,
          averageProgress: 0,
          recentActivity: 0,
          publicCourses: 0,
          privateCourses: 0,
        },
      };
    }
  },

  // Get Instructor's Students with proper error handling
  getInstructorStudents: async (): Promise<{
    students: Array<{
      id: string;
      username: string;
      email: string;
      courses: Array<{
        courseId: string;
        courseName: string;
        assignedAt: string;
        completed: boolean;
        progress: number;
      }>;
    }>;
  }> => {
    try {
      const headers = await getAuthHeaders();

      const result = await safeApiCall(
        `${API_BASE_URL}/api/instructor/students`,
        {
          method: "GET",
          headers,
        }
      );

      return {
        students: result.students || [],
      };
    } catch (error) {
      console.error("Error fetching instructor students:", error);
      return { students: [] };
    }
  },

  // User Management with proper error handling
  getCurrentUser: async (): Promise<{
    id: string;
    username: string;
    email: string;
    userRole: string;
  }> => {
    try {
      const headers = await getAuthHeaders();

      const result = await safeApiCall(`${API_BASE_URL}/api/auth/me`, {
        method: "GET",
        headers,
      });

      return (
        result.user || {
          id: "",
          username: "Unknown",
          email: "",
          userRole: "INSTRUCTOR",
        }
      );
    } catch (error) {
      console.error("Error fetching current user:", error);
      throw new Error("Failed to fetch user profile");
    }
  },

  // Get Batches with proper error handling
  getBatches: async (): Promise<{ batches: Batch[] }> => {
    try {
      const headers = await getAuthHeaders();

      const result = await safeApiCall(
        `${API_BASE_URL}/api/instructor/batches`,
        {
          method: "GET",
          headers,
        }
      );

      return {
        batches: result.batches || [],
      };
    } catch (error) {
      console.error("Error fetching batches:", error);
      return { batches: [] };
    }
  },

  createCourse: async (
    courseData: CreateCourseData
  ): Promise<CourseResponse> => {
    const headers = await getAuthHeaders();
    // Use the first batch_id for route (API only supports one at a time)
    const batchId =
      Array.isArray(courseData.batch_ids) && courseData.batch_ids.length > 0
        ? courseData.batch_ids[0]
        : null;
    if (!batchId) {
      throw new Error("No batch selected for course creation");
    }
    const minimalRequestBody = {
      title: courseData.title,
      logo: courseData.logo || "",
      start_date: courseData.start_date,
      end_date: courseData.end_date,
      is_public: courseData.is_public,
      instructor_name: courseData.instructor_name,
      description: courseData.description || "Course description",
      modules: courseData.modules || [],
      batch_id: batchId, // Add batch_id to request body
    };
    const url = `${API_BASE_URL}/api/instructor/batches/${batchId}/courses`;
    console.log("=== INSTRUCTOR API DEBUG ===");
    console.log("URL:", url);
    console.log("Headers:", headers);
    console.log("Body:", JSON.stringify(minimalRequestBody, null, 2));

    try {
      const response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(minimalRequestBody),
      });

      if (!response.ok) {
        const errorMessage = await parseErrorResponse(response);
        console.error("API Error Response:", response.status, errorMessage);
        alert(`Course creation failed: ${errorMessage}`);
        throw new Error(errorMessage);
      }

      return response.json();
    } catch (error) {
      console.error("Course creation error:", error);
      throw error;
    }
  },

  // Test Management
  createTest: async (
    batchId: string,
    courseIds: string[] | string,
    testData: CreateTestRequest
  ): Promise<{ tests: Test[] }> => {
    const headers = await getAuthHeaders();
    const actualBatchId = batchId || "batch-2024";
    // Always send courseIds as array for multi-course support
    const payload = {
      ...testData,
      courseIds: Array.isArray(courseIds) ? courseIds : [courseIds],
    };

    try {
      const result = await safeApiCall(
        `${API_BASE_URL}/api/instructor/batches/${actualBatchId}/courses/bulk/tests`,
        {
          method: "POST",
          headers,
          body: JSON.stringify(payload),
        }
      );

      return result;
    } catch (error) {
      console.error("Error creating test:", error);
      throw error;
    }
  },

  getTestsByCourse: async (
    courseId: string,
    batchId?: string
  ): Promise<{ tests: Test[] }> => {
    const headers = await getAuthHeaders();
    const actualBatchId = batchId || "batch-2024"; // Default to batch-2024 if no batch ID provided

    try {
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
        const errorMessage = await parseErrorResponse(response);
        throw new Error(errorMessage);
      }

      const data = await response.json();
      return {
        tests: Array.isArray(data.tests)
          ? data.tests
          : Array.isArray(data)
          ? data
          : [],
      };
    } catch (error) {
      console.error("Error fetching tests:", error);
      return { tests: [] };
    }
  },

  getTestById: async (
    testId: string,
    courseId: string,
    batchId?: string
  ): Promise<{ test: Test }> => {
    const headers = await getAuthHeaders();
    const actualBatchId = batchId || "batch-2024"; // Default to batch-2024 if no batch ID provided

    const result = await safeApiCall(
      `${API_BASE_URL}/api/instructor/batches/${actualBatchId}/courses/${courseId}/tests/${testId}`,
      {
        method: "GET",
        headers,
      }
    );

    return result;
  },

  updateTest: async (
    courseId: string,
    testId: string,
    testData: Partial<CreateTestRequest>,
    batchId?: string
  ): Promise<{ test: Test }> => {
    const headers = await getAuthHeaders();
    const actualBatchId = batchId || "batch-2024"; // Default to batch-2024 if no batch ID provided

    const result = await safeApiCall(
      `${API_BASE_URL}/api/instructor/batches/${actualBatchId}/courses/${courseId}/tests/${testId}`,
      {
        method: "PUT",
        headers,
        body: JSON.stringify(testData),
      }
    );

    return result;
  },

  publishTest: async (
    testId: string,
    courseId: string,
    batchId?: string
  ): Promise<{ message: string }> => {
    const headers = await getAuthHeaders();
    const actualBatchId = batchId || "batch-2024"; // Default to batch-2024 if no batch ID provided

    const result = await safeApiCall(
      `${API_BASE_URL}/api/instructor/batches/${actualBatchId}/courses/${courseId}/tests/${testId}/publish`,
      {
        method: "PATCH",
        headers,
      }
    );

    return result;
  },

  deleteTest: async (
    courseId: string,
    testId: string,
    batchId?: string
  ): Promise<{ message: string }> => {
    const headers = await getAuthHeaders();
    const actualBatchId = batchId || "batch-2024"; // Default to batch-2024 if no batch ID provided

    const result = await safeApiCall(
      `${API_BASE_URL}/api/instructor/batches/${actualBatchId}/courses/${courseId}/tests/${testId}`,
      {
        method: "DELETE",
        headers,
      }
    );

    return result;
  },

  // Question Management
  addQuestion: async (
    testId: string,
    questionData: CreateQuestionRequest
  ): Promise<{ question: Question }> => {
    const headers = await getAuthHeaders();

    const result = await safeApiCall(
      `${API_BASE_URL}/api/instructor/tests/${testId}/questions`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({ questions: [questionData] }),
      }
    );

    return result;
  },

  getQuestions: async (
    courseId: string,
    testId: string,
    batchId?: string
  ): Promise<{ questions: Question[] }> => {
    const headers = await getAuthHeaders();
    const actualBatchId = batchId || "batch-2024"; // Default to batch-2024 if no batch ID provided

    const result = await safeApiCall(
      `${API_BASE_URL}/api/instructor/batches/${actualBatchId}/courses/${courseId}/tests/${testId}/questions`,
      {
        method: "GET",
        headers,
      }
    );

    return result;
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

    const result = await safeApiCall(
      `${API_BASE_URL}/api/instructor/batches/${actualBatchId}/courses/${courseId}/tests/${testId}/questions/${questionId}`,
      {
        method: "PUT",
        headers,
        body: JSON.stringify(questionData),
      }
    );

    return result;
  },

  deleteQuestion: async (
    courseId: string,
    testId: string,
    questionId: string,
    batchId?: string
  ): Promise<{ message: string }> => {
    const headers = await getAuthHeaders();
    const actualBatchId = batchId || "batch-2024"; // Default to batch-2024 if no batch ID provided

    const result = await safeApiCall(
      `${API_BASE_URL}/api/instructor/batches/${actualBatchId}/courses/${courseId}/tests/${testId}/questions/${questionId}`,
      {
        method: "DELETE",
        headers,
      }
    );

    return result;
  },

  // Analytics and Statistics
  getTestStatistics: async (
    testId: string
  ): Promise<{ statistics: TestStatistics }> => {
    const headers = await getAuthHeaders();

    const result = await safeApiCall(
      `${API_BASE_URL}/api/instructor/tests/${testId}/statistics`,
      {
        method: "GET",
        headers,
      }
    );

    return result;
  },

  getTestAnalytics: async (testId: string): Promise<StudentTestAnalytics> => {
    const headers = await getAuthHeaders();

    const result = await safeApiCall(
      `${API_BASE_URL}/api/instructor/tests/${testId}/analytics`,
      {
        method: "GET",
        headers,
      }
    );

    return result;
  },

  // Course Management - Get all courses (direct API)
  getCourses: async (): Promise<{ courses: Course[] }> => {
    try {
      const headers = await getAuthHeaders();

      // Use the direct course endpoint instead of per-batch
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

    const result = await safeApiCall(
      `${API_BASE_URL}/api/instructor/batches/${batchId}/courses/${courseId}`,
      {
        method: "DELETE",
        headers,
      }
    );

    return result;
  },

  updateCourse: async (
    batchId: string,
    courseId: string,
    courseData: Partial<Course>
  ) => {
    const headers = await getAuthHeaders();

    const result = await safeApiCall(
      `${API_BASE_URL}/api/instructor/batches/${batchId}/courses/${courseId}`,
      {
        method: "PUT",
        headers,
        body: JSON.stringify(courseData),
      }
    );

    return result;
  },

  // Get course details
  getCourseById: async (courseId: string): Promise<Course> => {
    const headers = await getAuthHeaders();

    const result = await safeApiCall(
      `${API_BASE_URL}/api/instructor/courses/${courseId}`,
      {
        method: "GET",
        headers,
      }
    );

    return result.course;
  },

  // Get course analytics
  getCourseAnalytics: async (courseId: string): Promise<CourseAnalytics> => {
    const headers = await getAuthHeaders();

    const result = await safeApiCall(
      `${API_BASE_URL}/api/instructor/courses/${courseId}/analytics`,
      {
        method: "GET",
        headers,
      }
    );

    return result.analytics as CourseAnalytics;
  },

  // MCQ Management APIs
  getModuleMCQ: async (courseId: string, moduleId: string) => {
    try {
      const headers = await getAuthHeaders();
      const response = await axios.get(
        `${API_BASE_URL}/api/instructor/courses/${courseId}/modules/${moduleId}/mcq`,
        { headers }
      );
      return response.data;
    } catch (error: unknown) {
      console.error("Error fetching module MCQ:", error);
      throw error;
    }
  },

  createModuleMCQ: async (
    courseId: string,
    moduleId: string,
    mcqData: MCQData
  ) => {
    try {
      const headers = await getAuthHeaders();
      const response = await axios.post(
        `${API_BASE_URL}/api/instructor/courses/${courseId}/modules/${moduleId}/mcq`,
        mcqData,
        { headers }
      );
      return response.data;
    } catch (error: unknown) {
      console.error("Error creating module MCQ:", error);
      throw error;
    }
  },

  updateModuleMCQ: async (
    courseId: string,
    moduleId: string,
    mcqId: string,
    mcqData: MCQData
  ) => {
    try {
      const headers = await getAuthHeaders();
      const response = await axios.put(
        `${API_BASE_URL}/api/instructor/courses/${courseId}/modules/${moduleId}/mcq/${mcqId}`,
        mcqData,
        { headers }
      );
      return response.data;
    } catch (error: unknown) {
      console.error("Error updating module MCQ:", error);
      throw error;
    }
  },

  deleteModuleMCQ: async (
    courseId: string,
    moduleId: string,
    mcqId: string
  ) => {
    try {
      const headers = await getAuthHeaders();
      const response = await axios.delete(
        `${API_BASE_URL}/api/instructor/courses/${courseId}/modules/${moduleId}/mcq/${mcqId}`,
        { headers }
      );
      return response.data;
    } catch (error: unknown) {
      console.error("Error deleting module MCQ:", error);
      throw error;
    }
  },

  // Get System-wide Student Analytics (for StudentAnalytics component)
  getSystemWideStudentAnalytics: async (): Promise<{
    students: Array<{
      id: string;
      username: string;
      email: string;
      courses: Array<{
        courseId: string;
        courseName: string;
        assignedAt: string;
        completed: boolean;
        progress: number;
      }>;
    }>;
  }> => {
    try {
      const headers = await getAuthHeaders();

      const result = await safeApiCall(
        `${API_BASE_URL}/api/instructor/analytics/students`,
        {
          method: "GET",
          headers,
        }
      );

      return {
        students: result.students || [],
      };
    } catch (error) {
      console.error("Error fetching system-wide student analytics:", error);
      return { students: [] };
    }
  },

  // Refresh API function with exponential backoff
  refreshApi: async (retries: number = 3): Promise<boolean> => {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`RefreshAPI attempt ${attempt}/${retries}`);

        // Test the API connection with a simple endpoint
        const headers = await getAuthHeaders();

        const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
          method: "GET",
          headers,
        });

        if (response.ok) {
          console.log("RefreshAPI: Connection successful");
          return true;
        }

        console.warn(
          `RefreshAPI attempt ${attempt} failed:`,
          response.status,
          response.statusText
        );
      } catch (error) {
        console.error(`RefreshAPI attempt ${attempt} error:`, error);
      }

      // Wait before retrying (exponential backoff)
      if (attempt < retries) {
        const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
        console.log(`RefreshAPI: Waiting ${delay}ms before retry...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    console.error("RefreshAPI: All attempts failed");
    return false;
  },

  // Health check function
  healthCheck: async (): Promise<{ status: string; timestamp: string }> => {
    try {
      const response = await fetch(`${API_BASE_URL}/health`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        return {
          status: "healthy",
          timestamp: new Date().toISOString(),
        };
      }

      return {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Health check failed:", error);
      return {
        status: "error",
        timestamp: new Date().toISOString(),
      };
    }
  },

  // Safe API call helpers
  safeApiCall: safeApiCall,
  parseErrorResponse: parseErrorResponse,
};
