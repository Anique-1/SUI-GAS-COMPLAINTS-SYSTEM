'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useUser } from '../layout';
import { dbClient, Complaint } from '@/lib/db';
import {
  AlertOctagon,
  Search,
  Calendar,
  Phone,
  ExternalLink,
  CheckCircle2,
  Clock,
  Trash2,
  Edit3,
  Copy,
  Check,
  Loader2,
  RefreshCw,
  X,
  CreditCard,
  FileText,
  DollarSign,
  AlertTriangle,
  Scale,
  Gauge,
  Receipt
} from 'lucide-react';

const normalizeText = (str: string | undefined | null) =>
  str ? str.toLowerCase().replace(/[\u2013\u2014-]/g, '-').replace(/\s+/g, ' ').trim() : '';

const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string; border: string; icon: any }> = {
  pending: { label: 'Pending Initial Review', bg: '#fef3c7', color: '#92400e', border: '#fde68a', icon: Clock },
  under_review: { label: 'Under Billing & Dial Audit', bg: '#e0f2fe', color: '#0369a1', border: '#bae6fd', icon: Clock },
  resolved: { label: 'Discrepancy Approved & Credited', bg: '#ecfdf5', color: '#047857', border: '#a7f3d0', icon: CheckCircle2 },
  rejected: { label: 'Bill Verified Accurate (Closed)', bg: '#fef2f2', color: '#991b1b', border: '#fecaca', icon: AlertOctagon },
};

