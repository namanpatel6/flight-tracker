"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Flight } from "@/lib/flight-api";
import { formatDate, formatTime } from "@/lib/utils";

interface FlightCardProps {
  flight: Flight;
  isTracked?: boolean;
  onTrack?: () => void;
  onUntrack?: () => void;
}

export function FlightCard({ flight, isTracked, onTrack, onUntrack }: FlightCardProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleViewDetails = () => {
    router.push(`/flights/${flight.flightNumber}`);
  };

  const handleTrack = async () => {
    if (isLoading) return;
    setIsLoading(true);
    
    try {
      if (onTrack) {
        await onTrack();
      }
    } catch (error) {
      console.error("Error tracking flight:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUntrack = async () => {
    if (isLoading) return;
    setIsLoading(true);
    
    try {
      if (onUntrack) {
        await onUntrack();
      }
    } catch (error) {
      console.error("Error untracking flight:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Determine status badge color
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "scheduled":
        return "bg-blue-100 text-blue-800";
      case "on time":
        return "bg-green-100 text-green-800";
      case "delayed":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "landed":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl">{flight.airline}</CardTitle>
            <CardDescription>Flight {flight.flightNumber}</CardDescription>
          </div>
          <Badge className={getStatusColor(flight.status)}>{flight.status}</Badge>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Departure</p>
            <p className="font-medium">{flight.departureAirport}</p>
            <p className="text-sm">{formatTime(flight.departureTime)}</p>
            <p className="text-xs text-muted-foreground">{formatDate(flight.departureTime)}</p>
            {flight.terminal && <p className="text-xs">Terminal: {flight.terminal}</p>}
            {flight.gate && <p className="text-xs">Gate: {flight.gate}</p>}
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Arrival</p>
            <p className="font-medium">{flight.arrivalAirport}</p>
            <p className="text-sm">{formatTime(flight.arrivalTime)}</p>
            <p className="text-xs text-muted-foreground">{formatDate(flight.arrivalTime)}</p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between pt-2">
        <Button variant="outline" onClick={handleViewDetails}>
          View Details
        </Button>
        {isTracked ? (
          <Button variant="destructive" onClick={handleUntrack} disabled={isLoading}>
            {isLoading ? "Loading..." : "Untrack"}
          </Button>
        ) : (
          <Button onClick={handleTrack} disabled={isLoading}>
            {isLoading ? "Loading..." : "Track Flight"}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
} 