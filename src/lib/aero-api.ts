import { Flight, FlightStatus } from "@/types/flight";
import { AEROAPI_KEY } from "./env";

// AeroAPI base URL
const AERO_API_BASE_URL = "https://aeroapi.flightaware.com/aeroapi";

// Cache implementation to reduce duplicate API calls
class ApiCache {
  private cache: Record<string, { data: any; expires: number }> = {};

  /**
   * Get an item from cache if it exists and has not expired
   */
  get<T>(key: string): T | null {
    const item = this.cache[key];
    if (!item) return null;
    
    // Return null if item has expired
    if (Date.now() > item.expires) {
      delete this.cache[key];
      return null;
    }
    
    return item.data as T;
  }

  /**
   * Set an item in the cache with appropriate TTL based on flight status
   */
  set<T>(key: string, data: T, status?: string): void {
    // Set TTL based on flight status
    let ttl = 10 * 60 * 1000; // Default: 10 minutes
    
    if (status) {
      switch (status) {
        case "active":
          ttl = 5 * 60 * 1000; // 5 minutes for active flights
          break;
        case "scheduled":
          ttl = 30 * 60 * 1000; // 30 minutes for scheduled flights
          break;
        case "landed":
        case "cancelled":
          ttl = 60 * 60 * 1000; // 1 hour for completed flights
          break;
      }
    }
    
    this.cache[key] = {
      data,
      expires: Date.now() + ttl
    };
  }
  
  /**
   * Remove expired items from cache
   */
  cleanup(): void {
    const now = Date.now();
    Object.keys(this.cache).forEach(key => {
      if (now > this.cache[key].expires) {
        delete this.cache[key];
      }
    });
  }
}

// Initialize cache
const apiCache = new ApiCache();

// Run cache cleanup every 10 minutes
setInterval(() => apiCache.cleanup(), 10 * 60 * 1000);

/**
 * Fetches flight information from AeroAPI with caching
 * @param flightNumber Flight identifier (ICAO or IATA)
 * @returns Flight data or null if not found
 */
export async function fetchFlightInfo(flightNumber: string): Promise<Flight | null> {
  const cacheKey = `flight:${flightNumber}`;
  
  // Check cache first
  const cachedData = apiCache.get<Flight>(cacheKey);
  if (cachedData) {
    console.log(`Using cached data for flight ${flightNumber}`);
    return cachedData;
  }
  
  try {
    console.log(`Fetching flight ${flightNumber} from AeroAPI`);
    
    // Ensure API key is available
    if (!AEROAPI_KEY) {
      throw new Error("AeroAPI key not configured - set AEROAPI_KEY environment variable");
    }
    
    // Make API request
    const response = await fetch(`${AERO_API_BASE_URL}/flights/${flightNumber}`, {
      headers: {
        "x-apikey": AEROAPI_KEY,
      },
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`AeroAPI request failed: ${response.status} - ${JSON.stringify(errorData)}`);
    }
    
    const data = await response.json();
    
    // Transform to our Flight type
    const transformedData = transformAeroApiToFlight(data);
    
    // Store in cache with appropriate TTL
    apiCache.set(cacheKey, transformedData, transformedData.flight_status);
    
    return transformedData;
  } catch (error) {
    console.error("Error fetching flight from AeroAPI:", error);
    return null;
  }
}

/**
 * Fetch information for multiple flights in a single batch where possible
 * @param flightNumbers Array of flight identifiers
 * @returns Object mapping flight numbers to their data
 */
export async function batchFetchFlights(flightNumbers: string[]): Promise<Record<string, Flight>> {
  const results: Record<string, Flight> = {};
  const flightsToFetch: string[] = [];
  
  // Check cache first for each flight
  for (const flightNumber of flightNumbers) {
    const cacheKey = `flight:${flightNumber}`;
    const cachedData = apiCache.get<Flight>(cacheKey);
    
    if (cachedData) {
      results[flightNumber] = cachedData;
    } else {
      flightsToFetch.push(flightNumber);
    }
  }
  
  // If we have flights to fetch, do them in optimal batches
  if (flightsToFetch.length > 0) {
    // Fetch them individually but in parallel with rate limiting
    const fetchPromises = flightsToFetch.map(async (flightNumber, index) => {
      // Simple rate limiting: delay each request by 200ms * index
      // This spreads out requests to avoid hitting rate limits
      await new Promise(resolve => setTimeout(resolve, 200 * index));
      const flightData = await fetchFlightInfo(flightNumber);
      if (flightData) {
        results[flightNumber] = flightData;
      }
    });
    
    await Promise.all(fetchPromises);
  }
  
  return results;
}

