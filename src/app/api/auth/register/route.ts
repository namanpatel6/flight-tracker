import { NextResponse } from "next/server";
import { registerUser, registerSchema } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate input
    const result = registerSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json(
        { message: "Invalid input", errors: result.error.errors },
        { status: 400 }
      );
    }
    
    // Register user
    const user = await registerUser(result.data);
    
    return NextResponse.json(
      { message: "User registered successfully", user },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Registration error:", error);
    
    return NextResponse.json(
      { message: error.message || "Something went wrong" },
      { status: 500 }
    );
  }
} 