import Link from 'next/link';

export default function PrivacyPage() {
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
          <span className="bg-indigo-500/10 text-indigo-400 font-mono text-[10px] uppercase tracking-widest px-3 py-1 rounded-full border border-indigo-500/20">
            Privacy Principles
          </span>
          <h1 className="text-3xl md:text-4xl font-black text-white leading-tight">
            Our Commitment to Privacy & Confidentiality
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed max-w-2xl">
            Avodani values the privacy of medical practitioners and volunteers. Our principles guide how we collect, store, and utilize credentialing and operational metrics securely.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
          <div className="p-6 bg-slate-950/50 border border-slate-800 rounded-2xl space-y-3">
            <span className="text-2xl">🔒</span>
            <h4 className="font-extrabold text-white text-base">Practitioner Data Encryption</h4>
            <p className="text-slate-400 text-xs leading-relaxed">
              We encrypt all clinical volunteer profile details (such as contact numbers, email addresses, and licenses) at rest and in transit. Your details are accessed securely only during matchmaking and verification operations.
            </p>
          </div>

          <div className="p-6 bg-slate-950/50 border border-slate-800 rounded-2xl space-y-3">
            <span className="text-2xl">⚡</span>
            <h4 className="font-extrabold text-white text-base">Row Level Security (RLS)</h4>
            <p className="text-slate-400 text-xs leading-relaxed">
              Our Supabase database schema strictly enforces Row Level Security. Only you (the logged-in doctor/nurse) can update your profile, check your scheduler, or manage invitations. Administrative review acts as a checked second layer.
            </p>
          </div>

          <div className="p-6 bg-slate-950/50 border border-slate-800 rounded-2xl space-y-3">
            <span className="text-2xl">🗑️</span>
            <h4 className="font-extrabold text-white text-base">Data Retention & Deletion</h4>
            <p className="text-slate-400 text-xs leading-relaxed">
              We do not store redundant copies of your professional documents. If you decide to deactivate your account or if an administrator declines onboarding, uploaded license credentials and credentials files are completely purged from storage.
            </p>
          </div>

          <div className="p-6 bg-slate-950/50 border border-slate-800 rounded-2xl space-y-3">
            <span className="text-2xl">💬</span>
            <h4 className="font-extrabold text-white text-base">Transparency in Messaging</h4>
            <p className="text-slate-400 text-xs leading-relaxed">
              All communications sent to you (such as SMS, WhatsApp, and Web Portal invites) are tracked with exact delivery channels. If a camp campaign is cancelled or changed, you will receive clear alerts explaining the updates immediately.
            </p>
          </div>
        </div>

        <div className="p-6 bg-emerald-950/20 border border-emerald-900/30 rounded-2xl space-y-2">
          <h4 className="font-bold text-emerald-400 text-sm uppercase tracking-wide">HIPAA & GDPR Best Practices</h4>
          <p className="text-slate-400 text-xs leading-relaxed">
            Avodani connects medical practitioners with community organizers. We enforce GDPR and HIPAA data handling practices. No patient medical records are stored on our servers; we only store campaign operational metrics.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-900 py-6 text-center text-slate-500 text-xs mt-auto">
        <p>© 2026 Avodani. Privacy First Platform.</p>
      </footer>
    </div>
  );
}
