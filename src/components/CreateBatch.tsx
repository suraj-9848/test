import { useSession } from "next-auth/react";
import React, { useState, useEffect } from "react";
import { useBatchStore } from "@/store/batchStore";
import axios from "axios";

const CreateBatch: React.FC = () => {
  const { data: session } = useSession();
  // Define a type for a batch and for the batches state
  type Batch = {
    id: number;
    name: string;
    description: string;
    org_id: string;
    [key: string]: any;
  };
  type BatchesState = Batch[] | { batches: Batch[] };

  const { batches, fetchBatches, addBatch, updateBatch, deleteBatch } = useBatchStore() as {
    batches: BatchesState;
    fetchBatches: (jwt: string) => void;
    addBatch: (form: any, jwt: string) => Promise<void>;
    updateBatch: (form: any, jwt: string) => Promise<void>;
    deleteBatch: (id: number, jwt: string) => Promise<void>;
  };
  const [userOrgId, setUserOrgId] = useState<string>("");
  const [form, setForm] = useState({ name: "", description: "", org_id: "" });
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [backendJwt, setBackendJwt] = useState<string>("");

  // Fetch user profile and set org_id
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_BACKEND_BASE_URL || "";
        const googleIdToken = (session as any)?.id_token;
        if (!googleIdToken) {
          setError("No Google ID token found");
          return;
        }

        const loginRes = await axios.post(
          `${baseUrl}/api/auth/admin-login`,
          {},
          {
            headers: { Authorization: `Bearer ${googleIdToken}` },
            withCredentials: true,
          }
        );
        const backendJwt = loginRes.data.token;
        setBackendJwt(backendJwt); // <-- Store backend JWT

        const res = await axios.get(`${baseUrl}/api/auth/me`, {
          headers: { Authorization: `Bearer ${backendJwt}` },
          withCredentials: true,
        });
        const orgId = res.data?.user?.org_id || "";
        setUserOrgId(orgId);
        setForm((f) => ({ ...f, org_id: orgId }));
      } catch (err) {
        setError("Failed to fetch user profile");
      }
    };
    if (session) fetchProfile();
  }, [session]);

  // Always reset form with current org_id
  const resetForm = () => setForm({ name: "", description: "", org_id: userOrgId });

  // Fetch batches after JWT is set
  useEffect(() => {
    if (backendJwt) {
      fetchBatches(backendJwt);
    }
  }, [backendJwt]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.org_id.trim()) {
      setError("Name and Org ID are required");
      return;
    }
    try {
      if (editingId !== null) {
        await updateBatch({ ...form, id: editingId }, backendJwt);
      } else {
        await addBatch(form, backendJwt);
      }
      resetForm();
      setEditingId(null);
      setError("");
    } catch (err: any) {
      setError("Failed to create/update batch");
    }
  };

  const handleEdit = (batch: any) => {
    setForm({
      name: batch.name,
      description: batch.description,
      org_id: batch.org_id,
    });
    setEditingId(batch.id);
    setError("");
  };

  const handleCancel = () => {
    resetForm();
    setEditingId(null);
    setError("");
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteBatch(id, backendJwt);
    } catch (err) {
      setError("Failed to delete batch");
    }
  };

  const batchList = Array.isArray(batches)
    ? batches
    : (batches && Array.isArray(batches.batches))
      ? batches.batches
      : [];

  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-slate-200/50 shadow-lg p-8 max-w-xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-slate-900">
        {editingId ? "Edit Batch" : "Create New Batch"}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block mb-1 font-semibold text-slate-700">
            Batch Name *
          </label>
          <input
            className="border border-slate-200 px-4 py-3 rounded-xl w-full focus:ring-2 focus:ring-blue-500 bg-white/80 transition"
            value={form.name}
            onChange={(e) =>
              setForm((f) => ({ ...f, name: e.target.value }))
            }
            required
          />
        </div>
        <div>
          <label className="block mb-1 font-semibold text-slate-700">
            Description
          </label>
          <input
            className="border border-slate-200 px-4 py-3 rounded-xl w-full focus:ring-2 focus:ring-blue-500 bg-white/80 transition"
            value={form.description}
            onChange={(e) =>
              setForm((f) => ({ ...f, description: e.target.value }))
            }
          />
        </div>
        <div>
          <label className="block mb-1 font-semibold text-slate-700">
            Org ID *
          </label>
          <input
            className="border border-slate-200 px-4 py-3 rounded-xl w-full bg-gray-100 text-gray-500"
            value={form.org_id}
            disabled
          />
        </div>
        {error && <div className="text-red-600">{error}</div>}
        <div className="flex gap-3">
          <button
            type="submit"
            className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition"
            disabled={!userOrgId}
          >
            {editingId ? "Update Batch" : "Create Batch"}
          </button>
          {editingId && (
            <button
              type="button"
              className="border border-slate-300 text-slate-700 px-6 py-3 rounded-xl hover:bg-slate-50 transition"
              onClick={handleCancel}
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* Batch List */}
      <div className="mt-10">
        <h3 className="text-lg font-semibold mb-4 text-slate-800">
          All Batches
        </h3>
        <div className="divide-y divide-slate-200">
          {batchList.length === 0 && (
            <div className="text-slate-500 py-6 text-center">
              No batches created yet.
            </div>
          )}
          {batchList.sort((a, b) => a.name.localeCompare(b.name)).map((batch, idx) => (
            <div
              key={batch.id ?? idx}
              className="flex items-center justify-between py-4"
            >
              <div>
                <div className="font-medium text-slate-900">{batch.name}</div>
                <div className="text-slate-500 text-sm">
                  {batch.description}
                </div>
                <div className="text-xs text-slate-400">
                  Org: {batch.org_id}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  className="px-3 py-1 rounded-lg text-blue-600 hover:bg-blue-50 font-medium"
                  onClick={() => handleEdit(batch)}
                >
                  Edit
                </button>
                <button
                  className="px-3 py-1 rounded-lg text-red-600 hover:bg-red-50 font-medium"
                  onClick={() => handleDelete(batch.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CreateBatch;
