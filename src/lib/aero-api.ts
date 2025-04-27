import { Flight, FlightStatus } from "@/types/flight";
import { AEROAPI_KEY } from "./env";
import { date, z } from "zod";

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

// AeroAPI configuration
const API_BASE_URL = "https://aeroapi.flightaware.com/aeroapi";
const API_KEY = AEROAPI_KEY || "";

// Counter for generating unique IDs when flight identifiers are missing
let uniqueIdCounter = 0;

/**
 * Calculate the next day from a date string without timezone issues
 * @param dateString Date string in YYYY-MM-DD format
 * @returns Next day in YYYY-MM-DD format
 */
function calculateNextDayFromDateString(dateString: string): string {
  // Split the date string into year, month, and day
  const [year, month, day] = dateString.split('-').map(Number);
  
  // Create a date object with explicit parts to avoid timezone issues
  // Month is 0-based in JavaScript, so subtract 1
  const date = new Date(Date.UTC(year, month - 1, day));
  
  // Add one day to the date
  date.setUTCDate(date.getUTCDate() + 1);
  
  // Format the date back to YYYY-MM-DD
  return date.toISOString().split('T')[0];
}

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
 * Search for flights using the schedules endpoint
 * @param params Search parameters including flight number, airline, and date
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
    if (!API_KEY) {
      console.warn("FlightAware AeroAPI key not found. Using fallback flight data.");
      return [];
    }
    
    // Get date parameters - if no date provided, use today
    const searchDate = params.flight_date || new Date().toISOString().split('T')[0];
    
    // Log the exact search date for debugging
    console.log(`Using search date: ${searchDate} for AeroAPI request`);
    
    // Construct the schedules endpoint URL with end date one day after the start date
    // Calculate the end date (one day after search date)
    const endDateFormatted = calculateNextDayFromDateString(searchDate);
    let url = `${API_BASE_URL}/schedules/${searchDate}/${endDateFormatted}`;
    
    console.log(`Search date range: ${searchDate} to ${endDateFormatted}`);
    
    // Build query parameters
    const queryParams = new URLSearchParams();
    
    // Save original flight_iata for exact matching later
    const originalFlightIata = params.flight_iata ? params.flight_iata.toUpperCase() : undefined;
    
    // Set up search filters
    if (params.flight_iata) { 
      // AeroAPI expects only the numeric part of the flight number
      // Extract the numeric part if it contains letters
      const flightMatch = params.flight_iata.match(/^[A-Z]{1,3}(\d+)$/i);
      if (flightMatch && flightMatch[1]) {
        // If we have both airline code and flight number in flight_iata (e.g., "AA123")
        console.log(`Extracted flight number ${flightMatch[1]} from ${params.flight_iata}`);
        queryParams.append("flight_number", flightMatch[1]);
        
        // If airline code is not explicitly provided, extract it from flight_iata
        if (!params.airline_iata) {
          const airlineCode = params.flight_iata.replace(/\d+$/, '');
          if (airlineCode) {
            console.log(`Extracted airline code ${airlineCode} from ${params.flight_iata}`);
            queryParams.append("airline", airlineCode);
          }
        }
      } else {
        // If it's already numeric or doesn't match the pattern, use as is
        queryParams.append("flight_number", params.flight_iata);
      }
    }
  
    
    if (params.airline_iata) {
      // If we only have airline code
      queryParams.append("airline", params.airline_iata);
    }
    
    // Add origin/destination filters if provided
    if (params.dep_iata) {
      queryParams.append("origin", params.dep_iata);
    }
    
    if (params.arr_iata) {
      queryParams.append("destination", params.arr_iata);
    }
    
    // Add query parameters to URL if we have any
    if (queryParams.toString()) {
      url = `${url}?${queryParams.toString()}`;
    }
    
    console.log(`Making AeroAPI request to: ${url}`);
    
    // Make API request
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-apikey': API_KEY,
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`AeroAPI request failed with status ${response.status}: ${await response.text()}`);
    }
    
    const data = await response.json();
    
    // Check if we have schedule results
    if (!data.scheduled || !Array.isArray(data.scheduled) || data.scheduled.length === 0) {
      console.warn("No flight schedule results found");
      return [];
    }
    
    // Transform AeroAPI response to our Flight type
    let flights = data.scheduled.map((schedule: any) => 
      transformAeroApiResponseToFlight(schedule, params.flight_date)
    );
    
    // Filter for exact flight number matches if flight_iata was provided
    if (originalFlightIata) {
      flights = flights.filter((flight: Flight) => {
        // Normalize flight numbers for comparison
        const flightIata = flight.flight.iata.toUpperCase();
        return flightIata === originalFlightIata;
      });
      console.log(`Filtered to ${flights.length} exact matches for flight number ${originalFlightIata}`);
    }
    
    console.log(`Found ${flights.length} flights matching search criteria`);
    
    // If we are searching by a specific flight number, attempt to enhance flight details
    // with data from the flights/{ident} endpoint
    if (params.flight_iata && flights.length > 0) {
      const enhancedFlights = await Promise.all(
        flights.map(async (flight: Flight) => {
          try {
            // Try to enhance flight details with status information
            // Pass the search date to updateFlightStatus
            return await updateFlightStatus(
              flight, 
              params.flight_date,
              // For arrival date, calculate +1 day to the departure date, but use string manipulation 
              // to avoid timezone issues with Date objects
              params.flight_date ? calculateNextDayFromDateString(params.flight_date) : undefined
            );
          } catch (error) {
            console.error("Error enhancing flight with status data:", error);
            return flight;
          }
        })
      );
      
      return enhancedFlights;
    }
    
    return flights;
  } catch (error) {
    console.error("Error searching flights:", error);
    return [];
  }
}

