import React, { useState } from "react";
import {
  Menu,
  LayoutDashboard,
  BookOpen,
  GraduationCap,
  TrendingUp,
  ChevronDown,
  ChevronRight,
  Plus,
  UserCog,
  Settings,
  ClipboardList,
  Edit,
  Users,
  HelpCircle,
  BarChart3,
  Percent,
  UserPlus,
  ArrowRightLeft,
  Link,
  FileText,
  Eye,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";

interface InstructorSidebarProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
  collapsed?: boolean;
  setCollapsed?: (collapsed: boolean) => void;
}

const InstructorSidebar: React.FC<InstructorSidebarProps> = ({
  activeSection,
  setActiveSection,
  collapsed = false,
  setCollapsed = () => {},
}) => {
  const [isCoursesExpanded, setIsCoursesExpanded] = useState(true);
  const [isTestsExpanded, setIsTestsExpanded] = useState(false);
  const [isAnalyticsExpanded, setIsAnalyticsExpanded] = useState(false);
  const [isBatchesExpanded, setIsBatchesExpanded] = useState(false);
  const [isAssigningExpanded, setIsAssigningExpanded] = useState(false);

  const courseMenuItems = [
    {
      key: "create-course",
      label: "Create Course",
      icon: Plus,
    },
    {
      key: "all-courses",
      label: "Manage Courses",
      icon: Settings,
    },
    // {
    //   key: "manage-modules",
    //   label: "Manage Modules",
    //   icon: ClipboardList,
    // },
    // {
    //   key: "module-content",
    //   label: "Module Content",
    //   icon: Edit,
    // },
    // {
    //   key: "mcq-management",
    //   label: "MCQ Management",
    //   icon: HelpCircle,
    // },
    {
      key: "module-mcq-management",
      label: "Module-MCQ",
      icon: BookOpen,
    },
  ];

  const testMenuItems = [
    {
      key: "create-test",
      label: "Create Test",
      icon: Plus,
    },
    {
      key: "test-management",
      label: "Test Management",
      icon: Settings,
    },
  ];

  const analyticsMenuItems = [
    {
      key: "course-analytics",
      label: "Course Analytics",
      icon: Eye,
    },
    {
      key: "test-analytics",
      label: "Test Analytics",
      icon: BarChart3,
    },
  ];

  const batchMenuItems = [
    {
      key: "create-batch",
      label: "Create Batch",
      icon: Plus,
    },
    {
      key: "batch-management",
      label: "Batch Dashboard",
      icon: GraduationCap,
    },
  ];

  const assigningMenuItems = [
    {
      key: "course-assignment",
      label: "Assign Courses",
      icon: UserPlus,
    },
    {
      key: "batch-assignments",
      label: "Assign Batches",
      icon: ArrowRightLeft,
    },
    {
      key: "course-batch-assignment",
      label: "Assign Course to Batch",
      icon: Link,
    },
  ];

  const MenuButton = ({ item, isActive, onClick }: any) => {
    const IconComponent = item.icon;

    return (
      <div className="relative group">
        <button
          onClick={onClick}
          className={`w-full flex items-center transition-all duration-300 rounded-xl p-3 relative overflow-hidden ${
            isActive
              ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg transform scale-[1.02]"
              : "hover:bg-slate-100 text-slate-700 hover:shadow-md hover:scale-[1.01]"
          } ${collapsed ? "justify-center" : "justify-start"}`}
        >
          <div className="flex items-center space-x-3 w-full">
            <IconComponent className="h-5 w-5 flex-shrink-0" />
            {!collapsed && (
              <div className="flex items-center justify-between w-full">
                <span className="font-medium truncate">{item.label}</span>
                {item.badge && (
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-medium ${
                      isActive
                        ? "bg-white/20 text-white"
                        : item.badge === "New"
                          ? "bg-green-100 text-green-700"
                          : item.badge === "Live"
                            ? "bg-red-100 text-red-700"
                            : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </div>
            )}
          </div>
        </button>
      </div>
    );
  };

  const CollapsibleSection = ({
    title,
    icon: Icon,
    items,
    isExpanded,
    setIsExpanded,
    defaultBadge,
  }: any) => {
    const handleSectionClick = () => {
      if (collapsed) {
        // If collapsed, expand the sidebar first, then expand the section
        setCollapsed(false);
        setIsExpanded(true);
      } else {
        // If expanded, toggle the section
        setIsExpanded(!isExpanded);
      }
    };

    return (
      <div className="space-y-2">
        <div className="relative group">
          <button
            onClick={handleSectionClick}
            className={`w-full flex items-center hover:bg-slate-100 text-slate-700 transition-all duration-200 rounded-xl p-3 ${
              collapsed ? "justify-center" : "justify-between"
            }`}
          >
            <div className="flex items-center space-x-3">
              <Icon className="h-5 w-5 flex-shrink-0 text-slate-600" />
              {!collapsed && (
                <span className="font-semibold text-base truncate">
                  {title}
                </span>
              )}
            </div>
            {!collapsed && (
              <div className="flex items-center space-x-2">
                {defaultBadge && (
                  <span className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-600 font-medium">
                    {defaultBadge}
                  </span>
                )}
                <div
                  className={`transition-transform duration-200 ${
                    isExpanded ? "rotate-0" : "-rotate-90"
                  }`}
                >
                  <ChevronDown className="h-4 w-4" />
                </div>
              </div>
            )}
          </button>
        </div>

        {!collapsed && isExpanded && (
          <div className="space-y-1 pl-4 transition-all duration-300">
            {items.map((item: { key: string }) => (
              <MenuButton
                key={item.key}
                item={item}
                isActive={activeSection === item.key}
                onClick={() => setActiveSection(item.key)}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className={`h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-50 via-white to-slate-100 shadow-2xl border-r border-slate-200 flex flex-col relative transition-all duration-300 ease-in-out ${
        collapsed ? "w-20" : "w-80"
      }`}
    >
      <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-white/80 backdrop-blur-sm">
        <div className="flex items-center space-x-3 overflow-hidden">
          {!collapsed && (
            <div className="min-w-0 transition-all duration-300">
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent block truncate">
                NIRUDHYOG
              </span>
              <p className="text-sm text-slate-500 truncate">
                Instructor Portal
              </p>
            </div>
          )}
        </div>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 hover:bg-slate-100 text-slate-600 transition-all duration-200 rounded-lg hover:shadow-md flex-shrink-0 group"
        >
          {collapsed ? (
            <PanelLeftOpen className="h-4 w-4 group-hover:scale-110 transition-transform" />
          ) : (
            <PanelLeftClose className="h-4 w-4 group-hover:scale-110 transition-transform" />
          )}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
        <div className="bg-white/60 backdrop-blur-sm rounded-xl p-3 shadow-sm border border-slate-200/50 hover:shadow-md transition-all duration-200">
          <MenuButton
            item={{
              key: "dashboard",
              label: "Dashboard",
              icon: LayoutDashboard,
            }}
            isActive={activeSection === "dashboard"}
            onClick={() => setActiveSection("dashboard")}
          />
        </div>

        <div className="border-t border-slate-200/60 my-4"></div>

        <div className="bg-white/60 backdrop-blur-sm rounded-xl p-3 shadow-sm border border-slate-200/50 hover:shadow-md transition-all duration-200">
          <CollapsibleSection
            title="Course Management"
            icon={BookOpen}
            items={courseMenuItems}
            isExpanded={isCoursesExpanded}
            setIsExpanded={setIsCoursesExpanded}
          />
        </div>

        <div className="bg-white/60 backdrop-blur-sm rounded-xl p-3 shadow-sm border border-slate-200/50 hover:shadow-md transition-all duration-200">
          <CollapsibleSection
            title="Test Management"
            icon={FileText}
            items={testMenuItems}
            isExpanded={isTestsExpanded}
            setIsExpanded={setIsTestsExpanded}
          />
        </div>

        <div className="bg-white/60 backdrop-blur-sm rounded-xl p-3 shadow-sm border border-slate-200/50 hover:shadow-md transition-all duration-200">
          <CollapsibleSection
            title="Assigning"
            icon={UserCog}
            items={assigningMenuItems}
            isExpanded={isAssigningExpanded}
            setIsExpanded={setIsAssigningExpanded}
          />
        </div>

        <div className="bg-white/60 backdrop-blur-sm rounded-xl p-3 shadow-sm border border-slate-200/50 hover:shadow-md transition-all duration-200">
          <CollapsibleSection
            title="Analytics & Reports"
            icon={TrendingUp}
            items={analyticsMenuItems}
            isExpanded={isAnalyticsExpanded}
            setIsExpanded={setIsAnalyticsExpanded}
          />
        </div>

        <div className="bg-white/60 backdrop-blur-sm rounded-xl p-3 shadow-sm border border-slate-200/50 hover:shadow-md transition-all duration-200">
          <CollapsibleSection
            title="Batch Management"
            icon={GraduationCap}
            items={batchMenuItems}
            isExpanded={isBatchesExpanded}
            setIsExpanded={setIsBatchesExpanded}
          />
        </div>
      </nav>
      <style jsx>{`
        .scrollbar-thin::-webkit-scrollbar {
          width: 4px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background-color: #cbd5e1;
          border-radius: 2px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background-color: #94a3b8;
        }
      `}</style>
    </div>
  );
};

export default InstructorSidebar;
