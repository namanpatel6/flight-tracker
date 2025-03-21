import { Flight, FlightStatus } from "@/types/flight";
import { z } from "zod";

// FlightRadar API via RapidAPI
const API_BASE_URL = "https://flight-radar1.p.rapidapi.com";
const API_KEY = process.env.NEXT_PUBLIC_RAPIDAPI_KEY || "your_rapidapi_key_here";
const API_HOST = process.env.NEXT_PUBLIC_RAPIDAPI_HOST || "flight-radar1.p.rapidapi.com";

// Log masked API key for debugging
console.log("RapidAPI Key available:", API_KEY ? `${API_KEY.substring(0, 4)}...${API_KEY.substring(API_KEY.length - 4)}` : "Not set");

// Counter for generating unique IDs when flight identifiers are missing
let uniqueIdCounter = 0;

// Flight search schema for validation
export const flightSearchSchema = z.object({
  flight_iata: z.string().optional(),
  airline_iata: z.string().optional(),
  dep_iata: z.string().optional(),
  arr_iata: z.string().optional(),
  flight_date: z.string().optional(),
  include_prices: z.boolean().optional().default(false),
});

/**
 * Fetch airports from the FlightRadar API
 * @returns Array of airports formatted for ComboboxOption
 */
export async function fetchAirports() {
  try {
    // Check if API key is available
    if (!API_KEY || API_KEY === 'your_rapidapi_key_here') {
      console.warn("RapidAPI key not found. Using fallback airport list.");
      return getFallbackAirports();
    }
    
    // Make API request
    const response = await fetch(`${API_BASE_URL}/airports/list`, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': API_KEY,
        'X-RapidAPI-Host': API_HOST,
        'Accept': 'application/json',
      },
    });
    
    console.log("API response status:", response.status);
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    const data = await response.json();
    
    // Check if data.rows exists and is an array
    if (!data.rows || !Array.isArray(data.rows) || data.rows.length === 0) {
      console.warn("API returned no airport data. Using fallback list.");
      return getFallbackAirports();
    }
    
    // Transform API response to match our Airport type
    const airports = data.rows
      .filter((airport: any) => airport.iata && airport.name) // Only include airports with IATA codes and names
      .map((airport: any) => ({
        value: airport.iata.toLowerCase(),
        label: `${airport.name} (${airport.iata})`,
        code: airport.iata
      }))
      // Sort airports alphabetically by label
      .sort((a: { label: string }, b: { label: string }) => a.label.localeCompare(b.label));
      
    if (airports.length === 0) {
      console.warn("No valid airports found in API response. Using fallback list.");
      return getFallbackAirports();
    }
    
    console.log(`Returning ${airports.length} airports from API`);
    return airports;
  } catch (error) {
    console.error("Error fetching airports:", error);
    return getFallbackAirports();
  }
}

/**
 * Get a fallback list of popular airports
 * @returns Array of popular airports
 */
function getFallbackAirports() {
  return [
    { value: "jfk", label: "John F. Kennedy International Airport", code: "JFK" },
    { value: "lax", label: "Los Angeles International Airport", code: "LAX" },
    { value: "lhr", label: "London Heathrow Airport", code: "LHR" },
    { value: "cdg", label: "Paris Charles de Gaulle Airport", code: "CDG" },
    { value: "dxb", label: "Dubai International Airport", code: "DXB" },
    { value: "hnd", label: "Tokyo Haneda Airport", code: "HND" },
    { value: "pek", label: "Beijing Capital International Airport", code: "PEK" },
    { value: "syd", label: "Sydney Airport", code: "SYD" },
    { value: "sin", label: "Singapore Changi Airport", code: "SIN" },
    { value: "fra", label: "Frankfurt Airport", code: "FRA" },
    { value: "ord", label: "Chicago O'Hare International Airport", code: "ORD" },
    { value: "atl", label: "Hartsfield-Jackson Atlanta International Airport", code: "ATL" },
    { value: "ams", label: "Amsterdam Airport Schiphol", code: "AMS" },
    { value: "mad", label: "Adolfo Suárez Madrid–Barajas Airport", code: "MAD" },
    { value: "bom", label: "Chhatrapati Shivaji Maharaj International Airport", code: "BOM" },
    { value: "del", label: "Indira Gandhi International Airport", code: "DEL" },
    { value: "sfo", label: "San Francisco International Airport", code: "SFO" },
    { value: "mia", label: "Miami International Airport", code: "MIA" },
    { value: "yyz", label: "Toronto Pearson International Airport", code: "YYZ" },
    { value: "ist", label: "Istanbul Airport", code: "IST" }
  ];
}

