import { db } from "@/lib/db";
import { batchFetchFlights, getOptimalPollingInterval } from "./aero-api";
import { evaluateCondition, ConditionField, ConditionOperator, RuleCondition as TypedRuleCondition } from "./rules";
import { Flight } from "@/types/flight";
import { Rule, Alert } from "@prisma/client";
import { sendNotificationEmail, createFlightAlertEmail } from './notifications';

// Track last poll times for rules to implement adaptive polling
const ruleLastPollTimes: Record<string, number> = {};
const ruleNextPollTimes: Record<string, number> = {};

// Track last poll times for flights in rules
const flightLastPollTimes: Record<string, number> = {};
const flightNextPollTimes: Record<string, number> = {};

/**
 * Processes all active rules and generates alerts when conditions are met
 * Uses cost-effective polling strategy
 */
export async function processRules(): Promise<void> {
  const now = Date.now();
  
  // Get all active rules with their alerts (conditions have been removed)
  const activeRules = await db.rule.findMany({
    where: {
      isActive: true,
    },
    include: {
      alerts: {
        include: {
          trackedFlight: true,
          flight: true,
          user: true,
        },
      },
      user: true,
    },
  });

  // Filter rules based on adaptive polling schedule
  const rulesToProcess = activeRules.filter(rule => {
    // Skip if we polled this rule too recently
    if (ruleLastPollTimes[rule.id]) {
      const nextPollTime = ruleNextPollTimes[rule.id] || 0;
      if (now < nextPollTime) {
        return false;
      }
    }
    return true;
  });

  console.log(`Processing ${rulesToProcess.length} out of ${activeRules.length} active rules (adaptive polling)`);

  // Process each rule
  for (const rule of rulesToProcess) {
    try {
      console.log(`Processing rule: ${rule.name}`);
      
      // Update rule poll time
      ruleLastPollTimes[rule.id] = now;
      
      // Set default next poll time (will be adjusted based on flights later)
      ruleNextPollTimes[rule.id] = now + (30 * 60 * 1000); // 30 minutes default
      
      // Get unique tracked flight IDs from alerts instead of conditions
      const trackedFlightIds = [...new Set(
        rule.alerts
          .filter(a => a.trackedFlightId)
          .map(a => a.trackedFlightId as string)
      )];
      
      // Skip if no flights to process
      if (trackedFlightIds.length === 0) {
        console.log(`Rule ${rule.name} has no flight alerts, skipping`);
        continue;
      }
      
      console.log(`Rule ${rule.name} references ${trackedFlightIds.length} flights`);
      
      // Get all tracked flights at once to avoid multiple DB queries
      const trackedFlights = await db.trackedFlight.findMany({
        where: {
          id: {
            in: trackedFlightIds
          }
        }
      });
      
      // Create map for easy lookup
      const trackedFlightMap = new Map(
        trackedFlights.map(flight => [flight.id, flight])
      );
      
      // Filter flights that need to be polled now based on their individual schedules
      const flightsToFetch = trackedFlights.filter(flight => {
        if (flightLastPollTimes[flight.id]) {
          const nextPollTime = flightNextPollTimes[flight.id] || 0;
          if (now < nextPollTime) {
            return false;
          }
        }
        return true;
      });
      
      // Skip processing this rule if no flights need polling
      if (flightsToFetch.length === 0) {
        console.log(`No flights in rule ${rule.name} need updating at this time, skipping`);
        continue;
      }
      
      // Collect flight numbers for batch processing
      const flightNumbers = flightsToFetch.map(flight => flight.flightNumber);
      
      // Fetch flight data in batch to reduce API calls
      const flightDataMap = await batchFetchFlights(flightNumbers);
      
      // Store flight data for rule evaluation
      const ruleFlightData: Record<string, any> = {};
      
      // Process fetched flights and determine the earliest next poll time
      let earliestNextPoll = now + (24 * 60 * 60 * 1000); // Default to 24 hours
      
      // Update each flight and prepare data for rule evaluation
      for (const flight of flightsToFetch) {
        // Mark flight as polled
        flightLastPollTimes[flight.id] = now;
        
        const latestFlightInfo = flightDataMap[flight.flightNumber];
        
        if (!latestFlightInfo) {
          console.log(`No flight information found for ${flight.flightNumber}`);
          
          // For not found flights, check again in 1 hour
          flightNextPollTimes[flight.id] = now + (60 * 60 * 1000);
          
          // Use existing data for rule evaluation
          ruleFlightData[flight.id] = { ...flight, changes: [] };
          
          continue;
        }
        
        // Check for changes
        const changes = detectChanges(flight, latestFlightInfo);
        
        // Update the flight in the database if there are changes
        if (changes.length > 0) {
          await updateFlightData(flight.id, latestFlightInfo);
        }
        
        // Store the flight data for rule evaluation
        ruleFlightData[flight.id] = {
          ...flight,
          status: latestFlightInfo.flight_status || flight.status,
          departureTime: latestFlightInfo.departure.scheduled || flight.departureTime,
          arrivalTime: latestFlightInfo.arrival.scheduled || flight.arrivalTime,
          gate: latestFlightInfo.departure.gate || flight.gate,
          terminal: latestFlightInfo.departure.terminal || flight.terminal,
          changes,
        };
        
        // Determine optimal polling interval for this flight
        const nextPollIntervalMs = getOptimalPollingInterval(latestFlightInfo) * 1000;
        
        // If changes were detected, poll more frequently
        const adjustedInterval = changes.length > 0 
          ? Math.min(nextPollIntervalMs, 15 * 60 * 1000) // Max 15 minutes if changes detected 
          : nextPollIntervalMs;
        
        flightNextPollTimes[flight.id] = now + adjustedInterval;
        
        // Update earliest next poll time for the entire rule
        earliestNextPoll = Math.min(earliestNextPoll, now + adjustedInterval);
      }
      
      // For flights that weren't fetched, still include their existing data
      for (const flightId of trackedFlightIds) {
        if (!ruleFlightData[flightId] && trackedFlightMap.has(flightId)) {
          const flight = trackedFlightMap.get(flightId);
          ruleFlightData[flightId] = { ...flight, changes: [] };
        }
      }
      
      // Schedule next rule check based on the earliest flight poll time
      ruleNextPollTimes[rule.id] = earliestNextPoll;
      
      // Since we don't have conditions anymore, we'll consider the rule satisfied
      // if there are any changes to any of the flights associated with the rule's alerts
      const anyChanges = Object.values(ruleFlightData).some(
        flightData => flightData.changes && flightData.changes.length > 0
      );
      
      if (anyChanges) {
        console.log(`Changes detected for rule ${rule.name}, processing alerts`);
        
        // Process alerts for this rule
        for (const alert of rule.alerts) {
          // Skip inactive alerts
          if (!alert.isActive) continue;
          
          const flightId = alert.trackedFlightId || alert.flightId;
          if (!flightId || !alert.user) continue;
          
          const flightWithChanges = ruleFlightData[flightId];
          if (!flightWithChanges) continue;
          
          // Skip if there are no changes relevant to this alert
          const relevantChanges = flightWithChanges.changes.filter(
            (change: { type: string }) => change.type === alert.type
          );
          
          if (relevantChanges.length === 0) continue;
          
          // For threshold alerts, check if threshold is exceeded
          if (alert.type === "DELAY" && alert.threshold) {
            const delayChange = relevantChanges.find(
              (change: { delayMinutes: number }) => change.delayMinutes >= alert.threshold!
            );
            if (!delayChange) continue;
          }
          
          // Generate notification message
          const notificationMessage = generateRuleNotificationMessage(rule, alert, flightWithChanges);
          
          try {
            // Create notification in database
            await db.notification.create({
              data: {
                title: `Rule Alert: ${rule.name}`,
                message: notificationMessage,
                type: alert.type,
                read: false,
                userId: alert.userId,
                flightId: flightId,
                ruleId: rule.id,
              },
            });
            
            console.log(`Notification created for user ${alert.userId} for rule ${rule.name}`);
            
            // Send email notification if user has email
            if (alert.user.email) {
              // Create email content
              const emailData = createFlightAlertEmail({
                userName: alert.user.name || '',
                flightNumber: flightWithChanges.flightNumber,
                alertType: alert.type,
                message: notificationMessage,
              });
              
              // Send the email
              await sendNotificationEmail({
                to: alert.user.email,
                subject: emailData.subject,
                html: emailData.html,
                text: emailData.text,
              });
              
              console.log(`Email notification sent to ${alert.user.email}`);
            }
          } catch (error) {
            console.error(`Error creating notification for rule ${rule.name}:`, error);
          }
        }
      }
    } catch (error) {
      console.error(`Error processing rule ${rule.name}:`, error);
    }
  }
}

