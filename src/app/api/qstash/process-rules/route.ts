import { NextRequest, NextResponse } from "next/server";
import { processRules } from "@/lib/rule-processor";
import { Receiver } from "@upstash/qstash";

// This route is meant to be called by Upstash QStash
// It processes rules using the existing rule processor

// Initialize the QStash receiver with your signing key from environment variables
const receiver = new Receiver({
  currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY || "",
  nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY || "",
});

export async function POST(request: NextRequest) {
  try {
    // Get the request body and headers for verification
    const body = await request.text();
    const signature = request.headers.get("upstash-signature") || "";
    
    // Verify the request is from QStash
    // Skip verification in development mode for easier testing
    if (process.env.NODE_ENV !== "development") {
      try {
        const isValid = await receiver.verify({
          body,
          signature,
        });
        
        if (!isValid) {
          console.error("Invalid QStash signature");
          return NextResponse.json(
            { error: "Unauthorized" },
            { status: 401 }
          );
        }
      } catch (error) {
        console.error("Error verifying QStash signature:", error);
        return NextResponse.json(
          { error: "Signature verification failed" },
          { status: 401 }
        );
      }
    }
    
    // Check if this is a test request
    const url = new URL(request.url);
    const isTest = url.searchParams.get("test") === "true";
    
    console.log(`Running rule processing via QStash${isTest ? ' (TEST MODE)' : ''}`);
    
    // Process all active rules using our cost-efficient integration
    await processRules();
    
    return NextResponse.json({ 
      success: true, 
      message: "Rules processed successfully via QStash" 
    });
  } catch (error) {
    console.error("Error in QStash rule processing:", error);
    return NextResponse.json(
      { error: "Internal server error", details: (error as Error).message },
      { status: 500 }
    );
  }
}

// Also export a GET endpoint for testing locally
export async function GET(request: NextRequest) {
  // Only allow in development environment
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      { error: "This endpoint is only available in development mode" },
      { status: 403 }
    );
  }
  
  // For local testing, just call the processRules directly
  try {
    console.log("Running rule processing locally (test mode)");
    await processRules();
    return NextResponse.json({
      success: true,
      message: "Rules processed successfully in test mode"
    });
  } catch (error) {
    console.error("Error in test rule processing:", error);
    return NextResponse.json(
      { error: "Internal server error", details: (error as Error).message },
      { status: 500 }
    );
  }
} 