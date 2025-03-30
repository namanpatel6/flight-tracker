"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Flight } from "@/types/flight";
import { formatDateWithTimezone } from "@/lib/utils";

export default function TestFlightRadarPage() {
  const [airports, setAirports] = useState<any[]>([]);
  const [airlines, setAirlines] = useState<any[]>([]);
  const [flightNumber, setFlightNumber] = useState("FD3210");
  const [flights, setFlights] = useState<Flight[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch airports and airlines on component mount
  useEffect(() => {
    fetchAirports();
    fetchAirlines();
  }, []);

  // Fetch airports
  const fetchAirports = async () => {
    try {
      const response = await fetch("/api/airports");
      if (!response.ok) {
        throw new Error(`Failed to fetch airports: ${response.status}`);
      }
      const data = await response.json();
      setAirports(data.slice(0, 10)); // Show only first 10 for brevity
    } catch (error: any) {
      console.error("Error fetching airports:", error);
      setError(error.message);
    }
  };

  // Fetch airlines
  const fetchAirlines = async () => {
    try {
      const response = await fetch("/api/airlines");
      if (!response.ok) {
        throw new Error(`Failed to fetch airlines: ${response.status}`);
      }
      const data = await response.json();
      setAirlines(data.slice(0, 10)); // Show only first 10 for brevity
    } catch (error: any) {
      console.error("Error fetching airlines:", error);
      setError(error.message);
    }
  };

  // Search flights
  const searchFlights = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/flights/search?flight_iata=${flightNumber}`);
      if (!response.ok) {
        throw new Error(`Failed to search flights: ${response.status}`);
      }
      const data = await response.json();
      setFlights(data.flights);
    } catch (error: any) {
      console.error("Error searching flights:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Get flight details
  const getFlightDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/flights/${flightNumber}`);
      if (!response.ok) {
        throw new Error(`Failed to get flight details: ${response.status}`);
      }
      const data = await response.json();
      setFlights([data.flight]);
    } catch (error: any) {
      console.error("Error getting flight details:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">FlightRadar API Test</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Airports</CardTitle>
            <CardDescription>First 10 airports from the API</CardDescription>
          </CardHeader>
          <CardContent>
            {airports.length > 0 ? (
              <ul className="space-y-2">
                {airports.map((airport) => (
                  <li key={airport.value} className="text-sm">
                    {airport.label} ({airport.code})
                  </li>
                ))}
              </ul>
            ) : (
              <p>No airports found</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Airlines</CardTitle>
            <CardDescription>First 10 airlines from the API</CardDescription>
          </CardHeader>
          <CardContent>
            {airlines.length > 0 ? (
              <ul className="space-y-2">
                {airlines.map((airline) => (
                  <li key={airline.value} className="text-sm">
                    {airline.label} ({airline.code})
                  </li>
                ))}
              </ul>
            ) : (
              <p>No airlines found</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Flight Search</CardTitle>
          <CardDescription>Search for flights by flight number</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <Label htmlFor="flightNumber" className="mb-2 block">
                Flight Number
              </Label>
              <Input
                id="flightNumber"
                value={flightNumber}
                onChange={(e) => setFlightNumber(e.target.value)}
                placeholder="e.g. FD3210"
              />
            </div>
            <Button onClick={searchFlights} disabled={loading}>
              {loading ? "Searching..." : "Search Flights"}
            </Button>
            <Button onClick={getFlightDetails} disabled={loading} variant="outline">
              {loading ? "Loading..." : "Get Flight Details"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-8">
          {error}
        </div>
      )}

      {flights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Flight Results</CardTitle>
            <CardDescription>Found {flights.length} flights</CardDescription>
          </CardHeader>
          <CardContent>
            {flights.map((flight) => (
              <div key={flight.id} className="mb-6 last:mb-0">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold">
                      {flight.airline.name} {flight.flight.iata}
                    </h3>
                    <p className="text-sm text-gray-500">
                      Status: <span className="font-medium">{flight.flight_status}</span>
                    </p>
                  </div>
                  {flight.aircraft && (
                    <div className="text-right">
                      <p className="text-sm">
                        Aircraft: {flight.aircraft.model || "Unknown"}
                      </p>
                      {flight.aircraft.registration && (
                        <p className="text-xs text-gray-500">
                          Reg: {flight.aircraft.registration}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <Separator className="my-4" />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Departure</h4>
                    <p className="text-sm">
                      {flight.departure.airport} ({flight.departure.iata})
                    </p>
                    <p className="text-sm">
                      Scheduled:{" "}
                      {formatDateWithTimezone(flight.departure.scheduled)}
                    </p>
                    {flight.departure.actual && (
                      <p className="text-sm">
                        Actual: {formatDateWithTimezone(flight.departure.actual)}
                      </p>
                    )}
                    {flight.departure.delay !== undefined && (
                      <p className="text-sm">
                        Delay: {flight.departure.delay} minutes
                      </p>
                    )}
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Arrival</h4>
                    <p className="text-sm">
                      {flight.arrival.airport} ({flight.arrival.iata})
                    </p>
                    <p className="text-sm">
                      Scheduled:{" "}
                      {formatDateWithTimezone(flight.arrival.scheduled)}
                    </p>
                    {flight.arrival.actual && (
                      <p className="text-sm">
                        Actual: {formatDateWithTimezone(flight.arrival.actual)}
                      </p>
                    )}
                    {flight.arrival.delay !== undefined && (
                      <p className="text-sm">
                        Delay: {flight.arrival.delay} minutes
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
} 