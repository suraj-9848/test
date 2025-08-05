"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  FaUsers,
  FaFileAlt,
  FaSort,
  FaSearch,
  FaFilter,
  FaEye,
  FaCheck,
  FaTimes,
} from "react-icons/fa";
import { useToast } from "./ToastContext";
import { recruiterApi } from "../api/recruiterApi";

interface Application {
  id: string;
  jobId: string;
  jobTitle: string;
  applicantName: string;
  applicantEmail: string;
  applyDate: string;
  resumeUrl: string;
  status: "applied" | "under_review" | "shortlisted" | "rejected";
}

const RecruiterApplications: React.FC = () => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<Application[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        setLoading(true);
        const response = await recruiterApi.getApplications();

        if (response.success) {
          setApplications(response.applications || []);
        } else {
          throw new Error(response.message || "Failed to fetch applications");
        }
      } catch (error) {
        console.error("Failed to fetch applications:", error);
        showToast("error", "Failed to load applications");

        // Fallback to empty array if API call fails
        setApplications([]);
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, [showToast]);

  const filteredAndSortedApplications = useMemo(() => {
    // Filter applications based on search term and status
    const filtered = applications.filter((app) => {
      const matchesSearch =
        app.applicantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.applicantEmail.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || app.status === statusFilter;

      return matchesSearch && matchesStatus;
    });

    // Sort applications
    const sorted = [...filtered];
    switch (sortBy) {
      case "newest":
        sorted.sort(
          (a, b) =>
            new Date(b.applyDate).getTime() - new Date(a.applyDate).getTime(),
        );
        break;
      case "oldest":
        sorted.sort(
          (a, b) =>
            new Date(a.applyDate).getTime() - new Date(b.applyDate).getTime(),
        );
        break;
      case "name_asc":
        sorted.sort((a, b) => a.applicantName.localeCompare(b.applicantName));
        break;
      case "name_desc":
        sorted.sort((a, b) => b.applicantName.localeCompare(a.applicantName));
        break;
    }

    return sorted;
  }, [applications, searchTerm, statusFilter, sortBy]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "applied":
        return (
          <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
            Applied
          </span>
        );
      case "under_review":
        return (
          <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
            Under Review
          </span>
        );
      case "shortlisted":
        return (
          <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
            Shortlisted
          </span>
        );
      case "rejected":
        return (
          <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
            Rejected
          </span>
        );
      default:
        return null;
    }
  };

  const handleViewApplication = (id: string) => {
    // In a real app, this would navigate to application details
    console.log(`View application with ID: ${id}`);
  };

  const handleUpdateStatus = (id: string, newStatus: Application["status"]) => {
    // In a real implementation, this would be an API call
    // await recruiterApi.updateApplicationStatus(id, newStatus);

    setApplications(
      applications.map((app) =>
        app.id === id ? { ...app, status: newStatus } : app,
      ),
    );

    showToast("success", "Application status updated successfully");
  };

  if (loading) {
    return (
      <div className="p-8 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Applications</h1>
        <p className="text-gray-600 mt-1">Review and manage job applications</p>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-6 rounded-xl shadow-md mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaSearch className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="pl-10 w-full border border-gray-300 rounded-lg py-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Search applicants or jobs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center space-x-2">
            <FaFilter className="text-gray-500" />
            <select
              className="w-full border border-gray-300 rounded-lg py-2 focus:ring-blue-500 focus:border-blue-500"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="applied">Applied</option>
              <option value="under_review">Under Review</option>
              <option value="shortlisted">Shortlisted</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <FaSort className="text-gray-500" />
            <select
              className="w-full border border-gray-300 rounded-lg py-2 focus:ring-blue-500 focus:border-blue-500"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name_asc">Name (A-Z)</option>
              <option value="name_desc">Name (Z-A)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Applications List */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        {filteredAndSortedApplications.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Applicant
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Position
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Date Applied
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Status
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAndSortedApplications.map((application) => (
                  <tr key={application.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                          <span className="text-gray-700 font-medium">
                            {application.applicantName.charAt(0)}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {application.applicantName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {application.applicantEmail}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {application.jobTitle}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {new Date(application.applyDate).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(application.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          className="text-blue-600 hover:text-blue-900"
                          onClick={() => handleViewApplication(application.id)}
                        >
                          <FaEye className="w-4 h-4" />
                        </button>
                        {application.status !== "shortlisted" && (
                          <button
                            className="text-green-600 hover:text-green-900"
                            onClick={() =>
                              handleUpdateStatus(application.id, "shortlisted")
                            }
                          >
                            <FaCheck className="w-4 h-4" />
                          </button>
                        )}
                        {application.status !== "rejected" && (
                          <button
                            className="text-red-600 hover:text-red-900"
                            onClick={() =>
                              handleUpdateStatus(application.id, "rejected")
                            }
                          >
                            <FaTimes className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12">
            <FaFileAlt className="w-12 h-12 text-gray-300 mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              No applications found
            </h3>
            <p className="text-gray-500">
              {searchTerm || statusFilter !== "all"
                ? "Try adjusting your search or filter criteria"
                : "You have no job applications yet"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecruiterApplications;
