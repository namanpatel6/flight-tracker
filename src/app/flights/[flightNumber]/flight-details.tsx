"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Flight } from "@/types/flight";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate, formatTime, calculateDuration } from "@/lib/utils";
import { AlertCircle, Bell, BellOff, Plane, Calendar, Clock, MapPin } from "lucide-react";
import { getTrackedFlights, trackFlight, untrackFlight } from "@/lib/flight-api";

interface FlightDetailsProps {
  flight: Flight;
}

export function FlightDetails({ flight }: FlightDetailsProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (session?.user?.id) {
      const checkIfTracking = async () => {
        try {
          const trackedFlights = await getTrackedFlights(session.user.id);
          const isFlightTracked = trackedFlights.some(tf => tf.id === flight.id);
          setIsTracking(isFlightTracked);
        } catch (err) {
          console.error("Error checking tracking status:", err);
        }
      };
      
      checkIfTracking();
    }
  }, [session, flight.id]);

  const handleTrackFlight = async () => {
    if (!session?.user?.id) {
      router.push("/api/auth/signin");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (isTracking) {
        const success = await untrackFlight(session.user.id, flight.id);
        if (success) {
          setIsTracking(false);
        } else {
          throw new Error("Failed to untrack flight");
        }
      } else {
        const success = await trackFlight(session.user.id, flight.id);
        if (success) {
          setIsTracking(true);
        } else {
          throw new Error("Failed to track flight");
        }
      }
    } catch (err) {
      setError("Failed to update tracking status. Please try again.");
      console.error("Error tracking flight:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold">
              {flight.airline.name} {flight.flight.iata || flight.flight.icao}
            </CardTitle>
            <Button
              variant={isTracking ? "outline" : "default"}
              onClick={handleTrackFlight}
              disabled={loading}
            >
              {isTracking ? (
                <>
                  <BellOff className="mr-2 h-4 w-4" />
                  Stop Tracking
                </>
              ) : (
                <>
                  <Bell className="mr-2 h-4 w-4" />
                  Track Flight
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Departure</div>
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <div className="font-medium">{flight.departure.airport} ({flight.departure.iata})</div>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>{formatDate(flight.departure.scheduled)}</div>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>{formatTime(flight.departure.scheduled)}</div>
                {flight.departure.actual && (
                  <div className="text-sm text-muted-foreground">
                    (Actual: {formatTime(flight.departure.actual)})
                  </div>
                )}
              </div>
              {flight.departure.terminal && (
                <div className="text-sm">
                  Terminal: <span className="font-medium">{flight.departure.terminal}</span>
                </div>
              )}
              {flight.departure.gate && (
                <div className="text-sm">
                  Gate: <span className="font-medium">{flight.departure.gate}</span>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Arrival</div>
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <div className="font-medium">{flight.arrival.airport} ({flight.arrival.iata})</div>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>{formatDate(flight.arrival.scheduled)}</div>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>{formatTime(flight.arrival.scheduled)}</div>
                {flight.arrival.actual && (
                  <div className="text-sm text-muted-foreground">
                    (Actual: {formatTime(flight.arrival.actual)})
                  </div>
                )}
              </div>
              {flight.arrival.terminal && (
                <div className="text-sm">
                  Terminal: <span className="font-medium">{flight.arrival.terminal}</span>
                </div>
              )}
              {flight.arrival.gate && (
                <div className="text-sm">
                  Gate: <span className="font-medium">{flight.arrival.gate}</span>
                </div>
              )}
              {flight.arrival.baggage && (
                <div className="text-sm">
                  Baggage: <span className="font-medium">{flight.arrival.baggage}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col space-y-2 rounded-lg bg-muted p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Plane className="h-4 w-4 text-muted-foreground" />
                <div className="text-sm font-medium">Flight Duration</div>
              </div>
              <div>{calculateDuration(flight.departure.scheduled, flight.arrival.scheduled)}</div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="text-sm font-medium">Status</div>
              </div>
              <div className={`font-medium ${
                flight.flight_status === "active" ? "text-green-600" :
                flight.flight_status === "scheduled" ? "text-blue-600" :
                flight.flight_status === "landed" ? "text-green-600" :
                flight.flight_status === "cancelled" ? "text-red-600" :
                flight.flight_status === "incident" ? "text-red-600" :
                flight.flight_status === "diverted" ? "text-yellow-600" :
                "text-gray-600"
              }`}>
                {flight.flight_status.charAt(0).toUpperCase() + flight.flight_status.slice(1)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="details">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="details">Flight Details</TabsTrigger>
          <TabsTrigger value="aircraft">Aircraft</TabsTrigger>
          {flight.live && <TabsTrigger value="live">Live Tracking</TabsTrigger>}
        </TabsList>
        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Airline</dt>
                  <dd className="mt-1">{flight.airline.name} ({flight.airline.iata})</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Flight Number</dt>
                  <dd className="mt-1">{flight.flight.iata || flight.flight.icao}</dd>
                </div>
                {flight.departure.delay && (
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Departure Delay</dt>
                    <dd className="mt-1">{flight.departure.delay} minutes</dd>
                  </div>
                )}
                {flight.arrival.delay && (
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Arrival Delay</dt>
                    <dd className="mt-1">{flight.arrival.delay} minutes</dd>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="aircraft" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {flight.aircraft?.model && (
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Aircraft Type</dt>
                    <dd className="mt-1">{flight.aircraft.model}</dd>
                  </div>
                )}
                {flight.aircraft?.registration && (
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Registration</dt>
                    <dd className="mt-1">{flight.aircraft.registration}</dd>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>
        </TabsContent>
        {flight.live && (
          <TabsContent value="live" className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center p-8">
                  <p className="text-muted-foreground">Live tracking data will be displayed here.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
} 