import axios from "axios";
import { getSession } from "next-auth/react";
import { instructorApi } from "./instructorApi";

const baseUrl = process.env.NEXT_PUBLIC_BACKEND_BASE_URL;
const API_URL = `${baseUrl}/api/instructor/batches`;

let cachedBackendJwt: string = "";

const getBackendJwt = async () => {
  if (cachedBackendJwt) return cachedBackendJwt;

  const session = await getSession();
  if (!session) throw new Error("No session found - user not logged in");

  const googleIdToken = (session as { id_token?: string })?.id_token;
  if (!googleIdToken) throw new Error("No Google ID token found in session");

  try {
    const loginRes = await axios.post(
      `${baseUrl}/api/auth/admin-login`,
      {},
      {
        headers: { Authorization: `Bearer ${googleIdToken}` },
        withCredentials: true,
      },
    );
    cachedBackendJwt = loginRes.data.token;
    return cachedBackendJwt;
  } catch (err) {
    console.error("Backend JWT error:", err);
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

export const fetchBatches = async () => {
  try {
    const headers = await getAuthHeaders();
    console.log("Fetching batches from:", API_URL);

    const res = await axios.get(`${API_URL}`, { headers });
    console.log("Batches response:", res.data);

    return res.data.batches || [];
  } catch (error) {
    console.error("Fetch batches error:", error);
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(
        `Failed to fetch batches: ${
          error.response.data?.message || error.response.status
        }`,
      );
    }
    throw new Error("Failed to fetch batches");
  }
};

export const fetchStudents = async () => {
  try {
    console.log("Fetching students...");
    const result = await instructorApi.getStudents();
    console.log("Students response:", result);

    return result.users || [];
  } catch (error) {
    console.error("Fetch students error:", error);
    throw new Error("Failed to fetch students");
  }
};

// Assign students to a batch with improved error handling
export const assignStudentsToBatch = async (
  batchId: string,
  studentIds: string[],
): Promise<{ success: boolean; message: string; details?: any }> => {
  try {
    const headers = await getAuthHeaders();
    const endpoint = `${API_URL}/${batchId}/assign-students`;

    // Validate inputs
    if (!batchId || typeof batchId !== "string") {
      throw new Error("Invalid batch ID");
    }

    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      throw new Error("Student IDs array is required and cannot be empty");
    }

    // Validate UUID format for student IDs
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    for (const id of studentIds) {
      if (!id || typeof id !== "string" || !uuidRegex.test(id)) {
        throw new Error(`Invalid student ID format: ${id}`);
      }
    }

    const payload = { userIds: studentIds };

    console.log("=== ASSIGNMENT REQUEST ===");
    console.log("Endpoint:", endpoint);
    console.log("Payload:", payload);
    console.log("Headers:", { ...headers, Authorization: "[REDACTED]" });

    const response = await axios.post(endpoint, payload, {
      headers,
      timeout: 30000, // 30 second timeout
    });

    console.log("=== ASSIGNMENT RESPONSE ===");
    console.log("Status:", response.status);
    console.log("Data:", response.data);

    const { message, summary, results } = response.data;

    return {
      success: true,
      message,
      details: {
        summary,
        results,
      },
    };
  } catch (error: unknown) {
    console.error("=== ASSIGNMENT ERROR ===");
    console.error("Error:", error);

    if (axios.isAxiosError(error)) {
      const { response, request, message } = error;

      if (response) {
        console.error("Response status:", response.status);
        console.error("Response data:", response.data);
        console.error("Response headers:", response.headers);

        const errorMessage =
          response.data?.message || `HTTP ${response.status}`;
        const errorDetails = response.data?.details;

        if (response.status === 400) {
          throw new Error(`Bad Request: ${errorMessage}`);
        } else if (response.status === 401) {
          cachedBackendJwt = "";
          throw new Error("Authentication failed. Please log in again.");
        } else if (response.status === 403) {
          throw new Error(
            "Permission denied. You don't have access to this resource.",
          );
        } else if (response.status === 404) {
          throw new Error("Batch not found. Please refresh and try again.");
        } else if (response.status === 500) {
          throw new Error(
            `Server error: ${errorMessage}${
              errorDetails ? ` - ${errorDetails}` : ""
            }`,
          );
        } else {
          throw new Error(`Request failed: ${errorMessage}`);
        }
      } else if (request) {
        console.error("Request made but no response:", request);
        throw new Error(
          "No response from server. Please check your connection and try again.",
        );
      } else {
        console.error("Request setup error:", message);
        throw new Error(`Request setup error: ${message}`);
      }
    } else if (error instanceof Error) {
      throw new Error(`Assignment failed: ${error.message}`);
    } else {
      throw new Error("Unknown error occurred during assignment");
    }
  }
};
