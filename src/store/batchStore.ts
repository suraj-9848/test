import { create } from "zustand";
import { createBatch, updateBatch as apiUpdateBatch, deleteBatch as apiDeleteBatch, fetchAllBatches } from "@/api/batchApi";

export interface Batch {
  id: number;
  name: string;
  description: string;
  org_id: string;
}

interface BatchStoreState {
  batches: Batch[];
  fetchBatches: (jwt: string) => Promise<void>;
  addBatch: (batch: Omit<Batch, "id">, jwt: string) => Promise<void>;
  updateBatch: (batch: Batch, jwt: string) => Promise<void>;
  deleteBatch: (id: number, jwt: string) => Promise<void>;
  getBatchById: (id: number) => Batch | undefined;
}

export const useBatchStore = create<BatchStoreState>((set, get) => ({
  batches: [],
  fetchBatches: async (jwt: string) => {
    const batches = await fetchAllBatches(jwt);
    set({ batches });
  },
  addBatch: async (batch, jwt) => {
    await createBatch(batch, jwt);
    await get().fetchBatches(jwt); // Always refresh after add
  },
  updateBatch: async (batch, jwt) => {
    await apiUpdateBatch(batch, jwt);
    await get().fetchBatches(jwt); // Always refresh after update
  },
  deleteBatch: async (id, jwt) => {
    await apiDeleteBatch(id, jwt);
    await get().fetchBatches(jwt); // Always refresh after delete
  },
  getBatchById: (id) => get().batches.find((b) => b.id === id),
}));