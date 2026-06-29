import React, { useState, useEffect, useMemo } from 'react';

// --- INLINE DESIGN ASSETS & MOCK DATA ---
const PREFERRED_LOCATIONS_LIST = [
  { id: 'loc-1', name: 'Koya', distance: 12, region: 'East Block', priority: 1, activeCases: 340 },
  { id: 'loc-2', name: 'Belgaum', distance: 110, region: 'North Border', priority: 2, activeCases: 1200 },
  { id: 'loc-3', name: 'Mysore', distance: 145, region: 'South Plains', priority: 3, activeCases: 890 },
  { id: 'loc-4', name: 'Hubli', distance: 85, region: 'West Central', priority: 4, activeCases: 610 },
  { id: 'loc-5', name: 'Mangalore', distance: 210, region: 'Coastal Area', priority: 5, activeCases: 450 }
];

const INITIAL_DOCTORS = [
  {
    id: 'doc-1',
    name: 'Dr. Ramesh Kumar',
    role: 'Doctor',
    gender: 'Male',
    specialty: 'Cardiology',
    regNumber: 'MC-2023-8849',
    experience: 14,
    email: 'ramesh.kumar@mednet.org',
    mobile: '+91 98450 12345',
    status: 'Approved',
    committedDays: 15,
    completedDays: 11,
    locationPriorities: ['Koya', 'Belgaum', 'Mysore'],
    avatar: '👨‍⚕️',
    joinDate: '2025-02-10',
    availableMonths: { 'Jul': [4, 5, 12, 18], 'Aug': [1, 2, 15] },
    attendanceLogs: [
      { campName: 'Mysore Health Drive', date: '2026-03-12', status: 'Present' }
    ]
  },
  {
    id: 'doc-2',
    name: 'Dr. Farhana Ali',
    role: 'Doctor',
    gender: 'Female',
    specialty: 'Pediatrics',
    regNumber: 'MC-2021-4920',
    experience: 8,
    email: 'f.ali@pediacare.in',
    mobile: '+91 99012 34567',
    status: 'Approved',
    committedDays: 10,
    completedDays: 7,
    locationPriorities: ['Belgaum', 'Hubli'],
    avatar: '👩‍⚕️',
    joinDate: '2025-05-18',
    availableMonths: { 'Jul': [12, 13, 20, 21], 'Sep': [10, 11] },
    attendanceLogs: []
  },
  {
    id: 'doc-3',
    name: 'Nurse Shanthi Pillai',
    role: 'Nurse',
    gender: 'Female',
    specialty: 'General Medicine',
    regNumber: 'NC-2024-1102',
    experience: 6,
    email: 'shanthi.pillai@hosp.org',
    mobile: '+91 81234 56789',
    status: 'Approved',
    committedDays: 20,
    completedDays: 14,
    locationPriorities: ['Koya', 'Hubli', 'Mangalore'],
    avatar: '👩‍⚕️',
    joinDate: '2025-06-01',
    availableMonths: { 'Jul': [1, 2, 3, 15, 16], 'Oct': [5, 6, 7] },
    attendanceLogs: [
      { campName: 'Koya General Camp', date: '2026-04-10', status: 'Present' }
    ]
  },
  {
    id: 'doc-4',
    name: 'Dr. Suresh Rao',
    role: 'Doctor',
    gender: 'Male',
    specialty: 'Orthopedics',
    regNumber: 'MC-2018-9311',
    experience: 20,
    email: 'suresh.rao@orthoclinic.com',
    mobile: '+91 74061 98765',
    status: 'Approved',
    committedDays: 12,
    completedDays: 4,
    locationPriorities: ['Mysore', 'Mangalore'],
    avatar: '👨‍⚕️',
    joinDate: '2025-01-15',
    availableMonths: { 'Aug': [12, 13], 'Dec': [24, 25] },
    attendanceLogs: []
  },
  {
    id: 'doc-5',
    name: 'Dr. Anjali Desai',
    role: 'Doctor',
    gender: 'Female',
    specialty: 'Dermatology',
    regNumber: 'MC-2022-7561',
    experience: 5,
    email: 'anjali.desai@skincare.org',
    mobile: '+91 91123 44321',
    status: 'Pending',
    committedDays: 8,
    completedDays: 0,
    locationPriorities: ['Koya', 'Belgaum'],
    avatar: '👩‍⚕️',
    joinDate: '2026-05-30',
    availableMonths: { 'Jul': [4, 15, 29] },
    attendanceLogs: []
  }
];

const INITIAL_CAMPS = [
  {
    id: 'camp-1',
    name: 'Belgaum Diabetes & Hypertension Screening',
    location: 'Belgaum',
    date: '2026-07-12',
    month: 'Jul',
    day: 12,
    expectedPatients: 350,
    neededSpecialties: ['General Medicine', 'Cardiology'],
    neededCounts: { 'General Medicine': 1, 'Cardiology': 1, 'Nurse': 1 },
    assignedVolunteers: ['doc-1'],
    status: 'Scheduled'
  },
  {
    id: 'camp-2',
    name: 'Koya Community Pediatrics and General Camp',
    location: 'Koya',
    date: '2026-07-15',
    month: 'Jul',
    day: 15,
    expectedPatients: 500,
    neededSpecialties: ['Pediatrics', 'General Medicine'],
    neededCounts: { 'Pediatrics': 1, 'General Medicine': 1, 'Nurse': 1 },
    assignedVolunteers: ['doc-2', 'doc-3'],
    status: 'Scheduled'
  },
  {
    id: 'camp-3',
    name: 'Mangalore Coastal Geriatric Care Drive',
    location: 'Mangalore',
    date: '2026-08-20',
    month: 'Aug',
    day: 20,
    expectedPatients: 200,
    neededSpecialties: ['General Medicine', 'Orthopedics'],
    neededCounts: { 'General Medicine': 1, 'Orthopedics': 1, 'Nurse': 1 },
    assignedVolunteers: [],
    status: 'Drafting'
  }
];

