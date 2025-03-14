"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, AlertTriangle, Trash2 } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { CreateAlert } from "../alerts/create-alert";
import { CreateTrackedFlight } from "./create-tracked-flight";

interface Alert {
  id: string;
  type: string;
  createdAt: string;
}

interface TrackedFlight {
  id: string;
  flightNumber: string;
  airline: string;
  departureAirport: string;
  arrivalAirport: string;
  departureTime: string | null;
  arrivalTime: string | null;
  status: string;
  createdAt: string;
  updatedAt: string | null;
  alerts: Alert[];
}

export function TrackedFlightsList() {
  const { data: session } = useSession();
  const [trackedFlights, setTrackedFlights] = useState<TrackedFlight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchTrackedFlights = async () => {
    if (!session?.user) return;
    
    try {
      setIsLoading(true);
      const response = await fetch("/api/tracked-flights");
      
      if (!response.ok) {
        throw new Error("Failed to fetch tracked flights");
      }
      
      const data = await response.json();
      setTrackedFlights(data);
    } catch (error) {
      console.error("Error fetching tracked flights:", error);
      setError("Failed to load tracked flights");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteFlight = async (id: string) => {
    if (!session?.user) return;
    
    try {
      const response = await fetch(`/api/tracked-flights/${id}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        throw new Error("Failed to delete tracked flight");
      }
      
      setTrackedFlights(trackedFlights.filter(flight => flight.id !== id));
    } catch (error) {
      console.error("Error deleting tracked flight:", error);
    }
  };

  const handleAlertCreated = () => {
    fetchTrackedFlights();
  };

  useEffect(() => {
    if (session?.user) {
      fetchTrackedFlights();
    }
  }, [session]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading tracked flights...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center p-8">
        <AlertTriangle className="h-8 w-8 text-destructive mb-2" />
        <p className="text-destructive">{error}</p>
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={fetchTrackedFlights}
        >
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <CreateTrackedFlight onSuccess={fetchTrackedFlights} />
      </div>
      
      {trackedFlights.length === 0 ? (
        <div className="text-center p-8 border rounded-lg">
          <p className="text-muted-foreground mb-4">You are not tracking any flights yet.</p>
          <p className="text-sm text-muted-foreground">Track a flight to receive updates and set alerts.</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {trackedFlights.map((flight) => (
            <Card key={flight.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">
                  {flight.flightNumber}
                </CardTitle>
                <CardDescription>
                  {flight.departureAirport} → {flight.arrivalAirport}
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-2">
              <p className="text-xs text-gray-500">
                {flight.status ? `Status: ${flight.status}` : "Status: Not available"}
              </p>
              <p className="text-xs text-gray-500">
                Tracked since: {formatDate(flight.createdAt)}
              </p>
                <div className="mt-2">
                  <p className="text-xs font-medium text-gray-500">
                    Active Alerts: {flight.alerts?.length || 0}
                  </p>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between pt-2">
                <CreateAlert flightId={flight.id} onSuccess={handleAlertCreated} />
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => handleDeleteFlight(flight.id)}
                  className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 