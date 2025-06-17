"use client"

import React, { useState } from 'react';
import { FaUser, FaBriefcase, FaCalendar, FaMapMarkerAlt, FaEdit, FaTrash, FaEye, FaPlus } from 'react-icons/fa';

interface Job {
  id: number;
  title: string;
  department: string;
  location: string;
  type: 'Full-time' | 'Part-time' | 'Contract';
  postedDate: string;
  deadline: string;
  applicants: number;
  status: 'Active' | 'Closed' | 'Draft';
}

const ManageHiring: React.FC = () => {
  const [jobs] = useState<Job[]>([
    {
      id: 1,
      title: 'Computer Science Professor',
      department: 'Computer Science',
      location: 'Main Campus',
      type: 'Full-time',
      postedDate: '2023-11-01',
      deadline: '2023-12-01',
      applicants: 25,
      status: 'Active'
    },
    {
      id: 2,
      title: 'Mathematics Lecturer',
      department: 'Mathematics',
      location: 'Main Campus',
      type: 'Full-time',
      postedDate: '2023-10-15',
      deadline: '2023-11-15',
      applicants: 18,
      status: 'Active'
    },
    {
      id: 3,
      title: 'Physics Lab Assistant',
      department: 'Physics',
      location: 'Science Block',
      type: 'Part-time',
      postedDate: '2023-10-20',
      deadline: '2023-11-20',
      applicants: 12,
      status: 'Active'
    },
    {
      id: 4,
      title: 'English Professor',
      department: 'English',
      location: 'Arts Block',
      type: 'Full-time',
      postedDate: '2023-09-15',
      deadline: '2023-10-15',
      applicants: 8,
      status: 'Closed'
    }
  ]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active':
        return (
          <span className="px-3 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
            Active
          </span>
        );
      case 'Closed':
        return (
          <span className="px-3 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full">
            Closed
          </span>
        );
      case 'Draft':
        return (
          <span className="px-3 py-1 text-xs font-medium bg-yellow-100 text-yellow-700 rounded-full">
            Draft
          </span>
        );
      default:
        return null;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'Full-time':
        return (
          <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded">
            Full-time
          </span>
        );
      case 'Part-time':
        return (
          <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-700 rounded">
            Part-time
          </span>
        );
      case 'Contract':
        return (
          <span className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-700 rounded">
            Contract
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Manage Hiring</h2>
        <button className="flex items-center space-x-2 px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors">
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
            <div className="p-3 bg-blue-100 rounded-lg">
              <FaBriefcase className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Jobs</p>
              <p className="text-2xl font-bold text-gray-900">{jobs.filter(j => j.status === 'Active').length}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <FaCalendar className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Applicants</p>
              <p className="text-2xl font-bold text-gray-900">{jobs.reduce((sum, job) => sum + job.applicants, 0)}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <FaUser className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg. Applicants</p>
              <p className="text-2xl font-bold text-gray-900">{Math.round(jobs.reduce((sum, job) => sum + job.applicants, 0) / jobs.length)}</p>
            </div>
            <div className="p-3 bg-teal-100 rounded-lg">
              <FaMapMarkerAlt className="w-6 h-6 text-teal-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
          <input
            type="text"
            placeholder="Search jobs..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
          <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500">
            <option>All Departments</option>
            <option>Computer Science</option>
            <option>Mathematics</option>
            <option>Physics</option>
            <option>English</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Job Type</label>
          <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500">
            <option>All Types</option>
            <option>Full-time</option>
            <option>Part-time</option>
            <option>Contract</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
          <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500">
            <option>All Status</option>
            <option>Active</option>
            <option>Closed</option>
            <option>Draft</option>
          </select>
        </div>
      </div>

      {/* Jobs Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Job Title</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Posted Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deadline</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applicants</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {jobs.map((job, index) => (
              <tr key={job.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{index + 1}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{job.title}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{job.department}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{job.location}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getTypeBadge(job.type)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{job.postedDate}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{job.deadline}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
                    {job.applicants}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(job.status)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center space-x-2">
                    <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                      <FaEye className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-green-600 hover:bg-green-50 rounded-lg">
                      <FaEdit className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
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
          <span className="text-sm text-gray-700">of {jobs.length} entries</span>
        </div>
        
        <div className="flex items-center space-x-2">
          <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50">
            Previous
          </button>
          <button className="px-3 py-1 bg-teal-500 text-white rounded text-sm">
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