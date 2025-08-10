"use client";
import React, { useEffect, useState, useCallback } from "react";
import {
  FaBriefcase,
  FaRegClock,
  FaCheck,
  FaUsers,
  FaSyncAlt,
  FaPlus,
  FaEye,
  FaCrown,
} from "react-icons/fa";
import { useToast } from "./ToastContext";
import { recruiterApi } from "../api/recruiterApi";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

interface DashboardStats {
  totalJobs: number;
  openJobs: number;
  closedJobs: number;
  totalApplications: number;
}

// New: Application shape for deriving Pro applicants
interface ApplicationUser {
  email?: string;
  username?: string;
  isProUser?: boolean;
  proExpiresAt?: string | Date | null;
  is_pro_user?: boolean;
}

interface Application {
  id: string;
  jobId?: string;
  jobTitle?: string;
  applicantName?: string;
  applicantEmail?: string;
  applyDate?: string;
  appliedAt?: string;
  status: "applied" | "under_review" | "shortlisted" | "rejected" | "hired";
  isProUser?: boolean;
  applicantIsPro?: boolean;
  pro?: boolean;
  is_pro_user?: boolean;
  user?: ApplicationUser;
}

const RecruiterDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // New: store applications for Pro list/metrics
  const [applications, setApplications] = useState<Application[]>([]);
  const [proUsersTotal, setProUsersTotal] = useState<number>(0);
  const [proUsers, setProUsers] = useState<any[]>([]);
  const [insights, setInsights] = useState<{
    proApplicants7d: number;
    shortlisted7d: number;
    avgTimeToReviewHours: number | null;
    proUsers7d?: number;
  } | null>(null);

  // Helper to derive if applicant is Pro (defensive against varying shapes)
  const isProApplicant = (app: Application): boolean => {
    const anyNested: any = app as any;
    const userPro = !!app.user?.isProUser || !!(app.user as any)?.is_pro_user;
    const userExpiryValid = app.user?.proExpiresAt
      ? new Date(app.user.proExpiresAt) > new Date()
      : false;
    return (
      !!app.isProUser ||
      !!app.applicantIsPro ||
      !!app.pro ||
      !!(app.is_pro_user as any) ||
      userPro ||
      userExpiryValid ||
      !!anyNested?.meta?.isProUser ||
      !!anyNested?.candidate?.isProUser
    );
  };

  const getAppliedAt = (a: Application): Date =>
    new Date(a.applyDate || a.appliedAt || 0);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch stats, applications and pro users count in parallel
      const [statsRes, appsRes, usersRes] = await Promise.all([
        recruiterApi.getDashboardStats().catch((err: any) => {
          throw err; // keep same error handling for stats
        }),
        recruiterApi.getApplications().catch((err: any) => {
          console.warn("Failed to fetch applications for Pro list", err);
          return null; // do not block dashboard on apps error
        }),
        recruiterApi.getRecruiterUsers(true).catch((err: any) => {
          console.warn("Failed to fetch pro users count", err);
          return null;
        }),
      ]);

      if (statsRes?.success && statsRes.data) {
        setStats(statsRes.data);
        if (statsRes.data.insights) setInsights(statsRes.data.insights);
      } else {
        throw new Error(statsRes?.message || "Failed to fetch dashboard stats");
      }

      if (appsRes && appsRes.success) {
        setApplications(appsRes.applications || []);
      } else if (appsRes === null) {
        // already warned, keep old list or empty
      } else {
        setApplications([]);
      }

      if (usersRes && usersRes.success) {
        const list = usersRes.students || [];
        if (list.length > 0) {
          setProUsers(list);
          setProUsersTotal(list.length);
        } else {
          // Fallback: fetch all users and derive pro locally
          try {
            const allRes = await recruiterApi.getRecruiterUsers(false);
            if (allRes?.success) {
              const all = allRes.students || [];
              const derived = all.filter(
                (u: any) =>
                  !!u?.isProUser || new Date(u?.proExpiresAt || 0) > new Date(),
              );
              setProUsers(derived);
              setProUsersTotal(derived.length);
            } else {
              setProUsers([]);
              setProUsersTotal(0);
            }
          } catch {
            setProUsers([]);
            setProUsersTotal(0);
          }
        }
      } else {
        setProUsers([]);
        setProUsersTotal(0);
      }

      // Fetch insights separately only if not included in dashboard
      if (!statsRes?.data?.insights) {
        recruiterApi
          .getCandidateInsights()
          .then((i) => {
            if (i?.success && i.data) setInsights(i.data);
          })
          .catch((e) => console.warn("Failed to fetch candidate insights", e));
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch dashboard stats");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const navigate = (section: string, extra?: Record<string, string>) => {
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    params.set("tab", section);
    if (extra) {
      Object.entries(extra).forEach(([k, v]) => params.set(k, v));
    }
    router.replace(`${pathname}?${params.toString()}`);
  };

  const statCards = [
    {
      title: "Total Jobs",
      value: stats?.totalJobs || 0,
      icon: FaBriefcase,
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-50",
      textColor: "text-blue-600",
    },
    {
      title: "Open Positions",
      value: stats?.openJobs || 0,
      icon: FaRegClock,
      color: "from-green-500 to-green-600",
      bgColor: "bg-green-50",
      textColor: "text-green-600",
    },
    {
      title: "Closed Jobs",
      value: stats?.closedJobs || 0,
      icon: FaCheck,
      color: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-50",
      textColor: "text-purple-600",
    },
    {
      title: "Total Applications",
      value: stats?.totalApplications || 0,
      icon: FaUsers,
      color: "from-orange-500 to-orange-600",
      bgColor: "bg-orange-50",
      textColor: "text-orange-600",
    },
    {
      title: "Pro Users",
      value: proUsersTotal || 0,
      icon: FaCrown,
      color: "from-yellow-500 to-yellow-600",
      bgColor: "bg-yellow-50",
      textColor: "text-yellow-600",
    },
  ];

  // Derived: Pro applicants and 7d metric
  const proApplicants = applications
    .filter((a) => isProApplicant(a))
    .sort((a, b) => getAppliedAt(b).getTime() - getAppliedAt(a).getTime());
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const proApplicants7d =
    insights?.proApplicants7d ??
    proApplicants.filter((a) => getAppliedAt(a) >= sevenDaysAgo).length;
  const newProUsers7d = insights?.proUsers7d ?? 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-lg text-gray-600">Loading dashboard...</span>
      </div>
    );
  }

  // Do not block the dashboard on error; show banner + zeros

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            Recruiter Dashboard
          </h1>
          <p className="text-gray-600 mt-1">
            Overview of your job postings and applications
          </p>
        </div>
        <button
          onClick={fetchStats}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          <FaSyncAlt className="w-4 h-4" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        {statCards.map((card, index) => (
          <div
            key={index}
            className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-all duration-200"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl ${card.bgColor}`}>
                <card.icon className={`w-6 h-6 ${card.textColor}`} />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              {card.value.toLocaleString()}
            </h3>
            <p className="text-gray-600 text-sm">{card.title}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200 mb-8">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => navigate("jobs")}
            className="text-left p-4 border border-gray-200 rounded-xl hover:shadow-md transition-all duration-200"
          >
            <div className="flex items-center space-x-3 mb-2">
              <FaPlus className="w-5 h-5 text-blue-500" />
              <h3 className="font-semibold text-gray-800">Post New Job</h3>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              Create a new job listing for candidates
            </p>
            <div className="text-xs text-gray-500">
              Fill job details to post
            </div>
          </button>

          <button
            onClick={() => navigate("applications")}
            className="text-left p-4 border border-gray-200 rounded-xl hover:shadow-md transition-all duration-200"
          >
            <div className="flex items-center space-x-3 mb-2">
              <FaEye className="w-5 h-5 text-green-500" />
              <h3 className="font-semibold text-gray-800">View Applications</h3>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              Review candidate applications
            </p>
            <div className="text-xs text-gray-500">
              {stats?.totalApplications || 0} applications pending review
            </div>
          </button>

          <button
            onClick={() => navigate("jobs")}
            className="text-left p-4 border border-gray-200 rounded-xl hover:shadow-md transition-all duration-200"
          >
            <div className="flex items-center space-x-3 mb-2">
              <FaBriefcase className="w-5 h-5 text-purple-500" />
              <h3 className="font-semibold text-gray-800">Manage Jobs</h3>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              Edit or update your job postings
            </p>
            <div className="text-xs text-gray-500">
              {stats?.openJobs || 0} active job listings
            </div>
          </button>
        </div>
      </div>

      {/* Candidate Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Candidate Insights
          </h2>
          <div className="space-y-3">
            <div className="p-3 border border-gray-100 rounded-lg flex items-center justify-between">
              <span className="text-gray-700">Pro Applicants (7d)</span>
              <span className="text-sm font-semibold text-gray-900">
                {proApplicants7d}
              </span>
            </div>
            <div className="p-3 border border-gray-100 rounded-lg flex items-center justify-between">
              <span className="text-gray-700">New Pro Users (7d)</span>
              <span className="text-sm font-semibold text-gray-900">
                {newProUsers7d}
              </span>
            </div>
            <div className="p-3 border border-gray-100 rounded-lg flex items-center justify-between">
              <span className="text-gray-700">Shortlisted (7d)</span>
              <span className="text-sm font-semibold text-gray-900">
                {insights?.shortlisted7d ?? 0}
              </span>
            </div>
            <div className="p-3 border border-gray-100 rounded-lg flex items-center justify-between">
              <span className="text-gray-700">Avg. time to review</span>
              <span className="text-sm font-semibold text-gray-900">
                {insights?.avgTimeToReviewHours != null
                  ? `${insights.avgTimeToReviewHours}h`
                  : "—"}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Activity</h2>
          <div className="space-y-3">
            <div className="p-3 border border-gray-100 rounded-lg">
              <p className="text-sm text-gray-800">Activity feed coming soon</p>
              <p className="text-xs text-gray-500 mt-1">—</p>
            </div>
          </div>
        </div>
      </div>

      {/* Pro Students List */}
      <div className="mt-8 bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <FaCrown className="text-yellow-500" /> Pro Students
          </h2>
          <div className="text-sm text-gray-600">
            Total: <span className="font-semibold">{proUsersTotal}</span>
          </div>
        </div>

        {proUsers.length > 0 ? (
          <div className="overflow-x-auto -mx-2">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {proUsers.slice(0, 8).map((u: any, idx: number) => {
                  const email: string = String(u?.email || "");
                  const name: string =
                    u?.username ||
                    [u?.firstName, u?.lastName].filter(Boolean).join(" ") ||
                    u?.name ||
                    email ||
                    "Unknown";
                  const key =
                    u?.id ??
                    (email
                      ? email.toLowerCase()
                      : (u?.username?.toLowerCase() ?? `pro-${idx}`));
                  return (
                    <tr key={key}>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-yellow-100 text-yellow-800 flex items-center justify-center text-xs font-semibold">
                            {(name || "S").charAt(0)}
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
                              {name}
                              <span className="inline-flex items-center text-[10px] font-medium text-yellow-800 bg-yellow-100 border border-yellow-200 px-1.5 py-0.5 rounded-full">
                                Pro
                              </span>
                            </div>
                            <div className="text-xs text-gray-500">
                              {email || "—"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                        {email || "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-sm text-gray-500">
            No Pro students found yet.
          </div>
        )}
      </div>
    </div>
  );
};

export default RecruiterDashboard;
