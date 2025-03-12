import { PrismaClient } from "@prisma/client";
import { getFlightDetails } from "./flight-api";

const prisma = new PrismaClient();

/**
 * Track a flight for a user
 */
export async function trackFlightForUser(
  userId: string,
  flightNumber: string,
  airline: string,
  departureAirport: string,
  arrivalAirport: string,
  departureTime?: string,
  arrivalTime?: string
) {
  // Check if flight is already tracked by this user
  const existingTrackedFlight = await prisma.trackedFlight.findFirst({
    where: {
      userId,
      flightNumber,
      airline,
      departureAirport,
      arrivalAirport,
    },
  });

  if (existingTrackedFlight) {
    return existingTrackedFlight;
  }

  // Create new tracked flight
  return prisma.trackedFlight.create({
    data: {
      flightNumber,
      airline,
      departureAirport,
      arrivalAirport,
      departureTime: departureTime ? new Date(departureTime) : undefined,
      arrivalTime: arrivalTime ? new Date(arrivalTime) : undefined,
      status: "Scheduled",
      userId,
    },
  });
}

/**
 * Get all tracked flights for a user
 */
export async function getTrackedFlightsForUser(userId: string) {
  return prisma.trackedFlight.findMany({
    where: {
      userId,
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      alerts: true,
    },
  });
}

/**
 * Delete a tracked flight
 */
export async function deleteTrackedFlight(id: string, userId: string) {
  // Ensure the flight belongs to the user
  const flight = await prisma.trackedFlight.findFirst({
    where: {
      id,
      userId,
    },
  });

  if (!flight) {
    throw new Error("Flight not found or you don't have permission to delete it");
  }

  // Delete the flight
  return prisma.trackedFlight.delete({
    where: {
      id,
    },
  });
}

/**
 * Update tracked flights with latest information
 * In a real application, this would be called by a scheduled job
 */
export async function updateTrackedFlights() {
  const trackedFlights = await prisma.trackedFlight.findMany();
  
  for (const flight of trackedFlights) {
    try {
      // Get latest flight information
      const flightDetails = await getFlightDetails(flight.flightNumber);
      
      if (flightDetails) {
        // Update flight information
        await prisma.trackedFlight.update({
          where: {
            id: flight.id,
          },
          data: {
            departureTime: new Date(flightDetails.departureTime),
            arrivalTime: new Date(flightDetails.arrivalTime),
            status: flightDetails.status,
          },
        });
        
        // Check for alerts (in a real application)
        // This would trigger notifications based on alert settings
      }
    } catch (error) {
      console.error(`Error updating flight ${flight.flightNumber}:`, error);
    }
  }
} 