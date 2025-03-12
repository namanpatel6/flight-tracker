"use client";

import Link from "next/link";
import { Flight } from "@/types/flight";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { formatDate, formatTime, calculateDuration, getStatusDescription } from "@/lib/utils";
import { Bell, BellOff, Plane, ArrowRight, Calendar, Clock } from "lucide-react";

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
                {flight.airline} {flight.flightNumber}
              </h3>
              <p className="text-sm text-muted-foreground">
                {formatDate(flight.departureTime)}
              </p>
            </div>
            <div className={`text-sm font-medium px-3 py-1 rounded-full ${
              flight.status === "ON_TIME" ? "bg-green-100 text-green-800" :
              flight.status === "DELAYED" ? "bg-yellow-100 text-yellow-800" :
              flight.status === "CANCELLED" ? "bg-red-100 text-red-800" :
              "bg-blue-100 text-blue-800"
            }`}>
              {getStatusDescription(flight.status)}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-7 gap-4 items-center">
            <div className="md:col-span-3 space-y-1">
              <div className="text-sm text-muted-foreground">Departure</div>
              <div className="flex items-center space-x-2">
                <div className="font-medium">{flight.departureAirport}</div>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>{formatTime(flight.departureTime)}</div>
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
                <div className="font-medium">{flight.arrivalAirport}</div>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>{formatTime(flight.arrivalTime)}</div>
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center text-sm text-muted-foreground">
            <Plane className="h-4 w-4 mr-2" />
            <span>Duration: {calculateDuration(flight.departureTime, flight.arrivalTime)}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="bg-muted/50 p-4 flex justify-between">
        <Link href={`/flights/${flight.flightNumber}`} passHref>
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