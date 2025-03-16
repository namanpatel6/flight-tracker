import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Rule Details | Flight Tracker",
  description: "View and edit your flight tracking rule",
};

// Define types for our rule data
interface RuleCondition {
  id: string;
  field: string;
  operator: string;
  value: string;
  flight?: {
    flightNumber: string;
  } | null;
}

interface Alert {
  id: string;
  type: string;
  isActive: boolean;
  flight?: {
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
               'flight', CASE WHEN f.id IS NOT NULL THEN jsonb_build_object('flightNumber', f."flightNumber") ELSE NULL END
             )) AS conditions,
             json_agg(DISTINCT jsonb_build_object(
               'id', a.id,
               'type', a.type,
               'flight', CASE WHEN af.id IS NOT NULL THEN jsonb_build_object('flightNumber', af."flightNumber") ELSE NULL END
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

export default async function RuleDetailsPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return notFound();
  }
  
  // Extract the id from params before using it
  const id = params.id;
  const rule = await getRuleDetails(id, session.user.id);
  
  if (!rule) {
    return notFound();
  }

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">Rule Details</h1>
      
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{rule.name}</CardTitle>
                <CardDescription>{rule.description || "No description provided"}</CardDescription>
              </div>
              <Badge variant={rule.isActive ? "default" : "outline"}>
                {rule.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div>
                <h3 className="text-sm font-medium mb-2">Basic Information</h3>
                <dl className="grid grid-cols-2 gap-2 text-sm">
                  <dt className="font-medium">Operator:</dt>
                  <dd>{rule.operator}</dd>
                  <dt className="font-medium">Created:</dt>
                  <dd>{formatDate(rule.createdAt.toString())}</dd>
                  <dt className="font-medium">Last Updated:</dt>
                  <dd>{formatDate(rule.updatedAt.toString())}</dd>
                  {rule.schedule && (
                    <>
                      <dt className="font-medium">Schedule:</dt>
                      <dd>{rule.schedule}</dd>
                    </>
                  )}
                </dl>
              </div>
              
              <div>
                <h3 className="text-sm font-medium mb-2">Conditions</h3>
                {!rule.conditions || rule.conditions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No conditions defined</p>
                ) : (
                  <ul className="space-y-2">
                    {rule.conditions.map((condition: RuleCondition) => (
                      <li key={condition.id} className="text-sm border rounded-md p-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">
                            {condition.field} {condition.operator} {condition.value}
                          </span>
                          {condition.flight && (
                            <Badge variant="outline">
                              {condition.flight.flightNumber}
                            </Badge>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              
              <div>
                <h3 className="text-sm font-medium mb-2">Alerts</h3>
                {!rule.alerts || rule.alerts.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No alerts defined</p>
                ) : (
                  <div className="space-y-4">
                    <ul className="space-y-2">
                      {rule.alerts.map((alert: Alert) => (
                        <li key={alert.id} className="text-sm border rounded-md p-3">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary">
                                {alert.type.replace(/_/g, ' ')}
                              </Badge>
                              {alert.flight && (
                                <Badge variant="outline">
                                  {alert.flight.flightNumber}
                                </Badge>
                              )}
                            </div>
                            <Badge variant={alert.isActive ? "default" : "outline"} className="ml-2">
                              {alert.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            This alert will be triggered when the rule conditions are met.
                          </div>
                        </li>
                      ))}
                    </ul>
                    <p className="text-xs text-muted-foreground">
                      Alerts will be sent based on the rule conditions and the selected alert types.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 