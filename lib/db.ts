// Types
export interface Profile {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'employee' | 'executive' | 'lawyer';
  role_id: string; // Employee ID, Executive ID, Lawyer ID
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export interface Complaint {
  id: string;
  name: string;
  register_date: string;
  description: string;
  created_by: string;
  creator_name: string;
  images: string[];
  pdfs: string[];
  public_link_token: string | null;
  public_link_active: boolean;
  created_at: string;
}

export const dbClient = {
  isMock: false,

  // Get current active session profile details
  async getUser(): Promise<Profile | null> {
    try {
      const res = await fetch('/api/auth/session');
      if (!res.ok) return null;
      const data = await res.json();
      return data.user as Profile;
    } catch (e) {
      console.error('getUser error:', e);
      return null;
    }
  },

  // User Sign In
  async signIn(email: string, password: string): Promise<{ user: Profile | null; error: string | null }> {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { user: null, error: data.error || 'Login operation failed.' };
      }
      return { user: data.user as Profile, error: null };
    } catch (e: any) {
      return { user: null, error: e.message || 'Network connection failed.' };
    }
  },

  // User Register
  async signUp(params: {
    email: string;
    name: string;
    phone: string;
    role: 'employee' | 'executive' | 'lawyer';
    role_id: string;
    password?: string;
  }): Promise<{ error: string | null }> {
    try {
      // If registering as executive, hit the executive route, otherwise user registration
      const url = params.role === 'executive' ? '/api/register/executive' : '/api/auth/register';
      const bodyPayload = params.role === 'executive' 
        ? {
            name: params.name,
            email: params.email,
            phone: params.phone,
            roleId: params.role_id,
            password: params.password,
            passkey: (params as any).passkey || '',
          }
        : {
            name: params.name,
            email: params.email,
            phone: params.phone,
            role: params.role,
            role_id: params.role_id,
            password: params.password,
          };

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload),
      });
      const data = await res.json();
      if (!res.ok) {
        return { error: data.error || 'Registration failed.' };
      }
      return { error: null };
    } catch (e: any) {
      return { error: e.message || 'Registration request failed.' };
    }
  },

  // User Sign Out
  async signOut(): Promise<void> {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      console.error('signOut error:', e);
    }
  },

  // Get users awaiting approval (Executives only)
  async getPendingUsers(): Promise<Profile[]> {
    try {
      const res = await fetch('/api/profiles/pending');
      if (!res.ok) return [];
      return await res.json();
    } catch (e) {
      console.error('getPendingUsers error:', e);
      return [];
    }
  },

  // Approve or reject user registration (Executives only)
  async updateUserStatus(userId: string, status: 'approved' | 'rejected'): Promise<{ error: string | null }> {
    try {
      const res = await fetch('/api/profiles/pending', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, status }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { error: data.error || 'Failed to update user status.' };
      }
      return { error: null };
    } catch (e: any) {
      return { error: e.message || 'Network error updating profile status.' };
    }
  },

  // Update Profile Info
  async updateProfile(userId: string, updates: Partial<Profile>): Promise<{ error: string | null }> {
    try {
      // Check if updating password or profile details
      if ((updates as any).password) {
        const res = await fetch('/api/profiles/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: (updates as any).password }),
        });
        const data = await res.json();
        if (!res.ok) {
          return { error: data.error || 'Failed to reset password.' };
        }
        return { error: null };
      } else {
        const res = await fetch('/api/profiles/update', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: updates.name, phone: updates.phone }),
        });
        const data = await res.json();
        if (!res.ok) {
          return { error: data.error || 'Failed to update profile details.' };
        }
        return { error: null };
      }
    } catch (e: any) {
      return { error: e.message || 'Network error updating profile.' };
    }
  },

  // Fetch Complaints
  async getComplaints(): Promise<Complaint[]> {
    try {
      const res = await fetch('/api/complaints');
      if (!res.ok) return [];
      return await res.json();
    } catch (e) {
      console.error('getComplaints error:', e);
      return [];
    }
  },

  // Create Complaint (Registered by employees and executives)
  async createComplaint(complaint: Omit<Complaint, 'id' | 'created_by' | 'creator_name' | 'created_at' | 'public_link_token' | 'public_link_active'>): Promise<{ data: Complaint | null; error: string | null }> {
    try {
      const res = await fetch('/api/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(complaint),
      });
      const data = await res.json();
      if (!res.ok) {
        return { data: null, error: data.error || 'Failed to record complaint.' };
      }
      return { data: data.data, error: null };
    } catch (e: any) {
      return { data: null, error: e.message || 'Network connection failed.' };
    }
  },

  // Update Complaint Details
  async updateComplaint(complaintId: string, updates: Partial<Complaint>): Promise<{ error: string | null }> {
    try {
      const res = await fetch(`/api/complaints/${complaintId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (!res.ok) {
        return { error: data.error || 'Failed to update complaint.' };
      }
      return { error: null };
    } catch (e: any) {
      return { error: e.message || 'Network connection failed.' };
    }
  },

  // Delete Complaint
  async deleteComplaint(complaintId: string): Promise<{ error: string | null }> {
    try {
      const res = await fetch(`/api/complaints/${complaintId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        return { error: data.error || 'Failed to delete complaint.' };
      }
      return { error: null };
    } catch (e: any) {
      return { error: e.message || 'Network connection failed.' };
    }
  },

  // Generate public sharing link
  async generatePublicLink(complaintId: string): Promise<{ token: string | null; error: string | null }> {
    try {
      const res = await fetch(`/api/complaints/${complaintId}/share`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) {
        return { token: null, error: data.error || 'Failed to generate public sharing link.' };
      }
      return { token: data.token, error: null };
    } catch (e: any) {
      return { token: null, error: e.message || 'Network connection failed.' };
    }
  },

  // Revoke public sharing link
  async revokePublicLink(complaintId: string): Promise<{ error: string | null }> {
    try {
      const res = await fetch(`/api/complaints/${complaintId}/share`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        return { error: data.error || 'Failed to revoke public sharing link.' };
      }
      return { error: null };
    } catch (e: any) {
      return { error: e.message || 'Network connection failed.' };
    }
  },

  // Retrieve details for public link
  async getPublicComplaint(token: string): Promise<Complaint | null> {
    try {
      const res = await fetch(`/api/public-complaint/${token}`);
      if (!res.ok) return null;
      return await res.json();
    } catch (e) {
      console.error('getPublicComplaint error:', e);
      return null;
    }
  },

  // GET: Fetch all profiles (Executives only)
  async getAllUsers(): Promise<Profile[]> {
    try {
      const res = await fetch('/api/profiles');
      if (!res.ok) return [];
      return await res.json();
    } catch (e) {
      console.error('getAllUsers error:', e);
      return [];
    }
  },

  // PATCH: Admin update user details (Executives only)
  async adminUpdateUser(userId: string, updates: Partial<Profile>): Promise<{ error: string | null }> {
    try {
      const res = await fetch('/api/profiles', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, updates }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { error: data.error || 'Failed to update user profile.' };
      }
      return { error: null };
    } catch (e: any) {
      return { error: e.message || 'Network connection failed.' };
    }
  },

  // DELETE: Admin delete user account (Executives only)
  async adminDeleteUser(userId: string): Promise<{ error: string | null }> {
    try {
      const res = await fetch(`/api/profiles?userId=${encodeURIComponent(userId)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        return { error: data.error || 'Failed to delete user account.' };
      }
      return { error: null };
    } catch (e: any) {
      return { error: e.message || 'Network connection failed.' };
    }
  }
};
