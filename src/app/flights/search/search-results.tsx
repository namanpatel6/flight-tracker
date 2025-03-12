"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Flight } from "@/types/flight";
import { FlightCard } from "@/components/flight-card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { searchFlights, getTrackedFlights, trackFlight, untrackFlight } from "@/lib/flight-api";

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
    if (session?.user?.id) {
      const fetchTrackedFlights = async () => {
        try {
          const trackedFlights = await getTrackedFlights(session.user.id);
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
    if (!session?.user?.id) {
      router.push("/api/auth/signin");
      return;
    }

    try {
      const success = await trackFlight(session.user.id, flightId);
      if (success) {
        setTrackedFlightIds(prev => new Set([...prev, flightId]));
      }
    } catch (err) {
      console.error("Error tracking flight:", err);
      setError("Failed to track flight. Please try again.");
    }
  };

  const handleUntrackFlight = async (flightId: string) => {
    if (!session?.user?.id) return;
    
    try {
      const success = await untrackFlight(session.user.id, flightId);
      if (success) {
        setTrackedFlightIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(flightId);
          return newSet;
        });
      }
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