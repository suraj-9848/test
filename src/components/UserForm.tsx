"use client";
import React, { useState, useEffect } from "react";
import {
  FaUser,
  FaEnvelope,
  FaUniversity,
  FaUsers,
  FaSave,
  FaTimes,
  FaPlus,
} from "react-icons/fa";
import {
  AdminUser,
  InstructorUser,
  StudentUser,
  UserRole,
  UserStatus,
  getOrgs,
  getBatches,
  AdminRole,
  InstructorRole,
  StudentRole,
} from "@/store/adminStore";

// Union type for all user types
type CombinedUser = AdminUser | InstructorUser | StudentUser;

// Common fields across all user types
interface BaseUser {
  name: string;
  email: string;
  college: string;
  batch_id?: string[];
  userRole?: UserRole;
  role: AdminRole | InstructorRole | StudentRole;
  status: UserStatus;
}

// Define form data structure
interface FormData {
  name: string;
  email: string;
  password: string | null;
  college: string;
  batch_id: string[];
  userRole: UserRole | "";
  role: AdminRole | InstructorRole | StudentRole | "";
  status: UserStatus;
}

interface UserFormProps {
  user?: CombinedUser | null;
  onSubmit: (data: Partial<FormData>) => void;
  onCancel: () => void;
  isEdit?: boolean;
}

