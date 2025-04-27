import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Combines class names with Tailwind CSS
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a date string to a readable format in UTC
 * @param dateString ISO date string
 * @returns Formatted date string (e.g., "Mar 15, 2025")
 */
export function formatDate(dateString: string): string {
  if (!dateString) return "N/A"
  
  // Create date object and ensure we're using UTC
  const hasTimezone = dateString.includes('Z') || dateString.includes('+') || dateString.includes('-');
  let date;
  
  if (!hasTimezone) {
    // If no timezone info, assume UTC
    date = new Date(dateString + 'Z');
  } else {
    // If it has timezone, convert to UTC
    const tempDate = new Date(dateString);
    date = new Date(Date.UTC(
      tempDate.getUTCFullYear(),
      tempDate.getUTCMonth(), 
      tempDate.getUTCDate(),
      tempDate.getUTCHours(),
      tempDate.getUTCMinutes(),
      tempDate.getUTCSeconds()
    ));
  }
  
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    timeZone: "UTC",
  }).format(date)
}

/**
 * Format a time string to a readable format in UTC
 * @param dateString ISO date string
 * @returns Formatted time string (e.g., "08:00 AM UTC")
 */
export function formatTime(dateString: string): string {
  if (!dateString) return "N/A"
  
  // Create date object and ensure we're using UTC
  const hasTimezone = dateString.includes('Z') || dateString.includes('+') || dateString.includes('-');
  let date;
  
  if (!hasTimezone) {
    // If no timezone info, assume UTC
    date = new Date(dateString + 'Z');
  } else {
    // If it has timezone, convert to UTC
    const tempDate = new Date(dateString);
    date = new Date(Date.UTC(
      tempDate.getUTCFullYear(),
      tempDate.getUTCMonth(), 
      tempDate.getUTCDate(),
      tempDate.getUTCHours(),
      tempDate.getUTCMinutes(),
      tempDate.getUTCSeconds()
    ));
  }
  
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "numeric",
    hour12: true,
    timeZone: "UTC",
  }).format(date)
}

/**
 * Calculate the duration between two date strings - always in UTC
 * @param startDateString ISO date string for start time
 * @param endDateString ISO date string for end time
 * @param flightDate Optional flight date context
 * @returns Formatted duration string (e.g., "3h 30m")
 */
