import React, { useState, useEffect } from "react";
import {
  fetchBatches,
  fetchStudentsWithBatchInfo,
  assignStudentsToBatch,
} from "../api/batchAssignApi";
import { useSearchParams } from "next/navigation";
import { getSession } from "next-auth/react";
import Link from "next/link";
import axios from "axios";
import {
  FaUser,
  FaGraduationCap,
  FaCheck,
  FaTimes,
  FaSpinner,
  FaSearch,
  FaUserCheck,
  FaExclamationTriangle,
  FaInfo,
  FaArrowLeft,
  FaUsers,
  FaCheckCircle,
  FaUserMinus,
  FaUserPlus,
  FaToggleOn,
  FaToggleOff,
  FaEye,
  FaEyeSlash,
} from "react-icons/fa";

const baseUrl = process.env.NEXT_PUBLIC_BACKEND_BASE_URL;
const API_URL = `${baseUrl}/api/instructor/batches`;

let cachedBackendJwt: string = "";

const getBackendJwt = async () => {
  if (cachedBackendJwt) return cachedBackendJwt;

  const session = await getSession();
  if (!session) throw new Error("No session found - user not logged in");

  const googleIdToken = (session as { id_token?: string })?.id_token;
  if (!googleIdToken) throw new Error("No Google ID token found in session");

  try {
    const loginRes = await axios.post(
      `${baseUrl}/api/auth/admin-login`,
      {},
      {
        headers: { Authorization: `Bearer ${googleIdToken}` },
        withCredentials: true,
      },
    );
    cachedBackendJwt = loginRes.data.token;
    return cachedBackendJwt;
  } catch (err) {
    console.error("Backend JWT error:", err);
    throw new Error("Failed to authenticate with backend");
  }
};

