'use client';

import { useEffect, useState, useMemo } from 'react';
import { useUser } from '../layout';
import { dbClient, PmduComplaint } from '@/lib/db';
import {
  Plus,
  Search,
  Trash2,
  X,
  Eye,
  Loader2,
  Edit3,
  Download,
  CheckCircle2,
  Clock,
  Send,
  MapPin,
  FileSpreadsheet,
  RefreshCw,
  Phone,
  User,
  Calendar,
  AlertTriangle,
  Building,
  Info,
  Copy,
  Check,
  Printer,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  Landmark,
  FileText,
  UserPlus,
  MessageSquare
} from 'lucide-react';

const CLOSE_OPTION_COLORS: Record<string, { bg: string; color: string; border: string; icon: string }> = {
  'Relief Granted': { bg: '#ecfdf5', color: '#047857', border: '#a7f3d0', icon: 'check' },
  'Partial relief Granted': { bg: '#fffbeb', color: '#b45309', border: '#fde68a', icon: 'clock' },
  'Relief cannot be Granted': { bg: '#fef2f2', color: '#b91c1c', border: '#fecaca', icon: 'alert' },
  'Pending': { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe', icon: 'clock' },
  'In Progress': { bg: '#faf5ff', color: '#7e22ce', border: '#f3e8ff', icon: 'send' },
};

const DEFAULT_STATUS_COLOR = { bg: '#f1f5f9', color: '#475569', border: '#cbd5e1', icon: 'info' };

const normalizeText = (str: string | undefined | null) =>
  str ? str.toLowerCase().replace(/[\u2013\u2014-]/g, '-').replace(/\s+/g, ' ').trim() : '';

// Helper to parse DD/MM/YYYY or YYYY-MM-DD to timestamp
const parseFlexibleDate = (dateStr: string | undefined | null): number => {
  if (!dateStr) return 0;
  const parts = dateStr.split(/[/.-]/);
  if (parts.length === 3) {
    if (parts[0].length === 4) {
      return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2])).getTime();
    } else {
      return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0])).getTime();
    }
  }
  const timestamp = new Date(dateStr).getTime();
  return isNaN(timestamp) ? 0 : timestamp;
};

