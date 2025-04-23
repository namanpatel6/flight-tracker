import { NextRequest, NextResponse } from "next/server";
import { scheduleRuleProcessing, checkQStashSchedules } from "@/lib/qstash-config";

/**
 * Admin endpoint to set up QStash schedules for rule processing
 * This should be protected and only accessible to authenticated admin users
 */
export async function POST(request: NextRequest) {
  try {
    // Secure this endpoint - check for admin authentication
    // In a real implementation, you'd verify the user is an admin
    const isAuthorized = await checkAdminAuthorization(request);
    
    if (!isAuthorized) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Schedule all rule processing intervals
    const success = await scheduleRuleProcessing();
    
    if (success) {
      return NextResponse.json({
        success: true,
        message: "QStash schedules successfully configured"
      });
    } else {
      return NextResponse.json(
        { error: "Failed to configure QStash schedules" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error setting up QStash schedules:", error);
    return NextResponse.json(
      { error: "Internal server error", details: (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * Endpoint to check current QStash schedule configuration
 */
export async function GET(request: NextRequest) {
  try {
    // Secure this endpoint - check for admin authentication
    const isAuthorized = await checkAdminAuthorization(request);
    
    if (!isAuthorized) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Check current QStash configuration
    const status = await checkQStashSchedules();
    
    return NextResponse.json({
      success: true,
      ...status
    });
  } catch (error) {
    console.error("Error checking QStash schedules:", error);
    return NextResponse.json(
      { error: "Internal server error", details: (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * Helper function to check if the request is from an admin
 * In a real implementation, this would verify authentication and admin role
 */
async function checkAdminAuthorization(request: NextRequest): Promise<boolean> {
  // For development, allow access with a special header
  if (process.env.NODE_ENV === "development") {
    return true;
  }
  
  // In production, implement proper authentication
  // This is a placeholder for your actual auth logic
  const authHeader = request.headers.get("Authorization");
  const adminKey = process.env.ADMIN_API_KEY;
  
  // Basic bearer token check
  if (authHeader && adminKey) {
    const token = authHeader.replace("Bearer ", "");
    return token === adminKey;
  }
  
  return false;
} 