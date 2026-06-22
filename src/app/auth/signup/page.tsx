'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

const FALLBACK_PROFESSIONS = [
  { id: 'doctor', name: 'Volunteer Doctor (MD / MBBS / Equivalent)', requires_designation: false },
  { id: 'nurse', name: 'Volunteer Nurse', requires_designation: false },
  { id: 'dentist', name: 'Volunteer Dentist', requires_designation: false },
  { id: 'optometrist', name: 'Volunteer Optometrist / Eye Care Professional', requires_designation: false },
  { id: 'physiotherapist', name: 'Volunteer Physiotherapist', requires_designation: false },
  { id: 'occupational_therapist', name: 'Volunteer Occupational Therapist', requires_designation: false },
  { id: 'speech_therapist', name: 'Volunteer Speech Therapist', requires_designation: false },
  { id: 'psychologist', name: 'Volunteer Psychologist / Counsellor', requires_designation: false },
  { id: 'pharmacist', name: 'Volunteer Pharmacist', requires_designation: false },
  { id: 'allied_health', name: 'Volunteer Allied Health Professional', requires_designation: false },
  { id: 'other', name: 'Other Healthcare Volunteer', requires_designation: true }
];

const FALLBACK_SPECIALTIES = [
  { id: 'general-medicine', category: 'Medical Specialties', name: 'General Medicine', requires_description: false },
  { id: 'family-medicine', category: 'Medical Specialties', name: 'Family Medicine', requires_description: false },
  { id: 'internal-medicine', category: 'Medical Specialties', name: 'Internal Medicine', requires_description: false },
  { id: 'pediatrics', category: 'Medical Specialties', name: 'Pediatrics', requires_description: false },
  { id: 'obstetrics-gynecology', category: 'Medical Specialties', name: 'Obstetrics & Gynecology', requires_description: false },
  { id: 'general-surgery', category: 'Medical Specialties', name: 'General Surgery', requires_description: false },
  { id: 'orthopedics', category: 'Medical Specialties', name: 'Orthopedics', requires_description: false },
  { id: 'cardiology', category: 'Medical Specialties', name: 'Cardiology', requires_description: false },
  { id: 'dermatology', category: 'Medical Specialties', name: 'Dermatology', requires_description: false },
  { id: 'neurology', category: 'Medical Specialties', name: 'Neurology', requires_description: false },
  { id: 'psychiatry', category: 'Medical Specialties', name: 'Psychiatry', requires_description: false },
  { id: 'emergency-medicine', category: 'Medical Specialties', name: 'Emergency Medicine', requires_description: false },
  { id: 'anesthesiology', category: 'Medical Specialties', name: 'Anesthesiology', requires_description: false },
  { id: 'ophthalmology', category: 'Eye Care', name: 'Ophthalmology (Eye Specialist)', requires_description: false },
  { id: 'optometry', category: 'Eye Care', name: 'Optometry', requires_description: false },
  { id: 'general-dentistry', category: 'Dental', name: 'General Dentistry', requires_description: false },
  { id: 'orthodontics', category: 'Dental', name: 'Orthodontics', requires_description: false },
  { id: 'oral-surgery', category: 'Dental', name: 'Oral Surgery', requires_description: false },
  { id: 'pediatric-dentistry', category: 'Dental', name: 'Pediatric Dentistry', requires_description: false },
  { id: 'physiotherapy', category: 'Therapy & Rehabilitation', name: 'Physiotherapy', requires_description: false },
  { id: 'occupational-therapy', category: 'Therapy & Rehabilitation', name: 'Occupational Therapy', requires_description: false },
  { id: 'speech-therapy', category: 'Therapy & Rehabilitation', name: 'Speech Therapy', requires_description: false },
  { id: 'rehabilitation-medicine', category: 'Therapy & Rehabilitation', name: 'Rehabilitation Medicine', requires_description: false },
  { id: 'clinical-psychology', category: 'Mental Health', name: 'Clinical Psychology', requires_description: false },
  { id: 'counseling-psychology', category: 'Mental Health', name: 'Counseling Psychology', requires_description: false },
  { id: 'other-specialty', category: 'Other', name: 'Other Specialty', requires_description: true }
];

// ── Full Name validation rules ──────────────────────────────────────────────
const NAME_MIN = 3;
const NAME_MAX = 25;
const NAME_REGEX = /^[a-zA-Z\s]+$/;

function validateFullName(value: string): string | null {
  if (!value.trim()) return 'Full Name is required.';
  if (value.trim().length < NAME_MIN) return `Full Name must be at least ${NAME_MIN} characters.`;
  if (value.length > NAME_MAX) return 'Full Name cannot exceed 25 characters.';
  if (!NAME_REGEX.test(value)) return 'Full Name must contain only letters and spaces.';
  return null;
}

// ── Email validation rules ────────────────────────────────────────────────────
// Covers: required, standard format, rejects abc / abc@ / abc@gmail / abc@.com
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateEmail(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return 'Email Address is required.';
  if (!EMAIL_REGEX.test(trimmed)) return 'Please enter a valid Email Address.';
  return null;
}

// ── Mobile Number validation rules ────────────────────────────────────────────
// Exactly 10 digits, no spaces / dots / hyphens / plus / letters / special chars
const MOBILE_DIGITS = 10;
const MOBILE_REGEX = /^\d{10}$/;

function validateMobile(value: string): string | null {
  if (!value) return 'Mobile Number is required.';
  if (!/^\d+$/.test(value)) return 'Only numeric digits are allowed.';
  if (value.length !== MOBILE_DIGITS) return `Mobile Number must contain exactly ${MOBILE_DIGITS} digits.`;
  return null;
}

// ── Password validation rules ─────────────────────────────────────────────────
const PWD_RULES = {
  minLength:   (v: string) => v.length >= 8,
  hasUpper:    (v: string) => /[A-Z]/.test(v),
  hasLower:    (v: string) => /[a-z]/.test(v),
  hasNumber:   (v: string) => /[0-9]/.test(v),
  hasSpecial:  (v: string) => /[^A-Za-z0-9]/.test(v),
};

type PasswordStrength = 'weak' | 'medium' | 'strong';

function getPasswordStrength(value: string): PasswordStrength {
  const passed = Object.values(PWD_RULES).filter(fn => fn(value)).length;
  if (passed <= 2) return 'weak';
  if (passed <= 4) return 'medium';
  return 'strong';
}

function validatePassword(value: string): string | null {
  if (!value) return 'Password is required.';
  if (value.length < 8) return 'Password must be at least 8 characters.';
  const allPassed = Object.values(PWD_RULES).every(fn => fn(value));
  if (!allPassed) return 'Password must contain uppercase, lowercase, number and special character.';
  if (getPasswordStrength(value) === 'weak') return 'Password strength is weak.';
  return null;
}

// ── Years of Experience validation rules ─────────────────────────────────────
const EXP_MAX = 50;

