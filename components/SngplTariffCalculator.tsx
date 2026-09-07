'use client';

import React, { useState, useId } from 'react';
import { Calculator, Flame, Info, Check, ShieldCheck, AlertTriangle, ArrowRight, Zap } from 'lucide-react';

interface TariffCalculatorProps {
  onDisputeWithCalculated?: (units: number, estimatedAmount: number) => void;
}

export default function SngplTariffCalculator({ onDisputeWithCalculated }: TariffCalculatorProps) {
  const [category, setCategory] = useState<'protected' | 'unprotected'>('protected');
  const [inputMode, setInputMode] = useState<'direct' | 'meter'>('direct');
  const [hm3Value, setHm3Value] = useState<number>(0.45);
  const [prevReading, setPrevReading] = useState<string>('1240');
  const [currReading, setCurrReading] = useState<string>('1285');

  const meterInputId = useId();
  const prevReadingInputId = useId();
  const currReadingInputId = useId();

  // Effective HM3 consumption
  const effectiveHm3 = inputMode === 'direct'
    ? Math.max(0, hm3Value)
    : Math.max(0, (parseFloat(currReading) || 0) - (parseFloat(prevReading) || 0)) / 100;

  // Real SNGPL GCV standard ~ 990-1000 BTU/cu.ft => factor 3.55
  const mmbtu = effectiveHm3 * 3.55;

  // Real OGRA Slabs (2024-2026 Notification)
  // Protected slabs (rates per MMBTU)
  const protectedSlabs = [
    { maxHm3: 0.25, maxMmbtu: 0.9, rate: 200, label: 'Slab 1: Up to 0.25 HM³' },
    { maxHm3: 0.50, maxMmbtu: 1.8, rate: 300, label: 'Slab 2: Up to 0.50 HM³' },
    { maxHm3: 0.60, maxMmbtu: 2.1, rate: 350, label: 'Slab 3: Up to 0.60 HM³' },
    { maxHm3: 0.90, maxMmbtu: 3.2, rate: 400, label: 'Slab 4: Up to 0.90 HM³' },
  ];

  // Non-protected slabs (rates per MMBTU)
  const unprotectedSlabs = [
    { maxHm3: 0.25, rate: 500, label: 'Slab 1: Up to 0.25 HM³' },
    { maxHm3: 0.60, rate: 850, label: 'Slab 2: Up to 0.60 HM³' },
    { maxHm3: 1.00, rate: 1250, label: 'Slab 3: Up to 1.00 HM³' },
    { maxHm3: 1.50, rate: 1450, label: 'Slab 4: Up to 1.50 HM³' },
    { maxHm3: 2.00, rate: 1900, label: 'Slab 5: Up to 2.00 HM³' },
    { maxHm3: 3.00, rate: 3300, label: 'Slab 6: Up to 3.00 HM³' },
    { maxHm3: 4.00, rate: 3800, label: 'Slab 7: Up to 4.00 HM³' },
    { maxHm3: 9999, rate: 4200, label: 'Slab 8: Above 4.00 HM³' },
  ];

  // Calculate Gas Charges based on OGRA progressive tariff slab
  let gasCharges = 0;
  let activeSlabIndex = 0;

  if (category === 'protected') {
    if (effectiveHm3 <= 0.25) {
      gasCharges = mmbtu * 200;
      activeSlabIndex = 0;
    } else if (effectiveHm3 <= 0.50) {
      gasCharges = mmbtu * 300;
      activeSlabIndex = 1;
    } else if (effectiveHm3 <= 0.60) {
      gasCharges = mmbtu * 350;
      activeSlabIndex = 2;
    } else {
      gasCharges = mmbtu * 400;
      activeSlabIndex = 3;
    }
  } else {
    // Unprotected category
    if (effectiveHm3 <= 0.25) {
      gasCharges = mmbtu * 500;
      activeSlabIndex = 0;
    } else if (effectiveHm3 <= 0.60) {
      gasCharges = mmbtu * 850;
      activeSlabIndex = 1;
    } else if (effectiveHm3 <= 1.00) {
      gasCharges = mmbtu * 1250;
      activeSlabIndex = 2;
    } else if (effectiveHm3 <= 1.50) {
      gasCharges = mmbtu * 1450;
      activeSlabIndex = 3;
    } else if (effectiveHm3 <= 2.00) {
      gasCharges = mmbtu * 1900;
      activeSlabIndex = 4;
    } else if (effectiveHm3 <= 3.00) {
      gasCharges = mmbtu * 3300;
      activeSlabIndex = 5;
    } else if (effectiveHm3 <= 4.00) {
      gasCharges = mmbtu * 3800;
      activeSlabIndex = 6;
    } else {
      gasCharges = mmbtu * 4200;
      activeSlabIndex = 7;
    }
  }

  // Real SNGPL Fixed Charges & Meter Rent
  const meterRent = category === 'protected' ? 50 : 500;
  const fixedCharges = category === 'protected' ? 400 : (effectiveHm3 <= 1.5 ? 1000 : 2000);

  // Subtotal before GST
  const subtotal = gasCharges + meterRent + fixedCharges;

  // General Sales Tax @ 18%
  const gst = subtotal * 0.18;

  // Total Estimated Bill (rounded to nearest rupee)
  const totalEstimatedBill = Math.round(subtotal + gst);

  return (
    <div id="tariff-calculator" style={{
      background: '#ffffff',
      borderRadius: '12px',
      border: '1px solid #e2e8f0',
      boxShadow: '0 8px 30px rgba(0,0,0,0.06)',
      overflow: 'hidden',
      maxWidth: '1100px',
      margin: '0 auto',
    }}>
      {/* Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)',
        color: '#ffffff',
        padding: '24px 28px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '10px',
            background: 'rgba(56, 189, 248, 0.2)',
            border: '1px solid rgba(56, 189, 248, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#38bdf8'
          }}>
            <Calculator className="w-6 h-6" />
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#93c5fd', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Official OGRA Domestic Tariff
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: '800', margin: '2px 0 0 0', color: '#ffffff' }}>
              SNGPL Gas Bill & Slab Estimator
            </h3>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.1)', padding: '6px 14px', borderRadius: '20px', fontSize: '12px', border: '1px solid rgba(255,255,255,0.2)' }}>
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>FY 2024–2026 Progressive Slabs</span>
        </div>
      </div>

      <div style={{ padding: '24px 28px' }}>
        {/* Category Selector Tabs */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '12.5px', fontWeight: '700', color: '#475569', marginBottom: '8px' }}>
            SELECT CONSUMER CATEGORY:
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
            <button
              type="button"
              onClick={() => {
                setCategory('protected');
                if (hm3Value > 0.9) setHm3Value(0.85);
              }}
              style={{
                padding: '14px 18px',
                borderRadius: '8px',
                border: category === 'protected' ? '2px solid #0284c7' : '1px solid #cbd5e1',
                background: category === 'protected' ? '#f0f9ff' : '#ffffff',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <strong style={{ color: category === 'protected' ? '#0369a1' : '#1e293b', fontSize: '14px' }}>
                  Protected Domestic Consumer
                </strong>
                {category === 'protected' && <Check className="w-4 h-4 text-sky-600" />}
              </div>
              <div style={{ fontSize: '11.5px', color: '#64748b', lineHeight: '1.4' }}>
                Average winter consumption ≤ 0.9 HM³ (~3.2 MMBTU). Subsidized meter rent (Rs. 50) & fixed charges (Rs. 400).
              </div>
            </button>

            <button
              type="button"
              onClick={() => setCategory('unprotected')}
              style={{
                padding: '14px 18px',
                borderRadius: '8px',
                border: category === 'unprotected' ? '2px solid #0284c7' : '1px solid #cbd5e1',
                background: category === 'unprotected' ? '#f0f9ff' : '#ffffff',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <strong style={{ color: category === 'unprotected' ? '#0369a1' : '#1e293b', fontSize: '14px' }}>
                  Non-Protected / Regular Domestic
                </strong>
                {category === 'unprotected' && <Check className="w-4 h-4 text-sky-600" />}
              </div>
              <div style={{ fontSize: '11.5px', color: '#64748b', lineHeight: '1.4' }}>
                Winter consumption &gt; 0.9 HM³. Standard meter rent (Rs. 500) & progressive fixed charges (Rs. 1,000–2,000).
              </div>
            </button>
          </div>
        </div>

        {/* Two Column Layout: Controls & Output */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', alignItems: 'start' }}>

          {/* Left Column: Input and Presets */}
          <div>
            {/* Input Mode Toggle */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <button
                type="button"
                onClick={() => setInputMode('direct')}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: '6px',
                  fontSize: '12.5px',
                  fontWeight: '600',
                  border: inputMode === 'direct' ? '1px solid #0284c7' : '1px solid #e2e8f0',
                  background: inputMode === 'direct' ? '#0284c7' : '#f8fafc',
                  color: inputMode === 'direct' ? '#ffffff' : '#475569',
                  cursor: 'pointer'
                }}
              >
                Direct HM³ Input
              </button>
              <button
                type="button"
                onClick={() => setInputMode('meter')}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: '6px',
                  fontSize: '12.5px',
                  fontWeight: '600',
                  border: inputMode === 'meter' ? '1px solid #0284c7' : '1px solid #e2e8f0',
                  background: inputMode === 'meter' ? '#0284c7' : '#f8fafc',
                  color: inputMode === 'meter' ? '#ffffff' : '#475569',
                  cursor: 'pointer'
                }}
              >
                Meter Dial Readings
              </button>
            </div>

            {inputMode === 'direct' ? (
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '18px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <label htmlFor={meterInputId} style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b' }}>
                    Meter Units Consumed (HM³):
                  </label>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '4px 10px' }}>
                    <input
                      id={meterInputId}
                      type="number"
                      step="0.01"
                      min="0"
                      max={category === 'protected' ? '0.90' : '10.00'}
                      value={hm3Value}
                      onChange={(e) => setHm3Value(parseFloat(e.target.value) || 0)}
                      style={{ width: '70px', border: 'none', textAlign: 'right', fontWeight: '700', fontSize: '15px', color: '#0369a1', outline: 'none' }}
                    />
                    <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>HM³</span>
                  </div>
                </div>

                {/* Range Slider */}
                <input
                  type="range"
                  min="0.05"
                  max={category === 'protected' ? '0.90' : '4.50'}
                  step="0.01"
                  value={hm3Value}
                  onChange={(e) => setHm3Value(parseFloat(e.target.value))}
                  style={{ width: '100%', accentColor: '#0284c7', cursor: 'pointer', marginBottom: '12px' }}
                />

                {/* Quick Presets */}
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '11px', color: '#64748b', alignSelf: 'center', marginRight: '4px' }}>Quick:</span>
                  {(category === 'protected' ? [0.20, 0.40, 0.60, 0.85] : [0.50, 1.20, 2.00, 3.50]).map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setHm3Value(preset)}
                      style={{
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontSize: '11.5px',
                        fontWeight: '600',
                        border: '1px solid #cbd5e1',
                        background: hm3Value === preset ? '#0284c7' : '#ffffff',
                        color: hm3Value === preset ? '#ffffff' : '#334155',
                        cursor: 'pointer'
                      }}
                    >
                      {preset.toFixed(2)} HM³
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '18px', marginBottom: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label htmlFor={prevReadingInputId} style={{ fontSize: '12px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '4px' }}>
                      Previous Reading:
                    </label>
                    <input
                      id={prevReadingInputId}
                      type="number"
                      value={prevReading}
                      onChange={(e) => setPrevReading(e.target.value)}
                      placeholder="e.g. 1240"
                      className="form-input"
                      style={{ height: '40px', fontSize: '13px', textAlign: 'center' }}
                    />
                  </div>
                  <div>
                    <label htmlFor={currReadingInputId} style={{ fontSize: '12px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '4px' }}>
                      Present Dial Reading:
                    </label>
                    <input
                      id={currReadingInputId}
                      type="number"
                      value={currReading}
                      onChange={(e) => setCurrReading(e.target.value)}
                      placeholder="e.g. 1285"
                      className="form-input"
                      style={{ height: '40px', fontSize: '13px', textAlign: 'center' }}
                    />
                  </div>
                </div>
                <div style={{ fontSize: '12px', color: '#0369a1', background: '#e0f2fe', padding: '8px 12px', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Difference: <strong>{(parseFloat(currReading) || 0) - (parseFloat(prevReading) || 0)} Units</strong></span>
                  <span>= <strong>{effectiveHm3.toFixed(3)} HM³</strong></span>
                </div>
              </div>
            )}

            {/* Winter Warning for Protected Category */}
            {category === 'protected' && effectiveHm3 > 0.80 && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', background: '#fffbeb', border: '1px solid #fde68a', color: '#b45309', padding: '10px 12px', borderRadius: '6px', fontSize: '12px', marginBottom: '16px' }}>
                <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-600 mt-0.5" />
                <span>
                  <strong>Threshold Alert:</strong> Consumption is near the 0.90 HM³ threshold. Exceeding 0.90 HM³ switches your meter into the Non-Protected category with significantly higher fixed charges (Rs. 1,000+ vs Rs. 400).
                </span>
              </div>
            )}

            {/* MMBTU & Energy Value Card */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '13px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Flame className="w-4 h-4 text-orange-500" />
                <span style={{ color: '#475569' }}>Calculated Heating Energy:</span>
              </div>
              <div>
                <strong style={{ color: '#0f172a', fontSize: '15px' }}>{mmbtu.toFixed(2)} MMBTU</strong>
                <span style={{ fontSize: '11px', color: '#94a3b8', marginLeft: '4px' }}>(GCV ~ 990)</span>
              </div>
            </div>
          </div>

          {/* Right Column: Estimated Bill Breakdown */}
          <div style={{
            background: 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)',
            border: '1px solid #cbd5e1',
            borderRadius: '10px',
            padding: '20px',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.8)'
          }}>
            <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>
              Estimated Monthly Cost Breakdown
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px dashed #cbd5e1' }}>
                <span style={{ color: '#475569' }}>Gas Charges (Slab Rate):</span>
                <strong style={{ color: '#0f172a' }}>Rs. {Math.round(gasCharges).toLocaleString()}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px dashed #cbd5e1' }}>
                <span style={{ color: '#475569' }}>Meter Service Rent:</span>
                <strong style={{ color: '#0f172a' }}>Rs. {meterRent}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px dashed #cbd5e1' }}>
                <span style={{ color: '#475569' }}>Fixed Pipeline Charges:</span>
                <strong style={{ color: '#0f172a' }}>Rs. {fixedCharges}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px dashed #cbd5e1' }}>
                <span style={{ color: '#475569' }}>GST (18% Sales Tax):</span>
                <strong style={{ color: '#0f172a' }}>Rs. {Math.round(gst).toLocaleString()}</strong>
              </div>
            </div>

            {/* Big Total Payable Display */}
            <div style={{
              background: '#ffffff',
              border: '2px solid #0284c7',
              borderRadius: '8px',
              padding: '14px 18px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px',
              boxShadow: '0 4px 12px rgba(2, 132, 199, 0.12)'
            }}>
              <div>
                <div style={{ fontSize: '11px', fontWeight: '700', color: '#0284c7', textTransform: 'uppercase' }}>
                  Total Estimated Payable
                </div>
                <div style={{ fontSize: '10.5px', color: '#64748b' }}>
                  Within due date (incl. all taxes)
                </div>
              </div>
              <div style={{ fontSize: '26px', fontWeight: '900', color: '#0369a1' }}>
                Rs. {totalEstimatedBill.toLocaleString()}
              </div>
            </div>

            {/* Comparison / Dispute Action */}
            {onDisputeWithCalculated && (
              <button
                type="button"
                onClick={() => onDisputeWithCalculated(effectiveHm3, totalEstimatedBill)}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '6px',
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  color: '#0369a1',
                  fontSize: '12.5px',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  cursor: 'pointer'
                }}
              >
                <span>Found discrepancy in your bill? Dispute with this estimate</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

        </div>

        {/* Live OGRA Progressive Slab Visualizer Table */}
        <div style={{ marginTop: '24px', borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Zap className="w-4 h-4 text-amber-500" />
              <span>Current OGRA Tariff Slabs Schedule ({category === 'protected' ? 'Protected' : 'Unprotected'})</span>
            </div>
            <div style={{ fontSize: '11.5px', color: '#64748b' }}>
              Highlighted row indicates your current consumption tier
            </div>
          </div>

          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px', textAlign: 'left', minWidth: '500px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569' }}>
                  <th style={{ padding: '8px 12px', fontWeight: '700' }}>Slab Range (HM³)</th>
                  <th style={{ padding: '8px 12px', fontWeight: '700' }}>Tariff Rate (Rs./MMBTU)</th>
                  <th style={{ padding: '8px 12px', fontWeight: '700' }}>Monthly Meter Rent</th>
                  <th style={{ padding: '8px 12px', fontWeight: '700' }}>Fixed Charges</th>
                  <th style={{ padding: '8px 12px', fontWeight: '700' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {(category === 'protected' ? protectedSlabs : unprotectedSlabs).map((slab, idx) => {
                  const isActive = idx === activeSlabIndex;
                  return (
                    <tr
                      key={idx}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        background: isActive ? '#e0f2fe' : idx % 2 === 0 ? '#ffffff' : '#fafafa',
                        fontWeight: isActive ? '700' : 'normal',
                        color: isActive ? '#0369a1' : '#334155'
                      }}
                    >
                      <td style={{ padding: '8px 12px' }}>{slab.label}</td>
                      <td style={{ padding: '8px 12px' }}>Rs. {slab.rate} / MMBTU</td>
                      <td style={{ padding: '8px 12px' }}>Rs. {meterRent}</td>
                      <td style={{ padding: '8px 12px' }}>
                        Rs. {category === 'protected' ? '400' : idx <= 3 ? '1,000' : '2,000'}
                      </td>
                      <td style={{ padding: '8px 12px' }}>
                        {isActive ? (
                          <span style={{ background: '#0284c7', color: '#ffffff', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '700' }}>
                            Active Tier
                          </span>
                        ) : (
                          <span style={{ color: '#94a3b8', fontSize: '11px' }}>—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