const UserForm: React.FC<UserFormProps> = ({
  user,
  onSubmit,
  onCancel,
  isEdit = false,
}) => {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    password: null,
    college: "",
    batch_id: [],
    userRole: "",
    role: "",
    status: "Active",
  });

  const [newBatch, setNewBatch] = useState("");

  useEffect(() => {
    if (user) {
      const baseUser = user as BaseUser;
      setFormData({
        name: baseUser.name,
        email: baseUser.email,
        password: null,
        college: baseUser.college,
        batch_id: baseUser.batch_id || [],
        userRole: baseUser.userRole || "",
        role: baseUser.role,
        status: baseUser.status,
      });
    }
  }, [user]);

  const validateRole = (
    role: string,
    userRole: UserRole
  ): AdminRole | InstructorRole | StudentRole | undefined => {
    if (!userRole || !role) return undefined;
    const validRoles = roleOptions[userRole].map((option) => option.value);
    return validRoles.includes(role)
      ? (role as AdminRole | InstructorRole | StudentRole)
      : undefined;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const submissionData: Partial<FormData> = {
      name: formData.name,
      email: formData.email || undefined,
      password: isEdit ? undefined : formData.password || undefined,
      college: formData.college || undefined,
      batch_id: formData.userRole === "student" ? formData.batch_id : [],
      userRole: formData.userRole || undefined,
      role: formData.userRole
        ? validateRole(formData.role, formData.userRole)
        : undefined,
      status: formData.status,
    };

    onSubmit(submissionData);
  };

  const handleInputChange = (
    field: keyof FormData,
    value:
      | string
      | string[]
      | UserRole
      | AdminRole
      | InstructorRole
      | StudentRole
      | UserStatus
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddBatch = () => {
    if (newBatch.trim() && !formData.batch_id.includes(newBatch.trim())) {
      setFormData((prev) => ({
        ...prev,
        batch_id: [...prev.batch_id, newBatch.trim()],
      }));
      setNewBatch("");
    }
  };

  const handleRemoveBatch = (batchToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      batch_id: prev.batch_id.filter((batch) => batch !== batchToRemove),
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddBatch();
    }
  };

  const organizations = getOrgs();
  const batches = getBatches();

  const roleOptions: Record<UserRole, { value: string; label: string }[]> = {
    student: [
      { value: "First Year", label: "First Year" },
      { value: "Second Year", label: "Second Year" },
      { value: "Third Year", label: "Third Year" },
      { value: "Fourth Year", label: "Fourth Year" },
      { value: "Final Year", label: "Final Year" },
    ],
    instructor: [
      { value: "Senior Professor", label: "Senior Professor" },
      { value: "Associate Professor", label: "Associate Professor" },
      { value: "Assistant Professor", label: "Assistant Professor" },
    ],
    college_admin: [
      { value: "College Admin", label: "College Admin" },
      { value: "Deputy Admin", label: "Deputy Admin" },
      { value: "Academic Head", label: "Academic Head" },
    ],
    admin: [{ value: "Admin", label: "Admin" }],
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {/* Name */}
        <div>
          <label className="flex items-center space-x-2 text-sm font-medium text-black mb-1">
            <FaUser className="w-3 h-3 text-blue-600" />
            <span>Name *</span>
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleInputChange("name", e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-sm bg-white text-black"
            placeholder="Enter name"
            required
          />
        </div>

        {/* Email */}
        <div>
          <label className="flex items-center space-x-2 text-sm font-medium text-black mb-1">
            <FaEnvelope className="w-3 h-3 text-blue-600" />
            <span>Email *</span>
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange("email", e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-sm bg-white text-black"
            placeholder="Enter email"
            required
          />
        </div>

        {/* Password */}
        {!isEdit && (
          <div>
            <label className="flex items-center space-x-2 text-sm font-medium text-black mb-1">
              <FaUser className="w-3 h-3 text-blue-600" />
              <span>Password *</span>
            </label>
            <input
              type="password"
              value={formData.password || ""}
              onChange={(e) => handleInputChange("password", e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm bg-white text-black"
              placeholder="Enter password"
              required={!isEdit}
            />
          </div>
        )}

        {/* Organization */}
        <div>
          <label className="flex items-center space-x-2 text-sm font-medium text-black mb-1">
            <FaUniversity className="w-3 h-3 text-blue-600" />
            <span>Organization *</span>
          </label>
          <select
            value={formData.college}
            onChange={(e) => handleInputChange("college", e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-sm bg-white text-black"
            required
          >
            <option value="">Select Organization</option>
            {organizations.map((org) => (
              <option key={org.id} value={org.name}>
                {org.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* User Role */}
      <div>
        <label className="flex items-center space-x-2 text-sm font-medium text-black mb-1">
          <FaUsers className="w-3 h-3 text-blue-600" />
          <span>User Role *</span>
        </label>
        <select
          value={formData.userRole}
          onChange={(e) => {
            handleInputChange("userRole", e.target.value as UserRole);
            handleInputChange("role", "");
          }}
          className="w-full px-3 py-2 border rounded-lg text-sm bg-white text-black"
          required
        >
          <option value="">Select Role</option>
          <option value="student">Student</option>
          <option value="instructor">Instructor</option>
          <option value="college_admin">College Admin</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      {/* Specific Role */}
      {formData.userRole && (
        <div>
          <label className="flex items-center space-x-2 text-sm font-medium text-black mb-1">
            <FaUsers className="w-3 h-3 text-blue-600" />
            <span>Specific Role *</span>
          </label>
          <select
            value={formData.role}
            onChange={(e) => handleInputChange("role", e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-sm bg-white text-black"
            required
          >
            <option value="">Select Specific Role</option>
            {roleOptions[formData.userRole].map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Status */}
      <div>
        <label className="flex items-center space-x-2 text-sm font-medium text-black mb-1">
          <FaUsers className="w-3 h-3 text-blue-600" />
          <span>Status *</span>
        </label>
        <select
          value={formData.status}
          onChange={(e) =>
            handleInputChange("status", e.target.value as UserStatus)
          }
          className="w-full px-3 py-2 border rounded-lg text-sm bg-white text-black"
          required
        >
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
      </div>

      {/* Batch Selection */}
      {formData.userRole === "student" && (
        <div>
          <label className="flex items-center space-x-2 text-sm font-medium text-black mb-2">
            <FaUsers className="w-3 h-3 text-blue-600" />
            <span>Batches</span>
          </label>
          <div className="flex space-x-2 mb-3">
            <select
              value={newBatch}
              onChange={(e) => setNewBatch(e.target.value)}
              onKeyDown={handleKeyPress}
              className="flex-1 px-3 py-2 border rounded-lg text-sm bg-white text-black"
            >
              <option value="">Select Batch</option>
              {batches.map((batch) => (
                <option key={batch} value={batch}>
                  {batch}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleAddBatch}
              className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
              disabled={!newBatch}
            >
              <FaPlus className="w-3 h-3" />
            </button>
          </div>
          <div className="flex flex-wrap gap-2 min-h-[40px] p-2 border rounded-lg bg-white">
            {formData.batch_id.length === 0 ? (
              <span className="text-gray-400 text-sm">No batches added</span>
            ) : (
              formData.batch_id.map((batch) => (
                <span
                  key={batch}
                  className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border"
                >
                  {batch}
                  <button
                    type="button"
                    onClick={() => handleRemoveBatch(batch)}
                    className="ml-2 text-blue-600 hover:text-blue-800"
                  >
                    <FaTimes className="w-2 h-2" />
                  </button>
                </span>
              ))
            )}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex space-x-3 pt-4">
        <button
          type="submit"
          className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
        >
          <FaSave className="w-4 h-4" />
          <span>{isEdit ? "Update" : "Create"}</span>
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 border text-black rounded-lg hover:bg-gray-100 text-sm"
        >
          <FaTimes className="w-4 h-4" />
          <span>Cancel</span>
        </button>
      </div>
    </form>
  );
};

export default UserForm;
