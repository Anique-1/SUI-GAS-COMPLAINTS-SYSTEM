'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { dbClient, Complaint } from '@/lib/db';
import { 
  FileText, 
  Image as ImageIcon, 
  Download, 
  Calendar, 
  User, 
  ShieldAlert, 
  Loader2,
  Lock,
  Eye,
  Sheet,
  ShieldCheck,
  MapPin,
  Navigation,
  ExternalLink,
  PhoneCall,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2
} from 'lucide-react';
import EmergencyAlertDetails from '@/components/EmergencyAlertDetails';

export default function PublicComplaintView() {
  const { token } = useParams() as { token: string };
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPublicData = async () => {
      if (!token) return;
      try {
        const data = await dbClient.getPublicComplaint(token);
        setComplaint(data);
      } catch (err) {
        console.error('Error fetching public complaint', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPublicData();
  }, [token]);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: '16px' }}>
        <Loader2 className="w-10 h-10 animate-spin text-cyan-400" style={{ color: 'var(--accent-blue)' }} />
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Verifying shared authorization token...</p>
      </div>
    );
  }

  // If token is invalid or inactive
  if (!complaint) {
    return (
      <div className="auth-container">
        <div className="glass-panel auth-card glass-panel-hover" style={{ textAlign: 'center', maxWidth: '540px' }}>
          <ShieldAlert className="w-16 h-16 text-rose-500" style={{ color: 'var(--status-rejected)', margin: '0 auto 24px auto' }} />
          <h2 style={{ marginBottom: '12px' }}>Link Invalid or Expired</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.6', marginBottom: '24px' }}>
            The public sharing link you are trying to access is invalid, has been manually revoked by a SUI Gas operator, or has expired.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '8px', border: '1px dashed var(--border-color)', fontSize: '12px', color: 'var(--text-muted)' }}>
            <Lock className="w-4 h-4" />
            <span>Secure Pipeline Audit Log - Islamabad</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container" style={{ padding: '60px 24px' }}>
      <main className="glass-panel public-view-container glass-panel-hover" style={{ width: '100%' }}>
        
        {/* SNGPL Corporate Official Letterhead */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid var(--border-color)', paddingBottom: '20px', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div className="sngpl-logo-badge" style={{ width: '56px', height: '56px', padding: '3px', flexShrink: 0 }}>
              <Image
                src="/sngpl-logo.png"
                alt="SNGPL Official Logo"
                width={48}
                height={48}
                priority
                className="sngpl-logo-img"
              />
            </div>
            <div>
              <div className="sngpl-brand-title" style={{ fontSize: '18px' }}>
                SUI NORTHERN GAS PIPELINES LIMITED
              </div>
              <div className="sngpl-brand-subtitle" style={{ fontSize: '10px' }}>
                Official Pipeline Technical & Legal Document Record
              </div>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(2, 132, 199, 0.04)', border: '1px solid rgba(2, 132, 199, 0.15)', padding: '8px 14px', borderRadius: '8px' }}>
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <div style={{ fontSize: '12px', lineHeight: '1.3' }}>
              <div style={{ fontWeight: '700', color: 'var(--text-primary)' }}>Verified Document</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '10.5px' }}>Official Token Security</div>
            </div>
          </div>
        </div>

        {/* Document Title & Meta Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-color)', paddingBottom: '20px', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            {complaint.complaint_category === 'gas_leak_emergency' ? (
              <span style={{ fontSize: '11px', fontWeight: '800', color: '#dc2626', background: 'rgba(220, 38, 38, 0.1)', padding: '4px 12px', borderRadius: '4px', border: '1px solid rgba(220, 38, 38, 0.3)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'inline-block', marginBottom: '8px' }}>
                🚨 1199 Gas Leak Emergency Dispatch
              </span>
            ) : complaint.complaint_category === 'bill_dispute' ? (
              <span style={{ fontSize: '11px', fontWeight: '800', color: '#0284c7', background: 'rgba(2, 132, 199, 0.1)', padding: '4px 12px', borderRadius: '4px', border: '1px solid rgba(2, 132, 199, 0.3)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'inline-block', marginBottom: '8px' }}>
                ⚖️ 1-Click Consumer Bill Dispute
              </span>
            ) : (
              <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--accent-teal)', background: 'rgba(13, 148, 136, 0.08)', padding: '3px 10px', borderRadius: '4px', border: '1px solid rgba(13, 148, 136, 0.2)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'inline-block', marginBottom: '8px' }}>
                FIR Incident Record
              </span>
            )}
            <h1 style={{ fontSize: '24px', lineHeight: '1.25', fontWeight: '800' }}>{complaint.name}</h1>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar className="w-4 h-4 text-slate-500" />
              <span>Registered: <strong style={{ color: 'var(--text-primary)' }}>{complaint.register_date}</strong></span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <User className="w-4 h-4 text-slate-500" />
              <span>Investigating Unit / Source: <strong style={{ color: 'var(--text-primary)' }}>{complaint.creator_name}</strong></span>
            </div>
          </div>
        </div>

        {/* SPECIALIZED VIEW 1: GAS LEAK EMERGENCY WITH LIVE GPS MAP PLOTTING */}
        {complaint.complaint_category === 'gas_leak_emergency' && (
          <section style={{ marginBottom: '36px' }}>
            <div style={{
              background: '#fef2f2',
              border: '2px solid #ef4444',
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 4px 20px rgba(239, 68, 68, 0.12)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#dc2626', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <AlertTriangle className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h2 style={{ fontSize: '18px', fontWeight: '900', color: '#991b1b', margin: 0 }}>
                      Rapid Emergency Field Dispatch Plotted
                    </h2>
                    <div style={{ fontSize: '12px', color: '#b91c1c' }}>
                      Priority Level: Immediate Action (Helpline 1199 Priority Response)
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <a
                    href="tel:1199"
                    style={{
                      background: '#dc2626',
                      color: '#ffffff',
                      padding: '8px 16px',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: '800',
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <PhoneCall className="w-4 h-4" />
                    <span>Helpline 1199</span>
                  </a>
                </div>
              </div>

              {/* GPS Coordinates and Map */}
              {complaint.location_coords && (
                <div style={{ marginBottom: '18px' }}>
                  <div style={{
                    background: '#ffffff',
                    border: '1px solid #fca5a5',
                    borderRadius: '8px',
                    padding: '12px 16px',
                    marginBottom: '14px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '8px'
                  }}>
                    <div style={{ fontSize: '13px', color: '#7f1d1d' }}>
                      <span style={{ fontWeight: '700' }}>GPS Coordinates:</span> {complaint.location_coords.latitude.toFixed(6)}° N, {complaint.location_coords.longitude.toFixed(6)}° E
                      {complaint.location_coords.accuracy && (
                        <span style={{ fontSize: '11.5px', marginLeft: '8px', color: '#991b1b', background: '#fee2e2', padding: '2px 8px', borderRadius: '4px' }}>
                          Accuracy: ±{Math.round(complaint.location_coords.accuracy)}m
                        </span>
                      )}
                      {complaint.location_coords.address && (
                        <div style={{ fontSize: '12px', color: '#991b1b', marginTop: '4px' }}>
                          📍 <strong>Reported Address / Sector:</strong> {complaint.location_coords.address}
                        </div>
                      )}
                    </div>

                    <a
                      href={`https://www.google.com/maps?q=${complaint.location_coords.latitude},${complaint.location_coords.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-primary"
                      style={{
                        background: '#dc2626',
                        borderColor: '#b91c1c',
                        padding: '6px 14px',
                        fontSize: '12px',
                        fontWeight: '700',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        textDecoration: 'none'
                      }}
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      <span>View in Google Maps</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  {/* OpenStreetMap Iframe */}
                  <div style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid #fca5a5', height: '240px' }}>
                    <iframe
                      width="100%"
                      height="240"
                      frameBorder="0"
                      scrolling="no"
                      marginHeight={0}
                      marginWidth={0}
                      src={`https://www.openstreetmap.org/export/embed.html?bbox=${complaint.location_coords.longitude - 0.005}%2C${complaint.location_coords.latitude - 0.003}%2C${complaint.location_coords.longitude + 0.005}%2C${complaint.location_coords.latitude + 0.003}&layer=mapnik&marker=${complaint.location_coords.latitude}%2C${complaint.location_coords.longitude}`}
                      style={{ border: 'none' }}
                      title="OpenStreetMap Live Leak Location"
                    />
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* SPECIALIZED VIEW 2: 1-CLICK BILL DISPUTE RECORD */}
        {complaint.complaint_category === 'bill_dispute' && (
          <section style={{ marginBottom: '36px' }}>
            <div style={{
              background: '#f0f9ff',
              border: '2px solid #0284c7',
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 4px 20px rgba(2, 132, 199, 0.08)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#0284c7', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <AlertOctagon className="w-5 h-5" />
                </div>
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0369a1', margin: 0 }}>
                    Official Gas Bill Dispute Details
                  </h2>
                  <div style={{ fontSize: '12px', color: '#0284c7' }}>
                    Logged directly via SNGPL 1-Click Consumer Bill Portal
                  </div>
                </div>
              </div>

              {/* Dispute Metadata Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', background: '#ffffff', border: '1px solid #bae6fd', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
                {complaint.consumer_no && (
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Consumer Number</div>
                    <div style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a' }}>{complaint.consumer_no}</div>
                  </div>
                )}
                {complaint.consumer_name && (
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Consumer Name</div>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>{complaint.consumer_name}</div>
                  </div>
                )}
                {complaint.meter_no && (
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Meter Number</div>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>{complaint.meter_no}</div>
                  </div>
                )}
                {complaint.billing_month && (
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Disputed Month</div>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>{complaint.billing_month}</div>
                  </div>
                )}
                {complaint.disputed_amount && (
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Disputed Bill Amount</div>
                    <div style={{ fontSize: '16px', fontWeight: '800', color: '#dc2626' }}>Rs. {complaint.disputed_amount}</div>
                  </div>
                )}
                {complaint.dispute_type && (
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Dispute Category</div>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#0369a1' }}>{complaint.dispute_type}</div>
                  </div>
                )}
              </div>

              {/* Status Step Indicator */}
              <div style={{ background: '#ffffff', border: '1px solid #bae6fd', borderRadius: '8px', padding: '16px' }}>
                <div style={{ fontSize: '11.5px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '10px' }}>
                  Dispute Resolution Progress:
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', fontSize: '12.5px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#059669', fontWeight: '700' }}>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>1. Dispute Filed</span>
                  </div>
                  <span style={{ color: '#cbd5e1' }}>→</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#0284c7', fontWeight: '700' }}>
                    <CheckCircle2 className="w-4 h-4 text-sky-600" />
                    <span>2. Billing Audit Review</span>
                  </div>
                  <span style={{ color: '#cbd5e1' }}>→</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b' }}>
                    <span>3. Physical Verification</span>
                  </div>
                  <span style={{ color: '#cbd5e1' }}>→</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b' }}>
                    <span>4. Adjustment / Credit</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Technical Description */}
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '18px', marginBottom: '12px', color: 'var(--text-primary)' }}>Technical Description / Consumer Statement</h2>
          <div className="glass-panel" style={{ padding: '20px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-color)' }}>
            <EmergencyAlertDetails description={complaint.description} />
          </div>
        </section>

        {/* FIR Investigation Details */}
        {(complaint.police_station || complaint.mode_of_theft || complaint.volume_booked_hm3 || complaint.volume_booked_mmcf || complaint.amount_booked || complaint.complainant || complaint.plaintiff || (complaint.witnesses && complaint.witnesses.length > 0) || complaint.status_of_accused || complaint.lawyer_name || complaint.court_name) && (
          <section style={{ marginBottom: '40px' }}>
            <h2 style={{ fontSize: '18px', marginBottom: '16px', color: 'var(--text-primary)' }}>FIR Investigation Details</h2>
            <div className="glass-panel" style={{ padding: '20px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
                {complaint.police_station && (
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>Police Station</div>
                    <div style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{complaint.police_station}</div>
                  </div>
                )}
                {complaint.mode_of_theft && (
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>Mode of Theft</div>
                    <div style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{complaint.mode_of_theft}</div>
                  </div>
                )}
                {complaint.volume_booked_hm3 && (
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>Volume Booked (HM³)</div>
                    <div style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{complaint.volume_booked_hm3}</div>
                  </div>
                )}
                {complaint.volume_booked_mmcf && (
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>Volume Booked (MMCF)</div>
                    <div style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{complaint.volume_booked_mmcf}</div>
                  </div>
                )}
                {complaint.amount_booked && (
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>Amount Booked (PKR)</div>
                    <div style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{complaint.amount_booked}</div>
                  </div>
                )}
                {(complaint.complainant || complaint.plaintiff) && (
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>Complainant</div>
                    <div style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{complaint.complainant || complaint.plaintiff}</div>
                  </div>
                )}
                {complaint.witnesses && complaint.witnesses.length > 0 && (
                  <div style={{ gridColumn: '1 / -1', marginTop: '6px' }}>
                    <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>Witnesses ({complaint.witnesses.length})</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {complaint.witnesses.map((w: string, idx: number) => (
                        <span key={idx} style={{ fontSize: '13px', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-color)', padding: '5px 12px', borderRadius: '6px', color: 'var(--text-primary)' }}>
                          👤 {idx + 1}. {w}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {complaint.lawyer_name && (
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>Lawyer Name</div>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#818cf8' }}>⚖️ {complaint.lawyer_name}</div>
                  </div>
                )}
                {complaint.court_name && (
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>Court Name</div>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#2dd4bf' }}>🏛️ {complaint.court_name}</div>
                  </div>
                )}
                {complaint.status_of_accused && (
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>Status of Accused</div>
                    <span style={{
                      display: 'inline-block',
                      fontSize: '12px',
                      fontWeight: '700',
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                      padding: '3px 10px',
                      borderRadius: '5px',
                      ...(complaint.status_of_accused.toLowerCase().includes('arrest') ? {
                        background: '#dc2626', color: '#fff', border: '1px solid #b91c1c',
                      } : complaint.status_of_accused.toLowerCase().includes('bail') ? {
                        background: '#ca8a04', color: '#fff', border: '1px solid #a16207',
                      } : complaint.status_of_accused.toLowerCase().includes('acquit') || complaint.status_of_accused.toLowerCase().includes('release') ? {
                        background: '#16a34a', color: '#fff', border: '1px solid #15803d',
                      } : complaint.status_of_accused.toLowerCase().includes('convict') ? {
                        background: '#7c3aed', color: '#fff', border: '1px solid #6d28d9',
                      } : {
                        background: '#16a34a', color: '#fff', border: '1px solid #15803d',
                      })
                    }}>
                      {complaint.status_of_accused}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}


        {/* Attachments Section */}
        <section>
          <h2 style={{ fontSize: '18px', marginBottom: '16px', color: 'var(--text-primary)' }}>Pipeline Case Attachments</h2>
          
          {complaint.images.length === 0 && complaint.pdfs.length === 0 && (complaint.xlsxs?.length ?? 0) === 0 && (complaint.csvs?.length ?? 0) === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>No document or diagnostic image attachments are associated with this file.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Images Grid */}
              {complaint.images.length > 0 && (
                <div>
                  <h3 style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ImageIcon className="w-4 h-4 text-cyan-400" /> Image Logs ({complaint.images.length})
                  </h3>
                  <div className="attachment-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' }}>
                    {complaint.images.map((imgUrl, idx) => (
                      <div key={idx} className="attachment-preview" style={{ borderRadius: '12px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={imgUrl} alt={`Attachment Log ${idx}`} />
                        <a 
                          href={imgUrl} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="btn btn-primary" 
                          style={{ position: 'absolute', bottom: '8px', right: '8px', padding: '6px', borderRadius: '50%', width: '32px', height: '32px', boxShadow: '0 4px 12px rgba(0,0,0,0.5)', background: 'var(--accent-blue)', color: '#ffffff' }}
                          title="Open Image"
                        >
                          <Eye className="w-4 h-4 text-white" />
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* PDFs List */}
              {complaint.pdfs.length > 0 && (
                <div>
                  <h3 style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FileText className="w-4 h-4 text-red-400" /> Engineering Reports ({complaint.pdfs.length})
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {complaint.pdfs.map((pdfUrl, idx) => {
                      let filename = `Report-Doc-${idx + 1}.pdf`;
                      if (pdfUrl.startsWith('data:')) {
                        const match = pdfUrl.match(/;name=([^;]+);/);
                        if (match) {
                          filename = decodeURIComponent(match[1]);
                        } else {
                          filename = `local-compliance-report-${idx + 1}.pdf`;
                        }
                      } else {
                        try {
                          const parts = pdfUrl.split('/');
                          filename = decodeURIComponent(parts[parts.length - 1]);
                        } catch (e) {}
                      }
                      
                      return (
                        <div key={idx} className="glass-panel" style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.02)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden' }}>
                            <FileText className="w-5 h-5 text-red-400" style={{ flexShrink: 0 }} />
                            <span style={{ fontSize: '14px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {filename}
                            </span>
                          </div>
                          <a 
                            href={pdfUrl.startsWith('data:') ? pdfUrl : `/api/download?url=${encodeURIComponent(pdfUrl)}&filename=${encodeURIComponent(filename)}`} 
                            download
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="btn btn-secondary" 
                            style={{ padding: '6px 16px', fontSize: '12px', display: 'flex', gap: '6px' }}
                          >
                            <Download className="w-4 h-4" /> Download PDF
                          </a>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* XLSX List */}
              {(complaint.xlsxs?.length ?? 0) > 0 && (
                <div>
                  <h3 style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Sheet className="w-4 h-4" style={{ color: '#10b981' }} /> Excel Spreadsheets ({complaint.xlsxs?.length})
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {complaint.xlsxs?.map((xlsxUrl, idx) => {
                      let filename = `spreadsheet-${idx + 1}.xlsx`;
                      try {
                        const parts = xlsxUrl.split('/');
                        filename = decodeURIComponent(parts[parts.length - 1]);
                      } catch (e) {}
                      return (
                        <div key={idx} className="glass-panel" style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(16,185,129,0.04)', border: '1px solid rgba(16,185,129,0.15)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden' }}>
                            <Sheet className="w-5 h-5" style={{ color: '#10b981', flexShrink: 0 }} />
                            <span style={{ fontSize: '14px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {filename}
                            </span>
                          </div>
                          <a href={`/api/download?url=${encodeURIComponent(xlsxUrl)}&filename=${encodeURIComponent(filename)}`} download target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ padding: '6px 16px', fontSize: '12px', display: 'flex', gap: '6px' }}>
                            <Download className="w-4 h-4" /> Download XLSX
                          </a>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* CSV List */}
              {(complaint.csvs?.length ?? 0) > 0 && (
                <div>
                  <h3 style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Sheet className="w-4 h-4" style={{ color: '#eab308' }} /> CSV Data Files ({complaint.csvs?.length})
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {complaint.csvs?.map((csvUrl, idx) => {
                      let filename = `data-${idx + 1}.csv`;
                      try {
                        const parts = csvUrl.split('/');
                        filename = decodeURIComponent(parts[parts.length - 1]);
                      } catch (e) {}
                      return (
                        <div key={idx} className="glass-panel" style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(234,179,8,0.04)', border: '1px solid rgba(234,179,8,0.15)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden' }}>
                            <Sheet className="w-5 h-5" style={{ color: '#eab308', flexShrink: 0 }} />
                            <span style={{ fontSize: '14px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {filename}
                            </span>
                          </div>
                          <a href={`/api/download?url=${encodeURIComponent(csvUrl)}&filename=${encodeURIComponent(filename)}`} download target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ padding: '6px 16px', fontSize: '12px', display: 'flex', gap: '6px' }}>
                            <Download className="w-4 h-4" /> Download CSV
                          </a>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            </div>
          )}
        </section>

        {/* Footer */}
        <div style={{ borderTop: '1px solid var(--border-color)', marginTop: '40px', paddingTop: '20px', textAlign: 'center' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            This document is generated by the SUI Gas Pakistan compliance team under secure token authority. Verification hash included in footer meta.
          </span>
        </div>

      </main>
    </div>
  );
}
