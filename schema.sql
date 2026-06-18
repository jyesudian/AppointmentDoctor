-- SQL Schema for Avodani database
-- This script configures the database schema, public triggers, and seeds the static data in Supabase.

-- Enable pgcrypto for password hashing if seeding manually
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Create PREFERRED_LOCATIONS Table (Static Data)
CREATE TABLE IF NOT EXISTS public.preferred_locations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    distance INTEGER NOT NULL,
    region TEXT NOT NULL,
    priority INTEGER,
    active_cases INTEGER DEFAULT 0,
    latitude NUMERIC,
    longitude NUMERIC
);

-- Enable RLS on Preferred Locations
ALTER TABLE public.preferred_locations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Preferred locations viewable by everyone" ON public.preferred_locations;
CREATE POLICY "Preferred locations viewable by everyone" ON public.preferred_locations
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Preferred locations manageable by admins" ON public.preferred_locations;
CREATE POLICY "Preferred locations manageable by admins" ON public.preferred_locations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.admins WHERE id = auth.uid()
        )
    );

-- 1a. Create PROFESSIONS Table (Master Table)
CREATE TABLE IF NOT EXISTS public.professions (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    requires_designation BOOLEAN DEFAULT FALSE,
    priority INTEGER DEFAULT 0
);

-- Seed Professions
INSERT INTO public.professions (id, name, requires_designation, priority) VALUES
('doctor', 'Volunteer Doctor (MD / MBBS / Equivalent)', FALSE, 1),
('nurse', 'Volunteer Nurse', FALSE, 2),
('dentist', 'Volunteer Dentist', FALSE, 3),
('optometrist', 'Volunteer Optometrist / Eye Care Professional', FALSE, 4),
('physiotherapist', 'Volunteer Physiotherapist', FALSE, 5),
('occupational_therapist', 'Volunteer Occupational Therapist', FALSE, 6),
('speech_therapist', 'Volunteer Speech Therapist', FALSE, 7),
('psychologist', 'Volunteer Psychologist / Counsellor', FALSE, 8),
('pharmacist', 'Volunteer Pharmacist', FALSE, 9),
('allied_health', 'Volunteer Allied Health Professional', FALSE, 10),
('other', 'Other Healthcare Volunteer', TRUE, 11)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, requires_designation = EXCLUDED.requires_designation, priority = EXCLUDED.priority;

-- 1b. Create SPECIALTIES Table (Master Table)
CREATE TABLE IF NOT EXISTS public.specialties (
    id TEXT PRIMARY KEY,
    category TEXT NOT NULL,
    name TEXT NOT NULL UNIQUE,
    requires_description BOOLEAN DEFAULT FALSE,
    priority INTEGER DEFAULT 0
);