export default function App() {
  // Navigation & Persona State
  const [currentPersona, setCurrentPersona] = useState('landing');
  const [activeTab, setActiveTab] = useState('dashboard');

  // Authentication State
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [isDoctorLoggedIn, setIsDoctorLoggedIn] = useState(true); // Dr. Ramesh pre-logged in for testing
  const [loggedInDoctorId, setLoggedInDoctorId] = useState('doc-1');

  // Application Data States
  const [doctors, setDoctors] = useState(INITIAL_DOCTORS);
  const [camps, setCamps] = useState(INITIAL_CAMPS);
  const [invitations, setInvitations] = useState([
    { id: 'inv-1', campId: 'camp-1', doctorId: 'doc-1', status: 'Accepted', sentVia: 'Email & SMS', timestamp: '2026-06-01' },
    { id: 'inv-2', campId: 'camp-2', doctorId: 'doc-2', status: 'Accepted', sentVia: 'WhatsApp & Email', timestamp: '2026-06-02' },
    { id: 'inv-3', campId: 'camp-2', doctorId: 'doc-3', status: 'Accepted', sentVia: 'Email Only', timestamp: '2026-06-03' },
    { id: 'inv-4', campId: 'camp-3', doctorId: 'doc-4', status: 'Pending', sentVia: 'WhatsApp', timestamp: '2026-06-04' }
  ]);
  
  // Camp Day Check-ins state
  const [checkIns, setCheckIns] = useState({
    'doc-1-camp-1': { checkInTime: '08:30 AM', checkOutTime: '', status: 'Checked In' }
  });

  // Current Logged-in Doctor Sim
  const loggedInDoctor = useMemo(() => doctors.find(d => d.id === loggedInDoctorId), [doctors, loggedInDoctorId]);

  // Toast Alerts State
  const [toastMessage, setToastMessage] = useState(null);

  // AI Matching Copilot State
  const [aiQuery, setAiQuery] = useState('show all available doctors for camp at Koya on July');
  const [aiResult, setAiResult] = useState(null);
  const [aiIsThinking, setAiIsThinking] = useState(false);

  // Trigger automated notifications
  const triggerToast = (message) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Switcher menu navigation handling
  const handlePersonaChange = (persona) => {
    setCurrentPersona(persona);
    if (persona === 'admin') {
      setActiveTab(isAdminLoggedIn ? 'admin-dashboard' : 'admin-login');
    } else if (persona === 'doctor') {
      setActiveTab(isDoctorLoggedIn ? 'doctor-dashboard' : 'doctor-login');
    } else {
      setActiveTab('landing');
    }
  };

  // --- BUSINESS LOGIC ACTIONS ---

  // Onboard New Volunteer (Signup Flow)
  const handleOnboardDoctor = (newDocData) => {
    const id = `doc-${doctors.length + 1}`;
    const newDocObj = {
      id,
      ...newDocData,
      status: 'Pending', // Pending admin verification
      committedDays: parseInt(newDocData.committedDays || 10),
      completedDays: 0,
      avatar: newDocData.role === 'Nurse' ? '👩‍⚕️' : '👨‍⚕️',
      joinDate: new Date().toISOString().split('T')[0],
      availableMonths: { 'Jul': [10, 11, 25], 'Aug': [14, 15] },
      locationPriorities: ['Koya'],
      attendanceLogs: []
    };
    setDoctors([newDocObj, ...doctors]);
    setLoggedInDoctorId(id);
    setIsDoctorLoggedIn(true);
    triggerToast(`Application received! Profile logged in as ${newDocData.name}. Status: Verification Pending.`);
    setActiveTab('doctor-dashboard');
  };

  // Admin Approval
  const updateDoctorStatus = (id, newStatus) => {
    setDoctors(doctors.map(d => d.id === id ? { ...d, status: newStatus } : d));
    triggerToast(`Volunteer ${doctors.find(d => d.id === id).name} status updated to: ${newStatus}`);
  };

  // Doctor calendar single day toggle
  const toggleDoctorCalendarDay = (month, day) => {
    setDoctors(prevDocs => {
      return prevDocs.map(d => {
        if (d.id === loggedInDoctorId) {
          const updatedMonths = { ...d.availableMonths };
          if (!updatedMonths[month]) updatedMonths[month] = [];
          
          if (updatedMonths[month].includes(day)) {
            updatedMonths[month] = updatedMonths[month].filter(dVal => dVal !== day);
          } else {
            updatedMonths[month] = [...updatedMonths[month], day].sort((a,b) => a-b);
          }
          
          const totalDays = Object.values(updatedMonths).reduce((acc, curr) => acc + curr.length, 0);
          return {
            ...d,
            availableMonths: updatedMonths,
            committedDays: Math.max(totalDays, d.completedDays)
          };
        }
        return d;
      });
    });
    triggerToast(`Calendar day updated for ${month} ${day}.`);
  };

  // Doctor bulk availability builder (All Saturdays/Sundays etc.)
  const handleBulkAvailability = (month, daysToSelect) => {
    setDoctors(prevDocs => {
      return prevDocs.map(d => {
        if (d.id === loggedInDoctorId) {
          const updatedMonths = { ...d.availableMonths };
          updatedMonths[month] = [...new Set([...(updatedMonths[month] || []), ...daysToSelect])].sort((a,b) => a-b);
          
          const totalDays = Object.values(updatedMonths).reduce((acc, curr) => acc + curr.length, 0);
          return {
            ...d,
            availableMonths: updatedMonths,
            committedDays: Math.max(totalDays, d.completedDays)
          };
        }
        return d;
      });
    });
    triggerToast(`Applied recurring availability to calendar for ${month}.`);
  };

  // Doctor clear calendar builder
  const handleClearMonthAvailability = (month) => {
    setDoctors(prevDocs => {
      return prevDocs.map(d => {
        if (d.id === loggedInDoctorId) {
          const updatedMonths = { ...d.availableMonths };
          updatedMonths[month] = [];
          
          const totalDays = Object.values(updatedMonths).reduce((acc, curr) => acc + curr.length, 0);
          return {
            ...d,
            availableMonths: updatedMonths,
            committedDays: Math.max(totalDays, d.completedDays)
          };
        }
        return d;
      });
    });
    triggerToast(`Cleared all selected dates for ${month}.`);
  };

  // Create Campaign Camp
  const handleCreateCamp = (newCamp) => {
    const id = `camp-${camps.length + 1}`;
    const campObj = {
      id,
      ...newCamp,
      status: 'Drafting',
      assignedVolunteers: []
    };
    setCamps([...camps, campObj]);
    triggerToast(`Campaign launched: ${newCamp.name}. Go configure matches!`);
    setActiveTab('matching');
  };

  // Intelligent Copilot Parser
  const executeAISearch = (queryText) => {
    setAiIsThinking(true);
    setAiResult(null);

    setTimeout(() => {
      const queryLower = queryText.toLowerCase();
      let matchedDocs = [];

      const filters = {
        location: null,
        month: null,
        specialty: null
      };

      if (queryLower.includes('koya')) filters.location = 'Koya';
      if (queryLower.includes('belgaum')) filters.location = 'Belgaum';
      if (queryLower.includes('mysore')) filters.location = 'Mysore';
      if (queryLower.includes('hubli')) filters.location = 'Hubli';
      if (queryLower.includes('mangalore')) filters.location = 'Mangalore';

      if (queryLower.includes('july') || queryLower.includes('jul')) filters.month = 'Jul';
      if (queryLower.includes('august') || queryLower.includes('aug')) filters.month = 'Aug';

      if (queryLower.includes('pediatric')) filters.specialty = 'Pediatrics';
      if (queryLower.includes('cardio')) filters.specialty = 'Cardiology';
      if (queryLower.includes('dermatology')) filters.specialty = 'Dermatology';
      if (queryLower.includes('ortho')) filters.specialty = 'Orthopedics';

      matchedDocs = doctors.map(doc => {
        let score = 50; 

        if (filters.specialty) {
          if (doc.specialty.toLowerCase() === filters.specialty.toLowerCase()) {
            score += 40;
          } else {
            score -= 20;
          }
        }

        if (filters.location) {
          const index = doc.locationPriorities.findIndex(loc => loc.toLowerCase() === filters.location.toLowerCase());
          if (index === 0) score += 25; 
          else if (index > 0) score += 15; 
          else score -= 10; 
        }

        if (filters.month) {
          if (doc.availableMonths && doc.availableMonths[filters.month] && doc.availableMonths[filters.month].length > 0) {
            score += 20;
          } else {
            score -= 15;
          }
        }

        if (doc.status !== 'Approved') {
          score -= 30; 
        }

        return {
          ...doc,
          calculatedScore: Math.min(Math.max(score, 10), 98) 
        };
      })
      .filter(doc => doc.calculatedScore > 35) 
      .sort((a, b) => b.calculatedScore - a.calculatedScore);

      setAiResult({
        filters,
        results: matchedDocs
      });
      setAiIsThinking(false);
      triggerToast("AI Matching engine completed evaluation.");
    }, 900);
  };

  // Invitation Delivery Action
  const sendBulkInvitations = (campId, docIds, channel) => {
    const newInvites = docIds.map(dId => ({
      id: `inv-${Date.now()}-${dId}`,
      campId,
      doctorId: dId,
      status: 'Pending',
      sentVia: channel,
      timestamp: new Date().toISOString().split('T')[0]
    }));
    
    setInvitations([...invitations, ...newInvites]);
    triggerToast(`Sent bulk invites to ${docIds.length} candidate specialists via ${channel}!`);
    setActiveTab('invitations');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans antialiased">
      
      {/* --- TOP BRANDED HEALTHCARE BAR --- */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            
            {/* Logo and Slogan */}
            <div className="flex items-center space-x-3 cursor-pointer" onClick={() => handlePersonaChange('landing')}>
              <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-100">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 10.5V20a2 2 0 01-2 2H7a2 2 0 01-2-2v-9.5m14 0V9a2 2 0 00-2-2h-2m-4-3a2 2 0 00-2 2v3M5 10.5V9a2 2 0 012-2h2m0 0V4a2 2 0 012-2h2a2 2 0 012 2v3m-6 0h6M9 20h6" />
                </svg>
              </div>
              <div>
                <span className="text-xl font-extrabold tracking-tight text-slate-900">Avodah</span>
                <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                  Avodah - Stewards of Grace
                </span>
              </div>
            </div>

            {/* Persona Switcher Menu */}
            <div className="flex items-center space-x-1 sm:space-x-2">
              <span className="hidden lg:inline text-xs font-bold text-slate-400 uppercase tracking-widest mr-2">
                Active Portal:
              </span>
              <button
                onClick={() => handlePersonaChange('landing')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  currentPersona === 'landing' 
                    ? 'bg-slate-900 text-white shadow-sm' 
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                🌐 Landing
              </button>
              <button
                onClick={() => handlePersonaChange('doctor')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  currentPersona === 'doctor' 
                    ? 'bg-indigo-700 text-white shadow-sm' 
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                🏥 Volunteer Portal
              </button>
              <button
                onClick={() => handlePersonaChange('admin')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  currentPersona === 'admin' 
                    ? 'bg-indigo-700 text-white shadow-sm' 
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                🔑 Admin Terminal
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* --- NOTIFICATION TOAST --- */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 animate-bounce max-w-sm bg-slate-900 text-white px-5 py-4 rounded-xl shadow-2xl flex items-start space-x-3 border border-slate-700">
          <div className="text-amber-400 text-lg">💡</div>
          <div className="flex-1">
            <h5 className="font-bold text-xs uppercase tracking-wider text-slate-400">System Notification</h5>
            <p className="text-sm mt-0.5 text-slate-100">{toastMessage}</p>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white font-bold">×</button>
        </div>
      )}

      {/* --- HERO AND NAVIGATIONAL FRAMEWORK --- */}
      <div className="flex-1 flex flex-col">
        
        {/* LANDING PERSONA VIEW */}
        {currentPersona === 'landing' && (
          <LandingPage 
            camps={camps} 
            doctors={doctors} 
            onJoinCTA={() => handlePersonaChange('doctor')} 
            onAdminCTA={() => handlePersonaChange('admin')}
          />
        )}

        {/* VOLUNTEER PORTAL VIEW */}
        {currentPersona === 'doctor' && (
          <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col lg:flex-row gap-8">
            
            {!isDoctorLoggedIn ? (
              <div className="w-full flex justify-center py-10">
                <DoctorLoginSignup 
                  doctors={doctors} 
                  onLogin={(id) => {
                    setLoggedInDoctorId(id);
                    setIsDoctorLoggedIn(true);
                    triggerToast(`Logged in successfully!`);
                    setActiveTab('doctor-dashboard');
                  }}
                  onSignUp={() => {
                    setActiveTab('registration');
                    setIsDoctorLoggedIn(true); // temporary state to bypass, and load registration screen
                  }}
                />
              </div>
            ) : (
              <>
                {/* Sidebar Navigation */}
                <aside className="lg:w-64 flex-shrink-0">
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-6 shadow-xs">
                    
                    {/* Doctor Avatar Profile Card */}
                    <div className="text-center pb-4 border-b border-slate-100">
                      <div className="w-16 h-16 rounded-full bg-indigo-100 text-3xl flex items-center justify-center mx-auto mb-3">
                        {loggedInDoctor?.avatar}
                      </div>
                      <h4 className="font-bold text-slate-900 text-base">{loggedInDoctor?.name}</h4>
                      <p className="text-xs text-indigo-600 font-semibold">{loggedInDoctor?.specialty} • {loggedInDoctor?.role}</p>
                      
                      <div className="mt-2 flex justify-center">
                        <span className={`px-2.5 py-0.5 rounded-full font-bold text-[9px] uppercase tracking-wide ${
                          loggedInDoctor?.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          loggedInDoctor?.status === 'Pending' ? 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse' :
                          'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                          {loggedInDoctor?.status}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest">{loggedInDoctor?.regNumber}</p>
                      
                      {/* Select doctor simulator */}
                      <div className="mt-3 pt-2 border-t border-dotted border-slate-100">
                        <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Switch Simulated Doc:</label>
                        <select 
                          value={loggedInDoctorId} 
                          onChange={(e) => {
                            setLoggedInDoctorId(e.target.value);
                            triggerToast(`Switched account simulation`);
                          }}
                          className="text-xs p-1 bg-slate-50 border border-slate-200 rounded-md w-full focus:ring-1 focus:ring-indigo-600 text-slate-700 font-medium"
                        >
                          {doctors.map(d => (
                            <option key={d.id} value={d.id}>{d.name} ({d.role})</option>
                          ))}
                        </select>
                      </div>

                      <button 
                        onClick={() => {
                          setIsDoctorLoggedIn(false);
                          triggerToast("Logged out of Volunteer Portal");
                        }}
                        className="mt-3 w-full text-[11px] text-rose-600 font-bold bg-rose-50 hover:bg-rose-100 p-1 rounded-lg transition-colors"
                      >
                        Sign Out ⏻
                      </button>
                    </div>

                    {/* Sub-menu links */}
                    <nav className="space-y-1">
                      <button
                        onClick={() => setActiveTab('doctor-dashboard')}
                        className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                          activeTab === 'doctor-dashboard' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <span>📊</span> <span>My Dashboard</span>
                      </button>

                      {/* Disable other views if pending */}
                      <button
                        onClick={() => {
                          if (loggedInDoctor?.status !== 'Approved') {
                            triggerToast("Verification Pending. Access restricted until admin confirms credentials.");
                          } else {
                            setActiveTab('planner');
                          }
                        }}
                        className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                          loggedInDoctor?.status !== 'Approved' ? 'opacity-50 cursor-not-allowed text-slate-400' :
                          activeTab === 'planner' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <span>📅</span> <span>Availability Planner</span>
                        </div>
                        {loggedInDoctor?.status !== 'Approved' && <span>🔒</span>}
                      </button>

                      <button
                        onClick={() => {
                          if (loggedInDoctor?.status !== 'Approved') {
                            triggerToast("Verification Pending. Access restricted until admin confirms credentials.");
                          } else {
                            setActiveTab('locations');
                          }
                        }}
                        className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                          loggedInDoctor?.status !== 'Approved' ? 'opacity-50 cursor-not-allowed text-slate-400' :
                          activeTab === 'locations' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <span>📍</span> <span>Preferred Fields</span>
                        </div>
                        {loggedInDoctor?.status !== 'Approved' && <span>🔒</span>}
                      </button>

                      <button
                        onClick={() => setActiveTab('registration')}
                        className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                          activeTab === 'registration' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <span>📝</span> <span>Onboard New Colleague</span>
                      </button>
                    </nav>

                    {/* KPI Commitment Progress Tracker */}
                    <div className="bg-gradient-to-br from-amber-50 to-emerald-50 rounded-xl p-4 border border-amber-200 text-xs">
                      <h5 className="font-bold text-indigo-950 uppercase tracking-wider mb-2">My Commitment Tracking</h5>
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-slate-600">Committed Days:</span>
                          <span className="font-bold text-slate-900">{loggedInDoctor?.committedDays}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Completed Service:</span>
                          <span className="font-bold text-slate-900">{loggedInDoctor?.completedDays}</span>
                        </div>
                        <div className="mt-2 pt-2 border-t border-amber-200">
                          <div className="w-full bg-amber-200/50 rounded-full h-2">
                            <div 
                              className="bg-indigo-600 h-2 rounded-full transition-all"
                              style={{ width: `${Math.min(100, ((loggedInDoctor?.completedDays || 0) / (loggedInDoctor?.committedDays || 1)) * 100)}%` }}
                            ></div>
                          </div>
                          <span className="text-[10px] text-indigo-800 font-semibold mt-1 block text-right">
                            {Math.round(((loggedInDoctor?.completedDays || 0) / (loggedInDoctor?.committedDays || 1)) * 100)}% Fulfilled
                          </span>
                        </div>
                      </div>
                    </div>

                  </div>
                </aside>

                {/* Doctor Active Screen Workspace */}
                <main className="flex-1 min-w-0 bg-white rounded-2xl border border-slate-200 shadow-xs p-6 md:p-8">
                  {activeTab === 'doctor-dashboard' && (
                    <DoctorDashboard 
                      doctor={loggedInDoctor} 
                      camps={camps} 
                      invitations={invitations} 
                      setInvitations={setInvitations}
                      triggerToast={triggerToast}
                    />
                  )}
                  {activeTab === 'planner' && loggedInDoctor?.status === 'Approved' && (
                    <DoctorPlanner 
                      doctor={loggedInDoctor} 
                      toggleDay={toggleDoctorCalendarDay}
                      onBulkApply={handleBulkAvailability}
                      onClearMonth={handleClearMonthAvailability}
                    />
                  )}
                  {activeTab === 'locations' && loggedInDoctor?.status === 'Approved' && (
                    <PreferredLocations 
                      doctor={loggedInDoctor} 
                      onSaveLocations={(locs) => {
                        setDoctors(doctors.map(d => d.id === loggedInDoctorId ? { ...d, locationPriorities: locs } : d));
                        triggerToast("Field priority alignment settings saved!");
                      }}
                    />
                  )}
                  {activeTab === 'registration' && (
                    <DoctorRegistration onSubmit={handleOnboardDoctor} />
                  )}
                </main>
              </>
            )}

          </div>
        )}

        {/* ADMINISTRATOR PERSONA VIEW */}
        {currentPersona === 'admin' && (
          <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col lg:flex-row gap-8">
            
            {!isAdminLoggedIn ? (
              <div className="w-full flex justify-center py-10">
                <AdminLogin onLogin={() => {
                  setIsAdminLoggedIn(true);
                  setActiveTab('admin-dashboard');
                  triggerToast("Logged in successfully as Administrator.");
                }} />
              </div>
            ) : (
              <>
                {/* Admin Sidebar Navigation */}
                <aside className="lg:w-64 flex-shrink-0">
                  <div className="bg-slate-900 text-slate-300 rounded-2xl p-5 space-y-6 shadow-lg">
                    
                    <div className="pb-4 border-b border-slate-800 flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <span className="text-xl">🛠️</span>
                        <div>
                          <h4 className="font-extrabold text-white text-sm">Avodah Command</h4>
                          <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">NGO Suite</p>
                        </div>
                      </div>
                    </div>

                    <nav className="space-y-1">
                      <button
                        onClick={() => setActiveTab('admin-dashboard')}
                        className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                          activeTab === 'admin-dashboard' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                        }`}
                      >
                        <span>📊</span> <span>Admin Overview</span>
                      </button>
                      <button
                        onClick={() => setActiveTab('verification')}
                        className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                          activeTab === 'verification' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <span>🛡️</span> <span>Verify Credentials</span>
                        </div>
                        {doctors.filter(d => d.status === 'Pending').length > 0 && (
                          <span className="bg-rose-500 text-white font-bold text-[10px] px-2 py-0.5 rounded-full">
                            {doctors.filter(d => d.status === 'Pending').length}
                          </span>
                        )}
                      </button>
                      <button
                        onClick={() => setActiveTab('camp-creation')}
                        className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                          activeTab === 'camp-creation' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                        }`}
                      >
                        <span>➕</span> <span>Configure Camp</span>
                      </button>
                      <button
                        onClick={() => setActiveTab('matching')}
                        className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                          activeTab === 'matching' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                        }`}
                      >
                        <span>🧠</span> <span>AI Doctor Matching</span>
                      </button>
                      <button
                        onClick={() => setActiveTab('invitations')}
                        className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                          activeTab === 'invitations' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                        }`}
                      >
                        <span>📨</span> <span>Invitation Center</span>
                      </button>
                      <button
                        onClick={() => setActiveTab('execution')}
                        className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                          activeTab === 'execution' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                        }`}
                      >
                        <span>⏱️</span> <span>Camp Execution</span>
                      </button>
                      <button
                        onClick={() => setActiveTab('analytics')}
                        className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                          activeTab === 'analytics' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                        }`}
                      >
                        <span>📋</span> <span>Compliance Audit</span>
                      </button>
                    </nav>

                    <div className="pt-4 border-t border-slate-800">
                      <button 
                        onClick={() => {
                          setIsAdminLoggedIn(false);
                          triggerToast("Administrator Logged Out");
                        }}
                        className="w-full py-2 bg-slate-800 hover:bg-slate-700 hover:text-white text-rose-400 text-xs font-bold rounded-xl transition-all"
                      >
                        Log Out Admin ⏻
                      </button>
                    </div>

                    <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 text-xs">
                      <h5 className="font-bold text-white uppercase tracking-wider mb-2">Camp Summary Status</h5>
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-slate-400">Total Conducted:</span>
                          <span className="font-semibold text-white">38</span>
                        </div>
                        <div className="flex justify-between text-[11px]">
                          <span className="text-slate-400">Upcoming Scheduled:</span>
                          <span className="font-semibold text-white">{camps.filter(c => c.status === 'Scheduled').length}</span>
                        </div>
                        <div className="flex justify-between text-[11px]">
                          <span className="text-slate-400">Draft Frameworks:</span>
                          <span className="font-semibold text-white">{camps.filter(c => c.status === 'Drafting').length}</span>
                        </div>
                      </div>
                    </div>

                  </div>
                </aside>

                {/* Admin Active Screen Workspace */}
                <main className="flex-1 min-w-0 bg-white rounded-2xl border border-slate-200 shadow-xs p-6 md:p-8">
                  {activeTab === 'admin-dashboard' && (
                    <AdminDashboard 
                      doctors={doctors} 
                      camps={camps} 
                      invitations={invitations} 
                      setActiveTab={setActiveTab}
                    />
                  )}
                  {activeTab === 'verification' && (
                    <AdminVerification 
                      doctors={doctors} 
                      onApprove={(id) => updateDoctorStatus(id, 'Approved')} 
                      onReject={(id) => updateDoctorStatus(id, 'Rejected')} 
                    />
                  )}
                  {activeTab === 'camp-creation' && (
                    <CampCreation 
                      onSubmit={handleCreateCamp} 
                    />
                  )}
                  {activeTab === 'matching' && (
                    <AIDoctorMatching 
                      doctors={doctors} 
                      camps={camps} 
                      aiQuery={aiQuery}
                      setAiQuery={setAiQuery}
                      aiResult={aiResult}
                      aiIsThinking={aiIsThinking}
                      onExecuteAISearch={executeAISearch}
                      onSendInvites={(campId, docIds, channel) => sendBulkInvitations(campId, docIds, channel)}
                    />
                  )}
                  {activeTab === 'invitations' && (
                    <InvitationCenter 
                      invitations={invitations} 
                      camps={camps} 
                      doctors={doctors} 
                    />
                  )}
                  {activeTab === 'execution' && (
                    <CampExecution 
                      camps={camps} 
                      doctors={doctors} 
                      checkIns={checkIns}
                      setCheckIns={setCheckIns}
                      triggerToast={triggerToast}
                    />
                  )}
                  {activeTab === 'analytics' && (
                    <AnalyticsDashboard 
                      doctors={doctors} 
                      camps={camps} 
                    />
                  )}
                </main>
              </>
            )}

          </div>
        )}

      </div>

      {/* --- SITE FOOTER --- */}
      <footer className="bg-slate-900 border-t border-slate-800 py-10 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0 text-slate-400 text-xs">
            
            <div className="flex items-center space-x-2">
              <span className="text-white font-extrabold tracking-tight">Avodah</span>
              <span>© 2026. All Rights Reserved. Empowering healthcare campaigns.</span>
            </div>

            <div className="flex space-x-6">
              <a href="#compliance" onClick={() => { setCurrentPersona('admin'); setIsAdminLoggedIn(true); setActiveTab('analytics'); }} className="hover:text-white transition-colors">Regulatory Compliance Registry</a>
              <a href="#onboard" onClick={() => { setCurrentPersona('doctor'); setIsDoctorLoggedIn(false); }} className="hover:text-white transition-colors">Volunteer Onboarding</a>
              <a href="#privacy" className="hover:text-white transition-colors">Privacy Principles</a>
            </div>

          </div>
        </div>
      </footer>

    </div>
  );
}

// ==========================================
// COMPONENT: ADMIN LOGIN SCREEN
// ==========================================
function AdminLogin({ onLogin }) {
  const [email, setEmail] = useState('admin@avodah.org');
  const [password, setPassword] = useState('password');

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin();
  };

  return (
    <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-xl p-8 space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xl mx-auto">
          🔑
        </div>
        <h3 className="text-xl font-bold text-slate-900">NGO / Admin Portal Sign-In</h3>
        <p className="text-xs text-slate-500">Authorized personnel secure checkpoint</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div>
          <label className="block text-slate-600 font-bold mb-1">Administrative Email</label>
          <input 
            type="email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2.5 border rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-slate-50"
            required
          />
        </div>

        <div>
          <label className="block text-slate-600 font-bold mb-1">Passkey Word</label>
          <input 
            type="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2.5 border rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-slate-50"
            required
          />
        </div>

        <button 
          type="submit"
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold uppercase rounded-xl shadow-lg transition-colors"
        >
          Verify Credentials & Authenticate
        </button>

        <div className="pt-2">
          <div className="bg-amber-50 border border-amber-100 p-3 rounded-lg text-[11px] text-amber-800 text-center">
            <strong>Demonstration Account:</strong> Pre-filled for immediate review. Click submit to access.
          </div>
        </div>
      </form>
    </div>
  );
}

// ==========================================
// COMPONENT: VOLUNTEER LOGIN / SELECTOR
// ==========================================
function DoctorLoginSignup({ doctors, onLogin, onSignUp }) {
  return (
    <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-xl p-8 space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xl mx-auto">
          🏥
        </div>
        <h3 className="text-xl font-bold text-slate-900">Volunteer Portal Login</h3>
        <p className="text-xs text-slate-500">Access your availability, preferences, and invitations</p>
      </div>

      <div className="space-y-4 text-xs">
        <div>
          <label className="block text-slate-600 font-bold mb-2">Simulate Login with Existing Profile:</label>
          <div className="space-y-2">
            {doctors.map(doc => (
              <button
                key={doc.id}
                onClick={() => onLogin(doc.id)}
                className="w-full p-3 border rounded-xl hover:border-teal-500 hover:bg-amber-50/30 text-left transition-all flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{doc.avatar}</span>
                  <div>
                    <h5 className="font-bold text-slate-900">{doc.name}</h5>
                    <p className="text-[10px] text-slate-500">{doc.specialty} • {doc.role}</p>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                  doc.status === 'Approved' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                }`}>
                  {doc.status}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-slate-200"></div>
          <span className="flex-shrink mx-4 text-slate-400 font-bold">OR</span>
          <div className="flex-grow border-t border-slate-200"></div>
        </div>

        <button 
          onClick={onSignUp}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold uppercase rounded-xl shadow-md transition-colors text-center block"
        >
          📝 Enlist/Register as New Volunteer
        </button>
      </div>
    </div>
  );
}

