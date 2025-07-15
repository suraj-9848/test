"use client";
import React, { useState, useEffect, useCallback } from "react";
import {
  FaUsers,
  FaGraduationCap,
  FaChalkboardTeacher,
  FaUserShield,
  FaBuilding,
  FaChartLine,
  FaSyncAlt,
} from "react-icons/fa";
import { userApi } from "@/api/adminApi";
import { useToast } from "./ToastContext";

interface DashboardStats {
  totalUsers: number;
  students: number;
  instructors: number;
  collegeAdmins: number;
  breakdown: {
    students: string;
    instructors: string;
    collegeAdmins: string;
  };
}

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      const response = await userApi.getUserStats();
      setStats(response.stats);
    } catch (error) {
      console.error("Failed to fetch stats:", error);
      showToast("error", "Failed to load dashboard statistics");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const statCards = [
    {
      title: "Total Users",
      value: stats?.totalUsers || 0,
      icon: FaUsers,
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-50",
      textColor: "text-blue-600",
    },
    {
      title: "Students",
      value: stats?.students || 0,
      icon: FaGraduationCap,
      color: "from-green-500 to-green-600",
      bgColor: "bg-green-50",
      textColor: "text-green-600",
      percentage: stats?.breakdown.students,
    },
    {
      title: "Instructors",
      value: stats?.instructors || 0,
      icon: FaChalkboardTeacher,
      color: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-50",
      textColor: "text-purple-600",
      percentage: stats?.breakdown.instructors,
    },
    {
      title: "College Admins",
      value: stats?.collegeAdmins || 0,
      icon: FaUserShield,
      color: "from-orange-500 to-orange-600",
      bgColor: "bg-orange-50",
      textColor: "text-orange-600",
      percentage: stats?.breakdown.collegeAdmins,
    },
  ];

  if (loading) {
    return (
      <div className="p-8 bg-gray-100 min-h-screen">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-lg text-gray-600">
            Loading dashboard...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Overview of your LMS users and statistics
          </p>
        </div>
        <button
          onClick={fetchStats}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          <FaSyncAlt className="w-4 h-4" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((card, index) => (
          <div
            key={index}
            className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-all duration-200"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl ${card.bgColor}`}>
                <card.icon className={`w-6 h-6 ${card.textColor}`} />
              </div>
              {card.percentage && (
                <div className="text-sm text-gray-500 font-medium">
                  {card.percentage}%
                </div>
              )}
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              {card.value.toLocaleString()}
            </h3>
            <p className="text-gray-600 text-sm">{card.title}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200 mb-8">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 border border-gray-200 rounded-xl hover:shadow-md transition-all duration-200">
            <div className="flex items-center space-x-3 mb-2">
              <FaUsers className="w-5 h-5 text-blue-500" />
              <h3 className="font-semibold text-gray-800">User Management</h3>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              Add, edit, or remove users from the system
            </p>
            <div className="text-xs text-gray-500">
              Total: {stats?.totalUsers || 0} users
            </div>
          </div>

          <div className="p-4 border border-gray-200 rounded-xl hover:shadow-md transition-all duration-200">
            <div className="flex items-center space-x-3 mb-2">
              <FaBuilding className="w-5 h-5 text-green-500" />
              <h3 className="font-semibold text-gray-800">Organizations</h3>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              Manage colleges and educational institutions
            </p>
            <div className="text-xs text-gray-500">
              Manage institutional data
            </div>
          </div>

          <div className="p-4 border border-gray-200 rounded-xl hover:shadow-md transition-all duration-200">
            <div className="flex items-center space-x-3 mb-2">
              <FaChartLine className="w-5 h-5 text-purple-500" />
              <h3 className="font-semibold text-gray-800">Analytics</h3>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              View detailed reports and insights
            </p>
            <div className="text-xs text-gray-500">Performance metrics</div>
          </div>
        </div>
      </div>

      {/* Recent Activity / Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Distribution */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            User Distribution
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-gray-700">Students</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-900">
                  {stats?.students || 0}
                </span>
                <span className="text-xs text-gray-500">
                  ({stats?.breakdown.students || 0}%)
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                <span className="text-gray-700">Instructors</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-900">
                  {stats?.instructors || 0}
                </span>
                <span className="text-xs text-gray-500">
                  ({stats?.breakdown.instructors || 0}%)
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                <span className="text-gray-700">College Admins</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-900">
                  {stats?.collegeAdmins || 0}
                </span>
                <span className="text-xs text-gray-500">
                  ({stats?.breakdown.collegeAdmins || 0}%)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* System Status */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            System Status
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-700">User Management</span>
              <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                Active
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-700">Organization Management</span>
              <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                Active
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-700">Hiring Portal</span>
              <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                Active
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-700">Payment System</span>
              <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                Active
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
