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
  RecruiterUser,
  UserRole,
  UserStatus,
  getBatches,
} from "@/store/adminStore";
import { organizationApi } from "@/api/adminApi";

// Union type for all user types
type CombinedUser = AdminUser | InstructorUser | StudentUser | RecruiterUser;

// Helper function to safely extract role from CombinedUser
const getUserRole = (user: CombinedUser): UserRole | "" => {
  return "role" in user ? (user.role as UserRole) : "";
};

// Helper function to safely extract batch_id from user (if it exists)
const getUserBatchId = (user: CombinedUser): string[] => {
  return (user as any).batch_id || [];
};

// Define form data structure
interface FormData {
  name: string;
  email: string;
  password: string | null;
  org_id: string;
  batch_id: string[];
  userRole: UserRole | "";
  role: UserRole | "";
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
    org_id: "",
    batch_id: [],
    userRole: "",
    role: "",
    status: "Active",
  });

  const [newBatch, setNewBatch] = useState("");

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        password: null,
        org_id: (user as any).org_id || "",
        batch_id: getUserBatchId(user),
        userRole: user.userRole || "",
        role: getUserRole(user),
        status: user.status,
      });
    }
  }, [user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Map frontend form fields to backend expected fields
    const submissionData = {
      username: formData.name, // Backend expects 'username', not 'name'
      email: formData.email || undefined,
      password: formData.password || undefined, // Now optional for both create and edit
      org_id: formData.org_id || undefined, // Backend expects 'org_id', not 'college'
      batch_id: formData.userRole === "student" ? formData.batch_id : [],
      // Note: 'role' field will be added by the API function from the userRole parameter
      userRole: formData.userRole || undefined, // This tells the parent component what role to pass to API
      status: formData.status,
    };

    onSubmit(submissionData);
  };

  const handleInputChange = (
    field: keyof FormData,
    value: string | string[] | UserRole | UserStatus,
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

  // Get organizations using state to ensure we can fetch fresh data
  const [organizations, setOrganizations] = useState<
    { id: string; name: string }[]
  >([]);
  const [batches, setBatches] = useState<any[]>([]);

  // Fetch organizations on mount
  useEffect(() => {
    const fetchOrgs = async () => {
      try {
        const response = await organizationApi.getAll();
        setOrganizations(
          response.orgs.map((org: { id: string; name: string }) => ({
            id: org.id,
            name: org.name,
          })),
        );
      } catch (error) {
        console.error("Error fetching organizations:", error);
      }
    };

    fetchOrgs();
  }, []);

  useEffect(() => {
    const fetchBatchesAsync = async () => {
      try {
        const batchList = await getBatches();
        setBatches(batchList);
      } catch (error) {
        console.error("Error fetching batches:", error);
        setBatches([]);
      }
    };
    fetchBatchesAsync();
  }, []);

  // Simple role options with just the 4 main roles
  const roleOptions: Record<UserRole, { value: string; label: string }[]> = {
    student: [{ value: "student", label: "Student" }],
    instructor: [{ value: "instructor", label: "Instructor" }],
    admin: [{ value: "admin", label: "Admin" }],
    recruiter: [{ value: "recruiter", label: "Recruiter" }],
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
        <div>
          <label className="flex items-center space-x-2 text-sm font-medium text-black mb-1">
            <FaUser className="w-3 h-3 text-blue-600" />
            <span>Password {isEdit ? "(optional)" : "(optional)"}</span>
          </label>
          <input
            type="password"
            value={formData.password || ""}
            onChange={(e) => handleInputChange("password", e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-sm bg-white text-black"
            placeholder={
              isEdit
                ? "Leave blank to keep current password"
                : "Enter password (optional)"
            }
            required={false}
          />
        </div>

        {/* Organization */}
        <div>
          <label className="flex items-center space-x-2 text-sm font-medium text-black mb-1">
            <FaUniversity className="w-3 h-3 text-blue-600" />
            <span>Organization *</span>
          </label>
          <select
            value={formData.org_id}
            onChange={(e) => handleInputChange("org_id", e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-sm bg-white text-black"
            required
          >
            <option value="">Select Organization</option>
            {organizations.map((org) => (
              <option key={org.id} value={org.id}>
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
          <option value="admin">Admin</option>
          <option value="recruiter">Recruiter</option>
        </select>
      </div>

      {/* No separate "Specific Role" section needed as we're using the same roles */}

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
                <option key={batch.id || batch} value={batch.id || batch}>
                  {batch.name || batch}
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
