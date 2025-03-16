import { z } from "zod";

export type RuleOperator = "AND" | "OR";
export type ConditionField = "status" | "departureTime" | "arrivalTime" | "gate" | "terminal" | "flightNumber";
export type ConditionOperator = 
  "equals" | 
  "notEquals" | 
  "contains" | 
  "notContains" | 
  "greaterThan" | 
  "lessThan" | 
  "greaterThanOrEqual" | 
  "lessThanOrEqual" | 
  "between" | 
  "changed";

export interface Rule {
  id: string;
  name: string;
  description?: string;
  operator: RuleOperator;
  isActive: boolean;
  schedule?: string;
  conditions: RuleCondition[];
  alerts: Alert[];
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface RuleCondition {
  id: string;
  field: ConditionField;
  operator: ConditionOperator;
  value: string;
  ruleId: string;
  flightId?: string;
}

export interface Alert {
  id: string;
  type: string;
  threshold?: number;
  isActive: boolean;
  userId: string;
  flightId: string;
  ruleId?: string;
  createdAt: string;
  updatedAt: string;
}

// Validation schemas
export const createRuleConditionSchema = z.object({
  field: z.enum(["status", "departureTime", "arrivalTime", "gate", "terminal", "flightNumber"]),
  operator: z.enum([
    "equals", 
    "notEquals", 
    "contains", 
    "notContains", 
    "greaterThan", 
    "lessThan", 
    "greaterThanOrEqual", 
    "lessThanOrEqual", 
    "between", 
    "changed"
  ]),
  value: z.string(),
  flightId: z.string().optional(),
});

export const createRuleSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  operator: z.enum(["AND", "OR"]).default("AND"),
  schedule: z.string().optional(),
  conditions: z.array(createRuleConditionSchema).min(1, "At least one condition is required"),
  alertTypes: z.array(z.string()).min(1, "At least one alert type is required"),
  flightIds: z.array(z.string()).min(1, "At least one flight is required"),
});

export type CreateRuleInput = z.infer<typeof createRuleSchema>;
export type CreateRuleConditionInput = z.infer<typeof createRuleConditionSchema>;

// API functions
export async function createRule(data: CreateRuleInput): Promise<Rule> {
  const validatedData = createRuleSchema.parse(data);
  
  const response = await fetch("/api/rules", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(validatedData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to create rule");
  }

  return response.json();
}

export async function getUserRules(): Promise<Rule[]> {
  const response = await fetch("/api/rules");

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to fetch rules");
  }

  return response.json();
}

export async function getRule(id: string): Promise<Rule> {
  const response = await fetch(`/api/rules/${id}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to fetch rule");
  }

  return response.json();
}

export async function updateRule(id: string, data: Partial<CreateRuleInput>): Promise<Rule> {
  const response = await fetch(`/api/rules/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to update rule");
  }

  return response.json();
}

export async function toggleRule(id: string, isActive: boolean): Promise<Rule> {
  const response = await fetch(`/api/rules/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ isActive }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to toggle rule");
  }

  return response.json();
}

export async function deleteRule(id: string): Promise<void> {
  const response = await fetch(`/api/rules/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to delete rule");
  }
}

// Helper function to evaluate a rule condition
export function evaluateCondition(condition: RuleCondition, flightData: any): boolean {
  const { field, operator, value } = condition;
  const fieldValue = flightData[field];
  
  if (fieldValue === undefined) return false;
  
  switch (operator) {
    case "equals":
      return fieldValue === value;
    case "notEquals":
      return fieldValue !== value;
    case "contains":
      return String(fieldValue).includes(value);
    case "notContains":
      return !String(fieldValue).includes(value);
    case "greaterThan":
      return fieldValue > value;
    case "lessThan":
      return fieldValue < value;
    case "greaterThanOrEqual":
      return fieldValue >= value;
    case "lessThanOrEqual":
      return fieldValue <= value;
    case "between":
      const [min, max] = value.split(",");
      return fieldValue >= min && fieldValue <= max;
    case "changed":
      // This requires previous state, which would be handled in the cron job
      return false;
    default:
      return false;
  }
}

// Helper function to evaluate an entire rule
export function evaluateRule(rule: Rule, flightData: any): boolean {
  if (!rule.conditions || rule.conditions.length === 0) return false;
  
  if (rule.operator === "AND") {
    return rule.conditions.every(condition => evaluateCondition(condition, flightData));
  } else {
    return rule.conditions.some(condition => evaluateCondition(condition, flightData));
  }
} 