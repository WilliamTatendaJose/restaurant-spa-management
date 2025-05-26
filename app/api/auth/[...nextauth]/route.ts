// This file has been removed - using offline authentication system instead
// All authentication is now handled through the offline auth system
export async function GET() {
  return new Response('Authentication handled by offline system', { status: 404 });
}

export async function POST() {
  return new Response('Authentication handled by offline system', { status: 404 });
}