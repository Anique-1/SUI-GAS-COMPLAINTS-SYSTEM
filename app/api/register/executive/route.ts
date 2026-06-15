import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { name, email, phone, roleId, password, passkey } = await req.json();

    if (!name || !email || !phone || !roleId || !password || !passkey) {
      return NextResponse.json(
        { error: 'All registration fields are required.' },
        { status: 400 }
      );
    }

    // Verify secure passkey
    const expectedPasskey = process.env.EXECUTIVE_REGISTRATION_PASSKEY;
    if (!expectedPasskey || passkey !== expectedPasskey) {
      return NextResponse.json(
        { error: 'Invalid Executive Security Passkey. Registration denied.' },
        { status: 403 }
      );
    }

    // Signup on Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Failed to create user credentials on the database.' },
        { status: 500 }
      );
    }

    // Insert approved profile into profiles table (Executive is pre-approved)
    const { error: profileError } = await supabase.from('profiles').insert({
      id: authData.user.id,
      name,
      email,
      phone,
      role: 'executive',
      role_id: roleId,
      status: 'approved', // Pre-approved
    });

    if (profileError) {
      // Clean up user if profile insertion failed
      console.error('Error inserting profile, credentials created:', profileError);
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Executive registration error:', error);
    return NextResponse.json(
      { error: error.message || 'Server error occurred during signup.' },
      { status: 500 }
    );
  }
}
