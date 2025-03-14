"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Flight } from "@/types/flight";
import { FlightCard } from "@/components/flight-card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { getTrackedFlights, trackFlight, untrackFlight } from "@/lib/flight-api";

interface SearchParamsType {
  type?: string;
  flightNumber?: string;
  airline?: string;
  from?: string;
  to?: string;
  departureDate?: string;
  returnDate?: string;
  tripType?: string;
  passengers?: string;
  cabinClass?: string;
  directOnly?: string;
  flexible?: string;
}

interface SearchResultsProps {
  searchParams: SearchParamsType | Promise<SearchParamsType>;
}

export function SearchResults({ searchParams }: SearchResultsProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [flights, setFlights] = useState<Flight[]>([]);
  const [trackedFlightIds, setTrackedFlightIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resolvedParams, setResolvedParams] = useState<SearchParamsType | null>(null);

  // Resolve the searchParams Promise
  useEffect(() => {
    const resolveParams = async () => {
      try {
        if (searchParams instanceof Promise) {
          const resolved = await searchParams;
          setResolvedParams(resolved);
        } else {
          setResolvedParams(searchParams);
        }
      } catch (err) {
        console.error("Error resolving search params:", err);
        setError("Failed to load search parameters. Please try again.");
        setLoading(false);
      }
    };

    resolveParams();
  }, [searchParams]);

  // Fetch flights based on search parameters
  useEffect(() => {
    if (!resolvedParams) return;

    const fetchFlights = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Check if we have any search parameters to prevent unnecessary API calls
        const hasSearchParams = !!(
          resolvedParams.flightNumber || 
          resolvedParams.airline || 
          resolvedParams.from || 
          resolvedParams.to || 
          resolvedParams.departureDate
        );
        
        if (!hasSearchParams) {
          console.log("No search parameters provided, skipping API call");
          setFlights([]);
          setLoading(false);
          return;
        }
        
        // Build query parameters for the API call
        const queryParams = new URLSearchParams();
        
        if (resolvedParams.flightNumber) {
          queryParams.append("flight_iata", resolvedParams.flightNumber);
        }
        
        if (resolvedParams.airline) {
          queryParams.append("airline_iata", resolvedParams.airline);
        }
        
        if (resolvedParams.from) {
          queryParams.append("dep_iata", resolvedParams.from);
        }
        
        if (resolvedParams.to) {
          queryParams.append("arr_iata", resolvedParams.to);
        }
        
        if (resolvedParams.departureDate) {
          queryParams.append("arr_scheduled_time_dep", resolvedParams.departureDate);
        }
        
        if (resolvedParams.returnDate) {
          queryParams.append("arr_scheduled_time_arr", resolvedParams.returnDate);
        }
        
        console.log("Making API request with params:", Object.fromEntries(queryParams.entries()));
        
        // Make API request to our internal API route
        const response = await fetch(`/api/flights/search?${queryParams.toString()}`);
        
        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`);
        }
        
        const data = await response.json();
        setFlights(data.flights || []);
      } catch (err) {
        console.error("Error fetching flights:", err);
        setError("Failed to fetch flights. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchFlights();
  }, [resolvedParams]);

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

  if (!resolvedParams) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-48 rounded-lg bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

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