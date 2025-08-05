"use client";
import React, { useEffect, useState, useCallback } from "react";
import {
  FaBriefcase,
  FaRegClock,
  FaCheck,
  FaUsers,
  FaSyncAlt,
  FaPlus,
  FaEye,
} from "react-icons/fa";
import { useToast } from "./ToastContext";
import { recruiterApi } from "../api/recruiterApi";

interface DashboardStats {
  totalJobs: number;
  openJobs: number;
  closedJobs: number;
  totalApplications: number;
}

const RecruiterDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await recruiterApi.getDashboardStats();
      if (response.success && response.stats) {
        setStats(response.stats);
      } else {
        throw new Error(response.message || "Failed to fetch dashboard stats");
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch dashboard stats");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const statCards = [
    {
      title: "Total Jobs",
      value: stats?.totalJobs || 0,
      icon: FaBriefcase,
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-50",
      textColor: "text-blue-600",
    },
    {
      title: "Open Positions",
      value: stats?.openJobs || 0,
      icon: FaRegClock,
      color: "from-green-500 to-green-600",
      bgColor: "bg-green-50",
      textColor: "text-green-600",
    },
    {
      title: "Closed Jobs",
      value: stats?.closedJobs || 0,
      icon: FaCheck,
      color: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-50",
      textColor: "text-purple-600",
    },
    {
      title: "Total Applications",
      value: stats?.totalApplications || 0,
      icon: FaUsers,
      color: "from-orange-500 to-orange-600",
      bgColor: "bg-orange-50",
      textColor: "text-orange-600",
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-lg text-gray-600">Loading dashboard...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <span className="text-red-500 text-lg font-semibold mb-2">{error}</span>
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded-lg mt-2"
          onClick={fetchStats}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            Recruiter Dashboard
          </h1>
          <p className="text-gray-600 mt-1">
            Overview of your job postings and applications
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
              <FaPlus className="w-5 h-5 text-blue-500" />
              <h3 className="font-semibold text-gray-800">Post New Job</h3>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              Create a new job listing for candidates
            </p>
            <div className="text-xs text-gray-500">
              Fill job details to post
            </div>
          </div>

          <div className="p-4 border border-gray-200 rounded-xl hover:shadow-md transition-all duration-200">
            <div className="flex items-center space-x-3 mb-2">
              <FaEye className="w-5 h-5 text-green-500" />
              <h3 className="font-semibold text-gray-800">View Applications</h3>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              Review candidate applications
            </p>
            <div className="text-xs text-gray-500">
              {stats?.totalApplications || 0} applications pending review
            </div>
          </div>

          <div className="p-4 border border-gray-200 rounded-xl hover:shadow-md transition-all duration-200">
            <div className="flex items-center space-x-3 mb-2">
              <FaBriefcase className="w-5 h-5 text-purple-500" />
              <h3 className="font-semibold text-gray-800">Manage Jobs</h3>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              Edit or update your job postings
            </p>
            <div className="text-xs text-gray-500">
              {stats?.openJobs || 0} active job listings
            </div>
          </div>
        </div>
      </div>

      {/* Job Status / Recent Applications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Job Status</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-gray-700">Open Jobs</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-900">
                  {stats?.openJobs || 0}
                </span>
                <span className="text-xs text-gray-500">
                  (
                  {stats?.totalJobs
                    ? Math.round((stats.openJobs / stats.totalJobs) * 100)
                    : 0}
                  %)
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                <span className="text-gray-700">Closed Jobs</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-900">
                  {stats?.closedJobs || 0}
                </span>
                <span className="text-xs text-gray-500">
                  (
                  {stats?.totalJobs
                    ? Math.round((stats.closedJobs / stats.totalJobs) * 100)
                    : 0}
                  %)
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Recent Activity
          </h2>
          <div className="space-y-3">
            <div className="p-3 border border-gray-100 rounded-lg">
              <p className="text-sm text-gray-800">
                New application received for{" "}
                <span className="font-medium">Senior Developer</span> position
              </p>
              <p className="text-xs text-gray-500 mt-1">Today, 10:45 AM</p>
            </div>
            <div className="p-3 border border-gray-100 rounded-lg">
              <p className="text-sm text-gray-800">
                Job posting for <span className="font-medium">UX Designer</span>{" "}
                is expiring soon
              </p>
              <p className="text-xs text-gray-500 mt-1">Yesterday, 2:30 PM</p>
            </div>
            <div className="p-3 border border-gray-100 rounded-lg">
              <p className="text-sm text-gray-800">
                Subscription plan upgraded to{" "}
                <span className="font-medium">Pro</span>
              </p>
              <p className="text-xs text-gray-500 mt-1">2 days ago</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecruiterDashboard;
