import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { resetUserPassword } from "@/lib/user-management";

export async function POST(
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
    
    // Parse request body to get the new password
    const { password } = await request.json();
    
    if (!password || password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long" },
        { status: 400 }
      );
    }
    
    // Reset the user's password
    await resetUserPassword(userId, password);
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error resetting user password:", error);
    return NextResponse.json(
      { error: error.message || "Failed to reset password" },
      { status: 500 }
    );
  }
}