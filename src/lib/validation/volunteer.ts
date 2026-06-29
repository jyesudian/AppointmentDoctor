/**
 * Shared server-side validation rules for the Volunteer Enlistment form.
 * These are the canonical rules — imported by /api/register and can be
 * imported in any server-side context.
 *
 * IMPORTANT: Keep these in sync with the helper functions in
 * src/app/auth/signup/page.tsx (frontend mirrors).
 */

// ── Constants ─────────────────────────────────────────────────────────────────
export const NAME_MIN = 3;
export const NAME_MAX = 25;
export const NAME_REGEX = /^[a-zA-Z\s]+$/;

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const MOBILE_DIGITS = 10;
export const MOBILE_REGEX = /^\d{10}$/;

export const PWD_MIN_LENGTH = 8;
export const PWD_UPPER   = /[A-Z]/;
export const PWD_LOWER   = /[a-z]/;
export const PWD_DIGIT   = /[0-9]/;
export const PWD_SPECIAL = /[^A-Za-z0-9]/;

export const EXP_MAX = 50;
export const DAYS_MIN = 1;
export const DAYS_MAX = 365;
export const AGE_MIN = 18;
export const AGE_MAX = 100;

// ── Structured error map ──────────────────────────────────────────────────────
export type ValidationErrors = Record<string, string>;

// ── Individual field validators ───────────────────────────────────────────────

export function validateFullName(value: string): string | null {
  const v = (value ?? '').trim();
  if (!v) return 'Full Name is required.';
  if (v.length < NAME_MIN) return `Full Name must be at least ${NAME_MIN} characters.`;
  if (v.length > NAME_MAX) return 'Full Name cannot exceed 25 characters.';
  if (!NAME_REGEX.test(v)) return 'Full Name must contain only letters and spaces.';
  return null;
}

export function validateEmail(value: string): string | null {
  const v = (value ?? '').trim().toLowerCase();
  if (!v) return 'Email Address is required.';
  if (!EMAIL_REGEX.test(v)) return 'Please enter a valid Email Address.';
  return null;
}

export function validateMobile(value: string): string | null {
  const v = (value ?? '').trim();
  if (!v) return 'Mobile Number is required.';
  if (!/^\d+$/.test(v)) return 'Only numeric digits are allowed.';
  if (v.length !== MOBILE_DIGITS) return `Mobile Number must contain exactly ${MOBILE_DIGITS} digits.`;
  return null;
}

export function validatePassword(value: string): string | null {
  if (!value) return 'Password is required.';
  if (value.length < PWD_MIN_LENGTH) return 'Password must be at least 8 characters.';
  if (
    !PWD_UPPER.test(value) ||
    !PWD_LOWER.test(value) ||
    !PWD_DIGIT.test(value) ||
    !PWD_SPECIAL.test(value)
  ) {
    return 'Password must contain uppercase, lowercase, number and special character.';
  }
  return null;
}

export function validateAge(value: string | number): string | null {
  const num = typeof value === 'number' ? value : parseInt(String(value).trim(), 10);
  if (!value && value !== 0) return 'Age is required.';
  if (isNaN(num)) return 'Age must be a valid number.';
  if (num < AGE_MIN || num > AGE_MAX) return `Age must be between ${AGE_MIN} and ${AGE_MAX}.`;
  return null;
}

export function validateExperience(value: string | number): string | null {
  const str = String(value ?? '').trim();
  if (!str) return 'Years of Experience is required.';
  if (/[^0-9]/.test(str)) return 'Please enter a valid experience value.';
  const num = parseInt(str, 10);
  if (isNaN(num)) return 'Please enter a valid experience value.';
  if (num < 0) return 'Years of Experience cannot be negative.';
  if (num > EXP_MAX) return `Years of Experience cannot exceed ${EXP_MAX}.`;
  return null;
}

export function validateCommittedDays(value: string | number): string | null {
  const str = String(value ?? '').trim();
  if (!str) return 'Please provide Training Availability.';
  if (/[^0-9]/.test(str)) return 'Please provide Training Availability.';
  const num = parseInt(str, 10);
  if (isNaN(num) || num < DAYS_MIN || num > DAYS_MAX) {
    return `Please provide Training Availability (${DAYS_MIN}–${DAYS_MAX} days).`;
  }
  return null;
}

export function validateGender(value: string): string | null {
  if (!value?.trim()) return 'Please select your Gender.';
  return null;
}

export function validateRole(value: string): string | null {
  if (!value?.trim()) return 'Please select your Onboarding Role Type.';
  return null;
}

export function validateSpecialty(value: string): string | null {
  if (!value?.trim()) return 'Please select your Primary Clinical Specialty.';
  return null;
}

export function validateRegNumber(value: string): string | null {
  if (!value?.trim()) return 'Council Registration Number is required.';
  return null;
}

export function validateAreasOfInterest(values: string[]): string | null {
  if (!values || values.length === 0) return 'Please select at least one Area of Interest.';
  return null;
}

export function validatePreferredGeography(values: string[]): string | null {
  if (!values || values.length === 0) return 'Please select at least one Preferred Service Geography.';
  return null;
}

// ── Full-payload validator ────────────────────────────────────────────────────
/**
 * Validates the entire volunteer registration payload.
 * Returns { valid: true } when all checks pass.
 * Returns { valid: false, errors: { field: message } } otherwise.
 */
export function validateVolunteerPayload(body: Record<string, any>): {
  valid: boolean;
  errors: ValidationErrors;
} {
  const errors: ValidationErrors = {};

  const set = (field: string, msg: string | null) => {
    if (msg) errors[field] = msg;
  };

  set('name',                validateFullName(body.name));
  set('email',               validateEmail(body.email));
  set('mobile',              validateMobile(body.mobile));
  set('password',            validatePassword(body.password));
  set('gender',              validateGender(body.gender));
  set('role',                validateRole(body.role));
  set('specialty',           validateSpecialty(body.specialty));
  set('regNumber',           validateRegNumber(body.regNumber));
  set('age',                 validateAge(body.age));
  set('experience',          validateExperience(body.experience));
  set('committedDays',       validateCommittedDays(body.committedDays));
  set('areasOfInterest',     validateAreasOfInterest(body.areasOfInterest));
  set('preferredGeography',  validatePreferredGeography(body.preferredGeography));

  return Object.keys(errors).length === 0
    ? { valid: true, errors: {} }
    : { valid: false, errors };
}
