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
      attended_data, 
      consumer_no, 
      meter_no, 
      customer_name, 
      customer_address, 
      reply_text, 
      reply_date 
    } = await req.json();

    const db = await getDb();
    const complaint = await db.collection('sales_complaints').findOne({ id });

    if (!complaint) {
      return NextResponse.json({ error: 'Sales complaint not found.' }, { status: 404 });
    }

    // CASE 1: Appending a new reply
    if (reply_text !== undefined && reply_text.trim() !== '') {
      if (sessionUser.role === 'lawyer') {
        return NextResponse.json({ error: 'Access denied. Lawyers have read-only privileges.' }, { status: 403 });
      }

      const newReply = {
        id: crypto.randomUUID(),
        reply_text,
        reply_date: reply_date || new Date().toISOString().split('T')[0],
        replied_by: sessionUser.id,
        replier_name: sessionUser.name,
        created_at: new Date(),
      };

      await db.collection('sales_complaints').updateOne(
        { id },
        { 
          $push: { replies: newReply as any },
          $set: { status: 'resolved' }
        }
      );

      return NextResponse.json({ success: true });
    }

    // CASE 3: Updating basic details (In portion)
    // Permission check: Only the creator of the complaint or an executive can update basic details
    if (sessionUser.role === 'lawyer') {
      return NextResponse.json({ error: 'Access denied. Lawyers have read-only privileges.' }, { status: 403 });
    }
    if (sessionUser.role === 'employee' && complaint.created_by !== sessionUser.id) {
      return NextResponse.json({ error: 'Permission denied. Employees can only modify their own entries.' }, { status: 403 });
    }

    const allowedUpdates: any = {};
    if (attended_data !== undefined) allowedUpdates.attended_data = attended_data;
    if (consumer_no !== undefined) allowedUpdates.consumer_no = consumer_no;
    if (meter_no !== undefined) allowedUpdates.meter_no = meter_no;
    if (customer_name !== undefined) allowedUpdates.customer_name = customer_name;
    if (customer_address !== undefined) allowedUpdates.customer_address = customer_address;

    if (Object.keys(allowedUpdates).length > 0) {
      await db.collection('sales_complaints').updateOne(
        { id },
        { $set: allowedUpdates }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Modify sales complaint error:', error);
    return NextResponse.json({ error: error.message || 'An error occurred while updating the sales complaint.' }, { status: 500 });
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
    const complaint = await db.collection('sales_complaints').findOne({ id });

    if (!complaint) {
      return NextResponse.json({ error: 'Sales complaint not found.' }, { status: 404 });
    }

    // Role permission verification (Employee can only delete own; Executive can delete any)
    if (sessionUser.role === 'lawyer') {
      return NextResponse.json({ error: 'Access denied. Lawyers have read-only privileges.' }, { status: 403 });
    }
    if (sessionUser.role === 'employee' && complaint.created_by !== sessionUser.id) {
      return NextResponse.json({ error: 'Permission denied. Employees can only delete their own entries.' }, { status: 403 });
    }

    await db.collection('sales_complaints').deleteOne({ id });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete sales complaint error:', error);
    return NextResponse.json({ error: error.message || 'Failed to remove sales complaint from the database.' }, { status: 500 });
  }
}
