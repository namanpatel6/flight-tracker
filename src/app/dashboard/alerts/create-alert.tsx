"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface CreateAlertProps {
  flightId: string;
  onSuccess?: () => void;
}

type AlertType = "STATUS_CHANGE" | "DELAY" | "GATE_CHANGE" | "DEPARTURE" | "ARRIVAL";

export function CreateAlert({ flightId, onSuccess }: CreateAlertProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [alertType, setAlertType] = useState<AlertType>("STATUS_CHANGE");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateAlert = async () => {
    if (!session?.user) {
      toast.error("You must be signed in to create alerts");
      router.push("/auth/signin");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/alerts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          flightId,
          type: alertType,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create alert");
      }

      toast.success("Alert created successfully");
      setOpen(false);
      
      if (onSuccess) {
        onSuccess();
      }
      
      router.refresh();
    } catch (err) {
      console.error("Error creating alert:", err);
      setError(err instanceof Error ? err.message : "Failed to create alert");
      toast.error("Failed to create alert");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Create Alert</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Flight Alert</DialogTitle>
          <DialogDescription>
            Set up an alert to receive notifications about this flight.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="alert-type" className="text-right">
              Alert Type
            </Label>
            <Select
              value={alertType}
              onValueChange={(value) => setAlertType(value as AlertType)}
            >
              <SelectTrigger id="alert-type" className="col-span-3">
                <SelectValue placeholder="Select alert type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="STATUS_CHANGE">Status Change</SelectItem>
                <SelectItem value="DELAY">Delay</SelectItem>
                <SelectItem value="GATE_CHANGE">Gate Change</SelectItem>
                <SelectItem value="DEPARTURE">Departure Update</SelectItem>
                <SelectItem value="ARRIVAL">Arrival Update</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleCreateAlert} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Alert"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 