import { NextResponse } from "next/server";

interface RouteParams {
  params: {
    flightNumber: string;
  };
}

export async function GET(request: Request, { params }: RouteParams) {
  // Get the flight number from the request
  const flightNumber = params.flightNumber;
  
  // Get the current date for default departure and arrival dates
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0];
  
  console.log(`API route at /api/flights/${flightNumber} requested. Redirecting to new format.`);
  
  // Return a response indicating the format has changed
  return NextResponse.json({
    message: "API format changed",
    details: "The flight details API now requires both departure and arrival dates",
    new_format: `/api/flights/${flightNumber}/{departureDate}/{arrivalDate}`,
    example: `/api/flights/${flightNumber}/${today}/${tomorrow}`,
    status: 400
  }, { status: 400 });
} 