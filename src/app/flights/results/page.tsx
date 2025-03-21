import { Suspense } from "react";
import { FlightSearchForm } from "@/components/flights/flight-search-form";
import { SearchResults } from "./search-results";
import { Skeleton } from "@/components/ui/skeleton";

interface SearchPageProps {
  searchParams: {
    flight_iata?: string;
    airline_iata?: string;
    flight_date?: string;
    include_prices?: string;
  };
}

export default async function ResultsPage({ searchParams }: SearchPageProps) {
  // Await searchParams to avoid the Next.js error
  const params = await Promise.resolve(searchParams);
  
  // Destructure params after awaiting
  const {
    flight_iata,
    airline_iata,
    flight_date,
    include_prices
  } = params;

  // Safe way to check if we have any search params without using Object methods directly
  const hasSearchParams = !!(
    flight_iata || 
    airline_iata || 
    flight_date
  );

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Flight Search Results</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <FlightSearchForm />
        </div>
        
        <div className="md:col-span-2">
          {hasSearchParams ? (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Search Results</h2>
              <Suspense fallback={<SearchResultsSkeleton />}>
                <SearchResults searchParams={searchParams} />
              </Suspense>
            </div>
          ) : (
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <h2 className="text-xl font-semibold mb-2">No Search Criteria</h2>
              <p className="text-gray-600">
                Use the search form to find flights by flight number.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SearchResultsSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-start mb-4">
            <div>
              <Skeleton className="h-6 w-32 mb-2" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-6 w-20" />
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-5 w-12 mb-1" />
              <Skeleton className="h-4 w-16 mb-1" />
              <Skeleton className="h-3 w-24" />
            </div>
            <div>
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-5 w-12 mb-1" />
              <Skeleton className="h-4 w-16 mb-1" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <div className="flex justify-between">
            <Skeleton className="h-9 w-28" />
            <Skeleton className="h-9 w-28" />
          </div>
        </div>
      ))}
    </div>
  );
} 