export default function BillDisputesDashboardPage() {
  const { user } = useUser();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [disputeTypeFilter, setDisputeTypeFilter] = useState<string>('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Status & Audit Update Modal
  const [selectedDispute, setSelectedDispute] = useState<Complaint | null>(null);
  const [newStatus, setNewStatus] = useState<string>('under_review');
  const [resolutionNotes, setResolutionNotes] = useState<string>('');
  const [adjustedCredit, setAdjustedCredit] = useState<string>('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Copied token notification
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const fetchBillDisputes = async () => {
    try {
      setLoading(true);
      const all = await dbClient.getComplaints();
      // Strictly filter for bill_dispute category
      const disputes = all.filter(c => c.complaint_category === 'bill_dispute');
      setComplaints(disputes);
    } catch (err) {
      console.error('Failed to load bill disputes', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBillDisputes();
  }, []);

  const handleCopy = (token: string) => {
    const fullUrl = `${window.location.origin}/public/${token}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const handleOpenAuditModal = (c: Complaint) => {
    setSelectedDispute(c);
    setNewStatus(c.status || 'pending');
    setResolutionNotes((c as any).resolution_notes || '');
    setAdjustedCredit((c as any).adjusted_credit || '');
  };

  const handleSaveAudit = async () => {
    if (!selectedDispute) return;
    setIsUpdatingStatus(true);
    try {
      const res = await fetch(`/api/complaints/${selectedDispute.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          resolution_notes: resolutionNotes.trim(),
          adjusted_credit: adjustedCredit.trim(),
        }),
      });

      if (res.ok) {
        setSelectedDispute(null);
        await fetchBillDisputes();
      } else {
        alert('Failed to update dispute record. Please verify permissions.');
      }
    } catch (err) {
      console.error('Audit update error', err);
      alert('Error saving dispute update.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleDeleteDispute = async (id: string) => {
    if (!confirm('Are you sure you want to delete this consumer bill dispute record?')) return;
    try {
      const err = await dbClient.deleteComplaint(id);
      if (err.error) {
        alert(err.error);
      } else {
        setComplaints(prev => prev.filter(c => c.id !== id));
      }
    } catch (e) {
      console.error('Delete error', e);
    }
  };

  // Filter Logic
  const filtered = complaints.filter(c => {
    const query = normalizeText(searchQuery);
    const matchesSearch =
      normalizeText(c.name).includes(query) ||
      normalizeText(c.consumer_no).includes(query) ||
      normalizeText(c.consumer_name).includes(query) ||
      normalizeText(c.meter_no).includes(query) ||
      normalizeText(c.billing_month).includes(query) ||
      normalizeText(c.dispute_type).includes(query) ||
      normalizeText(c.phone).includes(query) ||
      normalizeText(c.description).includes(query) ||
      normalizeText(c.public_link_token).includes(query);

    let matchesStatus = true;
    if (statusFilter !== 'all') {
      matchesStatus = (c.status || 'pending') === statusFilter;
    }

    let matchesType = true;
    if (disputeTypeFilter !== 'all') {
      matchesType = (c.dispute_type || '').toLowerCase().includes(disputeTypeFilter.toLowerCase());
    }

    let matchesDate = true;
    if (fromDate) matchesDate = matchesDate && c.register_date >= fromDate;
    if (toDate) matchesDate = matchesDate && c.register_date <= toDate;

    return matchesSearch && matchesStatus && matchesType && matchesDate;
  });

  // Calculate Metrics
  const totalCount = complaints.length;
  const pendingCount = complaints.filter(c => !c.status || c.status === 'pending').length;
  const inAuditCount = complaints.filter(c => c.status === 'under_review').length;
  const resolvedCount = complaints.filter(c => c.status === 'resolved').length;
  const totalDisputedValue = complaints.reduce((sum, c) => {
    const amt = parseFloat((c.disputed_amount || '0').replace(/[^\d.]/g, ''));
    return sum + (isNaN(amt) ? 0 : amt);
  }, 0);

  return (
    <div>
      {/* SNGPL Corporate Header Banner */}
      <div
        className="glass-panel"
        style={{
          padding: '22px 28px',
          marginBottom: '26px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '18px',
          background: 'linear-gradient(135deg, rgba(240, 249, 255, 0.95) 0%, rgba(255, 255, 255, 0.9) 100%)',
          borderColor: 'rgba(2, 132, 199, 0.25)',
          boxShadow: '0 10px 25px -5px rgba(2, 132, 199, 0.08)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '54px',
            height: '54px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            boxShadow: '0 4px 14px rgba(2, 132, 199, 0.35)',
            flexShrink: 0
          }}>
            <Scale className="w-7 h-7" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '11px', fontWeight: '800', color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                SNGPL Revenue & Customer Billing Audit
              </span>
              <span style={{
                background: '#e0f2fe',
                color: '#0369a1',
                border: '1px solid #bae6fd',
                fontSize: '11px',
                fontWeight: '700',
                padding: '2px 8px',
                borderRadius: '12px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <Receipt className="w-3 h-3 text-sky-600" />
                1-Click Bill Disputes
              </span>
            </div>
            <h1 style={{ fontSize: '22px', fontWeight: '900', color: '#0f172a', marginTop: '2px', lineHeight: '1.2' }}>
              Consumer Bill Disputes (Audit Management)
            </h1>
            <p style={{ color: '#64748b', fontSize: '12.5px', marginTop: '2px' }}>
              Dedicated billing reconciliation station for consumer-filed over-billing claims, meter reading audits, and slab adjustments.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            type="button"
            onClick={fetchBillDisputes}
            className="btn btn-secondary"
            style={{ padding: '8px 14px', fontSize: '12.5px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Disputes</span>
          </button>
        </div>
      </div>

      {/* KPI METRIC CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '24px' }}>
        
        {/* Metric 1 */}
        <div className="glass-panel" style={{ padding: '16px 18px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11.5px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Total Disputes</span>
            <AlertOctagon className="w-4 h-4 text-sky-600" />
          </div>
          <div style={{ fontSize: '24px', fontWeight: '900', color: '#0f172a', marginTop: '6px' }}>{totalCount}</div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>Consumer portal filed</div>
        </div>

        {/* Metric 2 */}
        <div className="glass-panel" style={{ padding: '16px 18px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11.5px', fontWeight: '700', color: '#92400e', textTransform: 'uppercase' }}>Pending Review</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div style={{ fontSize: '24px', fontWeight: '900', color: '#b45309', marginTop: '6px' }}>{pendingCount}</div>
          <div style={{ fontSize: '11px', color: '#92400e', marginTop: '2px' }}>Awaiting auditor action</div>
        </div>

        {/* Metric 3 */}
        <div className="glass-panel" style={{ padding: '16px 18px', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11.5px', fontWeight: '700', color: '#0369a1', textTransform: 'uppercase' }}>In Billing Audit</span>
            <Gauge className="w-4 h-4 text-sky-600" />
          </div>
          <div style={{ fontSize: '24px', fontWeight: '900', color: '#0284c7', marginTop: '6px' }}>{inAuditCount}</div>
          <div style={{ fontSize: '11px', color: '#0369a1', marginTop: '2px' }}>Dial reading verification</div>
        </div>

        {/* Metric 4 */}
        <div className="glass-panel" style={{ padding: '16px 18px', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11.5px', fontWeight: '700', color: '#065f46', textTransform: 'uppercase' }}>Credit Adjusted</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div style={{ fontSize: '24px', fontWeight: '900', color: '#047857', marginTop: '6px' }}>{resolvedCount}</div>
          <div style={{ fontSize: '11px', color: '#047857', marginTop: '2px' }}>Adjustments approved</div>
        </div>

        {/* Metric 5 */}
        <div className="glass-panel" style={{ padding: '16px 18px', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11.5px', fontWeight: '700', color: '#475569', textTransform: 'uppercase' }}>Total Disputed</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div style={{ fontSize: '22px', fontWeight: '900', color: '#0f172a', marginTop: '6px' }}>
            Rs. {Math.round(totalDisputedValue).toLocaleString()}
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>Gross claims value</div>
        </div>

      </div>

      {/* FILTER CONTROLS TOOLBAR */}
      <div
        className="glass-panel"
        style={{
          padding: '16px 20px',
          marginBottom: '20px',
          background: '#ffffff',
          borderRadius: '10px',
          border: '1px solid #e2e8f0'
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
          
          {/* Search Box */}
          <div style={{ position: 'relative', flexGrow: 1, minWidth: '240px' }}>
            <Search className="w-4 h-4 text-slate-400" style={{ position: 'absolute', left: '12px', top: '12px' }} />
            <input
              type="text"
              placeholder="Search by Consumer #, name, meter #, billing month, phone, dispute type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-input"
              style={{ paddingLeft: '34px', height: '40px', fontSize: '12.5px', width: '100%' }}
            />
          </div>

          {/* Status Filter */}
          <div style={{ minWidth: '180px' }}>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="form-input"
              style={{ height: '40px', fontSize: '12.5px', width: '100%' }}
            >
              <option value="all">All Audit Statuses</option>
              <option value="pending">🟡 Pending Initial Review</option>
              <option value="under_review">🔵 Under Billing Audit</option>
              <option value="resolved">🟢 Discrepancy Approved & Credited</option>
              <option value="rejected">🔴 Bill Verified Accurate (Rejected)</option>
            </select>
          </div>

          {/* Dispute Category Filter */}
          <div style={{ minWidth: '180px' }}>
            <select
              value={disputeTypeFilter}
              onChange={(e) => setDisputeTypeFilter(e.target.value)}
              className="form-input"
              style={{ height: '40px', fontSize: '12.5px', width: '100%' }}
            >
              <option value="all">All Dispute Categories</option>
              <option value="reading">Meter Reading Mismatch</option>
              <option value="over-billing">Over-billing Discrepancy</option>
              <option value="slab">Tariff / Slab Error</option>
              <option value="surcharge">Late Surcharge Dispute</option>
              <option value="pressure">Pressure Drop Discrepancy</option>
            </select>
          </div>

          {/* Date Filter */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="form-input"
              style={{ height: '40px', fontSize: '12px' }}
              title="From Date"
            />
            <span style={{ color: '#94a3b8', fontSize: '12px' }}>to</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="form-input"
              style={{ height: '40px', fontSize: '12px' }}
              title="To Date"
            />
          </div>

        </div>
      </div>

      {/* DISPUTES LIST */}
      {loading ? (
        <div style={{ padding: '60px 0', textAlign: 'center', color: '#64748b' }}>
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-sky-600 mb-3" />
          <p style={{ fontSize: '14px', fontWeight: '600' }}>Retrieving Consumer Bill Disputes Feed...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-panel" style={{ padding: '50px 20px', textAlign: 'center' }}>
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: '#f0f9ff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px auto',
            color: '#0284c7'
          }}>
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#0f172a', marginBottom: '6px' }}>
            No Consumer Bill Disputes Found
          </h3>
          <p style={{ color: '#64748b', fontSize: '13px', maxWidth: '420px', margin: '0 auto' }}>
            {searchQuery || statusFilter !== 'all' || disputeTypeFilter !== 'all' || fromDate || toDate
              ? 'No bill dispute records match your current search filters.'
              : 'There are currently no active bill dispute claims filed through the consumer portal.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filtered.map((dispute) => {
            const statusConfig = STATUS_CONFIG[dispute.status || 'pending'] || STATUS_CONFIG.pending;
            const StatusIcon = statusConfig.icon;

            return (
              <div
                key={dispute.id}
                className="glass-panel"
                style={{
                  padding: '22px 24px',
                  borderLeft: `5px solid ${dispute.status === 'resolved' ? '#10b981' : dispute.status === 'rejected' ? '#dc2626' : '#0284c7'}`,
                  transition: 'all 0.2s ease',
                  background: '#ffffff',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)'
                }}
              >
                {/* Header Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <span
                      style={{
                        background: statusConfig.bg,
                        color: statusConfig.color,
                        border: `1px solid ${statusConfig.border}`,
                        fontSize: '11.5px',
                        fontWeight: '800',
                        padding: '3px 10px',
                        borderRadius: '20px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}
                    >
                      <StatusIcon className="w-3.5 h-3.5" />
                      {statusConfig.label}
                    </span>

                    <span style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar className="w-3.5 h-3.5" />
                      {dispute.register_date}
                    </span>

                    {dispute.public_link_token && (
                      <span style={{ fontFamily: 'monospace', fontSize: '11px', color: '#0284c7', background: '#eff6ff', padding: '2px 8px', borderRadius: '4px', border: '1px solid #bfdbfe' }}>
                        Token: {dispute.public_link_token.slice(0, 8)}...
                      </span>
                    )}
                  </div>

                  {/* Actions Header */}
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button
                      type="button"
                      onClick={() => handleOpenAuditModal(dispute)}
                      className="btn btn-primary"
                      style={{
                        padding: '6px 14px',
                        fontSize: '12px',
                        fontWeight: '700',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Process / Audit Dispute</span>
                    </button>

                    {dispute.public_link_token && (
                      <>
                        <button
                          type="button"
                          onClick={() => dispute.public_link_token && handleCopy(dispute.public_link_token)}
                          className="btn btn-secondary"
                          style={{ padding: '6px 10px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          title="Copy Public Document Link"
                        >
                          {copiedToken === dispute.public_link_token ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedToken === dispute.public_link_token ? 'Copied' : 'Share'}</span>
                        </button>

                        <Link
                          href={`/public/${dispute.public_link_token}`}
                          target="_blank"
                          className="btn btn-secondary"
                          style={{
                            padding: '6px 12px',
                            fontSize: '12px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px'
                          }}
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Public Document</span>
                        </Link>
                      </>
                    )}

                    {(user?.role === 'executive' || user?.id === dispute.created_by) && (
                      <button
                        type="button"
                        onClick={() => handleDeleteDispute(dispute.id)}
                        className="btn btn-danger"
                        style={{ padding: '6px 10px', fontSize: '12px' }}
                        title="Delete Dispute Entry"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Dispute Title & Consumer Details Grid */}
                <div style={{ marginBottom: '14px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>
                    {dispute.name}
                  </h3>

                  <div style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px',
                    padding: '14px 16px',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '14px'
                  }}>
                    {/* Consumer # */}
                    <div>
                      <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', marginBottom: '2px' }}>
                        Consumer Number
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: '800', color: '#0369a1', fontFamily: 'monospace' }}>
                        {dispute.consumer_no || '—'}
                      </div>
                    </div>

                    {/* Consumer Name */}
                    <div>
                      <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', marginBottom: '2px' }}>
                        Consumer Name
                      </div>
                      <div style={{ fontSize: '13.5px', fontWeight: '700', color: '#0f172a' }}>
                        {dispute.consumer_name || 'Valued Consumer'}
                      </div>
                    </div>

                    {/* Billing Month */}
                    <div>
                      <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', marginBottom: '2px' }}>
                        Billing Month
                      </div>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: '#334155' }}>
                        {dispute.billing_month || '—'}
                      </div>
                    </div>

                    {/* Disputed Amount */}
                    <div>
                      <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', marginBottom: '2px' }}>
                        Disputed Billed Amount
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: '800', color: '#dc2626' }}>
                        Rs. {dispute.disputed_amount || '—'}
                      </div>
                    </div>

                    {/* Dispute Type */}
                    <div>
                      <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', marginBottom: '2px' }}>
                        Dispute Category
                      </div>
                      <div style={{ fontSize: '12.5px', fontWeight: '700', color: '#047857' }}>
                        {dispute.dispute_type || 'Over-billing Discrepancy'}
                      </div>
                    </div>

                    {/* Meter Dial Reading if given */}
                    {dispute.actual_reading && (
                      <div>
                        <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', marginBottom: '2px' }}>
                          Actual Meter Dial Reading
                        </div>
                        <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a', fontFamily: 'monospace' }}>
                          {dispute.actual_reading}
                        </div>
                      </div>
                    )}

                    {/* Phone / Contact */}
                    <div>
                      <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', marginBottom: '2px' }}>
                        Consumer Mobile Phone
                      </div>
                      {dispute.phone ? (
                        <a
                          href={`tel:${dispute.phone}`}
                          style={{ fontSize: '13px', fontWeight: '700', color: '#047857', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        >
                          <Phone className="w-3 h-3" />
                          <span>{dispute.phone}</span>
                        </a>
                      ) : (
                        <span style={{ fontSize: '12px', color: '#94a3b8' }}>Phone not provided</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Consumer Statement & Technical Description */}
                {dispute.description && (
                  <div style={{
                    fontSize: '12.5px',
                    color: '#334155',
                    lineHeight: '1.6',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '12px 16px',
                    whiteSpace: 'pre-wrap',
                    marginBottom: '10px'
                  }}>
                    {dispute.description}
                  </div>
                )}

                {/* Auditor Resolution Notes & Credit Adjustment If Present */}
                {((dispute as any).resolution_notes || (dispute as any).adjusted_credit) && (
                  <div style={{
                    padding: '12px 16px',
                    background: dispute.status === 'resolved' ? '#ecfdf5' : '#f8fafc',
                    border: `1px solid ${dispute.status === 'resolved' ? '#a7f3d0' : '#cbd5e1'}`,
                    borderRadius: '8px',
                    fontSize: '12.5px',
                    color: dispute.status === 'resolved' ? '#065f46' : '#1e293b'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '4px' }}>
                      <strong>Official SNGPL Billing Audit Resolution:</strong>
                      {(dispute as any).adjusted_credit && (
                        <span style={{ background: '#d1fae5', color: '#047857', border: '1px solid #6ee7b7', padding: '2px 8px', borderRadius: '4px', fontWeight: '800', fontSize: '11.5px' }}>
                          Approved Credit Adjustment: Rs. {(dispute as any).adjusted_credit}
                        </span>
                      )}
                    </div>
                    <div>{(dispute as any).resolution_notes || 'Investigation completed by SNGPL billing auditor.'}</div>
                  </div>
                )}

              </div>
            );
          })}
        </div>
      )}

      {/* AUDIT & STATUS UPDATE MODAL */}
      {selectedDispute && (
        <div className="modal-overlay" onClick={() => setSelectedDispute(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '580px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div>
                <span style={{ fontSize: '11px', color: '#0284c7', fontWeight: '800', textTransform: 'uppercase' }}>
                  Billing Audit Action
                </span>
                <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                  Process Consumer Bill Dispute
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDispute(null)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Consumer Quick Summary */}
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px', marginBottom: '16px', fontSize: '12.5px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ color: '#64748b' }}>Consumer Number:</span>
                <strong style={{ color: '#0369a1' }}>{selectedDispute.consumer_no}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ color: '#64748b' }}>Claimed Bill Amount:</span>
                <strong style={{ color: '#dc2626' }}>Rs. {selectedDispute.disputed_amount}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Billing Month:</span>
                <strong style={{ color: '#0f172a' }}>{selectedDispute.billing_month}</strong>
              </div>
            </div>

            {/* Audit Status Selection */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '12px', fontWeight: '700', color: '#0f172a', display: 'block', marginBottom: '6px' }}>
                Auditor Determination & Status:
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="form-input"
                style={{ width: '100%', fontSize: '13px' }}
              >
                <option value="pending">🟡 Pending Initial Verification</option>
                <option value="under_review">🔵 Under Meter Reading & Engineering Audit</option>
                <option value="resolved">🟢 Discrepancy Verified & Credit Adjustment Approved</option>
                <option value="rejected">🔴 Audit Rejected (Bill Verified Accurate as Billed)</option>
              </select>
            </div>

            {/* Approved Credit Adjustment Amount */}
            {newStatus === 'resolved' && (
              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#065f46', display: 'block', marginBottom: '6px' }}>
                  Approved Credit Adjustment / Rebate (Rs.):
                </label>
                <input
                  type="text"
                  value={adjustedCredit}
                  onChange={(e) => setAdjustedCredit(e.target.value)}
                  placeholder="e.g. 1,450 (Amount to be credited in next month bill)"
                  className="form-input"
                  style={{ width: '100%', fontSize: '13px', borderColor: '#6ee7b7' }}
                />
              </div>
            )}

            {/* Auditor Resolution Notes */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '12px', fontWeight: '700', color: '#0f172a', display: 'block', marginBottom: '6px' }}>
                Auditor Findings & Consumer Notice:
              </label>
              <textarea
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="Enter audit remarks (e.g. Physical dial reading verified at 12.44 HM³. Bill adjusted for 0.8 HM³ overcharge. Revised slip issued)..."
                rows={4}
                className="form-input"
                style={{ width: '100%', fontSize: '12.5px', padding: '10px 12px' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setSelectedDispute(null)}
                className="btn btn-secondary"
                disabled={isUpdatingStatus}
                style={{ padding: '8px 16px', fontSize: '13px' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveAudit}
                className="btn btn-primary"
                disabled={isUpdatingStatus}
                style={{
                  background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                  padding: '8px 18px',
                  fontSize: '13px',
                  fontWeight: '700',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                {isUpdatingStatus ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                <span>Save Audit Determination</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
