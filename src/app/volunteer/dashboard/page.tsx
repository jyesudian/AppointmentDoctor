'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';

const CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  'Bangalore': { lat: 12.9716, lng: 77.5946 },
  'Koya': { lat: 12.9600, lng: 77.6300 },
  'Belgaum': { lat: 15.8528, lng: 74.5042 },
  'Mysore': { lat: 12.2958, lng: 76.6394 },
  'Hubli': { lat: 15.3647, lng: 75.1240 },
  'Mangalore': { lat: 12.9141, lng: 74.8560 }
};

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return Math.round(d);
}

export default function VolunteerDashboard() {
  const router = useRouter();
  const supabase = createClient();

  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Availability Planner State
  const [selectedMonth, setSelectedMonth] = useState('Jul');
  const [sessionMode, setSessionMode] = useState('Full Day');
  const [recDay, setRecDay] = useState('Saturdays & Sundays');
  const [recMonthsCount, setRecMonthsCount] = useState(2);

  // Preferred Fields State
  const [priorities, setPriorities] = useState<string[]>([]);

  // Invitations State
  const [invitations, setInvitations] = useState<any[]>([]);
  const [loadingInvitations, setLoadingInvitations] = useState(false);

  // Assigned Camps State
  const [assignedCamps, setAssignedCamps] = useState<any[]>([]);

  // Camp Details Modal States
  const [selectedCampDetails, setSelectedCampDetails] = useState<any>(null);
  const [campRoster, setCampRoster] = useState<any[]>([]);
  const [loadingRoster, setLoadingRoster] = useState(false);

  // Base Clinic Settings
  const [baseClinicName, setBaseClinicName] = useState('General Clinic');
  const [baseClinicCity, setBaseClinicCity] = useState('Bangalore');
  const [dbLocations, setDbLocations] = useState<any[]>([]);

  // Resubmission Form State
  const [resubmitForm, setResubmitForm] = useState({
    name: '',
    gender: 'Male',
    role: 'Doctor',
    mobile: '',
    regNumber: '',
    specialty: 'General Medicine',
    experience: '5',
    committedDays: '10',
  });
  const [resubmitDegree, setResubmitDegree] = useState<File | null>(null);
  const [resubmitLicense, setResubmitLicense] = useState<File | null>(null);
  const [resubmitError, setResubmitError] = useState<string | null>(null);
  const [resubmitLoading, setResubmitLoading] = useState(false);

  const fetchSession = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        router.push('/auth/login');
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError || !profileData) {
        router.push('/auth/login');
        return;
      }

      setProfile(profileData);
      await fetchLocations();
      await fetchInvitations(user.id);
      await fetchAssignedCamps(user.id);
    } catch (err) {
      console.error('Error fetching volunteer session:', err);
      router.push('/auth/login');
    } finally {
      setLoading(false);
    }
  };

  const fetchInvitations = async (userId: string) => {
    setLoadingInvitations(true);
    try {
      const { data, error } = await supabase
        .from('invitations')
        .select(`
          *,
          camps (
            *
          )
        `)
        .eq('doctor_id', userId)
        .order('timestamp', { ascending: false });

      if (!error && data) {
        const activeInvites = data.filter((inv: any) => inv.camps && inv.camps.status !== 'Drafting');
        setInvitations(activeInvites);
      } else if (error) {
        console.error('Error fetching invitations:', error);
      }
    } catch (err) {
      console.error('Error in fetchInvitations:', err);
    } finally {
      setLoadingInvitations(false);
    }
  };

  const handleAcceptInvitation = async (invite: any) => {
    try {
      // 1. Fetch current camp data to get the assigned_volunteers array
      const { data: campData, error: campFetchError } = await supabase
        .from('camps')
        .select('assigned_volunteers')
        .eq('id', invite.camp_id)
        .single();

      if (campFetchError) throw campFetchError;

      const currentVolunteers = campData.assigned_volunteers || [];
      if (!currentVolunteers.includes(profile.id)) {
        currentVolunteers.push(profile.id);
      }

      // 2. Update camp's assigned_volunteers
      const { error: campUpdateError } = await supabase
        .from('camps')
        .update({ assigned_volunteers: currentVolunteers })
        .eq('id', invite.camp_id);

      if (campUpdateError) throw campUpdateError;

      // 3. Update invitation status to 'Accepted'
      const { error: inviteUpdateError } = await supabase
        .from('invitations')
        .update({ status: 'Accepted' })
        .eq('id', invite.id);

      if (inviteUpdateError) throw inviteUpdateError;

      triggerToast("You have successfully accepted the invitation!");
      // 4. Refresh session & invitations
      await fetchSession();
    } catch (err: any) {
      triggerToast(`Failed to accept invitation: ${err.message}`);
    }
  };

  const handleDeclineInvitation = async (invite: any) => {
    try {
      // 1. Update invitation status to 'Declined'
      const { error: inviteUpdateError } = await supabase
        .from('invitations')
        .update({ status: 'Declined' })
        .eq('id', invite.id);

      if (inviteUpdateError) throw inviteUpdateError;

      // 2. If the user was previously in the camp's assigned_volunteers list, remove them
      const { data: campData, error: campFetchError } = await supabase
        .from('camps')
        .select('assigned_volunteers')
        .eq('id', invite.camp_id)
        .single();

      if (!campFetchError && campData) {
        const currentVolunteers = campData.assigned_volunteers || [];
        if (currentVolunteers.includes(profile.id)) {
          const updatedVolunteers = currentVolunteers.filter((id: string) => id !== profile.id);
          await supabase
            .from('camps')
            .update({ assigned_volunteers: updatedVolunteers })
            .eq('id', invite.camp_id);
        }
      }

      triggerToast("Invitation declined successfully.");
      await fetchSession();
    } catch (err: any) {
      triggerToast(`Failed to decline invitation: ${err.message}`);
    }
  };

  const fetchAssignedCamps = async (userId: string) => {
    try {
      const { data: campsData, error: campsError } = await supabase
        .from('camps')
        .select('*')
        .order('date', { ascending: false });

      if (campsError) throw campsError;

      const { data: invitesData, error: invitesError } = await supabase
        .from('invitations')
        .select('camp_id')
        .eq('doctor_id', userId)
        .eq('status', 'Accepted');

      if (invitesError) {
        console.error('Error fetching accepted invitations for roster:', invitesError);
      }

      const acceptedCampIds = new Set(invitesData?.map((i: any) => i.camp_id) || []);

      if (campsData) {
        const myAssigned = campsData.filter((c: any) => 
          (c.assigned_volunteers?.includes(userId) || acceptedCampIds.has(c.id)) && c.status !== 'Drafting'
        );
        setAssignedCamps(myAssigned);
      }
    } catch (err) {
      console.error('Error in fetchAssignedCamps:', err);
    }
  };

  const handleOpenCampDetails = async (camp: any) => {
    setSelectedCampDetails(camp);
    setCampRoster([]);
    setLoadingRoster(true);
    try {
      const { data, error } = await supabase
        .from('invitations')
        .select(`
          *,
          profiles (
            *
          )
        `)
        .eq('camp_id', camp.id)
        .eq('status', 'Accepted');

      if (!error && data) {
        setCampRoster(data);
      } else if (error) {
        console.error('Error fetching roster:', error);
      }
    } catch (err) {
      console.error('Error in handleOpenCampDetails:', err);
    } finally {
      setLoadingRoster(false);
    }
  };

  const fetchLocations = async () => {
    try {
      const { data, error } = await supabase
        .from('preferred_locations')
        .select('*')
        .order('priority', { ascending: true });
      if (!error && data) {
        setDbLocations(data);
      }
    } catch (err) {
      console.error('Error fetching preferred locations:', err);
    }
  };

  const handleSaveBaseClinic = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          base_clinic: { name: baseClinicName, city: baseClinicCity }
        })
        .eq('id', profile.id);

      if (error) throw error;

      triggerToast("Base clinic details successfully updated!");
      await fetchSession();
    } catch (err: any) {
      triggerToast(`Failed to update clinic: ${err.message}`);
    }
  };

  useEffect(() => {
    fetchSession();
  }, [router, supabase]);

  // Pre-fill the resubmission form when a rejected profile is loaded
  useEffect(() => {
    if (profile && profile.status === 'Rejected') {
      setResubmitForm({
        name: profile.name || '',
        gender: profile.gender || 'Male',
        role: profile.role || 'Doctor',
        mobile: profile.mobile || '',
        regNumber: profile.reg_number || '',
        specialty: profile.specialty || 'General Medicine',
        experience: String(profile.experience || 5),
        committedDays: String(profile.committed_days || 10),
      });
    }
  }, [profile]);

  // Sync preferred locations priorities when profile and dbLocations are loaded
  useEffect(() => {
    if (profile) {
      if (dbLocations.length > 0) {
        const dbLocationNames = dbLocations.map(l => l.name);
        const filteredPriorities = (profile.location_priorities || []).filter((loc: string) => dbLocationNames.includes(loc));
        setPriorities(filteredPriorities);
      } else {
        setPriorities(profile.location_priorities || []);
      }
      if (profile.base_clinic) {
        setBaseClinicName(profile.base_clinic.name || 'General Clinic');
        setBaseClinicCity(profile.base_clinic.city || 'Bangalore');
      }
    }
  }, [profile, dbLocations]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/auth/login');
  };

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleLockedTab = (tabName: string) => {
    if (profile?.status !== 'Approved') {
      triggerToast(`Verification Restricted: Access to ${tabName} is restricted until credentials review is approved.`);
    } else {
      setActiveTab(tabName.toLowerCase());
    }
  };

  // Availability Planner Database sync toggles
  const toggleDoctorCalendarDay = async (month: string, day: number) => {
    try {
      const updatedMonths = { ...(profile?.available_months || {}) };
      if (!updatedMonths[month]) updatedMonths[month] = [];
      
      if (updatedMonths[month].includes(day)) {
        updatedMonths[month] = updatedMonths[month].filter((dVal: number) => dVal !== day);
      } else {
        updatedMonths[month] = [...updatedMonths[month], day].sort((a: number, b: number) => a - b);
      }
      
      const totalDays = Object.values(updatedMonths).reduce((acc: number, curr: any) => acc + (curr?.length || 0), 0);
      
      const { error } = await supabase
        .from('profiles')
        .update({
          available_months: updatedMonths,
          committed_days: totalDays
        })
        .eq('id', profile.id);

      if (error) throw error;
      
      triggerToast(`Calendar day updated for ${month} ${day}.`);
      await fetchSession();
    } catch (err: any) {
      triggerToast(`Failed to update availability: ${err.message}`);
    }
  };

  const handleBulkApply = async (monthOrMonths: string | string[], daysToSelect: number[]) => {
    try {
      const updatedMonths = { ...(profile?.available_months || {}) };
      
      if (Array.isArray(monthOrMonths)) {
        monthOrMonths.forEach((m) => {
          updatedMonths[m] = [...new Set([...(updatedMonths[m] || []), ...daysToSelect])].sort((a: number, b: number) => a - b);
        });
      } else {
        updatedMonths[monthOrMonths] = [...new Set([...(updatedMonths[monthOrMonths] || []), ...daysToSelect])].sort((a: number, b: number) => a - b);
      }
      
      const totalDays = Object.values(updatedMonths).reduce((acc: number, curr: any) => acc + (curr?.length || 0), 0);
      
      const { error } = await supabase
        .from('profiles')
        .update({
          available_months: updatedMonths,
          committed_days: totalDays
        })
        .eq('id', profile.id);

      if (error) throw error;
      
      triggerToast(`Applied bulk availability changes.`);
      await fetchSession();
    } catch (err: any) {
      triggerToast(`Failed to apply bulk availability: ${err.message}`);
    }
  };

  const handleApplyRecurringBuilder = async () => {
    let daysToSelect: number[] = [];
    if (recDay === 'Saturdays') daysToSelect = [6, 13, 20, 27];
    else if (recDay === 'Sundays') daysToSelect = [7, 14, 21, 28];
    else if (recDay === 'Saturdays & Sundays') daysToSelect = [6, 7, 13, 14, 20, 21, 27, 28];
    else if (recDay === 'Weekdays') daysToSelect = [1,2,3,4,5,8,9,10,11,12,15,16,17,18,19,22,23,24,25,26];

    const months = ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const startIndex = months.indexOf(selectedMonth);
    const stopIndex = Math.min(months.length, startIndex + recMonthsCount);

    const targetMonths: string[] = [];
    for (let i = startIndex; i < stopIndex; i++) {
      targetMonths.push(months[i]);
    }

    await handleBulkApply(targetMonths, daysToSelect);
  };

  const handleClearMonthAvailability = async (month: string) => {
    try {
      const updatedMonths = { ...(profile?.available_months || {}) };
      updatedMonths[month] = [];
      
      const totalDays = Object.values(updatedMonths).reduce((acc: number, curr: any) => acc + (curr?.length || 0), 0);
      
      const { error } = await supabase
        .from('profiles')
        .update({
          available_months: updatedMonths,
          committed_days: totalDays
        })
        .eq('id', profile.id);

      if (error) throw error;
      
      triggerToast(`Cleared all selected dates for ${month}.`);
      await fetchSession();
    } catch (err: any) {
      triggerToast(`Failed to clear month: ${err.message}`);
    }
  };

  // Preferred Fields Priority Toggles
  const handlePriorityShift = (location: string, direction: 'up' | 'down') => {
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

  const toggleLocationEnlistment = (location: string) => {
    if (priorities.includes(location)) {
      setPriorities(priorities.filter(l => l !== location));
    } else {
      setPriorities([...priorities, location]);
    }
  };

  const handleSaveLocations = async () => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          location_priorities: priorities
        })
        .eq('id', profile.id);

      if (error) throw error;
      
      triggerToast("Field priority alignment settings saved!");
      await fetchSession();
    } catch (err: any) {
      triggerToast(`Failed to save preferences: ${err.message}`);
    }
  };

  const handleResubmitChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setResubmitForm({ ...resubmitForm, [e.target.name]: e.target.value });
  };

  // Submit resubmission credentials
  const handleResubmitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResubmitError(null);
    setResubmitLoading(true);

    if (!resubmitForm.name || !resubmitForm.regNumber) {
      setResubmitError('Please fill in Name and Council Registration Number.');
      setResubmitLoading(false);
      return;
    }

    try {
      const userId = profile.id;
      let degreePath = profile.degree_file_path;
      let licensePath = profile.license_file_path;

      // 1. Upload new degree if selected
      if (resubmitDegree) {
        const degreeExt = resubmitDegree.name.split('.').pop();
        const degreeName = `degree_${Date.now()}.${degreeExt}`;
        const degreeFullPath = `${userId}/${degreeName}`;

        const { error: uploadError } = await supabase.storage
          .from('verification-documents')
          .upload(degreeFullPath, resubmitDegree);

        if (uploadError) throw uploadError;
        degreePath = degreeFullPath;
      }

      // 2. Upload new license copy if selected
      if (resubmitLicense) {
        const licenseExt = resubmitLicense.name.split('.').pop();
        const licenseName = `license_${Date.now()}.${licenseExt}`;
        const licenseFullPath = `${userId}/${licenseName}`;

        const { error: uploadError } = await supabase.storage
          .from('verification-documents')
          .upload(licenseFullPath, resubmitLicense);

        if (uploadError) throw uploadError;
        licensePath = licenseFullPath;
      }

      // 3. Update public profiles (status -> Pending, clear rejection_reason)
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          name: resubmitForm.name,
          role: resubmitForm.role,
          gender: resubmitForm.gender,
          specialty: resubmitForm.specialty,
          reg_number: resubmitForm.regNumber,
          experience: parseInt(resubmitForm.experience) || 5,
          mobile: resubmitForm.mobile,
          committed_days: parseInt(resubmitForm.committedDays) || 10,
          status: 'Pending',
          rejection_reason: null, // Reset rejection feedback
          degree_file_path: degreePath,
          license_file_path: licensePath
        })
        .eq('id', userId);

      if (updateError) throw updateError;

      // Update Auth metadata
      await supabase.auth.updateUser({
        data: {
          name: resubmitForm.name,
          role: resubmitForm.role,
          gender: resubmitForm.gender,
          specialty: resubmitForm.specialty,
          regNumber: resubmitForm.regNumber,
          experience: parseInt(resubmitForm.experience) || 5,
          mobile: resubmitForm.mobile,
          committedDays: parseInt(resubmitForm.committedDays) || 10,
          status: 'Pending',
          degreeFilePath: degreePath,
          licenseFilePath: licensePath
        }
      });

      triggerToast('Application resubmitted successfully. Roster updated.');
      
      // Reset state files
      setResubmitDegree(null);
      setResubmitLicense(null);

      // Refresh Session
      await fetchSession();
    } catch (err: any) {
      setResubmitError(err.message || 'Failed to submit modifications.');
    } finally {
      setResubmitLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500 font-medium text-xs">
        <div className="flex flex-col items-center space-y-2">
          <span className="text-xl animate-spin">⚙️</span>
          <span>Loading volunteer workspace...</span>
        </div>
      </div>
    );
  }

  const completedRatio = profile?.committed_days ? Math.min(100, Math.round((profile.completed_days / profile.committed_days) * 100)) : 0;
  
  const isApproved = profile?.status === 'Approved';
  const isPending = profile?.status === 'Pending';
  const isRejected = profile?.status === 'Rejected';

  const today = new Date().toISOString().split('T')[0];
  const upcomingCamps = assignedCamps.filter((c: any) => c.date >= today);
  const completedCamps = assignedCamps.filter((c: any) => c.date < today);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans antialiased">
      
      {/* Top Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-100">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <div>
                <span className="text-xl font-extrabold tracking-tight text-slate-900">Avodah</span>
                <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                  VOLUNTEER PORTAL
                </span>
              </div>
            </div>

            {/* User status info */}
            <div className="flex items-center space-x-3">
              <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wide border ${
                isApproved ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                isPending ? 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse' :
                'bg-rose-50 text-rose-700 border-rose-200'
              }`}>
                {profile?.status} Status
              </span>
            </div>

          </div>
        </div>
      </header>

      {/* Toast Alert */}
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

      {/* Main Layout Area */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col lg:flex-row gap-8 flex-1">
        
        {/* Sidebar */}
        <aside className="lg:w-64 flex-shrink-0">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-6 shadow-xs">
            
            {/* Profile Info */}
            <div className="text-center pb-4 border-b border-slate-100">
              <div className="w-16 h-16 rounded-full bg-indigo-100 text-3xl flex items-center justify-center mx-auto mb-3">
                {profile?.avatar || '👨‍⚕️'}
              </div>
              <h4 className="font-bold text-slate-900 text-base">{profile?.name}</h4>
              <p className="text-xs text-indigo-600 font-semibold">{profile?.specialty} • {profile?.role}</p>
              <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest">{profile?.reg_number}</p>
              
              <button 
                onClick={handleSignOut}
                className="mt-4 w-full text-[11px] text-rose-600 font-bold bg-rose-50 hover:bg-rose-100 p-2 rounded-lg transition-colors cursor-pointer"
              >
                Sign Out ⏻
              </button>
            </div>

            {/* Sidebar Navigation Links */}
            <nav className="space-y-1">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  activeTab === 'dashboard' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span>📊</span> <span>My Dashboard</span>
              </button>

              <button
                onClick={() => handleLockedTab('Availability Planner')}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  !isApproved ? 'opacity-50 cursor-not-allowed text-slate-400' :
                  activeTab === 'availability planner' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span>📅</span> <span>Availability Planner</span>
                </div>
                {!isApproved && <span>🔒</span>}
              </button>

              <button
                onClick={() => handleLockedTab('Preferred Fields')}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  !isApproved ? 'opacity-50 cursor-not-allowed text-slate-400' :
                  activeTab === 'preferred fields' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span>📍</span> <span>Preferred Fields</span>
                </div>
                {!isApproved && <span>🔒</span>}
              </button>
            </nav>

            {/* Commitment Progress Widget */}
            <div className="bg-gradient-to-br from-amber-50 to-emerald-50 rounded-xl p-4 border border-amber-200 text-xs">
              <h5 className="font-bold text-indigo-950 uppercase tracking-wider mb-2">My Commitment Tracking</h5>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-600">Committed Days:</span>
                  <span className="font-bold text-slate-900">{profile?.committed_days || 10}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Completed Service:</span>
                  <span className="font-bold text-slate-900">{profile?.completed_days || 0}</span>
                </div>
                <div className="mt-2 pt-2 border-t border-amber-200">
                  <div className="w-full bg-amber-200/50 rounded-full h-2">
                    <div 
                      className="bg-indigo-600 h-2 rounded-full transition-all"
                      style={{ width: `${completedRatio}%` }}
                    ></div>
                  </div>
                  <span className="text-[10px] text-indigo-800 font-semibold mt-1 block text-right">
                    {completedRatio}% Fulfilled
                  </span>
                </div>
              </div>
            </div>

          </div>
        </aside>

        {/* Dashboard Workspace */}
        <main className="flex-1 min-w-0 bg-white rounded-2xl border border-slate-200 shadow-xs p-6 md:p-8">
          
          {/* VIEW A: PENDING REVIEW */}
          {isPending && (
            <div className="space-y-6 animate-fade-in">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-2xl font-extrabold text-slate-900">Welcome, {profile?.name}!</h2>
                <p className="text-xs text-slate-500 mt-1">Thank you for enlisting with Avodah.</p>
              </div>

              <div className="p-6 bg-amber-50 border border-amber-200 rounded-2xl space-y-3 animate-pulse">
                <div className="flex items-center space-x-3 text-amber-800">
                  <span className="text-3xl">🛡️</span>
                  <div>
                    <h4 className="font-extrabold text-sm">Regulatory License Review in Progress</h4>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Our medical compliance board is auditing your certification reg code: <strong>{profile?.reg_number}</strong>.
                    </p>
                  </div>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  While your account is in a pending verification state, you may explore the portal, but scheduling, priority deployment selection, and camp matchmaking are currently locked. Once approved by our administrator, all features will instantly unlock.
                </p>
              </div>

              {/* Locked Placeholders */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 opacity-55">
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-1 text-center">
                  <span className="text-3xl block mb-1">📅</span>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Days Committed</span>
                  <span className="text-2xl font-extrabold text-slate-900 block">{profile?.committed_days || 10}</span>
                </div>
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-1 text-center">
                  <span className="text-3xl block mb-1">🌟</span>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Days Completed</span>
                  <span className="text-2xl font-extrabold text-slate-900 block">{profile?.completed_days || 0}</span>
                </div>
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-1 text-center font-mono">
                  <span className="text-3xl block mb-1">🔒</span>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Active Invites</span>
                  <span className="text-2xl font-extrabold text-slate-900 block">Locked</span>
                </div>
              </div>
            </div>
          )}

          {/* VIEW B: REJECTED / NEEDS RESUBMISSION */}
          {isRejected && (
            <div className="space-y-8 animate-fade-in text-xs">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-2xl font-extrabold text-slate-900">Application Status Roster</h2>
                <p className="text-xs text-slate-500 mt-1">Review board audits feedback and resubmit your qualifications.</p>
              </div>

              {/* Rejection Alert Card */}
              <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl space-y-3">
                <div className="flex items-center space-x-3 text-rose-800">
                  <span className="text-3xl">⚠️</span>
                  <div>
                    <h4 className="font-extrabold text-sm text-rose-900">Application Flagged / Rejected by Audit Board</h4>
                    <p className="text-xs text-rose-600 mt-0.5">
                      Your licensing credentials or uploaded certificates require revision.
                    </p>
                  </div>
                </div>
                
                {profile?.rejection_reason && (
                  <div className="bg-white/70 p-4 rounded-xl border border-rose-200/50 mt-2">
                    <p className="font-bold text-rose-900 uppercase text-[9px] tracking-wider">Board Comments:</p>
                    <p className="text-slate-800 text-[11px] leading-relaxed mt-1 font-medium italic">
                      "{profile.rejection_reason}"
                    </p>
                  </div>
                )}
                
                <p className="text-slate-500 text-[11px] leading-relaxed pt-1">
                  Please correct the highlighted issues in the form below. If your certificate scan was blurry, missing stamps, or incorrect, select a clear new file to re-upload. Click **Submit Corrections** to send your profile back for review.
                </p>
              </div>

              {/* Resubmission Form */}
              <form onSubmit={handleResubmitSubmit} className="space-y-6">
                
                {resubmitError && (
                  <div className="bg-rose-100 text-rose-800 font-bold p-3 rounded-lg text-center">
                    ⚠️ {resubmitError}
                  </div>
                )}

                {/* Personal & Identity */}
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/60 space-y-4">
                  <h4 className="font-bold text-slate-800 text-sm">1. Personal & Identity Details</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block font-semibold text-slate-600 mb-1">Full Name</label>
                      <input 
                        type="text" 
                        name="name"
                        value={resubmitForm.name}
                        onChange={handleResubmitChange}
                        className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-600 focus:outline-none"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block font-semibold text-slate-600 mb-1">Gender</label>
                      <select 
                        name="gender"
                        value={resubmitForm.gender}
                        onChange={handleResubmitChange}
                        className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-600 focus:outline-none"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Non-binary">Non-binary / Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-600 mb-1">Role Type</label>
                      <select 
                        name="role"
                        value={resubmitForm.role}
                        onChange={handleResubmitChange}
                        className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-600 focus:outline-none"
                      >
                        <option value="Doctor">Volunteer Doctor (MD / MBBS)</option>
                        <option value="Nurse">Volunteer Nurse (RN / GNM)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold text-slate-600 mb-1">Mobile Contact</label>
                      <input 
                        type="text" 
                        name="mobile"
                        value={resubmitForm.mobile}
                        onChange={handleResubmitChange}
                        className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-600 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Professional details */}
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/60 space-y-4">
                  <h4 className="font-bold text-slate-800 text-sm">2. Professional Licensing Details</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block font-semibold text-slate-600 mb-1">Council Registration Number</label>
                      <input 
                        type="text" 
                        name="regNumber"
                        value={resubmitForm.regNumber}
                        onChange={handleResubmitChange}
                        className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-600 focus:outline-none"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block font-semibold text-slate-600 mb-1">Clinical Specialty</label>
                      <select 
                        name="specialty"
                        value={resubmitForm.specialty}
                        onChange={handleResubmitChange}
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
                      <label className="block font-semibold text-slate-600 mb-1">Years Experience</label>
                      <input 
                        type="number" 
                        name="experience"
                        value={resubmitForm.experience}
                        onChange={handleResubmitChange}
                        className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-600 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold text-slate-600 mb-1">Proposed Annual Commitment (Days)</label>
                      <input 
                        type="number" 
                        name="committedDays"
                        value={resubmitForm.committedDays}
                        onChange={handleResubmitChange}
                        className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-600 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Upload Section */}
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/60 space-y-4">
                  <h4 className="font-bold text-slate-800 text-sm">3. Verification Document Scans (Re-upload option)</h4>
                  <p className="text-[10px] text-slate-400">If your previous certificates were rejected, choose a new clear file. Leave empty to keep currently uploaded scans.</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Degree */}
                    <div className="bg-white p-4 rounded-xl border border-slate-200 text-center flex flex-col items-center justify-center">
                      <span className="text-xl block mb-1">📜</span>
                      <h5 className="font-bold text-[11px] text-slate-700">Medical Degree scan</h5>
                      <span className="text-[9px] text-slate-400 block mb-3">
                        {profile?.degree_file_path ? '✓ File already uploaded' : 'No file currently uploaded'}
                      </span>
                      
                      <label className="cursor-pointer px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-amber-50 hover:text-amber-800 text-[10px] font-semibold text-slate-600 transition-colors">
                        Choose New File
                        <input 
                          type="file" 
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              setResubmitDegree(e.target.files[0]);
                            }
                          }}
                          className="hidden"
                        />
                      </label>
                      {resubmitDegree && (
                        <span className="text-emerald-600 font-bold text-[9px] block mt-1.5 truncate max-w-full">
                          Ready to upload: {resubmitDegree.name}
                        </span>
                      )}
                    </div>

                    {/* License */}
                    <div className="bg-white p-4 rounded-xl border border-slate-200 text-center flex flex-col items-center justify-center">
                      <span className="text-xl block mb-1">🛡️</span>
                      <h5 className="font-bold text-[11px] text-slate-700">Council License Copy</h5>
                      <span className="text-[9px] text-slate-400 block mb-3">
                        {profile?.license_file_path ? '✓ File already uploaded' : 'No file currently uploaded'}
                      </span>
                      
                      <label className="cursor-pointer px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-amber-50 hover:text-amber-800 text-[10px] font-semibold text-slate-600 transition-colors">
                        Choose New File
                        <input 
                          type="file" 
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              setResubmitLicense(e.target.files[0]);
                            }
                          }}
                          className="hidden"
                        />
                      </label>
                      {resubmitLicense && (
                        <span className="text-emerald-600 font-bold text-[9px] block mt-1.5 truncate max-w-full">
                          Ready to upload: {resubmitLicense.name}
                        </span>
                      )}
                    </div>

                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button 
                    type="submit"
                    disabled={resubmitLoading}
                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {resubmitLoading ? 'Submitting Corrections...' : 'Submit Credentials & Resubmit Application'}
                  </button>
                </div>

              </form>
            </div>
          )}

          {/* VIEW C: APPROVED VIEW */}
          {isApproved && activeTab === 'dashboard' && (
            <div className="space-y-8 animate-fade-in">
              <div className="border-b border-slate-100 pb-4 flex flex-col md:flex-row justify-between items-start md:items-center">
                <div>
                  <h2 className="text-2xl font-extrabold text-slate-900">Welcome, {profile?.name}!</h2>
                  <p className="text-xs text-slate-500 mt-1">Thank you for your service commitment. Let's make an impact today!</p>
                </div>
                <span className="bg-emerald-50 text-emerald-800 font-bold text-xs uppercase tracking-wider px-3 py-1 rounded-full border border-emerald-200 mt-2 md:mt-0">
                  ✓ Verified Active Roster
                </span>
              </div>

              {/* KPI metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-1 text-center">
                  <span className="text-3xl block mb-1">📅</span>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Days Committed</span>
                  <span className="text-2xl font-extrabold text-slate-900 block">{profile?.committed_days}</span>
                </div>
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-1 text-center">
                  <span className="text-3xl block mb-1">🌟</span>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Days Completed</span>
                  <span className="text-2xl font-extrabold text-slate-900 block">{profile?.completed_days}</span>
                </div>
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-1 text-center">
                  <span className="text-3xl block mb-1">📩</span>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Active Invites</span>
                  <span className="text-2xl font-extrabold text-slate-900 block">
                    {invitations.filter((inv: any) => inv.status === 'Pending').length}
                  </span>
                </div>
              </div>

              {/* Mission Invitation Center */}
              <div className="space-y-4">
                <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Mission Invitation Center</h4>
                
                {loadingInvitations ? (
                  <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-400 animate-pulse">
                    <span>Loading invitations roster...</span>
                  </div>
                ) : invitations.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-xs text-slate-400">
                    No camp invitations currently pending. Maintain planner calendar slots to attract campaign invites!
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {invitations.map((invite) => {
                      const camp = invite.camps;
                      if (!camp) return null;
                      
                      const isPending = invite.status === 'Pending';
                      const isAccepted = invite.status === 'Accepted';
                      const isDeclined = invite.status === 'Declined';
                      
                      return (
                        <div 
                          key={invite.id} 
                          className="p-5 bg-white border border-slate-200 rounded-2xl hover:border-indigo-300 hover:shadow-md transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-xs"
                        >
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center space-x-2">
                              <span className={`px-2.5 py-0.5 rounded-full font-bold text-[9px] uppercase tracking-wide border ${
                                isAccepted ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                isPending ? 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse' :
                                'bg-rose-50 text-rose-700 border-rose-200'
                              }`}>
                                {invite.status}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                Sent via {invite.sent_via || 'System'} • {invite.timestamp}
                              </span>
                            </div>
                            
                            <div>
                              <button
                                type="button"
                                onClick={() => handleOpenCampDetails(camp)}
                                className="font-extrabold text-slate-900 text-base hover:text-indigo-600 transition-colors text-left focus:outline-none cursor-pointer"
                              >
                                {camp.name} ↗
                              </button>
                              <p className="text-xs text-slate-500 font-semibold mt-0.5 uppercase tracking-wider">
                                📍 {camp.location} • Date: {camp.date} ({camp.month})
                              </p>
                              <p className="text-[11px] text-slate-400 mt-1">
                                Expected Patients: <strong className="text-slate-700">{camp.expected_patients}</strong> | Required Specialties: <strong className="text-slate-700">{camp.needed_specialties?.join(', ')}</strong>
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex space-x-2 w-full md:w-auto justify-end">
                            {isPending && (
                              <>
                                <button
                                  onClick={() => handleAcceptInvitation(invite)}
                                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer"
                                >
                                  Accept Invite ✓
                                </button>
                                <button
                                  onClick={() => handleDeclineInvitation(invite)}
                                  className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                                >
                                  Decline ✗
                                </button>
                              </>
                            )}
                            {isAccepted && (
                              <button
                                onClick={() => handleDeclineInvitation(invite)}
                                className="px-3 py-1.5 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-500 font-bold text-[10px] uppercase tracking-wider rounded-lg transition-all cursor-pointer"
                              >
                                Change to Decline ✗
                              </button>
                            )}
                            {isDeclined && (
                              <button
                                onClick={() => handleAcceptInvitation(invite)}
                                className="px-3 py-1.5 bg-slate-100 hover:bg-amber-50 hover:text-amber-800 text-slate-500 font-bold text-[10px] uppercase tracking-wider rounded-lg transition-all cursor-pointer"
                              >
                                Change to Accept ✓
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Roster of Camps */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Upcoming Camps Card */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                    <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wider flex items-center space-x-1.5">
                      <span>📅</span> <span>My Upcoming Missions</span>
                    </h4>
                    <span className="bg-indigo-100 text-indigo-800 font-bold text-[10px] px-2 py-0.5 rounded-full">
                      {upcomingCamps.length} Scheduled
                    </span>
                  </div>

                  <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                    {upcomingCamps.length === 0 ? (
                      <div className="text-center py-8 text-slate-400 text-xs">
                        No upcoming camp deployments scheduled.
                      </div>
                    ) : (
                      upcomingCamps.map((camp: any) => (
                        <div 
                          key={camp.id} 
                          onClick={() => handleOpenCampDetails(camp)}
                          className="p-3.5 bg-white border border-slate-200 rounded-xl hover:border-indigo-300 transition-all space-y-1 cursor-pointer"
                        >
                          <h5 className="font-extrabold text-slate-900 text-xs hover:text-indigo-600 transition-colors">{camp.name} ↗</h5>
                          <div className="flex justify-between items-center text-[10px] text-slate-500 font-medium">
                            <span>📍 {camp.location}</span>
                            <span className="font-mono text-amber-800">{camp.date}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Completed Camps Card */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                    <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wider flex items-center space-x-1.5">
                      <span>🌟</span> <span>Completed Campaigns</span>
                    </h4>
                    <span className="bg-emerald-100 text-emerald-800 font-bold text-[10px] px-2 py-0.5 rounded-full">
                      {completedCamps.length} Served
                    </span>
                  </div>

                  <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                    {completedCamps.length === 0 ? (
                      <div className="text-center py-8 text-slate-400 text-xs">
                        No past campaign records found.
                      </div>
                    ) : (
                      completedCamps.map((camp: any) => (
                        <div 
                          key={camp.id} 
                          onClick={() => handleOpenCampDetails(camp)}
                          className="p-3.5 bg-white border border-slate-200 rounded-xl hover:border-emerald-300 transition-all space-y-1 cursor-pointer"
                        >
                          <h5 className="font-extrabold text-slate-900 text-xs hover:text-emerald-600 transition-colors">{camp.name} ↗</h5>
                          <div className="flex justify-between items-center text-[10px] text-slate-500 font-medium">
                            <span>📍 {camp.location}</span>
                            <span className="font-mono text-slate-400">{camp.date}</span>
                          </div>
                          <div className="text-[9px] text-emerald-600 font-bold uppercase tracking-wider flex items-center space-x-1">
                            <span>✓ Served & Completed</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>

              {/* Social Impact Rewards Card */}
              <div className="bg-gradient-to-br from-indigo-950 to-slate-900 text-white p-6 rounded-2xl shadow-xl flex flex-col md:flex-row justify-between items-center gap-6">
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
          )}

          {/* VIEW D: AVAILABILITY PLANNER VIEW */}
          {isApproved && activeTab === 'availability planner' && (
            <div className="space-y-6 animate-fade-in text-xs">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-2xl font-extrabold text-slate-900">Interactive Availability Planner</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Block dates you commit to volunteering in the community camps over the next 12 months.
                </p>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 p-5 rounded-2xl border border-amber-200 space-y-1">
                  <span className="font-bold text-indigo-800 uppercase tracking-wider block">Target Commits</span>
                  <div className="flex items-baseline space-x-1.5">
                    <span className="text-3xl font-black text-indigo-950">{profile?.committed_days || 0}</span>
                    <span className="font-semibold text-slate-500">Days Outlined</span>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 p-5 rounded-2xl border border-indigo-100 space-y-1">
                  <span className="font-bold text-indigo-800 uppercase tracking-wider block">Completed Missions</span>
                  <div className="flex items-baseline space-x-1.5">
                    <span className="text-3xl font-black text-indigo-900">{profile?.completed_days || 0}</span>
                    <span className="font-semibold text-slate-500">Days Served</span>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-5 rounded-2xl border border-emerald-100 space-y-1">
                  <span className="font-bold text-emerald-800 uppercase tracking-wider block">Remaining Commitment</span>
                  <div className="flex items-baseline space-x-1.5">
                    <span className="text-3xl font-black text-emerald-900">
                      {Math.max(0, (profile?.committed_days || 0) - (profile?.completed_days || 0))}
                    </span>
                    <span className="font-semibold text-slate-500">Days Pending</span>
                  </div>
                </div>
              </div>

              {/* Bulk recurring scheduler */}
              <div className="bg-gradient-to-r from-amber-50 to-amber-100/30 border border-amber-200 rounded-xl p-4 space-y-3 shadow-xs">
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
                      className="w-full text-xs p-2 bg-white border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-600"
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
                      className="w-full text-xs p-2 bg-white border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-600"
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
                      className="w-full text-xs p-2 bg-white border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-600"
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
                      className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded shadow-xs uppercase tracking-wide text-[10px] cursor-pointer"
                    >
                      Apply Recurring Days
                    </button>
                  </div>
                </div>
              </div>

              {/* Month selector & options */}
              <div className="flex justify-between items-center mt-6">
                <label className="font-bold text-slate-700 uppercase tracking-wide">Select Month Roster:</label>
                
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-slate-600">Fulfillment Mode:</span>
                  <select 
                    value={sessionMode} 
                    onChange={(e) => setSessionMode(e.target.value)}
                    className="p-1 px-2 border border-slate-300 rounded bg-white text-xs focus:outline-none focus:ring-1 focus:ring-indigo-600"
                  >
                    <option value="Full Day">Full Day (9 AM - 5 PM)</option>
                    <option value="Half Day">Half Day (9 AM - 1 PM)</option>
                    <option value="Post Lunch">Post Lunch (2 PM - 6 PM)</option>
                    <option value="Evening">Evening (6 PM - 9 PM)</option>
                  </select>
                </div>
              </div>

              {/* Month tabs */}
              <div className="flex overflow-x-auto space-x-1 pb-2">
                {['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setSelectedMonth(m)}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex-shrink-0 cursor-pointer ${
                      selectedMonth === m 
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' 
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    🗓️ {m} 2026
                  </button>
                ))}
              </div>

              {/* Calendar Days Selection Grid */}
              <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <h4 className="font-bold text-slate-800 text-sm">Days Selected in {selectedMonth} 2026</h4>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => {
                        const allDays = Array.from({ length: 28 }, (_, i) => i + 1);
                        handleBulkApply(selectedMonth, allDays);
                      }}
                      className="px-2.5 py-1 text-[10px] font-bold uppercase rounded bg-amber-50 text-amber-800 hover:bg-indigo-100 border border-amber-200 transition-colors cursor-pointer"
                    >
                      📅 Choose All Days
                    </button>
                    <button
                      type="button"
                      onClick={() => handleClearMonthAvailability(selectedMonth)}
                      className="px-2.5 py-1 text-[10px] font-bold uppercase rounded bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer"
                    >
                      🧹 Clear Month
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-2 text-center">
                  {/* Days Week Headers */}
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(h => (
                    <div key={h} className="font-bold text-slate-400 py-1 uppercase text-[10px] tracking-wider">{h}</div>
                  ))}

                  {/* 28-Day Grid Simulation */}
                  {Array.from({ length: 28 }).map((_, idx) => {
                    const dayNum = idx + 1;
                    const isSelected = profile?.available_months?.[selectedMonth]?.includes(dayNum);
                    
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => toggleDoctorCalendarDay(selectedMonth, dayNum)}
                        className={`py-3.5 rounded-xl font-semibold border transition-all cursor-pointer ${
                          isSelected 
                            ? 'bg-emerald-500 text-white border-emerald-600 shadow-sm shadow-emerald-100 hover:bg-emerald-600' 
                            : 'bg-white text-slate-600 hover:bg-slate-100 border-slate-200'
                        }`}
                      >
                        <span className="block text-xs">{dayNum}</span>
                        <span className="text-[8px] block opacity-80 mt-0.5">
                          {isSelected ? sessionMode.split(' ')[0] : 'Free'}
                        </span>
                      </button>
                    );
                  })}
                </div>

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
          )}

          {/* VIEW E: PREFERRED LOCATIONS VIEW */}
          {isApproved && activeTab === 'preferred fields' && (
            <div className="space-y-6 animate-fade-in text-xs">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-2xl font-extrabold text-slate-900">Preferred Deployment Fields</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Select deployment areas based on accessibility, commute limits, and camp priorities.
                </p>
              </div>

              {/* Base Clinic Location Settings Card */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <h4 className="font-bold text-slate-800 text-sm mb-3">🏥 My Base Clinic / Location Settings</h4>
                <form onSubmit={handleSaveBaseClinic} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1 text-[11px]">Clinic/Hospital Name:</label>
                    <input 
                      type="text"
                      value={baseClinicName}
                      onChange={(e) => setBaseClinicName(e.target.value)}
                      placeholder="e.g. St. John's Hospital"
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-600"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1 text-[11px]">Base City/Hub:</label>
                    <select
                      value={baseClinicCity}
                      onChange={(e) => setBaseClinicCity(e.target.value)}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-600"
                    >
                      {Object.keys(CITY_COORDINATES).map(city => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <button
                      type="submit"
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
                    >
                      Update Base Clinic
                    </button>
                  </div>
                </form>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* Priority Mapping Panel */}
                <div className="space-y-4">
                  <h4 className="font-bold text-slate-800 text-sm">Current Preferred Field Priorities</h4>
                  
                  <div className="space-y-2">
                    {priorities.length === 0 ? (
                      <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-xl text-slate-400">
                        No preferred deployment locations selected yet. Choose fields from the list on the right.
                      </div>
                    ) : (
                      priorities.map((loc, idx) => {
                        const dbLoc = dbLocations.find(l => l.name === loc);
                        const baseCoords = CITY_COORDINATES[baseClinicCity] || CITY_COORDINATES['Bangalore'];
                        const dynamicDistance = dbLoc && dbLoc.latitude && dbLoc.longitude
                          ? calculateDistance(baseCoords.lat, baseCoords.lng, Number(dbLoc.latitude), Number(dbLoc.longitude))
                          : (dbLoc?.distance || 10);
                        const fullLocDetails = dbLoc || { region: 'Inland' };
                        return (
                          <div key={loc} className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <span className="bg-indigo-600 text-white font-black text-xs w-6 h-6 rounded-full flex items-center justify-center shadow-xs">
                                {idx + 1}
                              </span>
                              <div>
                                <h5 className="font-bold text-slate-900 text-sm">{loc}</h5>
                                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                                  📍 {fullLocDetails.region} • {dynamicDistance} km commute
                                </span>
                              </div>
                            </div>

                            <div className="flex space-x-1">
                              <button 
                                type="button"
                                onClick={() => handlePriorityShift(loc, 'up')}
                                disabled={idx === 0}
                                className="p-1 px-2.5 rounded bg-white text-slate-600 hover:bg-slate-100 text-xs font-bold border disabled:opacity-30 border-slate-200 cursor-pointer"
                              >
                                ▲
                              </button>
                              <button 
                                type="button"
                                onClick={() => handlePriorityShift(loc, 'down')}
                                disabled={idx === priorities.length - 1}
                                className="p-1 px-2.5 rounded bg-white text-slate-600 hover:bg-slate-100 text-xs font-bold border disabled:opacity-30 border-slate-200 cursor-pointer"
                              >
                                ▼
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <button 
                    onClick={handleSaveLocations}
                    disabled={priorities.length === 0}
                    className="w-full py-3 bg-indigo-600 text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-indigo-700 transition-colors shadow-lg disabled:opacity-50 cursor-pointer"
                  >
                    Save Target Priorities Settings
                  </button>
                </div>

                {/* Database Registry selector */}
                <div className="space-y-4 bg-slate-50 border border-slate-200 p-5 rounded-2xl">
                  <h4 className="font-bold text-slate-800 text-sm">Deployable Field Database Registry</h4>
                  <p className="text-[11px] text-slate-500">Toggle locations below to add or remove them from your preferred registry.</p>
                  
                  <div className="space-y-2">
                    {dbLocations.map(loc => {
                      const isSelected = priorities.includes(loc.name);
                      const baseCoords = CITY_COORDINATES[baseClinicCity] || CITY_COORDINATES['Bangalore'];
                      const dynamicDistance = loc.latitude && loc.longitude
                        ? calculateDistance(baseCoords.lat, baseCoords.lng, Number(loc.latitude), Number(loc.longitude))
                        : (loc.distance || 10);
                      return (
                        <div 
                          key={loc.id} 
                          onClick={() => toggleLocationEnlistment(loc.name)}
                          className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                            isSelected ? 'bg-amber-50 border-indigo-300' : 'bg-white border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <div>
                            <p className="font-bold text-slate-900">{loc.name}</p>
                            <p className="text-slate-500 text-[10px]">{loc.region}</p>
                          </div>
                          <div className="text-right">
                            <span className="font-semibold text-slate-800 inline-block block">{dynamicDistance} km</span>
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
          )}

      {/* --- CAMP DETAILS MODAL --- */}
      {selectedCampDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 space-y-4 animate-scale-up text-xs text-slate-800">
            
            <div className="flex justify-between items-start pb-2 border-b border-slate-100">
              <div>
                <h4 className="font-extrabold text-slate-900 text-base">{selectedCampDetails.name}</h4>
                <p className="text-[10px] text-indigo-600 font-semibold uppercase tracking-wider mt-0.5">
                  📍 {selectedCampDetails.location} • Date: {selectedCampDetails.date}
                </p>
              </div>
              <button 
                onClick={() => setSelectedCampDetails(null)} 
                className="text-slate-400 hover:text-slate-900 font-bold text-lg cursor-pointer"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              
              {/* Camp Info details */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[9px] text-slate-400 uppercase font-bold block">Commute Distance</span>
                  <span className="text-xs font-bold text-slate-950 mt-1 block">
                    {(() => {
                      const baseCoords = CITY_COORDINATES[baseClinicCity] || CITY_COORDINATES['Bangalore'];
                      const campCoords = CITY_COORDINATES[selectedCampDetails.location];
                      const distance = campCoords 
                        ? calculateDistance(baseCoords.lat, baseCoords.lng, campCoords.lat, campCoords.lng)
                        : null;
                      return distance !== null ? `${distance} km dynamic` : '10 km (commute)';
                    })()}
                  </span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[9px] text-slate-400 uppercase font-bold block">Expected Patients</span>
                  <span className="text-xs font-bold text-slate-950 mt-1 block">
                    {selectedCampDetails.expected_patients} patients
                  </span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 col-span-2 md:col-span-1">
                  <span className="text-[9px] text-slate-400 uppercase font-bold block">Status</span>
                  <span className="text-xs font-bold mt-1 block">
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full font-bold text-[9px] uppercase tracking-wide">
                      {selectedCampDetails.status || 'Active'}
                    </span>
                  </span>
                </div>
              </div>

              {/* Required Specialties */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                <span className="font-bold text-slate-700 block">Required Specialties Needed:</span>
                <div className="flex flex-wrap gap-1.5 text-[10px] font-semibold">
                  {selectedCampDetails.needed_specialties?.map((spec: string) => (
                    <span key={spec} className="bg-amber-50 text-indigo-800 border border-amber-200 px-2 py-0.5 rounded">
                      {spec}
                    </span>
                  ))}
                  {(!selectedCampDetails.needed_specialties || selectedCampDetails.needed_specialties.length === 0) && (
                    <span className="text-slate-400 italic">No specific specialties listed.</span>
                  )}
                </div>
              </div>

              {/* Roster of accepted doctors */}
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                <div className="p-3 bg-slate-200/50 border-b border-slate-200 font-bold text-slate-700 flex justify-between items-center">
                  <span>Volunteers Team Roster</span>
                  <span className="bg-indigo-100 text-indigo-800 font-bold text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider">
                    {campRoster.length} Accepted
                  </span>
                </div>

                <div className="divide-y divide-slate-200 max-h-48 overflow-y-auto">
                  {loadingRoster ? (
                    <div className="text-center py-6 text-slate-400 font-semibold animate-pulse">
                      Loading team roster details...
                    </div>
                  ) : campRoster.length === 0 ? (
                    <div className="text-center py-6 text-slate-400 italic">
                      No other volunteers have accepted yet.
                    </div>
                  ) : (
                    campRoster.map((item: any) => {
                      const doc = item.profiles || item.profile || {};
                      return (
                        <div key={item.id} className="p-3 bg-white flex items-center justify-between">
                          <div className="flex items-center space-x-2.5">
                            <span className="text-2xl">{doc.avatar || '👨‍⚕️'}</span>
                            <div>
                              <p className="font-bold text-slate-900">{doc.name || 'Anonymous Doctor'}</p>
                              <p className="text-[10px] text-slate-400">{doc.specialty} • {doc.role}</p>
                            </div>
                          </div>
                          <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 font-bold text-[9px] px-2 py-0.5 rounded uppercase">
                            ✓ Joined
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button 
                onClick={() => setSelectedCampDetails(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition-colors cursor-pointer"
              >
                Close Camp Details
              </button>
            </div>

          </div>
        </div>
      )}

        </main>
      </div>

      <footer className="bg-slate-900 border-t border-slate-800 py-6 text-center text-slate-400 text-xs mt-auto">
        <p>© 2026 Avodah. Empowering healthcare campaigns.</p>
      </footer>
    </div>
  );
}