/**
 * Generates notification message for rule alert
 */
function generateRuleNotificationMessage(rule: Rule, alert: Alert, flight: any): string {
  let message = "";
  
  switch (alert.type) {
    case "STATUS_CHANGE":
      message = `Flight ${flight.flightNumber} status has changed to ${flight.status}.`;
      break;
    case "DELAY":
      const delayChange = flight.changes.find((c: any) => c.type === "DELAY");
      if (delayChange) {
        message = `Flight ${flight.flightNumber} has been delayed by ${delayChange.delayMinutes} minutes.`;
      } else {
        message = `Flight ${flight.flightNumber} has experienced a delay.`;
      }
      break;
    case "GATE_CHANGE":
      message = `Flight ${flight.flightNumber} gate has changed to ${flight.gate}.`;
      break;
    case "TERMINAL_CHANGE":
      message = `Flight ${flight.flightNumber} terminal has changed to ${flight.terminal}.`;
      break;
    default:
      message = `Alert for flight ${flight.flightNumber}: ${alert.type}`;
  }
  
  return message;
}

/**
 * Updates flight data in the database
 */
async function updateFlightData(flightId: string, flightInfo: Flight): Promise<void> {
  await db.trackedFlight.update({
    where: { id: flightId },
    data: {
      status: flightInfo.flight_status,
      departureTime: flightInfo.departure.scheduled ? new Date(flightInfo.departure.scheduled) : undefined,
      arrivalTime: flightInfo.arrival.scheduled ? new Date(flightInfo.arrival.scheduled) : undefined,
      gate: flightInfo.departure.gate || undefined,
      terminal: flightInfo.departure.terminal || undefined,
    },
  });
}

