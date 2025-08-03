"use client";
import React, { useState, useEffect } from "react";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaToggleOn,
  FaToggleOff,
  FaCrown,
  FaChartBar,
} from "react-icons/fa";
import * as proPlanApi from "../api/proPlanApi";
import { ProPlan } from "../../types";

export default function ProPlanManagement() {
  const [plans, setPlans] = useState<ProPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<ProPlan | null>(null);
  const [formData, setFormData] = useState<
    Omit<ProPlan, "id" | "is_active" | "created_at" | "updated_at">
  >({
    name: "",
    description: "",
    price: 0,
    currency: "INR",
    duration_months: 1,
    features: [""],
  });
  const [analytics, setAnalytics] = useState<{
    planName?: string;
    totalSubscriptions?: number;
    totalRevenue?: number;
    activeSubscriptions?: number;
    mrr?: number;
    recentSubscriptions?: Array<{
      id: string;
      created_at: string;
      user?: { name: string };
    }>;
  } | null>(null);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      setLoading(true);
      const response = await proPlanApi.getProPlans();
      setPlans(response.data.plans || []);
    } catch (error) {
      console.error("Error loading plans:", error);
      setPlans([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const planData = {
        ...formData,
        price: Number(formData.price) || 0,
        duration_months: Number(formData.duration_months) || 1,
      };

      if (editingPlan) {
        await proPlanApi.updateProPlan(editingPlan.id, planData);
      } else {
        await proPlanApi.createProPlan(planData);
      }
      setShowModal(false);
      setEditingPlan(null);
      resetForm();
      loadPlans();
    } catch (error) {
      console.error("Error saving plan:", error);
      alert("Error saving plan. Please try again.");
    }
  };

  const handleEdit = (plan: ProPlan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      description: plan.description,
      price: plan.price,
      currency: plan.currency,
      duration_months: plan.duration_months,
      features: plan.features.length > 0 ? plan.features : [""],
    });
    setShowModal(true);
  };

  const handleDelete = async (planId: string) => {
    if (confirm("Are you sure you want to delete this plan?")) {
      try {
        await proPlanApi.deleteProPlan(planId);
        loadPlans();
      } catch (error) {
        console.error("Error deleting plan:", error);
        alert("Error deleting plan. Please try again.");
      }
    }
  };

  const handleToggleStatus = async (planId: string) => {
    try {
      await proPlanApi.toggleProPlanStatus(planId);
      loadPlans();
    } catch (error) {
      console.error("Error toggling plan status:", error);
      alert("Error updating plan status. Please try again.");
    }
  };

  const handleShowAnalytics = async (planId: string, planName: string) => {
    try {
      const response = await proPlanApi.getProPlanAnalytics(planId);
      setAnalytics({
        ...response.data,
        planName: planName
      });
      setShowAnalyticsModal(true);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      alert("Could not fetch analytics data.");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: 0,
      currency: "INR",
      duration_months: 1,
      features: [""],
    });
  };

  const handleFeatureChange = (index: number, value: string) => {
    const newFeatures = [...formData.features];
    newFeatures[index] = value;
    setFormData({ ...formData, features: newFeatures });
  };

  const addFeature = () => {
    setFormData({ ...formData, features: [...formData.features, ""] });
  };

  const removeFeature = (index: number) => {
    const newFeatures = formData.features.filter((_, i) => i !== index);
    setFormData({ ...formData, features: newFeatures });
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">
          Pro Plan Management
        </h1>
        <button
          onClick={() => {
            setEditingPlan(null);
            resetForm();
            setShowModal(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 flex items-center"
        >
          <FaPlus className="mr-2" /> Create New Plan
        </button>
      </div>

      {loading ? (
        <p>Loading plans...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                    <FaCrown className="mr-2 text-yellow-500" /> {plan.name}
                  </h2>
                  <p className="text-gray-600 mt-1">{plan.description}</p>
                </div>
                <button
                  onClick={() => handleToggleStatus(plan.id)}
                  className="text-2xl"
                >
                  {plan.is_active ? (
                    <FaToggleOn className="text-green-500" />
                  ) : (
                    <FaToggleOff className="text-gray-400" />
                  )}
                </button>
              </div>
              <div className="my-4">
                <p className="text-3xl font-extrabold text-blue-600">
                  ₹{plan.price}{" "}
                  <span className="text-lg font-normal text-gray-500">
                    / {plan.duration_months} mo
                  </span>
                </p>
              </div>
              <ul className="space-y-2 text-gray-700 mb-6">
                {plan.features.map((feature: string, index: number) => (
                  <li key={index} className="flex items-center">
                    <svg
                      className="w-5 h-5 text-green-500 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M5 13l4 4L19 7"
                      ></path>
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => handleShowAnalytics(plan.id, plan.name)}
                  className="p-2 text-gray-500 hover:text-blue-600"
                >
                  <FaChartBar />
                </button>
                <button
                  onClick={() => handleEdit(plan)}
                  className="p-2 text-gray-500 hover:text-yellow-600"
                >
                  <FaEdit />
                </button>
                <button
                  onClick={() => handleDelete(plan.id)}
                  className="p-2 text-gray-500 hover:text-red-600"
                >
                  <FaTrash />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-lg">
            <h2 className="text-2xl font-bold mb-6">
              {editingPlan ? "Edit Plan" : "Create New Plan"}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Plan Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Premium Monthly, Pro Yearly"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="p-3 border rounded-lg w-full"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Price (₹)
                    </label>
                    <input
                      type="number"
                      placeholder="299"
                      value={formData.price}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          price: Number(e.target.value),
                        })
                      }
                      className="p-3 border rounded-lg w-full"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Currency
                    </label>
                    <select
                      value={formData.currency}
                      onChange={(e) =>
                        setFormData({ ...formData, currency: e.target.value })
                      }
                      className="p-3 border rounded-lg w-full"
                      required
                    >
                      <option value="INR">INR (₹)</option>
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Duration (Months)
                    </label>
                    <input
                      type="number"
                      placeholder="1, 6, 12"
                      value={formData.duration_months}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          duration_months: Number(e.target.value),
                        })
                      }
                      className="p-3 border rounded-lg w-full"
                      required
                    />
                  </div>
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  placeholder="Describe what this plan includes..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="p-3 border rounded-lg w-full"
                  rows={3}
                ></textarea>
              </div>

              <h3 className="text-lg font-semibold mb-2">Features</h3>
              {formData.features.map((feature: string, index: number) => (
                <div key={index} className="flex items-center mb-2">
                  <input
                    type="text"
                    value={feature}
                    onChange={(e) => handleFeatureChange(index, e.target.value)}
                    className="p-3 border rounded-lg flex-grow"
                    placeholder={`Feature ${index + 1}`}
                  />
                  <button
                    type="button"
                    onClick={() => removeFeature(index)}
                    className="ml-2 text-red-500 p-2"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addFeature}
                className="text-blue-600 mb-6"
              >
                Add Feature
              </button>

              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                >
                  {editingPlan ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAnalyticsModal && analytics && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-lg">
            <h2 className="text-2xl font-bold mb-6">
              Analytics for {analytics.planName || "Plan"}
            </h2>
            <div className="space-y-4">
              <p>
                <strong>Total Subscriptions:</strong>{" "}
                {analytics.totalSubscriptions || 0}
              </p>
              <p>
                <strong>Active Subscriptions:</strong>{" "}
                {analytics.activeSubscriptions || 0}
              </p>
              <p>
                <strong>Total Revenue:</strong> ₹
                {(analytics.totalRevenue || 0).toFixed(2)}
              </p>
              <p>
                <strong>Monthly Recurring Revenue (MRR):</strong> ₹
                {(analytics.mrr || 0).toFixed(2)}
              </p>
              <p>
                <strong>Recent Subscriptions:</strong>
              </p>
              <ul className="list-disc list-inside">
                {(analytics.recentSubscriptions || []).map((sub: {
                  id: string;
                  created_at: string;
                  user?: { name: string };
                }) => (
                  <li key={sub.id}>
                    {sub.user?.name || "Unknown User"} -{" "}
                    {new Date(sub.created_at).toLocaleDateString()}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowAnalyticsModal(false)}
                className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
