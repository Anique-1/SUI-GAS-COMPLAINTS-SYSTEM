'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useUser } from './layout';
import { dbClient, Complaint, SalesComplaint, BillingComplaint } from '@/lib/db';
import {
  ClipboardList,
  Users,
  Link as LinkIcon,
  FileText,
  CheckCircle,
  Scale,
  Shield,
  DollarSign,
  ReceiptText,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Flame
} from 'lucide-react';

export default function DashboardOverview() {
  const { user } = useUser();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [salesComplaints, setSalesComplaints] = useState<SalesComplaint[]>([]);
  const [billingComplaints, setBillingComplaints] = useState<BillingComplaint[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOverviewData = async () => {
      try {
        const [firList, salesList, billingList] = await Promise.all([
          dbClient.getComplaints().catch(() => []),
          dbClient.getSalesComplaints().catch(() => []),
          dbClient.getBillingComplaints().catch(() => [])
        ]);

        setComplaints(firList);
        setSalesComplaints(salesList);
        setBillingComplaints(billingList);

        if (user?.role === 'executive') {
          const pending = await dbClient.getPendingUsers().catch(() => []);
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

  const firComplaints = complaints.filter(c => c.complaint_category !== 'gas_leak_emergency' && c.complaint_category !== 'bill_dispute');
  const gasLeakComplaints = complaints.filter(c => c.complaint_category === 'gas_leak_emergency');
  const billDisputeComplaints = complaints.filter(c => c.complaint_category === 'bill_dispute');
  const activePublicLinks = complaints.filter(c => c.public_link_active).length;

  if (loading) {
    return (
      <div style={{ padding: '40px 0' }}>
        <h1 className="page-title">Loading Portal Dashboard...</h1>
      </div>
    );
  }

  return (
    <div>
      {/* SNGPL Corporate Header Banner */}
      <div
        className="glass-panel"
        style={{
          padding: '24px 28px',
          marginBottom: '32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '20px',
          background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(240,249,255,0.85) 100%)',
          borderColor: 'rgba(2, 132, 199, 0.2)',
          boxShadow: '0 10px 25px -5px rgba(2, 132, 199, 0.06)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
          <div className="sngpl-logo-badge" style={{ width: '64px', height: '64px', padding: '4px', flexShrink: 0 }}>
            <Image
              src="/sngpl-logo.png"
              alt="SNGPL Official Logo"
              width={54}
              height={54}
              priority
              className="sngpl-logo-img"
            />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--accent-blue)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Sui Northern Gas Pipelines Limited
              </span>
              <span className="badge badge-approved" style={{ fontSize: '11px', padding: '2px 8px' }}>
                Authorized Session
              </span>
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)', marginTop: '2px', lineHeight: '1.2' }}>
              Welcome back, {user?.name}
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '2px' }}>
              Unified Technical Complaint, Billing Verification & FIR Legal Management Console
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <Link href="/dashboard/gas-leaks" className="btn btn-primary" style={{ background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)', borderColor: '#991b1b', padding: '9px 16px', fontSize: '13px', fontWeight: '700' }}>
            <Flame className="w-4 h-4" />
            <span>Gas Leaks (1199)</span>
          </Link>
          <Link href="/dashboard/bill-disputes" className="btn btn-secondary" style={{ padding: '9px 16px', fontSize: '13px', background: 'rgba(168, 85, 247, 0.08)', color: '#7e22ce', borderColor: 'rgba(168, 85, 247, 0.3)', fontWeight: '700' }}>
            <Scale className="w-4 h-4" />
            <span>Bill Disputes</span>
          </Link>
          <Link href="/dashboard/complaints" className="btn btn-primary" style={{ padding: '9px 16px', fontSize: '13px' }}>
            <ClipboardList className="w-4 h-4" />
            <span>FIR Complaints</span>
          </Link>
          <Link href="/dashboard/sales-complaints" className="btn btn-secondary" style={{ padding: '9px 16px', fontSize: '13px' }}>
            <DollarSign className="w-4 h-4" />
            <span>Sales Dept</span>
          </Link>
        </div>
      </div>

      {/* METRIC CARDS GRID */}
      <div className="metrics-grid">
        {/* Dedicated Gas Leak Emergencies Metric Card */}
        <div className="glass-panel metric-card glass-panel-hover" style={{ borderLeft: '3px solid #dc2626' }}>
          <div className="metric-header">
            <span className="metric-title" style={{ color: '#991b1b', fontWeight: '800' }}>Gas Leak Emergencies</span>
            <div className="metric-icon" style={{ background: 'rgba(220, 38, 38, 0.1)', color: '#dc2626' }}>
              <Flame className="w-5 h-5 animate-pulse" />
            </div>
          </div>
          <div className="metric-value" style={{ color: '#dc2626' }}>{gasLeakComplaints.length}</div>
          <Link href="/dashboard/gas-leaks" style={{ fontSize: '12px', color: '#dc2626', display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none', fontWeight: '700', marginTop: '8px' }}>
            Emergency dispatch console <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Dedicated Bill Disputes Metric Card */}
        <div className="glass-panel metric-card glass-panel-hover" style={{ borderLeft: '3px solid #9333ea' }}>
          <div className="metric-header">
            <span className="metric-title" style={{ color: '#7e22ce', fontWeight: '800' }}>Bill Disputes (Audit)</span>
            <div className="metric-icon" style={{ background: 'rgba(168, 85, 247, 0.1)', color: '#9333ea' }}>
              <Scale className="w-5 h-5" />
            </div>
          </div>
          <div className="metric-value" style={{ color: '#7e22ce' }}>{billDisputeComplaints.length}</div>
          <Link href="/dashboard/bill-disputes" style={{ fontSize: '12px', color: '#7e22ce', display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none', fontWeight: '700', marginTop: '8px' }}>
            Audit & adjustments console <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="glass-panel metric-card glass-panel-hover">
          <div className="metric-header">
            <span className="metric-title">FIR Complaints</span>
            <div className="metric-icon" style={{ background: 'rgba(2, 132, 199, 0.08)', color: 'var(--accent-blue)' }}>
              <ClipboardList className="w-5 h-5" />
            </div>
          </div>
          <div className="metric-value">{firComplaints.length}</div>
          <Link href="/dashboard/complaints" style={{ fontSize: '12px', color: 'var(--accent-blue)', display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none', fontWeight: '600', marginTop: '8px' }}>
            View FIR complaints <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="glass-panel metric-card glass-panel-hover">
          <div className="metric-header">
            <span className="metric-title">Sales Complaints</span>
            <div className="metric-icon" style={{ background: 'rgba(13, 148, 136, 0.08)', color: 'var(--accent-teal)' }}>
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="metric-value">{salesComplaints.length}</div>
          <Link href="/dashboard/sales-complaints" style={{ fontSize: '12px', color: 'var(--accent-teal)', display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none', fontWeight: '600', marginTop: '8px' }}>
            View sales cases <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="glass-panel metric-card glass-panel-hover">
          <div className="metric-header">
            <span className="metric-title">Billing Complaints</span>
            <div className="metric-icon" style={{ background: 'rgba(37, 99, 235, 0.08)', color: '#2563eb' }}>
              <ReceiptText className="w-5 h-5" />
            </div>
          </div>
          <div className="metric-value">{billingComplaints.length}</div>
          <Link href="/dashboard/billing-complaints" style={{ fontSize: '12px', color: '#2563eb', display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none', fontWeight: '600', marginTop: '8px' }}>
            View billing cases <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="glass-panel metric-card glass-panel-hover">
          <div className="metric-header">
            <span className="metric-title">Active Shared Links</span>
            <div className="metric-icon" style={{ background: 'rgba(16, 185, 129, 0.08)', color: 'var(--status-approved)' }}>
              <LinkIcon className="w-5 h-5" />
            </div>
          </div>
          <div className="metric-value">{activePublicLinks}</div>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginTop: '8px' }}>
            Public legal tokens active
          </span>
        </div>

        {user?.role === 'executive' && (
          <div className="glass-panel metric-card glass-panel-hover" style={{ borderLeft: '3px solid var(--status-pending)' }}>
            <div className="metric-header">
              <span className="metric-title">Pending Approvals</span>
              <div className="metric-icon" style={{ background: 'rgba(245, 158, 11, 0.08)', color: 'var(--status-pending)' }}>
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="metric-value" style={{ color: 'var(--status-pending)' }}>{pendingCount}</div>
            <Link href="/dashboard/approvals" style={{ fontSize: '12px', color: 'var(--status-pending)', display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none', fontWeight: '600', marginTop: '8px' }}>
              Review staff accounts <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}
      </div>

      <div className="responsive-grid" style={{ marginTop: '32px' }}>
        {/* PRIVILEGES SUMMARY CARD */}
        <div className="glass-panel" style={{ padding: '28px 24px' }}>
          <h2 style={{ fontSize: '18px', marginBottom: '18px', display: 'flex', gap: '10px', alignItems: 'center' }}>
            <Shield className="w-5 h-5" style={{ color: 'var(--accent-blue)' }} />
            Official Security & Role Credentials
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '13.5px' }}>Full Legal Name:</span>
              <strong style={{ color: 'var(--text-primary)', fontSize: '13.5px' }}>{user?.name}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '13.5px' }}>Official Email:</span>
              <span style={{ color: 'var(--text-primary)', fontSize: '13.5px' }}>{user?.email}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '13.5px' }}>Personnel ID Code:</span>
              <span style={{ fontFamily: 'monospace', color: 'var(--accent-teal)', fontWeight: '700', fontSize: '13.5px' }}>{user?.role_id}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '13.5px' }}>Department Role:</span>
              <span style={{ textTransform: 'uppercase', fontSize: '11px', fontWeight: '800', color: 'var(--accent-blue)', letterSpacing: '0.06em' }}>{user?.role}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '2px' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '13.5px' }}>Authorization Status:</span>
              <span className="badge badge-approved">Active & Verified</span>
            </div>
          </div>
        </div>

        {/* OPERATIONS DIRECTIVE CARD */}
        <div className="glass-panel" style={{ padding: '28px 24px' }}>
          <h2 style={{ fontSize: '18px', marginBottom: '18px', display: 'flex', gap: '10px', alignItems: 'center' }}>
            <FileText className="w-5 h-5" style={{ color: 'var(--accent-teal)' }} />
            Operational Directives
          </h2>

          {user?.role === 'executive' && (
            <div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px', lineHeight: '1.6', marginBottom: '14px' }}>
                As an <strong>Executive Administrator</strong>, you possess master authority over all technical complaint records and user access.
              </p>
              <ul style={{ listStyleType: 'none', paddingLeft: '0', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                <li style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <CheckCircle className="w-4 h-4 text-emerald-500" style={{ flexShrink: 0, color: 'var(--status-approved)' }} />
                  Approve or reject new Employee and Legal Council accounts
                </li>
                <li style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <CheckCircle className="w-4 h-4 text-emerald-500" style={{ flexShrink: 0, color: 'var(--status-approved)' }} />
                  Create, edit, audit, and delete FIR, Sales, and Billing complaints
                </li>
                <li style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <CheckCircle className="w-4 h-4 text-emerald-500" style={{ flexShrink: 0, color: 'var(--status-approved)' }} />
                  Generate and revoke secure public compliance links
                </li>
              </ul>
            </div>
          )}

          {user?.role === 'employee' && (
            <div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px', lineHeight: '1.6', marginBottom: '14px' }}>
                As an authorized <strong>Operations Employee</strong>, you log pipeline telemetry, register theft FIRs, and respond to departmental complaints:
              </p>
              <ul style={{ listStyleType: 'none', paddingLeft: '0', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                <li style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <CheckCircle className="w-4 h-4 text-emerald-500" style={{ flexShrink: 0, color: 'var(--status-approved)' }} />
                  Register FIR complaints with multi-file diagnostics, Excel, CSV, and PDF evidence
                </li>
                <li style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <CheckCircle className="w-4 h-4 text-emerald-500" style={{ flexShrink: 0, color: 'var(--status-approved)' }} />
                  Manage Sales & Billing complaint cases with customer anomalies
                </li>
                <li style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <CheckCircle className="w-4 h-4 text-emerald-500" style={{ flexShrink: 0, color: 'var(--status-approved)' }} />
                  Issue verified external links for legal compliance
                </li>
              </ul>
            </div>
          )}

          {user?.role === 'lawyer' && (
            <div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px', lineHeight: '1.6', marginBottom: '14px' }}>
                As a designated <strong>Legal Council / Auditor</strong>, you conduct statutory reviews and compliance audits:
              </p>
              <ul style={{ listStyleType: 'none', paddingLeft: '0', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                <li style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <Scale className="w-4 h-4" style={{ flexShrink: 0, color: '#8b5cf6' }} />
                  Read-only audit of all FIR and pipeline complaints
                </li>
                <li style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <Scale className="w-4 h-4" style={{ flexShrink: 0, color: '#8b5cf6' }} />
                  Verify police stations, theft modes, witnesses, and court records
                </li>
              </ul>
              <div style={{ marginTop: '14px', padding: '10px 14px', background: 'rgba(2, 132, 199, 0.04)', borderRadius: '8px', fontSize: '12px', border: '1px dashed var(--border-color)', color: 'var(--text-secondary)' }}>
                🔒 <strong>Read-Only Access:</strong> Modifying complaint data is reserved for operations and executive staff.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
