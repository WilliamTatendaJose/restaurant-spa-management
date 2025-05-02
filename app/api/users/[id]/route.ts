import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { updateUser, deleteUser, UserUpdateInput } from "@/lib/user-management";

// Dynamic route handler for user operations
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    
    const userId = params.id;
    
    // Parse request body
    const updateData: Omit<UserUpdateInput, "id"> = await request.json();
    
    // Update the user
    const updatedUser = await updateUser({
      id: userId,
      ...updateData
    });
    
    return NextResponse.json(updatedUser);
  } catch (error: any) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update user" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    
    const userId = params.id;
    
    // Delete the user
    await deleteUser(userId);
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete user" },
      { status: 500 }
    );
  }
}