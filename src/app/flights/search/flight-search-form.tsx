"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarIcon, Plane, Search } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { FlightSearchSchema } from "@/lib/flight-api";

type FormData = z.infer<typeof FlightSearchSchema>;

export function FlightSearchForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [date, setDate] = useState<Date | undefined>(
    searchParams.get("date") ? new Date(searchParams.get("date") as string) : undefined
  );

  // Initialize form with URL search params
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(FlightSearchSchema),
    defaultValues: {
      flightNumber: searchParams.get("flightNumber") || "",
      airline: searchParams.get("airline") || "",
      departureAirport: searchParams.get("departureAirport") || "",
      arrivalAirport: searchParams.get("arrivalAirport") || "",
      date: searchParams.get("date") || "",
    },
  });

  const onSubmit = (data: FormData) => {
    // Build query string
    const params = new URLSearchParams();
    
    if (data.flightNumber) params.set("flightNumber", data.flightNumber);
    if (data.airline) params.set("airline", data.airline);
    if (data.departureAirport) params.set("departureAirport", data.departureAirport);
    if (data.arrivalAirport) params.set("arrivalAirport", data.arrivalAirport);
    if (date) params.set("date", date.toISOString().split("T")[0]);
    
    // Navigate to search results
    router.push(`/flights/search?${params.toString()}`);
  };

  const handleReset = () => {
    reset();
    setDate(undefined);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center">
          <Plane className="mr-2 h-6 w-6" /> Flight Search
        </CardTitle>
        <CardDescription>
          Search for flights by flight number, airline, or route
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="flightNumber">Flight Number</Label>
              <Input
                id="flightNumber"
                placeholder="e.g. AA123"
                {...register("flightNumber")}
              />
              {errors.flightNumber && (
                <p className="text-sm text-red-500">{errors.flightNumber.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="airline">Airline</Label>
              <Input
                id="airline"
                placeholder="e.g. American Airlines"
                {...register("airline")}
              />
              {errors.airline && (
                <p className="text-sm text-red-500">{errors.airline.message}</p>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="departureAirport">Departure Airport</Label>
              <Input
                id="departureAirport"
                placeholder="e.g. JFK"
                {...register("departureAirport")}
              />
              {errors.departureAirport && (
                <p className="text-sm text-red-500">{errors.departureAirport.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="arrivalAirport">Arrival Airport</Label>
              <Input
                id="arrivalAirport"
                placeholder="e.g. LAX"
                {...register("arrivalAirport")}
              />
              {errors.arrivalAirport && (
                <p className="text-sm text-red-500">{errors.arrivalAirport.message}</p>
              )}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : "Select a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <Button type="button" variant="outline" onClick={handleReset}>
            Reset
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            <Search className="mr-2 h-4 w-4" />
            {isSubmitting ? "Searching..." : "Search Flights"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
} 