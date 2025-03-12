import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { createAlert, createAlertSchema, getAlertsForUser } from "@/lib/alerts";

export async function GET() {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Get alerts for the user
    const alerts = await getAlertsForUser(session.user.id);
    
    return NextResponse.json({ alerts });
  } catch (error: any) {
    console.error("Get alerts error:", error);
    
    return NextResponse.json(
      { message: error.message || "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    
    // Validate input
    const result = createAlertSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json(
        { message: "Invalid input", errors: result.error.errors },
        { status: 400 }
      );
    }
    
    // Create the alert
    const alert = await createAlert(session.user.id, result.data);
    
    return NextResponse.json(
      { message: "Alert created successfully", alert },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Create alert error:", error);
    
    if (error.message.includes("not found") || error.message.includes("permission")) {
      return NextResponse.json(
        { message: error.message },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { message: error.message || "Something went wrong" },
      { status: 500 }
    );
  }
} 