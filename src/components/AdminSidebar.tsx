import React, { useState } from 'react';
import {
  FaUniversity,
  FaUserTie,
  FaChevronDown,
  FaChevronRight,
  FaBars,
  FaRupeeSign,
} from 'react-icons/fa';

interface SidebarProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeSection, setActiveSection }) => {
  const [isCollegesExpanded, setIsCollegesExpanded] = useState(true);
  const [collapsed, setCollapsed] = useState(false);

  const roleButtons = [
    { key: 'college-admins', label: 'Admins', icon: '👥' },
    { key: 'instructors', label: 'Instructors', icon: '👨‍🏫' },
    { key: 'students', label: 'Students', icon: '🎓' },
  ];

  return (
    <div
      className={`h-screen bg-gradient-to-b from-slate-50 to-white shadow-xl border-r border-gray-200 transition-all duration-300 ease-in-out
        ${collapsed ? 'w-28' : 'w-80'} flex flex-col`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center space-x-3 overflow-hidden">
          <div className="w-10 h-10 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-lg">N</span>
          </div>
          {!collapsed && (
            <div className="whitespace-nowrap">
              <span className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
                NIRUDHYOG
              </span>
              <p className="text-sm text-gray-500 -mt-1">Admin Dashboard</p>
            </div>
          )}
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 rounded hover:bg-gray-100 text-gray-600"
        >
          <FaBars />
        </button>
      </div>

      {/* Nav */}
      <nav className="mt-6 px-2 flex-1 overflow-y-auto">
        <div className="space-y-4">
          {/* View Colleges */}
          <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
            <button
              onClick={() => setIsCollegesExpanded(!isCollegesExpanded)}
              className="w-full flex items-center justify-between text-gray-700 hover:text-teal-600 transition-colors mb-4"
            >
              <div className={`flex items-center space-x-3`}>
                <FaUniversity className="w-5 h-5  text-teal-500" />
                {!collapsed && (
                  <span className="font-semibold text-lg">View Colleges</span>
                )}
              </div>
              {!collapsed && (
                isCollegesExpanded ? (
                  <FaChevronDown className="w-4 h-4" />
                ) : (
                  <FaChevronRight className="w-4 h-4" />
                )
              )}
            </button>

            {!collapsed && isCollegesExpanded && (
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-600 mb-2">View Roles</label>
                <div className="grid grid-cols-1 gap-2">
                  {roleButtons.map((role) => (
                    <button
                      key={role.key}
                      onClick={() => setActiveSection(role.key)}
                      className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200 ${
                        activeSection === role.key
                          ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg transform scale-[1.02]'
                          : 'bg-gray-50 text-gray-700 hover:bg-gray-100 hover:shadow-md'
                      }`}
                    >
                      <span className="text-lg">{role.icon}</span>
                      <span className="font-medium">{role.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Manage Hiring */}
          <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
            <button
              onClick={() => setActiveSection('manage-hiring')}
              className={`w-full flex items-center ${
                collapsed ? 'justify-center' : 'space-x-3'
              } px-3 py-2 rounded-lg transition-all duration-200 ${
                activeSection === 'manage-hiring'
                  ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-lg'
                  : 'text-gray-700 hover:bg-gray-50 hover:shadow-md'
              }`}
            >
              <FaUserTie className="w-5 h-5" />
              {!collapsed && <span className="font-semibold text-lg">Manage Hiring</span>}
            </button>
          </div>

          {/* Payments */}
          <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
            <button
              onClick={() => setActiveSection('payments')}
              className={`w-full flex items-center ${
                collapsed ? 'justify-center' : 'space-x-3'
              } px-3 py-2 rounded-lg transition-all duration-200 ${
                activeSection === 'payments'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg'
                  : 'text-gray-700 hover:bg-gray-50 hover:shadow-md'
              }`}
            >
              <FaRupeeSign className="w-5 h-5" />
              {!collapsed && <span className="font-semibold text-lg">Payments</span>}
            </button>
          </div>
        </div>
      </nav>
    </div>
  );
};

export default Sidebar;
