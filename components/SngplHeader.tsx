'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  PhoneCall,
  Mail,
  MapPin,
  Menu,
  X,
  UserPlus,
  LogIn,
  Receipt
} from 'lucide-react';

interface SngplHeaderProps {
  activePage?: 'home' | 'login' | 'register' | 'executive';
}

export default function SngplHeader({ activePage }: SngplHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      {/* 1. TOP UTILITY / EMERGENCY BAR */}
      <div style={{ background: '#0f172a', color: '#cbd5e1', fontSize: '12px', borderBottom: '1px solid #1e293b' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '8px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }} className="sngpl-section-padding">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <a href="tel:1199" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#38bdf8', fontWeight: '700', textDecoration: 'none' }}>
              <PhoneCall className="w-3.5 h-3.5 text-sky-400" /> Helpline: 1199 (24/7 Toll-Free)
            </a>
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
            <ul style={{ listStyle: 'none', display: 'flex', alignItems: 'center', gap: '22px', margin: 0, padding: 0, fontSize: '13.5px', fontWeight: '600' }}>
              <li><Link href="/" style={{ color: activePage === 'home' ? 'var(--accent-blue)' : '#475569', textDecoration: 'none' }}>Home</Link></li>
              <li><Link href="/#bill-inquiry" style={{ color: '#475569', textDecoration: 'none' }}>Consumer Bill</Link></li>
              <li><Link href="/#services" style={{ color: '#475569', textDecoration: 'none' }}>Services</Link></li>
              <li><Link href="/#faqs" style={{ color: '#475569', textDecoration: 'none' }}>FAQs</Link></li>
              <li><Link href="/#contact" style={{ color: '#475569', textDecoration: 'none' }}>Contact</Link></li>
            </ul>
          </nav>

          {/* Header Action Buttons (Desktop) */}
          <div className="sngpl-desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Link
              href="/#bill-inquiry"
              className="btn btn-secondary"
              style={{ fontSize: '13px', padding: '7px 14px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Receipt className="w-3.5 h-3.5 text-sky-600" />
              <span>Bill Inquiry</span>
            </Link>

            {activePage === 'login' ? (
              <Link href="/register" className="btn btn-primary" style={{ fontSize: '13px', padding: '7px 16px' }}>
                <UserPlus className="w-3.5 h-3.5" />
                <span>Register</span>
              </Link>
            ) : (
              <Link href="/login" className="btn btn-primary" style={{ fontSize: '13px', padding: '7px 16px' }}>
                <LogIn className="w-3.5 h-3.5" />
                <span>Staff Login</span>
              </Link>
            )}
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
              <Link href="/" onClick={() => setMobileMenuOpen(false)} style={{ padding: '10px 0', fontSize: '14.5px', fontWeight: '700', color: 'var(--accent-blue)', textDecoration: 'none', borderBottom: '1px solid #f1f5f9' }}>Home Portal</Link>
              <Link href="/#bill-inquiry" onClick={() => setMobileMenuOpen(false)} style={{ padding: '10px 0', fontSize: '14px', fontWeight: '600', color: '#334155', textDecoration: 'none', borderBottom: '1px solid #f1f5f9' }}>Consumer Bill Inquiry</Link>
              <Link href="/#services" onClick={() => setMobileMenuOpen(false)} style={{ padding: '10px 0', fontSize: '14px', fontWeight: '600', color: '#334155', textDecoration: 'none', borderBottom: '1px solid #f1f5f9' }}>Services & Support</Link>
              <Link href="/#faqs" onClick={() => setMobileMenuOpen(false)} style={{ padding: '10px 0', fontSize: '14px', fontWeight: '600', color: '#334155', textDecoration: 'none', borderBottom: '1px solid #f1f5f9' }}>FAQs</Link>
              <Link href="/#contact" onClick={() => setMobileMenuOpen(false)} style={{ padding: '10px 0', fontSize: '14px', fontWeight: '600', color: '#334155', textDecoration: 'none' }}>Contact & Regional Offices</Link>
            </nav>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <Link
                href="/#bill-inquiry"
                onClick={() => setMobileMenuOpen(false)}
                className="btn btn-secondary"
                style={{ width: '100%', justifyContent: 'center', padding: '10px' }}
              >
                <Receipt className="w-4 h-4 text-sky-600" />
                <span>Search Consumer Bill</span>
              </Link>
              {activePage === 'login' ? (
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="btn btn-primary"
                  style={{ width: '100%', justifyContent: 'center', padding: '10px' }}
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Register Profile</span>
                </Link>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="btn btn-primary"
                  style={{ width: '100%', justifyContent: 'center', padding: '10px' }}
                >
                  <LogIn className="w-4 h-4" />
                  <span>Staff Login</span>
                </Link>
              )}
            </div>
          </div>
        )}
      </header>
    </>
  );
}
