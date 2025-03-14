import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = params;

    // Check if the flight exists and belongs to the user
    const trackedFlight = await db.trackedFlight.findUnique({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!trackedFlight) {
      return NextResponse.json(
        { message: "Tracked flight not found" },
        { status: 404 }
      );
    }

    // Delete the tracked flight
    await db.trackedFlight.delete({
      where: {
        id,
      },
    });

    return NextResponse.json(
      { message: "Tracked flight deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting tracked flight:", error);
    return NextResponse.json(
      { message: "Failed to delete tracked flight" },
      { status: 500 }
    );
  }
} 