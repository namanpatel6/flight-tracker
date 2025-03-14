import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

interface RouteParams {
  params: {
    id: string;
  };
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const { id } = params;
    
    // Check if the alert exists and belongs to the user
    const alert = await db.alert.findUnique({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!alert) {
      return NextResponse.json(
        { message: "Alert not found" },
        { status: 404 }
      );
    }
    
    // Toggle the alert status
    const updatedAlert = await db.alert.update({
      where: {
        id,
      },
      data: {
        isActive: !alert.isActive,
      },
    });
    
    return NextResponse.json({
      message: `Alert ${updatedAlert.isActive ? "activated" : "deactivated"} successfully`,
      alert: updatedAlert
    });
  } catch (error) {
    console.error("Error toggling alert:", error);
    return NextResponse.json(
      { message: "Failed to toggle alert status" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = params;

    // Check if the alert exists and belongs to the user
    const alert = await db.alert.findUnique({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!alert) {
      return NextResponse.json(
        { message: "Alert not found" },
        { status: 404 }
      );
    }

    // Delete the alert
    await db.alert.delete({
      where: {
        id,
      },
    });

    return NextResponse.json(
      { message: "Alert deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting alert:", error);
    return NextResponse.json(
      { message: "Failed to delete alert" },
      { status: 500 }
    );
  }
} 