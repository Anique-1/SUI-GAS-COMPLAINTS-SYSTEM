import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { getSessionUser } from '@/lib/auth-session';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    const sessionUser = getSessionUser(req);
    if (!sessionUser || sessionUser.status !== 'approved') {
      return NextResponse.json({ error: 'Access denied. Authenticated session required.' }, { status: 401 });
    }

    if (sessionUser.role === 'lawyer') {
      return NextResponse.json({ error: 'Access denied. Lawyers have read-only privileges.' }, { status: 403 });
    }

    const { id } = await context.params;
    const body = await req.json();

    const db = await getDb();
    const complaint = await db.collection('dept_1199_complaints').findOne({ id });

    if (!complaint) {
      return NextResponse.json({ error: '1199 complaint not found.' }, { status: 404 });
    }

    const allowedFields = [
      'complaint_date',
      'acct_id',
      'case_id',
      'name',
      'address',
      'contact_no',
      'case_remarks',
      'nature',
      'final_status',
      'region',
      'fa_id',
      'management_group',
      'category',
      'postal',
      'priority',
      'gps',
      'logged_by',
      'closed_by'
    ];

    const updates: any = {};
    for (const key of allowedFields) {
      if (body[key] !== undefined) {
        updates[key] = typeof body[key] === 'string' ? body[key].trim() : body[key];
      }
    }

    if (Object.keys(updates).length > 0) {
      await db.collection('dept_1199_complaints').updateOne({ id }, { $set: updates });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Modify 1199 complaint error:', error);
    return NextResponse.json({ error: error.message || 'An error occurred while updating the complaint.' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    const sessionUser = getSessionUser(req);
    if (!sessionUser || sessionUser.status !== 'approved') {
      return NextResponse.json({ error: 'Access denied. Authenticated session required.' }, { status: 401 });
    }

    const { id } = await context.params;

    const db = await getDb();
    const complaint = await db.collection('dept_1199_complaints').findOne({ id });

    if (!complaint) {
      return NextResponse.json({ error: '1199 complaint not found.' }, { status: 404 });
    }

    if (sessionUser.role === 'lawyer') {
      return NextResponse.json({ error: 'Access denied. Lawyers have read-only privileges.' }, { status: 403 });
    }
    if (sessionUser.role === 'employee' && complaint.created_by && complaint.created_by !== sessionUser.id) {
      return NextResponse.json({ error: 'Permission denied. Employees can only delete their own entries.' }, { status: 403 });
    }

    await db.collection('dept_1199_complaints').deleteOne({ id });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete 1199 complaint error:', error);
    return NextResponse.json({ error: error.message || 'Failed to remove complaint.' }, { status: 500 });
  }
}
