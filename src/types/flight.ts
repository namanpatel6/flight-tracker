export type FlightStatus = 'SCHEDULED' | 'ON_TIME' | 'DELAYED' | 'DEPARTED' | 'ARRIVED' | 'CANCELLED' | 'DIVERTED';

export interface Flight {
  id: string;
  flightNumber: string;
  airline: string;
  departureAirport: string;
  arrivalAirport: string;
  departureTime: string;
  arrivalTime: string;
  status: FlightStatus;
  terminal?: string;
  gate?: string;
  baggageClaim?: string;
  aircraft?: string;
  createdAt: string;
  updatedAt: string;
} 