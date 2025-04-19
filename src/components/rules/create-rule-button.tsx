"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Plus, Loader2, ChevronRight, ChevronLeft, Plane, Search } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import type { Flight } from '@/types/flight';
import { DatePicker } from '@/components/custom-ui';
import { 
  Dropdown, 
  type DropdownOption 
} from "@/components/custom-ui";
import { formatDateWithTimezone } from "@/lib/utils";

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

// Basic rule information schema
const basicInfoSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
});

// Flight search schema
const flightSearchSchema = z.object({
  flightNumber: z.string().optional(),
  departureDate: z.date({ required_error: "Departure date is required" })
});

// Selected flight schema
const selectedFlightSchema = z.object({
  id: z.string(),
  flightNumber: z.string(),
  airline: z.string().optional(),
  departureAirport: z.string(),
  arrivalAirport: z.string(),
  departureTime: z.string().optional(),
  arrivalTime: z.string().optional(),
  price: z.string().optional(),
  isSelected: z.boolean(),
});

// Map condition fields to relevant alert types for auto-selection
const FIELD_TO_ALERT_TYPE = {
  'status': 'STATUS_CHANGE',
  'departureTime': 'DEPARTURE',
  'arrivalTime': 'ARRIVAL',
  'gate': 'GATE_CHANGE',
  'terminal': 'GATE_CHANGE',
  'flightNumber': 'STATUS_CHANGE',
};

// Condition schema
const conditionSchema = z.object({
  field: z.string(),
  operator: z.string(),
  value: z.string(),
  flightData: z.object({
    flightNumber: z.string(),
    airline: z.string().optional(),
    departureAirport: z.string(),
    arrivalAirport: z.string(),
    departureTime: z.string().optional(),
    arrivalTime: z.string().optional(),
    price: z.string().optional(),
  }),
});

// Alert schema
const alertSchema = z.object({
  type: z.string(),
  isActive: z.boolean(),
  flightData: z.object({
    flightNumber: z.string(),
    airline: z.string().optional(),
    departureAirport: z.string(),
    arrivalAirport: z.string(),
    departureTime: z.string().optional(),
    arrivalTime: z.string().optional(),
    price: z.string().optional(),
  }),
});

type SelectedFlight = z.infer<typeof selectedFlightSchema>;
type Condition = z.infer<typeof conditionSchema>;
type Alert = z.infer<typeof alertSchema>;

// Define an interface without Airline if needed
export interface Airport extends DropdownOption {
  name?: string;
}

