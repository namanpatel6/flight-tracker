import { NextResponse } from "next/server";
import { flightSearchSchema, searchFlights } from "@/lib/flight-api";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    const params = {
      flight_iata: searchParams.get("flight_iata") || undefined,
      airline_iata: searchParams.get("airline_iata") || undefined,
      dep_iata: searchParams.get("dep_iata") || undefined,
      arr_iata: searchParams.get("arr_iata") || undefined,
      flight_date: searchParams.get("flight_date") || undefined,
      arr_scheduled_time_dep: searchParams.get("arr_scheduled_time_dep") || undefined,
      arr_scheduled_time_arr: searchParams.get("arr_scheduled_time_arr") || undefined,
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