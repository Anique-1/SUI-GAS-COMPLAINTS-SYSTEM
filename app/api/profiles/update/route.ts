import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { getSessionUser, hashPassword, signSession } from '@/lib/auth-session';

export async function PATCH(req: NextRequest) {
  try {
    const sessionUser = getSessionUser(req);
    if (!sessionUser) {
      return NextResponse.json({ error: 'Session expired. Please log in again.' }, { status: 401 });
    }

    const { name, phone } = await req.json();
    if (!name || !phone) {
      return NextResponse.json({ error: 'Name and phone are required parameters.' }, { status: 400 });
    }

    const db = await getDb();

    // Update in database
    await db.collection('profiles').updateOne(
      { id: sessionUser.id },
      { $set: { name, phone } }
    );

    // Re-sign session with updated data
    const updatedUser = {
      ...sessionUser,
      name,
      phone,
    };
    const token = signSession(updatedUser);

    const response = NextResponse.json({ success: true, user: updatedUser });
    response.cookies.set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error: any) {
    console.error('Update profile error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update profile details.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const sessionUser = getSessionUser(req);
    if (!sessionUser) {
      return NextResponse.json({ error: 'Session expired. Please log in again.' }, { status: 401 });
    }

    const { password } = await req.json();
    if (!password || password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters long.' }, { status: 400 });
    }

    const db = await getDb();
    const newHash = hashPassword(password);

    // Update password hash in database
    await db.collection('profiles').updateOne(
      { id: sessionUser.id },
      { $set: { password_hash: newHash } }
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Reset password error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update authentication password.' }, { status: 500 });
  }
}
