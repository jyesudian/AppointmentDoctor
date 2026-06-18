'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';

export default function ForgotPassword() {
  const supabase = createClient();

  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (resetError) {
        throw resetError;
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send password reset email.');
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
            <Link href="/auth/login" className="text-xs text-slate-500 hover:text-slate-800 font-bold">← Back to Login</Link>
          </div>
        </div>
      </header>

      {/* Form Container */}
      <main className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-xl p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-indigo-600 flex items-center justify-center font-bold text-xl mx-auto border border-amber-200">
              🔑
            </div>
            <h3 className="text-xl font-bold text-slate-900">Password Reset Request</h3>
            <p className="text-xs text-slate-500">Enter your email and we'll dispatch a secure recovery link</p>
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
                <span className="font-bold">Reset Link Dispatched!</span> Check your email for a message containing your password recovery link.
              </div>
            </div>
          ) : (
            <form onSubmit={handleResetRequest} className="space-y-4 text-xs">
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

              <button 
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold uppercase rounded-xl shadow-md transition-colors disabled:opacity-50 text-xs tracking-wider"
              >
                {loading ? 'Sending Request...' : 'Send Recovery Link'}
              </button>
            </form>
          )}

          <div className="text-center text-xs">
            <Link href="/auth/login" className="text-indigo-600 hover:text-amber-800 font-bold">
              Return to Login Portal
            </Link>
          </div>

        </div>
      </main>

      <footer className="bg-slate-900 border-t border-slate-800 py-6 text-center text-slate-400 text-xs">
        <p>© 2026 Avodani. Empowering healthcare campaigns.</p>
      </footer>
    </div>
  );
}
