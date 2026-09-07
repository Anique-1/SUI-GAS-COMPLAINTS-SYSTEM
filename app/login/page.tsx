'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { dbClient } from '@/lib/db';
import { ArrowLeft, Lock, Mail, ShieldAlert, Eye, EyeOff, Loader2 } from 'lucide-react';
import SngplHeader from '@/components/SngplHeader';
import SngplFooter from '@/components/SngplFooter';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { user, error: signInError } = await dbClient.signIn(email, password);

      if (signInError) {
        setError(signInError);
      } else if (user) {
        // Redirect to dashboard layout which handles internal role routing
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
      <SngplHeader activePage="login" />

      <main className="auth-container" style={{ flex: '1 0 auto', padding: '36px 16px' }}>
        <div className="glass-panel auth-card" style={{ maxWidth: '460px', width: '100%' }}>
        
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

        {/* SNGPL Official Logo Header */}
        <div className="auth-header" style={{ marginBottom: '24px' }}>
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
            Portal Authentication
          </h1>
          <p className="auth-subtitle" style={{ fontSize: '13px' }}>
            Sign in with your verified credentials to access the management system
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
              marginBottom: '20px', 
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
          {/* Email Input */}
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Mail className="w-3.5 h-3.5 text-sky-600" />
              <span>Official Email Address</span>
            </label>
            <input 
              type="email" 
              className="form-input" 
              placeholder="e.g. employee@sui.gov.pk"
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

          {/* Password Input with Visibility Toggle */}
          <div className="form-group" style={{ marginBottom: '24px' }}>
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
                autoComplete="current-password"
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

          {/* Submit Button */}
          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', marginBottom: '20px', padding: '12px', fontSize: '14.5px', fontWeight: '700' }} 
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : (
              <span>Sign In to Portal</span>
            )}
          </button>
        </form>

        {/* Footer Link */}
        <div style={{ textAlign: 'center', fontSize: '13px', color: '#475569' }}>
          Don&apos;t have an account?{' '}
          <Link href="/register" style={{ color: 'var(--accent-blue)', textDecoration: 'none', fontWeight: '700' }}>
            Register Profile
          </Link>
        </div>

      </div>
      </main>

      <SngplFooter />
    </div>
  );
}
