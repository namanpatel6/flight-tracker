import Link from "next/link";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatTime, calculateDuration } from "@/lib/utils";
import { Plane, Clock, Calendar, ArrowRight } from "lucide-react";
import { Flight } from "@/lib/flight-api";

interface FlightCardProps {
  flight: Flight;
  isTracked?: boolean;
  onTrack?: (flightId: string) => void;
  onUntrack?: (flightId: string) => void;
  isLoading?: boolean;
}

export function FlightCard({
  flight,
  isTracked = false,
  onTrack,
  onUntrack,
  isLoading = false,
}: FlightCardProps) {
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
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-semibold">{flight.airline}</h3>
              <p className="text-sm text-muted-foreground">Flight {flight.flightNumber}</p>
            </div>
            <Badge className={getStatusColor(flight.status)}>{flight.status}</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Departure */}
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Departure</p>
              <p className="font-medium">{flight.departureAirport}</p>
              <div className="flex items-center text-sm">
                <Clock className="mr-1 h-3 w-3" />
                {formatTime(flight.departureTime)}
              </div>
              <div className="flex items-center text-sm">
                <Calendar className="mr-1 h-3 w-3" />
                {formatDate(flight.departureTime)}
              </div>
            </div>

            {/* Flight Duration */}
            <div className="flex flex-col items-center justify-center">
              <div className="text-sm text-muted-foreground mb-1">
                {calculateDuration(flight.departureTime, flight.arrivalTime)}
              </div>
              <div className="relative w-full flex items-center justify-center">
                <div className="h-[1px] bg-gray-200 w-full"></div>
                <div className="absolute">
                  <Plane className="h-4 w-4 text-primary" />
                </div>
              </div>
              <div className="flex justify-between w-full mt-1">
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
              </div>
            </div>

            {/* Arrival */}
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Arrival</p>
              <p className="font-medium">{flight.arrivalAirport}</p>
              <div className="flex items-center text-sm">
                <Clock className="mr-1 h-3 w-3" />
                {formatTime(flight.arrivalTime)}
              </div>
              <div className="flex items-center text-sm">
                <Calendar className="mr-1 h-3 w-3" />
                {formatDate(flight.arrivalTime)}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between p-4 pt-0 border-t">
        <Link href={`/flights/${flight.flightNumber}`} passHref>
          <Button variant="outline">View Details</Button>
        </Link>
        
        {onTrack && onUntrack && (
          isTracked ? (
            <Button 
              variant="destructive" 
              onClick={() => onUntrack(flight.id)} 
              disabled={isLoading}
            >
              {isLoading ? "Loading..." : "Untrack"}
            </Button>
          ) : (
            <Button 
              onClick={() => onTrack(flight.id)} 
              disabled={isLoading}
            >
              {isLoading ? "Loading..." : "Track Flight"}
            </Button>
          )
        )}
      </CardFooter>
    </Card>
  );
} 