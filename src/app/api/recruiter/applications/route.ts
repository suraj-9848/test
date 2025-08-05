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

    // Proxy to backend applications API
    const response = await apiClient.get(API_ENDPOINTS.RECRUITER.APPLICATIONS, {
      headers: { Authorization: `Bearer ${jwt}` },
    });
    return NextResponse.json({
      message: "Applications retrieved successfully",
      applications: response.data.applications,
      success: true,
    });
  } catch (error) {
    console.error("Error getting recruiter applications:", error);
    return NextResponse.json(
      { message: "Failed to fetch applications", success: false },
      { status: 500 },
    );
  }
}
