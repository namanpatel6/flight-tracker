"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
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
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';

const createRuleSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  operator: z.enum(['AND', 'OR']).default('AND'),
});

type FormValues = z.infer<typeof createRuleSchema>;

export function CreateRuleButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [trackedFlights, setTrackedFlights] = useState<{ id: string; flightNumber: string; departureAirport: string; arrivalAirport: string }[]>([]);
  const [selectedFlightId, setSelectedFlightId] = useState<string>('');

  // Fetch tracked flights when the dialog opens
  useEffect(() => {
    if (open) {
      fetchTrackedFlights();
    }
  }, [open]);

  const fetchTrackedFlights = async () => {
    try {
      const response = await fetch('/api/tracked-flights');
      if (response.ok) {
        const flights = await response.json();
        setTrackedFlights(flights);
        // Set the first flight as selected by default if available
        if (flights.length > 0) {
          setSelectedFlightId(flights[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching tracked flights:', error);
      toast.error('Failed to load tracked flights');
    }
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(createRuleSchema),
    defaultValues: {
      name: '',
      description: '',
      operator: 'AND',
    },
  });

  const onSubmit = async (data: FormValues) => {
    setLoading(true);
    
    // Validate that a flight is selected
    if (!selectedFlightId) {
      toast.error('Please select a flight');
      setLoading(false);
      return;
    }
    
    try {
      // Create a new rule with basic info
      const response = await fetch('/api/rules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: data.name,
          description: data.description,
          operator: data.operator,
          conditions: [
            {
              field: 'status',
              operator: 'equals',
              value: 'scheduled',
              flightId: selectedFlightId,
            },
          ],
          alertTypes: ['STATUS_CHANGE'],
          flightIds: [selectedFlightId],
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create rule');
      }
      
      const rule = await response.json();
      
      toast.success('Rule created successfully');
      setOpen(false);
      
      // Navigate to the rules list page instead of a specific rule edit page
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Rule
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Rule</DialogTitle>
          <DialogDescription>
            Create a new rule to track flight conditions and receive alerts.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
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
              control={form.control}
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
              control={form.control}
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
            
            {/* Flight Selection */}
            <div className="space-y-2">
              <FormLabel>Select Flight</FormLabel>
              <Select
                value={selectedFlightId}
                onValueChange={setSelectedFlightId}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a flight" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {trackedFlights.length === 0 ? (
                    <SelectItem value="no-flights" disabled>
                      No tracked flights available
                    </SelectItem>
                  ) : (
                    trackedFlights.map((flight) => (
                      <SelectItem key={flight.id} value={flight.id}>
                        {flight.flightNumber} ({flight.departureAirport} → {flight.arrivalAirport})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <FormDescription>
                Select a flight to apply this rule to.
              </FormDescription>
              {trackedFlights.length === 0 && (
                <p className="text-sm text-yellow-600">
                  You need to track a flight first. Go to the dashboard to add a tracked flight.
                </p>
              )}
            </div>
            
            <DialogFooter>
              <Button type="submit" disabled={loading || trackedFlights.length === 0}>
                {loading ? 'Creating...' : 'Create Rule'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 