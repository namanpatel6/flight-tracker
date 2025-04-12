/**
 * Test script for setting up a real flight tracking and notification test
 * This script creates a tracked flight and rule for AA777 on April 12, 2025
 * Run with: npx ts-node -r tsconfig-paths/register src/scripts/test-real-flight.ts
 */

import { db } from "../lib/db";
import dotenv from "dotenv";
import { sendNotificationEmail, createFlightAlertEmail } from "../lib/notifications";

// Load environment variables
dotenv.config({ path: '.env.local' });

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

// Main function to set up the test
async function setupRealFlightTest() {
  try {
    console.log(`🔍 Setting up real flight test for ${config.flightNumber}`);
    
    // Find the user by email
    const user = await db.user.findUnique({
      where: { email: config.userEmail }
    });
    
    if (!user) {
      console.error(`❌ User with email ${config.userEmail} not found`);
      return;
    }
    
    console.log(`✅ Found user: ${user.name || user.email}`);
    
    // Check if flight is already being tracked
    const existingFlight = await db.trackedFlight.findFirst({
      where: {
        userId: user.id,
        flightNumber: config.flightNumber,
        departureTime: {
          gte: new Date(config.departureDate.setHours(0, 0, 0, 0)),
          lt: new Date(config.departureDate.setHours(23, 59, 59, 999)),
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
      console.log(`✅ Created tracked flight: ${trackedFlight.id}`);
    } else {
      trackedFlight = existingFlight;
      console.log(`✅ Using existing tracked flight: ${trackedFlight.id}`);
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
      console.log(`✅ Created rule: ${rule.name} (${rule.id})`);
    } else {
      rule = existingRule;
      console.log(`✅ Using existing rule: ${rule.name} (${rule.id})`);
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
    
    if (emailResult.success) {
      console.log(`✅ Setup confirmation email sent to ${config.userEmail}`);
    } else {
      console.error(`❌ Failed to send setup confirmation email: ${emailResult.message}`);
    }
    
    console.log(`
🎉 Setup complete! Here's what we've configured:

Flight: ${config.flightNumber} (${config.departureAirport} ✈️ ${config.arrivalAirport})
Date: ${config.departureDate.toLocaleDateString()} at ${config.departureDate.toLocaleTimeString()}
Alert Type: ${config.alertType}
User: ${user.name || user.email}
Rule: ${rule.name}

The rule processor will check for flight status changes and send a notification email 
to ${config.userEmail} when the flight status indicates a ${config.alertType.toLowerCase()}.

You can manually trigger a test by calling:
curl http://localhost:3000/api/cron/process-rules -H "x-api-key: ${process.env.CRON_API_KEY || 'test'}"

Or in PowerShell:
Invoke-WebRequest -Uri "http://localhost:3000/api/cron/process-rules" -Headers @{"x-api-key"="${process.env.CRON_API_KEY || 'test'}"} | Select-Object -ExpandProperty Content
    `);
    
  } catch (error) {
    console.error("Error setting up real flight test:", error);
  } finally {
    // Close the Prisma client connection
    await db.$disconnect();
  }
}

// Run the setup function
setupRealFlightTest().catch(console.error); 