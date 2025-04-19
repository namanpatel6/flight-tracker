import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { simulateFlightStatusChange } from "@/lib/mock-flight-data";

/**
 * This endpoint allows simulation of flight status changes
 * It can be used to test the rule processing and alert generation
 * 
 * Query parameters:
 * - flightNumber: The flight number to simulate
 * - status: The status to set (optional)
 * - delay: The delay in minutes to add (optional)
 */
export async function GET(request: NextRequest) {
  try {
    // Check if we're in production
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { error: "This endpoint is only available in development mode" },
        { status: 403 }
      );
    }

    const flightNumber = request.nextUrl.searchParams.get("flightNumber");
    if (!flightNumber) {
      return NextResponse.json(
        { error: "Flight number is required" },
        { status: 400 }
      );
    }

    // Find the flight in the database
    const trackedFlight = await db.trackedFlight.findFirst({
      where: { flightNumber }
    });

    if (!trackedFlight) {
      return NextResponse.json(
        { error: "Flight not found in database" },
        { status: 404 }
      );
    }

    // Get the status to set
    const status = request.nextUrl.searchParams.get("status");
    const currentStatus = trackedFlight.status || "scheduled";

    // Simulate the flight status change
    const newFlightData = simulateFlightStatusChange(
      flightNumber,
      status || currentStatus
    );

    // Add delay if specified
    const delayMinutes = parseInt(request.nextUrl.searchParams.get("delay") || "0");
    if (delayMinutes > 0) {
      const scheduledDeparture = new Date(newFlightData.departure.scheduled || "");
      const delayedDeparture = new Date(scheduledDeparture.getTime() + delayMinutes * 60 * 1000);
      
      newFlightData.departure.delay = delayMinutes;
      newFlightData.departure.estimated = delayedDeparture.toISOString();
    }

    // Update the flight in the database
    await db.trackedFlight.update({
      where: { id: trackedFlight.id },
      data: {
        status: newFlightData.flight_status,
        departureTime: new Date(newFlightData.departure.scheduled || ""),
        arrivalTime: new Date(newFlightData.arrival.scheduled || ""),
        gate: newFlightData.departure.gate,
        terminal: newFlightData.departure.terminal,
      }
    });

    return NextResponse.json({
      success: true,
      message: `Flight ${flightNumber} updated successfully`,
      previousStatus: currentStatus,
      newStatus: newFlightData.flight_status,
      flightDetails: newFlightData
    });
  } catch (error) {
    console.error("Error simulating flight:", error);
    return NextResponse.json(
      { error: "Internal server error", details: (error as Error).message },
      { status: 500 }
    );
  }
} 