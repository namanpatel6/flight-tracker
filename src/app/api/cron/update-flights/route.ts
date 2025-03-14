import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { searchFlights } from "@/lib/flight-api";
import { sendAlertEmail } from "@/lib/email";
import { Flight } from "@/types/flight";

// This route is meant to be called by a cron job service like Vercel Cron
// It updates flight information and sends notifications for alerts

export async function GET(request: NextRequest) {
  try {
    // Verify API key for security (should match your environment variable)
    const apiKey = request.headers.get("x-api-key");
    if (apiKey !== process.env.CRON_API_KEY) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Get all tracked flights with active alerts
    const trackedFlights = await prisma.trackedFlight.findMany({
      where: {
        alerts: {
          some: {
            isActive: true,
          },
        },
      },
      include: {
        alerts: {
          where: {
            isActive: true,
          },
        },
        user: true,
      },
    });
    
    console.log(`Processing ${trackedFlights.length} tracked flights with active alerts`);
    
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
    
    return NextResponse.json({ success: true, message: "Flight updates processed successfully" });
  } catch (error) {
    console.error("Error in cron job:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
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
          // Create notification in database using raw SQL to avoid type issues
          // This is a workaround until the Prisma client types are properly updated
          await prisma.$executeRaw`
            INSERT INTO "Notification" (
              "id", 
              "title", 
              "message", 
              "type", 
              "read", 
              "createdAt", 
              "userId", 
              "flightId"
            )
            VALUES (
              gen_random_uuid(),
              ${`Flight Alert: ${trackedFlight.flightNumber}`},
              ${notificationMessage},
              ${change.type},
              false,
              NOW(),
              ${trackedFlight.userId},
              ${trackedFlight.id}
            )
          `;
          
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