"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useAuth } from "./AuthContext";
import { usePathname } from "next/navigation";
import { getLMSUrl } from "../config/urls";

export type ViewAsRole = "admin" | "instructor" | "student" | "recruiter";

interface ViewAsContextType {
  viewAsRole: ViewAsRole;
  actualUserRole: string;
  isViewingAs: boolean;
  setViewAsRole: (role: ViewAsRole) => void;
  resetToActualRole: () => void;
  canViewAs: (role: ViewAsRole) => boolean;
}

const ViewAsContext = createContext<ViewAsContextType | undefined>(undefined);

export const useViewAs = () => {
  const context = useContext(ViewAsContext);
  if (context === undefined) {
    throw new Error("useViewAs must be used within a ViewAsProvider");
  }
  return context;
};

interface ViewAsProviderProps {
  children: ReactNode;
}

// Helper function to determine role from current path
const getRoleFromPath = (pathname: string): ViewAsRole => {
  if (pathname.startsWith("/dashboard/instructor")) return "instructor";
  if (pathname.startsWith("/dashboard/recruiter")) return "recruiter";
  if (pathname.startsWith("/dashboard/admin")) return "admin";
  // Default fallback
  return "admin";
};

export const ViewAsProvider: React.FC<ViewAsProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const pathname = usePathname();
  const [viewAsRoleState, setViewAsRoleState] = useState<ViewAsRole>("admin");

  // Initialize and sync viewAsRole based on current route and user preferences
  useEffect(() => {
    if (user && user.userRole === "admin") {
      // For admin users, determine view based on current route
      const currentRoleFromPath = getRoleFromPath(pathname);

      // If we're on the admin dashboard route, always reset to admin view
      if (currentRoleFromPath === "admin") {
        setViewAsRoleState("admin");
        localStorage.setItem("admin_view_as_role", "admin");
      }
      // If we're on a specific dashboard route (instructor/recruiter), set that view
      else {
        setViewAsRoleState(currentRoleFromPath);
        // Update localStorage to match current route
        localStorage.setItem("admin_view_as_role", currentRoleFromPath);
      }
    } else if (user) {
      // Non-admin users always see their own role view
      const actualRole = user.userRole as ViewAsRole;
      setViewAsRoleState(actualRole);
    }
  }, [user, pathname]);

  const viewAsRole = user ? viewAsRoleState : "admin";

  const setViewAsRole = (role: ViewAsRole) => {
    if (!user) return;

    // Only admin can change view roles
    if (user.userRole !== "admin") {
      console.warn("Only admin users can change view roles");
      return;
    }

    // Special handling for Student View - redirect to student dashboard
    if (role === "student") {
      const studentDashboardUrl = getLMSUrl() || "http://localhost:3001";

      // Store current admin session info before redirect
      sessionStorage.setItem("admin_viewing_as_student", "true");
      sessionStorage.setItem("admin_return_url", window.location.href);

      if (!studentDashboardUrl) {
        console.error("Unable to determine student dashboard URL");
        alert(
          "Student dashboard URL mapping not found. Please configure NEXT_PUBLIC_STUDENT_LMS_URL or domain mappings.",
        );
        return;
      }

      console.log(
        `Redirecting admin to student dashboard: ${studentDashboardUrl}`,
      );

      // Redirect to student dashboard
      window.location.href = studentDashboardUrl;
      return;
    }

    // For other roles, update state and localStorage, then navigate
    setViewAsRoleState(role);
    localStorage.setItem("admin_view_as_role", role);

    // Navigate to the appropriate dashboard
    const targetPath =
      role === "admin"
        ? "/dashboard/admin"
        : role === "instructor"
          ? "/dashboard/instructor"
          : role === "recruiter"
            ? "/dashboard/recruiter"
            : "/dashboard/admin";

    if (window.location.pathname !== targetPath) {
      window.location.href = targetPath;
    }
  };

  const resetToActualRole = () => {
    if (!user) return;

    const actualRole = user.userRole as ViewAsRole;
    setViewAsRoleState(actualRole);
    localStorage.setItem("admin_view_as_role", actualRole);

    // Clear any student viewing session data
    sessionStorage.removeItem("admin_viewing_as_student");
    sessionStorage.removeItem("admin_return_url");
  };

  const canViewAs = (role: ViewAsRole): boolean => {
    if (!user) return false;

    // Admin can view as any role
    if (user.userRole === "admin") return true;

    // Non-admin users can only view as their own role
    return user.userRole === role;
  };

  const contextValue: ViewAsContextType = {
    viewAsRole,
    actualUserRole: user?.userRole || "admin",
    isViewingAs: user?.userRole === "admin" && viewAsRole !== user.userRole,
    setViewAsRole,
    resetToActualRole,
    canViewAs,
  };

  return (
    <ViewAsContext.Provider value={contextValue}>
      {children}
    </ViewAsContext.Provider>
  );
};

// HOC for components that need view-as functionality
export const withViewAs = <P extends object>(
  Component: React.ComponentType<P>,
): React.FC<P> => {
  const WrappedComponent: React.FC<P> = (props) => {
    return (
      <ViewAsProvider>
        <Component {...props} />
      </ViewAsProvider>
    );
  };

  WrappedComponent.displayName = `withViewAs(${Component.displayName || Component.name})`;

  return WrappedComponent;
};
