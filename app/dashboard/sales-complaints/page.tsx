'use client';

import { useEffect, useState } from 'react';
import { useUser } from '../layout';
import { dbClient, SalesComplaint, ComplaintType, CustomerEntry } from '@/lib/db';
import {
  Plus,
  Search,
  Trash2,
  X,
  Eye,
  Loader2,
  MessageSquare,
  ClipboardList,
  Edit3,
  Download,
  AlertTriangle,
  FileText,
  UserPlus,
  Users
} from 'lucide-react';

const COMPLAINT_TYPE_LABELS: Record<ComplaintType, string> = {
  own_request_disconnection: 'Own Request Disconnection',
  free_gas_disconnection: 'Free Gas Disconnection',
  violation_of_contract: 'Disconnection Due to Violation of Contract',
};

const COMPLAINT_TYPE_COLORS: Record<ComplaintType, { bg: string; color: string; border: string }> = {
  own_request_disconnection: { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
  free_gas_disconnection: { bg: '#ecfdf5', color: '#047857', border: '#a7f3d0' },
  violation_of_contract: { bg: '#fef2f2', color: '#b91c1c', border: '#fecaca' },
};

const emptyCustomer = (): CustomerEntry => ({ consumer_no: '', customer_details: '', anomalies: '' });

const normalizeText = (str: string | undefined | null) =>
  str ? str.toLowerCase().replace(/[\u2013\u2014-]/g, '-').replace(/\s+/g, ' ').trim() : '';

export default function SalesComplaintsPage() {
  const { user } = useUser();
  const [salesComplaints, setSalesComplaints] = useState<SalesComplaint[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<ComplaintType | ''>('');

  // Modal state
  const [isInModalOpen, setIsInModalOpen] = useState(false);
  const [isOutModalOpen, setIsOutModalOpen] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<SalesComplaint | null>(null);
  const [editingComplaint, setEditingComplaint] = useState<SalesComplaint | null>(null);

  // IN Portion form state
  const [reference, setReference] = useState('');
  const [complaintDate, setComplaintDate] = useState('');
  const [complaintType, setComplaintType] = useState<ComplaintType>('violation_of_contract');
  const [customers, setCustomers] = useState<CustomerEntry[]>([emptyCustomer()]);

  // OUT Portion / Reply state
  const [selectedConsumerNo, setSelectedConsumerNo] = useState('');
  const [replyText, setReplyText] = useState('');
  const [replyDate, setReplyDate] = useState('');

  const fetchSalesComplaints = async () => {
    try {
      setLoading(true);
      const data = await dbClient.getSalesComplaints();
      setSalesComplaints(data);
    } catch (err) {
      console.error('Failed to fetch sales complaints', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSalesComplaints(); }, []);

  // --- Customer row helpers ---
  const updateCustomer = (idx: number, field: keyof CustomerEntry, value: string) => {
    setCustomers(prev => prev.map((c, i) => i === idx ? { ...c, [field]: value } : c));
  };
  const addCustomerRow = () => setCustomers(prev => [...prev, emptyCustomer()]);
  const removeCustomerRow = (idx: number) => setCustomers(prev => prev.filter((_, i) => i !== idx));

  // --- Open Modals ---
  const handleOpenAddModal = () => {
    setEditingComplaint(null);
    setReference('');
    setComplaintDate(new Date().toISOString().split('T')[0]);
    setComplaintType('violation_of_contract');
    setCustomers([emptyCustomer()]);
    setIsInModalOpen(true);
  };

  const handleOpenEditModal = (c: SalesComplaint) => {
    setEditingComplaint(c);
    setReference(c.reference || c.memo_ref || '');
    setComplaintDate(c.complaint_date || '');
    setComplaintType((c.complaint_type as ComplaintType) || 'violation_of_contract');
    // Load customers, or build from legacy fields
    const loaded: CustomerEntry[] = (c.customers && c.customers.length > 0)
      ? c.customers
      : [{ consumer_no: c.consumer_no || '', customer_details: c.customer_details || `${c.customer_name || ''}\n${c.customer_address || ''}`.trim(), anomalies: c.anomalies || '' }];
    setCustomers(loaded);
    setIsInModalOpen(true);
  };

  const handleOpenReplyModal = (c: SalesComplaint) => {
    setSelectedComplaint(c);
    const firstConsumer = c.customers?.[0]?.consumer_no || '';
    setSelectedConsumerNo(firstConsumer);
    setReplyText('');
    setReplyDate(new Date().toISOString().split('T')[0]);
    setIsOutModalOpen(true);
  };

  // --- Save handlers ---
  const handleSaveSalesComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reference || !complaintDate || !complaintType) return;
    if (customers.some(c => !c.consumer_no || !c.customer_details)) {
      alert('Each customer row must have a Consumer No. and Name & Address.');
      return;
    }

    try {
      const payload: any = { reference, complaint_date: complaintDate, complaint_type: complaintType, customers };
      if (editingComplaint) {
        const { error } = await dbClient.updateSalesComplaint(editingComplaint.id, payload);
        if (error) alert(error);
        else { setIsInModalOpen(false); setEditingComplaint(null); fetchSalesComplaints(); }
      } else {
        const { error } = await dbClient.createSalesComplaint(payload);
        if (error) alert(error);
        else { setIsInModalOpen(false); fetchSalesComplaints(); }
      }
    } catch (err: any) { alert(err.message || 'Operation failed.'); }
  };

  const handleSaveReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaint || !replyText || !selectedConsumerNo) return;
    try {
      const { error } = await dbClient.updateSalesComplaint(selectedComplaint.id, {
        reply_text: replyText,
        reply_date: replyDate,
        reply_consumer_no: selectedConsumerNo,
      } as any);
      if (error) alert(error);
      else {
        setReplyText('');
        const updated = await dbClient.getSalesComplaints();
        setSalesComplaints(updated);
        const fresh = updated.find(x => x.id === selectedComplaint.id);
        if (fresh) setSelectedComplaint(fresh);
      }
    } catch (err: any) { alert(err.message || 'Failed.'); }
  };

  const handleDeleteComplaint = async (id: string, createdBy: string) => {
    if (user?.role === 'employee' && createdBy !== user.id) {
      alert('You do not have permission to delete complaints created by other users.');
      return;
    }
    if (confirm('Are you sure you want to delete this entry?')) {
      try {
        const { error } = await dbClient.deleteSalesComplaint(id);
        if (error) alert(error); else fetchSalesComplaints();
      } catch (err: any) { alert(err.message || 'Failed.'); }
    }
  };

  // --- Filter ---
  const filteredComplaints = salesComplaints.filter(c => {
    const query = normalizeText(searchQuery);
    let matchesText = true;
    if (query) {
      const customerText = (c.customers || []).map(cu => `${cu.consumer_no} ${cu.customer_details} ${cu.anomalies || ''}`).join(' ');
      matchesText = (
        normalizeText(c.serial_id).includes(query) ||
        normalizeText(c.reference).includes(query) ||
        normalizeText(customerText).includes(query) ||
        normalizeText(COMPLAINT_TYPE_LABELS[c.complaint_type as ComplaintType] || '').includes(query) ||
        normalizeText(c.creator_name).includes(query) ||
        (c.replies || []).some(r => normalizeText(r.reply_text).includes(query) || normalizeText(r.replier_name).includes(query))
      );
    }
    let matchesDates = true;
    if ((fromDate || toDate) && c.complaint_date) {
      const t = new Date(c.complaint_date + 'T00:00:00').getTime();
      if (!isNaN(t)) {
        if (fromDate && t < new Date(fromDate + 'T00:00:00').getTime()) matchesDates = false;
        if (toDate && t > new Date(toDate + 'T23:59:59').getTime()) matchesDates = false;
      }
    }
    let matchesCategory = true;
    if (categoryFilter) {
      matchesCategory = c.complaint_type === categoryFilter;
    }
    return matchesText && matchesDates && matchesCategory;
  });

  const downloadCSV = () => {
    const rows: string[][] = [];
    rows.push(['Serial ID', 'Reference', 'Date', 'Complaint Type', 'Consumer No', 'Name & Address', 'Anomalies', 'Action Taken', 'Action Date']);
    for (const c of filteredComplaints) {
      const typeLabel = COMPLAINT_TYPE_LABELS[c.complaint_type as ComplaintType] || c.complaint_type;
      const custs = c.customers || [];
      if (custs.length === 0) {
        rows.push([c.serial_id, c.reference, c.complaint_date, typeLabel, '', '', '', '', '']);
      } else {
        custs.forEach(cu => {
          const replies = (c.replies || []).filter(r => r.consumer_no === cu.consumer_no || !r.consumer_no);
          if (replies.length === 0) {
            rows.push([c.serial_id, c.reference, c.complaint_date, typeLabel, cu.consumer_no, cu.customer_details, cu.anomalies || '', '', '']);
          } else {
            replies.forEach(r => {
              rows.push([c.serial_id, c.reference, c.complaint_date, typeLabel, cu.consumer_no, cu.customer_details, cu.anomalies || '', r.reply_text, r.reply_date]);
            });
          }
        });
      }
    }
    const escape = (v: string) => (v.includes(',') || v.includes('"') || v.includes('\n')) ? `"${v.replace(/"/g, '""')}"` : v;
    const csv = rows.map(r => r.map(v => escape(String(v || ''))).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const categorySlug = categoryFilter ? COMPLAINT_TYPE_LABELS[categoryFilter].toLowerCase().replace(/\s+/g, '_') : 'all';
    link.setAttribute('download', `sales_complaints_${categorySlug}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ color: '#0f172a', fontWeight: '800' }}>Sales Complaints Registry</h1>
          <p className="page-description" style={{ color: '#334155', fontWeight: '500' }}>
            Manage disconnection complaints — own request, free gas, and contract violations
          </p>
        </div>
        {user?.role !== 'lawyer' && (
          <button onClick={handleOpenAddModal} className="btn btn-primary">
            <Plus className="w-4 h-4" /> Add Sales Complaint
          </button>
        )}
      </div>

      {/* FILTER BAR */}
      <div className="glass-panel filter-bar" style={{ padding: '16px', marginBottom: '32px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center', background: '#ffffff', border: '1px solid #cbd5e1' }}>
        <div style={{ display: 'flex', flexGrow: 1, minWidth: '240px', position: 'relative' }}>
          <Search className="w-4 h-4" style={{ position: 'absolute', left: '14px', top: '15px', color: '#64748b' }} />
          <input
            type="text"
            className="form-input filter-input"
            placeholder="Search by serial ID, reference, consumer no, customer details..."
            style={{ paddingLeft: '42px', color: '#0f172a', border: '1px solid #cbd5e1', fontWeight: '500' }}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12.5px', color: '#1e293b', fontWeight: '600' }}>From:</span>
            <input
              type="date"
              className="form-input"
              style={{ width: '135px', padding: '6px 10px', fontSize: '13px', height: '38px', color: '#0f172a', border: '1px solid #cbd5e1', fontWeight: '500' }}
              value={fromDate}
              onChange={e => setFromDate(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12.5px', color: '#1e293b', fontWeight: '600' }}>To:</span>
            <input
              type="date"
              className="form-input"
              style={{ width: '135px', padding: '6px 10px', fontSize: '13px', height: '38px', color: '#0f172a', border: '1px solid #cbd5e1', fontWeight: '500' }}
              value={toDate}
              onChange={e => setToDate(e.target.value)}
            />
          </div>
          {(fromDate || toDate) && (
            <button
              type="button"
              onClick={() => { setFromDate(''); setToDate(''); }}
              style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', color: '#0284c7', fontSize: '12px', fontWeight: '700', cursor: 'pointer', padding: '6px 10px' }}
            >
              Clear
            </button>
          )}
        </div>
        {/* Category filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '12.5px', color: '#1e293b', fontWeight: '600', whiteSpace: 'nowrap' }}>Category:</span>
          <select
            className="form-select"
            style={{ height: '38px', fontSize: '13px', minWidth: '230px', padding: '0 10px', color: '#0f172a', border: '1px solid #cbd5e1', fontWeight: '500' }}
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value as ComplaintType | '')}
          >
            <option value="">All Types</option>
            <option value="own_request_disconnection">Own Request Disconnection</option>
            <option value="free_gas_disconnection">Free Gas Disconnection</option>
            <option value="violation_of_contract">Disconnection Due to Violation of Contract</option>
          </select>
          {categoryFilter && (
            <button
              type="button"
              onClick={() => setCategoryFilter('')}
              style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', color: '#0284c7', fontSize: '12px', fontWeight: '700', cursor: 'pointer', padding: '6px 8px' }}
            >
              ✕
            </button>
          )}
        </div>

        <button onClick={downloadCSV} className="btn btn-primary" style={{ height: '38px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      {/* TABLE */}
      <div className="glass-panel" style={{ padding: '0', overflow: 'hidden', border: '1px solid #cbd5e1', background: '#ffffff' }}>
        {loading ? (
          <div style={{ padding: '80px 0', textAlign: 'center' }}>
            <Loader2 className="w-10 h-10 animate-spin" style={{ color: '#0284c7', margin: '0 auto 16px auto' }} />
            <p style={{ color: '#334155', fontSize: '14px', fontWeight: '600' }}>Loading records...</p>
          </div>
        ) : filteredComplaints.length === 0 ? (
          <div style={{ padding: '80px 40px', textAlign: 'center', color: '#334155' }}>
            <ClipboardList className="w-12 h-12" style={{ color: '#64748b', margin: '0 auto 16px auto', opacity: 0.6 }} />
            <h3 style={{ color: '#0f172a', fontWeight: '700' }}>No Sales Complaints Found</h3>
            <p style={{ fontSize: '13px', marginTop: '4px', color: '#475569' }}>Add a new complaint or modify the search filters.</p>
          </div>
        ) : (
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '11%' }}>Serial</th>
                  <th style={{ width: '10%' }}>Ref &amp; Date</th>
                  <th style={{ width: '20%' }}>Complaint Type</th>
                  <th style={{ width: '30%' }}>Customers</th>
                  <th style={{ width: '18%' }}>Actions Taken</th>
                  <th style={{ width: '6%' }}>Status</th>
                  <th style={{ width: '5%' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredComplaints.map(c => {
                  const canEdit = user?.role === 'executive' || user?.role === 'employee';
                  const typeColors = COMPLAINT_TYPE_COLORS[c.complaint_type as ComplaintType] || COMPLAINT_TYPE_COLORS.violation_of_contract;
                  const typeLabel = COMPLAINT_TYPE_LABELS[c.complaint_type as ComplaintType] || c.complaint_type;
                  const custs = c.customers || [];

                  return (
                    <tr key={c.id} style={{ verticalAlign: 'top' }}>
                      {/* Serial */}
                      <td>
                        <strong style={{ color: '#0369a1', fontFamily: 'monospace', fontSize: '13.5px', fontWeight: '800', display: 'block' }}>{c.serial_id}</strong>
                        <span style={{ fontSize: '11px', display: 'block', color: '#475569', marginTop: '3px', fontWeight: '500' }}>
                          By: <strong style={{ color: '#1e293b' }}>{c.creator_name}</strong>
                        </span>
                      </td>

                      {/* Ref & Date */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '3px' }}>
                          <FileText className="w-3.5 h-3.5" style={{ color: '#64748b', flexShrink: 0 }} />
                          <span style={{ fontFamily: 'monospace', fontSize: '12px', color: '#0f172a', fontWeight: '700' }}>{c.reference || '—'}</span>
                        </div>
                        <span style={{ fontSize: '11px', color: '#475569', fontWeight: '500' }}>{c.complaint_date || '—'}</span>
                      </td>

                      {/* Complaint Type */}
                      <td>
                        <span style={{ display: 'inline-block', fontSize: '11.5px', fontWeight: '700', padding: '4px 10px', borderRadius: '6px', background: typeColors.bg, color: typeColors.color, border: `1px solid ${typeColors.border}`, lineHeight: '1.45' }}>
                          {typeLabel}
                        </span>
                      </td>

                      {/* Customers list */}
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {custs.map((cu, idx) => (
                            <div key={idx} style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '10px 12px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                                <span style={{ fontFamily: 'monospace', fontSize: '12.5px', fontWeight: '800', color: '#0369a1' }}>{cu.consumer_no}</span>
                              </div>
                              <div style={{ fontSize: '12px', color: '#0f172a', lineHeight: '1.45', whiteSpace: 'pre-line', fontWeight: '500' }}>{cu.customer_details}</div>
                              {cu.anomalies && (
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '5px', marginTop: '6px', background: '#fef3c7', border: '1px solid #fde68a', borderRadius: '4px', padding: '3px 7px' }}>
                                  <AlertTriangle className="w-3.5 h-3.5" style={{ color: '#92400e', marginTop: '1px', flexShrink: 0 }} />
                                  <span style={{ fontSize: '11px', color: '#92400e', fontWeight: '700' }}>{cu.anomalies}</span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </td>

                      {/* Actions Taken (replies grouped by customer) */}
                      <td>
                        {c.replies && c.replies.length > 0 ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {c.replies.map((reply, idx) => (
                              <div key={idx} style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '6px', padding: '8px 10px' }}>
                                {reply.consumer_no && (
                                  <span style={{ fontFamily: 'monospace', fontSize: '11px', fontWeight: '800', color: '#0369a1', display: 'block', marginBottom: '3px' }}>
                                    #{reply.consumer_no}
                                  </span>
                                )}
                                <span style={{ fontSize: '12px', color: '#0f172a', lineHeight: '1.45', display: 'block', fontWeight: '500' }}>{reply.reply_text}</span>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#475569', marginTop: '5px', fontWeight: '500' }}>
                                  <span style={{ fontWeight: '600', color: '#334155' }}>{reply.replier_name}</span>
                                  <span>{reply.reply_date}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <em style={{ color: '#64748b', fontSize: '12px', fontWeight: '500' }}>No action taken</em>
                        )}
                      </td>

                      {/* Status */}
                      <td>
                        <span style={{
                          display: 'inline-block',
                          fontSize: '11px',
                          fontWeight: '800',
                          textTransform: 'uppercase',
                          padding: '4px 9px',
                          borderRadius: '4px',
                          letterSpacing: '0.04em',
                          ...(c.status === 'resolved'
                            ? { background: '#d1fae5', color: '#065f46', border: '1px solid #6ee7b7' }
                            : { background: '#ffedd5', color: '#9a3412', border: '1px solid #fdba74' })
                        }}>
                          {c.status === 'resolved' ? 'Resolved' : 'Pending'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          <button
                            onClick={() => handleOpenReplyModal(c)}
                            className="btn btn-secondary"
                            style={{ padding: '5px 10px', fontSize: '12px', height: '30px', display: 'flex', alignItems: 'center', gap: '4px', border: '1px solid #cbd5e1', color: '#0f172a', fontWeight: '600' }}
                          >
                            {user?.role === 'lawyer' ? <Eye className="w-3.5 h-3.5 text-blue-600" /> : <MessageSquare className="w-3.5 h-3.5 text-blue-600" />}
                            {user?.role === 'lawyer' ? 'View' : 'Reply'}
                          </button>
                          {canEdit && (
                            <>
                              <button
                                onClick={() => handleOpenEditModal(c)}
                                className="btn btn-secondary"
                                title="Edit complaint"
                                style={{ padding: '5px', height: '30px', width: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #cbd5e1', color: '#0f172a' }}
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteComplaint(c.id, c.created_by)}
                                className="btn btn-danger"
                                title="Delete entry"
                                style={{ padding: '5px', height: '30px', width: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fee2e2', border: '1px solid #fca5a5', color: '#b91c1c' }}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ===================== IN PORTION MODAL ===================== */}
      {isInModalOpen && (
        <div className="modal-overlay animate-fade-in">
          <div className="glass-panel modal-content" style={{ background: '#ffffff', border: '1px solid #cbd5e1' }}>
            <button className="modal-close" onClick={() => setIsInModalOpen(false)} style={{ color: '#334155' }}><X className="w-5 h-5" /></button>
            <div className="modal-header">
              <h2 style={{ color: '#0f172a', fontWeight: '800' }}>{editingComplaint ? 'Edit Sales Complaint' : 'Register Sales Complaint (In Portion)'}</h2>
              <p style={{ color: '#334155', fontSize: '13px', marginTop: '4px', fontWeight: '500' }}>
                Fill in the memorandum reference, type, and customer details.
              </p>
            </div>

            <form onSubmit={handleSaveSalesComplaint}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>

                {/* Reference + Date */}
                <div className="modal-grid-2">
                  <div className="form-group">
                    <label className="form-label" style={{ color: '#0f172a', fontWeight: '700' }}>Reference (REF)</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. FS/DOM-DIS"
                      style={{ color: '#0f172a', border: '1px solid #cbd5e1', fontWeight: '500' }}
                      value={reference}
                      onChange={e => setReference(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ color: '#0f172a', fontWeight: '700' }}>Dated</label>
                    <input
                      type="date"
                      className="form-input"
                      style={{ color: '#0f172a', border: '1px solid #cbd5e1', fontWeight: '500' }}
                      value={complaintDate}
                      onChange={e => setComplaintDate(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Complaint Type */}
                <div className="form-group">
                  <label className="form-label" style={{ color: '#0f172a', fontWeight: '700' }}>Sales Complaint Type</label>
                  <select
                    className="form-select"
                    style={{ color: '#0f172a', border: '1px solid #cbd5e1', fontWeight: '500' }}
                    value={complaintType}
                    onChange={e => setComplaintType(e.target.value as ComplaintType)}
                    required
                  >
                    <option value="own_request_disconnection">Own Request Disconnection</option>
                    <option value="free_gas_disconnection">Free Gas Disconnection</option>
                    <option value="violation_of_contract">Disconnection Due to Violation of Contract</option>
                  </select>
                </div>

                {/* Customers */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <Users className="w-4 h-4" style={{ color: '#0284c7' }} />
                      <span style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>Customer Details</span>
                      <span style={{ fontSize: '11px', background: '#e0f2fe', color: '#0369a1', fontWeight: '700', padding: '2px 8px', borderRadius: '10px', border: '1px solid #bae6fd' }}>
                        {customers.length} {customers.length === 1 ? 'customer' : 'customers'}
                      </span>
                    </div>
                    <button type="button" onClick={addCustomerRow} className="btn btn-secondary" style={{ height: '32px', padding: '0 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px', border: '1px solid #cbd5e1', color: '#0f172a', fontWeight: '600' }}>
                      <UserPlus className="w-3.5 h-3.5 text-blue-600" /> Add Customer
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {customers.map((cu, idx) => (
                      <div key={idx} style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '16px', position: 'relative' }}>
                        <div style={{ fontSize: '12px', fontWeight: '800', color: '#0369a1', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '12px' }}>
                          Customer #{idx + 1}
                        </div>

                        {/* Consumer No */}
                        <div className="form-group" style={{ marginBottom: '12px' }}>
                          <label className="form-label" style={{ fontSize: '12px', color: '#1e293b', fontWeight: '700' }}>Consumer No. (Account ID)</label>
                          <input
                            type="text"
                            className="form-input"
                            placeholder="e.g. 5018951232"
                            style={{ color: '#0f172a', border: '1px solid #cbd5e1', fontWeight: '500' }}
                            value={cu.consumer_no}
                            onChange={e => updateCustomer(idx, 'consumer_no', e.target.value)}
                            required
                          />
                        </div>

                        {/* Name & Address */}
                        <div className="form-group" style={{ marginBottom: '12px' }}>
                          <label className="form-label" style={{ fontSize: '12px', color: '#1e293b', fontWeight: '700' }}>Name &amp; Address</label>
                          <textarea
                            className="form-textarea"
                            placeholder={"e.g. Ghulam Mustafa\nChak No. 277/JB, Gojra"}
                            style={{ color: '#0f172a', border: '1px solid #cbd5e1', fontWeight: '500' }}
                            rows={2}
                            value={cu.customer_details}
                            onChange={e => updateCustomer(idx, 'customer_details', e.target.value)}
                            required
                          />
                        </div>

                        {/* Anomalies */}
                        <div className="form-group" style={{ marginBottom: '0' }}>
                          <label className="form-label" style={{ fontSize: '12px', color: '#1e293b', fontWeight: '700' }}>Anomalies / Remarks</label>
                          <input
                            type="text"
                            className="form-input"
                            placeholder="e.g. Wrong Installation, DIS, Stay Case..."
                            style={{ color: '#0f172a', border: '1px solid #cbd5e1', fontWeight: '500' }}
                            value={cu.anomalies || ''}
                            onChange={e => updateCustomer(idx, 'anomalies', e.target.value)}
                          />
                        </div>

                        {customers.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeCustomerRow(idx)}
                            title="Remove this customer"
                            style={{ position: 'absolute', top: '12px', right: '12px', background: '#fee2e2', border: '1px solid #fca5a5', color: '#b91c1c', borderRadius: '5px', padding: '4px 7px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsInModalOpen(false)} style={{ border: '1px solid #cbd5e1', color: '#0f172a' }}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editingComplaint ? 'Save Changes' : 'Create Entry'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== OUT PORTION MODAL ===================== */}
      {isOutModalOpen && selectedComplaint && (
        <div className="modal-overlay animate-fade-in">
          <div className="glass-panel modal-content" style={{ background: '#ffffff', border: '1px solid #cbd5e1' }}>
            <button className="modal-close" onClick={() => setIsOutModalOpen(false)} style={{ color: '#334155' }}><X className="w-5 h-5" /></button>
            <div className="modal-header">
              <h2 style={{ color: '#0f172a', fontWeight: '800' }}>Action Taken (Out Portion)</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                <span style={{ color: '#0369a1', fontFamily: 'monospace', fontWeight: '800', fontSize: '13.5px' }}>{selectedComplaint.serial_id}</span>
                <span style={{ color: '#94a3b8', fontSize: '12px' }}>•</span>
                <span style={{ fontSize: '12.5px', color: '#334155', fontWeight: '600' }}>Ref: {selectedComplaint.reference} • {selectedComplaint.complaint_date}</span>
              </div>
            </div>

            <form onSubmit={handleSaveReply}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>

                {/* Complaint Type badge */}
                <div>
                  {(() => {
                    const ct = selectedComplaint.complaint_type as ComplaintType;
                    const tc = COMPLAINT_TYPE_COLORS[ct] || COMPLAINT_TYPE_COLORS.violation_of_contract;
                    return (
                      <span style={{ display: 'inline-block', fontSize: '11.5px', fontWeight: '700', padding: '4px 10px', borderRadius: '6px', background: tc.bg, color: tc.color, border: `1px solid ${tc.border}` }}>
                        {COMPLAINT_TYPE_LABELS[ct] || ct}
                      </span>
                    );
                  })()}
                </div>

                {/* Customers list (read-only) */}
                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                  <div style={{ fontSize: '12px', fontWeight: '800', color: '#0369a1', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.04em' }}>
                    Customers ({(selectedComplaint.customers || []).length})
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {(selectedComplaint.customers || []).map((cu, idx) => {
                      const custReplies = (selectedComplaint.replies || []).filter(r => r.consumer_no === cu.consumer_no);
                      return (
                        <div key={idx} style={{ background: '#ffffff', borderRadius: '6px', padding: '12px 14px', border: '1px solid #cbd5e1', borderLeft: `4px solid ${custReplies.length > 0 ? '#059669' : '#cbd5e1'}` }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                              <span style={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: '800', color: '#0369a1' }}>{cu.consumer_no}</span>
                              <div style={{ fontSize: '12.5px', color: '#0f172a', marginTop: '3px', lineHeight: '1.45', whiteSpace: 'pre-line', fontWeight: '500' }}>{cu.customer_details}</div>
                              {cu.anomalies && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '6px', background: '#fef3c7', border: '1px solid #fde68a', borderRadius: '4px', padding: '3px 7px' }}>
                                  <AlertTriangle className="w-3.5 h-3.5" style={{ color: '#92400e' }} />
                                  <span style={{ fontSize: '11px', color: '#92400e', fontWeight: '700' }}>{cu.anomalies}</span>
                                </div>
                              )}
                            </div>
                            <span style={{
                              fontSize: '11px',
                              fontWeight: '800',
                              padding: '3px 8px',
                              borderRadius: '4px',
                              flexShrink: 0,
                              marginLeft: '8px',
                              ...(custReplies.length > 0
                                ? { background: '#d1fae5', color: '#065f46', border: '1px solid #6ee7b7' }
                                : { background: '#ffedd5', color: '#9a3412', border: '1px solid #fdba74' })
                            }}>
                              {custReplies.length > 0 ? `${custReplies.length} action(s)` : 'No action'}
                            </span>
                          </div>
                          {custReplies.length > 0 && (
                            <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              {custReplies.map((r, ri) => (
                                <div key={ri} style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '5px', padding: '8px 10px' }}>
                                  <span style={{ fontSize: '12.5px', color: '#0f172a', fontStyle: 'italic', fontWeight: '500' }}>"{r.reply_text}"</span>
                                  <div style={{ fontSize: '11px', color: '#475569', marginTop: '4px', fontWeight: '500' }}>
                                    By <strong style={{ color: '#1e293b' }}>{r.replier_name}</strong> • {r.reply_date}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Add New Action */}
                {user?.role !== 'lawyer' && (
                  <div style={{ borderTop: '1px solid #cbd5e1', paddingTop: '16px' }}>
                    <div style={{ fontSize: '12px', fontWeight: '800', color: '#0f172a', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.04em' }}>
                      Add Action Taken
                    </div>

                    {/* Select Customer */}
                    <div className="form-group">
                      <label className="form-label" style={{ color: '#0f172a', fontWeight: '700' }}>Select Customer (Consumer No.)</label>
                      <select
                        className="form-select"
                        style={{ color: '#0f172a', border: '1px solid #cbd5e1', fontWeight: '500' }}
                        value={selectedConsumerNo}
                        onChange={e => setSelectedConsumerNo(e.target.value)}
                        required
                      >
                        <option value="">— Select a customer —</option>
                        {(selectedComplaint.customers || []).map((cu, idx) => (
                          <option key={idx} value={cu.consumer_no}>
                            {cu.consumer_no} — {cu.customer_details.split('\n')[0]}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Action Taken text */}
                    <div className="form-group">
                      <label className="form-label" style={{ color: '#0f172a', fontWeight: '700' }}>Action Taken</label>
                      <textarea
                        className="form-textarea"
                        placeholder="Describe the action taken for this customer (e.g. Disconnected, Stay Case issued, Reconnection applied...)"
                        style={{ color: '#0f172a', border: '1px solid #cbd5e1', fontWeight: '500' }}
                        rows={3}
                        value={replyText}
                        onChange={e => setReplyText(e.target.value)}
                        required
                      />
                    </div>

                    {/* Date */}
                    <div className="form-group">
                      <label className="form-label" style={{ color: '#0f172a', fontWeight: '700' }}>Date of Action</label>
                      <input
                        type="date"
                        className="form-input"
                        style={{ color: '#0f172a', border: '1px solid #cbd5e1', fontWeight: '500' }}
                        value={replyDate}
                        onChange={e => setReplyDate(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsOutModalOpen(false)} style={{ border: '1px solid #cbd5e1', color: '#0f172a' }}>
                  {user?.role === 'lawyer' ? 'Close' : 'Cancel'}
                </button>
                {user?.role !== 'lawyer' && <button type="submit" className="btn btn-primary">Save Action</button>}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

