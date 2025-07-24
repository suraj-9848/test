// Fetch test analytics (number of students who gave/did not give the test)
export async function fetchTestAnalytics(
  batchId: string,
  courseId: string,
  testId: string
) {
  const headers = await getAuthHeaders();
  const res = await fetch(
    `${API_BASE_URL}/api/instructor/batches/${batchId}/courses/${courseId}/tests/${testId}/analytics`,
    { method: "GET", headers }
  );
  if (!res.ok) throw new Error("Failed to fetch test analytics");
  return res.json();
}
import { getSession } from "next-auth/react";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";

let cachedBackendJwt: string = "";

const getBackendJwt = async () => {
  if (cachedBackendJwt) return cachedBackendJwt;
  const session = await getSession();
  if (!session) throw new Error("No session found - user not logged in");
  const googleIdToken = (session as { id_token?: string })?.id_token;
  if (!googleIdToken) throw new Error("No Google ID token found in session");
  const loginRes = await fetch(`${API_BASE_URL}/api/auth/admin-login`, {
    method: "POST",
    headers: { Authorization: `Bearer ${googleIdToken}` },
    credentials: "include",
  });
  if (!loginRes.ok) throw new Error("Failed to authenticate with backend");
  const data = await loginRes.json();
  cachedBackendJwt = data.token;
  console.log("Backend JWT cached:", cachedBackendJwt);
  return cachedBackendJwt;
};

const getAuthHeaders = async () => {
  const jwt = await getBackendJwt();
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${jwt}`,
  };
};

export async function fetchTests(batchId: string, courseId: string) {
  const headers = await getAuthHeaders();
  const res = await fetch(
    `${API_BASE_URL}/api/instructor/batches/${batchId}/courses/${courseId}/tests`,
    { method: "GET", headers }
  );
  if (!res.ok) throw new Error("Failed to fetch tests");
  return res.json();
}

import type { CreateTestRequest, CreateQuestionRequest } from "./instructorApi";

export async function createTest(
  batchId: string,
  courseIds: string[] | string,
  data: CreateTestRequest
) {
  const headers = await getAuthHeaders();
  // Always send courseIds as array for multi-course support
  const payload = {
    ...data,
    courseIds: Array.isArray(courseIds) ? courseIds : [courseIds],
  };
  const res = await fetch(
    `${API_BASE_URL}/api/instructor/batches/${batchId}/courses/bulk/tests`,
    {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    }
  );
  if (!res.ok) throw new Error("Failed to create test");
  return res.json();
}

export async function fetchTestById(
  batchId: string,
  courseId: string,
  testId: string
) {
  const headers = await getAuthHeaders();
  const res = await fetch(
    `${API_BASE_URL}/api/instructor/batches/${batchId}/courses/${courseId}/tests/${testId}`,
    { method: "GET", headers }
  );
  if (!res.ok) throw new Error("Failed to fetch test");
  return res.json();
}

export async function updateTest(
  batchId: string,
  courseId: string,
  testId: string,
  data: CreateTestRequest
) {
  const headers = await getAuthHeaders();
  const res = await fetch(
    `${API_BASE_URL}/api/instructor/batches/${batchId}/courses/${courseId}/tests/${testId}`,
    {
      method: "PUT",
      headers,
      body: JSON.stringify(data),
    }
  );
  if (!res.ok) throw new Error("Failed to update test");
  return res.json();
}

export async function deleteTest(
  batchId: string,
  courseId: string,
  testId: string
) {
  const headers = await getAuthHeaders();
  const res = await fetch(
    `${API_BASE_URL}/api/instructor/batches/${batchId}/courses/${courseId}/tests/${testId}`,
    {
      method: "DELETE",
      headers,
    }
  );
  if (!res.ok) throw new Error("Failed to delete test");
  return res.json();
}

export async function publishTest(
  batchId: string,
  courseId: string,
  testId: string
) {
  const headers = await getAuthHeaders();
  const res = await fetch(
    `${API_BASE_URL}/api/instructor/batches/${batchId}/courses/${courseId}/tests/${testId}/publish`,
    {
      method: "PATCH",
      headers,
    }
  );
  if (!res.ok) throw new Error("Failed to publish test");
  return res.json();
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
  data: EvaluateTestRequest
) {
  const headers = await getAuthHeaders();
  const res = await fetch(
    `${API_BASE_URL}/api/instructor/batches/${batchId}/courses/${courseId}/tests/${testId}/evaluate`,
    {
      method: "POST",
      headers,
      body: JSON.stringify(data),
    }
  );
  if (!res.ok) throw new Error("Failed to evaluate test");
  return res.json();
}

export async function getSubmissionCount(
  batchId: string,
  courseId: string,
  testId: string
) {
  const headers = await getAuthHeaders();
  const res = await fetch(
    `${API_BASE_URL}/api/instructor/batches/${batchId}/courses/${courseId}/tests/${testId}/submission-count`,
    { method: "GET", headers }
  );
  if (!res.ok) throw new Error("Failed to get submission count");
  return res.json();
}

export async function addQuestionToTest(
  batchId: string,
  courseId: string,
  testId: string,
  questionData: CreateQuestionRequest
) {
  const headers = await getAuthHeaders();
  const res = await fetch(
    `${API_BASE_URL}/api/instructor/batches/${batchId}/courses/${courseId}/tests/${testId}/questions`,
    {
      method: "POST",
      headers,
      body: JSON.stringify(questionData),
    }
  );
  if (!res.ok) {
    const errorText = await res.text();
    console.error("Failed to add question to test:", errorText); // log error response
    throw new Error(errorText || "Failed to add question to test");
  }
  return res.json();
}

export async function updateQuestionInTest(
  batchId: string,
  courseId: string,
  testId: string,
  questionId: string,
  questionData: Partial<CreateQuestionRequest>
) {
  const headers = await getAuthHeaders();
  const res = await fetch(
    `${API_BASE_URL}/api/instructor/batches/${batchId}/courses/${courseId}/tests/${testId}/questions/${questionId}`,
    {
      method: "PUT",
      headers,
      body: JSON.stringify(questionData),
    }
  );
  if (!res.ok) throw new Error("Failed to update question in test");
  return res.json();
}

export async function deleteQuestionFromTest(
  batchId: string,
  courseId: string,
  testId: string,
  questionId: string
) {
  const headers = await getAuthHeaders();
  const res = await fetch(
    `${API_BASE_URL}/api/instructor/batches/${batchId}/courses/${courseId}/tests/${testId}/questions/${questionId}`,
    {
      method: "DELETE",
      headers,
    }
  );
  if (!res.ok) throw new Error("Failed to delete question from test");
  return res.json();
}

export async function getQuestions(
  batchId: string,
  courseId: string,
  testId: string
) {
  const headers = await getAuthHeaders();
  const res = await fetch(
    `${API_BASE_URL}/api/instructor/batches/${batchId}/courses/${courseId}/tests/${testId}/questions`,
    {
      method: "GET",
      headers,
    }
  );
  if (!res.ok) throw new Error("Failed to fetch questions");
  return res.json();
}
