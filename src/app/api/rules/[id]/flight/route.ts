import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await the session and params before using them
    const [session, { id: ruleId }] = await Promise.all([
      getServerSession(authOptions),
      params
    ]);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Find the rule and ensure it belongs to the current user
    const rule = await prisma.rule.findFirst({
      where: {
        id: ruleId,
        userId: session.user.id,
      },
      include: {
        alerts: {
          include: {
            flight: true,
          },
          take: 1, // We just need the first alert to get the flight
        },
      },
    });
    
    if (!rule) {
      return NextResponse.json({ error: "Rule not found" }, { status: 404 });
    }
    
    // Get the flight from the first alert
    const firstAlert = rule.alerts[0];
    
    if (!firstAlert || !firstAlert.flightId) {
      return NextResponse.json({ error: "No flight found for this rule" }, { status: 404 });
    }
    
    // Get the flight details
    const flight = await prisma.trackedFlight.findUnique({
      where: {
        id: firstAlert.flightId,
      },
      select: {
        id: true,
        flightNumber: true,
        departureAirport: true,
        arrivalAirport: true,
      },
    });
    
    if (!flight) {
      return NextResponse.json({ error: "Flight not found" }, { status: 404 });
    }
    
    return NextResponse.json(flight);
  } catch (error) {
    console.error("Error getting flight for rule:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
