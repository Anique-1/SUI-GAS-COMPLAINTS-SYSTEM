import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      type, // 'bill_dispute' | 'gas_leak_emergency'
      consumerNo,
      consumerName,
      meterNo,
      billingMonth,
      billAmount,
      disputeType,
      phone,
      description,
      actualReading,
      locationName,
      latitude,
      longitude,
      accuracy,
      severity,
    } = body;

    const db = await getDb();
    const complaintId = crypto.randomUUID();
    const token = crypto.randomBytes(16).toString('hex');
    const todayStr = new Date().toISOString().split('T')[0];

    if (type === 'bill_dispute') {
      if (!consumerNo || !phone) {
        return NextResponse.json(
          { error: 'Consumer Number and Contact Phone are required for filing a bill dispute.' },
          { status: 400 }
        );
      }

      const disputeTitle = `Bill Dispute: Consumer #${consumerNo} (${billingMonth || todayStr})`;

      const detailedDescription = [
        `Consumer Number: ${consumerNo}`,
        consumerName ? `Consumer Name: ${consumerName}` : null,
        meterNo ? `Meter Number: ${meterNo}` : null,
        billingMonth ? `Billing Month: ${billingMonth}` : null,
        billAmount ? `Billed Amount: Rs. ${billAmount}` : null,
        actualReading ? `Actual Meter Dial Reading: ${actualReading}` : null,
        disputeType ? `Dispute Category: ${disputeType}` : null,
        `Contact Phone: ${phone}`,
        description ? `\nConsumer Statement:\n${description}` : null,
      ]
        .filter(Boolean)
        .join('\n');

      const disputeDoc = {
        _id: complaintId as any,
        id: complaintId,
        name: disputeTitle,
        register_date: todayStr,
        description: detailedDescription,
        created_by: 'public_consumer',
        creator_name: 'SNGPL Web Portal Consumer',
        images: [],
        pdfs: [],
        xlsxs: [],
        csvs: [],
        public_link_token: token,
        public_link_active: true,
        complaint_category: 'bill_dispute',
        consumer_no: consumerNo,
        consumer_name: consumerName || 'Valued Consumer',
        meter_no: meterNo || '',
        billing_month: billingMonth || '',
        disputed_amount: billAmount || '',
        dispute_type: disputeType || 'Over-billing Discrepancy',
        phone: phone,
        urgency: 'normal',
        status: 'pending',
        created_at: new Date(),
      };

      await db.collection('complaints').insertOne(disputeDoc);

      return NextResponse.json({
        success: true,
        token,
        complaintId,
        trackingUrl: `/public/${token}`,
        message: 'Your bill dispute has been registered successfully with SNGPL.',
      });
    } else if (type === 'gas_leak_emergency') {
      if (!phone) {
        return NextResponse.json(
          { error: 'Contact phone number is required for emergency dispatch.' },
          { status: 400 }
        );
      }

      const emergencyTitle = `🚨 1199 Gas Leak Emergency: ${locationName || 'Live GPS Incident'}`;

      const detailedDescription = [
        `EMERGENCY ALERT - SNGPL 1199 HOTLINE RAPID DISPATCH`,
        `Severity Level: ${severity || 'Critical Leak'}`,
        `Contact Phone: ${phone}`,
        locationName ? `Reported Address / Landmark: ${locationName}` : null,
        latitude && longitude ? `Exact Coordinates: ${latitude}, ${longitude} (Accuracy: ±${accuracy ? Math.round(accuracy) : 10}m)` : null,
        latitude && longitude ? `Google Maps Pin: https://www.google.com/maps?q=${latitude},${longitude}` : null,
        description ? `\nIncident Details:\n${description}` : null,
      ]
        .filter(Boolean)
        .join('\n');

      const emergencyDoc = {
        _id: complaintId as any,
        id: complaintId,
        name: emergencyTitle,
        register_date: todayStr,
        description: detailedDescription,
        created_by: 'emergency_1199',
        creator_name: '1199 Emergency Hotline Dispatch',
        images: [],
        pdfs: [],
        xlsxs: [],
        csvs: [],
        public_link_token: token,
        public_link_active: true,
        complaint_category: 'gas_leak_emergency',
        phone,
        location_coords: (latitude && longitude) ? {
          latitude: Number(latitude),
          longitude: Number(longitude),
          accuracy: accuracy ? Number(accuracy) : undefined,
          address: locationName || 'Reported Location',
        } : undefined,
        urgency: 'critical_1199',
        status: 'in_progress', // immediately dispatched
        created_at: new Date(),
      };

      await db.collection('complaints').insertOne(emergencyDoc);

      return NextResponse.json({
        success: true,
        token,
        complaintId,
        trackingUrl: `/public/${token}`,
        message: 'Emergency leak alert recorded and dispatched to nearest SNGPL mobile response team.',
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid complaint type specified.' },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Error creating public complaint:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to submit complaint to SNGPL server.' },
      { status: 500 }
    );
  }
}