function validateExperience(value: string): string | null {
  if (!value.trim()) return 'Years of Experience is required.';
  // Reject anything that contains a non-numeric character (letters, special chars)
  if (/[^0-9]/.test(value.trim())) return 'Please enter a valid experience value.';
  const num = parseInt(value.trim(), 10);
  if (isNaN(num)) return 'Please enter a valid experience value.';
  if (num < 0) return 'Years of Experience cannot be negative.';
  if (num > EXP_MAX) return `Years of Experience cannot exceed ${EXP_MAX}.`;
  return null;
}

// ── Training Availability / Annual Commitment validation rules ───────────────
function validateCommittedDays(value: string): string | null {
  if (!value.trim()) return 'Please provide Training Availability.';
  const num = parseInt(value.trim(), 10);
  if (isNaN(num) || !/^\d+$/.test(value.trim())) return 'Please provide Training Availability.';
  if (num < 1 || num > 365) return 'Please provide Training Availability (1–365 days).';
  return null;
}

export default function VolunteerSignup() {
  const router = useRouter();
  const supabase = createClient();

  const [professions, setProfessions] = useState<any[]>([]);
  const [specialties, setSpecialties] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    gender: '',
    role: '',
    email: '',
    password: '',
    mobile: '',
    age: '',
    regNumber: '',
    specialty: '',
    experience: '',
    committedDays: '',
    professionalDesignation: '',
    specialtyDescription: '',
    willingnessToServe: 'Yes',
    availableForTeleconsultation: 'No',
    areasOfInterest: [] as string[],
    preferredGeography: [] as string[]
  });

  // Inline per-field validation errors
  const [fieldErrors, setFieldErrors] = useState<Record<string, string | null>>({});

  const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState<string | null>(null);
  const [degreeFile, setDegreeFile] = useState<File | null>(null);
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Email duplicate-check status: idle | checking | available | duplicate
  const [emailCheckStatus, setEmailCheckStatus] = useState<'idle' | 'checking' | 'available' | 'duplicate'>('idle');

  // Mobile duplicate-check status: idle | checking | available | duplicate
  const [mobileCheckStatus, setMobileCheckStatus] = useState<'idle' | 'checking' | 'available' | 'duplicate'>('idle');

  // Password: show/hide toggle
  const [showPassword, setShowPassword] = useState(false);

  // ── Computed: is every required field currently valid? ──────────────────────
  // Used to disable the submit button until the full form is valid.
  const isFormValid =
    !validateFullName(formData.name) &&
    !validateEmail(formData.email.trim().toLowerCase()) &&
    emailCheckStatus !== 'duplicate' &&
    !validateMobile(formData.mobile) &&
    mobileCheckStatus !== 'duplicate' &&
    !validatePassword(formData.password) &&
    !!formData.gender &&
    !!formData.role &&
    !!formData.age && !isNaN(parseInt(formData.age)) && parseInt(formData.age) >= 18 && parseInt(formData.age) <= 100 &&
    !!profilePhotoFile &&
    !!formData.regNumber.trim() &&
    !!formData.specialty &&
    !validateExperience(formData.experience) &&
    !validateCommittedDays(formData.committedDays) &&
    formData.areasOfInterest.length > 0 &&
    formData.preferredGeography.length > 0 &&
    !!degreeFile &&
    !!licenseFile;

  useEffect(() => {
    async function loadMasterData() {
      try {
        const { data: profData, error: profErr } = await supabase
          .from('professions')
          .select('*')
          .order('priority', { ascending: true });
        
        if (!profErr && profData && profData.length > 0) {
          setProfessions(profData);
        } else {
          setProfessions(FALLBACK_PROFESSIONS);
        }

        const { data: specData, error: specErr } = await supabase
          .from('specialties')
          .select('*')
          .order('priority', { ascending: true });

        if (!specErr && specData && specData.length > 0) {
          setSpecialties(specData);
        } else {
          setSpecialties(FALLBACK_SPECIALTIES);
        }
      } catch (err) {
        console.error('Failed to load master tables, using static data.', err);
        setProfessions(FALLBACK_PROFESSIONS);
        setSpecialties(FALLBACK_SPECIALTIES);
      }
    }
    loadMasterData();
  }, [supabase]);

  const activeProfessions = professions.length > 0 ? professions : FALLBACK_PROFESSIONS;
  const activeSpecialties = specialties.length > 0 ? specialties : FALLBACK_SPECIALTIES;

  const selectedProfObj = activeProfessions.find(p => p.name === formData.role);
  const showDesignation = selectedProfObj?.requires_designation || formData.role === 'Other Healthcare Volunteer';

  const selectedSpecObj = activeSpecialties.find(s => s.name === formData.specialty);
  const showSpecialtyDesc = selectedSpecObj?.requires_description || formData.specialty === 'Other Specialty';

  // Group specialties by category
  const specialtiesByCategory: Record<string, typeof activeSpecialties> = {};
  activeSpecialties.forEach(spec => {
    if (!specialtiesByCategory[spec.category]) {
      specialtiesByCategory[spec.category] = [];
    }
    specialtiesByCategory[spec.category].push(spec);
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    // Field-specific normalisations
    let normalised = value;
    if (name === 'email') normalised = value.trimStart().toLowerCase();
    // Strip every non-digit character from mobile as the user types
    if (name === 'mobile') normalised = value.replace(/\D/g, '').slice(0, MOBILE_DIGITS);

    setFormData({ ...formData, [name]: normalised });

    // Real-time inline validation
    if (name === 'name') {
      const err = validateFullName(value);
      setFieldErrors(prev => ({ ...prev, name: err }));
    }
    if (name === 'email') {
      const err = validateEmail(normalised);
      setFieldErrors(prev => ({ ...prev, email: err }));
      if (emailCheckStatus !== 'idle') setEmailCheckStatus('idle');
    }
    if (name === 'mobile') {
      const err = validateMobile(normalised);
      setFieldErrors(prev => ({ ...prev, mobile: normalised ? err : null }));
      if (mobileCheckStatus !== 'idle') setMobileCheckStatus('idle');
    }
    if (name === 'password') {
      // Show error only once the user has typed something
      const err = value ? validatePassword(value) : null;
      setFieldErrors(prev => ({ ...prev, password: err }));
    }
    if (name === 'experience') {
      const err = value.trim() ? validateExperience(value) : null;
      setFieldErrors(prev => ({ ...prev, experience: err }));
    }
    if (name === 'committedDays') {
      const err = value.trim() ? validateCommittedDays(value) : null;
      setFieldErrors(prev => ({ ...prev, committedDays: err }));
    }
  };

  // Block non-digit key presses on mobile field before they can be typed
  const handleMobileKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Allow: Backspace, Delete, Tab, Escape, Enter, Arrow keys, Home, End
    const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter',
      'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'];
    if (allowedKeys.includes(e.key)) return;
    // Allow Ctrl/Cmd combos (copy, paste, select-all, etc.)
    if (e.ctrlKey || e.metaKey) return;
    // Block anything that is not a digit 0-9
    if (!/^\d$/.test(e.key)) {
      e.preventDefault();
    }
  };

  const handleNameBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const err = validateFullName(e.target.value);
    setFieldErrors(prev => ({ ...prev, name: err }));
  };

  const handleEmailBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    const normalised = e.target.value.trim().toLowerCase();
    // Update formData with the fully-trimmed value
    setFormData(prev => ({ ...prev, email: normalised }));

    // 1. Format validation first
    const formatErr = validateEmail(normalised);
    if (formatErr) {
      setFieldErrors(prev => ({ ...prev, email: formatErr }));
      setEmailCheckStatus('idle');
      return;
    }
    setFieldErrors(prev => ({ ...prev, email: null }));

    // 2. Backend duplicate check
    setEmailCheckStatus('checking');
    try {
      const res = await fetch('/api/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalised }),
      });
      const json = await res.json();

      if (res.status === 409 || json.available === false) {
        setEmailCheckStatus('duplicate');
        setFieldErrors(prev => ({ ...prev, email: 'An account already exists with this Email Address.' }));
      } else {
        setEmailCheckStatus('available');
        setFieldErrors(prev => ({ ...prev, email: null }));
      }
    } catch {
      // Network failure — fail open, let Supabase catch it at sign-up
      setEmailCheckStatus('idle');
    }
  };

  const handleMobileBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, MOBILE_DIGITS);
    setFormData(prev => ({ ...prev, mobile: digits }));

    // 1. Format validation first
    const formatErr = validateMobile(digits);
    if (formatErr) {
      setFieldErrors(prev => ({ ...prev, mobile: formatErr }));
      setMobileCheckStatus('idle');
      return;
    }
    setFieldErrors(prev => ({ ...prev, mobile: null }));

    // 2. Backend duplicate check
    setMobileCheckStatus('checking');
    try {
      const res = await fetch('/api/check-mobile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile: digits }),
      });
      const json = await res.json();

      if (res.status === 409 || json.available === false) {
        setMobileCheckStatus('duplicate');
        setFieldErrors(prev => ({ ...prev, mobile: 'An account already exists with this Mobile Number.' }));
      } else {
        setMobileCheckStatus('available');
        setFieldErrors(prev => ({ ...prev, mobile: null }));
      }
    } catch {
      setMobileCheckStatus('idle');
    }
  };

  // Generic blur handler for simple required fields
  const handleBlurRequired = (fieldName: string, value: string) => {
    if (!value.trim()) {
      setFieldErrors(prev => ({ ...prev, [fieldName]: `This field is required.` }));
    } else {
      setFieldErrors(prev => ({ ...prev, [fieldName]: null }));
    }
  };

  const handleCommittedDaysBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const err = validateCommittedDays(e.target.value);
    setFieldErrors(prev => ({ ...prev, committedDays: err }));
  };

  const handleCheckboxChange = (category: 'areasOfInterest' | 'preferredGeography', value: string) => {
    const currentList = formData[category];
    if (currentList.includes(value)) {
      setFormData({ ...formData, [category]: currentList.filter(item => item !== value) });
    } else {
      setFormData({ ...formData, [category]: [...currentList, value] });
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 1024 * 1024) {
        setError('Profile Photograph must be less than 1 MB.');
        return;
      }
      setProfilePhotoFile(file);
      setProfilePhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // ── Full Name validation (matches inline rules) ──────────────────────────
    const nameError = validateFullName(formData.name);
    if (nameError) {
      setFieldErrors(prev => ({ ...prev, name: nameError }));
      setError(nameError);
      setLoading(false);
      return;
    }

    if (!formData.gender) {
      setError('Please select your Gender.');
      setLoading(false);
      return;
    }

    if (!formData.role) {
      setError('Please select your Onboarding Role Type.');
      setLoading(false);
      return;
    }

    if (showDesignation && !formData.professionalDesignation.trim()) {
      setError('Professional Designation is required when Other Healthcare Volunteer is selected.');
      setLoading(false);
      return;
    }

    // ── Email: format + duplicate guard ──────────────────────────────────────
    const emailNormalised = formData.email.trim().toLowerCase();
    const emailFormatErr = validateEmail(emailNormalised);
    if (emailFormatErr) {
      setFieldErrors(prev => ({ ...prev, email: emailFormatErr }));
      setError(emailFormatErr);
      setLoading(false);
      return;
    }
    if (emailCheckStatus === 'duplicate') {
      const dupMsg = 'An account already exists with this Email Address.';
      setFieldErrors(prev => ({ ...prev, email: dupMsg }));
      setError(dupMsg);
      setLoading(false);
      return;
    }
    // If user skipped the blur check, do a backend call now
    if (emailCheckStatus === 'idle') {
      setLoading(false);
      setEmailCheckStatus('checking');
      try {
        const res = await fetch('/api/check-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: emailNormalised }),
        });
        const json = await res.json();
        if (res.status === 409 || json.available === false) {
          const dupMsg = 'An account already exists with this Email Address.';
          setEmailCheckStatus('duplicate');
          setFieldErrors(prev => ({ ...prev, email: dupMsg }));
          setError(dupMsg);
          return;
        }
        setEmailCheckStatus('available');
      } catch {
        // Fail open on network error
        setEmailCheckStatus('idle');
      }
      setLoading(true);
    }

    // ── Password: full validation + strength guard ────────────────────────────
    const passwordErr = validatePassword(formData.password);
    if (passwordErr) {
      setFieldErrors(prev => ({ ...prev, password: passwordErr }));
      setError(passwordErr);
      setLoading(false);
      return;
    }

    // ── Mobile: format + duplicate guard ─────────────────────────────────────
    const mobileErr = validateMobile(formData.mobile);
    if (mobileErr) {
      setFieldErrors(prev => ({ ...prev, mobile: mobileErr }));
      setError(mobileErr);
      setLoading(false);
      return;
    }
    if (mobileCheckStatus === 'duplicate') {
      const dupMsg = 'An account already exists with this Mobile Number.';
      setFieldErrors(prev => ({ ...prev, mobile: dupMsg }));
      setError(dupMsg);
      setLoading(false);
      return;
    }
    // If user skipped blur, fire backend check now
    if (mobileCheckStatus === 'idle') {
      setLoading(false);
      setMobileCheckStatus('checking');
      try {
        const res = await fetch('/api/check-mobile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mobile: formData.mobile }),
        });
        const json = await res.json();
        if (res.status === 409 || json.available === false) {
          const dupMsg = 'An account already exists with this Mobile Number.';
          setMobileCheckStatus('duplicate');
          setFieldErrors(prev => ({ ...prev, mobile: dupMsg }));
          setError(dupMsg);
          return;
        }
        setMobileCheckStatus('available');
      } catch {
        setMobileCheckStatus('idle');
      }
      setLoading(true);
    }

    if (!formData.age) {
      setError('Please enter your Age.');
      setLoading(false);
      return;
    }

    const ageNum = parseInt(formData.age);
    if (isNaN(ageNum) || ageNum < 18 || ageNum > 100) {
      setError('Age must be a valid number between 18 and 100.');
      setLoading(false);
      return;
    }

    if (!profilePhotoFile) {
      setError('Please upload your Profile Photograph.');
      setLoading(false);
      return;
    }

    if (!formData.regNumber.trim()) {
      setError('Please enter your Council Registration Number.');
      setLoading(false);
      return;
    }

    if (!formData.specialty) {
      setError('Please select your Primary Clinical Specialty.');
      setLoading(false);
      return;
    }

    // ── Years of Experience: full validation ─────────────────────────────────
    const expErr = validateExperience(formData.experience);
    if (expErr) {
      setFieldErrors(prev => ({ ...prev, experience: expErr }));
      setError(expErr);
      setLoading(false);
      return;
    }
    const expNum = parseInt(formData.experience.trim(), 10);

    if (showSpecialtyDesc && !formData.specialtyDescription.trim()) {
      setError('Specialty Description is required when Other Specialty is selected.');
      setLoading(false);
      return;
    }

    if (!formData.committedDays.trim()) {
      const err = 'Please provide Training Availability.';
      setFieldErrors(prev => ({ ...prev, committedDays: err }));
      setError(err);
      setLoading(false);
      return;
    }

    const daysErr = validateCommittedDays(formData.committedDays);
    if (daysErr) {
      setFieldErrors(prev => ({ ...prev, committedDays: daysErr }));
      setError(daysErr);
      setLoading(false);
      return;
    }
    const daysNum = parseInt(formData.committedDays);

    if (formData.areasOfInterest.length === 0) {
      const msg = 'Please select at least one Area of Interest.';
      setFieldErrors(prev => ({ ...prev, areasOfInterest: msg }));
      setError(msg);
      setLoading(false);
      return;
    }

    if (formData.preferredGeography.length === 0) {
      const msg = 'Please select at least one Preferred Service Geography.';
      setFieldErrors(prev => ({ ...prev, preferredGeography: msg }));
      setError(msg);
      setLoading(false);
      return;
    }

    if (!degreeFile || !licenseFile) {
      setError('Please upload both your Qualification Degree/Certification and your Professional License Copy.');
      setLoading(false);
      return;
    }

    if (degreeFile.size > 2 * 1024 * 1024) {
      setError('Medical Degree / Certificate file size must be less than 2 MB.');
      setLoading(false);
      return;
    }

    if (licenseFile.size > 1024 * 1024) {
      setError('Professional License file size must be less than 1 MB.');
      setLoading(false);
      return;
    }

    try {
      // 1. Backend validation gate – POST /api/register
      // This mirrors all client-side rules server-side so the DB never receives
      // invalid or duplicate data even if the browser check is bypassed.
      const emailNorm = formData.email.trim().toLowerCase();
      const registerRes = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:               formData.name,
          email:              emailNorm,
          mobile:             formData.mobile,
          password:           formData.password,
          gender:             formData.gender,
          role:               formData.role,
          specialty:          formData.specialty,
          regNumber:          formData.regNumber,
          age:                formData.age,
          experience:         formData.experience,
          committedDays:      formData.committedDays,
          areasOfInterest:    formData.areasOfInterest,
          preferredGeography: formData.preferredGeography,
        }),
      });

      const registerJson = await registerRes.json();

      if (!registerJson.success) {
        // Map structured errors back into inline field errors
        if (registerJson.errors && typeof registerJson.errors === 'object') {
          const serverErrors = registerJson.errors as Record<string, string>;
          setFieldErrors(prev => ({ ...prev, ...serverErrors }));

          // Display the first field error as the banner message
          const firstMsg = Object.values(serverErrors)[0];
          if (firstMsg && !firstMsg.startsWith('_')) {
            setError(firstMsg);
          } else {
            setError('Validation failed. Please review the highlighted fields.');
          }
        } else {
          setError('Server validation failed. Please try again.');
        }
        setLoading(false);
        return;
      }

      // 2. Sign up the user via Supabase Auth
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: emailNorm,
        password: formData.password,
        options: {
          data: {
            name: formData.name,
            role: formData.role,
            gender: formData.gender,
            specialty: formData.specialty,
            regNumber: formData.regNumber,
            experience: parseInt(formData.experience) || 5,
            age: ageNum,
            mobile: formData.mobile,
            committedDays: parseInt(formData.committedDays) || 10,
            status: 'Pending', // New users register as Pending
            avatar: formData.role.includes('Nurse') ? '👩‍⚕️' : '👨‍⚕️',
            locationPriorities: ['Koya'],
            availableMonths: { Jul: [10, 11, 25], Aug: [14, 15] },
            professionalDesignation: showDesignation ? formData.professionalDesignation : null,
            specialtyDescription: showSpecialtyDesc ? formData.specialtyDescription : null,
            willingnessToServe: formData.willingnessToServe,
            areasOfInterest: formData.areasOfInterest,
            preferredGeography: formData.preferredGeography,
            availableForTeleconsultation: formData.availableForTeleconsultation === 'Yes',
          },
        },
      });

      if (signUpError) {
        throw signUpError;
      }

      if (!data.user) {
        throw new Error('User sign-up failed.');
      }

      const userId = data.user.id;

      // 2. Upload Profile Photo if present
      let photoPath = '';
      if (profilePhotoFile) {
        const photoExt = profilePhotoFile.name.split('.').pop();
        const photoName = `photo_${Date.now()}.${photoExt}`;
        const photoFullPath = `${userId}/${photoName}`;

        const { error: photoUploadError } = await supabase.storage
          .from('verification-documents')
          .upload(photoFullPath, profilePhotoFile);

        if (photoUploadError) {
          throw new Error(`Failed to upload Profile Photo: ${photoUploadError.message}`);
        }
        photoPath = photoFullPath;
      }

      // 3. Upload Medical Degree to Supabase Storage
      let degreePath = '';
      const degreeExt = degreeFile.name.split('.').pop();
      const degreeName = `degree_${Date.now()}.${degreeExt}`;
      const degreeFullPath = `${userId}/${degreeName}`;

      const { error: degreeUploadError } = await supabase.storage
        .from('verification-documents')
        .upload(degreeFullPath, degreeFile);

      if (degreeUploadError) {
        throw new Error(`Failed to upload Qualification Certificate: ${degreeUploadError.message}`);
      }
      degreePath = degreeFullPath;

      // 4. Upload License to Supabase Storage
      let licensePath = '';
      const licenseExt = licenseFile.name.split('.').pop();
      const licenseName = `license_${Date.now()}.${licenseExt}`;
      const licenseFullPath = `${userId}/${licenseName}`;

      const { error: licenseUploadError } = await supabase.storage
        .from('verification-documents')
        .upload(licenseFullPath, licenseFile);

      if (licenseUploadError) {
        throw new Error(`Failed to upload Professional License: ${licenseUploadError.message}`);
      }
      licensePath = licenseFullPath;

      // 5. Update profiles row with uploaded file storage paths and metadata
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          age: ageNum,
          degree_file_path: degreePath,
          license_file_path: licensePath,
          profile_photo_path: photoPath || null,
          professional_designation: showDesignation ? formData.professionalDesignation : null,
          specialty_description: showSpecialtyDesc ? formData.specialtyDescription : null,
          willingness_to_serve: formData.willingnessToServe,
          areas_of_interest: formData.areasOfInterest,
          preferred_geography: formData.preferredGeography,
          available_for_teleconsultation: formData.availableForTeleconsultation === 'Yes'
        })
        .eq('id', userId);

      if (updateError) {
        throw new Error(`Profile initialization failed: ${updateError.message}`);
      }

      // Sync Auth metadata updates
      await supabase.auth.updateUser({
        data: {
          age: ageNum,
          degreeFilePath: degreePath,
          licenseFilePath: licensePath,
          profilePhotoPath: photoPath || null,
          professionalDesignation: showDesignation ? formData.professionalDesignation : null,
          specialtyDescription: showSpecialtyDesc ? formData.specialtyDescription : null,
          willingnessToServe: formData.willingnessToServe,
          areasOfInterest: formData.areasOfInterest,
          preferredGeography: formData.preferredGeography,
          availableForTeleconsultation: formData.availableForTeleconsultation === 'Yes'
        }
      });

      setSuccess(true);
      setTimeout(() => {
        router.push('/volunteer/dashboard');
      }, 2000);
    } catch (err: any) {
      const msg: string = err?.message ?? '';

      // Translate Postgres/Supabase unique-constraint violations gracefully
      if (msg.includes('profiles_email_key') || (msg.includes('unique') && msg.includes('email'))) {
        const dupMsg = 'An account already exists with this Email Address.';
        setFieldErrors(prev => ({ ...prev, email: dupMsg }));
        setEmailCheckStatus('duplicate');
        setError(dupMsg);
      } else if (msg.includes('profiles_mobile_key') || (msg.includes('unique') && msg.includes('mobile'))) {
        const dupMsg = 'An account already exists with this Mobile Number.';
        setFieldErrors(prev => ({ ...prev, mobile: dupMsg }));
        setMobileCheckStatus('duplicate');
        setError(dupMsg);
      } else {
        setError(msg || 'An error occurred during registration.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans antialiased">
      
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-100">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <div>
                <span className="text-xl font-extrabold tracking-tight text-slate-900">Avodani</span>
              </div>
            </Link>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-500">Already registered?</span>
              <Link href="/auth/login" className="text-xs font-bold text-indigo-600 hover:text-amber-800">Login Here</Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-grow max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-8 space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-2xl font-extrabold text-slate-900">Volunteer Enlistment Application</h2>
            <p className="text-xs text-slate-500 mt-1">
              Provide professional verification details. Submissions undergo active licensing verification against regulatory database rosters.
            </p>
          </div>

          {error && (
            <div className="bg-rose-50 border border-rose-100 text-rose-700 text-xs p-4 rounded-xl flex items-start space-x-2">
              <span>⚠️</span>
              <div>
                <span className="font-bold">Registration Failed:</span> {error}
              </div>
            </div>
          )}

          {success && (
            <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs p-4 rounded-xl flex items-start space-x-2 animate-bounce">
              <span>✓</span>
              <div>
                <span className="font-bold">Application Received Successfully!</span> Logging you in and redirecting to the volunteer portal...
              </div>
            </div>
          )}

          <form onSubmit={handleFormSubmit} className="space-y-6">
            
            {/* Basic Personal Details */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/60 space-y-4">
              <h4 className="font-bold text-slate-800 text-sm">1. Personal & Identity Details</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Full Name <span className="text-rose-500">*</span></label>
                  <input 
                    type="text" 
                    id="volunteer-full-name"
                    name="name"
                    placeholder="John Smith" 
                    value={formData.name}
                    onChange={handleChange}
                    onBlur={handleNameBlur}
                    maxLength={NAME_MAX}
                    className={`w-full text-xs p-2.5 bg-white border rounded-lg focus:ring-1 focus:outline-none transition-colors ${
                      fieldErrors.name
                        ? 'border-rose-400 focus:ring-rose-400 bg-rose-50/30'
                        : 'border-slate-300 focus:ring-indigo-600'
                    }`}
                    required
                    pattern="[a-zA-Z ]+"
                    title="Full Name must contain only letters and spaces"
                    aria-describedby="name-error"
                    aria-invalid={!!fieldErrors.name}
                  />
                  {/* Character counter */}
                  <div className="flex items-center justify-between mt-1">
                    {fieldErrors.name ? (
                      <p id="name-error" className="text-rose-500 text-[10px] font-semibold flex items-center gap-1">
                        <span aria-hidden="true">⚠</span> {fieldErrors.name}
                      </p>
                    ) : (
                      <p className="text-[10px] text-slate-400">Letters and spaces only. Min 3, max 25 characters.</p>
                    )}
                    <span className={`text-[10px] font-mono ml-2 shrink-0 ${
                      formData.name.length > NAME_MAX - 3 ? 'text-amber-600 font-bold' : 'text-slate-400'
                    }`}>
                      {formData.name.length}/{NAME_MAX}
                    </span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Gender <span className="text-rose-500">*</span></label>
                  <select 
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-600 focus:outline-none"
                    required
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Non-binary">Non-binary / Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Onboarding Role Type <span className="text-rose-500">*</span></label>
                  <select 
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-600 focus:outline-none"
                    required
                  >
                    <option value="">Select Onboarding Role Type</option>
                    {activeProfessions.map(prof => (
                      <option key={prof.id} value={prof.name}>{prof.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Conditional Designation Field */}
              {showDesignation && (
                <div className="animate-fade-in">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Professional Designation <span className="text-rose-500">*</span></label>
                  <input 
                    type="text"
                    name="professionalDesignation"
                    placeholder="Please specify your profession"
                    value={formData.professionalDesignation}
                    onChange={handleChange}
                    className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-600 focus:outline-none"
                    required
                  />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Email Address <span className="text-rose-500">*</span></label>
                  <div className="relative">
                    <input 
                      type="email"
                      id="volunteer-email"
                      name="email"
                      placeholder="doctor@hospital.org"
                      value={formData.email}
                      onChange={handleChange}
                      onBlur={handleEmailBlur}
                      autoComplete="email"
                      className={`w-full text-xs p-2.5 pr-8 bg-white border rounded-lg focus:ring-1 focus:outline-none transition-colors ${
                        fieldErrors.email
                          ? 'border-rose-400 focus:ring-rose-400 bg-rose-50/30'
                          : emailCheckStatus === 'available'
                          ? 'border-emerald-400 focus:ring-emerald-400 bg-emerald-50/20'
                          : 'border-slate-300 focus:ring-indigo-600'
                      }`}
                      required
                      aria-describedby="email-error"
                      aria-invalid={!!fieldErrors.email}
                    />
                    {/* Right-side status icon */}
                    {emailCheckStatus === 'checking' && (
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 animate-spin text-xs">⟳</span>
                    )}
                    {emailCheckStatus === 'available' && !fieldErrors.email && (
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-emerald-500 text-xs font-bold">✓</span>
                    )}
                    {emailCheckStatus === 'duplicate' && (
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-rose-500 text-xs font-bold">✕</span>
                    )}
                  </div>
                  {fieldErrors.email ? (
                    <p id="email-error" className="text-rose-500 text-[10px] font-semibold flex items-center gap-1 mt-1">
                      <span aria-hidden="true">⚠</span> {fieldErrors.email}
                    </p>
                  ) : emailCheckStatus === 'available' ? (
                    <p className="text-emerald-600 text-[10px] font-semibold mt-1">✓ Email address is available.</p>
                  ) : (
                    <p className="text-[10px] text-slate-400 mt-1">Standard email format. Verified for uniqueness on exit.</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Password <span className="text-rose-500">*</span></label>
                  {/* Input + show/hide toggle */}
                  <div className="relative">
                    <input
                      id="volunteer-password"
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      placeholder="Doctor@2026"
                      value={formData.password}
                      onChange={handleChange}
                      autoComplete="new-password"
                      className={`w-full text-xs p-2.5 pr-8 bg-white border rounded-lg focus:ring-1 focus:outline-none transition-colors ${
                        fieldErrors.password
                          ? 'border-rose-400 focus:ring-rose-400 bg-rose-50/30'
                          : formData.password && !fieldErrors.password
                          ? 'border-emerald-400 focus:ring-emerald-400'
                          : 'border-slate-300 focus:ring-indigo-600'
                      }`}
                      required
                      aria-describedby="password-error"
                      aria-invalid={!!fieldErrors.password}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(p => !p)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs leading-none select-none"
                      tabIndex={-1}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? '🙈' : '👁'}
                    </button>
                  </div>

                  {/* Strength meter — visible only while typing */}
                  {formData.password && (() => {
                    const strength = getPasswordStrength(formData.password);
                    const bars    = strength === 'weak' ? 1 : strength === 'medium' ? 2 : 3;
                    const colour  = strength === 'weak'
                      ? 'bg-rose-500'
                      : strength === 'medium'
                      ? 'bg-amber-400'
                      : 'bg-emerald-500';
                    const label   = strength === 'weak' ? 'Weak' : strength === 'medium' ? 'Medium' : 'Strong';
                    return (
                      <div className="mt-1.5 space-y-1">
                        <div className="flex gap-1">
                          {[1, 2, 3].map(i => (
                            <div
                              key={i}
                              className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                                i <= bars ? colour : 'bg-slate-200'
                              }`}
                            />
                          ))}
                        </div>
                        <p className={`text-[10px] font-bold ${
                          strength === 'weak' ? 'text-rose-500' :
                          strength === 'medium' ? 'text-amber-500' : 'text-emerald-600'
                        }`}>
                          Password strength: {label}
                        </p>
                      </div>
                    );
                  })()}

                  {/* Per-rule checklist — visible while typing */}
                  {formData.password && (
                    <ul className="mt-1.5 grid grid-cols-2 gap-x-2 gap-y-0.5">
                      {([
                        [PWD_RULES.minLength,  'Min 8 characters'],
                        [PWD_RULES.hasUpper,   'Uppercase letter'],
                        [PWD_RULES.hasLower,   'Lowercase letter'],
                        [PWD_RULES.hasNumber,  'Number'],
                        [PWD_RULES.hasSpecial, 'Special character'],
                      ] as [((v: string) => boolean), string][]).map(([fn, label]) => (
                        <li key={label} className={`text-[10px] flex items-center gap-1 ${
                          fn(formData.password) ? 'text-emerald-600' : 'text-slate-400'
                        }`}>
                          <span>{fn(formData.password) ? '✓' : '○'}</span>
                          {label}
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* Error message */}
                  {fieldErrors.password && (
                    <p id="password-error" className="text-rose-500 text-[10px] font-semibold flex items-center gap-1 mt-1">
                      <span aria-hidden="true">⚠</span> {fieldErrors.password}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Mobile Number <span className="text-rose-500">*</span></label>
                  <div className="relative">
                    <input
                      type="text"
                      id="volunteer-mobile"
                      name="mobile"
                      inputMode="numeric"
                      placeholder="9876543210"
                      value={formData.mobile}
                      onChange={handleChange}
                      onKeyDown={handleMobileKeyDown}
                      onBlur={handleMobileBlur}
                      maxLength={MOBILE_DIGITS}
                      className={`w-full text-xs p-2.5 pr-8 bg-white border rounded-lg focus:ring-1 focus:outline-none transition-colors ${
                        fieldErrors.mobile
                          ? 'border-rose-400 focus:ring-rose-400 bg-rose-50/30'
                          : mobileCheckStatus === 'available'
                          ? 'border-emerald-400 focus:ring-emerald-400 bg-emerald-50/20'
                          : 'border-slate-300 focus:ring-indigo-600'
                      }`}
                      required
                      aria-describedby="mobile-error"
                      aria-invalid={!!fieldErrors.mobile}
                    />
                    {/* Status icons */}
                    {mobileCheckStatus === 'checking' && (
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 animate-spin text-xs">⟳</span>
                    )}
                    {mobileCheckStatus === 'available' && !fieldErrors.mobile && (
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-emerald-500 text-xs font-bold">✓</span>
                    )}
                    {mobileCheckStatus === 'duplicate' && (
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-rose-500 text-xs font-bold">✕</span>
                    )}
                  </div>
                  {/* Inline feedback + digit counter */}
                  <div className="flex items-center justify-between mt-1">
                    {fieldErrors.mobile ? (
                      <p id="mobile-error" className="text-rose-500 text-[10px] font-semibold flex items-center gap-1">
                        <span aria-hidden="true">⚠</span> {fieldErrors.mobile}
                      </p>
                    ) : mobileCheckStatus === 'available' ? (
                      <p className="text-emerald-600 text-[10px] font-semibold">✓ Mobile number is available.</p>
                    ) : (
                      <p className="text-[10px] text-slate-400">10 digits only. No spaces, hyphens or country code.</p>
                    )}
                    <span className={`text-[10px] font-mono ml-2 shrink-0 ${
                      formData.mobile.length === MOBILE_DIGITS ? 'text-emerald-600 font-bold' :
                      formData.mobile.length > 0 ? 'text-amber-600' : 'text-slate-400'
                    }`}>
                      {formData.mobile.length}/{MOBILE_DIGITS}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Age (Years) <span className="text-rose-500">*</span></label>
                  <input 
                    type="number"
                    id="volunteer-age"
                    name="age"
                    placeholder="35"
                    min="18"
                    max="100"
                    value={formData.age}
                    onChange={handleChange}
                    onBlur={(e) => {
                      const v = parseInt(e.target.value);
                      if (!e.target.value) setFieldErrors(prev => ({ ...prev, age: 'Age is required.' }));
                      else if (isNaN(v) || v < 18 || v > 100) setFieldErrors(prev => ({ ...prev, age: 'Age must be between 18 and 100.' }));
                      else setFieldErrors(prev => ({ ...prev, age: null }));
                    }}
                    className={`w-full text-xs p-2.5 bg-white border rounded-lg focus:ring-1 focus:outline-none transition-colors ${
                      fieldErrors.age ? 'border-rose-400 focus:ring-rose-400 bg-rose-50/30' : 'border-slate-300 focus:ring-indigo-600'
                    }`}
                    required
                    aria-invalid={!!fieldErrors.age}
                  />
                  {fieldErrors.age && (
                    <p className="text-rose-500 text-[10px] font-semibold flex items-center gap-1 mt-1">
                      <span aria-hidden="true">⚠</span> {fieldErrors.age}
                    </p>
                  )}
                </div>

                {/* Profile Photograph Upload */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Profile Photograph <span className="text-rose-500">*</span></label>
                  <div className="flex items-center space-x-3">
                    <label className="cursor-pointer px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-lg transition-colors">
                      Choose Photo
                      <input 
                        type="file"
                        accept=".jpg,.jpeg,.png"
                        onChange={handlePhotoChange}
                        className="hidden"
                        required
                      />
                    </label>
                    {profilePhotoPreview && (
                      <div className="relative w-10 h-10 rounded-full overflow-hidden border border-indigo-500 shadow-inner">
                        <img src={profilePhotoPreview} alt="Preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => {
                            setProfilePhotoFile(null);
                            setProfilePhotoPreview(null);
                          }}
                          className="absolute inset-0 bg-black/40 text-white flex items-center justify-center font-bold text-xs"
                          title="Remove Photo"
                        >
                          ×
                        </button>
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-1">
                    JPG, JPEG, PNG. Max 1 MB. Required.
                  </span>
                </div>
              </div>
              
              <div className="bg-slate-100/70 p-3 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 font-semibold block">
                  💡 Upload a recent professional photograph for identification purposes.
                </span>
              </div>
            </div>

            {/* Clinical Professional Qualifications */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/60 space-y-4">
              <h4 className="font-bold text-slate-800 text-sm">2. Professional Licensing Details</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Council Registration Number <span className="text-rose-500">*</span></label>
                  <input 
                    type="text"
                    id="volunteer-reg-number"
                    name="regNumber"
                    placeholder="MC-2026-XXXX"
                    value={formData.regNumber}
                    onChange={handleChange}
                    onBlur={(e) => handleBlurRequired('regNumber', e.target.value)}
                    className={`w-full text-xs p-2.5 bg-white border rounded-lg focus:ring-1 focus:outline-none transition-colors ${
                      fieldErrors.regNumber ? 'border-rose-400 focus:ring-rose-400 bg-rose-50/30' : 'border-slate-300 focus:ring-indigo-600'
                    }`}
                    required
                    aria-invalid={!!fieldErrors.regNumber}
                  />
                  {fieldErrors.regNumber ? (
                    <p className="text-rose-500 text-[10px] font-semibold flex items-center gap-1 mt-1">
                      <span aria-hidden="true">⚠</span> {fieldErrors.regNumber}
                    </p>
                  ) : (
                    <span className="text-[10px] text-slate-400 block mt-1">Standard format for licensing check</span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Primary Clinical Specialty <span className="text-rose-500">*</span></label>
                  <select
                    id="volunteer-specialty"
                    name="specialty"
                    value={formData.specialty}
                    onChange={handleChange}
                    onBlur={(e) => handleBlurRequired('specialty', e.target.value)}
                    className={`w-full text-xs p-2.5 bg-white border rounded-lg focus:ring-1 focus:outline-none transition-colors ${
                      fieldErrors.specialty ? 'border-rose-400 focus:ring-rose-400 bg-rose-50/30' : 'border-slate-300 focus:ring-indigo-600'
                    }`}
                    required
                    aria-invalid={!!fieldErrors.specialty}
                  >
                    <option value="">Select Primary Clinical Specialty</option>
                    {Object.entries(specialtiesByCategory).map(([category, items]) => (
                      <optgroup key={category} label={category}>
                        {items.map((item: any) => (
                          <option key={item.id} value={item.name}>{item.name}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                  {fieldErrors.specialty && (
                    <p className="text-rose-500 text-[10px] font-semibold flex items-center gap-1 mt-1">
                      <span aria-hidden="true">⚠</span> {fieldErrors.specialty}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Years of Experience <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    id="volunteer-experience"
                    name="experience"
                    inputMode="numeric"
                    placeholder="e.g. 5"
                    value={formData.experience}
                    onChange={handleChange}
                    onKeyDown={(e) => {
                      // Allow control keys
                      const allowed = ['Backspace','Delete','Tab','Escape','Enter','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'];
                      if (allowed.includes(e.key) || e.ctrlKey || e.metaKey) return;
                      // Block everything that is not a digit
                      if (!/^\d$/.test(e.key)) e.preventDefault();
                    }}
                    maxLength={2}
                    className={`w-full text-xs p-2.5 bg-white border rounded-lg focus:ring-1 focus:outline-none transition-colors ${
                      fieldErrors.experience
                        ? 'border-rose-400 focus:ring-rose-400 bg-rose-50/30'
                        : formData.experience && !fieldErrors.experience
                        ? 'border-emerald-400 focus:ring-emerald-400'
                        : 'border-slate-300 focus:ring-indigo-600'
                    }`}
                    required
                    aria-describedby="experience-error"
                    aria-invalid={!!fieldErrors.experience}
                  />
                  {fieldErrors.experience ? (
                    <p id="experience-error" className="text-rose-500 text-[10px] font-semibold flex items-center gap-1 mt-1">
                      <span aria-hidden="true">⚠</span> {fieldErrors.experience}
                    </p>
                  ) : (
                    <p className="text-[10px] text-slate-400 mt-1">Whole numbers only, 0 – 50 years.</p>
                  )}
                </div>
              </div>

              {/* Conditional Specialty Description */}
              {showSpecialtyDesc && (
                <div className="animate-fade-in">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Specialty Description <span className="text-rose-500">*</span></label>
                  <input 
                    type="text" 
                    name="specialtyDescription"
                    placeholder="Please specify your specialty" 
                    value={formData.specialtyDescription}
                    onChange={handleChange}
                    className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-600 focus:outline-none"
                    required
                  />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Training Availability / Annual Commitment (Days) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="volunteer-committed-days"
                    name="committedDays"
                    inputMode="numeric"
                    value={formData.committedDays}
                    onChange={handleChange}
                    onBlur={handleCommittedDaysBlur}
                    onKeyDown={(e) => {
                      const allowed = ['Backspace','Delete','Tab','Escape','Enter','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'];
                      if (allowed.includes(e.key) || e.ctrlKey || e.metaKey) return;
                      if (!/^\d$/.test(e.key)) e.preventDefault();
                    }}
                    maxLength={3}
                    placeholder="e.g. 10"
                    className={`w-full text-xs p-2.5 bg-white border rounded-lg focus:ring-1 focus:outline-none transition-colors ${
                      fieldErrors.committedDays
                        ? 'border-rose-400 focus:ring-rose-400 bg-rose-50/30'
                        : formData.committedDays && !fieldErrors.committedDays
                        ? 'border-emerald-400 focus:ring-emerald-400'
                        : 'border-slate-300 focus:ring-indigo-600'
                    }`}
                    required
                    aria-describedby="committed-days-error"
                    aria-invalid={!!fieldErrors.committedDays}
                  />
                  {fieldErrors.committedDays ? (
                    <p id="committed-days-error" className="text-rose-500 text-[10px] font-semibold flex items-center gap-1 mt-1">
                      <span aria-hidden="true">⚠</span> {fieldErrors.committedDays}
                    </p>
                  ) : (
                    <span className="text-[10px] text-slate-400 block mt-1">
                      Estimated days you may be available annually (1–365). Adjustable later.
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Mission Service Preferences Section */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/60 space-y-4">
              <h4 className="font-bold text-slate-800 text-sm">3. Mission Service Preferences</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Areas of Interest */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">Areas of Interest <span className="text-rose-500">*</span></label>
                  <div className="space-y-2">
                    {[
                      'Medical Camps',
                      'Rural Healthcare Missions',
                      'Mobile Clinics',
                      'Disaster Relief',
                      'Community Health Education',
                      'Church-based Health Outreach',
                      'Telemedicine Support'
                    ].map(interest => (
                      <label key={interest} className="flex items-center space-x-2 text-xs font-semibold text-slate-600 cursor-pointer">
                        <input 
                          type="checkbox"
                          checked={formData.areasOfInterest.includes(interest)}
                          onChange={() => handleCheckboxChange('areasOfInterest', interest)}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                        />
                        <span>{interest}</span>
                      </label>
                    ))}
                  </div>
                  {formData.areasOfInterest.length === 0 && fieldErrors.areasOfInterest && (
                    <p className="text-rose-500 text-[10px] font-semibold flex items-center gap-1 mt-2">
                      <span aria-hidden="true">⚠</span> {fieldErrors.areasOfInterest}
                    </p>
                  )}
                </div>

                {/* Geography Preferences */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">Preferred Service Geography <span className="text-rose-500">*</span></label>
                  <div className="space-y-2">
                    {[
                      'Local Region',
                      'Statewide',
                      'National',
                      'International Missions'
                    ].map(geo => (
                      <label key={geo} className="flex items-center space-x-2 text-xs font-semibold text-slate-600 cursor-pointer">
                        <input 
                          type="checkbox"
                          checked={formData.preferredGeography.includes(geo)}
                          onChange={() => handleCheckboxChange('preferredGeography', geo)}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                        />
                        <span>{geo}</span>
                      </label>
                    ))}
                  </div>
                  {formData.preferredGeography.length === 0 && fieldErrors.preferredGeography && (
                    <p className="text-rose-500 text-[10px] font-semibold flex items-center gap-1 mt-2">
                      <span aria-hidden="true">⚠</span> {fieldErrors.preferredGeography}
                    </p>
                  )}
                </div>

              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-200/60">
                {/* Available for Teleconsultation */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Available for Teleconsultation <span className="text-rose-500">*</span></label>
                  <div className="flex items-center space-x-4 mt-2">
                    {['Yes', 'No'].map(opt => (
                      <label key={opt} className="flex items-center space-x-1.5 text-xs font-semibold text-slate-700 cursor-pointer">
                        <input 
                          type="radio" 
                          name="availableForTeleconsultation"
                          value={opt}
                          checked={formData.availableForTeleconsultation === opt}
                          onChange={handleChange}
                          className="border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span>{opt}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Willingness to Serve */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Willingness to Serve in Faith-Based Mission Activities <span className="text-rose-500">*</span></label>
                  <select
                    name="willingnessToServe"
                    value={formData.willingnessToServe}
                    onChange={handleChange}
                    className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-600 focus:outline-none mt-1"
                  >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                    <option value="Prefer to Discuss">Prefer to Discuss</option>
                  </select>
                  <span className="text-[10px] text-slate-400 block mt-1">
                    Helps matching volunteers to corresponding church-led trips without being a requirement.
                  </span>
                </div>
              </div>

            </div>

            {/* Dynamic Certification Uploads */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/60 space-y-4">
              <h4 className="font-bold text-slate-800 text-sm">4. Verification Document Uploads</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Document 1 */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 text-center flex flex-col items-center justify-center">
                  <span className="text-2xl block mb-2">📜</span>
                  <h5 className="font-bold text-xs text-slate-700">Medical Degree / Equivalent Certification <span className="text-rose-500">*</span></h5>
                  <p className="text-[10px] text-rose-500 font-semibold mt-1 mb-4">Upload PDF, JPG, PNG up to 2MB size limit</p>
                  
                  <label className="cursor-pointer px-4 py-2 rounded-lg bg-slate-100 hover:bg-amber-50 hover:text-amber-800 text-xs font-semibold text-slate-600 transition-colors">
                    {degreeFile ? 'Change Certificate' : 'Choose Certificate File'}
                    <input 
                      type="file" 
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setDegreeFile(e.target.files[0]);
                        }
                      }}
                      className="hidden"
                      required
                    />
                  </label>
                  {degreeFile && (
                    <span className="text-emerald-600 font-bold text-[10px] block mt-2 text-center truncate max-w-full">
                      ✓ {degreeFile.name} ({(degreeFile.size / 1024).toFixed(1)} KB)
                    </span>
                  )}
                </div>

                {/* Document 2 */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 text-center flex flex-col items-center justify-center">
                  <span className="text-2xl block mb-2">🛡️</span>
                  <h5 className="font-bold text-xs text-slate-700">Professional License Upload <span className="text-rose-500">*</span></h5>
                  <p className="text-[10px] text-rose-500 font-semibold mt-1 mb-4">Upload PDF, JPG, PNG up to 1MB size limit</p>
                  
                  <label className="cursor-pointer px-4 py-2 rounded-lg bg-slate-100 hover:bg-amber-50 hover:text-amber-800 text-xs font-semibold text-slate-600 transition-colors">
                    {licenseFile ? 'Change License File' : 'Choose License Copy File'}
                    <input 
                      type="file" 
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setLicenseFile(e.target.files[0]);
                        }
                      }}
                      className="hidden"
                      required
                    />
                  </label>
                  {licenseFile && (
                    <span className="text-emerald-600 font-bold text-[10px] block mt-2 text-center truncate max-w-full">
                      ✓ {licenseFile.name} ({(licenseFile.size / 1024).toFixed(1)} KB)
                    </span>
                  )}
                </div>

              </div>
            </div>

            {/* Submit Actions */}
            <div className="flex flex-col sm:flex-row justify-end items-center gap-3 pt-2">
              {!isFormValid && !loading && (
                <p className="text-[10px] text-slate-400 text-right">
                  Complete all required fields above to enable submission.
                </p>
              )}
              <button 
                type="submit"
                disabled={!isFormValid || loading}
                className="w-full sm:w-auto px-6 py-3 bg-indigo-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg hover:bg-indigo-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? 'Submitting Application...' : 'Submit Application Roster Enlistment'}
              </button>
            </div>

          </form>
        </div>
      </main>

      <footer className="bg-slate-900 border-t border-slate-800 py-6 text-center text-slate-400 text-xs mt-10">
        <p>© 2026 Avodani. Empowering healthcare campaigns.</p>
      </footer>
    </div>
  );
}