const getAuthHeaders = async () => {
  const jwt = await getBackendJwt();
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${jwt}`,
  };
};

interface Student {
  id: string;
  name: string;
  email: string;
  batch_id?: string[]; // Array of batch IDs the student is assigned to
}

interface Batch {
  id: number;
  name: string;
  description: string;
  org_id: string;
  students?: Student[]; // Students currently in this batch
}

type AssignmentMode = "assign" | "remove";

const BatchAssign: React.FC = () => {
  const searchParams = useSearchParams();
  const batchIdFromURL = searchParams.get("batchId");

  const [batches, setBatches] = useState<Batch[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string>("");
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [assignmentLoading, setAssignmentLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isNewBatch, setIsNewBatch] = useState(false);
  const [assignmentMode, setAssignmentMode] =
    useState<AssignmentMode>("assign");

  useEffect(() => {
    fetchBatchesAndStudents();
  }, []);

  // Set selected batch ID from URL parameter if available
  useEffect(() => {
    if (batchIdFromURL) {
      setSelectedBatchId(batchIdFromURL);
      setIsNewBatch(true);
    }
  }, [batchIdFromURL]);

  // Clear selected students when mode changes
  useEffect(() => {
    setSelectedStudents([]);
  }, [assignmentMode, selectedBatchId]);

  const fetchBatchesAndStudents = async () => {
    setLoading(true);
    setError("");
    try {
      const [batchesData, studentsData] = await Promise.all([
        fetchBatches(),
        fetchStudentsWithBatchInfo(),
      ]);

      console.log("Fetched batches:", batchesData);
      console.log("Fetched students with batch info:", studentsData);

      // Ensure students have batch_id as an array
      const studentsWithBatchInfo = studentsData.map((student: Student) => ({
        ...student,
        batch_id: Array.isArray(student.batch_id) ? student.batch_id : [],
      }));
      console.log("Fetched students:", studentsData);

      if (!batchesData || batchesData.length === 0) {
        setError("No batches found. Please create a batch first.");
      }
      if (!studentsWithBatchInfo || studentsWithBatchInfo.length === 0) {
        setError("No students found. Please ensure students are registered.");
      }
      setBatches(batchesData || []);
      setStudents(studentsWithBatchInfo || []);
    } catch (error: unknown) {
      console.error("Fetch error:", error);
      const message = error instanceof Error ? error.message : String(error);
      setError("Failed to fetch data: " + message);
    } finally {
      setLoading(false);
    }
  };

  // Check if student is assigned to selected batch
  const isStudentInBatch = (studentId: string): boolean => {
    const student = students.find((s) => s.id === studentId);
    if (!student || !student.batch_id || !selectedBatchId) return false;
    return student.batch_id.includes(selectedBatchId);
  };

  // Get filtered students based on current mode and batch selection
  const getFilteredStudents = () => {
    let filteredStudents = students.filter(
      (student) =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase()),
    );

    if (selectedBatchId && assignmentMode === "assign") {
      // In assign mode: show students NOT in the selected batch
      filteredStudents = filteredStudents.filter(
        (student) => !isStudentInBatch(student.id),
      );
    } else if (selectedBatchId && assignmentMode === "remove") {
      // In remove mode: show students IN the selected batch
      filteredStudents = filteredStudents.filter((student) =>
        isStudentInBatch(student.id),
      );
    }

    return filteredStudents;
  };

  const handleAssign = async () => {
    if (!selectedBatchId || selectedStudents.length === 0) {
      setError("Please select a batch and at least one student");
      return;
    }

    setAssignmentLoading(true);
    setError("");
    setSuccess("");

    try {
      console.log("Assignment request:", {
        batchId: selectedBatchId,
        studentIds: selectedStudents,
        studentsCount: selectedStudents.length,
        mode: assignmentMode,
      });

      if (assignmentMode === "assign") {
        const response = await assignStudentsToBatch(
          selectedBatchId,
          selectedStudents,
        );
        console.log("Assignment response:", response);
        setSuccess(
          `Successfully assigned ${selectedStudents.length} student(s) to the selected batch!`,
        );
      } else {
        // Remove mode - call remove API
        const response = await removeStudentsFromBatch(
          selectedBatchId,
          selectedStudents,
        );
        console.log("Removal response:", response);
        setSuccess(
          `Successfully removed ${selectedStudents.length} student(s) from the selected batch!`,
        );
      }

      // Clear selections after successful operation
      setSelectedStudents([]);

      // Refresh data to show updated assignments
      setTimeout(() => {
        fetchBatchesAndStudents();
      }, 1000);
    } catch (error: unknown) {
      console.error("Operation error:", error);
      const message = error instanceof Error ? error.message : String(error);

      const operation = assignmentMode === "assign" ? "Assignment" : "Removal";

      // Provide more specific error messages
      if (message.includes("Internal server error")) {
        setError(
          `${operation} failed: Server error occurred. This might be due to database connectivity, missing batch/student data, or permission issues. Please try again or contact support.`,
        );
      } else if (message.includes("Batch not found")) {
        setError(
          "The selected batch was not found. Please refresh and try again.",
        );
      } else if (message.includes("User not found")) {
        setError(
          "One or more selected students were not found. Please refresh and try again.",
        );
      } else if (
        message.includes("org mismatch") ||
        message.includes("organization")
      ) {
        setError(
          "Organization mismatch: Students can only be managed within their organization.",
        );
      } else if (message.includes("already assigned")) {
        setError("Some students are already assigned to this batch.");
      } else if (message.includes("not assigned")) {
        setError("Some students are not assigned to this batch.");
      } else {
        setError(`${operation} failed: ` + message);
      }
    } finally {
      setAssignmentLoading(false);
    }
  };

  // New API function for removing students from batch
  const removeStudentsFromBatch = async (
    batchId: string,
    studentIds: string[],
  ) => {
    try {
      const headers = await getAuthHeaders();
      console.log("Removing students from batch:", { batchId, studentIds });

      const response = await axios.delete(
        `${API_URL}/${batchId}/remove-students`,
        {
          headers,
          data: { userIds: studentIds }, // DELETE requests with body use 'data' in axios
        },
      );

      console.log("Remove students response:", response.data);

      return {
        success: true,
        message: response.data.message || "Students removed successfully",
        details: response.data,
      };
    } catch (error) {
      console.error("Remove students error:", error);

      if (axios.isAxiosError(error) && error.response) {
        const errorMessage =
          error.response.data?.message ||
          error.response.data?.error ||
          `HTTP ${error.response.status}: ${error.response.statusText}`;

        throw new Error(errorMessage);
      }

      throw new Error("Failed to remove students from batch");
    }
  };

  const toggleStudentSelection = (studentId: string) => {
    setSelectedStudents((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId],
    );
  };

  const toggleAllStudents = () => {
    const filteredStudents = getFilteredStudents();
    if (selectedStudents.length === filteredStudents.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(filteredStudents.map((student) => student.id));
    }
  };

  const getSelectedBatch = () => {
    return batches.find((batch) => batch.id.toString() === selectedBatchId);
  };

  const filteredStudents = getFilteredStudents();

  // Mode toggle component
  const ModeToggle = () => (
    <div className="flex items-center justify-center mb-6">
      <div className="bg-slate-100 rounded-lg p-1 flex">
        <button
          onClick={() => setAssignmentMode("assign")}
          className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all duration-200 ${
            assignmentMode === "assign"
              ? "bg-white text-blue-600 shadow-sm"
              : "text-slate-600 hover:text-slate-800"
          }`}
        >
          <FaUserPlus className="w-4 h-4" />
          <span className="font-medium">Assign Mode</span>
        </button>
        <button
          onClick={() => setAssignmentMode("remove")}
          className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all duration-200 ${
            assignmentMode === "remove"
              ? "bg-white text-red-600 shadow-sm"
              : "text-slate-600 hover:text-slate-800"
          }`}
        >
          <FaUserMinus className="w-4 h-4" />
          <span className="font-medium">Remove Mode</span>
        </button>
      </div>
    </div>
  );

  // Selection summary component
  const SelectionSummary = () => {
    const selectedBatch = getSelectedBatch();
    if (!selectedBatch || selectedStudents.length === 0) return null;

    return (
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              {assignmentMode === "assign" ? (
                <FaUserPlus className="w-5 h-5 text-blue-600" />
              ) : (
                <FaUserMinus className="w-5 h-5 text-red-600" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-slate-800">
                {assignmentMode === "assign"
                  ? "Ready to Assign"
                  : "Ready to Remove"}
              </h3>
              <p className="text-sm text-slate-600">
                {selectedStudents.length} student(s){" "}
                {assignmentMode === "assign" ? "to" : "from"} &quot;
                {selectedBatch.name}&quot;
              </p>
            </div>
          </div>
          <button
            onClick={handleAssign}
            disabled={assignmentLoading}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
              assignmentMode === "assign"
                ? "bg-blue-600 hover:bg-blue-700 text-white"
                : "bg-red-600 hover:bg-red-700 text-white"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {assignmentLoading ? (
              <FaSpinner className="w-4 h-4 animate-spin" />
            ) : assignmentMode === "assign" ? (
              <FaUserPlus className="w-4 h-4" />
            ) : (
              <FaUserMinus className="w-4 h-4" />
            )}
            {assignmentLoading
              ? `${assignmentMode === "assign" ? "Assigning" : "Removing"}...`
              : `${assignmentMode === "assign" ? "Assign" : "Remove"} Students`}
          </button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <FaSpinner className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading batches and students...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard/instructor?section=batch-management"
                className="flex items-center gap-2 text-slate-600 hover:text-slate-800 transition-colors"
              >
                <FaArrowLeft className="w-4 h-4" />
                <span>Back to Batch Management</span>
              </Link>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <FaUsers className="w-5 h-5" />
              <span className="font-medium">Student-Batch Assignment</span>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-slate-200/50 shadow-lg p-6">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              Batch Assignment Manager
            </h1>
            <p className="text-slate-600">
              {assignmentMode === "assign"
                ? "Assign students to batches to organize your learning groups"
                : "Remove students from batches to manage enrollments"}
            </p>
          </div>
        </div>

        {/* Mode Toggle */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-slate-200/50 shadow-lg p-6 mb-8">
          <ModeToggle />
          <div className="text-center text-sm text-slate-500">
            <span className="inline-flex items-center gap-2">
              {assignmentMode === "assign" ? (
                <>
                  <FaEye className="w-4 h-4" />
                  Showing students not in selected batch
                </>
              ) : (
                <>
                  <FaEyeSlash className="w-4 h-4" />
                  Showing students currently in selected batch
                </>
              )}
            </span>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-3">
            <FaExclamationTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium">Operation Failed</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
            <button
              onClick={() => setError("")}
              className="text-red-500 hover:text-red-700"
            >
              <FaTimes className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg flex items-center gap-3">
            <FaCheck className="w-5 h-5" />
            <p className="flex-1">{success}</p>
            <button
              onClick={() => setSuccess("")}
              className="text-green-500 hover:text-green-700"
            >
              <FaTimes className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* New Batch Info */}
        {isNewBatch && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg flex items-center gap-3">
            <FaInfo className="w-5 h-5" />
            <p className="flex-1">
              Your new batch has been created successfully! Now you can assign
              students to this batch.
            </p>
            <button
              onClick={() => setIsNewBatch(false)}
              className="text-blue-700 hover:text-blue-900"
            >
              <FaTimes className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Selection Summary */}
        {(selectedBatchId !== "" || selectedStudents.length > 0) && (
          <div className="mb-8">
            <SelectionSummary />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Batches Section */}
          <div className="space-y-6">
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-slate-200/50 shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
                  <FaGraduationCap className="w-5 h-5" />
                  Available Batches
                </h2>
                <span className="text-sm text-slate-500 bg-slate-100 px-2 py-1 rounded">
                  {selectedBatchId !== "" ? 1 : 0} selected
                </span>
              </div>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {batches.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <FaGraduationCap className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p>No batches available</p>
                    <p className="text-sm mt-1">
                      Create a batch first to assign students
                    </p>
                  </div>
                ) : (
                  batches.map((batch) => (
                    <div
                      key={batch.id}
                      onClick={() => setSelectedBatchId(batch.id.toString())}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 hover:shadow-md ${
                        selectedBatchId === batch.id.toString()
                          ? "border-blue-500 bg-blue-50 shadow-md"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-slate-800 mb-1">
                            {batch.name}
                          </h3>
                          {batch.description && (
                            <p className="text-sm text-slate-600 mb-2">
                              {batch.description}
                            </p>
                          )}
                          <div className="flex items-center gap-4 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                              <FaUsers className="w-3 h-3" />
                              ID: {batch.id}
                            </span>
                          </div>
                        </div>
                        {selectedBatchId === batch.id.toString() && (
                          <div className="ml-3">
                            <FaCheckCircle className="w-6 h-6 text-blue-600" />
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Students Section */}
          <div className="space-y-6">
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-slate-200/50 shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
                  <FaUser className="w-5 h-5" />
                  {assignmentMode === "assign"
                    ? "Available Students"
                    : "Assigned Students"}
                </h2>
                <span className="text-sm text-slate-500 bg-slate-100 px-2 py-1 rounded">
                  {selectedStudents.length} selected
                </span>
              </div>

              {/* Search bar */}
              <div className="relative mb-4">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder={`Search ${
                    assignmentMode === "assign" ? "available" : "assigned"
                  } students...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>

              {/* Select all button */}
              {filteredStudents.length > 0 && selectedBatchId && (
                <div className="mb-4">
                  <button
                    onClick={toggleAllStudents}
                    className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    {selectedStudents.length === filteredStudents.length ? (
                      <FaToggleOn className="w-4 h-4" />
                    ) : (
                      <FaToggleOff className="w-4 h-4" />
                    )}
                    {selectedStudents.length === filteredStudents.length
                      ? "Deselect All"
                      : "Select All"}
                  </button>
                </div>
              )}

              {/* Students list */}
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {!selectedBatchId ? (
                  <div className="text-center py-8 text-slate-500">
                    <FaGraduationCap className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p>
                      Select a batch to view{" "}
                      {assignmentMode === "assign" ? "available" : "assigned"}{" "}
                      students
                    </p>
                  </div>
                ) : filteredStudents.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <FaUser className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p>
                      {assignmentMode === "assign"
                        ? "No students available for assignment"
                        : "No students assigned to this batch"}
                    </p>
                    <p className="text-sm mt-1">
                      {assignmentMode === "assign"
                        ? "All students may already be assigned to this batch"
                        : "Use assign mode to add students to this batch"}
                    </p>
                  </div>
                ) : (
                  filteredStudents.map((student) => {
                    const isSelected = selectedStudents.includes(student.id);
                    const isInBatch = isStudentInBatch(student.id);

                    return (
                      <div
                        key={student.id}
                        onClick={() => toggleStudentSelection(student.id)}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 hover:shadow-md ${
                          isSelected
                            ? "border-blue-500 bg-blue-50 shadow-md"
                            : "border-slate-200 bg-white hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                isSelected
                                  ? "bg-blue-600 text-white"
                                  : isInBatch
                                    ? "bg-green-100 text-green-600"
                                    : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {isSelected ? (
                                <FaCheck className="w-4 h-4" />
                              ) : isInBatch ? (
                                <FaUserCheck className="w-4 h-4" />
                              ) : (
                                <FaUser className="w-4 h-4" />
                              )}
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-slate-800">
                                {student.name}
                              </h3>
                              <p className="text-sm text-slate-600">
                                {student.email}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {isInBatch && (
                              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                                {assignmentMode === "assign"
                                  ? "Already Assigned"
                                  : "Assigned"}
                              </span>
                            )}
                            {isSelected && (
                              <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                                <FaCheck className="w-3 h-3 text-white" />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BatchAssign;
