import { NextRequest, NextResponse } from "next/server";
import { cleanupExpiredSessions, resetConnectionPool } from "@/lib/session-cleanup";

/**
 * API route to clean up expired sessions
 * Can be called by a cron job to maintain database health
 * 
 * Should be scheduled to run every few hours (recommended: every 4 hours)
 * to prevent session-related database connection issues
 */
export async function GET(request: NextRequest) {
  try {
    // Check for authorized cron job request
    const authHeader = request.headers.get("Authorization");
    const cronSecret = process.env.CRON_SECRET;
    
    // Basic API key verification for cron
    if (cronSecret && (!authHeader || !authHeader.includes(cronSecret))) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Reset connection pool if requested
    const resetConnections = request.nextUrl.searchParams.get("reset_connections");
    if (resetConnections === "true") {
      await resetConnectionPool();
    }
    
    // Run the cleanup operation
    const result = await cleanupExpiredSessions();
    
    // Return the result
    return NextResponse.json({
      success: true,
      message: `Successfully cleaned up ${result.deleted} expired sessions`,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Session cleanup failed:", error);
    
    return NextResponse.json(
      {
        success: false, 
        error: error.message || "Unknown error occurred",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
} 