export default function PmduComplaintsPage() {
  const { user } = useUser();
  const [complaints, setComplaints] = useState<PmduComplaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [closeOptionFilter, setCloseOptionFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [regionFilter, setRegionFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);

  // Modal States
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [editingComplaint, setEditingComplaint] = useState<PmduComplaint | null>(null);
  const [selectedComplaint, setSelectedComplaint] = useState<PmduComplaint | null>(null);

  // Form Fields
  const [complaintId, setComplaintId] = useState('');
  const [compDate, setCompDate] = useState('');
  const [closeOption, setCloseOption] = useState('Relief Granted');
  const [details, setDetails] = useState('');
  const [feedbackStatement, setFeedbackStatement] = useState('');
  const [region, setRegion] = useState('FAISALABAD');
  const [department, setDepartment] = useState('Distribution-(UFGC)');
  const [complainantName, setComplainantName] = useState('Hidden');
  const [complainantPhone, setComplainantPhone] = useState('Hidden');
  const [address, setAddress] = useState('');

  const fetchComplaints = async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      else setLoading(true);

      const data = await dbClient.getPmduComplaints();
      setComplaints(data);
    } catch (err) {
      console.error('Failed to fetch PMDU complaints:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  // Copy ID to clipboard
  const handleCopyId = (idText: string) => {
    navigator.clipboard.writeText(idText);
    setCopiedId(idText);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Open Add Modal
  const handleOpenAddModal = () => {
    setEditingComplaint(null);
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yy = String(now.getFullYear()).slice(-2);
    const rand = Math.floor(1000000 + Math.random() * 9000000);
    
    setComplaintId(`PU${dd}${mm}${yy}-${rand}`);
    setCompDate(`${dd}/${mm}/${now.getFullYear()}`);
    setCloseOption('Relief Granted');
    setDetails('');
    setFeedbackStatement(
      `Respected Citizen! With reference to your complaint, our team inspected the premises and necessary action has been completed as per company policy. If you need further assistance, please contact our regional helpline.\n\n'Please read citizen guidelines manual on links:'\nUrdu: http://pmdu.pmo.gov.pk/guideline/manual/PCP-user-manual-urdu.pdf\nEnglish: http://pmdu.pmo.gov.pk/guideline/manual/PCP-user-manual-english.pdf`
    );
    setRegion('FAISALABAD');
    setDepartment('Distribution-(UFGC)');
    setComplainantName('');
    setComplainantPhone('');
    setAddress('');
    setIsFormModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (c: PmduComplaint) => {
    setEditingComplaint(c);
    setComplaintId(c.complaint_id || '');
    setCompDate(c.comp_date || '');
    setCloseOption(c.close_option || 'Relief Granted');
    setDetails(c.details || '');
    setFeedbackStatement(c.feedback_statement || '');
    setRegion(c.region || 'FAISALABAD');
    setDepartment(c.department || 'Distribution-(UFGC)');
    setComplainantName(c.complainant_name || '');
    setComplainantPhone(c.complainant_phone || '');
    setAddress(c.address || '');
    setIsFormModalOpen(true);
  };

  // Open Detail Modal
  const handleOpenDetailModal = (c: PmduComplaint) => {
    setSelectedComplaint(c);
    setIsDetailModalOpen(true);
  };

  // Save Complaint (Add / Edit)
  const handleSaveComplaint = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!details.trim()) {
      alert('Please fill out the Complaint Grievance Details.');
      return;
    }

    const payload = {
      complaint_id: complaintId.trim(),
      comp_date: compDate.trim(),
      close_option: closeOption.trim(),
      details: details.trim(),
      feedback_statement: feedbackStatement.trim(),
      region: region.trim(),
      department: department.trim(),
      complainant_name: complainantName.trim() || 'Hidden',
      complainant_phone: complainantPhone.trim() || 'Hidden',
      address: address.trim(),
    };

    try {
      if (editingComplaint) {
        const { error } = await dbClient.updatePmduComplaint(editingComplaint.id, payload);
        if (error) alert(error);
        else {
          setIsFormModalOpen(false);
          setEditingComplaint(null);
          fetchComplaints();
        }
      } else {
        const { error } = await dbClient.createPmduComplaint(payload);
        if (error) alert(error);
        else {
          setIsFormModalOpen(false);
          fetchComplaints();
        }
      }
    } catch (err: any) {
      alert(err.message || 'Failed to save complaint.');
    }
  };

  // Delete Complaint
  const handleDeleteComplaint = async (id: string, createdBy?: string) => {
    if (user?.role === 'employee' && createdBy && createdBy !== user.id) {
      alert('You do not have permission to delete complaints registered by other operators.');
      return;
    }
    if (confirm('Are you sure you want to delete this PMDU complaint record?')) {
      try {
        const { error } = await dbClient.deletePmduComplaint(id);
        if (error) alert(error);
        else {
          if (selectedComplaint?.id === id) setIsDetailModalOpen(false);
          fetchComplaints();
        }
      } catch (err: any) {
        alert(err.message || 'Failed to delete complaint.');
      }
    }
  };

  // Print single complaint dossier
  const handlePrintDossier = () => {
    window.print();
  };

  // Filtered Complaints
  const filteredComplaints = useMemo(() => {
    return complaints.filter(c => {
      const query = normalizeText(searchQuery);
      let matchesText = true;
      if (query) {
        matchesText = (
          normalizeText(c.complaint_id).includes(query) ||
          normalizeText(c.details).includes(query) ||
          normalizeText(c.feedback_statement).includes(query) ||
          normalizeText(c.complainant_name).includes(query) ||
          normalizeText(c.complainant_phone).includes(query) ||
          normalizeText(c.address).includes(query) ||
          normalizeText(c.department).includes(query) ||
          normalizeText(c.region).includes(query) ||
          normalizeText(c.close_option).includes(query)
        );
      }

      let matchesCloseOption = true;
      if (closeOptionFilter) {
        matchesCloseOption = c.close_option === closeOptionFilter;
      }

      let matchesDept = true;
      if (deptFilter) {
        matchesDept = c.department === deptFilter;
      }

      let matchesRegion = true;
      if (regionFilter) {
        matchesRegion = c.region === regionFilter;
      }

      let matchesDates = true;
      if (fromDate || toDate) {
        const recordTime = parseFlexibleDate(c.comp_date);
        if (recordTime > 0) {
          if (fromDate) {
            const fromTime = new Date(fromDate + 'T00:00:00').getTime();
            if (recordTime < fromTime) matchesDates = false;
          }
          if (toDate) {
            const toTime = new Date(toDate + 'T23:59:59').getTime();
            if (recordTime > toTime) matchesDates = false;
          }
        }
      }

      return matchesText && matchesCloseOption && matchesDept && matchesRegion && matchesDates;
    });
  }, [complaints, searchQuery, closeOptionFilter, deptFilter, regionFilter, fromDate, toDate]);

  // Reset pagination when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, closeOptionFilter, deptFilter, regionFilter, fromDate, toDate, itemsPerPage]);

  // Pagination Calculations
  const totalPages = Math.ceil(filteredComplaints.length / itemsPerPage) || 1;
  const paginatedComplaints = useMemo(() => {
    const startIdx = (currentPage - 1) * itemsPerPage;
    return filteredComplaints.slice(startIdx, startIdx + itemsPerPage);
  }, [filteredComplaints, currentPage, itemsPerPage]);

  // Unique dropdown values
  const uniqueCloseOptions = useMemo(() => Array.from(new Set(complaints.map(c => c.close_option).filter(Boolean))), [complaints]);
  const uniqueDepts = useMemo(() => Array.from(new Set(complaints.map(c => c.department).filter(Boolean))), [complaints]);
  const uniqueRegions = useMemo(() => Array.from(new Set(complaints.map(c => c.region).filter(Boolean))), [complaints]);

  // Metrics Calculations
  const totalCount = complaints.length;
  const reliefGrantedCount = complaints.filter(c => c.close_option === 'Relief Granted').length;
  const partialReliefCount = complaints.filter(c => c.close_option === 'Partial relief Granted').length;
  const noReliefCount = complaints.filter(c => c.close_option === 'Relief cannot be Granted').length;

  // Export to CSV
  const downloadCSV = () => {
    const headers = [
      'Complaint ID',
      'Complaint Date',
      'Close Option',
      'Department',
      'Region',
      'Complainant Name',
      'Complainant Phone',
      'Address',
      'Grievance Details',
      'Feedback Statement'
    ];

    const rows: string[][] = [headers];

    for (const c of filteredComplaints) {
      rows.push([
        c.complaint_id || '',
        c.comp_date || '',
        c.close_option || '',
        c.department || '',
        c.region || '',
        c.complainant_name || '',
        c.complainant_phone || '',
        c.address || '',
        c.details || '',
        c.feedback_statement || '',
      ]);
    }

    const escapeCSV = (val: string) =>
      val.includes(',') || val.includes('"') || val.includes('\n') || val.includes('\r')
        ? `"${val.replace(/"/g, '""')}"`
        : val;

    const csvContent = rows.map(r => r.map(v => escapeCSV(String(v || ''))).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `pmdu_complaints_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', paddingBottom: '60px' }}>
      
      {/* HEADER SECTION */}
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
            <span style={{
              background: '#ecfdf5',
              color: '#047857',
              fontSize: '11px',
              fontWeight: '800',
              padding: '3px 10px',
              borderRadius: '20px',
              border: '1px solid #a7f3d0',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px'
            }}>
              <Landmark className="w-3.5 h-3.5 text-emerald-600" />
              Prime Minister's Delivery Unit (PMDU)
            </span>
            <span style={{
              background: '#e0f2fe',
              color: '#0369a1',
              fontSize: '11px',
              fontWeight: '800',
              padding: '3px 10px',
              borderRadius: '20px',
              border: '1px solid #bae6fd'
            }}>
              Pakistan Citizen Portal (PCP)
            </span>
            <span style={{
              background: '#f8fafc',
              color: '#475569',
              fontSize: '11px',
              fontWeight: '700',
              padding: '3px 10px',
              borderRadius: '20px',
              border: '1px solid #e2e8f0'
            }}>
              Distribution-(UFGC) & Billing
            </span>
          </div>
          <h1 className="page-title" style={{ color: '#0f172a', fontWeight: '800', fontSize: '26px' }}>
            PMDU Complaints Console
          </h1>
          <p className="page-description" style={{ color: '#475569', fontWeight: '500', fontSize: '14px', marginTop: '4px' }}>
            Official Citizen Portal complaints list, pressure factor corrections, theft reports, relief telemetry & departmental feedback statements
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            onClick={() => fetchComplaints(true)}
            disabled={refreshing}
            className="btn btn-secondary"
            title="Refresh Complaints Data"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 14px', fontSize: '13px', fontWeight: '600' }}
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-emerald-600' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={downloadCSV}
            className="btn btn-secondary"
            title="Download CSV export"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 14px', fontSize: '13px', fontWeight: '600' }}
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>

          {user?.role !== 'lawyer' && (
            <button
              onClick={handleOpenAddModal}
              className="btn btn-primary"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 18px',
                fontSize: '13px',
                fontWeight: '700',
                background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                borderColor: '#065f46'
              }}
            >
              <Plus className="w-4 h-4" />
              <span>New PMDU Complaint</span>
            </button>
          )}
        </div>
      </div>

      {/* METRIC KPI SUMMARY CARDS */}
      <div className="metrics-grid" style={{ marginBottom: '28px' }}>
        {/* Card 1: Total PMDU */}
        <div
          className="glass-panel metric-card glass-panel-hover"
          style={{
            borderLeft: '4px solid #059669',
            background: 'linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(236,253,245,0.4) 100%)'
          }}
        >
          <div className="metric-header">
            <div>
              <span className="metric-title" style={{ color: '#065f46', fontWeight: '800' }}>Total PMDU Complaints</span>
              <div style={{ fontSize: '11px', color: '#047857', fontWeight: '600', marginTop: '2px' }}>Citizen Portal Registry</div>
            </div>
            <div className="metric-icon" style={{ background: 'rgba(5, 150, 105, 0.12)', color: '#059669' }}>
              <Landmark className="w-5 h-5" />
            </div>
          </div>
          <div className="metric-value" style={{ color: '#065f46' }}>{totalCount}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', fontSize: '12px', color: '#475569', fontWeight: '600' }}>
            <span>Verified PMDU Records</span>
          </div>
        </div>

        {/* Card 2: Relief Granted */}
        <div
          className="glass-panel metric-card glass-panel-hover"
          style={{
            borderLeft: '4px solid #10b981',
            background: 'linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(209,250,229,0.3) 100%)'
          }}
        >
          <div className="metric-header">
            <div>
              <span className="metric-title" style={{ color: '#047857', fontWeight: '800' }}>Relief Granted</span>
              <div style={{ fontSize: '11px', color: '#059669', fontWeight: '600', marginTop: '2px' }}>Full Redressal Provided</div>
            </div>
            <div className="metric-icon" style={{ background: '#ecfdf5', color: '#047857' }}>
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="metric-value" style={{ color: '#047857' }}>{reliefGrantedCount}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', fontSize: '12px', color: '#059669', fontWeight: '700' }}>
            <span>{totalCount > 0 ? ((reliefGrantedCount / totalCount) * 100).toFixed(1) : 0}% of complaints</span>
          </div>
        </div>

        {/* Card 3: Partial Relief Granted */}
        <div
          className="glass-panel metric-card glass-panel-hover"
          style={{
            borderLeft: '4px solid #f59e0b',
            background: 'linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(254,243,199,0.3) 100%)'
          }}
        >
          <div className="metric-header">
            <div>
              <span className="metric-title" style={{ color: '#b45309', fontWeight: '800' }}>Partial Relief Granted</span>
              <div style={{ fontSize: '11px', color: '#d97706', fontWeight: '600', marginTop: '2px' }}>Pressure / Bill Adjusted</div>
            </div>
            <div className="metric-icon" style={{ background: '#fffbeb', color: '#b45309' }}>
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="metric-value" style={{ color: '#b45309' }}>{partialReliefCount}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', fontSize: '12px', color: '#b45309', fontWeight: '700' }}>
            <span>{totalCount > 0 ? ((partialReliefCount / totalCount) * 100).toFixed(1) : 0}% of complaints</span>
          </div>
        </div>

        {/* Card 4: Relief cannot be Granted */}
        <div
          className="glass-panel metric-card glass-panel-hover"
          style={{
            borderLeft: '4px solid #ef4444',
            background: 'linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(254,226,226,0.3) 100%)'
          }}
        >
          <div className="metric-header">
            <div>
              <span className="metric-title" style={{ color: '#b91c1c', fontWeight: '800' }}>Relief Cannot Be Granted</span>
              <div style={{ fontSize: '11px', color: '#dc2626', fontWeight: '600', marginTop: '2px' }}>Policy Non-Compliant / Void</div>
            </div>
            <div className="metric-icon" style={{ background: '#fef2f2', color: '#b91c1c' }}>
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="metric-value" style={{ color: '#b91c1c' }}>{noReliefCount}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', fontSize: '12px', color: '#b91c1c', fontWeight: '700' }}>
            <span>{totalCount > 0 ? ((noReliefCount / totalCount) * 100).toFixed(1) : 0}% of complaints</span>
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH CONTROL PANEL */}
      <div className="glass-panel" style={{ padding: '20px 24px', marginBottom: '24px', background: '#ffffff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Search className="w-4 h-4 text-emerald-600" />
            <span style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a' }}>Search & Filter PMDU Complaints</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '13px', color: '#475569', fontWeight: '600' }}>
              Showing <strong style={{ color: '#047857' }}>{filteredComplaints.length}</strong> of {totalCount} records
            </span>
            {(searchQuery || closeOptionFilter || deptFilter || regionFilter || fromDate || toDate) && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setCloseOptionFilter('');
                  setDeptFilter('');
                  setRegionFilter('');
                  setFromDate('');
                  setToDate('');
                }}
                className="btn btn-secondary"
                style={{ padding: '4px 10px', fontSize: '11px', height: '28px', color: '#dc2626', borderColor: '#fca5a5', background: '#fef2f2', fontWeight: '700' }}
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '14px' }}>
          {/* Search Box */}
          <div style={{ gridColumn: 'span 2' }}>
            <label className="form-label" style={{ fontSize: '12px', fontWeight: '700', color: '#0f172a' }}>
              Search Keywords
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Search ID (e.g. PU290119), grievance details, citizen name, address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '34px', fontSize: '13px', height: '40px', color: '#0f172a', border: '1px solid #cbd5e1' }}
              />
              <Search className="w-4 h-4 text-slate-400" style={{ position: 'absolute', left: '10px', top: '12px' }} />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={{ position: 'absolute', right: '10px', top: '12px', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              )}
            </div>
          </div>

          {/* Close Option / Status Filter */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '12px', fontWeight: '700', color: '#0f172a' }}>
              Resolution Status
            </label>
            <select
              className="form-select"
              value={closeOptionFilter}
              onChange={(e) => setCloseOptionFilter(e.target.value)}
              style={{ fontSize: '13px', height: '40px', color: '#0f172a', border: '1px solid #cbd5e1' }}
            >
              <option value="">All Resolution Statuses</option>
              {uniqueCloseOptions.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>

          {/* Department Filter */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '12px', fontWeight: '700', color: '#0f172a' }}>
              Department
            </label>
            <select
              className="form-select"
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              style={{ fontSize: '13px', height: '40px', color: '#0f172a', border: '1px solid #cbd5e1' }}
            >
              <option value="">All Departments</option>
              {uniqueDepts.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* Region Filter */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '12px', fontWeight: '700', color: '#0f172a' }}>
              Region / Location
            </label>
            <select
              className="form-select"
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
              style={{ fontSize: '13px', height: '40px', color: '#0f172a', border: '1px solid #cbd5e1' }}
            >
              <option value="">All Regions</option>
              {uniqueRegions.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {/* Date Range: From */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '12px', fontWeight: '700', color: '#0f172a' }}>
              From Date
            </label>
            <input
              type="date"
              className="form-input"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              style={{ fontSize: '13px', height: '40px', color: '#0f172a', border: '1px solid #cbd5e1' }}
            />
          </div>

          {/* Date Range: To */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '12px', fontWeight: '700', color: '#0f172a' }}>
              To Date
            </label>
            <input
              type="date"
              className="form-input"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              style={{ fontSize: '13px', height: '40px', color: '#0f172a', border: '1px solid #cbd5e1' }}
            />
          </div>
        </div>
      </div>

      {/* DATA TABLE CONTAINER */}
      <div className="glass-panel" style={{ overflow: 'hidden', background: '#ffffff', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
        
        {/* Table Top Toolbar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '13px', fontWeight: '700', color: '#334155' }}>Rows per page:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
              className="form-select"
              style={{ width: '80px', padding: '4px 8px', fontSize: '12px', height: '32px', color: '#0f172a', border: '1px solid #cbd5e1' }}
            >
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>

          <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>
            Page <strong style={{ color: '#0f172a' }}>{currentPage}</strong> of <strong style={{ color: '#0f172a' }}>{totalPages}</strong>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '60px 20px', textAlign: 'center' }}>
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" style={{ margin: '0 auto 12px' }} />
            <p style={{ color: '#475569', fontSize: '14px', fontWeight: '600' }}>Loading official PMDU citizen portal complaints...</p>
          </div>
        ) : filteredComplaints.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center' }}>
            <Landmark className="w-12 h-12 text-slate-300" style={{ margin: '0 auto 12px' }} />
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>No PMDU Complaints Found</h3>
            <p style={{ color: '#64748b', fontSize: '13px', marginTop: '4px' }}>
              No complaints match your current filter parameters. Try clearing filters or search criteria.
            </p>
          </div>
        ) : (
          <div className="table-responsive" style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ padding: '12px 14px', textAlign: 'left', fontSize: '11px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Complaint ID</th>
                  <th style={{ padding: '12px 14px', textAlign: 'left', fontSize: '11px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date</th>
                  <th style={{ padding: '12px 14px', textAlign: 'left', fontSize: '11px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Complainant</th>
                  <th style={{ padding: '12px 14px', textAlign: 'left', fontSize: '11px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Address / Region</th>
                  <th style={{ padding: '12px 14px', textAlign: 'left', fontSize: '11px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Resolution Status</th>
                  <th style={{ padding: '12px 14px', textAlign: 'left', fontSize: '11px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', minWidth: '220px' }}>Grievance Details</th>
                  <th style={{ padding: '12px 14px', textAlign: 'center', fontSize: '11px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', width: '110px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedComplaints.map((c) => {
                  const statusStyle = CLOSE_OPTION_COLORS[c.close_option] || DEFAULT_STATUS_COLOR;
                  const canEdit = user?.role === 'executive' || user?.role === 'employee';

                  return (
                    <tr
                      key={c.id}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        transition: 'background 0.15s ease',
                      }}
                      className="hover:bg-slate-50/80"
                    >
                      {/* Complaint ID */}
                      <td style={{ padding: '12px 14px', verticalAlign: 'top' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{
                            fontFamily: 'monospace',
                            fontWeight: '800',
                            fontSize: '12.5px',
                            color: '#0f172a',
                            background: '#f1f5f9',
                            padding: '2px 6px',
                            borderRadius: '5px',
                            border: '1px solid #cbd5e1'
                          }}>
                            {c.complaint_id}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyId(c.complaint_id)}
                            title="Copy Complaint ID"
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: '#94a3b8' }}
                          >
                            {copiedId === c.complaint_id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                        <div style={{ fontSize: '11px', color: '#0369a1', fontWeight: '700', marginTop: '4px' }}>
                          {c.department || 'Distribution-(UFGC)'}
                        </div>
                      </td>

                      {/* Date */}
                      <td style={{ padding: '12px 14px', verticalAlign: 'top', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12.5px', fontWeight: '600', color: '#334155' }}>
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{c.comp_date || 'N/A'}</span>
                        </div>
                      </td>

                      {/* Complainant Name & Contact */}
                      <td style={{ padding: '12px 14px', verticalAlign: 'top' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span style={{
                            fontSize: '13px',
                            fontWeight: '700',
                            color: c.complainant_name === 'Hidden' ? '#64748b' : '#0f172a',
                            fontStyle: c.complainant_name === 'Hidden' ? 'italic' : 'normal'
                          }}>
                            {c.complainant_name || 'Hidden'}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11.5px', color: '#64748b', marginTop: '3px' }}>
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{c.complainant_phone || 'Hidden'}</span>
                        </div>
                      </td>

                      {/* Address / Region */}
                      <td style={{ padding: '12px 14px', verticalAlign: 'top' }}>
                        <div style={{ fontSize: '12.5px', color: '#334155', fontWeight: '500', maxWidth: '200px', lineHeight: '1.3' }}>
                          {c.address || 'Location Not Specified'}
                        </div>
                        <span style={{
                          display: 'inline-block',
                          fontSize: '10.5px',
                          fontWeight: '800',
                          color: '#0369a1',
                          background: '#e0f2fe',
                          padding: '1px 6px',
                          borderRadius: '4px',
                          border: '1px solid #bae6fd',
                          marginTop: '4px'
                        }}>
                          {c.region || 'FAISALABAD'}
                        </span>
                      </td>

                      {/* Close Option / Status */}
                      <td style={{ padding: '12px 14px', verticalAlign: 'top' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '3px 9px',
                          borderRadius: '20px',
                          fontSize: '11px',
                          fontWeight: '800',
                          background: statusStyle.bg,
                          color: statusStyle.color,
                          border: `1px solid ${statusStyle.border}`,
                          whiteSpace: 'nowrap'
                        }}>
                          {statusStyle.icon === 'check' && <CheckCircle2 className="w-3.5 h-3.5" />}
                          {statusStyle.icon === 'clock' && <Clock className="w-3.5 h-3.5" />}
                          {statusStyle.icon === 'alert' && <AlertTriangle className="w-3.5 h-3.5" />}
                          {statusStyle.icon === 'send' && <Send className="w-3.5 h-3.5" />}
                          <span>{c.close_option}</span>
                        </span>
                      </td>

                      {/* Grievance Details snippet */}
                      <td style={{ padding: '12px 14px', verticalAlign: 'top' }}>
                        <div
                          style={{
                            fontSize: '12px',
                            color: '#334155',
                            lineHeight: '1.4',
                            maxHeight: '48px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical'
                          }}
                          title={c.details}
                        >
                          {c.details}
                        </div>
                        {c.feedback_statement && (
                          <div style={{ fontSize: '11px', color: '#059669', fontWeight: '600', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Official feedback recorded</span>
                          </div>
                        )}
                      </td>

                      {/* Action Buttons */}
                      <td style={{ padding: '12px 14px', verticalAlign: 'top', textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                          <button
                            type="button"
                            onClick={() => handleOpenDetailModal(c)}
                            title="View Citizen Complaint Dossier"
                            className="btn btn-secondary"
                            style={{
                              padding: '5px 8px',
                              height: '30px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              border: '1px solid #cbd5e1',
                              color: '#0369a1',
                              fontWeight: '600'
                            }}
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {canEdit && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleOpenEditModal(c)}
                                title="Edit PMDU Complaint"
                                className="btn btn-secondary"
                                style={{
                                  padding: '5px 8px',
                                  height: '30px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  border: '1px solid #cbd5e1',
                                  color: '#047857'
                                }}
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>

                              {(user?.role === 'executive' || (user?.role === 'employee' && c.created_by === user.id)) && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteComplaint(c.id, c.created_by)}
                                  title="Delete Record"
                                  className="btn btn-danger"
                                  style={{
                                    padding: '5px 8px',
                                    height: '30px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    background: '#fee2e2',
                                    border: '1px solid #fca5a5',
                                    color: '#b91c1c'
                                  }}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
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

        {/* Table Bottom Pagination Bar */}
        {!loading && filteredComplaints.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderTop: '1px solid #e2e8f0', background: '#f8fafc', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ fontSize: '13px', color: '#475569', fontWeight: '500' }}>
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredComplaints.length)} of {filteredComplaints.length} entries
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                type="button"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="btn btn-secondary"
                style={{ padding: '6px 10px', fontSize: '12px', height: '32px' }}
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Prev</span>
              </button>

              {/* Page Number Indicators */}
              <div style={{ display: 'flex', gap: '4px' }}>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let pageNum = i + 1;
                  if (totalPages > 5 && currentPage > 3) {
                    pageNum = currentPage - 2 + i;
                    if (pageNum > totalPages) pageNum = totalPages - 4 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => setCurrentPage(pageNum)}
                      className={`btn ${currentPage === pageNum ? 'btn-primary' : 'btn-secondary'}`}
                      style={{
                        padding: '4px 10px',
                        fontSize: '12px',
                        minWidth: '32px',
                        height: '32px',
                        fontWeight: '700',
                        background: currentPage === pageNum ? '#059669' : undefined,
                        borderColor: currentPage === pageNum ? '#047857' : undefined
                      }}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="btn btn-secondary"
                style={{ padding: '6px 10px', fontSize: '12px', height: '32px' }}
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ===================== VIEW DOSSIER MODAL ===================== */}
      {isDetailModalOpen && selectedComplaint && (
        <div className="modal-overlay animate-fade-in" onClick={() => setIsDetailModalOpen(false)}>
          <div
            className="glass-panel modal-content animate-scale-in"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              maxWidth: '750px',
              width: '100%',
              borderRadius: '16px',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '28px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)'
            }}
          >
            <button
              className="modal-close"
              onClick={() => setIsDetailModalOpen(false)}
              style={{ color: '#334155', position: 'absolute', top: '20px', right: '20px', background: '#f1f5f9', border: 'none', borderRadius: '8px', padding: '6px', cursor: 'pointer' }}
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="modal-header" style={{ marginBottom: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <span style={{
                  background: '#e0f2fe',
                  color: '#0369a1',
                  fontSize: '11px',
                  fontWeight: '800',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  border: '1px solid #bae6fd',
                  letterSpacing: '0.04em'
                }}>
                  Complaint ID: {selectedComplaint.complaint_id}
                </span>
                <span style={{
                  fontSize: '11px',
                  fontWeight: '800',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  ...(CLOSE_OPTION_COLORS[selectedComplaint.close_option] || DEFAULT_STATUS_COLOR)
                }}>
                  {selectedComplaint.close_option}
                </span>
              </div>
              <h2 style={{ color: '#0f172a', fontWeight: '800', fontSize: '20px' }}>
                PMDU Citizen Grievance Dossier
              </h2>
              <p style={{ color: '#64748b', fontSize: '13px', marginTop: '2px', fontWeight: '500' }}>
                Official Pakistan Citizen Portal verification and departmental response
              </p>
            </div>

            {/* Particulars Grid */}
            <div className="modal-grid-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '20px' }}>
              <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Complaint Date</div>
                <div style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', marginTop: '2px' }}>
                  {selectedComplaint.comp_date || 'N/A'}
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Department &amp; Region</div>
                <div style={{ fontSize: '14px', fontWeight: '800', color: '#0284c7', marginTop: '2px' }}>
                  {selectedComplaint.department || 'Distribution-(UFGC)'} &bull; {selectedComplaint.region || 'FAISALABAD'}
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Complainant Name</div>
                <div style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', marginTop: '2px' }}>
                  {selectedComplaint.complainant_name || 'Hidden'}
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Contact Number</div>
                <div style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', marginTop: '2px' }}>
                  {selectedComplaint.complainant_phone && selectedComplaint.complainant_phone !== 'Hidden' ? (
                    <a href={`tel:${selectedComplaint.complainant_phone}`} style={{ color: '#0284c7', textDecoration: 'none' }}>
                      {selectedComplaint.complainant_phone}
                    </a>
                  ) : 'Hidden'}
                </div>
              </div>
            </div>

            {/* Address */}
            <div style={{ background: '#f8fafc', padding: '14px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>
                Premises Address / Location
              </div>
              <div style={{ fontSize: '13.5px', color: '#1e293b', lineHeight: '1.4', fontWeight: '500' }}>
                {selectedComplaint.address || 'Address not specified'}
              </div>
            </div>

            {/* Grievance Statement */}
            <div style={{ background: '#f1f5f9', padding: '14px 16px', borderRadius: '10px', border: '1px solid #cbd5e1', marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FileText className="w-3.5 h-3.5 text-emerald-600" />
                Citizen Grievance &amp; Issue Description
              </div>
              <div style={{ fontSize: '13.5px', color: '#1e293b', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                {selectedComplaint.details}
              </div>
            </div>

            {/* Feedback Statement */}
            <div style={{ background: '#ecfdf5', padding: '16px', borderRadius: '10px', border: '1px solid #a7f3d0', marginBottom: '20px' }}>
              <div style={{ fontSize: '11px', fontWeight: '700', color: '#065f46', textTransform: 'uppercase', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Official Departmental Resolution &amp; Feedback Statement
              </div>
              <div style={{ fontSize: '13.5px', color: '#065f46', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                {selectedComplaint.feedback_statement || 'No feedback statement recorded.'}
              </div>

              {/* Guidelines links */}
              <div style={{ display: 'flex', gap: '14px', marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #a7f3d0', flexWrap: 'wrap' }}>
                <a
                  href="http://pmdu.pmo.gov.pk/guideline/manual/PCP-user-manual-urdu.pdf"
                  target="_blank"
                  rel="noreferrer"
                  style={{ fontSize: '12px', color: '#047857', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}
                >
                  Urdu Guidelines Manual <ExternalLink className="w-3 h-3" />
                </a>
                <a
                  href="http://pmdu.pmo.gov.pk/guideline/manual/PCP-user-manual-english.pdf"
                  target="_blank"
                  rel="noreferrer"
                  style={{ fontSize: '12px', color: '#0369a1', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}
                >
                  English Guidelines Manual <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="modal-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', borderTop: '1px solid #e2e8f0', paddingTop: '18px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={handlePrintDossier}
                  className="btn btn-secondary"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', padding: '8px 14px' }}
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Dossier</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleCopyId(selectedComplaint.complaint_id)}
                  className="btn btn-secondary"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', padding: '8px 14px' }}
                >
                  <Copy className="w-4 h-4" />
                  <span>{copiedId === selectedComplaint.complaint_id ? 'Copied!' : 'Copy ID'}</span>
                </button>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                {user?.role !== 'lawyer' && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsDetailModalOpen(false);
                      handleOpenEditModal(selectedComplaint);
                    }}
                    className="btn btn-secondary"
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', padding: '8px 16px', color: '#047857', borderColor: '#a7f3d0' }}
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>Edit Record</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsDetailModalOpen(false)}
                  className="btn btn-primary"
                  style={{ padding: '8px 20px', fontSize: '13px' }}
                >
                  Close
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ===================== REGISTER / EDIT MODAL ===================== */}
      {isFormModalOpen && (
        <div className="modal-overlay animate-fade-in" onClick={() => setIsFormModalOpen(false)}>
          <div
            className="glass-panel modal-content animate-scale-in"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              maxWidth: '780px',
              width: '100%',
              borderRadius: '16px',
              maxHeight: '92vh',
              overflowY: 'auto',
              padding: '28px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)'
            }}
          >
            <button
              className="modal-close"
              onClick={() => setIsFormModalOpen(false)}
              style={{ color: '#334155', position: 'absolute', top: '20px', right: '20px', background: '#f1f5f9', border: 'none', borderRadius: '8px', padding: '6px', cursor: 'pointer' }}
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="modal-header" style={{ marginBottom: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{ background: '#ecfdf5', color: '#047857', fontSize: '11px', fontWeight: '800', padding: '2px 8px', borderRadius: '12px', border: '1px solid #a7f3d0' }}>
                  PMDU Console
                </span>
                <span style={{ background: '#e0f2fe', color: '#0369a1', fontSize: '11px', fontWeight: '800', padding: '2px 8px', borderRadius: '12px', border: '1px solid #bae6fd' }}>
                  PCP Portal
                </span>
              </div>
              <h2 style={{ color: '#0f172a', fontWeight: '800', fontSize: '20px' }}>
                {editingComplaint ? 'Edit PMDU Complaint Record' : 'Register PMDU Citizen Complaint'}
              </h2>
              <p style={{ color: '#64748b', fontSize: '13px', marginTop: '2px', fontWeight: '500' }}>
                Enter grievance details, citizen particulars, and departmental feedback statement.
              </p>
            </div>

            <form onSubmit={handleSaveComplaint}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                
                {/* SECTION 1: Case Identification */}
                <div style={{ fontSize: '12px', fontWeight: '800', color: '#0369a1', textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: '1px solid #f1f5f9', paddingBottom: '4px' }}>
                  1. Complaint Identification
                </div>

                <div className="modal-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  {/* Complaint ID */}
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ color: '#0f172a', fontWeight: '700', fontSize: '13px' }}>
                      Complaint ID (PU-XXXXX) *
                    </label>
                    <input
                      type="text"
                      required
                      className="form-input"
                      placeholder="e.g. PU290119-1244234"
                      value={complaintId}
                      onChange={e => setComplaintId(e.target.value)}
                      style={{ color: '#0f172a', border: '1px solid #cbd5e1', fontWeight: '700', fontFamily: 'monospace' }}
                    />
                  </div>

                  {/* Complaint Date */}
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ color: '#0f172a', fontWeight: '700', fontSize: '13px' }}>
                      Complaint Date *
                    </label>
                    <input
                      type="text"
                      required
                      className="form-input"
                      placeholder="e.g. 29/01/2019"
                      value={compDate}
                      onChange={e => setCompDate(e.target.value)}
                      style={{ color: '#0f172a', border: '1px solid #cbd5e1', fontWeight: '500' }}
                    />
                  </div>
                </div>

                <div className="modal-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  {/* Department */}
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ color: '#0f172a', fontWeight: '700', fontSize: '13px' }}>
                      Department *
                    </label>
                    <input
                      type="text"
                      required
                      className="form-input"
                      placeholder="e.g. Distribution-(UFGC)"
                      value={department}
                      onChange={e => setDepartment(e.target.value)}
                      style={{ color: '#0f172a', border: '1px solid #cbd5e1', fontWeight: '500' }}
                    />
                  </div>

                  {/* Region */}
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ color: '#0f172a', fontWeight: '700', fontSize: '13px' }}>
                      Region / Location *
                    </label>
                    <input
                      type="text"
                      required
                      className="form-input"
                      placeholder="e.g. FAISALABAD"
                      value={region}
                      onChange={e => setRegion(e.target.value)}
                      style={{ color: '#0f172a', border: '1px solid #cbd5e1', fontWeight: '500' }}
                    />
                  </div>
                </div>

                {/* SECTION 2: Citizen Particulars */}
                <div style={{ fontSize: '12px', fontWeight: '800', color: '#0369a1', textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: '1px solid #f1f5f9', paddingBottom: '4px', marginTop: '6px' }}>
                  2. Citizen Particulars
                </div>

                <div className="modal-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  {/* Complainant Name */}
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ color: '#0f172a', fontWeight: '700', fontSize: '13px' }}>
                      Complainant Name
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Citizen name or 'Hidden'"
                      value={complainantName}
                      onChange={e => setComplainantName(e.target.value)}
                      style={{ color: '#0f172a', border: '1px solid #cbd5e1', fontWeight: '500' }}
                    />
                  </div>

                  {/* Complainant Phone */}
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ color: '#0f172a', fontWeight: '700', fontSize: '13px' }}>
                      Contact Number
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. 923117520812 or 'Hidden'"
                      value={complainantPhone}
                      onChange={e => setComplainantPhone(e.target.value)}
                      style={{ color: '#0f172a', border: '1px solid #cbd5e1', fontWeight: '500' }}
                    />
                  </div>
                </div>

                {/* Address */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ color: '#0f172a', fontWeight: '700', fontSize: '13px' }}>
                    Citizen Address / Premises Location
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Full street address, house number, area..."
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    style={{ color: '#0f172a', border: '1px solid #cbd5e1', fontWeight: '500' }}
                  />
                </div>

                {/* SECTION 3: Grievance Details */}
                <div style={{ fontSize: '12px', fontWeight: '800', color: '#0369a1', textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: '1px solid #f1f5f9', paddingBottom: '4px', marginTop: '6px' }}>
                  3. Citizen Grievance &amp; Issue Details
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ color: '#0f172a', fontWeight: '700', fontSize: '13px' }}>
                    Grievance Description *
                  </label>
                  <textarea
                    required
                    rows={3}
                    className="form-textarea"
                    placeholder="Enter full complaint details, consumer number, pressure issue, or theft report..."
                    value={details}
                    onChange={e => setDetails(e.target.value)}
                    style={{ color: '#0f172a', border: '1px solid #cbd5e1', fontWeight: '500', resize: 'vertical' }}
                  />
                </div>

                {/* SECTION 4: Resolution & Feedback */}
                <div style={{ fontSize: '12px', fontWeight: '800', color: '#0369a1', textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: '1px solid #f1f5f9', paddingBottom: '4px', marginTop: '6px' }}>
                  4. Redressal &amp; Department Response
                </div>

                {/* Resolution Status Dropdown */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ color: '#0f172a', fontWeight: '700', fontSize: '13px' }}>
                    Resolution Status (Close Option) *
                  </label>
                  <select
                    className="form-select"
                    value={closeOption}
                    onChange={e => setCloseOption(e.target.value)}
                    style={{ color: '#0f172a', border: '1px solid #cbd5e1', fontWeight: '700' }}
                  >
                    <option value="Relief Granted">Relief Granted</option>
                    <option value="Partial relief Granted">Partial relief Granted</option>
                    <option value="Relief cannot be Granted">Relief cannot be Granted</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Pending">Pending</option>
                  </select>
                </div>

                {/* Feedback Statement */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ color: '#0f172a', fontWeight: '700', fontSize: '13px' }}>
                    Official Feedback &amp; Resolution Statement
                  </label>
                  <textarea
                    rows={4}
                    className="form-textarea"
                    placeholder="Enter official departmental findings, site inspection results, pressure reading, and actions taken..."
                    value={feedbackStatement}
                    onChange={e => setFeedbackStatement(e.target.value)}
                    style={{ color: '#0f172a', border: '1px solid #cbd5e1', fontWeight: '500', resize: 'vertical' }}
                  />
                </div>

              </div>

              {/* Modal Actions */}
              <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="btn btn-secondary"
                  style={{ padding: '8px 18px', fontSize: '13px', fontWeight: '600' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{
                    padding: '8px 22px',
                    fontSize: '13px',
                    fontWeight: '700',
                    background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                    borderColor: '#065f46',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  {editingComplaint ? <CheckCircle2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  <span>{editingComplaint ? 'Update PMDU Complaint' : 'Register PMDU Complaint'}</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
