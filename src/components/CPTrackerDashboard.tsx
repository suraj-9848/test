import React, { useEffect, useState } from "react";

import { CPTrackerAPI } from "../utils/cpTrackerAPI";
import { CPTrackerLeaderboard, CPTrackerProfile } from "../types/cptracker";
import CPTrackerConnectionForm from "./CPTrackerConnectionForm";

interface CPTrackerDashboardProps {
  userRole?: string;
}

const CPTrackerDashboard: React.FC<CPTrackerDashboardProps> = ({
  userRole,
}) => {
  const [leaderboard, setLeaderboard] = useState<CPTrackerLeaderboard[]>([]);
  const [search, setSearch] = useState("");
  const [filteredLeaderboard, setFilteredLeaderboard] = useState<
    CPTrackerLeaderboard[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [editUser, setEditUser] = useState<CPTrackerLeaderboard | null>(null);
  const [editProfile, setEditProfile] = useState<CPTrackerProfile | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  useEffect(() => {
    if (!search) {
      setFilteredLeaderboard(leaderboard);
    } else {
      setFilteredLeaderboard(
        leaderboard.filter((u) =>
          u.user.username.toLowerCase().includes(search.toLowerCase()),
        ),
      );
    }
  }, [search, leaderboard]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const data = await CPTrackerAPI.getCPTrackerLeaderboard();
      if (Array.isArray(data)) {
        setLeaderboard(data);
      } else {
        setLeaderboard([]);
      }
    } catch (error) {
      setLeaderboard([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = async (userId: string) => {
    setEditLoading(true);
    setEditUser(leaderboard.find((u) => u.user.id === userId) || null);
    try {
      const profile = await CPTrackerAPI.getCPTrackerByUserId(userId);
      setEditProfile(profile);
    } catch (error) {
      setEditProfile(null);
    } finally {
      setEditLoading(false);
    }
  };

  const handleEditSubmit = async (formData: any) => {
    if (!editUser) return;
    setFormLoading(true);
    try {
      await CPTrackerAPI.updateCPTrackerByUserId(editUser.user.id, {
        ...formData,
        active_platforms: formData.active_platforms,
      });
      setEditUser(null);
      setEditProfile(null);
      fetchLeaderboard();
    } catch (error: any) {
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">
        CPTracker Dashboard ({userRole})
      </h2>
      {/* Search Bar */}
      <div className="mb-4 flex items-center gap-2">
        <input
          type="text"
          placeholder="Search by username..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border px-2 py-1 rounded"
        />
        <button
          className="bg-blue-500 text-white px-3 py-1 rounded"
          onClick={() => setSearch(search)}
        >
          Search
        </button>
        {search && (
          <button
            className="ml-2 text-sm text-gray-600 underline"
            onClick={() => setSearch("")}
          >
            Clear
          </button>
        )}
      </div>
      {/* Leaderboard Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border rounded shadow">
          <thead>
            <tr>
              <th className="px-4 py-2">Rank</th>
              <th className="px-4 py-2">Username</th>
              <th className="px-4 py-2">Score</th>
              <th className="px-4 py-2">LeetCode</th>
              <th className="px-4 py-2">Codeforces</th>
              <th className="px-4 py-2">CodeChef</th>
              <th className="px-4 py-2">AtCoder</th>
              <th className="px-4 py-2">Edit</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="text-center py-8">
                  Loading...
                </td>
              </tr>
            ) : filteredLeaderboard.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-8">
                  No data
                </td>
              </tr>
            ) : (
              filteredLeaderboard.map((user) => (
                <tr key={user.user.id}>
                  <td className="px-4 py-2">{user.rank}</td>
                  <td className="px-4 py-2">{user.user.username}</td>
                  <td className="px-4 py-2">{user.performance_score}</td>
                  <td className="px-4 py-2">{user.leetcode_score}</td>
                  <td className="px-4 py-2">{user.codeforces_score}</td>
                  <td className="px-4 py-2">{user.codechef_score}</td>
                  <td className="px-4 py-2">{user.atcoder_score}</td>
                  <td className="px-4 py-2">
                    <button
                      className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                      onClick={() => handleEditClick(user.user.id)}
                      disabled={
                        editLoading && editUser?.user.id === user.user.id
                      }
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      {editUser && editProfile && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-lg relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
              onClick={() => {
                setEditUser(null);
                setEditProfile(null);
              }}
            >
              &times;
            </button>
            <h3 className="text-xl font-bold mb-4">
              Edit CP Profile: {editUser.user.username}
            </h3>
            <CPTrackerConnectionForm
              initialData={editProfile}
              onSubmit={handleEditSubmit}
              loading={formLoading}
              onCancel={() => {
                setEditUser(null);
                setEditProfile(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default CPTrackerDashboard;
