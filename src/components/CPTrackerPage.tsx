"use client";

import { CPTrackerProfile } from "@/types/cptracker";
import { CPTrackerAPI } from "@/utils/cpTrackerAPI";
import { useState, useEffect, useCallback } from "react";
import { toast } from "react-hot-toast";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  RefreshCw,
} from "lucide-react";
import CPTrackerConnectionForm from "./CPTrackerConnectionForm";

interface PaginationMetadata {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  offset: number;
}

interface LeaderboardFilters {
  batch?: string;
  platform?: string;
  sortBy?: string;
  sortOrder?: string;
  limit?: number;
  offset?: number;
  page?: number;
}

const Pagination: React.FC<{
  pagination: PaginationMetadata;
  onPageChange: (page: number) => void;
}> = ({ pagination, onPageChange }) => {
  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;

    if (pagination.totalPages <= maxPagesToShow) {
      for (let i = 1; i <= pagination.totalPages; i++) {
        pages.push(i);
      }
    } else {
      const start = Math.max(1, pagination.currentPage - 2);
      const end = Math.min(pagination.totalPages, start + maxPagesToShow - 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }

    return pages;
  };

  const startItem = (pagination.currentPage - 1) * pagination.itemsPerPage + 1;
  const endItem = Math.min(
    pagination.currentPage * pagination.itemsPerPage,
    pagination.totalItems,
  );

  return (
    <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center bg-white">
      <div className="text-sm text-gray-600">
        Showing {startItem} to {endItem} of {pagination.totalItems} entries
      </div>

      <div className="flex items-center space-x-2">
        <button
          onClick={() => onPageChange(pagination.currentPage - 1)}
          disabled={!pagination.hasPreviousPage}
          className="px-3 py-1 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Previous
        </button>

        {getPageNumbers().map((pageNum) => (
          <button
            key={pageNum}
            onClick={() => onPageChange(pageNum)}
            className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
              pageNum === pagination.currentPage
                ? "bg-blue-600 text-white"
                : "text-gray-700 bg-gray-100 hover:bg-gray-200"
            }`}
          >
            {pageNum}
          </button>
        ))}

        <button
          onClick={() => onPageChange(pagination.currentPage + 1)}
          disabled={!pagination.hasNextPage}
          className="px-3 py-1 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
        >
          Next
          <ChevronRight className="h-4 w-4 ml-1" />
        </button>
      </div>
    </div>
  );
};

export default function CPTrackerPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [pagination, setPagination] = useState<PaginationMetadata | null>(null);
  const [search, setSearch] = useState("");
  const [batchFilter, setBatchFilter] = useState("");
  const [platformFilter, setPlatformFilter] = useState("");
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string>("");
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [editProfile, setEditProfile] = useState<CPTrackerProfile | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  const fetchUsers = useCallback(
    async (page = 1, showLoader = true) => {
      if (showLoader) setLoading(true);
      else setRefreshing(true);
      setError("");

      try {
        console.log("[CPTracker] Fetching leaderboard...", {
          page,
          pageSize,
          batchFilter,
          platformFilter,
        });

        const filters: LeaderboardFilters = {
          page,
          limit: pageSize,
        };

        if (batchFilter) filters.batch = batchFilter;
        if (platformFilter) filters.platform = platformFilter;

        const data = await CPTrackerAPI.getCPTrackerLeaderboard(filters);
        console.log("[CPTracker] API response:", data);

        setUsers(data.leaderboard || []);
        setPagination(data.pagination || null);
        setCurrentPage(page);
      } catch (error: any) {
        setError(error.message || "Failed to fetch users");
        toast.error(error.message || "Failed to fetch users");
        console.error("[CPTracker] API error:", error);
        setUsers([]);
        setPagination(null);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [pageSize, batchFilter, platformFilter],
  );

  useEffect(() => {
    fetchUsers(1);
  }, [fetchUsers]);

  // Client-side search filtering for current page
  useEffect(() => {
    if (!search.trim()) {
      setFilteredUsers(users);
    } else {
      setFilteredUsers(
        users.filter((user) => {
          const name = user.user?.username || user.name || "";
          return name.toLowerCase().includes(search.toLowerCase());
        }),
      );
    }
  }, [search, users]);

  const handlePageChange = (page: number) => {
    fetchUsers(page, false);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
  };

  const handleFilterChange = () => {
    setCurrentPage(1);
    fetchUsers(1);
  };

  const handleRefreshAll = async () => {
    setRefreshing(true);
    try {
      await CPTrackerAPI.refreshAllCPTrackers();
      toast.success("CP Tracker data refreshed for all users");
      fetchUsers(currentPage, false);
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
      fetchUsers(currentPage, false);
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
        await CPTrackerAPI.refreshCPTrackerByUserId(userId);
        toast.success("CP Tracker data refreshed for this user");
      }
      setEditProfile(null);
      setSelectedUser(null);
      fetchUsers(currentPage, false);
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile");
    } finally {
      setEditLoading(false);
    }
  };

  const displayData = search.trim() ? filteredUsers : users;

  return (
    <div className="p-8 max-w-full">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">CP Tracker</h1>
        <button
          className="px-5 py-2 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 transition flex items-center gap-2 shadow"
          onClick={handleRefreshAll}
          disabled={refreshing}
        >
          <RefreshCw
            className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
          />
          {refreshing ? "Refreshing..." : "Refresh All"}
        </button>
      </div>

      {/* Filters and Controls */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by username..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Show:</span>
            <select
              value={pageSize}
              onChange={(e) => handlePageSizeChange(Number(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>

        {pagination && (
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div>Total: {pagination.totalItems} entries</div>
            <div>
              Page {pagination.currentPage} of {pagination.totalPages}
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
          <span className="ml-3 text-gray-600">Loading CP Tracker data...</span>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <div className="text-red-800 font-semibold">{error}</div>
          <button
            onClick={() => fetchUsers(currentPage)}
            className="mt-2 text-red-600 hover:text-red-800 underline"
          >
            Try again
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-gray-800">
                <tr>
                  <th className="p-4 font-bold text-left">Rank</th>
                  <th className="p-4 font-bold text-left">Name</th>
                  <th className="p-4 font-bold text-center">
                    Performance Score
                  </th>
                  <th className="p-4 font-bold text-center">LC Score</th>
                  <th className="p-4 font-bold text-center">CF Score</th>
                  <th className="p-4 font-bold text-center">CC Score</th>
                  <th className="p-4 font-bold text-center">AtCoder Score</th>
                  <th className="p-4 font-bold text-center">LC Total</th>
                  <th className="p-4 font-bold text-center">
                    LC Contest Solved
                  </th>
                  <th className="p-4 font-bold text-center">
                    LC Practice Solved
                  </th>
                  <th className="p-4 font-bold text-center">LC Rating</th>
                  <th className="p-4 font-bold text-center">LC Contests</th>
                  <th className="p-4 font-bold text-center">LC Last Contest</th>
                  <th className="p-4 font-bold text-center">CF Rating</th>
                  <th className="p-4 font-bold text-center">CF Contests</th>
                  <th className="p-4 font-bold text-center">CF Solved</th>
                  <th className="p-4 font-bold text-center">CC Rating</th>
                  <th className="p-4 font-bold text-center">CC Contests</th>
                  <th className="p-4 font-bold text-center">CC Solved</th>
                  <th className="p-4 font-bold text-center">Last Updated</th>
                  <th className="p-4 font-bold text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {displayData.length === 0 ? (
                  <tr>
                    <td colSpan={21} className="p-8 text-center text-gray-500">
                      {search.trim()
                        ? "No users found matching your search"
                        : "No CP Tracker data available"}
                    </td>
                  </tr>
                ) : (
                  displayData.map((user) => (
                    <tr
                      key={user.user?.id || user.id}
                      className="hover:bg-gray-50 transition"
                    >
                      <td className="p-4 text-center font-medium">
                        #{user.rank ?? "-"}
                      </td>
                      <td className="p-4 font-semibold text-gray-900">
                        <div className="flex items-center">
                          {user.user?.username || user.name || "-"}
                        </div>
                      </td>
                      <td className="p-4 text-center font-semibold text-blue-600">
                        {user.performance_score ?? "-"}
                      </td>
                      <td className="p-4 text-center text-green-600">
                        {user.leetcode_score ?? "-"}
                      </td>
                      <td className="p-4 text-center text-blue-600">
                        {user.codeforces_score ?? "-"}
                      </td>
                      <td className="p-4 text-center text-orange-600">
                        {user.codechef_score ?? "-"}
                      </td>
                      <td className="p-4 text-center text-purple-600">
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
                      <td className="p-4 text-center text-xs text-gray-500">
                        {user.last_updated
                          ? new Date(user.last_updated).toLocaleString()
                          : "-"}
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2 justify-center">
                          <button
                            className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 font-semibold shadow transition-colors"
                            onClick={() => handleEdit(user)}
                            disabled={editLoading}
                          >
                            Edit
                          </button>
                          <button
                            className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 font-semibold shadow transition-colors"
                            onClick={() => handleDelete(user)}
                            disabled={editLoading}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Component */}
          {pagination && pagination.totalPages > 1 && !search.trim() && (
            <Pagination
              pagination={pagination}
              onPageChange={handlePageChange}
            />
          )}
        </div>
      )}

      {/* Edit Modal */}
      {selectedUser && editProfile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-extrabold text-gray-900">
                Edit{" "}
                {(selectedUser.user?.username || selectedUser.name) +
                  "'s CP Profile"}
              </h2>
              <button
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                onClick={() => {
                  setSelectedUser(null);
                  setEditProfile(null);
                }}
              >
                ×
              </button>
            </div>
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
      )}
    </div>
  );
}