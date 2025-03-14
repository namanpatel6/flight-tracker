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
  const { data: session } = useSession();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [flightNumber, setFlightNumber] = useState("");
  const [date, setDate] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCreateTrackedFlight = async () => {
    if (!session?.user) {
      toast.error("You must be signed in to track flights");
      return;
    }

    if (!flightNumber) {
      setError("Flight number is required");
      return;
    }

    if (!date) {
      setError("Date is required");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/tracked-flights", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          flightNumber,
          date,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to track flight");
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
      setError(error instanceof Error ? error.message : "Failed to track flight");
      toast.error("Failed to track flight");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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