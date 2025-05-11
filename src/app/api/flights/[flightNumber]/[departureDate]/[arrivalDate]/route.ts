import { NextResponse } from "next/server";
import { getFlightDetails } from "@/lib/aero-api";
import { searchFlightPrice } from "@/lib/flight-price-api";
import { Price } from "@/types/flight";

export async function GET(
  request: Request, 
  { params }: { params: Promise<{ flightNumber: string; departureDate: string; arrivalDate: string }> }
) {
  console.log("API Route handler started with URL:", request.url);
  console.log("Raw params object:", JSON.stringify(await params));
  
  try {
    // Access params directly - no need to await as they're now correctly typed
    const { flightNumber, departureDate, arrivalDate } = await params;
    
    console.log(`API route received parameters: flightNumber=${flightNumber}, departureDate=${departureDate}, arrivalDate=${arrivalDate}`);
    
    // Validate parameters
    if (!flightNumber || flightNumber === 'undefined') {
      console.warn("API route error: Flight number is required");
      return NextResponse.json(
        { message: "Flight number is required" },
        { status: 400 }
      );
    }
    
    if (!departureDate || !arrivalDate || departureDate === 'undefined' || arrivalDate === 'undefined') {
      console.warn("API route error: Departure date and arrival date are required");
      return NextResponse.json(
        { message: "Departure date and arrival date are required" },
        { status: 400 }
      );
    }
    
    console.log(`Fetching flight details for: ${flightNumber}, departure: ${departureDate}, arrival: ${arrivalDate}`);
    
    // Check URL query params
    const url = new URL(request.url);
    
    // Extract departure and arrival airport codes from URL query params
    const departureAirport = url.searchParams.get('dep_iata') || '';
    const arrivalAirport = url.searchParams.get('arr_iata') || '';
    
    console.log(`Airport codes from query params: dep_iata=${departureAirport}, arr_iata=${arrivalAirport}`);
    
    // Check if there's a price in the URL query params
    const priceParam = url.searchParams.get('price');
    let priceFromUrl: Price | null = null;
    
    if (priceParam) {
      try {
        priceFromUrl = JSON.parse(decodeURIComponent(priceParam)) as Price;
      } catch (err) {
        console.error("Error parsing price from URL:", err);
      }
    }
    
    // Get flight details using AeroAPI with both dates and airport codes
    console.log(`Calling getFlightDetails with: ${flightNumber}, ${departureDate}, ${arrivalDate}, ${departureAirport}, ${arrivalAirport}`);
    const flight = await getFlightDetails(flightNumber, departureDate, arrivalDate, departureAirport, arrivalAirport);
    
    if (!flight) {
      console.warn(`API route error: Flight not found for ${flightNumber}, ${departureDate}, ${arrivalDate}`);
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
    
    const response = { flight };
    console.log("Sending successful response with flight data");
    return NextResponse.json(response);
  } catch (error: any) {
    console.error("Flight details API error:", error);
    
    return NextResponse.json(
      { message: error.message || "Something went wrong" },
      { status: 500 }
    );
  }
} 