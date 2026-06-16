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
              <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-100">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <div>
                <span className="text-xl font-extrabold tracking-tight text-slate-900">Avodah</span>
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
            <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xl mx-auto">
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
                className="w-full p-2.5 border rounded-lg focus:ring-1 focus:ring-indigo-600 focus:outline-none bg-slate-50 text-slate-800"
                placeholder="doctor@hospital.org"
                required
                disabled={loading}
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-slate-600 font-bold">Password</label>
                <Link href="/auth/forgot-password" className="text-[10px] text-indigo-600 hover:text-amber-800 font-bold">
                  Forgot Password?
                </Link>
              </div>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-2.5 border rounded-lg focus:ring-1 focus:ring-indigo-600 focus:outline-none bg-slate-50 text-slate-800"
                placeholder="••••••••"
                required
                disabled={loading}
              />
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold uppercase rounded-xl shadow-md transition-colors disabled:opacity-50 text-xs tracking-wider"
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
        </div>
      </main>

      <footer className="bg-slate-900 border-t border-slate-800 py-6 text-center text-slate-400 text-xs">
        <p>© 2026 Avodah. Empowering healthcare campaigns.</p>
      </footer>
    </div>
  );
}
