import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EditRuleForm } from "@/components/rules/edit-rule-form";

export const metadata: Metadata = {
  title: "Edit Rule | Flight Tracker",
  description: "Edit your flight tracking rule",
};

// Define types for our rule data
interface RuleCondition {
  id: string;
  field: string;
  operator: string;
  value: string;
  flightId?: string | null;
  flight?: {
    id: string;
    flightNumber: string;
  } | null;
}

interface Alert {
  id: string;
  type: string;
  flightId?: string | null;
  flight?: {
    id: string;
    flightNumber: string;
  } | null;
}

interface Rule {
  id: string;
  name: string;
  description: string | null;
  operator: string;
  isActive: boolean;
  schedule: string | null;
  createdAt: Date;
  updatedAt: Date;
  conditions: RuleCondition[];
  alerts: Alert[];
}

async function getRuleDetails(id: string, userId: string): Promise<Rule | null> {
  try {
    const rule = await prisma.$queryRaw`
      SELECT r.*, 
             json_agg(DISTINCT jsonb_build_object(
               'id', rc.id,
               'field', rc.field,
               'operator', rc.operator,
               'value', rc.value,
               'flightId', rc."flightId",
               'flight', CASE WHEN f.id IS NOT NULL THEN jsonb_build_object('id', f.id, 'flightNumber', f."flightNumber") ELSE NULL END
             )) AS conditions,
             json_agg(DISTINCT jsonb_build_object(
               'id', a.id,
               'type', a.type,
               'flightId', a."flightId",
               'flight', CASE WHEN af.id IS NOT NULL THEN jsonb_build_object('id', af.id, 'flightNumber', af."flightNumber") ELSE NULL END
             )) AS alerts
      FROM "Rule" r
      LEFT JOIN "RuleCondition" rc ON r.id = rc."ruleId"
      LEFT JOIN "TrackedFlight" f ON rc."flightId" = f.id
      LEFT JOIN "Alert" a ON r.id = a."ruleId"
      LEFT JOIN "TrackedFlight" af ON a."flightId" = af.id
      WHERE r.id = ${id} AND r."userId" = ${userId}
      GROUP BY r.id
    `;

    if (!rule || !Array.isArray(rule) || rule.length === 0) {
      return null;
    }

    return rule[0] as unknown as Rule;
  } catch (error) {
    console.error("Error fetching rule details:", error);
    return null;
  }
}

interface PageProps {
  params: {
    id: string;
  };
}

export default async function EditRulePage({ params }: PageProps) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect('/login');
  }
  
  // Extract the id from params before using it
  const id = params.id;
  const rule = await getRuleDetails(id, session.user.id);
  
  if (!rule) {
    return notFound();
  }

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">Edit Rule</h1>
      
      <div className="grid gap-6">
        <EditRuleForm rule={rule} />
      </div>
    </div>
  );
} 