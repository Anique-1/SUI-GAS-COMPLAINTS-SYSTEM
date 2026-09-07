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
      xlsxs: complaint.xlsxs || [],
      csvs: complaint.csvs || [],
      // Optional FIR detail fields
      police_station: complaint.police_station || '',
      mode_of_theft: complaint.mode_of_theft || '',
      volume_booked_hm3: complaint.volume_booked_hm3 || '',
      volume_booked_mmcf: complaint.volume_booked_mmcf || '',
      amount_booked: complaint.amount_booked || '',
      complainant: complaint.complainant || complaint.plaintiff || '',
      plaintiff: complaint.complainant || complaint.plaintiff || '',
      witnesses: Array.isArray(complaint.witnesses) ? complaint.witnesses : [],
      status_of_accused: complaint.status_of_accused || '',
      lawyer_name: complaint.lawyer_name || '',
      court_name: complaint.court_name || '',
      public_link_token: complaint.public_link_token,
      public_link_active: complaint.public_link_active,
      complaint_category: complaint.complaint_category || (complaint.police_station ? 'fir_theft' : undefined),
      consumer_no: complaint.consumer_no || '',
      consumer_name: complaint.consumer_name || '',
      meter_no: complaint.meter_no || '',
      billing_month: complaint.billing_month || '',
      disputed_amount: complaint.disputed_amount || '',
      dispute_type: complaint.dispute_type || '',
      phone: complaint.phone || '',
      location_coords: complaint.location_coords || null,
      urgency: complaint.urgency || 'normal',
      status: complaint.status || 'pending',
      created_at: complaint.created_at,
    };

    return NextResponse.json(formatted);
  } catch (error: any) {
    console.error('Fetch public complaint error:', error);
    return NextResponse.json({ error: error.message || 'Server error querying public complaints registry.' }, { status: 500 });
  }
}
