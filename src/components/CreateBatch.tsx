import { useSession } from "next-auth/react";
import { useBatchStore, Batch } from "../store/batchStore";
import { getBackendJwt } from "../utils/auth";
import { useEffect, useState } from "react";
import axios from "axios";
import {
  FaCheckCircle,
  FaExclamationTriangle,
  FaSpinner,
} from "react-icons/fa";
import { useSearchParams } from "next/navigation";

const CreateBatch: React.FC = () => {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const editIdFromURL = searchParams.get("editId");

  const { batches, fetchBatches, addBatch, updateBatch, deleteBatch } =
    useBatchStore();
  const [userOrgId, setUserOrgId] = useState<string>("");
  const [form, setForm] = useState<Omit<Batch, "id">>({
    name: "",
    description: "",
    org_id: "",
  });
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [backendJwt, setBackendJwt] = useState<string>("");
  const [loadingBatch, setLoadingBatch] = useState<boolean>(false);

  // Fetch user profile and set org_id
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        const jwt = await getBackendJwt();
        setBackendJwt(jwt);

        const baseUrl = process.env.NEXT_PUBLIC_BACKEND_BASE_URL || "";
        const res = await axios.get(`${baseUrl}/api/auth/me`, {
          headers: { Authorization: `Bearer ${jwt}` },
          withCredentials: true,
        });
        const orgId = res.data?.user?.org_id || "";
        setUserOrgId(orgId);
        setForm((f) => ({ ...f, org_id: orgId }));
      } catch (err) {
        console.error("Failed to fetch user profile:", err);
        setError("Failed to fetch user profile");
      } finally {
        setIsLoading(false);
      }
    };
    if (session) fetchProfile();
  }, [session]);

  // Always reset form with current org_id
  const resetForm = () =>
    setForm({ name: "", description: "", org_id: userOrgId });

  // Fetch batches after JWT is set
  useEffect(() => {
    const loadBatches = async () => {
      if (backendJwt) {
        setIsLoading(true);
        try {
          await fetchBatches(backendJwt);
        } catch (err) {
          console.error("Failed to fetch batches:", err);
          setError("Failed to load batches");
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadBatches();
  }, [backendJwt, fetchBatches]);

  // Load batch for editing if editId is provided in URL
  useEffect(() => {
    const loadBatchForEditing = async () => {
      if (!backendJwt || !editIdFromURL) return;

      setLoadingBatch(true);
      setError("");

      try {
        const baseUrl = process.env.NEXT_PUBLIC_BACKEND_BASE_URL || "";
        console.log(`Loading batch ${editIdFromURL} for editing`);

        const response = await axios.get(
          `${baseUrl}/api/instructor/batches/${editIdFromURL}`,
          {
            headers: { Authorization: `Bearer ${backendJwt}` },
          },
        );

        console.log("Batch data received:", response.data);

        // Handle both response formats - with batch wrapper or direct object
        const batchData = response.data.batch || response.data;

        if (!batchData || !batchData.name) {
          throw new Error("Invalid batch data received");
        }

        setForm({
          name: batchData.name,
          description: batchData.description || "",
          org_id: batchData.org_id || userOrgId,
        });
        setEditingId(editIdFromURL);

        console.log("Batch loaded successfully for editing");
      } catch (err: any) {
        console.error("Failed to load batch for editing:", err);
        setError(
          `Failed to load batch for editing: ${err.message || "Unknown error"}`,
        );
      } finally {
        setLoadingBatch(false);
      }
    };

    if (backendJwt && editIdFromURL) {
      loadBatchForEditing();
    }
  }, [backendJwt, editIdFromURL, userOrgId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.org_id.trim()) {
      setError("Name and Organization ID are required");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      if (editingId !== null) {
        await updateBatch({ ...form, id: editingId }, backendJwt);
        setSuccess("Batch updated successfully");

        // If we came from the batch management page (via editId URL param), go back there
        if (editIdFromURL) {
          setTimeout(() => {
            window.location.href =
              "/dashboard/instructor?section=batch-management";
          }, 1500);
        } else {
          resetForm();
          setEditingId(null);
        }
      } else {
        const newBatch = await addBatch(form, backendJwt);
        setSuccess(
          "New empty batch created successfully. Redirecting to student assignment page...",
        );

        // Redirect to batch assignment page after a short delay
        // Pass the newly created batch ID to have it pre-selected
        setTimeout(() => {
          window.location.href = `/dashboard/instructor?section=batch-assignments&batchId=${newBatch.id}`;
        }, 1500);

        resetForm();
      }
    } catch (err) {
      console.error("Failed to create/update batch:", err);
      setError("Failed to create/update batch");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (batch: Batch) => {
    setForm({
      name: batch.name,
      description: batch.description,
      org_id: batch.org_id,
    });
    setEditingId(batch.id);
    setError("");
    setSuccess("");
  };

  const handleCancel = () => {
    if (editIdFromURL) {
      // If we came from the batch management page, go back there
      window.location.href = "/dashboard/instructor?section=batch-management";
    } else {
      resetForm();
      setEditingId(null);
      setError("");
      setSuccess("");
    }
  };

  const handleDelete = async (id: string) => {
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      await deleteBatch(id, backendJwt);
      setSuccess("Batch deleted successfully");
    } catch (err) {
      console.error("Failed to delete batch:", err);
      setError("Failed to delete batch");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle the batches data format
  const batchList = Array.isArray(batches) ? batches : [];

  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-slate-200/50 shadow-lg p-8 max-w-xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-slate-900">
        {editingId ? "Edit Batch" : "Create New Batch"}
      </h2>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-2">
          <FaExclamationTriangle className="w-5 h-5" />
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg flex items-center gap-2">
          <FaCheckCircle className="w-5 h-5" />
          {success}
        </div>
      )}

      {loadingBatch ? (
        <div className="flex items-center justify-center p-8">
          <FaSpinner className="animate-spin text-blue-600 text-2xl" />
          <span className="ml-3 text-slate-700">Loading batch details...</span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <input
              placeholder="Batch Name"
              className="border border-slate-200 px-4 py-3 rounded-xl w-full focus:ring-2 focus:ring-blue-500 bg-white/80 transition"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
          </div>
          <div>
            <input
              placeholder="Batch Description"
              className="border border-slate-200 px-4 py-3 rounded-xl w-full focus:ring-2 focus:ring-blue-500 bg-white/80 transition"
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  description: e.target.value,
                }))
              }
            />
          </div>
          <div>
            <input
              placeholder="Organization ID"
              className="border border-slate-200 px-4 py-3 rounded-xl w-full bg-gray-100 text-gray-500"
              value={form.org_id}
              disabled
            />
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-all font-semibold flex items-center gap-2 disabled:bg-blue-400"
              disabled={isLoading}
            >
              {isLoading && <FaSpinner className="animate-spin" />}
              {editingId ? "Update Batch" : "Create Batch"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={handleCancel}
                className="bg-slate-200 text-slate-800 px-6 py-3 rounded-xl hover:bg-slate-300 transition-all font-semibold"
                disabled={isLoading}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      )}

      {/* Batch List */}
      <div className="mt-10">
        <h3 className="text-lg font-semibold mb-4 text-slate-800">
          All Batches
        </h3>
        {isLoading && batchList.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <FaSpinner className="animate-spin text-blue-600 text-xl" />
          </div>
        ) : batchList.length === 0 ? (
          <div className="py-8 text-center text-slate-500">
            No batches found. Create your first batch above.
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {batchList.map((batch, index) => (
              <div
                key={`batch-item-${batch.id}-${index}`}
                className="py-3 flex justify-between items-center"
              >
                <div>
                  <p className="font-semibold text-slate-800">{batch.name}</p>
                  <p className="text-sm text-slate-500">{batch.description}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(batch)}
                    className="text-blue-600 hover:text-blue-800 disabled:text-blue-400"
                    disabled={isLoading}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(batch.id)}
                    className="text-red-600 hover:text-red-800 disabled:text-red-400"
                    disabled={isLoading}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateBatch;
