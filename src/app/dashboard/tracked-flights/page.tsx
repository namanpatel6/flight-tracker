import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { Suspense } from "react";
import { TrackedFlightsList } from "./tracked-flights-list";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = {
  title: "Rule Flights | Flight Tracker",
  description: "View flights from your configured rules",
};

export default async function TrackedFlightsPage() {
  const session = await getServerSession();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Rule Flights</h1>
      </div>
      
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Flights from Your Rules</h2>
          <p className="text-gray-600 mb-6">
            View flights that are being tracked by your rules. Alerts from your rules apply to these flights.
          </p>
          
          <Suspense fallback={<TrackedFlightsListSkeleton />}>
            <TrackedFlightsList />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

function TrackedFlightsListSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="border rounded-lg p-4">
          <div className="flex justify-between items-start">
            <div>
              <Skeleton className="h-6 w-32 mb-2" />
              <Skeleton className="h-4 w-48 mb-1" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-8 w-24" />
          </div>
        </div>
      ))}
    </div>
  );
} 