import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';

interface RouteContext {
  params: Promise<{ token: string }>;
}

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const { token } = await context.params;

    if (!token) {
      return NextResponse.json({ error: 'Token is required.' }, { status: 400 });
    }

    const db = await getDb();
    const complaint = await db.collection('complaints').findOne({
      public_link_token: token,
      public_link_active: true,
    });

    if (!complaint) {
      return NextResponse.json({ error: 'Shared complaint not found or link has been revoked.' }, { status: 404 });
    }

    // Retrieve creator's name for public compliance log audits
    let creatorName = 'Unknown Operator';
    if (complaint.created_by) {
      const creator = await db.collection('profiles').findOne({ id: complaint.created_by });
      if (creator) {
        creatorName = creator.name;
      }
    }

    const formatted = {
      id: complaint.id || complaint._id.toString(),
      name: complaint.name,
      register_date: complaint.register_date,
      description: complaint.description || '',
      created_by: complaint.created_by,
      creator_name: creatorName,
      images: complaint.images || [],
      pdfs: complaint.pdfs || [],
      public_link_token: complaint.public_link_token,
      public_link_active: complaint.public_link_active,
      created_at: complaint.created_at,
    };

    return NextResponse.json(formatted);
  } catch (error: any) {
    console.error('Fetch public complaint error:', error);
    return NextResponse.json({ error: error.message || 'Server error querying public complaints registry.' }, { status: 500 });
  }
}
