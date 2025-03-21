import { NextResponse } from 'next/server';
import { fetchAirports } from '@/lib/flight-radar-api';

/**
 * GET handler for /api/airports
 * Fetches airports from the local JSON file or AviationStack API
 */
export async function GET() {
  try {
    const airports = await fetchAirports();
    return NextResponse.json(airports);
  } catch (error: any) {
    console.error("Airports API error:", error);
    return NextResponse.json(
      { message: error.message || "Failed to fetch airports" },
      { status: 500 }
    );
  }
} 