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
  RecruiterUser,
  UserRole,
} from "@/store/adminStore";
import { useToast } from "./ToastContext";
import UserModal from "./UserModal";
import UserForm from "./UserForm";
import ConfirmModal from "./ConfirmModal";
import {
  CreateUserRequest,
  UpdateUserRequest,
  userApi,
  organizationApi,
} from "@/api/adminApi";

// Union type for all user types
type CombinedUser = AdminUser | InstructorUser | StudentUser | RecruiterUser;

interface UserManagementProps {
  type?: "admins" | "instructors" | "students" | "recruiters" | "all";
}

const UserManagement: React.FC<UserManagementProps> = ({ type = "all" }) => {
  const {
    admins,
    instructors,
    students,
    recruiters,
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
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [bulkUploadErrors, setBulkUploadErrors] = useState<string[]>([]);
  const [validationResults, setValidationResults] = useState<{
    valid: any[];
    invalid: any[];
  } | null>(null);

  // Get all users based on type
  const getAllUsersByType = (): CombinedUser[] => {
    switch (type) {
      case "admins":
        return admins;
      case "instructors":
        return instructors;
      case "students":
        return students;
      case "recruiters":
        return recruiters;
      case "all":
      default:
        return [...admins, ...instructors, ...students, ...recruiters];
    }
  };

  const allUsers = getAllUsersByType();

  // Map type to UserRole
  const roleMap: Record<
    UserManagementProps["type"] & string,
    UserRole | "All"
  > = {
    admins: "admin",
    instructors: "instructor",
    students: "student",
    recruiters: "recruiter",
    all: "All",
  };

  const userRole = roleMap[type];

  // Fetch users on mount
  useEffect(() => {
    const getUsers = async () => {
      try {
        // Always fetch all users to ensure all sections have data
        await fetchUsers("All");
      } catch {
        showToast("error", "Failed to fetch users");
      }
    };
    getUsers();
  }, [fetchUsers, showToast]); // Removed userRole dependency to always fetch all users

  // Show error toast when error state changes
  useEffect(() => {
    if (error) {
      showToast("error", error);
    }
  }, [error, showToast]);

  // Handle refresh users
  const handleRefreshUsers = async () => {
    try {
      // Always refresh all users to ensure all sections have data
      await fetchUsers("All");
      showToast("success", "Users refreshed successfully");
    } catch (err) {
      console.error("Failed to refresh users:", err);
      showToast("error", "Failed to refresh users");
    }
  };

  // Filtered users
  const filteredUsers = useMemo(() => {
    return allUsers.filter((user) => {
      // Filter by search text
      const matchesSearch =
        search.trim() === "" ||
        (user.name
          ? user.name.toLowerCase().includes(search.toLowerCase())
          : false) ||
        (user.email
          ? user.email.toLowerCase().includes(search.toLowerCase())
          : false);

      // Filter by organization
      let matchesOrg = collegeFilter === "All Organizations";
      if (!matchesOrg && user.college) {
        // Check if the organization name matches or if it's one of the problematic values that should match "Unknown"
        const invalidOrgs = ["bruuh", "CMRCET", "NaN", "undefined", "null"];
        const isInvalidOrg = invalidOrgs.includes(user.college);

        matchesOrg =
          user.college === collegeFilter ||
          (collegeFilter === "Unknown Organization" && isInvalidOrg);
      }

      // Filter by status
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

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        const csvText = e.target?.result as string;
        setBulkUploadData(csvText);
        validateCSVData(csvText);
      };
      reader.readAsText(file);
    }
  };

  // Validate CSV data
  const validateCSVData = (csvText: string) => {
    if (!csvText.trim()) {
      setValidationResults(null);
      setBulkUploadErrors([]);
      return;
    }

    try {
      const lines = csvText.trim().split("\n");
      const users: any[] = [];
      const errors: string[] = [];

      // Skip header if present
      const dataLines = lines[0].toLowerCase().includes("username")
        ? lines.slice(1)
        : lines;

      for (let i = 0; i < dataLines.length; i++) {
        const line = dataLines[i].trim();
        if (!line) continue;

        const parts = line
          .split(",")
          .map((part) => part.trim().replace(/"/g, ""));

        if (parts.length < 4) {
          errors.push(
            `Line ${
              i + 1
            }: Invalid format. Expected: username,email,org_id,role`,
          );
          continue;
        }

        const [username, email, org_id, role, ...batches] = parts;

        // Validate fields
        const lineErrors: string[] = [];
        if (!username || username.length < 3) {
          lineErrors.push("Username must be at least 3 characters");
        }
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          lineErrors.push("Valid email is required");
        }
        if (!org_id) {
          lineErrors.push("Organization ID is required");
        }
        if (!role) {
          lineErrors.push("Role is required");
        }
        if (
          !["admin", "instructor", "student", "recruiter"].includes(
            role.toLowerCase(),
          )
        ) {
          lineErrors.push(
            "Role must be one of: admin, instructor, student, recruiter",
          );
        }

        if (lineErrors.length > 0) {
          errors.push(`Line ${i + 1}: ${lineErrors.join(", ")}`);
        } else {
          users.push({
            username,
            email,
            org_id,
            role: role.toLowerCase(),
            batch_id: batches.filter((b) => b.length > 0),
          });
        }
      }

      setValidationResults({
        valid: users,
        invalid: errors.map((error) => ({ error })),
      });
      setBulkUploadErrors(errors);
    } catch (error) {
      setBulkUploadErrors(["Failed to parse CSV data"]);
      setValidationResults(null);
    }
  };

  // Handle bulk upload
  const handleBulkUpload = async () => {
    try {
      if (!validationResults || validationResults.valid.length === 0) {
        showToast("error", "No valid users to upload");
        return;
      }

      if (bulkUploadErrors.length > 0) {
        showToast("error", "Please fix validation errors before uploading");
        return;
      }

      // Convert to the format expected by the backend
      const users = validationResults.valid.map((user) => ({
        username: user.username,
        email: user.email,
        password: generateRandomPassword(),
        org_id: user.org_id,
        batch_id: user.batch_id || [],
        userRole: user.role, // Backend expects 'userRole' field
      }));

      const result = await userApi.bulkCreateUsers(users);

      showToast(
        "success",
        `${result.created} users created successfully${
          result.errors > 0 ? `. ${result.errors} errors occurred.` : "."
        }`,
      );

      if (result.errorDetails && result.errorDetails.length > 0) {
        console.log("Bulk upload errors:", result.errorDetails);
        // Show first few errors to user
        const errorMessages = result.errorDetails
          .slice(0, 3)
          .map((error: any) => `User ${error.index + 1}: ${error.error}`);
        if (result.errorDetails.length > 3) {
          errorMessages.push(
            `... and ${result.errorDetails.length - 3} more errors`,
          );
        }
        showToast("error", errorMessages.join("\n"));
      }

      setBulkUploadData("");
      setUploadFile(null);
      setValidationResults(null);
      setBulkUploadErrors([]);
      setShowBulkUpload(false);
      await fetchUsers(userRole === "All" ? "All" : userRole);
    } catch (err: any) {
      console.error("Failed to bulk upload users:", err);
      showToast("error", err.message || "Failed to bulk upload users");
    }
  };

  // Generate random password
  const generateRandomPassword = (length: number = 12): string => {
    const charset =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  };

  // Download sample CSV
  const downloadSampleCSV = () => {
    const sampleData = [
      ["username", "email", "org_id", "role", "batch_id"],
      ["john_doe", "john@example.com", "org123", "student", "batch1"],
      ["jane_smith", "jane@example.com", "org123", "instructor", ""],
      ["admin_user", "admin@example.com", "org123", "admin", ""],
      ["recruiter_user", "recruiter@example.com", "org123", "recruiter", ""],
    ];

    const csvContent = sampleData.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "sample_users.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export users to CSV
  const exportToCSV = () => {
    const headers = ["Name", "Email", "Role", "College", "Status", "Join Date"];
    const csvContent = [
      headers.join(","),
      ...filteredUsers.map((user) =>
        [
          user.name || "Unknown",
          user.email,
          user.role,
          user.college,
          user.status,
          user.joinDate,
        ].join(","),
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

  // Get role badge - display actual user roles, not display roles
  const getRoleBadge = (user: CombinedUser) => {
    // Use the actual userRole from database instead of the mapped display role
    const userRole = user.userRole;

    const roleConfig = {
      student: {
        color: "bg-blue-100 text-blue-800",
        label: "Student",
      },
      instructor: {
        color: "bg-purple-100 text-purple-800",
        label: "Instructor",
      },
      admin: {
        color: "bg-red-100 text-red-800",
        label: "Admin",
      },
      college_admin: {
        color: "bg-green-100 text-green-800",
        label: "College Admin",
      },
      recruiter: {
        color: "bg-orange-100 text-orange-800",
        label: "Recruiter",
      },
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
      case "admins":
        return "Administrators";
      case "instructors":
        return "Instructors";
      case "students":
        return "Students";
      case "recruiters":
        return "Recruiters";
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
  const [collegeOptions, setCollegeOptions] = useState<string[]>([
    "All Organizations",
  ]);

  // Fetch organizations
  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        const response = await organizationApi.getAll();
        console.log("Fetched organizations:", response.orgs);

        // Make sure we have unique org names and filter out invalid values
        const uniqueOrgs = new Map();
        response.orgs.forEach((org: { id: string; name: string }) => {
          if (org.id && org.name && org.name.trim() !== "") {
            // Avoid using problematic keys like 'bruuh', 'CMRCET', 'NaN'
            if (
              !["bruuh", "CMRCET", "NaN", "undefined", "null"].includes(
                org.name,
              )
            ) {
              uniqueOrgs.set(org.id, org.name);
            } else {
              console.warn(
                `Skipping problematic organization name: ${org.name}`,
              );
            }
          }
        });

        // Convert to array and add "All Organizations" at the beginning
        const orgOptions = [
          "All Organizations",
          ...Array.from(uniqueOrgs.values()),
        ];
        console.log("Setting college options:", orgOptions);
        setCollegeOptions(orgOptions);
      } catch (error) {
        console.error("Error fetching organizations:", error);
        showToast("error", "Failed to fetch organizations");
      }
    };

    fetchOrganizations();
  }, [showToast]);

  // Handle edit user
  const handleEditUser = (user: CombinedUser) => {
    console.log("Selected user for edit:", user);
    console.log("User ID type:", typeof user.id, "Value:", user.id);
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
    userData: UpdateUserRequest | CreateUserRequest,
  ) => {
    try {
      // Use the role from the form data instead of mapping from page type
      const formRole = (userData as any).userRole || (userData as any).role;

      // Validate that we have a role
      if (!formRole) {
        showToast("error", "Please select a role for the user");
        return;
      }

      // Use the actual role from the form, not the page type
      const mappedRole = formRole as UserRole;

      if (selectedUser && isEditModalOpen) {
        // Edit mode
        const updateData: UpdateUserRequest = {
          ...(userData as UpdateUserRequest),
        };

        // Enhanced validation for user ID before submitting
        // Important: ensure we're using the original string UUID, not converting it to a number
        const userId = String(selectedUser.id);
        console.log(
          "User ID when submitting edit:",
          userId,
          "Original type:",
          typeof selectedUser.id,
        );

        if (
          !userId ||
          userId === "NaN" ||
          userId === "undefined" ||
          userId === "null"
        ) {
          showToast("error", "Invalid user ID. Please try again.");
          console.error("Invalid user ID:", userId);
          return;
        }

        // Log details of the update operation
        console.log(
          `Submitting edit for user with ID: ${userId}, role: ${mappedRole}`,
          updateData,
        );
        console.log(`User data being updated:`, selectedUser);

        try {
          // Show loading toast to indicate operation is in progress
          showToast(
            "success",
            `Updating user ${selectedUser.name || "Unknown"}...`,
          );

          // Call the editUser function with the validated ID and actual role from form
          await editUser(userId, updateData, mappedRole);

          // If successful, show success toast and close modal
          showToast(
            "success",
            `User ${selectedUser.name || "Unknown"} updated successfully`,
          );
          setIsEditModalOpen(false);

          // Refresh the user list to show updated data
          await fetchUsers(userRole === "All" ? "All" : userRole);
        } catch (apiError) {
          console.error("API error updating user:", apiError);

          // Enhanced error handling with more specific messages
          if (apiError instanceof Error) {
            if (
              apiError.message.includes("404") ||
              apiError.message.includes("not found")
            ) {
              showToast(
                "error",
                `User not found. The user ID ${userId} may no longer exist.`,
              );
            } else if (apiError.message.includes("validation")) {
              showToast("error", `Validation error: ${apiError.message}`);
            } else {
              showToast("error", `Error updating user: ${apiError.message}`);
            }
          } else {
            showToast(
              "error",
              "Failed to update user. Please check the user ID and try again.",
            );
          }
          return;
        }
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
      // Show toast with error message
      showToast(
        "error",
        err instanceof Error ? err.message : "Failed to submit user",
      );
    }
  };

  // Handle confirm delete
  const handleConfirmDelete = async () => {
    if (selectedUser) {
      try {
        // Use the actual user role from the database instead of mapping from page type
        const actualRole = selectedUser.userRole;

        if (!actualRole) {
          showToast("error", "Unable to determine user role for deletion");
          return;
        }

        await deleteUser(String(selectedUser.id), actualRole);
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
                {filteredUsers.map((user) => {
                  // Generate a unique key using name + email if id is invalid
                  const userKey =
                    user.id && !isNaN(Number(user.id))
                      ? `user-${user.id}`
                      : `user-${user.name || "unknown"}-${
                          user.email || "noemail"
                        }`;

                  return (
                    <tr
                      key={userKey}
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
                            {user.name
                              ? user.name.charAt(0).toUpperCase()
                              : "?"}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {user.name || "Unknown User"}
                            </div>
                            <div className="text-sm text-gray-500">
                              {user.email || "No email"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {getRoleBadge(user)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {user.college || "No organization"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {user.joinDate}
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(user.status)}
                      </td>
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
                  );
                })}
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
                safeData as UpdateUserRequest | CreateUserRequest,
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
              handleSubmitUser({
                ...safeUserData,
                userRole:
                  safeUserData.userRole === ""
                    ? undefined
                    : safeUserData.userRole,
              });
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
          message={`Are you sure you want to delete "${
            selectedUser.name || "this user"
          }"? This action cannot be undone.`}
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
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">
                Bulk Upload Users
              </h3>
              <button
                onClick={() => {
                  setShowBulkUpload(false);
                  setBulkUploadData("");
                  setUploadFile(null);
                  setValidationResults(null);
                  setBulkUploadErrors([]);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FaTimes className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              {/* Instructions */}
              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="text-sm font-medium text-blue-900 mb-2">
                  CSV Format Instructions
                </h4>
                <p className="text-sm text-blue-700 mb-2">
                  Upload a CSV file or paste CSV data with the following format:
                </p>
                <code className="text-xs bg-white p-2 rounded block">
                  username,email,org_id,role,batch_id (optional)
                </code>
                <p className="text-xs text-blue-600 mt-2">
                  Valid roles: admin, instructor, student, recruiter
                </p>
                <div className="mt-3">
                  <button
                    onClick={downloadSampleCSV}
                    className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-800 px-3 py-1 rounded transition-colors"
                  >
                    Download Sample CSV
                  </button>
                </div>
              </div>

              {/* File Upload */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload CSV File
                </label>
                <div className="flex items-center space-x-4">
                  <input
                    type="file"
                    accept=".csv,.txt"
                    onChange={handleFileUpload}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {uploadFile && (
                    <span className="text-sm text-green-600">
                      ✓ {uploadFile.name}
                    </span>
                  )}
                </div>
              </div>

              {/* Manual Input */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Or Paste CSV Data
                </label>
                <textarea
                  value={bulkUploadData}
                  onChange={(e) => {
                    setBulkUploadData(e.target.value);
                    validateCSVData(e.target.value);
                  }}
                  placeholder="username,email,org_id,role,batch_id&#10;john_doe,john@example.com,org123,student,batch1&#10;jane_smith,jane@example.com,org123,instructor"
                  className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                />
              </div>

              {/* Validation Results */}
              {validationResults && (
                <div className="mb-4 space-y-3">
                  {validationResults.valid.length > 0 && (
                    <div className="p-3 bg-green-50 rounded-lg">
                      <h4 className="text-sm font-medium text-green-900 mb-1">
                        ✓ Valid Users ({validationResults.valid.length})
                      </h4>
                      <div className="text-xs text-green-700 max-h-20 overflow-y-auto">
                        {validationResults.valid
                          .slice(0, 5)
                          .map((user, index) => (
                            <div key={index}>
                              {user.username} ({user.email}) - {user.role}
                            </div>
                          ))}
                        {validationResults.valid.length > 5 && (
                          <div className="text-green-600">
                            ... and {validationResults.valid.length - 5} more
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {bulkUploadErrors.length > 0 && (
                    <div className="p-3 bg-red-50 rounded-lg">
                      <h4 className="text-sm font-medium text-red-900 mb-1">
                        ✗ Validation Errors ({bulkUploadErrors.length})
                      </h4>
                      <div className="text-xs text-red-700 max-h-32 overflow-y-auto space-y-1">
                        {bulkUploadErrors.map((error, index) => (
                          <div
                            key={index}
                            className="border-l-2 border-red-200 pl-2"
                          >
                            {error}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-between">
                <div className="text-sm text-gray-500">
                  {validationResults && (
                    <span>
                      {validationResults.valid.length} valid users,{" "}
                      {bulkUploadErrors.length} errors
                    </span>
                  )}
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      setShowBulkUpload(false);
                      setBulkUploadData("");
                      setUploadFile(null);
                      setValidationResults(null);
                      setBulkUploadErrors([]);
                    }}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleBulkUpload}
                    disabled={
                      !validationResults ||
                      validationResults.valid.length === 0 ||
                      bulkUploadErrors.length > 0
                    }
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    Upload {validationResults?.valid.length || 0} Users
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
