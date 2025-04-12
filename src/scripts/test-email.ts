/**
 * Email notification test script
 * 
 * This script tests the email notification service by sending a test email
 * Run with: npx ts-node -r tsconfig-paths/register src/scripts/test-email.ts
 */

import { createFlightAlertEmail, sendNotificationEmail } from "../lib/notifications";
import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: '.env.local' });

// Main test function
async function testEmailNotifications() {
  console.log("🔍 Testing email notification service...");
  console.log(`📧 Using email configuration:
  - HOST: ${process.env.EMAIL_HOST}
  - PORT: ${process.env.EMAIL_PORT}
  - USER: ${process.env.EMAIL_USER ? "✓ Set" : "❌ Not set"}
  - PASSWORD: ${process.env.EMAIL_PASSWORD ? "✓ Set" : "❌ Not set"}
  - FROM: ${process.env.EMAIL_FROM}
  `);

  // Create test email data
  const emailData = createFlightAlertEmail({
    userName: "Test User",
    flightNumber: "TEST123",
    alertType: "GATE_CHANGE",
    message: "This is a test email for the Flight Tracker application. Your flight TEST123 gate has changed from A1 to B2.",
  });

  // Test email recipient - change this to a real email for testing
  const testEmail = process.env.EMAIL_USER || "test@example.com";

  console.log(`📤 Sending test email to: ${testEmail}`);
  console.log(`📑 Email subject: ${emailData.subject}`);

  try {
    // Send the test email
    const result = await sendNotificationEmail({
      to: testEmail,
      subject: emailData.subject,
      html: emailData.html,
      text: emailData.text,
    });

    if (result.success) {
      console.log(`✅ Test email sent successfully!`);
    } else {
      console.error(`❌ Failed to send test email: ${result.message}`);
    }
  } catch (error) {
    console.error("❌ Error sending test email:", error);
  }
}

// Run the test
testEmailNotifications().catch(error => {
  console.error("Unhandled error:", error);
  process.exit(1);
}); 