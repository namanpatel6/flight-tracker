import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { deleteTrackedFlight } from "@/lib/tracked-flights";

interface RouteParams {
  params: {
    id: string;
  };
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const { id } = params;
    
    if (!id) {
      return NextResponse.json(
        { message: "Flight ID is required" },
        { status: 400 }
      );
    }
    
    // Delete the tracked flight
    await deleteTrackedFlight(id, session.user.id);
    
    return NextResponse.json(
      { message: "Flight tracking removed successfully" }
    );
  } catch (error: any) {
    console.error("Delete tracked flight error:", error);
    
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