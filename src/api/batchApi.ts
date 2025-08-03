import axios from "axios";
import { Batch } from "../store/batchStore";
import { API_ENDPOINTS, buildApiUrl } from "../config/urls";

const API_URL = buildApiUrl(API_ENDPOINTS.INSTRUCTOR.BATCHES);

export const fetchAllBatches = async (jwt: string): Promise<Batch[]> => {
  const res = await axios.get(API_URL, {
    headers: { Authorization: `Bearer ${jwt}` },
  });
  // The backend returns { message: "Fetched batches", batches: Batch[] }
  return res.data.batches || [];
};

export const fetchBatch = async (id: string, jwt: string): Promise<Batch> => {
  const res = await axios.get(
    buildApiUrl(API_ENDPOINTS.INSTRUCTOR.BATCH_BY_ID(id)),
    {
      headers: { Authorization: `Bearer ${jwt}` },
    },
  );
  return res.data.batch;
};

export const createBatch = async (
  batch: Omit<Batch, "id">,
  jwt: string,
  skipAutoAssign: boolean = true,
): Promise<Batch> => {
  console.log(`Creating batch with skipAutoAssign=${skipAutoAssign}`);
  const res = await axios.post(
    API_URL,
    { ...batch, skipAutoAssign },
    {
      headers: { Authorization: `Bearer ${jwt}` },
    },
  );
  return res.data.batch;
};

export const updateBatch = async (
  batch: Batch,
  jwt: string,
): Promise<Batch> => {
  const res = await axios.put(
    buildApiUrl(API_ENDPOINTS.INSTRUCTOR.BATCH_BY_ID(batch.id)),
    batch,
    {
      headers: { Authorization: `Bearer ${jwt}` },
    },
  );
  return res.data;
};

export const deleteBatch = async (id: string, jwt: string): Promise<void> => {
  await axios.delete(buildApiUrl(API_ENDPOINTS.INSTRUCTOR.BATCH_BY_ID(id)), {
    headers: { Authorization: `Bearer ${jwt}` },
  });
};
