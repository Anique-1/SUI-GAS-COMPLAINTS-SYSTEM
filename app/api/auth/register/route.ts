import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { hashPassword } from '@/lib/auth-session';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const { name, email, phone, role, role_id, password } = await req.json();

    if (!name || !email || !phone || !role || !role_id || !password) {
      return NextResponse.json(
        { error: 'All fields are required.' },
        { status: 400 }
      );
    }

    if (role === 'executive') {
      return NextResponse.json(
        { error: 'Executive registration must go through the dedicated executive registry.' },
        { status: 400 }
      );
    }

    const db = await getDb();
    const cleanEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existingUser = await db.collection('profiles').findOne({ email: cleanEmail });
    if (existingUser) {
      return NextResponse.json(
        { error: 'A profile with this email address already exists.' },
        { status: 400 }
      );
    }

    const passwordHash = hashPassword(password);
    const userId = crypto.randomUUID();

    // Insert user profile document
    await db.collection('profiles').insertOne({
      _id: userId as any, // Store as string ID for compatibility
      id: userId, // Duplicate for ease of client matching
      name,
      email: cleanEmail,
      phone,
      role,
      role_id,
      password_hash: passwordHash,
      status: 'pending', // Employees and lawyers are locked by default
      created_at: new Date(),
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Registration API error:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred during account registration.' },
      { status: 500 }
    );
  }
}
