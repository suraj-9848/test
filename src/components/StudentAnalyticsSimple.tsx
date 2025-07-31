import React, { useState, useEffect } from "react";
import { FaUsers, FaChartLine, FaSpinner } from "react-icons/fa";

// Simple types for testing
interface StudentData {
  id: string;
  username: string;
  email: string;
  totalCourses: number;
  completedCourses: number;
  averageProgress: number;
}

const StudentAnalyticsSimple: React.FC = () => {
  const [studentsData, setStudentsData] = useState<StudentData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setStudentsData([
        {
          id: "1",
          username: "Test Student",
          email: "test@example.com",
          totalCourses: 3,
          completedCourses: 1,
          averageProgress: 75,
        },
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <FaSpinner className="animate-spin text-4xl text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <FaUsers className="text-blue-600" />
          System-Wide Student Analytics
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-blue-900">
                  Total Students
                </h3>
                <p className="text-2xl font-bold text-blue-600">
                  {studentsData.length}
                </p>
              </div>
              <FaUsers className="text-blue-600 text-2xl" />
            </div>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-green-900">
                  Active Students
                </h3>
                <p className="text-2xl font-bold text-green-600">
                  {studentsData.filter((s) => s.totalCourses > 0).length}
                </p>
              </div>
              <FaChartLine className="text-green-600 text-2xl" />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {studentsData.map((student) => (
            <div
              key={student.id}
              className="border border-gray-200 rounded-lg p-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {student.username}
                  </h3>
                  <p className="text-sm text-gray-600">{student.email}</p>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600">
                    {student.completedCourses}/{student.totalCourses} courses
                    completed
                  </div>
                  <div className="text-sm font-medium text-blue-600">
                    {student.averageProgress}% average progress
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StudentAnalyticsSimple;