/**
 * Extract the date part from a date-time string
 * @param dateTimeString Date-time string in ISO format
 * @returns Date part in YYYY-MM-DD format, or empty string if invalid
 */
function extractDateFromDateTime(dateTimeString: string): string {
  if (!dateTimeString) return '';
  return dateTimeString.split('T')[0];
}

/**
 * Transform an AeroAPI schedule response to our Flight type
 * @param scheduleData The flight schedule data from AeroAPI
 * @param requestedDate The date that was explicitly requested in the search
 * @returns A transformed Flight object
 */
function transformAeroApiResponseToFlight(scheduleData: any, requestedDate?: string): Flight {
  // Generate a unique ID if fa_flight_id is not available
  const uniqueId = scheduleData.fa_flight_id || `generated-${++uniqueIdCounter}`;
  
  // Extract IATA codes from ICAO if available
  const originIata = scheduleData.origin_iata || "";
  const destinationIata = scheduleData.destination_iata || "";
  
  // Extract IATA flight number if available
  const flightIata = scheduleData.ident_iata || scheduleData.ident || "";
  
  // Preserve the original date string directly to avoid timezone conversions
  const departureScheduled = scheduleData.scheduled_out || scheduleData.scheduled_departure || "";
  const arrivalScheduled = scheduleData.scheduled_in || scheduleData.scheduled_arrival || "";
  
  // Determine the flight date - use the requested date if provided, otherwise extract from scheduled time
  const flightDateValue = requestedDate || extractDateFromDateTime(departureScheduled);
  
  // Create the flight object
  return {
    id: uniqueId,
    flight: {
      iata: flightIata,
      icao: scheduleData.ident_icao || "",
      number: scheduleData.ident?.replace(/^[A-Z]{2,3}/i, "") || "",
    },
    airline: {
      iata: scheduleData.operator_iata || "",
      icao: scheduleData.operator_icao || "",
    },
    departure: {
      iata: originIata,
      icao: scheduleData.origin_icao || "",
      terminal: scheduleData.origin_terminal || "",
      gate: scheduleData.origin_gate || "",
      delay: scheduleData.departure_delay || 0,
      scheduled: departureScheduled,
      estimated: scheduleData.estimated_out || scheduleData.estimated_departure || departureScheduled,
      actual: scheduleData.actual_out || "",
      timezone: scheduleData.origin?.timezone || "UTC",
    },
    arrival: {
      iata: destinationIata,
      icao: scheduleData.destination_icao || "",
      terminal: scheduleData.destination_terminal || "",
      gate: scheduleData.destination_gate || "",
      delay: scheduleData.arrival_delay || 0,
      scheduled: arrivalScheduled,
      estimated: scheduleData.estimated_in || scheduleData.estimated_arrival || arrivalScheduled,
      actual: scheduleData.actual_in || "",
      timezone: scheduleData.destination?.timezone || "UTC",
    },
    flight_status: scheduleData.status,
    // Explicitly set the flight date to ensure it matches the requested date
    flight_date: flightDateValue,
    aircraft: {
      registration: scheduleData.aircraft_registration || "",
      type: scheduleData.aircraft_type || "",
    },
    codeshared: scheduleData.codeshares?.length 
      ? { 
          airline_name: scheduleData.codeshares[0]?.airline || "",
          airline_iata: scheduleData.codeshares[0]?.airline_iata || "", 
          flight_number: scheduleData.codeshares[0]?.ident || "" 
        } 
      : null,
    price: undefined, // Will be populated later if include_prices is true
  };
}