export function calculateDuration(
  startDateString: string, 
  endDateString: string, 
  flightDate?: string
): string {
  if (!startDateString || !endDateString) return "N/A"
  
  // Create standardized Date objects in UTC
  let startDate: Date, endDate: Date;
  
  // Get the next day of the flight date if available
  let nextDayDate: string | undefined;
  if (flightDate) {
    const nextDay = new Date(flightDate);
    nextDay.setDate(nextDay.getDate() + 1);
    nextDayDate = nextDay.toISOString().split('T')[0];
  }
  
  // Process start date - always treat as UTC
  if (!startDateString.includes('Z') && !startDateString.includes('+') && !startDateString.includes('-')) {
    // If no timezone, explicitly add Z to treat as UTC
    const [datePart, timePart] = startDateString.split('T');
    if (timePart) {
      // If we have a time part and a date part, combine them
      startDate = new Date(`${datePart || flightDate}T${timePart}Z`);
    } else {
      // If just a date or time, use with flight date context if available
      startDate = new Date(startDateString + 'Z');
    }
  } else {
    // If it already has timezone info, convert to UTC
    const tempDate = new Date(startDateString);
    startDate = new Date(Date.UTC(
      tempDate.getUTCFullYear(),
      tempDate.getUTCMonth(),
      tempDate.getUTCDate(),
      tempDate.getUTCHours(),
      tempDate.getUTCMinutes(),
      tempDate.getUTCSeconds()
    ));
  }
  
  // Process end date - always treat as UTC
  if (!endDateString.includes('Z') && !endDateString.includes('+') && !endDateString.includes('-')) {
    // If no timezone, explicitly add Z to treat as UTC
    const [datePart, timePart] = endDateString.split('T');
    if (timePart) {
      // If we have a time part
      endDate = new Date(`${datePart || flightDate}T${timePart}Z`);
      
      // For arrival, if it appears to be earlier than departure, assume it's the next day
      if (endDate < startDate && flightDate && !datePart) {
        endDate = new Date(`${nextDayDate}T${timePart}Z`);
      }
    } else {
      endDate = new Date(endDateString + 'Z');
    }
  } else {
    // If it already has timezone info, convert to UTC
    const tempDate = new Date(endDateString);
    endDate = new Date(Date.UTC(
      tempDate.getUTCFullYear(),
      tempDate.getUTCMonth(),
      tempDate.getUTCDate(),
      tempDate.getUTCHours(),
      tempDate.getUTCMinutes(),
      tempDate.getUTCSeconds()
    ));
  }
  
  // Calculate duration in minutes
  const durationMinutes = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60))
  
  // If the duration is negative, it likely means the flight arrives the next day
  // Try again with the end date set to the next day if we have a flight date
  if (durationMinutes < 0 && flightDate && !endDateString.includes('T')) {
    // This is a fallback in case our earlier next-day logic failed
    const correctedEndDate = new Date(`${nextDayDate}T${endDateString.split('T')[1] || '00:00:00'}Z`);
    const correctedDuration = Math.floor((correctedEndDate.getTime() - startDate.getTime()) / (1000 * 60));
    
    if (correctedDuration >= 0) {
      const hours = Math.floor(correctedDuration / 60);
      const minutes = correctedDuration % 60;
      return `${hours}h ${minutes}m`;
    }
  }
  
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
    case "active":
    case "en-route":
      return "This flight is currently in the air and en route to its destination."
    case "arrived":
    case "landed":
      return "This flight has landed at its destination."
    case "delayed":
      return "This flight is experiencing a delay."
    case "cancelled":
      return "This flight has been cancelled."
    case "incident":
      return "This flight is experiencing an incident. Check with the airline for more information."
    case "diverted":
      return "This flight has been diverted from its original destination."
    case "unknown":
      return "The current status of this flight is unknown."
    default:
      return "Status information is not available."
  }
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount)
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength)}...`
}

/**
 * Format a date string to a readable format consistently in UTC
 * @param dateString ISO date string
 * @param flightDate Optional flight date for context (YYYY-MM-DD)
 * @returns Formatted date string with UTC indicator (e.g., "Mar 15, 2025, 08:00 AM UTC")
 */
export function formatDateWithTimezone(dateString: string, flightDate?: string): string {
  if (!dateString) return "N/A";
  
  // First, check if the dateString already includes timezone information
  const hasTimezone = dateString.includes('Z') || dateString.includes('+') || dateString.includes('-');
  
  let date;
  if (!hasTimezone) {
    // If no timezone in the string, always treat it as UTC
    const [datePart, timePart] = dateString.split('T');
    
    // If we have a flight date but only time in the string, combine them
    if (flightDate && !datePart && timePart) {
      date = new Date(`${flightDate}T${timePart}Z`);
    } 
    // If we have both date and time
    else if (timePart) {
      date = new Date(`${datePart}T${timePart}Z`);
    } 
    // If only date part is available (no time), use 12:00 UTC to avoid date shifts
    else {
      date = new Date(`${datePart || flightDate}T12:00:00Z`);
    }
  } else {
    // If timezone info is already in the string, convert it to UTC
    const originalDate = new Date(dateString);
    // Create a new Date object with UTC time values from the original date
    date = new Date(Date.UTC(
      originalDate.getUTCFullYear(),
      originalDate.getUTCMonth(),
      originalDate.getUTCDate(),
      originalDate.getUTCHours(),
      originalDate.getUTCMinutes(),
      originalDate.getUTCSeconds()
    ));
  }
  
  // Use UTC formatter
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    timeZone: "UTC",
    timeZoneName: "short"
  }).format(date);
}
