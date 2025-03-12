import { NextResponse } from "next/server";
import { getFlightDetails } from "@/lib/flight-api";

interface RouteParams {
  params: {
    flightNumber: string;
  };
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { flightNumber } = params;
    
    if (!flightNumber) {
      return NextResponse.json(
        { message: "Flight number is required" },
        { status: 400 }
      );
    }
    
    // Get flight details
    const flight = await getFlightDetails(flightNumber);
    
    if (!flight) {
      return NextResponse.json(
        { message: "Flight not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ flight });
  } catch (error: any) {
    console.error("Flight details error:", error);
    
    return NextResponse.json(
      { message: error.message || "Something went wrong" },
      { status: 500 }
    );
  }
} 