'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { dbClient } from '@/lib/db';
import { 
  CheckCircle, 
  ArrowLeft, 
  User, 
  Mail, 
  Phone, 
  Hash, 
  Lock, 
  Eye, 
  EyeOff, 
  Loader2, 
  Briefcase, 
  Scale, 
  ShieldAlert 
} from 'lucide-react';
import SngplHeader from '@/components/SngplHeader';
import SngplFooter from '@/components/SngplFooter';

export default function Register() {
  const [role, setRole] = useState<'employee' | 'lawyer'>('employee');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [roleId, setRoleId] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
      case 'employee': return 'Employee ID Number';
      case 'lawyer': return 'Legal / Bar Council ID';
    }
  };

  const getIdPlaceholder = () => {
    switch (role) {
      case 'employee': return 'e.g. EMP-1249';
      case 'lawyer': return 'e.g. LAW-9981';
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
      <SngplHeader activePage="register" />

      <main className="auth-container" style={{ flex: '1 0 auto', padding: '36px 16px' }}>
      {success ? (
        <div className="glass-panel auth-card" style={{ textAlign: 'center', maxWidth: '480px', padding: '36px 24px' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#ecfdf5', border: '1px solid #a7f3d0', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto' }}>
            <CheckCircle className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', marginBottom: '12px' }}>
            Registration Submitted
          </h2>

          <p style={{ color: '#475569', marginBottom: '28px', lineHeight: '1.6', fontSize: '13.5px' }}>
            Your registration request has been submitted to the SNGPL Administration. An authorized Executive must review and approve your account before you can log in.
          </p>

          <Link href="/login" className="btn btn-primary" style={{ width: '100%', padding: '12px', fontSize: '14.5px', fontWeight: '700' }}>
            Proceed to Login
          </Link>
        </div>
      ) : (
        <div className="glass-panel auth-card" style={{ maxWidth: '500px', width: '100%' }}>
          
          {/* Back navigation */}
          <Link 
            href="/" 
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '6px', 
              color: '#475569', 
              textDecoration: 'none', 
              fontSize: '13px', 
              fontWeight: '600',
              marginBottom: '20px',
              background: '#f1f5f9',
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid #e2e8f0',
              transition: 'all 0.15s ease'
            }}
          >
            <ArrowLeft className="w-3.5 h-3.5" /> <span>Back to Home</span>
          </Link>

          {/* SNGPL Corporate Logo Header */}
          <div className="auth-header" style={{ marginBottom: '22px' }}>
            <div className="sngpl-logo-badge">
              <Image
                src="/sngpl-logo.png"
                alt="SNGPL Official Logo"
                width={56}
                height={56}
                priority
                style={{ objectFit: 'contain' }}
              />
            </div>
            <div>
              <div className="sngpl-brand-title">
                SUI NORTHERN
              </div>
              <div className="sngpl-brand-subtitle">
                Gas Pipelines Limited (SNGPL)
              </div>
            </div>
            <h1 style={{ fontSize: '20px', fontWeight: '800', marginTop: '10px', color: '#0f172a' }}>
              Register Staff Profile
            </h1>
            <p className="auth-subtitle" style={{ fontSize: '13px' }}>
              Create an account for official complaint management and tracking
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div 
              style={{ 
                padding: '12px 14px', 
                background: '#fef2f2', 
                border: '1px solid #fecaca', 
                color: '#b91c1c', 
                fontSize: '13px', 
                marginBottom: '18px', 
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}
            >
              <ShieldAlert className="w-4 h-4 flex-shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            
            {/* Role Selection Segment Tabs */}
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Briefcase className="w-3.5 h-3.5 text-sky-600" />
                <span>Select Account Role</span>
              </label>
              <div className="sngpl-role-segment">
                <button
                  type="button"
                  className={`sngpl-role-btn ${role === 'employee' ? 'active' : ''}`}
                  onClick={() => {
                    setRole('employee');
                    setRoleId('');
                  }}
                >
                  <Briefcase className="w-4 h-4" />
                  <span>SNGPL Employee</span>
                </button>
                <button
                  type="button"
                  className={`sngpl-role-btn ${role === 'lawyer' ? 'active' : ''}`}
                  onClick={() => {
                    setRole('lawyer');
                    setRoleId('');
                  }}
                >
                  <Scale className="w-4 h-4" />
                  <span>Legal Counsel</span>
                </button>
              </div>
            </div>

            {/* Full Name */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <User className="w-3.5 h-3.5 text-sky-600" />
                <span>Full Name</span>
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
              />
            </div>

            {/* Official Email */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Mail className="w-3.5 h-3.5 text-sky-600" />
                <span>Official Email Address</span>
              </label>
              <input
                type="email"
                className="form-input"
                placeholder="e.g. name@sui.gov.pk"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                inputMode="email"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
              />
            </div>

            {/* Phone Number */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Phone className="w-3.5 h-3.5 text-sky-600" />
                <span>Mobile Contact Number</span>
              </label>
              <input
                type="tel"
                className="form-input"
                placeholder="e.g. 03001234567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                autoComplete="tel"
                inputMode="tel"
              />
            </div>

            {/* Role ID */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Hash className="w-3.5 h-3.5 text-sky-600" />
                <span>{getIdLabel()}</span>
              </label>
              <input
                type="text"
                className="form-input"
                placeholder={getIdPlaceholder()}
                value={roleId}
                onChange={(e) => setRoleId(e.target.value)}
                required
                autoCapitalize="characters"
              />
            </div>

            {/* Password */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Lock className="w-3.5 h-3.5 text-sky-600" />
                <span>Password</span>
              </label>
              <div className="sngpl-pwd-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  style={{ paddingRight: '42px' }}
                />
                <button
                  type="button"
                  className="sngpl-pwd-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="form-group" style={{ marginBottom: '24px' }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Lock className="w-3.5 h-3.5 text-sky-600" />
                <span>Confirm Password</span>
              </label>
              <div className="sngpl-pwd-wrapper">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  style={{ paddingRight: '42px' }}
                />
                <button
                  type="button"
                  className="sngpl-pwd-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: '100%', marginBottom: '18px', padding: '12px', fontSize: '14.5px', fontWeight: '700' }} 
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <span>Register Profile</span>
              )}
            </button>
          </form>

          {/* Login Link */}
          <div style={{ textAlign: 'center', fontSize: '13px', color: '#475569', marginBottom: '14px' }}>
            Already registered?{' '}
            <Link href="/login" style={{ color: 'var(--accent-blue)', textDecoration: 'none', fontWeight: '700' }}>
              Login Here
            </Link>
          </div>

          {/* Executive Passkey Registration Notice */}
          <div style={{ padding: '12px 14px', background: '#f0fdfa', border: '1px solid #99f6e4', borderRadius: '8px', textAlign: 'center', fontSize: '12.5px' }}>
            <span style={{ color: '#0f766e', fontWeight: '600' }}>Executive Administrator? </span>
            <Link href="/register/executive" style={{ color: '#0d9488', textDecoration: 'none', fontWeight: '700' }}>
              Register with Passkey →
            </Link>
          </div>

        </div>
      )}
      </main>

      <SngplFooter />
    </div>
  );
}
