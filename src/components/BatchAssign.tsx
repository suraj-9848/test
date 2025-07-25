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
      if (!batchesData || batchesData.length === 0) {
        setError("No batches found. Please check your API or JWT token.");
      }
      if (!studentsData || studentsData.length === 0) {
        setError("No students found. Please check your API or JWT token.");
      }
      setBatches(batchesData || []);
      setStudents(studentsData || []);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      setError("Failed to fetch batches or students: " + message);
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedBatchId || selectedStudents.length === 0) {
      setError("Please select a batch and at least one student");
      return;
    }
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      await assignStudentsToBatch(selectedBatchId, selectedStudents);
      setSuccess(
        `Successfully assigned ${selectedStudents.length} student(s) to batch`,
      );
      setSelectedBatchId("");
      setSelectedStudents([]);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      setError("Failed to assign students: " + message);
    } finally {
      setLoading(false);
    }
  };

  const toggleStudentSelection = (studentId: string) => {
    setSelectedStudents((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId],
    );
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
      className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
        isSelected
          ? "border-blue-500 bg-blue-50 shadow-md"
          : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
      }`}
    >
      <div className="flex items-center justify-between mb-3">
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
      <h3 className="text-lg font-semibold text-slate-800 mb-4">
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
                  <div className="flex items-center justify-between bg-white p-2 rounded border">
                    <span className="text-sm text-slate-700">{batch.name}</span>
                    <button
                      onClick={() => setSelectedBatchId("")}
                      className="text-red-500 hover:text-red-700"
                    >
                      <FaTimes className="w-3 h-3" />
                    </button>
                  </div>
                ) : null;
              })()}
            </div>
          )}
        </div>
        <div>
          <h4 className="font-medium text-slate-700 mb-3 flex items-center gap-2">
            <FaUser className="w-4 h-4" />
            Selected Students ({selectedStudents.length})
          </h4>
          {selectedStudents.length === 0 ? (
            <p className="text-slate-500 text-sm">No students selected</p>
          ) : (
            <div className="space-y-2">
              {selectedStudents.map((studentId) => {
                const student = students.find((s) => s.id === studentId);
                return student ? (
                  <div
                    key={studentId}
                    className="flex items-center justify-between bg-white p-2 rounded border"
                  >
                    <span className="text-sm text-slate-700">
                      {student.name}
                    </span>
                    <button
                      onClick={() => toggleStudentSelection(studentId)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <FaTimes className="w-3 h-3" />
                    </button>
                  </div>
                ) : null;
              })}
            </div>
          )}
        </div>
      </div>
      <div className="mt-6 flex gap-4">
        <button
          onClick={handleAssign}
          disabled={
            loading || selectedBatchId === "" || selectedStudents.length === 0
          }
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <FaSpinner className="w-4 h-4 animate-spin" />
          ) : (
            <FaUserCheck className="w-4 h-4" />
          )}
          Assign Students
        </button>
        <button
          onClick={() => {
            setSelectedBatchId("");
            setSelectedStudents([]);
          }}
          className="px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
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
          <FaSpinner className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">
            Batch Assignment
          </h1>
          <p className="text-slate-600 mt-2">
            Assign students to batches and manage enrollments
          </p>
        </div>
        <div>
          <Link 
            href="/dashboard/instructor?section=batch-management"
            className="bg-blue-50 text-blue-600 px-4 py-2 rounded-lg border border-blue-200 hover:bg-blue-100 transition"
          >
            Back to Batches
          </Link>
        </div>
      </div>
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-2">
          <FaExclamationTriangle className="w-5 h-5" />
          {error}
        </div>
      )}
      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg flex items-center gap-2">
          <FaCheck className="w-5 h-5" />
          {success}
        </div>
      )}
      {isNewBatch && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg flex items-center gap-2">
          <FaInfo className="w-5 h-5" />
          Your new batch has been created successfully! Now you can assign students to this batch.
          <button 
            onClick={() => setIsNewBatch(false)} 
            className="ml-auto text-blue-700 hover:text-blue-900"
          >
            Dismiss
          </button>
        </div>
      )}
      {(selectedBatchId !== "" || selectedStudents.length > 0) && (
        <div className="mb-8">
          <SelectionSummary />
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Batches Section */}
        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-slate-800">
                Available Batches
              </h2>
              <span className="text-sm text-slate-500">
                {selectedBatchId !== "" ? 1 : 0} selected
              </span>
            </div>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {batches.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <FaGraduationCap className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p>No batches found</p>
                </div>
              ) : (
                batches.map((batch) => (
                  <div
                    key={batch.id}
                    onClick={() => setSelectedBatchId(batch.id.toString())}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                      selectedBatchId === batch.id.toString()
                        ? "border-blue-500 bg-blue-50 shadow-md"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
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
        {/* Students Section */}
        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-slate-800">Students</h2>
              <span className="text-sm text-slate-500">
                {selectedStudents.length} selected
              </span>
            </div>
            <div className="relative mb-4">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredStudents.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <FaUser className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p>No students found</p>
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
