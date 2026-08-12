'use client';

import { useEffect, useState } from 'react';
import { useUser } from '../layout';
import { dbClient, SalesComplaint } from '@/lib/db';
import {
  Plus,
  Search,
  Trash2,
  X,
  Eye,
  Loader2,
  Check,
  MessageSquare,
  ClipboardList,
  Edit3,
  Download
} from 'lucide-react';

const normalizeText = (str: string | undefined | null) => {
  if (!str) return '';
  return str
    .toLowerCase()
    .replace(/[\u2013\u2014-]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
};

export default function SalesComplaintsPage() {
  const { user } = useUser();
  const [salesComplaints, setSalesComplaints] = useState<SalesComplaint[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Modal State
  const [isInModalOpen, setIsInModalOpen] = useState(false);
  const [isOutModalOpen, setIsOutModalOpen] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<SalesComplaint | null>(null);
  const [editingComplaint, setEditingComplaint] = useState<SalesComplaint | null>(null);

  // IN Portion State
  const [attendedData, setAttendedData] = useState('');
  const [consumerNo, setConsumerNo] = useState('');
  const [meterNo, setMeterNo] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');

  // OUT Portion State
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

  useEffect(() => {
    fetchSalesComplaints();
  }, []);

  const handleOpenAddModal = () => {
    setEditingComplaint(null);
    setAttendedData(new Date().toISOString().split('T')[0]);
    setConsumerNo('');
    setMeterNo('');
    setCustomerName('');
    setCustomerAddress('');
    setIsInModalOpen(true);
  };

  const handleOpenEditModal = (complaint: SalesComplaint) => {
    setEditingComplaint(complaint);
    setAttendedData(complaint.attended_data);
    setConsumerNo(complaint.consumer_no);
    setMeterNo(complaint.meter_no);
    setCustomerName(complaint.customer_name);
    setCustomerAddress(complaint.customer_address);
    setIsInModalOpen(true);
  };

  const handleOpenReplyModal = (complaint: SalesComplaint) => {
    setSelectedComplaint(complaint);
    setReplyText('');
    setReplyDate(new Date().toISOString().split('T')[0]);
    setIsOutModalOpen(true);
  };

  const handleSaveSalesComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!attendedData || !consumerNo || !meterNo || !customerName || !customerAddress) return;

    try {
      if (editingComplaint) {
        const { error } = await dbClient.updateSalesComplaint(editingComplaint.id, {
          attended_data: attendedData,
          consumer_no: consumerNo,
          meter_no: meterNo,
          customer_name: customerName,
          customer_address: customerAddress,
        });

        if (error) {
          alert(error);
        } else {
          setIsInModalOpen(false);
          setEditingComplaint(null);
          fetchSalesComplaints();
        }
      } else {
        const { error } = await dbClient.createSalesComplaint({
          attended_data: attendedData,
          consumer_no: consumerNo,
          meter_no: meterNo,
          customer_name: customerName,
          customer_address: customerAddress,
        });

        if (error) {
          alert(error);
        } else {
          setIsInModalOpen(false);
          fetchSalesComplaints();
        }
      }
    } catch (err: any) {
      alert(err.message || 'Operation failed.');
    }
  };

  const handleSaveReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaint) return;

    try {
      const { error } = await dbClient.updateSalesComplaint(selectedComplaint.id, {
        reply_text: replyText,
        reply_date: replyDate,
      });

      if (error) {
        alert(error);
      } else {
        setReplyText('');
        const updatedComplaints = await dbClient.getSalesComplaints();
        setSalesComplaints(updatedComplaints);
        const freshSelected = updatedComplaints.find(x => x.id === selectedComplaint.id);
        if (freshSelected) {
          setSelectedComplaint(freshSelected);
        }
      }
    } catch (err: any) {
      alert(err.message || 'Operation failed.');
    }
  };

  const handleDeleteComplaint = async (id: string, createdBy: string) => {
    if (user?.role === 'employee' && createdBy !== user.id) {
      alert("You do not have permission to delete sales complaints created by other users.");
      return;
    }

    if (confirm("Are you sure you want to delete this sales complaint entry?")) {
      try {
        const { error } = await dbClient.deleteSalesComplaint(id);
        if (error) {
          alert(error);
        } else {
          fetchSalesComplaints();
        }
      } catch (err: any) {
        alert(err.message || 'Failed to delete complaint.');
      }
    }
  };

  // Search and date filters
  const filteredComplaints = salesComplaints.filter(c => {
    // 1. Text Query Filter
    const query = normalizeText(searchQuery);
    let matchesText = true;
    if (query) {
      matchesText = (
        normalizeText(c.serial_id).includes(query) ||
        normalizeText(c.consumer_no).includes(query) ||
        normalizeText(c.meter_no).includes(query) ||
        normalizeText(c.customer_name).includes(query) ||
        normalizeText(c.customer_address).includes(query) ||
        normalizeText(c.attended_data).includes(query) ||
        normalizeText(c.creator_name).includes(query) ||
        (c.replies && c.replies.some(r =>
          normalizeText(r.reply_text).includes(query) ||
          normalizeText(r.replier_name).includes(query) ||
          normalizeText(r.reply_date).includes(query)
        ))
      );
    }

    // 2. Date Range Filter (based on c.attended_data date string)
    let matchesDates = true;
    if (fromDate || toDate) {
      const dateMatch = c.attended_data.match(/(\d{4}-\d{2}-\d{2})/);
      if (dateMatch) {
        const attendedTime = new Date(dateMatch[1] + 'T00:00:00').getTime();

        if (fromDate) {
          const fromTime = new Date(fromDate + 'T00:00:00').getTime();
          if (attendedTime < fromTime) {
            matchesDates = false;
          }
        }
        if (toDate) {
          const toTime = new Date(toDate + 'T23:59:59').getTime();
          if (attendedTime > toTime) {
            matchesDates = false;
          }
        }
      } else {
        const parsedTime = new Date(c.attended_data).getTime();
        if (!isNaN(parsedTime)) {
          if (fromDate) {
            const fromTime = new Date(fromDate + 'T00:00:00').getTime();
            if (parsedTime < fromTime) {
              matchesDates = false;
            }
          }
          if (toDate) {
            const toTime = new Date(toDate + 'T23:59:59').getTime();
            if (parsedTime > toTime) {
              matchesDates = false;
            }
          }
        } else {
          matchesDates = false;
        }
      }
    }

    return matchesText && matchesDates;
  });

  const downloadCSV = () => {
    const headers = [
      'Serial ID',
      'Status',
      'Created At',
      'Attended Date/Data',
      'Consumer No',
      'Meter No',
      'Customer Name',
      'Customer Address',
      'Created By',
      'Replies'
    ];

    const rows = filteredComplaints.map(c => {
      const repliesStr = (c.replies || [])
        .map(r => `${r.reply_text} (By ${r.replier_name} on ${r.reply_date})`)
        .join('; ');

      return [
        c.serial_id,
        c.status.toUpperCase(),
        new Date(c.created_at).toLocaleString(),
        c.attended_data,
        c.consumer_no,
        c.meter_no,
        c.customer_name,
        c.customer_address,
        c.creator_name,
        repliesStr
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(val => {
        const text = String(val || '');
        if (text.includes(',') || text.includes('"') || text.includes('\n')) {
          return `"${text.replace(/"/g, '""')}"`;
        }
        return text;
      }).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `sales_complaints_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Sales Complaints Registry</h1>
          <p className="page-description">Manage consumer billing, meter compliance requests, and resolve incoming/outgoing sales disputes</p>
        </div>

        {user?.role !== 'lawyer' && (
          <button onClick={handleOpenAddModal} className="btn btn-primary">
            <Plus className="w-4 h-4" />
            Add Sales Complaint
          </button>
        )}
      </div>

      {/* FILTER AND SEARCH BAR */}
      <div className="glass-panel filter-bar" style={{ padding: '16px', marginBottom: '32px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', flexGrow: 1, minWidth: '240px', position: 'relative' }}>
          <Search className="w-4 h-4 text-slate-400" style={{ position: 'absolute', left: '14px', top: '15px' }} />
          <input
            type="text"
            className="form-input filter-input"
            placeholder="Search by serial ID, customer, consumer number, meter number..."
            style={{ paddingLeft: '42px' }}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Date Filter From/To */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>From:</span>
            <input
              type="date"
              className="form-input"
              style={{ width: '135px', padding: '6px 10px', fontSize: '13px', height: '38px' }}
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>To:</span>
            <input
              type="date"
              className="form-input"
              style={{ width: '135px', padding: '6px 10px', fontSize: '13px', height: '38px' }}
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>

          {(fromDate || toDate) && (
            <button
              type="button"
              onClick={() => { setFromDate(''); setToDate(''); }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--accent-blue)',
                fontSize: '12px',
                cursor: 'pointer',
                padding: '4px 8px'
              }}
            >
              Clear
            </button>
          )}
        </div>

        {/* Download CSV button */}
        <button
          onClick={downloadCSV}
          className="btn btn-secondary"
          style={{ height: '38px', display: 'flex', alignItems: 'center', gap: '8px' }}
          title="Download all filtered data as CSV"
        >
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      {/* SALES COMPLAINTS DATA TABLE */}
      <div className="glass-panel" style={{ padding: '0px', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '80px 0', textAlign: 'center' }}>
            <Loader2 className="w-10 h-10 animate-spin text-cyan-400" style={{ color: 'var(--accent-blue)', margin: '0 auto 16px auto' }} />
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Querying sales databases...</p>
          </div>
        ) : filteredComplaints.length === 0 ? (
          <div style={{ padding: '80px 40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <ClipboardList className="w-12 h-12 text-slate-500" style={{ color: 'var(--text-muted)', margin: '0 auto 16px auto', opacity: 0.5 }} />
            <h3>No Sales Complaints Found</h3>
            <p style={{ fontSize: '13px', marginTop: '4px' }}>Try modifying search keywords or adding a new sales complaint entry.</p>
          </div>
        ) : (
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '15%' }}>Serial ID</th>
                  <th style={{ width: '25%' }}>In (Consumer Details)</th>
                  <th style={{ width: '25%' }}>Address</th>
                  <th style={{ width: '15%' }}>Out (Reply Status)</th>
                  <th style={{ width: '10%' }}>Status</th>
                  <th style={{ width: '10%' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredComplaints.map((c) => {
                  const isCreator = c.created_by === user?.id;
                  const canEdit = user?.role === 'executive' || (user?.role === 'employee' && isCreator);

                  return (
                    <tr key={c.id}>
                      <td>
                        <strong style={{ color: 'var(--accent-blue)', display: 'block', fontFamily: 'monospace', fontSize: '14px' }}>
                          {c.serial_id}
                        </strong>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Registered by: {c.creator_name}</span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{c.customer_name}</span>
                          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Consumer No: <strong>{c.consumer_no}</strong></span>
                          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Meter No: <strong>{c.meter_no}</strong></span>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Attended: {c.attended_data}</span>
                        </div>
                      </td>
                      <td>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: '1.4' }}>
                          {c.customer_address}
                        </span>
                      </td>
                      <td>
                        {c.replies && c.replies.length > 0 ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {c.replies.map((reply, idx) => (
                              <div key={idx} style={{ borderBottom: idx < c.replies.length - 1 ? '1px dashed var(--border-color)' : 'none', paddingBottom: '6px', marginBottom: idx < c.replies.length - 1 ? '4px' : '0' }}>
                                <span style={{ color: 'var(--text-primary)', fontSize: '13px', fontStyle: 'italic', display: 'block', lineHeight: '1.4' }}>
                                  "{reply.reply_text}"
                                </span>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)', marginTop: '3px' }}>
                                  <span>By: <strong>{reply.replier_name}</strong></span>
                                  <span>Date: {reply.reply_date}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <em style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Awaiting operator response</em>
                        )}
                      </td>
                      <td>
                        <span style={{
                          display: 'inline-block',
                          fontSize: '11px',
                          fontWeight: '700',
                          textTransform: 'uppercase',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          ...(c.status === 'resolved' ? {
                            background: 'rgba(16,185,129,0.12)',
                            color: '#34d399',
                            border: '1px solid rgba(16,185,129,0.25)',
                          } : {
                            background: 'rgba(249,115,22,0.12)',
                            color: '#fb923c',
                            border: '1px solid rgba(249,115,22,0.25)',
                          })
                        }}>
                          {c.status === 'resolved' ? 'Resolved' : 'Pending'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => handleOpenReplyModal(c)}
                            className="btn btn-secondary"
                            style={{ padding: '6px 12px', fontSize: '12px', height: '32px', display: 'flex', alignItems: 'center', gap: '4px' }}
                            title="View / Reply"
                          >
                            {user?.role === 'lawyer' ? <Eye className="w-3.5 h-3.5" /> : <MessageSquare className="w-3.5 h-3.5" />}
                            {user?.role === 'lawyer' ? 'View' : 'Reply'}
                          </button>
                          {canEdit && (
                            <>
                              <button
                                onClick={() => handleOpenEditModal(c)}
                                className="btn btn-secondary"
                                style={{ padding: '6px', height: '32px', width: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                title="Edit Sales Complaint Details"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteComplaint(c.id, c.created_by)}
                                className="btn btn-danger"
                                style={{ padding: '6px', height: '32px', width: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                title="Delete Sales Complaint"
                              >
                                <Trash2 className="w-4 h-4" />
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

      {/* IN PORTION MODAL (ADD SALES COMPLAINT) */}
      {isInModalOpen && (
        <div className="modal-overlay animate-fade-in">
          <div className="glass-panel modal-content" style={{ maxWidth: '600px' }}>
            <button className="modal-close" onClick={() => setIsInModalOpen(false)}>
              <X className="w-5 h-5" />
            </button>

            <div className="modal-header">
              <h2>{editingComplaint ? 'Edit Sales Complaint Details (In portion)' : 'Register Sales Complaint (In portion)'}</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px' }}>
                {editingComplaint ? 'Modify customer attended details, consumer number, and meter number.' : "Enter the customer's attended information, consumer number, and meter number to queue a new sales dispute."}
              </p>
            </div>

            <form onSubmit={handleSaveSalesComplaint}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                <div className="form-group">
                  <label className="form-label">Attended Date / Data</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Attended on 2026-08-11 by Technician Imran"
                    value={attendedData}
                    onChange={(e) => setAttendedData(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Consumer Number</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. 182749502"
                      value={consumerNo}
                      onChange={(e) => setConsumerNo(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Meter Number</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. SG-993848"
                      value={meterNo}
                      onChange={(e) => setMeterNo(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Customer Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Muhammad Amjad"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Customer Address</label>
                  <textarea
                    className="form-textarea"
                    placeholder="Provide full residential/commercial address details..."
                    rows={3}
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsInModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingComplaint ? 'Save Changes' : 'Create Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* OUT PORTION MODAL (VIEW / REPLY) */}
      {isOutModalOpen && selectedComplaint && (
        <div className="modal-overlay animate-fade-in">
          <div className="glass-panel modal-content" style={{ maxWidth: '650px' }}>
            <button className="modal-close" onClick={() => setIsOutModalOpen(false)}>
              <X className="w-5 h-5" />
            </button>

            <div className="modal-header">
              <h2>Resolve Sales Complaint (Out portion)</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                <span style={{ color: 'var(--accent-blue)', fontFamily: 'monospace', fontWeight: 'bold' }}>{selectedComplaint.serial_id}</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>•</span>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Operator: {selectedComplaint.creator_name}</span>
              </div>
            </div>

            <form onSubmit={handleSaveReply}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>

                {/* READ ONLY IN PORTION DETAILS */}
                <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--accent-blue)', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.04em' }}>
                    IN portion Details
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Customer Name:</span>
                      <div style={{ color: 'var(--text-primary)', fontWeight: '600', marginTop: '2px' }}>{selectedComplaint.customer_name}</div>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Attended Date/Data:</span>
                      <div style={{ color: 'var(--text-primary)', marginTop: '2px' }}>{selectedComplaint.attended_data}</div>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Consumer No:</span>
                      <div style={{ color: 'var(--text-primary)', fontFamily: 'monospace', marginTop: '2px' }}>{selectedComplaint.consumer_no}</div>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Meter No:</span>
                      <div style={{ color: 'var(--text-primary)', fontFamily: 'monospace', marginTop: '2px' }}>{selectedComplaint.meter_no}</div>
                    </div>
                    <div style={{ gridColumn: '1 / -1', marginTop: '4px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Customer Address:</span>
                      <div style={{ color: 'var(--text-secondary)', marginTop: '2px', lineHeight: '1.4' }}>{selectedComplaint.customer_address}</div>
                    </div>
                  </div>
                </div>

                {/* REPLY HISTORY */}
                {selectedComplaint.replies && selectedComplaint.replies.length > 0 && (
                  <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--accent-teal)', textTransform: 'uppercase', marginBottom: '10px', letterSpacing: '0.04em' }}>
                      Reply History ({selectedComplaint.replies.length})
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '180px', overflowY: 'auto' }}>
                      {selectedComplaint.replies.map((reply, idx) => (
                        <div key={idx} style={{ background: 'rgba(0,0,0,0.15)', padding: '10px 14px', borderRadius: '6px', borderLeft: '3px solid var(--accent-blue)' }}>
                          <div style={{ color: 'var(--text-primary)', fontSize: '13px', fontStyle: 'italic', lineHeight: '1.4' }}>
                            "{reply.reply_text}"
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
                            <span>Replied by: <strong style={{ color: 'var(--text-secondary)' }}>{reply.replier_name}</strong></span>
                            <span>Date: {reply.reply_date}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* EDITABLE OUT PORTION FIELDS */}
                {user?.role !== 'lawyer' && (
                  <>
                    <div className="form-group" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginTop: '8px' }}>
                      <label className="form-label">Add New Reply (Out portion)</label>
                      <textarea
                        className="form-textarea"
                        placeholder="Enter resolution notes, refund confirmation, or adjustment details to append a reply..."
                        rows={4}
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Date of the Reply</label>
                      <input
                        type="date"
                        className="form-input"
                        value={replyDate}
                        onChange={(e) => setReplyDate(e.target.value)}
                        required
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsOutModalOpen(false)}>
                  {user?.role === 'lawyer' ? 'Close Panel' : 'Cancel'}
                </button>
                {user?.role !== 'lawyer' && (
                  <button type="submit" className="btn btn-primary">
                    Submit Response
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
