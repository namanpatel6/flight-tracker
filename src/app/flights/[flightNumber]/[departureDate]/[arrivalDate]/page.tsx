import { Suspense } from "react";
import { notFound } from "next/navigation";
import { FlightDetails } from "./flight-details";
import { Skeleton } from "@/components/ui/skeleton";

interface FlightDetailsPageProps {
  params: {
    flightNumber: string;
    departureDate: string;
    arrivalDate: string;
  };
}

export const metadata = {
  title: "Flight Details",
  description: "Track and view detailed information about a specific flight.",
};

export default async function FlightDetailsPage({ params }: FlightDetailsPageProps) {
  // Await params before accessing properties
  const paramsObj = await Promise.resolve(params);
  const flightNumber = paramsObj.flightNumber;
  const departureDate = paramsObj.departureDate;
  const arrivalDate = paramsObj.arrivalDate;
  
  console.log(`Flight details page params: ${flightNumber}, ${departureDate}, ${arrivalDate}`);
  
  try {
    // For server components, use an absolute URL for fetch
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    
    const apiUrl = new URL(`/api/flights/${encodeURIComponent(flightNumber)}/${encodeURIComponent(departureDate)}/${encodeURIComponent(arrivalDate)}`, baseUrl).toString();
    
    console.log(`Fetching flight details from API URL: ${apiUrl}`);
    
    const flightResponse = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      next: { revalidate: 60 }, // Revalidate data every 60 seconds
    });
    
    console.log(`API response status: ${flightResponse.status} ${flightResponse.statusText}`);
    
    if (!flightResponse.ok) {
      console.error(`Failed to fetch flight details: ${flightResponse.statusText}`);
      notFound();
    }
    
    const { flight } = await flightResponse.json();
    
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
  } catch (error) {
    console.error("Error fetching flight details:", error);
    notFound();
  }
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