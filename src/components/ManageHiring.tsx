"use client";

import React, { useMemo, useEffect, useState } from "react";
import {
  FaUser,
  FaBriefcase,
  FaCalendar,
  FaMapMarkerAlt,
  FaEdit,
  FaTrash,
  FaEye,
  FaPlus,
} from "react-icons/fa";
import { useHiringStore, JobStatus, JobType } from "@/store/hiringStore";
import { useToast } from "./ToastContext";
import { recruiterApi } from "@/api/recruiterApi";

const ManageHiring: React.FC = () => {
  const {
    jobs,
    search,
    departmentFilter,
    typeFilter,
    statusFilter,
    setSearch,
    setDepartmentFilter,
    setTypeFilter,
    setStatusFilter,

    deleteJob,
  } = useHiringStore();

  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const matchesSearch =
        search.trim() === "" ||
        job.title.toLowerCase().includes(search.toLowerCase());
      const matchesDept =
        departmentFilter === "All Departments" ||
        job.department === departmentFilter;
      const matchesType = typeFilter === "All" || job.type === typeFilter;
      const matchesStatus =
        statusFilter === "All" || job.status === statusFilter;
      return matchesSearch && matchesDept && matchesType && matchesStatus;
    });
  }, [jobs, search, departmentFilter, typeFilter, statusFilter]);

  const departmentOptions = useMemo(() => {
    const all = jobs.map((j) => j.department);
    return ["All Departments", ...Array.from(new Set(all))];
  }, [jobs]);

  const getStatusBadge = (status: JobStatus) => {
    switch (status) {
      case "Active":
        return (
          <span className="px-3 py-1 text-xs font-medium bg-gray-200 text-gray-800 rounded-full">
            Active
          </span>
        );
      case "Closed":
        return (
          <span className="px-3 py-1 text-xs font-medium bg-gray-300 text-gray-900 rounded-full">
            Closed
          </span>
        );
      case "Draft":
        return (
          <span className="px-3 py-1 text-xs font-medium bg-gray-400 text-white rounded-full">
            Draft
          </span>
        );
      default:
        return null;
    }
  };

  // const getTypeBadge = (type: JobType) => {
  //   return (
  //     <span className="px-2 py-1 text-xs font-medium bg-gray-200 text-gray-800 rounded">
  //       {type}
  //     </span>
  //   );
  // };

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true);
        setApiError(null);
        // Fetch jobs from recruiter API
        const query: Record<string, string> = {};
        if (statusFilter !== "All") query.status = statusFilter;
        if (search) query.search = search;
        // You may add department/type filters if API supports
        const response = await recruiterApi.getJobs(query);
        if (response.success && response.jobs) {
          // Update jobs in store
          // If useHiringStore has a setJobs method, use it. Otherwise, update jobs directly if possible.
          // setJobs(response.jobs);
          // If jobs is managed in store, you may need to dispatch or call a setter here.
        } else {
          throw new Error(response.message || "Failed to fetch jobs");
        }
      } catch (error: any) {
        setApiError(error.message || "Failed to fetch jobs");
        showToast("error", "Failed to load jobs");
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, [search, departmentFilter, typeFilter, statusFilter, showToast]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-lg text-gray-600">Loading jobs...</span>
      </div>
    );
  }

  if (apiError) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <span className="text-red-500 text-lg font-semibold mb-2">
          {apiError}
        </span>
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded-lg mt-2"
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Manage Hiring</h2>
        <button className="flex items-center space-x-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors">
          <FaPlus className="w-4 h-4" />
          <span>Post New Job</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Jobs</p>
              <p className="text-2xl font-bold text-gray-900">{jobs.length}</p>
            </div>
            <div className="p-3 bg-gray-200 rounded-lg">
              <FaBriefcase className="w-6 h-6 text-gray-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Jobs</p>
              <p className="text-2xl font-bold text-gray-900">
                {jobs.filter((j) => j.status === "Active").length}
              </p>
            </div>
            <div className="p-3 bg-gray-200 rounded-lg">
              <FaCalendar className="w-6 h-6 text-gray-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Total Applicants
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {jobs.reduce((sum, job) => sum + job.applicants, 0)}
              </p>
            </div>
            <div className="p-3 bg-gray-200 rounded-lg">
              <FaUser className="w-6 h-6 text-gray-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Avg. Applicants
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {Math.round(
                  jobs.reduce((sum, job) => sum + job.applicants, 0) /
                    jobs.length,
                )}
              </p>
            </div>
            <div className="p-3 bg-gray-200 rounded-lg">
              <FaMapMarkerAlt className="w-6 h-6 text-gray-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Search
          </label>
          <input
            type="text"
            placeholder="Search jobs..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Department
          </label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
          >
            {departmentOptions.map((dept) => (
              <option key={dept}>{dept}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Job Type
          </label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as JobType | "All")}
          >
            <option value="All">All Types</option>
            <option value="Full-time">Full-time</option>
            <option value="Part-time">Part-time</option>
            <option value="Contract">Contract</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Status
          </label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as JobStatus | "All")
            }
          >
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="Closed">Closed</option>
            <option value="Draft">Draft</option>
          </select>
        </div>
      </div>

      {/* Jobs Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Job Title
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Applicants
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Posted Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Deadline
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredJobs.map((job) => (
              <tr key={job.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-900">
                      {job.title}
                    </span>
                    <span className="text-xs text-gray-500">
                      {job.department}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {job.applicants}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {job.postedDate}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {job.deadline}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(job.status)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center space-x-2">
                    <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
                      <FaEye className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
                      <FaEdit className="w-4 h-4" />
                    </button>
                    <button
                      className="p-2 text-red-500 hover:bg-red-100 rounded-lg"
                      onClick={() => deleteJob(job.id)}
                    >
                      <FaTrash className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-6">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-700">Showing</span>
          <select className="px-2 py-1 border border-gray-300 rounded text-sm">
            <option>5</option>
            <option>10</option>
            <option>25</option>
          </select>
          <span className="text-sm text-gray-700">
            of {jobs.length} entries
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50">
            Previous
          </button>
          <button className="px-3 py-1 bg-gray-800 text-white rounded text-sm">
            1
          </button>
          <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50">
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default ManageHiring;
