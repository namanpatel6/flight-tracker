"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Flight } from "@/types/flight";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate, formatTime, calculateDuration, getStatusDescription } from "@/lib/utils";
import { AlertCircle, Bell, BellOff, Plane, Calendar, Clock, MapPin } from "lucide-react";
import { Alert as AlertType, createAlert, deleteAlert, getUserAlerts } from "@/lib/alerts";

interface FlightDetailsProps {
  flight: Flight;
}

export function FlightDetails({ flight }: FlightDetailsProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [isTracking, setIsTracking] = useState(false);
  const [alertId, setAlertId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (session?.user) {
      const checkIfTracking = async () => {
        try {
          const alerts = await getUserAlerts();
          const flightAlert = alerts.find((alert: AlertType) => alert.flightId === flight.id);
          if (flightAlert) {
            setIsTracking(true);
            setAlertId(flightAlert.id);
          }
        } catch (err) {
          console.error("Error checking alert status:", err);
        }
      };
      
      checkIfTracking();
    }
  }, [session, flight.id]);

  const handleTrackFlight = async () => {
    if (!session?.user) {
      router.push("/api/auth/signin");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (isTracking && alertId) {
        await deleteAlert(alertId);
        setIsTracking(false);
        setAlertId(null);
      } else {
        const alert = await createAlert({
          flightId: flight.id,
          type: "STATUS_CHANGE",
          active: true
        });
        setIsTracking(true);
        setAlertId(alert.id);
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
              {flight.airline} {flight.flightNumber}
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
                <div className="font-medium">{flight.departureAirport}</div>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>{formatDate(flight.departureTime)}</div>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>{formatTime(flight.departureTime)}</div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Arrival</div>
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <div className="font-medium">{flight.arrivalAirport}</div>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>{formatDate(flight.arrivalTime)}</div>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>{formatTime(flight.arrivalTime)}</div>
              </div>
            </div>
          </div>

          <div className="flex flex-col space-y-2 rounded-lg bg-muted p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Plane className="h-4 w-4 text-muted-foreground" />
                <div className="text-sm font-medium">Flight Duration</div>
              </div>
              <div>{calculateDuration(flight.departureTime, flight.arrivalTime)}</div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="text-sm font-medium">Status</div>
              </div>
              <div className={`font-medium ${
                flight.status === "ON_TIME" ? "text-green-600" :
                flight.status === "DELAYED" ? "text-yellow-600" :
                flight.status === "CANCELLED" ? "text-red-600" :
                "text-blue-600"
              }`}>
                {getStatusDescription(flight.status)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="details">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="details">Flight Details</TabsTrigger>
          <TabsTrigger value="aircraft">Aircraft</TabsTrigger>
          <TabsTrigger value="history">Flight History</TabsTrigger>
        </TabsList>
        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Terminal</dt>
                  <dd className="mt-1">{flight.terminal || "Not available"}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Gate</dt>
                  <dd className="mt-1">{flight.gate || "Not available"}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Baggage Claim</dt>
                  <dd className="mt-1">{flight.baggageClaim || "Not available"}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Seat Map</dt>
                  <dd className="mt-1">
                    <Button variant="link" className="p-0">View Seat Map</Button>
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="aircraft" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Aircraft Type</dt>
                  <dd className="mt-1">{flight.aircraft || "Boeing 737-800"}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Registration</dt>
                  <dd className="mt-1">N12345</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Age</dt>
                  <dd className="mt-1">7.5 years</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Seating Capacity</dt>
                  <dd className="mt-1">189 passengers</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-muted-foreground">
                Flight history data is not available for this flight.
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 