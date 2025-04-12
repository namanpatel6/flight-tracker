import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendNotificationEmail, createFlightAlertEmail } from "@/lib/notifications";

/**
 * API route for setting up a test flight and rule
 * This is for testing the flight notification system with a real flight
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
    
    // Send a test email to confirm setup
    const emailData = createFlightAlertEmail({
      userName: user.name || "User",
      flightNumber: config.flightNumber,
      alertType: config.alertType,
      message: `This is a confirmation that you're tracking ${config.flightNumber} from ${config.departureAirport} to ${config.arrivalAirport} on ${config.departureDate.toLocaleDateString()}. You'll be notified when the flight ${config.alertType.toLowerCase() === 'departure' ? 'departs' : config.alertType.toLowerCase()}s.`
    });
    
    const emailResult = await sendNotificationEmail({
      to: config.userEmail,
      subject: emailData.subject,
      html: emailData.html,
      text: emailData.text
    });

    // Return success response with details
    return NextResponse.json({
      success: true,
      message: "Flight and rule setup complete",
      details: {
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
          sent: emailResult.success,
          to: config.userEmail,
          details: emailResult.message
        }
      }
    });
  } catch (error) {
    console.error("Error setting up test flight:", error);
    return NextResponse.json(
      { 
        error: "Failed to set up test flight", 
        details: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    );
  }
} 