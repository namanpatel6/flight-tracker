import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// GET /api/rules/[id]
export async function GET(
  request: NextRequest,
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

    const id = params.id;

    // Fetch the rule with its conditions and alerts
    const rule = await prisma.$queryRaw`
      SELECT r.*, 
             json_agg(DISTINCT jsonb_build_object(
               'id', rc.id,
               'field', rc.field,
               'operator', rc.operator,
               'value', rc.value,
               'flight', CASE WHEN f.id IS NOT NULL THEN jsonb_build_object('id', f.id, 'flightNumber', f."flightNumber") ELSE NULL END
             )) AS conditions,
             json_agg(DISTINCT jsonb_build_object(
               'id', a.id,
               'type', a.type,
               'flight', CASE WHEN af.id IS NOT NULL THEN jsonb_build_object('id', af.id, 'flightNumber', af."flightNumber") ELSE NULL END
             )) AS alerts
      FROM "Rule" r
      LEFT JOIN "RuleCondition" rc ON r.id = rc."ruleId"
      LEFT JOIN "TrackedFlight" f ON rc."flightId" = f.id
      LEFT JOIN "Alert" a ON r.id = a."ruleId"
      LEFT JOIN "TrackedFlight" af ON a."flightId" = af.id
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

    const id = params.id;
    
    // Validate the rule exists and belongs to the user
    const existingRule = await prisma.$queryRaw`
      SELECT id FROM "Rule" WHERE id = ${id} AND "userId" = ${session.user.id}
    `;

    if (!existingRule || !Array.isArray(existingRule) || existingRule.length === 0) {
      return NextResponse.json(
        { message: "Rule not found" },
        { status: 404 }
      );
    }

    // Parse and validate the request body
    const updateSchema = z.object({
      name: z.string().min(1).max(100).optional(),
      description: z.string().max(500).nullable().optional(),
      operator: z.enum(["AND", "OR"]).optional(),
      isActive: z.boolean().optional(),
      schedule: z.string().nullable().optional(),
      conditions: z.array(
        z.object({
          id: z.string().optional(),
          field: z.string().min(1),
          operator: z.string().min(1),
          value: z.string().min(1),
          flightId: z.string().nullable().optional(),
        })
      ).optional(),
      alerts: z.array(
        z.object({
          id: z.string().optional(),
          type: z.string().min(1),
          isActive: z.boolean().default(true),
          flightId: z.string().nullable().optional(),
        })
      ).optional(),
    });

    const body = await request.json();
    const validatedData = updateSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        { message: "Invalid request data", errors: validatedData.error.format() },
        { status: 400 }
      );
    }

    // Update the rule using a transaction to ensure all related records are updated
    const updatedRule = await prisma.$transaction(async (tx) => {
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
      
      // 2. Handle conditions if provided
      if (updateData.conditions) {
        // Get existing conditions
        const existingConditions = await tx.ruleCondition.findMany({
          where: { ruleId: id },
        });
        
        // Identify conditions to create, update, or delete
        const existingConditionIds = existingConditions.map(c => c.id);
        const updatedConditionIds = updateData.conditions
          .filter(c => c.id)
          .map(c => c.id as string);
        
        // Delete conditions that are no longer in the updated list
        const conditionsToDelete = existingConditionIds.filter(
          id => !updatedConditionIds.includes(id)
        );
        
        if (conditionsToDelete.length > 0) {
          await tx.ruleCondition.deleteMany({
            where: {
              id: { in: conditionsToDelete },
            },
          });
        }
        
        // Update or create conditions
        for (const condition of updateData.conditions) {
          if (condition.id && existingConditionIds.includes(condition.id)) {
            // Update existing condition
            const conditionUpdateData: any = {
              field: condition.field,
              operator: condition.operator,
              value: condition.value,
            };
            
            if (condition.flightId !== undefined) {
              conditionUpdateData.flightId = condition.flightId;
            }
            
            await tx.ruleCondition.update({
              where: { id: condition.id },
              data: conditionUpdateData,
            });
          } else {
            // Create new condition
            const conditionCreateData: any = {
              field: condition.field,
              operator: condition.operator,
              value: condition.value,
              ruleId: id,
            };
            
            if (condition.flightId !== undefined) {
              conditionCreateData.flightId = condition.flightId;
            }
            
            await tx.ruleCondition.create({
              data: conditionCreateData,
            });
          }
        }
      }
      
      // 3. Handle alerts if provided
      if (updateData.alerts) {
        // Get existing alerts
        const existingAlerts = await tx.alert.findMany({
          where: { ruleId: id },
        });
        
        // Identify alerts to create, update, or delete
        const existingAlertIds = existingAlerts.map(a => a.id);
        const updatedAlertIds = updateData.alerts
          .filter(a => a.id)
          .map(a => a.id as string);
        
        // Delete alerts that are no longer in the updated list
        const alertsToDelete = existingAlertIds.filter(
          id => !updatedAlertIds.includes(id)
        );
        
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
            
            await tx.alert.create({
              data: alertCreateData,
            });
          }
        }
      }
      
      // Fetch the updated rule with its conditions and alerts
      return tx.$queryRaw`
        SELECT r.*, 
               json_agg(DISTINCT jsonb_build_object(
                 'id', rc.id,
                 'field', rc.field,
                 'operator', rc.operator,
                 'value', rc.value,
                 'flight', CASE WHEN f.id IS NOT NULL THEN jsonb_build_object('id', f.id, 'flightNumber', f."flightNumber") ELSE NULL END
               )) AS conditions,
               json_agg(DISTINCT jsonb_build_object(
                 'id', a.id,
                 'type', a.type,
                 'isActive', a."isActive",
                 'flight', CASE WHEN af.id IS NOT NULL THEN jsonb_build_object('id', af.id, 'flightNumber', af."flightNumber") ELSE NULL END
               )) AS alerts
        FROM "Rule" r
        LEFT JOIN "RuleCondition" rc ON r.id = rc."ruleId"
        LEFT JOIN "TrackedFlight" f ON rc."flightId" = f.id
        LEFT JOIN "Alert" a ON r.id = a."ruleId"
        LEFT JOIN "TrackedFlight" af ON a."flightId" = af.id
        WHERE r.id = ${id} AND r."userId" = ${session.user.id}
        GROUP BY r.id
      `;
    });

    if (!updatedRule || !Array.isArray(updatedRule) || updatedRule.length === 0) {
      return NextResponse.json(
        { message: "Error retrieving updated rule" },
        { status: 500 }
      );
    }

    return NextResponse.json(updatedRule[0]);
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

    const id = params.id;

    // Validate the rule exists and belongs to the user
    const existingRule = await prisma.$queryRaw`
      SELECT id FROM "Rule" WHERE id = ${id} AND "userId" = ${session.user.id}
    `;

    if (!existingRule || !Array.isArray(existingRule) || existingRule.length === 0) {
      return NextResponse.json(
        { message: "Rule not found" },
        { status: 404 }
      );
    }

    // Delete the rule and all associated conditions and alerts
    await prisma.$transaction([
      prisma.$executeRawUnsafe(`DELETE FROM "Alert" WHERE "ruleId" = '${id}'`),
      prisma.$executeRawUnsafe(`DELETE FROM "RuleCondition" WHERE "ruleId" = '${id}'`),
      prisma.$executeRawUnsafe(`DELETE FROM "Rule" WHERE id = '${id}' AND "userId" = '${session.user.id}'`)
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting rule:", error);
    return NextResponse.json(
      { message: "Error deleting rule" },
      { status: 500 }
    );
  }
} 