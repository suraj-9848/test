import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { validateOAuthUser } from "../../../../../utils/auth";
import apiClient from "@/utils/axiosInterceptor";
import { API_ENDPOINTS } from "@/config/urls";

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { message: "Unauthorized", success: false },
        { status: 401 },
      );
    }

    // Validate the user has a recruiter role
    const jwt = session.id_token;
    if (!jwt) {
      return NextResponse.json(
        { message: "Invalid session token", success: false },
        { status: 401 },
      );
    }

    // Use the validateOAuthUser helper to verify the user role
    const validateResult = await validateOAuthUser(jwt);
    if (!validateResult.valid || !validateResult.user) {
      return NextResponse.json(
        { message: "Invalid user", success: false },
        { status: 401 },
      );
    }

    // Check if user has recruiter role
    const role = validateResult.user.userRole?.toLowerCase();
    if (role !== "recruiter") {
      return NextResponse.json(
        {
          message: "Access denied. Recruiter role required.",
          success: false,
        },
        { status: 403 },
      );
    }

    // Proxy to backend jobs API
    const params: Record<string, string> = {};
    const urlObj = new URL(request.url);
    const status = urlObj.searchParams.get("status");
    const search = urlObj.searchParams.get("search");
    if (status) params.status = status;
    if (search) params.search = search;
    const response = await apiClient.get(API_ENDPOINTS.RECRUITER.JOBS, {
      params,
      headers: { Authorization: `Bearer ${jwt}` },
    });
    return NextResponse.json({
      message: "Jobs retrieved successfully",
      jobs: response.data.jobs,
      success: true,
    });
  } catch (error) {
    console.error("Error getting recruiter jobs:", error);
    return NextResponse.json(
      { message: "Failed to fetch jobs", success: false },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { message: "Unauthorized", success: false },
        { status: 401 },
      );
    }

    // Validate the user has a recruiter role
    const jwt = session.id_token;
    if (!jwt) {
      return NextResponse.json(
        { message: "Invalid session token", success: false },
        { status: 401 },
      );
    }

    // Use the validateOAuthUser helper to verify the user role
    const validateResult = await validateOAuthUser(jwt);
    if (!validateResult.valid || !validateResult.user) {
      return NextResponse.json(
        { message: "Invalid user", success: false },
        { status: 401 },
      );
    }

    // Check if user has recruiter role
    const role = validateResult.user.userRole?.toLowerCase();
    if (role !== "recruiter") {
      return NextResponse.json(
        {
          message: "Access denied. Recruiter role required.",
          success: false,
        },
        { status: 403 },
      );
    }

    const data = await request.json();
    // Create job via apiClient
    const response = await apiClient.post(API_ENDPOINTS.RECRUITER.JOBS, data, {
      headers: { Authorization: `Bearer ${jwt}` },
    });
    return NextResponse.json(
      {
        message: "Job created successfully",
        job: response.data,
        success: true,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating recruiter job:", error);
    return NextResponse.json(
      { message: "Failed to create job", success: false },
      { status: 500 },
    );
  }
}
