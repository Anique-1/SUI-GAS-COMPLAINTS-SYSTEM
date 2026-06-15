import crypto from 'crypto';
import { NextRequest } from 'next/server';

const SESSION_SECRET = process.env.SESSION_SECRET || 'sui-gas-complaints-secret-session-key-2026';

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'employee' | 'executive' | 'lawyer';
  role_id: string;
  status: 'pending' | 'approved' | 'rejected';
}

/**
 * Hashes a password using PBKDF2 with a randomly generated salt.
 * Returns the salt and hash joined by a colon.
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

/**
 * Verifies a password against the stored salt:hash string.
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const parts = storedHash.split(':');
    if (parts.length !== 2) return false;
    const salt = parts[0];
    const hash = parts[1];
    const checkHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return hash === checkHash;
  } catch (error) {
    return false;
  }
}

/**
 * Generates a signed session token.
 */
export function signSession(user: SessionUser): string {
  const data = JSON.stringify(user);
  const signature = crypto.createHmac('sha256', SESSION_SECRET).update(data).digest('hex');
  return Buffer.from(data).toString('base64') + '.' + signature;
}

/**
 * Verifies a signed session token and returns the payload if valid.
 */
export function verifySession(token: string): SessionUser | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const data = Buffer.from(parts[0], 'base64').toString('utf8');
    const signature = parts[1];
    const expectedSignature = crypto.createHmac('sha256', SESSION_SECRET).update(data).digest('hex');
    if (signature !== expectedSignature) return null;
    return JSON.parse(data) as SessionUser;
  } catch (error) {
    return null;
  }
}

/**
 * Helper to get the authenticated user from the request's cookies.
 */
export function getSessionUser(req: NextRequest): SessionUser | null {
  const cookie = req.cookies.get('session');
  if (!cookie || !cookie.value) return null;
  return verifySession(cookie.value);
}
