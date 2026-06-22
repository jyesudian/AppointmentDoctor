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

  const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState<string | null>(null);
  const [degreeFile, setDegreeFile] = useState<File | null>(null);
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

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
    setFormData({ ...formData, [e.target.name]: e.target.value });
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

    if (!formData.name.trim()) {
      setError('Please enter your Full Name.');
      setLoading(false);
      return;
    }

    const nameRegex = /^[a-zA-Z\s.]+$/;
    if (!nameRegex.test(formData.name)) {
      setError('Full Name must contain only alphabets, spaces, and periods (.).');
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

    if (!formData.email.trim()) {
      setError('Please enter your Email Address.');
      setLoading(false);
      return;
    }

    if (!formData.password) {
      setError('Please enter a Password.');
      setLoading(false);
      return;
    }

    if (!formData.mobile.trim()) {
      setError('Please enter your Mobile Contact Phone Number.');
      setLoading(false);
      return;
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

    if (!formData.experience.trim()) {
      setError('Please enter your Years Active Experience.');
      setLoading(false);
      return;
    }

    const expNum = parseInt(formData.experience);
    if (isNaN(expNum) || expNum < 0 || expNum > 80) {
      setError('Years Active Experience must be a valid non-negative number.');
      setLoading(false);
      return;
    }

    if (showSpecialtyDesc && !formData.specialtyDescription.trim()) {
      setError('Specialty Description is required when Other Specialty is selected.');
      setLoading(false);
      return;
    }

    if (!formData.committedDays.trim()) {
      setError('Please enter your Tentative Annual Commitment.');
      setLoading(false);
      return;
    }

    const daysNum = parseInt(formData.committedDays);
    if (isNaN(daysNum) || daysNum < 1 || daysNum > 365) {
      setError('Tentative Annual Commitment must be a valid number of days (1-365).');
      setLoading(false);
      return;
    }

    if (formData.areasOfInterest.length === 0) {
      setError('Please select at least one Area of Interest.');
      setLoading(false);
      return;
    }

    if (formData.preferredGeography.length === 0) {
      setError('Please select at least one Preferred Service Geography.');
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
      // 1. Sign up the user via Supabase Auth
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
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
      setError(err.message || 'An error occurred during registration.');
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
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Full Name (with Prefix) <span className="text-rose-500">*</span></label>
                  <input 
                    type="text" 
                    name="name"
                    placeholder="Dr. Rajesh Kumar" 
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-600 focus:outline-none"
                    required
                    pattern="[a-zA-Z\s.]+"
                    title="Full Name must contain only alphabets, spaces, and periods (.)"
                  />
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
                  <input 
                    type="email" 
                    name="email"
                    placeholder="doctor@hospital.org" 
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-600 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Password <span className="text-rose-500">*</span></label>
                  <input 
                    type="password" 
                    name="password"
                    placeholder="••••••••" 
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-600 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Mobile Contact Phone Number <span className="text-rose-500">*</span></label>
                  <input 
                    type="text" 
                    name="mobile"
                    placeholder="+91 94451 XXXXX" 
                    value={formData.mobile}
                    onChange={handleChange}
                    className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-600 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Age (Years) <span className="text-rose-500">*</span></label>
                  <input 
                    type="number" 
                    name="age"
                    placeholder="35" 
                    min="18"
                    max="100"
                    value={formData.age}
                    onChange={handleChange}
                    className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-600 focus:outline-none"
                    required
                  />
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
                    name="regNumber"
                    placeholder="MC-2026-XXXX" 
                    value={formData.regNumber}
                    onChange={handleChange}
                    className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-600 focus:outline-none"
                    required
                  />
                  <span className="text-[10px] text-slate-400 block mt-1">Standard format for licensing check</span>
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Primary Clinical Specialty <span className="text-rose-500">*</span></label>
                  <select 
                    name="specialty"
                    value={formData.specialty}
                    onChange={handleChange}
                    className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-600 focus:outline-none"
                    required
                  >
                    <option value="">Select Primary Clinical Specialty</option>
                    {Object.entries(specialtiesByCategory).map(([category, items]) => (
                      <optgroup key={category} label={category}>
                        {items.map(item => (
                          <option key={item.id} value={item.name}>{item.name}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Years Active Experience <span className="text-rose-500">*</span></label>
                  <input 
                    type="number" 
                    name="experience"
                    value={formData.experience}
                    onChange={handleChange}
                    className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-600 focus:outline-none"
                    required
                  />
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
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Tentative Annual Commitment (Days) <span className="text-rose-500">*</span></label>
                  <input 
                    type="number" 
                    name="committedDays"
                    value={formData.committedDays}
                    onChange={handleChange}
                    className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-600 focus:outline-none"
                    placeholder="10"
                    required
                  />
                  <span className="text-[10px] text-slate-400 block mt-1">
                    Estimated number of days you may be available annually for mission assignments. This can be adjusted later.
                  </span>
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
            <div className="flex justify-end space-x-3 pt-2">
              <button 
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-indigo-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
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
