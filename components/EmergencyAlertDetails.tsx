'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import {
  Flame,
  AlertTriangle,
  MapPin,
  Navigation,
  PhoneCall,
  ExternalLink,
  Copy,
  Check,
  Radio,
  FileText,
  Eye,
  EyeOff
} from 'lucide-react';

const InteractiveEmergencyMap = dynamic(
  () => import('@/components/InteractiveEmergencyMap'),
  {
    ssr: false,
    loading: () => (
      <div style={{ height: '220px', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '13px', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
        <span>Loading Satellite GIS Map...</span>
      </div>
    )
  }
);

interface EmergencyAlertDetailsProps {
  description?: string | null;
  className?: string;
  style?: React.CSSProperties;
}

interface ParsedCoordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

interface ParsedEmergencyAlert {
  isEmergency: boolean;
  title?: string;
  severity?: string;
  phone?: string;
  address?: string;
  coordinates?: string;
  coords?: ParsedCoordinates;
  googleMapsUrl?: string;
  incidentDetails?: string;
  extraNotes?: string;
}

/**
 * Parses emergency alert structured text:
 * EMERGENCY ALERT - SNGPL 1199 HOTLINE RAPID DISPATCH
 * Severity Level: ...
 * Contact Phone: ...
 * Reported Address / Landmark: ...
 * Exact Coordinates: ...
 * Google Maps Pin: ...
 * Incident Details: ...
 */
export function parseEmergencyAlertText(text: string): ParsedEmergencyAlert {
  if (!text) {
    return { isEmergency: false };
  }

  const isEmergency =
    text.includes('EMERGENCY ALERT') ||
    (text.includes('Severity Level:') && text.includes('Google Maps Pin:')) ||
    text.includes('SNGPL 1199 HOTLINE');

  if (!isEmergency) {
    return { isEmergency: false };
  }

  let severity = '';
  let phone = '';
  let address = '';
  let coordinates = '';
  let googleMapsUrl = '';
  let incidentDetails = '';
  const otherLines: string[] = [];

  const lines = text.split('\n');
  let inIncidentDetails = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    if (line.includes('EMERGENCY ALERT')) {
      // Header line
      continue;
    }

    if (line.toLowerCase().startsWith('severity level:')) {
      severity = line.substring(line.indexOf(':') + 1).trim();
      continue;
    }

    if (line.toLowerCase().startsWith('contact phone:')) {
      phone = line.substring(line.indexOf(':') + 1).trim();
      continue;
    }

    if (
      line.toLowerCase().startsWith('reported address / landmark:') ||
      line.toLowerCase().startsWith('reported address:') ||
      line.toLowerCase().startsWith('landmark:')
    ) {
      address = line.substring(line.indexOf(':') + 1).trim();
      continue;
    }

    if (line.toLowerCase().startsWith('exact coordinates:') || line.toLowerCase().startsWith('coordinates:')) {
      coordinates = line.substring(line.indexOf(':') + 1).trim();
      continue;
    }

    if (line.toLowerCase().startsWith('google maps pin:') || line.toLowerCase().startsWith('google maps:')) {
      googleMapsUrl = line.substring(line.indexOf(':') + 1).trim();
      continue;
    }

    if (line.toLowerCase().startsWith('incident details:')) {
      inIncidentDetails = true;
      const rest = line.substring(line.indexOf(':') + 1).trim();
      if (rest) incidentDetails += rest + '\n';
      continue;
    }

    if (inIncidentDetails) {
      incidentDetails += line + '\n';
    } else {
      otherLines.push(line);
    }
  }

  // If googleMapsUrl wasn't found in a prefix line, look for any URL in the text
  if (!googleMapsUrl) {
    const urlMatch = text.match(/https?:\/\/(?:www\.)?google\.com\/maps[^\s]*/i) ||
      text.match(/https?:\/\/[^\s]+/i);
    if (urlMatch) {
      googleMapsUrl = urlMatch[0];
    }
  }

  // Parse numerical latitude and longitude for live map rendering
  let coords: ParsedCoordinates | undefined;
  if (coordinates) {
    const m = coordinates.match(/(-?\d+\.\d+)[,\s]+(-?\d+\.\d+)/);
    if (m) {
      const lat = parseFloat(m[1]);
      const lng = parseFloat(m[2]);
      const accMatch = coordinates.match(/(?:accuracy[:\s]*±?\s*)(\d+)/i);
      const acc = accMatch ? parseInt(accMatch[1], 10) : undefined;
      if (!isNaN(lat) && !isNaN(lng)) {
        coords = { latitude: lat, longitude: lng, accuracy: acc };
      }
    }
  }

  // Fallback to coordinates in googleMapsUrl e.g. q=31.568954,73.183301
  if (!coords && googleMapsUrl) {
    const m = googleMapsUrl.match(/[?&]q=(-?\d+\.\d+)[,\s]+(-?\d+\.\d+)/);
    if (m) {
      const lat = parseFloat(m[1]);
      const lng = parseFloat(m[2]);
      if (!isNaN(lat) && !isNaN(lng)) {
        coords = { latitude: lat, longitude: lng };
      }
    }
  }

  return {
    isEmergency: true,
    title: 'EMERGENCY ALERT — SNGPL 1199 RAPID DISPATCH',
    severity: severity || undefined,
    phone: phone || undefined,
    address: address || undefined,
    coordinates: coordinates || undefined,
    coords,
    googleMapsUrl: googleMapsUrl || undefined,
    incidentDetails: incidentDetails.trim() || undefined,
    extraNotes: otherLines.length > 0 ? otherLines.join('\n') : undefined
  };
}

/**
 * Component to make plain URLs and phone numbers clickable in generic text
 */
function AutoLinkedContent({ text }: { text: string }) {
  if (!text) return null;

  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);

  return (
    <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6', wordBreak: 'break-word' }}>
      {parts.map((part, index) => {
        if (part.match(/^https?:\/\//)) {
          return (
            <a
              key={index}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: '#0284c7',
                fontWeight: '600',
                textDecoration: 'underline',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px'
              }}
            >
              <span>{part}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          );
        }
        return <span key={index}>{part}</span>;
      })}
    </div>
  );
}