/**
 * Fetch airlines from the FlightRadar API
 * @returns Array of airlines formatted for ComboboxOption
 */
export async function fetchAirlines() {
  try {
    // Check if API key is available
    if (!API_KEY || API_KEY === 'your_rapidapi_key_here') {
      console.warn("RapidAPI key not found. Using fallback airline list.");
      return getFallbackAirlines();
    }
    
    // Make API request
    const response = await fetch(`${API_BASE_URL}/airlines/list`, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': API_KEY,
        'X-RapidAPI-Host': API_HOST,
        'Accept': 'application/json',
      },
    });
    
    console.log("API response status:", response.status);
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    const data = await response.json();
    
    // Check if data.rows exists and is an array
    if (!data.rows || !Array.isArray(data.rows) || data.rows.length === 0) {
      console.warn("API returned no airline data. Using fallback list.");
      return getFallbackAirlines();
    }
    
    // Transform API response to match our Airline type
    let airlines = data.rows
      .filter((airline: any) => airline.Code && airline.Name) // Only include airlines with IATA codes and names
      .map((airline: any) => ({
        value: airline.Code.toLowerCase(),
        label: `${airline.Name} (${airline.Code})`,
        code: airline.Code
      }))
      // Sort airlines alphabetically by label
      .sort((a: { label: string }, b: { label: string }) => a.label.localeCompare(b.label));
    
    // Deduplicate airlines by code
    const uniqueAirlines = [];
    const seenCodes = new Set();
    
    for (const airline of airlines) {
      if (!seenCodes.has(airline.code)) {
        seenCodes.add(airline.code);
        uniqueAirlines.push(airline);
      }
    }
    
    airlines = uniqueAirlines;
      
    if (airlines.length === 0) {
      console.warn("No valid airlines found in API response. Using fallback list.");
      return getFallbackAirlines();
    }
    
    console.log(`Returning ${airlines.length} airlines from API`);
    return airlines;
  } catch (error) {
    console.error("Error fetching airlines:", error);
    return getFallbackAirlines();
  }
}

/**
 * Get a fallback list of popular airlines
 * @returns Array of popular airlines
 */
function getFallbackAirlines() {
  return [
    { value: "aa", label: "American Airlines", code: "AA" },
    { value: "dl", label: "Delta Air Lines", code: "DL" },
    { value: "ua", label: "United Airlines", code: "UA" },
    { value: "ba", label: "British Airways", code: "BA" },
    { value: "af", label: "Air France", code: "AF" },
    { value: "lh", label: "Lufthansa", code: "LH" },
    { value: "ek", label: "Emirates", code: "EK" },
    { value: "qr", label: "Qatar Airways", code: "QR" },
    { value: "sq", label: "Singapore Airlines", code: "SQ" },
    { value: "cx", label: "Cathay Pacific", code: "CX" },
    { value: "jl", label: "Japan Airlines", code: "JL" },
    { value: "nh", label: "All Nippon Airways", code: "NH" },
    { value: "kl", label: "KLM Royal Dutch Airlines", code: "KL" },
    { value: "tk", label: "Turkish Airlines", code: "TK" },
    { value: "ca", label: "Air China", code: "CA" }
  ];
}

/**
 * Search for flights based on various criteria
 * @param params Search parameters
 * @returns Array of flights matching the criteria
 */
