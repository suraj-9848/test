"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  FaBriefcase,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaEdit,
  FaTrash,
  FaEye,
  FaPlus,
  FaFilter,
  FaSearch,
} from "react-icons/fa";
import { useToast } from "./ToastContext";
import { recruiterApi } from "../api/recruiterApi";
import JobFormModal from "./JobFormModal";

interface Job {
  id: string;
  title: string;
  companyName: string;
  location: string;
  description: string;
  skills: string[];
  eligibleBranches: string[];
  status: "open" | "closed";
  createdAt: string;
  applications: number;
}

const RecruiterJobs: React.FC = () => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isJobFormOpen, setIsJobFormOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentJob, setCurrentJob] = useState<Job | null>(null);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true);
        // Use the actual API call
        const query: Record<string, string> = {};
        if (statusFilter !== "all") {
          query.status = statusFilter;
        }
        if (searchTerm) {
          query.search = searchTerm;
        }

        const response = await recruiterApi.getJobs(query);

        if (response.success) {
          setJobs(response.jobs || []);
        } else {
          showToast("error", "Failed to fetch jobs");
        }
      } catch (error) {
        console.error("Error fetching jobs:", error);
        showToast("error", "Failed to load jobs");
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, [showToast, statusFilter, searchTerm]);

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const matchesSearch =
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.companyName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || job.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [jobs, searchTerm, statusFilter]);

  const handleCreateJob = async (
    jobData: Omit<Job, "id" | "createdAt" | "applications">,
  ) => {
    try {
      setLoading(true);
      const response = await recruiterApi.createJob(jobData);

      if (response.success) {
        setJobs([
          ...jobs,
          {
            ...response.job,
            applications: 0,
            createdAt: new Date().toISOString(),
          },
        ]);
        showToast("success", "Job created successfully");
      } else {
        throw new Error(response.message || "Failed to create job");
      }
    } catch (error) {
      console.error("Error creating job:", error);
      showToast("error", "Failed to create job");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateJob = async (
    jobData: Omit<Job, "id" | "createdAt" | "applications">,
  ) => {
    try {
      if (!currentJob) return;

      setLoading(true);
      const response = await recruiterApi.updateJob(currentJob.id, jobData);

      if (response.success) {
        setJobs(
          jobs.map((job) =>
            job.id === currentJob.id
              ? {
                  ...response.job,
                  createdAt: job.createdAt,
                  applications: job.applications,
                }
              : job,
          ),
        );
        showToast("success", "Job updated successfully");
      } else {
        throw new Error(response.message || "Failed to update job");
      }
    } catch (error) {
      console.error("Error updating job:", error);
      showToast("error", "Failed to update job");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteJob = async (id: string) => {
    try {
      setLoading(true);
      const response = await recruiterApi.deleteJob(id);

      if (response.success) {
        setJobs(jobs.filter((job) => job.id !== id));
        showToast("success", "Job deleted successfully");
      } else {
        throw new Error(response.message || "Failed to delete job");
      }
    } catch (error) {
      console.error("Error deleting job:", error);
      showToast("error", "Failed to delete job");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateJob = () => {
    setIsEditing(false);
    setCurrentJob(null);
    setIsJobFormOpen(true);
  };

  const handleOpenEditJob = (job: Job) => {
    setIsEditing(true);
    setCurrentJob(job);
    setIsJobFormOpen(true);
  };

  const handleCloseJobForm = () => {
    setIsJobFormOpen(false);
    setCurrentJob(null);
  };

  const handleJobFormSubmit = (
    jobData: Omit<Job, "id" | "createdAt" | "applications">,
  ) => {
    if (isEditing) {
      handleUpdateJob(jobData);
    } else {
      handleCreateJob(jobData);
    }
  };

  const getStatusBadge = (status: string) => {
    return status === "open" ? (
      <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
        Open
      </span>
    ) : (
      <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
        Closed
      </span>
    );
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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Manage Jobs</h1>
          <p className="text-gray-600 mt-1">
            Create, edit, and manage your job listings
          </p>
        </div>
        <button
          className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all duration-200 shadow-lg hover:shadow-xl"
          onClick={handleOpenCreateJob}
        >
          <FaPlus className="w-4 h-4" />
          <span>Post New Job</span>
        </button>
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
              placeholder="Search jobs..."
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
              <option value="open">Open</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Job Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredJobs.length > 0 ? (
          filteredJobs.map((job) => (
            <div
              key={job.id}
              className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 overflow-hidden border border-gray-200"
            >
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-800">
                      {job.title}
                    </h2>
                    <p className="text-gray-600 mt-1">{job.companyName}</p>
                  </div>
                  <div>{getStatusBadge(job.status)}</div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {job.skills.slice(0, 3).map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs"
                    >
                      {skill}
                    </span>
                  ))}
                  {job.skills.length > 3 && (
                    <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">
                      +{job.skills.length - 3}
                    </span>
                  )}
                </div>

                <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm text-gray-500">
                  <div className="flex items-center">
                    <FaMapMarkerAlt className="mr-1" />
                    {job.location}
                  </div>
                  <div className="flex items-center">
                    <FaCalendarAlt className="mr-1" />
                    Posted on {new Date(job.createdAt).toLocaleDateString()}
                  </div>
                  <div className="flex items-center">
                    <FaBriefcase className="mr-1" />
                    {job.applications} applications
                  </div>
                </div>

                <div className="mt-6 flex justify-end space-x-2">
                  <button
                    className="p-2 text-gray-500 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                    onClick={() =>
                      showToast(
                        "success",
                        "View job details functionality would open here",
                      )
                    }
                  >
                    <FaEye className="w-4 h-4" />
                  </button>
                  <button
                    className="p-2 text-gray-500 hover:text-green-500 hover:bg-green-50 rounded-lg transition-colors"
                    onClick={() => handleOpenEditJob(job)}
                  >
                    <FaEdit className="w-4 h-4" />
                  </button>
                  <button
                    className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    onClick={() => handleDeleteJob(job.id)}
                  >
                    <FaTrash className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center py-12 bg-white rounded-xl shadow">
            <FaBriefcase className="w-12 h-12 text-gray-300 mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              No jobs found
            </h3>
            <p className="text-gray-500 mb-6">
              {searchTerm || statusFilter !== "all"
                ? "Try adjusting your search or filter criteria"
                : "Start by posting your first job listing"}
            </p>
            <button
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all duration-200 flex items-center"
              onClick={handleOpenCreateJob}
            >
              <FaPlus className="mr-2" /> Post New Job
            </button>
          </div>
        )}
      </div>

      {/* Job Form Modal */}
      <JobFormModal
        isOpen={isJobFormOpen}
        onClose={handleCloseJobForm}
        onSubmit={handleJobFormSubmit}
        initialData={currentJob || undefined}
        isEditing={isEditing}
      />
    </div>
  );
};

export default RecruiterJobs;
