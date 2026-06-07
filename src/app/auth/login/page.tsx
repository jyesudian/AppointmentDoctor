'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

export default function VolunteerLogin() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Simulated accounts list to match the prototype functionality.
  // These accounts are seeded in auth.users with the password "password123".
  const simulatedDoctors = [
    { name: 'Dr. Ramesh Kumar', role: 'Doctor', specialty: 'Cardiology', email: 'ramesh.kumar@mednet.org', avatar: '👨‍⚕️', status: 'Approved' },
    { name: 'Dr. Farhana Ali', role: 'Doctor', specialty: 'Pediatrics', email: 'f.ali@pediacare.in', avatar: '👩‍⚕️', status: 'Approved' },
    { name: 'Nurse Shanthi Pillai', role: 'Nurse', specialty: 'General Medicine', email: 'shanthi.pillai@hosp.org', avatar: '👩‍⚕️', status: 'Approved' },
    { name: 'Dr. Suresh Rao', role: 'Doctor', specialty: 'Orthopedics', email: 'suresh.rao@orthoclinic.com', avatar: '👨‍⚕️', status: 'Approved' },
    { name: 'Dr. Anjali Desai', role: 'Doctor', specialty: 'Dermatology', email: 'anjali.desai@skincare.org', avatar: '👩‍⚕️', status: 'Pending' },
  ];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { data, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (loginError) {
        throw loginError;
      }

      router.push('/volunteer/dashboard');
    } catch (err: any) {
      setError(err.message || 'Invalid login credentials.');
    } finally {
      setLoading(false);
    }
  };

  const simulateLogin = (targetEmail: string) => {
    setEmail(targetEmail);
    setPassword('password123');
    setError(null);
    // Submit using state-driven approach or trigger form login
    setTimeout(async () => {
      setLoading(true);
      try {
        const { error: loginError } = await supabase.auth.signInWithPassword({
          email: targetEmail,
          password: 'password123',
        });
        if (loginError) throw loginError;
        router.push('/volunteer/dashboard');
      } catch (err: any) {
        setError(err.message || 'Simulation login failed.');
        setLoading(false);
      }
    }, 100);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans antialiased">
      
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center text-white font-bold shadow-md shadow-teal-100">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 10.5V20a2 2 0 01-2 2H7a2 2 0 01-2-2v-9.5m14 0V9a2 2 0 00-2-2h-2m-4-3a2 2 0 00-2 2v3M5 10.5V9a2 2 0 012-2h2m0 0V4a2 2 0 012-2h2a2 2 0 012 2v3m-6 0h6M9 20h6" />
                </svg>
              </div>
              <div>
                <span className="text-xl font-extrabold tracking-tight text-slate-900">DocSer</span>
              </div>
            </Link>
            <Link href="/" className="text-xs text-slate-500 hover:text-slate-800 font-bold">← Back to Landing</Link>
          </div>
        </div>
      </header>

      {/* Login Form Container */}
      <main className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-xl p-8 space-y-6 animate-fade-in">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold text-xl mx-auto">
              🏥
            </div>
            <h3 className="text-xl font-bold text-slate-900">Volunteer Portal Login</h3>
            <p className="text-xs text-slate-500">Access your availability, preferences, and invitations</p>
          </div>

          {error && (
            <div className="bg-rose-50 border border-rose-100 text-rose-700 text-xs p-3 rounded-lg text-center font-medium">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-600 font-bold mb-1">Email Address</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2.5 border rounded-lg focus:ring-1 focus:ring-teal-500 focus:outline-none bg-slate-50 text-slate-800"
                placeholder="doctor@hospital.org"
                required
                disabled={loading}
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-slate-600 font-bold">Password</label>
                <Link href="/auth/forgot-password" className="text-[10px] text-teal-600 hover:text-teal-700 font-bold">
                  Forgot Password?
                </Link>
              </div>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-2.5 border rounded-lg focus:ring-1 focus:ring-teal-500 focus:outline-none bg-slate-50 text-slate-800"
                placeholder="••••••••"
                required
                disabled={loading}
              />
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold uppercase rounded-xl shadow-md transition-colors disabled:opacity-50 text-xs tracking-wider"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>

          <div className="relative flex py-2 items-center text-xs">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink mx-4 text-slate-400 font-bold">OR</span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          <Link 
            href="/auth/signup"
            className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold uppercase rounded-xl transition-colors text-center block text-xs tracking-wider"
          >
            📝 Enlist / Register as New Volunteer
          </Link>

          {/* Simulated Login Section */}
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <label className="block text-[10px] font-extrabold uppercase text-slate-400 text-center tracking-wider">
              Simulate Login with Seeded Profile:
            </label>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {simulatedDoctors.map((doc, idx) => (
                <button
                  key={idx}
                  onClick={() => simulateLogin(doc.email)}
                  disabled={loading}
                  className="w-full p-2.5 border border-slate-200 rounded-xl hover:border-teal-500 hover:bg-teal-50/20 text-left transition-all flex items-center justify-between text-xs"
                >
                  <div className="flex items-center space-x-2.5">
                    <span className="text-xl">{doc.avatar}</span>
                    <div>
                      <h5 className="font-bold text-slate-800 text-[11px]">{doc.name}</h5>
                      <p className="text-[9px] text-slate-400">{doc.specialty} • {doc.role}</p>
                    </div>
                  </div>
                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                    doc.status === 'Approved' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                  }`}>
                    {doc.status}
                  </span>
                </button>
              ))}
            </div>
          </div>

        </div>
      </main>

      <footer className="bg-slate-900 border-t border-slate-800 py-6 text-center text-slate-400 text-xs">
        <p>© 2026 DocSer. Empowering healthcare campaigns.</p>
      </footer>
    </div>
  );
}
