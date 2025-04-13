export type FlightStatus = 'scheduled' | 'active' | 'landed' | 'cancelled' | 'incident' | 'diverted' | 'unknown' | 'en-route' | 'arrived';

export interface Airline {
  name?: string;
  iata: string;
  icao: string;
}

export interface FlightIdentifier {
  iata: string;
  icao: string;
  number: string;
}

export interface AirportInfo {
  iata: string;
  icao: string;
  airport?: string;
  terminal?: string;
  gate?: string;
  baggage?: string;
  delay?: number;
  scheduled: string;
  estimated?: string;
  actual?: string;
  estimated_runway?: string;
  actual_runway?: string;
  timezone?: string;
}

export interface Aircraft {
  registration?: string;
  iata?: string;
  icao?: string;
  model?: string;
  type?: string;
}

export interface Price {
  currency: string;
  amount: number;
  formatted: string;
}

export interface Flight {
  id: string;
  flight: FlightIdentifier;
  flight_status: FlightStatus;
  flight_date?: string;
  airline: Airline;
  departure: AirportInfo;
  arrival: AirportInfo;
  aircraft?: Aircraft;
  live?: {
    updated: string;
    latitude: number;
    longitude: number;
    altitude: number;
    direction: number;
    speed_horizontal: number;
    speed_vertical: number;
    is_ground: boolean;
  };
  price?: Price;
  codeshared?: {
    airline_name: string;
    airline_iata: string;
    flight_number: string;
  } | null;
} 