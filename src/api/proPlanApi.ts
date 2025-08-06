import axios from "axios";
import { getBackendJwt } from "@/utils/auth";
import { ProPlan } from "../../types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_BASE_URL || "http://localhost:3000";

const proPlanApi = axios.create({
  baseURL: `${API_BASE_URL}/api/recruiter`,
  headers: {
    "Content-Type": "application/json",
  },
});

proPlanApi.interceptors.request.use(async (config) => {
  const token = await getBackendJwt();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const getProPlans = () => proPlanApi.get("/pro-plans");

export const createProPlan = (
  plan: Omit<ProPlan, "id" | "is_active" | "created_at" | "updated_at">,
) => proPlanApi.post("/pro-plans", plan);

export const updateProPlan = (id: string, plan: Partial<ProPlan>) =>
  proPlanApi.put(`/pro-plans/${id}`, plan);

export const toggleProPlanStatus = (id: string) =>
  proPlanApi.post(`/pro-plans/${id}/toggle-status`);

export const deleteProPlan = (id: string) =>
  proPlanApi.delete(`/pro-plans/${id}`);

export const getProPlanAnalytics = (id: string) =>
  proPlanApi.get(`/pro-plans/${id}/analytics`);
