import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE_NAME } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ success: true });
  
  // Clear the session cookie
  response.cookies.delete(SESSION_COOKIE_NAME);
  
  return response;
}
