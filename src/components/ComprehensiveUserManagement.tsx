"use client";
import React, { useMemo, useState, useEffect } from "react";
import {
  FaEdit,
  FaTrash,
  FaPlus,
  FaSearch,
  FaFilter,
  FaUsers,
  FaSpinner,
  FaSyncAlt,
  FaDownload,
  FaUpload,
  FaChartBar,
  FaTrashAlt,
  FaBuilding,
  FaTimes,
} from "react-icons/fa";
import {
  useAdminStore,
  AdminUser,
  InstructorUser,
  StudentUser,
  UserRole,
  getOrgs,
} from "@/store/adminStore";
import { useToast } from "./ToastContext";
import UserModal from "./UserModal";
import UserForm from "./UserForm";
import ConfirmModal from "./ConfirmModal";
import { CreateUserRequest, UpdateUserRequest, userApi } from "@/api/adminApi";

// Union type for all user types
type CombinedUser = AdminUser | InstructorUser | StudentUser;

interface UserManagementProps {
  type?: "college-admins" | "instructors" | "students" | "all";
}

const UserManagement: React.FC<UserManagementProps> = ({ type = "all" }) => {
  const {
    admins,
    instructors,
    students,
    search,
    collegeFilter,
    statusFilter,
    loading,
    error,
    setSearch,
    setOrgFilter,
    setRoleFilter,
    addUser,
    deleteUser,
    editUser,
    fetchUsers,
  } = useAdminStore();

  const { showToast } = useToast();

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<CombinedUser | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [userStats, setUserStats] = useState<{
    totalUsers: number;
    students: number;
    instructors: number;
    collegeAdmins: number;
    breakdown: {
      students: string;
      instructors: string;
      collegeAdmins: string;
    };
  } | null>(null);
  const [bulkUploadData, setBulkUploadData] = useState<string>("");
  const [showBulkUpload, setShowBulkUpload] = useState(false);

  // Get all users based on type
  const getAllUsersByType = (): CombinedUser[] => {
    switch (type) {
      case "college-admins":
        return admins;
      case "instructors":
        return instructors;
      case "students":
        return students;
      case "all":
      default:
        return [...admins, ...instructors, ...students];
    }
  };

  const allUsers = getAllUsersByType();

  // Map type to UserRole
  const roleMap: Record<
    UserManagementProps["type"] & string,
    UserRole | "All"
  > = {
    "college-admins": "college_admin",
    instructors: "instructor",
    students: "student",
    all: "All",
  };

  const userRole = roleMap[type];

  // Fetch users on mount
  useEffect(() => {
    const getUsers = async () => {
      try {
        await fetchUsers(userRole === "All" ? "All" : userRole);
      } catch {
        showToast("error", "Failed to fetch users");
      }
    };
    getUsers();
  }, [fetchUsers, userRole, showToast]);

  // Show error toast when error state changes
  useEffect(() => {
    if (error) {
      showToast("error", error);
    }
  }, [error, showToast]);

  // Handle refresh users
  const handleRefreshUsers = async () => {
    try {
      await fetchUsers(userRole === "All" ? "All" : userRole);
      showToast("success", "Users refreshed successfully");
    } catch (err) {
      console.error("Failed to refresh users:", err);
      showToast("error", "Failed to refresh users");
    }
  };

  // Filtered users
  const filteredUsers = useMemo(() => {
    return allUsers.filter((user) => {
      const matchesSearch =
        search.trim() === "" ||
        user.name.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase());

      const matchesOrg =
        collegeFilter === "All Organizations" || user.college === collegeFilter;

      const matchesStatus =
        statusFilter === "All" || user.status === statusFilter;

      return matchesSearch && matchesOrg && matchesStatus;
    });
  }, [allUsers, search, collegeFilter, statusFilter]);

  // Get user stats
  const fetchUserStats = async () => {
    try {
      const stats = await userApi.getUserStats();
      setUserStats(stats.stats);
      setIsStatsModalOpen(true);
    } catch (err) {
      console.error("Failed to fetch user statistics:", err);
      showToast("error", "Failed to fetch user statistics");
    }
  };

  // Handle user selection
  const handleUserSelect = (userId: string, isSelected: boolean) => {
    const newSelectedUsers = new Set(selectedUsers);
    if (isSelected) {
      newSelectedUsers.add(userId);
    } else {
      newSelectedUsers.delete(userId);
    }
    setSelectedUsers(newSelectedUsers);
  };

  // Handle select all
  const handleSelectAll = (isSelected: boolean) => {
    if (isSelected) {
      const allUserIds = filteredUsers.map((user) => String(user.id));
      setSelectedUsers(new Set(allUserIds));
    } else {
      setSelectedUsers(new Set());
    }
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    try {
      const userIds = Array.from(selectedUsers);
      await userApi.bulkDeleteUsers(userIds);

      // Refresh the user list
      await fetchUsers(userRole === "All" ? "All" : userRole);

      setSelectedUsers(new Set());
      setIsBulkDeleteModalOpen(false);
      showToast("success", `${userIds.length} users deleted successfully`);
    } catch (err) {
      console.error("Failed to delete selected users:", err);
      showToast("error", "Failed to delete selected users");
    }
  };

  // Handle bulk upload
  const handleBulkUpload = async () => {
    try {
      if (!bulkUploadData.trim()) {
        showToast("error", "Please enter user data");
        return;
      }

      const lines = bulkUploadData.trim().split("\n");
      const users: CreateUserRequest[] = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const parts = line.split(",").map((part) => part.trim());
        if (parts.length < 4) {
          showToast(
            "error",
            `Invalid format at line ${
              i + 1
            }. Expected: username,email,org_id,role`
          );
          return;
        }

        const [username, email, org_id] = parts;
        users.push({
          username,
          email,
          password: "defaultPassword123", // You might want to generate random passwords
          org_id,
          batch_id: [],
        });
      }

      const result = await userApi.bulkCreateUsers(users);
      showToast(
        "success",
        `${result.created} users created successfully. ${result.errors} errors.`
      );

      if (result.errorDetails.length > 0) {
        console.log("Bulk upload errors:", result.errorDetails);
      }

      setBulkUploadData("");
      setShowBulkUpload(false);
      await fetchUsers(userRole === "All" ? "All" : userRole);
    } catch (err) {
      console.error("Failed to bulk upload users:", err);
      showToast("error", "Failed to bulk upload users");
    }
  };

  // Export users to CSV
  const exportToCSV = () => {
    const headers = ["Name", "Email", "Role", "College", "Status", "Join Date"];
    const csvContent = [
      headers.join(","),
      ...filteredUsers.map((user) =>
        [
          user.name,
          user.email,
          user.role,
          user.college,
          user.status,
          user.joinDate,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `users_${type}_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Get role badge
  const getRoleBadge = (userRole: string) => {
    const roleConfig = {
      "First Year": { color: "bg-blue-100 text-blue-800", label: "1st Year" },
      "Second Year": {
        color: "bg-green-100 text-green-800",
        label: "2nd Year",
      },
      "Third Year": {
        color: "bg-yellow-100 text-yellow-800",
        label: "3rd Year",
      },
      "Fourth Year": {
        color: "bg-orange-100 text-orange-800",
        label: "4th Year",
      },
      "Final Year": { color: "bg-red-100 text-red-800", label: "Final Year" },
      "Senior Professor": {
        color: "bg-purple-100 text-purple-800",
        label: "Sr. Prof",
      },
      "Associate Professor": {
        color: "bg-indigo-100 text-indigo-800",
        label: "Assoc. Prof",
      },
      "Assistant Professor": {
        color: "bg-pink-100 text-pink-800",
        label: "Asst. Prof",
      },
      "College Admin": { color: "bg-gray-100 text-gray-800", label: "Admin" },
      "Deputy Admin": { color: "bg-gray-100 text-gray-800", label: "Deputy" },
      "Academic Head": { color: "bg-gray-100 text-gray-800", label: "Head" },
    };

    const config = roleConfig[userRole as keyof typeof roleConfig] || {
      color: "bg-gray-100 text-gray-800",
      label: userRole,
    };
    return (
      <span
        className={`px-2 py-1 text-xs font-medium rounded-full ${config.color}`}
      >
        {config.label}
      </span>
    );
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    return status === "Active" ? (
      <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
        Active
      </span>
    ) : (
      <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
        Inactive
      </span>
    );
  };

  // Get title based on type
  const getTitle = () => {
    switch (type) {
      case "college-admins":
        return "College Administrators";
      case "instructors":
        return "Instructors";
      case "students":
        return "Students";
      case "all":
      default:
        return "All Users";
    }
  };

  // Get icon based on type
  const getIcon = () => {
    return <FaUsers className="w-6 h-6 text-white" />;
  };

  // Get college options
  const collegeOptions = useMemo(() => {
    const orgs = getOrgs().map((org) => org.name);
    return ["All Organizations", ...orgs];
  }, []);

  // Handle edit user
  const handleEditUser = (user: CombinedUser) => {
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };

  // Handle delete user
  const handleDeleteUser = (user: CombinedUser) => {
    setSelectedUser(user);
    setIsDeleteModalOpen(true);
  };

  // Handle submit user
  const handleSubmitUser = async (
    userData: UpdateUserRequest | CreateUserRequest
  ) => {
    try {
      const mappedRole =
        type === "college-admins"
          ? "college_admin"
          : type === "instructors"
          ? "instructor"
          : type === "students"
          ? "student"
          : "student";

      if (selectedUser && isEditModalOpen) {
        // Edit mode
        const updateData: UpdateUserRequest = {
          ...(userData as UpdateUserRequest),
        };
        await editUser(String(selectedUser.id), updateData, mappedRole);
        showToast("success", "User updated successfully");
        setIsEditModalOpen(false);
      } else {
        // Add mode
        const createData: CreateUserRequest = {
          ...(userData as CreateUserRequest),
        };
        await addUser(createData, mappedRole);
        showToast("success", "User created successfully");
        setIsAddModalOpen(false);
      }
      setSelectedUser(null);
    } catch (err) {
      console.error("Error submitting user:", err);
      // Error is handled by store's toast
    }
  };

  // Handle confirm delete
  const handleConfirmDelete = async () => {
    if (selectedUser) {
      try {
        const mappedRole =
          type === "college-admins"
            ? "college_admin"
            : type === "instructors"
            ? "instructor"
            : type === "students"
            ? "student"
            : "student";

        await deleteUser(String(selectedUser.id), mappedRole);
        showToast("success", "User deleted successfully");
        setIsDeleteModalOpen(false);
        setSelectedUser(null);
      } catch (err) {
        console.error("Error deleting user:", err);
        // Error is handled by store's toast
      }
    }
  };

  // Close modals
  const closeModals = () => {
    setIsAddModalOpen(false);
    setIsEditModalOpen(false);
    setIsDeleteModalOpen(false);
    setIsBulkDeleteModalOpen(false);
    setIsStatsModalOpen(false);
    setSelectedUser(null);
  };

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
            {getIcon()}
          </div>
          <div>
            <h2 className="text-3xl font-bold text-gray-800">{getTitle()}</h2>
            <p className="text-gray-600">
              Manage and monitor{" "}
              {type === "all" ? "all users" : type.replace("-", " ")}
            </p>
          </div>
        </div>

        <div className="flex space-x-3">
          {/* Statistics Button */}
          <button
            className="flex items-center space-x-2 px-4 py-2 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 transition-all duration-200 shadow-lg hover:shadow-xl"
            onClick={fetchUserStats}
          >
            <FaChartBar className="w-4 h-4" />
            <span>Statistics</span>
          </button>

          {/* Export Button */}
          <button
            className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-all duration-200 shadow-lg hover:shadow-xl"
            onClick={exportToCSV}
          >
            <FaDownload className="w-4 h-4" />
            <span>Export</span>
          </button>

          {/* Bulk Upload Button */}
          <button
            className="flex items-center space-x-2 px-4 py-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-all duration-200 shadow-lg hover:shadow-xl"
            onClick={() => setShowBulkUpload(true)}
          >
            <FaUpload className="w-4 h-4" />
            <span>Bulk Upload</span>
          </button>

          {/* Refresh Button */}
          <button
            className="flex items-center space-x-2 px-4 py-2 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-all duration-200 shadow-lg hover:shadow-xl"
            onClick={handleRefreshUsers}
            disabled={loading}
          >
            {loading ? (
              <FaSpinner className="w-4 h-4 animate-spin" />
            ) : (
              <FaSyncAlt className="w-4 h-4" />
            )}
            <span>Refresh</span>
          </button>

          {/* Add User Button */}
          {type !== "all" && (
            <button
              className="flex items-center space-x-3 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              onClick={() => setIsAddModalOpen(true)}
              disabled={loading}
            >
              {loading ? (
                <FaSpinner className="w-4 h-4 animate-spin" />
              ) : (
                <FaPlus className="w-4 h-4" />
              )}
              <span className="font-medium">Add New User</span>
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-gray-50"
            />
          </div>

          {/* College Filter */}
          <div className="relative">
            <FaBuilding className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <select
              value={collegeFilter}
              onChange={(e) => setOrgFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-gray-50 appearance-none"
            >
              {collegeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="relative">
            <FaFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <select
              value={statusFilter}
              onChange={(e) =>
                setRoleFilter(e.target.value as "All" | "Active" | "Inactive")
              }
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-gray-50 appearance-none"
            >
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          {/* Bulk Actions */}
          <div className="flex space-x-2">
            {selectedUsers.size > 0 && (
              <button
                className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all duration-200"
                onClick={() => setIsBulkDeleteModalOpen(true)}
              >
                <FaTrashAlt className="w-4 h-4" />
                <span>Delete ({selectedUsers.size})</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <FaSpinner className="w-8 h-8 text-blue-500 animate-spin" />
          <span className="ml-3 text-lg text-gray-600">Loading users...</span>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left">
                    <input
                      type="checkbox"
                      checked={
                        filteredUsers.length > 0 &&
                        selectedUsers.size === filteredUsers.length
                      }
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="rounded"
                    />
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    College
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Join Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedUsers.has(String(user.id))}
                        onChange={(e) =>
                          handleUserSelect(String(user.id), e.target.checked)
                        }
                        className="rounded"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {getRoleBadge(user.role)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {user.college}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {user.joinDate}
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(user.status)}</td>
                    <td className="px-6 py-4 flex gap-2">
                      <button
                        className="text-blue-500 hover:text-blue-700 p-1 hover:bg-blue-50 rounded transition-colors"
                        onClick={() => handleEditUser(user)}
                        disabled={loading}
                      >
                        <FaEdit />
                      </button>
                      <button
                        className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded transition-colors"
                        onClick={() => handleDeleteUser(user)}
                        disabled={loading}
                      >
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredUsers.length === 0 && !loading && (
            <div className="text-center py-12">
              <FaUsers className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No users found
              </h3>
              <p className="text-gray-500">
                {search ||
                collegeFilter !== "All Organizations" ||
                statusFilter !== "All"
                  ? "Try adjusting your search or filter criteria."
                  : "Get started by adding your first user."}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {isAddModalOpen && (
        <UserModal
          isOpen={isAddModalOpen}
          onClose={closeModals}
          title="Add New User"
        >
          <UserForm
            onSubmit={(formData) => {
              // Ensure password is never null
              const safeData = {
                ...formData,
                password:
                  formData.password === null || formData.password === undefined
                    ? undefined
                    : formData.password,
              };
              // Call the async handler, but ignore the returned promise
              void handleSubmitUser(
                safeData as UpdateUserRequest | CreateUserRequest
              );
            }}
            onCancel={closeModals}
          />
        </UserModal>
      )}

      {isEditModalOpen && selectedUser && (
        <UserModal
          isOpen={isEditModalOpen}
          onClose={closeModals}
          title="Edit User"
        >
          <UserForm
            user={selectedUser}
            onSubmit={(userData) => {
              const safeUserData = {
                ...userData,
                email: userData.email ?? "",
                password:
                  userData.password === null ? undefined : userData.password,
              };
              handleSubmitUser(safeUserData);
            }}
            onCancel={closeModals}
            isEdit
          />
        </UserModal>
      )}

      {isDeleteModalOpen && selectedUser && (
        <ConfirmModal
          isOpen={isDeleteModalOpen}
          onClose={closeModals}
          onConfirm={handleConfirmDelete}
          title="Delete User"
          message={`Are you sure you want to delete "${selectedUser.name}"? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          loading={loading}
        />
      )}

      {isBulkDeleteModalOpen && (
        <ConfirmModal
          isOpen={isBulkDeleteModalOpen}
          onClose={closeModals}
          onConfirm={handleBulkDelete}
          title="Bulk Delete Users"
          message={`Are you sure you want to delete ${selectedUsers.size} selected users? This action cannot be undone.`}
          confirmText="Delete All"
          cancelText="Cancel"
          loading={loading}
        />
      )}

      {/* User Statistics Modal */}
      {isStatsModalOpen && userStats && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">
                User Statistics
              </h3>
              <button
                onClick={closeModals}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FaTimes className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {userStats.totalUsers}
                  </div>
                  <div className="text-sm text-gray-600">Total Users</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {userStats.students}
                  </div>
                  <div className="text-sm text-gray-600">Students</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {userStats.instructors}
                  </div>
                  <div className="text-sm text-gray-600">Instructors</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    {userStats.collegeAdmins}
                  </div>
                  <div className="text-sm text-gray-600">Admins</div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-lg font-semibold text-gray-800">
                    {userStats.breakdown.students}%
                  </div>
                  <div className="text-sm text-gray-600">Students</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-lg font-semibold text-gray-800">
                    {userStats.breakdown.instructors}%
                  </div>
                  <div className="text-sm text-gray-600">Instructors</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-lg font-semibold text-gray-800">
                    {userStats.breakdown.collegeAdmins}%
                  </div>
                  <div className="text-sm text-gray-600">Admins</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Upload Modal */}
      {showBulkUpload && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">
                Bulk Upload Users
              </h3>
              <button
                onClick={() => setShowBulkUpload(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FaTimes className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  Enter user data in CSV format (one user per line):
                </p>
                <p className="text-xs text-gray-500 mb-4">
                  Format: username,email,org_id,role
                </p>
                <textarea
                  value={bulkUploadData}
                  onChange={(e) => setBulkUploadData(e.target.value)}
                  placeholder="john_doe,john@example.com,org123,student&#10;jane_smith,jane@example.com,org123,instructor"
                  className="w-full h-40 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowBulkUpload(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkUpload}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  Upload Users
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
