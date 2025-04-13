import { Flight, FlightStatus } from "@/types/flight";
import { z } from "zod";
import { getFlightDetails as getRadarFlightDetails } from "./flight-radar-api";

// AviationStack API base URL
const API_BASE_URL = "https://api.aviationstack.com/v1";
const API_KEY = process.env.NEXT_PUBLIC_AVIATIONSTACK_API_KEY || "your_api_key_here";

// Log masked API key for debugging
console.log("API Key available:", API_KEY ? `${API_KEY.substring(0, 4)}...${API_KEY.substring(API_KEY.length - 4)}` : "Not set");

// Counter for generating unique IDs when flight identifiers are missing
let uniqueIdCounter = 0;

// Flight search schema for validation
export const flightSearchSchema = z.object({
  flight_iata: z.string().optional(),
  airline_iata: z.string().optional(),
  dep_iata: z.string().optional(),
  arr_iata: z.string().optional(),
  flight_date: z.string().optional(),
  // Additional parameters for scheduled times
  arr_scheduled_time_dep: z.string().optional(),
  arr_scheduled_time_arr: z.string().optional(),
});

/**
 * Fetch airports from the AviationStack API or local JSON file
 * @returns Array of airports formatted for ComboboxOption
 */
export async function fetchAirports() {
  try {
    
    // If JSON file loading fails, try the API
    // Check if API key is available
    if (!API_KEY || API_KEY === 'your_api_key_here') {
      console.warn("AviationStack API key not found. Using fallback airport list.");
      return getFallbackAirports();
    }
    
    // Build query parameters with increased limit for more results
    const queryParams = new URLSearchParams();
    queryParams.append("access_key", API_KEY);
    queryParams.append("limit", "7000"); // Request maximum number of airports
    
    console.log("Fetching airports with URL:", `${API_BASE_URL}/airports?${queryParams.toString()}`);
    
    // Make API request
    const response = await fetch(`${API_BASE_URL}/airports?${queryParams.toString()}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
    
    console.log("API response status:", response.status);
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    const data = await response.json();
    
    // Check if the API returned an error
    if (data.error) {
      console.error("API returned an error:", data.error);
      return getFallbackAirports();
    }
    
    console.log("API response data:", data);
    
    // Check if data.data exists and is an array
    if (!data.data || !Array.isArray(data.data) || data.data.length === 0) {
      console.warn("API returned no airport data. Using fallback list.");
      return getFallbackAirports();
    }
    
    // Transform API response to match our Airport type
    const airports = data.data
      .filter((airport: any) => airport.iata_code && airport.airport_name) // Only include airports with IATA codes and names
      .map((airport: any) => ({
        value: airport.iata_code.toLowerCase(),
        label: `${airport.airport_name} (${airport.iata_code})`,
        code: airport.iata_code
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
 * Fetch airlines from the AviationStack API
 * @returns Array of airlines formatted for ComboboxOption
 */
export async function fetchAirlines() {
  try {
    // Check if API key is available
    if (!API_KEY || API_KEY === 'your_api_key_here') {
      console.warn("AviationStack API key not found. Using fallback airline list.");
      return getFallbackAirlines();
    }
    
    // Build query parameters with increased limit for more results
    const queryParams = new URLSearchParams();
    queryParams.append("access_key", API_KEY);
    queryParams.append("limit", "100"); // Request maximum number of airlines
    
    console.log("Fetching airlines with URL:", `${API_BASE_URL}/airlines?${queryParams.toString()}`);
    
    // Make API request
    const response = await fetch(`${API_BASE_URL}/airlines?${queryParams.toString()}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
    
    console.log("API response status:", response.status);
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    const data = await response.json();
    
    // Check if the API returned an error
    if (data.error) {
      console.error("API returned an error:", data.error);
      return getFallbackAirlines();
    }
    
    console.log("API response data:", data);
    
    // Check if data.data exists and is an array
    if (!data.data || !Array.isArray(data.data) || data.data.length === 0) {
      console.warn("API returned no airline data. Using fallback list.");
      return getFallbackAirlines();
    }
    
    // Transform API response to match our Airline type
    const airlines = data.data
      .filter((airline: any) => airline.iata_code && airline.airline_name) // Only include airlines with IATA codes and names
      .map((airline: any) => ({
        value: airline.iata_code.toLowerCase(),
        label: `${airline.airline_name} (${airline.iata_code})`,
        code: airline.iata_code
      }))
      // Sort airlines alphabetically by label
      .sort((a: { label: string }, b: { label: string }) => a.label.localeCompare(b.label));
      
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
    { value: "aal", label: "American Airlines", code: "AAL" },
    { value: "dal", label: "Delta Air Lines", code: "DAL" },
    { value: "ual", label: "United Airlines", code: "UAL" },
    { value: "baw", label: "British Airways", code: "BAW" },
    { value: "afr", label: "Air France", code: "AFR" },
    { value: "dlh", label: "Lufthansa", code: "DLH" },
    { value: "uae", label: "Emirates", code: "UAE" },
    { value: "qtr", label: "Qatar Airways", code: "QTR" },
    { value: "sia", label: "Singapore Airlines", code: "SIA" },
    { value: "cpa", label: "Cathay Pacific", code: "CPA" },
    { value: "jal", label: "Japan Airlines", code: "JAL" },
    { value: "ana", label: "All Nippon Airways", code: "ANA" },
    { value: "klm", label: "KLM Royal Dutch Airlines", code: "KLM" },
    { value: "thy", label: "Turkish Airlines", code: "THY" },
    { value: "cca", label: "Air China", code: "CCA" }
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
  arr_scheduled_time_dep?: string;
  arr_scheduled_time_arr?: string;
  returnDate?: string;
  tripType?: string;
  passengers?: string;
  cabinClass?: string;
  directOnly?: string;
  flexibleDates?: string;
}): Promise<Flight[]> {
  try {
    // Build query parameters
    const queryParams = new URLSearchParams();
    queryParams.append("access_key", API_KEY);
    
    if (params.flight_iata) {
      queryParams.append("flight_iata", params.flight_iata);
    }
    
    if (params.airline_iata) {
      queryParams.append("airline_iata", params.airline_iata);
    }
    
    if (params.dep_iata) {
      queryParams.append("dep_iata", params.dep_iata);
    }
    
    if (params.arr_iata) {
      queryParams.append("arr_iata", params.arr_iata);
    }
    
    // Use flight_date for backward compatibility
    if (params.flight_date) {
      queryParams.append("flight_date", params.flight_date);
    }
    
    // Add the new scheduled time parameters
    if (params.arr_scheduled_time_dep) {
      queryParams.append("arr_scheduled_time_dep", params.arr_scheduled_time_dep);
    }
    
    if (params.arr_scheduled_time_arr) {
      queryParams.append("arr_scheduled_time_arr", params.arr_scheduled_time_arr);
    }
    
    // Note: AviationStack API doesn't directly support these parameters,
    // but we're including them for future implementation or filtering
    // on the client side
    
    // Make API request
    console.log(`${API_BASE_URL}/flights?${queryParams.toString()}`);
    const response = await fetch(`${API_BASE_URL}/flights?${queryParams.toString()}`);
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    const data = await response.json();
    
    // Reset counter before processing a new batch of flights
    uniqueIdCounter = 0;
    
    let flights = data.data.map((flight: any) => transformApiResponseToFlight(flight));
    
    // Client-side filtering for parameters not supported by the API
    if (params.directOnly === "true") {
      flights = flights.filter((flight: Flight) => !flight.departure.delay && !flight.arrival.delay);
    }
    
    // Additional filtering based on cabin class could be implemented here
    
    return flights;
  } catch (error) {
    console.error("Error searching flights:", error);
    return [];
  }
}

/**
 * Get details for a specific flight
 * @param flightNumber The flight number (IATA or ICAO code)
 * @returns Flight details or null if not found
 */
export async function getFlightDetails(flightNumber: string): Promise<Flight | null> {
  try {
    // Use the Flight Radar API to get flight details
    return await getRadarFlightDetails(flightNumber);
  } catch (error) {
    console.error("Error getting flight details:", error);
    return null;
  }
}

/**
 * Get tracked flights for a user
 * @param userId The user's ID
 * @returns Array of tracked flights
 */
export async function getTrackedFlights(userId: string): Promise<Flight[]> {
  try {
    if (!userId) return [];
    
    const response = await fetch(`/api/tracked-flights`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch tracked flights: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error in getTrackedFlights:", error);
    return [];
  }
}

/**
 * Track a flight for a user
 * @param userId The user's ID
 * @param flightId The flight ID to track
 * @returns True if successful, false otherwise
 */
export async function trackFlight(userId: string, flightId: string): Promise<boolean> {
  try {
    if (!userId || !flightId) return false;
    
    // First check if this flight is already in the tracked flights
    const trackedFlights = await getTrackedFlights(userId);
    if (trackedFlights.some(tf => tf.id === flightId)) {
      console.log(`Flight ${flightId} is already tracked by user ${userId}`);
      return true;
    }
    
    // Get the flight details directly from the search results state
    // We'll extract flight data from our local context instead of making another API call
    
    // Make a request to track the flight using just the flight number and date
    const response = await fetch(`/api/tracked-flights`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        flightId,
      }),
    });
    
    if (!response.ok) {
      // If the error is that the flight is already tracked, still return true
      if (response.status === 400) {
        const data = await response.json();
        if (data.message === "You are already tracking this flight") {
          return true;
        }
      }
      throw new Error(`Failed to track flight: ${response.statusText}`);
    }
    
    return true;
  } catch (error) {
    console.error("Error in trackFlight:", error);
    return false;
  }
}

