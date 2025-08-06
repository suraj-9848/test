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

    // Fetch subscriptions from backend API
    const response = await apiClient.get(
      API_ENDPOINTS.RECRUITER.SUBSCRIPTIONS,
      {
        headers: { Authorization: `Bearer ${jwt}` },
      },
    );
    const subscriptions = response.data.subscriptions || response.data;
    return NextResponse.json({
      message: "Subscriptions retrieved successfully",
      subscriptions,
      success: true,
    });
  } catch (error) {
    console.error("Error getting recruiter subscriptions:", error);
    return NextResponse.json(
      { message: "Failed to fetch subscriptions", success: false },
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

    // Validate required fields
    if (!data.user_id || !data.plan) {
      return NextResponse.json(
        { message: "Missing required fields", success: false },
        { status: 400 },
      );
    }

    // Create subscription via backend API
    const response = await apiClient.post(
      API_ENDPOINTS.RECRUITER.SUBSCRIPTIONS,
      data,
      {
        headers: { Authorization: `Bearer ${jwt}` },
      },
    );
    const newSubscription = response.data.subscription || response.data;
    return NextResponse.json(
      {
        message: "Subscription created successfully",
        subscription: newSubscription,
        success: true,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating recruiter subscription:", error);
    return NextResponse.json(
      { message: "Failed to create subscription", success: false },
      { status: 500 },
    );
  }
}
