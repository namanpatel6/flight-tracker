import { NextResponse } from "next/server";
import { flightSearchSchema, searchFlights } from "@/lib/aero-api";
import { fetchFlightPrices } from "@/lib/flight-price-api";

export async function GET(request: Request) {
  try {
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
    let flights = await searchFlights(result.data);
    console.log(`Found ${flights.length} flights in initial search`);
    
    return NextResponse.json({ flights });
  } catch (error: any) {
    console.error("Flight search error:", error);
    
    return NextResponse.json(
      { message: error.message || "Something went wrong" },
      { status: 500 }
    );
  }
} 