/**
 * Determine the optimal polling interval for a flight
 * based on its departure time
 * @param flightData The flight data
 * @returns An object with polling interval in seconds and whether to stop tracking
 */
export function getOptimalPollingInterval(flightData: Flight): { interval: number, stopTracking: boolean } {
  const status = flightData.flight_status.toLocaleLowerCase();
  
  // Immediately stop tracking for completed flights
  if (status.includes('landed') || status.includes('arrived')) {
    return { interval: 0, stopTracking: true };
  }
  
  // Time-based polling for all flights regardless of status
  const scheduledTime = new Date(flightData.departure?.scheduled || 0).getTime();
  const timeUntilDeparture = scheduledTime - Date.now();
  
  // >24 hours: poll every 12 hours
  if (timeUntilDeparture > 24 * 60 * 60 * 1000) {
    return { interval: 12 * 60 * 60, stopTracking: false }; // 12 hours
  } 
  // 12-24 hours: poll every 2 hours
  else if (timeUntilDeparture > 12 * 60 * 60 * 1000) {
    return { interval: 2 * 60 * 60, stopTracking: false }; // 2 hours
  } 
  // <12 hours or in the past (for active flights): poll every 15 minutes
  else {
    return { interval: 15 * 60, stopTracking: false }; // 15 minutes
  }
}

/**
 * Batch fetch multiple flights by flight number
 * to minimize API calls
 * @param flightNumbers Array of flight numbers to fetch
 * @param departureDate Optional departure date for historical flights (ISO format YYYY-MM-DD)
 * @param arrivalDate Optional arrival date for historical flights (ISO format YYYY-MM-DD)
 * @returns Map of flight number to flight data
 */
