import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { validateOAuthUser } from "../../../../../utils/auth";
import { UserRoles } from "@/types";

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

    const dashboardStats = {};

    return NextResponse.json({
      message: "Dashboard statistics retrieved successfully",
      data: dashboardStats,
      success: true,
    });
  } catch (error) {
    console.error("Error getting recruiter dashboard stats:", error);
    return NextResponse.json(
      { message: "Failed to fetch dashboard statistics", success: false },
      { status: 500 },
    );
  }
}
