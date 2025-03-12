import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getTrackedFlightsForUser, trackFlightForUser } from "@/lib/tracked-flights";
import { z } from "zod";

// Schema for tracking a flight
const trackFlightSchema = z.object({
  flightNumber: z.string().min(1, "Flight number is required"),
  airline: z.string().min(1, "Airline is required"),
  departureAirport: z.string().min(1, "Departure airport is required"),
  arrivalAirport: z.string().min(1, "Arrival airport is required"),
  departureTime: z.string().optional(),
  arrivalTime: z.string().optional(),
});

export async function GET() {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Get tracked flights for the user
    const trackedFlights = await getTrackedFlightsForUser(session.user.id);
    
    return NextResponse.json({ trackedFlights });
  } catch (error: any) {
    console.error("Get tracked flights error:", error);
    
    return NextResponse.json(
      { message: error.message || "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    
    // Validate input
    const result = trackFlightSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json(
        { message: "Invalid input", errors: result.error.errors },
        { status: 400 }
      );
    }
    
    // Track the flight
    const trackedFlight = await trackFlightForUser(
      session.user.id,
      result.data.flightNumber,
      result.data.airline,
      result.data.departureAirport,
      result.data.arrivalAirport,
      result.data.departureTime,
      result.data.arrivalTime
    );
    
    return NextResponse.json(
      { message: "Flight tracked successfully", trackedFlight },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Track flight error:", error);
    
    return NextResponse.json(
      { message: error.message || "Something went wrong" },
      { status: 500 }
    );
  }
} 