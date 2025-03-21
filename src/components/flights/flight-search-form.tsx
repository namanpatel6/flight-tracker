"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, Plane } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Dropdown, 
  DatePicker,
  type DropdownOption
} from "@/components/custom-ui";
import { Checkbox } from "@/components/ui/checkbox";

// Types
export type Airline = DropdownOption;

// Flight Search Form Component
export function FlightSearchForm() {
  const router = useRouter();
  
  // State for form values
  const [flightNumber, setFlightNumber] = useState("");
  const [airline, setAirline] = useState<Airline | null>(null);
  const [departureDate, setDepartureDate] = useState<Date | undefined>(undefined);
  
  // State for loading and data
  const [isLoadingAirlines, setIsLoadingAirlines] = useState(false);
  const [airlines, setAirlines] = useState<Airline[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Add state for including prices
  const [includePrices, setIncludePrices] = useState(false);

  // Fetch airlines on component mount
  useEffect(() => {
    fetchAirlines();
  }, []);

  // Fetch airlines from API
  const fetchAirlines = async () => {
    setIsLoadingAirlines(true);
    try {
      const response = await fetch("/api/airlines");
      if (!response.ok) {
        throw new Error("Failed to fetch airlines");
      }
      const data = await response.json();
      
      // The API already returns data in the correct format
      setAirlines(data);
      
      console.log("Airlines data:", data); // For debugging
    } catch (error) {
      console.error("Error fetching airlines:", error);
      // Fallback data for development
      setAirlines([
        { value: "ba", label: "British Airways", code: "BA" },
        { value: "aa", label: "American Airlines", code: "AA" },
        { value: "dl", label: "Delta Air Lines", code: "DL" },
        { value: "af", label: "Air France", code: "AF" },
        { value: "jl", label: "Japan Airlines", code: "JL" }
      ]);
    } finally {
      setIsLoadingAirlines(false);
    }
  };

  // Validate form before submission
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!flightNumber.trim()) {
      newErrors.flightNumber = "Flight number is required";
    }
    if (!airline) {
      newErrors.airline = "Airline is required";
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
    params.append("airline_iata", airline?.code || "");
    if (departureDate) {
      params.append("flight_date", departureDate.toISOString().split("T")[0]);
    }
    params.append("include_prices", includePrices.toString());
    
    // Navigate to search results page
    router.push(`/flights/results?${params.toString()}`);
  };

  return (
    <div className="w-full bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-4 text-center">
        Search Flights
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Airline</label>
            <Dropdown
              options={airlines}
              value={airline}
              onChange={setAirline}
              placeholder="Select airline"
              isLoading={isLoadingAirlines}
              searchPlaceholder="Search airlines..."
              noResultsText="No airlines found"
              loadingText="Loading airlines..."
              className={errors.airline ? "border-red-500" : ""}
            />
            {errors.airline && (
              <p className="text-xs text-red-500">{errors.airline}</p>
            )}
          </div>
          
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
        
        {/* Add checkbox for prices */}
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="include_prices" 
            checked={includePrices}
            onCheckedChange={(checked) => setIncludePrices(checked as boolean)}
          />
          <label 
            htmlFor="include_prices" 
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Include price information (may slow down search)
          </label>
        </div>
        
        <Button type="submit" className="w-full">
          Search Flights
        </Button>
      </form>
    </div>
  );
} 