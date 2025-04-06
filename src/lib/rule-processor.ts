import { db } from "@/lib/db";
import { batchFetchFlights, getOptimalPollingInterval } from "./aero-api";
import { evaluateCondition, ConditionField, ConditionOperator, RuleCondition as TypedRuleCondition } from "./rules";
import { Flight } from "@/types/flight";
import { Rule, Alert, RuleCondition } from "@prisma/client";

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
  
  // Get all active rules with their conditions and alerts
  const activeRules = await db.rule.findMany({
    where: {
      isActive: true,
    },
    include: {
      conditions: true,
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
      
      // Get unique tracked flight IDs referenced in the rule conditions
      const trackedFlightIds = [...new Set(
        rule.conditions
          .filter(c => c.trackedFlightId)
          .map(c => c.trackedFlightId as string)
      )];
      
      // Skip if no flights to process
      if (trackedFlightIds.length === 0) {
        console.log(`Rule ${rule.name} has no flight conditions, skipping`);
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
      
      // Evaluate the rule
      const ruleResult = evaluateRuleWithData(rule, ruleFlightData);
      
      if (ruleResult.satisfied) {
        console.log(`Rule ${rule.name} satisfied, processing alerts`);
        
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
          } catch (error) {
            console.error('Error processing rule notification:', error);
          }
        }
      } else {
        console.log(`Rule ${rule.name} not satisfied`);
      }
    } catch (error) {
      console.error(`Error processing rule ${rule.id}:`, error);
      
      // On error, retry in 1 hour
      ruleNextPollTimes[rule.id] = now + (60 * 60 * 1000);
    }
  }
  
  // Cleanup old entries in the tracking maps
  cleanupTrackingMaps();
}

/**
 * Evaluates a rule with flight data
 */
function evaluateRuleWithData(
  rule: Rule & { conditions: RuleCondition[] }, 
  flightData: Record<string, any>
): { satisfied: boolean; matchedConditions: string[] } {
  if (!rule.conditions || rule.conditions.length === 0) {
    return { satisfied: false, matchedConditions: [] };
  }
  
  const matchedConditions: string[] = [];
  
  // Evaluate each condition
  const conditionResults = rule.conditions.map(condition => {
    const flightId = condition.trackedFlightId || condition.flightId;
    if (!flightId || !flightData[flightId]) {
      return false;
    }
    
    const flight = flightData[flightId];
    
    // Convert from Prisma model to TypeScript interface type
    const typedCondition: TypedRuleCondition = {
      id: condition.id,
      field: condition.field as ConditionField,
      operator: condition.operator as ConditionOperator,
      value: condition.value,
      ruleId: condition.ruleId,
      // Convert null to undefined for optional fields
      flightId: condition.flightId || undefined,
      trackedFlightId: condition.trackedFlightId || undefined
    };
    
    const result = evaluateCondition(typedCondition, flight);
    
    if (result) {
      matchedConditions.push(condition.id);
    }
    
    return result;
  });
  
  // Combine results based on the rule operator
  let satisfied = false;
  if (rule.operator === "AND") {
    satisfied = conditionResults.every(result => result);
  } else {
    satisfied = conditionResults.some(result => result);
  }
  
  return { satisfied, matchedConditions };
}

/**
 * Generates a notification message for a rule-based alert
 */
function generateRuleNotificationMessage(rule: Rule, alert: Alert, flight: any): string {
  const flightNumber = flight.flightNumber;
  const changes = flight.changes || [];
  
  // Find changes matching the alert type
  const relevantChanges = changes.filter((change: { type: string }) => change.type === alert.type);
  
  if (relevantChanges.length > 0) {
    const change = relevantChanges[0];
    
    switch (alert.type) {
      case "STATUS_CHANGE":
        return `Rule "${rule.name}": Flight ${flightNumber} status changed from ${change.oldValue || 'unknown'} to ${change.newValue}`;
      case "DELAY":
        return `Rule "${rule.name}": Flight ${flightNumber} has been delayed by ${change.delayMinutes} minutes`;
      case "GATE_CHANGE":
        return `Rule "${rule.name}": Flight ${flightNumber} gate changed from ${change.oldValue || 'unknown'} to ${change.newValue}`;
      case "DEPARTURE":
        return `Rule "${rule.name}": Flight ${flightNumber} has departed at ${new Date(change.departureTime).toLocaleTimeString()}`;
      case "ARRIVAL":
        return `Rule "${rule.name}": Flight ${flightNumber} has arrived at ${new Date(change.arrivalTime).toLocaleTimeString()}`;
      default:
        return `Rule "${rule.name}": Alert triggered for flight ${flightNumber}`;
    }
  }
  
  return `Rule "${rule.name}" triggered for flight ${flightNumber}`;
}

