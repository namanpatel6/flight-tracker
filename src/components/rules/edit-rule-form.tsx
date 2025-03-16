"use client";

import { useState, useEffect } from "react";
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

// Define condition fields
const CONDITION_FIELDS = [
  { id: 'status', label: 'Status' },
  { id: 'departureTime', label: 'Departure Time' },
  { id: 'arrivalTime', label: 'Arrival Time' },
  { id: 'gate', label: 'Gate' },
  { id: 'terminal', label: 'Terminal' },
  { id: 'flightNumber', label: 'Flight Number' },
];

// Define condition operators
const CONDITION_OPERATORS = [
  { id: 'equals', label: 'Equals' },
  { id: 'notEquals', label: 'Not Equals' },
  { id: 'contains', label: 'Contains' },
  { id: 'notContains', label: 'Not Contains' },
  { id: 'greaterThan', label: 'Greater Than' },
  { id: 'lessThan', label: 'Less Than' },
  { id: 'greaterThanOrEqual', label: 'Greater Than or Equal' },
  { id: 'lessThanOrEqual', label: 'Less Than or Equal' },
  { id: 'between', label: 'Between' },
  { id: 'changed', label: 'Changed' },
];

// Define types for our rule data
interface RuleCondition {
  id: string;
  field: string;
  operator: string;
  value: string;
  flightId?: string | null;
  flight?: {
    id: string;
    flightNumber: string;
  } | null;
}

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

interface Rule {
  id: string;
  name: string;
  description: string | null;
  operator: string;
  isActive: boolean;
  schedule: string | null;
  createdAt: Date;
  updatedAt: Date;
  conditions: RuleCondition[];
  alerts: Alert[];
}

interface TrackedFlight {
  id: string;
  flightNumber: string;
  departureAirport: string;
  arrivalAirport: string;
}

// Define the form schema
const formSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().max(500).nullable().optional(),
  operator: z.enum(["AND", "OR"]),
  isActive: z.boolean().default(true),
  schedule: z.string().nullable().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface EditRuleFormProps {
  rule: Rule;
}

