
import React, { useState } from 'react';
import { FaEdit, FaTrash, FaEye, FaPlus, FaSearch, FaFilter } from 'react-icons/fa';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  college: string;
  status: 'Active' | 'Inactive';
  joinDate: string;
}

interface CollegeManagementProps {
  type: 'college-admins' | 'instructors' | 'students';
}

const CollegeManagement: React.FC<CollegeManagementProps> = ({ type }) => {
  const [users] = useState<User[]>(() => {
    const baseData = [
      {
        id: 1,
        name: 'Dr. Rajesh Kumar',
        email: 'rajesh@aquinas.edu',
        role: type === 'college-admins' ? 'College Admin' : type === 'instructors' ? 'Senior Professor' : 'Final Year',
        college: 'Aquinas College of Engineering',
        status: 'Active' as const,
        joinDate: '2020-01-15'
      },
      {
        id: 2,
        name: 'Prof. Priya Sharma',
        email: 'priya@aquinas.edu',
        role: type === 'college-admins' ? 'Deputy Admin' : type === 'instructors' ? 'Associate Professor' : 'Third Year',
        college: 'Aquinas College of Engineering',
        status: 'Active' as const,
        joinDate: '2021-03-20'
      },
      {
        id: 3,
        name: 'Dr. Amit Patel',
        email: 'amit@aquinas.edu',
        role: type === 'college-admins' ? 'Academic Head' : type === 'instructors' ? 'Assistant Professor' : 'Second Year',
        college: 'Aquinas College of Engineering',
        status: 'Active' as const,
        joinDate: '2019-08-10'
      },
      ...(type === 'students' ? [
        {
          id: 4,
          name: 'Rohit Gupta',
          email: 'rohit@student.aquinas.edu',
          role: 'Fourth Year',
          college: 'Aquinas College of Engineering',
          status: 'Active' as const,
          joinDate: '2020-09-01'
        },
        {
          id: 5,
          name: 'Sneha Reddy',
          email: 'sneha@student.aquinas.edu',
          role: 'First Year',
          college: 'Aquinas College of Engineering',
          status: 'Active' as const,
          joinDate: '2023-09-01'
        }
      ] : [])
    ];
    return baseData;
  });

  const getTitle = () => {
    switch (type) {
      case 'college-admins':
        return 'College Administrators';
      case 'instructors':
        return 'Instructors & Faculty';
      case 'students':
        return 'Students';
      default:
        return 'Users';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'college-admins':
        return '👥';
      case 'instructors':
        return '👨‍🏫';
      case 'students':
        return '🎓';
      default:
        return '👤';
    }
  };

  const getStatusBadge = (status: string) => {
    return status === 'Active' ? (
      <span className="px-3 py-1 text-xs font-medium bg-emerald-100 text-emerald-700 rounded-full">
        Active
      </span>
    ) : (
      <span className="px-3 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full">
        Inactive
      </span>
    );
  };

  return (
    <div className="p-8 bg-gradient-to-br from-gray-50 to-white min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-2xl">{getIcon()}</span>
          </div>
          <div>
            <h2 className="text-3xl font-bold text-gray-800">{getTitle()}</h2>
            <p className="text-gray-600">Manage and monitor {type.replace('-', ' ')}</p>
          </div>
        </div>
        <button className="flex items-center space-x-3 px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-xl hover:from-teal-600 hover:to-cyan-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105">
          <FaPlus className="w-4 h-4" />
          <span className="font-medium">Add New {type === 'college-admins' ? 'Admin' : type === 'instructors' ? 'Instructor' : 'Student'}</span>
        </button>
      </div>

      {/* Filters Card */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8">
        <div className="flex items-center space-x-2 mb-4">
          <FaFilter className="w-4 h-4 text-teal-500" />
          <h3 className="text-lg font-semibold text-gray-800">Filters & Search</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder={`Search ${type}...`}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">College</label>
            <select className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors bg-white">
              <option>All Colleges</option>
              <option>Aquinas College of Engineering</option>
              <option>Aquinas Institute of Technology</option>
              <option>Aquinas Business School</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors bg-white">
              <option>All Status</option>
              <option>Active</option>
              <option>Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">#</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Name</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Email</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Role</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">College</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Join Date</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user, index) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{index + 1}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-teal-400 to-cyan-400 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">{user.name.charAt(0)}</span>
                      </div>
                      <span className="text-sm font-medium text-gray-900">{user.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{user.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-3 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{user.college}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{user.joinDate}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(user.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        <FaEye className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors">
                        <FaEdit className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
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
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-700">Showing</span>
            <select className="px-3 py-1 border border-gray-300 rounded-lg text-sm bg-white">
              <option>5</option>
              <option>10</option>
              <option>25</option>
            </select>
            <span className="text-sm text-gray-700">of {users.length} entries</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-100 transition-colors">
              Previous
            </button>
            <button className="px-4 py-2 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-lg text-sm shadow-md">
              1
            </button>
            <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-100 transition-colors">
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollegeManagement;