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
  own_request_disconnection: { bg: 'rgba(59,130,246,0.1)', color: '#60a5fa', border: 'rgba(59,130,246,0.2)' },
  free_gas_disconnection: { bg: 'rgba(16,185,129,0.1)', color: '#34d399', border: 'rgba(16,185,129,0.2)' },
  violation_of_contract: { bg: 'rgba(239,68,68,0.1)', color: '#f87171', border: 'rgba(239,68,68,0.2)' },
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
          <h1 className="page-title">Sales Complaints Registry</h1>
          <p className="page-description">Manage disconnection complaints — own request, free gas, and contract violations</p>
        </div>
        {user?.role !== 'lawyer' && (
          <button onClick={handleOpenAddModal} className="btn btn-primary">
            <Plus className="w-4 h-4" /> Add Sales Complaint
          </button>
        )}
      </div>

      {/* FILTER BAR */}
      <div className="glass-panel filter-bar" style={{ padding: '16px', marginBottom: '32px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', flexGrow: 1, minWidth: '240px', position: 'relative' }}>
          <Search className="w-4 h-4" style={{ position: 'absolute', left: '14px', top: '15px', color: 'var(--text-muted)' }} />
          <input type="text" className="form-input filter-input" placeholder="Search by serial ID, reference, consumer no, customer details..." style={{ paddingLeft: '42px' }} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>From:</span>
            <input type="date" className="form-input" style={{ width: '135px', padding: '6px 10px', fontSize: '13px', height: '38px' }} value={fromDate} onChange={e => setFromDate(e.target.value)} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>To:</span>
            <input type="date" className="form-input" style={{ width: '135px', padding: '6px 10px', fontSize: '13px', height: '38px' }} value={toDate} onChange={e => setToDate(e.target.value)} />
          </div>
          {(fromDate || toDate) && (
            <button type="button" onClick={() => { setFromDate(''); setToDate(''); }} style={{ background: 'none', border: 'none', color: 'var(--accent-blue)', fontSize: '12px', cursor: 'pointer', padding: '4px 8px' }}>Clear</button>
          )}
        </div>
        {/* Category filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Category:</span>
          <select
            className="form-select"
            style={{ height: '38px', fontSize: '13px', minWidth: '230px', padding: '0 10px' }}
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
              style={{ background: 'none', border: 'none', color: 'var(--accent-blue)', fontSize: '12px', cursor: 'pointer', padding: '4px 6px' }}
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
      <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '80px 0', textAlign: 'center' }}>
            <Loader2 className="w-10 h-10 animate-spin" style={{ color: 'var(--accent-blue)', margin: '0 auto 16px auto' }} />
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Loading records...</p>
          </div>
        ) : filteredComplaints.length === 0 ? (
          <div style={{ padding: '80px 40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <ClipboardList className="w-12 h-12" style={{ color: 'var(--text-muted)', margin: '0 auto 16px auto', opacity: 0.5 }} />
            <h3>No Sales Complaints Found</h3>
            <p style={{ fontSize: '13px', marginTop: '4px' }}>Add a new complaint or modify the search filters.</p>
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
                        <strong style={{ color: 'var(--accent-blue)', fontFamily: 'monospace', fontSize: '13px', display: 'block' }}>{c.serial_id}</strong>
                        <span style={{ fontSize: '11px', display: 'block', color: 'var(--text-muted)', marginTop: '3px' }}>By: {c.creator_name}</span>
                      </td>

                      {/* Ref & Date */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '3px' }}>
                          <FileText className="w-3 h-3" style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                          <span style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--text-primary)', fontWeight: '600' }}>{c.reference || '—'}</span>
                        </div>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{c.complaint_date || '—'}</span>
                      </td>

                      {/* Complaint Type */}
                      <td>
                        <span style={{ display: 'inline-block', fontSize: '11px', fontWeight: '600', padding: '3px 8px', borderRadius: '5px', background: typeColors.bg, color: typeColors.color, border: `1px solid ${typeColors.border}`, lineHeight: '1.5' }}>
                          {typeLabel}
                        </span>
                      </td>

                      {/* Customers list */}
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {custs.map((cu, idx) => (
                            <div key={idx} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '8px 10px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                                <span style={{ fontFamily: 'monospace', fontSize: '12px', fontWeight: '700', color: 'var(--accent-blue)' }}>{cu.consumer_no}</span>
                              </div>
                              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.4', whiteSpace: 'pre-line' }}>{cu.customer_details}</div>
                              {cu.anomalies && (
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '4px', marginTop: '4px' }}>
                                  <AlertTriangle className="w-3 h-3" style={{ color: '#f59e0b', marginTop: '2px', flexShrink: 0 }} />
                                  <span style={{ fontSize: '11px', color: '#f59e0b' }}>{cu.anomalies}</span>
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
                              <div key={idx} style={{ background: 'rgba(2,132,199,0.05)', border: '1px solid rgba(2,132,199,0.12)', borderRadius: '5px', padding: '7px 9px' }}>
                                {reply.consumer_no && (
                                  <span style={{ fontFamily: 'monospace', fontSize: '10px', fontWeight: '700', color: 'var(--accent-blue)', display: 'block', marginBottom: '3px' }}>
                                    #{reply.consumer_no}
                                  </span>
                                )}
                                <span style={{ fontSize: '12px', color: 'var(--text-primary)', lineHeight: '1.4', display: 'block' }}>{reply.reply_text}</span>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
                                  <span>{reply.replier_name}</span>
                                  <span>{reply.reply_date}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <em style={{ color: 'var(--text-muted)', fontSize: '12px' }}>No action taken</em>
                        )}
                      </td>

                      {/* Status */}
                      <td>
                        <span style={{ display: 'inline-block', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', padding: '3px 8px', borderRadius: '4px', ...(c.status === 'resolved' ? { background: 'rgba(16,185,129,0.12)', color: '#34d399', border: '1px solid rgba(16,185,129,0.25)' } : { background: 'rgba(249,115,22,0.12)', color: '#fb923c', border: '1px solid rgba(249,115,22,0.25)' }) }}>
                          {c.status === 'resolved' ? 'Resolved' : 'Pending'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td>
                        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                          <button onClick={() => handleOpenReplyModal(c)} className="btn btn-secondary" style={{ padding: '5px 9px', fontSize: '12px', height: '30px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            {user?.role === 'lawyer' ? <Eye className="w-3.5 h-3.5" /> : <MessageSquare className="w-3.5 h-3.5" />}
                            {user?.role === 'lawyer' ? 'View' : 'Reply'}
                          </button>
                          {canEdit && (
                            <>
                              <button onClick={() => handleOpenEditModal(c)} className="btn btn-secondary" style={{ padding: '5px', height: '30px', width: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => handleDeleteComplaint(c.id, c.created_by)} className="btn btn-danger" style={{ padding: '5px', height: '30px', width: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
          <div className="glass-panel modal-content" style={{ maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto' }}>
            <button className="modal-close" onClick={() => setIsInModalOpen(false)}><X className="w-5 h-5" /></button>
            <div className="modal-header">
              <h2>{editingComplaint ? 'Edit Sales Complaint' : 'Register Sales Complaint (In Portion)'}</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px' }}>
                Fill in the memorandum reference, type, and customer details.
              </p>
            </div>

            <form onSubmit={handleSaveSalesComplaint}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>

                {/* Reference + Date */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Reference (REF)</label>
                    <input type="text" className="form-input" placeholder="e.g. FS/DOM-DIS" value={reference} onChange={e => setReference(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Dated</label>
                    <input type="date" className="form-input" value={complaintDate} onChange={e => setComplaintDate(e.target.value)} required />
                  </div>
                </div>

                {/* Complaint Type */}
                <div className="form-group">
                  <label className="form-label">Sales Complaint Type</label>
                  <select className="form-select" value={complaintType} onChange={e => setComplaintType(e.target.value as ComplaintType)} required>
                    <option value="own_request_disconnection">Own Request Disconnection</option>
                    <option value="free_gas_disconnection">Free Gas Disconnection</option>
                    <option value="violation_of_contract">Disconnection Due to Violation of Contract</option>
                  </select>
                </div>

                {/* Customers */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Users className="w-4 h-4" style={{ color: 'var(--accent-blue)' }} />
                      <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>Customer Details</span>
                      <span style={{ fontSize: '11px', background: 'rgba(2,132,199,0.1)', color: 'var(--accent-blue)', padding: '1px 8px', borderRadius: '10px', border: '1px solid rgba(2,132,199,0.2)' }}>
                        {customers.length} {customers.length === 1 ? 'customer' : 'customers'}
                      </span>
                    </div>
                    <button type="button" onClick={addCustomerRow} className="btn btn-secondary" style={{ height: '30px', padding: '0 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <UserPlus className="w-3.5 h-3.5" /> Add Customer
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {customers.map((cu, idx) => (
                      <div key={idx} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '14px', position: 'relative' }}>
                        <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--accent-blue)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '10px' }}>
                          Customer #{idx + 1}
                        </div>

                        {/* Consumer No */}
                        <div className="form-group" style={{ marginBottom: '10px' }}>
                          <label className="form-label" style={{ fontSize: '12px' }}>Consumer No. (Account ID)</label>
                          <input
                            type="text"
                            className="form-input"
                            placeholder="e.g. 5018951232"
                            value={cu.consumer_no}
                            onChange={e => updateCustomer(idx, 'consumer_no', e.target.value)}
                            required
                          />
                        </div>

                        {/* Name & Address */}
                        <div className="form-group" style={{ marginBottom: '10px' }}>
                          <label className="form-label" style={{ fontSize: '12px' }}>Name &amp; Address</label>
                          <textarea
                            className="form-textarea"
                            placeholder={"e.g. Ghulam Mustafa\nChak No. 277/JB, Gojra"}
                            rows={2}
                            value={cu.customer_details}
                            onChange={e => updateCustomer(idx, 'customer_details', e.target.value)}
                            required
                          />
                        </div>

                        {/* Anomalies */}
                        <div className="form-group" style={{ marginBottom: '0' }}>
                          <label className="form-label" style={{ fontSize: '12px' }}>Anomalies / Remarks</label>
                          <input
                            type="text"
                            className="form-input"
                            placeholder="e.g. Wrong Installation, DIS, Stay Case..."
                            value={cu.anomalies || ''}
                            onChange={e => updateCustomer(idx, 'anomalies', e.target.value)}
                          />
                        </div>

                        {customers.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeCustomerRow(idx)}
                            title="Remove this customer"
                            style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', borderRadius: '5px', padding: '3px 6px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
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
                <button type="button" className="btn btn-secondary" onClick={() => setIsInModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editingComplaint ? 'Save Changes' : 'Create Entry'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== OUT PORTION MODAL ===================== */}
      {isOutModalOpen && selectedComplaint && (
        <div className="modal-overlay animate-fade-in">
          <div className="glass-panel modal-content" style={{ maxWidth: '680px', maxHeight: '90vh', overflowY: 'auto' }}>
            <button className="modal-close" onClick={() => setIsOutModalOpen(false)}><X className="w-5 h-5" /></button>
            <div className="modal-header">
              <h2>Action Taken (Out Portion)</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                <span style={{ color: 'var(--accent-blue)', fontFamily: 'monospace', fontWeight: 'bold' }}>{selectedComplaint.serial_id}</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>•</span>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Ref: {selectedComplaint.reference} • {selectedComplaint.complaint_date}</span>
              </div>
            </div>

            <form onSubmit={handleSaveReply}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>

                {/* Complaint Type badge */}
                <div>
                  {(() => {
                    const ct = selectedComplaint.complaint_type as ComplaintType;
                    const tc = COMPLAINT_TYPE_COLORS[ct] || COMPLAINT_TYPE_COLORS.violation_of_contract;
                    return <span style={{ display: 'inline-block', fontSize: '11px', fontWeight: '600', padding: '3px 10px', borderRadius: '5px', background: tc.bg, color: tc.color, border: `1px solid ${tc.border}` }}>{COMPLAINT_TYPE_LABELS[ct] || ct}</span>;
                  })()}
                </div>

                {/* Customers list (read-only) */}
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--accent-blue)', textTransform: 'uppercase', marginBottom: '10px', letterSpacing: '0.04em' }}>
                    Customers ({(selectedComplaint.customers || []).length})
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {(selectedComplaint.customers || []).map((cu, idx) => {
                      const custReplies = (selectedComplaint.replies || []).filter(r => r.consumer_no === cu.consumer_no);
                      return (
                        <div key={idx} style={{ background: 'rgba(0,0,0,0.1)', borderRadius: '6px', padding: '10px 12px', borderLeft: `3px solid ${custReplies.length > 0 ? '#34d399' : 'var(--border-color)'}` }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                              <span style={{ fontFamily: 'monospace', fontSize: '12px', fontWeight: '700', color: 'var(--accent-blue)' }}>{cu.consumer_no}</span>
                              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px', lineHeight: '1.4', whiteSpace: 'pre-line' }}>{cu.customer_details}</div>
                              {cu.anomalies && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                                  <AlertTriangle className="w-3 h-3" style={{ color: '#f59e0b' }} />
                                  <span style={{ fontSize: '11px', color: '#f59e0b' }}>{cu.anomalies}</span>
                                </div>
                              )}
                            </div>
                            <span style={{ fontSize: '10px', fontWeight: '700', padding: '2px 6px', borderRadius: '4px', flexShrink: 0, marginLeft: '8px', ...(custReplies.length > 0 ? { background: 'rgba(16,185,129,0.1)', color: '#34d399', border: '1px solid rgba(16,185,129,0.2)' } : { background: 'rgba(249,115,22,0.1)', color: '#fb923c', border: '1px solid rgba(249,115,22,0.2)' }) }}>
                              {custReplies.length > 0 ? `${custReplies.length} action(s)` : 'No action'}
                            </span>
                          </div>
                          {custReplies.length > 0 && (
                            <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                              {custReplies.map((r, ri) => (
                                <div key={ri} style={{ background: 'rgba(2,132,199,0.05)', borderRadius: '4px', padding: '6px 8px' }}>
                                  <span style={{ fontSize: '12px', color: 'var(--text-primary)', fontStyle: 'italic' }}>"{r.reply_text}"</span>
                                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '3px' }}>By {r.replier_name} • {r.reply_date}</div>
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
                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                    <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--accent-teal)', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.04em' }}>
                      Add Action Taken
                    </div>

                    {/* Select Customer */}
                    <div className="form-group">
                      <label className="form-label">Select Customer (Consumer No.)</label>
                      <select
                        className="form-select"
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
                      <label className="form-label">Action Taken</label>
                      <textarea
                        className="form-textarea"
                        placeholder="Describe the action taken for this customer (e.g. Disconnected, Stay Case issued, Reconnection applied...)"
                        rows={3}
                        value={replyText}
                        onChange={e => setReplyText(e.target.value)}
                        required
                      />
                    </div>

                    {/* Date */}
                    <div className="form-group">
                      <label className="form-label">Date of Action</label>
                      <input type="date" className="form-input" value={replyDate} onChange={e => setReplyDate(e.target.value)} required />
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsOutModalOpen(false)}>
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
