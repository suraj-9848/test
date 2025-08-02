import apiClient from "../utils/axiosInterceptor";
import { API_ENDPOINTS } from "../config/urls";
import { Batch } from "../store/batchStore";

export const fetchAllBatches = async (): Promise<Batch[]> => {
  const response = await apiClient.get(API_ENDPOINTS.INSTRUCTOR.BATCHES);
  return response.data.batches || [];
};

export const fetchBatch = async (id: string): Promise<Batch> => {
  const response = await apiClient.get(
    `${API_ENDPOINTS.INSTRUCTOR.BATCHES}/${id}`,
  );
  return response.data.batch;
};

export const createBatch = async (
  batch: Omit<Batch, "id">,
  skipAutoAssign: boolean = true,
): Promise<Batch> => {
  console.log(`Creating batch with skipAutoAssign=${skipAutoAssign}`);
  const response = await apiClient.post(API_ENDPOINTS.INSTRUCTOR.BATCHES, {
    ...batch,
    skipAutoAssign,
  });
  return response.data.batch;
};

export const updateBatch = async (batch: Batch): Promise<Batch> => {
  const response = await apiClient.put(
    `${API_ENDPOINTS.INSTRUCTOR.BATCHES}/${batch.id}`,
    batch,
  );
  return response.data;
};

export const deleteBatch = async (id: string): Promise<void> => {
  await apiClient.delete(`${API_ENDPOINTS.INSTRUCTOR.BATCHES}/${id}`);
};
