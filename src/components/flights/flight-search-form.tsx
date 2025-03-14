"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, Plane } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { 
  Dropdown, 
  DatePicker, 
  RadioGroup, 
  Checkbox, 
  Select,
  type DropdownOption
} from "@/components/custom-ui";
import { cn } from "@/lib/utils";

// Types
export type Airport = DropdownOption;
export type Airline = DropdownOption;

export type TripType = "oneWay" | "roundTrip";

export type CabinClass = "economy" | "premiumEconomy" | "business" | "first";

// Flight Search Form Component
export function FlightSearchForm() {
  const router = useRouter();
  
  // State for form values
  const [searchType, setSearchType] = useState<"route" | "flightNumber">("route");
  const [flightNumber, setFlightNumber] = useState("");
  const [airline, setAirline] = useState<Airline | null>(null);
  const [fromAirport, setFromAirport] = useState<Airport | null>(null);
  const [toAirport, setToAirport] = useState<Airport | null>(null);
  const [departureDate, setDepartureDate] = useState<Date | undefined>(undefined);
  const [returnDate, setReturnDate] = useState<Date | undefined>(undefined);
  const [tripType, setTripType] = useState<TripType>("oneWay");
  const [passengerCount, setPassengerCount] = useState("1");
  const [cabinClass, setCabinClass] = useState<CabinClass>("economy");
  const [directFlightsOnly, setDirectFlightsOnly] = useState(false);
  const [flexibleDates, setFlexibleDates] = useState(false);
  
  // State for loading and data
  const [isLoadingAirports, setIsLoadingAirports] = useState(false);
  const [isLoadingAirlines, setIsLoadingAirlines] = useState(false);
  const [airports, setAirports] = useState<Airport[]>([]);
  const [airlines, setAirlines] = useState<Airline[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch airports and airlines on component mount
  useEffect(() => {
    fetchAirports();
    fetchAirlines();
  }, []);

  // Fetch airports from API
  const fetchAirports = async () => {
    setIsLoadingAirports(true);
    try {
      const response = await fetch("/api/airports");
      if (!response.ok) {
        throw new Error("Failed to fetch airports");
      }
      const data = await response.json();
      
      // The API already returns data in the correct format
      setAirports(data);
      
      console.log("Airports data:", data); // For debugging
    } catch (error) {
      console.error("Error fetching airports:", error);
      // Fallback data for development
      setAirports([
        { value: "lhr", label: "London Heathrow Airport", code: "LHR" },
        { value: "jfk", label: "John F. Kennedy International Airport", code: "JFK" },
        { value: "lax", label: "Los Angeles International Airport", code: "LAX" },
        { value: "cdg", label: "Paris Charles de Gaulle Airport", code: "CDG" },
        { value: "hnd", label: "Tokyo Haneda Airport", code: "HND" }
      ]);
    } finally {
      setIsLoadingAirports(false);
    }
  };

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
        { value: "baw", label: "British Airways", code: "BAW" },
        { value: "aal", label: "American Airlines", code: "AAL" },
        { value: "dal", label: "Delta Air Lines", code: "DAL" },
        { value: "afr", label: "Air France", code: "AFR" },
        { value: "jal", label: "Japan Airlines", code: "JAL" }
      ]);
    } finally {
      setIsLoadingAirlines(false);
    }
  };

  // Validate form before submission
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (searchType === "flightNumber") {
      if (!flightNumber.trim()) {
        newErrors.flightNumber = "Flight number is required";
      }
      if (!airline) {
        newErrors.airline = "Airline is required";
      }
      if (!departureDate) {
        newErrors.departureDate = "Departure date is required";
      }
    } else {
      if (!fromAirport) {
        newErrors.fromAirport = "Departure airport is required";
      }
      if (!toAirport) {
        newErrors.toAirport = "Arrival airport is required";
      }
      if (fromAirport && toAirport && fromAirport.code === toAirport.code) {
        newErrors.toAirport = "Departure and arrival airports cannot be the same";
      }
      if (!departureDate) {
        newErrors.departureDate = "Departure date is required";
      }
      if (tripType === "roundTrip" && !returnDate) {
        newErrors.returnDate = "Return date is required for round trips";
      }
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
    
    if (searchType === "flightNumber") {
      params.append("type", "flightNumber");
      params.append("flightNumber", flightNumber);
      params.append("airline", airline?.code || "");
      params.append("date", departureDate?.toISOString().split("T")[0] || "");
    } else {
      params.append("type", "route");
      params.append("from", fromAirport?.code || "");
      params.append("to", toAirport?.code || "");
      params.append("departureDate", departureDate?.toISOString().split("T")[0] || "");
      
      if (tripType === "roundTrip" && returnDate) {
        params.append("returnDate", returnDate.toISOString().split("T")[0]);
      }
      
      params.append("tripType", tripType);
      params.append("passengers", passengerCount);
      params.append("cabinClass", cabinClass);
      params.append("directOnly", directFlightsOnly.toString());
      params.append("flexible", flexibleDates.toString());
    }
    
    // Navigate to search results page
    router.push(`/flights/results?${params.toString()}`);
  };

  // Trip type options
  const tripTypeOptions = [
    { value: "oneWay", label: "One Way" },
    { value: "roundTrip", label: "Round Trip" }
  ];

  // Passenger count options
  const passengerOptions = [
    { value: "1", label: "1 Passenger" },
    { value: "2", label: "2 Passengers" },
    { value: "3", label: "3 Passengers" },
    { value: "4", label: "4 Passengers" },
    { value: "5", label: "5 Passengers" },
    { value: "6", label: "6 Passengers" }
  ];

  // Cabin class options
  const cabinClassOptions = [
    { value: "economy", label: "Economy" },
    { value: "premiumEconomy", label: "Premium Economy" },
    { value: "business", label: "Business" },
    { value: "first", label: "First Class" }
  ];

  return (
    <div className="w-full bg-white rounded-lg shadow-md p-6">
      <Tabs defaultValue="route" onValueChange={(value) => setSearchType(value as "route" | "flightNumber")}>
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="route">
            <Plane className="mr-2 h-4 w-4" />
            Search by Route
          </TabsTrigger>
          <TabsTrigger value="flightNumber">
            <Search className="mr-2 h-4 w-4" />
            Search by Flight Number
          </TabsTrigger>
        </TabsList>
        
        <form onSubmit={handleSubmit}>
          <TabsContent value="flightNumber" className="space-y-4">
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
            
            <Button type="submit" className="w-full">
              Search Flights
            </Button>
          </TabsContent>
          
          <TabsContent value="route" className="space-y-6">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">From</label>
                  <Dropdown
                    options={airports}
                    value={fromAirport}
                    onChange={setFromAirport}
                    placeholder="Select departure airport"
                    isLoading={isLoadingAirports}
                    searchPlaceholder="Search airports..."
                    noResultsText="No airports found"
                    loadingText="Loading airports..."
                    className={errors.fromAirport ? "border-red-500" : ""}
                  />
                  {errors.fromAirport && (
                    <p className="text-xs text-red-500">{errors.fromAirport}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">To</label>
                  <Dropdown
                    options={airports}
                    value={toAirport}
                    onChange={setToAirport}
                    placeholder="Select arrival airport"
                    isLoading={isLoadingAirports}
                    searchPlaceholder="Search airports..."
                    noResultsText="No airports found"
                    loadingText="Loading airports..."
                    className={errors.toAirport ? "border-red-500" : ""}
                  />
                  {errors.toAirport && (
                    <p className="text-xs text-red-500">{errors.toAirport}</p>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Trip Type</label>
                <RadioGroup
                  options={tripTypeOptions}
                  value={tripType}
                  onChange={(value) => setTripType(value as TripType)}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Departure Date</label>
                  <DatePicker
                    value={departureDate}
                    onChange={setDepartureDate}
                    placeholder="Select departure date"
                    className={errors.departureDate ? "border-red-500" : ""}
                    minDate={new Date()}
                  />
                  {errors.departureDate && (
                    <p className="text-xs text-red-500">{errors.departureDate}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Return Date</label>
                  <DatePicker
                    value={returnDate}
                    onChange={setReturnDate}
                    placeholder="Select return date"
                    className={cn(
                      tripType === "oneWay" && "opacity-50",
                      errors.returnDate ? "border-red-500" : ""
                    )}
                    disabled={tripType === "oneWay"}
                    minDate={departureDate || new Date()}
                  />
                  {errors.returnDate && (
                    <p className="text-xs text-red-500">{errors.returnDate}</p>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Passengers</label>
                  <Select
                    options={passengerOptions}
                    value={passengerCount}
                    onChange={setPassengerCount}
                    placeholder="Select passengers"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Cabin Class</label>
                  <Select
                    options={cabinClassOptions}
                    value={cabinClass}
                    onChange={(value) => setCabinClass(value as CabinClass)}
                    placeholder="Select cabin class"
                  />
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-2 sm:space-y-0">
                <Checkbox
                  checked={directFlightsOnly}
                  onChange={setDirectFlightsOnly}
                  label="Direct flights only"
                />
                
                <Checkbox
                  checked={flexibleDates}
                  onChange={setFlexibleDates}
                  label="Flexible dates (±3 days)"
                />
              </div>
            </div>
            
            <Button type="submit" className="w-full">
              Search Flights
            </Button>
          </TabsContent>
        </form>
      </Tabs>
    </div>
  );
} 