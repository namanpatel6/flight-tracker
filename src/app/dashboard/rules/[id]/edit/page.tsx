import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EditRuleForm } from "@/components/rules/edit-rule-form";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: "Edit Rule | Flight Tracker",
  description: "Edit your flight tracking rule",
};

async function getRule(id: string, userId: string) {
  try {
    const rule = await prisma.rule.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        alerts: {
          include: {
            flight: true,
          },
        },
      },
    });

    if (!rule) {
      return null;
    }

    // Transform the rule for the form
    return {
      ...rule,
      alerts: rule.alerts.map(alert => ({
        ...alert,
        flightData: alert.flight ? {
          flightNumber: alert.flight.flightNumber,
          airline: alert.flight.airline || '',
          departureAirport: alert.flight.departureAirport || '',
          arrivalAirport: alert.flight.arrivalAirport || '',
          departureTime: alert.flight.departureTime ? new Date(alert.flight.departureTime).toISOString() : '',
          arrivalTime: alert.flight.arrivalTime ? new Date(alert.flight.arrivalTime).toISOString() : '',
          status: alert.flight.status || '',
          gate: alert.flight.gate || '',
          terminal: alert.flight.terminal || '',
        } : undefined,
        flightId: alert.flightId || undefined,
        trackedFlightId: alert.trackedFlightId || undefined,
      })),
    };
  } catch (error) {
    console.error("Error fetching rule:", error);
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
    redirect('/auth/signin');
  }
  
  // Await params before using them
  const { id } = await params;  
  const rule = await getRule(id, session.user.id);
  
  if (!rule) {
    return (
      <div className="container py-10">
        <h1 className="text-3xl font-bold mb-6">Rule not found</h1>
        <p className="mb-4">The rule you are looking for does not exist or you don't have permission to edit it.</p>
        <Button asChild>
          <Link href="/dashboard/rules">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Rules
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-10 px-4">
      <div className="flex items-center mb-8">
        <Button variant="outline" size="sm" asChild className="mr-4">
          <Link href={`/dashboard/rules/${rule.id}`}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Edit Rule</h1>
      </div>

      <EditRuleForm rule={rule as any} />
    </div>
  );
} 