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

    const { name, description, operator, schedule, conditions, alertTypes, flightIds } = result.data;

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

      // Create the conditions
      await Promise.all(
        conditions.map((condition) =>
          tx.ruleCondition.create({
            data: {
              field: condition.field,
              operator: condition.operator,
              value: condition.value,
              ruleId: newRule.id,
              flightId: condition.flightId,
            },
          })
        )
      );

      // Create alerts for each flight and alert type
      const alertPromises = [];
      for (const flightId of flightIds) {
        for (const alertType of alertTypes) {
          alertPromises.push(
            tx.alert.create({
              data: {
                type: alertType,
                userId: session.user.id,
                flightId,
                ruleId: newRule.id,
              },
            })
          );
        }
      }
      await Promise.all(alertPromises);

      // Return the rule with its conditions and alerts
      return tx.rule.findUnique({
        where: { id: newRule.id },
        include: {
          conditions: true,
          alerts: true,
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