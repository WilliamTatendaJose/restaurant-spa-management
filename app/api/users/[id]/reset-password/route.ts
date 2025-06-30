import { NextRequest, NextResponse } from 'next/server';
import { resetPassword } from '@/lib/offline-auth';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;

    // Parse request body to get the new password
    const { password } = await request.json();

    if (!password || password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // Reset the user's password
    await resetPassword(userId, password);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error resetting user password:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to reset password' },
      { status: 500 }
    );
  }
}
