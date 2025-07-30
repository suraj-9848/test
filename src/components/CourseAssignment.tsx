"use client";

import React, { useState, useEffect } from "react";
import { FaSearch, FaUsers, FaBook, FaCheck, FaTimes, FaSpinner } from "react-icons/fa";
import apiClient from "../utils/axiosInterceptor";
import { API_ENDPOINTS } from "../config/urls";

interface Student {
  id: string;
  username: string;
  email: string;
  courses?: Array<{
    courseId: string;
    courseName: string;
    completed: boolean;
    progress: number;
  }>;
}

interface Course {
  id: string;
  title: string;
  description?: string;
  instructor_name: string;
  is_public: boolean;
  batches?: Array<{
    id: string;
    name: string;
  }>;
}

interface CourseAssignmentProps {
  onClose?: () => void;
}

const CourseAssignment: React.FC<CourseAssignmentProps> = ({ onClose }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch students and courses on component mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch students and courses in parallel
      const [studentsResponse, coursesResponse] = await Promise.all([
        apiClient.get(API_ENDPOINTS.INSTRUCTOR.STUDENTS),
        apiClient.get(API_ENDPOINTS.INSTRUCTOR.COURSES)
      ]);

      setStudents(studentsResponse.data.students || []);
      setCourses(coursesResponse.data.courses || coursesResponse.data || []);
    } catch (err: any) {
      console.error("Error fetching data:", err);
      setError(err.response?.data?.message || "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  // Filter students based on search term
  const filteredStudents = students.filter(student =>
    student.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle student selection
  const handleStudentSelect = (studentId: string) => {
    setSelectedStudents(prev => {
      if (prev.includes(studentId)) {
        return prev.filter(id => id !== studentId);
      } else {
        return [...prev, studentId];
      }
    });
  };

  // Handle select all students
  const handleSelectAll = () => {
    if (selectedStudents.length === filteredStudents.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(filteredStudents.map(student => student.id));
    }
  };

  // Check if student is already enrolled in selected course
  const isStudentEnrolled = (student: Student, courseId: string) => {
    return student.courses?.some(course => course.courseId === courseId) || false;
  };

  // Handle course assignment
  const handleAssignCourse = async () => {
    if (!selectedCourse || selectedStudents.length === 0) {
      setError("Please select both a course and at least one student");
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const selectedCourseData = courses.find(course => course.id === selectedCourse);
      
      // Assign course to each selected student
      const assignmentPromises = selectedStudents.map(async (studentId) => {
        try {
          const response = await apiClient.post(`/api/instructor/courses/${selectedCourse}/assign`, {
            userId: studentId,
            courseId: selectedCourse
          });
          return { studentId, success: true, data: response.data };
        } catch (error: any) {
          console.error(`Failed to assign course to student ${studentId}:`, error);
          return { 
            studentId, 
            success: false, 
            error: error.response?.data?.message || "Assignment failed" 
          };
        }
      });

      const results = await Promise.all(assignmentPromises);
      
      // Count successful and failed assignments
      const successful = results.filter(result => result.success);
      const failed = results.filter(result => !result.success);

      if (successful.length > 0) {
        setSuccess(`Successfully assigned "${selectedCourseData?.title}" to ${successful.length} student(s)`);
        
        // Update local student data to reflect the new assignments
        setStudents(prev => prev.map(student => {
          if (selectedStudents.includes(student.id)) {
            const existingCourses = student.courses || [];
            const isAlreadyEnrolled = existingCourses.some(course => course.courseId === selectedCourse);
            
            if (!isAlreadyEnrolled) {
              return {
                ...student,
                courses: [
                  ...existingCourses,
                  {
                    courseId: selectedCourse,
                    courseName: selectedCourseData?.title || "Unknown Course",
                    completed: false,
                    progress: 0
                  }
                ]
              };
            }
          }
          return student;
        }));

        // Reset selections
        setSelectedStudents([]);
        setSelectedCourse("");
      }

      if (failed.length > 0) {
        setError(`Failed to assign course to ${failed.length} student(s). Some may already be enrolled.`);
      }

    } catch (err: any) {
      console.error("Error assigning course:", err);
      setError(err.response?.data?.message || "Failed to assign course");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <FaSpinner className="animate-spin w-8 h-8 text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading students and courses...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Course Assignment</h1>
              <p className="text-gray-600">Assign courses to students individually or in bulk</p>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FaTimes className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-green-700">{success}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Student Selection */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <FaUsers className="w-5 h-5 mr-2 text-blue-600" />
                  Select Students ({selectedStudents.length} selected)
                </h2>
                <button
                  onClick={handleSelectAll}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  {selectedStudents.length === filteredStudents.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>
              
              {/* Search */}
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {filteredStudents.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  {searchTerm ? 'No students found matching your search' : 'No students available'}
                </div>
              ) : (
                <div className="p-4 space-y-2">
                  {filteredStudents.map((student) => (
                    <div
                      key={student.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedStudents.includes(student.id)
                          ? 'bg-blue-50 border-blue-200'
                          : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                      }`}
                      onClick={() => handleStudentSelect(student.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{student.username}</p>
                          <p className="text-sm text-gray-600">{student.email}</p>
                          {student.courses && student.courses.length > 0 && (
                            <p className="text-xs text-gray-500 mt-1">
                              Enrolled in {student.courses.length} course(s)
                            </p>
                          )}
                        </div>
                        {selectedStudents.includes(student.id) && (
                          <FaCheck className="w-4 h-4 text-blue-600" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Course Selection and Assignment */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <FaBook className="w-5 h-5 mr-2 text-green-600" />
                Select Course
              </h2>
            </div>

            <div className="p-6 space-y-4">
              {/* Course Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Choose a course to assign
                </label>
                <select
                  value={selectedCourse}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select a course...</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.title} {course.is_public ? '(Public)' : '(Private)'} - {course.instructor_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Selected Course Details */}
              {selectedCourse && (
                <div className="bg-gray-50 rounded-lg p-4">
                  {(() => {
                    const course = courses.find(c => c.id === selectedCourse);
                    return course ? (
                      <div>
                        <h3 className="font-medium text-gray-900 mb-2">{course.title}</h3>
                        <p className="text-sm text-gray-600 mb-2">
                          Instructor: {course.instructor_name}
                        </p>
                        {course.description && (
                          <p className="text-sm text-gray-600 mb-2">{course.description}</p>
                        )}
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            course.is_public 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {course.is_public ? 'Public Course' : 'Private Course'}
                          </span>
                        </div>
                      </div>
                    ) : null;
                  })()}
                </div>
              )}

              {/* Assignment Summary */}
              {selectedStudents.length > 0 && selectedCourse && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="font-medium text-blue-900 mb-2">Assignment Summary</h3>
                  <p className="text-sm text-blue-800">
                    You are about to assign <strong>{courses.find(c => c.id === selectedCourse)?.title}</strong> to{' '}
                    <strong>{selectedStudents.length}</strong> student(s).
                  </p>
                  
                  {/* Show already enrolled students */}
                  {(() => {
                    const enrolledStudents = selectedStudents.filter(studentId => {
                      const student = students.find(s => s.id === studentId);
                      return student ? isStudentEnrolled(student, selectedCourse) : false;
                    });
                    
                    if (enrolledStudents.length > 0) {
                      return (
                        <p className="text-sm text-orange-700 mt-2">
                          Note: {enrolledStudents.length} selected student(s) are already enrolled in this course.
                        </p>
                      );
                    }
                    return null;
                  })()}
                </div>
              )}

              {/* Assignment Button */}
              <button
                onClick={handleAssignCourse}
                disabled={!selectedCourse || selectedStudents.length === 0 || submitting}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                  !selectedCourse || selectedStudents.length === 0 || submitting
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {submitting ? (
                  <div className="flex items-center justify-center">
                    <FaSpinner className="animate-spin w-4 h-4 mr-2" />
                    Assigning Course...
                  </div>
                ) : (
                  `Assign Course to ${selectedStudents.length} Student(s)`
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{students.length}</div>
              <div className="text-sm text-gray-600">Total Students</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{courses.length}</div>
              <div className="text-sm text-gray-600">Available Courses</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{selectedStudents.length}</div>
              <div className="text-sm text-gray-600">Students Selected</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseAssignment;
