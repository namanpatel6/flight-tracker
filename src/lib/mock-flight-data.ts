import { Flight, FlightStatus } from "@/types/flight";
import * as fs from 'fs';
import * as path from 'path';

// Folder to store mock flight data
const MOCK_DATA_DIR = path.join(process.cwd(), 'mock-data');

// Counter for generating unique IDs
let uniqueIdCounter = 0;

// Make sure mock data directory exists
if (!fs.existsSync(MOCK_DATA_DIR)) {
  fs.mkdirSync(MOCK_DATA_DIR, { recursive: true });
}

/**
 * Records real flight data for later replay
 * @param flightNumber The flight number
 * @param data The flight data to record
 */
export function recordFlightData(flightNumber: string, data: Flight): void {
  const timestamp = new Date().toISOString().replace(/:/g, '-');
  const filename = path.join(MOCK_DATA_DIR, `${flightNumber}_${timestamp}.json`);
  
  fs.writeFileSync(filename, JSON.stringify(data, null, 2));
  console.log(`Recorded flight data for ${flightNumber} to ${filename}`);
}

/**
 * Gets all recorded flight data for a particular flight
 * @param flightNumber The flight number to get data for
 * @returns Array of flight data snapshots
 */
export function getRecordedFlightData(flightNumber: string): Flight[] {
  if (!fs.existsSync(MOCK_DATA_DIR)) return [];
  
  const files = fs.readdirSync(MOCK_DATA_DIR);
  const flightFiles = files.filter(file => file.startsWith(`${flightNumber}_`));
  
  return flightFiles.map(file => {
    const filePath = path.join(MOCK_DATA_DIR, file);
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content) as Flight;
  });
}

/**
 * Gets the latest recorded flight data
 * @param flightNumber The flight number
 * @returns The latest flight data or null if none exists
 */
export function getLatestRecordedFlightData(flightNumber: string): Flight | null {
  const data = getRecordedFlightData(flightNumber);
  if (data.length === 0) return null;
  
  // Sort by update timestamp in the flight data and get the latest
  const sortedData = [...data].sort((a, b) => {
    const aTime = new Date(a.departure.estimated || a.departure.scheduled || "").getTime();
    const bTime = new Date(b.departure.estimated || b.departure.scheduled || "").getTime();
    return bTime - aTime;
  });
  
  return sortedData[0];
}

/**
 * Simulates flight status changes for testing
 * @param flightNumber The flight number to simulate
 * @param currentStatus Current flight status
 * @returns New simulated flight data
 */
export function simulateFlightStatusChange(flightNumber: string, currentStatus: string): Flight {
  const statusTransitions: Record<string, FlightStatus> = {
    'scheduled': 'active',
    'active': 'en-route',
    'en-route': 'landed',
    'landed': 'arrived',
    'arrived': 'scheduled', // Cycle back to scheduled for testing
  };
  
  // Get existing flight data or create new
  const existingData = getLatestRecordedFlightData(flightNumber);
  const baseData = existingData || createBasicFlightData(flightNumber);
  
  // Update the status
  const newStatus = statusTransitions[currentStatus] || 'scheduled';
  
  // Create new data with updated status
  const newData: Flight = {
    ...baseData,
    flight_status: newStatus,
  };
  
  // Record this new state
  recordFlightData(flightNumber, newData);
  
  return newData;
}

/**
 * Creates basic flight data for a new flight
 */
function createBasicFlightData(flightNumber: string): Flight {
  const now = new Date();
  const departure = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now
  const arrival = new Date(now.getTime() + 3 * 60 * 60 * 1000); // 3 hours from now
  
  return {
    id: `mock-${++uniqueIdCounter}`,
    flight_date: now.toISOString().split('T')[0],
    flight_status: 'scheduled',
    departure: {
      airport: 'LAX',
      timezone: 'America/Los_Angeles',
      iata: 'LAX',
      icao: 'KLAX',
      terminal: '4',
      gate: 'A5',
      delay: 0,
      scheduled: departure.toISOString(),
      estimated: departure.toISOString(),
      actual: departure.toISOString(),
    },
    arrival: {
      airport: 'JFK',
      timezone: 'America/New_York',
      iata: 'JFK',
      icao: 'KJFK',
      terminal: 'B',
      gate: 'B12',
      delay: 0,
      scheduled: arrival.toISOString(),
      estimated: arrival.toISOString(),
      actual: arrival.toISOString(),
    },
    airline: {
      name: flightNumber.startsWith('AA') ? 'American Airlines' : 'United Airlines',
      iata: flightNumber.substring(0, 2),
      icao: flightNumber.startsWith('AA') ? 'AAL' : 'UAL',
    },
    flight: {
      number: flightNumber.substring(2),
      iata: flightNumber,
      icao: `${flightNumber.startsWith('AA') ? 'AAL' : 'UAL'}${flightNumber.substring(2)}`,
    },
    aircraft: undefined,
    live: undefined,
  };
} 