export async function searchFlights(params: {
  flight_iata?: string;
  airline_iata?: string;
  dep_iata?: string;
  arr_iata?: string;
  flight_date?: string;
  include_prices?: boolean;
}): Promise<Flight[]> {
  try {
    // Check if API key is available
    if (!API_KEY || API_KEY === 'your_rapidapi_key_here') {
      console.warn("RapidAPI key not found. Using fallback flight data.");
      return [];
    }
    
    // First, search for the flight to get flight ID
    let searchUrl = `${API_BASE_URL}/flights/search`;
    let searchQuery = '';
    
    if (params.flight_iata) {
      searchQuery = params.flight_iata;
    } else if (params.airline_iata && params.dep_iata && params.arr_iata) {
      searchQuery = `${params.airline_iata} ${params.dep_iata} ${params.arr_iata}`;
    } else if (params.airline_iata) {
      searchQuery = params.airline_iata;
    } else if (params.dep_iata && params.arr_iata) {
      searchQuery = `${params.dep_iata} ${params.arr_iata}`;
    } else {
      throw new Error("Insufficient search parameters");
    }
    
    const searchResponse = await fetch(`${searchUrl}?query=${encodeURIComponent(searchQuery)}`, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': API_KEY,
        'X-RapidAPI-Host': API_HOST,
        'Accept': 'application/json',
      },
    });
    
    if (!searchResponse.ok) {
      throw new Error(`Flight search API request failed with status ${searchResponse.status}`);
    }
    
    const searchData = await searchResponse.json();
    
    // Check if we have schedule results
    if (!searchData.results || !Array.isArray(searchData.results) || searchData.results.length === 0) {
      console.warn("No flight search results found");
      return [];
    }
    
    // Filter for schedule type results
    const scheduleResults = searchData.results.filter((result: any) => result.type === "schedule");
    
    if (scheduleResults.length === 0) {
      console.warn("No schedule results found");
      return [];
    }
    
    // Get more details for each flight
    const flights: Flight[] = [];
    
    for (const result of scheduleResults.slice(0, 5)) { // Limit to 5 flights to avoid rate limiting
      try {
        const flightNumber = result.detail?.flight || result.label?.split(' ')[0];
        
        if (!flightNumber) {
          console.warn("No flight number found for result:", result);
          continue;
        }
        
        const detailsResponse = await fetch(`${API_BASE_URL}/flights/get-more-info?query=${encodeURIComponent(flightNumber)}&fetchBy=flight&page=1&limit=100`, {
          method: 'GET',
          headers: {
            'X-RapidAPI-Key': API_KEY,
            'X-RapidAPI-Host': API_HOST,
            'Accept': 'application/json',
          },
        });
        
        if (!detailsResponse.ok) {
          console.warn(`Flight details API request failed with status ${detailsResponse.status} for flight ${flightNumber}`);
          continue;
        }
        
        const detailsData = await detailsResponse.json();
        
        if (!detailsData.result?.response?.data || !Array.isArray(detailsData.result.response.data) || detailsData.result.response.data.length === 0) {
          console.warn(`No flight details found for flight ${flightNumber}`);
          continue;
        }
        
        // Get the most recent flight data
        const flightData = detailsData.result.response.data[0];
        const transformedFlight = transformFlightRadarResponseToFlight(flightData);
        
        // Add flight_date from params if provided
        if (params.flight_date) {
          transformedFlight.flight_date = params.flight_date;
        }
        
        flights.push(transformedFlight);
        
      } catch (error) {
        console.error("Error fetching flight details:", error);
      }
    }
    
    console.log(`Found ${flights.length} flights matching search criteria`);
    return flights;
  } catch (error) {
    console.error("Error searching flights:", error);
    return [];
  }
}

/**
 * Get details for a specific flight by flight number
 * @param flightNumber The flight number (IATA code)
 * @returns Flight details or null if not found
 */
export async function getFlightDetails(flightNumber: string): Promise<Flight | null> {
  try {
    // Check if API key is available
    if (!API_KEY || API_KEY === 'your_rapidapi_key_here') {
      console.warn("RapidAPI key not found. Cannot fetch flight details.");
      return null;
    }
    
    const response = await fetch(`${API_BASE_URL}/flights/get-more-info?query=${encodeURIComponent(flightNumber)}&fetchBy=flight&page=1&limit=100`, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': API_KEY,
        'X-RapidAPI-Host': API_HOST,
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.result?.response?.data || !Array.isArray(data.result.response.data) || data.result.response.data.length === 0) {
      console.warn(`No flight details found for flight ${flightNumber}`);
      return null;
    }
    
    // Get the most recent flight data
    const flightData = data.result.response.data[0];
    return transformFlightRadarResponseToFlight(flightData);
    
  } catch (error) {
    console.error("Error getting flight details:", error);
    return null;
  }
}

/**
 * Transform FlightRadar API response to match our Flight type
 * @param apiResponse The API response object
 * @returns Transformed Flight object
 */
