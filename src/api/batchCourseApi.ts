import apiClient from "../utils/axiosInterceptor";
import { API_ENDPOINTS } from "../config/urls";

export const getCoursesForBatch = async (batchId: string) => {
  try {
    const response = await apiClient.get(
      `${API_ENDPOINTS.INSTRUCTOR.BATCHES}/${batchId}/courses`,
    );
    return response.data.courses || [];
  } catch (error: any) {
    console.error(`Error fetching courses for batch ${batchId}:`, error);
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      `Failed to fetch courses for batch ${batchId}`;
    throw new Error(errorMessage);
  }
};

export const assignCoursesToBatch = async (
  batchId: string,
  courseIds: string[],
) => {
  try {
    console.log(`Assigning ${courseIds.length} courses to batch ${batchId}`, {
      courseIds,
    });

    const response = await apiClient.post(
      `${API_ENDPOINTS.INSTRUCTOR.BATCHES}/${batchId}/courses`,
      { courseIds },
    );

    console.log("Assign courses response:", response.data);
    return response.data;
  } catch (error: any) {
    console.error(`Error assigning courses to batch ${batchId}:`, error);
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      `Failed to assign courses to batch ${batchId}`;
    throw new Error(errorMessage);
  }
};

export const assignCoursesToBatches = async (
  batchIds: string[],
  courseIds: string[],
) => {
  console.log(
    `Assigning ${courseIds.length} courses to ${batchIds.length} batches`,
  );

  const results: {
    batchId: string;
    success: boolean;
    message?: string;
    data?: any;
  }[] = [];

  for (const batchId of batchIds) {
    try {
      const data = await assignCoursesToBatch(batchId, courseIds);
      results.push({
        batchId,
        success: true,
        data,
      });
    } catch (err: any) {
      console.error(`Failed to assign courses to batch ${batchId}:`, err);
      results.push({
        batchId,
        success: false,
        message:
          err.message || `Unknown error assigning courses to batch ${batchId}`,
      });
    }
  }

  const failures = results.filter((r) => !r.success);
  if (failures.length > 0) {
    console.warn(
      `Failed to assign courses to ${failures.length} batch(es):`,
      failures,
    );
    const errorMessages = failures.map((f) => f.message).join("; ");
    throw new Error(
      `Failed to assign courses to ${failures.length} batch(es): ${errorMessages}`,
    );
  }

  return results.filter((r) => r.success).map((r) => r.data);
};
