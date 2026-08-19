'use client';

import { useEffect, useState, useRef } from 'react';
import { useUser } from '../layout';
import { dbClient, Complaint } from '@/lib/db';
import { uploadFileToCloudinary } from '@/lib/cloudinary';
import { 
  Plus, 
  Search, 
  Calendar, 
  FileText, 
  Image as ImageIcon, 
  Trash2, 
  Edit3, 
  Link2, 
  Link2Off, 
  X, 
  Eye,
  Loader2, 
  Download,
  Copy,
  Check,
  Sheet
} from 'lucide-react';

const normalizeText = (str: string | undefined | null) => {
  if (!str) return '';
  return str
    .toLowerCase()
    .replace(/[\u2013\u2014-]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
};

export default function ComplaintsPage() {
  const { user } = useUser();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingComplaint, setEditingComplaint] = useState<Complaint | null>(null);

  // Dedicated Preview Modal State
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewComplaint, setPreviewComplaint] = useState<Complaint | null>(null);

  const handleOpenPreviewModal = (complaint: Complaint) => {
    setPreviewComplaint(complaint);
    setIsPreviewOpen(true);
  };
  
  // Form State
  const [compName, setCompName] = useState('');
  const [compDate, setCompDate] = useState(new Date().toISOString().split('T')[0]);
  const [compDesc, setCompDesc] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [pdfs, setPdfs] = useState<string[]>([]);
  const [xlsxs, setXlsxs] = useState<string[]>([]);
  const [csvs, setCsvs] = useState<string[]>([]);
  // Optional FIR detail fields
  const [policeStation, setPoliceStation] = useState('');
  const [modeOfTheft, setModeOfTheft] = useState('');
  const [volumeHm3, setVolumeHm3] = useState('');
  const [volumeMmcf, setVolumeMmcf] = useState('');
  const [amountBooked, setAmountBooked] = useState('');
  const [complainant, setComplainant] = useState('');
  const [witnesses, setWitnesses] = useState<string[]>([]);
  const [statusOfAccused, setStatusOfAccused] = useState('');
  const [lawyerName, setLawyerName] = useState('');
  const [courtName, setCourtName] = useState('');
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddWitness = () => {
    setWitnesses(prev => [...prev, '']);
  };

  const handleUpdateWitness = (index: number, val: string) => {
    setWitnesses(prev => {
      const next = [...prev];
      next[index] = val;
      return next;
    });
  };

  const handleRemoveWitness = (index: number) => {
    setWitnesses(prev => prev.filter((_, i) => i !== index));
  };

  // Copy to clipboard notification state
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const data = await dbClient.getComplaints();
      setComplaints(data);
    } catch (err) {
      console.error('Failed to fetch complaints', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  // Filter complaints based on search query and date range (From Date -> To Date)
  const filteredComplaints = complaints.filter(c => {
    const query = normalizeText(searchQuery);
    const complainantText = normalizeText(c.complainant || c.plaintiff);
    const witnessesText = Array.isArray(c.witnesses) ? c.witnesses.map(w => normalizeText(w)).join(' ') : '';
    const matchesSearch = 
      normalizeText(c.name).includes(query) ||
      normalizeText(c.description).includes(query) ||
      normalizeText(c.creator_name).includes(query) ||
      normalizeText(c.police_station).includes(query) ||
      normalizeText(c.mode_of_theft).includes(query) ||
      complainantText.includes(query) ||
      witnessesText.includes(query) ||
      normalizeText(c.lawyer_name).includes(query) ||
      normalizeText(c.court_name).includes(query);
      
    let matchesDateRange = true;
    if (fromDate) {
      matchesDateRange = matchesDateRange && c.register_date >= fromDate;
    }
    if (toDate) {
      matchesDateRange = matchesDateRange && c.register_date <= toDate;
    }
    
    return matchesSearch && matchesDateRange;
  });

  // Handle opening modal for adding new
  const handleOpenAddModal = () => {
    setEditingComplaint(null);
    setCompName('');
    setCompDate(new Date().toISOString().split('T')[0]);
    setCompDesc('');
    setImages([]);
    setPdfs([]);
    setXlsxs([]);
    setCsvs([]);
    setPoliceStation('');
    setModeOfTheft('');
    setVolumeHm3('');
    setVolumeMmcf('');
    setAmountBooked('');
    setComplainant('');
    setWitnesses([]);
    setStatusOfAccused('');
    setLawyerName('');
    setCourtName('');
    setIsModalOpen(true);
  };

  // Handle opening modal for editing
  const handleOpenEditModal = (complaint: Complaint) => {
    // Check permission: Lawyers have read-only permissions; Employees and Executives can edit
    if (user?.role === 'lawyer') {
      alert("Lawyers have read-only permissions.");
      return;
    }
    
    setEditingComplaint(complaint);
    setCompName(complaint.name);
    setCompDate(complaint.register_date);
    setCompDesc(complaint.description);
    setImages(complaint.images);
    setPdfs(complaint.pdfs);
    setXlsxs(complaint.xlsxs || []);
    setCsvs(complaint.csvs || []);
    setPoliceStation(complaint.police_station || '');
    setModeOfTheft(complaint.mode_of_theft || '');
    setVolumeHm3(complaint.volume_booked_hm3 || '');
    setVolumeMmcf(complaint.volume_booked_mmcf || '');
    setAmountBooked(complaint.amount_booked || '');
    setComplainant(complaint.complainant || complaint.plaintiff || '');
    setWitnesses(complaint.witnesses ? [...complaint.witnesses] : []);
    setStatusOfAccused(complaint.status_of_accused || '');
    setLawyerName(complaint.lawyer_name || '');
    setCourtName(complaint.court_name || '');
    setIsModalOpen(true);
  };

  // Handle file uploads
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    setUploadingFiles(true);
    const filesArray = Array.from(e.target.files);
    
    const newImages: string[] = [];
    const newPdfs: string[] = [];
    const newXlsxs: string[] = [];
    const newCsvs: string[] = [];

    for (const file of filesArray) {
      try {
        const uploadResult = await uploadFileToCloudinary(file);
        if (file.type.startsWith('image/')) {
          newImages.push(uploadResult.url);
        } else if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
          newPdfs.push(uploadResult.url);
        } else if (
          file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
          file.name.toLowerCase().endsWith('.xlsx')
        ) {
          newXlsxs.push(uploadResult.url);
        } else if (
          file.type === 'text/csv' ||
          file.type === 'application/csv' ||
          file.name.toLowerCase().endsWith('.csv')
        ) {
          newCsvs.push(uploadResult.url);
        }
      } catch (err) {
        console.error('File upload failed', err);
      }
    }

    setImages(prev => [...prev, ...newImages]);
    setPdfs(prev => [...prev, ...newPdfs]);
    setXlsxs(prev => [...prev, ...newXlsxs]);
    setCsvs(prev => [...prev, ...newCsvs]);
    setUploadingFiles(false);
    
    // Clear input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Remove uploaded attachment
  const handleRemoveAttachment = (type: 'image' | 'pdf' | 'xlsx' | 'csv', index: number) => {
    if (type === 'image') {
      setImages(prev => prev.filter((_, i) => i !== index));
    } else if (type === 'pdf') {
      setPdfs(prev => prev.filter((_, i) => i !== index));
    } else if (type === 'xlsx') {
      setXlsxs(prev => prev.filter((_, i) => i !== index));
    } else {
      setCsvs(prev => prev.filter((_, i) => i !== index));
    }
  };

  // Save complaint (create or update)
  const handleSaveComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!compName || !compDate) return;

    try {
      const activeWitnesses = witnesses.map(w => w.trim()).filter(Boolean);

      if (editingComplaint) {
        // Update
        const { error } = await dbClient.updateComplaint(editingComplaint.id, {
          name: compName,
          register_date: compDate,
          description: compDesc,
          images,
          pdfs,
          xlsxs,
          csvs,
          police_station: policeStation,
          mode_of_theft: modeOfTheft,
          volume_booked_hm3: volumeHm3,
          volume_booked_mmcf: volumeMmcf,
          amount_booked: amountBooked,
          complainant,
          plaintiff: complainant,
          witnesses: activeWitnesses,
          status_of_accused: statusOfAccused,
          lawyer_name: lawyerName,
          court_name: courtName,
        });
        if (error) alert(error);
      } else {
        // Create new
        const { error } = await dbClient.createComplaint({
          name: compName,
          register_date: compDate,
          description: compDesc,
          images,
          pdfs,
          xlsxs,
          csvs,
          police_station: policeStation,
          mode_of_theft: modeOfTheft,
          volume_booked_hm3: volumeHm3,
          volume_booked_mmcf: volumeMmcf,
          amount_booked: amountBooked,
          complainant,
          plaintiff: complainant,
          witnesses: activeWitnesses,
          status_of_accused: statusOfAccused,
          lawyer_name: lawyerName,
          court_name: courtName,
        });
        if (error) alert(error);
      }
      setIsModalOpen(false);
      fetchComplaints();
    } catch (err: any) {
      alert(err.message || 'Operation failed.');
    }
  };

  // Delete Complaint
  const handleDeleteComplaint = async (id: string, createdBy: string) => {
    // Check permission
    if (user?.role === 'employee' && createdBy !== user.id) {
      alert("You do not have permission to delete complaints created by other users.");
      return;
    }

    if (confirm("Are you sure you want to delete this complaint FIR entry?")) {
      try {
        const { error } = await dbClient.deleteComplaint(id);
        if (error) alert(error);
        fetchComplaints();
      } catch (err: any) {
        alert(err.message || 'Failed to delete complaint.');
      }
    }
  };

  // Generate public link
  const handleGenerateLink = async (id: string) => {
    try {
      const { token, error } = await dbClient.generatePublicLink(id);
      if (error) {
        alert(error);
      } else if (token) {
        fetchComplaints();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Revoke public link
  const handleRevokeLink = async (id: string) => {
    try {
      const { error } = await dbClient.revokePublicLink(id);
      if (error) {
        alert(error);
      } else {
        fetchComplaints();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Copy link to clipboard
  const handleCopyLink = (token: string, complaintId: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const publicUrl = `${origin}/public/${token}`;
    navigator.clipboard.writeText(publicUrl);
    setCopiedId(complaintId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Pipeline FIR Complaints Registry</h1>
          <p className="page-description">Maintain regulatory logs, upload engineering documents, and manage public compliance files</p>
        </div>
        
        {/* Lawyers cannot add complaints */}
        {user?.role !== 'lawyer' && (
          <button onClick={handleOpenAddModal} className="btn btn-primary">
            <Plus className="w-4 h-4" />
            Add New FIR Complaint
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
            placeholder="Search by FIR name, description, creator, police station..."
            style={{ paddingLeft: '42px' }}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        {/* CUSTOM DATE RANGE FILTER (FROM - TO) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600', whiteSpace: 'nowrap' }}>From:</span>
            <input 
              type="date" 
              className="form-input" 
              style={{ width: '145px', padding: '8px 12px', fontSize: '12px', height: '38px' }}
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600', whiteSpace: 'nowrap' }}>To:</span>
            <input 
              type="date" 
              className="form-input" 
              style={{ width: '145px', padding: '8px 12px', fontSize: '12px', height: '38px' }}
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>

          {(fromDate || toDate) && (
            <button 
              type="button" 
              className="btn btn-secondary" 
              style={{ padding: '6px 12px', fontSize: '12px', height: '38px', whiteSpace: 'nowrap' }}
              onClick={() => { setFromDate(''); setToDate(''); }}
            >
              <X className="w-3.5 h-3.5" /> Clear Range
            </button>
          )}
        </div>
      </div>

      {/* COMPLAINTS DATA TABLE */}
      <div className="glass-panel" style={{ padding: '0px', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '80px 0', textAlign: 'center' }}>
            <Loader2 className="w-10 h-10 animate-spin text-cyan-400" style={{ color: 'var(--accent-blue)', margin: '0 auto 16px auto' }} />
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Querying pipeline databases...</p>
          </div>
        ) : filteredComplaints.length === 0 ? (
          <div style={{ padding: '80px 40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <FileText className="w-12 h-12 text-slate-500" style={{ color: 'var(--text-muted)', margin: '0 auto 16px auto', opacity: 0.5 }} />
            <h3>No FIR Complaints Found</h3>
            <p style={{ fontSize: '13px', marginTop: '4px' }}>Try modifying search keywords or adding a new FIR complaint record.</p>
          </div>
        ) : (
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '22%' }}>FIR Subject</th>
                  <th style={{ width: '13%' }}>Register Date</th>
                  <th style={{ width: '30%' }}>Description</th>
                  <th style={{ width: '15%' }}>Registered By</th>
                  <th style={{ width: '10%' }}>Attachments</th>
                  <th style={{ width: '10%' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredComplaints.map((c) => {
                  const canEdit = user?.role === 'executive' || user?.role === 'employee';
                  
                  return (
                    <tr key={c.id}>
                      <td>
                        <button
                          type="button"
                          onClick={() => handleOpenPreviewModal(c)}
                          style={{
                            background: 'none',
                            border: 'none',
                            padding: 0,
                            margin: 0,
                            textAlign: 'left',
                            cursor: 'pointer',
                            color: 'var(--text-primary)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '14px',
                            fontWeight: '700',
                            lineHeight: '1.4',
                            transition: 'color 0.15s ease'
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent-blue)')}
                          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
                          title="Click to preview FIR complaint details"
                        >
                          <span>{c.name}</span>
                          <Eye className="w-3.5 h-3.5 opacity-60 hover:opacity-100" />
                        </button>

                        {/* Police Station + Mode of Theft chips */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '5px' }}>
                          {c.police_station && (
                            <span style={{ fontSize: '10px', fontWeight: '600', color: '#e2e8f0', background: '#334155', border: '1px solid #475569', padding: '2px 7px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                              🏛 {c.police_station}
                            </span>
                          )}
                          {c.mode_of_theft && (
                            <span style={{ fontSize: '10px', fontWeight: '700', color: '#fff7ed', background: '#c2410c', border: '1px solid #ea580c', padding: '2px 7px', borderRadius: '4px' }}>
                              ⚡ {c.mode_of_theft}
                            </span>
                          )}
                          {c.lawyer_name && (
                            <span style={{ fontSize: '10px', fontWeight: '600', color: '#f5f3ff', background: '#4f46e5', border: '1px solid #6366f1', padding: '2px 7px', borderRadius: '4px' }}>
                              ⚖️ {c.lawyer_name}
                            </span>
                          )}
                          {c.court_name && (
                            <span style={{ fontSize: '10px', fontWeight: '600', color: '#f0fdfa', background: '#0f766e', border: '1px solid #14b8a6', padding: '2px 7px', borderRadius: '4px' }}>
                              🏛️ {c.court_name}
                            </span>
                          )}
                        </div>

                        {/* Share status / public link control (Only visible to employees and executives) */}
                        {user?.role !== 'lawyer' && (
                          c.public_link_active && c.public_link_token ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
                              <span style={{ fontSize: '11px', color: 'var(--accent-blue)', background: 'rgba(0, 242, 254, 0.08)', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(0, 242, 254, 0.15)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Link2 className="w-3 h-3" /> Shared
                              </span>
                              <button 
                                className="btn btn-secondary" 
                                style={{ padding: '2px 6px', fontSize: '10px', height: '20px' }}
                                onClick={() => handleCopyLink(c.public_link_token!, c.id)}
                              >
                                {copiedId === c.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                Copy Link
                              </button>
                              <button 
                                className="btn btn-danger" 
                                style={{ padding: '2px 6px', fontSize: '10px', height: '20px', background: 'none', border: 'none' }}
                                onClick={() => handleRevokeLink(c.id)}
                                title="Revoke Link Access"
                              >
                                <Link2Off className="w-3 h-3" /> Revoke
                              </button>
                            </div>
                          ) : (
                            <button 
                              className="btn btn-secondary" 
                              style={{ padding: '2px 6px', fontSize: '10px', height: '20px', marginTop: '6px', color: 'var(--text-secondary)' }}
                              onClick={() => handleGenerateLink(c.id)}
                            >
                              <Link2 className="w-3 h-3" /> Generate Public Link
                            </button>
                          )
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                          <Calendar className="w-4 h-4 text-slate-500" />
                          <span>{c.register_date}</span>
                        </div>
                      </td>
                      <td>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: '1.5', display: '-webkit-box', WebkitLineClamp: '2', WebkitBoxOrient: 'vertical', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {c.description || <em style={{ color: 'var(--text-muted)' }}>No description provided.</em>}
                        </span>
                        {/* Volume / Amount / Complainant / Witnesses mini-chips */}
                        {(c.volume_booked_hm3 || c.volume_booked_mmcf || c.amount_booked || c.complainant || c.plaintiff || (c.witnesses && c.witnesses.length > 0)) && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '6px' }}>
                            {c.volume_booked_hm3 && (
                              <span style={{ fontSize: '10px', fontWeight: '600', color: '#ecfeff', background: '#0e7490', border: '1px solid #0891b2', padding: '2px 7px', borderRadius: '4px' }}>
                                HM³: {c.volume_booked_hm3}
                              </span>
                            )}
                            {c.volume_booked_mmcf && (
                              <span style={{ fontSize: '10px', fontWeight: '600', color: '#ecfeff', background: '#0e7490', border: '1px solid #0891b2', padding: '2px 7px', borderRadius: '4px' }}>
                                MMCF: {c.volume_booked_mmcf}
                              </span>
                            )}
                            {c.amount_booked && (
                              <span style={{ fontSize: '10px', fontWeight: '600', color: '#f0fdf4', background: '#15803d', border: '1px solid #16a34a', padding: '2px 7px', borderRadius: '4px' }}>
                                PKR: {c.amount_booked}
                              </span>
                            )}
                            {(c.complainant || c.plaintiff) && (
                              <span style={{ fontSize: '10px', fontWeight: '600', color: '#faf5ff', background: '#7e22ce', border: '1px solid #9333ea', padding: '2px 7px', borderRadius: '4px' }}>
                                👤 Complainant: {c.complainant || c.plaintiff}
                              </span>
                            )}
                            {c.witnesses && c.witnesses.length > 0 && (
                              <span style={{ fontSize: '10px', fontWeight: '600', color: '#fdf4ff', background: '#86198f', border: '1px solid #a21caf', padding: '2px 7px', borderRadius: '4px' }}>
                                👥 {c.witnesses.length} {c.witnesses.length === 1 ? 'Witness' : 'Witnesses'}
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td>
                        <span style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{c.creator_name}</span>
                        {c.status_of_accused && (
                          <span style={{
                            display: 'block',
                            marginTop: '4px',
                            fontSize: '10px',
                            fontWeight: '700',
                            letterSpacing: '0.04em',
                            textTransform: 'uppercase',
                            padding: '2px 7px',
                            borderRadius: '4px',
                            width: 'fit-content',
                            ...(c.status_of_accused.toLowerCase().includes('arrest') ? {
                              background: 'rgba(239,68,68,0.12)',
                              color: '#f87171',
                              border: '1px solid rgba(239,68,68,0.25)',
                            } : c.status_of_accused.toLowerCase().includes('bail') ? {
                              background: 'rgba(234,179,8,0.12)',
                              color: '#facc15',
                              border: '1px solid rgba(234,179,8,0.25)',
                            } : c.status_of_accused.toLowerCase().includes('acquit') || c.status_of_accused.toLowerCase().includes('release') ? {
                              background: 'rgba(16,185,129,0.12)',
                              color: '#34d399',
                              border: '1px solid rgba(16,185,129,0.25)',
                            } : c.status_of_accused.toLowerCase().includes('convict') ? {
                              background: 'rgba(168,85,247,0.12)',
                              color: '#c084fc',
                              border: '1px solid rgba(168,85,247,0.25)',
                            } : {
                              background: 'rgba(16,185,129,0.12)',
                              color: '#34d399',
                              border: '1px solid rgba(16,185,129,0.25)',
                            })
                          }}>
                            {c.status_of_accused}
                          </span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px', color: 'var(--text-secondary)' }}>
                          {c.images.length > 0 && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }} title={`${c.images.length} Images`}>
                              <ImageIcon className="w-4 h-4 text-cyan-400" /> {c.images.length}
                            </span>
                          )}
                          {c.pdfs.length > 0 && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }} title={`${c.pdfs.length} PDFs`}>
                              <FileText className="w-4 h-4 text-red-400" /> {c.pdfs.length}
                            </span>
                          )}
                          {(c.xlsxs?.length ?? 0) > 0 && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }} title={`${c.xlsxs?.length} XLSX`}>
                              <Sheet className="w-4 h-4 text-emerald-400" /> {c.xlsxs?.length}
                            </span>
                          )}
                          {(c.csvs?.length ?? 0) > 0 && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }} title={`${c.csvs?.length} CSV`}>
                              <Sheet className="w-4 h-4 text-yellow-400" /> {c.csvs?.length}
                            </span>
                          )}
                          {c.images.length === 0 && c.pdfs.length === 0 && (c.xlsxs?.length ?? 0) === 0 && (c.csvs?.length ?? 0) === 0 && (
                            <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>None</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          {/* Preview Details Button (Available to all users) */}
                          <button 
                            onClick={() => handleOpenPreviewModal(c)}
                            className="btn btn-secondary" 
                            style={{ padding: '6px', height: '32px', width: '32px' }}
                            title="Preview Complaint Details"
                          >
                            <Eye className="w-4 h-4 text-cyan-400" />
                          </button>

                          {/* Edit & Delete buttons (Only for authorized users) */}
                          {canEdit && (
                            <>
                              <button 
                                onClick={() => handleOpenEditModal(c)}
                                className="btn btn-secondary" 
                                style={{ padding: '6px', height: '32px', width: '32px' }}
                                title="Update Complaint Details"
                              >
                                <Edit3 className="w-4 h-4 text-amber-400" />
                              </button>
                              <button 
                                onClick={() => handleDeleteComplaint(c.id, c.created_by)}
                                className="btn btn-danger" 
                                style={{ padding: '6px', height: '32px', width: '32px' }}
                                title="Delete Complaint"
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

      {/* CREATE & EDIT COMPLAINT DETAILS MODAL */}
      {isModalOpen && (
        <div className="modal-overlay animate-fade-in">
          <div className="glass-panel modal-content">
            <button className="modal-close" onClick={() => setIsModalOpen(false)}>
              <X className="w-5 h-5" />
            </button>
            
            <div className="modal-header">
              <h2>
                {user?.role === 'lawyer' 
                  ? 'View FIR Complaint Details' 
                  : editingComplaint 
                    ? 'Edit FIR Complaint Record' 
                    : 'Register Pipeline FIR Complaint'}
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px' }}>
                {user?.role === 'lawyer' 
                  ? 'Compliance audit view of attachments and logs'
                  : 'Specify FIR complaint metadata and upload diagnostic documents'}
              </p>
            </div>

            <form onSubmit={handleSaveComplaint}>
              <div className="form-group">
                <label className="form-label">Subject / Pipeline Segment Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. Pipeline Leakage Sector G-11 Islamabad"
                  value={compName} 
                  onChange={(e) => setCompName(e.target.value)} 
                  required
                  disabled={user?.role === 'lawyer'}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Date of Registration</label>
                <input 
                  type="date" 
                  className="form-input" 
                  value={compDate} 
                  onChange={(e) => setCompDate(e.target.value)} 
                  required
                  disabled={user?.role === 'lawyer'}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Technical Description (Optional)</label>
                <textarea 
                  className="form-textarea" 
                  placeholder="Describe pipeline pressure drop, joint damage, leakage severity, and actions needed..."
                  rows={4}
                  value={compDesc} 
                  onChange={(e) => setCompDesc(e.target.value)}
                  disabled={user?.role === 'lawyer'}
                />
              </div>

              {/* FIR INVESTIGATION DETAILS */}
              <div style={{ marginBottom: '24px' }}>
                <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.08em', paddingBottom: '8px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '4px', height: '14px', background: 'var(--accent-blue)', borderRadius: '2px', display: 'inline-block' }}></span>
                  FIR Investigation Details <span style={{ fontSize: '10px', fontWeight: '400', color: 'var(--text-muted)', textTransform: 'none', letterSpacing: '0' }}>(All fields optional)</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  
                  <div>
                    <label className="form-label" style={{ fontSize: '12px' }}>Police Station</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. PS Sector I-10"
                      value={policeStation}
                      onChange={(e) => setPoliceStation(e.target.value)}
                      disabled={user?.role === 'lawyer'}
                    />
                  </div>

                  <div>
                    <label className="form-label" style={{ fontSize: '12px' }}>Mode of Theft</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Direct Bypass, Meter Tampering"
                      value={modeOfTheft}
                      onChange={(e) => setModeOfTheft(e.target.value)}
                      disabled={user?.role === 'lawyer'}
                    />
                  </div>

                  <div>
                    <label className="form-label" style={{ fontSize: '12px' }}>Volume Booked (HM³)</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. 1250"
                      value={volumeHm3}
                      onChange={(e) => setVolumeHm3(e.target.value)}
                      disabled={user?.role === 'lawyer'}
                    />
                  </div>

                  <div>
                    <label className="form-label" style={{ fontSize: '12px' }}>Volume Booked (MMCF)</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. 0.044"
                      value={volumeMmcf}
                      onChange={(e) => setVolumeMmcf(e.target.value)}
                      disabled={user?.role === 'lawyer'}
                    />
                  </div>

                  <div>
                    <label className="form-label" style={{ fontSize: '12px' }}>Amount Booked (PKR)</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. 485,000"
                      value={amountBooked}
                      onChange={(e) => setAmountBooked(e.target.value)}
                      disabled={user?.role === 'lawyer'}
                    />
                  </div>

                  <div>
                    <label className="form-label" style={{ fontSize: '12px' }}>Complainant</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. SUI Gas Company / Complainant Name"
                      value={complainant}
                      onChange={(e) => setComplainant(e.target.value)}
                      disabled={user?.role === 'lawyer'}
                    />
                  </div>

                  {/* WITNESSES SECTION */}
                  <div style={{ gridColumn: '1 / -1', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: witnesses.length > 0 ? '12px' : '0' }}>
                      <div>
                        <label className="form-label" style={{ fontSize: '12px', marginBottom: '2px' }}>Witnesses (Optional)</label>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Add names of case witnesses or inspecting officers</span>
                      </div>
                      {user?.role !== 'lawyer' && (
                        <button
                          type="button"
                          onClick={handleAddWitness}
                          className="btn btn-secondary"
                          style={{ padding: '4px 10px', fontSize: '12px', height: '28px', display: 'flex', alignItems: 'center', gap: '5px' }}
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Add Witness
                        </button>
                      )}
                    </div>

                    {witnesses.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {witnesses.map((w, index) => (
                          <div key={index} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)', width: '22px', textAlign: 'center', flexShrink: 0 }}>
                              {index + 1}.
                            </span>
                            <input
                              type="text"
                              className="form-input"
                              placeholder={`Witness #${index + 1} Name (e.g. Inspector Tariq Khan, Engineer Bilal)`}
                              value={w}
                              onChange={(e) => handleUpdateWitness(index, e.target.value)}
                              disabled={user?.role === 'lawyer'}
                              style={{ height: '36px', fontSize: '13px' }}
                            />
                            {user?.role !== 'lawyer' && (
                              <button
                                type="button"
                                onClick={() => handleRemoveWitness(index)}
                                title="Remove Witness"
                                style={{
                                  background: 'rgba(239, 68, 68, 0.1)',
                                  border: '1px solid rgba(239, 68, 68, 0.2)',
                                  color: '#f87171',
                                  borderRadius: '6px',
                                  width: '36px',
                                  height: '36px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'pointer',
                                  flexShrink: 0
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {witnesses.length === 0 && (
                      <div style={{ textAlign: 'center', padding: '8px 0', color: 'var(--text-muted)', fontSize: '12px' }}>
                        No witnesses added yet. Click <strong>+ Add Witness</strong> to add witness names.
                      </div>
                    )}
                  </div>

                  <div style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label" style={{ fontSize: '12px' }}>Status of Accused</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Arrested, On Bail, Under Investigation, Absconding..."
                      value={statusOfAccused}
                      onChange={(e) => setStatusOfAccused(e.target.value)}
                      disabled={user?.role === 'lawyer'}
                    />
                  </div>

                  <div style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label" style={{ fontSize: '12px' }}>Lawyer Name</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Barrister Ahmed Raza, Adv. Muhammad Ali"
                      value={lawyerName}
                      onChange={(e) => setLawyerName(e.target.value)}
                      disabled={user?.role === 'lawyer'}
                    />
                  </div>

                  <div style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label" style={{ fontSize: '12px' }}>Court Name</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Sessions Court Lahore, Anti-Corruption Court Islamabad"
                      value={courtName}
                      onChange={(e) => setCourtName(e.target.value)}
                      disabled={user?.role === 'lawyer'}
                    />
                  </div>

                </div>
              </div>

              {/* ATTACHMENT MANAGER */}
              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label className="form-label">Document Attachments (Images & PDFs)</label>
                
                {/* File picker - hidden for lawyers */}
                {user?.role !== 'lawyer' && (
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="form-input" 
                      style={{ display: 'none' }}
                      multiple
                      accept="image/*,application/pdf,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,.xlsx,text/csv,.csv"
                      onChange={handleFileUpload}
                      disabled={uploadingFiles}
                    />
                    <button 
                      type="button" 
                      className="btn btn-secondary" 
                      style={{ padding: '8px 16px', fontSize: '13px' }}
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingFiles}
                    >
                      {uploadingFiles ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" /> Uploading to Cloudinary...
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4" /> Upload Files
                        </>
                      )}
                    </button>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Supported: PNG, JPG, PDF, XLSX, CSV</span>
                  </div>
                )}

                {/* ATTACHMENTS LISTING */}
                {(images.length > 0 || pdfs.length > 0 || xlsxs.length > 0 || csvs.length > 0) && (
                  <div style={{ marginTop: '16px' }}>
                    
                    {/* Images list */}
                    {images.length > 0 && (
                      <div style={{ marginBottom: '14px' }}>
                        <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '8px' }}>Images:</div>
                        <div className="attachment-grid">
                          {images.map((imgUrl, idx) => (
                            <div key={idx} className="attachment-preview">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={imgUrl} alt={`Attachment ${idx}`} />
                              {user?.role !== 'lawyer' && (
                                <button 
                                  type="button" 
                                  className="attachment-preview-delete" 
                                  onClick={() => handleRemoveAttachment('image', idx)}
                                >
                                  ×
                                </button>
                              )}
                              {/* Option to view */}
                              <a href={imgUrl} target="_blank" rel="noopener noreferrer" style={{ position: 'absolute', bottom: '4px', left: '4px', background: 'rgba(0,0,0,0.7)', borderRadius: '4px', padding: '2px', display: 'flex', color: 'white' }} title="Open Image">
                                <Eye className="w-3 h-3" />
                              </a>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* PDFs list */}
                    {pdfs.length > 0 && (
                      <div style={{ marginBottom: '14px' }}>
                        <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '8px' }}>PDF Documents:</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {pdfs.map((pdfUrl, idx) => {
                            let filename = `document-${idx + 1}.pdf`;
                            if (pdfUrl.startsWith('data:')) {
                              const match = pdfUrl.match(/;name=([^;]+);/);
                              if (match) {
                                filename = decodeURIComponent(match[1]);
                              } else {
                                filename = `mock-local-document-${idx + 1}.pdf`;
                              }
                            } else {
                              try {
                                const urlParts = pdfUrl.split('/');
                                filename = decodeURIComponent(urlParts[urlParts.length - 1]);
                              } catch (e) {}
                            }
                            
                            return (
                              <div key={idx} className="glass-panel" style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                                  <FileText className="w-4 h-4 text-red-400" style={{ flexShrink: 0 }} />
                                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {filename}
                                  </span>
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                  <a href={pdfUrl.startsWith('data:') ? pdfUrl : `/api/download?url=${encodeURIComponent(pdfUrl)}&filename=${encodeURIComponent(filename)}`} download target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '10px', height: '24px' }}>
                                    <Download className="w-3.5 h-3.5" /> Download PDF
                                  </a>
                                  {user?.role !== 'lawyer' && (
                                    <button 
                                      type="button" 
                                      className="btn btn-danger" 
                                      style={{ padding: '4px 8px', fontSize: '10px', height: '24px', background: 'none' }}
                                      onClick={() => handleRemoveAttachment('pdf', idx)}
                                    >
                                      × Remove
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* XLSX files list */}
                    {xlsxs.length > 0 && (
                      <div style={{ marginBottom: '14px' }}>
                        <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Sheet className="w-3.5 h-3.5 text-emerald-400" /> Excel Spreadsheets (.xlsx):
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {xlsxs.map((xlsxUrl, idx) => {
                            let filename = `spreadsheet-${idx + 1}.xlsx`;
                            try {
                              const urlParts = xlsxUrl.split('/');
                              filename = decodeURIComponent(urlParts[urlParts.length - 1]);
                            } catch (e) {}
                            return (
                              <div key={idx} className="glass-panel" style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(16,185,129,0.04)', borderRadius: '8px', border: '1px solid rgba(16,185,129,0.15)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                                  <Sheet className="w-4 h-4" style={{ color: '#10b981', flexShrink: 0 }} />
                                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {filename}
                                  </span>
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                  <a href={`/api/download?url=${encodeURIComponent(xlsxUrl)}&filename=${encodeURIComponent(filename)}`} download target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '10px', height: '24px', borderColor: 'rgba(16,185,129,0.3)' }}>
                                    <Download className="w-3.5 h-3.5" /> Download XLSX
                                  </a>
                                  {user?.role !== 'lawyer' && (
                                    <button type="button" className="btn btn-danger" style={{ padding: '4px 8px', fontSize: '10px', height: '24px', background: 'none' }} onClick={() => handleRemoveAttachment('xlsx', idx)}>
                                      × Remove
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* CSV files list */}
                    {csvs.length > 0 && (
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Sheet className="w-3.5 h-3.5 text-yellow-400" /> CSV Data Files:
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {csvs.map((csvUrl, idx) => {
                            let filename = `data-${idx + 1}.csv`;
                            try {
                              const urlParts = csvUrl.split('/');
                              filename = decodeURIComponent(urlParts[urlParts.length - 1]);
                            } catch (e) {}
                            return (
                              <div key={idx} className="glass-panel" style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(234,179,8,0.04)', borderRadius: '8px', border: '1px solid rgba(234,179,8,0.15)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                                  <Sheet className="w-4 h-4" style={{ color: '#eab308', flexShrink: 0 }} />
                                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {filename}
                                  </span>
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                  <a href={`/api/download?url=${encodeURIComponent(csvUrl)}&filename=${encodeURIComponent(filename)}`} download target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '10px', height: '24px', borderColor: 'rgba(234,179,8,0.3)' }}>
                                    <Download className="w-3.5 h-3.5" /> Download CSV
                                  </a>
                                  {user?.role !== 'lawyer' && (
                                    <button type="button" className="btn btn-danger" style={{ padding: '4px 8px', fontSize: '10px', height: '24px', background: 'none' }} onClick={() => handleRemoveAttachment('csv', idx)}>
                                      × Remove
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={uploadingFiles}>
                  {editingComplaint ? 'Update Details' : 'Register FIR Complaint'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DEDICATED PREVIEW COMPLAINT MODAL */}
      {isPreviewOpen && previewComplaint && (
        <div className="modal-overlay animate-fade-in">
          <div className="glass-panel modal-content" style={{ maxWidth: '780px', maxHeight: '90vh', overflowY: 'auto' }}>
            <button className="modal-close" onClick={() => setIsPreviewOpen(false)}>
              <X className="w-5 h-5" />
            </button>

            <div className="modal-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '11px', fontWeight: '800', background: 'rgba(0, 242, 254, 0.1)', color: 'var(--accent-blue)', border: '1px solid rgba(0, 242, 254, 0.25)', padding: '2px 8px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  FIR Preview
                </span>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Registered on <strong>{previewComplaint.register_date}</strong> by <strong>{previewComplaint.creator_name}</strong>
                </span>
              </div>
              <h2 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-primary)', marginTop: '8px' }}>
                {previewComplaint.name}
              </h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '20px 0' }}>
              {/* Technical Description */}
              <div>
                <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
                  Technical Description
                </div>
                <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '14px 16px', color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.6' }}>
                  {previewComplaint.description || <em style={{ color: 'var(--text-muted)' }}>No technical description provided.</em>}
                </div>
              </div>

              {/* FIR Investigation Details Grid */}
              <div>
                <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '4px', height: '14px', background: 'var(--accent-blue)', borderRadius: '2px', display: 'inline-block' }}></span>
                  FIR Investigation Details
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '16px' }}>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>Police Station</div>
                    <div style={{ fontSize: '14px', color: 'var(--text-primary)', marginTop: '3px', fontWeight: '500' }}>{previewComplaint.police_station || '—'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>Mode of Theft</div>
                    <div style={{ fontSize: '14px', color: '#fb923c', marginTop: '3px', fontWeight: '600' }}>{previewComplaint.mode_of_theft || '—'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>Volume Booked (HM³)</div>
                    <div style={{ fontSize: '14px', color: 'var(--text-primary)', marginTop: '3px', fontWeight: '500' }}>{previewComplaint.volume_booked_hm3 || '—'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>Volume Booked (MMCF)</div>
                    <div style={{ fontSize: '14px', color: 'var(--text-primary)', marginTop: '3px', fontWeight: '500' }}>{previewComplaint.volume_booked_mmcf || '—'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>Amount Booked (PKR)</div>
                    <div style={{ fontSize: '14px', color: '#4ade80', marginTop: '3px', fontWeight: '700' }}>{previewComplaint.amount_booked ? `PKR ${previewComplaint.amount_booked}` : '—'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>Complainant</div>
                    <div style={{ fontSize: '14px', color: 'var(--text-primary)', marginTop: '3px', fontWeight: '500' }}>{previewComplaint.complainant || previewComplaint.plaintiff || '—'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>Status of Accused</div>
                    <div style={{ marginTop: '4px' }}>
                      {previewComplaint.status_of_accused ? (
                        <span style={{
                          fontSize: '11px',
                          fontWeight: '700',
                          letterSpacing: '0.04em',
                          textTransform: 'uppercase',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          display: 'inline-block',
                          ...(previewComplaint.status_of_accused.toLowerCase().includes('arrest') ? {
                            background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)',
                          } : previewComplaint.status_of_accused.toLowerCase().includes('bail') ? {
                            background: 'rgba(234,179,8,0.15)', color: '#facc15', border: '1px solid rgba(234,179,8,0.3)',
                          } : previewComplaint.status_of_accused.toLowerCase().includes('acquit') || previewComplaint.status_of_accused.toLowerCase().includes('release') ? {
                            background: 'rgba(16,185,129,0.15)', color: '#34d399', border: '1px solid rgba(16,185,129,0.3)',
                          } : {
                            background: 'rgba(16,185,129,0.15)', color: '#34d399', border: '1px solid rgba(16,185,129,0.3)',
                          })
                        }}>
                          {previewComplaint.status_of_accused}
                        </span>
                      ) : (
                        <span style={{ fontSize: '14px', color: 'var(--text-primary)' }}>—</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>Lawyer Name</div>
                    <div style={{ fontSize: '14px', color: '#a5b4fc', marginTop: '3px', fontWeight: '600' }}>{previewComplaint.lawyer_name ? `⚖️ ${previewComplaint.lawyer_name}` : '—'}</div>
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>Court Name</div>
                    <div style={{ fontSize: '14px', color: '#2dd4bf', marginTop: '3px', fontWeight: '600' }}>{previewComplaint.court_name ? `🏛️ ${previewComplaint.court_name}` : '—'}</div>
                  </div>
                </div>
              </div>

              {/* Witnesses List */}
              <div>
                <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
                  Witnesses {previewComplaint.witnesses && previewComplaint.witnesses.length > 0 ? `(${previewComplaint.witnesses.length})` : ''}
                </div>
                {previewComplaint.witnesses && previewComplaint.witnesses.length > 0 ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {previewComplaint.witnesses.map((w, idx) => (
                      <span key={idx} style={{ fontSize: '13px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', padding: '6px 12px', borderRadius: '6px', color: 'var(--text-primary)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ color: 'var(--accent-teal)', fontWeight: '700' }}>{idx + 1}.</span> {w}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic', padding: '10px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', border: '1px dashed var(--border-color)' }}>
                    No witnesses recorded for this complaint.
                  </div>
                )}
              </div>

              {/* Attachments Section */}
              <div>
                <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
                  Case Attachments
                </div>
                
                {/* Images */}
                {previewComplaint.images && previewComplaint.images.length > 0 && (
                  <div style={{ marginBottom: '14px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px' }}>Images ({previewComplaint.images.length})</div>
                    <div className="attachment-grid">
                      {previewComplaint.images.map((imgUrl, idx) => (
                        <div key={idx} className="attachment-preview">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={imgUrl} alt={`Attachment ${idx}`} />
                          <a href={imgUrl} target="_blank" rel="noopener noreferrer" style={{ position: 'absolute', bottom: '4px', left: '4px', background: 'rgba(0,0,0,0.7)', borderRadius: '4px', padding: '2px 6px', display: 'flex', alignItems: 'center', gap: '4px', color: 'white', fontSize: '10px' }} title="Open Image Fullscreen">
                            <Eye className="w-3 h-3" /> View
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* PDFs */}
                {previewComplaint.pdfs && previewComplaint.pdfs.length > 0 && (
                  <div style={{ marginBottom: '14px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px' }}>PDF Documents ({previewComplaint.pdfs.length})</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {previewComplaint.pdfs.map((pdfUrl, idx) => {
                        let filename = `document-${idx + 1}.pdf`;
                        try {
                          const urlParts = pdfUrl.split('/');
                          filename = decodeURIComponent(urlParts[urlParts.length - 1]);
                        } catch (e) {}
                        return (
                          <div key={idx} className="glass-panel" style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                              <FileText className="w-4 h-4 text-red-400" style={{ flexShrink: 0 }} />
                              <span style={{ fontSize: '12px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {filename}
                              </span>
                            </div>
                            <a href={pdfUrl.startsWith('data:') ? pdfUrl : `/api/download?url=${encodeURIComponent(pdfUrl)}&filename=${encodeURIComponent(filename)}`} download target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '11px', height: '26px' }}>
                              <Download className="w-3.5 h-3.5" /> Download
                            </a>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* XLSX */}
                {previewComplaint.xlsxs && previewComplaint.xlsxs.length > 0 && (
                  <div style={{ marginBottom: '14px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px' }}>Excel Sheets ({previewComplaint.xlsxs.length})</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {previewComplaint.xlsxs.map((xlsxUrl, idx) => {
                        let filename = `spreadsheet-${idx + 1}.xlsx`;
                        try {
                          const urlParts = xlsxUrl.split('/');
                          filename = decodeURIComponent(urlParts[urlParts.length - 1]);
                        } catch (e) {}
                        return (
                          <div key={idx} className="glass-panel" style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(16,185,129,0.04)', borderRadius: '8px', border: '1px solid rgba(16,185,129,0.15)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                              <Sheet className="w-4 h-4 text-emerald-400" style={{ flexShrink: 0 }} />
                              <span style={{ fontSize: '12px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {filename}
                              </span>
                            </div>
                            <a href={`/api/download?url=${encodeURIComponent(xlsxUrl)}&filename=${encodeURIComponent(filename)}`} download target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '11px', height: '26px', borderColor: 'rgba(16,185,129,0.3)' }}>
                              <Download className="w-3.5 h-3.5" /> Download
                            </a>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* CSV */}
                {previewComplaint.csvs && previewComplaint.csvs.length > 0 && (
                  <div style={{ marginBottom: '14px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px' }}>CSV Files ({previewComplaint.csvs.length})</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {previewComplaint.csvs.map((csvUrl, idx) => {
                        let filename = `data-${idx + 1}.csv`;
                        try {
                          const urlParts = csvUrl.split('/');
                          filename = decodeURIComponent(urlParts[urlParts.length - 1]);
                        } catch (e) {}
                        return (
                          <div key={idx} className="glass-panel" style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(234,179,8,0.04)', borderRadius: '8px', border: '1px solid rgba(234,179,8,0.15)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                              <Sheet className="w-4 h-4 text-yellow-400" style={{ flexShrink: 0 }} />
                              <span style={{ fontSize: '12px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {filename}
                              </span>
                            </div>
                            <a href={`/api/download?url=${encodeURIComponent(csvUrl)}&filename=${encodeURIComponent(filename)}`} download target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '11px', height: '26px', borderColor: 'rgba(234,179,8,0.3)' }}>
                              <Download className="w-3.5 h-3.5" /> Download
                            </a>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {(!previewComplaint.images || previewComplaint.images.length === 0) &&
                 (!previewComplaint.pdfs || previewComplaint.pdfs.length === 0) &&
                 (!previewComplaint.xlsxs || previewComplaint.xlsxs.length === 0) &&
                 (!previewComplaint.csvs || previewComplaint.csvs.length === 0) && (
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic', padding: '10px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', border: '1px dashed var(--border-color)' }}>
                    No files or documents attached.
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                {/* Edit button: Available to both Executives and Employees */}
                {(user?.role === 'executive' || user?.role === 'employee') && (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    onClick={() => {
                      setIsPreviewOpen(false);
                      handleOpenEditModal(previewComplaint);
                    }}
                  >
                    <Edit3 className="w-4 h-4 text-amber-400" />
                    Update Details
                  </button>
                )}
              </div>
              <button type="button" className="btn btn-primary" onClick={() => setIsPreviewOpen(false)}>
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
