"use client";

import { useState } from "react";
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
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

  async function onSubmit(values: FormValues) {
    try {
      setIsSubmitting(true);
      
      // Clean up the values
      const payload = {
        ...values,
        description: values.description || null,
        schedule: values.schedule || null,
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

            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/dashboard/rules/${rule.id}`)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
} 