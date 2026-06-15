'use client';

import { useEffect, useState } from 'react';
import { useUser } from '../layout';
import { dbClient, Profile } from '@/lib/db';
import { Check, X, ShieldAlert, Loader2, Users } from 'lucide-react';

export default function ApprovalsPage() {
  const { user } = useUser();
  const [pendingUsers, setPendingUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const fetchPending = async () => {
    try {
      setLoading(true);
      const list = await dbClient.getPendingUsers();
      setPendingUsers(list);
    } catch (err) {
      console.error('Failed to load pending users', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'executive') {
      fetchPending();
    }
  }, [user]);

  // Restrict access
  if (user?.role !== 'executive') {
    return (
      <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', marginTop: '40px' }}>
        <ShieldAlert className="w-16 h-16 text-rose-500" style={{ color: 'var(--status-rejected)', margin: '0 auto 20px auto' }} />
        <h2>Access Denied</h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: '8px', maxWidth: '480px', margin: '8px auto 0 auto' }}>
          This administrative console is restricted to executive staff. Public or general personnel are blocked from accessing user approvals.
        </p>
      </div>
    );
  }

  const handleStatusChange = async (targetUserId: string, newStatus: 'approved' | 'rejected') => {
    setActioningId(targetUserId);
    setMessage(null);
    try {
      const { error } = await dbClient.updateUserStatus(targetUserId, newStatus);
      if (error) {
        setMessage({ text: error, type: 'error' });
      } else {
        setMessage({ 
          text: `Successfully ${newStatus === 'approved' ? 'approved' : 'rejected'} user account registration.`, 
          type: 'success' 
        });
        await fetchPending();
      }
    } catch (err: any) {
      setMessage({ text: err.message || 'Operation failed.', type: 'error' });
    } finally {
      setActioningId(null);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Registration Approval Queue</h1>
          <p className="page-description">Authorize or decline pending Employee and Lawyer portal registrations</p>
        </div>
      </div>

      {message && (
        <div 
          className="glass-panel animate-slide-in" 
          style={{ 
            padding: '14px 20px', 
            background: message.type === 'success' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
            borderColor: message.type === 'success' ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)',
            color: message.type === 'success' ? 'var(--status-approved)' : 'var(--status-rejected)',
            marginBottom: '24px', 
            borderRadius: '8px',
            fontSize: '14px'
          }}
        >
          {message.text}
        </div>
      )}

      <div className="glass-panel" style={{ padding: '0px', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '60px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px' }}>
            <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
            <span style={{ color: 'var(--text-secondary)' }}>Refreshing queue...</span>
          </div>
        ) : pendingUsers.length === 0 ? (
          <div style={{ padding: '60px 40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <Users className="w-12 h-12 text-slate-500" style={{ color: 'var(--text-muted)', margin: '0 auto 16px auto', opacity: 0.5 }} />
            <h3>Approval Queue Clear</h3>
            <p style={{ fontSize: '13px', marginTop: '4px' }}>There are currently no new employee or lawyer registrations awaiting approval.</p>
          </div>
        ) : (
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Full Name</th>
                  <th>Official Email</th>
                  <th>Contact Phone</th>
                  <th>Account Role</th>
                  <th>Role ID Code</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingUsers.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <strong style={{ color: 'var(--text-primary)' }}>{p.name}</strong>
                    </td>
                    <td>{p.email}</td>
                    <td>{p.phone}</td>
                    <td>
                      <span className="badge" style={{ 
                        background: p.role === 'lawyer' ? 'rgba(167, 139, 250, 0.1)' : 'rgba(0, 242, 254, 0.1)',
                        color: p.role === 'lawyer' ? '#a78bfa' : 'var(--accent-blue)',
                        border: p.role === 'lawyer' ? '1px solid rgba(167, 139, 250, 0.2)' : '1px solid rgba(0, 242, 254, 0.2)'
                      }}>
                        {p.role}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontFamily: 'monospace', color: 'var(--accent-teal)' }}>{p.role_id}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          className="btn btn-success"
                          style={{ padding: '6px 12px', fontSize: '12px', height: '32px' }}
                          onClick={() => handleStatusChange(p.id, 'approved')}
                          disabled={actioningId !== null}
                        >
                          {actioningId === p.id ? '...' : <Check className="w-4 h-4" />}
                          Approve
                        </button>
                        <button
                          className="btn btn-danger"
                          style={{ padding: '6px 12px', fontSize: '12px', height: '32px' }}
                          onClick={() => handleStatusChange(p.id, 'rejected')}
                          disabled={actioningId !== null}
                        >
                          {actioningId === p.id ? '...' : <X className="w-4 h-4" />}
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
