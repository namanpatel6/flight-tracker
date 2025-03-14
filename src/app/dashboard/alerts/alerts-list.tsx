"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Bell, BellOff, Trash2 } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Alert {
  id: string;
  type: string;
  isActive: boolean;
  createdAt: string;
  flightId: string;
  flight?: {
    flightNumber: string;
    departureAirport?: string;
    arrivalAirport?: string;
  };
}

export function AlertsList() {
  const { data: session } = useSession();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch alerts on component mount
  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        setLoading(true);
        setError(null);
        
        if (!session?.user) {
          return;
        }
        
        const response = await fetch("/api/alerts");
        
        if (!response.ok) {
          throw new Error("Failed to fetch alerts");
        }
        
        const data = await response.json();
        setAlerts(data);
      } catch (err) {
        console.error("Error fetching alerts:", err);
        setError("Failed to fetch alerts. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchAlerts();
  }, [session]);

  // Toggle alert active status
  const handleToggleAlert = async (id: string, active: boolean) => {
    try {
      setError(null);
      
      const response = await fetch(`/api/alerts/${id}`, {
        method: "PATCH",
      });
      
      if (!response.ok) {
        throw new Error("Failed to update alert");
      }
      
      const data = await response.json();
      
      // Update the alerts list
      setAlerts(prevAlerts => 
        prevAlerts.map(alert => 
          alert.id === id ? { ...alert, isActive: !active } : alert
        )
      );
    } catch (err) {
      console.error("Error toggling alert:", err);
      setError("Failed to update alert. Please try again.");
    }
  };

  // Delete an alert
  const handleDeleteAlert = async (id: string) => {
    try {
      setError(null);
      
      const response = await fetch(`/api/alerts/${id}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        throw new Error("Failed to delete alert");
      }
      
      // Remove the alert from the list
      setAlerts(prevAlerts => prevAlerts.filter(alert => alert.id !== id));
    } catch (err) {
      console.error("Error deleting alert:", err);
      setError("Failed to delete alert. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
        <p className="text-gray-500">Loading alerts...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (alerts.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 mb-4">You don't have any alerts set up yet.</p>
        <p className="text-gray-500">
          Track a flight and set up alerts to receive notifications about status changes, delays, and more.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {alerts.map((alert) => (
        <div key={alert.id} className="border rounded-lg p-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-medium">
                {alert.type === "STATUS_CHANGE" && "Flight Status Change"}
                {alert.type === "DELAY" && "Flight Delay"}
                {alert.type === "GATE_CHANGE" && "Gate Change"}
                {alert.type === "DEPARTURE" && "Departure Update"}
                {alert.type === "ARRIVAL" && "Arrival Update"}
              </h3>
              <p className="text-sm text-gray-600">
                Flight: {alert.flight?.flightNumber || alert.flightId}
                {alert.flight?.departureAirport && alert.flight?.arrivalAirport && (
                  <span> ({alert.flight.departureAirport} → {alert.flight.arrivalAirport})</span>
                )}
              </p>
              <p className="text-xs text-gray-500">
                Created: {formatDate(alert.createdAt)}
              </p>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleToggleAlert(alert.id, alert.isActive)}
              >
                {alert.isActive ? (
                  <>
                    <BellOff className="h-4 w-4 mr-1" />
                    Disable
                  </>
                ) : (
                  <>
                    <Bell className="h-4 w-4 mr-1" />
                    Enable
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDeleteAlert(alert.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
} 