export function CreateRuleButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [airports, setAirports] = useState<Airport[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [recommendedAlertTypes, setRecommendedAlertTypes] = useState<string[]>([]);
  const [selectedAlertTypes, setSelectedAlertTypes] = useState<string[]>([]);
  const [flightNumberInput, setFlightNumberInput] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [searchResults, setSearchResults] = useState<Flight[]>([]);
  const [selectedFlights, setSelectedFlights] = useState<SelectedFlight[]>([]);
  
  // Forms for each step
  const basicInfoForm = useForm<z.infer<typeof basicInfoSchema>>({
    resolver: zodResolver(basicInfoSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  });
  
  const flightSearchForm = useForm<z.infer<typeof flightSearchSchema>>({
    resolver: zodResolver(flightSearchSchema),
    defaultValues: {
      flightNumber: '',
      departureDate: new Date()
    },
  });

  // Fetch airports when the dialog opens
  useEffect(() => {
    if (open) {
      fetchAirports();
    } else {
      resetForm();
    }
  }, [open]);

  const fetchAirports = async () => {
    try {
      // Fetch airports
      const airportsResponse = await fetch('/api/airports');
      if (airportsResponse.ok) {
        const airportsData = await airportsResponse.json();
        setAirports(airportsData);
      }
    } catch (error) {
      console.error('Error fetching airports:', error);
      toast.error('Failed to load airports');
    }
  };

  const validateFlightSearch = () => {
    const newErrors: Record<string, string> = {};
    
    if (!flightNumberInput.trim()) {
      newErrors.search = "Please provide a flight number to search";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFlightSearch = async () => {
    if (!validateFlightSearch()) {
      return;
    }
    
    setSearchLoading(true);
    setSearchResults([]);
    
    try {
      const params = new URLSearchParams();
      
      // Add flight number parameter if available
      if (flightNumberInput.trim()) {
        params.append('flight_iata', flightNumberInput.trim());
      }
      
      // Add departure date
      const departureDate = flightSearchForm.getValues().departureDate;
      if (departureDate) {
        params.append('flight_date', departureDate.toISOString().split('T')[0]);
      }
      
      // Set a reasonable timeout for the search request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
      
      const response = await fetch(`/api/flights/search?${params.toString()}`, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(errorData.message || `Error: ${response.status}`);
      }
      
      const responseData = await response.json();
      setSearchResults(responseData.flights || []);
      
      if (!responseData.flights || responseData.flights.length === 0) {
        toast.info('No flights found matching your search criteria');
      }
    } catch (error: any) {
      console.error('Error searching flights:', error);
      
      // Provide specific error messages based on the error type
      if (error.name === 'AbortError') {
        toast.error('Search request timed out. Please try again with more specific search criteria.');
      } else if (error.message.includes('429')) {
        toast.error('Too many requests. Please wait a moment before trying again.');
      } else {
        toast.error(`Failed to search flights: ${error.message}`);
      }
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSelectFlight = (flight: Flight) => {
    // Clear previously selected flights to enforce "one flight per rule" constraint
    setSelectedFlights([{
      id: flight.id,
      flightNumber: flight.flight.iata,
      airline: flight.airline?.name,
      departureAirport: flight.departure.iata,
      arrivalAirport: flight.arrival.iata,
      departureTime: flight.departure.scheduled,
      arrivalTime: flight.arrival.scheduled,
      price: flight.price?.formatted,
      isSelected: true,
    }]);

    // Reset alerts
    setAlerts([]);
    
    // Update recommended alert types based on the selected flight
    // Now we recommend all alert types since there are no conditions
    setRecommendedAlertTypes(ALERT_TYPES.map(type => type.id));
    
    toast.success(`Selected flight ${flight.flight.iata}`);
  };

  const handleSelectAlertType = (type: string) => {
    setSelectedAlertTypes(prevSelected => {
      if (prevSelected.includes(type)) {
        return prevSelected.filter(t => t !== type);
      } else {
        return [...prevSelected, type];
      }
    });
  };

  // Generate alerts from selected alert types
  const generateAlertsFromSelectedTypes = () => {
    if (selectedFlights.length === 0 || selectedAlertTypes.length === 0) {
      console.error("Cannot generate alerts: No flights or alert types selected");
      return false;
    }
    
    const selectedFlight = selectedFlights[0];
    const newAlerts: Alert[] = [];
    
    for (const alertType of selectedAlertTypes) {
      newAlerts.push({
        type: alertType,
        isActive: true,
        flightData: {
          flightNumber: selectedFlight.flightNumber,
          airline: selectedFlight.airline,
          departureAirport: selectedFlight.departureAirport,
          arrivalAirport: selectedFlight.arrivalAirport,
          departureTime: selectedFlight.departureTime,
          arrivalTime: selectedFlight.arrivalTime,
          price: selectedFlight.price,
        },
      });
    }
    
    console.log("Generated alerts:", newAlerts);
    setAlerts(newAlerts);
    
    if (newAlerts.length === 0) {
      console.error("Failed to generate any alerts");
      return false;
    }
    
    return true;
  };

  const steps = [
    {
      title: 'Basic Information',
      description: 'Enter the basic details for your rule',
      form: basicInfoForm,
      validate: async () => {
        return basicInfoForm.trigger();
      },
    },
    {
      title: 'Flight Search',
      description: 'Search and select flights to apply this rule to',
      form: flightSearchForm,
      validate: async () => {
        // Check if flights are selected, specifically for this step
        const hasSelectedFlights = selectedFlights.length > 0;
        
        if (!hasSelectedFlights) {
          // Return false to trigger the error message
          return false;
        }
        
        // Flights are selected, validation passes
        return true;
      },
    },
    {
      title: 'Alert Configuration',
      description: 'Configure the alerts for your rule',
      validate: async () => {
        return selectedAlertTypes.length > 0;
      },
    },
  ];

  const handleNext = async () => {
    try {
      // Show loading state while validating
      setLoading(true);
      
      const currentStepObj = steps[currentStep];
      let isValid = false;
      
      try {
        // Set a timeout to prevent UI freeze during validation
        const validationPromise = currentStepObj.validate();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Validation timed out')), 5000)
        );
        
        isValid = await Promise.race([validationPromise, timeoutPromise]) as boolean;
      } catch (error) {
        console.error('Validation error:', error);
        isValid = false;
      }
      
      if (isValid) {
        // If moving from flight search to alerts, update recommended alert types based on flight
        if (currentStep === 1) {
          // We'll recommend all alert types since there are no conditions
          setRecommendedAlertTypes(ALERT_TYPES.map(type => type.id));
          
          // Auto-select recommended alert types if none are selected yet
          if (selectedAlertTypes.length === 0) {
            setSelectedAlertTypes(ALERT_TYPES.map(type => type.id));
          }
        }
        
        // If moving from alerts to summary, generate alerts from selected types
        if (currentStep === 2) {
          generateAlertsFromSelectedTypes();
        }
        
        setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
      } else if (currentStep === 1 && selectedFlights.length === 0) {
        toast.error('Please select at least one flight before continuing');
      } else if (currentStep === 2 && selectedAlertTypes.length === 0) {
        toast.error('Please select at least one alert type before continuing');
      } else {
        // Generic validation error message if none of the specific cases match
        toast.error('Please complete all required fields before continuing');
      }
    } catch (error) {
      console.error('Error in handleNext:', error);
      toast.error('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const handleSubmit = async () => {
    const currentStepObj = steps[currentStep];
    const isValid = await currentStepObj.validate();
    
    if (!isValid) {
      return;
    }
    
    // Make sure we generate the alerts from selected types before submitting
    const alertsGenerated = generateAlertsFromSelectedTypes();
    if (!alertsGenerated || alerts.length === 0) {
      toast.error("At least one alert is required. Please select alert types.");
      return;
    }
    
    setLoading(true);
    
    try {
      const basicInfo = basicInfoForm.getValues();
      
      console.log("Submitting form with alerts:", alerts);
      
      // Create a new rule without conditions
      const response = await fetch('/api/rules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: basicInfo.name,
          description: basicInfo.description,
          // Set a default value for operator even though conditions were removed
          operator: "AND",
          alerts,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error("API Error:", errorData);
        throw new Error(errorData.message || 'Failed to create rule');
      }
      
      toast.success('Rule created successfully');
      setOpen(false);
      
      // Navigate to the rules list page
      router.push('/dashboard/rules');
      // Refresh the page to show the new rule
      router.refresh();
    } catch (error) {
      console.error('Error creating rule:', error);
      toast.error('Failed to create rule');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    basicInfoForm.reset();
    flightSearchForm.reset();
    setCurrentStep(0);
    setSelectedFlights([]);
    setAlerts([]);
    setSelectedAlertTypes([]);
    setRecommendedAlertTypes([]);
    setFlightNumberInput("");
    setErrors({});
    setSearchResults([]);
  };

  // Clean up when changing steps
  useEffect(() => {
    // Clear any lingering timeouts or operations when steps change
    return () => {
      // This cleanup function will run when the step changes
      if (searchLoading) {
        setSearchLoading(false);
      }
    };
  }, [currentStep]);

  return (
    <Dialog 
      open={open} 
      onOpenChange={(newOpen) => {
        setOpen(newOpen);
        if (!newOpen) {
          resetForm();
        }
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Rule
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>{steps[currentStep].title}</DialogTitle>
          <DialogDescription>
            {steps[currentStep].description}
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          {/* Step 1: Basic Information */}
          {currentStep === 0 && (
            <Form {...basicInfoForm}>
              <form className="space-y-4">
                <FormField
                  control={basicInfoForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="My Flight Rule" {...field} />
                      </FormControl>
                      <FormDescription>
                        A descriptive name for your rule.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={basicInfoForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Track my business trip flights..."
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Additional details about this rule.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </form>
            </Form>
          )}
          
          {/* Step 2: Flight Search */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  handleFlightSearch();
                }} className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Flight Number</label>
                      <Input 
                        placeholder="e.g. BA123" 
                        value={flightNumberInput}
                        onChange={(e) => setFlightNumberInput(e.target.value)}
                        className={errors.search ? "border-red-500" : ""}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Date</label>
                    <DatePicker
                      value={flightSearchForm.getValues().departureDate}
                      onChange={(date) => date && flightSearchForm.setValue('departureDate', date)}
                      placeholder="Select date"
                      minDate={new Date()}
                    />
                  </div>
                  
                  {errors.search && (
                    <p className="text-xs text-red-500">{errors.search}</p>
                  )}
                  
                  <div className="text-sm text-muted-foreground mt-2">
                    <p>Note: You can only select one flight per rule.</p>
                  </div>
                  
                  <div className="flex justify-start">
                    <Button type="submit" disabled={searchLoading}>
                      {searchLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Searching...
                        </>
                      ) : (
                        <>
                          <Search className="mr-2 h-4 w-4" />
                          Search Flights
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </div>
              
              {searchResults.length > 0 && (
                <div className="mt-4 space-y-2">
                  <h3 className="text-sm font-medium">Search Results ({searchResults.length})</h3>
                  {searchResults.length > 20 && (
                    <p className="text-xs text-muted-foreground">
                      Showing first 20 results. Please refine your search if needed.
                    </p>
                  )}
                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {searchResults.slice(0, 20).map((flight, index) => {
                      const isSelected = selectedFlights.some(f => 
                        f.flightNumber === flight.flight.iata && 
                        f.departureAirport === flight.departure.iata &&
                        f.arrivalAirport === flight.arrival.iata
                      );
                      
                      return (
                        <div 
                          key={`search-result-${index}`}
                          className={`p-2 border rounded-md cursor-pointer hover:bg-muted ${isSelected ? 'bg-muted' : ''}`}
                          onClick={() => handleSelectFlight(flight)}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="font-medium">{flight.flight.iata}</span>
                              <span className="text-sm text-muted-foreground ml-2">
                                {flight.departure.iata} → {flight.arrival.iata}
                              </span>
                              {flight.flight_status && (
                                <Badge variant="outline" className="ml-2">
                                  {flight.flight_status}
                                </Badge>
                              )}
                            </div>
                            <Checkbox checked={isSelected} />
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {flight.departure.scheduled ? ` Departure: ${formatDateWithTimezone(flight.departure.scheduled)}` : ''}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Step 3: Alert Configuration */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="mb-4">
                <h3 className="text-base font-medium">Configure Alerts</h3>
                <p className="text-sm text-muted-foreground">
                  Select which types of alerts you want to receive for your selected flights.
                  {recommendedAlertTypes.length > 0 && (
                    <span className="block mt-1 text-blue-600">
                      Based on your conditions, we recommend: {recommendedAlertTypes.map(type => 
                        ALERT_TYPES.find(t => t.id === type)?.label).join(', ')}
                    </span>
                  )}
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                {ALERT_TYPES.map((alertType) => {
                  const isSelected = selectedAlertTypes.includes(alertType.id);
                  const isRecommended = recommendedAlertTypes.includes(alertType.id);
                  
                  return (
                    <Card 
                      key={alertType.id}
                      className={`cursor-pointer transition-all duration-200 ${
                        isSelected 
                          ? 'border-primary bg-primary/10 shadow-md' 
                          : isRecommended 
                            ? 'border-blue-300 shadow-sm' 
                            : 'hover:bg-muted'
                      }`}
                      onClick={() => handleSelectAlertType(alertType.id)}
                    >
                      <CardContent className="p-4 flex items-center justify-between">
                        <div>
                          <h4 className={`font-medium ${isSelected ? 'text-primary' : ''}`}>
                            {alertType.label}
                            {isRecommended && !isSelected && (
                              <span className="ml-2 text-xs text-blue-600 font-normal">Recommended</span>
                            )}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            Get notified about {alertType.label.toLowerCase()} events
                          </p>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center
                          ${isSelected ? 'border-primary bg-primary text-white' : 'border-muted-foreground'}`}>
                          {isSelected && (
                            <svg width="10" height="8" viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M9 1L3.5 6.5L1 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
              
              <div className="mt-6">
                <h3 className="text-sm font-medium mb-2">
                  Selected Alert Types ({selectedAlertTypes.length})
                </h3>
                {selectedAlertTypes.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No alerts selected yet</p>
                ) : (
                  <div className="space-y-2">
                    {selectedAlertTypes.map((type, index) => {
                      const alertType = ALERT_TYPES.find(t => t.id === type);
                      return (
                        <div key={index} className="flex items-center justify-between p-2 border rounded-md">
                          <div>
                            <Badge className="mr-2">
                              {alertType?.label || type}
                            </Badge>
                            <span className="text-sm">
                              Will apply to {selectedFlights.length} selected flight(s)
                            </span>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleSelectAlertType(type)}
                          >
                            Remove
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        <DialogFooter className="flex justify-between">
          <div>
            {currentStep > 0 && (
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={loading}
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            )}
          </div>
          <div>
            {currentStep < steps.length - 1 ? (
              <Button
                type="button"
                onClick={handleNext}
                disabled={loading}
              >
                Next
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Rule'
                )}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 