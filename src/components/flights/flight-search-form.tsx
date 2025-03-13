"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { fetchAirports, fetchAirlines } from "@/lib/flight-api";

type Airport = {
  value: string;
  label: string;
  code: string;
};

type Airline = {
  value: string;
  label: string;
  code: string;
};

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
  
  // New state for airports and airlines data
  const [airports, setAirports] = useState<Airport[]>([]);
  const [airlines, setAirlines] = useState<Airline[]>([]);
  const [airportsLoading, setAirportsLoading] = useState(false);
  const [airlinesLoading, setAirlinesLoading] = useState(false);
  
  // State for open/closed popover states
  const [departureOpen, setDepartureOpen] = useState(false);
  const [arrivalOpen, setArrivalOpen] = useState(false);
  const [airlineOpen, setAirlineOpen] = useState(false);

  // Fetch airports and airlines on component mount
  useEffect(() => {
    async function loadAirports() {
      setAirportsLoading(true);
      try {
        const airportsData = await fetchAirports();
        setAirports(airportsData);
      } catch (err) {
        console.error("Error fetching airports:", err);
        setError("Failed to load airports. Please try again later.");
      } finally {
        setAirportsLoading(false);
      }
    }

    async function loadAirlines() {
      setAirlinesLoading(true);
      try {
        const airlinesData = await fetchAirlines();
        setAirlines(airlinesData);
      } catch (err) {
        console.error("Error fetching airlines:", err);
        // Don't set error for airlines as it's less critical
      } finally {
        setAirlinesLoading(false);
      }
    }

    loadAirports();
    loadAirlines();
  }, []);

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
                <Popover open={airlineOpen} onOpenChange={setAirlineOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={airlineOpen}
                      className="w-full justify-between"
                    >
                      {airline
                        ? airlines.find((a) => a.value === airline)?.label || airline
                        : "Select airline..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Search airline..." />
                      <CommandEmpty>
                        {airlinesLoading ? "Loading..." : "No airline found."}
                      </CommandEmpty>
                      <CommandGroup className="max-h-60 overflow-y-auto">
                        {airlines.map((a) => (
                          <CommandItem
                            key={a.value}
                            value={a.value}
                            onSelect={(currentValue: string) => {
                              setAirline(currentValue === airline ? "" : currentValue);
                              setAirlineOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                airline === a.value ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {a.label} ({a.code})
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
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
                <Popover open={departureOpen} onOpenChange={setDepartureOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={departureOpen}
                      className="w-full justify-between"
                    >
                      {departureAirport
                        ? airports.find((a) => a.value === departureAirport)?.label || departureAirport
                        : "Select departure airport..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Search airport..." />
                      <CommandEmpty>
                        {airportsLoading ? "Loading..." : "No airport found."}
                      </CommandEmpty>
                      <CommandGroup className="max-h-60 overflow-y-auto">
                        {airports.map((airport) => (
                          <CommandItem
                            key={airport.value}
                            value={airport.value}
                            onSelect={(currentValue: string) => {
                              setDepartureAirport(currentValue === departureAirport ? "" : currentValue);
                              setDepartureOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                departureAirport === airport.value ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {airport.label} ({airport.code})
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label htmlFor="arrivalAirport">Arrival Airport</Label>
                <Popover open={arrivalOpen} onOpenChange={setArrivalOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={arrivalOpen}
                      className="w-full justify-between"
                    >
                      {arrivalAirport
                        ? airports.find((a) => a.value === arrivalAirport)?.label || arrivalAirport
                        : "Select arrival airport..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Search airport..." />
                      <CommandEmpty>
                        {airportsLoading ? "Loading..." : "No airport found."}
                      </CommandEmpty>
                      <CommandGroup className="max-h-60 overflow-y-auto">
                        {airports.map((airport) => (
                          <CommandItem
                            key={airport.value}
                            value={airport.value}
                            onSelect={(currentValue: string) => {
                              setArrivalAirport(currentValue === arrivalAirport ? "" : currentValue);
                              setArrivalOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                arrivalAirport === airport.value ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {airport.label} ({airport.code})
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
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