function transformFlightRadarResponseToFlight(apiResponse: any): Flight {
  // Generate a unique ID
  const flightIdentifier = apiResponse.identification?.number?.default || `unknown-${uniqueIdCounter++}`;
  const flightDate = new Date().toISOString().split('T')[0]; // Use current date if not available
  
  // Map flight status
  let flightStatus: FlightStatus = 'unknown';
  if (apiResponse.status?.generic?.status?.text) {
    const statusText = apiResponse.status.generic.status.text.toLowerCase();
    if (statusText === 'scheduled') flightStatus = 'scheduled';
    else if (statusText === 'en-route' || statusText === 'en route') flightStatus = 'active';
    else if (statusText === 'landed') flightStatus = 'landed';
    else if (statusText === 'cancelled') flightStatus = 'cancelled';
    else if (statusText === 'diverted') flightStatus = 'diverted';
    else if (statusText.includes('incident')) flightStatus = 'incident';
  }
  
  // Calculate delay if available
  const departureDelay = calculateDelay(
    apiResponse.time?.scheduled?.departure,
    apiResponse.time?.real?.departure
  );
  
  const arrivalDelay = calculateDelay(
    apiResponse.time?.scheduled?.arrival,
    apiResponse.time?.real?.arrival
  );
  
  return {
    id: `${flightIdentifier}-${flightDate}-${Math.random().toString(36).substring(2, 7)}`,
    flight: {
      iata: apiResponse.identification?.number?.default || '',
      icao: apiResponse.identification?.callsign || '',
      number: apiResponse.identification?.number?.default?.replace(/[^0-9]/g, '') || ''
    },
    flight_status: flightStatus,
    flight_date: flightDate,
    airline: {
      name: apiResponse.airline?.name || "Unknown Airline",
      iata: apiResponse.airline?.code?.iata || '',
      icao: apiResponse.airline?.code?.icao || ''
    },
    departure: {
      airport: apiResponse.airport?.origin?.name || "Unknown Airport",
      iata: apiResponse.airport?.origin?.code?.iata || '',
      icao: apiResponse.airport?.origin?.code?.icao || '',
      terminal: apiResponse.airport?.origin?.terminal || undefined,
      gate: apiResponse.airport?.origin?.gate || undefined,
      delay: departureDelay,
      scheduled: apiResponse.time?.scheduled?.departure 
        ? new Date(apiResponse.time.scheduled.departure * 1000).toISOString() 
        : new Date().toISOString(),
      estimated: apiResponse.time?.estimated?.departure 
        ? new Date(apiResponse.time.estimated.departure * 1000).toISOString() 
        : undefined,
      actual: apiResponse.time?.real?.departure 
        ? new Date(apiResponse.time.real.departure * 1000).toISOString() 
        : undefined,
      estimated_runway: undefined,
      actual_runway: undefined
    },
    arrival: {
      airport: apiResponse.airport?.destination?.name || "Unknown Airport",
      iata: apiResponse.airport?.destination?.code?.iata || '',
      icao: apiResponse.airport?.destination?.code?.icao || '',
      terminal: apiResponse.airport?.destination?.terminal || undefined,
      gate: apiResponse.airport?.destination?.gate || undefined,
      baggage: undefined,
      delay: arrivalDelay,
      scheduled: apiResponse.time?.scheduled?.arrival 
        ? new Date(apiResponse.time.scheduled.arrival * 1000).toISOString() 
        : new Date().toISOString(),
      estimated: apiResponse.time?.estimated?.arrival 
        ? new Date(apiResponse.time.estimated.arrival * 1000).toISOString() 
        : undefined,
      actual: apiResponse.time?.real?.arrival 
        ? new Date(apiResponse.time.real.arrival * 1000).toISOString() 
        : undefined,
      estimated_runway: undefined,
      actual_runway: undefined
    },
    aircraft: apiResponse.aircraft?.model ? {
      registration: apiResponse.aircraft.registration,
      iata: apiResponse.aircraft.model.code,
      icao: undefined,
      model: apiResponse.aircraft.model.text
    } : undefined,
    live: undefined
  };
}

/**
 * Calculate delay in minutes between scheduled and actual times
 * @param scheduled Scheduled time in Unix timestamp
 * @param actual Actual time in Unix timestamp
 * @returns Delay in minutes or undefined if not available
 */
function calculateDelay(scheduled: number | undefined, actual: number | undefined): number | undefined {
  if (!scheduled || !actual) return undefined;
  
  const delayInSeconds = actual - scheduled;
  return Math.round(delayInSeconds / 60); // Convert to minutes
} 