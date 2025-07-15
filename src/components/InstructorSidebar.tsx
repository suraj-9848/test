import React, { useState } from "react";
import {
  FaBook,
  FaGraduationCap,
  FaClipboardList,
  FaChevronDown,
  FaChevronRight,
  FaBars,
  FaPlus,
  FaList,
  FaChartBar,
  FaClipboardCheck,
  FaChartLine,
  FaUsers,
  FaQuestionCircle,
  FaFileAlt,
  FaTachometerAlt,
  FaUsersCog,
  FaEye,
  FaPercent,
  FaUserGraduate,
} from "react-icons/fa";

interface SidebarProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
}

const InstructorSidebar: React.FC<SidebarProps> = ({
  activeSection,
  setActiveSection,
}) => {
  const [isCoursesExpanded, setIsCoursesExpanded] = useState(true);
  const [isTestsExpanded, setIsTestsExpanded] = useState(false);
  const [isAnalyticsExpanded, setIsAnalyticsExpanded] = useState(false);
  const [isBatchesExpanded, setIsBatchesExpanded] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const courseMenuItems = [
    {
      key: "all-courses",
      label: "All Courses",
      icon: <FaList className="w-4 h-4" />,
    },
    {
      key: "create-course",
      label: "Create Course",
      icon: <FaPlus className="w-4 h-4" />,
    },
    {
      key: "manage-modules",
      label: "Manage Modules",
      icon: <FaBook className="w-4 h-4" />,
    },
    {
      key: "module-content",
      label: "Module Content",
      icon: <FaFileAlt className="w-4 h-4" />,
    },
    {
      key: "mcq-management",
      label: "MCQ Management",
      icon: <FaQuestionCircle className="w-4 h-4" />,
    },
    {
      key: "course-assignment",
      label: "Assign Courses",
      icon: <FaUserGraduate className="w-4 h-4" />,
    },
  ];

  const testMenuItems = [
    {
      key: "manage-tests",
      label: "Manage Tests",
      icon: <FaClipboardList className="w-4 h-4" />,
    },
    {
      key: "create-test",
      label: "Create Test",
      icon: <FaPlus className="w-4 h-4" />,
    },
    {
      key: "test-questions",
      label: "Test Questions",
      icon: <FaQuestionCircle className="w-4 h-4" />,
    },
    {
      key: "test-evaluation",
      label: "Test Evaluation",
      icon: <FaClipboardCheck className="w-4 h-4" />,
    },
    {
      key: "test-publishing",
      label: "Publish Tests",
      icon: <FaEye className="w-4 h-4" />,
    },
  ];

  const analyticsMenuItems = [
    {
      key: "student-analytics",
      label: "Student Analytics",
      icon: <FaUsers className="w-4 h-4" />,
    },
    {
      key: "progress-analytics",
      label: "Progress Analytics",
      icon: <FaChartLine className="w-4 h-4" />,
    },
    {
      key: "test-analytics",
      label: "Test Analytics",
      icon: <FaChartBar className="w-4 h-4" />,
    },
    {
      key: "evaluation-statistics",
      label: "Evaluation Statistics",
      icon: <FaPercent className="w-4 h-4" />,
    },
  ];

  const batchMenuItems = [
    {
      key: "create-batch",
      label: "Create Batch",
      icon: <FaGraduationCap className="w-4 h-4" />,
    },
    {
      key: "batch-management",
      label: "Manage Batches",
      icon: <FaGraduationCap className="w-4 h-4" />,
    },
    {
      key: "batch-analytics",
      label: "Batch Analytics",
      icon: <FaChartBar className="w-4 h-4" />,
    },
    {
      key: "batch-assignments",
      label: "Batch Assignments",
      icon: <FaUsersCog className="w-4 h-4" />,
    },
  ];

  return (
    <div
      className={`h-screen bg-gradient-to-br from-slate-50 to-slate-100 shadow-2xl border-r border-slate-200 transition-all duration-300 ease-in-out
        ${collapsed ? "w-20" : "w-80"} flex flex-col`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-white/70 backdrop-blur-sm">
        <div className="flex items-center space-x-3 overflow-hidden">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-xl">N</span>
          </div>
          {!collapsed && (
            <div className="whitespace-nowrap">
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                NIRUDHYOG
              </span>
              <p className="text-sm text-slate-500 -mt-1">Instructor Portal</p>
            </div>
          )}
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 rounded-xl hover:bg-slate-100 text-slate-600 transition-all duration-200"
        >
          <FaBars />
        </button>
      </div>

      {/* Navigation */}
      <nav className="mt-6 px-4 flex-1 overflow-y-auto">
        <div className="space-y-4">
          {/* Dashboard */}
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-slate-200/50">
            <button
              onClick={() => setActiveSection("dashboard")}
              className={`w-full flex items-center ${
                collapsed ? "justify-center" : "space-x-3"
              } px-4 py-3 rounded-xl transition-all duration-200 ${
                activeSection === "dashboard"
                  ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg transform scale-[1.02]"
                  : "text-slate-700 hover:bg-slate-100 hover:shadow-md"
              }`}
            >
              <FaTachometerAlt className="w-5 h-5" />
              {!collapsed && (
                <span className="font-semibold text-lg">Dashboard</span>
              )}
            </button>
          </div>

          {/* Course Management */}
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-slate-200/50">
            <button
              onClick={() => setIsCoursesExpanded(!isCoursesExpanded)}
              className={`w-full flex items-center text-slate-700 hover:bg-slate-100 p-3 rounded-xl transition-all duration-200 mb-3 ${
                collapsed ? "justify-center" : "justify-between"
              }`}
            >
              <div
                className={`flex items-center ${collapsed ? "" : "space-x-3"}`}
              >
                <FaBook className="w-5 h-5 text-slate-700" />
                {!collapsed && (
                  <span className="font-semibold text-lg">
                    Course Management
                  </span>
                )}
              </div>
              {!collapsed &&
                (isCoursesExpanded ? (
                  <FaChevronDown className="w-4 h-4" />
                ) : (
                  <FaChevronRight className="w-4 h-4" />
                ))}
            </button>

            {!collapsed && isCoursesExpanded && (
              <div className="space-y-2">
                {courseMenuItems.map((item) => (
                  <button
                    key={item.key}
                    onClick={() => setActiveSection(item.key)}
                    className={`flex items-center space-x-3 w-full px-4 py-3 rounded-xl transition-all duration-200 ${
                      activeSection === item.key
                        ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg transform scale-[1.02]"
                        : "bg-slate-50 text-slate-700 hover:bg-slate-100 hover:shadow-md"
                    }`}
                  >
                    {item.icon}
                    <span className="font-medium">{item.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Test Management */}
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-slate-200/50">
            <button
              onClick={() => setIsTestsExpanded(!isTestsExpanded)}
              className={`w-full flex items-center text-slate-700 hover:bg-slate-100 p-3 rounded-xl transition-all duration-200 mb-3 ${
                collapsed ? "justify-center" : "justify-between"
              }`}
            >
              <div
                className={`flex items-center ${collapsed ? "" : "space-x-3"}`}
              >
                <FaClipboardList className="w-5 h-5 text-slate-700" />
                {!collapsed && (
                  <span className="font-semibold text-lg">Test Management</span>
                )}
              </div>
              {!collapsed &&
                (isTestsExpanded ? (
                  <FaChevronDown className="w-4 h-4" />
                ) : (
                  <FaChevronRight className="w-4 h-4" />
                ))}
            </button>

            {!collapsed && isTestsExpanded && (
              <div className="space-y-2">
                {testMenuItems.map((item) => (
                  <button
                    key={item.key}
                    onClick={() => setActiveSection(item.key)}
                    className={`flex items-center space-x-3 w-full px-4 py-3 rounded-xl transition-all duration-200 ${
                      activeSection === item.key
                        ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg transform scale-[1.02]"
                        : "bg-slate-50 text-slate-700 hover:bg-slate-100 hover:shadow-md"
                    }`}
                  >
                    {item.icon}
                    <span className="font-medium">{item.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Analytics */}
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-slate-200/50">
            <button
              onClick={() => setIsAnalyticsExpanded(!isAnalyticsExpanded)}
              className={`w-full flex items-center text-slate-700 hover:bg-slate-100 p-3 rounded-xl transition-all duration-200 mb-3 ${
                collapsed ? "justify-center" : "justify-between"
              }`}
            >
              <div
                className={`flex items-center ${collapsed ? "" : "space-x-3"}`}
              >
                <FaChartLine className="w-5 h-5 text-slate-700" />
                {!collapsed && (
                  <span className="font-semibold text-lg">
                    Analytics & Reports
                  </span>
                )}
              </div>
              {!collapsed &&
                (isAnalyticsExpanded ? (
                  <FaChevronDown className="w-4 h-4" />
                ) : (
                  <FaChevronRight className="w-4 h-4" />
                ))}
            </button>

            {!collapsed && isAnalyticsExpanded && (
              <div className="space-y-2">
                {analyticsMenuItems.map((item) => (
                  <button
                    key={item.key}
                    onClick={() => setActiveSection(item.key)}
                    className={`flex items-center space-x-3 w-full px-4 py-3 rounded-xl transition-all duration-200 ${
                      activeSection === item.key
                        ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg transform scale-[1.02]"
                        : "bg-slate-50 text-slate-700 hover:bg-slate-100 hover:shadow-md"
                    }`}
                  >
                    {item.icon}
                    <span className="font-medium">{item.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Batch Management */}
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-slate-200/50">
            <button
              onClick={() => setIsBatchesExpanded(!isBatchesExpanded)}
              className={`w-full flex items-center text-slate-700 hover:bg-slate-100 p-3 rounded-xl transition-all duration-200 mb-3 ${
                collapsed ? "justify-center" : "justify-between"
              }`}
            >
              <div
                className={`flex items-center ${collapsed ? "" : "space-x-3"}`}
              >
                <FaGraduationCap className="w-5 h-5 text-slate-700" />
                {!collapsed && (
                  <span className="font-semibold text-lg">
                    Batch Management
                  </span>
                )}
              </div>
              {!collapsed &&
                (isBatchesExpanded ? (
                  <FaChevronDown className="w-4 h-4" />
                ) : (
                  <FaChevronRight className="w-4 h-4" />
                ))}
            </button>

            {!collapsed && isBatchesExpanded && (
              <div className="space-y-2">
                {batchMenuItems.map((item) => (
                  <button
                    key={item.key}
                    onClick={() => setActiveSection(item.key)}
                    className={`flex items-center space-x-3 w-full px-4 py-3 rounded-xl transition-all duration-200 ${
                      activeSection === item.key
                        ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg transform scale-[1.02]"
                        : "bg-slate-50 text-slate-700 hover:bg-slate-100 hover:shadow-md"
                    }`}
                  >
                    {item.icon}
                    <span className="font-medium">{item.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </nav>
    </div>
  );
};

export default InstructorSidebar;
