import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { getSessionUser } from '@/lib/auth-session';
import crypto from 'crypto';

export async function GET(req: NextRequest) {
  try {
    const sessionUser = getSessionUser(req);
    if (!sessionUser || sessionUser.status !== 'approved') {
      return NextResponse.json({ error: 'Access denied.' }, { status: 401 });
    }

    const db = await getDb();
    const collection = db.collection('pmdu_complaints');

    const records = await collection.find({}).sort({ created_at: -1 }).toArray();

    const creatorIds = Array.from(new Set(records.map((c: any) => c.created_by).filter(Boolean)));
    let profileMap = new Map<string, string>();
    if (creatorIds.length > 0) {
      const profiles = await db.collection('profiles').find({ id: { $in: creatorIds } }).toArray();
      profileMap = new Map(profiles.map((p: any) => [p.id, p.name]));
    }

    const formatted = records.map((c: any) => ({
      id: c.id || c._id.toString(),
      complaint_id: c.complaint_id || '',
      comp_date: c.comp_date || '',
      close_option: c.close_option || 'Relief Granted',
      details: c.details || '',
      feedback_statement: c.feedback_statement || '',
      region: c.region || 'FAISALABAD',
      department: c.department || 'Distribution-(UFGC)',
      complainant_name: c.complainant_name || 'Hidden',
      complainant_phone: c.complainant_phone || 'Hidden',
      address: c.address || '',
      created_by: c.created_by,
      creator_name: c.creator_name || (c.created_by ? profileMap.get(c.created_by) : null) || 'PMDU Portal Sync',
      created_at: c.created_at,
      updated_at: c.updated_at,
    }));

    return NextResponse.json(formatted);
  } catch (error: any) {
    console.error('Fetch PMDU complaints error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch PMDU complaints.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const sessionUser = getSessionUser(req);
    if (!sessionUser || sessionUser.role === 'lawyer' || sessionUser.status !== 'approved') {
      return NextResponse.json({ error: 'Access denied.' }, { status: 403 });
    }

    const body = await req.json();
    const {
      complaint_id,
      comp_date,
      close_option,
      details,
      feedback_statement,
      region,
      department,
      complainant_name,
      complainant_phone,
      address,
    } = body;

    if (!details || !details.trim()) {
      return NextResponse.json({ error: 'Complaint details/description is required.' }, { status: 400 });
    }

    const db = await getDb();
    const collection = db.collection('pmdu_complaints');

    // Auto-generate official PMDU format ID (e.g. PU290119-1244234) if not provided
    let finalComplaintId = (complaint_id || '').trim();
    if (!finalComplaintId) {
      const d = new Date();
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yy = String(d.getFullYear()).slice(-2);
      const rand = Math.floor(1000000 + Math.random() * 9000000);
      finalComplaintId = `PU${dd}${mm}${yy}-${rand}`;
    }

    const id = crypto.randomUUID();
    const now = new Date();
    const formattedDate = comp_date ? comp_date.trim() : `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;

    const newRecord = {
      _id: id as any,
      id,
      complaint_id: finalComplaintId,
      comp_date: formattedDate,
      close_option: (close_option || 'Relief Granted').trim(),
      details: details.trim(),
      feedback_statement: (feedback_statement || '').trim(),
      region: (region || 'FAISALABAD').trim(),
      department: (department || 'Distribution-(UFGC)').trim(),
      complainant_name: (complainant_name || 'Hidden').trim(),
      complainant_phone: (complainant_phone || 'Hidden').trim(),
      address: (address || '').trim(),
      created_by: sessionUser.id,
      creator_name: sessionUser.name,
      created_at: now,
    };

    await collection.insertOne(newRecord);
    return NextResponse.json({ success: true, data: newRecord });
  } catch (error: any) {
    console.error('Create PMDU complaint error:', error);
    return NextResponse.json({ error: error.message || 'Failed to save PMDU complaint.' }, { status: 500 });
  }
}
