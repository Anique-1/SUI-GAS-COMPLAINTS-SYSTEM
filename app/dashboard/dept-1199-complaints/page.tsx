'use client';

import { useEffect, useState } from 'react';
import { useUser } from '../layout';
import { dbClient, Dept1199Complaint } from '@/lib/db';
import {
  Plus,
  Search,
  Trash2,
  X,
  Eye,
  Loader2,
  Edit3,
  Download,
  PhoneCall,
  CheckCircle2,
  Clock,
  Send,
  MapPin,
  FileSpreadsheet,
  RefreshCw,
  Phone,
  User,
  Hash,
  Calendar,
  AlertTriangle,
  Building,
  Info
} from 'lucide-react';

const NATURE_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  'Theft - Compressor Use': { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
  'Theft - Illegal Extension': { bg: '#fff7ed', color: '#c2410c', border: '#ffedd5' },
  'Theft - Fake Line': { bg: '#faf5ff', color: '#7e22ce', border: '#f3e8ff' },
  'Theft - Commercial Use': { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
  'Theft - Direct Use /By pass': { bg: '#fdf2f8', color: '#be185d', border: '#fbcfe8' },
  'Theft - Illegal Shifting': { bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' },
};

const DEFAULT_NATURE_COLOR = { bg: '#f1f5f9', color: '#475569', border: '#e2e8f0' };

const STATUS_COLORS: Record<string, { bg: string; color: string; border: string; icon: string }> = {
  'Close Resolved': { bg: '#ecfdf5', color: '#047857', border: '#a7f3d0', icon: 'check' },
  'Referred to Operations Department': { bg: '#eff6ff', color: '#0369a1', border: '#bae6fd', icon: 'send' },
  'In Progress': { bg: '#fffbeb', color: '#b45309', border: '#fde68a', icon: 'clock' },
  'Pending': { bg: '#fef2f2', color: '#b91c1c', border: '#fecaca', icon: 'alert' },
};

const normalizeText = (str: string | undefined | null) =>
  str ? str.toLowerCase().replace(/[\u2013\u2014-]/g, '-').replace(/\s+/g, ' ').trim() : '';

export default function Dept1199ComplaintsPage() {
  const { user } = useUser();
  const [complaints, setComplaints] = useState<Dept1199Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [natureFilter, setNatureFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modal States
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [editingComplaint, setEditingComplaint] = useState<Dept1199Complaint | null>(null);
  const [selectedComplaint, setSelectedComplaint] = useState<Dept1199Complaint | null>(null);

  // Form Fields (WITHOUT serial number)
  const [complaintDate, setComplaintDate] = useState('');
  const [acctId, setAcctId] = useState('');
  const [caseId, setCaseId] = useState('');
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [contactNo, setContactNo] = useState('');
  const [caseRemarks, setCaseRemarks] = useState('');
  const [nature, setNature] = useState('Theft - Compressor Use');
  const [customNature, setCustomNature] = useState('');
  const [finalStatus, setFinalStatus] = useState('Close Resolved');
  const [region, setRegion] = useState('Faisalabad');
  const [managementGroup, setManagementGroup] = useState('Faisalabad - Main');
  const [faId, setFaId] = useState('');
  const [priority, setPriority] = useState('Normal');
  const [gps, setGps] = useState('');
  const [loggedBy, setLoggedBy] = useState('');
  const [closedBy, setClosedBy] = useState('');

  const fetchComplaints = async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) setRefreshing(true);
      else setLoading(true);

      const data = await dbClient.getDept1199Complaints();
      setComplaints(data);
    } catch (err) {
      console.error('Failed to fetch 1199 complaints', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  // Open Add Modal
  const handleOpenAddModal = () => {
    setEditingComplaint(null);
    const now = new Date();
    const formattedDate = `${now.getMonth() + 1}/${now.getDate()}/${now.getFullYear()} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
    setComplaintDate(formattedDate);
    setAcctId('');
    setCaseId('');
    setName('');
    setAddress('');
    setContactNo('');
    setCaseRemarks('');
    setNature('Theft - Compressor Use');
    setCustomNature('');
    setFinalStatus('Close Resolved');
    setRegion('Faisalabad');
    setManagementGroup('Faisalabad - Main');
    setFaId('');
    setPriority('Normal');
    setGps('');
    setLoggedBy(user?.role_id || user?.name || '');
    setClosedBy('');
    setIsFormModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (c: Dept1199Complaint) => {
    setEditingComplaint(c);
    setComplaintDate(c.complaint_date || '');
    setAcctId(c.acct_id || '');
    setCaseId(c.case_id || '');
    setName(c.name || '');
    setAddress(c.address || '');
    setContactNo(c.contact_no || '');
    setCaseRemarks(c.case_remarks || '');
    
    if (Object.keys(NATURE_COLORS).includes(c.nature)) {
      setNature(c.nature);
      setCustomNature('');
    } else {
      setNature('Custom');
      setCustomNature(c.nature || '');
    }

    setFinalStatus(c.final_status || 'In Progress');
    setRegion(c.region || 'Faisalabad');
    setManagementGroup(c.management_group || '');
    setFaId(c.fa_id || '');
    setPriority(c.priority || 'Normal');
    setGps(c.gps || '');
    setLoggedBy(c.logged_by || '');
    setClosedBy(c.closed_by || '');
    setIsFormModalOpen(true);
  };

  // Open Details Modal
  const handleOpenDetailModal = (c: Dept1199Complaint) => {
    setSelectedComplaint(c);
    setIsDetailModalOpen(true);
  };

  // Save Complaint (Add / Edit)
  const handleSaveComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    const selectedNatureFinal = nature === 'Custom' ? customNature.trim() : nature;

    if (!complaintDate || !acctId || !caseId || !name || !address || !selectedNatureFinal) {
      alert('Please fill all mandatory fields: Complaint Date, Acct ID, Case ID, Name, Address, and Nature.');
      return;
    }

    const payload = {
      complaint_date: complaintDate,
      acct_id: acctId,
      case_id: caseId,
      name,
      address,
      contact_no: contactNo,
      case_remarks: caseRemarks,
      nature: selectedNatureFinal,
      final_status: finalStatus,
      region,
      management_group: managementGroup,
      fa_id: faId,
      priority,
      gps,
      logged_by: loggedBy,
      closed_by: closedBy,
    };

    try {
      if (editingComplaint) {
        const { error } = await dbClient.updateDept1199Complaint(editingComplaint.id, payload);
        if (error) alert(error);
        else {
          setIsFormModalOpen(false);
          setEditingComplaint(null);
          fetchComplaints();
        }
      } else {
        const { error } = await dbClient.createDept1199Complaint(payload);
        if (error) alert(error);
        else {
          setIsFormModalOpen(false);
          fetchComplaints();
        }
      }
    } catch (err: any) {
      alert(err.message || 'Operation failed.');
    }
  };

  // Delete Complaint
  const handleDeleteComplaint = async (id: string, createdBy?: string) => {
    if (user?.role === 'employee' && createdBy && createdBy !== user.id) {
      alert('You do not have permission to delete complaints created by other users.');
      return;
    }
    if (confirm('Are you sure you want to delete this 1199 complaint record?')) {
      try {
        const { error } = await dbClient.deleteDept1199Complaint(id);
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

  // Filtering
  const filteredComplaints = complaints.filter(c => {
    const query = normalizeText(searchQuery);
    let matchesText = true;
    if (query) {
      matchesText = (
        normalizeText(c.acct_id).includes(query) ||
        normalizeText(c.case_id).includes(query) ||
        normalizeText(c.name).includes(query) ||
        normalizeText(c.address).includes(query) ||
        normalizeText(c.contact_no).includes(query) ||
        normalizeText(c.nature).includes(query) ||
        normalizeText(c.case_remarks).includes(query) ||
        normalizeText(c.final_status).includes(query) ||
        normalizeText(c.region).includes(query) ||
        normalizeText(c.management_group).includes(query)
      );
    }

    let matchesDates = true;
    if ((fromDate || toDate) && c.complaint_date) {
      const parsedDate = new Date(c.complaint_date);
      if (!isNaN(parsedDate.getTime())) {
        if (fromDate) {
          const from = new Date(fromDate + 'T00:00:00');
          if (parsedDate < from) matchesDates = false;
        }
        if (toDate) {
          const to = new Date(toDate + 'T23:59:59');
          if (parsedDate > to) matchesDates = false;
        }
      }
    }

    let matchesNature = true;
    if (natureFilter) {
      matchesNature = c.nature === natureFilter;
    }

    let matchesStatus = true;
    if (statusFilter) {
      matchesStatus = c.final_status === statusFilter;
    }

    return matchesText && matchesDates && matchesNature && matchesStatus;
  });

  // Unique list of natures for filter dropdown
  const uniqueNatures = Array.from(new Set(complaints.map(c => c.nature).filter(Boolean)));
  const uniqueStatuses = Array.from(new Set(complaints.map(c => c.final_status).filter(Boolean)));

  // Analytics counts
  const totalCount = complaints.length;
  const resolvedCount = complaints.filter(c => c.final_status === 'Close Resolved').length;
  const referredOpsCount = complaints.filter(c => c.final_status === 'Referred to Operations Department').length;
  const inProgressCount = complaints.filter(c => c.final_status !== 'Close Resolved' && c.final_status !== 'Referred to Operations Department').length;

  // Export to CSV
  const downloadCSV = () => {
    const headers = [
      'Complaint Date',
      'Acct ID',
      'Case ID',
      'Name',
      'Address',
      'Contact No.',
      'Case Remarks',
      'Nature',
      'Final Status',
      'Region',
      'Management Group',
      'FA ID',
      'Priority',
      'GPS',
      'Logged By',
      'Closed By'
    ];

    const rows: string[][] = [headers];

    for (const c of filteredComplaints) {
      rows.push([
        c.complaint_date || '',
        c.acct_id || '',
        c.case_id || '',
        c.name || '',
        c.address || '',
        c.contact_no || '',
        c.case_remarks || '',
        c.nature || '',
        c.final_status || '',
        c.region || '',
        c.management_group || '',
        c.fa_id || '',
        c.priority || '',
        c.gps || '',
        c.logged_by || '',
        c.closed_by || '',
      ]);
    }

    const escapeCSV = (val: string) =>
      val.includes(',') || val.includes('"') || val.includes('\n')
        ? `"${val.replace(/"/g, '""')}"`
        : val;

    const csvContent = rows.map(r => r.map(v => escapeCSV(String(v || ''))).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `1199_dept_complaints_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', paddingBottom: '60px' }}>
      {/* HEADER SECTION */}
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <span style={{
              background: '#e0f2fe',
              color: '#0369a1',
              fontSize: '11px',
              fontWeight: '800',
              padding: '3px 10px',
              borderRadius: '20px',
              border: '1px solid #bae6fd',
              letterSpacing: '0.05em',
              textTransform: 'uppercase'
            }}>
              Department Complaints Console
            </span>
            <span style={{
              background: '#fee2e2',
              color: '#dc2626',
              fontSize: '11px',
              fontWeight: '800',
              padding: '3px 10px',
              borderRadius: '20px',
              border: '1px solid #fecaca'
            }}>
              1199 Hotline Registry
            </span>
          </div>
          <h1 className="page-title" style={{ color: '#0f172a', fontWeight: '800', fontSize: '26px' }}>
            1199 Complaints Department
          </h1>
          <p className="page-description" style={{ color: '#475569', fontWeight: '500', fontSize: '14px', marginTop: '4px' }}>
            Official customer complaint records, theft telemetry, compressor usage violations & operational resolution status
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            onClick={() => fetchComplaints(true)}
            disabled={refreshing}
            className="btn btn-secondary"
            style={{ padding: '10px 14px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
            title="Reload data from database"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-sky-600' : ''}`} />
            <span>{refreshing ? 'Syncing...' : 'Sync'}</span>
          </button>

          <button
            onClick={downloadCSV}
            className="btn btn-secondary"
            style={{ padding: '10px 16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', background: '#f8fafc', borderColor: '#cbd5e1' }}
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Export CSV</span>
          </button>

          {user?.role !== 'lawyer' && (
            <button
              onClick={handleOpenAddModal}
              className="btn btn-primary"
              style={{ padding: '10px 18px', fontSize: '13px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px', background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)' }}
            >
              <Plus className="w-4 h-4" />
              <span>Log 1199 Complaint</span>
            </button>
          )}
        </div>
      </div>

      {/* SUMMARY METRIC CARDS */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px',
        marginBottom: '28px'
      }}>
        <div className="glass-panel" style={{ padding: '18px 20px', borderLeft: '4px solid #0284c7', background: '#ffffff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Total 1199 Complaints
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284c7' }}>
              <PhoneCall className="w-4 h-4" />
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: '800', color: '#0f172a' }}>{totalCount}</div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Active database records</div>
        </div>

        <div className="glass-panel" style={{ padding: '18px 20px', borderLeft: '4px solid #10b981', background: '#ffffff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: '#047857', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Close Resolved
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669' }}>
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: '800', color: '#047857' }}>{resolvedCount}</div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>{totalCount > 0 ? `${Math.round((resolvedCount / totalCount) * 100)}% resolved` : '0%'}</div>
        </div>

        <div className="glass-panel" style={{ padding: '18px 20px', borderLeft: '4px solid #0284c7', background: '#ffffff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: '#0369a1', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Referred Operations
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284c7' }}>
              <Send className="w-4 h-4" />
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: '800', color: '#0369a1' }}>{referredOpsCount}</div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Dispatched to OPS / MET</div>
        </div>

        <div className="glass-panel" style={{ padding: '18px 20px', borderLeft: '4px solid #f59e0b', background: '#ffffff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: '#b45309', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              In Progress / Pending
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706' }}>
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: '800', color: '#b45309' }}>{inProgressCount}</div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Under investigation</div>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div
        className="glass-panel filter-bar"
        style={{
          padding: '16px 20px',
          marginBottom: '24px',
          display: 'flex',
          gap: '14px',
          flexWrap: 'wrap',
          alignItems: 'center',
          background: '#ffffff',
          border: '1px solid #cbd5e1',
          borderRadius: '12px',
          boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
        }}
      >
        {/* Main Search Input */}
        <div style={{ display: 'flex', flexGrow: 1, minWidth: '260px', position: 'relative' }}>
          <Search className="w-4 h-4" style={{ position: 'absolute', left: '14px', top: '13px', color: '#64748b' }} />
          <input
            type="text"
            className="form-input"
            placeholder="Search by Acct ID, Case ID, Name, Address, Contact No, Remarks..."
            style={{
              paddingLeft: '40px',
              height: '40px',
              fontSize: '13px',
              color: '#0f172a',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              fontWeight: '500',
              width: '100%'
            }}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{ position: 'absolute', right: '10px', top: '12px', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Nature Dropdown Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '12px', color: '#475569', fontWeight: '700', whiteSpace: 'nowrap' }}>Nature:</span>
          <select
            className="form-input"
            style={{ height: '40px', fontSize: '13px', color: '#0f172a', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '6px 12px', fontWeight: '500', minWidth: '170px' }}
            value={natureFilter}
            onChange={e => setNatureFilter(e.target.value)}
          >
            <option value="">All Natures ({complaints.length})</option>
            {uniqueNatures.map(nat => (
              <option key={nat} value={nat}>
                {nat} ({complaints.filter(c => c.nature === nat).length})
              </option>
            ))}
          </select>
        </div>

        {/* Status Dropdown Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '12px', color: '#475569', fontWeight: '700', whiteSpace: 'nowrap' }}>Status:</span>
          <select
            className="form-input"
            style={{ height: '40px', fontSize: '13px', color: '#0f172a', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '6px 12px', fontWeight: '500', minWidth: '150px' }}
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            {uniqueStatuses.map(st => (
              <option key={st} value={st}>
                {st} ({complaints.filter(c => c.final_status === st).length})
              </option>
            ))}
          </select>
        </div>

        {/* Date Filter */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '12px', color: '#475569', fontWeight: '700' }}>From:</span>
            <input
              type="date"
              className="form-input"
              style={{ width: '130px', padding: '6px 8px', fontSize: '12.5px', height: '40px', color: '#0f172a', border: '1px solid #cbd5e1', borderRadius: '8px' }}
              value={fromDate}
              onChange={e => setFromDate(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '12px', color: '#475569', fontWeight: '700' }}>To:</span>
            <input
              type="date"
              className="form-input"
              style={{ width: '130px', padding: '6px 8px', fontSize: '12.5px', height: '40px', color: '#0f172a', border: '1px solid #cbd5e1', borderRadius: '8px' }}
              value={toDate}
              onChange={e => setToDate(e.target.value)}
            />
          </div>
          {(fromDate || toDate || natureFilter || statusFilter || searchQuery) && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setFromDate('');
                setToDate('');
                setNatureFilter('');
                setStatusFilter('');
              }}
              style={{
                background: '#f1f5f9',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                color: '#0284c7',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer',
                padding: '9px 12px',
                whiteSpace: 'nowrap'
              }}
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* COMPLAINTS DATA TABLE (NO SERIAL NUMBER) */}
      <div className="glass-panel" style={{ background: '#ffffff', borderRadius: '12px', overflow: 'hidden', border: '1px solid #cbd5e1', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileSpreadsheet className="w-4 h-4 text-sky-600" />
            <span style={{ fontSize: '14px', fontWeight: '800', color: '#1e293b' }}>
              Complaints Registry Records
            </span>
            <span style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', background: '#e2e8f0', padding: '2px 8px', borderRadius: '12px' }}>
              Showing {filteredComplaints.length} of {complaints.length}
            </span>
          </div>

          <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>
            Sorted by most recent
          </span>
        </div>

        {loading ? (
          <div style={{ padding: '60px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
            <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
            <span style={{ fontSize: '14px', color: '#64748b', fontWeight: '600' }}>Loading 1199 complaints data...</span>
          </div>
        ) : filteredComplaints.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', color: '#64748b' }}>
              <Info className="w-6 h-6" />
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b', marginBottom: '6px' }}>No complaints found</h3>
            <p style={{ fontSize: '13px', color: '#64748b', maxWidth: '400px', margin: '0 auto 16px' }}>
              No 1199 complaint records matched your search or filters. Try adjusting your search keywords or clearing filters.
            </p>
            {(searchQuery || fromDate || toDate || natureFilter || statusFilter) && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setFromDate('');
                  setToDate('');
                  setNatureFilter('');
                  setStatusFilter('');
                }}
                className="btn btn-secondary"
                style={{ fontSize: '13px', padding: '8px 16px' }}
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #e2e8f0', color: '#334155', fontWeight: '700' }}>
                  {/* NO SERIAL NUMBER HEADER */}
                  <th style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>Complaint Date</th>
                  <th style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>Acct ID</th>
                  <th style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>Case ID</th>
                  <th style={{ padding: '12px 14px', minWidth: '180px' }}>Name</th>
                  <th style={{ padding: '12px 14px', minWidth: '220px' }}>Address</th>
                  <th style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>Contact No.</th>
                  <th style={{ padding: '12px 14px', minWidth: '200px' }}>Case Remarks</th>
                  <th style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>Nature</th>
                  <th style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>Final Status</th>
                  <th style={{ padding: '12px 14px', textAlign: 'center', width: '100px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredComplaints.map((c, idx) => {
                  const natureStyle = NATURE_COLORS[c.nature] || DEFAULT_NATURE_COLOR;
                  const statusStyle = STATUS_COLORS[c.final_status] || {
                    bg: '#f1f5f9',
                    color: '#475569',
                    border: '#cbd5e1',
                    icon: 'clock'
                  };

                  return (
                    <tr
                      key={c.id || idx}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        transition: 'background-color 0.15s ease',
                      }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f8fafc'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      {/* Complaint Date */}
                      <td style={{ padding: '12px 14px', whiteSpace: 'nowrap', color: '#1e293b', fontWeight: '500' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{c.complaint_date || 'N/A'}</span>
                        </div>
                      </td>

                      {/* Acct ID */}
                      <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                        <span style={{
                          fontFamily: 'monospace',
                          fontWeight: '700',
                          color: '#0284c7',
                          background: '#f0f9ff',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          border: '1px solid #bae6fd'
                        }}>
                          {c.acct_id}
                        </span>
                      </td>

                      {/* Case ID */}
                      <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                        <span style={{
                          fontFamily: 'monospace',
                          fontWeight: '700',
                          color: '#334155',
                          background: '#f8fafc',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          border: '1px solid #e2e8f0'
                        }}>
                          {c.case_id}
                        </span>
                      </td>

                      {/* Name */}
                      <td style={{ padding: '12px 14px', color: '#0f172a', fontWeight: '700' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <User className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          <span style={{ lineHeight: '1.3' }}>{c.name}</span>
                        </div>
                      </td>

                      {/* Address */}
                      <td style={{ padding: '12px 14px', color: '#475569', fontSize: '12.5px', lineHeight: '1.4' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                          <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                          <span>{c.address}</span>
                        </div>
                      </td>

                      {/* Contact No. */}
                      <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                        {c.contact_no ? (
                          <a
                            href={`tel:${c.contact_no.replace(/[^0-9+]/g, '')}`}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              color: '#0284c7',
                              fontWeight: '600',
                              textDecoration: 'none',
                              fontSize: '12.5px'
                            }}
                          >
                            <Phone className="w-3 h-3" />
                            <span>{c.contact_no}</span>
                          </a>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>—</span>
                        )}
                      </td>

                      {/* Case Remarks */}
                      <td style={{ padding: '12px 14px', color: '#334155', fontSize: '12.5px', lineHeight: '1.4' }}>
                        {c.case_remarks ? (
                          <span style={{ display: 'block', maxWidth: '280px', wordBreak: 'break-word' }}>
                            {c.case_remarks}
                          </span>
                        ) : (
                          <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>None recorded</span>
                        )}
                      </td>

                      {/* Nature */}
                      <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '3px 10px',
                          borderRadius: '12px',
                          fontSize: '11.5px',
                          fontWeight: '700',
                          background: natureStyle.bg,
                          color: natureStyle.color,
                          border: `1px solid ${natureStyle.border}`,
                        }}>
                          {c.nature}
                        </span>
                      </td>

                      {/* Final Status */}
                      <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '3px 10px',
                          borderRadius: '12px',
                          fontSize: '11.5px',
                          fontWeight: '700',
                          background: statusStyle.bg,
                          color: statusStyle.color,
                          border: `1px solid ${statusStyle.border}`
                        }}>
                          {c.final_status === 'Close Resolved' && <CheckCircle2 className="w-3 h-3" />}
                          {c.final_status === 'Referred to Operations Department' && <Send className="w-3 h-3" />}
                          {c.final_status !== 'Close Resolved' && c.final_status !== 'Referred to Operations Department' && <Clock className="w-3 h-3" />}
                          <span>{c.final_status || 'In Progress'}</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                          <button
                            type="button"
                            onClick={() => handleOpenDetailModal(c)}
                            title="View Full Case Details"
                            style={{
                              padding: '6px',
                              background: '#f0f9ff',
                              color: '#0284c7',
                              border: '1px solid #bae6fd',
                              borderRadius: '6px',
                              cursor: 'pointer'
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {user?.role !== 'lawyer' && (
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(c)}
                              title="Edit Complaint"
                              style={{
                                padding: '6px',
                                background: '#f8fafc',
                                color: '#475569',
                                border: '1px solid #cbd5e1',
                                borderRadius: '6px',
                                cursor: 'pointer'
                              }}
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                          )}

                          {user?.role !== 'lawyer' && (
                            <button
                              type="button"
                              onClick={() => handleDeleteComplaint(c.id, c.created_by)}
                              title="Delete Record"
                              style={{
                                padding: '6px',
                                background: '#fef2f2',
                                color: '#ef4444',
                                border: '1px solid #fecaca',
                                borderRadius: '6px',
                                cursor: 'pointer'
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
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

      {/* DETAIL VIEW MODAL */}
      {isDetailModalOpen && selectedComplaint && (
        <div className="modal-backdrop" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div className="glass-panel animate-scale-in" style={{
            background: '#ffffff',
            borderRadius: '16px',
            maxWidth: '680px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '28px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)'
          }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span style={{ background: '#e0f2fe', color: '#0369a1', fontSize: '11px', fontWeight: '800', padding: '2px 8px', borderRadius: '12px' }}>
                    Case ID: {selectedComplaint.case_id}
                  </span>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: '700',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    ...(STATUS_COLORS[selectedComplaint.final_status] || { bg: '#f1f5f9', color: '#475569', border: '#cbd5e1' })
                  }}>
                    {selectedComplaint.final_status}
                  </span>
                </div>
                <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a' }}>
                  1199 Complaint Details
                </h2>
              </div>

              <button
                onClick={() => setIsDetailModalOpen(false)}
                style={{ background: '#f1f5f9', border: 'none', borderRadius: '8px', padding: '6px', cursor: 'pointer', color: '#64748b' }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Grid Information */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Complaint Date</div>
                <div style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', marginTop: '2px' }}>
                  {selectedComplaint.complaint_date}
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Acct ID</div>
                <div style={{ fontSize: '14px', fontWeight: '800', fontFamily: 'monospace', color: '#0284c7', marginTop: '2px' }}>
                  {selectedComplaint.acct_id}
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Consumer Name</div>
                <div style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', marginTop: '2px' }}>
                  {selectedComplaint.name}
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Contact Number</div>
                <div style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', marginTop: '2px' }}>
                  {selectedComplaint.contact_no ? (
                    <a href={`tel:${selectedComplaint.contact_no.replace(/[^0-9+]/g, '')}`} style={{ color: '#0284c7', textDecoration: 'none' }}>
                      {selectedComplaint.contact_no}
                    </a>
                  ) : 'N/A'}
                </div>
              </div>
            </div>

            {/* Address */}
            <div style={{ background: '#f8fafc', padding: '14px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>
                Premises Address
              </div>
              <div style={{ fontSize: '13.5px', color: '#1e293b', lineHeight: '1.4', fontWeight: '500' }}>
                {selectedComplaint.address}
              </div>
            </div>

            {/* Nature & Remarks */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px', marginBottom: '20px' }}>
              <div style={{ background: '#f8fafc', padding: '14px 16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>
                  Theft Nature & Violation Type
                </div>
                <span style={{
                  display: 'inline-block',
                  padding: '4px 12px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: '700',
                  ...(NATURE_COLORS[selectedComplaint.nature] || DEFAULT_NATURE_COLOR)
                }}>
                  {selectedComplaint.nature}
                </span>
              </div>

              <div style={{ background: '#f8fafc', padding: '14px 16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>
                  Official Case Remarks & Action Taken
                </div>
                <div style={{ fontSize: '13.5px', color: '#334155', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                  {selectedComplaint.case_remarks || 'No remarks recorded.'}
                </div>
              </div>
            </div>

            {/* Metadata Footer */}
            <div style={{ background: '#f1f5f9', padding: '12px 16px', borderRadius: '8px', fontSize: '12px', color: '#475569', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
              <div>Region: <strong>{selectedComplaint.region || 'Faisalabad'}</strong> ({selectedComplaint.management_group || 'Main'})</div>
              {selectedComplaint.gps && (
                <div>
                  GPS: <a href={`https://maps.google.com/?q=${selectedComplaint.gps}`} target="_blank" rel="noreferrer" style={{ color: '#0284c7', fontWeight: '700' }}>
                    {selectedComplaint.gps} ↗
                  </a>
                </div>
              )}
              <div>Logged By: <strong>{selectedComplaint.logged_by || selectedComplaint.creator_name || 'System'}</strong></div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
              {user?.role !== 'lawyer' && (
                <button
                  type="button"
                  onClick={() => {
                    setIsDetailModalOpen(false);
                    handleOpenEditModal(selectedComplaint);
                  }}
                  className="btn btn-secondary"
                  style={{ padding: '8px 16px', fontSize: '13px' }}
                >
                  <Edit3 className="w-4 h-4" /> Edit Record
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
      )}

      {/* ADD / EDIT MODAL (WITHOUT SERIAL NUMBER) */}
      {isFormModalOpen && (
        <div className="modal-backdrop" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div className="glass-panel animate-scale-in" style={{
            background: '#ffffff',
            borderRadius: '16px',
            maxWidth: '720px',
            width: '100%',
            maxHeight: '92vh',
            overflowY: 'auto',
            padding: '28px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '14px' }}>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a' }}>
                  {editingComplaint ? 'Edit 1199 Complaint Record' : 'Register New 1199 Complaint'}
                </h2>
                <p style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
                  Enter complaint verification details without manual serial numbers
                </p>
              </div>

              <button
                onClick={() => setIsFormModalOpen(false)}
                style={{ background: '#f1f5f9', border: 'none', borderRadius: '8px', padding: '6px', cursor: 'pointer', color: '#64748b' }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveComplaint}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                {/* Complaint Date */}
                <div>
                  <label className="form-label" style={{ fontWeight: '700', fontSize: '13px', color: '#1e293b' }}>
                    Complaint Date & Time *
                  </label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="e.g. 8/19/2026 1:29:43 PM"
                    value={complaintDate}
                    onChange={e => setComplaintDate(e.target.value)}
                    style={{ border: '1px solid #cbd5e1', borderRadius: '8px' }}
                  />
                </div>

                {/* Acct ID */}
                <div>
                  <label className="form-label" style={{ fontWeight: '700', fontSize: '13px', color: '#1e293b' }}>
                    Acct ID (Consumer Account) *
                  </label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="e.g. 0317505116"
                    value={acctId}
                    onChange={e => setAcctId(e.target.value)}
                    style={{ border: '1px solid #cbd5e1', borderRadius: '8px', fontFamily: 'monospace', fontWeight: '700' }}
                  />
                </div>

                {/* Case ID */}
                <div>
                  <label className="form-label" style={{ fontWeight: '700', fontSize: '13px', color: '#1e293b' }}>
                    Case ID *
                  </label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="e.g. 1508690458"
                    value={caseId}
                    onChange={e => setCaseId(e.target.value)}
                    style={{ border: '1px solid #cbd5e1', borderRadius: '8px', fontFamily: 'monospace', fontWeight: '700' }}
                  />
                </div>

                {/* Contact No. */}
                <div>
                  <label className="form-label" style={{ fontWeight: '700', fontSize: '13px', color: '#1e293b' }}>
                    Contact No.
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. 0305-8358834"
                    value={contactNo}
                    onChange={e => setContactNo(e.target.value)}
                    style={{ border: '1px solid #cbd5e1', borderRadius: '8px' }}
                  />
                </div>
              </div>

              {/* Name */}
              <div style={{ marginBottom: '16px' }}>
                <label className="form-label" style={{ fontWeight: '700', fontSize: '13px', color: '#1e293b' }}>
                  Consumer / Caller Name *
                </label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="e.g. ASIM RIZWAN S/O NAZIR HUSSAIN"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  style={{ border: '1px solid #cbd5e1', borderRadius: '8px' }}
                />
              </div>

              {/* Address */}
              <div style={{ marginBottom: '16px' }}>
                <label className="form-label" style={{ fontWeight: '700', fontSize: '13px', color: '#1e293b' }}>
                  Full Address & Location *
                </label>
                <textarea
                  required
                  rows={2}
                  className="form-input"
                  placeholder="e.g. P-303/C-2 PUNJAB GOVT SERVANTS HOUSING FOUNDATION SATINA ROAD FSD"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  style={{ border: '1px solid #cbd5e1', borderRadius: '8px', resize: 'vertical' }}
                />
              </div>

              {/* Nature & Final Status */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label className="form-label" style={{ fontWeight: '700', fontSize: '13px', color: '#1e293b' }}>
                    Theft Nature *
                  </label>
                  <select
                    className="form-input"
                    value={nature}
                    onChange={e => setNature(e.target.value)}
                    style={{ border: '1px solid #cbd5e1', borderRadius: '8px' }}
                  >
                    <option value="Theft - Compressor Use">Theft - Compressor Use</option>
                    <option value="Theft - Illegal Extension">Theft - Illegal Extension</option>
                    <option value="Theft - Fake Line">Theft - Fake Line</option>
                    <option value="Theft - Commercial Use">Theft - Commercial Use</option>
                    <option value="Theft - Direct Use /By pass">Theft - Direct Use /By pass</option>
                    <option value="Theft - Illegal Shifting">Theft - Illegal Shifting</option>
                    <option value="Custom">Custom / Other Nature</option>
                  </select>

                  {nature === 'Custom' && (
                    <input
                      type="text"
                      required
                      placeholder="Specify custom nature..."
                      className="form-input"
                      value={customNature}
                      onChange={e => setCustomNature(e.target.value)}
                      style={{ marginTop: '8px', border: '1px solid #cbd5e1', borderRadius: '8px' }}
                    />
                  )}
                </div>

                <div>
                  <label className="form-label" style={{ fontWeight: '700', fontSize: '13px', color: '#1e293b' }}>
                    Final Status *
                  </label>
                  <select
                    className="form-input"
                    value={finalStatus}
                    onChange={e => setFinalStatus(e.target.value)}
                    style={{ border: '1px solid #cbd5e1', borderRadius: '8px' }}
                  >
                    <option value="Close Resolved">Close Resolved</option>
                    <option value="Referred to Operations Department">Referred to Operations Department</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Under Review">Under Review</option>
                    <option value="Pending">Pending</option>
                  </select>
                </div>
              </div>

              {/* Case Remarks */}
              <div style={{ marginBottom: '16px' }}>
                <label className="form-label" style={{ fontWeight: '700', fontSize: '13px', color: '#1e293b' }}>
                  Case Remarks & Action Report
                </label>
                <textarea
                  rows={3}
                  className="form-input"
                  placeholder="e.g. Phone not attended house not found. / No Violation found at the time of visit / Meter Disconnected..."
                  value={caseRemarks}
                  onChange={e => setCaseRemarks(e.target.value)}
                  style={{ border: '1px solid #cbd5e1', borderRadius: '8px', resize: 'vertical' }}
                />
              </div>

              {/* Optional Metadata accordion / toggle */}
              <div style={{
                background: '#f8fafc',
                padding: '14px 16px',
                borderRadius: '10px',
                border: '1px solid #e2e8f0',
                marginBottom: '24px'
              }}>
                <div style={{ fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '10px' }}>
                  Supporting Department Metadata (Optional)
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                  <div>
                    <span style={{ fontSize: '11.5px', color: '#64748b', fontWeight: '600' }}>Region:</span>
                    <input
                      type="text"
                      className="form-input"
                      value={region}
                      onChange={e => setRegion(e.target.value)}
                      style={{ fontSize: '12px', padding: '6px 10px', height: '34px', border: '1px solid #cbd5e1', marginTop: '2px' }}
                    />
                  </div>

                  <div>
                    <span style={{ fontSize: '11.5px', color: '#64748b', fontWeight: '600' }}>Management Group:</span>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Faisalabad - Main"
                      value={managementGroup}
                      onChange={e => setManagementGroup(e.target.value)}
                      style={{ fontSize: '12px', padding: '6px 10px', height: '34px', border: '1px solid #cbd5e1', marginTop: '2px' }}
                    />
                  </div>

                  <div>
                    <span style={{ fontSize: '11.5px', color: '#64748b', fontWeight: '600' }}>GPS Coordinates:</span>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. 31.3705221,73.143136"
                      value={gps}
                      onChange={e => setGps(e.target.value)}
                      style={{ fontSize: '12px', padding: '6px 10px', height: '34px', border: '1px solid #cbd5e1', marginTop: '2px' }}
                    />
                  </div>
                </div>
              </div>

              {/* Form Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="btn btn-secondary"
                  style={{ padding: '10px 18px', fontSize: '13px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ padding: '10px 24px', fontSize: '13px', fontWeight: '700' }}
                >
                  {editingComplaint ? 'Update Complaint' : 'Save Complaint'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
