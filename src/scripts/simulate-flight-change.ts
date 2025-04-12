/**
 * Script to simulate a flight status change to trigger notifications
 * This simulates AA777 changing from scheduled to active (in air)
 * Run with: npx ts-node -r tsconfig-paths/register src/scripts/simulate-flight-change.ts
 */

import { db } from "../lib/db";
import dotenv from "dotenv";
import { processRules } from "../lib/rule-processor";

// Load environment variables
dotenv.config({ path: '.env.local' });

// Configuration for the test
const config = {
  flightNumber: "AA777",
  departureDate: new Date("2025-04-12"),
  newStatus: "active", // Change from scheduled to active (in air)
  userEmail: "patelnaman06@gmail.com",
};

/**
 * Function to simulate a change in flight status
 * This updates the tracked flight status and then triggers rule processing
 */
async function simulateFlightStatusChange() {
  try {
    console.log(`🔄 Simulating status change for flight ${config.flightNumber} to "${config.newStatus}"`);
    
    // Find the user
    const user = await db.user.findUnique({
      where: { email: config.userEmail }
    });
    
    if (!user) {
      console.error(`❌ User with email ${config.userEmail} not found`);
      return;
    }
    
    // Find the tracked flight
    const trackedFlight = await db.trackedFlight.findFirst({
      where: {
        userId: user.id,
        flightNumber: config.flightNumber,
        departureTime: {
          gte: new Date(config.departureDate.setHours(0, 0, 0, 0)),
          lt: new Date(config.departureDate.setHours(23, 59, 59, 999)),
        }
      }
    });
    
    if (!trackedFlight) {
      console.error(`❌ Tracked flight ${config.flightNumber} for date ${config.departureDate.toLocaleDateString()} not found`);
      return;
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
    
    console.log(`✅ Updated flight ${config.flightNumber} status from "${oldStatus}" to "${config.newStatus}"`);
    
    // Now process rules to trigger notification
    console.log("🔍 Processing rules to trigger notifications...");
    
    // Call the rule processor directly
    await processRules();
    
    console.log(`
🎉 Simulation complete!

Flight: ${config.flightNumber}
Status changed: ${oldStatus} ➡️ ${config.newStatus}
Date: ${config.departureDate.toLocaleDateString()}

The rule processor has been executed, which should have:
1. Detected the status change for ${config.flightNumber}
2. Evaluated any rules with conditions matching this flight
3. Triggered alerts based on the flight status change
4. Sent email notifications to ${config.userEmail}

Check your email at ${config.userEmail} for a notification.
    `);
    
  } catch (error) {
    console.error("Error simulating flight status change:", error);
  } finally {
    // Close the Prisma client connection
    await db.$disconnect();
  }
}

// Run the simulation
simulateFlightStatusChange().catch(console.error); 