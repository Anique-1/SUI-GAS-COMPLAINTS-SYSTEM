'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  X, 
  AlertOctagon, 
  CheckCircle2, 
  Loader2, 
  FileText, 
  ShieldCheck, 
  Phone, 
  Hash, 
  Gauge, 
  ExternalLink,
  Copy,
  AlertCircle
} from 'lucide-react';

interface BillDisputeModalProps {
  isOpen: boolean;
  onClose: () => void;
  billData: {
    consumerNo: string;
    consumerName: string;
    meterNo: string;
    billingMonth: string;
    totalWithinDue: string;
    currReading?: string;
    prevReading?: string;
  } | null;
  initialDisputeReason?: string;
}

export default function BillDisputeModal({
  isOpen,
  onClose,
  billData,
  initialDisputeReason
}: BillDisputeModalProps) {
  const [disputeType, setDisputeType] = useState<string>('Over-billing / Excessive Units Discrepancy');
  const [phone, setPhone] = useState<string>('');
  const [actualReading, setActualReading] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submissionResult, setSubmissionResult] = useState<{
    token: string;
    complaintId: string;
    trackingUrl: string;
  } | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    if (initialDisputeReason) {
      setDescription(initialDisputeReason);
    }
  }, [initialDisputeReason]);

  if (!isOpen || !billData) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!phone || phone.trim().length < 10) {
      setErrorMessage('Please provide a valid active mobile phone number for verification and SMS updates.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/public-complaint/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'bill_dispute',
          consumerNo: billData.consumerNo,
          consumerName: billData.consumerName,
          meterNo: billData.meterNo,
          billingMonth: billData.billingMonth,
          billAmount: billData.totalWithinDue,
          disputeType,
          phone: phone.trim(),
          actualReading: actualReading.trim(),
          description: description.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMessage(data.error || 'Failed to submit bill dispute. Please try again.');
      } else {
        setSubmissionResult({
          token: data.token,
          complaintId: data.complaintId,
          trackingUrl: data.trackingUrl,
        });
      }
    } catch {
      setErrorMessage('Network connection failed. Please check your internet connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyToken = () => {
    if (!submissionResult) return;
    const fullUrl = `${window.location.origin}${submissionResult.trackingUrl}`;
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 100 }}>
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()} 
        style={{
          maxWidth: '640px',
          width: '100%',
          maxHeight: 'min(90vh, 90dvh)',
          borderRadius: '14px',
          padding: 0,
          overflow: 'hidden',
          border: '1px solid #cbd5e1',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 50px -10px rgba(0, 0, 0, 0.3)'
        }}
      >
        {/* Modal Header */}
        <div style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          color: '#ffffff',
          padding: '18px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid #334155',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#f87171'
            }}>
              <AlertOctagon className="w-5 h-5" />
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                1-Click Dispute Registry
              </div>
              <h2 style={{ fontSize: '18px', fontWeight: '800', margin: 0, color: '#ffffff' }}>
                Dispute Gas Bill / Log Complaint
              </h2>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body & Footer */}
        {submissionResult ? (
          /* Success View */
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
            <div style={{ textAlign: 'center', padding: '12px 0' }}>
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: '#ecfdf5',
                border: '3px solid #10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px auto',
                color: '#10b981'
              }}>
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>
                Dispute Lodged Successfully!
              </h3>
              <p style={{ color: '#64748b', fontSize: '13.5px', maxWidth: '440px', margin: '0 auto 20px auto', lineHeight: '1.5' }}>
                Your formal billing dispute has been registered directly into the SNGPL Customer Care Portal. An official reference has been generated.
              </p>

              {/* Tracking Token Box */}
              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '24px',
                textAlign: 'left'
              }}>
                <div style={{ fontSize: '11.5px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', marginBottom: '4px' }}>
                  Your Secure Public Tracking Token
                </div>
                <div style={{
                  fontFamily: 'monospace',
                  fontSize: '13px',
                  fontWeight: '700',
                  color: '#0369a1',
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
                  <span>{submissionResult.token}</span>
                  <button
                    type="button"
                    onClick={handleCopyToken}
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
                    <span>{copied ? 'Copied!' : 'Copy Link'}</span>
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link
                  href={submissionResult.trackingUrl}
                  className="btn btn-primary"
                  style={{
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
                  <span>Track Dispute Status</span>
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
                  Close
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Form View */
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
            
            {/* Scrollable Body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
              {/* Auto-Filled Verified Badges Grid */}
              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '14px 16px',
                marginBottom: '20px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '700', color: '#0284c7', marginBottom: '10px' }}>
                  <ShieldCheck className="w-4 h-4 text-sky-600" />
                  <span>Auto-Verified from Bill Record (Error-Free)</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px', fontSize: '12.5px' }}>
                  <div>
                    <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>Consumer No</span>
                    <strong style={{ color: '#0f172a', fontFamily: 'monospace' }}>{billData.consumerNo}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>Consumer Name</span>
                    <strong style={{ color: '#0f172a' }}>{billData.consumerName}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>Meter Serial</span>
                    <strong style={{ color: '#0f172a', fontFamily: 'monospace' }}>{billData.meterNo}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>Billing Month</span>
                    <strong style={{ color: '#0f172a' }}>{billData.billingMonth}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>Billed Amount</span>
                    <strong style={{ color: '#b91c1c' }}>Rs. {billData.totalWithinDue}</strong>
                  </div>
                  {billData.currReading && (
                    <div>
                      <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>Billed Dial</span>
                      <strong style={{ color: '#0f172a' }}>{billData.currReading}</strong>
                    </div>
                  )}
                </div>
              </div>

              {/* Dispute Type Selection */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                  Dispute Category / Reason <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <select
                  value={disputeType}
                  onChange={(e) => setDisputeType(e.target.value)}
                  className="form-select"
                  style={{ width: '100%', height: '40px', fontSize: '13px' }}
                >
                  <option value="Over-billing / Excessive Units Discrepancy">
                    Over-billing / Excessive Units Discrepancy
                  </option>
                  <option value="Incorrect Meter Reading (Physical dial does not match bill)">
                    Incorrect Meter Reading (Physical dial does not match bill)
                  </option>
                  <option value="Wrong Tariff Slab (Protected category stripped)">
                    Wrong Tariff Slab (Protected category stripped)
                  </option>
                  <option value="Uncredited Prior Payment / Double Surcharge">
                    Uncredited Prior Payment / Double Surcharge
                  </option>
                  <option value="Defective / Slow / Stopped Meter Reading">
                    Defective / Slow / Stopped Meter Reading
                  </option>
                </select>
              </div>

              {/* Two Column: Phone and Current Reading */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                    Contact Phone (Mobile) <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Phone className="w-4 h-4 text-slate-400" style={{ position: 'absolute', left: '12px', top: '13px' }} />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="0300-1234567"
                      className="form-input"
                      style={{ paddingLeft: '36px', height: '42px', fontSize: '13px', width: '100%' }}
                      required
                    />
                  </div>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>Required for SMS status and inspector callback</span>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                    Actual Physical Dial Reading (Optional)
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Gauge className="w-4 h-4 text-slate-400" style={{ position: 'absolute', left: '12px', top: '13px' }} />
                    <input
                      type="text"
                      value={actualReading}
                      onChange={(e) => setActualReading(e.target.value)}
                      placeholder="e.g. 1245 (numbers on meter dial)"
                      className="form-input"
                      style={{ paddingLeft: '36px', height: '42px', fontSize: '13px', width: '100%' }}
                    />
                  </div>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>Check the digits currently showing on your physical meter</span>
                </div>
              </div>

              {/* Detailed Description */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                  Dispute Details / Consumer Explanation
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Explain why you are disputing this bill (e.g. meter was read incorrectly, gas pressure was low, or units calculated differ from physical meter)..."
                  className="form-input"
                  rows={3}
                  style={{ width: '100%', fontSize: '13px', padding: '10px 12px', lineHeight: '1.5' }}
                />
              </div>

              {/* Error Message */}
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
                  marginBottom: '16px'
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
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                style={{
                  height: '42px',
                  padding: '0 24px',
                  borderRadius: '8px',
                  fontSize: '13.5px',
                  fontWeight: '700',
                  background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                  border: '1px solid #991b1b',
                  color: '#ffffff',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 3px 12px rgba(220, 38, 38, 0.3)',
                  transition: 'all 0.15s ease'
                }}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Filing Dispute...</span>
                  </>
                ) : (
                  <>
                    <AlertOctagon className="w-4 h-4" />
                    <span>Submit 1-Click Dispute</span>
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
