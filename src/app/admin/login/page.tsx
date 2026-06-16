'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

export default function AdminLogin() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState('jyesudian@thesentinelark.com');
  const [password, setPassword] = useState('Luke@0101');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // 1. Authenticate with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        throw authError;
      }

      if (!authData.user) {
        throw new Error('Could not retrieve user data.');
      }

      // 2. Double-check if user ID exists in public.admins table
      const { data: adminRecord, error: adminError } = await supabase
        .from('admins')
        .select('id')
        .eq('id', authData.user.id)
        .single();

      if (adminError || !adminRecord) {
        // Sign out immediately if not authorized as an admin
        await supabase.auth.signOut();
        throw new Error('Access Denied: You are not authorized as an administrator.');
      }

      // 3. Navigate to admin dashboard
      router.push('/admin/dashboard');
    } catch (err: any) {
      setError(err.message || 'Authentication failed.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans antialiased">
      
      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-900 border-b border-slate-800 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-100">
                🔑
              </div>
              <div>
                <span className="text-xl font-extrabold tracking-tight text-white">Avodah Admin</span>
              </div>
            </Link>
            <Link href="/" className="text-xs text-slate-400 hover:text-white font-bold">← Back to Landing</Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xl mx-auto">
              🛠️
            </div>
            <h3 className="text-xl font-bold text-white">NGO / Admin Portal Sign-In</h3>
            <p className="text-xs text-slate-400">Authorized personnel secure checkpoint</p>
          </div>

          {error && (
            <div className="bg-rose-950 border border-rose-900 text-rose-300 text-xs p-3 rounded-lg text-center font-medium">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-400 font-bold mb-1">Administrative Email</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2.5 border border-slate-700 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-slate-900 text-slate-100"
                placeholder="admin@avodah.org"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-slate-400 font-bold mb-1">Passkey Word</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-2.5 border border-slate-700 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-slate-900 text-slate-100"
                placeholder="••••••••"
                required
                disabled={loading}
              />
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold uppercase rounded-xl shadow-lg transition-colors disabled:opacity-50 text-xs tracking-wider"
            >
              {loading ? 'Verifying Credentials...' : 'Verify Credentials & Authenticate'}
            </button>
          </form>
        </div>
      </main>

      <footer className="bg-slate-950 border-t border-slate-900 py-6 text-center text-slate-500 text-xs">
        <p>© 2026 Avodah. Administrative Control Center.</p>
      </footer>
    </div>
  );
}
