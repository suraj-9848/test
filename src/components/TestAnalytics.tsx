"use client";

import React, { useState, useEffect } from "react";
import {
  FaChartBar,
  FaChartPie,
  FaUsers,
  FaClipboardCheck,
  FaClock,
  FaTrophy,
  FaExclamationTriangle,
  FaSpinner,
  FaDownload,
  FaEye,
  FaSyncAlt,
} from "react-icons/fa";
import {
  instructorApi,
  Test,
  TestStatistics,
  StudentTestAnalytics,
} from "../api/instructorApi";

interface TestAnalyticsProps {
  testId?: string;
}

const TestAnalytics: React.FC<TestAnalyticsProps> = ({ testId }) => {
  const [tests, setTests] = useState<Test[]>([]);
  const [selectedTest, setSelectedTest] = useState<Test | null>(null);
  const [statistics, setStatistics] = useState<TestStatistics | null>(null);
  const [analytics, setAnalytics] = useState<StudentTestAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [activeView, setActiveView] = useState<
    "overview" | "students" | "performance"
  >("overview");
  const [filterStatus, setFilterStatus] = useState<
    "ALL" | "COMPLETED" | "IN_PROGRESS" | "NOT_STARTED"
  >("ALL");

  useEffect(() => {
    fetchTests();
  }, []);

  useEffect(() => {
    if (testId) {
      const test = tests.find((t) => t.id === testId);
      if (test) {
        setSelectedTest(test);
        fetchTestData(test.id);
      }
    }
  }, [testId, tests]);

  const fetchTests = async () => {
    setLoading(true);
    setError("");
    try {
      // This would need to be implemented to fetch all tests
      // For now, we'll simulate with empty array
      setTests([]);
    } catch (err) {
      setError("Failed to fetch tests");
      console.error("Error fetching tests:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTestData = async (testId: string) => {
    setLoading(true);
    setError("");
    try {
      const [statsResponse, analyticsResponse] = await Promise.all([
        instructorApi.getTestStatistics(testId),
        instructorApi.getTestAnalytics(testId),
      ]);

      setStatistics(statsResponse.statistics);
      setAnalytics(analyticsResponse);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch test data"
      );
      console.error("Error fetching test data:", err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-100 text-green-700";
      case "IN_PROGRESS":
        return "bg-yellow-100 text-yellow-700";
      case "NOT_STARTED":
        return "bg-red-100 text-red-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  const filteredStudents =
    analytics?.students.filter(
      (student) => filterStatus === "ALL" || student.status === filterStatus
    ) || [];

  const StatCard: React.FC<{
    title: string;
    value: string | number;
    icon: React.ReactNode;
    color: string;
    subtitle?: string;
  }> = ({ title, value, icon, color, subtitle }) => (
    <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-600">{title}</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
          {subtitle && (
            <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
          )}
        </div>
        <div
          className={`w-12 h-12 rounded-lg flex items-center justify-center ${color}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );

  const ProgressBar: React.FC<{
    label: string;
    value: number;
    total: number;
    color: string;
  }> = ({ label, value, total, color }) => {
    const percentage = total > 0 ? (value / total) * 100 : 0;

    return (
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-slate-600">{label}</span>
          <span className="text-slate-900 font-medium">
            {value}/{total} ({percentage.toFixed(1)}%)
          </span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${color}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    );
  };

  const StudentTable: React.FC = () => (
    <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-200">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-slate-800">
            Student Performance
          </h3>
          <div className="flex items-center gap-4">
            <select
              value={filterStatus}
              onChange={(e) =>
                setFilterStatus(
                  e.target.value as
                    | "ALL"
                    | "COMPLETED"
                    | "IN_PROGRESS"
                    | "NOT_STARTED"
                )
              }
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="ALL">All Students</option>
              <option value="COMPLETED">Completed</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="NOT_STARTED">Not Started</option>
            </select>
            <button className="flex items-center gap-2 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
              <FaDownload className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Student
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Score
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Submitted At
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {filteredStudents.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-8 text-center text-slate-500"
                >
                  No students found with the selected filter
                </td>
              </tr>
            ) : (
              filteredStudents.map((student) => (
                <tr key={student.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-medium text-sm">
                          {student.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-slate-900">
                          {student.name}
                        </div>
                        <div className="text-sm text-slate-500">
                          {student.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                        student.status
                      )}`}
                    >
                      {student.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                    {student.score !== undefined ? (
                      <div className="flex items-center">
                        <span className="font-medium">{student.score}</span>
                        {statistics && (
                          <span className="text-slate-500 ml-1">
                            /{statistics.totalMarks}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    {student.submittedAt ? (
                      new Date(student.submittedAt).toLocaleDateString()
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button className="text-blue-600 hover:text-blue-900 flex items-center gap-1">
                      <FaEye className="w-4 h-4" />
                      View Details
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const PerformanceChart: React.FC = () => {
    if (!statistics) return null;

    const performanceData = [
      { label: "Excellent (90-100%)", count: 0, color: "bg-green-500" },
      { label: "Good (70-89%)", count: 0, color: "bg-blue-500" },
      { label: "Average (50-69%)", count: 0, color: "bg-yellow-500" },
      { label: "Below Average (<50%)", count: 0, color: "bg-red-500" },
    ];

    // This would be calculated from actual score distribution
    const maxCount = Math.max(...performanceData.map((d) => d.count), 1);

    return (
      <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-800 mb-6">
          Performance Distribution
        </h3>
        <div className="space-y-4">
          {performanceData.map((item, index) => (
            <div key={index} className="flex items-center gap-4">
              <div className="w-24 text-sm text-slate-600">{item.label}</div>
              <div className="flex-1 bg-slate-200 rounded-full h-6 relative">
                <div
                  className={`h-6 rounded-full transition-all duration-300 ${item.color}`}
                  style={{ width: `${(item.count / maxCount) * 100}%` }}
                />
                <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-slate-700">
                  {item.count} students
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (!selectedTest) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="text-center py-12">
          <FaChartBar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-800 mb-2">
            No Test Selected
          </h3>
          <p className="text-slate-600">
            Please select a test to view analytics
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Test Analytics</h1>
          <p className="text-slate-600 mt-2">
            {selectedTest.title} - {selectedTest.course.title}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => fetchTestData(selectedTest.id)}
            className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <FaSyncAlt className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-2">
          <FaExclamationTriangle className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex gap-1 mb-8 bg-slate-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveView("overview")}
          className={`px-4 py-2 rounded-md font-medium transition-colors ${
            activeView === "overview"
              ? "bg-white text-blue-600 shadow-sm"
              : "text-slate-600 hover:text-slate-800"
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveView("students")}
          className={`px-4 py-2 rounded-md font-medium transition-colors ${
            activeView === "students"
              ? "bg-white text-blue-600 shadow-sm"
              : "text-slate-600 hover:text-slate-800"
          }`}
        >
          Student Details
        </button>
        <button
          onClick={() => setActiveView("performance")}
          className={`px-4 py-2 rounded-md font-medium transition-colors ${
            activeView === "performance"
              ? "bg-white text-blue-600 shadow-sm"
              : "text-slate-600 hover:text-slate-800"
          }`}
        >
          Performance Analysis
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <FaSpinner className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      ) : (
        <>
          {activeView === "overview" && (
            <div className="space-y-8">
              {/* Key Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                  title="Total Students"
                  value={analytics?.totalStudents || 0}
                  icon={<FaUsers className="w-6 h-6 text-blue-600" />}
                  color="bg-blue-100"
                />
                <StatCard
                  title="Completed"
                  value={analytics?.completedStudents || 0}
                  icon={<FaClipboardCheck className="w-6 h-6 text-green-600" />}
                  color="bg-green-100"
                  subtitle={`${
                    analytics?.totalStudents
                      ? (
                          (analytics.completedStudents /
                            analytics.totalStudents) *
                          100
                        ).toFixed(1)
                      : 0
                  }% completion rate`}
                />
                <StatCard
                  title="Average Score"
                  value={
                    statistics?.averageScore
                      ? `${statistics.averageScore.toFixed(1)}%`
                      : "-"
                  }
                  icon={<FaTrophy className="w-6 h-6 text-yellow-600" />}
                  color="bg-yellow-100"
                />
                <StatCard
                  title="Pass Rate"
                  value={
                    statistics?.passRate
                      ? `${statistics.passRate.toFixed(1)}%`
                      : "-"
                  }
                  icon={<FaChartBar className="w-6 h-6 text-purple-600" />}
                  color="bg-purple-100"
                />
              </div>

              {/* Progress Overview */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200">
                  <h3 className="text-lg font-semibold text-slate-800 mb-6">
                    Student Progress
                  </h3>
                  <div className="space-y-4">
                    <ProgressBar
                      label="Completed"
                      value={analytics?.completedStudents || 0}
                      total={analytics?.totalStudents || 0}
                      color="bg-green-500"
                    />
                    <ProgressBar
                      label="In Progress"
                      value={
                        analytics?.students?.filter(
                          (s) => s.status === "IN_PROGRESS"
                        ).length || 0
                      }
                      total={analytics?.totalStudents || 0}
                      color="bg-yellow-500"
                    />
                    <ProgressBar
                      label="Not Started"
                      value={analytics?.pendingStudents || 0}
                      total={analytics?.totalStudents || 0}
                      color="bg-red-500"
                    />
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200">
                  <h3 className="text-lg font-semibold text-slate-800 mb-6">
                    Test Information
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Total Questions</span>
                      <span className="font-medium">
                        {statistics?.questionCount || 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Total Marks</span>
                      <span className="font-medium">
                        {statistics?.totalMarks || 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Passing Marks</span>
                      <span className="font-medium">
                        {statistics?.passingMarks || 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Duration</span>
                      <span className="font-medium">
                        {selectedTest.durationInMinutes} minutes
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Highest Score</span>
                      <span className="font-medium text-green-600">
                        {statistics?.highestScore || 0}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Lowest Score</span>
                      <span className="font-medium text-red-600">
                        {statistics?.lowestScore || 0}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeView === "students" && <StudentTable />}

          {activeView === "performance" && (
            <div className="space-y-8">
              <PerformanceChart />

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200">
                  <h3 className="text-lg font-semibold text-slate-800 mb-6">
                    Score Distribution
                  </h3>
                  <div className="text-center py-8 text-slate-500">
                    <FaChartPie className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p>Score distribution chart would be displayed here</p>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200">
                  <h3 className="text-lg font-semibold text-slate-800 mb-6">
                    Time Analysis
                  </h3>
                  <div className="text-center py-8 text-slate-500">
                    <FaClock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p>Time analysis would be displayed here</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TestAnalytics;
