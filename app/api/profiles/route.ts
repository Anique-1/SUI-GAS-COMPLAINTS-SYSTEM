import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { getSessionUser } from '@/lib/auth-session';

// GET: Fetch all profiles (Executives only)
export async function GET(req: NextRequest) {
  try {
    const sessionUser = getSessionUser(req);
    if (!sessionUser || sessionUser.role !== 'executive') {
      return NextResponse.json({ error: 'Access denied. Executive credentials required.' }, { status: 401 });
    }

    const db = await getDb();
    const allProfiles = await db
      .collection('profiles')
      .find({})
      .project({ password_hash: 0 }) // Exclude password hashes
      .sort({ created_at: -1 })
      .toArray();

    return NextResponse.json(allProfiles);
  } catch (error: any) {
    console.error('Fetch all profiles error:', error);
    return NextResponse.json({ error: error.message || 'Database query failed.' }, { status: 500 });
  }
}

// PATCH: Edit profile details (Executives only)
export async function PATCH(req: NextRequest) {
  try {
    const sessionUser = getSessionUser(req);
    if (!sessionUser || sessionUser.role !== 'executive') {
      return NextResponse.json({ error: 'Access denied. Executive credentials required.' }, { status: 401 });
    }

    const { userId, updates } = await req.json();
    if (!userId || !updates) {
      return NextResponse.json({ error: 'Missing userId or updates payload.' }, { status: 400 });
    }

    // Safeguard: Prevent self-modification of critical credentials (status/role)
    if (userId === sessionUser.id) {
      if (updates.status && updates.status !== 'approved') {
        return NextResponse.json({ error: 'You cannot change your own approval status.' }, { status: 400 });
      }
      if (updates.role && updates.role !== 'executive') {
        return NextResponse.json({ error: 'You cannot demote your own account role.' }, { status: 400 });
      }
    }

    const db = await getDb();
    
    // Whitelist updates fields
    const allowedFields: any = {};
    if (updates.name !== undefined) allowedFields.name = updates.name;
    if (updates.phone !== undefined) allowedFields.phone = updates.phone;
    if (updates.role !== undefined && ['employee', 'executive', 'lawyer'].includes(updates.role)) {
      allowedFields.role = updates.role;
    }
    if (updates.status !== undefined && ['pending', 'approved', 'rejected'].includes(updates.status)) {
      allowedFields.status = updates.status;
    }

    const result = await db.collection('profiles').updateOne(
      { id: userId },
      { $set: allowedFields }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Profile not found.' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Admin update profile error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update user profile.' }, { status: 500 });
  }
}

// DELETE: Delete user account (Executives only)
export async function DELETE(req: NextRequest) {
  try {
    const sessionUser = getSessionUser(req);
    if (!sessionUser || sessionUser.role !== 'executive') {
      return NextResponse.json({ error: 'Access denied. Executive credentials required.' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId parameter.' }, { status: 400 });
    }

    // Safeguard: Prevent self-deletion
    if (userId === sessionUser.id) {
      return NextResponse.json({ error: 'You cannot delete your own account.' }, { status: 400 });
    }

    const db = await getDb();
    const result = await db.collection('profiles').deleteOne({ id: userId });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Profile not found.' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Admin delete profile error:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete user profile.' }, { status: 500 });
  }
}
