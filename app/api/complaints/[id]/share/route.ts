import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { getSessionUser } from '@/lib/auth-session';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const sessionUser = getSessionUser(req);
    if (!sessionUser || sessionUser.status !== 'approved' || sessionUser.role === 'lawyer') {
      return NextResponse.json({ error: 'Access denied. Operator role required.' }, { status: 401 });
    }

    const { id } = await context.params;

    const db = await getDb();
    const complaint = await db.collection('complaints').findOne({ id });

    if (!complaint) {
      return NextResponse.json({ error: 'Complaint not found.' }, { status: 404 });
    }

    // Employees can only share their own complaints
    if (sessionUser.role === 'employee' && complaint.created_by !== sessionUser.id) {
      return NextResponse.json({ error: 'Permission denied.' }, { status: 403 });
    }

    const token = 'pub-' + Math.random().toString(36).substring(2, 14);

    await db.collection('complaints').updateOne(
      { id },
      {
        $set: {
          public_link_token: token,
          public_link_active: true,
        }
      }
    );

    return NextResponse.json({ success: true, token });
  } catch (error: any) {
    console.error('Generate public link error:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate sharing token.' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    const sessionUser = getSessionUser(req);
    if (!sessionUser || sessionUser.status !== 'approved' || sessionUser.role === 'lawyer') {
      return NextResponse.json({ error: 'Access denied. Operator role required.' }, { status: 401 });
    }

    const { id } = await context.params;

    const db = await getDb();
    const complaint = await db.collection('complaints').findOne({ id });

    if (!complaint) {
      return NextResponse.json({ error: 'Complaint not found.' }, { status: 404 });
    }

    // Employees can only revoke their own complaints
    if (sessionUser.role === 'employee' && complaint.created_by !== sessionUser.id) {
      return NextResponse.json({ error: 'Permission denied.' }, { status: 403 });
    }

    await db.collection('complaints').updateOne(
      { id },
      {
        $set: {
          public_link_token: null,
          public_link_active: false,
        }
      }
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Revoke public link error:', error);
    return NextResponse.json({ error: error.message || 'Failed to revoke sharing token.' }, { status: 500 });
  }
}
