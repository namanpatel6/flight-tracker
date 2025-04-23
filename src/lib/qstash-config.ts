import { Client } from "@upstash/qstash";

// Polling interval groups (in minutes)
export enum PollingInterval {
  ACTIVE = 15,         // Every 15 minutes for active flights
  UPCOMING = 30,       // Every 30 minutes for upcoming flights
  DISTANT = 120,       // Every 2 hours for flights >12 hours away
  VERY_DISTANT = 720,  // Every 12 hours for flights >24 hours away
}

// Initialize QStash client
const qstashClient = new Client({
  token: process.env.QSTASH_TOKEN || "",
});

// Base URL for your application
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://your-vercel-app-url.vercel.app";

/**
 * Schedules rule processing through QStash for different polling intervals
 * This should be called during deployment or from an admin endpoint
 */
export async function scheduleRuleProcessing() {
  try {
    // Clear any existing schedules first
    await clearExistingSchedules();
    
    // Setup schedules for different intervals
    await Promise.all([
      // Active flights - every 15 minutes
      setupScheduleForInterval(PollingInterval.ACTIVE),
      
      // Upcoming flights - every 30 minutes
      setupScheduleForInterval(PollingInterval.UPCOMING),
      
      // Distant flights - every 2 hours
      setupScheduleForInterval(PollingInterval.DISTANT),
      
      // Very distant flights - every 12 hours
      setupScheduleForInterval(PollingInterval.VERY_DISTANT),
    ]);
    
    console.log("Successfully scheduled all rule processing intervals");
    return true;
  } catch (error) {
    console.error("Error scheduling rule processing:", error);
    return false;
  }
}

/**
 * Clears all existing QStash schedules
 */
async function clearExistingSchedules() {
  try {
    // List all schedules
    const schedules = await qstashClient.schedules.list();
    
    // Delete each schedule
    for (const schedule of schedules) {
      await qstashClient.schedules.delete(schedule.scheduleId);
      console.log(`Deleted schedule ${schedule.scheduleId}`);
    }
    
    console.log(`Cleared ${schedules.length} existing schedules`);
  } catch (error) {
    console.error("Error clearing schedules:", error);
    throw error;
  }
}

/**
 * Sets up a schedule for a specific polling interval
 */
async function setupScheduleForInterval(interval: PollingInterval) {
  try {
    // Define the webhook URL for our API endpoint
    const webhookUrl = `${BASE_URL}/api/qstash/process-rules?interval=${interval}`;
    
    // Convert minutes to cron expression
    // For 15 minutes: "*/15 * * * *"
    // For 30 minutes: "*/30 * * * *"
    // For 2 hours: "0 */2 * * *"
    // For 12 hours: "0 */12 * * *"
    let cronExpression: string;
    
    if (interval < 60) {
      // For intervals less than 1 hour, use minutes
      cronExpression = `*/${interval} * * * *`;
    } else {
      // For intervals >= 1 hour, convert to hours
      const hours = interval / 60;
      cronExpression = `0 */${hours} * * *`;
    }
    
    // Create the schedule
    const result = await qstashClient.schedules.create({
      destination: webhookUrl,
      cron: cronExpression,
    });
    
    console.log(`Created schedule for ${interval} minute interval with ID: ${result.scheduleId}`);
    return result.scheduleId;
  } catch (error) {
    console.error(`Error setting up schedule for ${interval} minute interval:`, error);
    throw error;
  }
}

/**
 * Checks if QStash is properly configured with all required schedules
 */
export async function checkQStashSchedules() {
  try {
    const schedules = await qstashClient.schedules.list();
    
    // Check if we have at least our 4 expected schedules
    const hasAllSchedules = schedules.length >= 4;
    
    return {
      isConfigured: hasAllSchedules,
      scheduleCount: schedules.length,
      schedules: schedules,
    };
  } catch (error) {
    console.error("Error checking QStash schedules:", error);
    return {
      isConfigured: false,
      error: (error as Error).message,
    };
  }
} 