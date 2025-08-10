import axios from "axios";
import { getBackendJwt } from "@/utils/auth";
import { ProPlan } from "../../types";

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_BASE_URL as string;

if (
  !API_BASE_URL &&
  typeof window !== "undefined" &&
  process.env.NODE_ENV === "production"
) {
  // In production, this must be provided via environment
  // Avoid falling back to localhost which breaks deployed environments
  // eslint-disable-next-line no-console
  console.error(
    "NEXT_PUBLIC_BACKEND_BASE_URL is not set. Pro Plan API calls will fail in production.",
  );
}

const proPlanApi = axios.create({
  baseURL: `${API_BASE_URL || ""}/api/recruiter`,
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