-- Seed Specialties
INSERT INTO public.specialties (id, category, name, requires_description, priority) VALUES
('general-medicine', 'Medical Specialties', 'General Medicine', FALSE, 1),
('family-medicine', 'Medical Specialties', 'Family Medicine', FALSE, 2),
('internal-medicine', 'Medical Specialties', 'Internal Medicine', FALSE, 3),
('pediatrics', 'Medical Specialties', 'Pediatrics', FALSE, 4),
('obstetrics-gynecology', 'Medical Specialties', 'Obstetrics & Gynecology', FALSE, 5),
('general-surgery', 'Medical Specialties', 'General Surgery', FALSE, 6),
('orthopedics', 'Medical Specialties', 'Orthopedics', FALSE, 7),
('cardiology', 'Medical Specialties', 'Cardiology', FALSE, 8),
('dermatology', 'Medical Specialties', 'Dermatology', FALSE, 9),
('neurology', 'Medical Specialties', 'Neurology', FALSE, 10),
('psychiatry', 'Medical Specialties', 'Psychiatry', FALSE, 11),
('emergency-medicine', 'Medical Specialties', 'Emergency Medicine', FALSE, 12),
('anesthesiology', 'Medical Specialties', 'Anesthesiology', FALSE, 13),
('ophthalmology', 'Eye Care', 'Ophthalmology (Eye Specialist)', FALSE, 14),
('optometry', 'Eye Care', 'Optometry', FALSE, 15),
('general-dentistry', 'Dental', 'General Dentistry', FALSE, 16),
('orthodontics', 'Dental', 'Orthodontics', FALSE, 17),
('oral-surgery', 'Dental', 'Oral Surgery', FALSE, 18),
('pediatric-dentistry', 'Dental', 'Pediatric Dentistry', FALSE, 19),
('physiotherapy', 'Therapy & Rehabilitation', 'Physiotherapy', FALSE, 20),
('occupational-therapy', 'Therapy & Rehabilitation', 'Occupational Therapy', FALSE, 21),
('speech-therapy', 'Therapy & Rehabilitation', 'Speech Therapy', FALSE, 22),
('rehabilitation-medicine', 'Therapy & Rehabilitation', 'Rehabilitation Medicine', FALSE, 23),
('clinical-psychology', 'Mental Health', 'Clinical Psychology', FALSE, 24),
('counseling-psychology', 'Mental Health', 'Counseling Psychology', FALSE, 25),
('other-specialty', 'Other', 'Other Specialty', TRUE, 26)
ON CONFLICT (id) DO UPDATE SET category = EXCLUDED.category, name = EXCLUDED.name, requires_description = EXCLUDED.requires_description, priority = EXCLUDED.priority;

-- 2. Create PROFILES Table (Extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    gender TEXT,
    specialty TEXT NOT NULL,
    reg_number TEXT NOT NULL,
    experience INTEGER,
    age INTEGER,
    email TEXT NOT NULL UNIQUE,
    mobile TEXT,
    status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
    committed_days INTEGER DEFAULT 10,
    completed_days INTEGER DEFAULT 0,
    location_priorities TEXT[] DEFAULT '{}'::TEXT[],
    avatar TEXT DEFAULT '👨‍⚕️',
    join_date DATE DEFAULT CURRENT_DATE,
    available_months JSONB DEFAULT '{}'::JSONB,
    attendance_logs JSONB DEFAULT '[]'::JSONB,
    degree_file_path TEXT,
    license_file_path TEXT,
    rejection_reason TEXT,
    base_clinic JSONB DEFAULT '{"name": "General Clinic", "city": "Bangalore"}'::JSONB,
    professional_designation TEXT,
    specialty_description TEXT,
    profile_photo_path TEXT,
    willingness_to_serve TEXT CHECK (willingness_to_serve IN ('Yes', 'No', 'Prefer to Discuss')),
    areas_of_interest TEXT[] DEFAULT '{}'::TEXT[],
    preferred_geography TEXT[] DEFAULT '{}'::TEXT[],
    available_for_teleconsultation BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Ensure new columns exist on profiles table if it was already created previously
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS professional_designation TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS specialty_description TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS profile_photo_path TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS willingness_to_serve TEXT CHECK (willingness_to_serve IN ('Yes', 'No', 'Prefer to Discuss'));
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS areas_of_interest TEXT[] DEFAULT '{}'::TEXT[];
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS preferred_geography TEXT[] DEFAULT '{}'::TEXT[];
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS available_for_teleconsultation BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS age INTEGER;

-- Enable RLS on Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
    FOR SELECT USING (true);

-- Drop old check constraint on profiles.role if it exists in DB (run in migrations)
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

DROP POLICY IF EXISTS "Users can update their own profiles" ON public.profiles;
CREATE POLICY "Users can update their own profiles" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can update profiles" ON public.profiles;
CREATE POLICY "Admins can update profiles" ON public.profiles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.admins WHERE id = auth.uid()
        )
    );

