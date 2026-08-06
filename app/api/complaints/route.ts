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
    const complaints = await db
      .collection('complaints')
      .find({})
      .sort({ register_date: -1 })
      .toArray();

    // Map creator names by fetching corresponding profiles (fast in-memory mapping)
    const creatorIds = Array.from(new Set(complaints.map(c => c.created_by).filter(Boolean)));
    const profiles = await db.collection('profiles').find({ id: { $in: creatorIds } }).toArray();
    const profileMap = new Map(profiles.map(p => [p.id, p.name]));

    const formattedComplaints = complaints.map(c => ({
      id: c.id || c._id.toString(),
      name: c.name,
      register_date: c.register_date,
      description: c.description || '',
      created_by: c.created_by,
      creator_name: profileMap.get(c.created_by) || 'Unknown Operator',
      images: c.images || [],
      pdfs: c.pdfs || [],
      xlsxs: c.xlsxs || [],
      csvs: c.csvs || [],
      police_station: c.police_station || '',
      mode_of_theft: c.mode_of_theft || '',
      volume_booked_hm3: c.volume_booked_hm3 || '',
      volume_booked_mmcf: c.volume_booked_mmcf || '',
      amount_booked: c.amount_booked || '',
      plaintiff: c.plaintiff || '',
      status_of_accused: c.status_of_accused || '',
      lawyer_name: c.lawyer_name || '',
      court_name: c.court_name || '',
      public_link_token: c.public_link_token || null,
      public_link_active: !!c.public_link_active,
      created_at: c.created_at,
    }));

    return NextResponse.json(formattedComplaints);
  } catch (error: any) {
    console.error('Fetch complaints error:', error);
    return NextResponse.json({ error: error.message || 'Failed to query database complaints.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const sessionUser = getSessionUser(req);
    if (!sessionUser || sessionUser.role === 'lawyer' || sessionUser.status !== 'approved') {
      return NextResponse.json({ error: 'Access denied. Operator role is required.' }, { status: 403 });
    }

    const { name, register_date, description, images, pdfs, xlsxs, csvs, police_station, mode_of_theft, volume_booked_hm3, volume_booked_mmcf, amount_booked, plaintiff, status_of_accused, lawyer_name, court_name } = await req.json();
    if (!name || !register_date) {
      return NextResponse.json({ error: 'Subject name and register date are required.' }, { status: 400 });
    }

    const db = await getDb();
    const complaintId = crypto.randomUUID();

    const newComplaint = {
      _id: complaintId as any,
      id: complaintId,
      name,
      register_date,
      description: description || '',
      created_by: sessionUser.id,
      images: images || [],
      pdfs: pdfs || [],
      xlsxs: xlsxs || [],
      csvs: csvs || [],
      police_station: police_station || '',
      mode_of_theft: mode_of_theft || '',
      volume_booked_hm3: volume_booked_hm3 || '',
      volume_booked_mmcf: volume_booked_mmcf || '',
      amount_booked: amount_booked || '',
      plaintiff: plaintiff || '',
      status_of_accused: status_of_accused || '',
      lawyer_name: lawyer_name || '',
      court_name: court_name || '',
      public_link_token: null,
      public_link_active: false,
      created_at: new Date(),
    };

    await db.collection('complaints').insertOne(newComplaint);

    return NextResponse.json({
      success: true,
      data: {
        ...newComplaint,
        creator_name: sessionUser.name,
      },
    });
  } catch (error: any) {
    console.error('Create complaint error:', error);
    return NextResponse.json({ error: error.message || 'Failed to save complaint record.' }, { status: 500 });
  }
}
