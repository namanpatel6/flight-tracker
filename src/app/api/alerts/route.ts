import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

// Schema for validating alert creation
const createAlertSchema = z.object({
  flightId: z.string().min(1, "Flight ID is required"),
  type: z.string().min(1, "Alert type is required"),
  threshold: z.number().optional(),
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

    const alerts = await db.alert.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        flight: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(alerts);
  } catch (error) {
    console.error("Error fetching alerts:", error);
    return NextResponse.json(
      { message: "Failed to fetch alerts" },
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
    const result = createAlertSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { message: "Invalid request", errors: result.error.flatten() },
        { status: 400 }
      );
    }

    const { flightId, type, threshold } = result.data;

    // Check if the flight exists and belongs to the user
    const flight = await db.trackedFlight.findUnique({
      where: {
        id: flightId,
        userId: session.user.id,
      },
    });

    if (!flight) {
      return NextResponse.json(
        { message: "Flight not found or you don't have permission to set alerts for this flight" },
        { status: 404 }
      );
    }

    // Check if a similar alert already exists
    const existingAlert = await db.alert.findFirst({
      where: {
        userId: session.user.id,
        flightId,
        type,
      },
    });

    if (existingAlert) {
      return NextResponse.json(
        { message: "You already have an alert of this type for this flight" },
        { status: 400 }
      );
    }

    // Create a new alert
    const alert = await db.alert.create({
      data: {
        type,
        threshold,
        userId: session.user.id,
        flightId,
      },
    });

    return NextResponse.json(alert, { status: 201 });
  } catch (error) {
    console.error("Error creating alert:", error);
    return NextResponse.json(
      { message: "Failed to create alert" },
      { status: 500 }
    );
  }
} 