/**
 * Updates flight data in the database
 */
async function updateFlightData(flightId: string, flightInfo: Flight): Promise<void> {
  await db.trackedFlight.update({
    where: {
      id: flightId,
    },
    data: {
      status: flightInfo.flight_status || undefined,
      departureTime: flightInfo.departure.scheduled ? new Date(flightInfo.departure.scheduled) : undefined,
      arrivalTime: flightInfo.arrival.scheduled ? new Date(flightInfo.arrival.scheduled) : undefined,
      ...(flightInfo.departure.gate && { gate: flightInfo.departure.gate }),
      ...(flightInfo.departure.terminal && { terminal: flightInfo.departure.terminal }),
    },
  });
}

/**
 * Detects changes in flight information
 */
function detectChanges(trackedFlight: any, latestFlightInfo: Flight): any[] {
  const changes = [];
  
  // Check for status change
  if (latestFlightInfo.flight_status && latestFlightInfo.flight_status !== trackedFlight.status) {
    changes.push({
      type: "STATUS_CHANGE",
      oldValue: trackedFlight.status,
      newValue: latestFlightInfo.flight_status,
    });
  }
  
  // Check for departure time change (delay)
  if (latestFlightInfo.departure.scheduled && trackedFlight.departureTime) {
    const oldDepartureTime = new Date(trackedFlight.departureTime);
    const newDepartureTime = new Date(latestFlightInfo.departure.scheduled);
    
    // If departure time has changed by more than 10 minutes
    const timeDifference = Math.abs(newDepartureTime.getTime() - oldDepartureTime.getTime());
    if (timeDifference > 10 * 60 * 1000) { // 10 minutes in milliseconds
      changes.push({
        type: "DELAY",
        oldValue: oldDepartureTime.toISOString(),
        newValue: newDepartureTime.toISOString(),
        delayMinutes: Math.floor(timeDifference / (60 * 1000)),
      });
    }
  }
  
  // Check for gate change
  if (latestFlightInfo.departure.gate && latestFlightInfo.departure.gate !== trackedFlight.gate) {
    changes.push({
      type: "GATE_CHANGE",
      oldValue: trackedFlight.gate,
      newValue: latestFlightInfo.departure.gate,
    });
  }
  
  // Check for departure update (when flight has departed)
  if (latestFlightInfo.flight_status === "active" && trackedFlight.status !== "active") {
    changes.push({
      type: "DEPARTURE",
      departureTime: latestFlightInfo.departure.actual || latestFlightInfo.departure.scheduled,
    });
  }
  
  // Check for arrival update (when flight has arrived)
  if (latestFlightInfo.flight_status === "landed" && trackedFlight.status !== "landed") {
    changes.push({
      type: "ARRIVAL",
      arrivalTime: latestFlightInfo.arrival.actual || latestFlightInfo.arrival.scheduled,
    });
  }
  
  return changes;
}

/**
 * Clean up old entries in the tracking maps 
 * to prevent memory leaks for flights/rules that are no longer active
 */
function cleanupTrackingMaps(): void {
  const now = Date.now();
  const oldestTimeToKeep = now - (7 * 24 * 60 * 60 * 1000); // 7 days
  
  // Clean rule tracking
  for (const ruleId in ruleLastPollTimes) {
    if (ruleLastPollTimes[ruleId] < oldestTimeToKeep) {
      delete ruleLastPollTimes[ruleId];
      delete ruleNextPollTimes[ruleId];
    }
  }
  
  // Clean flight tracking
  for (const flightId in flightLastPollTimes) {
    if (flightLastPollTimes[flightId] < oldestTimeToKeep) {
      delete flightLastPollTimes[flightId];
      delete flightNextPollTimes[flightId];
    }
  }
} 