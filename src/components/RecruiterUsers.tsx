"use client";

import React, { useEffect, useMemo, useState } from "react";
import { FaCrown, FaSearch } from "react-icons/fa";
import { recruiterApi } from "../api/recruiterApi";
import { useToast } from "./ToastContext";

// Reuse the application shape to list users derived from applications for now
interface Application {
  id: string;
  jobId: string;
  jobTitle: string;
  applicantName: string;
  applicantEmail: string;
  applyDate: string;
  status: "applied" | "under_review" | "shortlisted" | "rejected";
  isProUser?: boolean;
  applicantIsPro?: boolean;
  pro?: boolean;
  is_pro_user?: boolean;
}

const RecruiterUsers: React.FC = () => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [apps, setApps] = useState<Application[]>([]);
  const [search, setSearch] = useState("");
  const [showProOnly, setShowProOnly] = useState(false);

  const isPro = (a: any) => {
    const anyNested: any = a as any;
    return (
      !!anyNested?.isProUser ||
      !!anyNested?.applicantIsPro ||
      !!anyNested?.pro ||
      !!(anyNested?.is_pro_user as any) ||
      !!anyNested?.meta?.isProUser ||
      !!anyNested?.candidate?.isProUser
    );
  };

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        const res = await recruiterApi.getRecruiterUsers(showProOnly);
        if (res.success) setApps(res.students || []);
        else throw new Error(res.message || "Failed to load users");
      } catch (e) {
        console.error(e);
        showToast("error", "Failed to load users");
        setApps([]);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [showToast, showProOnly]);

  const rows = useMemo(() => {
    const seen = new Set<string>();
    const uniq = (apps as any[]).filter((a: any) => {
      const key = String(a.id ?? a.email ?? a.username ?? "").toLowerCase();
      if (!key) return true; // keep if we cannot compute a key here; rendering path will handle key fallback
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return uniq
      .filter((a: any) =>
        [a.username, a.email, a.applicantName, a.applicantEmail]
          .filter(Boolean)
          .some((t: string) =>
            (t || "").toLowerCase().includes(search.toLowerCase()),
          ),
      )
      .sort((a: any, b: any) => Number(b?.isProUser) - Number(a?.isProUser));
  }, [apps, search, showProOnly]);

  if (loading) {
    return (
      <div className="p-8 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Users</h1>
          <p className="text-gray-600 mt-1">View Pro and normal users</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-md mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaSearch className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="pl-10 w-full border border-gray-300 rounded-lg py-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Search name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <label className="flex items-center space-x-2 text-sm text-gray-700 select-none">
            <input
              type="checkbox"
              className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              checked={showProOnly}
              onChange={(e) => setShowProOnly(e.target.checked)}
            />
            <span>Show Pro only</span>
          </label>

          <div className="text-sm text-gray-600 flex items-center">
            Total Pro:{" "}
            <span className="ml-1 font-semibold">
              {rows.filter((r: any) => isPro(r)).length}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        {rows.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {rows.map((a: any, idx: number) => {
                  const email: string = String(
                    a?.email ?? a?.applicantEmail ?? "",
                  );
                  const name: string =
                    a?.username ||
                    a?.applicantName ||
                    a?.name ||
                    [a?.firstName, a?.lastName].filter(Boolean).join(" ") ||
                    email ||
                    "—";
                  const key =
                    a?.id ??
                    (email
                      ? email.toLowerCase()
                      : (a?.username?.toLowerCase() ?? `idx-${idx}`));
                  return (
                    <tr key={key}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {email || "—"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isPro(a) ? (
                          <span className="inline-flex items-center text-[10px] font-medium text-yellow-800 bg-yellow-100 border border-yellow-200 px-2 py-0.5 rounded-full">
                            <FaCrown className="mr-1" /> Pro
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-[10px] font-medium text-gray-700 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-full">
                            Normal
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500 text-sm">
            No users found
          </div>
        )}
      </div>
    </div>
  );
};

export default RecruiterUsers;
