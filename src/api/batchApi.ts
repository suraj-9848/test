import axios from "axios";
import { Batch } from "../store/batchStore";

const baseUrl = process.env.NEXT_PUBLIC_BACKEND_BASE_URL || "";
const API_URL = `${baseUrl}/api/instructor/batches`;

export const fetchAllBatches = async (jwt: string): Promise<Batch[]> => {
  const res = await axios.get(API_URL, {
    headers: { Authorization: `Bearer ${jwt}` },
  });
  // The backend returns { message: "Fetched batches", batches: Batch[] }
  return res.data.batches || [];
};

export const fetchBatch = async (id: string, jwt: string): Promise<Batch> => {
  const res = await axios.get(`${API_URL}/${id}`, {
    headers: { Authorization: `Bearer ${jwt}` },
  });
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
  const res = await axios.put(`${API_URL}/${batch.id}`, batch, {
    headers: { Authorization: `Bearer ${jwt}` },
  });
  return res.data;
};

export const deleteBatch = async (id: string, jwt: string): Promise<void> => {
  await axios.delete(`${API_URL}/${id}`, {
    headers: { Authorization: `Bearer ${jwt}` },
  });
};
