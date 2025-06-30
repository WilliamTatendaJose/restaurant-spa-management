import { NextRequest, NextResponse } from 'next/server';
import { listUsers, createUser, UserCreateInput } from '@/lib/user-management';

export async function GET(request: NextRequest) {
  try {
    // Get query parameters for pagination
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');

    // Get users with pagination
    const result = await listUsers(page, pageSize);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error getting users:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get users' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const userData: UserCreateInput = await request.json();

    // Create the user
    const newUser = await createUser(userData);

    return NextResponse.json(newUser, { status: 201 });
  } catch (error: any) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create user' },
      { status: 500 }
    );
  }
}
