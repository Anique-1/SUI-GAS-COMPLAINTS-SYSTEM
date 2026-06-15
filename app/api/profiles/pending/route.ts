import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { getSessionUser } from '@/lib/auth-session';

export async function GET(req: NextRequest) {
  try {
    const sessionUser = getSessionUser(req);
    if (!sessionUser || sessionUser.role !== 'executive') {
      return NextResponse.json({ error: 'Access denied. Executive auth required.' }, { status: 401 });
    }

    const db = await getDb();
    const pendingUsers = await db
      .collection('profiles')
      .find({ status: 'pending' })
      .project({ password_hash: 0 }) // Omit hash security data
      .toArray();

    return NextResponse.json(pendingUsers);
  } catch (error: any) {
    console.error('Fetch pending users error:', error);
    return NextResponse.json({ error: error.message || 'Server database query failed.' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const sessionUser = getSessionUser(req);
    if (!sessionUser || sessionUser.role !== 'executive') {
      return NextResponse.json({ error: 'Access denied. Executive auth required.' }, { status: 401 });
    }

    const { userId, status } = await req.json();
    if (!userId || !['approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Valid userId and status (approved/rejected) are required.' }, { status: 400 });
    }

    const db = await getDb();

    // Update status in MongoDB
    const result = await db.collection('profiles').updateOne(
      { id: userId },
      { $set: { status } }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Profile not found.' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Update user status error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update user profile status.' }, { status: 500 });
  }
}
