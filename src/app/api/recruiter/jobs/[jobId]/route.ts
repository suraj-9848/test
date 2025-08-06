import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { validateOAuthUser } from "../../../../../../utils/auth";
import apiClient from "../../../../../utils/axiosInterceptor";
import { API_ENDPOINTS } from "../../../../../config/urls";
import { UserRoles } from "@/types";

export async function GET(request: NextRequest, context: any) {
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

    // Check if user has recruiter role using enum
    const role = validateResult.user.userRole as UserRoles;
    if (role !== UserRoles.RECRUITER) {
      return NextResponse.json(
        {
          message: "Access denied. Recruiter role required.",
          success: false,
        },
        { status: 403 },
      );
    }

    const { jobId } = context.params;
    // Proxy to backend job API
    const response = await apiClient.get(
      API_ENDPOINTS.RECRUITER.JOB_BY_ID(jobId),
      {
        headers: { Authorization: `Bearer ${jwt}` },
      },
    );
    const job = response.data;
    return NextResponse.json({
      message: "Job retrieved successfully",
      job,
      success: true,
    });
  } catch (error) {
    console.error("Error getting recruiter job:", error);
    return NextResponse.json(
      { message: "Failed to fetch job", success: false },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest, context: any) {
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

    // Check if user has recruiter role using enum
    const role = validateResult.user.userRole as UserRoles;
    if (role !== UserRoles.RECRUITER) {
      return NextResponse.json(
        {
          message: "Access denied. Recruiter role required.",
          success: false,
        },
        { status: 403 },
      );
    }

    const { jobId } = context.params;
    const data = await request.json();
    // Update job via apiClient
    const response = await apiClient.put(
      API_ENDPOINTS.RECRUITER.JOB_BY_ID(jobId),
      data,
      { headers: { Authorization: `Bearer ${jwt}` } },
    );
    const updatedJob = response.data;
    return NextResponse.json({
      message: "Job updated successfully",
      job: updatedJob,
      success: true,
    });
  } catch (error) {
    console.error("Error updating recruiter job:", error);
    return NextResponse.json(
      { message: "Failed to update job", success: false },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest, context: any) {
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

    // Check if user has recruiter role using enum
    const role = validateResult.user.userRole as UserRoles;
    if (role !== UserRoles.RECRUITER) {
      return NextResponse.json(
        {
          message: "Access denied. Recruiter role required.",
          success: false,
        },
        { status: 403 },
      );
    }

    const { jobId } = context.params;
    // Delete job via apiClient
    await apiClient.delete(API_ENDPOINTS.RECRUITER.JOB_BY_ID(jobId), {
      headers: { Authorization: `Bearer ${jwt}` },
    });
    return NextResponse.json({
      message: "Job deleted successfully",
      success: true,
    });
  } catch (error) {
    console.error("Error deleting recruiter job:", error);
    return NextResponse.json(
      { message: "Failed to delete job", success: false },
      { status: 500 },
    );
  }
}
