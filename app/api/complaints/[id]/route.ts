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

    const { id } = await context.params;
    const updates = await req.json();

    const db = await getDb();
    const complaint = await db.collection('complaints').findOne({ id });

    if (!complaint) {
      return NextResponse.json({ error: 'Complaint not found.' }, { status: 404 });
    }

    // Role permission verification (Employee can only update own; Executive can update any; Lawyer read-only)
    if (sessionUser.role === 'lawyer') {
      return NextResponse.json({ error: 'Access denied. Lawyers have read-only privileges.' }, { status: 403 });
    }
    if (sessionUser.role === 'employee' && complaint.created_by !== sessionUser.id) {
      return NextResponse.json({ error: 'Permission denied. Employees can only modify their own entries.' }, { status: 403 });
    }

    // Clean and validate update fields
    const allowedUpdates: any = {};
    if (updates.name !== undefined) allowedUpdates.name = updates.name;
    if (updates.register_date !== undefined) allowedUpdates.register_date = updates.register_date;
    if (updates.description !== undefined) allowedUpdates.description = updates.description;
    if (updates.images !== undefined) allowedUpdates.images = updates.images;
    if (updates.pdfs !== undefined) allowedUpdates.pdfs = updates.pdfs;
    if (updates.xlsxs !== undefined) allowedUpdates.xlsxs = updates.xlsxs;
    if (updates.csvs !== undefined) allowedUpdates.csvs = updates.csvs;
    if (updates.police_station !== undefined) allowedUpdates.police_station = updates.police_station;
    if (updates.mode_of_theft !== undefined) allowedUpdates.mode_of_theft = updates.mode_of_theft;
    if (updates.volume_booked_hm3 !== undefined) allowedUpdates.volume_booked_hm3 = updates.volume_booked_hm3;
    if (updates.volume_booked_mmcf !== undefined) allowedUpdates.volume_booked_mmcf = updates.volume_booked_mmcf;
    if (updates.amount_booked !== undefined) allowedUpdates.amount_booked = updates.amount_booked;
    if (updates.plaintiff !== undefined) allowedUpdates.plaintiff = updates.plaintiff;
    if (updates.status_of_accused !== undefined) allowedUpdates.status_of_accused = updates.status_of_accused;
    if (updates.lawyer_name !== undefined) allowedUpdates.lawyer_name = updates.lawyer_name;
    if (updates.court_name !== undefined) allowedUpdates.court_name = updates.court_name;

    await db.collection('complaints').updateOne(
      { id },
      { $set: allowedUpdates }
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Modify complaint error:', error);
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
    const complaint = await db.collection('complaints').findOne({ id });

    if (!complaint) {
      return NextResponse.json({ error: 'Complaint not found.' }, { status: 404 });
    }

    // Role permission verification (Employee can only delete own; Executive can delete any)
    if (sessionUser.role === 'lawyer') {
      return NextResponse.json({ error: 'Access denied. Lawyers have read-only privileges.' }, { status: 403 });
    }
    if (sessionUser.role === 'employee' && complaint.created_by !== sessionUser.id) {
      return NextResponse.json({ error: 'Permission denied. Employees can only delete their own entries.' }, { status: 403 });
    }

    await db.collection('complaints').deleteOne({ id });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete complaint error:', error);
    return NextResponse.json({ error: error.message || 'Failed to remove complaint from the database.' }, { status: 500 });
  }
}
