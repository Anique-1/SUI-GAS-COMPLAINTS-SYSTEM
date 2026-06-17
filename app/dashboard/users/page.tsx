'use client';

import { useEffect, useState } from 'react';
import { useUser } from '../layout';
import { dbClient, Profile } from '@/lib/db';
import { 
  Users, 
  Search, 
  Filter, 
  Edit3, 
  Trash2, 
  Loader2, 
  X, 
  ShieldAlert, 
  CheckCircle, 
  AlertCircle,
  User,
  Phone,
  Mail,
  Shield,
  Key
} from 'lucide-react';

export default function UserAccountsPage() {
  const { user: currentUser, refreshUser } = useUser();
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modal and form states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editRole, setEditRole] = useState<'employee' | 'executive' | 'lawyer'>('employee');
  const [editStatus, setEditStatus] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [updating, setUpdating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await dbClient.getAllUsers();
      setUsers(data);
    } catch (err) {
      console.error('Failed to load registered users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser?.role === 'executive') {
      fetchUsers();
    }
  }, [currentUser]);

  // Deny access to non-Executives
  if (currentUser?.role !== 'executive') {
    return (
      <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', marginTop: '40px' }}>
        <ShieldAlert className="w-16 h-16 text-rose-500" style={{ color: 'var(--status-rejected)', margin: '0 auto 20px auto' }} />
        <h2>Access Denied</h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: '8px', maxWidth: '480px', margin: '8px auto 0 auto' }}>
          This administrative control center is restricted to executive staff. General operators are blocked from viewing or managing user credentials.
        </p>
      </div>
    );
  }

  // Filter logic
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.role_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.phone.includes(searchQuery);

    const matchesRole = roleFilter === 'All' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'All' || user.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleOpenEditModal = (userToEdit: Profile) => {
    setEditingUser(userToEdit);
    setEditName(userToEdit.name);
    setEditPhone(userToEdit.phone);
    setEditRole(userToEdit.role);
    setEditStatus(userToEdit.status);
    setIsEditModalOpen(true);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setUpdating(true);
    setMessage(null);

    try {
      const { error } = await dbClient.adminUpdateUser(editingUser.id, {
        name: editName,
        phone: editPhone,
        role: editRole,
        status: editStatus
      });

      if (error) {
        setMessage({ text: error, type: 'error' });
      } else {
        setMessage({ text: `Account for ${editName} updated successfully.`, type: 'success' });
        setIsEditModalOpen(false);
        fetchUsers();
        // If they edited their own profile, refresh session context
        if (editingUser.id === currentUser.id) {
          await refreshUser();
        }
      }
    } catch (err: any) {
      setMessage({ text: err.message || 'Operation failed.', type: 'error' });
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (userId === currentUser.id) {
      alert('Security Protection: You cannot delete your own account.');
      return;
    }

    if (confirm(`CRITICAL WARNING: Are you sure you want to permanently delete the account for ${userName}? This action removes them from the database and terminates their session immediately.`)) {
      setDeletingId(userId);
      setMessage(null);
      try {
        const { error } = await dbClient.adminDeleteUser(userId);
        if (error) {
          setMessage({ text: error, type: 'error' });
        } else {
          setMessage({ text: `Permanently deleted account for ${userName}.`, type: 'success' });
          fetchUsers();
        }
      } catch (err: any) {
        setMessage({ text: err.message || 'Deletion failed.', type: 'error' });
      } finally {
        setDeletingId(null);
      }
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">SUI Gas User Accounts Manager</h1>
          <p className="page-description">Oversee, update, register, or delete personnel and lawyer credentials</p>
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
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          {message.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {message.text}
        </div>
      )}

      {/* FILTER BAR AND SEARCH BAR */}
      <div className="glass-panel filter-bar" style={{ padding: '16px', marginBottom: '32px' }}>
        <div style={{ display: 'flex', flexGrow: 1, position: 'relative' }}>
          <Search className="w-4 h-4 text-slate-400" style={{ position: 'absolute', left: '14px', top: '15px' }} />
          <input 
            type="text" 
            className="form-input filter-input" 
            placeholder="Search by name, email, phone, or personnel ID..."
            style={{ paddingLeft: '42px' }}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '600' }}>Role:</span>
            <select 
              className="form-select" 
              style={{ width: '130px', padding: '10px 14px' }}
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="All">All Roles</option>
              <option value="executive">Executive</option>
              <option value="employee">Employee</option>
              <option value="lawyer">Lawyer</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '600' }}>Status:</span>
            <select 
              className="form-select" 
              style={{ width: '130px', padding: '10px 14px' }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* USER LIST DATA TABLE */}
      <div className="glass-panel" style={{ padding: '0px', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '80px 0', textAlign: 'center' }}>
            <Loader2 className="w-10 h-10 animate-spin text-cyan-400" style={{ color: 'var(--accent-blue)', margin: '0 auto 16px auto' }} />
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Loading registered database profiles...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div style={{ padding: '80px 40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <Users className="w-12 h-12 text-slate-500" style={{ color: 'var(--text-muted)', margin: '0 auto 16px auto', opacity: 0.5 }} />
            <h3>No Users Found</h3>
            <p style={{ fontSize: '13px', marginTop: '4px' }}>Try adjusting search words or filter criteria.</p>
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
                  <th>ID Code</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((userObj) => {
                  const isSelf = userObj.id === currentUser.id;
                  
                  return (
                    <tr key={userObj.id}>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <strong style={{ color: 'var(--text-primary)' }}>{userObj.name}</strong>
                          {isSelf && (
                            <span style={{ fontSize: '10px', background: 'rgba(2, 132, 199, 0.1)', color: 'var(--accent-blue)', padding: '1px 6px', borderRadius: '4px', fontWeight: '800' }}>
                              YOU
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>{userObj.email}</td>
                      <td style={{ whiteSpace: 'nowrap' }}>{userObj.phone}</td>
                      <td>
                        <span className="badge" style={{ 
                          background: userObj.role === 'executive' 
                            ? 'rgba(13, 148, 136, 0.1)' 
                            : userObj.role === 'lawyer' 
                              ? 'rgba(167, 139, 250, 0.1)' 
                              : 'rgba(2, 132, 199, 0.1)',
                          color: userObj.role === 'executive' 
                            ? 'var(--accent-teal)' 
                            : userObj.role === 'lawyer' 
                              ? '#a78bfa' 
                              : 'var(--accent-blue)',
                          border: userObj.role === 'executive' 
                            ? '1px solid rgba(13, 148, 136, 0.2)' 
                            : userObj.role === 'lawyer' 
                              ? '1px solid rgba(167, 139, 250, 0.2)' 
                              : '1px solid rgba(2, 132, 199, 0.2)'
                        }}>
                          {userObj.role}
                        </span>
                      </td>
                      <td style={{ fontFamily: 'monospace', color: 'var(--accent-teal)' }}>{userObj.role_id}</td>
                      <td>
                        <span className={`badge badge-${userObj.status}`}>
                          {userObj.status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button 
                            className="btn btn-secondary" 
                            style={{ padding: '6px', height: '32px', width: '32px' }}
                            title="Edit User Settings"
                            onClick={() => handleOpenEditModal(userObj)}
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          
                          <button 
                            className="btn btn-danger" 
                            style={{ padding: '6px', height: '32px', width: '32px', opacity: isSelf ? 0.3 : 1, cursor: isSelf ? 'not-allowed' : 'pointer' }}
                            title={isSelf ? 'You cannot delete yourself' : 'Delete Account'}
                            onClick={() => handleDeleteUser(userObj.id, userObj.name)}
                            disabled={isSelf || deletingId === userObj.id}
                          >
                            {deletingId === userObj.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* EDIT USER DETAIL SETTINGS MODAL */}
      {isEditModalOpen && editingUser && (
        <div className="modal-overlay animate-fade-in">
          <div className="glass-panel modal-content">
            <button className="modal-close" onClick={() => setIsEditModalOpen(false)}>
              <X className="w-5 h-5" />
            </button>
            
            <div className="modal-header">
              <h2>Modify User Account</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px' }}>
                Update status clearances, roles, and contacts for SUI Gas portal personnel
              </p>
            </div>

            <form onSubmit={handleUpdateUser}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <div style={{ position: 'relative' }}>
                  <User className="w-4 h-4 text-slate-400" style={{ position: 'absolute', left: '12px', top: '14px' }} />
                  <input 
                    type="text" 
                    className="form-input" 
                    style={{ paddingLeft: '40px' }}
                    value={editName} 
                    onChange={(e) => setEditName(e.target.value)} 
                    required 
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Official Email (Disabled)</label>
                <div style={{ position: 'relative' }}>
                  <Mail className="w-4 h-4 text-slate-400" style={{ position: 'absolute', left: '12px', top: '14px' }} />
                  <input 
                    type="email" 
                    className="form-input" 
                    style={{ paddingLeft: '40px', opacity: 0.6, cursor: 'not-allowed' }}
                    value={editingUser.email} 
                    disabled 
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Contact Phone</label>
                <div style={{ position: 'relative' }}>
                  <Phone className="w-4 h-4 text-slate-400" style={{ position: 'absolute', left: '12px', top: '14px' }} />
                  <input 
                    type="tel" 
                    className="form-input" 
                    style={{ paddingLeft: '40px' }}
                    value={editPhone} 
                    onChange={(e) => setEditPhone(e.target.value)} 
                    required 
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Account Role</label>
                <div style={{ position: 'relative' }}>
                  <Shield className="w-4 h-4 text-slate-400" style={{ position: 'absolute', left: '12px', top: '14px' }} />
                  <select 
                    className="form-select" 
                    style={{ paddingLeft: '40px' }}
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as any)}
                    disabled={editingUser.id === currentUser.id}
                  >
                    <option value="executive">Executive (Admin-type)</option>
                    <option value="employee">Employee</option>
                    <option value="lawyer">Lawyer (Read-only)</option>
                  </select>
                </div>
                {editingUser.id === currentUser.id && (
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                    🔒 You cannot demote or modify your own role.
                  </span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Approval Status</label>
                <div style={{ position: 'relative' }}>
                  <Key className="w-4 h-4 text-slate-400" style={{ position: 'absolute', left: '12px', top: '14px' }} />
                  <select 
                    className="form-select" 
                    style={{ paddingLeft: '40px' }}
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as any)}
                    disabled={editingUser.id === currentUser.id}
                  >
                    <option value="approved">Approved</option>
                    <option value="pending">Pending</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
                {editingUser.id === currentUser.id && (
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                    🔒 You cannot change your own approval status.
                  </span>
                )}
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsEditModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={updating}>
                  {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {updating ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
