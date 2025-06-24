import React, { useState } from 'react';
import {
  FaUsers,
  FaUserTie,
  FaBars,
  FaRupeeSign,
  FaBuilding,
} from 'react-icons/fa';

interface SidebarProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeSection, setActiveSection }) => {
  const [collapsed, setCollapsed] = useState(false);

  const menuItems = [
    { key: 'users', label: 'Users', icon: FaUsers },
    { key: 'organizations', label: 'Organizations', icon: FaBuilding },
    { key: 'manage-hiring', label: 'Manage Hiring', icon: FaUserTie },
    { key: 'payments', label: 'Payments', icon: FaRupeeSign },
  ];

  return (
    <div
      className={`h-screen bg-white shadow-xl border-r border-gray-200 transition-all duration-300 ease-in-out
        ${collapsed ? 'w-20' : 'w-64'} flex flex-col`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center space-x-3 overflow-hidden">
          {
            !collapsed && (
              <div className="w-10  bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl  items-center justify-center shadow-lg">
              <span className="text-white font-bold h-10 flex items-center justify-center text-lg">N</span>
            </div>)
          }
          {!collapsed && (
            <div className="whitespace-nowrap">
              <span className="text-xl font-bold text-black">
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
      <nav className="mt-6 px-3 flex-1 overflow-y-auto">
        <div className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                onClick={() => setActiveSection(item.key)}
                className={`w-full flex items-center ${
                  collapsed ? 'justify-center' : 'space-x-3'
                } px-3 py-3 rounded-lg transition-all duration-200 ${
                  activeSection === item.key
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                    : 'text-black hover:bg-blue-50 hover:shadow-md'
                }`}
              >
                <Icon className="w-5 h-5" />
                {!collapsed && <span className="font-medium">{item.label}</span>}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default Sidebar;
