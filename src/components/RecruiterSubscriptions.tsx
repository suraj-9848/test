"use client";

import React, { useEffect, useState } from "react";
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
  plan: "free" | "pro";
  status: "active" | "canceled" | "expired";
  amount: number;
  expiresAt: string;
  features: string[];
}

const RecruiterSubscriptions: React.FC = () => {
  const { showToast } = useToast();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [currentSubscription, setCurrentSubscription] =
    useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSubscriptions = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await recruiterApi.getSubscriptions();
        if (response.success && response.subscriptions) {
          setSubscriptions(response.subscriptions);
          if (response.subscriptions.length > 0) {
            setCurrentSubscription(response.subscriptions[0]);
          }
        } else {
          throw new Error(response.message || "Failed to load subscriptions");
        }
      } catch (err) {
        const error = err as Error;
        setError(error.message || "Failed to load subscriptions");
        showToast("error", "Failed to load subscription information");
      } finally {
        setLoading(false);
      }
    };

    fetchSubscriptions();
  }, [showToast]);

  const handleUpgrade = async () => {
    try {
      setLoading(true);
      const subscriptionData = {
        user_id: currentSubscription?.user_id || "current_user", // In a real app, you would get the actual user ID
        plan: "pro",
      };

      const response = await recruiterApi.createSubscription(subscriptionData);

      if (response.success) {
        setSubscriptions([...subscriptions, response.subscription]);
        setCurrentSubscription(response.subscription);
        showToast("success", "Successfully upgraded to Pro plan");
      } else {
        throw new Error(response.message || "Failed to upgrade subscription");
      }
    } catch (error) {
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
        setSubscriptions(
          subscriptions.map((sub) =>
            sub.id === id ? response.subscription : sub,
          ),
        );

        if (currentSubscription && currentSubscription.id === id) {
          setCurrentSubscription(response.subscription);
        }

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
                className="w-full bg-gray-800 border border-transparent rounded-md py-3 px-5 font-medium text-white hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                onClick={() =>
                  showToast("success", "You are currently on the free plan")
                }
                disabled={
                  currentSubscription
                    ? currentSubscription.plan === "pro" &&
                      currentSubscription.status === "active"
                    : false
                }
              >
                {!currentSubscription || currentSubscription.plan !== "pro"
                  ? "Current Plan"
                  : "Downgrade to Free"}
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
              {currentSubscription && currentSubscription.plan === "pro" ? (
                <button
                  className="w-full bg-red-500 border border-transparent rounded-md py-3 px-5 font-medium text-white hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  onClick={() =>
                    handleCancelSubscription(currentSubscription.id)
                  }
                  disabled={currentSubscription.status !== "active"}
                >
                  {currentSubscription.status === "active"
                    ? "Cancel Subscription"
                    : "Subscription Canceled"}
                </button>
              ) : (
                <button
                  className="w-full bg-blue-600 border border-transparent rounded-md py-3 px-5 font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  onClick={handleUpgrade}
                >
                  Upgrade to Pro
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
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              onClick={handleUpgrade}
            >
              <FaRocket className="mr-2 h-4 w-4" />
              Upgrade Now
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
                    {new Date(
                      currentSubscription.expiresAt,
                    ).toLocaleDateString()}
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
      </div>

      {renderCurrentSubscription()}

      <h2 className="text-2xl font-bold text-gray-800 mb-4">Available Plans</h2>
      {renderPricingPlans()}
    </div>
  );
};

export default RecruiterSubscriptions;
