import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { processRules } from "@/lib/rule-processor";

/**
 * API route for simulating a flight status change
 * This is for testing the flight notification system
 */
export async function GET(request: NextRequest) {
  // Configuration for the test
  const config = {
    flightNumber: "AA777",
    departureDate: new Date("2025-04-12"),
    newStatus: "active", // Change from scheduled to active (in air)
    userEmail: "patelnaman06@gmail.com",
  };

  try {
    // Verify API key for security
    const apiKey = request.headers.get("x-api-key");
    
    if (apiKey !== process.env.CRON_API_KEY) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Find the user
    const user = await db.user.findUnique({
      where: { email: config.userEmail }
    });
    
    if (!user) {
      return NextResponse.json(
        { error: `User with email ${config.userEmail} not found` },
        { status: 404 }
      );
    }
    
    // Find the tracked flight
    const trackedFlight = await db.trackedFlight.findFirst({
      where: {
        userId: user.id,
        flightNumber: config.flightNumber,
        departureTime: {
          gte: new Date(new Date(config.departureDate).setHours(0, 0, 0, 0)),
          lt: new Date(new Date(config.departureDate).setHours(23, 59, 59, 999)),
        }
      }
    });
    
    if (!trackedFlight) {
      return NextResponse.json(
        { error: `Tracked flight ${config.flightNumber} for date ${config.departureDate.toLocaleDateString()} not found` },
        { status: 404 }
      );
    }
    
    // Get current status to log the change
    const oldStatus = trackedFlight.status;
    
    // Update the flight status
    await db.trackedFlight.update({
      where: { id: trackedFlight.id },
      data: {
        status: config.newStatus,
        // If status is "active", also update the departure time to now
        ...(config.newStatus === "active" && { 
          departureTime: new Date() 
        })
      }
    });
    
    // Now process rules to trigger notification
    await processRules();
    
    // Return success response with details
    return NextResponse.json({
      success: true,
      message: "Flight status updated and rules processed",
      details: {
        flight: {
          id: trackedFlight.id,
          flightNumber: config.flightNumber,
          statusChange: {
            from: oldStatus,
            to: config.newStatus
          },
          departureDate: config.departureDate
        },
        processingResult: "Rule processor executed - check email for notifications"
      }
    });
  } catch (error) {
    console.error("Error simulating flight status change:", error);
    return NextResponse.json(
      { 
        error: "Failed to simulate flight status change", 
        details: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    );
  }
} 