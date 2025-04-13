"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Flight } from "@/types/flight";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateWithTimezone, calculateDuration, getStatusDescription } from "@/lib/utils";
import { Plane, Calendar, Clock, MapPin, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface FlightDetailsProps {
  flight: Flight;
}

export function FlightDetails({ flight }: FlightDetailsProps) {
  const searchParams = useSearchParams();
  const [departureScheduled, setDepartureScheduled] = useState<string | null>(null);
  const [departureActual, setDepartureActual] = useState<string | null>(null);
  const [arrivalScheduled, setArrivalScheduled] = useState<string | null>(null);
  const [arrivalActual, setArrivalActual] = useState<string | null>(null);
  
  useEffect(() => {
    // Get flight times from URL if available
    const depScheduledParam = searchParams.get('departureScheduled');
    if (depScheduledParam) {
      setDepartureScheduled(depScheduledParam);
    }
    
    const depActualParam = searchParams.get('departureActual');
    if (depActualParam) {
      setDepartureActual(depActualParam);
    }
    
    const arrScheduledParam = searchParams.get('arrivalScheduled');
    if (arrScheduledParam) {
      setArrivalScheduled(arrScheduledParam);
    }
    
    const arrActualParam = searchParams.get('arrivalActual');
    if (arrActualParam) {
      setArrivalActual(arrActualParam);
    }
  }, [searchParams]);

  // Ensure we have valid values for scheduled times
  const depScheduled = departureScheduled || (flight.departure.scheduled || "");
  const arrScheduled = arrivalScheduled || (flight.arrival.scheduled || "");
  
  // Safely handle actual times which may be undefined
  const depActual = departureActual || (flight.departure.actual || "");
  const arrActual = arrivalActual || (flight.arrival.actual || "");
  
  // Check if we have actual departure/arrival times to display
  const hasDepActual = !!departureActual || !!flight.departure.actual;
  const hasArrActual = !!arrivalActual || !!flight.arrival.actual;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold">
              {flight.airline.name} {flight.flight.iata || flight.flight.icao}
            </CardTitle>
            {flight.flight_status && (
              <div className={cn(
                "px-4 py-2 rounded-md text-sm font-medium",
                flight.flight_status === 'scheduled' && 'bg-blue-100 text-blue-800',
                flight.flight_status === 'active' && 'bg-green-100 text-green-800',
                flight.flight_status === 'landed' && 'bg-orange-100 text-orange-800',
                flight.flight_status === 'cancelled' && 'bg-red-100 text-red-800',
                flight.flight_status === 'incident' && 'bg-red-100 text-red-800',
                flight.flight_status === 'diverted' && 'bg-purple-100 text-purple-800',
                flight.flight_status === 'unknown' && 'bg-gray-100 text-gray-800',
                flight.flight_status === 'en-route' && 'bg-green-100 text-green-800',
                flight.flight_status === 'arrived' && 'bg-teal-100 text-teal-800',
              )}>
                <div className="flex items-center">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  <span className="uppercase font-bold">{flight.flight_status}</span>
                </div>
                {flight.flight_status && (
                  <div className="text-xs mt-1">{getStatusDescription(flight.flight_status)}</div>
                )}
              </div>
            )}
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
                <div>Scheduled: {formatDateWithTimezone(depScheduled)}</div>
              </div>
              {hasDepActual && (
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>Actual: {formatDateWithTimezone(depActual)}</div>
                </div>
              )}
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
                <div>Scheduled: {formatDateWithTimezone(arrScheduled)}</div>
              </div>
              {hasArrActual && (
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>Actual: {formatDateWithTimezone(arrActual)}</div>
                </div>
              )}
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
              <div>{calculateDuration(depScheduled, arrScheduled)}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 