'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  PhoneCall,
  Mail,
  MapPin,
  Search,
  ChevronRight,
  HelpCircle,
  FileCheck2,
  Users2,
  CheckCircle2,
  ArrowRight,
  ShieldAlert,
  Receipt,
  CreditCard,
  X,
  Menu,
  FileText,
  AlertCircle,
  RotateCcw,
  Loader2,
  Printer,
  Gauge,
  Wrench,
  Activity,
  Flame,
  ShieldCheck,
  Calendar,
  AlertOctagon,
  Navigation,
} from 'lucide-react';
import SngplTariffCalculator from '@/components/SngplTariffCalculator';
import BillDisputeModal from '@/components/BillDisputeModal';
import GasLeakEmergencyModal from '@/components/GasLeakEmergencyModal';

interface RealParsedBill {
  consumerNo: string;
  consumerName: string;
  meterNo: string;
  category: string;
  billingMonth: string;
  issueDate: string;
  dueDate: string;
  address: string;
  region: string;
  prevReading: string;
  currReading: string;
  gasConsumedHm3: string;
  mmbtu?: string;
  gasCharges?: string;
  meterRent?: string;
  fixedCharges?: string;
  gst?: string;
  provAdj?: string;
  currentBill?: string;
  totalWithinDue: string;
  lateSurcharge: string;
  totalAfterDue: string;
  rawHtml?: string;
}

