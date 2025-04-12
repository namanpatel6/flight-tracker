import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { processRules } from "@/lib/rule-processor";
import { sendNotificationEmail, createFlightAlertEmail } from "@/lib/notifications";

/**
 * API route for a complete flight notification test
 * This handles both setting up the flight/rule and simulating a status change
 */
export async function GET(request: NextRequest) {
  // Configuration for the test
  const config = {
    flightNumber: "AA777",
    departureAirport: "DFW", // Dallas/Fort Worth
    arrivalAirport: "LAS", // Las Vegas
    departureDate: new Date("2025-04-12T12:57:00-05:00"), // Local time in Dallas
    arrivalDate: new Date("2025-04-12T13:52:00-07:00"), // Local time in Las Vegas
    userEmail: "patelnaman06@gmail.com",
    alertType: "DEPARTURE",
    newStatus: "active", // Change from scheduled to active (in air)
  };

  // Mode parameter - setup, change, or complete (both)
  const mode = request.nextUrl.searchParams.get("mode") || "complete";

  try {
    // Verify API key for security
    const apiKey = request.headers.get("x-api-key");
    
    if (apiKey !== process.env.CRON_API_KEY) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Find the user by email
    const user = await db.user.findUnique({
      where: { email: config.userEmail }
    });
    
    if (!user) {
      return NextResponse.json(
        { error: `User with email ${config.userEmail} not found` },
        { status: 404 }
      );
    }
    
    const result: any = {
      success: true,
      message: `Flight notification test ${mode} completed`,
      details: {}
    };

    // STEP 1: Setup Flight and Rule (if mode is setup or complete)
    if (mode === "setup" || mode === "complete") {
      // Check if flight is already being tracked
      const existingFlight = await db.trackedFlight.findFirst({
        where: {
          userId: user.id,
          flightNumber: config.flightNumber,
          departureTime: {
            gte: new Date(new Date(config.departureDate).setHours(0, 0, 0, 0)),
            lt: new Date(new Date(config.departureDate).setHours(23, 59, 59, 999)),
          }
        }
      });
      
      let trackedFlight;
      
      // Create tracked flight if it doesn't exist
      if (!existingFlight) {
        trackedFlight = await db.trackedFlight.create({
          data: {
            flightNumber: config.flightNumber,
            userId: user.id,
            departureAirport: config.departureAirport,
            arrivalAirport: config.arrivalAirport,
            departureTime: config.departureDate,
            arrivalTime: config.arrivalDate,
            status: "scheduled",
          }
        });
      } else {
        trackedFlight = existingFlight;
      }
      
      // Check if a rule already exists
      const existingRule = await db.rule.findFirst({
        where: {
          userId: user.id,
          name: `${config.flightNumber} ${config.alertType} Alert`,
          conditions: {
            some: {
              trackedFlightId: trackedFlight.id
            }
          }
        },
        include: {
          alerts: true,
          conditions: true
        }
      });
      
      let rule;
      
      // Create rule if it doesn't exist
      if (!existingRule) {
        rule = await db.rule.create({
          data: {
            name: `${config.flightNumber} ${config.alertType} Alert`,
            description: `Alert for ${config.alertType.toLowerCase()} of flight ${config.flightNumber}`,
            operator: "OR", // Only one condition, so OR or AND doesn't matter
            isActive: true,
            userId: user.id,
            conditions: {
              create: [
                {
                  field: "STATUS",
                  operator: "EQUALS",
                  value: "active", // "active" status typically means the flight is in the air
                  trackedFlightId: trackedFlight.id
                }
              ]
            },
            alerts: {
              create: [
                {
                  type: config.alertType,
                  isActive: true,
                  userId: user.id,
                  trackedFlightId: trackedFlight.id
                }
              ]
            }
          },
          include: {
            alerts: true,
            conditions: true
          }
        });
      } else {
        rule = existingRule;
      }
      
      // Send a setup confirmation email
      const setupEmailData = createFlightAlertEmail({
        userName: user.name || "User",
        flightNumber: config.flightNumber,
        alertType: config.alertType,
        message: `This is a confirmation that you're tracking ${config.flightNumber} from ${config.departureAirport} to ${config.arrivalAirport} on ${config.departureDate.toLocaleDateString()}. You'll be notified when the flight ${config.alertType.toLowerCase() === 'departure' ? 'departs' : config.alertType.toLowerCase()}s.`
      });
      
      const setupEmailResult = await sendNotificationEmail({
        to: config.userEmail,
        subject: setupEmailData.subject,
        html: setupEmailData.html,
        text: setupEmailData.text
      });

      // Add setup details to result
      result.details.setup = {
        flight: {
          id: trackedFlight.id,
          flightNumber: config.flightNumber,
          departureAirport: config.departureAirport,
          arrivalAirport: config.arrivalAirport,
          departureDate: config.departureDate,
          status: trackedFlight.status,
          isNew: !existingFlight
        },
        rule: {
          id: rule.id,
          name: rule.name,
          alertType: config.alertType,
          isNew: !existingRule
        },
        email: {
          sent: setupEmailResult.success,
          to: config.userEmail,
          details: setupEmailResult.message
        }
      };

      // Store flight and rule IDs for status change step
      result.details.trackedFlightId = trackedFlight.id;
      result.details.ruleId = rule.id;
    }

    // STEP 2: Simulate Status Change (if mode is change or complete)
    if (mode === "change" || mode === "complete") {
      // Find the tracked flight (either from step 1 or look it up)
      let trackedFlightId = result.details.trackedFlightId;
      
      if (!trackedFlightId) {
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
            { error: `Tracked flight ${config.flightNumber} not found - run setup first` },
            { status: 404 }
          );
        }
        
        trackedFlightId = trackedFlight.id;
      }
      
      // Get the tracked flight
      const trackedFlight = await db.trackedFlight.findUnique({
        where: { id: trackedFlightId }
      });
      
      if (!trackedFlight) {
        return NextResponse.json(
          { error: `Tracked flight with ID ${trackedFlightId} not found` },
          { status: 404 }
        );
      }
      
      // Get current status to log the change
      const oldStatus = trackedFlight.status;
      
      // Update the flight status
      await db.trackedFlight.update({
        where: { id: trackedFlightId },
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
      
      // Add status change details to result
      result.details.statusChange = {
        flight: {
          id: trackedFlightId,
          flightNumber: config.flightNumber,
          statusChange: {
            from: oldStatus,
            to: config.newStatus
          }
        },
        processingResult: "Rule processor executed - check email for notifications"
      };
    }
    
    // Return the final result
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in flight notification test:", error);
    return NextResponse.json(
      { 
        error: "Failed to complete flight notification test", 
        details: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    );
  }
} 