import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { validateVolunteerPayload } from '@/lib/validation/volunteer';

// ── Supabase admin client (service-role, server-only) ─────────────────────────
function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase environment variables are not configured.');
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// ── Error response helpers ────────────────────────────────────────────────────
function validationError(errors: Record<string, string>, status = 422) {
  return NextResponse.json({ success: false, errors }, { status });
}

function singleError(field: string, message: string, status = 400) {
  return NextResponse.json({ success: false, errors: { [field]: message } }, { status });
}

// ── POST /api/register ────────────────────────────────────────────────────────
/**
 * Full server-side validation of the volunteer registration payload.
 *
 * This route is called by the signup page after all client-side checks
 * pass. It is the authoritative validation gate — the database will never
 * receive invalid data even if the browser check is bypassed.
 *
 * Response shape (always JSON):
 *   200  { success: true }                               — passes all checks
 *   400  { success: false, errors: { field: msg } }     — bad request / missing field
 *   409  { success: false, errors: { field: msg } }     — duplicate email or mobile
 *   422  { success: false, errors: { field: msg, … } }  — validation failures
 *   500  { success: false, errors: { _server: msg } }   — unexpected error
 */
export async function POST(request: Request) {
  try {
    // ── 1. Parse body ─────────────────────────────────────────────────────────
    let body: Record<string, any>;
    try {
      body = await request.json();
    } catch {
      return singleError('_server', 'Invalid JSON payload.', 400);
    }

    // ── 2. Normalise incoming values ──────────────────────────────────────────
    body.email  = (body.email  ?? '').toString().trim().toLowerCase();
    body.mobile = (body.mobile ?? '').toString().trim().replace(/\D/g, '');
    body.name   = (body.name   ?? '').toString().trim();

    // ── 3. Run full structural validation ─────────────────────────────────────
    const { valid, errors } = validateVolunteerPayload(body);
    if (!valid) {
      return validationError(errors, 422);
    }

    // ── 4. Uniqueness checks (using service-role to bypass RLS) ───────────────
    const supabase = getAdminClient();

    // 4a. Email uniqueness
    const { data: emailRow, error: emailQueryErr } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', body.email)
      .maybeSingle();

    if (emailQueryErr) {
      console.error('[register] Email uniqueness query failed:', emailQueryErr.message);
      // Fail open — DB unique constraint is the final safety net
    } else if (emailRow) {
      return NextResponse.json(
        { success: false, errors: { email: 'An account already exists with this Email Address.' } },
        { status: 409 }
      );
    }

    // 4b. Mobile uniqueness (fetching profiles to match last 10 digits to handle country code formats)
    const { data: profiles, error: mobileQueryErr } = await supabase
      .from('profiles')
      .select('id, mobile');

    if (mobileQueryErr) {
      console.error('[register] Mobile uniqueness query failed:', mobileQueryErr.message);
    } else {
      const inputCleaned = body.mobile.replace(/\D/g, '');
      const duplicateExists = profiles?.some(p => {
        if (!p.mobile) return false;
        const dbCleaned = p.mobile.replace(/\D/g, '');
        return dbCleaned.slice(-10) === inputCleaned.slice(-10);
      });
      if (duplicateExists) {
        return NextResponse.json(
          { success: false, errors: { mobile: 'An account already exists with this Mobile Number.' } },
          { status: 409 }
        );
      }
    }

    // ── 5. All checks pass ────────────────────────────────────────────────────
    return NextResponse.json({ success: true }, { status: 200 });

  } catch (err: any) {
    console.error('[register] Unexpected error:', err);

    // ── 6. Graceful uniqueness-violation handling ─────────────────────────────
    // If the DB unique constraint fires (e.g., race condition), translate it.
    const msg: string = err?.message ?? '';
    if (msg.includes('profiles_email_key') || msg.includes('unique constraint') && msg.includes('email')) {
      return NextResponse.json(
        { success: false, errors: { email: 'An account already exists with this Email Address.' } },
        { status: 409 }
      );
    }
    if (msg.includes('profiles_mobile_key') || msg.includes('unique constraint') && msg.includes('mobile')) {
      return NextResponse.json(
        { success: false, errors: { mobile: 'An account already exists with this Mobile Number.' } },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, errors: { _server: err.message || 'Internal server error.' } },
      { status: 500 }
    );
  }
}
