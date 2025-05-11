import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { searchFlights } from "@/lib/flight-api";

// Schema for validating tracked flight creation
const createTrackedFlightSchema = z.object({
  flightNumber: z.string().min(1, "Flight number is required").optional(),
  date: z.string().min(1, "Date is required").optional(),
  flightId: z.string().optional(),
  price: z.string().optional(),
}).refine(data => {
  // Either flightId OR (flightNumber AND date) must be provided
  return (data.flightId) || (data.flightNumber && data.date);
}, {
  message: "Either flightId or both flightNumber and date must be provided",
  path: ["flightId"]
});

// GET /api/tracked-flights
// Retrieves all flights from rules for the current user
export async function GET() {
  try {
    console.log("Fetching flights from rules...");
    
    // Get the current user session
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      console.error("No authenticated user found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const userId = session.user.id;
    console.log(`Fetching rule flights for user: ${userId}`);
    
    // Get all active rules with alert flights
    const activeRules = await db.rule.findMany({
      where: {
        userId: userId,
        isActive: true,
      },
      include: {
        alerts: {
          include: {
            flight: true,
          },
        },
      },
    });
    
    console.log(`Found ${activeRules.length} active rules`);
    
    // Extract and deduplicate flights from rule alerts
    const flightsMap = new Map();
    
    // Process each rule
    for (const rule of activeRules) {
      // Get only alerts that have flights
      const flightAlerts = rule.alerts.filter(a => a.flight !== null);
      
      console.log(`Rule ${rule.name} has ${flightAlerts.length} flight alerts`);
      
      for (const alert of flightAlerts) {
        if (!alert.flight) continue;
        
        const flight = alert.flight;
        
        // If we haven't seen this flight before, add it
        if (!flightsMap.has(flight.id)) {
          flightsMap.set(flight.id, {
            ...flight,
            alerts: [],
            activeRules: []
          });
        }
        
        const flightEntry = flightsMap.get(flight.id);
        
        // Add this rule if not already added
        if (!flightEntry.activeRules.some((r: { id: string }) => r.id === rule.id)) {
          flightEntry.activeRules.push({
            id: rule.id,
            name: rule.name,
            isActive: rule.isActive
          });
          
          // Add this alert
          flightEntry.alerts.push({
            ...alert,
            ruleId: rule.id,
            isActive: rule.isActive
          });
        }
      }
    }
    
    // Convert to array and return
    const flights = Array.from(flightsMap.values());
    console.log(`Returning ${flights.length} flights with their associated rules and alerts`);
    
    return NextResponse.json(flights);
  } catch (error) {
    console.error("Error fetching flights from rules:", error);
    return NextResponse.json({ error: "Failed to fetch flights from rules" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get the user from the database to ensure we have the correct ID
    const user = await db.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const result = createTrackedFlightSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { message: "Invalid request", errors: result.error.flatten() },
        { status: 400 }
      );
    }

    const { flightNumber, date, flightId, price } = result.data;

    // Handle direct tracking from search results (using flightId)
    if (flightId) {
      // Extract flight number and date from the flightId
      // Format is typically: FLIGHT_NUMBER-DATE-RANDOM_STRING
      const parts = flightId.split('-');
      const extractedFlightNumber = parts[0] || '';
      const extractedDate = parts.length > 1 ? parts[1] : '';
      
      if (!extractedFlightNumber) {
        return NextResponse.json(
          { message: "Invalid flight ID format" },
          { status: 400 }
        );
      }

      // Check if flight is already being tracked by the user
      const existingTrackedFlight = await db.trackedFlight.findFirst({
        where: {
          userId: user.id,
          flightNumber: extractedFlightNumber,
          ...(extractedDate && {
            departureTime: {
              gte: new Date(extractedDate),
              lt: new Date(new Date(extractedDate).setDate(new Date(extractedDate).getDate() + 1)),
            }
          }),
        },
      });

      if (existingTrackedFlight) {
        return NextResponse.json(
          { message: "You are already tracking this flight" },
          { status: 400 }
        );
      }

      // Create a new tracked flight with data extracted from flightId
      const trackedFlight = await db.trackedFlight.create({
        data: {
          flightNumber: extractedFlightNumber,
          userId: user.id,
          departureAirport: "",
          arrivalAirport: "",
          departureTime: extractedDate ? new Date(extractedDate) : new Date(),
          status: "scheduled",
          price: price,
        },
      });

      return NextResponse.json(trackedFlight, { status: 201 });
    }
    
    // At this point, both flightNumber and date should be defined due to our schema refinement
    if (!flightNumber || !date) {
      return NextResponse.json(
        { message: "Flight number and date are required" },
        { status: 400 }
      );
    }
    
    // Legacy handling with flightNumber and date
    // Check if flight is already being tracked by the user
    const existingTrackedFlight = await db.trackedFlight.findFirst({
      where: {
        userId: user.id,
        flightNumber,
        departureTime: {
          gte: new Date(date),
          lt: new Date(new Date(date).setDate(new Date(date).getDate() + 1)),
        },
      },
    });

    if (existingTrackedFlight) {
      return NextResponse.json(
        { message: "You are already tracking this flight" },
        { status: 400 }
      );
    }

    // Create a new tracked flight with minimal data first
    // This avoids issues with the API rate limit
    const trackedFlight = await db.trackedFlight.create({
      data: {
        flightNumber,
        userId: user.id,
        departureAirport: "",
        arrivalAirport: "",
        departureTime: new Date(date),
        status: "scheduled",
        price: price,
      },
    });

    // Try to fetch flight details from the API and update the flight if successful
    try {
      const flightResults = await searchFlights({
        flight_iata: flightNumber,
        flight_date: date,
      });
      
      if (flightResults && flightResults.length > 0) {
        const flightDetails = flightResults[0];
        
        // Update the tracked flight with the API data
        await db.trackedFlight.update({
          where: { id: trackedFlight.id },
          data: {
            departureAirport: flightDetails.departure?.iata || "",
            arrivalAirport: flightDetails.arrival?.iata || "",
            departureTime: flightDetails.departure?.scheduled 
              ? new Date(flightDetails.departure.scheduled) 
              : new Date(date),
            arrivalTime: flightDetails.arrival?.scheduled 
              ? new Date(flightDetails.arrival.scheduled) 
              : null,
            status: flightDetails.flight_status || "scheduled",
            gate: flightDetails.departure?.gate || null,
            terminal: flightDetails.departure?.terminal || null,
            price: price || (flightDetails.price?.formatted || null),
          },
        });
      }
    } catch (apiError) {
      console.error("Error fetching flight details:", apiError);
      // Continue even if API call fails - we already created the basic flight
    }

    return NextResponse.json(trackedFlight, { status: 201 });
  } catch (error) {
    console.error("Error creating tracked flight:", error);
    return NextResponse.json(
      { message: "Failed to create tracked flight" },
      { status: 500 }
    );
  }
} 