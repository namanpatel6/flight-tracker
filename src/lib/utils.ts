import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Combines class names with Tailwind CSS
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a date string to a readable format
 * @param dateString ISO date string
 * @returns Formatted date string (e.g., "Mar 15, 2025")
 */
export function formatDate(dateString: string): string {
  if (!dateString) return "N/A"
  
  const date = new Date(dateString)
  
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date)
}

/**
 * Format a time string to a readable format
 * @param dateString ISO date string
 * @returns Formatted time string (e.g., "08:00 AM")
 */
export function formatTime(dateString: string): string {
  if (!dateString) return "N/A"
  
  const date = new Date(dateString)
  
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  }).format(date)
}

/**
 * Calculate the duration between two date strings
 * @param startDateString ISO date string for start time
 * @param endDateString ISO date string for end time
 * @returns Formatted duration string (e.g., "3h 30m")
 */
export function calculateDuration(startDateString: string, endDateString: string): string {
  if (!startDateString || !endDateString) return "N/A"
  
  const startDate = new Date(startDateString)
  const endDate = new Date(endDateString)
  
  // Calculate duration in minutes
  const durationMinutes = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60))
  
  if (durationMinutes < 0) return "Invalid duration"
  
  const hours = Math.floor(durationMinutes / 60)
  const minutes = durationMinutes % 60
  
  return `${hours}h ${minutes}m`
}

/**
 * Get a human-readable status description
 * @param status Flight status
 * @returns Human-readable status description
 */
export function getStatusDescription(status: string): string {
  switch (status.toLowerCase()) {
    case "scheduled":
      return "This flight is scheduled to depart as planned."
    case "on time":
      return "This flight is on time and proceeding as scheduled."
    case "delayed":
      return "This flight is experiencing a delay."
    case "cancelled":
      return "This flight has been cancelled."
    case "landed":
      return "This flight has landed at its destination."
    default:
      return "Status information is not available."
  }
}

// Popular airports data
export const popularAirports = [
  { value: "JFK", label: "John F. Kennedy International Airport", code: "JFK" },
  { value: "LAX", label: "Los Angeles International Airport", code: "LAX" },
  { value: "LHR", label: "London Heathrow Airport", code: "LHR" },
  { value: "CDG", label: "Paris Charles de Gaulle Airport", code: "CDG" },
  { value: "DXB", label: "Dubai International Airport", code: "DXB" },
  { value: "HND", label: "Tokyo Haneda Airport", code: "HND" },
  { value: "SIN", label: "Singapore Changi Airport", code: "SIN" },
  { value: "SYD", label: "Sydney Kingsford Smith Airport", code: "SYD" },
  { value: "FRA", label: "Frankfurt Airport", code: "FRA" },
  { value: "AMS", label: "Amsterdam Airport Schiphol", code: "AMS" },
  { value: "HKG", label: "Hong Kong International Airport", code: "HKG" },
  { value: "ICN", label: "Seoul Incheon International Airport", code: "ICN" },
  { value: "BKK", label: "Bangkok Suvarnabhumi Airport", code: "BKK" },
  { value: "DEL", label: "Delhi Indira Gandhi International Airport", code: "DEL" },
  { value: "MAD", label: "Madrid Barajas Airport", code: "MAD" },
  { value: "BCN", label: "Barcelona El Prat Airport", code: "BCN" },
  { value: "MUC", label: "Munich Airport", code: "MUC" },
  { value: "FCO", label: "Rome Fiumicino Airport", code: "FCO" },
  { value: "YYZ", label: "Toronto Pearson International Airport", code: "YYZ" },
  { value: "MEX", label: "Mexico City International Airport", code: "MEX" },
]

// Popular airlines data
export const popularAirlines = [
  { value: "AAL", label: "American Airlines", code: "AA" },
  { value: "DAL", label: "Delta Air Lines", code: "DL" },
  { value: "UAL", label: "United Airlines", code: "UA" },
  { value: "BAW", label: "British Airways", code: "BA" },
  { value: "AFR", label: "Air France", code: "AF" },
  { value: "DLH", label: "Lufthansa", code: "LH" },
  { value: "UAE", label: "Emirates", code: "EK" },
  { value: "QTR", label: "Qatar Airways", code: "QR" },
  { value: "SIA", label: "Singapore Airlines", code: "SQ" },
  { value: "CPA", label: "Cathay Pacific", code: "CX" },
  { value: "ANA", label: "All Nippon Airways", code: "NH" },
  { value: "JAL", label: "Japan Airlines", code: "JL" },
  { value: "KAL", label: "Korean Air", code: "KE" },
  { value: "THY", label: "Turkish Airlines", code: "TK" },
  { value: "ETD", label: "Etihad Airways", code: "EY" },
  { value: "QFA", label: "Qantas", code: "QF" },
  { value: "VIR", label: "Virgin Atlantic", code: "VS" },
  { value: "IBE", label: "Iberia", code: "IB" },
  { value: "CSN", label: "China Southern Airlines", code: "CZ" },
  { value: "CES", label: "China Eastern Airlines", code: "MU" },
]

// Cabin classes
export const cabinClasses = [
  { value: "economy", label: "Economy" },
  { value: "premium_economy", label: "Premium Economy" },
  { value: "business", label: "Business" },
  { value: "first", label: "First Class" },
]

// Flight statuses
export const flightStatuses = [
  { value: "scheduled", label: "Scheduled" },
  { value: "active", label: "Active" },
  { value: "landed", label: "Landed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "incident", label: "Incident" },
  { value: "diverted", label: "Diverted" },
]

// Generate passenger options
export function generatePassengerOptions(max: number) {
  return Array.from({ length: max }, (_, i) => ({
    value: String(i + 1),
    label: String(i + 1),
  }))
}
