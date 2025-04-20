import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

// GET /api/rules/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Use a raw query to get the rule with its related data
    const rule = await db.$queryRaw`
      SELECT r.*, 
             '[]'::json AS conditions,
             json_agg(DISTINCT jsonb_build_object(
               'id', a.id,
               'type', a.type,
               'isActive', a."isActive",
               'flightId', a."flightId",
               'trackedFlightId', a."trackedFlightId",
               'flight', CASE WHEN af.id IS NOT NULL THEN jsonb_build_object('id', af.id, 'flightNumber', af."flightNumber") ELSE NULL END,
               'trackedFlight', CASE WHEN tf.id IS NOT NULL THEN jsonb_build_object('id', tf.id, 'flightNumber', tf."flightNumber") ELSE NULL END
             )) AS alerts
      FROM "Rule" r
      LEFT JOIN "Alert" a ON r.id = a."ruleId"
      LEFT JOIN "Flight" af ON a."flightId" = af.id
      LEFT JOIN "TrackedFlight" tf ON a."trackedFlightId" = tf.id
      WHERE r.id = ${id} AND r."userId" = ${session.user.id}
      GROUP BY r.id
    `;

    if (!rule || !Array.isArray(rule) || rule.length === 0) {
      return NextResponse.json(
        { message: "Rule not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(rule[0]);
  } catch (error) {
    console.error("Error fetching rule:", error);
    return NextResponse.json(
      { message: "Error fetching rule" },
      { status: 500 }
    );
  }
}

// PATCH /api/rules/[id]
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    
    // Validate the rule exists and belongs to the user
    const existingRule = await db.rule.findUnique({
      where: { 
        id,
        userId: session.user.id
      },
      include: {
        alerts: true
      }
    });

    if (!existingRule) {
      return NextResponse.json(
        { message: "Rule not found" },
        { status: 404 }
      );
    }

    console.log("EXISTING RULE DATA:", {
      id: existingRule.id,
      alerts: existingRule.alerts
    });

    // Parse and validate the request body
    const updateSchema = z.object({
      name: z.string().min(1).max(100).optional(),
      description: z.string().max(500).nullable().optional(),
      operator: z.enum(["AND", "OR"]).optional(),
      isActive: z.boolean().optional(),
      schedule: z.string().nullable().optional(),
      alerts: z.array(
        z.object({
          id: z.string().optional(),
          type: z.string().min(1),
          isActive: z.boolean().default(true),
          flightId: z.string().nullable().optional(),
          trackedFlightId: z.string().nullable().optional(),
        })
      ).optional(),
    });

    const body = await request.json();
    console.log("RECEIVED UPDATE DATA:", body);
    const validatedData = updateSchema.safeParse(body);

    if (!validatedData.success) {
      console.log("VALIDATION FAILED:", validatedData.error.format());
      return NextResponse.json(
        { message: "Invalid request data", errors: validatedData.error.format() },
        { status: 400 }
      );
    }

    // Update the rule using a transaction to ensure all related records are updated
    const updatedRule = await db.$transaction(async (tx) => {
      // 1. Update the basic rule information
      const updateData = validatedData.data;
      const basicUpdateData: Record<string, any> = {};
      
      if (updateData.name !== undefined) basicUpdateData.name = updateData.name;
      if (updateData.description !== undefined) basicUpdateData.description = updateData.description;
      if (updateData.operator !== undefined) basicUpdateData.operator = updateData.operator;
      if (updateData.isActive !== undefined) basicUpdateData.isActive = updateData.isActive;
      if (updateData.schedule !== undefined) basicUpdateData.schedule = updateData.schedule;
      
      // Update the rule if there are basic fields to update
      if (Object.keys(basicUpdateData).length > 0) {
        await tx.rule.update({
          where: { id },
          data: {
            ...basicUpdateData,
            updatedAt: new Date(),
          },
        });
      }
      
      // 3. Handle alerts if provided
      if (updateData.alerts) {
        console.log("PROCESSING ALERTS:", updateData.alerts);
        
        // Get existing alerts
        const existingAlerts = await tx.alert.findMany({
          where: { ruleId: id },
        });
        console.log("EXISTING ALERTS:", existingAlerts);
        
        // Identify alerts to create, update, or delete
        const existingAlertIds = existingAlerts.map(a => a.id);
        const updatedAlertIds = updateData.alerts
          .filter(a => a.id)
          .map(a => a.id as string);
        
        console.log({
          existingAlertIds,
          updatedAlertIds,
        });
        
        // Delete alerts that are no longer in the updated list
        const alertsToDelete = existingAlertIds.filter(
          id => !updatedAlertIds.includes(id)
        );
        console.log("ALERTS TO DELETE:", alertsToDelete);
        
        if (alertsToDelete.length > 0) {
          await tx.alert.deleteMany({
            where: {
              id: { in: alertsToDelete },
            },
          });
        }
        
        // Update or create alerts
        for (const alert of updateData.alerts) {
          if (alert.id && existingAlertIds.includes(alert.id)) {
            // Update existing alert
            const alertUpdateData: any = {
              type: alert.type,
              isActive: alert.isActive,
            };
            
            if (alert.flightId !== undefined) {
              alertUpdateData.flightId = alert.flightId;
            }
            
            if (alert.trackedFlightId !== undefined) {
              alertUpdateData.trackedFlightId = alert.trackedFlightId;
            }
            
            console.log(`UPDATING ALERT ${alert.id}:`, alertUpdateData);
            await tx.alert.update({
              where: { id: alert.id },
              data: alertUpdateData,
            });
          } else {
            // Create new alert
            const alertCreateData: any = {
              type: alert.type,
              isActive: alert.isActive,
              ruleId: id,
              userId: session.user.id,
            };
            
            if (alert.flightId !== undefined) {
              alertCreateData.flightId = alert.flightId;
            }
            
            if (alert.trackedFlightId !== undefined) {
              alertCreateData.trackedFlightId = alert.trackedFlightId;
            }
            
            console.log("CREATING NEW ALERT:", alertCreateData);
            await tx.alert.create({
              data: alertCreateData,
            });
          }
        }
      }
      
      // Return the updated rule with all its data
      return tx.rule.findUnique({
        where: { id },
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
          }
        }
      });
    });

    return NextResponse.json({
      message: "Rule updated successfully",
      rule: updatedRule
    });
  } catch (error) {
    console.error("Error updating rule:", error);
    return NextResponse.json(
      { message: "Error updating rule" },
      { status: 500 }
    );
  }
}

// DELETE /api/rules/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Check if the rule exists and belongs to the user
    const rule = await db.rule.findUnique({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!rule) {
      return NextResponse.json(
        { message: "Rule not found" },
        { status: 404 }
      );
    }

    // Delete the rule and all associated alerts in a transaction
    await db.$transaction([
      // First delete all alerts associated with this rule
      db.alert.deleteMany({
        where: {
          ruleId: id,
        },
      }),
      // Then delete the rule itself
      db.rule.delete({
        where: {
          id,
        },
      }),
    ]);

    return NextResponse.json(
      { message: "Rule deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting rule:", error);
    return NextResponse.json(
      { message: "Error deleting rule" },
      { status: 500 }
    );
  }
} 