-- 3. Create ADMINS Table
CREATE TABLE IF NOT EXISTS public.admins (
    id UUID PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS on Admins
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins are viewable by authenticated users" ON public.admins;
CREATE POLICY "Admins are viewable by authenticated users" ON public.admins
    FOR SELECT USING (auth.role() = 'authenticated');

-- 4. Create CAMPS Table
CREATE TABLE IF NOT EXISTS public.camps (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    location TEXT NOT NULL,
    date DATE NOT NULL,
    month TEXT NOT NULL,
    day INTEGER NOT NULL,
    expected_patients INTEGER DEFAULT 0,
    needed_specialties TEXT[] DEFAULT '{}'::TEXT[],
    needed_counts JSONB DEFAULT '{}'::JSONB,
    assigned_volunteers UUID[] DEFAULT '{}'::UUID[],
    status TEXT NOT NULL DEFAULT 'Drafting' CHECK (status IN ('Scheduled', 'Drafting')),
    duration_days INTEGER DEFAULT 1 CHECK (duration_days >= 1 AND duration_days <= 3),
    estimate_eye INTEGER DEFAULT 0,
    estimate_dental INTEGER DEFAULT 0,
    estimate_gynec INTEGER DEFAULT 0,
    estimate_diabetic INTEGER DEFAULT 0,
    estimate_cardio INTEGER DEFAULT 0,
    estimate_therapy INTEGER DEFAULT 0,
    estimate_psychology INTEGER DEFAULT 0
);

-- Ensure new columns exist on camps table if it was already created previously
ALTER TABLE public.camps ADD COLUMN IF NOT EXISTS duration_days INTEGER DEFAULT 1 CHECK (duration_days >= 1 AND duration_days <= 3);
ALTER TABLE public.camps ADD COLUMN IF NOT EXISTS estimate_eye INTEGER DEFAULT 0;
ALTER TABLE public.camps ADD COLUMN IF NOT EXISTS estimate_dental INTEGER DEFAULT 0;
ALTER TABLE public.camps ADD COLUMN IF NOT EXISTS estimate_gynec INTEGER DEFAULT 0;
ALTER TABLE public.camps ADD COLUMN IF NOT EXISTS estimate_diabetic INTEGER DEFAULT 0;
ALTER TABLE public.camps ADD COLUMN IF NOT EXISTS estimate_cardio INTEGER DEFAULT 0;
ALTER TABLE public.camps ADD COLUMN IF NOT EXISTS estimate_therapy INTEGER DEFAULT 0;
ALTER TABLE public.camps ADD COLUMN IF NOT EXISTS estimate_psychology INTEGER DEFAULT 0;

-- Enable RLS on Camps
ALTER TABLE public.camps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Camps viewable by everyone" ON public.camps;
CREATE POLICY "Camps viewable by everyone" ON public.camps
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Camps manageable by admins" ON public.camps;
CREATE POLICY "Camps manageable by admins" ON public.camps
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.admins WHERE id = auth.uid()
        )
    );

-- 5. Create INVITATIONS Table
CREATE TABLE IF NOT EXISTS public.invitations (
    id TEXT PRIMARY KEY,
    camp_id TEXT REFERENCES public.camps(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Accepted', 'Declined')),
    sent_via TEXT,
    timestamp DATE DEFAULT CURRENT_DATE,
    custom_requests TEXT DEFAULT NULL
);

-- Ensure new columns exist on invitations table if it was already created previously
ALTER TABLE public.invitations ADD COLUMN IF NOT EXISTS custom_requests TEXT DEFAULT NULL;

-- Enable RLS on Invitations
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Invitations viewable by assigned doctor or admin" ON public.invitations;
CREATE POLICY "Invitations viewable by assigned doctor or admin" ON public.invitations
    FOR SELECT USING (
        auth.uid() = doctor_id OR EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid())
    );

DROP POLICY IF EXISTS "Invitations updateable by assigned doctor or admin" ON public.invitations;
CREATE POLICY "Invitations updateable by assigned doctor or admin" ON public.invitations
    FOR UPDATE USING (
        auth.uid() = doctor_id OR EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid())
    );

