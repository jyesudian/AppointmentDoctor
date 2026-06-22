import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ── Supabase admin client (service-role, server-only) ───────────────────────
// Never expose SUPABASE_SERVICE_ROLE_KEY to the browser.
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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const raw: string = body?.email ?? '';

    // ── Normalise: trim + lowercase ──────────────────────────────────────────
    const email = raw.trim().toLowerCase();

    if (!email) {
      return NextResponse.json(
        { error: 'Email Address is required.' },
        { status: 400 }
      );
    }

    // ── Basic format guard (backend re-validation) ────────────────────────────
    const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid Email Address.' },
        { status: 400 }
      );
    }

    // ── Duplicate check via profiles table ────────────────────────────────────
    // The profiles table has a unique constraint on the email column which
    // mirrors auth.users.  Using the admin client bypasses RLS so we can
    // safely perform an existence check before the sign-up attempt.
    const supabase = getAdminClient();

    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (error) {
      console.error('[check-email] Supabase query error:', error.message);
      // Fail open — let Supabase's own uniqueness constraint catch it at sign-up
      return NextResponse.json({ available: true });
    }

    if (data) {
      return NextResponse.json(
        { available: false, error: 'An account already exists with this Email Address.' },
        { status: 409 }
      );
    }

    return NextResponse.json({ available: true });
  } catch (err: any) {
    console.error('[check-email] Unexpected error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
