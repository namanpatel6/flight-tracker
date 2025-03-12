import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();

// Alert types
export const AlertType = {
  DELAY: "DELAY",
  GATE_CHANGE: "GATE_CHANGE",
  STATUS_CHANGE: "STATUS_CHANGE",
} as const;

export type AlertType = typeof AlertType[keyof typeof AlertType];

// Alert creation schema
export const createAlertSchema = z.object({
  type: z.enum([AlertType.DELAY, AlertType.GATE_CHANGE, AlertType.STATUS_CHANGE]),
  threshold: z.number().optional(),
  flightId: z.string(),
});

export type CreateAlertInput = z.infer<typeof createAlertSchema>;

/**
 * Create an alert for a tracked flight
 */
export async function createAlert(userId: string, data: CreateAlertInput) {
  // Verify the flight belongs to the user
  const flight = await prisma.trackedFlight.findFirst({
    where: {
      id: data.flightId,
      userId,
    },
  });

  if (!flight) {
    throw new Error("Flight not found or you don't have permission to create an alert for it");
  }

  // Create the alert
  return prisma.alert.create({
    data: {
      type: data.type,
      threshold: data.threshold,
      userId,
      flightId: data.flightId,
    },
  });
}

/**
 * Get all alerts for a user
 */
export async function getAlertsForUser(userId: string) {
  return prisma.alert.findMany({
    where: {
      userId,
    },
    include: {
      flight: true,
    },
  });
}

/**
 * Toggle alert active status
 */
export async function toggleAlertStatus(id: string, userId: string) {
  // Verify the alert belongs to the user
  const alert = await prisma.alert.findFirst({
    where: {
      id,
      userId,
    },
  });

  if (!alert) {
    throw new Error("Alert not found or you don't have permission to modify it");
  }

  // Toggle the status
  return prisma.alert.update({
    where: {
      id,
    },
    data: {
      isActive: !alert.isActive,
    },
  });
}

/**
 * Delete an alert
 */
export async function deleteAlert(id: string, userId: string) {
  // Verify the alert belongs to the user
  const alert = await prisma.alert.findFirst({
    where: {
      id,
      userId,
    },
  });

  if (!alert) {
    throw new Error("Alert not found or you don't have permission to delete it");
  }

  // Delete the alert
  return prisma.alert.delete({
    where: {
      id,
    },
  });
} 