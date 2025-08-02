import apiClient from "../utils/axiosInterceptor";
import { API_ENDPOINTS } from "../config/urls";

interface CreateTestRequest {
  title: string;
  description?: string;
  maxMarks: number;
  passingMarks: number;
  durationInMinutes: number;
  startDate: string;
  endDate: string;
  shuffleQuestions?: boolean;
  showResults?: boolean;
  showCorrectAnswers?: boolean;
  maxAttempts?: number;
}

interface CreateQuestionRequest {
  question_text: string;
  type: "MCQ" | "DESCRIPTIVE" | "CODE";
  marks: number;
  options?: { text: string; correct: boolean }[];
  expectedWordCount?: number;
  codeLanguage?: string;
}
export async function createTest(
  batchId: string,
  courseIds: string[],
  testData: CreateTestRequest,
) {
  try {
    console.log(" Creating test with data:", {
      batchId,
      courseIds,
      testData,
    });

    const requestBody = {
      ...testData,
      courseIds: courseIds,
    };

    console.log(" Request body:", JSON.stringify(requestBody, null, 2));

    const response = await apiClient.post(
      `${API_ENDPOINTS.INSTRUCTOR.BATCHES}/${batchId}/courses/bulk/tests`,
      requestBody,
    );

    console.log(" Test created successfully:", response.data);
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 401 || error.response?.status === 403) {
      throw new Error("Authentication failed. Please logout and login again.");
    }

    const errorMessage =
      error.response?.data?.message || error.message || "Failed to create test";
    throw new Error(errorMessage);
  }
}

export async function fetchTests(batchId: string, courseId: string) {
  try {
    console.log(" Fetching tests for:", { batchId, courseId });

    const response = await apiClient.get(
      `${API_ENDPOINTS.INSTRUCTOR.BATCHES}/${batchId}/courses/${courseId}/tests`,
    );

    return response.data;
  } catch (error: any) {
    if (error.response?.status === 401 || error.response?.status === 403) {
      throw new Error("Authentication failed. Please logout and login again.");
    }

    const errorMessage =
      error.response?.data?.message || error.message || "Failed to fetch tests";
    throw new Error(errorMessage);
  }
}

export async function addQuestionToTest(
  batchId: string,
  courseId: string,
  testId: string,
  questionData: CreateQuestionRequest,
) {
  try {
    console.log(" Adding question to test:", {
      batchId,
      courseId,
      testId,
      questionData,
    });

    const response = await apiClient.post(
      `${API_ENDPOINTS.INSTRUCTOR.BATCHES}/${batchId}/courses/${courseId}/tests/${testId}/questions`,
      questionData,
    );

    return response.data;
  } catch (error: any) {
    if (error.response?.status === 401 || error.response?.status === 403) {
      throw new Error("Authentication failed. Please logout and login again.");
    }

    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "Failed to add question to test";
    throw new Error(errorMessage);
  }
}

export async function updateQuestionInTest(
  batchId: string,
  courseId: string,
  testId: string,
  questionId: string,
  questionData: Partial<CreateQuestionRequest>,
) {
  try {
    console.log(" Updating question in test:", {
      batchId,
      courseId,
      testId,
      questionId,
      questionData,
    });

    const response = await apiClient.put(
      `${API_ENDPOINTS.INSTRUCTOR.BATCHES}/${batchId}/courses/${courseId}/tests/${testId}/questions/${questionId}`,
      questionData,
    );

    return response.data;
  } catch (error: any) {
    if (error.response?.status === 401 || error.response?.status === 403) {
      throw new Error("Authentication failed. Please logout and login again.");
    }

    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "Failed to update question in test";
    throw new Error(errorMessage);
  }
}

export async function deleteQuestionFromTest(
  batchId: string,
  courseId: string,
  testId: string,
  questionId: string,
) {
  try {
    console.log(" Deleting question from test:", {
      batchId,
      courseId,
      testId,
      questionId,
    });

    const response = await apiClient.delete(
      `${API_ENDPOINTS.INSTRUCTOR.BATCHES}/${batchId}/courses/${courseId}/tests/${testId}/questions/${questionId}`,
    );

    return response.data;
  } catch (error: any) {
    if (error.response?.status === 401 || error.response?.status === 403) {
      throw new Error("Authentication failed. Please logout and login again.");
    }

    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "Failed to delete question from test";
    throw new Error(errorMessage);
  }
}