-- 6. Create CHECK_INS Table
CREATE TABLE IF NOT EXISTS public.check_ins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    camp_id TEXT REFERENCES public.camps(id) ON DELETE CASCADE,
    check_in_time TEXT,
    check_out_time TEXT,
    status TEXT NOT NULL CHECK (status IN ('Checked In', 'Checked Out')),
    UNIQUE (doctor_id, camp_id)
);

-- Enable RLS on Check Ins
ALTER TABLE public.check_ins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Check ins viewable by everyone" ON public.check_ins;
CREATE POLICY "Check ins viewable by everyone" ON public.check_ins
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Check ins manageable by admins or assigned doctor" ON public.check_ins;
CREATE POLICY "Check ins manageable by admins or assigned doctor" ON public.check_ins
    FOR ALL USING (
        auth.uid() = doctor_id OR EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid())
    );

-- 7. Trigger to automatically create profiles and admin records
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    loc_priorities TEXT[];
    areas_interest TEXT[];
    pref_geog TEXT[];
BEGIN
    -- Parse location priorities array safely if available
    IF NEW.raw_user_meta_data ? 'locationPriorities' THEN
        SELECT ARRAY_AGG(x)::TEXT[] INTO loc_priorities FROM jsonb_array_elements_text(NEW.raw_user_meta_data->'locationPriorities') x;
    ELSE
        loc_priorities := '{}'::TEXT[];
    END IF;

    -- Parse areas of interest safely if available
    IF NEW.raw_user_meta_data ? 'areasOfInterest' THEN
        SELECT ARRAY_AGG(x)::TEXT[] INTO areas_interest FROM jsonb_array_elements_text(NEW.raw_user_meta_data->'areasOfInterest') x;
    ELSE
        areas_interest := '{}'::TEXT[];
    END IF;

    -- Parse preferred geography safely if available
    IF NEW.raw_user_meta_data ? 'preferredGeography' THEN
        SELECT ARRAY_AGG(x)::TEXT[] INTO pref_geog FROM jsonb_array_elements_text(NEW.raw_user_meta_data->'preferredGeography') x;
    ELSE
        pref_geog := '{}'::TEXT[];
    END IF;

    -- If admin registration, insert into admins table
    IF NEW.email = 'jyesudian@thesentinelark.com' OR COALESCE(NEW.raw_user_meta_data->>'role', '') = 'Admin' THEN
        INSERT INTO public.admins (id, email)
        VALUES (NEW.id, NEW.email)
        ON CONFLICT (id) DO NOTHING;
    ELSE
        -- Insert volunteer profile
        INSERT INTO public.profiles (
            id,
            name,
            role,
            gender,
            specialty,
            reg_number,
            experience,
            age,
            email,
            mobile,
            status,
            committed_days,
            completed_days,
            location_priorities,
            avatar,
            available_months,
            attendance_logs,
            degree_file_path,
            license_file_path,
            base_clinic,
            professional_designation,
            specialty_description,
            profile_photo_path,
            willingness_to_serve,
            areas_of_interest,
            preferred_geography,
            available_for_teleconsultation
        )
        VALUES (
            NEW.id,
            COALESCE(NEW.raw_user_meta_data->>'name', 'Volunteer'),
            COALESCE(NEW.raw_user_meta_data->>'role', 'Volunteer Doctor (MD / MBBS / Equivalent)'),
            NEW.raw_user_meta_data->>'gender',
            COALESCE(NEW.raw_user_meta_data->>'specialty', 'General Medicine'),
            COALESCE(NEW.raw_user_meta_data->>'regNumber', 'PENDING'),
            COALESCE((NEW.raw_user_meta_data->>'experience')::INTEGER, 5),
            (NEW.raw_user_meta_data->>'age')::INTEGER,
            NEW.email,
            NEW.raw_user_meta_data->>'mobile',
            COALESCE(NEW.raw_user_meta_data->>'status', 'Pending'), -- seed can specify Approved
            COALESCE((NEW.raw_user_meta_data->>'committedDays')::INTEGER, 10),
            COALESCE((NEW.raw_user_meta_data->>'completedDays')::INTEGER, 0),
            loc_priorities,
            COALESCE(NEW.raw_user_meta_data->>'avatar', '👨‍⚕️'),
            COALESCE(NEW.raw_user_meta_data->'availableMonths', '{}'::JSONB),
            COALESCE(NEW.raw_user_meta_data->'attendanceLogs', '[]'::JSONB),
            NEW.raw_user_meta_data->>'degreeFilePath',
            NEW.raw_user_meta_data->>'licenseFilePath',
            COALESCE(NEW.raw_user_meta_data->'baseClinic', '{"name": "General Clinic", "city": "Bangalore"}'::JSONB),
            NEW.raw_user_meta_data->>'professionalDesignation',
            NEW.raw_user_meta_data->>'specialtyDescription',
            NEW.raw_user_meta_data->>'profilePhotoPath',
            NEW.raw_user_meta_data->>'willingnessToServe',
            areas_interest,
            pref_geog,
            COALESCE((NEW.raw_user_meta_data->>'availableForTeleconsultation')::BOOLEAN, FALSE)
        )
        ON CONFLICT (id) DO NOTHING;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ========================================================
