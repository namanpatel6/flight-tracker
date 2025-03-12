import { Flight } from "@/types/flight";

interface SearchParams {
  flightNumber?: string;
  airline?: string;
  departureAirport?: string;
  arrivalAirport?: string;
  date?: string;
}

/**
 * Search for flights based on provided parameters
 */
export async function searchFlights(params: SearchParams): Promise<Flight[]> {
  // Build search query
  const queryParams = new URLSearchParams();
  
  if (params.flightNumber) {
    queryParams.append("flightNumber", params.flightNumber);
  }
  
  if (params.airline) {
    queryParams.append("airline", params.airline);
  }
  
  if (params.departureAirport) {
    queryParams.append("departureAirport", params.departureAirport);
  }
  
  if (params.arrivalAirport) {
    queryParams.append("arrivalAirport", params.arrivalAirport);
  }
  
  if (params.date) {
    queryParams.append("date", params.date);
  }

  // Fetch flights
  const response = await fetch(`/api/flights/search?${queryParams.toString()}`);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to search flights");
  }

  return response.json();
}

/**
 * Get details for a specific flight by flight number
 */
export async function getFlightDetails(flightNumber: string): Promise<Flight | null> {
  const response = await fetch(`/api/flights/${flightNumber}`);
  
  if (response.status === 404) {
    return null;
  }
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to get flight details");
  }

  return response.json();
}

/**
 * Get all tracked flights for the current user
 */
export async function getTrackedFlights(): Promise<Flight[]> {
  const response = await fetch("/api/flights/tracked");
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to get tracked flights");
  }

  return response.json();
}

/**
 * Track a flight for the current user
 */
export async function trackFlight(flightId: string): Promise<void> {
  const response = await fetch("/api/flights/tracked", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ flightId }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to track flight");
  }
}

/**
 * Untrack a flight for the current user
 */
export async function untrackFlight(flightId: string): Promise<void> {
  const response = await fetch(`/api/flights/tracked/${flightId}`, {
    method: "DELETE",
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to untrack flight");
  }
} 