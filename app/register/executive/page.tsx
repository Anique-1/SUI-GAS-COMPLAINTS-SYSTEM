'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Flame, CheckCircle, ArrowLeft, Key } from 'lucide-react';

export default function ExecutiveRegister() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [roleId, setRoleId] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passkey, setPasskey] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    if (!name || !email || !phone || !roleId || !password || !passkey) {
      setError('Please fill in all required fields.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/register/executive', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          phone,
          roleId,
          password,
          passkey,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Registration failed.');
      } else {
        setSuccess(true);
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      {success ? (
        <div className="glass-panel auth-card glass-panel-hover" style={{ textAlign: 'center' }}>
          <CheckCircle className="w-16 h-16 text-emerald-400" style={{ color: 'var(--status-approved)', margin: '0 auto 24px auto' }} />
          <h2 style={{ marginBottom: '16px' }}>Executive Approved</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', lineHeight: '1.6' }}>
            Your Executive account has been successfully verified, registered, and pre-approved. You can now access all administrative and operations control lists.
          </p>
          <Link href="/login" className="btn btn-primary" style={{ width: '100%' }}>
            Go to Login
          </Link>
        </div>
      ) : (
        <div className="glass-panel auth-card" style={{ borderColor: 'var(--accent-teal)' }}>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '13px', marginBottom: '24px' }}>
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>

          <div className="auth-header">
            <div className="auth-logo">
              <Flame className="w-7 h-7" style={{ color: 'var(--accent-teal)' }} />
              <span>SUI GAS</span>
            </div>
            <h2>Secure Admin Registry</h2>
            <p className="auth-subtitle" style={{ color: 'var(--status-pending)' }}>Executive Authorization Console Only</p>
          </div>

          {error && (
            <div className="glass-panel" style={{ padding: '12px 16px', background: 'rgba(239, 68, 68, 0.08)', borderColor: 'rgba(239, 68, 68, 0.3)', color: '#ef4444', fontSize: '13px', marginBottom: '20px', borderRadius: '8px' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Enter your full name"
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                required 
              />
            </div>

            <div className="form-group">
              <label className="form-label">Official Email</label>
              <input 
                type="email" 
                className="form-input" 
                placeholder="e.g. executive@sui.gov.pk"
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
              />
            </div>

            <div className="form-group">
              <label className="form-label">Contact Phone</label>
              <input 
                type="tel" 
                className="form-input" 
                placeholder="e.g. +92 300 1234567"
                value={phone} 
                onChange={(e) => setPhone(e.target.value)} 
                required 
              />
            </div>

            <div className="form-group">
              <label className="form-label">Executive ID Code</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g. EXEC-0520"
                value={roleId} 
                onChange={(e) => setRoleId(e.target.value)} 
                required 
              />
            </div>

            {/* Security Passkey Field */}
            <div className="form-group" style={{ border: '1px dashed rgba(2, 132, 199, 0.25)', padding: '12px', borderRadius: '8px', background: 'rgba(2, 132, 199, 0.02)' }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-blue)' }}>
                <Key className="w-3.5 h-3.5" />
                Security Verification Passkey
              </label>
              <input 
                type="password" 
                className="form-input" 
                placeholder="Enter admin security registration code"
                autoComplete="new-password"
                value={passkey} 
                onChange={(e) => setPasskey(e.target.value)} 
                required 
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input 
                type="password" 
                className="form-input" 
                placeholder="••••••••"
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
              />
            </div>

            <div className="form-group" style={{ marginBottom: '28px' }}>
              <label className="form-label">Confirm Password</label>
              <input 
                type="password" 
                className="form-input" 
                placeholder="••••••••"
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)} 
                required 
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginBottom: '20px', background: 'linear-gradient(135deg, var(--accent-teal) 0%, var(--accent-blue) 100%)' }} disabled={loading}>
              {loading ? 'Verifying Passkey...' : 'Register Executive Admin'}
            </button>
          </form>

          <div style={{ textShadow: 'none', textAlign: 'center', fontSize: '13px', color: 'var(--text-secondary)' }}>
            Have credentials? <Link href="/login" style={{ color: 'var(--accent-blue)', textDecoration: 'none', fontWeight: '600' }}>Login here</Link>
          </div>
        </div>
      )}
    </div>
  );
}
