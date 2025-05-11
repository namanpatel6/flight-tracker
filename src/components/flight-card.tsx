"use client";

import Link from "next/link";
import { Flight } from "@/types/flight";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { formatDateWithTimezone, calculateDuration, getStatusDescription } from "@/lib/utils";
import { Plane, ArrowRight, Clock, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface FlightCardProps {
  flight: Flight;
}

export function FlightCard({ flight }: FlightCardProps) {
  // Format dates for the URL - prioritize the flight_date field when available
  const departureDate = flight.flight_date || 
    (flight.departure.scheduled 
      ? flight.departure.scheduled.split('T')[0] 
      : new Date().toISOString().split('T')[0]);
  
  // For arrival date, use the next day if it's not specified
  const arrivalDate = flight.arrival.scheduled 
    ? flight.arrival.scheduled.split('T')[0]
    : departureDate; // Default to departure date if arrival date isn't available
  
  return (
    <Card className="hover:bg-muted/50 transition-all relative overflow-hidden group border-muted-foreground/20">
      {flight.flight_status && (
        <div className={cn(
          "absolute right-0 top-0 px-3 py-1 text-xs font-medium text-white",
          flight.flight_status === 'scheduled' && 'bg-blue-500',
          flight.flight_status === 'active' && 'bg-green-500',
          flight.flight_status === 'landed' && 'bg-orange-500',
          flight.flight_status === 'cancelled' && 'bg-red-500',
          flight.flight_status === 'incident' && 'bg-red-700',
          flight.flight_status === 'diverted' && 'bg-purple-500',
          flight.flight_status === 'unknown' && 'bg-gray-500',
          flight.flight_status === 'en-route' && 'bg-green-500',
          flight.flight_status === 'arrived' && 'bg-teal-500',
        )}>
          {flight.flight_status}
        </div>
      )}
      <CardContent className="p-0">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold">
                {flight.airline.name} {flight.flight.iata || flight.flight.icao}
              </h3>
              <p className="text-sm text-muted-foreground">
                {formatDateWithTimezone(flight.departure.scheduled, flight.flight_date)}
              </p>
              <p className="text-xs text-muted-foreground">All times in UTC</p>
            </div>
            {flight.flight_status && (
              <div className={cn(
                "flex items-center px-3 py-1 rounded-full text-sm font-medium",
                flight.flight_status === 'scheduled' && 'text-blue-700 bg-blue-50',
                flight.flight_status === 'active' && 'text-green-700 bg-green-50',
                flight.flight_status === 'landed' && 'text-orange-700 bg-orange-50',
                flight.flight_status === 'cancelled' && 'text-red-700 bg-red-50',
                flight.flight_status === 'incident' && 'text-red-700 bg-red-50',
                flight.flight_status === 'diverted' && 'text-purple-700 bg-purple-50',
                flight.flight_status === 'unknown' && 'text-gray-700 bg-gray-50',
                flight.flight_status === 'en-route' && 'text-green-700 bg-green-50',
                flight.flight_status === 'arrived' && 'text-teal-700 bg-teal-50',
              )}>
                <AlertCircle className="h-4 w-4 mr-2" />
                <span>{flight.flight_status}</span>
              </div>
            )}
          </div>

          {/* Display price information if available */}
          {flight.price && (
            <div className="mb-4 py-1 px-3 bg-green-50 border border-green-200 rounded-md inline-flex items-center">
              <span className="font-medium text-green-700">{flight.price.formatted}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-7 gap-4 items-center">
            <div className="md:col-span-3 space-y-1">
              <div className="text-sm text-muted-foreground">Departure</div>
              <div className="flex items-center space-x-2">
                <div className="font-medium">
                  {flight.departure.iata}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>{formatDateWithTimezone(flight.departure.scheduled, flight.flight_date)}</div>
                {flight.departure.actual && flight.departure.actual !== flight.departure.scheduled && (
                  <div className="text-sm text-muted-foreground">
                    (Actual: {formatDateWithTimezone(flight.departure.actual, flight.flight_date)})
                  </div>
                )}
              </div>
            </div>

            <div className="md:col-span-1 flex justify-center">
              <div className="relative">
                <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-muted"></div>
                <ArrowRight className="relative z-10 text-primary" />
              </div>
            </div>

            <div className="md:col-span-3 space-y-1">
              <div className="text-sm text-muted-foreground">Arrival</div>
              <div className="flex items-center space-x-2">
                <div className="font-medium">
                  {flight.arrival.iata}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>{formatDateWithTimezone(flight.arrival.scheduled, flight.flight_date)}</div>
                {flight.arrival.actual && flight.arrival.actual !== flight.arrival.scheduled && (
                  <div className="text-sm text-muted-foreground">
                    (Actual: {formatDateWithTimezone(flight.arrival.actual, flight.flight_date)})
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center text-sm text-muted-foreground">
            <Plane className="h-4 w-4 mr-2" />
            <span>Duration: {calculateDuration(flight.departure.scheduled, flight.arrival.scheduled, flight.flight_date)}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="bg-muted/50 p-4 flex justify-end">
        <Link 
          href={{
            pathname: `/flights/${encodeURIComponent(flight.flight.iata || flight.flight.icao || '')}/${encodeURIComponent(departureDate)}/${encodeURIComponent(arrivalDate)}`,
            query: {
              dep_iata: flight.departure.iata,
              arr_iata: flight.arrival.iata
            }
          }}
          passHref
        >
          <Button variant="secondary">View Details</Button>
        </Link>
      </CardFooter>
    </Card>
  );
} 