export async function getQuestions(
  batchId: string,
  courseId: string,
  testId: string,
) {
  try {
    console.log(" Getting questions for test:", {
      batchId,
      courseId,
      testId,
    });

    const response = await apiClient.get(
      `${API_ENDPOINTS.INSTRUCTOR.BATCHES}/${batchId}/courses/${courseId}/tests/${testId}/questions`,
    );

    return response.data;
  } catch (error: any) {
    if (error.response?.status === 401 || error.response?.status === 403) {
      throw new Error("Authentication failed. Please logout and login again.");
    }

    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "Failed to fetch questions";
    throw new Error(errorMessage);
  }
}

export async function publishTest(
  batchId: string,
  courseId: string,
  testId: string,
) {
  try {
    console.log(" Publishing test:", {
      batchId,
      courseId,
      testId,
    });

    const response = await apiClient.patch(
      `${API_ENDPOINTS.INSTRUCTOR.BATCHES}/${batchId}/courses/${courseId}/tests/${testId}/publish`,
    );

    return response.data;
  } catch (error: any) {
    if (error.response?.status === 401 || error.response?.status === 403) {
      throw new Error("Authentication failed. Please logout and login again.");
    }

    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "Failed to publish test";
    throw new Error(errorMessage);
  }
}
export async function deleteTest(
  batchId: string,
  courseId: string,
  testId: string,
) {
  try {
    console.log(" Deleting test:", {
      batchId,
      courseId,
      testId,
    });

    const response = await apiClient.delete(
      `${API_ENDPOINTS.INSTRUCTOR.BATCHES}/${batchId}/courses/${courseId}/tests/${testId}`,
    );

    return response.data;
  } catch (error: any) {
    if (error.response?.status === 401 || error.response?.status === 403) {
      throw new Error("Authentication failed. Please logout and login again.");
    }

    const errorMessage =
      error.response?.data?.message || error.message || "Failed to delete test";
    throw new Error(errorMessage);
  }
}

export async function updateTest(
  batchId: string,
  courseId: string,
  testId: string,
  testData: Partial<CreateTestRequest>,
) {
  try {
    console.log(" Updating test:", {
      batchId,
      courseId,
      testId,
      testData,
    });

    const response = await apiClient.put(
      `${API_ENDPOINTS.INSTRUCTOR.BATCHES}/${batchId}/courses/${courseId}/tests/${testId}`,
      testData,
    );

    return response.data;
  } catch (error: any) {
    if (error.response?.status === 401 || error.response?.status === 403) {
      throw new Error("Authentication failed. Please logout and login again.");
    }

    const errorMessage =
      error.response?.data?.message || error.message || "Failed to update test";
    throw new Error(errorMessage);
  }
}

export async function checkAuthenticationStatus() {
  try {
    const response = await apiClient.get(API_ENDPOINTS.AUTH.ME);

    console.log(" Authentication status:", response.data);
    return response.data;
  } catch (error: any) {
    throw new Error("Authentication check failed");
  }
}

interface EvaluateTestAnswer {
  questionId: string;
  answer: string | string[];
}

interface EvaluateTestRequest {
  answers: EvaluateTestAnswer[];
  [key: string]: unknown;
}

export async function evaluateTest(
  batchId: string,
  courseId: string,
  testId: string,
  data: EvaluateTestRequest,
) {
  try {
    const response = await apiClient.post(
      `${API_ENDPOINTS.INSTRUCTOR.BATCHES}/${batchId}/courses/${courseId}/tests/${testId}/evaluate`,
      data,
    );

    return response.data;
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "Failed to evaluate test";
    throw new Error(errorMessage);
  }
}

export async function getSubmissionCount(
  batchId: string,
  courseId: string,
  testId: string,
) {
  try {
    const response = await apiClient.get(
      `${API_ENDPOINTS.INSTRUCTOR.BATCHES}/${batchId}/courses/${courseId}/tests/${testId}/submission-count`,
    );

    return response.data;
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "Failed to get submission count";
    throw new Error(errorMessage);
  }
}
