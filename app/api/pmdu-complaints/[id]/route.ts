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
    const collection = db.collection('pmdu_complaints');
    const complaint = await collection.findOne({ id });

    if (!complaint) {
      return NextResponse.json({ error: 'PMDU complaint not found.' }, { status: 404 });
    }

    const allowedFields = [
      'complaint_id',
      'comp_date',
      'close_option',
      'details',
      'feedback_statement',
      'region',
      'department',
      'complainant_name',
      'complainant_phone',
      'address'
    ];

    const updates: any = {
      updated_at: new Date(),
    };

    for (const key of allowedFields) {
      if (body[key] !== undefined) {
        updates[key] = typeof body[key] === 'string' ? body[key].trim() : body[key];
      }
    }

    await collection.updateOne({ id }, { $set: updates });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Modify PMDU complaint error:', error);
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
    const collection = db.collection('pmdu_complaints');
    const complaint = await collection.findOne({ id });

    if (!complaint) {
      return NextResponse.json({ error: 'PMDU complaint not found.' }, { status: 404 });
    }

    if (sessionUser.role === 'lawyer') {
      return NextResponse.json({ error: 'Access denied. Lawyers have read-only privileges.' }, { status: 403 });
    }
    if (sessionUser.role === 'employee' && complaint.created_by && complaint.created_by !== sessionUser.id) {
      return NextResponse.json({ error: 'Permission denied. Employees can only delete their own entries.' }, { status: 403 });
    }

    await collection.deleteOne({ id });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete PMDU complaint error:', error);
    return NextResponse.json({ error: error.message || 'Failed to remove complaint.' }, { status: 500 });
  }
}
