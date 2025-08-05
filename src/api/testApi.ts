import { API_ENDPOINTS, buildApiUrl } from "../config/urls";

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

async function getAuthHeaders() {
  // Try multiple sources for the token
  let token = "";

  // 1. Try sessionStorage first (most recent)
  if (typeof window !== "undefined") {
    token =
      sessionStorage.getItem("adminToken") ||
      sessionStorage.getItem("backendJwt") ||
      localStorage.getItem("adminToken") ||
      localStorage.getItem("backendJwt") ||
      "";
  }

  console.log(" Auth Debug:", {
    hasToken: !!token,
    tokenLength: token.length,
    tokenStart: token.substring(0, 20) + "...",
    sessionStorageKeys:
      typeof window !== "undefined" ? Object.keys(sessionStorage) : [],
    localStorageKeys:
      typeof window !== "undefined" ? Object.keys(localStorage) : [],
  });

  if (!token) {
    console.error(" No authentication token found!");
    console.log(" Available storage keys:");
    if (typeof window !== "undefined") {
      console.log("SessionStorage:", Object.keys(sessionStorage));
      console.log("LocalStorage:", Object.keys(localStorage));
    }
    throw new Error("No authentication token found. Please login again.");
  }

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
    "X-Requested-With": "XMLHttpRequest",
  };
}
export async function createTest(
  batchId: string,
  courseIds: string[],
  testData: CreateTestRequest,
) {
  try {
    const headers = await getAuthHeaders();

    console.log(" Creating test with data:", {
      batchId,
      courseIds,
      testData,
      url: buildApiUrl(
        API_ENDPOINTS.INSTRUCTOR.BATCH_COURSE_BULK_TESTS(batchId),
      ),
    });

    const requestBody = {
      ...testData,
      courseIds: courseIds,
    };

    console.log(" Request body:", JSON.stringify(requestBody, null, 2));
    console.log(" Request headers:", headers);

    const res = await fetch(
      buildApiUrl(API_ENDPOINTS.INSTRUCTOR.BATCH_COURSE_BULK_TESTS(batchId)),
      {
        method: "POST",
        headers,
        body: JSON.stringify(requestBody),
      },
    );

    console.log(" Response status:", res.status);
    console.log(
      " Response headers:",
      Object.fromEntries(res.headers.entries()),
    );

    if (!res.ok) {
      const errorText = await res.text();
      console.error(" Failed to create test:", {
        status: res.status,
        statusText: res.statusText,
        errorText,
      });

      if (res.status === 401 || res.status === 403) {
        // Clear invalid tokens
        if (typeof window !== "undefined") {
          sessionStorage.removeItem("adminToken");
          sessionStorage.removeItem("backendJwt");
          localStorage.removeItem("adminToken");
          localStorage.removeItem("backendJwt");
        }
        throw new Error(
          "Authentication failed. Please logout and login again.",
        );
      }

      throw new Error(errorText || `HTTP ${res.status}: Failed to create test`);
    }

    const result = await res.json();
    console.log(" Test created successfully:", result);
    return result;
  } catch (error) {
    console.error(" Create test error:", error);
    throw error;
  }
}

export async function fetchTests(batchId: string, courseId: string) {
  try {
    const headers = await getAuthHeaders();

    console.log(" Fetching tests for:", { batchId, courseId });

    const res = await fetch(
      buildApiUrl(
        API_ENDPOINTS.INSTRUCTOR.BATCH_COURSE_TESTS(batchId, courseId),
      ),
      {
        method: "GET",
        headers,
      },
    );

    if (!res.ok) {
      const errorText = await res.text();
      console.error(" Failed to fetch tests:", {
        status: res.status,
        statusText: res.statusText,
        errorText,
      });

      if (res.status === 401 || res.status === 403) {
        throw new Error(
          "Authentication failed. Please logout and login again.",
        );
      }

      throw new Error(errorText || `HTTP ${res.status}: Failed to fetch tests`);
    }

    return res.json();
  } catch (error) {
    console.error(" Fetch tests error:", error);
    throw error;
  }
}

