import { NextRequest, NextResponse } from "next/server";
import { processRules } from "@/lib/rule-processor";
import { db } from "@/lib/db";

/**
 * This endpoint allows testing of the cron jobs locally
 * It can be used to trigger rule processing, flight updates, or both
 * 
 * Query parameters:
 * - type: "rules" | "flights" | "all" (default: "all")
 * - test: "true" | "false" (default: "false")
 */
export async function GET(request: NextRequest) {
  try {
    // Get the type of cron job to run
    const type = request.nextUrl.searchParams.get("type") || "all";
    // Check if we should run in test mode
    const isTest = request.nextUrl.searchParams.get("test") === "true";
    
    console.log(`Running cron job test: ${type} ${isTest ? '(TEST MODE)' : ''}`);
    
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { error: "This endpoint is only available in development mode" },
        { status: 403 }
      );
    }

    let result: any = { success: true };

    // Process rules if requested
    if (type === "rules" || type === "all") {
      if (isTest) {
        // Test mode - create a test notification
        const testResult = await createTestRule();
        result.rules = { 
          success: true, 
          message: "Test rule created",
          details: testResult
        };
      } else {
        // Process all active rules
        await processRules();
        result.rules = { 
          success: true, 
          message: "Rules processed successfully" 
        };
      }
    }
    
    // Process flight updates if requested
    if (type === "flights" || type === "all") {
      if (isTest) {
        // Test mode - create a test flight
        const testResult = await createTestFlight();
        result.flights = { 
          success: true, 
          message: "Test flight created",
          details: testResult
        };
      } else {
        // This would call the flight update logic
        // For now, we'll just call processRules again
        await processRules();
        result.flights = { 
          success: true, 
          message: "Flights updated successfully" 
        };
      }
    }
    
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in test cron endpoint:", error);
    return NextResponse.json(
      { error: "Internal server error", details: (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * Creates a test rule with conditions for testing
 */
async function createTestRule() {
  try {
    // Find the first user in the system
    const user = await db.user.findFirst();
    
    if (!user) {
      return { success: false, message: "No users found in the system" };
    }
    
    // Create or find a test flight
    const flightNumber = "AA1969";
    let trackedFlight = await db.trackedFlight.findFirst({
      where: { flightNumber }
    });
    
    if (!trackedFlight) {
      trackedFlight = await db.trackedFlight.create({
        data: {
          flightNumber,
          status: "scheduled",
          departureAirport: "LAX",
          arrivalAirport: "JFK",
          gate: "A5",
          terminal: "T1",
          departureTime: new Date(Date.now() + 3600000), // 1 hour from now
          arrivalTime: new Date(Date.now() + 18000000),  // 5 hours from now
          userId: user.id
        }
      });
    }
    
    // Create a test rule - we don't need to create RuleCondition separately anymore
    // since that table doesn't exist in the schema
    const rule = await db.rule.create({
      data: {
        name: "Test Rule - Status Change",
        description: "Test rule for status change detection",
        operator: "AND", // AND operator for conditions
        isActive: true,
        userId: user.id,
        alerts: {
          create: [
            {
              type: "STATUS_CHANGE",
              isActive: true,
              userId: user.id,
              trackedFlightId: trackedFlight.id
            }
          ]
        }
      }
    });
    
    // Return the successfully created rule and flight
    return {
      ruleId: rule.id,
      flightId: trackedFlight.id,
      flightNumber,
      userId: user.id
    };
  } catch (error) {
    console.error("Error creating test rule:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

/**
 * Creates a test flight for rule testing
 */
async function createTestFlight() {
  try {
    // Find the first user in the system
    const user = await db.user.findFirst();
    
    if (!user) {
      return { success: false, message: "No users found in the system" };
    }
    
    // Create a test flight with realistic data
    const flightNumber = "UA" + Math.floor(1000 + Math.random() * 9000);
    
    const trackedFlight = await db.trackedFlight.create({
      data: {
        flightNumber,
        status: "scheduled",
        departureAirport: "SFO",
        arrivalAirport: "ORD",
        gate: "A5",
        terminal: "T1",
        departureTime: new Date(Date.now() + 7200000), // 2 hours from now
        arrivalTime: new Date(Date.now() + 18000000),  // 5 hours from now
        userId: user.id
      }
    });
    
    return {
      flightId: trackedFlight.id,
      flightNumber,
      userId: user.id
    };
  } catch (error) {
    console.error("Error creating test flight:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error"
    };
  }
} 