/**
 * Detects changes between the tracked flight and latest flight info
 */
function detectChanges(trackedFlight: any, latestFlightInfo: Flight): any[] {
  const changes = [];
  
  // Check for status change
  if (trackedFlight.status !== latestFlightInfo.flight_status) {
    changes.push({
      type: "STATUS_CHANGE",
      previous: trackedFlight.status,
      current: latestFlightInfo.flight_status,
    });
  }
  
  // Check for gate change
  if (
    latestFlightInfo.departure.gate && 
    trackedFlight.gate !== latestFlightInfo.departure.gate
  ) {
    changes.push({
      type: "GATE_CHANGE",
      previous: trackedFlight.gate,
      current: latestFlightInfo.departure.gate,
    });
  }
  
  // Check for terminal change
  if (
    latestFlightInfo.departure.terminal && 
    trackedFlight.terminal !== latestFlightInfo.departure.terminal
  ) {
    changes.push({
      type: "TERMINAL_CHANGE",
      previous: trackedFlight.terminal,
      current: latestFlightInfo.departure.terminal,
    });
  }
  
  // Check for departure time change
  if (latestFlightInfo.departure.scheduled && trackedFlight.departureTime) {
    const currentTime = new Date(trackedFlight.departureTime).getTime();
    const newDepartureTime = new Date(latestFlightInfo.departure.scheduled).getTime();
    
    // Calculate difference in minutes
    const diffMinutes = Math.round((newDepartureTime - currentTime) / (60 * 1000));
    
    // If difference is more than 10 minutes, consider it a delay
    if (Math.abs(diffMinutes) > 10) {
      changes.push({
        type: "DELAY",
        delayMinutes: diffMinutes,
        previous: new Date(currentTime).toISOString(),
        current: new Date(newDepartureTime).toISOString(),
      });
    }
  }
  
  return changes;
}

/**
 * Cleans up tracking maps to prevent memory leaks
 */
function cleanupTrackingMaps(): void {
  const now = Date.now();
  const ONE_DAY = 24 * 60 * 60 * 1000;
  
  // Clean up rule tracking maps
  for (const ruleId in ruleLastPollTimes) {
    if (now - ruleLastPollTimes[ruleId] > ONE_DAY) {
      delete ruleLastPollTimes[ruleId];
      delete ruleNextPollTimes[ruleId];
    }
  }
  
  // Clean up flight tracking maps
  for (const flightId in flightLastPollTimes) {
    if (now - flightLastPollTimes[flightId] > ONE_DAY) {
      delete flightLastPollTimes[flightId];
      delete flightNextPollTimes[flightId];
    }
  }
} 