export function EditRuleForm({ rule }: EditRuleFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");
  const [conditions, setConditions] = useState<RuleCondition[]>(rule.conditions || []);
  const [alerts, setAlerts] = useState<Alert[]>(rule.alerts || []);
  const [trackedFlights, setTrackedFlights] = useState<TrackedFlight[]>([]);
  const [newAlertType, setNewAlertType] = useState<string>("STATUS_CHANGE");
  const [newAlertFlightId, setNewAlertFlightId] = useState<string>("");
  
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
        
        // Set default flight for new alert if none selected
        if (flights.length > 0 && !newAlertFlightId) {
          setNewAlertFlightId(flights[0].id);
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
      operator: rule.operator as "AND" | "OR",
      isActive: rule.isActive,
      schedule: rule.schedule || "",
    },
  });

  // Condition management
  const handleAddCondition = () => {
    const newCondition: RuleCondition = {
      id: `temp-${Date.now()}`, // Temporary ID for UI purposes
      field: "status",
      operator: "equals",
      value: "",
      flightId: trackedFlights.length > 0 ? trackedFlights[0].id : undefined
    };
    setConditions([...conditions, newCondition]);
  };

  const handleRemoveCondition = (index: number) => {
    const newConditions = [...conditions];
    newConditions.splice(index, 1);
    setConditions(newConditions);
  };

  const handleConditionChange = (index: number, field: keyof RuleCondition, value: string) => {
    const newConditions = [...conditions];
    newConditions[index] = { ...newConditions[index], [field]: value };
    setConditions(newConditions);
  };

  // Alert management
  const handleAddAlert = () => {
    if (!newAlertType || !newAlertFlightId) {
      toast.error("Please select an alert type and flight");
      return;
    }

    const newAlert: Alert = {
      id: `temp-${Date.now()}`, // Temporary ID for UI purposes
      type: newAlertType,
      isActive: true,
      flightId: newAlertFlightId,
      flight: trackedFlights.find(f => f.id === newAlertFlightId)
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
    const newAlerts = [...alerts];
    newAlerts[index] = { ...newAlerts[index], isActive: !newAlerts[index].isActive };
    setAlerts(newAlerts);
  };

  async function onSubmit(values: FormValues) {
    try {
      setIsSubmitting(true);
      
      // Clean up the values
      const payload = {
        ...values,
        description: values.description || null,
        schedule: values.schedule || null,
        // Include conditions and alerts
        conditions: conditions.map(c => ({
          id: c.id.startsWith('temp-') ? undefined : c.id,
          field: c.field,
          operator: c.operator,
          value: c.value,
          flightId: c.flightId
        })),
        alerts: alerts.map(a => ({
          id: a.id.startsWith('temp-') ? undefined : a.id,
          type: a.type,
          isActive: a.isActive,
          flightId: a.flightId
        }))
      };

      const response = await fetch(`/api/rules/${rule.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update rule");
      }

      toast.success("Rule updated successfully");
      router.push(`/dashboard/rules/${rule.id}`);
      router.refresh();
    } catch (error) {
      console.error("Error updating rule:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update rule"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit Rule</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="conditions">Conditions</TabsTrigger>
            <TabsTrigger value="alerts">Alerts</TabsTrigger>
          </TabsList>
          
          <TabsContent value="basic">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rule Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter rule name" {...field} />
                      </FormControl>
                      <FormDescription>
                        A descriptive name for your rule
                      </FormDescription>
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
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormDescription>
                        Optional description of what this rule does
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="operator"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Logical Operator</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select operator" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="AND">AND (All conditions must match)</SelectItem>
                          <SelectItem value="OR">OR (Any condition can match)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        How conditions are combined in this rule
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Active Status</FormLabel>
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

                <FormField
                  control={form.control}
                  name="schedule"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Schedule (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Cron expression (e.g., '0 0 * * *')"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormDescription>
                        Optional cron expression for scheduled evaluation
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </form>
            </Form>
          </TabsContent>
          
          <TabsContent value="conditions">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Rule Conditions</h3>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleAddCondition}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Condition
                </Button>
              </div>
              
              {conditions.length === 0 ? (
                <div className="text-center p-8 border rounded-md">
                  <p className="text-muted-foreground">No conditions defined yet.</p>
                  <Button 
                    variant="link" 
                    onClick={handleAddCondition}
                  >
                    Add your first condition
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {conditions.map((condition, index) => (
                    <Card key={condition.id}>
                      <CardContent className="pt-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <FormLabel>Field</FormLabel>
                            <Select
                              value={condition.field}
                              onValueChange={(value) => handleConditionChange(index, 'field', value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select field" />
                              </SelectTrigger>
                              <SelectContent>
                                {CONDITION_FIELDS.map((field) => (
                                  <SelectItem key={field.id} value={field.id}>
                                    {field.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div>
                            <FormLabel>Operator</FormLabel>
                            <Select
                              value={condition.operator}
                              onValueChange={(value) => handleConditionChange(index, 'operator', value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select operator" />
                              </SelectTrigger>
                              <SelectContent>
                                {CONDITION_OPERATORS.map((op) => (
                                  <SelectItem key={op.id} value={op.id}>
                                    {op.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div>
                            <FormLabel>Value</FormLabel>
                            <Input
                              value={condition.value}
                              onChange={(e) => handleConditionChange(index, 'value', e.target.value)}
                              placeholder="Enter value"
                            />
                          </div>
                          
                          <div>
                            <FormLabel>Flight (Optional)</FormLabel>
                            <Select
                              value={condition.flightId || ""}
                              onValueChange={(value) => handleConditionChange(index, 'flightId', value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select flight (optional)" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="">Any selected flight</SelectItem>
                                {trackedFlights.map((flight) => (
                                  <SelectItem key={flight.id} value={flight.id}>
                                    {flight.flightNumber} ({flight.departureAirport} → {flight.arrivalAirport})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-2 text-destructive"
                          onClick={() => handleRemoveCondition(index)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remove
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="alerts">
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
                        value={newAlertFlightId}
                        onValueChange={setNewAlertFlightId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select flight" />
                        </SelectTrigger>
                        <SelectContent>
                          {trackedFlights.map((flight) => (
                            <SelectItem key={flight.id} value={flight.id}>
                              {flight.flightNumber} ({flight.departureAirport} → {flight.arrivalAirport})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    onClick={handleAddAlert}
                    disabled={trackedFlights.length === 0}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Alert
                  </Button>
                </CardContent>
              </Card>
              
              {alerts.length === 0 ? (
                <div className="text-center p-8 border rounded-md">
                  <p className="text-muted-foreground">No alerts defined yet.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {alerts.map((alert, index) => {
                    const flight = trackedFlights.find(f => f.id === alert.flightId);
                    const alertType = ALERT_TYPES.find(t => t.id === alert.type);
                    
                    return (
                      <div key={alert.id} className="flex items-center justify-between p-3 border rounded-md">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">
                            {alertType?.label || alert.type.replace(/_/g, ' ')}
                          </Badge>
                          {flight && (
                            <Badge variant="outline">
                              {flight.flightNumber}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch 
                            checked={alert.isActive} 
                            onCheckedChange={() => handleToggleAlert(index)}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive"
                            onClick={() => handleRemoveAlert(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="mt-6 flex justify-end space-x-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/dashboard/rules/${rule.id}`)}
          >
            Cancel
          </Button>
          <Button
            onClick={form.handleSubmit(onSubmit)}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 