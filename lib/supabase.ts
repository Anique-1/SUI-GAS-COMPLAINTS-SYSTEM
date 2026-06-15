import { createClient } from '@supabase/supabase-js';

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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Warning: Supabase URL and Anon Key are missing in environment variables.');
}

// Instantiate the single-source-of-truth Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const dbClient = {
  isMock: false,

  // Get current active session profile details
  async getUser(): Promise<Profile | null> {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return null;
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (error || !data) {
      console.error('Error fetching user profile from database:', error);
      return null;
    }
    
    return data as Profile;
  },

  // User Sign In
  async signIn(email: string, password: string): Promise<{ user: Profile | null; error: string | null }> {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { user: null, error: error.message };
    
    // Fetch profile status details
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();
      
    if (profileError || !profile) {
      return { user: null, error: "Profile details not found in database registry." };
    }
    
    // Enforce Executive approval security locks
    if (profile.status === 'pending') {
      await supabase.auth.signOut();
      return { user: null, error: "Your account is pending Executive approval." };
    }
    
    if (profile.status === 'rejected') {
      await supabase.auth.signOut();
      return { user: null, error: "Your registration request has been rejected." };
    }
    
    return { user: profile as Profile, error: null };
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
    const { data, error } = await supabase.auth.signUp({
      email: params.email,
      password: params.password || 'TemporaryPass123!',
    });
    if (error) return { error: error.message };
    if (!data.user) return { error: "Failed to create authentication credentials." };
    
    // Auto-approve Executives (acts as Admin), set Employees/Lawyers to 'pending'
    const initialStatus = params.role === 'executive' ? 'approved' : 'pending';

    const { error: profileError } = await supabase.from('profiles').insert({
      id: data.user.id,
      name: params.name,
      email: params.email,
      phone: params.phone,
      role: params.role,
      role_id: params.role_id,
      status: initialStatus
    });
    
    return { error: profileError ? profileError.message : null };
  },

  // User Sign Out
  async signOut(): Promise<void> {
    await supabase.auth.signOut();
  },

  // Get users awaiting approval (Executives only)
  async getPendingUsers(): Promise<Profile[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('status', 'pending');
      
    if (error) {
      console.error('Error querying pending users:', error);
      return [];
    }
    return data || [];
  },

  // Approve or reject user registration (Executives only)
  async updateUserStatus(userId: string, status: 'approved' | 'rejected'): Promise<{ error: string | null }> {
    const { error } = await supabase
      .from('profiles')
      .update({ status })
      .eq('id', userId);
    return { error: error ? error.message : null };
  },

  // Update Profile Info
  async updateProfile(userId: string, updates: Partial<Profile>): Promise<{ error: string | null }> {
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId);
    return { error: error ? error.message : null };
  },

  // Fetch Complaints
  async getComplaints(): Promise<Complaint[]> {
    const { data, error } = await supabase
      .from('complaints')
      .select('*, profiles(name)')
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Error fetching complaints from Supabase:', error);
      return [];
    }
    
    return (data || []).map((c: any) => ({
      ...c,
      creator_name: c.profiles?.name || 'Unknown Operator'
    }));
  },

  // Create Complaint (Registered by employees and executives)
  async createComplaint(complaint: Omit<Complaint, 'id' | 'created_by' | 'creator_name' | 'created_at' | 'public_link_token' | 'public_link_active'>): Promise<{ data: Complaint | null; error: string | null }> {
    const user = await this.getUser();
    if (!user) return { data: null, error: "Unauthorized session access." };
    
    const { data, error } = await supabase
      .from('complaints')
      .insert({
        name: complaint.name,
        register_date: complaint.register_date,
        description: complaint.description,
        images: complaint.images,
        pdfs: complaint.pdfs,
        created_by: user.id,
      })
      .select()
      .single();
      
    if (error || !data) {
      return { data: null, error: error ? error.message : "Failed to create complaint" };
    }
    
    return {
      data: {
        ...data,
        creator_name: user.name
      } as Complaint,
      error: null
    };
  },

  // Update Complaint Details
  async updateComplaint(complaintId: string, updates: Partial<Complaint>): Promise<{ error: string | null }> {
    const { error } = await supabase
      .from('complaints')
      .update(updates)
      .eq('id', complaintId);
    return { error: error ? error.message : null };
  },

  // Delete Complaint
  async deleteComplaint(complaintId: string): Promise<{ error: string | null }> {
    const { error } = await supabase
      .from('complaints')
      .delete()
      .eq('id', complaintId);
    return { error: error ? error.message : null };
  },

  // Generate public sharing link
  async generatePublicLink(complaintId: string): Promise<{ token: string | null; error: string | null }> {
    const token = 'pub-' + Math.random().toString(36).substr(2, 12);
    const updates = {
      public_link_token: token,
      public_link_active: true
    };
    
    const { error } = await this.updateComplaint(complaintId, updates);
    return { token: error ? null : token, error };
  },

  // Revoke public sharing link
  async revokePublicLink(complaintId: string): Promise<{ error: string | null }> {
    const updates = {
      public_link_token: null,
      public_link_active: false
    };
    return await this.updateComplaint(complaintId, updates);
  },

  // Retrieve details for public link
  async getPublicComplaint(token: string): Promise<Complaint | null> {
    const { data, error } = await supabase
      .from('complaints')
      .select('*, profiles(name)')
      .eq('public_link_token', token)
      .eq('public_link_active', true)
      .single();
      
    if (error || !data) {
      return null;
    }
    
    return {
      ...(data as any),
      creator_name: (data as any).profiles?.name || 'Unknown Operator'
    } as Complaint;
  }
};
