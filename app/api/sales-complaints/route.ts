import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { getSessionUser } from '@/lib/auth-session';
import crypto from 'crypto';

export async function GET(req: NextRequest) {
  try {
    const sessionUser = getSessionUser(req);
    if (!sessionUser || sessionUser.status !== 'approved') {
      return NextResponse.json({ error: 'Access denied. Active session required.' }, { status: 401 });
    }

    const db = await getDb();
    const salesComplaints = await db
      .collection('sales_complaints')
      .find({})
      .sort({ created_at: -1 })
      .toArray();

    // Map creator names by fetching corresponding profiles
    const creatorIds = Array.from(new Set(salesComplaints.map(c => c.created_by).filter(Boolean)));
    const profiles = await db.collection('profiles').find({ id: { $in: creatorIds } }).toArray();
    const profileMap = new Map(profiles.map(p => [p.id, p.name]));

    const formattedSalesComplaints = salesComplaints.map(c => ({
      id: c.id || c._id.toString(),
      serial_id: c.serial_id,
      attended_data: c.attended_data,
      consumer_no: c.consumer_no,
      meter_no: c.meter_no,
      customer_name: c.customer_name,
      customer_address: c.customer_address,
      replies: c.replies || [],
      created_by: c.created_by,
      creator_name: profileMap.get(c.created_by) || 'Unknown Operator',
      created_at: c.created_at,
      status: c.status || 'pending',
    }));

    return NextResponse.json(formattedSalesComplaints);
  } catch (error: any) {
    console.error('Fetch sales complaints error:', error);
    return NextResponse.json({ error: error.message || 'Failed to query database sales complaints.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const sessionUser = getSessionUser(req);
    if (!sessionUser || sessionUser.role === 'lawyer' || sessionUser.status !== 'approved') {
      return NextResponse.json({ error: 'Access denied. Operator role is required.' }, { status: 403 });
    }

    const { attended_data, consumer_no, meter_no, customer_name, customer_address } = await req.json();
    if (!attended_data || !consumer_no || !meter_no || !customer_name || !customer_address) {
      return NextResponse.json({ error: 'All fields for In portion are required.' }, { status: 400 });
    }

    const db = await getDb();

    // Generate unique 6-digit Serial ID: SC-XXXXXX
    let serialId = '';
    let isUnique = false;
    let attempts = 0;
    while (!isUnique && attempts < 100) {
      const randNum = Math.floor(100000 + Math.random() * 900000); // 6-digit number
      serialId = `SC-${randNum}`;
      const existing = await db.collection('sales_complaints').findOne({ serial_id: serialId });
      if (!existing) {
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      return NextResponse.json({ error: 'Failed to generate a unique Serial ID.' }, { status: 500 });
    }

    const id = crypto.randomUUID();
    const newSalesComplaint = {
      _id: id as any,
      id,
      serial_id: serialId,
      attended_data,
      consumer_no,
      meter_no,
      customer_name,
      customer_address,
      replies: [],
      created_by: sessionUser.id,
      created_at: new Date(),
      status: 'pending',
    };

    await db.collection('sales_complaints').insertOne(newSalesComplaint);

    return NextResponse.json({
      success: true,
      data: {
        ...newSalesComplaint,
        creator_name: sessionUser.name,
      },
    });
  } catch (error: any) {
    console.error('Create sales complaint error:', error);
    return NextResponse.json({ error: error.message || 'Failed to save sales complaint record.' }, { status: 500 });
  }
}
