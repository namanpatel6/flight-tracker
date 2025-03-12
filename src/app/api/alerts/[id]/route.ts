import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { deleteAlert, toggleAlertStatus } from "@/lib/alerts";

interface RouteParams {
  params: {
    id: string;
  };
}

export async function PATCH(request: Request, { params }: RouteParams) {
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
        { message: "Alert ID is required" },
        { status: 400 }
      );
    }
    
    // Toggle the alert status
    const alert = await toggleAlertStatus(id, session.user.id);
    
    return NextResponse.json({
      message: `Alert ${alert.isActive ? "activated" : "deactivated"} successfully`,
      alert
    });
  } catch (error: any) {
    console.error("Toggle alert error:", error);
    
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
        { message: "Alert ID is required" },
        { status: 400 }
      );
    }
    
    // Delete the alert
    await deleteAlert(id, session.user.id);
    
    return NextResponse.json({
      message: "Alert deleted successfully"
    });
  } catch (error: any) {
    console.error("Delete alert error:", error);
    
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