import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

// Schema for validating tracked flight creation
const createTrackedFlightSchema = z.object({
  flightNumber: z.string().min(1, "Flight number is required"),
  date: z.string().min(1, "Date is required"),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const trackedFlights = await db.trackedFlight.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        alerts: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(trackedFlights);
  } catch (error) {
    console.error("Error fetching tracked flights:", error);
    return NextResponse.json(
      { message: "Failed to fetch tracked flights" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
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

    const { flightNumber, date } = result.data;

    // Check if flight is already being tracked by the user
    const existingTrackedFlight = await db.trackedFlight.findFirst({
      where: {
        userId: session.user.id,
        flightNumber,
        date,
      },
    });

    if (existingTrackedFlight) {
      return NextResponse.json(
        { message: "You are already tracking this flight" },
        { status: 400 }
      );
    }

    // Create a new tracked flight
    const trackedFlight = await db.trackedFlight.create({
      data: {
        flightNumber,
        date,
        userId: session.user.id,
        // You might want to fetch additional flight details from an external API here
        // and populate fields like airline, departureAirport, etc.
      },
    });

    return NextResponse.json(trackedFlight, { status: 201 });
  } catch (error) {
    console.error("Error creating tracked flight:", error);
    return NextResponse.json(
      { message: "Failed to create tracked flight" },
      { status: 500 }
    );
  }
} 