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
    const collection = db.collection('dept_1199_complaints');

    const records = await collection.find({}).sort({ created_at: -1 }).toArray();

    const creatorIds = Array.from(new Set(records.map((c: any) => c.created_by).filter(Boolean)));
    const profiles = await db.collection('profiles').find({ id: { $in: creatorIds } }).toArray();
    const profileMap = new Map(profiles.map((p: any) => [p.id, p.name]));

    const formatted = records.map((c: any) => ({
      id: c.id || c._id.toString(),
      complaint_date: c.complaint_date || '',
      acct_id: c.acct_id || '',
      case_id: c.case_id || '',
      name: c.name || '',
      address: c.address || '',
      contact_no: c.contact_no || '',
      case_remarks: c.case_remarks || '',
      nature: c.nature || '',
      final_status: c.final_status || 'In Progress',
      region: c.region || 'Faisalabad',
      fa_id: c.fa_id || '',
      management_group: c.management_group || '',
      category: c.category || 'DOM',
      postal: c.postal || '',
      priority: c.priority || 'Normal',
      gps: c.gps || '',
      logged_by: c.logged_by || '',
      closed_by: c.closed_by || '',
      created_by: c.created_by,
      creator_name: c.creator_name || profileMap.get(c.created_by) || 'SNGPL Operator',
      created_at: c.created_at,
    }));

    return NextResponse.json(formatted);
  } catch (error: any) {
    console.error('Fetch 1199 complaints error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch 1199 complaints.' }, { status: 500 });
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
      complaint_date,
      acct_id,
      case_id,
      name,
      address,
      contact_no,
      case_remarks,
      nature,
      final_status,
      region,
      fa_id,
      management_group,
      category,
      postal,
      priority,
      gps,
      logged_by,
      closed_by,
    } = body;

    if (!complaint_date || !acct_id || !case_id || !name || !address || !nature) {
      return NextResponse.json(
        { error: 'Complaint Date, Acct ID, Case ID, Name, Address, and Nature are required.' },
        { status: 400 }
      );
    }

    const db = await getDb();
    const id = crypto.randomUUID();
    const newRecord = {
      _id: id as any,
      id,
      complaint_date,
      acct_id: acct_id.trim(),
      case_id: case_id.trim(),
      name: name.trim(),
      address: address.trim(),
      contact_no: (contact_no || '').trim(),
      case_remarks: (case_remarks || '').trim(),
      nature: (nature || '').trim(),
      final_status: (final_status || 'In Progress').trim(),
      region: (region || 'Faisalabad').trim(),
      fa_id: (fa_id || '').trim(),
      management_group: (management_group || '').trim(),
      category: (category || 'DOM').trim(),
      postal: (postal || '').trim(),
      priority: (priority || 'Normal').trim(),
      gps: (gps || '').trim(),
      logged_by: (logged_by || sessionUser.role_id || sessionUser.name).trim(),
      closed_by: (closed_by || '').trim(),
      created_by: sessionUser.id,
      creator_name: sessionUser.name,
      created_at: new Date(),
    };

    await db.collection('dept_1199_complaints').insertOne(newRecord);
    return NextResponse.json({ success: true, data: newRecord });
  } catch (error: any) {
    console.error('Create 1199 complaint error:', error);
    return NextResponse.json({ error: error.message || 'Failed to save 1199 complaint.' }, { status: 500 });
  }
}
