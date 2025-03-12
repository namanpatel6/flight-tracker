import { z } from "zod";

export type AlertType = "STATUS_CHANGE" | "DELAY" | "GATE_CHANGE" | "DEPARTURE" | "ARRIVAL";

export interface Alert {
  id: string;
  userId: string;
  flightId: string;
  type: AlertType;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

const createAlertSchema = z.object({
  flightId: z.string(),
  type: z.enum(["STATUS_CHANGE", "DELAY", "GATE_CHANGE", "DEPARTURE", "ARRIVAL"]),
  active: z.boolean().default(true),
});

export type CreateAlertInput = z.infer<typeof createAlertSchema>;

// Function to create a new alert
export async function createAlert(data: CreateAlertInput): Promise<Alert> {
  const validatedData = createAlertSchema.parse(data);
  
  const response = await fetch("/api/alerts", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(validatedData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to create alert");
  }

  return response.json();
}

// Function to get all alerts for the current user
export async function getUserAlerts(): Promise<Alert[]> {
  const response = await fetch("/api/alerts");

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to fetch alerts");
  }

  return response.json();
}

// Function to toggle an alert's active status
export async function toggleAlert(id: string, active: boolean): Promise<Alert> {
  const response = await fetch(`/api/alerts/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ active }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to update alert");
  }

  return response.json();
}

// Function to delete an alert
export async function deleteAlert(id: string): Promise<void> {
  const response = await fetch(`/api/alerts/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to delete alert");
  }
} 