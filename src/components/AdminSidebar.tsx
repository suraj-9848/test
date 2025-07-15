import React, { useState } from "react";
import {
  FaBars,
  FaRupeeSign,
  FaBuilding,
  FaUsers,
  FaUserTie,
  FaUserShield,
  FaChalkboardTeacher,
  FaGraduationCap,
  FaTachometerAlt,
} from "react-icons/fa";

interface SidebarProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  activeSection,
  setActiveSection,
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const [expandedMenu, setExpandedMenu] = useState<string | null>(
    "user-management"
  );

  const menuItems = [
    { key: "dashboard", label: "Dashboard", icon: FaTachometerAlt },
    { key: "users", label: "All Users", icon: FaUsers },
    {
      key: "user-management",
      label: "User Management",
      icon: FaUsers,
      submenu: [
        { key: "college-admins", label: "College Admins", icon: FaUserShield },
        { key: "instructors", label: "Instructors", icon: FaChalkboardTeacher },
        { key: "students", label: "Students", icon: FaGraduationCap },
      ],
    },
    { key: "organizations", label: "Organizations", icon: FaBuilding },
    { key: "manage-hiring", label: "Manage Hiring", icon: FaUserTie },
    { key: "payments", label: "Payments", icon: FaRupeeSign },
  ];

  return (
    <div
      className={`h-screen bg-white shadow-xl border-r border-gray-200 transition-all duration-300 ease-in-out
        ${collapsed ? "w-28" : "w-80"} flex flex-col`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center space-x-3 overflow-hidden">
          <div className="w-10 h-10 bg-gray-800 rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-lg">N</span>
          </div>
          {!collapsed && (
            <div className="whitespace-nowrap">
              <span className="text-2xl font-bold text-gray-800">
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

      {/* Navigation */}
      <nav className="mt-6 px-2 flex-1 overflow-y-auto">
        <div className="space-y-4">
          {menuItems.map((item) => (
            <div
              key={item.key}
              className="bg-white rounded-xl p-3 shadow-sm border border-gray-100"
            >
              <button
                onClick={() => {
                  if (item.submenu) {
                    setExpandedMenu(
                      expandedMenu === item.key ? null : item.key
                    );
                  } else {
                    setActiveSection(item.key);
                  }
                }}
                className={`w-full flex items-center ${
                  collapsed ? "justify-center" : "space-x-3"
                } px-3 py-2 rounded-lg transition-all duration-200 ${
                  activeSection === item.key
                    ? "bg-gray-800 text-white shadow-lg"
                    : "text-gray-700 hover:bg-gray-50 hover:shadow-md"
                }`}
              >
                <item.icon className="w-5 h-5" />
                {!collapsed && (
                  <span className="font-semibold text-lg">{item.label}</span>
                )}
              </button>

              {/* Submenu rendering */}
              {item.submenu && expandedMenu === item.key && !collapsed && (
                <div className="mt-2 ml-4 space-y-1">
                  {item.submenu.map((subItem) => (
                    <button
                      key={subItem.key}
                      onClick={() => setActiveSection(subItem.key)}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200 ${
                        activeSection === subItem.key
                          ? "bg-gray-700 text-white shadow-md"
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      <subItem.icon className="w-4 h-4" />
                      <span className="font-medium">{subItem.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default Sidebar;
