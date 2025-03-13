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
