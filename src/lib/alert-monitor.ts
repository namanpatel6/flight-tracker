import { db } from "@/lib/db";
import { fetchFlightInfo, batchFetchFlights, getOptimalPollingInterval } from "./aero-api";
import { Flight } from "@/types/flight";
import { Alert, TrackedFlight, User } from "@prisma/client";

// Track last poll times to implement adaptive polling
const lastPollTimes: Record<string, number> = {};
const nextPollTimes: Record<string, number> = {};

/**
 * Processes tracked flights with direct alerts (not rule-based)
 * Uses cost-effective polling strategy
 */
export async function processTrackedFlightsWithAlerts(): Promise<void> {
  const now = Date.now();
  
  // Get all tracked flights with active alerts that are not associated with rules
  const trackedFlights = await db.trackedFlight.findMany({
    where: {
      alerts: {
        some: {
          isActive: true,
          ruleId: null, // Only get alerts not associated with rules
        },
      },
    },
    include: {
      alerts: {
        where: {
          isActive: true,
          ruleId: null,
        },
      },
      user: true,
    },
  });
  
  // Filter flights based on optimal polling schedules
  const flightsToProcess = trackedFlights.filter((flight: TrackedFlight) => {
    // Skip if we polled too recently
    if (lastPollTimes[flight.id]) {
      const nextPollTime = nextPollTimes[flight.id] || 0;
      if (now < nextPollTime) {
        return false;
      }
    }
    return true;
  });
  
  console.log(`Processing ${flightsToProcess.length} out of ${trackedFlights.length} tracked flights with direct alerts (adaptive polling)`);
  
  if (flightsToProcess.length === 0) return;
  
  // Collect flight numbers for batch processing
  const flightNumbers = flightsToProcess.map((flight: TrackedFlight) => flight.flightNumber);
  
  // Fetch flight data in batch to reduce API calls
  const flightDataMap = await batchFetchFlights(flightNumbers);
  
  // Process each flight
  for (const trackedFlight of flightsToProcess) {
    try {
      // Use the data from our batch fetch
      const latestFlightInfo = flightDataMap[trackedFlight.flightNumber];
      
      if (!latestFlightInfo) {
        console.log(`No flight information found for ${trackedFlight.flightNumber}`);
        
        // Update polling interval for not found flights (less frequent checks)
        lastPollTimes[trackedFlight.id] = now;
        nextPollTimes[trackedFlight.id] = now + (3600 * 1000); // 1 hour
        
        continue;
      }
      
      // Update last poll time
      lastPollTimes[trackedFlight.id] = now;
      
      // Determine next poll time based on flight status
      const nextPollIntervalMs = getOptimalPollingInterval(latestFlightInfo) * 1000;
      nextPollTimes[trackedFlight.id] = now + nextPollIntervalMs;
      
      // Check for changes that would trigger alerts
      const changes = detectChanges(trackedFlight, latestFlightInfo);
      
      if (changes.length > 0) {
        console.log(`Changes detected for flight ${trackedFlight.flightNumber}:`, changes);
        
        // Update the flight information in the database
        await updateFlightData(trackedFlight.id, latestFlightInfo);
        
        // Process alerts for this flight
        await processAlerts(trackedFlight, latestFlightInfo, changes);
        
        // Changes detected - poll more frequently next time
        nextPollTimes[trackedFlight.id] = now + Math.min(nextPollIntervalMs, 15 * 60 * 1000); // Maximum 15 minutes
      } else {
        console.log(`No changes detected for flight ${trackedFlight.flightNumber}`);
      }
    } catch (error) {
      console.error(`Error processing flight ${trackedFlight.flightNumber}:`, error);
      
      // Error occurred - retry in 30 minutes
      lastPollTimes[trackedFlight.id] = now;
      nextPollTimes[trackedFlight.id] = now + (30 * 60 * 1000);
    }
  }
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
      // Only update these fields if they exist in the flightInfo
      ...(flightInfo.departure.gate && { gate: flightInfo.departure.gate }),
      ...(flightInfo.departure.terminal && { terminal: flightInfo.departure.terminal }),
    },
  });
}

/**
 * Process alerts for a specific flight
 */
async function processAlerts(
  trackedFlight: TrackedFlight & { alerts: Alert[], user: User }, 
  flightInfo: Flight, 
  changes: any[]
): Promise<void> {
  for (const alert of trackedFlight.alerts) {
    // Find changes relevant to this alert type
    const relevantChanges = changes.filter(change => change.type === alert.type);
    
    if (relevantChanges.length === 0) {
      continue;
    }
    
    // For threshold alerts (like DELAY), check if the threshold is exceeded
    if (alert.type === "DELAY" && alert.threshold) {
      const delayChange = changes.find(change => change.type === "DELAY");
      if (!delayChange || delayChange.delayMinutes < alert.threshold) {
        continue;
      }
    }
    
    // Create notification for each relevant change
    for (const change of relevantChanges) {
      try {
        const notification = await createNotification(trackedFlight, alert, change);
        console.log(`Created notification ${notification.id} for alert ${alert.type}`);
      } catch (error) {
        console.error(`Error creating notification for alert ${alert.id}:`, error);
      }
    }
  }
}

/**
 * Creates a notification in the database
 */
async function createNotification(trackedFlight: any, alert: Alert, change: any): Promise<any> {
  const message = generateNotificationMessage(alert.type, change, trackedFlight);
  
  return db.notification.create({
    data: {
      title: `Flight Alert: ${trackedFlight.flightNumber}`,
      message,
      type: alert.type,
      read: false,
      userId: trackedFlight.user.id,
      flightId: trackedFlight.id,
    },
  });
}

/**
 * Generates notification message based on alert type and change
 */
function generateNotificationMessage(alertType: string, change: any, flight: any): string {
  switch (alertType) {
    case "STATUS_CHANGE":
      return `Flight ${flight.flightNumber} status changed from ${change.oldValue || 'unknown'} to ${change.newValue}`;
    case "DELAY":
      return `Flight ${flight.flightNumber} has been delayed by ${change.delayMinutes} minutes`;
    case "GATE_CHANGE":
      return `Flight ${flight.flightNumber} gate changed from ${change.oldValue || 'unknown'} to ${change.newValue}`;
    case "DEPARTURE":
      return `Flight ${flight.flightNumber} has departed at ${new Date(change.departureTime).toLocaleTimeString()}`;
    case "ARRIVAL":
      return `Flight ${flight.flightNumber} has arrived at ${new Date(change.arrivalTime).toLocaleTimeString()}`;
    default:
      return `Alert for flight ${flight.flightNumber}`;
  }
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