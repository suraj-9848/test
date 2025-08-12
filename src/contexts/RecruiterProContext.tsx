"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  ReactNode,
} from "react";
import { useSession } from "next-auth/react";
import { recruiterApi } from "../api/recruiterApi";

interface RecruiterProContextValue {
  isProUser: boolean;
  expiresAt: string | null; // ISO string or null
  loading: boolean; // true means unknown
  error: string | null;
  refresh: () => Promise<void>;
}

const RecruiterProContext = createContext<RecruiterProContextValue | undefined>(
  undefined,
);

// Helpers to normalize and format dates/fields (mirrors RecruiterSubscriptions)
const normalizeDateString = (v: any): string => {
  if (v === null || v === undefined || v === "") return "";
  try {
    let d: Date | null = null;
    if (typeof v === "number") {
      const ms = v < 1e12 ? v * 1000 : v; // seconds vs ms
      d = new Date(ms);
    } else if (typeof v === "string") {
      const num = Number(v);
      if (!Number.isNaN(num) && v.trim() !== "") {
        const ms = num < 1e12 ? num * 1000 : num;
        d = new Date(ms);
      } else {
        d = new Date(v);
      }
    } else if (v instanceof Date) {
      d = v;
    }
    if (!d || isNaN(d.getTime())) return "";
    return d.toISOString();
  } catch {
    return "";
  }
};

export function RecruiterProProvider({ children }: { children: ReactNode }) {
  const { status } = useSession();

  const [isProUser, setIsProUser] = useState(false);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Avoid spamming refresh on repeated errors while tab focus toggles
  const lastErrorAt = useRef<number>(0);

  // Bootstrap from localStorage to avoid flicker
  useEffect(() => {
    try {
      const cachedPro = localStorage.getItem("recruiterIsPro") === "1";
      const cachedExp = localStorage.getItem("recruiterProExpiresAt") || null;
      if (cachedPro) {
        setIsProUser(true);
        setExpiresAt(cachedExp);
        // Still keep loading true until we verify with backend
        setLoading(true);
      }
    } catch {
      // ignore
    }
  }, []);

  const refresh = useCallback(async () => {
    if (status !== "authenticated") {
      // Not authenticated; don't try fetching protected endpoints
      setIsProUser(false);
      setExpiresAt(null);
      setLoading(false);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await recruiterApi.getSubscriptions();
      const subs = Array.isArray(res?.subscriptions) ? res.subscriptions : [];

      const normalized = subs.map((s: any) => ({
        ...s,
        plan: s?.plan?.toString?.().toLowerCase?.() ?? s?.plan,
        status: s?.status?.toString?.().toLowerCase?.() ?? s?.status,
        expiresAt: normalizeDateString(s?.expiresAt),
      }));

      const activePro = normalized.find(
        (s: any) => s.status === "active" && s.plan === "pro",
      );

      if (activePro) {
        setIsProUser(true);
        setExpiresAt(activePro.expiresAt || null);
        try {
          localStorage.setItem("recruiterIsPro", "1");
          if (activePro.expiresAt) {
            localStorage.setItem(
              "recruiterProExpiresAt",
              activePro.expiresAt as string,
            );
          } else {
            localStorage.removeItem("recruiterProExpiresAt");
          }
        } catch {}
      } else {
        setIsProUser(false);
        setExpiresAt(null);
        try {
          localStorage.setItem("recruiterIsPro", "0");
          localStorage.removeItem("recruiterProExpiresAt");
        } catch {}
      }

      setLoading(false);
    } catch (e: any) {
      // Keep unknown on error so UI doesn't incorrectly show upgrade prompts
      setError(e?.message || "Failed to load Pro status");
      lastErrorAt.current = Date.now();
      // don't flip loading to false; leave as unknown
      setLoading(true);
    }
  }, [status]);

  // Fetch on auth change
  useEffect(() => {
    if (status === "authenticated") {
      refresh();
    } else if (status === "unauthenticated") {
      setIsProUser(false);
      setExpiresAt(null);
      setLoading(false);
      setError(null);
    }
  }, [status, refresh]);

  // Refresh on tab focus
  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "visible") {
        // Backoff if we just errored very recently (<3s)
        if (Date.now() - lastErrorAt.current < 3000) return;
        refresh();
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [refresh]);

  // Helper to sync state from localStorage (same-tab immediate updates)
  const syncFromLocalStorage = useCallback(() => {
    try {
      const cachedPro = localStorage.getItem("recruiterIsPro") === "1";
      const cachedExp = localStorage.getItem("recruiterProExpiresAt") || null;
      setIsProUser(cachedPro);
      setExpiresAt(cachedExp);
      setLoading(false);
    } catch {}
  }, []);

  // Sync across tabs and same tab via custom event
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "recruiterIsPro" || e.key === "recruiterProExpiresAt") {
        syncFromLocalStorage();
      }
    };
    const onCustom = () => syncFromLocalStorage();

    window.addEventListener("storage", onStorage);
    window.addEventListener("recruiter-pro-changed", onCustom as EventListener);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(
        "recruiter-pro-changed",
        onCustom as EventListener,
      );
    };
  }, [syncFromLocalStorage]);

  const value = useMemo<RecruiterProContextValue>(
    () => ({ isProUser, expiresAt, loading, error, refresh }),
    [isProUser, expiresAt, loading, error, refresh],
  );

  return (
    <RecruiterProContext.Provider value={value}>
      {children}
    </RecruiterProContext.Provider>
  );
}

export function useRecruiterPro(): RecruiterProContextValue {
  const ctx = useContext(RecruiterProContext);
  if (!ctx)
    throw new Error(
      "useRecruiterPro must be used within a RecruiterProProvider",
    );
  return ctx;
}
