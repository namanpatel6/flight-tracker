"use client";

import Link from "next/link";
import { Flight } from "@/types/flight";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { formatDate, formatTime, calculateDuration, getStatusDescription } from "@/lib/utils";
import { Bell, BellOff, Plane, ArrowRight, Clock } from "lucide-react";

interface FlightCardProps {
  flight: Flight;
  isTracked: boolean;
  onTrack: () => void;
  onUntrack: () => void;
}

export function FlightCard({ flight, isTracked, onTrack, onUntrack }: FlightCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold">
                {flight.airline.name} {flight.flight.iata || flight.flight.icao}
              </h3>
              <p className="text-sm text-muted-foreground">
                {formatDate(flight.departure.scheduled)}
              </p>
            </div>
            <div className={`text-sm font-medium px-3 py-1 rounded-full ${
              flight.flight_status === "scheduled" ? "bg-blue-100 text-blue-800" :
              flight.flight_status === "active" ? "bg-green-100 text-green-800" :
              flight.flight_status === "landed" ? "bg-green-100 text-green-800" :
              flight.flight_status === "cancelled" ? "bg-red-100 text-red-800" :
              flight.flight_status === "incident" ? "bg-red-100 text-red-800" :
              flight.flight_status === "diverted" ? "bg-yellow-100 text-yellow-800" :
              "bg-gray-100 text-gray-800"
            }`}>
              {flight.flight_status.charAt(0).toUpperCase() + flight.flight_status.slice(1)}
            </div>
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
                <div className="font-medium">{flight.departure.airport} ({flight.departure.iata})</div>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>{formatTime(flight.departure.scheduled)}</div>
                {flight.departure.actual && flight.departure.actual !== flight.departure.scheduled && (
                  <div className="text-sm text-muted-foreground">
                    (Actual: {formatTime(flight.departure.actual)})
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
                <div className="font-medium">{flight.arrival.airport} ({flight.arrival.iata})</div>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>{formatTime(flight.arrival.scheduled)}</div>
                {flight.arrival.actual && flight.arrival.actual !== flight.arrival.scheduled && (
                  <div className="text-sm text-muted-foreground">
                    (Actual: {formatTime(flight.arrival.actual)})
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center text-sm text-muted-foreground">
            <Plane className="h-4 w-4 mr-2" />
            <span>Duration: {calculateDuration(flight.departure.scheduled, flight.arrival.scheduled)}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="bg-muted/50 p-4 flex justify-between">
        <Link href={`/flights/${flight.flight.iata || flight.flight.icao}`} passHref>
          <Button variant="secondary">View Details</Button>
        </Link>
        
        {isTracked ? (
          <Button variant="outline" onClick={onUntrack}>
            <BellOff className="h-4 w-4 mr-2" />
            Untrack
          </Button>
        ) : (
          <Button onClick={onTrack}>
            <Bell className="h-4 w-4 mr-2" />
            Track
          </Button>
        )}
      </CardFooter>
    </Card>
  );
} 