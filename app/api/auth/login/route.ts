import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { verifyPassword, signSession } from '@/lib/auth-session';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required.' },
        { status: 400 }
      );
    }

    const db = await getDb();
    const cleanEmail = email.toLowerCase().trim();

    // Query profiles collection
    const user = await db.collection('profiles').findOne({ email: cleanEmail });

    if (!user) {
      return NextResponse.json(
        { error: 'Incorrect email or password.' },
        { status: 400 }
      );
    }

    // Verify hashed password
    const isPasswordCorrect = verifyPassword(password, user.password_hash);
    if (!isPasswordCorrect) {
      return NextResponse.json(
        { error: 'Incorrect email or password.' },
        { status: 400 }
      );
    }

    // Enforce Executive approval lockouts
    if (user.status === 'pending') {
      return NextResponse.json(
        { error: 'Your account is pending Executive approval.' },
        { status: 403 }
      );
    }

    if (user.status === 'rejected') {
      return NextResponse.json(
        { error: 'Your registration request has been rejected.' },
        { status: 403 }
      );
    }

    // Prepare profile representation for the session payload (omit sensitive details)
    const sessionUser = {
      id: user.id || user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      role_id: user.role_id,
      status: user.status,
    };

    const token = signSession(sessionUser);

    // Create response and attach the HTTP-Only cookie
    const response = NextResponse.json({
      success: true,
      user: sessionUser,
    });

    response.cookies.set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 1 week
    });

    return response;
  } catch (error: any) {
    console.error('Login API error:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred during authentication.' },
      { status: 500 }
    );
  }
}