export async function addQuestionToTest(
  batchId: string,
  courseId: string,
  testId: string,
  questionData: CreateQuestionRequest,
) {
  try {
    const headers = await getAuthHeaders();

    console.log(" Adding question to test:", {
      batchId,
      courseId,
      testId,
      questionData,
    });

    const res = await fetch(
      buildApiUrl(
        API_ENDPOINTS.INSTRUCTOR.BATCH_COURSE_TEST_QUESTIONS(
          batchId,
          courseId,
          testId,
        ),
      ),
      {
        method: "POST",
        headers,
        body: JSON.stringify(questionData),
      },
    );

    if (!res.ok) {
      const errorText = await res.text();
      console.error(" Failed to add question to test:", {
        status: res.status,
        statusText: res.statusText,
        errorText,
      });

      if (res.status === 401 || res.status === 403) {
        throw new Error(
          "Authentication failed. Please logout and login again.",
        );
      }

      throw new Error(
        errorText || `HTTP ${res.status}: Failed to add question to test`,
      );
    }

    return res.json();
  } catch (error) {
    console.error(" Add question error:", error);
    throw error;
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
    const headers = await getAuthHeaders();

    console.log(" Updating question in test:", {
      batchId,
      courseId,
      testId,
      questionId,
      questionData,
    });

    const res = await fetch(
      buildApiUrl(
        API_ENDPOINTS.INSTRUCTOR.BATCH_COURSE_TEST_QUESTION_BY_ID(
          batchId,
          courseId,
          testId,
          questionId,
        ),
      ),
      {
        method: "PUT",
        headers,
        body: JSON.stringify(questionData),
      },
    );

    if (!res.ok) {
      const errorText = await res.text();
      console.error(" Failed to update question in test:", {
        status: res.status,
        statusText: res.statusText,
        errorText,
      });

      if (res.status === 401 || res.status === 403) {
        throw new Error(
          "Authentication failed. Please logout and login again.",
        );
      }

      throw new Error(
        errorText || `HTTP ${res.status}: Failed to update question in test`,
      );
    }

    return res.json();
  } catch (error) {
    console.error(" Update question error:", error);
    throw error;
  }
}

export async function deleteQuestionFromTest(
  batchId: string,
  courseId: string,
  testId: string,
  questionId: string,
) {
  try {
    const headers = await getAuthHeaders();

    console.log(" Deleting question from test:", {
      batchId,
      courseId,
      testId,
      questionId,
    });

    const res = await fetch(
      buildApiUrl(
        API_ENDPOINTS.INSTRUCTOR.BATCH_COURSE_TEST_QUESTION_BY_ID(
          batchId,
          courseId,
          testId,
          questionId,
        ),
      ),
      {
        method: "DELETE",
        headers,
      },
    );

    if (!res.ok) {
      const errorText = await res.text();
      console.error(" Failed to delete question from test:", {
        status: res.status,
        statusText: res.statusText,
        errorText,
      });

      if (res.status === 401 || res.status === 403) {
        throw new Error(
          "Authentication failed. Please logout and login again.",
        );
      }

      throw new Error(
        errorText || `HTTP ${res.status}: Failed to delete question from test`,
      );
    }

    return res.json();
  } catch (error) {
    console.error(" Delete question error:", error);
    throw error;
  }
}

export async function getQuestions(
  batchId: string,
  courseId: string,
  testId: string,
) {
  try {
    const headers = await getAuthHeaders();

    console.log(" Getting questions for test:", {
      batchId,
      courseId,
      testId,
    });

    const res = await fetch(
      buildApiUrl(
        API_ENDPOINTS.INSTRUCTOR.BATCH_COURSE_TEST_QUESTIONS(
          batchId,
          courseId,
          testId,
        ),
      ),
      {
        method: "GET",
        headers,
      },
    );

    if (!res.ok) {
      const errorText = await res.text();
      console.error(" Failed to fetch questions:", {
        status: res.status,
        statusText: res.statusText,
        errorText,
      });

      if (res.status === 401 || res.status === 403) {
        throw new Error(
          "Authentication failed. Please logout and login again.",
        );
      }

      throw new Error(
        errorText || `HTTP ${res.status}: Failed to fetch questions`,
      );
    }

    return res.json();
  } catch (error) {
    console.error(" Fetch questions error:", error);
    throw error;
  }
}

