"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

export function CreateTrackedFlight({ onSuccess }: { onSuccess?: () => void }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [flightNumber, setFlightNumber] = useState("");
  const [date, setDate] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCreateTrackedFlight = async () => {
    // Check authentication
    if (status === "loading") {
      toast.error("Please wait while we check your authentication status");
      return;
    }

    if (!session?.user) {
      toast.error("You must be signed in to track flights");
      return;
    }

    // Validate input
    if (!flightNumber) {
      setError("Flight number is required");
      return;
    }

    if (!date) {
      setError("Date is required");
      return;
    }

    // Format flight number (remove spaces)
    const formattedFlightNumber = flightNumber.trim().replace(/\s+/g, "");

    setIsLoading(true);
    setError("");

    try {
      console.log("Sending request to track flight:", {
        flightNumber: formattedFlightNumber,
        date,
      });

      const response = await fetch("/api/tracked-flights", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          flightNumber: formattedFlightNumber,
          date,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create tracked flight");
      }

      toast.success("Flight tracked successfully");
      setFlightNumber("");
      setDate("");
      setOpen(false);
      
      if (onSuccess) {
        onSuccess();
      }
      
      router.refresh();
    } catch (error) {
      console.error("Error tracking flight:", error);
      setError(error instanceof Error ? error.message : "Failed to create tracked flight");
      toast.error(error instanceof Error ? error.message : "Failed to create tracked flight");
    } finally {
      setIsLoading(false);
    }
  };

  // Set default date to today if not set
  const handleDialogOpen = (open: boolean) => {
    if (open && !date) {
      const today = new Date().toISOString().split('T')[0];
      setDate(today);
    }
    setOpen(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogOpen}>
      <DialogTrigger asChild>
        <Button className="w-full">
          <Plus className="mr-2 h-4 w-4" /> Track New Flight
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Track a Flight</DialogTitle>
          <DialogDescription>
            Enter the flight details to start tracking it.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="flightNumber" className="text-right">
              Flight #
            </Label>
            <Input
              id="flightNumber"
              placeholder="e.g. BA123"
              className="col-span-3"
              value={flightNumber}
              onChange={(e) => setFlightNumber(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="date" className="text-right">
              Date
            </Label>
            <Input
              id="date"
              type="date"
              className="col-span-3"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
        <DialogFooter>
          <Button onClick={handleCreateTrackedFlight} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Tracking...
              </>
            ) : (
              "Track Flight"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 