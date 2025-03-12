"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Flight } from "@/types/flight";
import { FlightCard } from "@/components/flight-card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface SearchResultsProps {
  searchParams: {
    flightNumber?: string;
    airline?: string;
    departureAirport?: string;
    arrivalAirport?: string;
    date?: string;
  };
}

// Mock function for searchFlights until the real API is available
async function searchFlights(params: any): Promise<Flight[]> {
  // This is a placeholder that would be replaced with the actual implementation
  console.log("Searching flights with params:", params);
  return [];
}

// Mock function for getTrackedFlights until the real API is available
async function getTrackedFlights(): Promise<Flight[]> {
  // This is a placeholder that would be replaced with the actual implementation
  return [];
}

// Mock function for trackFlight until the real API is available
async function trackFlight(flightId: string): Promise<void> {
  // This is a placeholder that would be replaced with the actual implementation
  console.log("Tracking flight:", flightId);
}

// Mock function for untrackFlight until the real API is available
async function untrackFlight(flightId: string): Promise<void> {
  // This is a placeholder that would be replaced with the actual implementation
  console.log("Untracking flight:", flightId);
}

export function SearchResults({ searchParams }: SearchResultsProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [flights, setFlights] = useState<Flight[]>([]);
  const [trackedFlightIds, setTrackedFlightIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch flights based on search parameters
  useEffect(() => {
    const fetchFlights = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const results = await searchFlights(searchParams);
        setFlights(results);
      } catch (err) {
        console.error("Error fetching flights:", err);
        setError("Failed to fetch flights. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchFlights();
  }, [searchParams]);

  // Fetch tracked flights if user is logged in
  useEffect(() => {
    if (session?.user) {
      const fetchTrackedFlights = async () => {
        try {
          const trackedFlights = await getTrackedFlights();
          const trackedIds = new Set<string>(trackedFlights.map((flight: Flight) => flight.id));
          setTrackedFlightIds(trackedIds);
        } catch (err) {
          console.error("Error fetching tracked flights:", err);
        }
      };

      fetchTrackedFlights();
    }
  }, [session]);

  const handleTrackFlight = async (flightId: string) => {
    if (!session?.user) {
      router.push("/api/auth/signin");
      return;
    }

    try {
      await trackFlight(flightId);
      setTrackedFlightIds(prev => new Set([...prev, flightId]));
    } catch (err) {
      console.error("Error tracking flight:", err);
      setError("Failed to track flight. Please try again.");
    }
  };

  const handleUntrackFlight = async (flightId: string) => {
    try {
      await untrackFlight(flightId);
      setTrackedFlightIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(flightId);
        return newSet;
      });
    } catch (err) {
      console.error("Error untracking flight:", err);
      setError("Failed to untrack flight. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-48 rounded-lg bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (flights.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>No flights found matching your search criteria.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      {flights.map((flight) => (
        <FlightCard
          key={flight.id}
          flight={flight}
          isTracked={trackedFlightIds.has(flight.id)}
          onTrack={() => handleTrackFlight(flight.id)}
          onUntrack={() => handleUntrackFlight(flight.id)}
        />
      ))}
    </div>
  );
} 