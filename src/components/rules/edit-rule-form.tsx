"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2 } from "lucide-react";

// Define alert types
const ALERT_TYPES = [
  { id: 'STATUS_CHANGE', label: 'Status Change' },
  { id: 'DELAY', label: 'Delay' },
  { id: 'GATE_CHANGE', label: 'Gate Change' },
  { id: 'DEPARTURE', label: 'Departure Update' },
  { id: 'ARRIVAL', label: 'Arrival Update' },
];

interface Alert {
  id: string;
  type: string;
  isActive: boolean;
  flightId?: string | null;
  flight?: {
    id: string;
    flightNumber: string;
  } | null;
}

interface TrackedFlight {
  id: string;
  flightNumber: string;
  departureAirport?: string;
  arrivalAirport?: string;
  departureTime?: string;
}

interface Rule {
  id: string;
  name: string;
  description: string | null;
  operator: string;
  isActive: boolean;
  schedule: string | null;
  createdAt: Date;
  updatedAt: Date;
  alerts: Alert[];
}

// Define props for the component
interface EditRuleFormProps {
  rule: Rule;
}

// Form schema
const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
  schedule: z.string().optional(),
});

// Form values type
type FormValues = z.infer<typeof formSchema>;

export function EditRuleForm({ rule }: EditRuleFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");
  const [alerts, setAlerts] = useState<Alert[]>(rule.alerts || []);
  const [trackedFlights, setTrackedFlights] = useState<TrackedFlight[]>([]);
  const [newAlertType, setNewAlertType] = useState<string>("STATUS_CHANGE");
  const [selectedFlightId, setSelectedFlightId] = useState<string | null>(
    alerts.length > 0 && alerts[0].flightId ? alerts[0].flightId : null
  );
  
  // Debug rule data on load
  useEffect(() => {
    console.log("Rule data loaded:", rule);
    console.log("Initial alerts:", rule.alerts);
  }, [rule]);

  // Fetch tracked flights when component mounts
  useEffect(() => {
    fetchTrackedFlights();
  }, []);

  const fetchTrackedFlights = async () => {
    try {
      const response = await fetch('/api/tracked-flights');
      if (response.ok) {
        const flights = await response.json();
        setTrackedFlights(flights);
        
        // Set default flight if none is selected and there are tracked flights
        if (!selectedFlightId && flights.length > 0) {
          setSelectedFlightId(flights[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching tracked flights:', error);
      toast.error('Failed to load tracked flights');
    }
  };

  // Initialize the form with the rule data
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: rule.name,
      description: rule.description || "",
      isActive: rule.isActive,
      schedule: rule.schedule || "",
    },
  });

  // Get the current rule active status
  const ruleIsActive = form.watch("isActive");

  // Alert management
  const handleAddAlert = () => {
    if (!newAlertType) {
      toast.error("Please select an alert type");
      return;
    }

    if (!selectedFlightId) {
      toast.error("Please select a flight");
      return;
    }

    const newAlert: Alert = {
      id: `temp-${Date.now()}`, // Temporary ID for UI purposes
      type: newAlertType,
      isActive: ruleIsActive, // Set active status based on rule's status
      flightId: selectedFlightId,
      flight: trackedFlights.find(f => f.id === selectedFlightId)
    };
    
    setAlerts([...alerts, newAlert]);
    toast.success("Alert added");
  };

  const handleRemoveAlert = (index: number) => {
    const newAlerts = [...alerts];
    newAlerts.splice(index, 1);
    setAlerts(newAlerts);
  };

  const handleToggleAlert = (index: number) => {
    // This function now does nothing as alerts should follow the rule's active status
    // Left for backward compatibility
  };

  async function onSubmit(values: FormValues) {
    try {
      setIsSubmitting(true);
      
      // Log current state before submission
      console.log("Submitting with alerts:", alerts);
      
      // Clean up the values
      const payload = {
        ...values,
        description: values.description || null,
        schedule: values.schedule || null,
        operator: "AND", // Add default operator
        
        // Include alerts with all necessary data
        alerts: alerts.map(a => ({
          id: a.id && !a.id.startsWith('temp-') ? a.id : undefined,
          type: a.type,
          isActive: a.isActive,
          flightId: a.flightId || null
        }))
      };

      console.log("Sending payload:", payload);

      const response = await fetch(`/api/rules/${rule.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("API Error:", error);
        throw new Error(error.message || "Failed to update rule");
      }

      const updatedRule = await response.json();
      console.log("Updated rule response:", updatedRule);

      toast.success("Rule updated successfully");
      router.push(`/dashboard/rules/${rule.id}`);
      router.refresh();
    } catch (error) {
      console.error("Error updating rule:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update rule");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="bg-card rounded-md border p-4">
      <Tabs defaultValue="basic" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="basic">Basic Information</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>
        
        <TabsContent value="basic">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rule Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter rule name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter rule description (optional)"
                        className="h-32 resize-none" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="schedule"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Schedule</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Schedule (e.g., Every day at 9am)" 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Specify when this rule should run. Leave empty for real-time processing.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <FormLabel>Active Status</FormLabel>
                      <FormDescription>
                        Enable or disable this rule
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    router.push(`/dashboard/rules/${rule.id}`);
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </Form>
        </TabsContent>
        
        <TabsContent value="alerts">
          <Form {...form}>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Rule Alerts</h3>
              </div>
              
              <Card>
                <CardContent className="pt-4">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <FormLabel>Alert Type</FormLabel>
                      <Select
                        value={newAlertType}
                        onValueChange={setNewAlertType}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select alert type" />
                        </SelectTrigger>
                        <SelectContent>
                          {ALERT_TYPES.map((type) => (
                            <SelectItem key={type.id} value={type.id}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <FormLabel>Flight</FormLabel>
                      <Select
                        value={selectedFlightId || ""}
                        onValueChange={setSelectedFlightId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select flight" />
                        </SelectTrigger>
                        <SelectContent>
                          {trackedFlights.map((flight) => (
                            <SelectItem key={flight.id} value={flight.id}>
                              {flight.flightNumber}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <Button 
                    type="button" 
                    onClick={handleAddAlert}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Alert
                  </Button>
                </CardContent>
              </Card>
              
              <div className="space-y-4">
                <h4 className="font-medium">Current Alerts</h4>
                
                {alerts.length === 0 ? (
                  <div className="text-center p-4 border rounded-md bg-muted">
                    <p className="text-muted-foreground">No alerts configured for this rule.</p>
                    <p className="text-xs text-muted-foreground mt-1">Add alerts using the form above.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {alerts.map((alert, index) => (
                      <div key={alert.id} className="flex items-center justify-between border rounded-md p-3">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{ALERT_TYPES.find(t => t.id === alert.type)?.label || alert.type}</Badge>
                          {alert.flight && (
                            <Badge variant="outline">
                              {alert.flight.flightNumber}
                            </Badge>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveAlert(index)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    router.push(`/dashboard/rules/${rule.id}`);
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  type="button" 
                  onClick={form.handleSubmit(onSubmit)}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          </Form>
        </TabsContent>
      </Tabs>
    </div>
  );
} 