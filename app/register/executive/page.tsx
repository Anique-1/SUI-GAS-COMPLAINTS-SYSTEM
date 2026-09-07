'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  CheckCircle, 
  ArrowLeft, 
  Key, 
  User, 
  Mail, 
  Phone, 
  Hash, 
  Lock, 
  ShieldAlert, 
  Eye, 
  EyeOff, 
  Loader2 
} from 'lucide-react';
import SngplHeader from '@/components/SngplHeader';
import SngplFooter from '@/components/SngplFooter';

export default function ExecutiveRegister() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [roleId, setRoleId] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passkey, setPasskey] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showPasskey, setShowPasskey] = useState(false);
  
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
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
      <SngplHeader activePage="executive" />

      <main className="auth-container" style={{ flex: '1 0 auto', padding: '36px 16px' }}>
      {success ? (
        <div className="glass-panel auth-card" style={{ textAlign: 'center', maxWidth: '500px', padding: '36px 24px' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#ecfdf5', border: '1px solid #a7f3d0', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto' }}>
            <CheckCircle className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: '800', marginBottom: '12px', color: '#0f172a' }}>
            Executive Access Granted
          </h2>
          <p style={{ color: '#475569', marginBottom: '28px', lineHeight: '1.6', fontSize: '13.5px' }}>
            Your Executive administrator account has been successfully verified and registered in the SNGPL database. You can now sign in to access management, review, and approval operations.
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
            <div className="sngpl-logo-badge" style={{ borderColor: 'var(--accent-teal)' }}>
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
              <div className="sngpl-brand-subtitle" style={{ color: 'var(--accent-teal)' }}>
                Executive Administration Console
              </div>
            </div>
            <h1 style={{ fontSize: '20px', fontWeight: '800', marginTop: '10px', color: '#0f172a' }}>
              Executive Admin Registry
            </h1>
            <p className="auth-subtitle" style={{ fontSize: '13px' }}>
              Restricted onboarding portal for authorized SNGPL executives
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
            {/* Full Name */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <User className="w-3.5 h-3.5 text-teal-600" />
                <span>Executive Full Name</span>
              </label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Enter executive name"
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                required 
                autoComplete="name"
              />
            </div>

            {/* Official Email */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Mail className="w-3.5 h-3.5 text-teal-600" />
                <span>Official Executive Email</span>
              </label>
              <input 
                type="email" 
                className="form-input" 
                placeholder="e.g. executive@sui.gov.pk"
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

            {/* Contact Phone Number */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Phone className="w-3.5 h-3.5 text-teal-600" />
                <span>Contact Phone Number</span>
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
                <Hash className="w-3.5 h-3.5 text-teal-600" />
                <span>Executive Official ID</span>
              </label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g. EXEC-0520"
                value={roleId} 
                onChange={(e) => setRoleId(e.target.value)} 
                required 
                autoCapitalize="characters"
              />
            </div>

            {/* Security Passkey Field */}
            <div className="form-group" style={{ border: '1.5px dashed rgba(13, 148, 136, 0.4)', padding: '14px', borderRadius: '10px', background: 'rgba(13, 148, 136, 0.04)' }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#0f766e', marginBottom: '6px' }}>
                <Key className="w-4 h-4 text-teal-600" />
                <span>Executive Security Registration Passkey</span>
              </label>
              <div className="sngpl-pwd-wrapper">
                <input 
                  type={showPasskey ? 'text' : 'password'} 
                  className="form-input" 
                  placeholder="Enter authorized admin passkey"
                  autoComplete="new-password"
                  value={passkey} 
                  onChange={(e) => setPasskey(e.target.value)} 
                  required 
                  style={{ paddingRight: '42px' }}
                />
                <button
                  type="button"
                  className="sngpl-pwd-toggle"
                  onClick={() => setShowPasskey(!showPasskey)}
                  aria-label={showPasskey ? 'Hide passkey' : 'Show passkey'}
                >
                  {showPasskey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <span style={{ fontSize: '11px', color: '#64748b', marginTop: '6px', display: 'block' }}>
                Requires secret master security passkey configured on the server
              </span>
            </div>

            {/* Password */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Lock className="w-3.5 h-3.5 text-teal-600" />
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
                <Lock className="w-3.5 h-3.5 text-teal-600" />
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
              style={{ width: '100%', marginBottom: '18px', padding: '12px', fontSize: '14.5px', fontWeight: '700', background: 'linear-gradient(135deg, var(--accent-teal) 0%, var(--accent-blue) 100%)' }} 
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <span>Register Executive Administrator</span>
              )}
            </button>
          </form>

          {/* Login Link */}
          <div style={{ textAlign: 'center', fontSize: '13px', color: '#475569' }}>
            Have credentials?{' '}
            <Link href="/login" style={{ color: 'var(--accent-blue)', textDecoration: 'none', fontWeight: '700' }}>
              Login Here
            </Link>
          </div>

        </div>
      )}
      </main>

      <SngplFooter />
    </div>
  );
}
