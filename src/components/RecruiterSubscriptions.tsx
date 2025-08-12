"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  FaCreditCard,
  FaRegClock,
  FaRocket,
  FaCheck,
  FaExclamationCircle,
} from "react-icons/fa";
import { useToast } from "./ToastContext";
import { recruiterApi } from "../api/recruiterApi";

interface Subscription {
  id: string;
  user_id: string;
  plan: "free" | "pro" | string; // tolerate unexpected casing
  status: "active" | "canceled" | "expired" | string; // tolerate unexpected casing
  amount: number;
  expiresAt: any; // backend may send number/string
  features: string[];
}

// Helpers to normalize and format dates/fields
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

const formatExpiry = (iso?: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString();
};

const normalizeSub = (s: Subscription): Subscription => ({
  ...s,
  plan: (s.plan as any)?.toString?.().toLowerCase?.() || s.plan,
  status: (s.status as any)?.toString?.().toLowerCase?.() || s.status,
  expiresAt: normalizeDateString(s.expiresAt),
});

const RecruiterSubscriptions: React.FC = () => {
  const { showToast } = useToast();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [currentSubscription, setCurrentSubscription] =
    useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [proUnknown, setProUnknown] = useState<boolean>(true);

  // Derived state: is user Pro & expiry
  const isProActive = subscriptions.some(
    (s) => s.plan === "pro" && s.status === "active",
  );
  const proActiveSub =
    subscriptions.find((s) => s.plan === "pro" && s.status === "active") ||
    null;

  const emitProChanged = () => {
    try {
      window.dispatchEvent(new Event("recruiter-pro-changed"));
    } catch {}
  };

  const refreshSubs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // Don't assume non-pro on error; keep unknown until success
      setProUnknown(true);
      const response = await recruiterApi.getSubscriptions();
      if (response.success && response.subscriptions) {
        const raw: Subscription[] = response.subscriptions;
        const subs = raw.map(normalizeSub);
        setSubscriptions(subs);
        const activePro = subs.find(
          (s) => s.status === "active" && s.plan === "pro",
        );
        const activeAny = subs.find((s) => s.status === "active");
        const latest = [...subs].sort(
          (a, b) =>
            new Date(b.expiresAt || 0).getTime() -
            new Date(a.expiresAt || 0).getTime(),
        )[0];
        const curr = activePro || activeAny || latest || null;
        setCurrentSubscription(curr);
        // Cache for quick UX (optional)
        try {
          if (activePro) {
            localStorage.setItem("recruiterIsPro", "1");
            if (activePro.expiresAt) {
              localStorage.setItem(
                "recruiterProExpiresAt",
                (activePro.expiresAt as string) || "",
              );
            } else {
              localStorage.removeItem("recruiterProExpiresAt");
            }
          } else {
            localStorage.setItem("recruiterIsPro", "0");
            localStorage.removeItem("recruiterProExpiresAt");
          }
          emitProChanged();
        } catch {}
        // Only clear unknown after a successful fetch
        setProUnknown(false);
      } else {
        throw new Error(response.message || "Failed to load subscriptions");
      }
    } catch (err) {
      const error = err as Error;
      setError(error.message || "Failed to load subscriptions");
      showToast("error", "Failed to load subscription information");
      // Keep proUnknown = true here so UI doesn't prompt upgrade incorrectly
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    // Bootstrap from cache to avoid flicker and wrong prompts on refresh
    try {
      const cachedPro = localStorage.getItem("recruiterIsPro") === "1";
      const cachedExp = localStorage.getItem("recruiterProExpiresAt") || "";
      if (cachedPro) {
        const cachedSub = normalizeSub({
          id: "cached",
          user_id: "current_user",
          plan: "pro",
          status: "active",
          amount: 0,
          expiresAt: cachedExp || new Date().toISOString(),
          features: [],
        } as Subscription);
        setSubscriptions([cachedSub]);
        setCurrentSubscription(cachedSub);
        setProUnknown(false);
      }
    } catch {}
    refreshSubs();

    const onVis = () => {
      if (document.visibilityState === "visible") {
        refreshSubs();
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [refreshSubs]);

  const handleUpgrade = async () => {
    try {
      // If unknown, re-check first
      if (proUnknown) {
        await refreshSubs();
      }
      if (isProActive) {
        showToast(
          "success",
          proActiveSub?.expiresAt
            ? `You're already Pro (expires on ${formatExpiry(
                proActiveSub.expiresAt as string,
              )})`
            : "You're already Pro",
        );
        return;
      }
      setLoading(true);
      const subscriptionData = {
        user_id: currentSubscription?.user_id || "current_user",
        plan: "pro",
      };

      const response = await recruiterApi.createSubscription(subscriptionData);

      if (response.success) {
        // Always re-fetch to sync status and dates from backend
        await refreshSubs();
        showToast("success", "Successfully upgraded to Pro plan");
      } else {
        throw new Error(response.message || "Failed to upgrade subscription");
      }
    } catch (error: any) {
      const msg = (error?.message || "").toLowerCase();
      if (msg.includes("already") && msg.includes("active subscription")) {
        // Try to sync from backend
        await refreshSubs();
        // If still not reflected due to API issues, fall back to local Pro state
        if (!isProActive) {
          try {
            const cachedExp =
              localStorage.getItem("recruiterProExpiresAt") || "";
            const fallbackSub = normalizeSub({
              id: "local-pro",
              user_id: currentSubscription?.user_id || "current_user",
              plan: "pro",
              status: "active",
              amount: currentSubscription?.amount || 0,
              expiresAt: cachedExp || new Date().toISOString(),
              features: currentSubscription?.features || [],
            } as Subscription);
            setSubscriptions((prev) => {
              const others = prev.filter(
                (p) => !(p.plan === "pro" && p.status === "active"),
              );
              return [fallbackSub, ...others];
            });
            setCurrentSubscription(fallbackSub);
            setProUnknown(false);
            localStorage.setItem("recruiterIsPro", "1");
            if (fallbackSub.expiresAt) {
              localStorage.setItem(
                "recruiterProExpiresAt",
                (fallbackSub.expiresAt as string) || "",
              );
            }
            emitProChanged();
          } catch {}
        }
        const exp = proActiveSub?.expiresAt
          ? formatExpiry(proActiveSub.expiresAt as string)
          : "current period";
        showToast("success", `You're already Pro (expires on ${exp})`);
        return;
      }
      console.error("Error upgrading subscription:", error);
      showToast("error", "Failed to upgrade subscription");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async (id: string) => {
    try {
      setLoading(true);
      const response = await recruiterApi.updateSubscription(id, {
        status: "canceled",
      });

      if (response.success) {
        // Re-fetch to ensure consistency
        await refreshSubs();
        showToast("success", "Subscription canceled successfully");
      } else {
        throw new Error(response.message || "Failed to cancel subscription");
      }
    } catch (error) {
      console.error("Error canceling subscription:", error);
      showToast("error", "Failed to cancel subscription");
    } finally {
      setLoading(false);
    }
  };

  const getSubscriptionStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <span className="flex items-center text-sm text-green-700 bg-green-100 px-3 py-1 rounded-full">
            <FaCheck className="mr-1" /> Active
          </span>
        );
      case "canceled":
        return (
          <span className="flex items-center text-sm text-yellow-700 bg-yellow-100 px-3 py-1 rounded-full">
            <FaExclamationCircle className="mr-1" /> Canceled
          </span>
        );
      case "expired":
        return (
          <span className="flex items-center text-sm text-red-700 bg-red-100 px-3 py-1 rounded-full">
            <FaExclamationCircle className="mr-1" /> Expired
          </span>
        );
      default:
        return null;
    }
  };

  const renderPricingPlans = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
        {/* Free Plan */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
          <div className="p-6">
            <h3 className="text-2xl font-bold text-gray-800">Free Plan</h3>
            <div className="mt-4 flex items-baseline text-gray-900">
              <span className="text-5xl font-extrabold tracking-tight">$0</span>
              <span className="ml-1 text-xl font-semibold">/month</span>
            </div>
            <p className="mt-5 text-lg text-gray-500">
              For recruiters just getting started
            </p>

            <div className="mt-6">
              <ul role="list" className="space-y-3">
                <li className="flex items-start">
                  <div className="flex-shrink-0">
                    <FaCheck className="h-6 w-6 text-green-500" />
                  </div>
                  <p className="ml-3 text-base text-gray-700">
                    Up to 3 active job postings
                  </p>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0">
                    <FaCheck className="h-6 w-6 text-green-500" />
                  </div>
                  <p className="ml-3 text-base text-gray-700">
                    Basic candidate filtering
                  </p>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0">
                    <FaCheck className="h-6 w-6 text-green-500" />
                  </div>
                  <p className="ml-3 text-base text-gray-700">
                    Standard job visibility
                  </p>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0">
                    <FaCheck className="h-6 w-6 text-green-500" />
                  </div>
                  <p className="ml-3 text-base text-gray-700">
                    Email notifications
                  </p>
                </li>
              </ul>
            </div>

            <div className="mt-8">
              <button
                className="w-full bg-gray-800 border border-transparent rounded-md py-3 px-5 font-medium text-white hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-60"
                onClick={() =>
                  showToast("success", "You are currently on the free plan")
                }
                disabled={isProActive || proUnknown}
                title={
                  proUnknown
                    ? "Checking your Pro status..."
                    : isProActive
                      ? "You're already on Pro"
                      : undefined
                }
              >
                {proUnknown
                  ? "Checking..."
                  : isProActive
                    ? "You're on Pro"
                    : "Current Plan"}
              </button>
            </div>
          </div>
        </div>

        {/* Pro Plan */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border-2 border-blue-500 transform scale-105">
          <div className="p-6">
            <h3 className="text-2xl font-bold text-gray-800">Pro Plan</h3>
            <div className="mt-4 flex items-baseline text-gray-900">
              <span className="text-5xl font-extrabold tracking-tight">
                $99.99
              </span>
              <span className="ml-1 text-xl font-semibold">/month</span>
            </div>
            <p className="mt-5 text-lg text-gray-500">
              For professional recruiters
            </p>

            <div className="mt-6">
              <ul role="list" className="space-y-3">
                <li className="flex items-start">
                  <div className="flex-shrink-0">
                    <FaCheck className="h-6 w-6 text-green-500" />
                  </div>
                  <p className="ml-3 text-base text-gray-700">
                    Unlimited job postings
                  </p>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0">
                    <FaCheck className="h-6 w-6 text-green-500" />
                  </div>
                  <p className="ml-3 text-base text-gray-700">
                    Advanced candidate filtering
                  </p>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0">
                    <FaCheck className="h-6 w-6 text-green-500" />
                  </div>
                  <p className="ml-3 text-base text-gray-700">
                    Featured job listings
                  </p>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0">
                    <FaCheck className="h-6 w-6 text-green-500" />
                  </div>
                  <p className="ml-3 text-base text-gray-700">
                    Analytics dashboard
                  </p>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0">
                    <FaCheck className="h-6 w-6 text-green-500" />
                  </div>
                  <p className="ml-3 text-base text-gray-700">
                    Priority support
                  </p>
                </li>
              </ul>
            </div>

            <div className="mt-8">
              {isProActive ? (
                <button
                  className="w-full bg-gray-100 text-gray-700 border border-gray-300 rounded-md py-3 px-5 font-medium cursor-not-allowed"
                  disabled
                  title={
                    proActiveSub?.expiresAt
                      ? `You're already Pro (expires on ${formatExpiry(proActiveSub.expiresAt as string)})`
                      : "You're already Pro"
                  }
                >
                  {proActiveSub?.expiresAt
                    ? `You're already Pro (expires on ${formatExpiry(proActiveSub.expiresAt as string)})`
                    : "You're already Pro"}
                </button>
              ) : currentSubscription &&
                (currentSubscription.plan as string) === "pro" ? (
                <button
                  className="w-full bg-red-500 border border-transparent rounded-md py-3 px-5 font-medium text-white hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  onClick={() =>
                    handleCancelSubscription(currentSubscription.id)
                  }
                  disabled={(currentSubscription.status as string) !== "active"}
                >
                  {(currentSubscription.status as string) === "active"
                    ? "Cancel Subscription"
                    : "Subscription Canceled"}
                </button>
              ) : (
                <button
                  className="w-full bg-blue-600 border border-transparent rounded-md py-3 px-5 font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-60"
                  onClick={handleUpgrade}
                  disabled={proUnknown}
                  title={proUnknown ? "Checking your Pro status..." : undefined}
                >
                  {proUnknown ? "Checking..." : "Upgrade to Pro"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderCurrentSubscription = () => {
    if (!currentSubscription) {
      return (
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div className="text-center py-6">
            <FaCreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900">
              No active subscription
            </h3>
            <p className="mt-2 text-gray-500">
              You&apos;re currently on the Free plan with limited features.
            </p>
            <button
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-60"
              onClick={handleUpgrade}
              disabled={proUnknown}
              title={proUnknown ? "Checking your Pro status..." : undefined}
            >
              <FaRocket className="mr-2 h-4 w-4" />
              {proUnknown ? "Checking..." : "Upgrade Now"}
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200 mb-8">
        <div className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-2xl font-bold text-gray-800">
                Current Subscription
              </h3>
              <p className="mt-1 text-gray-500">
                Your subscription details and management
              </p>
            </div>
            {getSubscriptionStatusBadge(currentSubscription.status)}
          </div>

          <div className="mt-6 border-t border-gray-200 pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-gray-500">Plan</p>
                <p className="text-lg font-semibold text-gray-900 capitalize">
                  {currentSubscription.plan}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Amount</p>
                <p className="text-lg font-semibold text-gray-900">
                  ${currentSubscription.amount.toFixed(2)}
                  /month
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Expires</p>
                <div className="flex items-center">
                  <FaRegClock className="mr-1 text-gray-400" />
                  <p className="text-lg font-semibold text-gray-900">
                    {formatExpiry(currentSubscription.expiresAt as string) ||
                      "—"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <h4 className="text-lg font-medium text-gray-900">Features</h4>
            <ul className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
              {currentSubscription.features.map((feature, index) => (
                <li key={index} className="flex items-center">
                  <FaCheck className="h-5 w-5 text-green-500 mr-2" />
                  <span className="text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {currentSubscription.status === "active" && (
            <div className="mt-8">
              <button
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                onClick={() => handleCancelSubscription(currentSubscription.id)}
              >
                Cancel Subscription
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-8 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <span className="text-red-500 text-lg font-semibold mb-2">{error}</span>
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded-lg mt-2"
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">
          Subscription Management
        </h1>
        <p className="text-gray-600 mt-1">
          Manage your subscription plan and billing
        </p>
        {isProActive && (
          <div className="mt-3 inline-flex items-center text-sm text-blue-800 bg-blue-100 border border-blue-200 px-3 py-1.5 rounded-full">
            <span className="font-medium mr-1">Pro Active</span>
            {proActiveSub?.expiresAt && (
              <span>
                · Expires on {formatExpiry(proActiveSub.expiresAt as string)}
              </span>
            )}
          </div>
        )}
      </div>

      {renderCurrentSubscription()}

      {/* Only show available plans when status is known and user is not Pro */}
      {!proUnknown && !isProActive && (
        <>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Available Plans
          </h2>
          {renderPricingPlans()}
        </>
      )}

      {/* Optional placeholder while checking status */}
      {proUnknown && (
        <div className="mt-6 flex items-center text-gray-600">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500 mr-2"></div>
          Checking your subscription status...
        </div>
      )}
    </div>
  );
};

export default RecruiterSubscriptions;
