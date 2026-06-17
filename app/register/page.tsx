'use client';

import { useState } from 'react';
import Link from 'next/link';
import { dbClient } from '@/lib/db';
import { Flame, CheckCircle, ArrowLeft } from 'lucide-react';

export default function Register() {
  const [role, setRole] = useState<'employee' | 'lawyer'>('employee');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [roleId, setRoleId] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
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

    if (!name || !email || !phone || !roleId || !password) {
      setError('Please fill in all required fields.');
      setLoading(false);
      return;
    }

    try {
      const { error: signUpError } = await dbClient.signUp({
        name,
        email,
        phone,
        role,
        role_id: roleId,
        password
      });

      if (signUpError) {
        setError(signUpError);
      } else {
        setSuccess(true);
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getIdLabel = () => {
    switch (role) {
      case 'employee': return 'Employee ID';
      case 'lawyer': return 'Lawyer ID';
    }
  };

  const getIdPlaceholder = () => {
    switch (role) {
      case 'employee': return 'e.g., EMP-1249';
      case 'lawyer': return 'e.g., LAW-9981';
    }
  };

  return (
    <div className="auth-container">
      {success ? (
        <div className="glass-panel auth-card glass-panel-hover" style={{ textAlign: 'center' }}>
          <CheckCircle className="w-16 h-16 text-emerald-400" style={{ color: 'var(--status-approved)', margin: '0 auto 24px auto' }} />
          <h2 style={{ marginBottom: '16px' }}>Registration Submitted</h2>
          
          <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', lineHeight: '1.6' }}>
            Your registration request has been successfully created. In accordance with security protocols, an Executive must approve your account before you can log in.
          </p>

          <Link href="/login" className="btn btn-primary" style={{ width: '100%' }}>
            Go to Login
          </Link>
        </div>
      ) : (
        <div className="glass-panel auth-card">
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '13px', marginBottom: '24px' }}>
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>

          <div className="auth-header">
            <div className="auth-logo">
              <Flame className="w-7 h-7" style={{ color: 'var(--accent-blue)' }} />
              <span>SUI GAS</span>
            </div>
            <h2>Register Profile</h2>
            <p className="auth-subtitle">SUI Gas Pipeline Pakistan Management</p>
          </div>

          {error && (
            <div className="glass-panel" style={{ padding: '12px 16px', background: 'rgba(239, 68, 68, 0.08)', borderColor: 'rgba(239, 68, 68, 0.3)', color: '#ef4444', fontSize: '13px', marginBottom: '20px', borderRadius: '8px' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Account Role</label>
              <select 
                className="form-select" 
                value={role} 
                onChange={(e) => {
                  setRole(e.target.value as any);
                  setRoleId('');
                }}
              >
                <option value="employee">Employee</option>
                <option value="lawyer">Lawyer</option>
              </select>
            </div>

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
                placeholder="e.g. name@sui.gov.pk"
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
              />
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number</label>
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
              <label className="form-label">{getIdLabel()}</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder={getIdPlaceholder()}
                value={roleId} 
                onChange={(e) => setRoleId(e.target.value)} 
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

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginBottom: '20px' }} disabled={loading}>
              {loading ? 'Creating Account...' : 'Register Profile'}
            </button>
          </form>

          <div style={{ textShadow: 'none', textAlign: 'center', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '10px' }}>
            Already have an account? <Link href="/login" style={{ color: 'var(--accent-blue)', textDecoration: 'none', fontWeight: '600' }}>Login Here</Link>
          </div>
          
          <div style={{ textShadow: 'none', textAlign: 'center', fontSize: '12px', color: 'var(--text-secondary)' }}>
            Executive Register <Link href="/register/executive" style={{ color: 'red', textDecoration: 'none', fontWeight: '500' }}>Register Here</Link>
          </div>
        </div>
      )}
    </div>
  );
}
