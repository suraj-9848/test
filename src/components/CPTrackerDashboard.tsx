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
  const [pagination, setPagination] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [editUser, setEditUser] = useState<CPTrackerLeaderboard | null>(null);
  const [editProfile, setEditProfile] = useState<CPTrackerProfile | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  useEffect(() => {
    fetchLeaderboard(1);
  }, [pageSize]);

  const fetchLeaderboard = async (page = 1) => {
    setLoading(true);
    try {
      const result = await CPTrackerAPI.getCPTrackerLeaderboard({
        page,
        limit: pageSize,
      });
      setLeaderboard(result.leaderboard);
      setPagination(result.pagination);
      setCurrentPage(page);
    } catch (error) {
      setLeaderboard([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  };

  const filteredLeaderboard = leaderboard.filter((u) =>
    u.user.username.toLowerCase().includes(search.toLowerCase()),
  );

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
      {/* Search Bar and Page Size */}
      <div className="mb-4 flex items-center gap-2 justify-between">
        <div className="flex items-center gap-2">
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
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Show:</span>
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="px-2 py-1 border rounded text-sm"
          >
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <span className="text-sm text-gray-600">entries</span>
        </div>
      </div>
      {/* Leaderboard Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border rounded shadow">
          <thead>
            <tr>
              <th className="px-4 py-2">Rank</th>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Profile</th>
              <th className="px-4 py-2">Performance Score</th>
              <th className="px-4 py-2">LC Score</th>
              <th className="px-4 py-2">CF Score</th>
              <th className="px-4 py-2">CC Score</th>
              <th className="px-4 py-2">AtCoder Score</th>
              <th className="px-4 py-2">LC Total</th>
              <th className="px-4 py-2">CF Solved</th>
              <th className="px-4 py-2">CC Solved</th>
              <th className="px-4 py-2">AtCoder Solved</th>
              <th className="px-4 py-2">Total Solved</th>
              <th className="px-4 py-2">Platforms</th>
              <th className="px-4 py-2">Last Updated</th>
              <th className="px-4 py-2">Edit</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={16} className="text-center py-8">
                  Loading...
                </td>
              </tr>
            ) : filteredLeaderboard.length === 0 ? (
              <tr>
                <td colSpan={16} className="text-center py-8">
                  No data
                </td>
              </tr>
            ) : (
              filteredLeaderboard.map((user) => (
                <tr key={user.user.id}>
                  <td className="px-4 py-2">{user.rank}</td>
                  <td className="px-4 py-2">{user.user.username}</td>
                  <td className="px-4 py-2">
                    {user.user.profile_picture && (
                      <img
                        src={user.user.profile_picture}
                        alt={user.user.username}
                        className="w-8 h-8 rounded-full mx-auto"
                      />
                    )}
                  </td>
                  <td className="px-4 py-2">{user.performance_score}</td>
                  <td className="px-4 py-2">{user.leetcode_score}</td>
                  <td className="px-4 py-2">{user.codeforces_score}</td>
                  <td className="px-4 py-2">{user.codechef_score}</td>
                  <td className="px-4 py-2">{user.atcoder_score}</td>
                  <td className="px-4 py-2">{user.leetcode_total_problems}</td>
                  <td className="px-4 py-2">
                    {user.codeforces_problems_solved}
                  </td>
                  <td className="px-4 py-2">{user.codechef_problems_solved}</td>
                  <td className="px-4 py-2">{user.atcoder_problems_solved}</td>
                  <td className="px-4 py-2">{user.total_solved_count}</td>
                  <td className="px-4 py-2">{user.platforms_connected}</td>
                  <td className="px-4 py-2">
                    {user.last_updated
                      ? new Date(user.last_updated).toLocaleString()
                      : ""}
                  </td>
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
      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            Showing {(pagination.currentPage - 1) * pagination.itemsPerPage + 1}{" "}
            to{" "}
            {Math.min(
              pagination.currentPage * pagination.itemsPerPage,
              pagination.totalItems,
            )}{" "}
            of {pagination.totalItems} entries
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => fetchLeaderboard(pagination.currentPage - 1)}
              disabled={!pagination.hasPreviousPage}
              className="px-3 py-1 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <div className="px-3 py-1 text-sm font-medium text-gray-700">
              Page {pagination.currentPage} of {pagination.totalPages}
            </div>
            <button
              onClick={() => fetchLeaderboard(pagination.currentPage + 1)}
              disabled={!pagination.hasNextPage}
              className="px-3 py-1 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
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
