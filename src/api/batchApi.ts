import axios from "axios";
import { Batch } from "../store/batchStore";

const baseUrl = process.env.NEXT_PUBLIC_BACKEND_BASE_URL || "";
const API_URL = `${baseUrl}/api/instructor/batches`;

export const fetchAllBatches = async (jwt: string): Promise<Batch[]> => {
  const res = await axios.get(API_URL, {
    headers: { Authorization: `Bearer ${jwt}` }
  });
  return res.data;
};

export const fetchBatch = async (id: number, jwt: string): Promise<Batch> => {
  const res = await axios.get(`${API_URL}/${id}`, {
    headers: { Authorization: `Bearer ${jwt}` }
  });
  return res.data;
};

export const createBatch = async (batch: Omit<Batch, "id">, jwt: string): Promise<Batch> => {
  const res = await axios.post(API_URL, batch, {
    headers: { Authorization: `Bearer ${jwt}` }
  });
  return res.data;
};

export const updateBatch = async (batch: Batch, jwt: string): Promise<Batch> => {
  const res = await axios.put(`${API_URL}/${batch.id}`, batch, {
    headers: { Authorization: `Bearer ${jwt}` }
  });
  return res.data;
};

export const deleteBatch = async (id: number, jwt: string): Promise<void> => {
  await axios.delete(`${API_URL}/${id}`, {
    headers: { Authorization: `Bearer ${jwt}` }
  });
};