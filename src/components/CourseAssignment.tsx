import React, { useState, useEffect } from "react";
import { instructorApi } from "../api/instructorApi";
import Link from "next/link";
import {
  FaUser,
  FaBook,
  FaCheck,
  FaTimes,
  FaSpinner,
  FaSearch,
  FaUserCheck,
  FaExclamationTriangle,
  FaInfo,
  FaArrowLeft,
  FaUsers,
  FaGraduationCap,
  FaCheckCircle,
  FaBan,
  FaPlus,
  FaTrash,
  FaEye,
  FaEyeSlash,
} from "react-icons/fa";

interface Student {
  id: string;
  username: string;
  email: string;
  name?: string;
  userCourses?: Array<{
    course: {
      id: string;
      title: string;
    };
    completed: boolean;
    assignedAt: string;
  }>;
}

interface Course {
  id: string;
  title: string;
  instructor_name: string;
  start_date: string;
  end_date: string;
  is_public: boolean;
  logo?: string;
}

interface StudentAssignmentStatus {
  isAssigned: boolean;
  isSelected: boolean;
  assignmentDate?: string;
  isCompleted?: boolean;
  enrolledCourses: string[];
}

const CourseAssignment: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [assignmentLoading, setAssignmentLoading] = useState(false);
  const [removeLoading, setRemoveLoading] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showEnrolledStudents, setShowEnrolledStudents] = useState(true);

  useEffect(() => {
    fetchCoursesAndStudents();
  }, []);

  const fetchCoursesAndStudents = async () => {
    setLoading(true);
    setError("");
    try {
      const [coursesData, studentsData] = await Promise.all([
        instructorApi.getCourses(),
        instructorApi.getStudents(),
      ]);

      console.log("Fetched courses:", coursesData);
      console.log("Fetched students:", studentsData);

      setCourses((coursesData as any).courses || []);
      setStudents(studentsData.users || []);

      if (
        !(coursesData as any).courses ||
        (coursesData as any).courses.length === 0
      ) {
        setError("No courses found. Please create a course first.");
      }
      if (!studentsData.users || studentsData.users.length === 0) {
        setError("No students found. Please ensure students are registered.");
      }
    } catch (error: unknown) {
      console.error("Fetch error:", error);
      const message = error instanceof Error ? error.message : String(error);
      setError("Failed to fetch data: " + message);
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async () => {
    if (selectedCourseIds.length === 0 || selectedStudents.length === 0) {
      setError("Please select at least one course and one student");
      return;
    }

    setAssignmentLoading(true);
    setError("");
    setSuccess("");

    try {
      console.log("Assignment request:", {
        courseIds: selectedCourseIds,
        studentIds: selectedStudents,
        coursesCount: selectedCourseIds.length,
        studentsCount: selectedStudents.length,
      });

      // Filter out students who are already assigned to prevent 400 errors
      const studentsToAssign = selectedStudents.filter((studentId) => {
        const student = students.find((s) => s.id === studentId);
        if (!student) return false;

        // Check if student is already assigned to ALL selected courses
        const isAlreadyAssignedToAll = selectedCourseIds.every((courseId) =>
          isStudentAssignedToCourse(student, courseId),
        );

        return !isAlreadyAssignedToAll;
      });

      if (studentsToAssign.length === 0) {
        setError(
          "All selected students are already assigned to the selected courses",
        );
        return;
      }

      // Use your existing API but with filtered students
      const response = await instructorApi.assignCoursesToStudents(
        selectedCourseIds,
        studentsToAssign,
      );

      console.log("Assignment response:", response);

      const assignedCount = studentsToAssign.length;
      const skippedCount = selectedStudents.length - studentsToAssign.length;

      let successMessage = `Successfully assigned ${selectedCourseIds.length} course(s) to ${assignedCount} student(s)`;
      if (skippedCount > 0) {
        successMessage += ` (${skippedCount} students were already enrolled and skipped)`;
      }

      setSuccess(successMessage);
      setSelectedStudents([]);
      setSelectedCourseIds([]);

      // Refresh data to show updated assignments
      setTimeout(() => {
        fetchCoursesAndStudents();
      }, 1000);
    } catch (error: unknown) {
      console.error("Assignment error:", error);
      const message = error instanceof Error ? error.message : String(error);

      // Handle specific error cases
      if (message.includes("already assigned")) {
        setError(
          "Some students are already assigned to the selected courses. Please refresh the page and try again.",
        );
      } else if (message.includes("400")) {
        setError(
          "Assignment failed: Please check if all selected courses and students are valid. Some students might already be enrolled.",
        );
      } else {
        setError("Assignment failed: " + message);
      }
    } finally {
      setAssignmentLoading(false);
    }
  };

  const handleRemoveStudentFromCourse = async (
    studentId: string,
    courseId: string,
  ) => {
    const removeKey = `${studentId}-${courseId}`;
    setRemoveLoading(removeKey);
    setError("");

    try {
      // Try to call your remove API - you might need to create this endpoint
      // Based on your API structure, it should match your assignment pattern

      // Option 1: Direct removal endpoint (if you have one)
      const response = await fetch(
        `/api/instructor/courses/${courseId}/remove-student`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            // Add your auth headers here if needed
          },
          body: JSON.stringify({
            userId: studentId,
          }),
        },
      );

      if (!response.ok) {
        // If direct removal doesn't exist, try using the assignment API with removal logic
        throw new Error(`Failed to remove student: ${response.status}`);
      }

      const result = await response.json();
      setSuccess(`Student successfully removed from course`);

      // Refresh data to show updated assignments
      await fetchCoursesAndStudents();
    } catch (error: unknown) {
      console.error("Remove error:", error);

      // If the removal endpoint doesn't exist, show a helpful message
      const message = error instanceof Error ? error.message : String(error);
      if (
        message.includes("404") ||
        message.includes("Failed to remove student")
      ) {
        setError(
          "Remove endpoint not implemented yet. Please implement: /api/instructor/courses/{courseId}/remove-student",
        );
      } else {
        setError("Failed to remove student from course: " + message);
      }
    } finally {
      setRemoveLoading("");
    }
  };

  const toggleStudentSelection = (studentId: string) => {
    // Check if student is already assigned to ALL selected courses
    const student = students.find((s) => s.id === studentId);
    if (student && selectedCourseIds.length > 0) {
      const isAssignedToAllCourses = selectedCourseIds.every((courseId) =>
        isStudentAssignedToCourse(student, courseId),
      );

      if (isAssignedToAllCourses) {
        return; // Don't toggle if already assigned to all selected courses
      }
    }

    setSelectedStudents((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId],
    );
  };

  const toggleCourseSelection = (courseId: string) => {
    setSelectedCourseIds((prev) => {
      const newSelection = prev.includes(courseId)
        ? prev.filter((id) => id !== courseId)
        : [...prev, courseId];

      // Clear selected students who are already enrolled in the newly selected courses
      if (newSelection.length > prev.length) {
        setSelectedStudents((current) =>
          current.filter((studentId) => {
            const student = students.find((s) => s.id === studentId);
            return student
              ? !isStudentAssignedToCourse(student, courseId)
              : true;
          }),
        );
      }

      return newSelection;
    });
  };

  const selectAllStudents = () => {
    // Only select students who are not already assigned to ALL selected courses
    const availableStudents = getAvailableStudents();

    if (selectedStudents.length === availableStudents.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(availableStudents.map((student) => student.id));
    }
  };

  const selectAllCourses = () => {
    if (selectedCourseIds.length === courses.length) {
      setSelectedCourseIds([]);
      setSelectedStudents([]); // Clear students when clearing courses
    } else {
      setSelectedCourseIds(courses.map((course) => course.id));
      setSelectedStudents([]); // Clear students when selecting all courses
    }
  };

  // Check if student is already assigned to a specific course
  const isStudentAssignedToCourse = (
    student: Student,
    courseId: string,
  ): boolean => {
    if (!student.userCourses || student.userCourses.length === 0) return false;

    const isAssigned = student.userCourses.some(
      (uc) => uc.course.id === courseId,
    );

    // Debug log to see what's happening
    console.log(
      `Checking if ${student.username} is assigned to course ${courseId}:`,
      {
        isAssigned,
        userCourses: student.userCourses.map((uc) => ({
          id: uc.course.id,
          title: uc.course.title,
        })),
        courseId,
      },
    );

    return isAssigned;
  };

  // Get students who are not assigned to ALL selected courses
  const getAvailableStudents = () => {
    if (selectedCourseIds.length === 0) return filteredStudents;

    return filteredStudents.filter((student) => {
      return !selectedCourseIds.every((courseId) =>
        isStudentAssignedToCourse(student, courseId),
      );
    });
  };

  // Get students who are assigned to ANY of the selected courses
  const getEnrolledStudents = () => {
    if (selectedCourseIds.length === 0) return [];

    return filteredStudents.filter((student) => {
      const isEnrolled = selectedCourseIds.some((courseId) =>
        isStudentAssignedToCourse(student, courseId),
      );
      console.log(`Student ${student.username} enrolled check:`, {
        isEnrolled,
        selectedCourseIds,
      });
      return isEnrolled;
    });
  };

  // Get student assignment status for selected courses
  const getStudentStatus = (student: Student): StudentAssignmentStatus => {
    const enrolledCourses = selectedCourseIds.filter((courseId) =>
      isStudentAssignedToCourse(student, courseId),
    );

    const isAssigned = enrolledCourses.length > 0;
    const isSelected = selectedStudents.includes(student.id);

    // Debug log to help troubleshoot
    if (selectedCourseIds.length > 0) {
      console.log(
        `Student ${student.username}: enrolled in ${enrolledCourses.length}/${selectedCourseIds.length} selected courses`,
        {
          enrolledCourses,
          selectedCourseIds,
          isAssigned,
          userCourses: student.userCourses?.map((uc) => uc.course.id),
        },
      );
    }

    return {
      isAssigned,
      isSelected,
      enrolledCourses,
      assignmentDate: student.userCourses?.[0]?.assignedAt,
      isCompleted: false,
    };
  };

  const filteredStudents = students.filter(
    (student) =>
      student.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      false ||
      student.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      false ||
      student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      false,
  );

  // Separate available and enrolled students
  const availableStudents = getAvailableStudents();
  const enrolledStudents = getEnrolledStudents();

  // Combine for display based on showEnrolledStudents setting
  const displayStudents = showEnrolledStudents
    ? [...availableStudents, ...enrolledStudents]
    : availableStudents;

  const StudentCard: React.FC<{
    student: Student;
    status: StudentAssignmentStatus;
    onClick: () => void;
  }> = ({ student, status, onClick }) => {
    const { isAssigned, isSelected, enrolledCourses } = status;
    const displayName = student.name || student.username;

    // Get details about enrolled courses for this student in selected courses only
    const enrollmentDetails = selectedCourseIds
      .map((courseId) => {
        const assignment = student.userCourses?.find(
          (uc) => uc.course.id === courseId,
        );
        const course = courses.find((c) => c.id === courseId);
        return {
          courseId,
          courseName: course?.title || "Unknown Course",
          isAssigned: !!assignment,
          assignedAt: assignment?.assignedAt,
          completed: assignment?.completed || false,
        };
      })
      .filter((detail) => detail.isAssigned);

    // Only show as assigned if they're enrolled in any of the SELECTED courses
    const isEnrolledInSelectedCourses =
      selectedCourseIds.length > 0 && enrollmentDetails.length > 0;

    return (
      <div
        onClick={isEnrolledInSelectedCourses ? undefined : onClick}
        className={`p-4 rounded-xl border-2 transition-all duration-200 relative ${
          isEnrolledInSelectedCourses
            ? "border-gray-400 bg-gray-200 cursor-not-allowed opacity-80"
            : isSelected
              ? "border-blue-500 bg-blue-50 shadow-md cursor-pointer hover:shadow-lg"
              : "border-slate-200 bg-white hover:border-slate-300 cursor-pointer hover:shadow-md"
        }`}
      >
        {/* Diagonal Hash Pattern - ONLY for students enrolled in SELECTED courses */}
        {isEnrolledInSelectedCourses && (
          <div className="absolute inset-0 opacity-60 pointer-events-none rounded-xl overflow-hidden">
            <svg width="100%" height="100%" className="rounded-xl">
              <defs>
                <pattern
                  id={`diagonalHatch-${student.id}`}
                  patternUnits="userSpaceOnUse"
                  width="12"
                  height="12"
                >
                  <path
                    d="M 0,12 l 12,-12 M -3,3 l 6,-6 M 9,15 l 6,-6"
                    stroke="#666666"
                    strokeWidth="2.5"
                  />
                </pattern>
              </defs>
              <rect
                width="100%"
                height="100%"
                fill={`url(#diagonalHatch-${student.id})`}
              />
            </svg>
          </div>
        )}

        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                isEnrolledInSelectedCourses
                  ? "bg-gray-500"
                  : "bg-gradient-to-br from-blue-500 to-purple-600"
              }`}
            >
              <FaUser className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3
                  className={`font-semibold truncate ${
                    isEnrolledInSelectedCourses
                      ? "text-gray-700"
                      : "text-slate-800"
                  }`}
                >
                  {displayName}
                </h3>
                {isEnrolledInSelectedCourses && (
                  <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full whitespace-nowrap">
                    Already Enrolled
                  </span>
                )}
              </div>
              <p
                className={`text-sm truncate ${
                  isEnrolledInSelectedCourses
                    ? "text-gray-600"
                    : "text-slate-600"
                }`}
              >
                {student.email}
              </p>

              {/* Show enrollment details with remove buttons */}
              {isEnrolledInSelectedCourses && enrollmentDetails.length > 0 && (
                <div className="mt-2 space-y-1">
                  {enrollmentDetails.map((detail) => (
                    <div
                      key={detail.courseId}
                      className="flex items-center justify-between bg-white bg-opacity-70 p-2 rounded border"
                    >
                      <div className="flex items-center gap-2 text-xs">
                        <FaCheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                        <span className="text-gray-700 truncate">
                          {detail.courseName}
                        </span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveStudentFromCourse(
                            student.id,
                            detail.courseId,
                          );
                        }}
                        disabled={
                          removeLoading === `${student.id}-${detail.courseId}`
                        }
                        className="ml-2 w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-colors disabled:opacity-50 flex-shrink-0"
                        title={`Remove from ${detail.courseName}`}
                      >
                        {removeLoading ===
                        `${student.id}-${detail.courseId}` ? (
                          <FaSpinner className="w-3 h-3 text-white animate-spin" />
                        ) : (
                          <FaTimes className="w-3 h-3 text-white" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Show "Ready to assign" for available students when courses are selected */}
              {!isEnrolledInSelectedCourses && selectedCourseIds.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-blue-600">
                    Ready to assign to {selectedCourseIds.length} course(s)
                  </p>
                </div>
              )}
            </div>
          </div>

          {isSelected && !isEnrolledInSelectedCourses && (
            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
              <FaCheck className="w-3 h-3 text-white" />
            </div>
          )}

          {isEnrolledInSelectedCourses && (
            <div className="flex items-center text-gray-500">
              <FaBan className="w-5 h-5" />
            </div>
          )}
        </div>
      </div>
    );
  };

  const CourseCard: React.FC<{
    course: Course;
    isSelected: boolean;
    onClick: () => void;
  }> = ({ course, isSelected, onClick }) => {
    // Count how many students are enrolled in this course
    const enrolledCount = students.filter((student) =>
      isStudentAssignedToCourse(student, course.id),
    ).length;

    return (
      <div
        onClick={onClick}
        className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 hover:shadow-md ${
          isSelected
            ? "border-blue-500 bg-blue-50 shadow-md"
            : "border-slate-200 bg-white hover:border-slate-300"
        }`}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
              <FaBook className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-slate-800 truncate">
                {course.title}
              </h3>
              <p className="text-sm text-slate-600 truncate">
                by {course.instructor_name}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {enrolledCount > 0 && (
              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                {enrolledCount} enrolled
              </span>
            )}
            {isSelected && (
              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                <FaCheck className="w-3 h-3 text-white" />
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500">
          <span
            className={`px-2 py-1 rounded ${
              course.is_public
                ? "bg-green-100 text-green-700"
                : "bg-blue-100 text-blue-700"
            }`}
          >
            {course.is_public ? "Public" : "Private"}
          </span>
          <span className="truncate ml-2">
            {new Date(course.start_date).toLocaleDateString()} -{" "}
            {new Date(course.end_date).toLocaleDateString()}
          </span>
        </div>
      </div>
    );
  };

  const SelectionSummary: React.FC = () => {
    return (
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl border border-blue-200">
        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <FaPlus className="w-5 h-5" />
          Assignment Summary
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-slate-700 mb-3 flex items-center gap-2">
              <FaBook className="w-4 h-4" />
              Selected Courses ({selectedCourseIds.length})
            </h4>
            {selectedCourseIds.length === 0 ? (
              <p className="text-slate-500 text-sm">No courses selected</p>
            ) : (
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {selectedCourseIds.slice(0, 3).map((courseId) => {
                  const course = courses.find((c) => c.id === courseId);
                  return course ? (
                    <div
                      key={courseId}
                      className="flex items-center justify-between bg-white p-2 rounded border"
                    >
                      <span className="text-sm text-slate-700 truncate">
                        {course.title}
                      </span>
                      <button
                        onClick={() => toggleCourseSelection(courseId)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <FaTimes className="w-3 h-3" />
                      </button>
                    </div>
                  ) : null;
                })}
                {selectedCourseIds.length > 3 && (
                  <p className="text-xs text-slate-500 text-center">
                    +{selectedCourseIds.length - 3} more courses
                  </p>
                )}
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
                {selectedStudents.slice(0, 3).map((studentId) => {
                  const student = students.find((s) => s.id === studentId);
                  const displayName = student?.name || student?.username;
                  return student ? (
                    <div
                      key={studentId}
                      className="flex items-center justify-between bg-white p-2 rounded border"
                    >
                      <span className="text-sm text-slate-700 truncate">
                        {displayName}
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
                {selectedStudents.length > 3 && (
                  <p className="text-xs text-slate-500 text-center">
                    +{selectedStudents.length - 3} more students
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Assignment Statistics */}
        <div className="mt-4 p-3 bg-white rounded-lg border">
          <h5 className="font-medium text-slate-700 mb-2">
            Assignment Preview
          </h5>
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-blue-600">
                {selectedCourseIds.length * selectedStudents.length}
              </p>
              <p className="text-xs text-slate-500">Total Assignments</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">
                {availableStudents.length}
              </p>
              <p className="text-xs text-slate-500">Available Students</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-orange-600">
                {enrolledStudents.length}
              </p>
              <p className="text-xs text-slate-500">Already Enrolled</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-600">
                {selectedStudents.length}
              </p>
              <p className="text-xs text-slate-500">Selected</p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex gap-4">
          <button
            onClick={handleAssign}
            disabled={
              assignmentLoading ||
              selectedCourseIds.length === 0 ||
              selectedStudents.length === 0
            }
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {assignmentLoading ? (
              <FaSpinner className="w-4 h-4 animate-spin" />
            ) : (
              <FaUserCheck className="w-4 h-4" />
            )}
            {assignmentLoading ? "Assigning..." : "Assign Courses"}
          </button>
          <button
            onClick={() => {
              setSelectedCourseIds([]);
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
  };

  if (loading && courses.length === 0) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <FaSpinner className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
            <p className="text-slate-600">Loading courses and students...</p>
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
            <FaBook className="w-8 h-8" />
            Course Assignment
          </h1>
          <p className="text-slate-600 mt-2">
            Assign courses to students and manage enrollments
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
            href="/dashboard/instructor?section=all-courses"
            className="bg-blue-50 text-blue-600 px-4 py-2 rounded-lg border border-blue-200 hover:bg-blue-100 transition"
          >
            Manage Courses
          </Link>
        </div>
      </div>

      {/* Error Message */}
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

      {/* Info about enrolled students */}
      {selectedCourseIds.length > 0 && enrolledStudents.length > 0 && (
        <div className="mb-6 p-4 bg-gray-50 border border-gray-300 text-gray-700 rounded-lg flex items-start gap-3">
          <FaInfo className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium">Students Already Enrolled</p>
            <p className="text-sm mt-1">
              {enrolledStudents.length} student(s) are already enrolled in the
              selected course(s). They appear grayed out with diagonal hash
              patterns and cannot be selected for assignment. Use the ❌ button
              to remove them from courses if needed.
            </p>
          </div>
        </div>
      )}

      {/* Selection Summary */}
      {(selectedCourseIds.length > 0 || selectedStudents.length > 0) && (
        <div className="mb-8">
          <SelectionSummary />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Courses Section */}
        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
                <FaBook className="w-5 h-5" />
                Available Courses
              </h2>
              <span className="text-sm text-slate-500 bg-slate-100 px-2 py-1 rounded">
                {selectedCourseIds.length} selected
              </span>
            </div>

            {courses.length > 0 && (
              <button
                onClick={selectAllCourses}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium mb-4"
              >
                {selectedCourseIds.length === courses.length
                  ? "Deselect All Courses"
                  : `Select All Courses (${courses.length})`}
              </button>
            )}

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {courses.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <FaBook className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p>No courses available</p>
                  <p className="text-sm mt-1">
                    Create a course first to assign students
                  </p>
                </div>
              ) : (
                courses.map((course) => (
                  <CourseCard
                    key={course.id}
                    course={course}
                    isSelected={selectedCourseIds.includes(course.id)}
                    onClick={() => toggleCourseSelection(course.id)}
                  />
                ))
              )}
            </div>
          </div>
        </div>

        {/* Students Section */}
        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
                <FaUsers className="w-5 h-5" />
                Students
              </h2>
              <div className="flex items-center gap-4">
                <span className="text-sm text-slate-500 bg-slate-100 px-2 py-1 rounded">
                  {selectedStudents.length} selected
                </span>
                <button
                  onClick={() => setShowEnrolledStudents(!showEnrolledStudents)}
                  className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-800 px-2 py-1 rounded border border-slate-300 hover:bg-slate-50 transition"
                >
                  {showEnrolledStudents ? (
                    <FaEyeSlash className="w-3 h-3" />
                  ) : (
                    <FaEye className="w-3 h-3" />
                  )}
                  {showEnrolledStudents ? "Hide" : "Show"} Enrolled
                </button>
              </div>
            </div>

            {/* Search and Select All */}
            <div className="space-y-3 mb-4">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search students by name, username, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {availableStudents.length > 0 && (
                <button
                  onClick={selectAllStudents}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  {selectedStudents.length === availableStudents.length
                    ? "Deselect All"
                    : `Select All Available (${availableStudents.length})`}
                </button>
              )}
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {displayStudents.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <FaUser className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p>
                    {students.length === 0
                      ? "No students available"
                      : "No students match your search"}
                  </p>
                  {students.length === 0 && (
                    <p className="text-sm mt-1">
                      Ensure students are registered in the system
                    </p>
                  )}
                </div>
              ) : (
                displayStudents.map((student) => (
                  <StudentCard
                    key={student.id}
                    student={student}
                    status={getStudentStatus(student)}
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

export default CourseAssignment;
