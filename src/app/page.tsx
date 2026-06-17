'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';

export default function LandingPage() {
  const [stats, setStats] = useState({
    doctors: 0,
    nurses: 0,
    campsCompleted: 0,
    patientsServed: 0,
    locations: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const supabase = createClient();
        
        // 1. Fetch profiles
        const { data: profiles, error: pError } = await supabase
          .from('profiles')
          .select('role');
          
        // 2. Fetch camps
        const { data: camps, error: cError } = await supabase
          .from('camps')
          .select('date, expected_patients');
          
        // 3. Fetch locations
        const { data: locations, error: lError } = await supabase
          .from('preferred_locations')
          .select('id');
          
        if (!pError && !cError && !lError && profiles && camps && locations) {
          const docsCount = profiles.filter((p: any) => p.role && p.role.includes('Doctor')).length;
          const nursesCount = profiles.filter((p: any) => p.role && p.role.includes('Nurse')).length;
          
          const todayStr = new Date().toISOString().split('T')[0];
          const completedCamps = camps.filter((c: any) => c.date < todayStr);
          const completedCampsCount = completedCamps.length;
          const patientsCount = completedCamps.reduce((sum: number, c: any) => sum + (c.expected_patients || 0), 0);
          
          setStats({
            doctors: docsCount,
            nurses: nursesCount,
            campsCompleted: completedCampsCount,
            patientsServed: patientsCount,
            locations: locations.length
          });
        }
      } catch (err) {
        console.error('Error fetching landing page stats:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans antialiased">
      
      {/* --- TOP BRANDED HEALTHCARE BAR --- */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            
            {/* Logo and Slogan */}
            <Link href="/" className="flex items-center space-x-3 cursor-pointer">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-100">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <div>
                <span className="text-xl font-extrabold tracking-tight text-slate-900">Avodah</span>
                <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                  Avodah - Stewards of Grace
                </span>
              </div>
            </Link>
            
            {/* Persona Switcher Menu */}
            <div className="flex items-center space-x-2">
              <Link
                href="/"
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 text-white shadow-sm transition-colors"
              >
                🌐 Home
              </Link>
              <Link
                href="/auth/login"
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
              >
                🏥 Volunteer Portal
              </Link>
              <Link
                href="/admin/login"
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
              >
                🔑 Admin Terminal
              </Link>
            </div>

          </div>
        </div>
      </header>

      {/* --- HERO SECTION --- */}
      <section className="bg-gradient-to-br from-indigo-950 via-indigo-900 to-slate-950 text-white py-24 px-4 text-center relative overflow-hidden flex-1 flex flex-col justify-center">
        <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        
        <div className="max-w-4xl mx-auto relative z-10 space-y-6">
          <span className="bg-amber-500/20 text-amber-300 font-bold text-xs uppercase tracking-widest px-4 py-1.5 rounded-full border border-amber-500/30">
            Christian Missions Healthcare Volunteer Alliance
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">
            Contribute Your Expertise To <br/>
            <span className="text-amber-400">Community Healthcare Camps</span>
          </h1>
          <p className="text-slate-300 text-base md:text-lg max-w-2xl mx-auto font-normal leading-relaxed">
            Avodah connects medical practitioners with vetted rural community health missions. 
            In the spirit of <em>Avodah</em>—serving others with our God-given talents as acts of worship (1 Peter 4:10)—onboard seamlessly, declare your available calendars, and track your volunteer footprint.
          </p>
        </div>
      </section>

      {/* --- STATISTICS SECTION --- */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-20 w-full">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-8 grid grid-cols-2 lg:grid-cols-5 gap-6 text-center">
          <div>
            <span className="block text-3xl md:text-4xl font-extrabold text-indigo-600">
              {loading ? (
                <span className="inline-block w-12 h-8 bg-slate-100 animate-pulse rounded"></span>
              ) : (
                `${stats.doctors}`
              )}
            </span>
            <span className="text-xs font-semibold text-slate-500 uppercase mt-1 block">Doctors Registered</span>
          </div>
          <div>
            <span className="block text-3xl md:text-4xl font-extrabold text-indigo-600">
              {loading ? (
                <span className="inline-block w-12 h-8 bg-slate-100 animate-pulse rounded"></span>
              ) : (
                `${stats.nurses}`
              )}
            </span>
            <span className="text-xs font-semibold text-slate-500 uppercase mt-1 block">Nurses Enlisted</span>
          </div>
          <div>
            <span className="block text-3xl md:text-4xl font-extrabold text-indigo-600">
              {loading ? (
                <span className="inline-block w-12 h-8 bg-slate-100 animate-pulse rounded"></span>
              ) : (
                `${stats.campsCompleted}`
              )}
            </span>
            <span className="text-xs font-semibold text-slate-500 uppercase mt-1 block">Camps Completed</span>
          </div>
          <div>
            <span className="block text-3xl md:text-4xl font-extrabold text-indigo-600">
              {loading ? (
                <span className="inline-block w-20 h-8 bg-slate-100 animate-pulse rounded"></span>
              ) : (
                `${stats.patientsServed.toLocaleString()}`
              )}
            </span>
            <span className="text-xs font-semibold text-slate-500 uppercase mt-1 block">Patients Served</span>
          </div>
          <div className="col-span-2 lg:col-span-1">
            <span className="block text-3xl md:text-4xl font-extrabold text-indigo-600">
              {loading ? (
                <span className="inline-block w-12 h-8 bg-slate-100 animate-pulse rounded"></span>
              ) : (
                `${stats.locations}`
              )}
            </span>
            <span className="text-xs font-semibold text-slate-500 uppercase mt-1 block">Rural Field Locations</span>
          </div>
        </div>
      </section>

      {/* --- HOW IT WORKS TIMELINE --- */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 space-y-12 w-full">
        <div className="text-center space-y-2">
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900">Seamless Volunteer Journey</h2>
          <p className="text-slate-500 text-sm max-w-xl mx-auto">
            From initial registration to certified clinical execution, we respect your time and protect safety integrity.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {[
            { step: '01', title: 'Onboard & Register', desc: 'Provide professional medical certification registry, specialization data, and credentials.' },
            { step: '02', statusBadge: 'Regulator-Grade Check', title: 'Verify Status', desc: 'Our administrators verify registration numbers within the Medical Council guidelines.' },
            { step: '03', title: 'Plan Availability', desc: 'Select specific dates and set yearly service commitment limits dynamically on your planner.' },
            { step: '04', title: 'Participate & Track', desc: 'Execute camps, complete clinic hours, and check impact scorecard metrics.' }
          ].map((item, idx) => (
            <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4 hover:shadow-lg transition-all relative">
              <div className="w-12 h-12 bg-amber-50 text-amber-800 font-extrabold text-lg rounded-xl flex items-center justify-center">
                {item.step}
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-base flex items-center">
                  {item.title} 
                </h4>
                {item.statusBadge && (
                  <span className="inline-block bg-indigo-50 text-indigo-700 font-bold text-[9px] uppercase px-1.5 py-0.5 rounded mt-1">
                    {item.statusBadge}
                  </span>
                )}
                <p className="text-slate-500 text-xs leading-relaxed mt-2">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* --- SITE FOOTER --- */}
      <footer className="bg-slate-900 border-t border-slate-800 py-10 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0 text-slate-400 text-xs">
            
            <div className="flex items-center space-x-2">
              <span className="text-white font-extrabold tracking-tight">Avodah</span>
              <span>© 2026. All Rights Reserved. Empowering healthcare campaigns.</span>
            </div>

            <div className="flex space-x-6">
              <Link href="/regulatory" className="hover:text-white transition-colors">Regulatory Compliance Registry</Link>
              <Link href="/auth/signup" className="hover:text-white transition-colors">Volunteer Onboarding</Link>
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy Principles</Link>
            </div>

          </div>
        </div>
      </footer>

    </div>
  );
}