export default function EmergencyAlertDetails({
  description,
  className = '',
  style = {}
}: EmergencyAlertDetailsProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [showMap, setShowMap] = useState(true);

  if (!description) {
    return <em style={{ color: '#94a3b8', fontSize: '12.5px' }}>No description details provided.</em>;
  }

  const parsed = parseEmergencyAlertText(description);

  // If not formatted as emergency alert, render with automatic link detection
  if (!parsed.isEmergency) {
    return <AutoLinkedContent text={description} />;
  }

  const handleCopyMap = () => {
    if (parsed.googleMapsUrl) {
      navigator.clipboard.writeText(parsed.googleMapsUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <div
      className={className}
      style={{
        background: 'linear-gradient(135deg, #ffffff 0%, #fffbfb 100%)',
        border: '1.5px solid #fca5a5',
        borderRadius: '10px',
        overflow: 'hidden',
        boxShadow: '0 4px 18px rgba(220, 38, 38, 0.08)',
        ...style
      }}
    >
      {/* 1. EMERGENCY TOP HEADER */}
      <div
        style={{
          background: 'linear-gradient(135deg, #991b1b 0%, #dc2626 100%)',
          color: '#ffffff',
          padding: '10px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '8px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '800', fontSize: '13px', letterSpacing: '0.03em' }}>
          <Flame className="w-4 h-4 text-amber-300 animate-pulse flex-shrink-0" />
          <span>{parsed.title}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              fontSize: '11px',
              fontWeight: '800',
              padding: '2px 9px',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.35)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Radio className="w-3 h-3 animate-ping" />
            <span>CRITICAL DISPATCH</span>
          </span>
        </div>
      </div>

      {/* 2. STRUCTURED DETAILS BODY */}
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        
        {/* Info Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '12px'
          }}
        >
          {/* A. Severity Level */}
          {parsed.severity && (
            <div
              style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                padding: '10px 12px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px'
              }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '6px',
                  background: '#fee2e2',
                  color: '#dc2626',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <div style={{ fontSize: '10.5px', fontWeight: '800', color: '#991b1b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Severity Level
                </div>
                <div style={{ fontSize: '13px', fontWeight: '800', color: '#b91c1c', marginTop: '2px', lineHeight: '1.3' }}>
                  {parsed.severity}
                </div>
              </div>
            </div>
          )}

          {/* B. Contact Phone (Clickable Link) */}
          {parsed.phone && (
            <div
              style={{
                background: '#ecfdf5',
                border: '1px solid #a7f3d0',
                borderRadius: '8px',
                padding: '10px 12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '6px',
                    background: '#d1fae5',
                    color: '#059669',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  <PhoneCall className="w-4 h-4" />
                </div>
                <div>
                  <div style={{ fontSize: '10.5px', fontWeight: '800', color: '#065f46', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Contact Phone
                  </div>
                  <a
                    href={`tel:${parsed.phone.replace(/[^\d+]/g, '')}`}
                    style={{
                      fontSize: '13.5px',
                      fontWeight: '800',
                      color: '#047857',
                      fontFamily: 'monospace',
                      textDecoration: 'none',
                      marginTop: '2px',
                      display: 'block'
                    }}
                  >
                    {parsed.phone}
                  </a>
                </div>
              </div>

              <a
                href={`tel:${parsed.phone.replace(/[^\d+]/g, '')}`}
                style={{
                  background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                  color: '#ffffff',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '700',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  boxShadow: '0 2px 6px rgba(5, 150, 105, 0.25)',
                  flexShrink: 0
                }}
              >
                <PhoneCall className="w-3 h-3" />
                <span>Call</span>
              </a>
            </div>
          )}

          {/* C. Reported Address / Landmark */}
          {parsed.address && (
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '10px 12px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px'
              }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '6px',
                  background: 'rgba(220, 38, 38, 0.08)',
                  color: '#dc2626',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <div style={{ fontSize: '10.5px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Reported Address / Landmark
                </div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a', marginTop: '2px', lineHeight: '1.3' }}>
                  {parsed.address}
                </div>
              </div>
            </div>
          )}

          {/* D. Exact Coordinates & Accuracy */}
          {parsed.coordinates && (
            <div
              style={{
                background: '#f0f9ff',
                border: '1px solid #bae6fd',
                borderRadius: '8px',
                padding: '10px 12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '10px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '6px',
                    background: '#e0f2fe',
                    color: '#0284c7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  <Navigation className="w-4 h-4" />
                </div>
                <div>
                  <div style={{ fontSize: '10.5px', fontWeight: '800', color: '#0369a1', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Exact Satellite Coordinates
                  </div>
                  <div style={{ fontSize: '12.5px', fontWeight: '700', color: '#0369a1', fontFamily: 'monospace', marginTop: '2px' }}>
                    {parsed.coordinates}
                  </div>
                </div>
              </div>

              {parsed.coords && (
                <button
                  type="button"
                  onClick={() => setShowMap(!showMap)}
                  style={{
                    background: showMap ? '#e0f2fe' : '#ffffff',
                    color: '#0369a1',
                    border: '1px solid #bae6fd',
                    borderRadius: '5px',
                    padding: '4px 10px',
                    fontSize: '11.5px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  {showMap ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showMap ? 'Hide Map' : 'Show Map'}</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* 3. LIVE EMBEDDED MAP PLOTTING (Maps GPS pinpoint accurately) */}
        {parsed.coords && showMap && (
          <div
            style={{
              borderRadius: '8px',
              overflow: 'hidden',
              border: '1.5px solid #fca5a5',
              background: '#ffffff',
              boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)'
            }}
          >
            <div
              style={{
                background: '#fef2f2',
                padding: '8px 14px',
                borderBottom: '1px solid #fecaca',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '8px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '800', color: '#dc2626' }}>
                <MapPin className="w-4 h-4" />
                <span>Live Emergency GIS Map (Incident Pinned at {parsed.coords.latitude.toFixed(6)}, {parsed.coords.longitude.toFixed(6)})</span>
              </div>
              <span style={{ fontSize: '11px', color: '#991b1b', background: '#fee2e2', padding: '2px 8px', borderRadius: '4px', fontWeight: '700' }}>
                OpenStreetMap GIS Live Feed
              </span>
            </div>

            <div style={{ height: '240px', width: '100%', position: 'relative' }}>
              <InteractiveEmergencyMap
                latitude={parsed.coords.latitude}
                longitude={parsed.coords.longitude}
                accuracy={parsed.coords.accuracy}
                height="240px"
              />
            </div>
          </div>
        )}

        {/* 4. GOOGLE MAPS PIN INTERACTIVE LINK (Attractive & Clickable) */}
        {parsed.googleMapsUrl && (
          <div
            style={{
              background: 'linear-gradient(135deg, #fff7ed 0%, #fffaf5 100%)',
              border: '1.5px solid #fdba74',
              borderRadius: '8px',
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: '220px', flex: 1 }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 6px rgba(234, 88, 12, 0.3)',
                  flexShrink: 0
                }}
              >
                <MapPin className="w-5 h-5" />
              </div>
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: '11px', fontWeight: '800', color: '#9a3412', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Google Maps Pin (Rapid Dispatch Link)
                </div>
                <a
                  href={parsed.googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontSize: '12px',
                    fontWeight: '700',
                    color: '#c2410c',
                    textDecoration: 'underline',
                    wordBreak: 'break-all',
                    display: 'block',
                    marginTop: '2px'
                  }}
                  title="Open live coordinates in Google Maps"
                >
                  {parsed.googleMapsUrl}
                </a>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
              <button
                type="button"
                onClick={handleCopyMap}
                style={{
                  background: copiedLink ? '#10b981' : '#ffffff',
                  color: copiedLink ? '#ffffff' : '#475569',
                  border: '1px solid #fed7aa',
                  borderRadius: '6px',
                  padding: '7px 12px',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Copied' : 'Copy Link'}</span>
              </button>

              <a
                href={parsed.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  background: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
                  color: '#ffffff',
                  padding: '7px 16px',
                  borderRadius: '6px',
                  fontSize: '12.5px',
                  fontWeight: '800',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 8px rgba(234, 88, 12, 0.3)',
                  transition: 'all 0.15s ease'
                }}
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Open in Google Maps</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        )}

        {/* 5. INCIDENT DETAILS / CITIZEN STATEMENT (If present) */}
        {parsed.incidentDetails && (
          <div
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '12px 14px'
            }}
          >
            <div style={{ fontSize: '11px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              <span>Incident Details / Citizen Statement</span>
            </div>
            <div style={{ fontSize: '13px', color: '#1e293b', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
              {parsed.incidentDetails}
            </div>
          </div>
        )}

        {/* 6. EXTRA NOTES */}
        {parsed.extraNotes && (
          <div style={{ fontSize: '12px', color: '#64748b', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
            {parsed.extraNotes}
          </div>
        )}

      </div>
    </div>
  );
}
