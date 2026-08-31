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
    const {
      reference,
      complaint_date,
      complaint_type,
      customers,
      reply_text,
      reply_date,
      reply_consumer_no, // which customer the action is for
    } = await req.json();

    const db = await getDb();
    const complaint = await db.collection('billing_complaints').findOne({ id });

    if (!complaint) {
      return NextResponse.json({ error: 'Billing complaint not found.' }, { status: 404 });
    }

    // CASE 1: Appending a new reply/action for a specific customer
    if (reply_text !== undefined && reply_text.trim() !== '') {
      if (sessionUser.role === 'lawyer') {
        return NextResponse.json({ error: 'Access denied. Lawyers have read-only privileges.' }, { status: 403 });
      }

      const crypto = await import('crypto');
      const newReply = {
        id: crypto.randomUUID(),
        consumer_no: reply_consumer_no || '',
        reply_text,
        reply_date: reply_date || new Date().toISOString().split('T')[0],
        replied_by: sessionUser.id,
        replier_name: sessionUser.name,
        created_at: new Date(),
      };

      await db.collection('billing_complaints').updateOne(
        { id },
        {
          $push: { replies: newReply as any },
          $set: { status: 'resolved' }
        }
      );

      return NextResponse.json({ success: true });
    }

    // CASE 2: Updating basic details (In portion)
    if (sessionUser.role === 'lawyer') {
      return NextResponse.json({ error: 'Access denied. Lawyers have read-only privileges.' }, { status: 403 });
    }

    const allowedUpdates: any = {};
    if (reference !== undefined) allowedUpdates.reference = reference;
    if (complaint_date !== undefined) allowedUpdates.complaint_date = complaint_date;
    if (complaint_type !== undefined) allowedUpdates.complaint_type = complaint_type;
    if (customers !== undefined && Array.isArray(customers)) allowedUpdates.customers = customers;

    if (Object.keys(allowedUpdates).length > 0) {
      await db.collection('billing_complaints').updateOne({ id }, { $set: allowedUpdates });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Modify billing complaint error:', error);
    return NextResponse.json({ error: error.message || 'An error occurred while updating the billing complaint.' }, { status: 500 });
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
    const complaint = await db.collection('billing_complaints').findOne({ id });

    if (!complaint) {
      return NextResponse.json({ error: 'Billing complaint not found.' }, { status: 404 });
    }

    // Role permission verification (Employee can only delete own; Executive can delete any)
    if (sessionUser.role === 'lawyer') {
      return NextResponse.json({ error: 'Access denied. Lawyers have read-only privileges.' }, { status: 403 });
    }
    if (sessionUser.role === 'employee' && complaint.created_by !== sessionUser.id) {
      return NextResponse.json({ error: 'Permission denied. Employees can only delete their own entries.' }, { status: 403 });
    }

    await db.collection('billing_complaints').deleteOne({ id });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete billing complaint error:', error);
    return NextResponse.json({ error: error.message || 'Failed to remove billing complaint from the database.' }, { status: 500 });
  }
}
