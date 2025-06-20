'use client';
import React, { useMemo } from 'react';
import {
  FaEdit,
  FaTrash,
  FaEye,
  FaPlus,
  FaSearch,
  FaFilter,
} from 'react-icons/fa';
import {
  useAdminStore,
  AdminUser,
  InstructorUser,
  StudentUser,
  UserStatus,
} from '@/store/adminStore';

interface CollegeManagementProps {
  type: 'college-admins' | 'instructors' | 'students';
}

const CollegeManagement: React.FC<CollegeManagementProps> = ({ type }) => {
  const {
    admins,
    instructors,
    students,
    search,
    collegeFilter,
    statusFilter,
    setSearch,
    setCollegeFilter,
    setStatusFilter,
    addUser,
    deleteUser,
  } = useAdminStore();

  const users = useMemo(() => {
    switch (type) {
      case 'college-admins':
        return admins as AdminUser[];
      case 'instructors':
        return instructors as InstructorUser[];
      case 'students':
        return students as StudentUser[];
      default:
        return [];
    }
  }, [type, admins, instructors, students]);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        search.trim() === '' ||
        user.name.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase());
      const matchesCollege =
        collegeFilter === 'All Colleges' || user.college === collegeFilter;
      const matchesStatus =
        statusFilter === 'All' || user.status === statusFilter;
      return matchesSearch && matchesCollege && matchesStatus;
    });
  }, [users, search, collegeFilter, statusFilter]);

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

  const getStatusBadge = (status: UserStatus) => {
    return status === 'Active' ? (
      <span className="px-3 py-1 text-xs font-medium bg-gray-200 text-gray-800 rounded-full">
        Active
      </span>
    ) : (
      <span className="px-3 py-1 text-xs font-medium bg-gray-300 text-gray-900 rounded-full">
        Inactive
      </span>
    );
  };

  const collegeOptions = useMemo(() => {
    const all = users.map((u) => u.college);
    return ['All Colleges', ...Array.from(new Set(all))];
  }, [users]);

  const handleAddUser = () => {
    const base = {
      id: Date.now(),
      name: 'New User',
      email: 'new@user.com',
      college: 'Aquinas College of Engineering',
      status: 'Active' as UserStatus,
      joinDate: new Date().toISOString().slice(0, 10),
    };

    if (type === 'college-admins') {
      addUser(type, {
        ...base,
        role: 'College Admin',
      } as AdminUser);
    } else if (type === 'instructors') {
      addUser(type, {
        ...base,
        role: 'Senior Professor',
      } as InstructorUser);
    } else {
      addUser(type, {
        ...base,
        role: 'First Year',
      } as StudentUser);
    }
  };

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gray-800 rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-2xl text-white">{getIcon()}</span>
          </div>
          <div>
            <h2 className="text-3xl font-bold text-gray-800">{getTitle()}</h2>
            <p className="text-gray-600">
              Manage and monitor {type.replace('-', ' ')}
            </p>
          </div>
        </div>
        <button
          className="flex items-center space-x-3 px-6 py-3 bg-gray-800 text-white rounded-xl hover:bg-gray-900 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
          onClick={handleAddUser}
        >
          <FaPlus className="w-4 h-4" />
          <span className="font-medium">
            Add New {type === 'college-admins' ? 'Admin' : type === 'instructors' ? 'Instructor' : 'Student'}
          </span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-8">
        <div className="flex items-center space-x-2 mb-4">
          <FaFilter className="w-4 h-4 text-gray-500" />
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
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">College</label>
            <select
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-gray-500 bg-white"
              value={collegeFilter}
              onChange={(e) => setCollegeFilter(e.target.value)}
            >
              {collegeOptions.map((college) => (
                <option key={college}>{college}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-gray-500 bg-white"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as UserStatus | 'All')}
            >
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                {['#', 'Name', 'Email', 'Role', 'College', 'Join Date', 'Status', 'Actions'].map((heading) => (
                  <th key={heading} className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user, index) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{index + 1}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">{user.name.charAt(0)}</span>
                      </div>
                      <span className="text-sm font-medium text-gray-900">{user.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 text-xs font-medium bg-gray-200 text-gray-800 rounded-full">
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{user.college}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{user.joinDate}</td>
                  <td className="px-6 py-4">{getStatusBadge(user.status)}</td>
                  <td className="px-6 py-4 flex gap-2">
                    <button className="text-gray-500 hover:text-gray-700 p-1"><FaEye /></button>
                    <button className="text-gray-500 hover:text-gray-700 p-1"><FaEdit /></button>
                    <button
                      className="text-red-500 hover:text-red-700 p-1"
                      onClick={() => deleteUser(type, user.id)}
                    >
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CollegeManagement;
