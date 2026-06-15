'use client';

import { useState } from 'react';
import { useUser } from '../layout';
import { dbClient } from '@/lib/db';
import { User, Phone, Lock, CheckCircle, AlertCircle } from 'lucide-react';

export default function ProfilePage() {
  const { user, refreshUser } = useUser();
  
  // Profile form state
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passLoading, setPassLoading] = useState(false);
  const [passMessage, setPassMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setProfileLoading(true);
    setProfileMessage(null);

    try {
      const { error } = await dbClient.updateProfile(user.id, { name, phone });
      if (error) {
        setProfileMessage({ text: error, type: 'error' });
      } else {
        setProfileMessage({ text: 'Profile details updated successfully.', type: 'success' });
        await refreshUser(); // refresh layout context user details
      }
    } catch (err: any) {
      setProfileMessage({ text: err.message || 'Failed to update profile.', type: 'error' });
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassLoading(true);
    setPassMessage(null);

    if (newPassword !== confirmPassword) {
      setPassMessage({ text: 'Confirm password does not match new password.', type: 'error' });
      setPassLoading(false);
      return;
    }

    try {
      // If mock, just simulate
      if (dbClient.isMock) {
        // simulate a small delay
        await new Promise((resolve) => setTimeout(resolve, 800));
        setPassMessage({ text: 'Password changed successfully (Mock Database Mode).', type: 'success' });
      } else {
        // Real MongoDB Auth Update
        const { error } = await dbClient.updateProfile(user!.id, { password: newPassword } as any);
        if (error) throw new Error(error);
        setPassMessage({ text: 'Password changed successfully.', type: 'success' });
      }
      
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPassMessage({ text: err.message || 'Failed to change password.', type: 'error' });
    } finally {
      setPassLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Profile Settings</h1>
          <p className="page-description">Manage your personnel details, credentials, and password configuration</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px' }}>
        
        {/* EDIT PROFILE DETAILS SECTION */}
        <section className="glass-panel" style={{ padding: '32px' }}>
          <h2 style={{ fontSize: '20px', marginBottom: '24px', display: 'flex', gap: '10px', alignItems: 'center' }}>
            <User className="w-5 h-5 text-cyan-400" style={{ color: 'var(--accent-blue)' }} />
            Personal Details
          </h2>

          {profileMessage && (
            <div 
              style={{ 
                padding: '12px', 
                background: profileMessage.type === 'success' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                borderColor: profileMessage.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                color: profileMessage.type === 'success' ? 'var(--status-approved)' : 'var(--status-rejected)',
                fontSize: '13px', 
                marginBottom: '20px', 
                borderRadius: '6px',
                border: '1px solid',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              {profileMessage.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              {profileMessage.text}
            </div>
          )}

          <form onSubmit={handleProfileUpdate}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input 
                type="text" 
                className="form-input" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                required 
              />
            </div>

            <div className="form-group">
              <label className="form-label">Official Email (Disabled)</label>
              <input 
                type="email" 
                className="form-input" 
                value={user?.email || ''} 
                style={{ opacity: 0.6, cursor: 'not-allowed' }}
                disabled 
              />
            </div>

            <div className="form-group">
              <label className="form-label">Phone Contact</label>
              <input 
                type="tel" 
                className="form-input" 
                value={phone} 
                onChange={(e) => setPhone(e.target.value)} 
                required 
              />
            </div>

            <div className="form-group">
              <label className="form-label">System Role</label>
              <input 
                type="text" 
                className="form-input" 
                value={user?.role || ''} 
                style={{ opacity: 0.6, cursor: 'not-allowed', textTransform: 'capitalize' }}
                disabled 
              />
            </div>

            <div className="form-group" style={{ marginBottom: '28px' }}>
              <label className="form-label">Personnel Code</label>
              <input 
                type="text" 
                className="form-input" 
                value={user?.role_id || ''} 
                style={{ opacity: 0.6, cursor: 'not-allowed', fontFamily: 'monospace' }}
                disabled 
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={profileLoading}>
              {profileLoading ? 'Saving changes...' : 'Save Profile Details'}
            </button>
          </form>
        </section>

        {/* CHANGE PASSWORD SECTION */}
        <section className="glass-panel" style={{ padding: '32px' }}>
          <h2 style={{ fontSize: '20px', marginBottom: '24px', display: 'flex', gap: '10px', alignItems: 'center' }}>
            <Lock className="w-5 h-5 text-cyan-400" style={{ color: 'var(--accent-teal)' }} />
            Security & Credentials
          </h2>

          {passMessage && (
            <div 
              style={{ 
                padding: '12px', 
                background: passMessage.type === 'success' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                borderColor: passMessage.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                color: passMessage.type === 'success' ? 'var(--status-approved)' : 'var(--status-rejected)',
                fontSize: '13px', 
                marginBottom: '20px', 
                borderRadius: '6px',
                border: '1px solid',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              {passMessage.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              {passMessage.text}
            </div>
          )}

          <form onSubmit={handlePasswordUpdate}>
            <div className="form-group">
              <label className="form-label">Current Password</label>
              <input 
                type="password" 
                className="form-input" 
                placeholder="••••••••"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required={!dbClient.isMock}
              />
            </div>

            <div className="form-group">
              <label className="form-label">New Password</label>
              <input 
                type="password" 
                className="form-input" 
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: '28px' }}>
              <label className="form-label">Confirm New Password</label>
              <input 
                type="password" 
                className="form-input" 
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn btn-secondary" style={{ width: '100%', borderColor: 'var(--border-hover)' }} disabled={passLoading}>
              {passLoading ? 'Updating credentials...' : 'Update Password'}
            </button>
          </form>
        </section>

      </div>
    </div>
  );
}
