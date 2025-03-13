import { Flight, FlightStatus } from "@/types/flight";

// AviationStack API base URL
const API_BASE_URL = "http://api.aviationstack.com/v1";
const API_KEY = process.env.NEXT_PUBLIC_AVIATIONSTACK_API_KEY || "your_api_key_here";

// Counter for generating unique IDs when flight identifiers are missing
let uniqueIdCounter = 0;

/**
 * Fetch airports from the AviationStack API
 * @returns Array of airports formatted for ComboboxOption
 */
export async function fetchAirports() {
  try {
    // Build query parameters
    const queryParams = new URLSearchParams();
    queryParams.append("access_key", API_KEY);
    
    // Make API request
    const response = await fetch(`${API_BASE_URL}/airports?${queryParams.toString()}`);
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    const data = await response.json();
    
    // Transform API response to match our Airport type
    return data.data
      .filter((airport: any) => airport.iata_code) // Only include airports with IATA codes
      .map((airport: any) => ({
        value: airport.iata_code.toLowerCase(),
        label: airport.airport_name,
        code: airport.iata_code
      }));
  } catch (error) {
    console.error("Error fetching airports:", error);
    // Return a default list of popular airports as fallback
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
      { value: "fra", label: "Frankfurt Airport", code: "FRA" }
    ];
  }
}

/**
 * Fetch airlines from the AviationStack API
 * @returns Array of airlines formatted for ComboboxOption
 */
export async function fetchAirlines() {
  try {
    // Build query parameters
    const queryParams = new URLSearchParams();
    queryParams.append("access_key", API_KEY);
    
    // Make API request
    const response = await fetch(`${API_BASE_URL}/airlines?${queryParams.toString()}`);
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    const data = await response.json();
    
    // Transform API response to match our Airline type
    return data.data
      .filter((airline: any) => airline.iata_code) // Only include airlines with IATA codes
      .map((airline: any) => ({
        value: airline.iata_code.toLowerCase(),
        label: airline.airline_name,
        code: airline.iata_code
      }));
  } catch (error) {
    console.error("Error fetching airlines:", error);
    // Return a default list of popular airlines as fallback
    return [
      { value: "aal", label: "American Airlines", code: "AAL" },
      { value: "dal", label: "Delta Air Lines", code: "DAL" },
      { value: "ual", label: "United Airlines", code: "UAL" },
      { value: "baw", label: "British Airways", code: "BAW" },
      { value: "afr", label: "Air France", code: "AFR" },
      { value: "dlh", label: "Lufthansa", code: "DLH" },
      { value: "uae", label: "Emirates", code: "UAE" },
      { value: "qtr", label: "Qatar Airways", code: "QTR" },
      { value: "cpa", label: "Cathay Pacific", code: "CPA" },
      { value: "sia", label: "Singapore Airlines", code: "SIA" }
    ];
  }
}

/**
 * Search for flights based on various criteria
 * @param params Search parameters
 * @returns Array of flights matching the criteria
 */
export async function searchFlights(params: {
  flightNumber?: string;
  airline?: string;
  departureAirport?: string;
  arrivalAirport?: string;
  date?: string;
}): Promise<Flight[]> {
  try {
    // Build query parameters
    const queryParams = new URLSearchParams();
    queryParams.append("access_key", API_KEY);
    
    if (params.flightNumber) {
      queryParams.append("flight_iata", params.flightNumber);
    }
    
    if (params.airline) {
      queryParams.append("airline_name", params.airline);
    }
    
    if (params.departureAirport) {
      queryParams.append("dep_iata", params.departureAirport);
    }
    
    if (params.arrivalAirport) {
      queryParams.append("arr_iata", params.arrivalAirport);
    }
    
    if (params.date) {
      queryParams.append("flight_date", params.date);
    }
    
    // Make API request
    const response = await fetch(`${API_BASE_URL}/flights?${queryParams.toString()}`);
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    const data = await response.json();
    
    // Reset counter before processing a new batch of flights
    uniqueIdCounter = 0;
    
    // Transform API response to match our Flight type
    return data.data.map((flight: any) => transformApiResponseToFlight(flight));
  } catch (error) {
    console.error("Error searching flights:", error);
    return [];
  }
}

/**
 * Get details for a specific flight by flight number
 * @param flightNumber The flight number (IATA or ICAO code)
 * @returns Flight details or null if not found
 */
export async function getFlightDetails(flightNumber: string): Promise<Flight | null> {
  try {
    // Build query parameters
    const queryParams = new URLSearchParams();
    queryParams.append("access_key", API_KEY);
    queryParams.append("flight_iata", flightNumber);
    
    // Make API request
    const response = await fetch(`${API_BASE_URL}/flights?${queryParams.toString()}`);
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    const data = await response.json();
    
    // Reset counter before processing
    uniqueIdCounter = 0;
    
    // Return the first matching flight or null if none found
    if (data.data && data.data.length > 0) {
      return transformApiResponseToFlight(data.data[0]);
    }
    
    return null;
  } catch (error) {
    console.error("Error getting flight details:", error);
    return null;
  }
}

/**
 * Get tracked flights for a user
 * @param userId The user ID
 * @returns Array of tracked flights
 */
export async function getTrackedFlights(userId: string): Promise<Flight[]> {
  try {
    // This would typically fetch from your database
    // For now, we'll return an empty array
    return [];
  } catch (error) {
    console.error("Error getting tracked flights:", error);
    return [];
  }
}

/**
 * Track a flight for a user
 * @param userId The user ID
 * @param flightId The flight ID to track
 * @returns Success status
 */
export async function trackFlight(userId: string, flightId: string): Promise<boolean> {
  try {
    // This would typically update your database
    // For now, we'll just return success
    return true;
  } catch (error) {
    console.error("Error tracking flight:", error);
    return false;
  }
}

/**
 * Untrack a flight for a user
 * @param userId The user ID
 * @param flightId The flight ID to untrack
 * @returns Success status
 */
export async function untrackFlight(userId: string, flightId: string): Promise<boolean> {
  try {
    // This would typically update your database
    // For now, we'll just return success
    return true;
  } catch (error) {
    console.error("Error untracking flight:", error);
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
      name: apiResponse.airline.name || "Unknown Airline",
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