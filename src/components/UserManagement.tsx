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
  FaSyncAlt, // Use FaSyncAlt instead of FaRefresh
} from "react-icons/fa";
import { useAdminStore, User, UserRole, getOrgs } from "@/store/adminStore";
import { useToast } from "./ToastContext";
import UserModal from "./UserModal";
import UserForm from "./UserForm";
import ConfirmModal from "./ConfirmModal";

const UserManagement: React.FC = () => {
  const {
    users,
    search,
    orgFilter,
    roleFilter,
    loading,
    setSearch,
    setOrgFilter,
    setRoleFilter,
    addUser,
    deleteUser,
    editUser,
    fetchUsers, // Add this method to your store
    error,
  } = useAdminStore();

  const { showToast } = useToast();

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Fetch users on component mount
  useEffect(() => {
    const getAllUsers = async () => {
      try {
        await fetchUsers();
      } catch (error) {
        console.error("Failed to fetch users:", error);
        showToast("error", "Failed to load users");
      }
    };

    getAllUsers();
  }, [fetchUsers, showToast]);

  // Show error toast when error state changes
  useEffect(() => {
    if (error) {
      showToast("error", error);
    }
  }, [error, showToast]);

  // Handle refresh users
  const handleRefreshUsers = async () => {
    try {
      await fetchUsers();
      showToast("success", "Users refreshed successfully");
    } catch (error) {
      console.error("Failed to refresh users:", error);
      showToast("error", "Failed to refresh users");
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        search.trim() === "" ||
        (user.username &&
          user.username.toLowerCase().includes(search.toLowerCase())) ||
        (user.email && user.email.toLowerCase().includes(search.toLowerCase()));

      const matchesOrg =
        orgFilter === "All Organizations" ||
        (user.org_id &&
          getOrgs().find((org) => org.id === user.org_id)?.name === orgFilter);

      const matchesRole = roleFilter === "All" || user.userRole === roleFilter;

      return matchesSearch && matchesOrg && matchesRole;
    });
  }, [users, search, orgFilter, roleFilter]);

  const getRoleBadge = (role: UserRole) => {
    const roleConfig = {
      [UserRole.STUDENT]: {
        color: "bg-blue-100 text-blue-800",
        label: "Student",
      },
      [UserRole.INSTRUCTOR]: {
        color: "bg-purple-100 text-purple-800",
        label: "Instructor",
      },
      [UserRole.COLLEGE_ADMIN]: {
        color: "bg-green-100 text-green-800",
        label: "College Admin",
      },
      [UserRole.ADMIN]: { color: "bg-red-100 text-red-800", label: "Admin" },
    };

    const config = roleConfig[role];
    return (
      <span
        className={`px-2 py-1 text-xs font-medium rounded-full ${config.color}`}
      >
        {config.label}
      </span>
    );
  };

  const getOrgName = (orgId: string | null) => {
    if (!orgId) return "No Organization";
    const org = getOrgs().find((o) => o.id === orgId);
    return org?.name || "Unknown Organization";
  };

  const orgOptions = useMemo(() => {
    const orgs = getOrgs().map((org) => org.name);
    return ["All Organizations", ...orgs];
  }, []);

  const roleOptions = [
    { value: "All", label: "All Roles" },
    { value: UserRole.STUDENT, label: "Students" },
    { value: UserRole.INSTRUCTOR, label: "Instructors" },
    { value: UserRole.COLLEGE_ADMIN, label: "College Admins" },
    { value: UserRole.ADMIN, label: "Admins" },
  ];

  const handleAddUser = () => {
    setIsAddModalOpen(true);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };

  const handleDeleteUser = (user: User) => {
    setSelectedUser(user);
    setIsDeleteModalOpen(true);
  };

  const handleSubmitUser = async (userData: any) => {
    try {
      if (selectedUser) {
        // Edit mode
        await editUser(selectedUser.id, userData, selectedUser.userRole);
        showToast("success", "User updated successfully");
        setIsEditModalOpen(false);
      } else {
        // Add mode
        await addUser(userData, userData.userRole);
        showToast("success", "User created successfully");
        setIsAddModalOpen(false);
      }
      setSelectedUser(null);
    } catch (error) {
      console.log(error);

      // Error is already handled by the store and shown via toast
    }
  };

  const handleConfirmDelete = async () => {
    if (selectedUser) {
      try {
        await deleteUser(selectedUser.id, selectedUser.userRole);
        showToast("success", "User deleted successfully");
        setIsDeleteModalOpen(false);
        setSelectedUser(null);
      } catch (error) {
        console.log(error);

        // Error is already handled by the store and shown via toast
      }
    }
  };

  const closeModals = () => {
    setIsAddModalOpen(false);
    setIsEditModalOpen(false);
    setIsDeleteModalOpen(false);
    setSelectedUser(null);
  };

  return (
    <div className="p-6 bg-white min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
            <FaUsers className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-black">User Management</h2>
            <p className="text-gray-600">Manage all users in the system</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          {/* Refresh Button */}
          <button
            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleRefreshUsers}
            disabled={loading}
            title="Refresh Users"
          >
            {loading ? (
              <FaSpinner className="w-4 h-4 animate-spin" />
            ) : (
              <FaSyncAlt className="w-4 h-4" />
            )}
            <span className="font-medium">Refresh</span>
          </button>

          {/* Add User Button */}
          <button
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleAddUser}
            disabled={loading}
          >
            {loading ? (
              <FaSpinner className="w-4 h-4 animate-spin" />
            ) : (
              <FaPlus className="w-4 h-4" />
            )}
            <span className="font-medium">Add User</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-50 rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex items-center space-x-2 mb-4">
          <FaFilter className="w-4 h-4 text-blue-600" />
          <h3 className="text-lg font-semibold text-black">Filters & Search</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <label className="block text-sm font-medium text-black mb-2">
              Search
            </label>
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search users..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white text-black"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-black mb-2">
              Organization
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-black"
              value={orgFilter}
              onChange={(e) => setOrgFilter(e.target.value)}
            >
              {orgOptions.map((org) => (
                <option key={org}>{org}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-black mb-2">
              Role
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-black"
              value={roleFilter}
              onChange={(e) =>
                setRoleFilter(e.target.value as UserRole | "All")
              }
            >
              {roleOptions.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && users.length === 0 && (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center space-x-3">
            <FaSpinner className="w-8 h-8 text-blue-500 animate-spin" />
            <span className="text-lg font-medium text-gray-600">
              Loading users...
            </span>
          </div>
        </div>
      )}

      {/* Table */}
      {!loading && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-blue-50 to-purple-50">
                <tr>
                  {[
                    "#",
                    "User",
                    "Email",
                    "Organization",
                    "Role",
                    "Actions",
                  ].map((heading) => (
                    <th
                      key={heading}
                      className="px-4 py-3 text-left text-xs font-semibold text-black uppercase tracking-wider"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user, index) => (
                  <tr
                    key={user.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3 text-sm font-medium text-black">
                      {index + 1}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-bold">
                            {user.username?.charAt(0)?.toUpperCase() || "?"}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-black">
                          {user.username || "Unknown User"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-600">
                        {user.email || "No email"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-600">
                        {getOrgName(user.org_id)}
                      </span>
                    </td>
                    <td className="px-4 py-3">{getRoleBadge(user.userRole)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEditUser(user)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Edit User"
                          disabled={loading}
                        >
                          <FaEdit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Delete User"
                          disabled={loading}
                        >
                          <FaTrash className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {filteredUsers.length === 0 && !loading && (
            <div className="text-center py-12">
              <FaUsers className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No users found
              </h3>
              <p className="text-gray-500">
                {search ||
                orgFilter !== "All Organizations" ||
                roleFilter !== "All"
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
          title="Add User"
        >
          <UserForm
            onSubmit={handleSubmitUser}
            onCancel={closeModals}
            loading={loading}
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
            onSubmit={handleSubmitUser}
            onCancel={closeModals}
            loading={loading}
          />
        </UserModal>
      )}

      {isDeleteModalOpen && selectedUser && (
        <ConfirmModal
          isOpen={isDeleteModalOpen}
          onClose={closeModals}
          onConfirm={handleConfirmDelete}
          title="Delete User"
          message={`Are you sure you want to delete "${selectedUser.username}"? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          loading={loading}
        />
      )}
    </div>
  );
};

export default UserManagement;
