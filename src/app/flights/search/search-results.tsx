"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { FlightCard } from "@/components/flights/flight-card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Flight } from "@/lib/flight-api";

interface SearchResultsProps {
  searchParams: {
    flightNumber?: string;
    airline?: string;
    departureAirport?: string;
    arrivalAirport?: string;
    date?: string;
  };
}

export function SearchResults({ searchParams }: SearchResultsProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [flights, setFlights] = useState<Flight[]>([]);
  const [trackedFlightIds, setTrackedFlightIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch flights based on search parameters
  useEffect(() => {
    async function fetchFlights() {
      setIsLoading(true);
      setError(null);

      try {
        // Build search query
        const queryParams = new URLSearchParams();
        
        if (searchParams.flightNumber) {
          queryParams.append("flightNumber", searchParams.flightNumber);
        }
        
        if (searchParams.airline) {
          queryParams.append("airline", searchParams.airline);
        }
        
        if (searchParams.departureAirport) {
          queryParams.append("departureAirport", searchParams.departureAirport);
        }
        
        if (searchParams.arrivalAirport) {
          queryParams.append("arrivalAirport", searchParams.arrivalAirport);
        }
        
        if (searchParams.date) {
          queryParams.append("date", searchParams.date);
        }

        // Fetch flights
        const response = await fetch(`/api/flights/search?${queryParams.toString()}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to fetch flights");
        }

        setFlights(data.flights || []);
      } catch (err: any) {
        console.error("Error fetching flights:", err);
        setError(err.message || "Failed to fetch flights");
      } finally {
        setIsLoading(false);
      }
    }

    fetchFlights();
  }, [searchParams]);

  // Fetch tracked flights if user is logged in
  useEffect(() => {
    if (!session?.user) return;

    async function fetchTrackedFlights() {
      try {
        const response = await fetch("/api/tracked-flights");
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to fetch tracked flights");
        }

        // Create a set of tracked flight numbers for easy lookup
        const trackedIds = new Set(
          data.trackedFlights.map((flight: any) => flight.flightNumber)
        );
        
        setTrackedFlightIds(trackedIds);
      } catch (err) {
        console.error("Error fetching tracked flights:", err);
      }
    }

    fetchTrackedFlights();
  }, [session]);

  // Track a flight
  const handleTrackFlight = async (flight: Flight) => {
    if (!session?.user) {
      // Redirect to login if not logged in
      router.push("/auth/signin");
      return;
    }

    try {
      const response = await fetch("/api/tracked-flights", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          flightNumber: flight.flightNumber,
          airline: flight.airline,
          departureAirport: flight.departureAirport,
          arrivalAirport: flight.arrivalAirport,
          departureTime: flight.departureTime,
          arrivalTime: flight.arrivalTime,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to track flight");
      }

      // Update tracked flights
      setTrackedFlightIds(prev => new Set([...prev, flight.flightNumber]));
    } catch (err) {
      console.error("Error tracking flight:", err);
    }
  };

  // Untrack a flight
  const handleUntrackFlight = async (flight: Flight) => {
    if (!session?.user) return;

    try {
      // First, we need to get the tracked flight ID
      const response = await fetch("/api/tracked-flights");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch tracked flights");
      }

      // Find the tracked flight with matching flight number
      const trackedFlight = data.trackedFlights.find(
        (tf: any) => tf.flightNumber === flight.flightNumber
      );

      if (!trackedFlight) {
        throw new Error("Flight not found in tracked flights");
      }

      // Delete the tracked flight
      const deleteResponse = await fetch(`/api/tracked-flights/${trackedFlight.id}`, {
        method: "DELETE",
      });

      if (!deleteResponse.ok) {
        const deleteData = await deleteResponse.json();
        throw new Error(deleteData.message || "Failed to untrack flight");
      }

      // Update tracked flights
      setTrackedFlightIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(flight.flightNumber);
        return newSet;
      });
    } catch (err) {
      console.error("Error untracking flight:", err);
    }
  };

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!isLoading && flights.length === 0) {
    return (
      <Alert>
        <AlertTitle>No flights found</AlertTitle>
        <AlertDescription>
          No flights match your search criteria. Please try different search parameters.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      {flights.map((flight) => (
        <FlightCard
          key={flight.flightNumber}
          flight={flight}
          isTracked={trackedFlightIds.has(flight.flightNumber)}
          onTrack={() => handleTrackFlight(flight)}
          onUntrack={() => handleUntrackFlight(flight)}
        />
      ))}
    </div>
  );
} 