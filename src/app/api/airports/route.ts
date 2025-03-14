import { NextResponse } from 'next/server';
import { fetchAirports } from '@/lib/flight-api';
import fs from 'fs';
import path from 'path';

/**
 * GET handler for /api/airports
 * Fetches airports from the local JSON file or AviationStack API
 */
export async function GET() {
  try {
    
    // If direct file reading fails, use the fetchAirports function
    console.log("Falling back to fetchAirports function");
    const airports = await fetchAirports();
    return NextResponse.json(airports);
  } catch (error: any) {
    console.error("Error in airports API route:", error);
    
    return NextResponse.json(
      { message: error.message || "Failed to fetch airports" },
      { status: 500 }
    );
  }
} 