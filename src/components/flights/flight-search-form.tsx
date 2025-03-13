"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, PlaneTakeoff, PlaneLanding, Plus, Minus } from "lucide-react";
import { format } from "date-fns";
import { cn, popularAirports, popularAirlines, cabinClasses, flightStatuses, generatePassengerOptions } from "@/lib/utils";
import { FlightSearchParams } from "@/lib/flight-api";
import { Combobox } from "@/components/ui/combobox";

// Generate passenger options (1-9)
const passengerOptions = generatePassengerOptions(9);

export function FlightSearchForm() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"number" | "route" | "advanced">("route");
  const [tripType, setTripType] = useState<"one-way" | "round-trip" | "multi-city">("round-trip");
  
  // Flight number search
  const [flightNumber, setFlightNumber] = useState("");
  const [airline, setAirline] = useState("");
  
  // Route search
  const [departureAirport, setDepartureAirport] = useState("");
  const [arrivalAirport, setArrivalAirport] = useState("");
  const [departureDate, setDepartureDate] = useState<Date | undefined>(new Date());
  const [returnDate, setReturnDate] = useState<Date | undefined>();
  
  // Advanced options
  const [cabinClass, setCabinClass] = useState("economy");
  const [adults, setAdults] = useState("1");
  const [children, setChildren] = useState("0");
  const [infants, setInfants] = useState("0");
  const [directFlightsOnly, setDirectFlightsOnly] = useState(false);
  const [status, setStatus] = useState("");
  
  // Multi-city routes (for future implementation)
  const [multiCityRoutes, setMultiCityRoutes] = useState([
    { departure: "", arrival: "", date: new Date() },
    { departure: "", arrival: "", date: new Date() }
  ]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Add a route for multi-city search
  const addRoute = () => {
    if (multiCityRoutes.length < 5) {
      setMultiCityRoutes([
        ...multiCityRoutes,
        { departure: "", arrival: "", date: new Date() }
      ]);
    }
  };
  
  // Remove a route for multi-city search
  const removeRoute = (index: number) => {
    if (multiCityRoutes.length > 2) {
      const newRoutes = [...multiCityRoutes];
      newRoutes.splice(index, 1);
      setMultiCityRoutes(newRoutes);
    }
  };
  
  // Update a multi-city route
  const updateMultiCityRoute = (index: number, field: string, value: any) => {
    const newRoutes = [...multiCityRoutes];
    newRoutes[index] = { ...newRoutes[index], [field]: value };
    setMultiCityRoutes(newRoutes);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Build search params
    const searchParams = new URLSearchParams();
    
    if (activeTab === "number") {
      if (flightNumber) searchParams.append("flightNumber", flightNumber);
      if (airline) searchParams.append("airline", airline);
    } else if (activeTab === "route") {
      if (departureAirport) searchParams.append("departureAirport", departureAirport);
      if (arrivalAirport) searchParams.append("arrivalAirport", arrivalAirport);
      
      if (departureDate) {
        const formattedDepartureDate = format(departureDate, "yyyy-MM-dd");
        searchParams.append("date", formattedDepartureDate);
      }
      
      if (tripType === "round-trip" && returnDate) {
        const formattedReturnDate = format(returnDate, "yyyy-MM-dd");
        searchParams.append("returnDate", formattedReturnDate);
      }
    } else if (activeTab === "advanced") {
      // Add all advanced search parameters
      if (departureAirport) searchParams.append("departureAirport", departureAirport);
      if (arrivalAirport) searchParams.append("arrivalAirport", arrivalAirport);
      
      if (departureDate) {
        const formattedDepartureDate = format(departureDate, "yyyy-MM-dd");
        searchParams.append("date", formattedDepartureDate);
      }
      
      if (tripType === "round-trip" && returnDate) {
        const formattedReturnDate = format(returnDate, "yyyy-MM-dd");
        searchParams.append("returnDate", formattedReturnDate);
      }
      
      if (cabinClass) searchParams.append("cabinClass", cabinClass);
      if (adults) searchParams.append("adults", adults);
      if (children) searchParams.append("children", children);
      if (infants) searchParams.append("infants", infants);
      if (directFlightsOnly) searchParams.append("directFlightsOnly", "true");
      if (status) searchParams.append("status", status);
    }

    // Navigate to search results
    router.push(`/flights/search?${searchParams.toString()}`);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Search Flights</CardTitle>
        <CardDescription>
          Find flights by number, route, or advanced search options
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "number" | "route" | "advanced")}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="number">Flight Number</TabsTrigger>
            <TabsTrigger value="route">Route</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>
          
          {/* Flight Number Search */}
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
                <Combobox
                  options={popularAirlines}
                  value={airline}
                  onChange={setAirline}
                  placeholder="Select airline or type to search"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Date (optional)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {departureDate ? format(departureDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={departureDate}
                      onSelect={setDepartureDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <Button type="submit" className="w-full" disabled={isLoading || (!flightNumber && !airline)}>
                {isLoading ? "Searching..." : "Search"}
              </Button>
            </form>
          </TabsContent>
          
          {/* Route Search */}
          <TabsContent value="route" className="space-y-4">
            <div className="flex space-x-2 mb-4">
              <Button
                variant={tripType === "one-way" ? "default" : "outline"}
                className="flex-1"
                onClick={() => setTripType("one-way")}
                type="button"
              >
                One Way
              </Button>
              <Button
                variant={tripType === "round-trip" ? "default" : "outline"}
                className="flex-1"
                onClick={() => setTripType("round-trip")}
                type="button"
              >
                Round Trip
              </Button>
              <Button
                variant={tripType === "multi-city" ? "default" : "outline"}
                className="flex-1"
                onClick={() => setTripType("multi-city")}
                type="button"
              >
                Multi-City
              </Button>
            </div>
            
            <form onSubmit={handleSearch} className="space-y-4">
              {error && (
                <div className="rounded-md bg-red-50 p-2 text-sm text-red-500">
                  {error}
                </div>
              )}
              
              {tripType !== "multi-city" ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="departureAirport">From</Label>
                      <div className="flex items-center space-x-2">
                        <PlaneTakeoff className="h-4 w-4 text-muted-foreground" />
                        <Combobox
                          options={popularAirports}
                          value={departureAirport}
                          onChange={setDepartureAirport}
                          placeholder="Departure airport"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="arrivalAirport">To</Label>
                      <div className="flex items-center space-x-2">
                        <PlaneLanding className="h-4 w-4 text-muted-foreground" />
                        <Combobox
                          options={popularAirports}
                          value={arrivalAirport}
                          onChange={setArrivalAirport}
                          placeholder="Arrival airport"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="departureDate">Departure Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            id="departureDate"
                            variant="outline"
                            className="w-full justify-start text-left font-normal"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {departureDate ? format(departureDate, "PPP") : <span>Pick a date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={departureDate}
                            onSelect={setDepartureDate}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    
                    {tripType === "round-trip" && (
                      <div className="space-y-2">
                        <Label htmlFor="returnDate">Return Date</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              id="returnDate"
                              variant="outline"
                              className="w-full justify-start text-left font-normal"
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {returnDate ? format(returnDate, "PPP") : <span>Pick a date</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={returnDate}
                              onSelect={setReturnDate}
                              disabled={(date) => 
                                departureDate ? date < departureDate : false
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  {multiCityRoutes.map((route, index) => (
                    <div key={index} className="p-4 border rounded-md space-y-4">
                      <div className="flex justify-between items-center">
                        <h4 className="font-medium">Flight {index + 1}</h4>
                        {index >= 2 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeRoute(index)}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>From</Label>
                          <div className="flex items-center space-x-2">
                            <PlaneTakeoff className="h-4 w-4 text-muted-foreground" />
                            <Combobox
                              options={popularAirports}
                              value={route.departure}
                              onChange={(value) => updateMultiCityRoute(index, "departure", value)}
                              placeholder="Departure airport"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>To</Label>
                          <div className="flex items-center space-x-2">
                            <PlaneLanding className="h-4 w-4 text-muted-foreground" />
                            <Combobox
                              options={popularAirports}
                              value={route.arrival}
                              onChange={(value) => updateMultiCityRoute(index, "arrival", value)}
                              placeholder="Arrival airport"
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Date</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-start text-left font-normal"
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {route.date ? format(route.date, "PPP") : <span>Pick a date</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={route.date}
                              onSelect={(date) => date && updateMultiCityRoute(index, "date", date)}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                  ))}
                  
                  {multiCityRoutes.length < 5 && (
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={addRoute}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Another Flight
                    </Button>
                  )}
                </div>
              )}
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Adults</Label>
                  <Select value={adults} onValueChange={setAdults}>
                    <SelectTrigger>
                      <SelectValue placeholder="Adults" />
                    </SelectTrigger>
                    <SelectContent>
                      {passengerOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Children</Label>
                  <Select value={children} onValueChange={setChildren}>
                    <SelectTrigger>
                      <SelectValue placeholder="Children" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">0</SelectItem>
                      {passengerOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Infants</Label>
                  <Select value={infants} onValueChange={setInfants}>
                    <SelectTrigger>
                      <SelectValue placeholder="Infants" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">0</SelectItem>
                      {passengerOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Class</Label>
                  <Select value={cabinClass} onValueChange={setCabinClass}>
                    <SelectTrigger>
                      <SelectValue placeholder="Class" />
                    </SelectTrigger>
                    <SelectContent>
                      {cabinClasses.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="directFlights"
                  checked={directFlightsOnly}
                  onCheckedChange={(checked: boolean) => 
                    setDirectFlightsOnly(checked)
                  }
                />
                <Label htmlFor="directFlights">Direct flights only</Label>
              </div>
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading || 
                  (tripType !== "multi-city" && (!departureAirport || !arrivalAirport)) ||
                  (tripType === "multi-city" && multiCityRoutes.some(route => !route.departure || !route.arrival))
                }
              >
                {isLoading ? "Searching..." : "Search Flights"}
              </Button>
            </form>
          </TabsContent>
          
          {/* Advanced Search */}
          <TabsContent value="advanced" className="space-y-4">
            <form onSubmit={handleSearch} className="space-y-4">
              {error && (
                <div className="rounded-md bg-red-50 p-2 text-sm text-red-500">
                  {error}
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="departureAirport">From</Label>
                  <div className="flex items-center space-x-2">
                    <PlaneTakeoff className="h-4 w-4 text-muted-foreground" />
                    <Combobox
                      options={popularAirports}
                      value={departureAirport}
                      onChange={setDepartureAirport}
                      placeholder="Departure airport"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="arrivalAirport">To</Label>
                  <div className="flex items-center space-x-2">
                    <PlaneLanding className="h-4 w-4 text-muted-foreground" />
                    <Combobox
                      options={popularAirports}
                      value={arrivalAirport}
                      onChange={setArrivalAirport}
                      placeholder="Arrival airport"
                    />
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="departureDate">Departure Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        id="departureDate"
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {departureDate ? format(departureDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={departureDate}
                        onSelect={setDepartureDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="airline">Airline (optional)</Label>
                  <Combobox
                    options={popularAirlines}
                    value={airline}
                    onChange={setAirline}
                    placeholder="Select airline or type to search"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="flightNumber">Flight Number (optional)</Label>
                  <Input
                    id="flightNumber"
                    placeholder="e.g. AA123"
                    value={flightNumber}
                    onChange={(e) => setFlightNumber(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="status">Flight Status (optional)</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Any status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any status</SelectItem>
                      {flightStatuses.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Adults</Label>
                  <Select value={adults} onValueChange={setAdults}>
                    <SelectTrigger>
                      <SelectValue placeholder="Adults" />
                    </SelectTrigger>
                    <SelectContent>
                      {passengerOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Children</Label>
                  <Select value={children} onValueChange={setChildren}>
                    <SelectTrigger>
                      <SelectValue placeholder="Children" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">0</SelectItem>
                      {passengerOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Infants</Label>
                  <Select value={infants} onValueChange={setInfants}>
                    <SelectTrigger>
                      <SelectValue placeholder="Infants" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">0</SelectItem>
                      {passengerOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Class</Label>
                  <Select value={cabinClass} onValueChange={setCabinClass}>
                    <SelectTrigger>
                      <SelectValue placeholder="Class" />
                    </SelectTrigger>
                    <SelectContent>
                      {cabinClasses.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="directFlights"
                  checked={directFlightsOnly}
                  onCheckedChange={(checked: boolean) => 
                    setDirectFlightsOnly(checked)
                  }
                />
                <Label htmlFor="directFlights">Direct flights only</Label>
              </div>
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading || (!departureAirport && !arrivalAirport && !flightNumber && !airline)}
              >
                {isLoading ? "Searching..." : "Search Flights"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
} 