// ==========================================
// SCREEN 1: LANDING PAGE COMPONENT
// ==========================================
function LandingPage({ camps, doctors, onJoinCTA, onAdminCTA }) {
  return (
    <div className="bg-slate-50">
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-indigo-950 via-indigo-900 to-slate-900 text-white py-20 px-4 text-center relative overflow-hidden">
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
          
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-4">
            <button 
              onClick={onJoinCTA}
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-amber-500 text-slate-900 font-bold hover:bg-amber-400 transition-all shadow-lg hover:scale-105 active:scale-95 text-sm"
            >
              Access Volunteer Portal 🏥
            </button>
            <button 
              onClick={onAdminCTA}
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-slate-800 text-slate-100 font-bold hover:bg-slate-700 transition-all border border-slate-700 hover:scale-105 active:scale-95 text-sm"
            >
              Access Admin Terminal 🔑
            </button>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-20">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-8 grid grid-cols-2 lg:grid-cols-5 gap-6 text-center">
          <div>
            <span className="block text-3xl md:text-4xl font-extrabold text-indigo-600">125+</span>
            <span className="text-xs font-semibold text-slate-500 uppercase mt-1 block">Doctors Registered</span>
          </div>
          <div>
            <span className="block text-3xl md:text-4xl font-extrabold text-indigo-600">80+</span>
            <span className="text-xs font-semibold text-slate-500 uppercase mt-1 block">Nurses Enlisted</span>
          </div>
          <div>
            <span className="block text-3xl md:text-4xl font-extrabold text-indigo-600">38+</span>
            <span className="text-xs font-semibold text-slate-500 uppercase mt-1 block">Camps Completed</span>
          </div>
          <div>
            <span className="block text-3xl md:text-4xl font-extrabold text-indigo-600">5,000+</span>
            <span className="text-xs font-semibold text-slate-500 uppercase mt-1 block">Patients Served</span>
          </div>
          <div className="col-span-2 lg:col-span-1">
            <span className="block text-3xl md:text-4xl font-extrabold text-indigo-600">50+</span>
            <span className="text-xs font-semibold text-slate-500 uppercase mt-1 block">Rural Field Locations</span>
          </div>
        </div>
      </section>

      {/* How it Works Journey Timeline */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
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

    </div>
  );
}

// ==========================================
// SCREEN 2: DOCTOR/NURSE REGISTRATION COMPONENT
// ==========================================
function DoctorRegistration({ onSubmit }) {
  const [formData, setFormData] = useState({
    name: '',
    gender: 'Male',
    role: 'Doctor',
    regNumber: '',
    specialty: 'General Medicine',
    experience: '5',
    email: '',
    mobile: '',
    committedDays: '10'
  });

  const [uploadProgress, setUploadProgress] = useState({ degree: 0, license: 0 });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const simulateUpload = (field) => {
    setUploadProgress(p => ({ ...p, [field]: 10 }));
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev[field] >= 100) {
          clearInterval(interval);
          return prev;
        }
        return { ...prev, [field]: prev[field] + 30 };
      });
    }, 200);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.regNumber || !formData.email) {
      alert("Please enter Name, Registration Number, and Email!");
      return;
    }
    onSubmit(formData);
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-100 pb-4">
        <h2 className="text-2xl font-extrabold text-slate-900">Volunteer Enlistment Application</h2>
        <p className="text-xs text-slate-500 mt-1">
          Provide professional verification details. Submissions undergo active licensing verification against regulatory database rosters.
        </p>
      </div>

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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Corporate/Work Email Address</label>
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
            <div className="bg-white p-4 rounded-xl border border-slate-200 text-center">
              <span className="text-2xl block mb-2">📜</span>
              <h5 className="font-bold text-xs text-slate-700">Medical Degree / Equivalent Certification</h5>
              <p className="text-[10px] text-rose-500 font-semibold mt-1 mb-3">Upload PDF, JPG up to 256KB size limit only</p>
              
              {uploadProgress.degree === 0 ? (
                <button 
                  type="button" 
                  onClick={() => simulateUpload('degree')}
                  className="px-4 py-1.5 rounded-lg bg-slate-100 hover:bg-amber-50 hover:text-amber-800 text-xs font-semibold text-slate-600 transition-colors"
                >
                  Upload File
                </button>
              ) : (
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full transition-all" style={{ width: `${uploadProgress.degree}%` }}></div>
                </div>
              )}
              {uploadProgress.degree === 100 && (
                <span className="text-emerald-600 font-bold text-[10px] block mt-1">✓ Complete Upload</span>
              )}
            </div>

            {/* Document 2 */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 text-center">
              <span className="text-2xl block mb-2">🛡️</span>
              <h5 className="font-bold text-xs text-slate-700">Medical Council License Copy</h5>
              <p className="text-[10px] text-rose-500 font-semibold mt-1 mb-3">Upload PDF, JPG up to 256KB size limit only</p>
              
              {uploadProgress.license === 0 ? (
                <button 
                  type="button" 
                  onClick={() => simulateUpload('license')}
                  className="px-4 py-1.5 rounded-lg bg-slate-100 hover:bg-amber-50 hover:text-amber-800 text-xs font-semibold text-slate-600 transition-colors"
                >
                  Upload File
                </button>
              ) : (
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full transition-all" style={{ width: `${uploadProgress.license}%` }}></div>
                </div>
              )}
              {uploadProgress.license === 100 && (
                <span className="text-emerald-600 font-bold text-[10px] block mt-1">✓ Complete Upload</span>
              )}
            </div>

          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex justify-end space-x-3 pt-2">
          <button 
            type="submit"
            className="px-6 py-3 bg-indigo-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg hover:bg-indigo-700 transition-colors"
          >
            Submit Application Roster Enlistment
          </button>
        </div>

      </form>
    </div>
  );
}

