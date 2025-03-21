import { NextResponse } from "next/server";
import { getFlightDetails } from "@/lib/flight-radar-api";
import { searchFlightPrice } from "@/lib/flight-price-api";
import { Price } from "@/types/flight";

interface RouteParams {
  params: {
    flightNumber: string;
  };
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    // Properly await params before accessing properties
    const paramsObj = await Promise.resolve(params);
    const flightNumber = paramsObj.flightNumber;
    
    if (!flightNumber) {
      return NextResponse.json(
        { message: "Flight number is required" },
        { status: 400 }
      );
    }
    
    // Check if there's a price in the URL query params
    const url = new URL(request.url);
    const priceParam = url.searchParams.get('price');
    let priceFromUrl: Price | null = null;
    
    if (priceParam) {
      try {
        priceFromUrl = JSON.parse(decodeURIComponent(priceParam)) as Price;
      } catch (err) {
        console.error("Error parsing price from URL:", err);
      }
    }
    
    // Get flight details
    const flight = await getFlightDetails(flightNumber);
    
    if (!flight) {
      return NextResponse.json(
        { message: "Flight not found" },
        { status: 404 }
      );
    }
    
    // Use price from URL if available, otherwise try to fetch it
    if (priceFromUrl) {
      flight.price = priceFromUrl;
      console.log("Using price from URL:", priceFromUrl.formatted);
    } else {
      // Add price information to the flight details
      try {
        if (flight.departure?.iata && flight.arrival?.iata) {
          // Get today's date or flight date if available
          const date = flight.flight_date || new Date().toISOString().split('T')[0];
          
          const price = await searchFlightPrice(
            flight.departure.iata,
            flight.arrival.iata,
            date
          );
          
          if (price) {
            flight.price = price;
          }
        }
      } catch (priceError) {
        console.error("Error fetching flight price:", priceError);
        // Continue without price if there was an error
      }
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