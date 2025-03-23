import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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

    const rules = await prisma.rule.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        conditions: true,
        alerts: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(rules);
  } catch (error) {
    console.error("Error fetching rules:", error);
    return NextResponse.json(
      { message: "Failed to fetch rules" },
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

    const body = await req.json();
    const result = createRuleSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { message: "Invalid request", errors: result.error.flatten() },
        { status: 400 }
      );
    }

    const { name, description, operator, schedule, conditions, alerts } = result.data;

    // Create the rule with a transaction to ensure all related records are created
    const rule = await prisma.$transaction(async (tx) => {
      // Create the rule
      const newRule = await tx.rule.create({
        data: {
          name,
          description,
          operator,
          schedule,
          userId: session.user.id,
        },
      });

      // Process conditions
      for (const condition of conditions) {
        let flightId = condition.flightId;
        let trackedFlightId = condition.trackedFlightId;
        
        // If flight data is provided but no flightId, create a new Flight record
        if (condition.flightData && !flightId) {
          const newFlight = await tx.flight.create({
            data: {
              flightNumber: condition.flightData.flightNumber,
              airline: condition.flightData.airline,
              departureAirport: condition.flightData.departureAirport,
              arrivalAirport: condition.flightData.arrivalAirport,
              departureTime: condition.flightData.departureTime ? new Date(condition.flightData.departureTime) : null,
              arrivalTime: condition.flightData.arrivalTime ? new Date(condition.flightData.arrivalTime) : null,
              status: condition.flightData.status,
              gate: condition.flightData.gate,
              terminal: condition.flightData.terminal,
              price: condition.flightData.price,
            }
          });
          flightId = newFlight.id;
        }
        
        await tx.ruleCondition.create({
          data: {
            field: condition.field,
            operator: condition.operator,
            value: condition.value,
            ruleId: newRule.id,
            flightId,
            trackedFlightId,
          },
        });
      }

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
                price: alert.flightData.price,
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

      // Return the rule with its conditions and alerts
      return tx.rule.findUnique({
        where: { id: newRule.id },
        include: {
          conditions: {
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