/**
 * Transform AeroAPI response to our Flight type
 */
function transformAeroApiToFlight(apiResponse: any): Flight {
  const flightInfo = apiResponse.flights && apiResponse.flights.length > 0 
    ? apiResponse.flights[0] 
    : {};
  
  // Map the AeroAPI response to our Flight type
  const flight: Flight = {
    id: flightInfo.fa_flight_id || `aero-${Date.now()}`,
    flight: {
      number: flightInfo.ident || "",
      iata: flightInfo.ident_iata || "",
      icao: flightInfo.ident_icao || "",
    },
    flight_status: mapFlightStatus(flightInfo),
    airline: {
      name: flightInfo.operator || "",
      iata: flightInfo.operator_iata || "",
      icao: flightInfo.operator_icao || "",
    },
    departure: {
      airport: flightInfo.origin?.name || "",
      iata: flightInfo.origin?.code || "",
      icao: flightInfo.origin?.code_icao || "",
      terminal: flightInfo.origin_terminal || "",
      gate: flightInfo.origin_gate || "",
      scheduled: flightInfo.scheduled_out || "",
      actual: flightInfo.actual_out || "",
    },
    arrival: {
      airport: flightInfo.destination?.name || "",
      iata: flightInfo.destination?.code || "",
      icao: flightInfo.destination?.code_icao || "",
      terminal: flightInfo.destination_terminal || "",
      gate: flightInfo.destination_gate || "",
      scheduled: flightInfo.scheduled_in || "",
      actual: flightInfo.actual_in || "",
    },
    aircraft: flightInfo.aircraft_type ? {
      registration: flightInfo.registration || "",
      iata: flightInfo.aircraft_type_iata || "",
      icao: flightInfo.aircraft_type || "",
      model: flightInfo.aircraft_type_name || "",
    } : undefined,
  };
  
  return flight;
}

/**
 * Maps AeroAPI flight status to our FlightStatus enum
 */
function mapFlightStatus(apiResponse: any): FlightStatus {
  const status = apiResponse.status || "";
  
  if (status.includes("scheduled")) return "scheduled";
  if (status.includes("en-route") || status.includes("en route")) return "active";
  if (status.includes("landed")) return "landed";
  if (status.includes("cancel")) return "cancelled";
  if (status.includes("diverted")) return "diverted";
  
  return "unknown";
}

/**
 * Optimizes the polling frequency based on flight status and proximity
 * @param flight The flight data
 * @returns Recommended seconds until next poll
 */
export function getOptimalPollingInterval(flight: Flight | null): number {
  if (!flight) return 3600; // Default to 1 hour for unknown flights
  
  // Base polling interval on flight status
  switch (flight.flight_status) {
    case "active":
      return 300; // 5 minutes for active flights
      
    case "scheduled":
      // Calculate time until departure
      const departureTime = flight.departure.scheduled ? new Date(flight.departure.scheduled) : null;
      if (!departureTime) return 3600; // 1 hour default if no departure time
      
      const now = new Date();
      const hoursUntilDeparture = (departureTime.getTime() - now.getTime()) / (1000 * 60 * 60);
      
      // Scale polling interval based on proximity to departure
      if (hoursUntilDeparture > 48) {
        return 14400; // 4 hours for flights >48h away
      } else if (hoursUntilDeparture > 24) {
        return 7200; // 2 hours for flights 24-48h away
      } else if (hoursUntilDeparture > 12) {
        return 3600; // 1 hour for flights 12-24h away
      } else if (hoursUntilDeparture > 6) {
        return 1800; // 30 minutes for flights 6-12h away
      } else if (hoursUntilDeparture > 2) {
        return 900; // 15 minutes for flights 2-6h away
      } else {
        return 600; // 10 minutes for flights <2h away
      }
    
    case "landed":
    case "cancelled":
    case "diverted":
      // Less frequent polling for completed flights
      return 7200; // 2 hours
      
    default:
      return 1800; // 30 minutes as default
  }
}

/**
 * Type definitions for AeroAPI responses
 */
interface AirportInfo {
  code: string;
  code_icao: string;
  code_iata: string;
  code_lid: string;
  icao: string; // For compatibility
  airport_info_url: string;
}

interface Aircraft {
  registration: string;
  iata: string;
  icao: string;
}

// Export types for other modules to use
export type { AirportInfo, Aircraft }; 