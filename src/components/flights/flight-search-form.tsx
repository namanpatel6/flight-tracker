"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Search, Plane, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/custom-ui";

// Flight Search Form Component
export function FlightSearchForm() {
  const router = useRouter();
  const { data: session, status } = useSession();
  
  // State for form values
  const [flightNumber, setFlightNumber] = useState("");
  const [originAirport, setOriginAirport] = useState("");
  const [destinationAirport, setDestinationAirport] = useState("");
  const [departureDate, setDepartureDate] = useState<Date | undefined>(undefined);
  
  // State for errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Handle authentication
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=' + encodeURIComponent('/flights/results'));
    }
  }, [status, router]);

  // Validate form before submission
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!flightNumber.trim()) {
      newErrors.flightNumber = "Flight number is required";
    }
    if (!originAirport.trim()) {
      newErrors.originAirport = "Origin airport is required";
    }
    if (!destinationAirport.trim()) {
      newErrors.destinationAirport = "Destination airport is required";
    }
    if (!departureDate) {
      newErrors.departureDate = "Date is required";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Verify user is authenticated first
    if (status !== 'authenticated') {
      router.push('/auth/signin?callbackUrl=' + encodeURIComponent('/flights/results'));
      return;
    }
    
    if (!validateForm()) {
      return;
    }
    
    // Build query parameters
    const params = new URLSearchParams();
    
    params.append("flight_iata", flightNumber);
    params.append("dep_iata", originAirport);
    params.append("arr_iata", destinationAirport);
    if (departureDate) {
      params.append("flight_date", departureDate.toISOString().split("T")[0]);
    }
    
    // Navigate to search results page
    router.push(`/flights/results?${params.toString()}`);
  };

  // Show authentication required message
  if (status === 'unauthenticated') {
    return (
      <div className="w-full bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col items-center justify-center gap-4">
          <ShieldAlert className="h-12 w-12 text-amber-500" />
          <h2 className="text-lg font-semibold">Authentication Required</h2>
          <p className="text-center text-muted-foreground mb-2">
            Please sign in to search for flights
          </p>
          <Button onClick={() => router.push('/auth/signin?callbackUrl=' + encodeURIComponent('/flights/results'))}>
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-4 text-center">
        Search Flights
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Flight Number</label>
          <Input
            value={flightNumber}
            onChange={(e) => setFlightNumber(e.target.value)}
            placeholder="e.g. BA123"
            className={errors.flightNumber ? "border-red-500" : ""}
          />
          {errors.flightNumber && (
            <p className="text-xs text-red-500">{errors.flightNumber}</p>
          )}
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Origin Airport</label>
            <Input
              value={originAirport}
              onChange={(e) => setOriginAirport(e.target.value.toUpperCase())}
              placeholder="e.g. DFW"
              className={errors.originAirport ? "border-red-500" : ""}
              maxLength={3}
            />
            {errors.originAirport && (
              <p className="text-xs text-red-500">{errors.originAirport}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Destination Airport</label>
            <Input
              value={destinationAirport}
              onChange={(e) => setDestinationAirport(e.target.value.toUpperCase())}
              placeholder="e.g. JFK"
              className={errors.destinationAirport ? "border-red-500" : ""}
              maxLength={3}
            />
            {errors.destinationAirport && (
              <p className="text-xs text-red-500">{errors.destinationAirport}</p>
            )}
          </div>
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">Date (UTC)</label>
          <DatePicker
            value={departureDate}
            onChange={setDepartureDate}
            placeholder="Select date (UTC)"
            className={errors.departureDate ? "border-red-500" : ""}
          />
          {errors.departureDate && (
            <p className="text-xs text-red-500">{errors.departureDate}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Times are displayed in UTC. Flight schedules use UTC for international consistency.
          </p>
        </div>
        
        <Button type="submit" className="w-full">
          Search Flights
        </Button>
      </form>
    </div>
  );
} 