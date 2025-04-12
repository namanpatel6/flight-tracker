import { NextRequest, NextResponse } from "next/server";
import { createFlightAlertEmail, sendNotificationEmail } from "@/lib/notifications";
import { db } from "@/lib/db";
import { processRules } from "@/lib/rule-processor";

/**
 * API route for testing email notifications
 * This endpoint is for development and testing only
 */
export async function GET(request: NextRequest) {
  try {
    // Verify API key for security
    const apiKey = request.headers.get("x-api-key");
    
    if (apiKey !== process.env.CRON_API_KEY) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get test parameters from query
    const mode = request.nextUrl.searchParams.get("mode") || "simple";
    const flightNumber = request.nextUrl.searchParams.get("flight") || "AA1969";
    const alertType = request.nextUrl.searchParams.get("type") || "GATE_CHANGE";
    const recipientEmail = request.nextUrl.searchParams.get("email") || process.env.EMAIL_USER || "patelnaman06@gmail.com";
    
    // Test AA777 flight with full setup and rule processing
    if (mode === "aa777") {
      return await testAA777Flight(recipientEmail);
    }
    
    // Simple email test
    const emailData = createFlightAlertEmail({
      userName: "Test User",
      flightNumber: flightNumber,
      alertType: alertType,
      message: getMessageForAlertType(alertType, flightNumber),
    });

    // Send the test email
    const result = await sendNotificationEmail({
      to: recipientEmail,
      subject: emailData.subject,
      html: emailData.html,
      text: emailData.text,
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Test email sent successfully to ${recipientEmail}`,
        details: {
          flight: flightNumber,
          alertType: alertType,
          emailSent: true
        }
      });
    } else {
      return NextResponse.json({
        success: false,
        message: `Failed to send test email: ${result.message}`,
        details: {
          flight: flightNumber,
          alertType: alertType,
          emailSent: false,
          error: result.message
        }
      }, { status: 500 });
    }
  } catch (error) {
    console.error("Error sending test email:", error);
    return NextResponse.json(
      { 
        error: "Failed to send test email", 
        details: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    );
  }
}

/**
 * Generate a realistic message based on the alert type
 */
function getMessageForAlertType(alertType: string, flightNumber: string): string {
  switch(alertType) {
    case "STATUS_CHANGE":
      return `Flight ${flightNumber} status has changed from Scheduled to In Air`;
    case "DELAY":
      return `Flight ${flightNumber} has been delayed by 45 minutes. New departure time is 10:45 AM`;
    case "GATE_CHANGE":
      return `Flight ${flightNumber} gate has changed from B12 to C22`;
    case "DEPARTURE":
      return `Flight ${flightNumber} has departed at 10:05 AM`;
    case "ARRIVAL":
      return `Flight ${flightNumber} has arrived at 11:30 AM`;
    default:
      return `Alert for flight ${flightNumber}`;
  }
}

/**
 * Special test function for AA777 flight
 * This handles setup, status change, and email in one call
 */
async function testAA777Flight(email: string): Promise<NextResponse> {
  try {
    // Configuration for the AA777 test
    const config = {
      flightNumber: "AA777",
      departureAirport: "DFW", // Dallas/Fort Worth
      arrivalAirport: "LAS", // Las Vegas
      departureDate: new Date("2025-04-12T12:57:00-05:00"), // Local time in Dallas
      arrivalDate: new Date("2025-04-12T13:52:00-07:00"), // Local time in Las Vegas
      userEmail: email,
      alertType: "DEPARTURE",
      newStatus: "active", // Change from scheduled to active (in air)
    };
    
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
    
    // STEP 1: Create or update tracked flight
    let trackedFlight = await db.trackedFlight.findFirst({
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
      // Reset to scheduled status for testing
      trackedFlight = await db.trackedFlight.update({
        where: { id: trackedFlight.id },
        data: { 
          status: "scheduled",
          departureTime: config.departureDate,
        }
      });
    }
    
    // STEP 2: Create or update rule
    let rule = await db.rule.findFirst({
      where: {
        userId: user.id,
        name: `${config.flightNumber} ${config.alertType} Alert`
      },
      include: {
        alerts: true,
        conditions: true
      }
    });
    
    if (!rule) {
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
    }
    
    // STEP 3: Send a setup confirmation email
    const setupEmailData = createFlightAlertEmail({
      userName: user.name || "User",
      flightNumber: config.flightNumber,
      alertType: config.alertType,
      message: `This is a confirmation that you're tracking ${config.flightNumber} from ${config.departureAirport} to ${config.arrivalAirport} on ${config.departureDate.toLocaleDateString()}. You'll be notified when the flight ${config.alertType.toLowerCase() === 'departure' ? 'departs' : config.alertType.toLowerCase()}s.`
    });
    
    await sendNotificationEmail({
      to: config.userEmail,
      subject: setupEmailData.subject,
      html: setupEmailData.html,
      text: setupEmailData.text
    });
    
    // STEP 4: Update flight status to trigger notification
    await db.trackedFlight.update({
      where: { id: trackedFlight.id },
      data: {
        status: config.newStatus,
        departureTime: new Date() // Set to current time for "departure"
      }
    });
    
    // STEP 5: Process rules to send notification
    await processRules();
    
    // Return success
    return NextResponse.json({
      success: true,
      message: "AA777 test completed successfully",
      details: {
        setup: {
          flight: trackedFlight.id,
          rule: rule.id
        },
        emails: {
          confirmation: "Sent confirmation email",
          notification: "Sent departure notification"
        },
        nextSteps: "Check your email for both test messages"
      }
    });
  } catch (error) {
    console.error("Error in AA777 test:", error);
    return NextResponse.json(
      { error: "AA777 test failed", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}