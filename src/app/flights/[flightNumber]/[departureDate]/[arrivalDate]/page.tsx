import { Suspense } from "react";
import { notFound } from "next/navigation";
import { FlightDetails } from "./flight-details";
import { Skeleton } from "@/components/ui/skeleton";
import { Flight } from "@prisma/client";

interface FlightDetailsPageProps {
  params: Promise<{
    flightNumber: string;
    departureDate: string;
    arrivalDate: string;
  }>;
  searchParams?: {
    dep_iata?: string;
    arr_iata?: string;
  };
}

export const metadata = {
  title: "Flight Details",
  description: "Track and view detailed information about a specific flight.",
};

export default async function FlightDetailsPage({ params, searchParams }: FlightDetailsPageProps) {
  // Await params before accessing properties
  const { flightNumber, departureDate, arrivalDate } = await params;
  
  console.log(`Flight details page params: flightNumber=${flightNumber}, departureDate=${departureDate}, arrivalDate=${arrivalDate}`);

  const querySearchParams = await searchParams;
  
  // Get airport codes from search params if available
  const departureAirport = querySearchParams?.dep_iata || '';
  const arrivalAirport = querySearchParams?.arr_iata || '';
  
  console.log(`Airport codes: departureAirport=${departureAirport}, arrivalAirport=${arrivalAirport}`);
  
  // Validate parameters
  if (!flightNumber || !departureDate || !arrivalDate) {
    console.error(`Missing required parameters: flightNumber=${flightNumber}, departureDate=${departureDate}, arrivalDate=${arrivalDate}`);
    notFound();
  }

  try {
    // Construct API URL with path segments
    const safeFlightNumber = encodeURIComponent(flightNumber);
    const safeDepartureDate = encodeURIComponent(departureDate);
    const safeArrivalDate = encodeURIComponent(arrivalDate);

    console.log(`Flight details page params: ${flightNumber}, ${departureDate}, ${arrivalDate}`);
    // For server components, use an absolute URL for fetch
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    
    const apiUrl = new URL(`/api/flights/${safeFlightNumber}/${safeDepartureDate}/${safeArrivalDate}`, baseUrl);
    
    // Add airport codes as query parameters
    if (departureAirport) {
      apiUrl.searchParams.append("dep_iata", departureAirport);
    }
    
    if (arrivalAirport) {
      apiUrl.searchParams.append("arr_iata", arrivalAirport);
    }
  
    console.log(`Fetching flight details from API path: ${apiUrl.toString()}`);
    
    // Add cache-busting parameter
    const timestamp = Date.now();
    apiUrl.searchParams.append("_", timestamp.toString());
    
    // Make the fetch request with no auth requirements
    const flightResponse = await fetch(apiUrl.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });
    
    console.log(`API response status: ${flightResponse.status} ${flightResponse.statusText}`);
    
    if (!flightResponse.ok) {
      throw new Error(`API request failed with status ${flightResponse.status}`);
    }
    
    const responseData = await flightResponse.json();
    
    if (!responseData.flight) {
      console.error("No flight data in API response");
      notFound();
    }
    
    const { flight } = responseData;
    
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