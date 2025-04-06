import { NextRequest, NextResponse } from "next/server";
import { processRules } from "@/lib/rule-processor";

// This route is meant to be called by a cron job service like Vercel Cron
// It processes rules using the AeroAPI integration for better cost efficiency

export async function GET(request: NextRequest) {
  try {
    // Verify API key for security (should match your environment variable)
    // Check both x-api-key header and Authorization Bearer header
    const xApiKey = request.headers.get("x-api-key");
    const authHeader = request.headers.get("Authorization");
    const bearerToken = authHeader?.startsWith("Bearer ") 
      ? authHeader.substring(7) 
      : null;
    
    const isAuthorized = 
      xApiKey === process.env.CRON_API_KEY || 
      bearerToken === process.env.CRON_API_KEY;
    
    if (!isAuthorized) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Check if we should run in production mode
    const environmentHeader = request.headers.get("X-Environment");
    const isProduction = 
      environmentHeader === "production" || 
      process.env.NODE_ENV === "production";
    
    console.log(`Running AeroAPI rule processing in ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'} mode`);
    
    // Process all active rules using our cost-efficient AeroAPI integration
    await processRules();
    
    return NextResponse.json({ 
      success: true, 
      message: "Rules processed successfully with AeroAPI integration" 
    });
  } catch (error) {
    console.error("Error in AeroAPI rule processing:", error);
    return NextResponse.json(
      { error: "Internal server error", details: (error as Error).message },
      { status: 500 }
    );
  }
} 