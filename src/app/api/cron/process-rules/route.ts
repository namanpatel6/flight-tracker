import { NextRequest, NextResponse } from "next/server";
import { processRules } from "@/lib/rule-processor";
import { db } from "@/lib/db";
import { sendNotificationEmail, createFlightAlertEmail } from "@/lib/notifications";

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
    
    // Check if we should run in test mode
    const isTest = request.nextUrl.searchParams.get("test") === "true";

    // Check if we should run in production mode
    const environmentHeader = request.headers.get("X-Environment");
    const isProduction = 
      environmentHeader === "production" || 
      process.env.NODE_ENV === "production";
    
    console.log(`Running AeroAPI rule processing in ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'} mode${isTest ? ' (TEST MODE)' : ''}`);
    
    if (isTest) {
      // Create a test notification instead of processing real rules
      const testResult = await createTestNotification();
      return NextResponse.json({ 
        success: true, 
        message: "Test notification created and email sent",
        details: testResult
      });
    }
    
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

/**
 * Creates a test notification and sends a test email
 * This is for testing the notification system without processing real rules
 */
async function createTestNotification() {
  try {
    // Find the first user in the system
    const user = await db.user.findFirst();
    
    if (!user) {
      return { success: false, message: "No users found in the system" };
    }
    
    // Specify the test flight number
    const flightNumber = "AA1969";
    const alertType = "STATUS_CHANGE";
    
    // Create a test notification in the database
    const notification = await db.notification.create({
      data: {
        title: `Test Alert: ${flightNumber}`,
        message: `Test notification: ${flightNumber} status changed from Scheduled to In Air`,
        type: alertType,
        read: false,
        userId: user.id,
      },
    });
    
    // Only try to send email if user has email
    if (user.email) {
      // Create email content
      const emailData = createFlightAlertEmail({
        userName: user.name || 'Test User',
        flightNumber: flightNumber,
        alertType: alertType,
        message: `This is a test notification. Your flight ${flightNumber} status has changed from Scheduled to In Air.`,
      });
      
      // Send the email
      const emailResult = await sendNotificationEmail({
        to: user.email,
        subject: emailData.subject,
        html: emailData.html,
        text: emailData.text,
      });
      
      return {
        notificationId: notification.id,
        flightNumber: flightNumber,
        alertType: alertType,
        emailSent: emailResult.success,
        emailDetails: emailResult.message,
      };
    }
    
    return {
      notificationId: notification.id,
      flightNumber: flightNumber,
      alertType: alertType,
      emailSent: false,
      emailDetails: "User has no email address",
    };
  } catch (error) {
    console.error("Error creating test notification:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
} 