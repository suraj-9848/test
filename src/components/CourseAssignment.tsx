"use client";

import React, { useState, useEffect } from "react";
import {
  FaUser,
  FaGraduationCap,
  FaCheck,
  FaTimes,
  FaSpinner,
  FaSearch,
  FaUserCheck,
  FaListAlt,
  FaExclamationTriangle,
} from "react-icons/fa";
import { instructorApi, Course, Student } from "../api/instructorApi";

interface CourseAssignmentProps {
  onClose?: () => void;
}

const CourseAssignment: React.FC<CourseAssignmentProps> = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [courseSearchTerm, setCourseSearchTerm] = useState("");
  const [showAssignmentHistory, setShowAssignmentHistory] = useState(false);
  const [assignmentHistory, setAssignmentHistory] = useState<{
    [studentId: string]: Course[];
  }>({});

  useEffect(() => {
    fetchCoursesAndStudents();
  }, []);

  const fetchCoursesAndStudents = async () => {
    setLoading(true);
    setError("");
    try {
      const [coursesResponse, studentsResponse] = await Promise.all([
        instructorApi.getCourses(),
        instructorApi.getStudents(),
      ]);
      setCourses(coursesResponse.courses || []);
      setStudents(studentsResponse.users || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch data");
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentAssignments = async (studentId: string) => {
    try {
      const response = await instructorApi.getStudentCourseAssignments(
        studentId
      );
      setAssignmentHistory((prev) => ({
        ...prev,
        [studentId]: response.courses,
      }));
    } catch (err) {
      console.error("Error fetching student assignments:", err);
    }
  };

  const handleAssignCourses = async () => {
    if (selectedCourses.length === 0 || selectedStudents.length === 0) {
      setError("Please select at least one course and one student");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const result = await instructorApi.assignCoursesToStudents(
        selectedCourses,
        selectedStudents
      );
      
      setSuccess(result.message);
      setSelectedCourses([]);
      setSelectedStudents([]);

      // Refresh assignment history for selected students
      selectedStudents.forEach((studentId) => {
        fetchStudentAssignments(studentId);
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to assign courses";
      console.error("Course assignment error:", errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const toggleCourseSelection = (courseId: string) => {
    setSelectedCourses((prev) =>
      prev.includes(courseId)
        ? prev.filter((id) => id !== courseId)
        : [...prev, courseId]
    );
  };

  const toggleStudentSelection = (studentId: string) => {
    setSelectedStudents((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );

    // Fetch assignment history when student is selected
    if (!selectedStudents.includes(studentId)) {
      fetchStudentAssignments(studentId);
    }
  };

  const filteredStudents = students.filter(
    (student) =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredCourses = courses.filter(
    (course) =>
      course.title.toLowerCase().includes(courseSearchTerm.toLowerCase()) ||
      course.description.toLowerCase().includes(courseSearchTerm.toLowerCase())
  );

  const CourseCard: React.FC<{
    course: Course;
    isSelected: boolean;
    onClick: () => void;
  }> = ({ course, isSelected, onClick }) => (
    <div
      onClick={onClick}
      className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
        isSelected
          ? "border-blue-500 bg-blue-50 shadow-md"
          : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-slate-800 truncate">
          {course.title}
        </h3>
        {isSelected && (
          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
            <FaCheck className="w-3 h-3 text-white" />
          </div>
        )}
      </div>
      <p className="text-sm text-slate-600 line-clamp-2">
        {course.description}
      </p>
    </div>
  );

  const StudentCard: React.FC<{
    student: Student;
    isSelected: boolean;
    onClick: () => void;
  }> = ({ student, isSelected, onClick }) => {
    const studentCourses = assignmentHistory[student.id] || [];

    return (
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

        {studentCourses.length > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-200">
            <p className="text-xs text-slate-500 mb-2">Currently Enrolled:</p>
            <div className="flex flex-wrap gap-1">
              {studentCourses.slice(0, 3).map((course) => (
                <span
                  key={course.id}
                  className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full"
                >
                  {course.title}
                </span>
              ))}
              {studentCourses.length > 3 && (
                <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-full">
                  +{studentCourses.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const SelectionSummary: React.FC = () => (
    <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl border border-blue-200">
      <h3 className="text-lg font-semibold text-slate-800 mb-4">
        Assignment Summary
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="font-medium text-slate-700 mb-3 flex items-center gap-2">
            <FaGraduationCap className="w-4 h-4" />
            Selected Courses ({selectedCourses.length})
          </h4>
          {selectedCourses.length === 0 ? (
            <p className="text-slate-500 text-sm">No courses selected</p>
          ) : (
            <div className="space-y-2">
              {selectedCourses.map((courseId) => {
                const course = courses.find((c) => c.id === courseId);
                return course ? (
                  <div
                    key={courseId}
                    className="flex items-center justify-between bg-white p-2 rounded border"
                  >
                    <span className="text-sm text-slate-700">
                      {course.title}
                    </span>
                    <button
                      onClick={() => toggleCourseSelection(courseId)}
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
          onClick={handleAssignCourses}
          disabled={
            loading ||
            selectedCourses.length === 0 ||
            selectedStudents.length === 0
          }
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <FaSpinner className="w-4 h-4 animate-spin" />
          ) : (
            <FaUserCheck className="w-4 h-4" />
          )}
          Assign Courses
        </button>

        <button
          onClick={() => {
            setSelectedCourses([]);
            setSelectedStudents([]);
          }}
          className="px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
        >
          Clear Selection
        </button>

        <button
          onClick={() => setShowAssignmentHistory(!showAssignmentHistory)}
          className="px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2"
        >
          <FaListAlt className="w-4 h-4" />
          {showAssignmentHistory ? "Hide" : "Show"} History
        </button>
      </div>
    </div>
  );

  if (loading && courses.length === 0) {
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
            Course Assignment
          </h1>
          <p className="text-slate-600 mt-2">
            Assign courses to students and manage enrollments
          </p>
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

      {/* Selection Summary */}
      {(selectedCourses.length > 0 || selectedStudents.length > 0) && (
        <div className="mb-8">
          <SelectionSummary />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Courses Section */}
        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-slate-800">
                Available Courses
              </h2>
              <span className="text-sm text-slate-500">
                {selectedCourses.length} selected
              </span>
            </div>

            <div className="relative mb-4">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search courses..."
                value={courseSearchTerm}
                onChange={(e) => setCourseSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredCourses.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <FaGraduationCap className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p>No courses found</p>
              </div>
            ) : (
              filteredCourses.map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  isSelected={selectedCourses.includes(course.id)}
                  onClick={() => toggleCourseSelection(course.id)}
                />
              ))
            )}
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

      {/* Assignment History */}
      {showAssignmentHistory && Object.keys(assignmentHistory).length > 0 && (
        <div className="mt-8 bg-white p-6 rounded-xl shadow-md border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">
            Assignment History
          </h3>
          <div className="space-y-4">
            {Object.entries(assignmentHistory).map(
              ([studentId, studentCourses]) => {
                const student = students.find((s) => s.id === studentId);
                if (!student) return null;

                return (
                  <div key={studentId} className="p-4 bg-slate-50 rounded-lg">
                    <h4 className="font-medium text-slate-800 mb-2">
                      {student.name}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {studentCourses.map((course) => (
                        <span
                          key={course.id}
                          className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full"
                        >
                          {course.title}
                        </span>
                      ))}
                      {studentCourses.length === 0 && (
                        <span className="text-slate-500 text-sm">
                          No courses assigned
                        </span>
                      )}
                    </div>
                  </div>
                );
              }
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseAssignment;
