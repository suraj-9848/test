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

// Enhanced interface for test cases
interface TestCase {
  input: string;
  expected_output: string;
}

// ENHANCED CreateQuestionRequest with all coding-specific fields
interface CreateQuestionRequest {
  question_text: string;
  type: "MCQ" | "DESCRIPTIVE" | "CODE";
  marks: number;
  options?: { text: string; correct: boolean }[];
  expectedWordCount?: number;
  codeLanguage?: string;
  constraints?: string;
  visible_testcases?: TestCase[];
  hidden_testcases?: TestCase[];
  time_limit_ms?: number;
  memory_limit_mb?: number;
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

  console.log("🔍 Auth Debug:", {
    hasToken: !!token,
    tokenLength: token.length,
    tokenStart: token.substring(0, 20) + "...",
    sessionStorageKeys:
      typeof window !== "undefined" ? Object.keys(sessionStorage) : [],
    localStorageKeys:
      typeof window !== "undefined" ? Object.keys(localStorage) : [],
  });

  if (!token) {
    console.error("❌ No authentication token found!");
    console.log("📋 Available storage keys:");
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

    console.log("🔍 Creating test with data:", {
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

    console.log("📤 Request body:", JSON.stringify(requestBody, null, 2));
    console.log("🔑 Request headers:", headers);

    const res = await fetch(
      buildApiUrl(API_ENDPOINTS.INSTRUCTOR.BATCH_COURSE_BULK_TESTS(batchId)),
      {
        method: "POST",
        headers,
        body: JSON.stringify(requestBody),
      },
    );

    console.log("📊 Response status:", res.status);
    console.log(
      "📋 Response headers:",
      Object.fromEntries(res.headers.entries()),
    );

    if (!res.ok) {
      const errorText = await res.text();
      console.error("❌ Failed to create test:", {
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
    console.log("✅ Test created successfully:", result);
    return result;
  } catch (error) {
    console.error("❌ Create test error:", error);
    throw error;
  }
}

export async function fetchTests(batchId: string, courseId: string) {
  try {
    const headers = await getAuthHeaders();

    console.log("🔍 Fetching tests for:", { batchId, courseId });

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
      console.error("❌ Failed to fetch tests:", {
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
    console.error("❌ Fetch tests error:", error);
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

    console.log("🔍 Adding question to test:", {
      batchId,
      courseId,
      testId,
      questionData: {
        type: questionData.type,
        marks: questionData.marks,
        hasConstraints: !!questionData.constraints,
        hasVisibleTestCases: !!questionData.visible_testcases,
        hasHiddenTestCases: !!questionData.hidden_testcases,
        visibleTestCasesCount: questionData.visible_testcases?.length || 0,
        hiddenTestCasesCount: questionData.hidden_testcases?.length || 0,
      },
    });

    // Enhanced validation for coding questions
    if (questionData.type === "CODE") {
      console.log("🔍 CODE question validation:", {
        codeLanguage: questionData.codeLanguage,
        constraints: questionData.constraints,
        visibleTestCases: questionData.visible_testcases,
        hiddenTestCases: questionData.hidden_testcases,
        timeLimit: questionData.time_limit_ms,
        memoryLimit: questionData.memory_limit_mb,
      });

      if (!questionData.codeLanguage) {
        throw new Error(
          "Programming language is required for coding questions",
        );
      }

      if (
        !questionData.visible_testcases ||
        questionData.visible_testcases.length === 0
      ) {
        throw new Error(
          "At least one visible test case is required for coding questions",
        );
      }

      if (
        !questionData.hidden_testcases ||
        questionData.hidden_testcases.length === 0
      ) {
        throw new Error(
          "At least one hidden test case is required for coding questions",
        );
      }

      // Validate test case structure
      const validateTestCases = (testCases: TestCase[], type: string) => {
        testCases.forEach((testCase, index) => {
          if (!testCase.input && testCase.input !== "") {
            throw new Error(
              `${type} test case ${index + 1}: input is required`,
            );
          }
          if (!testCase.expected_output && testCase.expected_output !== "") {
            throw new Error(
              `${type} test case ${index + 1}: expected_output is required`,
            );
          }
        });
      };

      validateTestCases(questionData.visible_testcases, "Visible");
      validateTestCases(questionData.hidden_testcases, "Hidden");
    }

    console.log(
      "📤 Sending question data:",
      JSON.stringify(questionData, null, 2),
    );

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

    console.log("📊 Add question response status:", res.status);

    if (!res.ok) {
      const errorText = await res.text();
      console.error("❌ Failed to add question to test:", {
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

    const result = await res.json();
    console.log("✅ Question added successfully:", result);
    return result;
  } catch (error) {
    console.error("❌ Add question error:", error);
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

    console.log("🔍 Updating question in test:", {
      batchId,
      courseId,
      testId,
      questionId,
      questionData: {
        type: questionData.type,
        marks: questionData.marks,
        hasConstraints: !!questionData.constraints,
        hasVisibleTestCases: !!questionData.visible_testcases,
        hasHiddenTestCases: !!questionData.hidden_testcases,
        visibleTestCasesCount: questionData.visible_testcases?.length || 0,
        hiddenTestCasesCount: questionData.hidden_testcases?.length || 0,
      },
    });

    // Enhanced validation for coding questions
    if (questionData.type === "CODE") {
      console.log("🔍 CODE question update validation:", {
        codeLanguage: questionData.codeLanguage,
        constraints: questionData.constraints,
        visibleTestCases: questionData.visible_testcases,
        hiddenTestCases: questionData.hidden_testcases,
        timeLimit: questionData.time_limit_ms,
        memoryLimit: questionData.memory_limit_mb,
      });

      if (!questionData.codeLanguage) {
        throw new Error(
          "Programming language is required for coding questions",
        );
      }

      if (
        !questionData.visible_testcases ||
        questionData.visible_testcases.length === 0
      ) {
        throw new Error(
          "At least one visible test case is required for coding questions",
        );
      }

      if (
        !questionData.hidden_testcases ||
        questionData.hidden_testcases.length === 0
      ) {
        throw new Error(
          "At least one hidden test case is required for coding questions",
        );
      }

      // Validate test case structure
      const validateTestCases = (testCases: TestCase[], type: string) => {
        testCases.forEach((testCase, index) => {
          if (!testCase.input && testCase.input !== "") {
            throw new Error(
              `${type} test case ${index + 1}: input is required`,
            );
          }
          if (!testCase.expected_output && testCase.expected_output !== "") {
            throw new Error(
              `${type} test case ${index + 1}: expected_output is required`,
            );
          }
        });
      };

      validateTestCases(questionData.visible_testcases, "Visible");
      validateTestCases(questionData.hidden_testcases, "Hidden");
    }

    console.log(
      "📤 Sending updated question data:",
      JSON.stringify(questionData, null, 2),
    );

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

    console.log("📊 Update question response status:", res.status);

    if (!res.ok) {
      const errorText = await res.text();
      console.error("❌ Failed to update question in test:", {
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

    const result = await res.json();
    console.log("✅ Question updated successfully:", result);
    return result;
  } catch (error) {
    console.error("❌ Update question error:", error);
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

    console.log("🔍 Deleting question from test:", {
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
      console.error("❌ Failed to delete question from test:", {
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

    const result = await res.json();
    console.log("✅ Question deleted successfully:", result);
    return result;
  } catch (error) {
    console.error("❌ Delete question error:", error);
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

    console.log("🔍 Getting questions for test:", {
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
      console.error("❌ Failed to fetch questions:", {
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

    const result = await res.json();
    console.log("✅ Questions fetched successfully:", {
      questionCount: result.data?.questions?.length || 0,
      questions:
        result.data?.questions?.map((q: any) => ({
          id: q.id,
          type: q.type,
          hasConstraints: !!q.constraints,
          hasVisibleTestCases: !!q.visible_testcases,
          hasHiddenTestCases: !!q.hidden_testcases,
        })) || [],
    });

    return result;
  } catch (error) {
    console.error("❌ Fetch questions error:", error);
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

    console.log("🔍 Publishing test:", {
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
      console.error("❌ Failed to publish test:", {
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

    const result = await res.json();
    console.log("✅ Test published successfully:", result);
    return result;
  } catch (error) {
    console.error("❌ Publish test error:", error);
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

    console.log("🔍 Deleting test:", {
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
      console.error("❌ Failed to delete test:", {
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

    const result = await res.json();
    console.log("✅ Test deleted successfully:", result);
    return result;
  } catch (error) {
    console.error("❌ Delete test error:", error);
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

    console.log("🔍 Updating test:", {
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
      console.error("❌ Failed to update test:", {
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

    const result = await res.json();
    console.log("✅ Test updated successfully:", result);
    return result;
  } catch (error) {
    console.error("❌ Update test error:", error);
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
    console.log("✅ Authentication status:", result);
    return result;
  } catch (error) {
    console.error("❌ Authentication check failed:", error);
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
