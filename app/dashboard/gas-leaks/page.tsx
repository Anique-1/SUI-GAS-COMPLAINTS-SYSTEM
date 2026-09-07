'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useUser } from '../layout';
import { dbClient, Complaint } from '@/lib/db';
import {
  Flame,
  Search,
  Calendar,
  MapPin,
  Phone,
  Navigation,
  ExternalLink,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Trash2,
  Edit3,
  Copy,
  Check,
  Loader2,
  RefreshCw,
  Eye,
  X,
  Radio,
  FileText
} from 'lucide-react';
import EmergencyAlertDetails from '@/components/EmergencyAlertDetails';

// Dynamic import of Leaflet GIS map
const InteractiveEmergencyMap = dynamic(
  () => import('@/components/InteractiveEmergencyMap'),
  {
    ssr: false,
    loading: () => (
      <div style={{ height: '240px', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '13px', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
        <Loader2 className="w-5 h-5 animate-spin mr-2 text-red-600" />
        <span>Loading Satellite GIS Map...</span>
      </div>
    )
  }
);

const normalizeText = (str: string | undefined | null) =>
  str ? str.toLowerCase().replace(/[\u2013\u2014-]/g, '-').replace(/\s+/g, ' ').trim() : '';

const STATUS_LABELS: Record<string, { label: string; bg: string; color: string; border: string }> = {
  in_progress: { label: 'Dispatched / In Progress', bg: '#fef2f2', color: '#b91c1c', border: '#fecaca' },
  dispatched: { label: 'Van En Route', bg: '#fff7ed', color: '#c2410c', border: '#ffedd5' },
  under_repair: { label: 'Active Pipeline Repair', bg: '#fefce8', color: '#a16207', border: '#fef08a' },
  resolved: { label: 'Secured & Resolved', bg: '#ecfdf5', color: '#047857', border: '#a7f3d0' },
  pending: { label: 'Pending Assessment', bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
};

export default function GasLeaksEmergencyDashboardPage() {
  const { user } = useUser();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Status Update Modal
  const [selectedIncident, setSelectedIncident] = useState<Complaint | null>(null);
  const [newStatus, setNewStatus] = useState<string>('in_progress');
  const [resolutionNotes, setResolutionNotes] = useState<string>('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Map Preview Modal
  const [mapIncident, setMapIncident] = useState<Complaint | null>(null);

  // Copied helper
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const fetchGasLeaks = async () => {
    try {
      setLoading(true);
      const allComplaints = await dbClient.getComplaints();
      // Filter specifically for gas_leak_emergency complaints
      const gasLeaks = allComplaints.filter(c => c.complaint_category === 'gas_leak_emergency');
      setComplaints(gasLeaks);
    } catch (err) {
      console.error('Failed to load emergency gas leaks', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGasLeaks();
  }, []);

  const handleCopy = (token: string) => {
    const fullUrl = `${window.location.origin}/public/${token}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const handleOpenStatusModal = (c: Complaint) => {
    setSelectedIncident(c);
    setNewStatus(c.status || 'in_progress');
    setResolutionNotes((c as any).resolution_notes || '');
  };

  const handleSaveStatus = async () => {
    if (!selectedIncident) return;
    setIsUpdatingStatus(true);
    try {
      const res = await fetch(`/api/complaints/${selectedIncident.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          resolution_notes: resolutionNotes.trim(),
        }),
      });

      if (res.ok) {
        setSelectedIncident(null);
        await fetchGasLeaks();
      } else {
        alert('Failed to update status. Please check permissions.');
      }
    } catch (err) {
      console.error('Status update error', err);
      alert('Error updating status.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleDeleteIncident = async (id: string) => {
    if (!confirm('Are you sure you want to delete this emergency incident record?')) return;
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

  // Filter logic
  const filtered = complaints.filter(c => {
    const query = normalizeText(searchQuery);
    const matchesSearch =
      normalizeText(c.name).includes(query) ||
      normalizeText(c.description).includes(query) ||
      normalizeText(c.phone).includes(query) ||
      normalizeText(c.location_coords?.address).includes(query) ||
      normalizeText(c.public_link_token).includes(query);

    let matchesStatus = true;
    if (statusFilter !== 'all') {
      matchesStatus = (c.status || 'in_progress') === statusFilter;
    }

    let matchesDate = true;
    if (fromDate) matchesDate = matchesDate && c.register_date >= fromDate;
    if (toDate) matchesDate = matchesDate && c.register_date <= toDate;

    return matchesSearch && matchesStatus && matchesDate;
  });

  // Metrics counts
  const totalCount = complaints.length;
  const activeCount = complaints.filter(c => c.status !== 'resolved').length;
  const resolvedCount = complaints.filter(c => c.status === 'resolved').length;
  const criticalCount = complaints.filter(c => c.urgency === 'critical_1199' || c.description.toLowerCase().includes('severe pipeline rupture')).length;

  return (
    <div>
      {/* SNGPL Emergency Console Banner */}
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
          background: 'linear-gradient(135deg, rgba(254, 242, 242, 0.95) 0%, rgba(255, 255, 255, 0.9) 100%)',
          borderColor: 'rgba(220, 38, 38, 0.25)',
          boxShadow: '0 10px 25px -5px rgba(220, 38, 38, 0.08)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '54px',
            height: '54px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            boxShadow: '0 4px 14px rgba(220, 38, 38, 0.35)',
            flexShrink: 0
          }}>
            <Flame className="w-7 h-7 animate-pulse" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '11px', fontWeight: '800', color: '#dc2626', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                SNGPL 1199 Emergency Rapid Dispatch
              </span>
              <span style={{
                background: '#fee2e2',
                color: '#dc2626',
                border: '1px solid #fca5a5',
                fontSize: '11px',
                fontWeight: '700',
                padding: '2px 8px',
                borderRadius: '12px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <Radio className="w-3 h-3 animate-ping" /> Live GIS Dispatch
              </span>
            </div>
            <h1 style={{ fontSize: '22px', fontWeight: '900', color: '#0f172a', marginTop: '2px', lineHeight: '1.2' }}>
              Gas Leak Emergencies (1199 Dispatch Console)
            </h1>
            <p style={{ color: '#64748b', fontSize: '12.5px', marginTop: '2px' }}>
              Dedicated operator station for live citizen gas leak reports, satellite GPS pinpointing, and emergency van dispatch.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            type="button"
            onClick={fetchGasLeaks}
            className="btn btn-secondary"
            style={{ padding: '8px 14px', fontSize: '12.5px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Incidents</span>
          </button>
          <a
            href="tel:1199"
            className="btn btn-primary"
            style={{
              background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
              borderColor: '#991b1b',
              padding: '8px 16px',
              fontSize: '12.5px',
              fontWeight: '800',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              textDecoration: 'none'
            }}
          >
            <Phone className="w-3.5 h-3.5" />
            <span>Direct 1199 Hotline</span>
          </a>
        </div>
      </div>

      {/* METRIC COUNTER TILES */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div className="glass-panel" style={{ padding: '16px 20px', borderLeft: '4px solid #dc2626' }}>
          <div style={{ fontSize: '11.5px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>
            Active / Dispatched
          </div>
          <div style={{ fontSize: '26px', fontWeight: '900', color: '#dc2626', marginTop: '4px' }}>
            {activeCount}
          </div>
          <span style={{ fontSize: '11px', color: '#94a3b8' }}>Emergency response teams en route</span>
        </div>

        <div className="glass-panel" style={{ padding: '16px 20px', borderLeft: '4px solid #f97316' }}>
          <div style={{ fontSize: '11.5px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>
            High-Risk Pipeline Leaks
          </div>
          <div style={{ fontSize: '26px', fontWeight: '900', color: '#c2410c', marginTop: '4px' }}>
            {criticalCount}
          </div>
          <span style={{ fontSize: '11px', color: '#94a3b8' }}>Immediate hazard / high pressure</span>
        </div>

        <div className="glass-panel" style={{ padding: '16px 20px', borderLeft: '4px solid #10b981' }}>
          <div style={{ fontSize: '11.5px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>
            Secured & Resolved
          </div>
          <div style={{ fontSize: '26px', fontWeight: '900', color: '#047857', marginTop: '4px' }}>
            {resolvedCount}
          </div>
          <span style={{ fontSize: '11px', color: '#94a3b8' }}>Valves isolated / line repaired</span>
        </div>

        <div className="glass-panel" style={{ padding: '16px 20px', borderLeft: '4px solid #0284c7' }}>
          <div style={{ fontSize: '11.5px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>
            Total Recorded Reports
          </div>
          <div style={{ fontSize: '26px', fontWeight: '900', color: '#0284c7', marginTop: '4px' }}>
            {totalCount}
          </div>
          <span style={{ fontSize: '11px', color: '#94a3b8' }}>All historical 1199 dispatch records</span>
        </div>
      </div>

      {/* FILTER & SEARCH CONTROLS */}
      <div className="glass-panel" style={{ padding: '18px 20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          
          {/* Search Box */}
          <div style={{ position: 'relative', flex: 1, minWidth: '260px' }}>
            <Search className="w-4 h-4 text-slate-400" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by street address, city, caller mobile (0300...), incident token..."
              className="form-input"
              style={{ paddingLeft: '36px', height: '40px', fontSize: '13px', width: '100%' }}
            />
          </div>

          {/* Status Filter */}
          <div style={{ minWidth: '180px' }}>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="form-select"
              style={{ height: '40px', fontSize: '12.5px', width: '100%' }}
            >
              <option value="all">All Dispatch Statuses</option>
              <option value="in_progress">🚨 Dispatched / In Progress</option>
              <option value="dispatched">🚚 Van En Route</option>
              <option value="under_repair">🔧 Active Pipeline Repair</option>
              <option value="resolved">✅ Secured & Resolved</option>
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

      {/* INCIDENTS LIST */}
      {loading ? (
        <div style={{ padding: '60px 0', textAlign: 'center', color: '#64748b' }}>
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-red-600 mb-3" />
          <p style={{ fontSize: '14px', fontWeight: '600' }}>Retrieving Emergency Dispatch Feed...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-panel" style={{ padding: '50px 20px', textAlign: 'center' }}>
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: '#fef2f2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px auto',
            color: '#dc2626'
          }}>
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#0f172a', marginBottom: '6px' }}>
            No Gas Leak Emergencies Found
          </h3>
          <p style={{ color: '#64748b', fontSize: '13px', maxWidth: '420px', margin: '0 auto' }}>
            {searchQuery || statusFilter !== 'all' || fromDate || toDate
              ? 'No emergency reports match your current search filters.'
              : 'There are currently no active gas leak reports logged in the system.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filtered.map((incident) => {
            const statusStyle = STATUS_LABELS[incident.status || 'in_progress'] || STATUS_LABELS.in_progress;
            const hasCoords = !!incident.location_coords?.latitude && !!incident.location_coords?.longitude;
            const googleMapsUrl = hasCoords
              ? `https://www.google.com/maps?q=${incident.location_coords!.latitude},${incident.location_coords!.longitude}`
              : null;

            return (
              <div
                key={incident.id}
                className="glass-panel"
                style={{
                  padding: '22px 24px',
                  borderLeft: `5px solid ${incident.status === 'resolved' ? '#10b981' : '#dc2626'}`,
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)'
                }}
              >
                {/* Card Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <span
                      style={{
                        background: statusStyle.bg,
                        color: statusStyle.color,
                        border: `1px solid ${statusStyle.border}`,
                        fontSize: '11.5px',
                        fontWeight: '800',
                        padding: '3px 10px',
                        borderRadius: '20px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}
                    >
                      {incident.status === 'resolved' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5 animate-spin" />}
                      {statusStyle.label}
                    </span>

                    <span style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar className="w-3.5 h-3.5" />
                      {incident.register_date}
                    </span>

                    {incident.public_link_token && (
                      <span style={{ fontFamily: 'monospace', fontSize: '11px', color: '#0284c7', background: '#eff6ff', padding: '2px 8px', borderRadius: '4px', border: '1px solid #bfdbfe' }}>
                        Token: {incident.public_link_token.slice(0, 8)}...
                      </span>
                    )}
                  </div>

                  {/* Actions Header */}
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button
                      type="button"
                      onClick={() => handleOpenStatusModal(incident)}
                      className="btn btn-secondary"
                      style={{
                        padding: '6px 12px',
                        fontSize: '12px',
                        fontWeight: '700',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Update Dispatch Status</span>
                    </button>

                    {incident.public_link_token && (
                      <Link
                        href={`/public/${incident.public_link_token}`}
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
                        <span>Public View</span>
                      </Link>
                    )}

                    {(user?.role === 'executive' || user?.id === incident.created_by) && (
                      <button
                        type="button"
                        onClick={() => handleDeleteIncident(incident.id)}
                        className="btn btn-danger"
                        style={{ padding: '6px 10px', fontSize: '12px' }}
                        title="Delete Record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Incident Title */}
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', marginBottom: '12px' }}>
                  {incident.name}
                </h3>

                {/* Coordinates and Location Box */}
                <div style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '14px 16px',
                  marginBottom: '14px',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                  gap: '14px'
                }}>
                  {/* Street & Area */}
                  <div>
                    <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <MapPin className="w-3.5 h-3.5 text-red-600" />
                      <span>Identified Street & Area</span>
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>
                      {incident.location_coords?.address || 'Street address not resolved (check coordinates)'}
                    </div>
                  </div>

                  {/* Satellite GPS Coordinates */}
                  <div>
                    <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Navigation className="w-3.5 h-3.5 text-sky-600" />
                      <span>Precision Satellite GPS Pin</span>
                    </div>
                    {hasCoords ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontFamily: 'monospace', fontSize: '12.5px', fontWeight: '700', color: '#0369a1' }}>
                          {incident.location_coords!.latitude.toFixed(6)}, {incident.location_coords!.longitude.toFixed(6)}
                          {incident.location_coords!.accuracy ? ` (±${Math.round(incident.location_coords!.accuracy)}m)` : ''}
                        </span>

                        {googleMapsUrl && (
                          <a
                            href={googleMapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              background: '#ffffff',
                              border: '1px solid #cbd5e1',
                              borderRadius: '4px',
                              padding: '2px 8px',
                              fontSize: '11px',
                              fontWeight: '700',
                              color: '#0284c7',
                              textDecoration: 'none',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <span>Google Maps</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}

                        <button
                          type="button"
                          onClick={() => setMapIncident(incident)}
                          style={{
                            background: '#ffffff',
                            border: '1px solid #cbd5e1',
                            borderRadius: '4px',
                            padding: '2px 8px',
                            fontSize: '11px',
                            fontWeight: '700',
                            color: '#475569',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <Eye className="w-3 h-3" />
                          <span>Preview GIS Map</span>
                        </button>
                      </div>
                    ) : (
                      <span style={{ fontSize: '12px', color: '#94a3b8' }}>No GPS coordinates recorded</span>
                    )}
                  </div>

                  {/* Caller Phone */}
                  <div>
                    <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Phone className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Caller Mobile (Citizen / Staff)</span>
                    </div>
                    {incident.phone ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <a
                          href={`tel:${incident.phone}`}
                          style={{
                            fontSize: '13px',
                            fontWeight: '800',
                            color: '#047857',
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>{incident.phone}</span>
                        </a>
                      </div>
                    ) : (
                      <span style={{ fontSize: '12px', color: '#94a3b8' }}>Phone not provided</span>
                    )}
                  </div>
                </div>

                {/* Details / Description snippet */}
                {incident.description && (
                  <EmergencyAlertDetails
                    description={incident.description}
                    style={{ marginTop: '8px' }}
                  />
                )}

                {/* Resolution Notes If Present */}
                {(incident as any).resolution_notes && (
                  <div style={{
                    marginTop: '10px',
                    padding: '10px 14px',
                    background: '#ecfdf5',
                    border: '1px solid #a7f3d0',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#065f46'
                  }}>
                    <strong>Operator Resolution Notes:</strong> {(incident as any).resolution_notes}
                  </div>
                )}

              </div>
            );
          })}
        </div>
      )}

      {/* STATUS UPDATE MODAL */}
      {selectedIncident && (
        <div className="modal-overlay" onClick={() => setSelectedIncident(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                Update Emergency Dispatch Status
              </h3>
              <button
                type="button"
                onClick={() => setSelectedIncident(null)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                Dispatch Stage / Status:
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="form-select"
                style={{ width: '100%', height: '40px', fontSize: '13px' }}
              >
                <option value="in_progress">🚨 Dispatched / Emergency Van En Route</option>
                <option value="dispatched">🚚 Van En Route (Assigned)</option>
                <option value="under_repair">🔧 Active Pipeline Repair / Excavation</option>
                <option value="resolved">✅ Secured & Valve Isolated (Resolved)</option>
              </select>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                Technician / Van Action Notes:
              </label>
              <textarea
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="Enter actions taken (e.g. Van #4 arrived at site, main 2-inch distribution pipe clamped and leak tested)..."
                rows={3}
                className="form-input"
                style={{ width: '100%', fontSize: '12.5px', padding: '8px 12px' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setSelectedIncident(null)}
                className="btn btn-secondary"
                disabled={isUpdatingStatus}
                style={{ padding: '8px 16px', fontSize: '13px' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveStatus}
                className="btn btn-primary"
                disabled={isUpdatingStatus}
                style={{
                  background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                  padding: '8px 18px',
                  fontSize: '13px',
                  fontWeight: '700',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                {isUpdatingStatus ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                <span>Save Status Update</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GIS MAP PREVIEW MODAL */}
      {mapIncident && mapIncident.location_coords && (
        <div className="modal-overlay" onClick={() => setMapIncident(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '680px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div>
                <span style={{ fontSize: '11px', color: '#dc2626', fontWeight: '800', textTransform: 'uppercase' }}>
                  Live Emergency GIS Coordinate
                </span>
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                  {mapIncident.location_coords.address || mapIncident.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setMapIncident(null)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div style={{ marginBottom: '14px', borderRadius: '10px', overflow: 'hidden', border: '1px solid #cbd5e1' }}>
              <InteractiveEmergencyMap
                latitude={mapIncident.location_coords.latitude}
                longitude={mapIncident.location_coords.longitude}
                accuracy={mapIncident.location_coords.accuracy}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <span style={{ fontFamily: 'monospace', fontSize: '12px', color: '#475569' }}>
                Lat: {mapIncident.location_coords.latitude.toFixed(6)}, Lon: {mapIncident.location_coords.longitude.toFixed(6)}
              </span>
              <a
                href={`https://www.google.com/maps?q=${mapIncident.location_coords.latitude},${mapIncident.location_coords.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
                style={{ padding: '7px 14px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
              >
                <span>Navigate in Google Maps</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
