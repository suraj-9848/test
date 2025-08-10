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

interface ApplicationUser {
  email?: string;
  username?: string;
  isProUser?: boolean;
  proExpiresAt?: string | Date | null;
  is_pro_user?: boolean;
}

interface Application {
  id: string;
  jobId: string;
  jobTitle: string;
  applicantName: string;
  applicantEmail: string;
  applyDate?: string; // frontend legacy
  appliedAt?: string; // backend field
  resumeUrl?: string;
  status: "applied" | "under_review" | "shortlisted" | "rejected";
  // Optional fields from backend to mark Pro users (support multiple shapes)
  isProUser?: boolean;
  applicantIsPro?: boolean;
  pro?: boolean;
  is_pro_user?: boolean;
  user?: ApplicationUser;
}

const RecruiterApplications: React.FC = () => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<Application[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");
  const [proOnly, setProOnly] = useState<boolean>(false);

  // Helper: derive display fields from possibly different backend shapes
  const getApplicantName = (app: Application): string =>
    app.applicantName?.trim() || app.user?.username?.trim() || "Unknown";
  const getApplicantEmail = (app: Application): string =>
    app.applicantEmail?.trim() || app.user?.email?.trim() || "";

  // Helper: derive Pro flag from various possible fields
  const isProApplicant = (app: Application): boolean => {
    const anyNested: any = app as any;
    const userPro = !!app.user?.isProUser || !!(app.user as any)?.is_pro_user;
    const userExpiryValid = app.user?.proExpiresAt
      ? new Date(app.user.proExpiresAt) > new Date()
      : false;
    return (
      !!app.isProUser ||
      !!app.applicantIsPro ||
      !!app.pro ||
      !!(app.is_pro_user as any) ||
      userPro ||
      userExpiryValid ||
      !!anyNested?.meta?.isProUser ||
      !!anyNested?.candidate?.isProUser
    );
  };

  const getAppliedAt = (app: Application): Date => {
    return new Date(app.applyDate || app.appliedAt || 0);
  };

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

  const proCount = useMemo(
    () => applications.filter((a) => isProApplicant(a)).length,
    [applications],
  );

  const filteredAndSortedApplications = useMemo(() => {
    // Filter applications based on search term and status
    const filtered = applications.filter((app) => {
      const name = getApplicantName(app);
      const email = getApplicantEmail(app);
      const job = app.jobTitle || "";

      const matchesSearch = [name, job, email]
        .join("\n")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || app.status === statusFilter;

      const matchesPro = !proOnly || isProApplicant(app);

      return matchesSearch && matchesStatus && matchesPro;
    });

    // Sort applications
    const sorted = [...filtered];
    switch (sortBy) {
      case "newest":
        sorted.sort(
          (a, b) => getAppliedAt(b).getTime() - getAppliedAt(a).getTime(),
        );
        break;
      case "oldest":
        sorted.sort(
          (a, b) => getAppliedAt(a).getTime() - getAppliedAt(b).getTime(),
        );
        break;
      case "name_asc":
        sorted.sort((a, b) =>
          getApplicantName(a).localeCompare(getApplicantName(b)),
        );
        break;
      case "name_desc":
        sorted.sort((a, b) =>
          getApplicantName(b).localeCompare(getApplicantName(a)),
        );
        break;
      case "pro_first":
        sorted.sort(
          (a, b) => Number(isProApplicant(b)) - Number(isProApplicant(a)),
        );
        break;
    }

    return sorted;
  }, [applications, searchTerm, statusFilter, sortBy, proOnly]);

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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
              <option value="pro_first">Pro First</option>
            </select>
          </div>

          <label className="flex items-center space-x-2 text-sm text-gray-700 select-none">
            <input
              type="checkbox"
              className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              checked={proOnly}
              onChange={(e) => setProOnly(e.target.checked)}
            />
            <span>Show Pro candidates only</span>
          </label>
        </div>

        <div className="mt-3 text-sm text-gray-600">
          Pro applicants: <span className="font-semibold">{proCount}</span>
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
                            {(
                              getApplicantName(application).charAt(0) || "?"
                            ).toUpperCase()}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
                            {getApplicantName(application)}
                            {isProApplicant(application) && (
                              <span className="inline-flex items-center text-[10px] font-medium text-yellow-800 bg-yellow-100 border border-yellow-200 px-1.5 py-0.5 rounded-full">
                                Pro
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">
                            {getApplicantEmail(application)}
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
                        {(() => {
                          const d = getAppliedAt(application);
                          return isNaN(d.getTime())
                            ? "—"
                            : d.toLocaleDateString();
                        })()}
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
                            title={
                              isProApplicant(application)
                                ? "Pro candidate — consider shortlisting"
                                : undefined
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
              {searchTerm || statusFilter !== "all" || proOnly
                ? "Try adjusting your search, filters, or Pro toggle"
                : "You have no job applications yet"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecruiterApplications;
