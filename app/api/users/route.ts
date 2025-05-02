import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { listUsers, createUser, UserCreateInput } from "@/lib/user-management";

export async function GET(request: NextRequest) {
  try {
    // Verify the user is authenticated and has admin role
    const session = await auth();
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Check if user has admin role
    const userRole = (session.user as any).role;
    if (userRole !== "admin") {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }
    
    // Get query parameters for pagination
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");
    
    // Get users with pagination
    const result = await listUsers(page, pageSize);
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error getting users:", error);
    return NextResponse.json(
      { error: error.message || "Failed to get users" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify the user is authenticated and has admin role
    const session = await auth();
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Check if user has admin role
    const userRole = (session.user as any).role;
    if (userRole !== "admin") {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }
    
    // Parse request body
    const userData: UserCreateInput = await request.json();
    
    // Create the user
    const newUser = await createUser(userData);
    
    return NextResponse.json(newUser, { status: 201 });
  } catch (error: any) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create user" },
      { status: 500 }
    );
  }
}