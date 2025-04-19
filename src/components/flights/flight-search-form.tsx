"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, Plane } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/custom-ui";

// Flight Search Form Component
export function FlightSearchForm() {
  const router = useRouter();
  
  // State for form values
  const [flightNumber, setFlightNumber] = useState("");
  const [departureDate, setDepartureDate] = useState<Date | undefined>(undefined);
  
  // State for errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Validate form before submission
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!flightNumber.trim()) {
      newErrors.flightNumber = "Flight number is required";
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
    
    if (!validateForm()) {
      return;
    }
    
    // Build query parameters
    const params = new URLSearchParams();
    
    params.append("flight_iata", flightNumber);
    if (departureDate) {
      params.append("flight_date", departureDate.toISOString().split("T")[0]);
    }
    
    // Navigate to search results page
    router.push(`/flights/results?${params.toString()}`);
  };

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
        
        <div className="space-y-2">
          <label className="text-sm font-medium">Date</label>
          <DatePicker
            value={departureDate}
            onChange={setDepartureDate}
            placeholder="Select date"
            className={errors.departureDate ? "border-red-500" : ""}
            minDate={new Date()}
          />
          {errors.departureDate && (
            <p className="text-xs text-red-500">{errors.departureDate}</p>
          )}
        </div>
        
        <Button type="submit" className="w-full">
          Search Flights
        </Button>
      </form>
    </div>
  );
} 