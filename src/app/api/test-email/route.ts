import { NextRequest, NextResponse } from "next/server";
import { createFlightAlertEmail, sendNotificationEmail } from "@/lib/notifications";

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

    // Get recipient email from query parameters or use the EMAIL_USER
    const recipientEmail = request.nextUrl.searchParams.get("email") || process.env.EMAIL_USER;
    
    if (!recipientEmail) {
      return NextResponse.json(
        { error: "No recipient email specified" },
        { status: 400 }
      );
    }

    // Get alert type from query parameters or default to GATE_CHANGE
    const alertType = request.nextUrl.searchParams.get("type") || "GATE_CHANGE";
    
    // Create test email data for flight AA1969
    const emailData = createFlightAlertEmail({
      userName: "Test User",
      flightNumber: "AA1969",
      alertType: alertType,
      message: getMessageForAlertType(alertType, "AA1969"),
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
          flight: "AA1969",
          alertType: alertType,
          emailSent: true
        }
      });
    } else {
      return NextResponse.json({
        success: false,
        message: `Failed to send test email: ${result.message}`,
        details: {
          flight: "AA1969",
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