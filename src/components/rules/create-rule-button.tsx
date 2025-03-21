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

// Define alert types
const ALERT_TYPES = [
  { id: 'STATUS_CHANGE', label: 'Status Change' },
  { id: 'DELAY', label: 'Delay' },
  { id: 'GATE_CHANGE', label: 'Gate Change' },
  { id: 'DEPARTURE', label: 'Departure Update' },
  { id: 'ARRIVAL', label: 'Arrival Update' },
  { id: 'PRICE_CHANGE', label: 'Price Change' },
];

// Define condition fields
const CONDITION_FIELDS = [
  { id: 'status', label: 'Status' },
  { id: 'departureTime', label: 'Departure Time' },
  { id: 'arrivalTime', label: 'Arrival Time' },
  { id: 'gate', label: 'Gate' },
  { id: 'terminal', label: 'Terminal' },
  { id: 'flightNumber', label: 'Flight Number' },
  { id: 'price', label: 'Price' },
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
  operator: z.enum(['AND', 'OR']).default('AND'),
});

// Flight search schema
const flightSearchSchema = z.object({
  searchType: z.enum(['route', 'flightNumber']),
  flightNumber: z.string().optional(),
  airline: z.string().optional(),
  fromAirport: z.string().optional(),
  toAirport: z.string().optional(),
  departureDate: z.date().optional(),
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
  'price': 'PRICE_CHANGE',
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

// Define proper interfaces for Airport and Airline types in this file
export interface Airport extends DropdownOption {
  name?: string;
}

export interface Airline extends DropdownOption {
  name?: string;
}

export function CreateRuleButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [searchResults, setSearchResults] = useState<Flight[]>([]);
  const [selectedFlights, setSelectedFlights] = useState<SelectedFlight[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [airports, setAirports] = useState<Airport[]>([]);
  const [airlines, setAirlines] = useState<Airline[]>([]);
  const [conditions, setConditions] = useState<Condition[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  
  // Forms for each step
  const basicInfoForm = useForm<z.infer<typeof basicInfoSchema>>({
    resolver: zodResolver(basicInfoSchema),
    defaultValues: {
      name: '',
      description: '',
      operator: 'AND',
    },
  });
  
  const flightSearchForm = useForm<z.infer<typeof flightSearchSchema>>({
    resolver: zodResolver(flightSearchSchema),
    defaultValues: {
      searchType: 'flightNumber',
      flightNumber: '',
      airline: '',
      fromAirport: '',
      toAirport: '',
      departureDate: undefined,
    },
  });

  // Fetch airports and airlines when the dialog opens
  useEffect(() => {
    if (open) {
      fetchAirportsAndAirlines();
    }
  }, [open]);

  const fetchAirportsAndAirlines = async () => {
    try {
      // Fetch airports
      const airportsResponse = await fetch('/api/airports');
      if (airportsResponse.ok) {
        const airportsData = await airportsResponse.json();
        setAirports(airportsData);
      }

      // Fetch airlines
      const airlinesResponse = await fetch('/api/airlines');
      if (airlinesResponse.ok) {
        const airlinesData = await airlinesResponse.json();
        setAirlines(airlinesData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load airports or airlines');
    }
  };

  const handleFlightSearch = async (data: z.infer<typeof flightSearchSchema>) => {
    setSearchLoading(true);
    setSearchResults([]);
    
    try {
      const params = new URLSearchParams();
      
      // Limit parameters to only those supported by the Flight Radar API
      if (data.searchType === 'flightNumber') {
        if (data.flightNumber) params.append('flight_iata', data.flightNumber.trim());
        // FlightRadar API doesn't directly support airline IATA filtering without flight number
      } else {
        // For route search
        if (data.fromAirport) params.append('dep_iata', data.fromAirport.trim());
        if (data.toAirport) params.append('arr_iata', data.toAirport.trim());
      }

      // Only append date if provided
      if (data.departureDate) {
        params.append('flight_date', data.departureDate.toISOString().split('T')[0]);
      }
      
      // Check if we have at least one search parameter
      if (params.toString() === '') {
        toast.error('Please provide at least one search parameter');
        setSearchLoading(false);
        return;
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
    // Check if flight is already selected
    const isAlreadySelected = selectedFlights.some(f => 
      f.flightNumber === flight.flight.iata && 
      f.departureAirport === flight.departure.iata &&
      f.arrivalAirport === flight.arrival.iata
    );

    if (isAlreadySelected) {
      // Toggle selection off
      setSelectedFlights(prev => prev.filter(f => 
        !(f.flightNumber === flight.flight.iata && 
          f.departureAirport === flight.departure.iata &&
          f.arrivalAirport === flight.arrival.iata)
      ));
    } else {
      // Add to selected flights
      const newSelectedFlight: SelectedFlight = {
        id: `temp-${Date.now()}-${flight.flight.iata}`,
        flightNumber: flight.flight.iata,
        airline: flight.airline?.iata,
        departureAirport: flight.departure.iata,
        arrivalAirport: flight.arrival.iata,
        departureTime: flight.departure.scheduled ? new Date(flight.departure.scheduled).toISOString() : undefined,
        arrivalTime: flight.arrival.scheduled ? new Date(flight.arrival.scheduled).toISOString() : undefined,
        price: flight.price?.formatted || undefined,
        isSelected: true,
      };
      
      setSelectedFlights(prev => [...prev, newSelectedFlight]);
    }
  };

  const handleAddCondition = () => {
    // Only allow adding condition if we have selected flights
    if (selectedFlights.length === 0) {
      toast.error('Please select at least one flight first');
      return;
    }

    const firstFlight = selectedFlights[0];
    
    const newCondition: Condition = {
      field: 'status',
      operator: 'equals',
      value: '',
      flightData: {
        flightNumber: firstFlight.flightNumber,
        airline: firstFlight.airline,
        departureAirport: firstFlight.departureAirport,
        arrivalAirport: firstFlight.arrivalAirport,
        departureTime: firstFlight.departureTime,
        arrivalTime: firstFlight.arrivalTime,
        price: firstFlight.price,
      }
    };
    
    setConditions([...conditions, newCondition]);
  };

  const handleRemoveCondition = (index: number) => {
    const newConditions = [...conditions];
    newConditions.splice(index, 1);
    setConditions(newConditions);
  };

  const handleConditionChange = (index: number, field: keyof Condition, value: string) => {
    const newConditions = [...conditions];
    newConditions[index] = { ...newConditions[index], [field]: value };
    setConditions(newConditions);
  };

  const handleConditionFlightChange = (index: number, flightId: string) => {
    const newConditions = [...conditions];
    const selectedFlight = selectedFlights.find(f => f.id === flightId);
    
    if (selectedFlight) {
      newConditions[index] = { 
        ...newConditions[index], 
        flightData: {
          flightNumber: selectedFlight.flightNumber,
          airline: selectedFlight.airline,
          departureAirport: selectedFlight.departureAirport,
          arrivalAirport: selectedFlight.arrivalAirport,
          departureTime: selectedFlight.departureTime,
          arrivalTime: selectedFlight.arrivalTime,
          price: selectedFlight.price,
        } 
      };
      setConditions(newConditions);
    }
  };

  const handleAddAlert = (type: string) => {
    // Only allow adding alert if we have selected flights
    if (selectedFlights.length === 0) {
      toast.error('Please select at least one flight first');
      return;
    }

    // Add an alert for each selected flight
    const newAlerts = selectedFlights.map(flight => ({
      type,
      isActive: true,
      flightData: {
        flightNumber: flight.flightNumber,
        airline: flight.airline,
        departureAirport: flight.departureAirport,
        arrivalAirport: flight.arrivalAirport,
        departureTime: flight.departureTime,
        arrivalTime: flight.arrivalTime,
        price: flight.price,
      }
    }));
    
    setAlerts([...alerts, ...newAlerts]);
    toast.success(`Added ${type} alerts for ${newAlerts.length} flights`);
  };

  const handleRemoveAlert = (index: number) => {
    const newAlerts = [...alerts];
    newAlerts.splice(index, 1);
    setAlerts(newAlerts);
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
      title: 'Conditions',
      description: 'Define the conditions for your rule',
      validate: async () => {
        // Check if there are conditions
        if (conditions.length === 0) {
          return false;
        }
        
        // Validate that all conditions have required fields
        return conditions.every(c => c.field && c.operator && c.value);
      },
    },
    {
      title: 'Alert Configuration',
      description: 'Configure the alerts for your rule',
      validate: async () => {
        return alerts.length > 0;
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
        setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
      } else if (currentStep === 1 && selectedFlights.length === 0) {
        toast.error('Please select at least one flight before continuing');
      } else if (currentStep === 2 && conditions.length === 0) {
        toast.error('Please add at least one condition before continuing');
      } else if (currentStep === 3 && alerts.length === 0) {
        toast.error('Please add at least one alert before continuing');
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
    // Validate the current step first
    const currentStepObj = steps[currentStep];
    const isValid = await currentStepObj.validate();
    
    if (!isValid) {
      return;
    }
    
    setLoading(true);
    
    try {
      const basicInfo = basicInfoForm.getValues();
      
      // Create a new rule with all the collected data
      const response = await fetch('/api/rules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: basicInfo.name,
          description: basicInfo.description,
          operator: basicInfo.operator,
          conditions,
          alerts,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
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
    setCurrentStep(0);
    basicInfoForm.reset();
    flightSearchForm.reset();
    setSearchResults([]);
    setSelectedFlights([]);
    setConditions([]);
    setAlerts([]);
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
                
                <FormField
                  control={basicInfoForm.control}
                  name="operator"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Operator</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select an operator" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="AND">AND (All conditions must match)</SelectItem>
                          <SelectItem value="OR">OR (Any condition can match)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        How to combine multiple conditions.
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
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <Tabs defaultValue="flightNumber" onValueChange={(value) => flightSearchForm.setValue('searchType', value as 'route' | 'flightNumber')}>
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="flightNumber">
                        <Search className="mr-2 h-4 w-4" />
                        Flight Number
                      </TabsTrigger>
                      <TabsTrigger value="route">
                        <Plane className="mr-2 h-4 w-4" />
                        Route
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="flightNumber" className="mt-4 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium">Flight Number</label>
                          <Input 
                            placeholder="e.g. BA123" 
                            onChange={(e) => flightSearchForm.setValue('flightNumber', e.target.value)}
                          />
                        </div>
                        
                        <div>
                          <label className="text-sm font-medium">Airline (Optional)</label>
                          <Select onValueChange={(value) => flightSearchForm.setValue('airline', value)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select airline" />
                            </SelectTrigger>
                            <SelectContent>
                              {airlines.map((airline) => (
                                <SelectItem key={airline.value} value={airline.value}>
                                  {airline.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="route" className="mt-4 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium">From</label>
                          <Select onValueChange={(value) => flightSearchForm.setValue('fromAirport', value)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select departure airport" />
                            </SelectTrigger>
                            <SelectContent>
                              {airports.map((airport) => (
                                <SelectItem key={airport.value} value={airport.value}>
                                  {airport.label} ({airport.value})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <label className="text-sm font-medium">To</label>
                          <Select onValueChange={(value) => flightSearchForm.setValue('toAirport', value)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select arrival airport" />
                            </SelectTrigger>
                            <SelectContent>
                              {airports.map((airport) => (
                                <SelectItem key={airport.value} value={airport.value}>
                                  {airport.label} ({airport.value})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </TabsContent>
                    
                    <div className="mt-4">
                      <label className="text-sm font-medium">Departure Date (Optional)</label>
                      <DatePicker
                        value={flightSearchForm.getValues().departureDate}
                        onChange={(date) => flightSearchForm.setValue('departureDate', date)}
                        placeholder="Select date"
                      />
                    </div>
                  </Tabs>
                  
                  <div className="mt-4">
                    <Button 
                      onClick={() => handleFlightSearch(flightSearchForm.getValues())} 
                      disabled={searchLoading}
                      type="button"
                    >
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
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Selected Flights ({selectedFlights.length})</h3>
                    {selectedFlights.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No flights selected yet</p>
                    ) : (
                      <div className="space-y-2">
                        {selectedFlights.map((flight) => (
                          <div key={flight.id} className="flex items-center justify-between p-2 border rounded-md">
                            <div>
                              <span className="font-medium">{flight.flightNumber}</span>
                              <span className="text-sm text-muted-foreground ml-2">
                                {flight.departureAirport} → {flight.arrivalAirport}
                              </span>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleSelectFlight({
                                flight: { iata: flight.flightNumber },
                                departure: { iata: flight.departureAirport },
                                arrival: { iata: flight.arrivalAirport }
                              } as Flight)}
                            >
                              Remove
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
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
                                {flight.airline?.name || 'Unknown Airline'} • 
                                {flight.departure.scheduled ? ` Departure: ${new Date(flight.departure.scheduled).toLocaleString()}` : ''}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
          
          {/* Step 3: Conditions */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="mb-4">
                <h3 className="text-base font-medium">Define Conditions</h3>
                <p className="text-sm text-muted-foreground">
                  Specify the conditions that will trigger this rule.
                </p>
              </div>
              
              {conditions.map((condition, index) => (
                <Card key={index}>
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Field</label>
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
                        <label className="text-sm font-medium">Operator</label>
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
                        <label className="text-sm font-medium">Value</label>
                        <Input
                          value={condition.value}
                          onChange={(e) => handleConditionChange(index, 'value', e.target.value)}
                          placeholder="Enter value"
                        />
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium">Flight</label>
                        <Select
                          value={condition.flightData?.flightNumber || ""}
                          onValueChange={(value) => {
                            const selectedFlight = selectedFlights.find(f => f.flightNumber === value);
                            if (selectedFlight) {
                              handleConditionFlightChange(index, selectedFlight.id);
                            }
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select flight" />
                          </SelectTrigger>
                          <SelectContent>
                            {selectedFlights.map((flight) => (
                              <SelectItem key={flight.id} value={flight.flightNumber}>
                                {flight.flightNumber} ({flight.departureAirport} → {flight.arrivalAirport})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    {conditions.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2"
                        onClick={() => handleRemoveCondition(index)}
                      >
                        Remove
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
              
              <Button
                type="button"
                variant="outline"
                onClick={handleAddCondition}
              >
                Add Condition
              </Button>
            </div>
          )}
          
          {/* Step 4: Alert Configuration */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="mb-4">
                <h3 className="text-base font-medium">Configure Alerts</h3>
                <p className="text-sm text-muted-foreground">
                  Select which types of alerts you want to receive for your selected flights.
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                {ALERT_TYPES.map((alertType) => (
                  <Card 
                    key={alertType.id}
                    className="cursor-pointer hover:bg-muted"
                    onClick={() => handleAddAlert(alertType.id)}
                  >
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{alertType.label}</h4>
                        <p className="text-sm text-muted-foreground">
                          Get notified about {alertType.label.toLowerCase()} events
                        </p>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              <div className="mt-6">
                <h3 className="text-sm font-medium mb-2">Selected Alerts ({alerts.length})</h3>
                {alerts.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No alerts configured yet</p>
                ) : (
                  <div className="space-y-2">
                    {alerts.map((alert, index) => (
                      <div key={index} className="flex items-center justify-between p-2 border rounded-md">
                        <div>
                          <Badge className="mr-2">
                            {ALERT_TYPES.find(t => t.id === alert.type)?.label || alert.type}
                          </Badge>
                          {alert.flightData && (
                            <span className="text-sm">
                              {alert.flightData.flightNumber} ({alert.flightData.departureAirport} → {alert.flightData.arrivalAirport})
                            </span>
                          )}
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleRemoveAlert(index)}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
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