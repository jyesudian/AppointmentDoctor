import Link from 'next/link';

export default function RegulatoryPage() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans antialiased flex flex-col">
      {/* Top Header */}
      <header className="bg-slate-950 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link href="/" className="flex items-center space-x-3 cursor-pointer">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-100/10">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 10.5V20a2 2 0 01-2 2H7a2 2 0 01-2-2v-9.5m14 0V9a2 2 0 00-2-2h-2m-4-3a2 2 0 00-2 2v3M5 10.5V9a2 2 0 012-2h2m0 0V4a2 2 0 012-2h2a2 2 0 012 2v3m-6 0h6M9 20h6" />
                </svg>
              </div>
              <span className="text-xl font-extrabold tracking-tight text-white">Avodani</span>
            </Link>
            <Link href="/" className="text-xs font-semibold px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors">
              ← Return Home
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-16 flex-1 space-y-12">
        <div className="space-y-4">
          <span className="bg-amber-500/10 text-amber-400 font-mono text-[10px] uppercase tracking-widest px-3 py-1 rounded-full border border-amber-500/20">
            Regulator Compliance Registry
          </span>
          <h1 className="text-3xl md:text-4xl font-black text-white leading-tight">
            Regulatory Compliance Framework & Guidelines
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed max-w-2xl">
            Avodani operates in strict compliance with public healthcare directives and licensing guidelines. All practitioners onboarded are audited for active clinical credentials.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
          <div className="p-6 bg-slate-950/50 border border-slate-800 rounded-2xl space-y-3">
            <span className="text-2xl">🛡️</span>
            <h4 className="font-extrabold text-white text-base">Medical Council Verification</h4>
            <p className="text-slate-400 text-xs leading-relaxed">
              Every registering volunteer must submit their active state registration number and medical license document. Our administrators audit submissions against the official Medical Council registers before allowing deployments.
            </p>
          </div>

          <div className="p-6 bg-slate-950/50 border border-slate-800 rounded-2xl space-y-3">
            <span className="text-2xl">📋</span>
            <h4 className="font-extrabold text-white text-base">Clinical Audit Trails</h4>
            <p className="text-slate-400 text-xs leading-relaxed">
              Our real-time Check-in Manager logs attendance and clinical hours during community campaigns. These system metrics provide a secure audit log for regulatory compliance reporting and institutional transparency.
            </p>
          </div>

          <div className="p-6 bg-slate-950/50 border border-slate-800 rounded-2xl space-y-3">
            <span className="text-2xl">🔐</span>
            <h4 className="font-extrabold text-white text-base">Practitioner Privacy</h4>
            <p className="text-slate-400 text-xs leading-relaxed">
              Volunteer verification documents (medical license scans, degree certificates) are stored in secure Supabase storage buckets with strict Row Level Security (RLS) policies. Only the respective doctor and verified admins have access.
            </p>
          </div>

          <div className="p-6 bg-slate-950/50 border border-slate-800 rounded-2xl space-y-3">
            <span className="text-2xl">⏱️</span>
            <h4 className="font-extrabold text-white text-base">Day-of Attendance Integrity</h4>
            <p className="text-slate-400 text-xs leading-relaxed">
              To preserve data integrity, attendance check-ins are restricted. Administrators can only register volunteer check-ins and check-outs on or after the scheduled start date of the active campaign.
            </p>
          </div>
        </div>

        <div className="p-6 bg-indigo-950/20 border border-indigo-900/30 rounded-2xl space-y-2">
          <h4 className="font-bold text-indigo-400 text-sm uppercase tracking-wide">Secure Audit State: Active</h4>
          <p className="text-slate-400 text-xs leading-relaxed">
            All modifications to camps, deployment rosters, and registration status triggers automatic database entries. The Administrative Control Center locked logs are regulatory-ready for external healthcare audits.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-900 py-6 text-center text-slate-500 text-xs mt-auto">
        <p>© 2026 Avodani. Regulatory Compliance Platform.</p>
      </footer>
    </div>
  );
}
