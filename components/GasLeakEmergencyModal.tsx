'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { 
  X, 
  MapPin, 
  Navigation, 
  PhoneCall, 
  AlertTriangle, 
  CheckCircle2, 
  Loader2, 
  ExternalLink, 
  Flame, 
  ShieldAlert,
  Copy,
  AlertCircle,
  Search,
  Crosshair,
  Compass
} from 'lucide-react';

// Dynamic import for Leaflet map to prevent SSR issues
const InteractiveEmergencyMap = dynamic(
  () => import('./InteractiveEmergencyMap'),
  { 
    ssr: false,
    loading: () => (
      <div style={{ height: '240px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '13px', borderRadius: '8px' }}>
        <Loader2 className="w-5 h-5 animate-spin mr-2 text-sky-600" />
        <span>Loading Interactive GIS Map...</span>
      </div>
    )
  }
);

interface GasLeakEmergencyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SearchResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

// Major SNGPL operational regions for quick sector navigation
const REGIONAL_QUICK_PRESETS = [
  { name: '📍 Chak Jhumra (Punjab)', lat: 31.568954, lng: 73.183301, address: 'Chak Jhumra, Faisalabad District, Punjab' },
  { name: 'Faisalabad (D-Ground)', lat: 31.4116, lng: 73.0990, address: 'D-Ground, Peoples Colony, Faisalabad' },
  { name: 'Faisalabad (Clock Tower)', lat: 31.4187, lng: 73.0791, address: 'Clock Tower / Ghanta Ghar, Faisalabad' },
  { name: 'Lahore (Johar Town)', lat: 31.4697, lng: 74.2728, address: 'Johar Town, Lahore' },
  { name: 'Lahore (Gulberg / Mall Rd)', lat: 31.5204, lng: 74.3587, address: 'Gulberg, Lahore' },
  { name: 'Islamabad (Blue Area / F-7)', lat: 33.7215, lng: 73.0560, address: 'Sector F-7 / Blue Area, Islamabad' },
  { name: 'Rawalpindi (Saddar)', lat: 33.5973, lng: 73.0548, address: 'Saddar, Rawalpindi' },
  { name: 'Peshawar (Hayatabad)', lat: 33.9870, lng: 71.4360, address: 'Hayatabad, Peshawar' },
  { name: 'Multan (Cantt)', lat: 30.1984, lng: 71.4687, address: 'Cantt, Multan' },
];

export default function GasLeakEmergencyModal({
  isOpen,
  onClose
}: GasLeakEmergencyModalProps) {
  const [locationStatus, setLocationStatus] = useState<'idle' | 'detecting' | 'detected' | 'error'>('idle');
  const [coords, setCoords] = useState<{ latitude: number; longitude: number; accuracy: number } | null>(null);
  const [coordsInput, setCoordsInput] = useState<string>('');
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locationName, setLocationName] = useState<string>('');
  const [isReverseGeocoding, setIsReverseGeocoding] = useState<boolean>(false);
  
  // Search & manual fine-tuning states
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearchingPlaces, setIsSearchingPlaces] = useState<boolean>(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showSearchResults, setShowSearchResults] = useState<boolean>(false);
  const [activePreset, setActivePreset] = useState<string>('');

  const [phone, setPhone] = useState<string>('');
  const [severity, setSeverity] = useState<string>('Severe Gas Odor in Street / Open Pipeline');
  const [description, setDescription] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [emergencyResult, setEmergencyResult] = useState<{
    token: string;
    complaintId: string;
    trackingUrl: string;
  } | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const watchIdRef = useRef<number | null>(null);

  // Clean up GPS watcher
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // Reverse geocoding: Turn GPS coordinates into human-readable street address
  const fetchAddressForCoordinates = async (lat: number, lng: number) => {
    setIsReverseGeocoding(true);
    try {
      const res = await fetch(`/api/geocode?action=reverse&lat=${lat}&lon=${lng}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.display_name) {
          // Format clean street address
          const addr = data.address || {};
          const parts = [
            addr.road || addr.street || addr.neighbourhood,
            addr.suburb || addr.residential || addr.quarter,
            addr.city || addr.town || addr.district || addr.county,
            addr.state || addr.province
          ].filter(Boolean);

          const cleanAddress = parts.length > 0 ? parts.join(', ') : data.display_name;
          setLocationName(cleanAddress);
        }
      }
    } catch {
      // Quiet fail on network, user can still type
    } finally {
      setIsReverseGeocoding(false);
    }
  };

  // Handle direct coordinates or Google Maps link pasting
  const handleApplyCoordinates = (inputStr?: string) => {
    const raw = (inputStr || coordsInput).trim();
    if (!raw) return;

    let lat: number | null = null;
    let lng: number | null = null;

    // Pattern 1: Google Maps URL e.g. maps.google.com/?q=31.568954,73.183301 or @31.568954,73.183301
    const urlMatch = raw.match(/[?&]q=(-?\d+\.\d+)[,\s]+(-?\d+\.\d+)/) ||
                     raw.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (urlMatch) {
      lat = parseFloat(urlMatch[1]);
      lng = parseFloat(urlMatch[2]);
    } else {
      // Pattern 2: "31.568954, 73.183301" or "31.568954,73.183301" or "31.568954 73.183301"
      const pairMatch = raw.match(/(-?\d+\.\d+)[,\s]+(-?\d+\.\d+)/);
      if (pairMatch) {
        lat = parseFloat(pairMatch[1]);
        lng = parseFloat(pairMatch[2]);
      }
    }

    if (lat !== null && lng !== null && !isNaN(lat) && !isNaN(lng)) {
      setCoords({ latitude: lat, longitude: lng, accuracy: 5 });
      setLocationStatus('detected');
      setLocationError(null);
      fetchAddressForCoordinates(lat, lng);
    } else {
      setLocationError('Invalid coordinates. Please enter e.g. 31.568954, 73.183301 or paste a Google Maps link.');
    }
  };

  // High-accuracy True Device GPS Detection with Satellite Watcher
  const detectLocation = () => {
    setLocationStatus('detecting');
    setLocationError(null);

    if (typeof window === 'undefined' || !navigator.geolocation) {
      setLocationStatus('error');
      setLocationError('Geolocation is not supported by your browser. Please enter coordinates or use the preset below.');
      return;
    }

    // Clear any active watcher
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    let gotPosition = false;

    // 1. High-accuracy immediate GPS query
    navigator.geolocation.getCurrentPosition(
      (position) => {
        gotPosition = true;
        const { latitude, longitude, accuracy } = position.coords;
        setCoords({ latitude, longitude, accuracy });
        setLocationStatus('detected');
        fetchAddressForCoordinates(latitude, longitude);
      },
      (error) => {
        if (!gotPosition) {
          console.warn('GPS query notice:', error?.message);
          if (error.code === error.PERMISSION_DENIED) {
            setLocationStatus('error');
            setLocationError('Location permission was denied. Click the lock/settings icon 🔒 in your browser address bar, set Location to "Allow", and try again.');
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            setLocationStatus('error');
            setLocationError('Device location hardware is unavailable. Ensure Location is turned on in your device settings, or click on the map.');
          } else if (error.code === error.TIMEOUT) {
            // Secondary attempt: standard network query
            navigator.geolocation.getCurrentPosition(
              (pos) => {
                gotPosition = true;
                const { latitude, longitude, accuracy } = pos.coords;
                setCoords({ latitude, longitude, accuracy });
                setLocationStatus('detected');
                fetchAddressForCoordinates(latitude, longitude);
              },
              () => {
                setLocationStatus('error');
                setLocationError('GPS lock timed out. You can paste your coordinates or click directly on the map to set your pin.');
              },
              { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 }
            );
          } else {
            setLocationStatus('error');
            setLocationError('Could not capture GPS. Please click on the map or enter coordinates below.');
          }
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 5000,
      }
    );

    // 2. Continuous refining satellite watcher
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        gotPosition = true;
        const { latitude, longitude, accuracy } = position.coords;
        setCoords({ latitude, longitude, accuracy });
        setLocationStatus('detected');
        fetchAddressForCoordinates(latitude, longitude);

        if (accuracy <= 20) {
          if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
          }
        }
      },
      () => {},
      {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 0,
      }
    );
    watchIdRef.current = watchId;

    // Safety timeout: stop watcher after 12 seconds
    setTimeout(() => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    }, 12000);
  };

  // Forward geocoding: Search street/sector/landmark in Pakistan
  const handleSearchPlaces = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearchingPlaces(true);
    setLocationError(null);

    try {
      const res = await fetch(`/api/geocode?action=search&q=${encodeURIComponent(searchQuery.trim())}`);
      if (res.ok) {
        const data = await res.json();
        const results: SearchResult[] = data.results || [];
        if (results.length > 0) {
          setSearchResults(results);
          setShowSearchResults(true);
          // Auto select first match
          selectSearchResult(results[0]);
        } else {
          setLocationError('No matching places found in Pakistan. Please refine your street or town name.');
        }
      }
    } catch {
      setLocationError('Place search failed. Please check internet connection.');
    } finally {
      setIsSearchingPlaces(false);
    }
  };

  const selectSearchResult = (item: SearchResult) => {
    const lat = parseFloat(item.lat);
    const lon = parseFloat(item.lon);
    setCoords({ latitude: lat, longitude: lon, accuracy: 5 }); // Exact search pin
    setLocationName(item.display_name);
    setLocationStatus('detected');
    setShowSearchResults(false);
  };

  // Select a regional quick preset
  const handleSelectPreset = (preset: typeof REGIONAL_QUICK_PRESETS[0]) => {
    setActivePreset(preset.name);
    setCoords({ latitude: preset.lat, longitude: preset.lng, accuracy: 10 });
    setLocationName(preset.address);
    setLocationStatus('detected');
  };

  // Handle manual pin repositioning from map click or drag
  const handleMapPinChange = (lat: number, lng: number, acc?: number) => {
    setCoords({ latitude: lat, longitude: lng, accuracy: acc || 5 });
    setLocationStatus('detected');
    fetchAddressForCoordinates(lat, lng);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!phone || phone.trim().length < 10) {
      setErrorMessage('Please provide a valid contact mobile number for emergency dispatch call.');
      return;
    }

    if (!coords && !locationName.trim()) {
      setErrorMessage('Please detect your location or search your street address.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/public-complaint/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'gas_leak_emergency',
          phone: phone.trim(),
          locationName: locationName.trim(),
          latitude: coords?.latitude,
          longitude: coords?.longitude,
          accuracy: coords?.accuracy,
          severity,
          description: description.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMessage(data.error || 'Failed to dispatch emergency leak report.');
      } else {
        setEmergencyResult({
          token: data.token,
          complaintId: data.complaintId,
          trackingUrl: data.trackingUrl,
        });
      }
    } catch {
      setErrorMessage('Network communication error. Please call 1199 directly!');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyLink = () => {
    if (!emergencyResult) return;
    const fullUrl = `${window.location.origin}${emergencyResult.trackingUrl}`;
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 100 }}>
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()} 
        style={{
          maxWidth: '740px',
          width: '100%',
          maxHeight: 'min(90vh, 90dvh)',
          borderRadius: '14px',
          padding: 0,
          overflow: 'hidden',
          border: '2px solid #dc2626',
          boxShadow: '0 25px 60px -15px rgba(220, 38, 38, 0.4)',
          display: 'flex',
          flexDirection: 'column',
          background: '#ffffff',
          margin: 'auto'
        }}
      >
        {/* Emergency Alert Header (Fixed at top) */}
        <div style={{
          background: 'linear-gradient(135deg, #991b1b 0%, #dc2626 100%)',
          color: '#ffffff',
          padding: '18px 22px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.2)',
              border: '2px solid #ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              flexShrink: 0
            }}>
              <Flame className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#fee2e2', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                SNGPL 1199 Emergency Control
              </div>
              <h2 style={{ fontSize: '18px', fontWeight: '900', margin: 0, color: '#ffffff' }}>
                Gas Leak Emergency Dispatch (Precision GPS)
              </h2>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <a
              href="tel:1199"
              style={{
                background: '#ffffff',
                color: '#dc2626',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '12.5px',
                fontWeight: '800',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <PhoneCall className="w-3.5 h-3.5" /> Call 1199
            </a>
            <button 
              type="button" 
              onClick={onClose}
              style={{ background: 'transparent', border: 'none', color: '#ffffff', cursor: 'pointer', padding: '4px' }}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body & Footer */}
        {emergencyResult ? (
          /* Emergency Success View */
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
            <div style={{ textAlign: 'center', padding: '10px 0' }}>
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: '#fef2f2',
                border: '3px solid #dc2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 14px auto',
                color: '#dc2626'
              }}>
                <ShieldAlert className="w-8 h-8" />
              </div>

              <h3 style={{ fontSize: '20px', fontWeight: '900', color: '#991b1b', marginBottom: '6px' }}>
                Emergency Alert Transmitted to SNGPL Rapid Team!
              </h3>
              <p style={{ color: '#475569', fontSize: '13.5px', maxWidth: '500px', margin: '0 auto 18px auto', lineHeight: '1.5' }}>
                Your exact GPS coordinates have been recorded in the regional emergency dispatch system. The nearest mobile emergency van is being notified.
              </p>

              {/* Life-Safety Box */}
              <div style={{
                background: '#fffbeb',
                border: '1px solid #fde68a',
                borderRadius: '8px',
                padding: '12px 16px',
                textAlign: 'left',
                marginBottom: '18px'
              }}>
                <div style={{ fontWeight: '800', color: '#b45309', fontSize: '12.5px', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <span>Immediate Life-Safety Protocols:</span>
                </div>
                <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: '#78350f', lineHeight: '1.5' }}>
                  <li><strong>Turn off the main meter control valve</strong> immediately if safe.</li>
                  <li><strong>Do NOT operate electrical switches, bells, or phones indoors</strong> (sparks can ignite gas).</li>
                  <li><strong>Open all doors & windows</strong> for cross-ventilation and evacuate.</li>
                </ul>
              </div>

              {/* Public Tracking Box */}
              <div style={{
                background: '#f8fafc',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                padding: '14px',
                marginBottom: '18px',
                textAlign: 'left'
              }}>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', marginBottom: '4px' }}>
                  Emergency Tracking Token:
                </div>
                <div style={{
                  fontFamily: 'monospace',
                  fontSize: '12.5px',
                  fontWeight: '700',
                  color: '#dc2626',
                  wordBreak: 'break-all',
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span>{emergencyResult.token}</span>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    style={{
                      background: copied ? '#10b981' : '#f1f5f9',
                      color: copied ? '#ffffff' : '#334155',
                      border: '1px solid #cbd5e1',
                      borderRadius: '4px',
                      padding: '4px 10px',
                      fontSize: '11.5px',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      flexShrink: 0
                    }}
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copied ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '20px' }}>
                <Link
                  href={emergencyResult.trackingUrl}
                  className="btn btn-primary"
                  style={{
                    background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                    height: '42px',
                    padding: '0 20px',
                    fontSize: '13.5px',
                    fontWeight: '700',
                    borderRadius: '8px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    textDecoration: 'none'
                  }}
                >
                  <span>View Emergency Status & GPS Pin</span>
                  <ExternalLink className="w-4 h-4" />
                </Link>
                <button
                  type="button"
                  onClick={onClose}
                  className="btn btn-secondary"
                  style={{
                    height: '42px',
                    padding: '0 20px',
                    fontSize: '13.5px',
                    fontWeight: '600',
                    borderRadius: '8px',
                    background: '#ffffff',
                    border: '1.5px solid #cbd5e1',
                    color: '#475569',
                    cursor: 'pointer'
                  }}
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Emergency Report Form with Fixed Bottom Actions */
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
            
            {/* Scrollable Form Body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>

              {/* 1. LOCATION ACQUISITION TOOLBOX */}
              <div style={{
                background: '#f8fafc',
                border: '1px solid #cbd5e1',
                borderRadius: '10px',
                padding: '16px',
                marginBottom: '18px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <strong style={{ fontSize: '13.5px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Navigation className="w-4 h-4 text-sky-600" />
                      <span>Accurate Location & Pinpoint GIS</span>
                    </strong>
                    <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                      Detect via GPS, search your exact street, or click anywhere on the map
                    </div>
                  </div>

                  {/* Primary GPS Button */}
                  <button
                    type="button"
                    onClick={detectLocation}
                    disabled={locationStatus === 'detecting'}
                    style={{
                      background: locationStatus === 'detected' ? '#047857' : 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '8px 14px',
                      fontSize: '12.5px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: '0 2px 6px rgba(2, 132, 199, 0.25)'
                    }}
                  >
                    {locationStatus === 'detecting' ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Locking Satellite GPS...</span>
                      </>
                    ) : locationStatus === 'detected' ? (
                      <>
                        <Crosshair className="w-4 h-4 text-emerald-300" />
                        <span>Recalibrate GPS Pin</span>
                      </>
                    ) : (
                      <>
                        <Crosshair className="w-4 h-4" />
                        <span>Detect My GPS Location</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Search Street / Area Input */}
                <div style={{ marginBottom: '12px', position: 'relative' }}>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <div style={{ position: 'relative', flexGrow: 1 }}>
                      <Search className="w-4 h-4 text-slate-400" style={{ position: 'absolute', left: '10px', top: '11px' }} />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search street, sector, colony (e.g. F-8/2 Islamabad, Johar Town Lahore, Hayatabad)..."
                        className="form-input"
                        style={{ paddingLeft: '32px', height: '38px', fontSize: '12.5px', width: '100%' }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleSearchPlaces(e);
                          }
                        }}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleSearchPlaces}
                      disabled={isSearchingPlaces}
                      className="btn btn-secondary"
                      style={{ padding: '0 14px', fontSize: '12px', fontWeight: '700', height: '38px', flexShrink: 0 }}
                    >
                      {isSearchingPlaces ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Find Area'}
                    </button>
                  </div>

                  {/* Search Results Dropdown */}
                  {showSearchResults && searchResults.length > 0 && (
                    <div style={{
                      position: 'absolute',
                      top: '42px',
                      left: 0,
                      right: 0,
                      background: '#ffffff',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      boxShadow: '0 6px 18px rgba(0,0,0,0.15)',
                      zIndex: 1000,
                      maxHeight: '180px',
                      overflowY: 'auto'
                    }}>
                      {searchResults.map((item) => (
                        <div
                          key={item.place_id}
                          onClick={() => selectSearchResult(item)}
                          style={{
                            padding: '8px 12px',
                            fontSize: '12px',
                            borderBottom: '1px solid #f1f5f9',
                            cursor: 'pointer',
                            color: '#1e293b'
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = '#f0f9ff')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = '#ffffff')}
                        >
                          📍 {item.display_name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Quick SNGPL Regional Sectors Presets */}
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Compass className="w-3 h-3 text-sky-600" />
                    <span>Quick Area Jump (Click to center map on your city/sector):</span>
                  </div>
                  <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                    {REGIONAL_QUICK_PRESETS.map((p) => (
                      <button
                        key={p.name}
                        type="button"
                        onClick={() => handleSelectPreset(p)}
                        style={{
                          background: activePreset === p.name ? '#0284c7' : '#ffffff',
                          color: activePreset === p.name ? '#ffffff' : '#334155',
                          border: '1px solid #cbd5e1',
                          borderRadius: '4px',
                          padding: '3px 8px',
                          fontSize: '11px',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
                      >
                        {p.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Paste Exact Coordinates or Google Maps Pin */}
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <div style={{ position: 'relative', flexGrow: 1 }}>
                      <Crosshair className="w-4 h-4 text-emerald-600" style={{ position: 'absolute', left: '10px', top: '11px' }} />
                      <input
                        type="text"
                        value={coordsInput}
                        onChange={(e) => setCoordsInput(e.target.value)}
                        placeholder="Paste exact coordinates or Google Maps link (e.g. 31.568954, 73.183301)..."
                        className="form-input"
                        style={{ paddingLeft: '32px', height: '38px', fontSize: '12.5px', width: '100%', borderColor: '#a7f3d0' }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleApplyCoordinates();
                          }
                        }}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleApplyCoordinates()}
                      className="btn btn-primary"
                      style={{
                        background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                        padding: '0 16px',
                        fontSize: '12px',
                        fontWeight: '700',
                        height: '38px',
                        flexShrink: 0,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      <span>Set Pin</span>
                    </button>
                  </div>
                </div>

                {/* Interactive Leaflet Map with Click & Drag to Pin */}
                <div style={{ marginBottom: '12px' }}>
                  <InteractiveEmergencyMap
                    latitude={coords?.latitude || 31.568954}
                    longitude={coords?.longitude || 73.183301}
                    accuracy={coords?.accuracy}
                    onLocationChange={handleMapPinChange}
                  />
                </div>

                {/* Accurate GPS / Address Feedback Strip */}
                {coords ? (
                  <div style={{
                    background: '#ecfdf5',
                    border: '1px solid #a7f3d0',
                    borderRadius: '6px',
                    padding: '12px 14px',
                    fontSize: '12px',
                    color: '#065f46'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                      <div>
                        <strong>Exact Coordinates Pinned:</strong> {coords.latitude.toFixed(6)}° N, {coords.longitude.toFixed(6)}° E
                      </div>
                      <span style={{
                        fontSize: '11px',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontWeight: '700',
                        background: (coords.accuracy || 10) <= 25 ? '#d1fae5' : '#fef3c7',
                        color: (coords.accuracy || 10) <= 25 ? '#047857' : '#b45309'
                      }}>
                        Precision: ±{Math.round(coords.accuracy || 5)}m
                      </span>
                    </div>

                    {/* Direct Editable Latitude & Longitude Inputs */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px', marginBottom: '8px' }}>
                      <div>
                        <label style={{ fontSize: '10.5px', fontWeight: '800', color: '#047857', display: 'block', marginBottom: '2px' }}>
                          Latitude (°N)
                        </label>
                        <input
                          type="number"
                          step="any"
                          value={coords.latitude}
                          onChange={(e) => {
                            const lat = parseFloat(e.target.value);
                            if (!isNaN(lat)) {
                              setCoords(prev => ({
                                latitude: lat,
                                longitude: prev?.longitude !== undefined ? prev.longitude : 73.183301,
                                accuracy: 5
                              }));
                              setLocationStatus('detected');
                            }
                          }}
                          className="form-input"
                          style={{ height: '32px', fontSize: '12px', fontWeight: '700', fontFamily: 'monospace', background: '#ffffff', borderColor: '#a7f3d0' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '10.5px', fontWeight: '800', color: '#047857', display: 'block', marginBottom: '2px' }}>
                          Longitude (°E)
                        </label>
                        <input
                          type="number"
                          step="any"
                          value={coords.longitude}
                          onChange={(e) => {
                            const lng = parseFloat(e.target.value);
                            if (!isNaN(lng)) {
                              setCoords(prev => ({
                                latitude: prev?.latitude !== undefined ? prev.latitude : 31.568954,
                                longitude: lng,
                                accuracy: 5
                              }));
                              setLocationStatus('detected');
                            }
                          }}
                          className="form-input"
                          style={{ height: '32px', fontSize: '12px', fontWeight: '700', fontFamily: 'monospace', background: '#ffffff', borderColor: '#a7f3d0' }}
                        />
                      </div>
                    </div>

                    {isReverseGeocoding ? (
                      <div style={{ fontSize: '11.5px', color: '#0369a1', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Loader2 className="w-3 h-3 animate-spin" /> Resolving exact street name...
                      </div>
                    ) : locationName ? (
                      <div style={{ fontSize: '11.5px', color: '#047857' }}>
                        📍 <strong>Resolved Address:</strong> {locationName}
                      </div>
                    ) : null}

                    <div style={{ marginTop: '8px', display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <a
                        href={`https://www.google.com/maps?q=${coords.latitude},${coords.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ fontSize: '11.5px', color: '#0284c7', fontWeight: '700', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                      >
                        <ExternalLink className="w-3 h-3" /> Verify in Google Maps
                      </a>
                    </div>
                  </div>
                ) : (
                  <div style={{ fontSize: '11.5px', color: '#64748b', background: '#f1f5f9', padding: '10px 12px', borderRadius: '6px', textAlign: 'center' }}>
                    👆 Paste coordinates (e.g. <strong>31.568954, 73.183301</strong>), choose <strong>Chak Jhumra</strong>, or click anywhere on the map above to place your emergency pin.
                  </div>
                )}

                {locationError && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    color: '#b91c1c',
                    background: '#fef2f2',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    marginTop: '8px'
                  }}>
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{locationError}</span>
                  </div>
                )}

                {/* Street Address / Landmark manual override */}
                <div style={{ marginTop: '10px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                    Confirmed Street Address, House #, or Prominent Landmark:
                  </label>
                  <input
                    type="text"
                    value={locationName}
                    onChange={(e) => setLocationName(e.target.value)}
                    placeholder="e.g. House 14, Street 8, Block G, Johar Town, near City School, Lahore"
                    className="form-input"
                    style={{ height: '38px', fontSize: '12.5px', width: '100%' }}
                  />
                </div>
              </div>

              {/* 2. LEAK SEVERITY LEVEL */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                  Leak Severity / Hazard Type <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value)}
                  className="form-input"
                  style={{ height: '40px', fontSize: '12.5px', width: '100%' }}
                >
                  <option value="Severe Gas Odor in Street / Open Pipeline">
                    🚨 Severe Gas Odor in Street / Open Pipeline
                  </option>
                  <option value="Main Distribution Pipe Rupture / Loud Hissing">
                    ⚠️ Main Distribution Pipe Rupture / Loud Hissing
                  </option>
                  <option value="Gas Leak near Domestic Meter / Service Valve">
                    🔧 Gas Leak near Domestic Meter / Service Valve
                  </option>
                  <option value="Indoor Gas Odor / Risk of Asphyxiation">
                    🏠 Indoor Gas Odor / Risk of Asphyxiation
                  </option>
                  <option value="Active Fire / Spark Hazard near Pipeline">
                    🔥 Active Fire / Spark Hazard near Pipeline (CRITICAL)
                  </option>
                </select>
              </div>

              {/* 3. CALLER PHONE */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                  Caller Mobile Number <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0300-1234567"
                  className="form-input"
                  style={{ height: '40px', fontSize: '12.5px', width: '100%' }}
                  required
                />
                <span style={{ fontSize: '11px', color: '#64748b' }}>Emergency dispatch operator will call this number immediately</span>
              </div>

              {/* 4. NOTES */}
              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                  Incident Description / Specific Hazards (Optional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe location details (e.g. underground gas line ruptured during road excavation, or odor is strongest near corner shop)..."
                  className="form-input"
                  rows={2}
                  style={{ width: '100%', fontSize: '12.5px', padding: '8px 12px', lineHeight: '1.4' }}
                />
              </div>

              {errorMessage && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#b91c1c',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  fontSize: '12.5px',
                  marginBottom: '14px'
                }}>
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

            </div>

            {/* Dedicated Modern Sticky Footer Bar */}
            <div style={{
              flexShrink: 0,
              padding: '14px 24px',
              background: '#f8fafc',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center',
              gap: '12px',
              boxShadow: '0 -4px 12px rgba(0, 0, 0, 0.04)'
            }}>
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="btn btn-secondary"
                style={{
                  height: '42px',
                  padding: '0 20px',
                  borderRadius: '8px',
                  fontSize: '13.5px',
                  fontWeight: '600',
                  background: '#ffffff',
                  border: '1.5px solid #cbd5e1',
                  color: '#475569',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                  transition: 'all 0.15s ease'
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn btn-primary"
                style={{
                  height: '42px',
                  padding: '0 24px',
                  borderRadius: '8px',
                  fontSize: '13.5px',
                  fontWeight: '800',
                  background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                  border: '1px solid #991b1b',
                  color: '#ffffff',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 3px 12px rgba(220, 38, 38, 0.35)',
                  transition: 'all 0.15s ease'
                }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Transmitting Emergency Dispatch...</span>
                  </>
                ) : (
                  <>
                    <Flame className="w-4 h-4" />
                    <span>Transmit Emergency Alert (1199)</span>
                  </>
                )}
              </button>
            </div>

          </form>
        )}
      </div>
    </div>
  );
}
