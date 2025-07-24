import React, { useState, useEffect } from "react";
import {
  FaUsers,
  FaChartLine,
  FaDownload,
  FaUserCheck,
  FaTrophy,
  FaSearch,
  FaSpinner,
  FaEye,
  FaBook,
} from "react-icons/fa";

// Types
interface StudentData {
  id: string;
  username: string;
  email: string;
  courses: CourseEnrollment[];
  totalCourses: number;
  completedCourses: number;
  averageProgress: number;
}

interface CourseEnrollment {
  courseId: string;
  courseName: string;
  assignedAt: string;
  completed: boolean;
  progress: number;
}

const StudentAnalytics: React.FC = () => {
  const [studentsData, setStudentsData] = useState<StudentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    // Simulate loading without API call
    setTimeout(() => {
      setStudentsData([
        {
          id: "1",
          username: "Test Student",
          email: "test@example.com",
          courses: [
            {
              courseId: "1",
              courseName: "Test Course",
              assignedAt: "2024-01-01",
              completed: false,
              progress: 75
            }
          ],
          totalCourses: 1,
          completedCourses: 0,
          averageProgress: 75
        }
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredStudents = studentsData.filter(student =>
    student.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalStudents = studentsData.length;
  const activeStudents = studentsData.filter(s => s.totalCourses > 0).length;
  const completedStudents = studentsData.filter(s => s.completedCourses > 0).length;
  const overallAverageProgress = totalStudents > 0 
    ? Math.round(studentsData.reduce((sum, s) => sum + s.averageProgress, 0) / totalStudents)
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <FaSpinner className="animate-spin text-4xl text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4 sm:mb-0 flex items-center gap-2">
            <FaUsers className="text-blue-600" />
            System-Wide Student Analytics
          </h1>
          <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            <FaDownload />
            Export Data
          </button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-blue-900">Total Students</h3>
                <p className="text-2xl font-bold text-blue-600">{totalStudents}</p>
              </div>
              <FaUsers className="text-blue-600 text-2xl" />
            </div>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-green-900">Active Students</h3>
                <p className="text-2xl font-bold text-green-600">{activeStudents}</p>
              </div>
              <FaUserCheck className="text-green-600 text-2xl" />
            </div>
          </div>
          
          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-yellow-900">Completed Courses</h3>
                <p className="text-2xl font-bold text-yellow-600">{completedStudents}</p>
              </div>
              <FaTrophy className="text-yellow-600 text-2xl" />
            </div>
          </div>
          
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-purple-900">Avg Progress</h3>
                <p className="text-2xl font-bold text-purple-600">{overallAverageProgress}%</p>
              </div>
              <FaChartLine className="text-purple-600 text-2xl" />
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mb-6">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search students by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Students List */}
        {filteredStudents.length === 0 ? (
          <div className="text-center py-8">
            <FaUsers className="mx-auto text-gray-400 text-4xl mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No students found</h3>
            <p className="text-gray-600">
              {searchTerm ? "Try adjusting your search terms." : "No students are enrolled in any courses yet."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Courses
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Progress
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{student.username}</div>
                        <div className="text-sm text-gray-500">{student.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <FaBook className="text-blue-500 mr-2" />
                        <span className="text-sm text-gray-900">
                          {student.completedCourses}/{student.totalCourses} completed
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {student.courses.slice(0, 2).map(course => course.courseName).join(", ")}
                        {student.courses.length > 2 && ` +${student.courses.length - 2} more`}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-900">{student.averageProgress}%</span>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              student.averageProgress >= 80 
                                ? 'bg-green-100 text-green-800'
                                : student.averageProgress >= 60
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {student.averageProgress >= 80 ? 'Excellent' : 
                               student.averageProgress >= 60 ? 'Good' : 'Needs Improvement'}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${student.averageProgress}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button className="text-blue-600 hover:text-blue-900 flex items-center gap-1">
                        <FaEye />
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentAnalytics;
