'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

export default function ResetPassword() {
  const router = useRouter();
  const supabase = createClient();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      setLoading(false);
      return;
    }

    try {
      const { error: resetError } = await supabase.auth.updateUser({
        password: password,
      });

      if (resetError) {
        throw resetError;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/auth/login');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to update password. Session may have expired.');
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
              <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center text-white font-bold shadow-md shadow-teal-100">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 10.5V20a2 2 0 01-2 2H7a2 2 0 01-2-2v-9.5m14 0V9a2 2 0 00-2-2h-2m-4-3a2 2 0 00-2 2v3M5 10.5V9a2 2 0 012-2h2m0 0V4a2 2 0 012-2h2a2 2 0 012 2v3m-6 0h6M9 20h6" />
                </svg>
              </div>
              <div>
                <span className="text-xl font-extrabold tracking-tight text-slate-900">DocSer</span>
              </div>
            </Link>
          </div>
        </div>
      </header>

      {/* Form Container */}
      <main className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-xl p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold text-xl mx-auto border border-teal-100">
              🔒
            </div>
            <h3 className="text-xl font-bold text-slate-900">Define New Password</h3>
            <p className="text-xs text-slate-500">Provide a new secure credential for your volunteer account</p>
          </div>

          {error && (
            <div className="bg-rose-50 border border-rose-100 text-rose-700 text-xs p-3 rounded-lg text-center font-medium">
              ⚠️ {error}
            </div>
          )}

          {success ? (
            <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs p-4 rounded-xl flex items-start space-x-2">
              <span>✓</span>
              <div>
                <span className="font-bold">Password Updated Successfully!</span> Redirecting you back to the login portal...
              </div>
            </div>
          ) : (
            <form onSubmit={handlePasswordReset} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-600 font-bold mb-1">New Password</label>
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

              <div>
                <label className="block text-slate-600 font-bold mb-1">Confirm New Password</label>
                <input 
                  type="password" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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
                {loading ? 'Updating Password...' : 'Save & Update Password'}
              </button>
            </form>
          )}

        </div>
      </main>

      <footer className="bg-slate-900 border-t border-slate-800 py-6 text-center text-slate-400 text-xs">
        <p>© 2026 DocSer. Empowering healthcare campaigns.</p>
      </footer>
    </div>
  );
}
