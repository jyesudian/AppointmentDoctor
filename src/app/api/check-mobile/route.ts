import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ── Supabase admin client (service-role, server-only) ────────────────────────
function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error('Supabase environment variables are not configured.');
  }

  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// ── Validation ───────────────────────────────────────────────────────────────
const MOBILE_REGEX = /^\d{10}$/;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const mobile: string = (body?.mobile ?? '').trim();

    if (!mobile) {
      return NextResponse.json(
        { error: 'Mobile Number is required.' },
        { status: 400 }
      );
    }

    // Backend re-validation: exactly 10 digits, no other characters
    if (!/^\d+$/.test(mobile)) {
      return NextResponse.json(
        { error: 'Only numeric digits are allowed.' },
        { status: 400 }
      );
    }

    if (!MOBILE_REGEX.test(mobile)) {
      return NextResponse.json(
        { error: 'Mobile Number must contain exactly 10 digits.' },
        { status: 400 }
      );
    }

    // ── Duplicate check via profiles table ────────────────────────────────────
    const supabase = getAdminClient();

    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('mobile', mobile)
      .maybeSingle();

    if (error) {
      console.error('[check-mobile] Supabase query error:', error.message);
      // Fail open on query error — let the DB unique constraint fire at sign-up
      return NextResponse.json({ available: true });
    }

    if (data) {
      return NextResponse.json(
        { available: false, error: 'An account already exists with this Mobile Number.' },
        { status: 409 }
      );
    }

    return NextResponse.json({ available: true });
  } catch (err: any) {
    console.error('[check-mobile] Unexpected error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
