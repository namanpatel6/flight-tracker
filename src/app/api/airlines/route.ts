import { NextResponse } from 'next/server';
import { fetchAirlines } from '@/lib/flight-radar-api';

/**
 * GET handler for /api/airlines
 * Fetches airlines from the AviationStack API
 */
export async function GET() {
  try {
    console.log("Fetching airlines from API");
    const airlines = await fetchAirlines();
    
    console.log(`Returning ${airlines.length} airlines from API route`);
    return NextResponse.json(airlines);
  } catch (error: any) {
    console.error('Error in airlines API route:', error);
    return NextResponse.json(
      { message: error.message || "Failed to fetch airlines" },
      { status: 500 }
    );
  }
} 