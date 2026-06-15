import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth-session';
import { getDb } from '@/lib/mongodb';

export async function GET(req: NextRequest) {
  try {
    const sessionUser = getSessionUser(req);
    if (!sessionUser) {
      return NextResponse.json({ user: null });
    }

    // Double check with database to get the latest status
    const db = await getDb();
    const latestProfile = await db.collection('profiles').findOne({ id: sessionUser.id });
    if (!latestProfile) {
      return NextResponse.json({ user: null });
    }

    // Check if account status has changed since session token was generated
    if (latestProfile.status !== 'approved') {
      const response = NextResponse.json({ user: null });
      // Clear cookie
      response.cookies.set('session', '', { maxAge: 0, path: '/' });
      return response;
    }

    return NextResponse.json({
      user: {
        id: latestProfile.id,
        name: latestProfile.name,
        email: latestProfile.email,
        phone: latestProfile.phone,
        role: latestProfile.role,
        role_id: latestProfile.role_id,
        status: latestProfile.status,
      }
    });
  } catch (error) {
    console.error('Session retrieval error:', error);
    return NextResponse.json({ user: null });
  }
}
