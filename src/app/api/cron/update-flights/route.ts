import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { searchFlights } from "@/lib/flight-api";
import { sendAlertEmail } from "@/lib/email";
import { Flight } from "@/types/flight";
import { evaluateRule } from "@/lib/rules";

// This route is meant to be called by a cron job service like Vercel Cron
// It updates flight information and sends notifications for alerts

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
    
    // Check if we should run in production mode
    const environmentHeader = request.headers.get("X-Environment");
    const isProduction = 
      environmentHeader === "production" || 
      process.env.NODE_ENV === "production";
    
    if (isProduction) {
      console.log("Running cron job in PRODUCTION mode - will send real emails");
    } else {
      console.log("Running cron job in DEVELOPMENT mode - will use Ethereal for emails");
    }
    
    // Process tracked flights with direct alerts
    await processTrackedFlightsWithAlerts();
    
    // Process rules
    await processRules();
    
    return NextResponse.json({ success: true, message: "Flight updates processed successfully" });
  } catch (error) {
    console.error("Error in cron job:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Process tracked flights with direct alerts (not rule-based)
async function processTrackedFlightsWithAlerts() {
  // Get all tracked flights with active alerts that are not associated with rules
  const trackedFlights = await prisma.trackedFlight.findMany({
    where: {
      alerts: {
        some: {
          isActive: true,
          // @ts-expect-error - ruleId exists in the schema but TypeScript doesn't recognize it yet
          ruleId: null, // Only get alerts not associated with rules
        },
      },
    },
    include: {
      alerts: {
        where: {
          isActive: true,
          // @ts-expect-error - ruleId exists in the schema but TypeScript doesn't recognize it yet
          ruleId: null,
        },
      },
      user: true,
    },
  });
  
  console.log(`Processing ${trackedFlights.length} tracked flights with direct alerts`);
  
  // Process each flight
  for (const trackedFlight of trackedFlights) {
    try {
      // Search for the latest flight information
      const flightResults = await searchFlights({
        flight_iata: trackedFlight.flightNumber
      });
      
      if (!flightResults || flightResults.length === 0) {
        console.log(`No flight information found for ${trackedFlight.flightNumber}`);
        continue;
      }
      
      const latestFlightInfo = flightResults[0];
      
      // Check for changes that would trigger alerts
      const changes = detectChanges(trackedFlight, latestFlightInfo);
      
      if (changes.length > 0) {
        console.log(`Changes detected for flight ${trackedFlight.flightNumber}:`, changes);
        
        // Update the flight information in the database
        await prisma.trackedFlight.update({
          where: {
            id: trackedFlight.id,
          },
          data: {
            status: latestFlightInfo.flight_status || trackedFlight.status,
            departureTime: latestFlightInfo.departure.scheduled ? new Date(latestFlightInfo.departure.scheduled) : trackedFlight.departureTime,
            arrivalTime: latestFlightInfo.arrival.scheduled ? new Date(latestFlightInfo.arrival.scheduled) : trackedFlight.arrivalTime,
            // Only update these fields if they exist in the latestFlightInfo
            ...(latestFlightInfo.departure.gate && { gate: latestFlightInfo.departure.gate }),
            ...(latestFlightInfo.departure.terminal && { terminal: latestFlightInfo.departure.terminal }),
          },
        });
        
        // Process alerts for this flight
        await processAlerts(trackedFlight, latestFlightInfo, changes);
      } else {
        console.log(`No changes detected for flight ${trackedFlight.flightNumber}`);
      }
    } catch (error) {
      console.error(`Error processing flight ${trackedFlight.flightNumber}:`, error);
    }
  }
}

// Process rules
async function processRules() {
  // Get all active rules with their conditions and alerts
  // @ts-expect-error - rule exists in the schema but TypeScript doesn't recognize it yet
  const rules = await prisma.rule.findMany({
    where: {
      isActive: true,
    },
    include: {
      conditions: {
        include: {
          flight: true,
        },
      },
      alerts: {
        where: {
          isActive: true,
        },
        include: {
          flight: true,
          user: true,
        },
      },
      user: true,
    },
  });
  
  console.log(`Processing ${rules.length} active rules`);
  
  // Process each rule
  for (const rule of rules) {
    try {
      console.log(`Processing rule: ${rule.name} (${rule.id})`);
      
      // Get all unique flight IDs from the rule's conditions and alerts
      const flightIds = new Set<string>();
      rule.conditions.forEach((condition: { flightId?: string }) => {
        if (condition.flightId) flightIds.add(condition.flightId);
      });
      rule.alerts.forEach((alert: { flightId: string }) => flightIds.add(alert.flightId));
      
      // Fetch the latest data for all flights
      const flightData: Record<string, any> = {};
      for (const flightId of flightIds) {
        const flight = await prisma.trackedFlight.findUnique({
          where: { id: flightId },
        });
        
        if (!flight) continue;
        
        // Get the latest flight information from the API
        const flightResults = await searchFlights({
          flight_iata: flight.flightNumber
        });
        
        if (!flightResults || flightResults.length === 0) {
          console.log(`No flight information found for ${flight.flightNumber}`);
          continue;
        }
        
        const latestFlightInfo = flightResults[0];
        
        // Check for changes
        const changes = detectChanges(flight, latestFlightInfo);
        
        // Update the flight in the database
        if (changes.length > 0) {
          await prisma.trackedFlight.update({
            where: { id: flightId },
            data: {
              status: latestFlightInfo.flight_status || flight.status,
              departureTime: latestFlightInfo.departure.scheduled ? new Date(latestFlightInfo.departure.scheduled) : flight.departureTime,
              arrivalTime: latestFlightInfo.arrival.scheduled ? new Date(latestFlightInfo.arrival.scheduled) : flight.arrivalTime,
              ...(latestFlightInfo.departure.gate && { gate: latestFlightInfo.departure.gate }),
              ...(latestFlightInfo.departure.terminal && { terminal: latestFlightInfo.departure.terminal }),
            },
          });
        }
        
        // Store the flight data for rule evaluation
        flightData[flightId] = {
          ...flight,
          status: latestFlightInfo.flight_status || flight.status,
          departureTime: latestFlightInfo.departure.scheduled || flight.departureTime,
          arrivalTime: latestFlightInfo.arrival.scheduled || flight.arrivalTime,
          gate: latestFlightInfo.departure.gate || flight.gate,
          terminal: latestFlightInfo.departure.terminal || flight.terminal,
          changes,
        };
      }
      
      // Evaluate the rule
      const ruleResult = evaluateRuleWithData(rule, flightData);
      
      if (ruleResult.satisfied) {
        console.log(`Rule ${rule.name} satisfied, processing alerts`);
        
        // Process alerts for this rule
        for (const alert of rule.alerts) {
          if (!alert.flight || !alert.user) continue;
          
          const flightWithChanges = flightData[alert.flightId];
          if (!flightWithChanges) continue;
          
          // Generate notification message
          const notificationMessage = generateRuleNotificationMessage(rule, alert, flightWithChanges);
          
          try {
            // Create notification in database
            await prisma.notification.create({
              data: {
                title: `Rule Alert: ${rule.name}`,
                message: notificationMessage,
                type: alert.type,
                read: false,
                userId: alert.userId,
                flightId: alert.flightId,
                // @ts-expect-error - ruleId exists in the schema but TypeScript doesn't recognize it yet
                ruleId: rule.id,
              },
            });
            
            // Send email notification if user has an email
            if (alert.user.email) {
              await sendAlertEmail(
                alert.user.email,
                alert.type,
                {
                  ...alert.flight,
                  ...flightWithChanges,
                }
              );
              console.log(`Email sent to ${alert.user.email} for rule ${rule.name} alert type ${alert.type}`);
            }
          } catch (error) {
            console.error('Error processing rule notification:', error);
          }
        }
      } else {
        console.log(`Rule ${rule.name} not satisfied`);
      }
    } catch (error) {
      console.error(`Error processing rule ${rule.id}:`, error);
    }
  }
}

// Helper function to evaluate a rule with flight data
function evaluateRuleWithData(rule: any, flightData: Record<string, any>): { satisfied: boolean; matchedConditions: string[] } {
  if (!rule.conditions || rule.conditions.length === 0) {
    return { satisfied: false, matchedConditions: [] };
  }
  
  const matchedConditions: string[] = [];
  
  // Evaluate each condition
  const conditionResults = rule.conditions.map((condition: any) => {
    if (!condition.flightId || !flightData[condition.flightId]) {
      return false;
    }
    
    const flight = flightData[condition.flightId];
    const result = evaluateCondition(condition, flight);
    
    if (result) {
      matchedConditions.push(condition.id);
    }
    
    return result;
  });
  
  // Combine results based on the rule operator
  let satisfied = false;
  if (rule.operator === "AND") {
    satisfied = conditionResults.every((result: boolean) => result);
  } else {
    satisfied = conditionResults.some((result: boolean) => result);
  }
  
  return { satisfied, matchedConditions };
}

// Helper function to evaluate a condition
function evaluateCondition(condition: any, flightData: any): boolean {
  const { field, operator, value } = condition;
  const fieldValue = flightData[field];
  
  if (fieldValue === undefined) return false;
  
  switch (operator) {
    case "equals":
      return String(fieldValue) === value;
    case "notEquals":
      return String(fieldValue) !== value;
    case "contains":
      return String(fieldValue).includes(value);
    case "notContains":
      return !String(fieldValue).includes(value);
    case "greaterThan":
      return new Date(fieldValue) > new Date(value);
    case "lessThan":
      return new Date(fieldValue) < new Date(value);
    case "greaterThanOrEqual":
      return new Date(fieldValue) >= new Date(value);
    case "lessThanOrEqual":
      return new Date(fieldValue) <= new Date(value);
    case "between":
      const [min, max] = value.split(",");
      return new Date(fieldValue) >= new Date(min) && new Date(fieldValue) <= new Date(max);
    case "changed":
      // Check if there are any changes of the specified type
      return flightData.changes && flightData.changes.some((change: any) => change.type === value);
    default:
      return false;
  }
}

// Helper function to detect changes in flight information
function detectChanges(trackedFlight: any, latestFlightInfo: Flight) {
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

// Helper function to process alerts and send notifications
async function processAlerts(trackedFlight: any, latestFlightInfo: Flight, changes: any[]) {
  // For each change, check if there's a matching alert
  for (const change of changes) {
    const matchingAlerts = trackedFlight.alerts.filter((alert: any) => {
      // For delay alerts, check if the delay exceeds the threshold
      if (alert.type === 'DELAY' && change.type === 'DELAY') {
        return change.delayMinutes >= (alert.threshold || 0);
      }
      
      // For other alerts, just match the type
      return alert.type === change.type;
    });

    if (matchingAlerts.length > 0) {
      console.log(`Found ${matchingAlerts.length} matching alerts for change type ${change.type}`);
      
      // For each matching alert, create a notification and send an email
      for (const alert of matchingAlerts) {
        // Generate notification message
        const notificationMessage = generateNotificationMessage(trackedFlight, change);
        
        try {
          // Create notification in database
          await prisma.notification.create({
            data: {
              title: `Flight Alert: ${trackedFlight.flightNumber}`,
              message: notificationMessage,
              type: change.type,
              read: false,
              userId: trackedFlight.userId,
              flightId: trackedFlight.id,
            },
          });
          
          // Send email notification if user has an email
          if (trackedFlight.user.email) {
            // Prepare flight data for email
            const flightData = {
              ...trackedFlight,
              status: latestFlightInfo.flight_status,
              gate: latestFlightInfo.departure.gate,
              terminal: latestFlightInfo.departure.terminal
            };
            
            await sendAlertEmail(
              trackedFlight.user.email,
              change.type,
              flightData
            );
            console.log(`Email sent to ${trackedFlight.user.email} for alert type ${change.type}`);
          }
        } catch (error) {
          console.error('Error processing notification:', error);
        }
      }
    }
  }
}

// Helper function to generate human-readable notification messages
function generateNotificationMessage(trackedFlight: any, change: any) {
  const flightNumber = trackedFlight.flightNumber;
  
  switch (change.type) {
    case "STATUS_CHANGE":
      return `Flight ${flightNumber} status has changed from ${change.oldValue || "unknown"} to ${change.newValue}.`;
    
    case "DELAY":
      return `Flight ${flightNumber} has been delayed by ${change.delayMinutes} minutes.`;
    
    case "GATE_CHANGE":
      return `Flight ${flightNumber} gate has changed from ${change.oldValue || "unassigned"} to ${change.newValue}.`;
    
    case "DEPARTURE":
      const departureTime = change.departureTime 
        ? new Date(change.departureTime).toLocaleTimeString() 
        : "recently";
      return `Flight ${flightNumber} has departed at ${departureTime}.`;
    
    case "ARRIVAL":
      const arrivalTime = change.arrivalTime 
        ? new Date(change.arrivalTime).toLocaleTimeString() 
        : "recently";
      return `Flight ${flightNumber} has arrived at ${arrivalTime}.`;
    
    default:
      return `Update for flight ${flightNumber}: ${JSON.stringify(change)}`;
  }
}

// Helper function to generate rule-based notification messages
function generateRuleNotificationMessage(rule: any, alert: any, flightData: any) {
  const flightNumber = flightData.flightNumber;
  const ruleName = rule.name;
  
  switch (alert.type) {
    case "STATUS_CHANGE":
      return `Rule "${ruleName}" triggered: Flight ${flightNumber} status is now ${flightData.status}.`;
    
    case "DELAY":
      return `Rule "${ruleName}" triggered: Flight ${flightNumber} has been delayed.`;
    
    case "GATE_CHANGE":
      return `Rule "${ruleName}" triggered: Flight ${flightNumber} gate is now ${flightData.gate}.`;
    
    case "DEPARTURE":
      return `Rule "${ruleName}" triggered: Flight ${flightNumber} has departed.`;
    
    case "ARRIVAL":
      return `Rule "${ruleName}" triggered: Flight ${flightNumber} has arrived.`;
    
    default:
      return `Rule "${ruleName}" triggered for flight ${flightNumber}.`;
  }
} 