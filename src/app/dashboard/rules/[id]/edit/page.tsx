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
interface Alert {
  id: string;
  type: string;
  isActive: boolean; 
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
  conditions: []; // Empty array since conditions are no longer used
  alerts: Alert[];
}

async function getRuleDetails(id: string, userId: string): Promise<Rule | null> {
  try {
    const rule = await prisma.$queryRaw`
      SELECT r.*, 
             '[]'::json AS conditions,
             json_agg(DISTINCT jsonb_build_object(
               'id', a.id,
               'type', a.type,
               'isActive', a."isActive",
               'flightId', a."flightId",
               'flight', CASE WHEN af.id IS NOT NULL THEN jsonb_build_object('id', af.id, 'flightNumber', af."flightNumber") ELSE NULL END
             )) AS alerts
      FROM "Rule" r
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
  params: Promise<{
    id: string;
  }>;
}

export default async function EditRulePage({ params }: PageProps) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect('/login');
  }
  
  // Await params before using them
  const { id } = await params;
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