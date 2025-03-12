import { z } from "zod";

// Flight search parameters schema
export const flightSearchSchema = z.object({
  flightNumber: z.string().optional(),
  airline: z.string().optional(),
  departureAirport: z.string().optional(),
  arrivalAirport: z.string().optional(),
  date: z.string().optional(),
}).refine(data => {
  // Ensure at least one search parameter is provided
  return !!(data.flightNumber || data.airline || 
    (data.departureAirport && data.arrivalAirport));
}, {
  message: "At least one search parameter is required",
});

export type FlightSearchParams = z.infer<typeof flightSearchSchema>;

// Flight data interface
export interface Flight {
  id: string;
  flightNumber: string;
  airline: string;
  departureAirport: string;
  arrivalAirport: string;
  departureTime: string;
  arrivalTime: string;
  status: string;
  terminal?: string;
  gate?: string;
}

// Mock flight data for development
const generateMockFlights = (count: number): Flight[] => {
  const airlines = ["Delta", "American", "United", "Southwest", "JetBlue"];
  const airports = ["JFK", "LAX", "ORD", "ATL", "DFW", "SFO", "MIA", "DEN"];
  const statuses = ["Scheduled", "On Time", "Delayed", "Cancelled", "Landed"];

  return Array.from({ length: count }, (_, i) => {
    const departureTime = new Date();
    departureTime.setHours(departureTime.getHours() + Math.floor(Math.random() * 24));
    
    const arrivalTime = new Date(departureTime);
    arrivalTime.setHours(arrivalTime.getHours() + 1 + Math.floor(Math.random() * 5));
    
    return {
      id: `flight-${i + 1}`,
      flightNumber: `FL${1000 + i}`,
      airline: airlines[Math.floor(Math.random() * airlines.length)],
      departureAirport: airports[Math.floor(Math.random() * airports.length)],
      arrivalAirport: airports[Math.floor(Math.random() * airports.length)],
      departureTime: departureTime.toISOString(),
      arrivalTime: arrivalTime.toISOString(),
      status: statuses[Math.floor(Math.random() * statuses.length)],
      terminal: `T${Math.floor(Math.random() * 5) + 1}`,
      gate: `G${Math.floor(Math.random() * 20) + 1}`,
    };
  });
};

// Mock flight data
const mockFlights = generateMockFlights(50);

/**
 * Search for flights based on provided parameters
 * In a real application, this would connect to an external flight data API
 */
export async function searchFlights(params: {
  flightNumber?: string;
  airline?: string;
  departureAirport?: string;
  arrivalAirport?: string;
  date?: string;
}): Promise<Flight[]> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // Filter flights based on search criteria
  return mockFlights.filter(flight => {
    if (params.flightNumber && !flight.flightNumber.toLowerCase().includes(params.flightNumber.toLowerCase())) {
      return false;
    }
    if (params.airline && !flight.airline.toLowerCase().includes(params.airline.toLowerCase())) {
      return false;
    }
    if (params.departureAirport && !flight.departureAirport.toLowerCase().includes(params.departureAirport.toLowerCase())) {
      return false;
    }
    if (params.arrivalAirport && !flight.arrivalAirport.toLowerCase().includes(params.arrivalAirport.toLowerCase())) {
      return false;
    }
    if (params.date) {
      const searchDate = new Date(params.date).toDateString();
      const flightDate = new Date(flight.departureTime).toDateString();
      if (searchDate !== flightDate) {
        return false;
      }
    }
    return true;
  });
}

/**
 * Get detailed information for a specific flight
 */
export async function getFlightDetails(flightNumber: string): Promise<Flight | null> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const flight = mockFlights.find(f => f.flightNumber === flightNumber);
  return flight || null;
}

/**
 * In a real application, this would connect to a real flight tracking API
 * For now, we'll return mock data
 */
export async function trackFlight(flightNumber: string): Promise<Flight | null> {
  return getFlightDetails(flightNumber);
}

// Flight search schema for validation
export const FlightSearchSchema = z.object({
  flightNumber: z.string().optional(),
  airline: z.string().optional(),
  departureAirport: z.string().optional(),
  arrivalAirport: z.string().optional(),
  date: z.string().optional(),
}); 
} 