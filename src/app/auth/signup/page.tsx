'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

export default function VolunteerSignup() {
  const router = useRouter();
  const supabase = createClient();

  const [formData, setFormData] = useState({
    name: '',
    gender: 'Male',
    role: 'Doctor',
    email: '',
    password: '',
    mobile: '',
    regNumber: '',
    specialty: 'General Medicine',
    experience: '5',
    committedDays: '10',
  });

  const [degreeFile, setDegreeFile] = useState<File | null>(null);
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!formData.name || !formData.regNumber || !formData.email || !formData.password) {
      setError('Please fill in Name, Registration Number, Email, and Password.');
      setLoading(false);
      return;
    }

    if (!degreeFile || !licenseFile) {
      setError('Please upload both your Medical Degree and Medical Council License copies.');
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
            mobile: formData.mobile,
            committedDays: parseInt(formData.committedDays) || 10,
            status: 'Pending', // New users always register as Pending
            avatar: formData.role === 'Nurse' ? '👩‍⚕️' : '👨‍⚕️',
            locationPriorities: ['Koya'], // Default location priority
            availableMonths: { Jul: [10, 11, 25], Aug: [14, 15] }, // Default calendar slots
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

      // 2. Upload Medical Degree to Supabase Storage
      let degreePath = '';
      const degreeExt = degreeFile.name.split('.').pop();
      const degreeName = `degree_${Date.now()}.${degreeExt}`;
      const degreeFullPath = `${userId}/${degreeName}`;

      const { error: degreeUploadError } = await supabase.storage
        .from('verification-documents')
        .upload(degreeFullPath, degreeFile);

      if (degreeUploadError) {
        throw new Error(`Failed to upload Medical Degree: ${degreeUploadError.message}`);
      }
      degreePath = degreeFullPath;

      // 3. Upload License to Supabase Storage
      let licensePath = '';
      const licenseExt = licenseFile.name.split('.').pop();
      const licenseName = `license_${Date.now()}.${licenseExt}`;
      const licenseFullPath = `${userId}/${licenseName}`;

      const { error: licenseUploadError } = await supabase.storage
        .from('verification-documents')
        .upload(licenseFullPath, licenseFile);

      if (licenseUploadError) {
        throw new Error(`Failed to upload License Copy: ${licenseUploadError.message}`);
      }
      licensePath = licenseFullPath;

      // 4. Update profiles row with uploaded file storage paths
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          degree_file_path: degreePath,
          license_file_path: licensePath
        })
        .eq('id', userId);

      if (updateError) {
        throw new Error(`Profile initialization failed: ${updateError.message}`);
      }

      // Add a fallback metadata update for safety
      await supabase.auth.updateUser({
        data: {
          degreeFilePath: degreePath,
          licenseFilePath: licensePath
        }
      });

      setSuccess(true);
      setTimeout(() => {
        // Redirect to volunteer dashboard which handles session checking
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
                <span className="text-xl font-extrabold tracking-tight text-slate-900">Avodah</span>
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
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Full Name (with Prefix)</label>
                  <input 
                    type="text" 
                    name="name"
                    placeholder="Dr. Rajesh Kumar" 
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-600 focus:outline-none"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Gender</label>
                  <select 
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-600 focus:outline-none"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Non-binary">Non-binary / Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Onboarding Role Type</label>
                  <select 
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-600 focus:outline-none"
                  >
                    <option value="Doctor">Volunteer Doctor (MD / MBBS / Equivalent)</option>
                    <option value="Nurse">Volunteer Nurse (RN / GNM / Equivalent)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Email Address</label>
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
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Password</label>
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Mobile Contact Phone Number</label>
                  <input 
                    type="text" 
                    name="mobile"
                    placeholder="+91 94451 XXXXX" 
                    value={formData.mobile}
                    onChange={handleChange}
                    className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-600 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Clinical Professional Qualifications */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/60 space-y-4">
              <h4 className="font-bold text-slate-800 text-sm">2. Professional Licensing Details</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Council Registration Number</label>
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
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Primary Clinical Specialty</label>
                  <select 
                    name="specialty"
                    value={formData.specialty}
                    onChange={handleChange}
                    className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-600 focus:outline-none"
                  >
                    <option value="General Medicine">General Medicine</option>
                    <option value="Pediatrics">Pediatrics</option>
                    <option value="Orthopedics">Orthopedics</option>
                    <option value="Cardiology">Cardiology</option>
                    <option value="Dermatology">Dermatology</option>
                    <option value="Gynecology">Gynecology</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Years Active Experience</label>
                  <input 
                    type="number" 
                    name="experience"
                    value={formData.experience}
                    onChange={handleChange}
                    className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Proposed Annual Commitment (Days)</label>
                  <input 
                    type="number" 
                    name="committedDays"
                    value={formData.committedDays}
                    onChange={handleChange}
                    className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-600 focus:outline-none"
                    placeholder="10"
                  />
                  <span className="text-[10px] text-slate-400 block mt-1">Goal benchmark tracker</span>
                </div>
              </div>
            </div>

            {/* Dynamic Certification Uploads */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/60 space-y-4">
              <h4 className="font-bold text-slate-800 text-sm">3. Verification Document Uploads</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Document 1 */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 text-center flex flex-col items-center justify-center">
                  <span className="text-2xl block mb-2">📜</span>
                  <h5 className="font-bold text-xs text-slate-700">Medical Degree / Equivalent Certification</h5>
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
                  <h5 className="font-bold text-xs text-slate-700">Medical Council License Copy</h5>
                  <p className="text-[10px] text-rose-500 font-semibold mt-1 mb-4">Upload PDF, JPG, PNG up to 2MB size limit</p>
                  
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
        <p>© 2026 Avodah. Empowering healthcare campaigns.</p>
      </footer>
    </div>
  );
}
