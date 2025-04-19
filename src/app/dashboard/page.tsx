import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import Link from "next/link";

export default async function Dashboard() {
  const session = await getServerSession();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Welcome, {session.user.name || "User"}!</h1>
      <p className="text-lg mb-4">
        This is your flight tracker dashboard. Here you can track flights, set up alerts, and more.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-3">Track a Flight</h2>
          <p className="text-gray-600 mb-4">
            Search for flights by flight number, route, or airline.
          </p>
          <Link href="/flights/results">
            <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">
              Search Flights
            </button>
          </Link>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-3">My Tracked Flights</h2>
          <p className="text-gray-600 mb-4">
            View and manage your tracked flights.
          </p>
          <Link href="/dashboard/tracked-flights">
            <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">
              View Tracked Flights
            </button>
          </Link>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-3">Flight Alerts</h2>
          <p className="text-gray-600 mb-4">
            Set up and manage your flight alerts.
          </p>
          <Link href="/dashboard/alerts">
            <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">
              Manage Alerts
            </button>
          </Link>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-3">Flight Rules</h2>
          <p className="text-gray-600 mb-4">
            Create complex rules with multiple alerts for your flights.
          </p>
          <Link href="/dashboard/rules">
            <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">
              Manage Rules
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
} 