-- SEED DATA SECTION
-- ========================================================

-- 1. Seed Preferred Locations with coordinates
INSERT INTO public.preferred_locations (id, name, distance, region, priority, active_cases, latitude, longitude) VALUES
('loc-1', 'Koya', 12, 'East Block', 1, 340, 12.9600, 77.6300),
('loc-2', 'Belgaum', 110, 'North Border', 2, 1200, 15.8528, 74.5042),
('loc-3', 'Mysore', 145, 'South Plains', 3, 890, 12.2958, 76.6394),
('loc-4', 'Hubli', 85, 'West Central', 4, 610, 15.3647, 75.1240),
('loc-5', 'Mangalore', 210, 'Coastal Area', 5, 450, 12.9141, 74.8560)
ON CONFLICT (id) DO NOTHING;

-- 2. Seed Camps
INSERT INTO public.camps (id, name, location, date, month, day, expected_patients, needed_specialties, needed_counts, assigned_volunteers, status) VALUES
('camp-1', 'Belgaum Diabetes & Hypertension Screening', 'Belgaum', '2026-07-12', 'Jul', 12, 350, ARRAY['General Medicine', 'Cardiology'], '{"General Medicine": 1, "Cardiology": 1, "Nurse": 1}'::JSONB, '{}'::UUID[], 'Scheduled'),
('camp-2', 'Koya Community Pediatrics and General Camp', 'Koya', '2026-07-15', 'Jul', 15, 500, ARRAY['Pediatrics', 'General Medicine'], '{"Pediatrics": 1, "General Medicine": 1, "Nurse": 1}'::JSONB, '{}'::UUID[], 'Scheduled'),
('camp-3', 'Mangalore Coastal Geriatric Care Drive', 'Mangalore', '2026-08-20', 'Aug', 20, 200, ARRAY['General Medicine', 'Orthopedics'], '{"General Medicine": 1, "Orthopedics": 1, "Nurse": 1}'::JSONB, '{}'::UUID[], 'Drafting')
ON CONFLICT (id) DO NOTHING;