/**
 * Untrack a flight for a user
 * @param userId The user's ID
 * @param flightId The flight ID to untrack
 * @returns True if successful, false otherwise
 */
export async function untrackFlight(userId: string, flightId: string): Promise<boolean> {
  try {
    if (!userId || !flightId) return false;
    
    // Check if this flight is already tracked
    const trackedFlights = await getTrackedFlights(userId);
    const trackedFlight = trackedFlights.find(tf => tf.id === flightId);
    
    if (!trackedFlight) {
      console.warn(`Flight ${flightId} is not tracked by user ${userId}`);
      return false;
    }
    
    // Delete the tracked flight
    const response = await fetch(`/api/tracked-flights/${trackedFlight.id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to untrack flight: ${response.statusText}`);
    }
    
    return true;
  } catch (error) {
    console.error("Error in untrackFlight:", error);
    return false;
  }
}

/**
 * Transform API response to match our Flight type
 * @param apiResponse The API response object
 * @returns Transformed Flight object
 */
function transformApiResponseToFlight(apiResponse: any): Flight {
  // Generate a unique ID even if flight identifiers are missing
  const flightIdentifier = apiResponse.flight.iata || apiResponse.flight.icao || `unknown-${uniqueIdCounter++}`;
  const flightDate = apiResponse.flight_date || new Date().toISOString().split('T')[0];
  
  return {
    id: `${flightIdentifier}-${flightDate}-${Math.random().toString(36).substring(2, 7)}`,
    flight: {
      iata: apiResponse.flight.iata || null,
      icao: apiResponse.flight.icao || null,
      number: apiResponse.flight.number || null
    },
    flight_status: apiResponse.flight_status as FlightStatus,
    airline: {
      iata: apiResponse.airline.iata || null,
      icao: apiResponse.airline.icao || null
    },
    departure: {
      airport: apiResponse.departure.airport || "Unknown Airport",
      iata: apiResponse.departure.iata || null,
      icao: apiResponse.departure.icao || null,
      terminal: apiResponse.departure.terminal || null,
      gate: apiResponse.departure.gate || null,
      delay: apiResponse.departure.delay || null,
      scheduled: apiResponse.departure.scheduled || new Date().toISOString(),
      estimated: apiResponse.departure.estimated || null,
      actual: apiResponse.departure.actual || null,
      estimated_runway: apiResponse.departure.estimated_runway || null,
      actual_runway: apiResponse.departure.actual_runway || null
    },
    arrival: {
      airport: apiResponse.arrival.airport || "Unknown Airport",
      iata: apiResponse.arrival.iata || null,
      icao: apiResponse.arrival.icao || null,
      terminal: apiResponse.arrival.terminal || null,
      gate: apiResponse.arrival.gate || null,
      baggage: apiResponse.arrival.baggage || null,
      delay: apiResponse.arrival.delay || null,
      scheduled: apiResponse.arrival.scheduled || new Date().toISOString(),
      estimated: apiResponse.arrival.estimated || null,
      actual: apiResponse.arrival.actual || null,
      estimated_runway: apiResponse.arrival.estimated_runway || null,
      actual_runway: apiResponse.arrival.actual_runway || null
    },
    aircraft: apiResponse.aircraft ? {
      registration: apiResponse.aircraft.registration || null,
      iata: apiResponse.aircraft.iata || null,
      icao: apiResponse.aircraft.icao || null,
      model: apiResponse.aircraft.model || null
    } : undefined,
    live: apiResponse.live ? {
      updated: apiResponse.live.updated || new Date().toISOString(),
      latitude: apiResponse.live.latitude || 0,
      longitude: apiResponse.live.longitude || 0,
      altitude: apiResponse.live.altitude || 0,
      direction: apiResponse.live.direction || 0,
      speed_horizontal: apiResponse.live.speed_horizontal || 0,
      speed_vertical: apiResponse.live.speed_vertical || 0,
      is_ground: apiResponse.live.is_ground || false
    } : undefined
  };
} 