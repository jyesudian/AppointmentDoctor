-- =============================================================================
-- Migration: Volunteer Registration – Database Integrity Constraints
-- Purpose  : Enforce uniqueness and NOT NULL on critical profile columns
--            to prevent duplicate or incomplete records at the database level.
-- Run this : Once in the Supabase SQL Editor (Project → SQL Editor → New query)
-- =============================================================================

-- ── 1. Mobile: add UNIQUE + NOT NULL constraint ───────────────────────────────
-- Step 1a: Ensure no existing NULLs first (set a placeholder so NOT NULL passes)
UPDATE public.profiles
SET    mobile = 'UNKNOWN-' || id::text
WHERE  mobile IS NULL;

-- Step 1b: Promote to NOT NULL
ALTER TABLE public.profiles
  ALTER COLUMN mobile SET NOT NULL;

-- Step 1c: Add UNIQUE constraint (idempotent guard)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.profiles'::regclass
      AND conname   = 'profiles_mobile_key'
  ) THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_mobile_key UNIQUE (mobile);
  END IF;
END;
$$;


-- ── 2. Email: ensure UNIQUE + NOT NULL (already set; this is a safety guard) ──
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.profiles'::regclass
      AND conname   = 'profiles_email_key'
  ) THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_email_key UNIQUE (email);
  END IF;
END;
$$;

ALTER TABLE public.profiles ALTER COLUMN email SET NOT NULL;


-- ── 3. Other required fields: enforce NOT NULL ────────────────────────────────
-- These columns are marked NOT NULL in the CREATE TABLE; the ALTER statements
-- below are safety guards in case the table already existed without them.

ALTER TABLE public.profiles ALTER COLUMN name         SET NOT NULL;
ALTER TABLE public.profiles ALTER COLUMN role         SET NOT NULL;
ALTER TABLE public.profiles ALTER COLUMN specialty    SET NOT NULL;
ALTER TABLE public.profiles ALTER COLUMN reg_number   SET NOT NULL;


-- ── 4. Add/tighten CHECK constraints ─────────────────────────────────────────

-- Age: 18–100
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_age_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_age_check CHECK (age IS NULL OR (age >= 18 AND age <= 100));

-- Experience: 0–50
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_experience_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_experience_check CHECK (experience IS NULL OR (experience >= 0 AND experience <= 50));

-- committed_days: 1–365
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_committed_days_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_committed_days_check CHECK (committed_days IS NULL OR (committed_days >= 1 AND committed_days <= 365));


-- ── 5. Index for fast duplicate lookups ──────────────────────────────────────
CREATE INDEX IF NOT EXISTS profiles_email_idx  ON public.profiles (email);
CREATE INDEX IF NOT EXISTS profiles_mobile_idx ON public.profiles (mobile);


-- ── 6. Update schema.sql to reflect new columns (documentation comment) ───────
-- The production schema.sql should be updated to match:
--
--   mobile TEXT NOT NULL UNIQUE,
--
-- and the additional CHECK constraints above.
-- The ALTER statements in this migration file make the live DB consistent.
