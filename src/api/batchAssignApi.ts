import axios from "axios";
import { getSession } from "next-auth/react";
import { instructorApi } from "./instructorApi";
import { API_ENDPOINTS, buildApiUrl } from "@/config/urls";

let cachedBackendJwt: string = "";

const getBackendJwt = async () => {
  if (cachedBackendJwt) return cachedBackendJwt;

  const session = await getSession();
  if (!session) throw new Error("No session found - user not logged in");

  const googleIdToken = (session as { id_token?: string })?.id_token;
  if (!googleIdToken) throw new Error("No Google ID token found in session");

  try {
    const loginRes = await axios.post(
      buildApiUrl(API_ENDPOINTS.AUTH.ADMIN_LOGIN),
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
    console.log(
      "Fetching batches from:",
      buildApiUrl(API_ENDPOINTS.INSTRUCTOR.BATCHES),
    );

    const res = await axios.get(buildApiUrl(API_ENDPOINTS.INSTRUCTOR.BATCHES), {
      headers,
    });
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

export const removeStudentsFromBatch = async (
  batchId: string,
  studentIds: string[],
): Promise<{ success: boolean; message: string; details?: any }> => {
  try {
    const headers = await getAuthHeaders();
    console.log("Removing students from batch:", { batchId, studentIds });

    const response = await axios.delete(
      buildApiUrl(API_ENDPOINTS.INSTRUCTOR.BATCH_REMOVE_STUDENTS(batchId)),
      {
        headers,
        data: { userIds: studentIds },
      },
    );

    console.log("Remove students response:", response.data);

    return {
      success: true,
      message: response.data.message || "Students removed successfully",
      details: response.data,
    };
  } catch (error) {
    console.error("Remove students error:", error);

    if (axios.isAxiosError(error) && error.response) {
      const errorMessage =
        error.response.data?.message ||
        error.response.data?.error ||
        `HTTP ${error.response.status}: ${error.response.statusText}`;

      throw new Error(errorMessage);
    }

    throw new Error("Failed to remove students from batch");
  }
};

export const getBatchStudents = async (batchId: string) => {
  try {
    const headers = await getAuthHeaders();
    console.log("Fetching students for batch:", batchId);

    const response = await axios.get(
      buildApiUrl(API_ENDPOINTS.INSTRUCTOR.BATCH_STUDENTS(batchId)),
      {
        headers,
      },
    );

    console.log("Batch students response:", response.data);
    return response.data.students || response.data.users || [];
  } catch (error) {
    console.error("Fetch batch students error:", error);

    if (axios.isAxiosError(error) && error.response) {
      throw new Error(
        `Failed to fetch batch students: ${
          error.response.data?.message || error.response.status
        }`,
      );
    }
    throw new Error("Failed to fetch batch students");
  }
};

export const fetchStudentsWithBatchInfo = async () => {
  try {
    console.log("Fetching students with batch info...");
    const headers = await getAuthHeaders();

    const response = await axios.get(
      buildApiUrl(API_ENDPOINTS.INSTRUCTOR.STUDENTS_WITH_BATCHES),
      {
        headers,
      },
    );

    console.log("Students with batch info response:", response.data);

    const students = (response.data.users || response.data.students || []).map(
      (student: any) => ({
        id: student.id,
        name: student.name || student.username,
        email: student.email,
        username: student.username,
        batch_id: Array.isArray(student.batch_id) ? student.batch_id : [],
      }),
    );

    return students;
  } catch (error) {
    console.error("Fetch students with batch info error:", error);

    if (axios.isAxiosError(error) && error.response?.status === 404) {
      console.log("Fallback: Using existing students endpoint...");
      return await fetchStudentsLegacy();
    }

    throw new Error("Failed to fetch students with batch information");
  }
};

const fetchStudentsLegacy = async () => {
  try {
    const result = await instructorApi.getStudents();

    const students = result.users || [];

    const studentsWithBatchInfo = await Promise.all(
      students.map(async (student: any) => {
        try {
          const headers = await getAuthHeaders();
          const userResponse = await axios.get(
            buildApiUrl(API_ENDPOINTS.INSTRUCTOR.USER_BATCHES(student.id)),
            { headers },
          );

          return {
            ...student,
            batch_id: userResponse.data.batch_id || [],
          };
        } catch (err) {
          console.warn(
            `Failed to get batch info for student ${student.id}:`,
            err,
          );
          return {
            ...student,
            batch_id: [],
          };
        }
      }),
    );

    return studentsWithBatchInfo;
  } catch (error) {
    console.error("Fetch students (legacy) error:", error);
    throw new Error("Failed to fetch students");
  }
};

export const isStudentInBatch = async (
  studentId: string,
  batchId: string,
): Promise<boolean> => {
  try {
    const headers = await getAuthHeaders();

    const response = await axios.get(
      buildApiUrl(
        API_ENDPOINTS.INSTRUCTOR.BATCH_STUDENT_CHECK(batchId, studentId),
      ),
      { headers },
    );

    return response.data.isAssigned || false;
  } catch (error) {
    console.error("Check student batch assignment error:", error);
    return false;
  }
};

export const fetchBatchesWithStudentCounts = async () => {
  try {
    const headers = await getAuthHeaders();
    console.log(
      "Fetching batches with student counts from:",
      buildApiUrl(API_ENDPOINTS.INSTRUCTOR.BATCHES_WITH_STUDENT_COUNT),
    );

    const response = await axios.get(
      buildApiUrl(API_ENDPOINTS.INSTRUCTOR.BATCHES_WITH_STUDENT_COUNT),
      {
        headers,
      },
    );

    console.log("Batches with student counts response:", response.data);
    return response.data.batches || [];
  } catch (error) {
    console.error("Fetch batches with student counts error:", error);

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

// Bulk operations for multiple batches and students
export const bulkAssignStudentsToBatches = async (
  assignments: { batchId: string; studentIds: string[] }[],
): Promise<{ success: boolean; message: string; results: any[] }> => {
  try {
    const headers = await getAuthHeaders();

    const response = await axios.post(
      buildApiUrl(API_ENDPOINTS.INSTRUCTOR.BATCH_BULK_ASSIGN),
      { assignments },
      { headers },
    );

    return {
      success: true,
      message: response.data.message || "Bulk assignment completed",
      results: response.data.results || [],
    };
  } catch (error) {
    console.error("Bulk assign error:", error);

    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data?.message || "Bulk assignment failed");
    }
    throw new Error("Failed to perform bulk assignment");
  }
};

// Transfer student from one batch to another
export const transferStudentBetweenBatches = async (
  studentId: string,
  fromBatchId: string,
  toBatchId: string,
): Promise<{ success: boolean; message: string }> => {
  try {
    const headers = await getAuthHeaders();

    const response = await axios.post(
      buildApiUrl(API_ENDPOINTS.INSTRUCTOR.BATCH_TRANSFER_STUDENT),
      {
        studentId,
        fromBatchId,
        toBatchId,
      },
      { headers },
    );

    return {
      success: true,
      message: response.data.message || "Student transferred successfully",
    };
  } catch (error) {
    console.error("Transfer student error:", error);

    if (axios.isAxiosError(error) && error.response) {
      throw new Error(
        error.response.data?.message || "Student transfer failed",
      );
    }
    throw new Error("Failed to transfer student");
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
    const endpoint = buildApiUrl(
      API_ENDPOINTS.INSTRUCTOR.BATCH_ASSIGN_STUDENTS(batchId),
    );

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
