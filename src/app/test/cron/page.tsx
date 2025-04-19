"use client"

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { toast } from "sonner";

export default function TestCronPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const triggerCron = async (type: string, isTest: boolean) => {
    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch(`/api/test/trigger-cron?type=${type}&test=${isTest}`);
      const data = await response.json();
      
      setResult(data);
      
      if (data.error) {
        toast.error(`Error: ${data.error}`);
      } else {
        toast.success(`Successfully triggered ${type} cron job`);
      }
    } catch (error) {
      console.error("Error triggering cron job:", error);
      toast.error("Failed to trigger cron job");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-8">Cron Job Testing</h1>
      
      <Tabs defaultValue="rules">
        <TabsList className="mb-4">
          <TabsTrigger value="rules">Rule Processing</TabsTrigger>
          <TabsTrigger value="flights">Flight Updates</TabsTrigger>
          <TabsTrigger value="all">Combined</TabsTrigger>
        </TabsList>
        
        <TabsContent value="rules">
          <Card>
            <CardHeader>
              <CardTitle>Test Rule Processing</CardTitle>
              <CardDescription>
                Process rules using real flight data or create test data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <Button 
                  onClick={() => triggerCron("rules", false)} 
                  disabled={isLoading}
                >
                  Process Real Rules
                </Button>
                <Button 
                  onClick={() => triggerCron("rules", true)} 
                  variant="outline" 
                  disabled={isLoading}
                >
                  Create Test Rule
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="flights">
          <Card>
            <CardHeader>
              <CardTitle>Test Flight Updates</CardTitle>
              <CardDescription>
                Update flight data or create test flights
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <Button 
                  onClick={() => triggerCron("flights", false)} 
                  disabled={isLoading}
                >
                  Update Flight Data
                </Button>
                <Button 
                  onClick={() => triggerCron("flights", true)} 
                  variant="outline" 
                  disabled={isLoading}
                >
                  Create Test Flight
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>Test Complete Cron Job</CardTitle>
              <CardDescription>
                Process both rules and flight updates
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <Button 
                  onClick={() => triggerCron("all", false)} 
                  disabled={isLoading}
                >
                  Run Complete Job
                </Button>
                <Button 
                  onClick={() => triggerCron("all", true)} 
                  variant="outline" 
                  disabled={isLoading}
                >
                  Create Test Data
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {result && (
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">Result</h2>
          <pre className="bg-slate-100 dark:bg-slate-800 p-4 rounded overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
} 