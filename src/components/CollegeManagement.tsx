"use client";
import React, { useMemo, useState } from "react";
import {
  FaTrash,
  FaEdit,
  FaPlus,
  FaSearch,
  FaBuilding,
  FaSpinner,
  FaUsers,
} from "react-icons/fa";
import {
  useAdminStore,
  AdminUser,
  InstructorUser,
  StudentUser,
  UserStatus,
  UserRole,
  getOrgs,
} from "@/store/adminStore";
import { useToast } from "./ToastContext";
import UserModal from "./UserModal";
import UserForm from "./UserForm";
import ConfirmModal from "./ConfirmModal";
import { CreateUserRequest, UpdateUserRequest } from "@/api/adminApi";

// Union type for all user types
type CombinedUser = AdminUser | InstructorUser | StudentUser;

interface CollegeManagementProps {
  type: "college-admins" | "instructors" | "students";
}

const CollegeManagement: React.FC<CollegeManagementProps> = ({ type }) => {
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
  const [selectedUser, setSelectedUser] = useState<CombinedUser | null>(null);

  // Map type to UserRole
  const roleMap: Record<CollegeManagementProps["type"], UserRole> = {
    "college-admins": "college_admin",
    instructors: "instructor",
    students: "student",
  };

  const userRole = roleMap[type];

  // Fetch users on mount
  React.useEffect(() => {
    const getUsers = async () => {
      try {
        await fetchUsers(userRole);
      } catch (err) {
        showToast("error", "Failed to fetch users");
      }
    };
    getUsers();
  }, [fetchUsers, userRole, showToast]);

  // Show error toast when error state changes
  React.useEffect(() => {
    if (error) {
      showToast("error", error);
    }
  }, [error, showToast]);

  // Select users based on type
  const users = useMemo(() => {
    switch (type) {
      case "college-admins":
        return admins as AdminUser[];
      case "instructors":
        return instructors as InstructorUser[];
      case "students":
        return students as StudentUser[];
      default:
        return [];
    }
  }, [type, admins, instructors, students]);

  // Filter users
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        search.trim() === "" ||
        user.name.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase());
      const matchesCollege =
        collegeFilter === "All Organizations" || user.college === collegeFilter;
      const matchesStatus = statusFilter === "All" || user.status === statusFilter;
      return matchesSearch && matchesCollege && matchesStatus;
    });
  }, [users, search, collegeFilter, statusFilter]);

  // Get title for header
  const getTitle = () => {
    switch (type) {
      case "college-admins":
        return "College Administrators";
      case "instructors":
        return "Instructors & Faculty";
      case "students":
        return "Students";
      default:
        return "Users";
    }
  };

  // Get icon for header
  const getIcon = () => {
    switch (type) {
      case "college-admins":
        return <FaBuilding className="w-6 h-6 text-white" />;
      case "instructors":
        return <FaUsers className="w-6 h-6 text-white" />;
      case "students":
        return <FaUsers className="w-6 h-6 text-white" />;
      default:
        return <FaUsers className="w-6 h-6 text-white" />;
    }
  };

  // Get status badge
  const getStatusBadge = (status: UserStatus) => {
    return status === "Active" ? (
      <span className="px-3 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
        Active
      </span>
    ) : (
      <span className="px-3 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
        Inactive
      </span>
    );
  };

  // Get college options from getOrgs
  const collegeOptions = useMemo(() => {
    const orgs = getOrgs().map((org) => org.name);
    return ["All Organizations", ...orgs];
  }, []);

  // Handle add user
  const handleAddUser = () => {
    setIsAddModalOpen(true);
  };

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
  const handleSubmitUser = async (userData: UpdateUserRequest | CreateUserRequest) => {
    try {
      if (selectedUser && isEditModalOpen) {
        // Edit mode
        const updateData: UpdateUserRequest = {
          ...(userData as UpdateUserRequest),
        };
        await editUser(String(selectedUser.id), updateData, userRole);
        showToast("success", "User updated successfully");
        setIsEditModalOpen(false);
      } else {
        // Add mode
        const createData: CreateUserRequest = {
          ...(userData as CreateUserRequest),
        };
        await addUser(createData, userRole);
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
        await deleteUser(String(selectedUser.id), userRole);
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
            <p className="text-gray-600">Manage and monitor {type.replace("-", " ")}</p>
          </div>
        </div>
        <button
          className="flex items-center space-x-3 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
          onClick={handleAddUser}
          disabled={loading}
        >
          {loading ? (
            <FaSpinner className="w-4 h-4 animate-spin" />
          ) : (
            <FaPlus className="w-4 h-4" />
          )}
          <span className="font-medium">
            Add New {type === "college-admins" ? "Admin" : type === "instructors" ? "Instructor" : "Student"}
          </span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-200">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="flex items-center border rounded-lg overflow-hidden">
              <FaSearch className="w-5 h-5 text-gray-400 ml-3" />
              <input
                type="text"
                placeholder={`Search ${type.replace("-", " ")}`}
                className="flex-1 py-2 px-3 text-sm text-gray-700 placeholder-gray-400 border-none focus:ring-0 focus:outline-none"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* College Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">College/Organization</label>
            <div className="relative">
              <select
                className="block appearance-none w-full bg-white border border-gray-300 text-gray-700 py-2 px-4 pr-8 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={collegeFilter}
                onChange={(e) => setOrgFilter(e.target.value)}
              >
                {collegeOptions.map((org) => (
                  <option key={org} value={org} className="text-gray-900">
                    {org}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                <svg
                  className="w-5 h-5 text-gray-400"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 9l3 3-3 3m8-6l3 3-3 3"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <div className="relative">
              <select
                className="block appearance-none w-full bg-white border border-gray-300 text-gray-700 py-2 px-4 pr-8 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={statusFilter}
                onChange={(e) => setRoleFilter(e.target.value as "All" | UserStatus)}
              >
                <option value="All" className="text-gray-900">
                  All
                </option>
                <option value="Active" className="text-gray-900">
                  Active
                </option>
                <option value="Inactive" className="text-gray-900">
                  Inactive
                </option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                <svg
                  className="w-5 h-5 text-gray-400"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 9l3 3-3 3m8-6l3 3-3 3"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Extra space holder */}
          <div className="hidden sm:block"></div>
        </div>
      </div>

      {/* Table */}
      {loading && users.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center space-x-3">
            <FaSpinner className="w-8 h-8 text-blue-500 animate-spin" />
            <span className="text-lg font-medium text-gray-600">Loading {type.replace("-", " ")}...</span>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-blue-50 to-purple-50">
                <tr>
                  {["#", "Name", "Email", "Role", "College", "Join Date", "Status", "Actions"].map((heading) => (
                    <th
                      key={heading}
                      className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user, index) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{index + 1}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-bold">{user.name.charAt(0)}</span>
                        </div>
                        <span className="text-sm font-medium text-gray-900">{user.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 text-xs font-medium bg-gray-200 text-gray-800 rounded-full">
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{user.college}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{user.joinDate}</td>
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
              <h3 className="text-lg font-medium text-gray-900 mb-2">No {type.replace("-", " ")} found</h3>
              <p className="text-gray-500">
                {search || collegeFilter !== "All Organizations" || statusFilter !== "All"
                  ? "Try adjusting your search or filter criteria."
                  : `Get started by adding your first ${type === "college-admins" ? "admin" : type === "instructors" ? "instructor" : "student"}.`}
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
          title={`Add ${type === "college-admins" ? "Admin" : type === "instructors" ? "Instructor" : "Student"}`}
        >
          <UserForm onSubmit={handleSubmitUser} onCancel={closeModals} />
        </UserModal>
      )}

      {isEditModalOpen && selectedUser && (
        <UserModal
          isOpen={isEditModalOpen}
          onClose={closeModals}
          title={`Edit ${type === "college-admins" ? "Admin" : type === "instructors" ? "Instructor" : "Student"}`}
        >
          <UserForm
            user={selectedUser}
            onSubmit={(userData) => {
              // Ensure email is never null and password is never null for type compatibility
              const safeUserData = {
                ...userData,
                email: userData.email ?? "",
                password: userData.password === null ? undefined : userData.password,
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
    </div>
  );
};

export default CollegeManagement;