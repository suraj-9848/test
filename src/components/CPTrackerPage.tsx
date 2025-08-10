"use client";

import { CPTrackerProfile } from "@/types/cptracker";
import { CPTrackerAPI } from "@/utils/cpTrackerAPI";
import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import CPTrackerConnectionForm from "./CPTrackerConnectionForm";

export default function CPTrackerPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [editProfile, setEditProfile] = useState<CPTrackerProfile | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    setError("");
    try {
      console.log("[CPTracker] Fetching leaderboard...");
      const data = await CPTrackerAPI.getCPTrackerLeaderboard();
      console.log("[CPTracker] API response:", data);
      setUsers(data);
    } catch (error: any) {
      setError(error.message || "Failed to fetch users");
      toast.error(error.message || "Failed to fetch users");
      console.error("[CPTracker] API error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRefreshAll = async () => {
    setRefreshing(true);
    try {
      await CPTrackerAPI.refreshAllCPTrackers();
      toast.success("CP Tracker data refreshed for all users");
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message || "Failed to refresh all CP Tracker data");
    } finally {
      setRefreshing(false);
    }
  };

  const handleEdit = async (user: any) => {
    setEditLoading(true);
    try {
      const userId = user.user?.id || user.id;
      const profile = await CPTrackerAPI.getCPTrackerByUserId(userId);
      setSelectedUser(user);
      setEditProfile(profile);
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch user profile");
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async (user: any) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this user's CP Tracker profile?",
      )
    )
      return;
    const userId = user.user?.id || user.id;
    setEditLoading(true);
    try {
      await CPTrackerAPI.deleteCPTrackerByUserId(userId);
      toast.success("CP Tracker profile deleted successfully");
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete profile");
    } finally {
      setEditLoading(false);
    }
  };

  const handleUpdate = async (formData: any, refresh?: boolean) => {
    if (!selectedUser) return;
    setEditLoading(true);
    try {
      const userId = selectedUser.user?.id || selectedUser.id;
      await CPTrackerAPI.updateCPTrackerByUserId(userId, formData);
      toast.success("Profile updated successfully");
      if (refresh) {
        // Call refresh API for this user
        await CPTrackerAPI.refreshCPTrackerByUserId(userId);
        toast.success("CP Tracker data refreshed for this user");
      }
      setEditProfile(null);
      setSelectedUser(null);
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile");
    } finally {
      setEditLoading(false);
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
          <h1 className="text-3xl font-bold">CP Tracker</h1>
          <div className="flex gap-3 items-center w-full md:w-auto">
            <input
              type="text"
              placeholder="Search by name or username..."
              className="border rounded-lg px-4 py-2 w-full md:w-64 shadow-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button
              className="px-5 py-2 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 transition flex items-center gap-2 shadow"
              onClick={handleRefreshAll}
              disabled={refreshing}
            >
              {refreshing ? "Refreshing..." : "Refresh All"}
            </button>
          </div>
        </div>
      </div>
      {loading ? (
        <div>Loading...</div>
      ) : error ? (
        <div className="text-red-600 font-semibold mb-4">{error}</div>
      ) : (
        <div className="overflow-x-auto">
          <div className="overflow-x-auto rounded-xl shadow-lg bg-white">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100 text-gray-800">
                <tr>
                  <th className="p-4 font-bold">Rank</th>
                  <th className="p-4 font-bold">Name</th>
                  <th className="p-4 font-bold">Performance Score</th>
                  <th className="p-4 font-bold">LC Score</th>
                  <th className="p-4 font-bold">CF Score</th>
                  <th className="p-4 font-bold">CC Score</th>
                  <th className="p-4 font-bold">AtCoder Score</th>
                  <th className="p-4 font-bold">LC Total</th>
                  <th className="p-4 font-bold">LC Contest Solved</th>
                  <th className="p-4 font-bold">LC Practice Solved</th>
                  <th className="p-4 font-bold">LC Rating</th>
                  <th className="p-4 font-bold">LC Contests</th>
                  <th className="p-4 font-bold">LC Last Contest</th>
                  <th className="p-4 font-bold">CF Rating</th>
                  <th className="p-4 font-bold">CF Contests</th>
                  <th className="p-4 font-bold">CF Solved</th>
                  <th className="p-4 font-bold">CC Rating</th>
                  <th className="p-4 font-bold">CC Contests</th>
                  <th className="p-4 font-bold">CC Solved</th>
                  <th className="p-4 font-bold">Last Updated</th>
                  <th className="p-4 font-bold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users
                  .filter((user) => {
                    const name = user.user?.username || user.name || "";
                    return name.toLowerCase().includes(search.toLowerCase());
                  })
                  .map((user) => (
                    <tr
                      key={user.user?.id || user.id}
                      className="hover:bg-gray-50 transition"
                    >
                      <td className="p-4 text-center">{user.rank ?? "-"}</td>
                      <td className="p-4 font-semibold text-gray-900">
                        {user.user?.username || user.name || "-"}
                      </td>
                      <td className="p-4 text-center">
                        {user.performance_score ?? "-"}
                      </td>
                      <td className="p-4 text-center">
                        {user.leetcode_score ?? "-"}
                      </td>
                      <td className="p-4 text-center">
                        {user.codeforces_score ?? "-"}
                      </td>
                      <td className="p-4 text-center">
                        {user.codechef_score ?? "-"}
                      </td>
                      <td className="p-4 text-center">
                        {user.atcoder_score ?? "-"}
                      </td>
                      <td className="p-4 text-center">
                        {user.leetcode_total_problems ?? "-"}
                      </td>
                      <td className="p-4 text-center">
                        {user.leetcode_contest_solved_count ?? "-"}
                      </td>
                      <td className="p-4 text-center">
                        {user.leetcode_practice_solved_count ?? "-"}
                      </td>
                      <td className="p-4 text-center">
                        {user.leetcode_current_rating ?? "-"}
                      </td>
                      <td className="p-4 text-center">
                        {user.leetcode_contests_participated ?? "-"}
                      </td>
                      <td className="p-4 text-center">
                        {user.leetcode_last_contest_name
                          ? `${user.leetcode_last_contest_name} (${user.leetcode_last_contest_date ? new Date(user.leetcode_last_contest_date).toLocaleDateString() : ""})`
                          : "-"}
                      </td>
                      <td className="p-4 text-center">
                        {user.codeforces_rating ?? "-"}
                      </td>
                      <td className="p-4 text-center">
                        {user.codeforces_contests_participated ?? "-"}
                      </td>
                      <td className="p-4 text-center">
                        {user.codeforces_problems_solved ?? "-"}
                      </td>
                      <td className="p-4 text-center">
                        {user.codechef_rating ?? "-"}
                      </td>
                      <td className="p-4 text-center">
                        {user.codechef_contests_participated ?? "-"}
                      </td>
                      <td className="p-4 text-center">
                        {user.codechef_problems_solved ?? "-"}
                      </td>
                      <td className="p-4 text-center">
                        {user.last_updated
                          ? new Date(user.last_updated).toLocaleString()
                          : "-"}
                      </td>
                      <td className="p-4 flex gap-2 justify-center">
                        <button
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold shadow"
                          onClick={() => handleEdit(user)}
                        >
                          Edit
                        </button>
                        <button
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold shadow"
                          onClick={() => handleDelete(user)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {selectedUser && editProfile && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 shadow-2xl w-full max-w-xl border border-gray-200">
            <h2 className="text-2xl font-extrabold mb-6 text-gray-900">
              Edit{" "}
              {(selectedUser.user?.username || selectedUser.name) +
                "'s CP Profile"}
            </h2>
            <div className="mb-6">
              <CPTrackerConnectionForm
                initialData={editProfile}
                onSubmit={handleUpdate}
                loading={editLoading}
                onCancel={() => {
                  setSelectedUser(null);
                  setEditProfile(null);
                }}
                className="space-y-4"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
