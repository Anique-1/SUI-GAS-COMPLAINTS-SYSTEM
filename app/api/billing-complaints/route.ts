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
    const records = await db.collection('billing_complaints').find({}).sort({ created_at: -1 }).toArray();

    const creatorIds = Array.from(new Set(records.map((c: any) => c.created_by).filter(Boolean)));
    const profiles = await db.collection('profiles').find({ id: { $in: creatorIds } }).toArray();
    const profileMap = new Map(profiles.map((p: any) => [p.id, p.name]));

    const formatted = records.map((c: any) => {
      let customers = c.customers;
      if (!customers || !Array.isArray(customers) || customers.length === 0) {
        customers = [{
          consumer_no: c.consumer_no || '',
          customer_details: c.customer_details || `${c.customer_name || ''}\n${c.customer_address || ''}`.trim(),
          anomalies: c.anomalies || '',
        }];
      }

      return {
        id: c.id || c._id.toString(),
        serial_id: c.serial_id,
        reference: c.reference || '',
        complaint_date: c.complaint_date || '',
        complaint_type: c.complaint_type || 'violation_report',
        customers,
        replies: c.replies || [],
        created_by: c.created_by,
        creator_name: profileMap.get(c.created_by) || 'Unknown Operator',
        created_at: c.created_at,
        status: c.status || 'pending',
      };
    });

    return NextResponse.json(formatted);
  } catch (error: any) {
    console.error('Fetch billing complaints error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const sessionUser = getSessionUser(req);
    if (!sessionUser || sessionUser.role === 'lawyer' || sessionUser.status !== 'approved') {
      return NextResponse.json({ error: 'Access denied.' }, { status: 403 });
    }

    const { reference, complaint_date, complaint_type, customers } = await req.json();

    if (!reference || !complaint_date || !complaint_type) {
      return NextResponse.json({ error: 'Reference, Date, and Complaint Type are required.' }, { status: 400 });
    }
    if (!customers || !Array.isArray(customers) || customers.length === 0) {
      return NextResponse.json({ error: 'At least one customer entry is required.' }, { status: 400 });
    }
    for (const cust of customers) {
      if (!cust.consumer_no || !cust.customer_details) {
        return NextResponse.json({ error: 'Each customer must have a Consumer No. and Name & Address.' }, { status: 400 });
      }
    }

    const db = await getDb();

    // Generate unique BC-XXXXXX serial ID
    let serialId = '';
    let isUnique = false;
    let attempts = 0;
    while (!isUnique && attempts < 100) {
      serialId = `BC-${Math.floor(100000 + Math.random() * 900000)}`;
      const existing = await db.collection('billing_complaints').findOne({ serial_id: serialId });
      if (!existing) isUnique = true;
      attempts++;
    }
    if (!isUnique) return NextResponse.json({ error: 'Failed to generate unique Serial ID.' }, { status: 500 });

    const id = crypto.randomUUID();
    const newRecord = {
      _id: id as any,
      id,
      serial_id: serialId,
      reference,
      complaint_date,
      complaint_type,
      customers,
      replies: [],
      created_by: sessionUser.id,
      created_at: new Date(),
      status: 'pending',
    };

    await db.collection('billing_complaints').insertOne(newRecord);
    return NextResponse.json({ success: true, data: { ...newRecord, creator_name: sessionUser.name } });
  } catch (error: any) {
    console.error('Create billing complaint error:', error);
    return NextResponse.json({ error: error.message || 'Failed to save.' }, { status: 500 });
  }
}
