"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Bell, BellOff, Trash2, Edit, Calendar, Code } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { getUserRules, toggleRule, deleteRule } from '@/lib/rules';
import { toast } from 'sonner';

interface Rule {
  id: string;
  name: string;
  description?: string;
  operator: string;
  isActive: boolean;
  schedule?: string;
  createdAt: string;
  updatedAt: string;
  conditions: RuleCondition[];
  alerts: Alert[];
}

interface RuleCondition {
  id: string;
  field: string;
  operator: string;
  value: string;
  flightId?: string;
  flight?: {
    flightNumber: string;
    departureAirport: string;
    arrivalAirport: string;
  };
}

interface Alert {
  id: string;
  type: string;
  isActive: boolean;
  flightId: string;
  flight?: {
    flightNumber: string;
    departureAirport: string;
    arrivalAirport: string;
  };
}

export function RulesList() {
  const { data: session } = useSession();
  const router = useRouter();
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch rules
  useEffect(() => {
    const fetchRules = async () => {
      if (!session?.user) {
        setLoading(false);
        return;
      }

      try {
        const data = await getUserRules();
        setRules(data);
      } catch (err) {
        console.error('Error fetching rules:', err);
        setError('Failed to load rules. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchRules();
  }, [session]);

  // Toggle rule active status
  const handleToggleRule = async (id: string, isActive: boolean) => {
    try {
      setError(null);
      
      const updatedRule = await toggleRule(id, !isActive);
      
      // Update the rule in the list
      setRules(prevRules => 
        prevRules.map(rule => 
          rule.id === id ? { ...rule, isActive: !isActive } : rule
        )
      );
      
      toast.success(`Rule ${isActive ? 'disabled' : 'enabled'} successfully`);
    } catch (err) {
      console.error('Error toggling rule:', err);
      setError('Failed to update rule. Please try again.');
      toast.error('Failed to update rule');
    }
  };

  // Delete a rule
  const handleDeleteRule = async (id: string) => {
    try {
      setError(null);
      
      await deleteRule(id);
      
      // Remove the rule from the list
      setRules(prevRules => prevRules.filter(rule => rule.id !== id));
      
      toast.success('Rule deleted successfully');
    } catch (err) {
      console.error('Error deleting rule:', err);
      setError('Failed to delete rule. Please try again.');
      toast.error('Failed to delete rule');
    }
  };

  // Edit a rule
  const handleEditRule = (id: string) => {
    router.push(`/dashboard/rules/${id}`);
  };

  // Format operator for display
  const formatOperator = (operator: string) => {
    return operator === 'AND' ? 'All conditions must match' : 'Any condition can match';
  };

  // Get field display name
  const getFieldDisplayName = (field: string) => {
    const fieldMap: Record<string, string> = {
      'status': 'Status',
      'departureTime': 'Departure Time',
      'arrivalTime': 'Arrival Time',
      'gate': 'Gate',
      'terminal': 'Terminal',
      'flightNumber': 'Flight Number'
    };
    
    return fieldMap[field] || field;
  };

  // Get operator display name
  const getOperatorDisplayName = (operator: string) => {
    const operatorMap: Record<string, string> = {
      'equals': 'equals',
      'notEquals': 'does not equal',
      'contains': 'contains',
      'notContains': 'does not contain',
      'greaterThan': 'is after',
      'lessThan': 'is before',
      'greaterThanOrEqual': 'is on or after',
      'lessThanOrEqual': 'is on or before',
      'between': 'is between',
      'changed': 'has changed to'
    };
    
    return operatorMap[operator] || operator;
  };

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
        <p className="text-gray-500">Loading rules...</p>
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

  if (!session?.user) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Please sign in to view your rules.</AlertDescription>
      </Alert>
    );
  }

  if (rules.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 mb-4">You don't have any rules set up yet.</p>
        <p className="text-gray-500">
          Create rules to track multiple flights with complex conditions and receive notifications when conditions are met.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {rules.map((rule) => (
        <Card key={rule.id} className="overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-xl">{rule.name}</CardTitle>
                <CardDescription>
                  {rule.description || 'No description'}
                </CardDescription>
              </div>
              <Badge variant={rule.isActive ? 'default' : 'secondary'}>
                {rule.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Rule Logic</h3>
              <div className="flex items-center mb-2">
                <Code className="h-4 w-4 mr-2 text-gray-500" />
                <span className="text-sm">{formatOperator(rule.operator)}</span>
              </div>
              {rule.schedule && (
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                  <span className="text-sm">Schedule: {rule.schedule}</span>
                </div>
              )}
            </div>
            
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Conditions</h3>
              <div className="space-y-2">
                {rule.conditions.map((condition) => (
                  <div key={condition.id} className="text-sm border rounded-md p-2">
                    <div className="flex flex-wrap items-center gap-1">
                      <span className="font-medium">
                        {condition.flight ? condition.flight.flightNumber : 'Any flight'}:
                      </span>
                      <span>{getFieldDisplayName(condition.field)}</span>
                      <span>{getOperatorDisplayName(condition.operator)}</span>
                      <span className="font-medium">{condition.value}</span>
                    </div>
                    {condition.flight && (
                      <div className="text-xs text-gray-500 mt-1">
                        {condition.flight.departureAirport} → {condition.flight.arrivalAirport}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Alerts</h3>
              <div className="space-y-2">
                {rule.alerts.map((alert) => (
                  <div key={alert.id} className="text-sm border rounded-md p-2">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="font-medium">
                          {alert.type.replace('_', ' ')}
                        </span>
                        {alert.flight && (
                          <span className="text-gray-500 ml-2">
                            ({alert.flight.flightNumber}: {alert.flight.departureAirport} → {alert.flight.arrivalAirport})
                          </span>
                        )}
                      </div>
                      <Badge variant={alert.isActive ? 'default' : 'secondary'} className="text-xs">
                        {alert.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-between bg-gray-50 pt-4">
            <div className="text-xs text-gray-500">
              Created: {formatDate(rule.createdAt)}
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleToggleRule(rule.id, rule.isActive)}
              >
                {rule.isActive ? (
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
                onClick={() => handleEditRule(rule.id)}
              >
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDeleteRule(rule.id)}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            </div>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
} 