import { NextResponse } from "next/server";
import { checkDatabaseConnection, resetConnectionPool } from "@/lib/session-cleanup";
import { getSession } from "@/lib/auth";

/**
 * Health check endpoint to verify database connection
 * This can be used by monitoring systems to ensure the application is healthy
 */
export async function GET() {
  try {
    const startTime = Date.now();
    
    // Check database connection
    const dbConnected = await checkDatabaseConnection();
    
    // Check session functionality
    let sessionCheck = "skipped";
    try {
      // Attempt to retrieve session to verify that part is working
      await getSession();
      sessionCheck = "passed";
    } catch (sessionError) {
      sessionCheck = "failed";
      console.error("Session check failed:", sessionError);
      
      // If database is connected but session fails, try to reset connection pool
      if (dbConnected) {
        await resetConnectionPool();
      }
    }
    
    // Calculate response time
    const responseTime = Date.now() - startTime;
    
    // Return health status
    return NextResponse.json({
      status: dbConnected ? "healthy" : "unhealthy",
      checks: {
        database: dbConnected ? "connected" : "disconnected",
        session: sessionCheck,
      },
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString(),
    }, {
      status: dbConnected ? 200 : 503,
      headers: {
        "Cache-Control": "no-store, max-age=0",
      }
    });
  } catch (error: any) {
    console.error("Health check failed:", error);
    
    return NextResponse.json({
      status: "error",
      message: error.message || "Unknown error occurred",
      timestamp: new Date().toISOString(),
    }, { 
      status: 500,
      headers: {
        "Cache-Control": "no-store, max-age=0",
      }
    });
  }
} 