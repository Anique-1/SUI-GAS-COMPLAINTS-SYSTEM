'use client';

import React, { useEffect, useRef } from 'react';
import type * as LeafletType from 'leaflet';

interface InteractiveEmergencyMapProps {
  latitude: number;
  longitude: number;
  accuracy?: number;
  onLocationChange?: (lat: number, lng: number, accuracy?: number) => void;
  height?: string;
  zoom?: number;
}

export default function InteractiveEmergencyMap({
  latitude,
  longitude,
  accuracy,
  onLocationChange,
  height = '100%',
  zoom = 17,
}: InteractiveEmergencyMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<LeafletType.Map | null>(null);
  const markerRef = useRef<LeafletType.Marker | null>(null);
  const circleRef = useRef<LeafletType.Circle | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  // Initialize Map
  useEffect(() => {
    let isMounted = true;

    // Dynamically import Leaflet so it never executes on server
    import('leaflet').then((L) => {
      if (!isMounted || !mapContainerRef.current) return;

      // If map is already initialized on this container
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
        mapInstanceRef.current.setView([latitude, longitude], zoom);
        if (markerRef.current) {
          markerRef.current.setLatLng([latitude, longitude]);
        }
        if (circleRef.current) {
          if (accuracy && accuracy > 0) {
            circleRef.current.setLatLng([latitude, longitude]);
            circleRef.current.setRadius(accuracy);
          } else {
            circleRef.current.setRadius(0);
          }
        }
        return;
      }

      // Custom pulsing emergency pin
      const customPulseIcon = L.divIcon({
        className: 'sngpl-emergency-map-pin',
        html: `
          <div style="position: relative; width: 36px; height: 36px;">
            <div style="position: absolute; inset: 0; border-radius: 50%; background: rgba(220, 38, 38, 0.4); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="position: absolute; inset: 4px; border-radius: 50%; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); border: 2.5px solid #ffffff; box-shadow: 0 3px 10px rgba(0,0,0,0.45); display: flex; align-items: center; justify-content: center; color: white; font-size: 14px; font-weight: bold;">
              🚨
            </div>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      // Initialize Leaflet map
      const map = L.map(mapContainerRef.current, {
        center: [latitude, longitude],
        zoom: zoom,
        zoomControl: true,
      });

      // Standard OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap | SNGPL Emergency GIS',
      }).addTo(map);

      // Draggable emergency marker
      const marker = L.marker([latitude, longitude], {
        icon: customPulseIcon,
        draggable: !!onLocationChange,
      }).addTo(map);

      marker.bindPopup(
        `<div style="font-size: 12px; line-height: 1.4; color: #0f172a;">
          <strong style="color: #dc2626;">🚨 Incident Location Pinned</strong><br/>
          <span>${latitude.toFixed(6)}° N, ${longitude.toFixed(6)}° E</span>
          ${onLocationChange ? '<br/><span style="font-size: 10.5px; color: #64748b;">(Click map or drag pin to fine-tune)</span>' : ''}
        </div>`
      );

      // Accuracy circle if available
      let circle: LeafletType.Circle | null = null;
      if (accuracy && accuracy > 0) {
        circle = L.circle([latitude, longitude], {
          radius: accuracy,
          color: '#ef4444',
          fillColor: '#f87171',
          fillOpacity: 0.15,
          weight: 1,
        }).addTo(map);
        circleRef.current = circle;
      }

      // Handle marker drag
      if (onLocationChange) {
        marker.on('dragend', (e) => {
          const newPos = (e.target as LeafletType.Marker).getLatLng();
          onLocationChange(newPos.lat, newPos.lng, 5);
        });

        // Handle map click to reposition pin
        map.on('click', (e) => {
          const { lat, lng } = e.latlng;
          marker.setLatLng([lat, lng]);
          marker.openPopup();
          if (circleRef.current) {
            circleRef.current.setLatLng([lat, lng]);
            circleRef.current.setRadius(5);
          }
          onLocationChange(lat, lng, 5);
        });
      }

      mapInstanceRef.current = map;
      markerRef.current = marker;

      // Invalidate size immediately and after layout animations
      map.invalidateSize();
      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 200);
      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 500);

      // ResizeObserver to handle modal transitions, drawer animations, and window resizing
      if (mapContainerRef.current && typeof ResizeObserver !== 'undefined') {
        const ro = new ResizeObserver(() => {
          if (mapInstanceRef.current) {
            mapInstanceRef.current.invalidateSize();
          }
        });
        ro.observe(mapContainerRef.current);
        resizeObserverRef.current = ro;
      }
    });

    return () => {
      isMounted = false;
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update position smoothly whenever coordinates change
  useEffect(() => {
    if (mapInstanceRef.current && markerRef.current) {
      mapInstanceRef.current.invalidateSize();
      mapInstanceRef.current.setView([latitude, longitude], zoom);
      markerRef.current.setLatLng([latitude, longitude]);
      markerRef.current
        .bindPopup(
          `<div style="font-size: 12px; line-height: 1.4; color: #0f172a;">
            <strong style="color: #dc2626;">🚨 Exact Incident Spot Pinned</strong><br/>
            <span>Lat: <strong>${latitude.toFixed(6)}°</strong></span><br/>
            <span>Lng: <strong>${longitude.toFixed(6)}°</strong></span>
            ${onLocationChange ? '<br/><span style="font-size: 10.5px; color: #64748b;">(Drag pin or click map to fine-tune)</span>' : ''}
          </div>`
        )
        .openPopup();

      if (circleRef.current) {
        if (accuracy && accuracy > 0) {
          circleRef.current.setLatLng([latitude, longitude]);
          circleRef.current.setRadius(accuracy);
        } else {
          circleRef.current.setRadius(0);
        }
      }
    }
  }, [latitude, longitude, accuracy, zoom]);

  const handleCenterOnMarker = () => {
    if (mapInstanceRef.current && markerRef.current) {
      mapInstanceRef.current.invalidateSize();
      mapInstanceRef.current.setView([latitude, longitude], zoom);
      markerRef.current.openPopup();
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: height || '280px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #cbd5e1' }}>
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />

      {/* Map Control: Re-center target button */}
      <button
        type="button"
        onClick={handleCenterOnMarker}
        title="Center map on pin"
        style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          background: '#ffffff',
          color: '#0f172a',
          border: '2px solid rgba(0,0,0,0.2)',
          borderRadius: '4px',
          width: '32px',
          height: '32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 500,
          boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
          fontSize: '16px'
        }}
      >
        🎯
      </button>

      {/* Instruction Badge */}
      {onLocationChange && (
        <div style={{
          position: 'absolute',
          bottom: '8px',
          left: '8px',
          background: 'rgba(15, 23, 42, 0.85)',
          color: '#ffffff',
          padding: '4px 10px',
          borderRadius: '4px',
          fontSize: '11px',
          zIndex: 500,
          pointerEvents: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <span>📍 Click or drag pin to your exact building or street</span>
        </div>
      )}
    </div>
  );
}
