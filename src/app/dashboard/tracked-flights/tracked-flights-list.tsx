"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, AlertTriangle, Clock } from "lucide-react";
import { formatDateWithTimezone } from "@/lib/utils";
import { toast } from "sonner";

interface Flight {
  id: string;
  flightNumber: string;
  airline?: string | null;
  departureAirport: string;
  arrivalAirport: string;
  departureTime?: string | null;
  arrivalTime?: string | null;
  status?: string | null;
  price?: string | null;
  gate?: string | null;
  terminal?: string | null;
  createdAt: string;
  updatedAt: string;
  alerts: Alert[];
  activeRules: Rule[];
}

interface Alert {
  id: string;
  type: string;
  isActive: boolean;
  ruleId?: string;
}

interface Rule {
  id: string;
  name: string;
  isActive: boolean;
}

export function TrackedFlightsList() {
  const { data: session } = useSession();
  const [flights, setFlights] = useState<Flight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [debug, setDebug] = useState<any>({
    fetchAttempted: false,
    responseStatus: null,
    dataLength: null
  });

  const fetchFlights = async () => {
    if (!session?.user) return;
    
    try {
      setIsLoading(true);
      setDebug((prev: any) => ({ ...prev, fetchAttempted: true }));
      
      const response = await fetch("/api/tracked-flights");
      setDebug((prev: any) => ({ ...prev, responseStatus: response.status }));
      
      if (!response.ok) {
        throw new Error(`Failed to fetch flights: ${response.status}`);
      }
      
      const data = await response.json();
      setDebug((prev: any) => ({ ...prev, dataLength: data.length }));
      console.log("Rule flights data:", data);
      
      setFlights(data);
    } catch (error) {
      console.error("Error fetching flights:", error);
      setError(`Failed to load flights: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFlights();
  }, [session]);

  // Count active alerts for each flight
  const countActiveAlerts = (flight: Flight) => {
    return flight.alerts.filter(alert => alert.isActive).length;
  };

  // Get the count of active rules for each flight
  const getActiveRulesCount = (flight: Flight) => {
    return flight.activeRules.filter(rule => rule.isActive).length;
  };

  // Handle flight deletion (if needed)
  const handleDeleteFlight = async (flightId: string) => {
    // For now, let's just show a toast to indicate this functionality is disabled
    toast.info("Flight deletion is not available as flights are managed by rules");
  };

  if (isLoading) {
    return (
      <div className="text-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
        <p>Loading flights...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-4" />
        <p className="text-destructive font-medium">{error}</p>
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={fetchFlights}
        >
          Try Again
        </Button>
      </div>
    );
  }

  // Add debug information to the UI when there are no flights
  return (
    <div className="space-y-6">
      {flights.length === 0 ? (
        <div className="text-center p-8 border rounded-lg">
          <p className="text-muted-foreground mb-4">No flights found in your rules.</p>
          <p className="text-sm text-muted-foreground">Create rules with flight conditions to see flights here.</p>
          
          {/* Debug information */}
          <div className="mt-6 p-4 border border-dashed border-gray-300 rounded-md">
            <p className="text-xs text-gray-500 mb-2">Debug Information:</p>
            <pre className="text-xs text-left bg-gray-50 p-2 rounded overflow-auto">
              {JSON.stringify({
                session: session ? "Authenticated" : "Not authenticated",
                ...debug,
                timestamp: new Date().toISOString()
              }, null, 2)}
            </pre>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {flights.map((flight) => (
            <Card key={flight.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">
                  {flight.airline && `${flight.airline} `}{flight.flightNumber}
                </CardTitle>
                <CardDescription>
                  {flight.departureAirport} → {flight.arrivalAirport}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {flight.status && (
                    <p className="text-xs text-gray-500">
                      <span className="font-medium">Status:</span> {flight.status}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Clock className="h-3 w-3" />
                    <span className="font-medium">Created:</span> {formatDateWithTimezone(flight.createdAt)}
                  </div>
                  
                  {flight.departureTime && (
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock className="h-3 w-3" />
                      <span className="font-medium">Departure:</span> {formatDateWithTimezone(flight.departureTime)}
                    </div>
                  )}
                  
                  {flight.arrivalTime && (
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock className="h-3 w-3" />
                      <span className="font-medium">Arrival:</span> {formatDateWithTimezone(flight.arrivalTime)}
                    </div>
                  )}
                  
                  <div className="pt-2 border-t border-gray-100 mt-2">
                    <p className="text-xs font-medium text-gray-500">
                      Active Alerts: {countActiveAlerts(flight)}
                    </p>
                    <p className="text-xs font-medium text-gray-500">
                      Active Rules: {getActiveRulesCount(flight)}
                    </p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end pt-2">
                {/* Delete button removed as requested */}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 