"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FlightSearchParams } from "@/lib/flight-api";

export function FlightSearchForm() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"number" | "route">("number");
  const [flightNumber, setFlightNumber] = useState("");
  const [airline, setAirline] = useState("");
  const [departureAirport, setDepartureAirport] = useState("");
  const [arrivalAirport, setArrivalAirport] = useState("");
  const [date, setDate] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Build search params
    const searchParams = new URLSearchParams();
    
    if (activeTab === "number") {
      if (flightNumber) searchParams.append("flightNumber", flightNumber);
      if (airline) searchParams.append("airline", airline);
    } else {
      if (departureAirport) searchParams.append("departureAirport", departureAirport);
      if (arrivalAirport) searchParams.append("arrivalAirport", arrivalAirport);
    }
    
    if (date) searchParams.append("date", date);

    // Navigate to search results
    router.push(`/flights/search?${searchParams.toString()}`);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Search Flights</CardTitle>
        <CardDescription>
          Search for flights by flight number or route
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "number" | "route")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="number">By Flight Number</TabsTrigger>
            <TabsTrigger value="route">By Route</TabsTrigger>
          </TabsList>
          <TabsContent value="number" className="space-y-4">
            <form onSubmit={handleSearch} className="space-y-4">
              {error && (
                <div className="rounded-md bg-red-50 p-2 text-sm text-red-500">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="flightNumber">Flight Number</Label>
                <Input
                  id="flightNumber"
                  placeholder="e.g. AA123"
                  value={flightNumber}
                  onChange={(e) => setFlightNumber(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="airline">Airline (optional)</Label>
                <Input
                  id="airline"
                  placeholder="e.g. American Airlines"
                  value={airline}
                  onChange={(e) => setAirline(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Date (optional)</Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading || (!flightNumber && !airline)}>
                {isLoading ? "Searching..." : "Search"}
              </Button>
            </form>
          </TabsContent>
          <TabsContent value="route" className="space-y-4">
            <form onSubmit={handleSearch} className="space-y-4">
              {error && (
                <div className="rounded-md bg-red-50 p-2 text-sm text-red-500">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="departureAirport">Departure Airport</Label>
                <Input
                  id="departureAirport"
                  placeholder="e.g. JFK"
                  value={departureAirport}
                  onChange={(e) => setDepartureAirport(e.target.value)}
                  required={activeTab === "route"}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="arrivalAirport">Arrival Airport</Label>
                <Input
                  id="arrivalAirport"
                  placeholder="e.g. LAX"
                  value={arrivalAirport}
                  onChange={(e) => setArrivalAirport(e.target.value)}
                  required={activeTab === "route"}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Date (optional)</Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading || !departureAirport || !arrivalAirport}
              >
                {isLoading ? "Searching..." : "Search"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
} 