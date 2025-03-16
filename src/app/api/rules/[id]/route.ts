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
    });

    const body = await request.json();
    const validatedData = updateSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        { message: "Invalid request data", errors: validatedData.error.format() },
        { status: 400 }
      );
    }

    // Update the rule
    const updateData = validatedData.data;
    
    // Convert camelCase to snake_case for database fields
    const dbUpdateData: Record<string, any> = {};
    if (updateData.name !== undefined) dbUpdateData.name = updateData.name;
    if (updateData.description !== undefined) dbUpdateData.description = updateData.description;
    if (updateData.operator !== undefined) dbUpdateData.operator = updateData.operator;
    if (updateData.isActive !== undefined) dbUpdateData["isActive"] = updateData.isActive;
    if (updateData.schedule !== undefined) dbUpdateData.schedule = updateData.schedule;

    // Build the SQL query dynamically based on what fields are being updated
    let setClause = Object.entries(dbUpdateData)
      .map(([key, value]) => {
        if (value === null) {
          return `"${key}" = NULL`;
        }
        return `"${key}" = ${typeof value === 'string' ? `'${value}'` : value}`;
      })
      .join(", ");

    if (!setClause) {
      return NextResponse.json(
        { message: "No fields to update" },
        { status: 400 }
      );
    }

    const updatedRule = await prisma.$executeRawUnsafe(`
      UPDATE "Rule"
      SET ${setClause}, "updatedAt" = NOW()
      WHERE id = '${id}' AND "userId" = '${session.user.id}'
      RETURNING id, name, description, operator, "isActive", schedule, "createdAt", "updatedAt"
    `);

    // Fetch the updated rule
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
        { message: "Error retrieving updated rule" },
        { status: 500 }
      );
    }

    return NextResponse.json(rule[0]);
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