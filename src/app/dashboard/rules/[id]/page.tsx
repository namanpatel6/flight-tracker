import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Edit, ChevronLeft, Bell, Code, Calendar, Plane } from 'lucide-react';
import { ToggleRuleButton } from '@/components/rules/toggle-rule-button';
import { DeleteRuleButton } from '@/components/rules/delete-rule-button';

export const metadata: Metadata = {
  title: "Rule Details | Flight Tracker",
  description: "View and manage your flight tracking rule",
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

async function getRule(id: string, userId: string) {
  try {
    const rule = await prisma.rule.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        conditions: {
          include: {
            flight: true,
          },
        },
        alerts: {
          include: {
            flight: true,
          },
        },
      },
    });

    return rule;
  } catch (error) {
    console.error("Error fetching rule:", error);
    return null;
  }
}

interface PageProps {
  params: {
    id: string;
  };
}

export default async function RuleDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect('/login');
  }
  
  // Await params before using them
  const paramsData = await params;
  const rule = await getRule(paramsData.id, session.user.id);
  
  if (!rule) {
    return (
      <div className="container py-10">
        <h1 className="text-3xl font-bold mb-6">Rule not found</h1>
        <p className="mb-4">The rule you are looking for does not exist or you don't have permission to view it.</p>
        <Button asChild>
          <Link href="/dashboard/rules">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Rules
          </Link>
        </Button>
      </div>
    );
  }

  // Find the flight information from the first condition
  const flight = rule.conditions.length > 0 && rule.conditions[0].flight 
    ? rule.conditions[0].flight 
    : null;

  // Format operator for display
  const formatOperator = (operator: string) => {
    return operator === 'AND' ? 'All conditions must match' : 'Any condition can match';
  };

  // Get field display name
  const getFieldDisplayName = (field: string) => {
    const fieldMap: Record<string, string> = {
      'status': 'Status',
      'departureTime': 'Departure Time',
      'arrivalTime': 'Arrival Time',
      'gate': 'Gate',
      'terminal': 'Terminal',
      'flightNumber': 'Flight Number',
      'price': 'Price'
    };
    
    return fieldMap[field] || field;
  };

  // Get operator display name
  const getOperatorDisplayName = (operator: string) => {
    const operatorMap: Record<string, string> = {
      'equals': 'equals',
      'notEquals': 'does not equal',
      'contains': 'contains',
      'notContains': 'does not contain',
      'greaterThan': 'is after',
      'lessThan': 'is before',
      'greaterThanOrEqual': 'is on or after',
      'lessThanOrEqual': 'is on or before',
      'between': 'is between',
      'changed': 'has changed to'
    };
    
    return operatorMap[operator] || operator;
  };

  return (
    <div className="max-w-6xl mx-auto py-10 px-4">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/rules">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">{rule.name}</h1>
          <Badge variant={rule.isActive ? "default" : "outline"}>
            {rule.isActive ? "Active" : "Inactive"}
          </Badge>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/dashboard/rules/${rule.id}/edit`}>
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Link>
          </Button>
          <ToggleRuleButton rule={rule as any} />
          <DeleteRuleButton ruleId={rule.id} ruleName={rule.name} />
        </div>
      </div>

      {flight && (
        <Card className="mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Plane className="h-5 w-5 text-primary" />
              Flight Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-muted p-4 rounded-md">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-medium text-lg">{flight.flightNumber}</span>
              </div>
              <div className="flex items-center text-md">
                <span className="font-medium">{flight.departureAirport}</span>
                <svg className="w-12 h-6 mx-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5 12H19M19 12L13 6M19 12L13 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="font-medium">{flight.arrivalAirport}</span>
              </div>
              {flight.departureTime && (
                <div className="mt-2 text-sm text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>Departure Date: {formatDate(flight.departureTime.toString())}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Code className="h-5 w-5" />
              Rule Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {rule.description && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Description</h3>
                  <p>{rule.description}</p>
                </div>
              )}
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Rule Logic</h3>
                <p>{formatOperator(rule.operator)}</p>
              </div>
              
              {rule.schedule && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Schedule</h3>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>{rule.schedule}</span>
                  </div>
                </div>
              )}
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Created</h3>
                <p>{formatDate(rule.createdAt.toString())}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Last Updated</h3>
                <p>{formatDate(rule.updatedAt.toString())}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Conditions</CardTitle>
          </CardHeader>
          <CardContent>
            {rule.conditions.length === 0 ? (
              <p className="text-muted-foreground">No conditions defined for this rule.</p>
            ) : (
              <div className="space-y-3">
                {rule.conditions.map((condition) => (
                  <div key={condition.id} className="border rounded-md p-3">
                    <div className="flex flex-wrap items-center gap-1 text-sm">
                      <span className="font-medium">{getFieldDisplayName(condition.field)}</span>
                      <span>{getOperatorDisplayName(condition.operator)}</span>
                      <span className="font-medium">"{condition.value}"</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {rule.alerts.length === 0 ? (
              <p className="text-muted-foreground">No alerts defined for this rule.</p>
            ) : (
              <div className="space-y-3">
                {rule.alerts.map((alert) => (
                  <div key={alert.id} className="border rounded-md p-3 flex justify-between items-center">
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
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full ${alert.isActive && rule.isActive ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 