export async function batchFetchFlights(
  flightNumbers: string[], 
  departureDate?: string,
  arrivalDate?: string
): Promise<Record<string, any>> {
  const result: Record<string, any> = {};
  const searchDate = departureDate || new Date().toISOString().split('T')[0];
  
  // Process in batches to prevent rate limiting
  const batchSize = 5;
  
  for (let i = 0; i < flightNumbers.length; i += batchSize) {
    const batch = flightNumbers.slice(i, i + batchSize);
    
    // Process each flight in the batch
    const promises = batch.map(async (flightNumber) => {
      try {
        // Use getFlightDetails to get enhanced flight data with status
        const flightDetails = await getFlightDetails(flightNumber, searchDate, arrivalDate);
        
        if (flightDetails) {
          result[flightNumber] = flightDetails;
        }
      } catch (error) {
        console.error(`Error fetching flight ${flightNumber}:`, error);
      }
    });
    
    await Promise.all(promises);
    
    // If not the last batch, add a small delay to avoid rate limiting
    if (i + batchSize < flightNumbers.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return result;
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

/**
 * Fetch flight details from the AeroAPI /flights/{ident} endpoint
 * @param flightIdent The flight identifier (IATA or ICAO code)
 * @param departureDate Optional departure date for historical flights (ISO format YYYY-MM-DD)
 * @param arrivalDate Optional arrival date for historical flights (ISO format YYYY-MM-DD)
 * @returns Flight details from the flights endpoint
 */
async function fetchFlightStatus(flightIdent: string, departureDate?: string, arrivalDate?: string): Promise<any | null> {
  try {
    // Check if API key is available
    if (!API_KEY) {
      console.warn("FlightAware AeroAPI key not found. Cannot fetch flight status.");
      return null;
    }
    
    // Check cache first
    const cacheKey = `flight-status-${flightIdent}${departureDate ? '-' + departureDate : ''}${arrivalDate ? '-' + arrivalDate : ''}`;
    const cachedData = apiCache.get<any>(cacheKey);
    if (cachedData) {
      console.log(`Using cached flight status for ${flightIdent}${departureDate ? ' on ' + departureDate : ''}${arrivalDate ? ' to ' + arrivalDate : ''}`);
      return cachedData;
    }
    
    // Extract the numeric part from IATA code if applicable
    let apiIdent = flightIdent;
    // Check if the identifier includes both airline code and flight number (e.g., "AA123")
    const flightMatch = flightIdent.match(/^([A-Z]{2,3})(\d+)$/i);
    if (flightMatch) {
      // Some AeroAPI endpoints can handle full IATA codes, but if there are issues,
      // we could use just the numeric part: apiIdent = flightMatch[2];
      console.log(`Flight identifier ${flightIdent} contains airline code ${flightMatch[1]} and flight number ${flightMatch[2]}`);
    }
    
    // Build the URL based on whether we're looking for current or historical flight
    let url = `${API_BASE_URL}/flights/${apiIdent}`;
    
    // If dates are provided, add start_time and end_time query parameters
    // to get historical flight data for the specified date range
    if (departureDate) {
      const queryParams = new URLSearchParams();
      
      // Create start date from departureDate using the same approach that fixed the schedules endpoint
      // Use the exact departureDate with noon time to avoid timezone issues
      const startDate = new Date(`${departureDate}T12:00:00Z`);
      
      // For end date, use arrivalDate if provided, otherwise use day after departureDate
      let endDate;
      if (arrivalDate) {
        endDate = new Date(`${arrivalDate}T23:59:59Z`);
      } else {
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 1);
      }
      
      queryParams.append("start", startDate.toISOString().split('T')[0]);
      queryParams.append("end", endDate.toISOString().split('T')[0]);
      url = `${url}?${queryParams.toString()}`;
      
      console.log(`Date range for flight lookup: ${startDate.toISOString()} to ${endDate.toISOString()}`);
    }
    
    console.log(`Making AeroAPI request to flights endpoint: ${url}`);
    
    // Make API request
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-apikey': API_KEY,
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      console.warn(`AeroAPI flights endpoint request failed with status ${response.status}: ${await response.text()}`);
      return null;
    }
    
    const data = await response.json();
    
    // Cache the response with an appropriate TTL
    const status = data.flights && data.flights[0]?.status || 'unknown';
    apiCache.set(cacheKey, data, status);
    
    return data;
  } catch (error) {
    console.error("Error fetching flight status:", error);
    return null;
  }
}

/**
 * Enhance flight data with additional details from the flights endpoint
 * @param flight The basic flight data from schedules endpoint
 * @param flightStatusData The detailed flight data from flights endpoint
 * @param departureDateToUse The explicit departure date to preserve
 * @returns Enhanced flight object with additional details
 */
function enhanceFlightWithStatusData(flight: Flight, flightStatusData: any, departureDateToUse?: string): Flight {
  if (!flightStatusData || !flightStatusData.flights || !flightStatusData.flights[0]) {
    console.log("No flight status data available to enhance flight");
    return flight;
  }
  
  const statusData = flightStatusData.flights[0];
  console.log(`Enhancing flight with status data: ${JSON.stringify(statusData.status || 'unknown')}`);
  
  // Create a deep copy of the flight object to avoid mutations
  const enhancedFlight: Flight = JSON.parse(JSON.stringify(flight));
  
  // Preserve the departure date explicitly if provided
  if (departureDateToUse) {
    enhancedFlight.flight_date = departureDateToUse;
    console.log(`Preserved flight date in enhanced flight: ${departureDateToUse}`);
  }
  
  // Update flight status
  if (statusData.status) {
    console.log(`Setting flight status to: ${statusData.status}`);
    enhancedFlight.flight_status = statusData.status;
  }
  
  // Update departure details
  if (statusData.terminal_origin || statusData.gate_origin || statusData.departure_delay || 
      statusData.actual_out || statusData.actual_off || statusData.estimated_off) {
    console.log(`Updating departure details`);
    enhancedFlight.departure = {
      ...enhancedFlight.departure,
      terminal: statusData.terminal_origin || enhancedFlight.departure.terminal,
      gate: statusData.gate_origin || enhancedFlight.departure.gate,
      delay: statusData.departure_delay || enhancedFlight.departure.delay,
      actual: statusData.actual_out || enhancedFlight.departure.actual,
      actual_runway: statusData.actual_off || enhancedFlight.departure.actual_runway,
      estimated_runway: statusData.estimated_off || enhancedFlight.departure.estimated_runway,
    };
  }
  
  // Update arrival details
  if (statusData.terminal_destination || statusData.gate_destination || statusData.arrival_delay || 
      statusData.actual_in || statusData.actual_on || statusData.estimated_on) {
    console.log(`Updating arrival details`);
    enhancedFlight.arrival = {
      ...enhancedFlight.arrival,
      terminal: statusData.terminal_destination || enhancedFlight.arrival.terminal,
      gate: statusData.gate_destination || enhancedFlight.arrival.gate,
      delay: statusData.arrival_delay || enhancedFlight.arrival.delay,
      actual: statusData.actual_in || enhancedFlight.arrival.actual,
      actual_runway: statusData.actual_on || enhancedFlight.arrival.actual_runway,
      estimated_runway: statusData.estimated_on || enhancedFlight.arrival.estimated_runway,
    };
  }
  
  // Update aircraft details if available
  if (statusData.aircraft_type) {
    console.log(`Updating aircraft details`);
    enhancedFlight.aircraft = {
      ...enhancedFlight.aircraft,
      registration: statusData.registration || enhancedFlight.aircraft?.registration,
      type: statusData.aircraft_type || enhancedFlight.aircraft?.type,
    };
  }
  
  // Add live tracking data if available
  if (statusData.last_position) {
    console.log(`Adding live tracking data`);
    enhancedFlight.live = {
      updated: statusData.last_position.timestamp || new Date().toISOString(),
      latitude: statusData.last_position.latitude || 0,
      longitude: statusData.last_position.longitude || 0,
      altitude: statusData.last_position.altitude || 0,
      direction: statusData.last_position.heading || 0,
      speed_horizontal: statusData.last_position.groundspeed || 0,
      speed_vertical: statusData.last_position.vertical_speed || 0,
      is_ground: statusData.last_position.is_ground || false,
    };
  }
  
  console.log(`Enhanced flight with status: ${enhancedFlight.flight_status}`);
  return enhancedFlight;
}

/**
 * Get details for a specific flight by flight number
 * @param flightNumber The flight number (IATA code)
 * @param departureDate Optional departure date for historical flights (ISO format YYYY-MM-DD)
 * @param arrivalDate Optional arrival date for historical flights (ISO format YYYY-MM-DD)
 * @returns Enhanced flight details with status information or null if not found
 */
export async function getFlightDetails(flightNumber: string, departureDate?: string, arrivalDate?: string): Promise<Flight | null> {
  try {
    // Store original flight number for exact matching
    const originalFlightNumber = flightNumber.toUpperCase();
    
    // Extract numeric part from IATA code if applicable
    let searchFlightNumber = flightNumber;
    let searchAirlineCode: string | undefined = undefined;
    
    // Check if the identifier includes both airline code and flight number (e.g., "AA123")
    const flightMatch = flightNumber.match(/^([A-Z]{2,3})(\d+)$/i);
    if (flightMatch) {
      // Use the numeric part for searching
      searchFlightNumber = flightMatch[2];
      // Use the airline code for filtering
      searchAirlineCode = flightMatch[1];
      console.log(`Extracted flight number ${searchFlightNumber} and airline code ${searchAirlineCode} from ${flightNumber}`);
    }
    
    // Use the searchFlights function with the extracted flight number and airline code
    const searchDate = departureDate || new Date().toISOString().split('T')[0];
    const flights = await searchFlights({
      flight_iata: flightNumber, // Pass the full flight number to leverage exact matching in searchFlights
      flight_date: searchDate
    });
    
    // If no flights found from schedules endpoint, return null
    if (!flights || flights.length === 0) {
      return null;
    }
    
    // Filter for exact match (should already be filtered by searchFlights)
    const exactMatchFlight = flights.find(flight => 
      flight.flight.iata.toUpperCase() === originalFlightNumber
    );
    
    if (!exactMatchFlight) {
      console.log(`No exact match found for flight number ${originalFlightNumber}`);
      return null;
    }
    
    // Get the basic flight information
    const basicFlight = exactMatchFlight;
    
    // Fetch detailed status from the flights endpoint
    const statusData = await fetchFlightStatus(flightNumber, departureDate, arrivalDate);
    
    // Enhance the flight with detailed status data if available
    if (statusData) {
      return enhanceFlightWithStatusData(basicFlight, statusData, departureDate);
    }
    
    // Return the basic flight data if status data is not available
    return basicFlight;
  } catch (error) {
    console.error("Error getting flight details:", error);
    return null;
  }
}

/**
 * Update flight status and details from the AeroAPI flights endpoint
 * @param flight The flight to update
 * @param departureDate Optional departure date for historical flights (ISO format YYYY-MM-DD)
 * @param arrivalDate Optional arrival date for historical flights (ISO format YYYY-MM-DD)
 * @returns Enhanced flight with detailed status information
 */
export async function updateFlightStatus(flight: Flight, departureDate?: string, arrivalDate?: string): Promise<Flight> {
  try {
    // Use the flight's IATA code if available, fall back to ICAO
    const flightIdent = flight.flight.iata || flight.flight.icao;
    
    if (!flightIdent) {
      console.warn("No flight identifier available for status update");
      return flight;
    }
    
    // Determine the departure date - use the explicitly provided date, flight_date from the flight object, 
    // or extract it from the scheduled departure
    const departureDateToUse = departureDate || 
                            flight.flight_date || 
                            (flight.departure.scheduled ? extractDateFromDateTime(flight.departure.scheduled) : undefined);
    
    console.log(`Using departure date for flight status update: ${departureDateToUse || 'none provided'}`);
    
    // Fetch detailed status with both dates when available
    const statusData = await fetchFlightStatus(
      flightIdent, 
      departureDateToUse,
      arrivalDate
    );
    
    // Enhance the flight with detailed status data if available
    if (statusData) {
      return enhanceFlightWithStatusData(flight, statusData, departureDateToUse);
    }
    
    // Return the original flight data if status data is not available
    return flight;
  } catch (error) {
    console.error("Error updating flight status:", error);
    return flight;
  }
}