export async function publishTest(
  batchId: string,
  courseId: string,
  testId: string,
) {
  try {
    const headers = await getAuthHeaders();

    console.log(" Publishing test:", {
      batchId,
      courseId,
      testId,
    });

    const res = await fetch(
      buildApiUrl(
        API_ENDPOINTS.INSTRUCTOR.BATCH_COURSE_TEST_PUBLISH(
          batchId,
          courseId,
          testId,
        ),
      ),
      {
        method: "PATCH",
        headers,
      },
    );

    if (!res.ok) {
      const errorText = await res.text();
      console.error(" Failed to publish test:", {
        status: res.status,
        statusText: res.statusText,
        errorText,
      });

      if (res.status === 401 || res.status === 403) {
        throw new Error(
          "Authentication failed. Please logout and login again.",
        );
      }

      throw new Error(
        errorText || `HTTP ${res.status}: Failed to publish test`,
      );
    }

    return res.json();
  } catch (error) {
    console.error(" Publish test error:", error);
    throw error;
  }
}
export async function deleteTest(
  batchId: string,
  courseId: string,
  testId: string,
) {
  try {
    const headers = await getAuthHeaders();

    console.log(" Deleting test:", {
      batchId,
      courseId,
      testId,
    });

    const res = await fetch(
      buildApiUrl(
        API_ENDPOINTS.INSTRUCTOR.BATCH_COURSE_TEST_BY_ID(
          batchId,
          courseId,
          testId,
        ),
      ),
      {
        method: "DELETE",
        headers,
      },
    );

    if (!res.ok) {
      const errorText = await res.text();
      console.error(" Failed to delete test:", {
        status: res.status,
        statusText: res.statusText,
        errorText,
      });

      if (res.status === 401 || res.status === 403) {
        throw new Error(
          "Authentication failed. Please logout and login again.",
        );
      }

      throw new Error(errorText || `HTTP ${res.status}: Failed to delete test`);
    }

    return res.json();
  } catch (error) {
    console.error(" Delete test error:", error);
    throw error;
  }
}

export async function updateTest(
  batchId: string,
  courseId: string,
  testId: string,
  testData: Partial<CreateTestRequest>,
) {
  try {
    const headers = await getAuthHeaders();

    console.log(" Updating test:", {
      batchId,
      courseId,
      testId,
      testData,
    });

    const res = await fetch(
      buildApiUrl(
        API_ENDPOINTS.INSTRUCTOR.BATCH_COURSE_TEST_BY_ID(
          batchId,
          courseId,
          testId,
        ),
      ),
      {
        method: "PUT",
        headers,
        body: JSON.stringify(testData),
      },
    );

    if (!res.ok) {
      const errorText = await res.text();
      console.error(" Failed to update test:", {
        status: res.status,
        statusText: res.statusText,
        errorText,
      });

      if (res.status === 401 || res.status === 403) {
        throw new Error(
          "Authentication failed. Please logout and login again.",
        );
      }

      throw new Error(errorText || `HTTP ${res.status}: Failed to update test`);
    }

    return res.json();
  } catch (error) {
    console.error(" Update test error:", error);
    throw error;
  }
}

export async function checkAuthenticationStatus() {
  try {
    const headers = await getAuthHeaders();

    const res = await fetch(buildApiUrl(API_ENDPOINTS.AUTH.ME), {
      method: "GET",
      headers,
    });

    if (!res.ok) {
      throw new Error("Authentication check failed");
    }

    const result = await res.json();
    console.log(" Authentication status:", result);
    return result;
  } catch (error) {
    console.error(" Authentication check failed:", error);
    throw error;
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
  data: any,
) {
  const headers = await getAuthHeaders();
  const res = await fetch(
    buildApiUrl(
      API_ENDPOINTS.INSTRUCTOR.BATCH_COURSE_TEST_EVALUATE(
        batchId,
        courseId,
        testId,
      ),
    ),
    {
      method: "POST",
      headers,
      body: JSON.stringify(data),
    },
  );
  if (!res.ok) throw new Error("Failed to evaluate test");
  return res.json();
}

export async function getSubmissionCount(
  batchId: string,
  courseId: string,
  testId: string,
) {
  const headers = await getAuthHeaders();
  const res = await fetch(
    buildApiUrl(
      API_ENDPOINTS.INSTRUCTOR.BATCH_COURSE_TEST_SUBMISSION_COUNT(
        batchId,
        courseId,
        testId,
      ),
    ),
    { method: "GET", headers },
  );
  if (!res.ok) throw new Error("Failed to get submission count");
  return res.json();
}
