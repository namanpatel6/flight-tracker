import { NextResponse } from "next/server";
import { flightSearchSchema, searchFlights } from "@/lib/flight-api";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    const params = {
      flightNumber: searchParams.get("flightNumber") || undefined,
      airline: searchParams.get("airline") || undefined,
      departureAirport: searchParams.get("departureAirport") || undefined,
      arrivalAirport: searchParams.get("arrivalAirport") || undefined,
      date: searchParams.get("date") || undefined,
    };
    
    // Validate search parameters
    const result = flightSearchSchema.safeParse(params);
    
    if (!result.success) {
      return NextResponse.json(
        { message: "Invalid search parameters", errors: result.error.errors },
        { status: 400 }
      );
    }
    
    // Search for flights
    const flights = await searchFlights(result.data);
    
    return NextResponse.json({ flights });
  } catch (error: any) {
    console.error("Flight search error:", error);
    
    return NextResponse.json(
      { message: error.message || "Something went wrong" },
      { status: 500 }
    );
  }
} 