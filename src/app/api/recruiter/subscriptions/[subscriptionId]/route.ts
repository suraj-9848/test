import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { validateOAuthUser } from "../../../../../../utils/auth";
import apiClient from "../../../../../utils/axiosInterceptor";
import { API_ENDPOINTS } from "../../../../../config/urls";

export async function PUT(request: NextRequest, context: any) {
  try {
    const { params } = context;

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

    const { subscriptionId } = params;
    const data = await request.json();

    // Validate status field
    if (
      !data.status ||
      !["active", "canceled", "expired"].includes(data.status)
    ) {
      return NextResponse.json(
        { message: "Invalid status value", success: false },
        { status: 400 },
      );
    }

    // Update subscription via backend API
    const response = await apiClient.put(
      API_ENDPOINTS.RECRUITER.SUBSCRIPTION_BY_ID(subscriptionId),
      data,
      { headers: { Authorization: `Bearer ${jwt}` } },
    );
    const updatedSubscription = response.data.subscription || response.data;

    return NextResponse.json({
      message: "Subscription updated successfully",
      subscription: updatedSubscription,
      success: true,
    });
  } catch (error) {
    console.error("Error updating recruiter subscription:", error);
    return NextResponse.json(
      { message: "Failed to update subscription", success: false },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest, context: any) {
  try {
    const { params } = context;

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

    const { subscriptionId } = params;

    // Delete subscription via backend API
    await apiClient.delete(
      API_ENDPOINTS.RECRUITER.SUBSCRIPTION_BY_ID(subscriptionId),
      { headers: { Authorization: `Bearer ${jwt}` } },
    );

    return NextResponse.json({
      message: "Subscription deleted successfully",
      success: true,
    });
  } catch (error) {
    console.error("Error deleting recruiter subscription:", error);
    return NextResponse.json(
      { message: "Failed to delete subscription", success: false },
      { status: 500 },
    );
  }
}
