import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getFlightDetails } from "@/lib/flight-api";
import { FlightDetails } from "./flight-details";
import { Skeleton } from "@/components/ui/skeleton";

interface FlightDetailsPageProps {
  params: {
    flightNumber: string;
  };
}

export default async function FlightDetailsPage({ params }: FlightDetailsPageProps) {
  const { flightNumber } = params;
  
  // Get flight details
  const flight = await getFlightDetails(flightNumber);
  
  if (!flight) {
    notFound();
  }
  
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Flight Details</h1>
      
      <Suspense fallback={<FlightDetailsSkeleton />}>
        <FlightDetails flight={flight} />
      </Suspense>
    </div>
  );
}

function FlightDetailsSkeleton() {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-start mb-6">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-5 w-40" />
        </div>
        <Skeleton className="h-8 w-32" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
        <div>
          <Skeleton className="h-6 w-32 mb-3" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-full max-w-xs" />
            <Skeleton className="h-5 w-full max-w-sm" />
            <Skeleton className="h-5 w-full max-w-md" />
          </div>
        </div>
        <div>
          <Skeleton className="h-6 w-32 mb-3" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-full max-w-xs" />
            <Skeleton className="h-5 w-full max-w-sm" />
            <Skeleton className="h-5 w-full max-w-md" />
          </div>
        </div>
      </div>
      
      <div className="border-t pt-6">
        <Skeleton className="h-6 w-48 mb-3" />
        <div className="space-y-2">
          <Skeleton className="h-5 w-full max-w-lg" />
          <Skeleton className="h-5 w-full max-w-md" />
        </div>
      </div>
      
      <div className="flex justify-end mt-6">
        <Skeleton className="h-10 w-32" />
      </div>
    </div>
  );
} 