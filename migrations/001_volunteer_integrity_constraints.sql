-- =============================================================================
-- Migration: Volunteer Registration – Database Integrity Constraints
-- Purpose  : Enforce uniqueness and NOT NULL on critical profile columns.
-- Fix      : Safely handles pre-existing duplicate / placeholder mobile values
--            before applying the UNIQUE constraint.
-- Run this : Once in the Supabase SQL Editor (Project → SQL Editor → New query)
-- =============================================================================

-- ── STEP 1: Fix NULL mobile values ───────────────────────────────────────────
-- Replace any NULL mobiles with a unique placeholder so NOT NULL can be set.
UPDATE public.profiles
SET    mobile = 'PLACEHOLDER-' || id::text
WHERE  mobile IS NULL;


-- ── STEP 2: Fix DUPLICATE mobile values ──────────────────────────────────────
-- For every group of rows that share the same mobile number, keep the earliest
-- record unchanged and append the row's UUID suffix to all later duplicates.
-- This makes every mobile value unique so the UNIQUE constraint can be created.
UPDATE public.profiles AS p
SET    mobile = p.mobile || '-DUP-' || p.id::text
WHERE  p.id IN (
    -- Select all rows that are NOT the first (lowest id) in their duplicate group
    SELECT id
    FROM (
        SELECT
            id,
            mobile,
            ROW_NUMBER() OVER (PARTITION BY mobile ORDER BY id) AS rn
        FROM public.profiles
        WHERE mobile IS NOT NULL
    ) ranked
    WHERE rn > 1
);


-- ── STEP 3: Set mobile NOT NULL ───────────────────────────────────────────────
ALTER TABLE public.profiles
  ALTER COLUMN mobile SET NOT NULL;


-- ── STEP 4: Add UNIQUE constraint on mobile (idempotent) ─────────────────────
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


-- ── STEP 5: Ensure email UNIQUE + NOT NULL (safety guard) ────────────────────
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


-- ── STEP 6: Required field NOT NULL guards ────────────────────────────────────
ALTER TABLE public.profiles ALTER COLUMN name       SET NOT NULL;
ALTER TABLE public.profiles ALTER COLUMN role       SET NOT NULL;
ALTER TABLE public.profiles ALTER COLUMN specialty  SET NOT NULL;
ALTER TABLE public.profiles ALTER COLUMN reg_number SET NOT NULL;


-- ── STEP 7: Range CHECK constraints ──────────────────────────────────────────
-- Before adding each CHECK we clamp any existing out-of-range rows so the
-- constraint can be created without violating existing data.

-- Age: 18–100
-- Clamp rows that are outside the valid range before adding the constraint
UPDATE public.profiles SET age = 18  WHERE age IS NOT NULL AND age < 18;
UPDATE public.profiles SET age = 100 WHERE age IS NOT NULL AND age > 100;

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_age_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_age_check
  CHECK (age IS NULL OR (age >= 18 AND age <= 100));

-- Experience: 0–50
-- Old backend allowed up to 80; clamp those rows to 50
UPDATE public.profiles SET experience = 0  WHERE experience IS NOT NULL AND experience < 0;
UPDATE public.profiles SET experience = 50 WHERE experience IS NOT NULL AND experience > 50;

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_experience_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_experience_check
  CHECK (experience IS NULL OR (experience >= 0 AND experience <= 50));

-- Committed Days: 1–365
UPDATE public.profiles SET committed_days = 1   WHERE committed_days IS NOT NULL AND committed_days < 1;
UPDATE public.profiles SET committed_days = 365 WHERE committed_days IS NOT NULL AND committed_days > 365;

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_committed_days_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_committed_days_check
  CHECK (committed_days IS NULL OR (committed_days >= 1 AND committed_days <= 365));


-- ── STEP 8: Performance indexes ──────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS profiles_email_idx  ON public.profiles (email);
CREATE INDEX IF NOT EXISTS profiles_mobile_idx ON public.profiles (mobile);


-- ── STEP 9: Verify results ────────────────────────────────────────────────────
-- Run this SELECT after the migration to confirm no duplicates remain:
--
--   SELECT mobile, COUNT(*) FROM public.profiles GROUP BY mobile HAVING COUNT(*) > 1;
--
-- Expected result: 0 rows (no duplicates).
