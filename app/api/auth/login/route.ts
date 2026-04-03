import { NextRequest, NextResponse } from 'next/server';
import { verifyPassword, createSession, ADMIN_USERNAME, ADMIN_PASSWORD_HASH, SESSION_COOKIE_NAME } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    const normalizedAdminUsername = ADMIN_USERNAME.trim();
    const normalizedHash = ADMIN_PASSWORD_HASH.trim()
      .replace(/^"(.*)"$/, '$1')
      .replace(/^'(.*)'$/, '$1')
      .replace(/\\\$/g, '$');

    // Validate input
    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    // Verify credentials (trimmed username match for env/copy-paste edge cases)
    if (username.trim() !== normalizedAdminUsername) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    let isValid = await verifyPassword(password, ADMIN_PASSWORD_HASH);
    if (!isValid && normalizedHash !== ADMIN_PASSWORD_HASH) {
      isValid = await verifyPassword(password, normalizedHash);
    }

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Create session token
    const token = await createSession(username);

    // Create response with httpOnly cookie
    const response = NextResponse.json({ success: true });

    response.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24 hours
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
