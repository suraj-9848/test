import { create } from "zustand";
import {
  createBatch,
  updateBatch as apiUpdateBatch,
  deleteBatch as apiDeleteBatch,
  fetchAllBatches,
} from "@/api/batchApi";

export interface Batch {
  id: string;
  name: string;
  description: string;
  org_id: string;
}

interface BatchStoreState {
  batches: Batch[];
  fetchBatches: () => Promise<void>;
  addBatch: (batch: Omit<Batch, "id">) => Promise<Batch>;
  updateBatch: (batch: Batch) => Promise<void>;
  deleteBatch: (id: string) => Promise<void>;
  getBatchById: (id: string) => Batch | undefined;
}

export const useBatchStore = create<BatchStoreState>((set, get) => ({
  batches: [],
  fetchBatches: async () => {
    const batches = await fetchAllBatches();
    set({ batches });
  },
  addBatch: async (batch) => {
    const newBatch = await createBatch(batch, true); // Set skipAutoAssign to true
    await get().fetchBatches(); // Always refresh after add
    return newBatch; // Return the new batch for redirection
  },
  updateBatch: async (batch) => {
    await apiUpdateBatch(batch);
    await get().fetchBatches(); // Always refresh after update
  },
  deleteBatch: async (id) => {
    await apiDeleteBatch(id);
    await get().fetchBatches(); // Always refresh after delete
  },
  getBatchById: (id) => get().batches.find((b) => b.id === id),
}));
