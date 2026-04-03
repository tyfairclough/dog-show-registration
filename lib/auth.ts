import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';

// Secret key for JWT signing (in production, use a secure random string from environment variables)
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production-min-32-chars'
);

const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

function getRequiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

// Intentionally fail fast so auth never falls back to hardcoded credentials.
export const ADMIN_USERNAME = getRequiredEnv('ADMIN_USERNAME');
export const ADMIN_PASSWORD_HASH = getRequiredEnv('ADMIN_PASSWORD_HASH');

// Hash password function (run this once to generate the hash)
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

// Verify password
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Create session token
export async function createSession(username: string): Promise<string> {
  const token = await new SignJWT({ username })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(JWT_SECRET);
  
  return token;
}

// Verify session token
export async function verifySession(token: string): Promise<{ username: string } | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as { username: string };
  } catch (error) {
    return null;
  }
}

// Cookie name for session
export const SESSION_COOKIE_NAME = 'admin-session';
