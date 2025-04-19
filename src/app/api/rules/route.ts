import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { createRuleSchema } from "@/lib/rules";

// GET /api/rules - Get all rules for the current user
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const rules = await db.rule.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        alerts: {
          include: {
            flight: {
              select: {
                flightNumber: true,
                departureAirport: true,
                arrivalAirport: true,
              }
            },
            trackedFlight: {
              select: {
                flightNumber: true,
                departureAirport: true,
                arrivalAirport: true,
              }
            }
          }
        },
        user: {
          select: {
            name: true,
            email: true,
          }
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(rules);
  } catch (error) {
    console.error("Error getting rules:", error);
    return NextResponse.json(
      { message: "Failed to retrieve rules" },
      { status: 500 }
    );
  }
}

// POST /api/rules - Create a new rule
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const json = await req.json();
    
    // Validate against schema
    try {
      createRuleSchema.parse(json);
    } catch (error) {
      console.error("Validation error:", error);
      return NextResponse.json(
        { message: "Invalid rule data", details: error },
        { status: 400 }
      );
    }

    // Extract data
    const { name, description, operator, isActive, schedule, alerts = [] } = json;
    
    // Note: conditions are no longer used since RuleCondition table was removed

    // Create the rule with a transaction
    const rule = await db.$transaction(async (tx) => {
      // Create the rule
      const newRule = await tx.rule.create({
        data: {
          name,
          description,
          operator,
          isActive,
          schedule,
          userId: session.user.id,
        },
      });

      // Process alerts
      for (const alert of alerts) {
        let flightId = alert.flightId;
        let trackedFlightId = alert.trackedFlightId;
        
        // If flight data is provided but no flightId, create a new Flight record
        if (alert.flightData && !flightId) {
          // Check if we already created this flight for a condition
          const existingFlight = await tx.flight.findFirst({
            where: {
              flightNumber: alert.flightData.flightNumber,
              departureAirport: alert.flightData.departureAirport,
              arrivalAirport: alert.flightData.arrivalAirport,
            }
          });
          
          if (existingFlight) {
            flightId = existingFlight.id;
          } else {
            const newFlight = await tx.flight.create({
              data: {
                flightNumber: alert.flightData.flightNumber,
                airline: alert.flightData.airline,
                departureAirport: alert.flightData.departureAirport,
                arrivalAirport: alert.flightData.arrivalAirport,
                departureTime: alert.flightData.departureTime ? new Date(alert.flightData.departureTime) : null,
                arrivalTime: alert.flightData.arrivalTime ? new Date(alert.flightData.arrivalTime) : null,
                status: alert.flightData.status,
                gate: alert.flightData.gate,
                terminal: alert.flightData.terminal,
                // Removed price field
              }
            });
            flightId = newFlight.id;
          }
        }
        
        await tx.alert.create({
          data: {
            type: alert.type,
            isActive: alert.isActive,
            userId: session.user.id,
            flightId,
            trackedFlightId,
            ruleId: newRule.id,
          },
        });
      }

      // Return the rule with its alerts
      return tx.rule.findUnique({
        where: { id: newRule.id },
        include: {
          alerts: {
            include: {
              flight: {
                select: {
                  flightNumber: true,
                  departureAirport: true,
                  arrivalAirport: true,
                }
              },
              trackedFlight: {
                select: {
                  flightNumber: true,
                  departureAirport: true,
                  arrivalAirport: true,
                }
              }
            }
          },
        },
      });
    });

    return NextResponse.json(rule, { status: 201 });
  } catch (error) {
    console.error("Error creating rule:", error);
    return NextResponse.json(
      { message: "Failed to create rule" },
      { status: 500 }
    );
  }
} 