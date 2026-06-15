'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { dbClient, Complaint } from '@/lib/db';
import { 
  Flame, 
  FileText, 
  Image as ImageIcon, 
  Download, 
  Calendar, 
  User, 
  ShieldAlert, 
  Loader2,
  Lock,
  Eye
} from 'lucide-react';

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
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-color)', paddingBottom: '24px', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div className="auth-logo" style={{ justifyContent: 'flex-start', fontSize: '20px', marginBottom: '8px' }}>
              <Flame className="w-6 h-6" style={{ color: 'var(--accent-blue)' }} />
              <span>SUI GAS PAKISTAN</span>
            </div>
            <h1 style={{ fontSize: '26px', lineHeight: '1.2' }}>{complaint.name}</h1>
            <span style={{ fontSize: '11px', color: 'var(--accent-teal)', background: 'rgba(79, 172, 254, 0.1)', padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(79, 172, 254, 0.2)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'inline-block', marginTop: '8px' }}>
              Official Public Document
            </span>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar className="w-4 h-4 text-slate-500" />
              <span>Filed: <strong>{complaint.register_date}</strong></span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <User className="w-4 h-4 text-slate-500" />
              <span>Operator: <strong>{complaint.creator_name}</strong></span>
            </div>
          </div>
        </div>

        {/* Technical Description */}
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '18px', marginBottom: '12px', color: 'var(--text-primary)' }}>Technical Description</h2>
          <div className="glass-panel" style={{ padding: '20px', background: 'rgba(15, 23, 42, 0.5)', lineHeight: '1.6', color: 'var(--text-secondary)', fontSize: '15px' }}>
            {complaint.description || <em>No technical descriptions were submitted for this complaint entry.</em>}
          </div>
        </section>

        {/* Attachments Section */}
        <section>
          <h2 style={{ fontSize: '18px', marginBottom: '16px', color: 'var(--text-primary)' }}>Pipeline Case Attachments</h2>
          
          {complaint.images.length === 0 && complaint.pdfs.length === 0 ? (
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
