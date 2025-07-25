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
    throw new Error("Failed to authenticate with backend", err as Error);
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
  const headers = await getAuthHeaders();
  const res = await axios.get(`${API_URL}`, { headers });
  return res.data.batches || [];
};

export const fetchStudents = async () => {
  // Use instructorApi.getStudents for correct logic
  const result = await instructorApi.getStudents();
  return result.users || [];
};

// Assign students to a batch
export const assignStudentsToBatch = async (
  batchId: string,
  studentIds: string[],
): Promise<{ success: boolean; message: string }> => {
  const headers = await getAuthHeaders();
  // Debug: log payload and endpoint
  console.log("Assigning students to batch", { batchId, studentIds });
  try {
    // Backend expects 'userIds' not 'studentIds'
    const res = await axios.post(
      `${API_URL}/${batchId}/assign-students`,
      { userIds: studentIds },
      { headers },
    );
    console.log("Assign response:", res.data);
    return res.data;
  } catch (err: unknown) {
    // Use AxiosError for proper error typing
    if (axios.isAxiosError(err) && err.response) {
      const { status, data } = err.response;
      console.error("API Error:", status, data);
      throw new Error(`Failed to assign students: ${data?.message || status}`);
    } else {
      console.error("Unknown error:", err);
      throw new Error("Unknown error assigning students");
    }
  }
};
