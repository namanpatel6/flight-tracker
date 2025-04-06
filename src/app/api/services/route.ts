import { NextRequest, NextResponse } from "next/server";
import { startRulesPolling, stopRulesPolling, isRulesPollingEnabled } from "@/lib/service-init";
import { IS_PRODUCTION, CRON_API_KEY } from "@/lib/env";

// API endpoint to control services - for development use only
// In production, services are started automatically

export async function GET(request: NextRequest) {
  try {
    // Don't allow service control in production
    if (IS_PRODUCTION) {
      return NextResponse.json({ 
        error: "Service control API is disabled in production"
      }, { status: 403 });
    }
    
    // Get current service status
    return NextResponse.json({
      services: {
        rulesPolling: isRulesPollingEnabled()
      }
    });
  } catch (error) {
    console.error("Error checking service status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Don't allow service control in production
    if (IS_PRODUCTION) {
      return NextResponse.json({ 
        error: "Service control API is disabled in production"
      }, { status: 403 });
    }
    
    // Verify API key
    const xApiKey = request.headers.get("x-api-key");
    const authHeader = request.headers.get("Authorization");
    const bearerToken = authHeader?.startsWith("Bearer ") 
      ? authHeader.substring(7) 
      : null;
    
    const isAuthorized = 
      xApiKey === CRON_API_KEY || 
      bearerToken === CRON_API_KEY;
    
    if (!isAuthorized) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Parse request body
    const body = await request.json();
    const { action, service, intervalMinutes } = body;
    
    if (!action || !service) {
      return NextResponse.json({ 
        error: "Missing required fields" 
      }, { status: 400 });
    }
    
    // Process the action
    if (service === "rulesPolling") {
      if (action === "start") {
        startRulesPolling(intervalMinutes || 10);
        return NextResponse.json({ 
          success: true, 
          message: "Rules polling service started"
        });
      } else if (action === "stop") {
        stopRulesPolling();
        return NextResponse.json({ 
          success: true, 
          message: "Rules polling service stopped"
        });
      }
    }
    
    return NextResponse.json({ 
      error: "Invalid action or service" 
    }, { status: 400 });
  } catch (error) {
    console.error("Error controlling services:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 