import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { searchFlights } from "@/lib/flight-api";
// Import placeholder for future notification API
import { sendNotificationEmail } from "@/lib/notifications";
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
    
    console.log(`Running cron job in ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'} mode`);
    
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
  // Skip flights that are already marked as 'arrived' or 'landed'
  const trackedFlights = await prisma.trackedFlight.findMany({
    where: {
      alerts: {
        some: {
          isActive: true,
          ruleId: null, // Only get alerts not associated with rules
        },
      },
      NOT: {
        OR: [
          { status: { contains: 'arrived', mode: 'insensitive' } },
          { status: { contains: 'landed', mode: 'insensitive' } }
        ] // Skip already completed flights
      }
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
  
  console.log(`Processing ${trackedFlights.length} tracked flights with direct alerts`);
  
  // Group flights by time windows for batch processing
  const now = new Date();
  const within12Hours: string[] = [];
  const within24Hours: string[] = [];
  const beyond24Hours: string[] = [];
  
  // Sort flights into appropriate buckets
  for (const flight of trackedFlights) {
    // Skip already processed flights
    if (flight.status?.toLowerCase().includes('arrived') || flight.status?.toLowerCase().includes('landed')) continue;
    
    if (!flight.departureTime) {
      // If no departure time, default to 12-hour bucket
      within12Hours.push(flight.flightNumber);
      continue;
    }
    
    const timeUntilDeparture = flight.departureTime.getTime() - now.getTime();
    
    if (timeUntilDeparture <= 12 * 60 * 60 * 1000) {
      within12Hours.push(flight.flightNumber);
    } else if (timeUntilDeparture <= 24 * 60 * 60 * 1000) {
      within24Hours.push(flight.flightNumber);
    } else {
      beyond24Hours.push(flight.flightNumber);
    }
  }
  
  console.log(`Flights grouped by time: <12h: ${within12Hours.length}, 12-24h: ${within24Hours.length}, >24h: ${beyond24Hours.length}`);
  
  // Create a map to easily look up flight by number
  const flightMap = new Map(
    trackedFlights.map(flight => [flight.flightNumber, flight])
  );
  
  // Process each time bucket with appropriate frequency
  const processBatch = async (flightNumbers: string[], label: string) => {
    if (flightNumbers.length === 0) return;
    
    console.log(`Processing ${label} batch: ${flightNumbers.length} flights`);
    
    // Fetch flight data in batch
    const flightDataMap = await searchFlights({
      flight_iata: flightNumbers.join(',')
    });
    
    if (!flightDataMap || flightDataMap.length === 0) {
      console.log(`No flight information found for ${label} batch`);
      return;
    }
    
    // Process each flight in the batch
    for (const latestFlightInfo of flightDataMap) {
      const flightNumber = latestFlightInfo.flight?.iata || '';
      const trackedFlight = flightMap.get(flightNumber);
      
      if (!trackedFlight) continue;
      
      // Check for changes that would trigger alerts
      const changes = detectChanges(trackedFlight, latestFlightInfo);
      
      // Check if flight has arrived/landed - if so, make final update and stop tracking
      if (latestFlightInfo.flight_status?.toLowerCase().includes('landed') || 
          latestFlightInfo.flight_status?.toLowerCase().includes('arrived')) {
        console.log(`Flight ${flightNumber} has ${latestFlightInfo.flight_status} - final update`);
        
        // Update one last time
        await prisma.trackedFlight.update({
          where: {
            id: trackedFlight.id,
          },
          data: {
            status: latestFlightInfo.flight_status,
            departureTime: latestFlightInfo.departure.scheduled ? new Date(latestFlightInfo.departure.scheduled) : trackedFlight.departureTime,
            arrivalTime: latestFlightInfo.arrival.scheduled ? new Date(latestFlightInfo.arrival.scheduled) : trackedFlight.arrivalTime,
            ...(latestFlightInfo.departure.gate && { gate: latestFlightInfo.departure.gate }),
            ...(latestFlightInfo.departure.terminal && { terminal: latestFlightInfo.departure.terminal }),
          },
        });
        
        // Create notification message
        const notificationMessage = `Flight ${flightNumber} has ${latestFlightInfo.flight_status} at its destination.`;
        
        // Create notification about flight completing
        await prisma.notification.create({
          data: {
            title: `Flight Completed`,
            message: notificationMessage,
            type: "INFO",
            userId: trackedFlight.userId,
            flightId: trackedFlight.id,
          },
        });
        
        // Send email notification if user has email
        if (trackedFlight.user && trackedFlight.user.email) {
          // Import the notification functions
          const { sendNotificationEmail, createFlightAlertEmail } = await import('@/lib/notifications');
          
          // Create email content
          const emailData = createFlightAlertEmail({
            userName: trackedFlight.user.name || '',
            flightNumber: trackedFlight.flightNumber,
            alertType: 'ARRIVAL',
            message: notificationMessage,
          });
          
          // Send the email
          await sendNotificationEmail({
            to: trackedFlight.user.email,
            subject: emailData.subject,
            html: emailData.html,
            text: emailData.text,
          });
          
          console.log(`Flight completion email sent to ${trackedFlight.user.email} for flight ${trackedFlight.flightNumber}`);
        }
        
        continue;
      }
      
      if (changes.length > 0) {
        console.log(`Changes detected for flight ${flightNumber}:`, changes);
        
        // Update the flight information in the database
        await prisma.trackedFlight.update({
          where: {
            id: trackedFlight.id,
          },
          data: {
            status: latestFlightInfo.flight_status || trackedFlight.status,
            departureTime: latestFlightInfo.departure.scheduled ? new Date(latestFlightInfo.departure.scheduled) : trackedFlight.departureTime,
            arrivalTime: latestFlightInfo.arrival.scheduled ? new Date(latestFlightInfo.arrival.scheduled) : trackedFlight.arrivalTime,
            ...(latestFlightInfo.departure.gate && { gate: latestFlightInfo.departure.gate }),
            ...(latestFlightInfo.departure.terminal && { terminal: latestFlightInfo.departure.terminal }),
          },
        });
        
        // Process alerts for this flight
        await processAlerts(trackedFlight, latestFlightInfo, changes);
      } else {
        console.log(`No changes detected for flight ${flightNumber}`);
      }
    }
  };
  
  // Process batches with different frequencies
  await processBatch(within12Hours, 'within 12 hours');
  await processBatch(within24Hours, 'within 24 hours');
  await processBatch(beyond24Hours, 'beyond 24 hours');
}

// Process rules
async function processRules() {
  // Get all active rules with their alerts
  const rules = await prisma.rule.findMany({
    where: {
      isActive: true,
    },
    include: {
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
      
      // Get all unique flight IDs from the rule's alerts
      const flightIds = new Set<string>();
      rule.alerts.forEach((alert: any) => {
        if (alert.flightId) flightIds.add(alert.flightId);
      });
      
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
      
      // Evaluate the rule based on alerts instead of conditions
      const ruleResult = evaluateRuleWithAlerts(rule, flightData);
      
      if (ruleResult.satisfied) {
        console.log(`Rule ${rule.name} satisfied, processing alerts`);
        
        // Process alerts for this rule
        for (const alert of rule.alerts) {
          if (!alert.flight || !alert.user || !alert.flightId) continue;
          
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
                ruleId: rule.id,
              },
            });
            
            // Send email notification if user has email
            if (alert.user.email) {
              // Import the notification functions
              const { sendNotificationEmail, createFlightAlertEmail } = await import('@/lib/notifications');
              
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
              
              console.log(`Email notification sent to ${alert.user.email} for rule ${rule.name}`);
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
function evaluateRuleWithAlerts(rule: any, flightData: Record<string, any>): { satisfied: boolean; matchedAlerts: string[] } {
  if (!rule.alerts || rule.alerts.length === 0) {
    return { satisfied: false, matchedAlerts: [] };
  }
  
  const matchedAlerts: string[] = [];
  
  // Evaluate each alert
  const alertResults = rule.alerts.map((alert: any) => {
    if (!alert.flightId || !flightData[alert.flightId]) {
      return false;
    }
    
    const flight = flightData[alert.flightId];
    // Check if there are changes matching the alert type
    const result = alert.type === 'any_change' 
      ? flight.changes.length > 0
      : flight.changes.some((change: any) => change.field === alert.type);
    
    if (result) {
      matchedAlerts.push(alert.id);
    }
    
    return result;
  });
  
  // Combine results based on the rule operator
  let satisfied = false;
  if (rule.operator === "AND") {
    satisfied = alertResults.every((result: boolean) => result);
  } else {
    satisfied = alertResults.some((result: boolean) => result);
  }
  
  return { satisfied, matchedAlerts };
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
  if (latestFlightInfo.flight_status?.toLowerCase().includes("active") && 
      !trackedFlight.status?.toLowerCase().includes("active")) {
    changes.push({
      type: "DEPARTURE",
      departureTime: latestFlightInfo.departure.actual || latestFlightInfo.departure.scheduled,
    });
  }
  
  // Check for arrival update (when flight has arrived)
  if (latestFlightInfo.flight_status?.toLowerCase().includes("landed") && 
      !trackedFlight.status?.toLowerCase().includes("landed")) {
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
          
          // Send email notification if user has email
          if (trackedFlight.user && trackedFlight.user.email) {
            // Import the notification functions
            const { sendNotificationEmail, createFlightAlertEmail } = await import('@/lib/notifications');
            
            // Create email content
            const emailData = createFlightAlertEmail({
              userName: trackedFlight.user.name || '',
              flightNumber: trackedFlight.flightNumber,
              alertType: change.type,
              message: notificationMessage,
            });
            
            // Send the email
            await sendNotificationEmail({
              to: trackedFlight.user.email,
              subject: emailData.subject,
              html: emailData.html,
              text: emailData.text,
            });
            
            console.log(`Email notification sent to ${trackedFlight.user.email} for flight ${trackedFlight.flightNumber}`);
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