"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Flight } from "@/types/flight";
import { FlightCard } from "@/components/flight-card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface SearchParamsType {
  flight_iata?: string;
  airline_iata?: string;
  dep_iata?: string;
  arr_iata?: string;
  flight_date?: string;
}

interface SearchResultsProps {
  searchParams: SearchParamsType | Promise<SearchParamsType>;
}

export function SearchResults({ searchParams }: SearchResultsProps) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [flights, setFlights] = useState<Flight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resolvedParams, setResolvedParams] = useState<SearchParamsType | null>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=' + encodeURIComponent('/flights/results'));
    }
  }, [status, router]);

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
    if (!resolvedParams || status !== 'authenticated') return;

    const fetchFlights = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Check if we have any search parameters to prevent unnecessary API calls
        const hasSearchParams = !!(
          resolvedParams.flight_iata || 
          resolvedParams.airline_iata || 
          resolvedParams.dep_iata ||
          resolvedParams.arr_iata ||
          resolvedParams.flight_date
        );
        
        if (!hasSearchParams) {
          console.log("No search parameters provided, skipping API call");
          setFlights([]);
          setLoading(false);
          return;
        }
        
        // Build query parameters for the API call
        const queryParams = new URLSearchParams();
        
        if (resolvedParams.flight_iata) {
          queryParams.append("flight_iata", resolvedParams.flight_iata);
        }
        
        if (resolvedParams.airline_iata) {
          queryParams.append("airline_iata", resolvedParams.airline_iata);
        }
        
        if (resolvedParams.dep_iata) {
          queryParams.append("dep_iata", resolvedParams.dep_iata);
        }
        
        if (resolvedParams.arr_iata) {
          queryParams.append("arr_iata", resolvedParams.arr_iata);
        }
        
        if (resolvedParams.flight_date) {
          queryParams.append("flight_date", resolvedParams.flight_date);
        }
        
        console.log("Making API request with params:", Object.fromEntries(queryParams.entries()));
        
        // Make API request to our internal API route
        const response = await fetch(`/api/flights/search?${queryParams.toString()}`);
        
        if (!response.ok) {
          if (response.status === 401) {
            // Handle unauthorized specifically
            router.push('/auth/signin?callbackUrl=' + encodeURIComponent('/flights/results'));
            return;
          }
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
  }, [resolvedParams, status, router]);

  // Show loading during authentication check
  if (status === 'loading') {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-48 rounded-lg bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  // Show authentication required message
  if (status === 'unauthenticated') {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex flex-col items-center justify-center gap-4">
          <ShieldAlert className="h-16 w-16 text-amber-500" />
          <h2 className="text-xl font-semibold">Authentication Required</h2>
          <p className="text-center text-muted-foreground mb-4">
            Please sign in to search for flights
          </p>
          <Button onClick={() => router.push('/auth/signin?callbackUrl=' + encodeURIComponent('/flights/results'))}>
            Sign In
          </Button>
        </div>
      </div>
    );
  }

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
        />
      ))}
    </div>
  );
} 