'use client';

import { useEffect, useState } from 'react';
import { useUser } from './layout';
import { dbClient, Complaint } from '@/lib/supabase';
import { ClipboardList, Users, Link as LinkIcon, FileText, CheckCircle, Scale, Shield } from 'lucide-react';

export default function DashboardOverview() {
  const { user } = useUser();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOverviewData = async () => {
      try {
        const list = await dbClient.getComplaints();
        setComplaints(list);

        if (user?.role === 'executive') {
          const pending = await dbClient.getPendingUsers();
          setPendingCount(pending.length);
        }
      } catch (err) {
        console.error('Failed to load overview data', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOverviewData();
  }, [user]);

  const activePublicLinks = complaints.filter(c => c.public_link_active).length;

  if (loading) {
    return (
      <div>
        <h1 className="page-title">Loading Overview...</h1>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Welcome back, {user?.name}</h1>
          <p className="page-description">SUI Gas Pipeline Pakistan Management System Dashboard</p>
        </div>
      </div>

      {/* METRIC CARDS GRID */}
      <div className="metrics-grid">
        <div className="glass-panel metric-card glass-panel-hover">
          <div>
            <div className="metric-label">Total Complaints</div>
            <div className="metric-value">{complaints.length}</div>
          </div>
          <div className="metric-icon">
            <ClipboardList className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-panel metric-card glass-panel-hover">
          <div>
            <div className="metric-label">Active Shared Links</div>
            <div className="metric-value">{activePublicLinks}</div>
          </div>
          <div className="metric-icon">
            <LinkIcon className="w-6 h-6" style={{ color: 'var(--accent-teal)' }} />
          </div>
        </div>

        {user?.role === 'executive' ? (
          <div className="glass-panel metric-card glass-panel-hover" style={{ borderLeft: '3px solid var(--status-pending)' }}>
            <div>
              <div className="metric-label">Pending Approvals</div>
              <div className="metric-value" style={{ color: 'var(--status-pending)' }}>{pendingCount}</div>
            </div>
            <div className="metric-icon" style={{ background: 'rgba(245, 158, 11, 0.05)', color: 'var(--status-pending)', borderColor: 'rgba(245, 158, 11, 0.1)' }}>
              <Users className="w-6 h-6" />
            </div>
          </div>
        ) : (
          <div className="glass-panel metric-card glass-panel-hover">
            <div>
              <div className="metric-label">Security Role</div>
              <div className="metric-value" style={{ fontSize: '20px', textTransform: 'capitalize', color: 'var(--accent-blue)', marginTop: '8px' }}>
                {user?.role}
              </div>
            </div>
            <div className="metric-icon">
              <Shield className="w-6 h-6" />
            </div>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px', marginTop: '40px' }}>
        {/* PRIVILEGES SUMMARY CARD */}
        <div className="glass-panel" style={{ padding: '32px' }}>
          <h2 style={{ fontSize: '20px', marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'center' }}>
            <Shield className="w-5 h-5 text-cyan-400" style={{ color: 'var(--accent-blue)' }} />
            Role & Security Credentials
          </h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Full Name:</span>
              <strong style={{ color: 'var(--text-primary)' }}>{user?.name}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Email:</span>
              <span style={{ color: 'var(--text-primary)' }}>{user?.email}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>User ID Code:</span>
              <span style={{ fontFamily: 'monospace', color: 'var(--accent-teal)' }}>{user?.role_id}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Account Role:</span>
              <span style={{ textTransform: 'uppercase', fontSize: '11px', fontWeight: '800', color: 'var(--accent-blue)', letterSpacing: '0.05em' }}>{user?.role}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '4px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Approval Status:</span>
              <span className="badge badge-approved">Approved</span>
            </div>
          </div>
        </div>

        {/* OPERATIONS DIRECTIVE CARD */}
        <div className="glass-panel" style={{ padding: '32px' }}>
          <h2 style={{ fontSize: '20px', marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'center' }}>
            <FileText className="w-5 h-5 text-cyan-400" style={{ color: 'var(--accent-teal)' }} />
            Operations Directive
          </h2>
          
          {user?.role === 'executive' && (
            <div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.6', marginBottom: '16px' }}>
                As an <strong>Executive (Admin-type)</strong>, you hold master administrative permissions. You can:
              </p>
              <ul style={{ listStyleType: 'none', paddingLeft: '0', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                <li style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <CheckCircle className="w-4 h-4 text-emerald-400" style={{ flexShrink: 0, color: 'var(--status-approved)' }} />
                  Approve or Reject new Employee/Lawyer registrations
                </li>
                <li style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <CheckCircle className="w-4 h-4 text-emerald-400" style={{ flexShrink: 0, color: 'var(--status-approved)' }} />
                  Add, edit, delete, and view all complaints in the database
                </li>
                <li style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <CheckCircle className="w-4 h-4 text-emerald-400" style={{ flexShrink: 0, color: 'var(--status-approved)' }} />
                  Generate and revoke public sharing tokens for compliance cases
                </li>
              </ul>
            </div>
          )}

          {user?.role === 'employee' && (
            <div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.6', marginBottom: '16px' }}>
                As a SUI Gas <strong>Employee</strong>, you manage pipeline operations. You can:
              </p>
              <ul style={{ listStyleType: 'none', paddingLeft: '0', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                <li style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <CheckCircle className="w-4 h-4 text-emerald-400" style={{ flexShrink: 0, color: 'var(--status-approved)' }} />
                  Add new pipeline complaints with multi-file and PDF attachments
                </li>
                <li style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <CheckCircle className="w-4 h-4 text-emerald-400" style={{ flexShrink: 0, color: 'var(--status-approved)' }} />
                  Modify and delete complaints that you created
                </li>
                <li style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <CheckCircle className="w-4 h-4 text-emerald-400" style={{ flexShrink: 0, color: 'var(--status-approved)' }} />
                  Generate public links to share complaints with legal or external teams
                </li>
              </ul>
            </div>
          )}

          {user?.role === 'lawyer' && (
            <div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.6', marginBottom: '16px' }}>
                As a SUI Gas <strong>Lawyer</strong>, you conduct regulatory reviews. You have read-only permissions:
              </p>
              <ul style={{ listStyleType: 'none', paddingLeft: '0', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                <li style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <Scale className="w-4 h-4 text-purple-400" style={{ flexShrink: 0, color: '#a78bfa' }} />
                  View all complaints registered on the pipeline system
                </li>
                <li style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <Scale className="w-4 h-4 text-purple-400" style={{ flexShrink: 0, color: '#a78bfa' }} />
                  Conduct audits and legal verification on pipeline attachments
                </li>
                <li style={{ display: 'none', gap: '8px', alignItems: 'center' }}>
                  Blocked from: Add/Edit/Delete complaints & Public links
                </li>
              </ul>
              <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', fontSize: '12px', border: '1px dashed var(--border-color)' }}>
                🔒 <strong>Lawyers cannot edit details or generate/revoke public links.</strong>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
