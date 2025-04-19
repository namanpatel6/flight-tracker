import { NextResponse } from "next/server";
import { getFlightDetails } from "@/lib/aero-api";
import { searchFlightPrice } from "@/lib/flight-price-api";
import { Price } from "@/types/flight";

export async function GET(
  request: Request, 
  { params }: { params: { flightNumber: string; departureDate: string; arrivalDate: string } }
) {
  try {
    // Properly await params before accessing properties
    const paramsObj = await Promise.resolve(params);
    const flightNumber = paramsObj.flightNumber;
    const departureDate = paramsObj.departureDate;
    const arrivalDate = paramsObj.arrivalDate;
    
    console.log(`API route received parameters: flightNumber=${flightNumber}, departureDate=${departureDate}, arrivalDate=${arrivalDate}`);
    
    if (!flightNumber) {
      console.warn("API route error: Flight number is required");
      return NextResponse.json(
        { message: "Flight number is required" },
        { status: 400 }
      );
    }
    
    if (!departureDate || !arrivalDate) {
      console.warn("API route error: Departure date and arrival date are required");
      return NextResponse.json(
        { message: "Departure date and arrival date are required" },
        { status: 400 }
      );
    }
    
    console.log(`Fetching flight details for: ${flightNumber}, departure: ${departureDate}, arrival: ${arrivalDate}`);
    
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
    
    // Get flight details using AeroAPI with both dates
    console.log(`Calling getFlightDetails with: ${flightNumber}, ${departureDate}, ${arrivalDate}`);
    const flight = await getFlightDetails(flightNumber, departureDate, arrivalDate);
    
    if (!flight) {
      console.warn("API route error: Flight not found");
      return NextResponse.json(
        { message: "Flight not found" },
        { status: 404 }
      );
    }
    
    console.log(`Flight details retrieved successfully, status: ${flight.flight_status}`);
    
    // Use price from URL if available, otherwise try to fetch it
    if (priceFromUrl) {
      flight.price = priceFromUrl;
      console.log("Using price from URL:", priceFromUrl.formatted);
    } else {
      // Add price information to the flight details
      try {
        if (flight.departure?.iata && flight.arrival?.iata) {
          // Use departure date for price search
          const date = departureDate || new Date().toISOString().split('T')[0];
          
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