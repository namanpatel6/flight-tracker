import { NextResponse } from "next/server";
import { flightSearchSchema, searchFlights } from "@/lib/aero-api";
import { fetchFlightPrices } from "@/lib/flight-price-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { message: "Unauthorized - Please sign in to search for flights" },
        { status: 401 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    
    console.log("Flight search API called with params:", Object.fromEntries(searchParams.entries()));
    
    const params = {
      flight_iata: searchParams.get("flight_iata") || undefined,
      airline_iata: searchParams.get("airline_iata") || undefined,
      dep_iata: searchParams.get("dep_iata") || undefined,
      arr_iata: searchParams.get("arr_iata") || undefined,
      flight_date: searchParams.get("flight_date") || undefined,
      include_prices: searchParams.get("include_prices") === "true",
    };
    
    // Validate search parameters
    const result = flightSearchSchema.safeParse(params);
    
    if (!result.success) {
      console.error("Invalid search parameters:", result.error.errors);
      return NextResponse.json(
        { message: "Invalid search parameters", errors: result.error.errors },
        { status: 400 }
      );
    }
    
    // Search for flights using AeroAPI
    console.log("Searching for flights with params:", result.data);
    
    // Add extra logging to debug the flight date
    if (result.data.flight_date) {
      console.log(`Flight date for search: ${result.data.flight_date}`);
      
      // Add the flight date to URL for verification
      console.log(`Flight search URL: /flights/results?flight_iata=${result.data.flight_iata || ''}&flight_date=${result.data.flight_date}`);
    }
    
    let flights = await searchFlights(result.data);
    console.log(`Found ${flights.length} flights in initial search`);
    
    // For debugging purposes - log the first flight's data if available
    if (flights.length > 0) {
      console.log(`First flight result departure scheduled: ${flights[0].departure.scheduled}`);
      console.log(`First flight result date from data: ${flights[0].flight_date || 'not set'}`);
    }
    
    return NextResponse.json({ flights });
  } catch (error: any) {
    console.error("Flight search error:", error);
    
    return NextResponse.json(
      { message: error.message || "Something went wrong" },
      { status: 500 }
    );
  }
} 