export default function Home() {
  const [consumerInput, setConsumerInput] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Real SNGPL Gateway State
  const [captchaUrl, setCaptchaUrl] = useState<string>('');
  const [sessionId, setSessionId] = useState<string>('');
  const [isLoadingCaptcha, setIsLoadingCaptcha] = useState<boolean>(false);
  const [isSearchingBill, setIsSearchingBill] = useState<boolean>(false);
  const [searchedBill, setSearchedBill] = useState<RealParsedBill | null>(null);
  const [rawBillHtml, setRawBillHtml] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [showPayModal, setShowPayModal] = useState<boolean>(false);
  const [showDisputeModal, setShowDisputeModal] = useState<boolean>(false);
  const [showEmergencyModal, setShowEmergencyModal] = useState<boolean>(false);
  const [initialDisputeReason, setInitialDisputeReason] = useState<string>('');

  // Auto scroll to bill result
  useEffect(() => {
    if (searchedBill) {
      setTimeout(() => {
        document.getElementById('sngpl-bill-result-card')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 150);
    }
  }, [searchedBill]);

  // Fetch Live SNGPL Captcha and Session
  const fetchLiveCaptcha = async () => {
    setIsLoadingCaptcha(true);
    setErrorMessage('');
    try {
      const res = await fetch('/api/sngpl-bill');
      const data = await res.json();
      if (data.success && data.captchaDataUrl) {
        setCaptchaUrl(data.captchaDataUrl);
        setSessionId(data.sessionId);
      } else {
        setErrorMessage(data.error || 'Unable to connect to billing server. Please retry.');
      }
    } catch {
      setErrorMessage('Network connection error. Please refresh the page.');
    } finally {
      setIsLoadingCaptcha(false);
    }
  };

  useEffect(() => {
    fetchLiveCaptcha();
  }, []);

  // Handle Bill Search
  const handleLiveBillSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSearchedBill(null);
    setRawBillHtml('');

    const cleanConsumer = consumerInput.replace(/\D/g, '').trim();
    if (!cleanConsumer || cleanConsumer.length < 10) {
      setErrorMessage('Please enter a valid 10 or 11-digit Consumer Number.');
      return;
    }

    if (!captchaInput.trim()) {
      setErrorMessage('Please enter the security verification code shown.');
      return;
    }

    setIsSearchingBill(true);

    try {
      const res = await fetch('/api/sngpl-bill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          consumer: cleanConsumer,
          captcha: captchaInput.trim(),
          sessionId: sessionId,
          contype: 'NewCon',
        }),
      });

      const data = await res.json();

      if (!data.success) {
        setErrorMessage(data.error || 'Bill not found. Please verify the consumer number and security code.');
        fetchLiveCaptcha();
        setCaptchaInput('');
      } else if (data.bill) {
        setSearchedBill(data.bill);
        if (data.rawHtml) {
          setRawBillHtml(data.rawHtml);
        } else if (data.bill.rawHtml) {
          setRawBillHtml(data.bill.rawHtml);
        }
        setCaptchaInput('');
        fetchLiveCaptcha();
      }
    } catch {
      setErrorMessage('Failed to connect to SNGPL server. Please check your internet connection.');
      fetchLiveCaptcha();
    } finally {
      setIsSearchingBill(false);
    }
  };

  const handlePrint = () => {
    if (!rawBillHtml) return;

    // Inject auto-print script into the bill HTML
    const htmlWithAutoPrint = rawBillHtml.replace(
      '</body>',
      `<script>
        window.onload = function() {
          setTimeout(function() { window.print(); }, 500);
        };
      </scr` + `ipt></body>`
    );

    const popup = window.open('', '_blank', 'width=900,height=1100,scrollbars=yes,resizable=yes');
    if (popup) {
      popup.document.open();
      popup.document.write(htmlWithAutoPrint);
      popup.document.close();
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>

      {/* 1. TOP UTILITY / EMERGENCY BAR */}
      <div style={{ background: '#0f172a', color: '#cbd5e1', fontSize: '12px', borderBottom: '1px solid #1e293b' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '8px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }} className="sngpl-section-padding">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <a href="tel:1199" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#38bdf8', fontWeight: '700', textDecoration: 'none' }}>
              <PhoneCall className="w-3.5 h-3.5 text-sky-400" /> Helpline: 1199 (24/7 Toll-Free)
            </a>
            <button
              type="button"
              onClick={() => setShowEmergencyModal(true)}
              style={{
                background: 'rgba(239, 68, 68, 0.25)',
                color: '#fca5a5',
                border: '1px solid rgba(239, 68, 68, 0.5)',
                padding: '2px 10px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <Navigation className="w-3 h-3 text-red-400" />
              <span>Report Leak with Live GPS</span>
            </button>
            <span className="sngpl-utility-hide-mobile" style={{ color: '#334155' }}>|</span>
            <span className="sngpl-utility-hide-mobile" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <Mail className="w-3.5 h-3.5 text-slate-400" /> info@sngpl.com.pk
            </span>
            <span className="sngpl-utility-hide-mobile" style={{ color: '#334155' }}>|</span>
            <span className="sngpl-utility-hide-mobile" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <MapPin className="w-3.5 h-3.5 text-slate-400" /> Gas House, 21-Kashmir Road, Lahore
            </span>
          </div>

          <div className="sngpl-utility-hide-mobile" style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '11.5px' }}>
            <span style={{ color: '#94a3b8' }}>Government of Pakistan • Ministry of Energy</span>
            <span style={{ background: 'rgba(2, 132, 199, 0.15)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.3)', padding: '2px 8px', borderRadius: '4px', fontWeight: '600' }}>
              ISO 9001
            </span>
          </div>
        </div>
      </div>

      {/* 2. CORPORATE NAVBAR */}
      <header style={{ background: '#ffffff', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 40 }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} className="sngpl-section-padding">
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
            <div style={{ width: '42px', height: '42px', position: 'relative', flexShrink: 0 }}>
              <Image
                src="/sngpl-logo.png"
                alt="SNGPL Logo"
                width={42}
                height={42}
                priority
                style={{ objectFit: 'contain' }}
              />
            </div>
            <div>
              <div style={{ fontSize: '17px', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.01em', lineHeight: '1.2' }}>
                SUI NORTHERN
              </div>
              <div style={{ fontSize: '11px', color: 'var(--accent-blue)', fontWeight: '700' }}>
                Gas Pipelines Limited (SNGPL)
              </div>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="sngpl-desktop-nav">
            <ul style={{ listStyle: 'none', display: 'flex', alignItems: 'center', gap: '20px', margin: 0, padding: 0, fontSize: '13.5px', fontWeight: '600' }}>
              <li><a href="#bill-inquiry" style={{ color: 'var(--accent-blue)', textDecoration: 'none' }}>Consumer Bill</a></li>
              <li><a href="#calculator" style={{ color: '#475569', textDecoration: 'none' }}>Tariff Estimator</a></li>
              <li><a href="#services" style={{ color: '#475569', textDecoration: 'none' }}>Services</a></li>
              <li><a href="#network" style={{ color: '#475569', textDecoration: 'none' }}>Network</a></li>
              <li><a href="#safety" style={{ color: '#475569', textDecoration: 'none' }}>Safety</a></li>
              <li><a href="#faqs" style={{ color: '#475569', textDecoration: 'none' }}>FAQs</a></li>
              <li><a href="#contact" style={{ color: '#475569', textDecoration: 'none' }}>Contact</a></li>
            </ul>
          </nav>

          {/* Header Action Buttons (Desktop) */}
          <div className="sngpl-desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              onClick={() => setShowPayModal(true)}
              className="btn btn-secondary"
              style={{ fontSize: '13px', padding: '7px 14px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <CreditCard className="w-3.5 h-3.5 text-sky-600" />
              <span>Pay Bill</span>
            </button>
            <Link href="/login" className="btn btn-primary" style={{ fontSize: '13px', padding: '7px 16px' }}>
              <span>Staff Login</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Mobile Hamburger Toggle Button */}
          <button
            type="button"
            className="sngpl-mobile-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5 text-slate-700" /> : <Menu className="w-5 h-5 text-slate-700" />}
          </button>
        </div>

        {/* Mobile Dropdown Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="sngpl-mobile-nav-panel">
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '16px' }}>
              <a href="#bill-inquiry" onClick={() => setMobileMenuOpen(false)} style={{ padding: '10px 0', fontSize: '14.5px', fontWeight: '700', color: 'var(--accent-blue)', textDecoration: 'none', borderBottom: '1px solid #f1f5f9' }}>Consumer Bill Inquiry</a>
              <a href="#calculator" onClick={() => setMobileMenuOpen(false)} style={{ padding: '10px 0', fontSize: '14px', fontWeight: '600', color: '#0369a1', textDecoration: 'none', borderBottom: '1px solid #f1f5f9' }}>Gas Bill & Slab Estimator</a>
              <a href="#services" onClick={() => setMobileMenuOpen(false)} style={{ padding: '10px 0', fontSize: '14px', fontWeight: '600', color: '#334155', textDecoration: 'none', borderBottom: '1px solid #f1f5f9' }}>Gas Services & Support</a>
              <a href="#network" onClick={() => setMobileMenuOpen(false)} style={{ padding: '10px 0', fontSize: '14px', fontWeight: '600', color: '#334155', textDecoration: 'none', borderBottom: '1px solid #f1f5f9' }}>Network Metrics</a>
              <a href="#safety" onClick={() => setMobileMenuOpen(false)} style={{ padding: '10px 0', fontSize: '14px', fontWeight: '600', color: '#334155', textDecoration: 'none', borderBottom: '1px solid #f1f5f9' }}>Winter Safety Directive</a>
              <a href="#faqs" onClick={() => setMobileMenuOpen(false)} style={{ padding: '10px 0', fontSize: '14px', fontWeight: '600', color: '#334155', textDecoration: 'none', borderBottom: '1px solid #f1f5f9' }}>Frequently Asked Questions</a>
              <a href="#contact" onClick={() => setMobileMenuOpen(false)} style={{ padding: '10px 0', fontSize: '14px', fontWeight: '600', color: '#334155', textDecoration: 'none' }}>Contact & Regional Offices</a>
            </nav>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setShowEmergencyModal(true);
                }}
                style={{
                  background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '10px 14px',
                  fontSize: '13px',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 2px 8px rgba(220, 38, 38, 0.25)'
                }}
              >
                <Navigation className="w-4 h-4" />
                <span>Report Gas Leak via Live GPS (1199)</span>
              </button>
              <button
                type="button"
                onClick={() => { setShowPayModal(true); setMobileMenuOpen(false); }}
                className="btn btn-secondary"
                style={{ width: '100%', justifyContent: 'center', padding: '10px' }}
              >
                <CreditCard className="w-4 h-4 text-sky-600" />
                <span>Pay Bill Online</span>
              </button>
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center', padding: '10px' }}
              >
                <span>Staff Login</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* 3. HERO & CONSUMER BILL INQUIRY SECTION */}
      <section id="bill-inquiry" className="sngpl-hero-clean">
        <div style={{ maxWidth: '820px', margin: '0 auto', textAlign: 'center' }}>

          <div className="sngpl-portal-badge">
            <CheckCircle2 className="w-4 h-4 text-sky-600" />
            <span>Customer Billing Portal</span>
          </div>

          <h1 style={{ fontSize: 'clamp(26px, 3.5vw, 40px)', fontWeight: '800', color: 'var(--text-primary)', lineHeight: '1.25', marginBottom: '16px' }}>
            Consumer Gas Bill Inquiry
          </h1>

          <p style={{ fontSize: '15.5px', color: '#475569', lineHeight: '1.6', maxWidth: '640px', margin: '0 auto 34px auto' }}>
            Enter your 11-digit Consumer ID to view your current gas bill and download or print a duplicate copy.
          </p>

          {/* DEDICATED BILL SEARCH CARD */}
          <div className="sngpl-search-box">

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Receipt className="w-5 h-5 text-sky-600" />
                <span style={{ fontWeight: '700', fontSize: '15px', color: '#0f172a' }}>Search Bill</span>
              </div>
              <button
                type="button"
                onClick={() => setConsumerInput('1032600007')}
                className="sngpl-sample-chip"
                style={{ fontSize: '11px', padding: '3px 10px', color: 'var(--accent-blue)', borderColor: '#bae6fd', background: '#f0f9ff' }}
                title="Fill sample consumer ID for testing"
              >
                Sample: 1032600007
              </button>
            </div>

            <form onSubmit={handleLiveBillSearch} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>

                {/* Consumer Number Input */}
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                    Consumer Number <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Receipt className="w-4 h-4 text-slate-400" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      type="text"
                      className="form-input"
                      maxLength={11}
                      placeholder="e.g. 1032600007"
                      value={consumerInput}
                      onChange={(e) => setConsumerInput(e.target.value)}
                      style={{ paddingLeft: '36px', height: '44px', fontSize: '14px' }}
                      required
                    />
                  </div>
                  <span style={{ fontSize: '11px', color: '#64748b', display: 'block', marginTop: '4px' }}>
                    Printed at the top-left of your bill
                  </span>
                </div>

                {/* Security Captcha */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label style={{ fontSize: '12.5px', fontWeight: '700', color: '#334155' }}>
                      Security Code <span style={{ color: '#dc2626' }}>*</span>
                    </label>
                    <button
                      type="button"
                      onClick={fetchLiveCaptcha}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--accent-blue)', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}
                      title="Load new code"
                    >
                      <RotateCcw className={`w-3 h-3 ${isLoadingCaptcha ? 'animate-spin' : ''}`} />
                      <span>Refresh</span>
                    </button>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <div style={{ width: '120px', height: '44px', background: '#f1f5f9', borderRadius: '6px', border: '1px solid #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                      {isLoadingCaptcha ? (
                        <Loader2 className="w-4 h-4 animate-spin text-sky-600" />
                      ) : captchaUrl ? (
                        <img src={captchaUrl} alt="Security Code" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                      ) : (
                        <span style={{ fontSize: '10px', color: '#94a3b8' }}>Load Error</span>
                      )}
                    </div>
                    <input
                      type="text"
                      className="form-input"
                      maxLength={8}
                      placeholder="Code..."
                      value={captchaInput}
                      onChange={(e) => setCaptchaInput(e.target.value)}
                      style={{ height: '44px', fontSize: '14px', textAlign: 'center', fontWeight: '700', letterSpacing: '0.06em' }}
                      required
                    />
                  </div>
                </div>

              </div>

              {/* Error Alert */}
              {errorMessage && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '10px 12px', borderRadius: '6px', fontSize: '13px' }}>
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Search Button */}
              <button
                type="submit"
                className="sngpl-btn-action"
                style={{ height: '46px', width: '100%', marginTop: '4px' }}
                disabled={isSearchingBill}
              >
                {isSearchingBill ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Retrieving Bill...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>Search Bill</span>
                  </>
                )}
              </button>

            </form>
          </div>          {/* BILL RESULT CARD (Summary + Official Document) */}
          {searchedBill && (
            <div id="sngpl-bill-result-card" style={{ maxWidth: '980px', margin: '48px auto 0 auto', textAlign: 'left' }}>

              {/* Header Bar */}
              <div className="sngpl-header-bar" style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: '#ffffff',
                borderRadius: '10px 10px 0 0',
                padding: '14px 20px',
                border: '1px solid #cbd5e1',
                borderBottom: 'none',
                flexWrap: 'wrap',
                gap: '12px'
              }}>
                <div className="sngpl-header-pills" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', padding: '4px 10px', borderRadius: '6px', fontSize: '13px', fontWeight: '700' }}>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>Consumer: {searchedBill.consumerNo}</span>
                  </div>

                  {searchedBill.billingMonth && (
                    <span style={{ fontSize: '12.5px', color: '#334155', background: '#f1f5f9', border: '1px solid #e2e8f0', padding: '4px 10px', borderRadius: '6px', fontWeight: '600' }}>
                      Month: {searchedBill.billingMonth}
                    </span>
                  )}

                  {searchedBill.dueDate && (
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      fontSize: '12.5px',
                      color: '#991b1b',
                      background: '#fef2f2',
                      border: '1px solid #fecaca',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontWeight: '700'
                    }}>
                      <Calendar className="w-3.5 h-3.5 text-rose-600 flex-shrink-0" />
                      Due Date: {searchedBill.dueDate}
                    </span>
                  )}
                </div>

                <div className="sngpl-actions-group" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {/* Type 1: Pay Bill (Emerald / Green accent) */}
                  <button
                    type="button"
                    onClick={() => setShowPayModal(true)}
                    style={{
                      background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '8px 16px',
                      fontSize: '13px',
                      fontWeight: '700',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '7px',
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(5, 150, 105, 0.25)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Pay Bill</span>
                  </button>

                  {/* Type 2: Save as PDF / Print (Flame Blue accent) */}
                  <button
                    type="button"
                    onClick={handlePrint}
                    style={{
                      background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '8px 16px',
                      fontSize: '13px',
                      fontWeight: '700',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '7px',
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(2, 132, 199, 0.25)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <Printer className="w-4 h-4" />
                    <span>Save as PDF</span>
                  </button>

                  {/* Type 3: 1-Click Dispute This Bill / Log Complaint (Rose/Red accent) */}
                  <button
                    type="button"
                    onClick={() => {
                      setInitialDisputeReason('');
                      setShowDisputeModal(true);
                    }}
                    style={{
                      background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '8px 16px',
                      fontSize: '13px',
                      fontWeight: '700',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '7px',
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(220, 38, 38, 0.25)',
                      transition: 'all 0.15s ease'
                    }}
                    title="Dispute over-billing or meter reading mismatch with 1-click auto-fill"
                  >
                    <AlertOctagon className="w-4 h-4" />
                    <span>Dispute This Bill / Log Complaint</span>
                  </button>

                  {/* Close button */}
                  <button
                    type="button"
                    onClick={() => {
                      setSearchedBill(null);
                      setRawBillHtml('');
                    }}
                    style={{
                      background: '#f1f5f9',
                      color: '#475569',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      padding: '8px 14px',
                      fontSize: '12.5px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    Close
                  </button>
                </div>
              </div>

              {/* EXECUTIVE BILL SUMMARY & BREAKDOWN */}
              <div className="sngpl-bill-summary-card" style={{
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                borderTop: 'none',
                borderRadius: '0 0 10px 10px',
                padding: '24px 28px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.04)'
              }}>

                {/* Top Consumer Info Banner */}
                <div style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '16px 20px',
                  marginBottom: '20px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}>
                  <div style={{ maxWidth: '100%' }}>
                    <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', fontWeight: '700', marginBottom: '2px' }}>
                      Customer Name
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', wordBreak: 'break-word' }}>
                      {searchedBill.consumerName}
                    </div>
                    <div style={{ fontSize: '12.5px', color: '#475569', display: 'flex', alignItems: 'center', gap: '5px', marginTop: '4px', wordBreak: 'break-word' }}>
                      <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span>{searchedBill.address}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
                    <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '3px 10px', borderRadius: '4px', fontSize: '11.5px', fontWeight: '700' }}>
                      {searchedBill.category}
                    </span>
                    <span style={{ fontSize: '11.5px', color: '#64748b' }}>
                      Meter: <strong style={{ color: '#0f172a' }}>{searchedBill.meterNo}</strong>
                    </span>
                  </div>
                </div>

                {/* 3 Metric Cards */}
                <div className="sngpl-metric-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px', marginBottom: '24px' }}>

                  {/* 1. Payable Within Due Date */}
                  <div style={{
                    background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                    border: '1px solid #bbf7d0',
                    borderRadius: '8px',
                    padding: '18px',
                    position: 'relative',
                    overflow: 'hidden'
                  }}>
                    <div style={{ fontSize: '12px', fontWeight: '700', color: '#15803d', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Payable Within Due Date
                    </div>
                    <div style={{ fontSize: '26px', fontWeight: '900', color: '#166534', margin: '6px 0 4px 0' }}>
                      Rs. {searchedBill.totalWithinDue}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#15803d', fontWeight: '600' }}>
                      <Calendar className="w-3.5 h-3.5 text-emerald-700 flex-shrink-0" />
                      <span>Due Date: <strong>{searchedBill.dueDate}</strong></span>
                    </div>
                  </div>

                  {/* 2. Payable After Due Date */}
                  <div style={{
                    background: 'linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)',
                    border: '1px solid #fecdd3',
                    borderRadius: '8px',
                    padding: '18px',
                    position: 'relative',
                    overflow: 'hidden'
                  }}>
                    <div style={{ fontSize: '12px', fontWeight: '700', color: '#be123c', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Payable After Due Date
                    </div>
                    <div style={{ fontSize: '26px', fontWeight: '900', color: '#9f1239', margin: '6px 0 4px 0' }}>
                      Rs. {searchedBill.totalAfterDue}
                    </div>
                    <div style={{ fontSize: '12px', color: '#be123c', fontWeight: '600' }}>
                      Late Surcharge (LPS): <strong>Rs. {searchedBill.lateSurcharge}</strong>
                    </div>
                  </div>

                  {/* 3. Gas Consumption */}
                  <div style={{
                    background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                    border: '1px solid #bae6fd',
                    borderRadius: '8px',
                    padding: '18px',
                    position: 'relative',
                    overflow: 'hidden'
                  }}>
                    <div style={{ fontSize: '12px', fontWeight: '700', color: '#0369a1', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Gas Units Consumed
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: '900', color: '#0c4a6e', margin: '6px 0 4px 0' }}>
                      {searchedBill.gasConsumedHm3} <span style={{ fontSize: '15px', fontWeight: '700' }}>HM³</span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#0369a1', fontWeight: '600' }}>
                      {searchedBill.mmbtu && searchedBill.mmbtu !== '—' ? `${searchedBill.mmbtu} MMBTU • ` : ''}
                      Reading: {searchedBill.currReading}
                    </div>
                  </div>

                </div>

                {/* Two-Column Details Breakdown */}
                <div className="sngpl-details-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '18px', marginBottom: '22px' }}>

                  {/* Col 1: Account & Connection Details */}
                  <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                    <div style={{ background: '#f8fafc', padding: '10px 16px', borderBottom: '1px solid #e2e8f0', fontWeight: '700', fontSize: '13px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Receipt className="w-4 h-4 text-sky-600" />
                      <span>Account & Connection Profile</span>
                    </div>
                    <div style={{ padding: '8px 16px', fontSize: '12.5px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                        <span style={{ color: '#64748b' }}>Account ID / Consumer No:</span>
                        <strong style={{ color: '#0f172a' }}>{searchedBill.consumerNo}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9', gap: '8px' }}>
                        <span style={{ color: '#64748b', flexShrink: 0 }}>Consumer Name:</span>
                        <strong style={{ color: '#0f172a', textAlign: 'right', wordBreak: 'break-word' }}>{searchedBill.consumerName}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                        <span style={{ color: '#64748b' }}>Meter Number:</span>
                        <strong style={{ color: '#0f172a' }}>{searchedBill.meterNo}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                        <span style={{ color: '#64748b' }}>Tariff Category:</span>
                        <strong style={{ color: '#0369a1' }}>{searchedBill.category}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                        <span style={{ color: '#64748b' }}>Billing Month:</span>
                        <strong style={{ color: '#0f172a' }}>{searchedBill.billingMonth}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                        <span style={{ color: '#64748b' }}>Bill Issue Date:</span>
                        <strong style={{ color: '#0f172a' }}>{searchedBill.issueDate}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                        <span style={{ color: '#64748b' }}>Payment Due Date:</span>
                        <strong style={{ color: '#dc2626' }}>{searchedBill.dueDate}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                        <span style={{ color: '#64748b' }}>Meter Readings:</span>
                        <span style={{ color: '#0f172a', fontSize: '12px' }}>
                          Pres: <strong>{searchedBill.currReading}</strong> • Prev: <strong>{searchedBill.prevReading}</strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Col 2: Financial Charges Breakdown */}
                  <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                    <div style={{ background: '#f8fafc', padding: '10px 16px', borderBottom: '1px solid #e2e8f0', fontWeight: '700', fontSize: '13px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <CreditCard className="w-4 h-4 text-sky-600" />
                      <span>Billing Charges Breakdown</span>
                    </div>
                    <div style={{ padding: '8px 16px', fontSize: '12.5px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                        <span style={{ color: '#64748b' }}>Natural Gas Charges:</span>
                        <span style={{ color: '#0f172a', fontWeight: '600' }}>Rs. {searchedBill.gasCharges || '—'}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                        <span style={{ color: '#64748b' }}>Meter Service Rent:</span>
                        <span style={{ color: '#0f172a', fontWeight: '600' }}>Rs. {searchedBill.meterRent || '—'}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                        <span style={{ color: '#64748b' }}>Fixed Pipeline Charges:</span>
                        <span style={{ color: '#0f172a', fontWeight: '600' }}>Rs. {searchedBill.fixedCharges || '—'}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                        <span style={{ color: '#64748b' }}>General Sales Tax (GST):</span>
                        <span style={{ color: '#0f172a', fontWeight: '600' }}>Rs. {searchedBill.gst || '—'}</span>
                      </div>
                      {searchedBill.provAdj && searchedBill.provAdj !== '0.00' && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                          <span style={{ color: '#64748b' }}>Bill Adjustments / Rebate:</span>
                          <span style={{ color: '#0f172a', fontWeight: '600' }}>Rs. {searchedBill.provAdj}</span>
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                        <span style={{ color: '#64748b' }}>Late Payment Surcharge:</span>
                        <span style={{ color: '#b91c1c', fontWeight: '600' }}>Rs. {searchedBill.lateSurcharge}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0 6px 0', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', margin: '0 -16px', paddingLeft: '16px', paddingRight: '16px' }}>
                        <strong style={{ color: '#047857' }}>Total Within Due Date:</strong>
                        <strong style={{ color: '#047857', fontSize: '14px' }}>Rs. {searchedBill.totalWithinDue}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0 4px 0', background: '#fef2f2', margin: '0 -16px', paddingLeft: '16px', paddingRight: '16px' }}>
                        <strong style={{ color: '#b91c1c' }}>Total After Due Date:</strong>
                        <strong style={{ color: '#b91c1c', fontSize: '14px' }}>Rs. {searchedBill.totalAfterDue}</strong>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Section Divider & Official Document Header */}
                <div id="official-document-section" style={{
                  marginTop: '28px',
                  paddingTop: '20px',
                  borderTop: '2px dashed #cbd5e1',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '12px',
                  marginBottom: '16px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(2, 132, 199, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-blue)', flexShrink: 0 }}>
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a' }}>
                        Official SNGPL Duplicate Bill Document
                      </div>
                      <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                        Complete authentic bill copy loaded directly from SNGPL billing servers
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: '#ecfdf5',
                      color: '#065f46',
                      border: '1px solid #a7f3d0',
                      padding: '5px 12px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '700'
                    }}>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                      Live Verified Document View
                    </span>
                  </div>
                </div>

                {/* Official SNGPL HTML in Iframe with Horizontal Touch Scrolling Container */}
                <div style={{
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  overflowX: 'auto',
                  WebkitOverflowScrolling: 'touch',
                  background: '#ffffff',
                  maxWidth: '100%'
                }}>
                  <div style={{ minWidth: '780px', width: '100%' }}>
                    {rawBillHtml ? (
                      <iframe
                        id="sngpl-bill-iframe"
                        srcDoc={rawBillHtml}
                        title="SNGPL Bill"
                        style={{
                          width: '100%',
                          minHeight: '1100px',
                          border: 'none',
                          background: '#ffffff',
                          display: 'block',
                        }}
                        sandbox="allow-same-origin allow-scripts"
                        onLoad={(e) => {
                          try {
                            const iframe = e.target as HTMLIFrameElement;
                            if (iframe.contentDocument) {
                              iframe.style.height = iframe.contentDocument.documentElement.scrollHeight + 'px';
                            }
                          } catch { }
                        }}
                      />
                    ) : (
                      <div style={{ background: '#ffffff', padding: '36px', textAlign: 'center', color: '#94a3b8' }}>
                        <FileText className="w-8 h-8 mx-auto mb-2" style={{ opacity: 0.4 }} />
                        <p>Bill document is currently not displayable.</p>
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '11.5px', color: '#64748b', marginTop: '10px' }}>
                  <span>📱 Swipe horizontally on mobile to view full authentic duplicate bill</span>
                </div>

              </div>

            </div>
          )}


        </div>
      </section>

      {/* 3.5 GAS BILL CONSUMPTION & SLAB ESTIMATOR (OGRA FY 2024-2026) */}
      <section id="calculator" className="sngpl-section-padding" style={{ maxWidth: '1280px', margin: '80px auto 64px auto', padding: '0 24px', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '38px' }}>
          <span style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--accent-blue)', letterSpacing: '0.08em' }}>
            Interactive Tariff Calculator
          </span>
          <h2 style={{ fontSize: '26px', fontWeight: '800', color: '#0f172a', marginTop: '4px' }}>
            Gas Bill Consumption & Slab Estimator
          </h2>
          <p style={{ color: '#64748b', fontSize: '14px', maxWidth: '680px', margin: '8px auto 0 auto', lineHeight: '1.5' }}>
            Estimate your monthly gas charges, meter rent, fixed pipeline charges, and 18% GST before the physical bill arrives using official OGRA progressive tariff slabs.
          </p>
        </div>

        <SngplTariffCalculator
          onDisputeWithCalculated={(units, estimatedAmount) => {
            if (searchedBill) {
              setInitialDisputeReason(`Estimated bill according to OGRA tariff calculator for ${units.toFixed(2)} HM³ is Rs. ${estimatedAmount.toLocaleString()}, whereas billed amount is Rs. ${searchedBill.totalWithinDue}. Requesting discrepancy audit.`);
              setShowDisputeModal(true);
            } else {
              document.getElementById('bill-inquiry')?.scrollIntoView({ behavior: 'smooth' });
              setErrorMessage(`Estimated cost for ${units.toFixed(2)} HM³ is Rs. ${estimatedAmount.toLocaleString()}. Please enter your 11-digit Consumer Number above to fetch your bill and log a dispute.`);
            }
          }}
        />
      </section>

      {/* 4. KEY NETWORK METRICS */}
      <section id="network" className="sngpl-section-padding" style={{ maxWidth: '1280px', margin: '64px auto', padding: '0 24px', width: '100%' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>

          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '24px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '46px', height: '46px', borderRadius: '10px', background: 'rgba(2, 132, 199, 0.08)', color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Users2 className="w-5 h-5" />
            </div>
            <div>
              <div style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a' }}>7.22 Million</div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>Active Gas Consumers</div>
            </div>
          </div>

          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '24px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '46px', height: '46px', borderRadius: '10px', background: 'rgba(13, 148, 136, 0.08)', color: 'var(--accent-teal)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a' }}>148,000+ KM</div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>Distribution Network</div>
            </div>
          </div>

          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '24px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '46px', height: '46px', borderRadius: '10px', background: 'rgba(124, 58, 237, 0.08)', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <div style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a' }}>9,000+ KM</div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>Transmission Pipelines</div>
            </div>
          </div>

          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '24px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '46px', height: '46px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.08)', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <PhoneCall className="w-5 h-5" />
            </div>
            <div>
              <div style={{ fontSize: '20px', fontWeight: '800', color: '#dc2626' }}>1199</div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>Emergency Response</div>
            </div>
          </div>

        </div>
      </section>

      {/* 5. CONSUMER SERVICES & COMPLAINT MODULES */}
      <section id="services" className="sngpl-section-padding" style={{ maxWidth: '1280px', margin: '80px auto', padding: '0 24px', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <span style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--accent-blue)', letterSpacing: '0.08em' }}>
            Customer Care
          </span>
          <h2 style={{ fontSize: '26px', fontWeight: '800', color: '#0f172a', marginTop: '4px' }}>
            Gas Services & Support
          </h2>
          <p style={{ color: '#64748b', fontSize: '14px', maxWidth: '600px', margin: '8px auto 0 auto', lineHeight: '1.5' }}>
            Access regional maintenance, report supply faults, or submit connection requests.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px' }}>

          {/* Service 1 */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '20px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(2, 132, 199, 0.08)', color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
              <Gauge className="w-5 h-5" />
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', marginBottom: '6px' }}>
              Low Gas Pressure
            </h3>
            <p style={{ color: '#475569', fontSize: '13px', lineHeight: '1.5', flexGrow: 1, marginBottom: '16px' }}>
              Log low pressure reports during peak hours or winter seasons for technical team inspection.
            </p>
            <Link href="/login" style={{ color: 'var(--accent-blue)', fontWeight: '600', fontSize: '12.5px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              Report Issue <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Service 2 */}
          <div style={{ background: '#ffffff', border: '1px solid #fecaca', borderRadius: '8px', padding: '20px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.08)', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
              <ShieldAlert className="w-5 h-5" />
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', marginBottom: '6px' }}>
              Gas Leakage Emergency (1199)
            </h3>
            <p style={{ color: '#475569', fontSize: '13px', lineHeight: '1.5', flexGrow: 1, marginBottom: '16px' }}>
              Report gas odor, mainline fractures, or service valve leaks with instant live GPS coordinates for field van dispatch.
            </p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => setShowEmergencyModal(true)}
                style={{
                  background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '7px 12px',
                  fontSize: '12.5px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Report via GPS</span>
              </button>
              <a href="tel:1199" style={{ color: '#dc2626', fontWeight: '700', fontSize: '12px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '6px 4px' }}>
                Call 1199 <ChevronRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Service 3 */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '20px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(13, 148, 136, 0.08)', color: 'var(--accent-teal)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
              <FileCheck2 className="w-5 h-5" />
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', marginBottom: '6px' }}>
              New Gas Connection
            </h3>
            <p style={{ color: '#475569', fontSize: '13px', lineHeight: '1.5', flexGrow: 1, marginBottom: '16px' }}>
              Information regarding application submission, demand notice payments, and site surveys.
            </p>
            <Link href="/login" style={{ color: 'var(--accent-blue)', fontWeight: '600', fontSize: '12.5px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              View Procedure <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Service 4 */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '20px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(124, 58, 237, 0.08)', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
              <Wrench className="w-5 h-5" />
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', marginBottom: '6px' }}>
              Meter Inspection
            </h3>
            <p style={{ color: '#475569', fontSize: '13px', lineHeight: '1.5', flexGrow: 1, marginBottom: '16px' }}>
              Schedule volumetric testing, reading checks, or replacement for defective meters.
            </p>
            <Link href="/login" style={{ color: 'var(--accent-blue)', fontWeight: '600', fontSize: '12.5px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              Request Testing <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

        </div>
      </section>

      {/* 6. GAS SAFETY DIRECTIVE */}
      <section id="safety" className="sngpl-section-padding" style={{ maxWidth: '1280px', margin: '70px auto', padding: '0 24px', width: '100%' }}>
        <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #0369a1 100%)', color: '#ffffff', borderRadius: '12px', padding: '36px 30px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '22px', flexWrap: 'wrap' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div style={{ flexGrow: 1, minWidth: '240px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#ffffff', marginBottom: '10px' }}>
                Winter Gas Safety Guidelines
              </h3>
              <p style={{ fontSize: '13.5px', color: '#e0f2fe', lineHeight: '1.65', maxWidth: '780px', marginBottom: '20px' }}>
                Keep rooms ventilated when gas appliances are active. Turn off heaters before going to sleep. In case of gas odor, avoid electrical switches, open doors and windows, and call <strong style={{ color: '#ffffff', textDecoration: 'underline' }}>1199</strong>.
              </p>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <a href="tel:1199" style={{ background: '#ffffff', color: '#0369a1', padding: '9px 18px', borderRadius: '6px', fontWeight: '700', fontSize: '13px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <PhoneCall className="w-3.5 h-3.5" /> Call Helpline 1199
                </a>
                <button
                  type="button"
                  onClick={() => setShowEmergencyModal(true)}
                  style={{
                    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                    color: '#ffffff',
                    border: 'none',
                    padding: '9px 18px',
                    borderRadius: '6px',
                    fontWeight: '700',
                    fontSize: '13px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 2px 8px rgba(239, 68, 68, 0.35)'
                  }}
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Report Leak via GPS</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowPayModal(true)}
                  style={{ background: 'rgba(255,255,255,0.15)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.3)', padding: '9px 18px', borderRadius: '6px', fontWeight: '600', fontSize: '13px', cursor: 'pointer' }}
                >
                  Payment Channels
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. FREQUENTLY ASKED QUESTIONS */}
      <section id="faqs" className="sngpl-section-padding" style={{ maxWidth: '1280px', margin: '80px auto 90px auto', padding: '0 24px', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '38px' }}>
          <span style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--accent-blue)', letterSpacing: '0.08em' }}>
            Help & Guidance
          </span>
          <h2 style={{ fontSize: '26px', fontWeight: '800', color: '#0f172a', marginTop: '4px' }}>
            Frequently Asked Questions
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '22px' }}>

          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '22px 20px' }}>
            <h3 style={{ fontSize: '14.5px', fontWeight: '700', color: '#0f172a', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <HelpCircle className="w-4 h-4 text-sky-600 flex-shrink-0" />
              Where do I find my Consumer Number?
            </h3>
            <p style={{ fontSize: '13px', color: '#64748b', lineHeight: '1.6' }}>
              The 11-digit Consumer Number is located in the top-left section of your monthly physical gas bill.
            </p>
          </div>

          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '22px 20px' }}>
            <h3 style={{ fontSize: '14.5px', fontWeight: '700', color: '#0f172a', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <HelpCircle className="w-4 h-4 text-sky-600 flex-shrink-0" />
              How can I save my bill as a PDF?
            </h3>
            <p style={{ fontSize: '13px', color: '#64748b', lineHeight: '1.6' }}>
              After searching your bill, click &quot;Print / Save as PDF&quot;. In the print window, choose &quot;Save as PDF&quot; under destination.
            </p>
          </div>

          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '22px 20px' }}>
            <h3 style={{ fontSize: '14.5px', fontWeight: '700', color: '#0f172a', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <HelpCircle className="w-4 h-4 text-sky-600 flex-shrink-0" />
              Which online channels can I use for payment?
            </h3>
            <p style={{ fontSize: '13px', color: '#64748b', lineHeight: '1.6' }}>
              Bills can be paid using 1Link / 1Bill across all banking apps, JazzCash, Easypaisa, or at any post office and scheduled bank branch.
            </p>
          </div>

          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '22px 20px' }}>
            <h3 style={{ fontSize: '14.5px', fontWeight: '700', color: '#0f172a', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <HelpCircle className="w-4 h-4 text-sky-600 flex-shrink-0" />
              What immediate steps to take if gas smells?
            </h3>
            <p style={{ fontSize: '13px', color: '#64748b', lineHeight: '1.6' }}>
              Turn off the main meter control valve, open all doors and windows, refrain from lighting matches or operating electrical switches, and call 1199.
            </p>
          </div>

        </div>
      </section>

      {/* 8. CORPORATE FOOTER */}
      <footer id="contact" className="sngpl-section-padding" style={{ background: '#0f172a', color: '#cbd5e1', padding: '64px 24px 32px 24px', borderTop: '1px solid #1e293b', marginTop: 'auto' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>

          <div className="sngpl-footer-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '40px', marginBottom: '44px' }}>

            {/* Col 1 */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <Image
                  src="/sngpl-logo.png"
                  alt="SNGPL"
                  width={36}
                  height={36}
                />
                <div>
                  <div style={{ fontSize: '15px', fontWeight: '800', color: '#ffffff' }}>SUI NORTHERN</div>
                  <div style={{ fontSize: '10px', color: '#38bdf8' }}>Gas Pipelines Limited</div>
                </div>
              </div>
              <p style={{ color: '#94a3b8', fontSize: '12.5px', lineHeight: '1.6' }}>
                Serving over 7.22 million consumers across Punjab, Khyber Pakhtunkhwa, and Islamabad Capital Territory.
              </p>
            </div>

            {/* Col 2 */}
            <div>
              <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#ffffff', textTransform: 'uppercase', marginBottom: '12px' }}>
                Quick Links
              </h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12.5px' }}>
                <li><a href="#bill-inquiry" style={{ color: '#94a3b8', textDecoration: 'none' }}>Consumer Bill</a></li>
                <li><a href="#services" style={{ color: '#94a3b8', textDecoration: 'none' }}>Customer Services</a></li>
                <li><Link href="/login" style={{ color: '#94a3b8', textDecoration: 'none' }}>Staff Login</Link></li>
                <li><Link href="/register" style={{ color: '#94a3b8', textDecoration: 'none' }}>Register Staff</Link></li>
              </ul>
            </div>

            {/* Col 3 */}
            <div>
              <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#ffffff', textTransform: 'uppercase', marginBottom: '12px' }}>
                Regional Centers
              </h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', color: '#94a3b8' }}>
                <li>• Lahore: 21-Kashmir Road</li>
                <li>• Islamabad / Rawalpindi: Sector I-9</li>
                <li>• Peshawar: Phase-V, Hayatabad</li>
                <li>• Faisalabad: Sargodha Road</li>
                <li>• Multan: Piran Ghaib Road</li>
              </ul>
            </div>

            {/* Col 4 */}
            <div>
              <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#ffffff', textTransform: 'uppercase', marginBottom: '12px' }}>
                Head Office
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12.5px', color: '#94a3b8' }}>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
                  <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" style={{ marginTop: '2px' }} />
                  <span>Gas House, 21-Kashmir Road, Lahore</span>
                </div>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <PhoneCall className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <span>Helpline: 1199 (24/7)</span>
                </div>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <Mail className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <span>info@sngpl.com.pk</span>
                </div>
              </div>
            </div>

          </div>

          <div style={{ borderTop: '1px solid #1e293b', paddingTop: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', fontSize: '12px', color: '#64748b' }}>
            <span>© {new Date().getFullYear()} Sui Northern Gas Pipelines Limited. Listed on PSX (SNGP).</span>
            <span>Emergency 24/7 Helpline: 1199</span>
          </div>

        </div>
      </footer>

      {/* ONLINE PAYMENT MODAL */}
      {showPayModal && (
        <div className="modal-overlay" onClick={() => setShowPayModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px', borderRadius: '8px' }}>
            <button className="modal-close" onClick={() => setShowPayModal(false)}>
              <X className="w-4 h-4" />
            </button>
            <div className="modal-header">
              <h2 style={{ fontSize: '17px', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CreditCard className="w-5 h-5 text-sky-600" />
                Bill Payment Channels
              </h2>
            </div>
            <div style={{ fontSize: '13px', color: '#334155', lineHeight: '1.6' }}>
              <p style={{ marginBottom: '12px' }}>
                Pay your gas bill using your 11-digit Consumer ID through:
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                <div style={{ padding: '10px 12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
                  <strong style={{ color: '#0369a1' }}>1. Mobile Banking (1Link / 1Bill):</strong>
                  <div style={{ color: '#64748b' }}>Utility Bills → SNGPL → Enter Consumer ID → Confirm.</div>
                </div>
                <div style={{ padding: '10px 12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
                  <strong style={{ color: '#0369a1' }}>2. JazzCash & Easypaisa:</strong>
                  <div style={{ color: '#64748b' }}>Bill Payments → Gas → SNGPL → Enter Consumer ID.</div>
                </div>
                <div style={{ padding: '10px 12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
                  <strong style={{ color: '#0369a1' }}>3. Bank Branch & Pakistan Post:</strong>
                  <div style={{ color: '#64748b' }}>Present your printed bill copy at any bank branch or post office counter.</div>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <button type="button" className="btn btn-primary" onClick={() => setShowPayModal(false)} style={{ padding: '8px 20px' }}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 1-CLICK BILL DISPUTE MODAL */}
      <BillDisputeModal
        isOpen={showDisputeModal}
        onClose={() => setShowDisputeModal(false)}
        billData={searchedBill}
        initialDisputeReason={initialDisputeReason}
      />

      {/* GPS & GEOLOCATION GAS LEAK EMERGENCY (1199) MODAL */}
      <GasLeakEmergencyModal
        isOpen={showEmergencyModal}
        onClose={() => setShowEmergencyModal(false)}
      />

    </div>
  );
}