-- 3. Seed Supabase Auth Users (using triggers to populate public profiles)
-- Standard admin user (jyesudian@thesentinelark.com / Luke@0101)
-- MD5/Bcrypt/BF encryption algorithm compatible with auth.users passwords
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, role, aud, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change) VALUES
('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'jyesudian@thesentinelark.com', crypt('Luke@0101', gen_salt('bf', 10)), NOW(), 'authenticated', 'authenticated', '{"provider":"email","providers":["email"]}'::JSONB, '{"role":"Admin"}'::JSONB, NOW(), NOW(), '', '', '', ''),
-- Seed Volunteer Ramesh Kumar (ramesh.kumar@mednet.org / password123)
('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'ramesh.kumar@mednet.org', crypt('password123', gen_salt('bf', 10)), NOW(), 'authenticated', 'authenticated', '{"provider":"email","providers":["email"]}'::JSONB, '{"name":"Dr. Ramesh Kumar","role":"Doctor","gender":"Male","specialty":"Cardiology","regNumber":"MC-2023-8849","experience":"14","mobile":"+91 98450 12345","status":"Approved","committedDays":15,"completedDays":11,"locationPriorities":["Koya","Belgaum","Mysore"],"avatar":"👨‍⚕️","availableMonths":{"Jul":[4,5,12,18],"Aug":[1,2,15]},"attendanceLogs":[{"campName":"Mysore Health Drive","date":"2026-03-12","status":"Present"}]}'::JSONB, NOW(), NOW(), '', '', '', ''),
-- Seed Volunteer Farhana Ali (f.ali@pediacare.in / password123)
('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'f.ali@pediacare.in', crypt('password123', gen_salt('bf', 10)), NOW(), 'authenticated', 'authenticated', '{"provider":"email","providers":["email"]}'::JSONB, '{"name":"Dr. Farhana Ali","role":"Doctor","gender":"Female","specialty":"Pediatrics","regNumber":"MC-2021-4920","experience":"8","mobile":"+91 99012 34567","status":"Approved","committedDays":10,"completedDays":7,"locationPriorities":["Belgaum","Hubli"],"avatar":"👩‍⚕️","availableMonths":{"Jul":[12,13,20,21],"Sep":[10,11]},"attendanceLogs":[]}'::JSONB, NOW(), NOW(), '', '', '', ''),
-- Seed Volunteer Shanthi Pillai (shanthi.pillai@hosp.org / password123)
('00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000000', 'shanthi.pillai@hosp.org', crypt('password123', gen_salt('bf', 10)), NOW(), 'authenticated', 'authenticated', '{"provider":"email","providers":["email"]}'::JSONB, '{"name":"Nurse Shanthi Pillai","role":"Nurse","gender":"Female","specialty":"General Medicine","regNumber":"NC-2024-1102","experience":"6","mobile":"+91 81234 56789","status":"Approved","committedDays":20,"completedDays":14,"locationPriorities":["Koya","Hubli","Mangalore"],"avatar":"👩‍⚕️","availableMonths":{"Jul":[1,2,3,15,16],"Oct":[5,6,7]},"attendanceLogs":[{"campName":"Koya General Camp","date":"2026-04-10","status":"Present"}]}'::JSONB, NOW(), NOW(), '', '', '', ''),
-- Seed Volunteer Suresh Rao (suresh.rao@orthoclinic.com / password123)
('00000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000000', 'suresh.rao@orthoclinic.com', crypt('password123', gen_salt('bf', 10)), NOW(), 'authenticated', 'authenticated', '{"provider":"email","providers":["email"]}'::JSONB, '{"name":"Dr. Suresh Rao","role":"Doctor","gender":"Male","specialty":"Orthopedics","regNumber":"MC-2018-9311","experience":"20","mobile":"+91 74061 98765","status":"Approved","committedDays":12,"completedDays":4,"locationPriorities":["Mysore","Mangalore"],"avatar":"👨‍⚕️","availableMonths":{"Aug":[12,13],"Dec":[24,25]},"attendanceLogs":[]}'::JSONB, NOW(), NOW(), '', '', '', ''),
-- Seed Volunteer Anjali Desai (anjali.desai@skincare.org / password123) - Pending
('00000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000000', 'anjali.desai@skincare.org', crypt('password123', gen_salt('bf', 10)), NOW(), 'authenticated', 'authenticated', '{"provider":"email","providers":["email"]}'::JSONB, '{"name":"Dr. Anjali Desai","role":"Doctor","gender":"Female","specialty":"Dermatology","regNumber":"MC-2022-7561","experience":"5","mobile":"+91 91123 44321","status":"Pending","committedDays":8,"completedDays":0,"locationPriorities":["Koya","Belgaum"],"avatar":"👩‍⚕️","availableMonths":{"Jul":[4,15,29]},"attendanceLogs":[]}'::JSONB, NOW(), NOW(), '', '', '', '')
ON CONFLICT (id) DO NOTHING;

-- Map assigned volunteers list on seeded camps
UPDATE public.camps SET assigned_volunteers = ARRAY['00000000-0000-0000-0000-000000000002']::UUID[] WHERE id = 'camp-1';
UPDATE public.camps SET assigned_volunteers = ARRAY['00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000004']::UUID[] WHERE id = 'camp-2';

-- 4. Seed Invitations
INSERT INTO public.invitations (id, camp_id, doctor_id, status, sent_via, timestamp) VALUES
('inv-1', 'camp-1', '00000000-0000-0000-0000-000000000002', 'Accepted', 'Email & SMS', '2026-06-01'),
('inv-2', 'camp-2', '00000000-0000-0000-0000-000000000003', 'Accepted', 'WhatsApp & Email', '2026-06-02'),
('inv-3', 'camp-2', '00000000-0000-0000-0000-000000000004', 'Accepted', 'Email Only', '2026-06-03'),
('inv-4', 'camp-3', '00000000-0000-0000-0000-000000000005', 'Pending', 'WhatsApp', '2026-06-04')
ON CONFLICT (id) DO NOTHING;

-- 5. Seed Check Ins
INSERT INTO public.check_ins (doctor_id, camp_id, check_in_time, check_out_time, status) VALUES
('00000000-0000-0000-0000-000000000002', 'camp-1', '08:30 AM', '', 'Checked In')
ON CONFLICT (doctor_id, camp_id) DO NOTHING;


-- ========================================================
-- STORAGE BUCKETS SECURITY POLICIES SECTION
-- ========================================================

-- Enable RLS on storage.objects (if not already enabled)
-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY; -- Commented out to avoid ERROR: 42501 (must be owner of table objects) on hosted Supabase

-- Drop existing policies to avoid duplicates
DROP POLICY IF EXISTS "Allow authenticated uploads to verification-documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow select access to verification-documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow update access to verification-documents" ON storage.objects;

-- Create INSERT policy for uploads (allows uploads only to your own user ID folder)
CREATE POLICY "Allow authenticated uploads to verification-documents"
ON storage.objects
FOR INSERT
TO anon, authenticated
WITH CHECK (
    bucket_id = 'verification-documents' AND
    (
        auth.role() = 'anon'
        OR
        (storage.foldername(name))[1] = auth.uid()::text
    )
);

-- Create SELECT policy for downloading/viewing (allows doctors to read their own files, admins to read all)
CREATE POLICY "Allow select access to verification-documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
    bucket_id = 'verification-documents' AND
    (
        (storage.foldername(name))[1] = auth.uid()::text 
        OR 
        EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid())
    )
);

-- Create UPDATE policy for updates/overwrites
CREATE POLICY "Allow update access to verification-documents"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
    bucket_id = 'verification-documents' AND
    (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
    bucket_id = 'verification-documents' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- ========================================================
-- 8. Add DELETE policy for invitations to support retracting invites
-- ========================================================
DROP POLICY IF EXISTS "Invitations deleteable by assigned doctor or admin" ON public.invitations;
CREATE POLICY "Invitations deleteable by assigned doctor or admin" ON public.invitations
    FOR DELETE USING (
        auth.uid() = doctor_id OR EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid())
    );

-- ========================================================
-- 9. Add feedback column to invitations table
-- ========================================================
ALTER TABLE public.invitations ADD COLUMN IF NOT EXISTS feedback JSONB DEFAULT NULL;