// ==========================================
// SCREEN 3: ADMIN VERIFICATION DASHBOARD COMPONENT
// ==========================================
function AdminVerification({ doctors, onApprove, onReject }) {
  const [selectedDocForDocView, setSelectedDocForDocView] = useState(null);

  return (
    <div className="space-y-6">
      
      <div className="border-b border-slate-100 pb-4">
        <h2 className="text-2xl font-extrabold text-slate-900">Volunteer Document Review Terminal</h2>
        <p className="text-xs text-slate-500 mt-1">
          Approve or flag applications. Ensure state registration numbers match licensing criteria before approving camps.
        </p>
      </div>

      {/* Grid List representation */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
          <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Onboarding Registrations</h4>
          <span className="bg-indigo-100 text-indigo-800 font-bold text-[10px] px-2.5 py-1 rounded-full">
            {doctors.filter(d => d.status === 'Pending').length} Pending Audits
          </span>
        </div>

        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-200 text-slate-500 uppercase text-[10px] tracking-wider">
              <th className="p-4">Volunteer Info</th>
              <th className="p-4">Specialty & Role</th>
              <th className="p-4">Reg Number</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {doctors.map(doc => (
              <tr key={doc.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="p-4">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{doc.avatar}</span>
                    <div>
                      <h5 className="font-bold text-slate-900">{doc.name}</h5>
                      <p className="text-[10px] text-slate-400">Joined {doc.joinDate}</p>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <div className="font-semibold text-slate-800">{doc.specialty}</div>
                  <div className="text-[10px] text-slate-400">{doc.role}</div>
                </td>
                <td className="p-4 font-mono text-[11px] text-slate-600">{doc.regNumber}</td>
                <td className="p-4">
                  <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] uppercase tracking-wide ${
                    doc.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                    doc.status === 'Pending' ? 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse' :
                    'bg-slate-100 text-slate-700 border border-slate-200'
                  }`}>
                    {doc.status}
                  </span>
                </td>
                <td className="p-4 text-right space-x-1">
                  <button 
                    onClick={() => setSelectedDocForDocView(doc)}
                    className="p-1 px-2.5 rounded bg-slate-100 text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 font-bold text-[10px] transition-all"
                  >
                    View Docs 📄
                  </button>
                  {doc.status === 'Pending' && (
                    <>
                      <button 
                        onClick={() => onApprove(doc.id)}
                        className="p-1 px-2.5 rounded bg-emerald-500 text-white hover:bg-emerald-600 font-bold text-[10px] transition-all"
                      >
                        Approve
                      </button>
                      <button 
                        onClick={() => onReject(doc.id)}
                        className="p-1 px-2.5 rounded bg-rose-500 text-white hover:bg-rose-600 font-bold text-[10px] transition-all"
                      >
                        Decline
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* View Document Modal simulation */}
      {selectedDocForDocView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex justify-between items-start pb-2 border-b border-slate-100">
              <div>
                <h4 className="font-extrabold text-slate-900 text-base">{selectedDocForDocView.name} Credentials</h4>
                <p className="text-[10px] text-slate-400 font-mono">{selectedDocForDocView.regNumber}</p>
              </div>
              <button 
                onClick={() => setSelectedDocForDocView(null)} 
                className="text-slate-400 hover:text-slate-900 font-bold text-lg"
              >
                ×
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center space-x-3">
                <span className="text-xl">✅</span>
                <div>
                  <p className="font-bold text-indigo-950">National Practitioner Roster Verified</p>
                  <p className="text-indigo-800">Licensing status confirmed through centralized medical database matching.</p>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl p-3 text-center bg-slate-50 space-y-1">
                <p className="font-bold text-slate-700">Digital Document Scan</p>
                <div className="h-28 border border-dashed border-slate-300 rounded-lg flex items-center justify-center text-slate-400">
                  📄 Simulated Degree Roster scan file available for audit check (Maximum 256KB limitation verified)
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button 
                onClick={() => setSelectedDocForDocView(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition-colors"
              >
                Close Audit Viewer
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// ==========================================
// SCREEN 4: DOCTOR AVAILABILITY PLANNER COMPONENT
// ==========================================
function DoctorPlanner({ doctor, toggleDay, onBulkApply, onClearMonth }) {
  const [selectedMonth, setSelectedMonth] = useState('Jul');
  const [sessionMode, setSessionMode] = useState('Full Day');

  // Multi-month recurring configuration state
  const [recDay, setRecDay] = useState('Saturdays & Sundays');
  const [recMonthsCount, setRecMonthsCount] = useState(2);

  const months = ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // Total commitment KPI checks
  const totalDaysRegistered = Object.values(doctor?.availableMonths || {}).reduce((acc, curr) => acc + curr.length, 0);

  // Trigger select all calendar days
  const handleSelectAll = () => {
    const allDays = Array.from({ length: 28 }, (_, i) => i + 1);
    onBulkApply(selectedMonth, allDays);
  };

  // Trigger quick bulk recurring selector
  const handleApplyRecurringBuilder = () => {
    // Generate days of month
    // In our simplified 28-day calendar: Mon=1, Tue=2, Wed=3, Thu=4, Fri=5, Sat=6, Sun=7...
    let daysToSelect = [];
    if (recDay === 'Saturdays') daysToSelect = [6, 13, 20, 27];
    else if (recDay === 'Sundays') daysToSelect = [7, 14, 21, 28];
    else if (recDay === 'Saturdays & Sundays') daysToSelect = [6, 7, 13, 14, 20, 21, 27, 28];
    else if (recDay === 'Weekdays') daysToSelect = [1,2,3,4,5,8,9,10,11,12,15,16,17,18,19,22,23,24,25,26];

    // Determine target months based on selected range
    const startIndex = months.indexOf(selectedMonth);
    const stopIndex = Math.min(months.length, startIndex + recMonthsCount);

    for (let i = startIndex; i < stopIndex; i++) {
      onBulkApply(months[i], daysToSelect);
    }
  };

  return (
    <div className="space-y-6">
      
      <div className="border-b border-slate-100 pb-4">
        <h2 className="text-2xl font-extrabold text-slate-900">Interactive Availability Planner</h2>
        <p className="text-xs text-slate-500 mt-1">
          Block dates you commit to volunteering in the community camps over the next 12 months.
        </p>
      </div>

      {/* Target Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 p-5 rounded-2xl border border-amber-200 space-y-1">
          <span className="text-xs font-semibold text-indigo-800 uppercase tracking-wider block">Target Commits</span>
          <div className="flex items-baseline space-x-1.5">
            <span className="text-3xl font-black text-indigo-950">{doctor?.committedDays}</span>
            <span className="text-xs font-semibold text-slate-500">Days Outlined</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 p-5 rounded-2xl border border-indigo-100 space-y-1">
          <span className="text-xs font-semibold text-indigo-800 uppercase tracking-wider block">Completed Missions</span>
          <div className="flex items-baseline space-x-1.5">
            <span className="text-3xl font-black text-indigo-900">{doctor?.completedDays}</span>
            <span className="text-xs font-semibold text-slate-500">Days Served</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-5 rounded-2xl border border-emerald-100 space-y-1">
          <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider block">Remaining Commitment</span>
          <div className="flex items-baseline space-x-1.5">
            <span className="text-3xl font-black text-emerald-900">
              {Math.max(0, doctor?.committedDays - doctor?.completedDays)}
            </span>
            <span className="text-xs font-semibold text-slate-500">Days Pending</span>
          </div>
        </div>
      </div>

      {/* Dynamic Month Tab Switchers & Quick Action buttons */}
      <div className="space-y-4">
        
        {/* Bulk Recurring Availability Scheduler Card */}
        <div className="bg-gradient-to-r from-amber-50 to-amber-100/30 border border-amber-200 rounded-xl p-4 text-xs space-y-3 shadow-xs">
          <div className="flex items-center space-x-2">
            <span className="text-base">⚡</span>
            <h4 className="font-bold text-indigo-950 uppercase tracking-wider">Multi-Month Recurring Scheduler</h4>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-slate-600 font-semibold mb-1">Target Days:</label>
              <select 
                value={recDay}
                onChange={(e) => setRecDay(e.target.value)}
                className="w-full p-2 bg-white border border-slate-300 rounded"
              >
                <option value="Saturdays & Sundays">Saturdays & Sundays</option>
                <option value="Saturdays">Saturdays Only</option>
                <option value="Sundays">Sundays Only</option>
                <option value="Weekdays">All Weekdays (Mon-Fri)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">Duration Block:</label>
              <select 
                value={recMonthsCount}
                onChange={(e) => setRecMonthsCount(parseInt(e.target.value))}
                className="w-full p-2 bg-white border border-slate-300 rounded"
              >
                <option value={2}>Next 2 Months ({selectedMonth} onwards)</option>
                <option value={4}>Next 4 Months ({selectedMonth} onwards)</option>
                <option value={6}>Next 6 Months ({selectedMonth} onwards)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">Session Block Mode:</label>
              <select 
                value={sessionMode} 
                onChange={(e) => setSessionMode(e.target.value)}
                className="w-full p-2 bg-white border border-slate-300 rounded"
              >
                <option value="Full Day">Full Day (9 AM - 5 PM)</option>
                <option value="Half Day">Half Day (9 AM - 1 PM)</option>
                <option value="Post Lunch">Post Lunch (2 PM - 6 PM)</option>
                <option value="Evening">Evening (6 PM - 9 PM)</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={handleApplyRecurringBuilder}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded shadow-xs uppercase tracking-wide text-[10px]"
              >
                Apply Recurring Days
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Select Month Roster:</label>
          
          <div className="flex items-center space-x-2 text-xs">
            <span className="font-semibold text-slate-600">Fulfillment Mode:</span>
            <select 
              value={sessionMode} 
              onChange={(e) => setSessionMode(e.target.value)}
              className="p-1 px-2 border border-slate-300 rounded bg-white text-xs"
            >
              <option value="Full Day">Full Day (9 AM - 5 PM)</option>
              <option value="Half Day">Half Day (9 AM - 1 PM)</option>
              <option value="Post Lunch">Post Lunch (2 PM - 6 PM)</option>
              <option value="Evening">Evening (6 PM - 9 PM)</option>
            </select>
          </div>
        </div>

        <div className="flex overflow-x-auto space-x-1 pb-2">
          {months.map(m => (
            <button
              key={m}
              onClick={() => setSelectedMonth(m)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex-shrink-0 ${
                selectedMonth === m 
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              🗓️ {m} 2026
            </button>
          ))}
        </div>

        {/* Dynamic Month Calendar Mock Representation */}
        <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <h4 className="font-bold text-slate-800 text-sm">Days Selected in {selectedMonth} 2026</h4>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={handleSelectAll}
                className="px-2.5 py-1 text-[10px] font-bold uppercase rounded bg-amber-50 text-amber-800 hover:bg-indigo-100 border border-amber-200 transition-colors"
              >
                📅 Choose All Days
              </button>
              <button
                onClick={() => onClearMonth(selectedMonth)}
                className="px-2.5 py-1 text-[10px] font-bold uppercase rounded bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition-colors"
              >
                🧹 Clear Month
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2 text-center text-xs">
            {/* Days Week Headers */}
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(h => (
              <div key={h} className="font-bold text-slate-400 py-1 uppercase text-[10px] tracking-wider">{h}</div>
            ))}

            {/* Days Grid Simulation */}
            {Array.from({ length: 28 }).map((_, idx) => {
              const dayNum = idx + 1;
              const isSelected = doctor?.availableMonths[selectedMonth]?.includes(dayNum);
              
              return (
                <button
                  key={idx}
                  onClick={() => toggleDay(selectedMonth, dayNum)}
                  className={`py-3.5 rounded-xl font-semibold border transition-all ${
                    isSelected 
                      ? 'bg-emerald-500 text-white border-emerald-600 shadow-sm shadow-emerald-100 hover:bg-emerald-600' 
                      : 'bg-white text-slate-600 hover:bg-slate-100 border-slate-200'
                  }`}
                >
                  <span className="block">{dayNum}</span>
                  <span className="text-[8px] block opacity-80 mt-0.5">
                    {isSelected ? sessionMode.split(' ')[0] : 'Free'}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Color Coding legend info */}
          <div className="flex flex-wrap gap-4 text-xs font-semibold pt-2 border-t border-slate-200 justify-center">
            <span className="flex items-center space-x-1">
              <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>
              <span>Available Roster</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-3 h-3 rounded-full bg-slate-300 inline-block"></span>
              <span>Unblocked Calendar Slots</span>
            </span>
          </div>
        </div>
      </div>

    </div>
  );
}

// ==========================================
// SCREEN 5: PREFERRED LOCATIONS COMPONENT
// ==========================================
function PreferredLocations({ doctor, onSaveLocations }) {
  const [priorities, setPriorities] = useState(doctor?.locationPriorities || ['Koya', 'Belgaum']);

  const handlePriorityShift = (location, direction) => {
    const idx = priorities.indexOf(location);
    if (idx === -1) return;
    
    const nextPriorities = [...priorities];
    if (direction === 'up' && idx > 0) {
      [nextPriorities[idx], nextPriorities[idx - 1]] = [nextPriorities[idx - 1], nextPriorities[idx]];
    } else if (direction === 'down' && idx < priorities.length - 1) {
      [nextPriorities[idx], nextPriorities[idx + 1]] = [nextPriorities[idx + 1], nextPriorities[idx]];
    }
    setPriorities(nextPriorities);
  };

  const toggleLocationEnlistment = (location) => {
    if (priorities.includes(location)) {
      setPriorities(priorities.filter(l => l !== location));
    } else {
      setPriorities([...priorities, location]);
    }
  };

  return (
    <div className="space-y-6">
      
      <div className="border-b border-slate-100 pb-4">
        <h2 className="text-2xl font-extrabold text-slate-900">Preferred Deployment Fields</h2>
        <p className="text-xs text-slate-500 mt-1">
          Select deployment areas based on accessibility, commute limits, and camp priorities.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Priority Mapping Panel */}
        <div className="space-y-4">
          <h4 className="font-bold text-slate-800 text-sm">Current Preferred Field Priorities</h4>
          
          <div className="space-y-2">
            {priorities.map((loc, idx) => {
              const fullLocDetails = PREFERRED_LOCATIONS_LIST.find(l => l.name === loc) || { distance: 10, region: 'Inland' };
              return (
                <div key={loc} className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-3">
                    <span className="bg-indigo-600 text-white font-black text-xs w-6 h-6 rounded-full flex items-center justify-center shadow-xs">
                      {idx + 1}
                    </span>
                    <div>
                      <h5 className="font-bold text-slate-900 text-sm">{loc}</h5>
                      <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                        📍 {fullLocDetails.region} • {fullLocDetails.distance} km commute
                      </span>
                    </div>
                  </div>

                  <div className="flex space-x-1">
                    <button 
                      type="button"
                      onClick={() => handlePriorityShift(loc, 'up')}
                      disabled={idx === 0}
                      className="p-1 px-2.5 rounded bg-white text-slate-600 hover:bg-slate-100 text-xs font-bold border disabled:opacity-30 border-slate-200"
                    >
                      ▲
                    </button>
                    <button 
                      type="button"
                      onClick={() => handlePriorityShift(loc, 'down')}
                      disabled={idx === priorities.length - 1}
                      className="p-1 px-2.5 rounded bg-white text-slate-600 hover:bg-slate-100 text-xs font-bold border disabled:opacity-30 border-slate-200"
                    >
                      ▼
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <button 
            onClick={() => onSaveLocations(priorities)}
            className="w-full py-3 bg-indigo-600 text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-indigo-700 transition-colors shadow-lg"
          >
            Save Target Priorities Settings
          </button>
        </div>

        {/* Interactive Simulated Map Roster */}
        <div className="space-y-4 bg-slate-50 border border-slate-200 p-5 rounded-2xl">
          <h4 className="font-bold text-slate-800 text-sm">Deployable Field Database Registry</h4>
          <p className="text-[11px] text-slate-500">Toggle locations below to add or remove them from your preferred registry.</p>
          
          <div className="space-y-2">
            {PREFERRED_LOCATIONS_LIST.map(loc => {
              const isSelected = priorities.includes(loc.name);
              return (
                <div 
                  key={loc.id} 
                  onClick={() => toggleLocationEnlistment(loc.name)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between text-xs ${
                    isSelected ? 'bg-amber-50 border-indigo-300' : 'bg-white border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div>
                    <p className="font-bold text-slate-900">{loc.name}</p>
                    <p className="text-slate-500 text-[10px]">{loc.region}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold text-slate-800 inline-block block">{loc.distance} km</span>
                    <span className={`inline-block font-bold text-[9px] uppercase px-1 rounded ${isSelected ? 'bg-amber-200 text-indigo-800' : 'bg-slate-200 text-slate-600'}`}>
                      {isSelected ? 'Preferred' : 'In Roster'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
}

// ==========================================
// SCREEN 6: DOCTOR DASHBOARD COMPONENT
// ==========================================
function DoctorDashboard({ doctor, camps, invitations, setInvitations, triggerToast }) {
  // Aggregate doctor-specific invitations
  const activeInvitations = useMemo(() => {
    return invitations.filter(inv => inv.doctorId === doctor?.id);
  }, [invitations, doctor]);

  const handleUpdateInviteStatus = (invId, nextStatus) => {
    setInvitations(invitations.map(inv => inv.id === invId ? { ...inv, status: nextStatus } : inv));
    triggerToast(`Invitation updated to: ${nextStatus}.`);
  };

  return (
    <div className="space-y-8">
      
      {/* Greetings Header */}
      <div className="border-b border-slate-100 pb-4 flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900">Welcome, {doctor?.name}!</h2>
          <p className="text-xs text-slate-500 mt-1">Thank you for your service commitment. Let's make an impact today!</p>
        </div>
        <div>
          {doctor?.status === 'Approved' ? (
            <span className="bg-emerald-50 text-emerald-800 font-bold text-xs uppercase tracking-wider px-3 py-1 rounded-full border border-emerald-200">
              ✓ Verified Active Roster
            </span>
          ) : (
            <span className="bg-amber-50 text-amber-800 font-bold text-xs uppercase tracking-wider px-3 py-1 rounded-full border border-amber-200 animate-pulse">
              ⚠️ Credentials Review Pending
            </span>
          )}
        </div>
      </div>

      {doctor?.status !== 'Approved' && (
        <div className="p-6 bg-amber-50 border border-amber-200 rounded-2xl space-y-3">
          <div className="flex items-center space-x-3 text-amber-800">
            <span className="text-3xl">🛡️</span>
            <div>
              <h4 className="font-extrabold text-sm">Regulatory License Review in Progress</h4>
              <p className="text-xs text-slate-600 mt-0.5">
                Our medical compliance board is auditing your certification reg code: <strong>{doctor?.regNumber}</strong>.
              </p>
            </div>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            While your account is in a pending verification state, you may explore the portal and onboard new colleagues, but scheduling, priority deployment selection, and camp matchmaking are currently locked. Once approved, all sections will instantly unlock.
          </p>
        </div>
      )}

      {/* KPI Highlight Grid (Removed 'Patients Healed' card) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-1 text-center">
          <span className="text-3xl block mb-1">📅</span>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Days Committed</span>
          <span className="text-2xl font-extrabold text-slate-900 block">{doctor?.committedDays}</span>
        </div>

        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-1 text-center">
          <span className="text-3xl block mb-1">🌟</span>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Days Completed</span>
          <span className="text-2xl font-extrabold text-slate-900 block">{doctor?.completedDays}</span>
        </div>

        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-1 text-center">
          <span className="text-3xl block mb-1">📩</span>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Active Invites</span>
          <span className="text-2xl font-extrabold text-slate-900 block">
            {activeInvitations.filter(i => i.status === 'Pending').length}
          </span>
        </div>
      </div>

      {/* Dynamic Invitations Drawer Section */}
      <div className="space-y-4">
        <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Mission Invitation Center</h4>
        
        {doctor?.status !== 'Approved' ? (
          <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-xs text-slate-400">
            Locked during verification process. Dispatched camp invitations will populate here once verified.
          </div>
        ) : activeInvitations.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-xs text-slate-400">
            No camp invitations currently pending. Maintain planner calendar slots to attract campaign invites!
          </div>
        ) : (
          <div className="space-y-3">
            {activeInvitations.map(inv => {
              const camp = camps.find(c => c.id === inv.campId);
              if (!camp) return null;
              
              return (
                <div key={inv.id} className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs hover:border-indigo-300 transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-xs">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="bg-indigo-100 text-indigo-800 font-bold text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                        {camp.location} Camp
                      </span>
                      <span className="text-slate-400 font-mono">Date: {camp.date}</span>
                    </div>
                    <h5 className="font-extrabold text-slate-900 text-base">{camp.name}</h5>
                    <p className="text-slate-500">
                      Need Specializations: {camp.neededSpecialties.join(', ')} • Target Patients: {camp.expectedPatients}
                    </p>
                  </div>

                  <div className="flex items-center space-x-2 w-full md:w-auto justify-end">
                    {inv.status === 'Pending' ? (
                      <>
                        <button 
                          onClick={() => handleUpdateInviteStatus(inv.id, 'Accepted')}
                          className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl shadow-xs hover:bg-indigo-700 transition-colors"
                        >
                          Accept Invite
                        </button>
                        <button 
                          onClick={() => handleUpdateInviteStatus(inv.id, 'Declined')}
                          className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-rose-50 hover:text-rose-700 transition-colors"
                        >
                          Decline
                        </button>
                      </>
                    ) : (
                      <span className={`px-4 py-2 rounded-xl font-bold ${
                        inv.status === 'Accepted' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-slate-50 text-slate-500'
                      }`}>
                        Status: {inv.status}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Social Impact Rewards Section */}
      <div className="bg-gradient-to-r from-indigo-950 to-slate-900 text-white p-6 rounded-2xl shadow-xl flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="space-y-1 text-center md:text-left">
          <span className="bg-amber-500/20 text-amber-300 font-extrabold text-[10px] uppercase tracking-widest px-2.5 py-1 rounded">
            Verified Healthcare Ambassador Rank
          </span>
          <h4 className="font-extrabold text-xl mt-1">Community Shield Honor Roll</h4>
          <p className="text-xs text-slate-300 max-w-lg">
            Based on active deployment hours completed on Avodah, you currently occupy the **Tier II Silver Medalist** ranking. 
            Keep serving to earn your Gold Badge.
          </p>
        </div>
        <div className="bg-white/10 p-4 rounded-2xl text-center border border-white/10 w-full md:w-auto">
          <span className="text-3xl block">🥈</span>
          <span className="text-[10px] uppercase font-bold text-slate-300">Level 2 Champion</span>
        </div>
      </div>

    </div>
  );
}

// ==========================================
// SCREEN 7: CAMPAIGN/CAMP CREATION COMPONENT
// ==========================================
function CampCreation({ onSubmit }) {
  const [formData, setFormData] = useState({
    name: '',
    location: 'Koya',
    date: '2026-07-15',
    month: 'Jul',
    day: '15',
    expectedPatients: 400,
    neededSpecialties: ['General Medicine'],
    physicianCount: 2,
    nurseCount: 1,
    nutritionistCount: 1
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSpecialtyToggle = (spec) => {
    if (formData.neededSpecialties.includes(spec)) {
      setFormData({ ...formData, neededSpecialties: formData.neededSpecialties.filter(s => s !== spec) });
    } else {
      setFormData({ ...formData, neededSpecialties: [...formData.neededSpecialties, spec] });
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!formData.name) {
      alert("Please designate a Name for the Camp!");
      return;
    }
    onSubmit(formData);
  };

  return (
    <div className="space-y-6">
      
      <div className="border-b border-slate-100 pb-4">
        <h2 className="text-2xl font-extrabold text-slate-900">Campaign Activation Framework</h2>
        <p className="text-xs text-slate-500 mt-1">
          Launch community camps. Set specialty needs and trigger smart matching to notify ideal personnel.
        </p>
      </div>

      <form onSubmit={handleFormSubmit} className="space-y-6">
        
        {/* Core Camp Info */}
        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/60 space-y-4">
          <h4 className="font-bold text-slate-800 text-sm">Camp Metadata Details</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Camp Campaign Name</label>
              <input 
                type="text" 
                name="name"
                placeholder="Belgaum Diabetes Care & General Diagnostic Camp" 
                value={formData.name}
                onChange={handleChange}
                className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-600 focus:outline-none"
                required
              />
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Target Rural Field Deployment Node</label>
              <select 
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-600 focus:outline-none"
              >
                {PREFERRED_LOCATIONS_LIST.map(loc => (
                  <option key={loc.id} value={loc.name}>{loc.name} Area ({loc.region})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-600 mb-1">Launch Date</label>
              <input 
                type="date" 
                name="date"
                value={formData.date}
                onChange={handleChange}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-600 mb-1">Target Patients Projection</label>
              <input 
                type="number" 
                name="expectedPatients"
                value={formData.expectedPatients}
                onChange={handleChange}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-600 mb-1">Date Month Tag (for AI scheduling)</label>
              <select 
                name="month"
                value={formData.month}
                onChange={handleChange}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-600 focus:outline-none"
              >
                <option value="Jul">July</option>
                <option value="Aug">August</option>
                <option value="Sep">September</option>
                <option value="Oct">October</option>
              </select>
            </div>
          </div>
        </div>

        {/* Capacity Metrics & Personnel Requirements */}
        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/60 space-y-4">
          <h4 className="font-bold text-slate-800 text-sm">Volunteer Staff Configuration Need</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Physicians/MDs Required</label>
              <input 
                type="number" 
                name="physicianCount"
                value={formData.physicianCount}
                onChange={handleChange}
                className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Nurses Required</label>
              <input 
                type="number" 
                name="nurseCount"
                value={formData.nurseCount}
                onChange={handleChange}
                className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Dieticians Required</label>
              <input 
                type="number" 
                name="nutritionistCount"
                value={formData.nutritionistCount}
                onChange={handleChange}
                className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-600"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-600 mb-1">Target Specialties List Required</label>
            <div className="flex flex-wrap gap-2 text-xs">
              {['General Medicine', 'Pediatrics', 'Orthopedics', 'Cardiology', 'Dermatology'].map(spec => {
                const checked = formData.neededSpecialties.includes(spec);
                return (
                  <button
                    type="button"
                    key={spec}
                    onClick={() => handleSpecialtyToggle(spec)}
                    className={`px-3 py-1.5 rounded-lg font-bold border transition-all ${
                      checked 
                        ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs' 
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {checked ? '✓' : '+'} {spec}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Form Action Buttons */}
        <div className="flex justify-end space-x-2 pt-2">
          <button 
            type="submit"
            className="px-6 py-3 bg-indigo-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg hover:bg-indigo-700 transition-colors"
          >
            Launch Campaign & Go To Match Matching 🤖
          </button>
        </div>

      </form>
    </div>
  );
}

// ==========================================
// SCREEN 8: INTELLIGENT AI MATCHING & SEARCH
// ==========================================
function AIDoctorMatching({ doctors, camps, aiQuery, setAiQuery, aiResult, aiIsThinking, onExecuteAISearch, onSendInvites }) {
  const [selectedCampId, setSelectedCampId] = useState(camps[0]?.id || '');
  const [selectedChannel, setSelectedChannel] = useState('Email & SMS');
  const [bulkCheckedDoctors, setBulkCheckedDoctors] = useState([]);

  const activeCamp = camps.find(c => c.id === selectedCampId);

  // Trigger bulk selections on check status
  const toggleDoctorSelection = (id) => {
    if (bulkCheckedDoctors.includes(id)) {
      setBulkCheckedDoctors(bulkCheckedDoctors.filter(dId => dId !== id));
    } else {
      setBulkCheckedDoctors([...bulkCheckedDoctors, id]);
    }
  };

  const handleSelectAllMatched = (matchedList) => {
    if (bulkCheckedDoctors.length === matchedList.length) {
      setBulkCheckedDoctors([]);
    } else {
      setBulkCheckedDoctors(matchedList.map(m => m.id));
    }
  };

  const executeCopilotQuery = (queryText) => {
    setAiQuery(queryText);
    onExecuteAISearch(queryText);
  };

  return (
    <div className="space-y-8">
      
      <div className="border-b border-slate-100 pb-4">
        <h2 className="text-2xl font-extrabold text-slate-900">Intelligent Deployment Match Engine</h2>
        <p className="text-xs text-slate-500 mt-1">
          Apply intelligent weight scores based on specialties, distance, availability, and alignment vectors to identify candidate matches.
        </p>
      </div>

      {/* Weight Factor Score Cards */}
      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
        <div className="flex justify-between items-center text-xs">
          <span className="font-bold uppercase tracking-wider text-slate-700">Weight Balancing Factor KPI Metrics</span>
          <span className="text-[10px] text-slate-400 font-mono">System Core Logic</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: 'Specialty Alignment', pct: '40%' },
            { label: 'Location Priorities', pct: '25%' },
            { label: 'Planner Availability', pct: '20%' },
            { label: 'Past Camp Service', pct: '10%' },
            { label: 'Commute Index', pct: '5%' }
          ].map((item, index) => (
            <div key={index} className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
              <span className="block text-[10px] font-bold text-slate-400 uppercase">{item.label}</span>
              <div className="flex items-center space-x-1.5">
                <span className="text-lg font-black text-indigo-700">{item.pct}</span>
                <span className="text-[8px] font-semibold text-slate-400 uppercase">Weight</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* --- AI COPILOT NATURAL LANGUAGE DIALOGUE BAR --- */}
      <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-2xl p-5 md:p-6 shadow-xl space-y-4">
        <div className="flex items-center space-x-3 text-xs">
          <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center text-white text-base">🤖</div>
          <div>
            <h4 className="font-extrabold text-white">Avodah Match Copilot Chat</h4>
            <p className="text-[10px] text-slate-400">Query the system to identify ideal doctors using conversational language.</p>
          </div>
        </div>

        {/* Suggested Prompts */}
        <div className="flex flex-wrap gap-2 text-xs">
          <button 
            type="button"
            onClick={() => executeCopilotQuery("show all available doctors for camp at Koya on July")}
            className="p-1 px-3 bg-white/10 hover:bg-white/20 text-slate-200 rounded-full transition-all border border-white/5 font-semibold"
          >
            "Show available doctors for Koya in July"
          </button>
          <button 
            type="button"
            onClick={() => executeCopilotQuery("show available pediatric specialty in July")}
            className="p-1 px-3 bg-white/10 hover:bg-white/20 text-slate-200 rounded-full transition-all border border-white/5 font-semibold"
          >
            "Find pediatric specialty in July"
          </button>
        </div>

        <div className="flex gap-2">
          <input 
            type="text"
            placeholder="Ask Copilot... e.g. show available doctors for camp at Belgaum in July"
            value={aiQuery}
            onChange={(e) => setAiQuery(e.target.value)}
            className="flex-1 text-xs p-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <button 
            type="button"
            onClick={() => onExecuteAISearch(aiQuery)}
            className="px-5 py-3 bg-indigo-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-indigo-500 transition-all shadow-md flex items-center space-x-1.5"
          >
            <span>Scan Match</span>
          </button>
        </div>

        {/* Copilot Thinking simulation */}
        {aiIsThinking && (
          <div className="flex items-center space-x-2 text-xs text-indigo-300 animate-pulse pt-2">
            <span className="text-sm">⚙️</span>
            <span>Evaluating volunteer alignment weights...</span>
          </div>
        )}

        {/* Dynamic Copilot Matched Results */}
        {aiResult && (
          <div className="bg-white/5 rounded-xl p-4 border border-white/10 space-y-4 animate-fade-in-down">
            <div className="flex justify-between items-center pb-2 border-b border-white/15 text-xs">
              <span className="font-bold text-indigo-300 uppercase tracking-wider">Matched Candidates Found ({aiResult.results.length})</span>
              <button 
                onClick={() => handleSelectAllMatched(aiResult.results)}
                className="text-[10px] text-slate-300 hover:text-white font-bold"
              >
                Toggle Select All Checked Matches
              </button>
            </div>

            <div className="space-y-2">
              {aiResult.results.map(match => {
                const isChecked = bulkCheckedDoctors.includes(match.id);
                return (
                  <div key={match.id} className="p-3 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 transition-colors flex justify-between items-center">
                    <div className="flex items-center space-x-3 text-xs">
                      <input 
                        type="checkbox" 
                        checked={isChecked}
                        onChange={() => toggleDoctorSelection(match.id)}
                        className="rounded border-slate-300 focus:ring-indigo-500"
                      />
                      <span className="text-xl">{match.avatar}</span>
                      <div>
                        <p className="font-bold text-white">{match.name}</p>
                        <p className="text-slate-400 text-[10px]">{match.specialty} • {match.regNumber}</p>
                      </div>
                    </div>

                    <div className="text-right text-xs">
                      <div className="flex items-center space-x-1">
                        <span className="font-mono text-emerald-400 font-extrabold text-base">{match.calculatedScore}%</span>
                        <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest">Match Score</span>
                      </div>
                      <span className="text-slate-400 text-[10px]">Distance commute: {PREFERRED_LOCATIONS_LIST.find(l => l.name === match.locationPriorities[0])?.distance || 10} km</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Action dispatch for notifications */}
            <div className="pt-2 border-t border-white/15 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="flex items-center space-x-2 text-xs">
                <span className="text-slate-300">Invite Delivery Channel:</span>
                <select 
                  value={selectedChannel} 
                  onChange={(e) => setSelectedChannel(e.target.value)}
                  className="p-1 px-2 border border-white/20 rounded bg-slate-800 text-white text-xs focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="Email & SMS">Combined Email & SMS</option>
                  <option value="WhatsApp & Email">Bulk WhatsApp & Email</option>
                  <option value="WhatsApp Only">WhatsApp Only Direct</option>
                </select>
              </div>

              <button 
                onClick={() => onSendInvites(selectedCampId, bulkCheckedDoctors, selectedChannel)}
                disabled={bulkCheckedDoctors.length === 0}
                className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 disabled:opacity-40 text-white font-bold text-xs uppercase tracking-wider rounded-lg hover:bg-indigo-500 transition-colors shadow-lg"
              >
                Send Invites to Selected ({bulkCheckedDoctors.length}) ✉️
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}

// ==========================================
// SCREEN 9: INVITATION CENTER COMPONENT
// ==========================================
function InvitationCenter({ invitations, camps, doctors }) {
  return (
    <div className="space-y-6">
      
      <div className="border-b border-slate-100 pb-4">
        <h2 className="text-2xl font-extrabold text-slate-900">Dispatched Invitations Tracker</h2>
        <p className="text-xs text-slate-500 mt-1">
          Monitor communication deliverability status logs for active field deployments.
        </p>
      </div>

      {/* Grid Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">Deliverability Status Meter</span>
          <span className="text-2xl font-extrabold text-slate-900 block mt-1">100% Deliverable</span>
          <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2">
            <div className="bg-amber-500 h-1.5 rounded-full w-full"></div>
          </div>
        </div>

        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">Acceptance Rate Index</span>
          <span className="text-2xl font-extrabold text-slate-900 block mt-1">
            {invitations.length > 0 ? Math.round((invitations.filter(i => i.status === 'Accepted').length / invitations.length) * 100) : 0}% Verified
          </span>
          <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2">
            <div 
              className="bg-indigo-600 h-1.5 rounded-full" 
              style={{ width: `${invitations.length > 0 ? (invitations.filter(i => i.status === 'Accepted').length / invitations.length) * 100 : 0}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">Total Active Recalls</span>
          <span className="text-2xl font-extrabold text-slate-900 block mt-1">{invitations.length} Active Tracks</span>
          <span className="text-[10px] text-slate-400 block mt-1">Across all communication pipelines</span>
        </div>
      </div>

      {/* Log list */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200">
          <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Dispatched Records Logs</h4>
        </div>

        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-200 text-slate-500 uppercase text-[10px] tracking-wider">
              <th className="p-4">Recipient Volunteer</th>
              <th className="p-4">Camp Assignment</th>
              <th className="p-4">Pipeline Protocol</th>
              <th className="p-4">Timestamp</th>
              <th className="p-4 text-right">Fulfillment</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {invitations.map(inv => {
              const doc = doctors.find(d => d.id === inv.doctorId);
              const camp = camps.find(c => c.id === inv.campId);
              if (!doc || !camp) return null;

              return (
                <tr key={inv.id} className="hover:bg-slate-50/50 transition-all">
                  <td className="p-4 font-bold text-slate-900">{doc.name}</td>
                  <td className="p-4 text-slate-600">{camp.name}</td>
                  <td className="p-4 font-mono text-slate-500">{inv.sentVia}</td>
                  <td className="p-4 text-slate-400">{inv.timestamp}</td>
                  <td className="p-4 text-right">
                    <span className={`px-2.5 py-0.5 rounded-full font-bold text-[9px] uppercase tracking-wide ${
                      inv.status === 'Accepted' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                      inv.status === 'Pending' ? 'bg-amber-50 text-amber-800 border border-amber-200 animate-pulse' :
                      'bg-slate-50 text-slate-500'
                    }`}>
                      {inv.status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

    </div>
  );
}

// ==========================================
// SCREEN 10: CAMP EXECUTION/DAY-OF DASHBOARD
// ==========================================
function CampExecution({ camps, doctors, checkIns, setCheckIns, triggerToast }) {
  const [activeCampId, setActiveCampId] = useState(camps[0]?.id || '');
  
  const selectedCamp = camps.find(c => c.id === activeCampId);
  
  // Track check in changes
  const handleCheckInToggle = (docId) => {
    const key = `${docId}-${activeCampId}`;
    const curr = checkIns[key];
    
    if (!curr) {
      setCheckIns({
        ...checkIns,
        [key]: { checkInTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), checkOutTime: '', status: 'Checked In' }
      });
      triggerToast(`Volunteer checked in successfully! Timestamp logged.`);
    } else if (curr.status === 'Checked In') {
      setCheckIns({
        ...checkIns,
        [key]: { ...curr, checkOutTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), status: 'Checked Out' }
      });
      triggerToast(`Volunteer checked out successfully! Session finalized.`);
    }
  };

  return (
    <div className="space-y-6">
      
      <div className="border-b border-slate-100 pb-4">
        <h2 className="text-2xl font-extrabold text-slate-900">Day-of Camp Execution Terminal</h2>
        <p className="text-xs text-slate-500 mt-1">
          Simulate live attendance tracking during camp execution. Check volunteers in and out of active locations.
        </p>
      </div>

      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs">
        <label className="font-bold text-slate-700 uppercase tracking-wide">Select Target Running Camp Campaign:</label>
        <select 
          value={activeCampId} 
          onChange={(e) => setActiveCampId(e.target.value)}
          className="p-1.5 px-2 border border-slate-300 rounded bg-white font-semibold focus:ring-1 focus:ring-indigo-600 text-slate-800"
        >
          {camps.map(c => (
            <option key={c.id} value={c.id}>{c.name} ({c.location})</option>
          ))}
        </select>
      </div>

      {selectedCamp && (
        <div className="space-y-6">
          {/* Camp detail cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
            <div className="bg-white border border-slate-200 p-4 rounded-xl">
              <span className="font-bold text-slate-400 uppercase tracking-wider block">Camp Field</span>
              <span className="text-sm font-extrabold text-slate-800 block mt-1">{selectedCamp.location} Area</span>
            </div>
            <div className="bg-white border border-slate-200 p-4 rounded-xl">
              <span className="font-bold text-slate-400 uppercase tracking-wider block">Target Capacity Patients</span>
              <span className="text-sm font-extrabold text-slate-800 block mt-1">{selectedCamp.expectedPatients} Patients</span>
            </div>
            <div className="bg-white border border-slate-200 p-4 rounded-xl">
              <span className="font-bold text-slate-400 uppercase tracking-wider block">Scheduled Date</span>
              <span className="text-sm font-extrabold text-slate-800 block mt-1">{selectedCamp.date}</span>
            </div>
            <div className="bg-white border border-slate-200 p-4 rounded-xl">
              <span className="font-bold text-slate-400 uppercase tracking-wider block">Assigned Count</span>
              <span className="text-sm font-extrabold text-slate-800 block mt-1">{selectedCamp.assignedVolunteers.length} Enrolled</span>
            </div>
          </div>

          {/* Volunteer Roster Check in Area */}
          <div className="space-y-4">
            <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Attendance Logs Roster</h4>
            
            {selectedCamp.assignedVolunteers.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-xs text-slate-400">
                No active volunteer practitioners mapped to this camp yet. Complete matchmaking steps first!
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] tracking-wider">
                      <th className="p-4">Volunteer Info</th>
                      <th className="p-4">Clinical Specialization</th>
                      <th className="p-4">Check In Stamp</th>
                      <th className="p-4">Check Out Stamp</th>
                      <th className="p-4 text-right">Action Protocol</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedCamp.assignedVolunteers.map(vId => {
                      const doc = doctors.find(d => d.id === vId);
                      if (!doc) return null;
                      
                      const key = `${doc.id}-${activeCampId}`;
                      const attendance = checkIns[key];

                      return (
                        <tr key={doc.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-4 font-bold text-slate-900">{doc.name}</td>
                          <td className="p-4 text-slate-600">{doc.specialty}</td>
                          <td className="p-4 font-mono text-slate-500">{attendance?.checkInTime || '--'}</td>
                          <td className="p-4 font-mono text-slate-500">{attendance?.checkOutTime || '--'}</td>
                          <td className="p-4 text-right">
                            <button
                              onClick={() => handleCheckInToggle(doc.id)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-all ${
                                !attendance ? 'bg-indigo-600 hover:bg-indigo-700' :
                                attendance.status === 'Checked In' ? 'bg-indigo-600 hover:bg-indigo-700' :
                                'bg-slate-300 text-slate-600 cursor-not-allowed'
                              }`}
                              disabled={attendance?.status === 'Checked Out'}
                            >
                              {!attendance ? 'Check In 🛫' :
                               attendance.status === 'Checked In' ? 'Check Out 🛬' :
                               'Completed ✓'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

// ==========================================
// SCREEN 11: ANALYTICS SUITE (REGULATOR-READY)
// ==========================================
function AnalyticsDashboard({ doctors, camps }) {
  const verifiedCount = doctors.filter(d => d.status === 'Approved').length;

  return (
    <div className="space-y-8">
      
      <div className="border-b border-slate-100 pb-4 flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900">National Impact & Audit Analytics</h2>
          <p className="text-xs text-slate-500 mt-1">
            Regulator compliance platform tracker. Verify credential metrics and geographic camp coverage statistics.
          </p>
        </div>
        <span className="bg-indigo-900 text-white font-mono text-xs px-3 py-1 rounded border border-indigo-700 mt-2 md:mt-0 uppercase tracking-widest">
          Audit Lock State Active
        </span>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
          <span className="text-xs font-bold uppercase text-slate-500 tracking-wider block">Verified Practitioners Registry</span>
          <div className="flex items-baseline space-x-1 mt-1">
            <span className="text-3xl font-black text-slate-900">{verifiedCount}</span>
            <span className="text-xs font-semibold text-slate-400">/ {doctors.length} Registered</span>
          </div>
        </div>

        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
          <span className="text-xs font-bold uppercase text-slate-500 tracking-wider block">Cumulative Clinical Hours</span>
          <div className="flex items-baseline space-x-1 mt-1">
            <span className="text-3xl font-black text-slate-900">1,240 Hrs</span>
            <span className="text-[10px] text-emerald-600 font-bold">↑ 12% YoY</span>
          </div>
        </div>

        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
          <span className="text-xs font-bold uppercase text-slate-500 tracking-wider block">Health Camps Conducted</span>
          <div className="flex items-baseline space-x-1 mt-1">
            <span className="text-3xl font-black text-slate-900">38 Conducted</span>
            <span className="text-xs font-semibold text-slate-400">Across 5 Zones</span>
          </div>
        </div>

        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
          <span className="text-xs font-bold uppercase text-slate-500 tracking-wider block">Total Patients Treated</span>
          <div className="flex items-baseline space-x-1 mt-1">
            <span className="text-3xl font-black text-slate-900">5,120 Treated</span>
            <span className="text-[10px] text-indigo-600 font-bold">100% EHR Logged</span>
          </div>
        </div>
      </div>

      {/* Specialty Coverage Custom CSS Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Specialty distribution chart */}
        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
          <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Practitioner Specialty Deployment Distribution</h4>
          
          <div className="space-y-3 pt-2">
            {[
              { label: 'General Medicine & Family Clinic', count: 48, color: 'bg-indigo-600' },
              { label: 'Pediatrics Specialty Roster', count: 32, color: 'bg-indigo-600' },
              { label: 'Cardiology Support Specialty', count: 22, color: 'bg-purple-600' },
              { label: 'Orthopedic Specialty Roster', count: 15, color: 'bg-amber-600' },
              { label: 'Dermatology/Skin Roster Care', count: 8, color: 'bg-emerald-600' }
            ].map((item, index) => (
              <div key={index} className="space-y-1 text-xs">
                <div className="flex justify-between font-semibold">
                  <span className="text-slate-600">{item.label}</span>
                  <span className="text-slate-900">{item.count} Members ({Math.round((item.count / 125) * 100)}%)</span>
                </div>
                <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                  <div className={`${item.color} h-full transition-all`} style={{ width: `${(item.count / 48) * 100}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Geographic Camp Coverage Custom representation */}
        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
          <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Field Area Patient Volume Coverage Index</h4>
          
          <div className="space-y-3 pt-2">
            {PREFERRED_LOCATIONS_LIST.map((loc, idx) => (
              <div key={loc.id} className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 inline-block"></span>
                  <div>
                    <h5 className="font-bold text-slate-900">{loc.name} Area</h5>
                    <p className="text-slate-500 text-[10px]">{loc.region}</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-bold text-slate-800 inline-block block">{loc.activeCases} Serviced</span>
                  <span className="text-[10px] text-slate-400 block">Commute Commits: {loc.distance} km</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}

// ==========================================
// SUB-COMPONENT: ADMIN DASHBOARD OVERVIEW
// ==========================================
function AdminDashboard({ doctors, camps, invitations, setActiveTab }) {
  const pendingDocs = doctors.filter(d => d.status === 'Pending');
  const activeCamps = camps.filter(c => c.status === 'Scheduled');

  return (
    <div className="space-y-8">
      
      <div className="border-b border-slate-100 pb-4">
        <h2 className="text-2xl font-extrabold text-slate-900">Portal Administrative Overview</h2>
        <p className="text-xs text-slate-500 mt-1">Welcome back. Maintain a steady volunteer grid to support remote healthcare.</p>
      </div>

      {/* Top Level Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Verification Alert Card */}
        <div className="bg-gradient-to-br from-amber-50 to-amber-100/30 p-5 rounded-2xl border border-amber-100 space-y-3 text-xs">
          <span className="font-bold text-amber-800 uppercase tracking-wider block">Credential Actions Needed</span>
          <div className="flex items-baseline space-x-1.5">
            <span className="text-3xl font-black text-amber-950">{pendingDocs.length}</span>
            <span className="font-semibold text-amber-700">Awaiting Audits</span>
          </div>
          <button 
            onClick={() => setActiveTab('verification')}
            className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg transition-colors"
          >
            Review Registrations 📋
          </button>
        </div>

        {/* Camp Dispatch Matching Alert Card */}
        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/30 p-5 rounded-2xl border border-indigo-100 space-y-3 text-xs">
          <span className="font-bold text-indigo-800 uppercase tracking-wider block">Camp Deployment Match Engine</span>
          <div className="flex items-baseline space-x-1.5">
            <span className="text-3xl font-black text-indigo-950">{activeCamps.length}</span>
            <span className="font-semibold text-indigo-700">Active Scheduled Campaigns</span>
          </div>
          <button 
            onClick={() => setActiveTab('camp-creation')}
            className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors"
          >
            Configure Campaign ➕
          </button>
        </div>

        {/* Deployment Invitation Center Tracker */}
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/30 p-5 rounded-2xl border border-emerald-100 space-y-3 text-xs">
          <span className="font-bold text-emerald-800 uppercase tracking-wider block">Communication Tracking</span>
          <div className="flex items-baseline space-x-1.5">
            <span className="text-3xl font-black text-emerald-950">{invitations.length}</span>
            <span className="font-semibold text-emerald-700">Invites Sent</span>
          </div>
          <button 
            onClick={() => setActiveTab('invitations')}
            className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors"
          >
            View Invitations Logs 📨
          </button>
        </div>

      </div>

      {/* Quick Access Grid Links */}
      <div className="space-y-4">
        <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Quick Diagnostic Toolkits</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div 
            onClick={() => setActiveTab('matching')}
            className="p-5 bg-slate-50 hover:bg-indigo-50/50 border border-slate-200 hover:border-indigo-300 rounded-2xl cursor-pointer transition-all flex items-start space-x-4"
          >
            <span className="text-3xl">🤖</span>
            <div>
              <h5 className="font-extrabold text-slate-900 text-base">Copilot Smart Match Search Engine</h5>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Scan volunteer databases conversationally to determine perfect doctor camp matches.
              </p>
            </div>
          </div>

          <div 
            onClick={() => setActiveTab('execution')}
            className="p-5 bg-slate-50 hover:bg-amber-50/50 border border-slate-200 hover:border-indigo-300 rounded-2xl cursor-pointer transition-all flex items-start space-x-4"
          >
            <span className="text-3xl">⏱️</span>
            <div>
              <h5 className="font-extrabold text-slate-900 text-base">Day-of Camp Check-in Manager</h5>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Log real-time attendance, check clinical specialists in and out, and evaluate camp stats on site.
              </p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}