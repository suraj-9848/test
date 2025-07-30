import React, { useState, useEffect } from "react";
import { fetchBatches, fetchStudents, assignStudentsToBatch } from "../api/batchAssignApi";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
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
  FaBook,
} from "react-icons/fa";

interface Student {
  id: string;
  name: string;
  email: string;
}

interface Batch {
  id: number;
  name: string;
  description: string;
  org_id: string;
}

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

  const fetchBatchesAndStudents = async () => {
    setLoading(true);
    setError("");
    try {
      const [batchesData, studentsData] = await Promise.all([
        fetchBatches(),
        fetchStudents(),
      ]);
      
      console.log("Fetched batches:", batchesData);
      console.log("Fetched students:", studentsData);
      
      if (!batchesData || batchesData.length === 0) {
        setError("No batches found. Please create a batch first.");
      }
      if (!studentsData || studentsData.length === 0) {
        setError("No students found. Please ensure students are registered.");
      }
      setBatches(batchesData || []);
      setStudents(studentsData || []);
    } catch (error: unknown) {
      console.error("Fetch error:", error);
      const message = error instanceof Error ? error.message : String(error);
      setError("Failed to fetch data: " + message);
    } finally {
      setLoading(false);
    }
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
        studentsCount: selectedStudents.length
      });

      const response = await assignStudentsToBatch(selectedBatchId, selectedStudents);
      
      console.log("Assignment response:", response);
      
      setSuccess(
        `Successfully assigned ${selectedStudents.length} student(s) to the selected batch!`
      );
      
      // Clear selections after successful assignment
      setSelectedStudents([]);
      
      // Refresh data to show updated assignments
      setTimeout(() => {
        fetchBatchesAndStudents();
      }, 1000);
      
    } catch (error: unknown) {
      console.error("Assignment error:", error);
      const message = error instanceof Error ? error.message : String(error);
      
      // Provide more specific error messages
      if (message.includes("Internal server error")) {
        setError("Server error occurred. This might be due to: database connectivity, missing batch/student data, or permission issues. Please try again or contact support.");
      } else if (message.includes("Batch not found")) {
        setError("The selected batch was not found. Please refresh and try again.");
      } else if (message.includes("User not found")) {
        setError("One or more selected students were not found. Please refresh and try again.");
      } else if (message.includes("org mismatch") || message.includes("organization")) {
        setError("Organization mismatch: Students can only be assigned to batches within their organization.");
      } else if (message.includes("already assigned")) {
        setError("Some students are already assigned to this batch.");
      } else {
        setError("Assignment failed: " + message);
      }
    } finally {
      setAssignmentLoading(false);
    }
  };

  const toggleStudentSelection = (studentId: string) => {
    setSelectedStudents((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId],
    );
  };

  const selectAllStudents = () => {
    if (selectedStudents.length === filteredStudents.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(filteredStudents.map(student => student.id));
    }
  };

  const filteredStudents = students.filter(
    (student) =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const StudentCard: React.FC<{
    student: Student;
    isSelected: boolean;
    onClick: () => void;
  }> = ({ student, isSelected, onClick }) => (
    <div
      onClick={onClick}
      className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 hover:shadow-md ${
        isSelected
          ? "border-blue-500 bg-blue-50 shadow-md"
          : "border-slate-200 bg-white hover:border-slate-300"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <FaUser className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800">{student.name}</h3>
            <p className="text-sm text-slate-600">{student.email}</p>
          </div>
        </div>
        {isSelected && (
          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
            <FaCheck className="w-3 h-3 text-white" />
          </div>
        )}
      </div>
    </div>
  );

  const SelectionSummary: React.FC = () => (
    <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl border border-blue-200">
      <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
        <FaBook className="w-5 h-5" />
        Assignment Summary
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="font-medium text-slate-700 mb-3 flex items-center gap-2">
            <FaGraduationCap className="w-4 h-4" />
            Selected Batch
          </h4>
          {selectedBatchId === "" ? (
            <p className="text-slate-500 text-sm">No batch selected</p>
          ) : (
            <div className="space-y-2">
              {(() => {
                const batch = batches.find(
                  (b) => b.id.toString() === selectedBatchId,
                );
                return batch ? (
                  <div className="flex items-center justify-between bg-white p-3 rounded-lg border">
                    <div>
                      <span className="font-medium text-slate-700">{batch.name}</span>
                      <p className="text-xs text-slate-500 mt-1">{batch.description}</p>
                    </div>
                    <button
                      onClick={() => setSelectedBatchId("")}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <FaTimes className="w-4 h-4" />
                    </button>
                  </div>
                ) : null;
              })()}
            </div>
          )}
        </div>
        <div>
          <h4 className="font-medium text-slate-700 mb-3 flex items-center gap-2">
            <FaUsers className="w-4 h-4" />
            Selected Students ({selectedStudents.length})
          </h4>
          {selectedStudents.length === 0 ? (
            <p className="text-slate-500 text-sm">No students selected</p>
          ) : (
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {selectedStudents.slice(0, 5).map((studentId) => {
                const student = students.find((s) => s.id === studentId);
                return student ? (
                  <div
                    key={studentId}
                    className="flex items-center justify-between bg-white p-2 rounded border"
                  >
                    <span className="text-sm text-slate-700 truncate">
                      {student.name}
                    </span>
                    <button
                      onClick={() => toggleStudentSelection(studentId)}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <FaTimes className="w-3 h-3" />
                    </button>
                  </div>
                ) : null;
              })}
              {selectedStudents.length > 5 && (
                <p className="text-xs text-slate-500 text-center">
                  +{selectedStudents.length - 5} more students
                </p>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="mt-6 flex gap-4">
        <button
          onClick={handleAssign}
          disabled={
            assignmentLoading || selectedBatchId === "" || selectedStudents.length === 0
          }
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {assignmentLoading ? (
            <FaSpinner className="w-4 h-4 animate-spin" />
          ) : (
            <FaUserCheck className="w-4 h-4" />
          )}
          {assignmentLoading ? "Assigning..." : "Assign Students"}
        </button>
        <button
          onClick={() => {
            setSelectedBatchId("");
            setSelectedStudents([]);
          }}
          disabled={assignmentLoading}
          className="px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
        >
          Clear Selection
        </button>
      </div>
    </div>
  );

  if (loading && batches.length === 0) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <FaSpinner className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
            <p className="text-slate-600">Loading batches and students...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <FaUsers className="w-8 h-8" />
            Batch Assignment
          </h1>
          <p className="text-slate-600 mt-2">
            Assign students to batches and manage enrollments
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 bg-slate-50 text-slate-600 px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-100 transition"
          >
            <FaArrowLeft className="w-4 h-4" />
            Back
          </button>
          <Link 
            href="/dashboard/instructor?section=batch-management"
            className="bg-blue-50 text-blue-600 px-4 py-2 rounded-lg border border-blue-200 hover:bg-blue-100 transition"
          >
            Batch Management
          </Link>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-start gap-3">
          <FaExclamationTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium">Assignment Failed</p>
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

      {isNewBatch && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg flex items-center gap-3">
          <FaInfo className="w-5 h-5" />
          <p className="flex-1">Your new batch has been created successfully! Now you can assign students to this batch.</p>
          <button 
            onClick={() => setIsNewBatch(false)} 
            className="text-blue-700 hover:text-blue-900"
          >
            <FaTimes className="w-4 h-4" />
          </button>
        </div>
      )}

      {(selectedBatchId !== "" || selectedStudents.length > 0) && (
        <div className="mb-8">
          <SelectionSummary />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div>
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
                  <p className="text-sm mt-1">Create a batch first to assign students</p>
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
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-slate-800 truncate">
                        {batch.name}
                      </h3>
                      {selectedBatchId === batch.id.toString() && (
                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                          <FaCheck className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-slate-600 line-clamp-2">
                      {batch.description}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
                <FaUsers className="w-5 h-5" />
                Students
              </h2>
              <span className="text-sm text-slate-500 bg-slate-100 px-2 py-1 rounded">
                {selectedStudents.length} selected
              </span>
            </div>
            
            <div className="space-y-3 mb-4">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              {filteredStudents.length > 0 && (
                <button
                  onClick={selectAllStudents}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  {selectedStudents.length === filteredStudents.length 
                    ? "Deselect All" 
                    : `Select All (${filteredStudents.length})`
                  }
                </button>
              )}
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredStudents.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <FaUser className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p>
                    {students.length === 0 
                      ? "No students available" 
                      : "No students match your search"
                    }
                  </p>
                  {students.length === 0 && (
                    <p className="text-sm mt-1">Ensure students are registered in the system</p>
                  )}
                </div>
              ) : (
                filteredStudents.map((student) => (
                  <StudentCard
                    key={student.id}
                    student={student}
                    isSelected={selectedStudents.includes(student.id)}
                    onClick={() => toggleStudentSelection(student.id)}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BatchAssign;