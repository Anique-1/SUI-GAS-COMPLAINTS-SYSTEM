'use client';

import Link from 'next/link';
import { Flame, ShieldCheck, ClipboardList, Scale } from 'lucide-react';

export default function Home() {
  return (
    <div className="auth-container">
      <main className="glass-panel auth-card glass-panel-hover" style={{ maxWidth: '640px' }}>
        <div className="auth-header">
          <div className="auth-logo">
            <Flame className="w-8 h-8 text-cyan-400 animate-pulse" style={{ color: 'var(--accent-blue)' }} />
            <span>SUI GAS</span>
          </div>
          <h1>Pakistan Pipeline Complaint Portal</h1>
          <p className="auth-subtitle" style={{ marginTop: '8px' }}>
            Unified Pipeline Management & Technical Complaint System
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px', marginBottom: '32px' }}>
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', fontSize: '15px', lineHeight: '1.6' }}>
            This system provides SUI Gas employees, executives, and legal departments with an integrated platform to log pipelines issues, handle approvals, and review compliance logs securely.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', marginTop: '12px' }}>
            <div className="glass-panel" style={{ padding: '16px', textAlign: 'center', background: 'rgba(255,255,255,0.02)' }}>
              <ClipboardList style={{ color: 'var(--accent-blue)', margin: '0 auto 8px auto', width: '24px', height: '24px' }} />
              <h3 style={{ fontSize: '14px', marginBottom: '4px' }}>Employees</h3>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Log issues & generate public links</p>
            </div>
            
            <div className="glass-panel" style={{ padding: '16px', textAlign: 'center', background: 'rgba(255,255,255,0.02)' }}>
              <ShieldCheck style={{ color: 'var(--accent-teal)', margin: '0 auto 8px auto', width: '24px', height: '24px' }} />
              <h3 style={{ fontSize: '14px', marginBottom: '4px' }}>Executives</h3>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Approve staff & complete authority control</p>
            </div>
            
            <div className="glass-panel" style={{ padding: '16px', textAlign: 'center', background: 'rgba(255,255,255,0.02)' }}>
              <Scale style={{ color: '#a78bfa', margin: '0 auto 8px auto', width: '24px', height: '24px' }} />
              <h3 style={{ fontSize: '14px', marginBottom: '4px' }}>Lawyers</h3>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Review complaints & legislative tracking</p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
          <Link href="/login" className="btn btn-primary" style={{ minWidth: '140px' }}>
            Access Portal
          </Link>
          <Link href="/register" className="btn btn-secondary" style={{ minWidth: '140px' }}>
            Register Profile
          </Link>
        </div>
        
        <div style={{ textAlign: 'center', marginTop: '32px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Sui Northern Gas Pipelines Limited (SNGPL) & Sui Southern Gas Company (SSGC)
          </span>
        </div>
      </main>
    </div>
  );
}
