import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Plane, Bell, Search } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-[calc(100vh-64px)]">
      {/* Hero Section */}
      <section className="py-12 md:py-24 lg:py-32 bg-gradient-to-b from-background to-muted">
        <div className="container max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
            <div className="space-y-4">
              <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm">
                Real-time flight tracking
              </div>
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                Track your flights with ease
              </h1>
              <p className="text-muted-foreground md:text-xl">
                Get real-time updates on flight status, delays, and gate changes. Never miss a flight again.
              </p>
              <div className="flex flex-col gap-2 min-[400px]:flex-row">
                <Link href="/flights/search">
                  <Button size="lg" className="gap-1.5">
                    <Search className="h-4 w-4" />
                    Search Flights
                  </Button>
                </Link>
                <Link href="/api/auth/signin">
                  <Button size="lg" variant="outline" className="gap-1.5">
                    <Bell className="h-4 w-4" />
                    Set Up Alerts
                  </Button>
                </Link>
              </div>
            </div>
            <div className="flex justify-center">
              <div className="relative w-full max-w-[500px] aspect-video rounded-xl overflow-hidden bg-muted/50 flex items-center justify-center">
                <Plane className="h-24 w-24 text-primary animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 md:py-24 bg-background">
        <div className="container max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold tracking-tighter">
              Everything you need to stay informed
            </h2>
            <p className="text-muted-foreground md:text-lg mt-4 max-w-[700px] mx-auto">
              Our flight tracker provides comprehensive information and alerts to keep you updated on all your travel plans.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Feature 1 */}
            <div className="flex flex-col items-center text-center p-6 bg-muted/50 rounded-lg">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Search className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Flight Search</h3>
              <p className="text-muted-foreground">
                Search for flights by number, airline, or route to get detailed information.
              </p>
            </div>
            {/* Feature 2 */}
            <div className="flex flex-col items-center text-center p-6 bg-muted/50 rounded-lg">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Bell className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Real-time Alerts</h3>
              <p className="text-muted-foreground">
                Receive notifications for delays, gate changes, and other important updates.
              </p>
            </div>
            {/* Feature 3 */}
            <div className="flex flex-col items-center text-center p-6 bg-muted/50 rounded-lg">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Plane className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Flight Details</h3>
              <p className="text-muted-foreground">
                Access comprehensive information about your flight, including terminal and gate.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 md:py-24 bg-muted">
        <div className="container max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-center text-center max-w-[800px] mx-auto">
            <h2 className="text-3xl font-bold tracking-tighter mb-4">
              Ready to track your next flight?
            </h2>
            <p className="text-muted-foreground md:text-lg mb-8">
              Start using our flight tracker today and never worry about missing a flight or gate change again.
            </p>
            <Link href="/flights/search">
              <Button size="lg" className="gap-1.5">
                Get Started
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
