'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';

const getNext12Months = () => {
  const months = [];
  const currentDate = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1);
    const label = d.toLocaleString('en-US', { month: 'short' });
    const year = d.getFullYear();
    months.push({ label, year });
  }
  return months;
};

export default function AdminDashboard() {
  const router = useRouter();
  const supabase = createClient();

  const [adminUser, setAdminUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'verification' | 'locations' | 'schedules' | 'camp-creation' | 'matching' | 'invitations-log' | 'check-in'>('overview');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleTabChange = async (tabName: typeof activeTab) => {
    setActiveTab(tabName);
    try {
      if (tabName === 'overview') {
        await Promise.all([fetchVolunteers(), fetchCamps(), fetchInvitations()]);
      } else if (tabName === 'verification') {
        await fetchVolunteers();
      } else if (tabName === 'schedules') {
        await fetchVolunteers();
      } else if (tabName === 'matching') {
        await Promise.all([fetchCamps(), fetchVolunteers()]);
      } else if (tabName === 'invitations-log') {
        await fetchInvitations();
      } else if (tabName === 'check-in') {
        await Promise.all([fetchCamps(), fetchVolunteers(), fetchCheckIns()]);
      }
    } catch (err) {
      console.error('Error refreshing tab data:', err);
    }
  };

  // Manage Field Locations State
  const [locations, setLocations] = useState<any[]>([]);
  const [newLoc, setNewLoc] = useState({
    id: '',
    name: '',
    distance: 10,
    region: 'Central',
    priority: 1,
    active_cases: 0,
    latitude: '',
    longitude: ''
  });

  // Volunteer Schedules State
  const [selectedSchedVolId, setSelectedSchedVolId] = useState<string | null>(null);
  const [schedMonth, setSchedMonth] = useState(() => {
    return new Date().toLocaleString('en-US', { month: 'short' });
  });

  // Camps & Invitations Database Lists
  const [camps, setCamps] = useState<any[]>([]);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [checkIns, setCheckIns] = useState<any[]>([]);
  const [checkInCampId, setCheckInCampId] = useState<string>('');

  // Configure Camp State
  const [newCamp, setNewCamp] = useState({
    name: '',
    location: 'Koya',
    date: '2026-07-15',
    month: 'Jul',
    day: 15,
    expectedPatients: 400,
    neededSpecialties: ['General Medicine'],
    physicianCount: 2,
    nurseCount: 1,
    nutritionistCount: 1,
    durationDays: 1,
    estimateEye: 0,
    estimateDental: 0,
    estimateGynec: 0,
    estimateDiabetic: 0,
    estimateCardio: 0,
    estimateTherapy: 0,
    estimatePsychology: 0
  });

  // AI Matching Copilot State
  const [aiQuery, setAiQuery] = useState('show all available doctors for camp at Koya on July');
  const [aiResult, setAiResult] = useState<any>(null);
  const [aiIsThinking, setAiIsThinking] = useState(false);
  const [selectedCampId, setSelectedCampId] = useState('');
  const [selectedChannel, setSelectedChannel] = useState('Web App Notification');
  const [bulkCheckedDoctors, setBulkCheckedDoctors] = useState<string[]>([]);

  // Stats Counters
  const [pendingCount, setPendingCount] = useState(0);
  const [campsCount, setCampsCount] = useState(0);
  const [invitesCount, setInvitesCount] = useState(0);

  // Invitation Logs Tab States
  const [invFilterStatus, setInvFilterStatus] = useState<'All' | 'Pending' | 'Accepted' | 'Declined'>('All');
  const [invSearchQuery, setInvSearchQuery] = useState('');
  const [invFilterCampId, setInvFilterCampId] = useState<string>('');

  // Volunteers Roster State
  const [volunteers, setVolunteers] = useState<any[]>([]);
  const [selectedVol, setSelectedVol] = useState<any>(null);
  const [degreeUrl, setDegreeUrl] = useState<string | null>(null);
  const [licenseUrl, setLicenseUrl] = useState<string | null>(null);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);
  const [fetchingUrls, setFetchingUrls] = useState(false);

  // Rejection State
  const [rejectingVolId, setRejectingVolId] = useState<string | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');

  // Sub-navigation within Verify Credentials
  const [subTab, setSubTab] = useState<'pending' | 'approved' | 'rejected'>('pending');

  // Camp Details Modal States
  const [selectedCampDetails, setSelectedCampDetails] = useState<any>(null);
  const [campRoster, setCampRoster] = useState<any[]>([]);
  const [loadingRoster, setLoadingRoster] = useState(false);
  
  const [isEditingCamp, setIsEditingCamp] = useState(false);
  const [editCampForm, setEditCampForm] = useState({
    name: '',
    location: 'Koya',
    date: '2026-07-15',
    month: 'Jul',
    day: 15,
    expectedPatients: 400,
    neededSpecialties: [] as string[],
    status: 'Drafting',
    durationDays: 1,
    estimateEye: 0,
    estimateDental: 0,
    estimateGynec: 0,
    estimateDiabetic: 0,
    estimateCardio: 0,
    estimateTherapy: 0,
    estimatePsychology: 0
  });
  const [isCancelingCamp, setIsCancelingCamp] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  // Fetch volunteers list
  const fetchVolunteers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('join_date', { ascending: false });

      if (!error && data) {
        setVolunteers(data);
        const pending = data.filter((v: any) => v.status === 'Pending').length;
        setPendingCount(pending);
      }
    } catch (err) {
      console.error('Error fetching volunteers roster:', err);
    }
  };

  const fetchCamps = async () => {
    try {
      const { data, error } = await supabase
        .from('camps')
        .select('*')
        .order('date', { ascending: false });
      if (!error && data) {
        setCamps(data);
        setCampsCount(data.length);
        if (data.length > 0 && !selectedCampId) {
          setSelectedCampId(data[0].id);
        }
        if (data.length > 0 && !checkInCampId) {
          setCheckInCampId(data[0].id);
        }
      }
    } catch (err) {
      console.error('Error fetching camps list:', err);
    }
  };

  const fetchInvitations = async () => {
    try {
      const { data, error } = await supabase
        .from('invitations')
        .select(`
          *,
          profiles (
            *
          ),
          camps (
            *
          )
        `)
        .order('timestamp', { ascending: false });
      if (!error && data) {
        setInvitations(data);
        setInvitesCount(data.length);
      }
    } catch (err) {
      console.error('Error fetching invitations roster:', err);
    }
  };

  const fetchCheckIns = async () => {
    try {
      const { data, error } = await supabase
        .from('check_ins')
        .select('*');
      if (!error && data) {
        setCheckIns(data);
      }
    } catch (err) {
      console.error('Error fetching check-ins roster:', err);
    }
  };

  const handleCheckInToggle = async (docId: string, campId: string) => {
    try {
      const targetCamp = camps.find(c => c.id === campId);
      if (targetCamp) {
        const todayStr = new Date().toLocaleDateString('en-CA');
        if (todayStr < targetCamp.date) {
          triggerToast('Error: Cannot check-in before the scheduled date.');
          return;
        }
      }

      const existing = checkIns.find(ci => ci.doctor_id === docId && ci.camp_id === campId);
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      if (!existing) {
        // Insert Check In
        const { error } = await supabase
          .from('check_ins')
          .insert({
            doctor_id: docId,
            camp_id: campId,
            check_in_time: timeStr,
            status: 'Checked In'
          });
          
        if (error) throw error;
        triggerToast('Volunteer checked in successfully! Timestamp logged.');
      } else if (existing.status === 'Checked In') {
        // Update to Checked Out
        const { error } = await supabase
          .from('check_ins')
          .update({
            check_out_time: timeStr,
            status: 'Checked Out'
          })
          .eq('doctor_id', docId)
          .eq('camp_id', campId);
          
        if (error) throw error;
        triggerToast('Volunteer checked out successfully! Session finalized.');
      }
      
      await fetchCheckIns();
    } catch (err: any) {
      console.error('Check-in action error:', err);
      triggerToast(`Error: ${err.message || 'Operation failed'}`);
    }
  };

  const handleEditCampSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editCampForm.name) {
      triggerToast('Please designate a Name for the Camp!');
      return;
    }
    try {
      const { error } = await supabase
        .from('camps')
        .update({
          name: editCampForm.name,
          location: editCampForm.location,
          date: editCampForm.date,
          month: editCampForm.month,
          day: Number(editCampForm.day) || 15,
          expected_patients: Number(editCampForm.expectedPatients) || 0,
          status: editCampForm.status,
          needed_specialties: editCampForm.neededSpecialties,
          duration_days: Number(editCampForm.durationDays) || 1,
          estimate_eye: Number(editCampForm.estimateEye) || 0,
          estimate_dental: Number(editCampForm.estimateDental) || 0,
          estimate_gynec: Number(editCampForm.estimateGynec) || 0,
          estimate_diabetic: Number(editCampForm.estimateDiabetic) || 0,
          estimate_cardio: Number(editCampForm.estimateCardio) || 0,
          estimate_therapy: Number(editCampForm.estimateTherapy) || 0,
          estimate_psychology: Number(editCampForm.estimatePsychology) || 0
        })
        .eq('id', selectedCampDetails.id);

      if (error) throw error;

      triggerToast(`Campaign details updated: ${editCampForm.name}`);
      setIsEditingCamp(false);
      setSelectedCampDetails(null);
      await fetchCamps();
    } catch (err: any) {
      triggerToast(`Failed to update camp: ${err.message}`);
    }
  };

  const handleCancelCampConfirm = async () => {
    try {
      // 1. Get confirmed doctors (accepted invites)
      const confirmedInvites = campRoster.filter((item: any) => item.status === 'Accepted');

      // 2. Simulate sending emails/notifications to doctors
      confirmedInvites.forEach((item: any) => {
        const doc = item.profiles || item.profile || {};
        console.log(`[Camp Cancellation Alert] Email/Alert sent to ${doc.name} (${doc.email}) for camp "${selectedCampDetails.name}". Note: ${cancelReason}`);
      });

      // 3. Delete the camp (Cascade deletes invitations and check-ins)
      const { error } = await supabase
        .from('camps')
        .delete()
        .eq('id', selectedCampDetails.id);

      if (error) throw error;

      triggerToast(`Camp "${selectedCampDetails.name}" cancelled successfully. Confirmed doctors notified.`);
      setIsCancelingCamp(false);
      setCancelReason('');
      setSelectedCampDetails(null);
      await Promise.all([fetchCamps(), fetchInvitations()]);
    } catch (err: any) {
      triggerToast(`Failed to cancel camp: ${err.message}`);
    }
  };

  const handleCreateCamp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCamp.name) {
      triggerToast('Please designate a Name for the Camp!');
      return;
    }
    try {
      const id = `camp-${Date.now()}`;
      const { error } = await supabase
        .from('camps')
        .insert({
          id,
          name: newCamp.name,
          location: newCamp.location,
          date: newCamp.date,
          month: newCamp.month,
          day: Number(newCamp.day) || 15,
          expected_patients: Number(newCamp.expectedPatients) || 0,
          needed_specialties: newCamp.neededSpecialties,
          needed_counts: {
            'General Medicine': newCamp.physicianCount,
            'Nurse': newCamp.nurseCount,
            'Nutritionist': newCamp.nutritionistCount
          },
          assigned_volunteers: [],
          duration_days: Number(newCamp.durationDays) || 1,
          estimate_eye: Number(newCamp.estimateEye) || 0,
          estimate_dental: Number(newCamp.estimateDental) || 0,
          estimate_gynec: Number(newCamp.estimateGynec) || 0,
          estimate_diabetic: Number(newCamp.estimateDiabetic) || 0,
          estimate_cardio: Number(newCamp.estimateCardio) || 0,
          estimate_therapy: Number(newCamp.estimateTherapy) || 0,
          estimate_psychology: Number(newCamp.estimatePsychology) || 0
        });
 
       if (error) throw error;
 
       triggerToast(`Campaign launched: ${newCamp.name}. Go configure matches!`);
       await fetchCamps();
       setNewCamp({
         name: '',
         location: 'Koya',
         date: '2026-07-15',
         month: 'Jul',
         day: 15,
         expectedPatients: 400,
         neededSpecialties: ['General Medicine'],
         physicianCount: 2,
         nurseCount: 1,
         nutritionistCount: 1,
         durationDays: 1,
         estimateEye: 0,
         estimateDental: 0,
         estimateGynec: 0,
         estimateDiabetic: 0,
         estimateCardio: 0,
         estimateTherapy: 0,
         estimatePsychology: 0
       });
      handleTabChange('matching');
    } catch (err: any) {
      triggerToast(`Failed to create camp: ${err.message}`);
    }
  };

  const executeAISearch = (queryText: string) => {
    setAiIsThinking(true);
    setAiResult(null);

    setTimeout(() => {
      const queryLower = queryText.toLowerCase();
      let matchedDocs = [];

      const filters = {
        location: null as string | null,
        month: null as string | null,
        specialty: null as string | null
      };

      if (queryLower.includes('koya')) filters.location = 'Koya';
      else if (queryLower.includes('belgaum')) filters.location = 'Belgaum';
      else if (queryLower.includes('mysore')) filters.location = 'Mysore';
      else if (queryLower.includes('hubli')) filters.location = 'Hubli';
      else if (queryLower.includes('mangalore')) filters.location = 'Mangalore';

      if (queryLower.includes('july') || queryLower.includes('jul')) filters.month = 'Jul';
      else if (queryLower.includes('august') || queryLower.includes('aug')) filters.month = 'Aug';
      else if (queryLower.includes('september') || queryLower.includes('sep')) filters.month = 'Sep';
      else if (queryLower.includes('october') || queryLower.includes('oct')) filters.month = 'Oct';
      else if (queryLower.includes('november') || queryLower.includes('nov')) filters.month = 'Nov';
      else if (queryLower.includes('december') || queryLower.includes('dec')) filters.month = 'Dec';

      if (queryLower.includes('pediatric')) filters.specialty = 'Pediatrics';
      else if (queryLower.includes('cardio')) filters.specialty = 'Cardiology';
      else if (queryLower.includes('dermatology') || queryLower.includes('derm')) filters.specialty = 'Dermatology';
      else if (queryLower.includes('ortho')) filters.specialty = 'Orthopedics';
      else if (queryLower.includes('general') || queryLower.includes('med')) filters.specialty = 'General Medicine';
      else if (queryLower.includes('gynecology') || queryLower.includes('gyn')) filters.specialty = 'Gynecology';

      const targetCamp = camps.find(c => c.id === selectedCampId);

      matchedDocs = volunteers.map(doc => {
        if (doc.status !== 'Approved') return null;

        // 1. Hard Gate: Planner availability for the specific camp day
        if (targetCamp) {
          const campMonth = targetCamp.month;
          const campDay = Number(targetCamp.day);
          const availableDays = doc.available_months?.[campMonth];
          if (!Array.isArray(availableDays) || !availableDays.map(Number).includes(campDay)) {
            return null; // Not available on this day, exclude entirely
          }
        } else if (filters.month) {
          // Fallback if no camp but month parsed from query
          const availableDays = doc.available_months?.[filters.month];
          if (!Array.isArray(availableDays) || availableDays.length === 0) {
            return null; // No availability in this month
          }
        }

        // 2. Score Calculation
        // Specialty Alignment (40%)
        let specialtyScore = 0;
        const docSpecialtyLower = (doc.specialty || '').toLowerCase();
        const docRoleLower = (doc.role || '').toLowerCase();
        if (filters.specialty) {
          if (docSpecialtyLower === filters.specialty.toLowerCase()) {
            specialtyScore = 40;
          }
        } else if (targetCamp?.needed_specialties) {
          const hasMatch = targetCamp.needed_specialties.some(
            (s: string) => {
              const sLower = s.toLowerCase();
              if (sLower === 'ophthalmology' || sLower === 'opthamalogy') {
                return docSpecialtyLower.includes('ophthalmology') || docSpecialtyLower.includes('optometry') || docSpecialtyLower.includes('eye') || docRoleLower.includes('eye') || docRoleLower.includes('optometrist');
              }
              if (sLower === 'psychologist') {
                return docSpecialtyLower.includes('psychology') || docRoleLower.includes('psychologist') || docRoleLower.includes('counsellor');
              }
              if (sLower === 'other therapist' || sLower === 'therapist') {
                return docRoleLower.includes('therapist') || docSpecialtyLower.includes('therapy');
              }
              return docSpecialtyLower === sLower || docSpecialtyLower.includes(sLower) || sLower.includes(docSpecialtyLower);
            }
          );
          if (hasMatch) {
            specialtyScore = 40;
          }
        }

        // Location Priorities (40%)
        let locationScore = 0;
        const campLocLower = (filters.location || targetCamp?.location || '').toLowerCase();
        if (campLocLower && doc.location_priorities) {
          const index = doc.location_priorities.findIndex(
            (loc: string) => loc.toLowerCase() === campLocLower
          );
          if (index === 0) locationScore = 40;
          else if (index === 1) locationScore = 30;
          else if (index === 2) locationScore = 20;
          else if (index > 2) locationScore = 10;
        }

        // Past Camp Service (10%)
        const pastServiceScore = Math.min((doc.completed_days || 0) * 2, 10);

        // Commute Index (10%)
        const campLocName = targetCamp?.location || filters.location || '';
        const locObj = locations.find(l => l.name.toLowerCase() === campLocName.toLowerCase());
        const distance = locObj ? Number(locObj.distance) : 100;

        let commuteScore = 10;
        if (distance <= 20) commuteScore = 10;
        else if (distance <= 100) commuteScore = 8;
        else if (distance <= 200) commuteScore = 5;
        else commuteScore = 2;

        const calculatedScore = specialtyScore + locationScore + pastServiceScore + commuteScore;

        return {
          ...doc,
          calculatedScore: Math.min(Math.max(calculatedScore, 0), 100)
        };
      })
      .filter((doc): doc is any => doc !== null)
      .sort((a, b) => b.calculatedScore - a.calculatedScore);

      setAiResult({
        filters,
        results: matchedDocs
      });
      setAiIsThinking(false);
      triggerToast("AI Matching engine completed evaluation.");
    }, 900);
  };

  const sendBulkInvitations = async () => {
    const targetCamp = camps.find(c => c.id === selectedCampId);
    if (targetCamp?.status === 'Drafting') {
      triggerToast('Cannot send invitations for a campaign in Drafting status. Please schedule it first.');
      return;
    }
    if (!selectedCampId || bulkCheckedDoctors.length === 0) {
      triggerToast('Please select a Camp and at least one Volunteer.');
      return;
    }
    try {
      const newInvites = bulkCheckedDoctors.map(dId => ({
        id: `inv-${Date.now()}-${dId}`,
        camp_id: selectedCampId,
        doctor_id: dId,
        status: 'Pending',
        sent_via: selectedChannel,
        timestamp: new Date().toISOString().split('T')[0]
      }));

      const { error } = await supabase
        .from('invitations')
        .insert(newInvites);

      if (error) throw error;

      // Simulate sending email if channel includes "Email"
      if (selectedChannel.includes('Email')) {
        bulkCheckedDoctors.forEach(dId => {
          const doc = volunteers.find(v => v.id === dId);
          if (doc) {
            console.log(`[Email Dispatch Simulation] Sending invite to ${doc.name} (${doc.email}) for Camp ID ${selectedCampId} via ${selectedChannel}`);
          }
        });
      }

      triggerToast(`Sent invites to ${bulkCheckedDoctors.length} candidate specialists via ${selectedChannel}!`);
      await fetchInvitations();
      setBulkCheckedDoctors([]);
      handleTabChange('overview');
    } catch (err: any) {
      triggerToast(`Failed to send invitations: ${err.message}`);
    }
  };

  const handleRetractInvitation = async (inviteId: string, campId: string, doctorId: string) => {
    try {
      // 1. Delete invitation row
      const { error: deleteError } = await supabase
        .from('invitations')
        .delete()
        .eq('id', inviteId);

      if (deleteError) throw deleteError;

      // 2. Fetch the camp to see if this doctor is assigned, and remove them
      const { data: campData, error: campFetchError } = await supabase
        .from('camps')
        .select('assigned_volunteers')
        .eq('id', campId)
        .single();

      if (!campFetchError && campData) {
        const volunteersList = campData.assigned_volunteers || [];
        if (volunteersList.includes(doctorId)) {
          const updatedList = volunteersList.filter((id: string) => id !== doctorId);
          await supabase
            .from('camps')
            .update({ assigned_volunteers: updatedList })
            .eq('id', campId);
        }
      }

      triggerToast('Invitation deleted / retracted successfully.');
      await fetchInvitations();
    } catch (err: any) {
      triggerToast(`Failed to retract invitation: ${err.message}`);
    }
  };

  const handleOpenCampDetails = async (camp: any) => {
    setSelectedCampDetails(camp);
    setIsEditingCamp(false);
    setIsCancelingCamp(false);
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
        .eq('camp_id', camp.id);

      if (!error && data) {
        setCampRoster(data);
      } else if (error) {
        console.error('Error fetching camp roster:', error);
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
        setLocations(data);
      }
    } catch (err) {
      console.error('Error fetching preferred locations:', err);
    }
  };

  const handleAddLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLoc.name.trim()) {
      triggerToast('Please fill in the Location Name.');
      return;
    }
    const finalId = newLoc.id.trim() || `loc-${newLoc.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}`;
    try {
      const { error } = await supabase
        .from('preferred_locations')
        .insert({
          id: finalId,
          name: newLoc.name,
          distance: Number(newLoc.distance) || 10,
          region: newLoc.region,
          priority: Number(newLoc.priority) || 1,
          active_cases: Number(newLoc.active_cases) || 0,
          latitude: newLoc.latitude ? Number(newLoc.latitude) : null,
          longitude: newLoc.longitude ? Number(newLoc.longitude) : null
        });

      if (error) throw error;

      triggerToast(`Location ${newLoc.name} added successfully.`);
      setNewLoc({
        id: '',
        name: '',
        distance: 10,
        region: 'Central',
        priority: 1,
        active_cases: 0,
        latitude: '',
        longitude: ''
      });
      await fetchLocations();
    } catch (err: any) {
      console.error('Add location error:', err);
      if (err.code === '23505') {
        triggerToast('Failed to add location: A location with this ID or Name already exists.');
      } else {
        triggerToast(`Failed to add location: ${err.message || 'Unknown database conflict'}`);
      }
    }
  };

  const handleDeleteLocation = async (id: string) => {
    try {
      const { error } = await supabase
        .from('preferred_locations')
        .delete()
        .eq('id', id);

      if (error) throw error;

      triggerToast('Location deleted successfully.');
      await fetchLocations();
    } catch (err: any) {
      triggerToast(`Failed to delete location: ${err.message}`);
    }
  };

  useEffect(() => {
    async function fetchAdminSession() {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          router.push('/admin/login');
          return;
        }

        // Verify user is inside admins table
        const { data: adminRecord, error: adminError } = await supabase
          .from('admins')
          .select('id')
          .eq('id', user.id)
          .single();

        if (adminError || !adminRecord) {
          await supabase.auth.signOut();
          router.push('/admin/login');
          return;
        }

        setAdminUser(user);

        // Fetch initial volunteers list (includes pending sync)
        await fetchVolunteers();
        await fetchLocations();
        await fetchCamps();
        await fetchInvitations();

      } catch (err) {
        console.error('Error loading admin workspace:', err);
        router.push('/admin/login');
      } finally {
        setLoading(false);
      }
    }

    fetchAdminSession();
  }, [router, supabase]);

  const handleAdminSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/admin/login');
  };

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Status updates in database
  const handleUpdateStatus = async (volunteerId: string, nextStatus: 'Approved' | 'Rejected') => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status: nextStatus, rejection_reason: null }) // Clear rejection reason on approve
        .eq('id', volunteerId);

      if (error) throw error;

      triggerToast(`Volunteer status successfully updated to: ${nextStatus}`);
      await fetchVolunteers();
      setSelectedVol(null);
    } catch (err: any) {
      triggerToast(`Action failed: ${err.message}`);
    }
  };

  // Confirm Rejection and save feedback
  const submitRejection = async () => {
    if (!rejectingVolId) return;
    if (!rejectionReasonInput.trim()) {
      triggerToast('Please specify a rejection reason.');
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          status: 'Rejected',
          rejection_reason: rejectionReasonInput.trim()
        })
        .eq('id', rejectingVolId);

      if (error) throw error;

      triggerToast('Volunteer application has been rejected.');
      await fetchVolunteers();
      setRejectingVolId(null);
      setSelectedVol(null);
    } catch (err: any) {
      triggerToast(`Rejection failed: ${err.message}`);
    }
  };

  // Securely retrieve short-lived file signed URLs to preview certificates
  const handleOpenDocs = async (vol: any) => {
    setSelectedVol(vol);
    setDegreeUrl(null);
    setLicenseUrl(null);
    setProfilePhotoUrl(null);
    setFetchingUrls(true);

    try {
      if (vol.degree_file_path) {
        const { data, error } = await supabase.storage
          .from('verification-documents')
          .createSignedUrl(vol.degree_file_path, 900); // 15 minutes link
        if (!error && data) {
          setDegreeUrl(data.signedUrl);
        }
      }

      if (vol.license_file_path) {
        const { data, error } = await supabase.storage
          .from('verification-documents')
          .createSignedUrl(vol.license_file_path, 900); // 15 minutes link
        if (!error && data) {
          setLicenseUrl(data.signedUrl);
        }
      }

      if (vol.profile_photo_path) {
        const { data, error } = await supabase.storage
          .from('verification-documents')
          .createSignedUrl(vol.profile_photo_path, 900);
        if (!error && data) {
          setProfilePhotoUrl(data.signedUrl);
        }
      }
    } catch (err) {
      console.error('Error getting credentials signed links:', err);
    } finally {
      setFetchingUrls(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-400 font-medium text-xs">
        <div className="flex flex-col items-center space-y-2">
          <span className="text-xl animate-spin">⚙️</span>
          <span>Loading admin terminal workspace...</span>
        </div>
      </div>
    );
  }

  const pendingVols = volunteers.filter((v: any) => v.status === 'Pending');
  const approvedVols = volunteers.filter((v: any) => v.status === 'Approved');
  const rejectedVols = volunteers.filter((v: any) => v.status === 'Rejected');

  const visibleVolunteers = 
    subTab === 'pending' ? pendingVols :
    subTab === 'approved' ? approvedVols :
    rejectedVols;

  const filteredInvitations = invitations.filter((inv: any) => {
    if (invFilterCampId && inv.camp_id !== invFilterCampId) {
      return false;
    }
    if (invFilterStatus !== 'All' && inv.status !== invFilterStatus) {
      return false;
    }
    if (invSearchQuery.trim()) {
      const q = invSearchQuery.toLowerCase();
      const docName = inv.profiles?.name?.toLowerCase() || '';
      const campName = inv.camps?.name?.toLowerCase() || '';
      const specialty = inv.profiles?.specialty?.toLowerCase() || '';
      const location = inv.camps?.location?.toLowerCase() || '';
      if (!docName.includes(q) && !campName.includes(q) && !specialty.includes(q) && !location.includes(q)) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans antialiased">
      
      {/* Top Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-100">
                🔑
              </div>
              <div>
                <span className="text-xl font-extrabold tracking-tight text-slate-900">Avodah</span>
                <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  ADMIN COMMAND CENTER
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <span className="text-xs text-slate-500 font-medium hidden sm:inline">Logged in as {adminUser?.email}</span>
            </div>

          </div>
        </div>
      </header>

      {/* Toast alert */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 animate-bounce max-w-sm bg-slate-900 text-white px-5 py-4 rounded-xl shadow-2xl flex items-start space-x-3 border border-slate-700">
          <div className="text-indigo-400 text-lg">💡</div>
          <div className="flex-1">
            <h5 className="font-bold text-xs uppercase tracking-wider text-slate-400">System Notification</h5>
            <p className="text-sm mt-0.5 text-slate-100">{toastMessage}</p>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white font-bold">×</button>
        </div>
      )}

      {/* Workspace Area */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col lg:flex-row gap-8 flex-1">
        
        {/* Sidebar */}
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
                onClick={() => handleTabChange('overview')}
                className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === 'overview' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span>📊</span> <span>Admin Overview</span>
              </button>
              
              <button
                onClick={() => handleTabChange('verification')}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === 'verification' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span>🛡️</span> <span>Verify Credentials</span>
                </div>
                {pendingCount > 0 && (
                  <span className="bg-rose-500 text-white font-bold text-[10px] px-2 py-0.5 rounded-full">
                    {pendingCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => handleTabChange('locations')}
                className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === 'locations' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span>📍</span> <span>Manage Field Locations</span>
              </button>

              <button
                onClick={() => handleTabChange('schedules')}
                className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === 'schedules' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span>📅</span> <span>Volunteer Schedules</span>
              </button>

              <button
                onClick={() => handleTabChange('camp-creation')}
                className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === 'camp-creation' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span>➕</span> <span>Configure Camp</span>
              </button>

              <button
                onClick={() => handleTabChange('matching')}
                className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === 'matching' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span>🧠</span> <span>AI Doctor Matching</span>
              </button>

              <button
                onClick={() => handleTabChange('invitations-log')}
                className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === 'invitations-log' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span>📨</span> <span>Invitation Logs</span>
              </button>

              <button
                onClick={() => handleTabChange('check-in')}
                className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === 'check-in' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span>⏱️</span> <span>Check-in Manager</span>
              </button>
            </nav>

            <div className="pt-4 border-t border-slate-800">
              <button 
                onClick={handleAdminSignOut}
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

        {/* Dynamic Workspace content */}
        <main className="flex-grow bg-white rounded-2xl border border-slate-200 shadow-xs p-6 md:p-8">
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-8 animate-fade-in">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-2xl font-extrabold text-slate-900">Portal Administrative Overview</h2>
                <p className="text-xs text-slate-500 mt-1">Welcome back. Maintain a steady volunteer grid to support remote healthcare.</p>
              </div>

              {/* Top Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Verification card */}
                <div className="bg-gradient-to-br from-amber-50 to-amber-100/30 p-5 rounded-2xl border border-amber-100 space-y-3 text-xs">
                  <span className="font-bold text-amber-800 uppercase tracking-wider block">Credential Actions Needed</span>
                  <div className="flex items-baseline space-x-1.5">
                    <span className="text-3xl font-black text-amber-950">{pendingCount}</span>
                    <span className="font-semibold text-amber-700">Awaiting Audits</span>
                  </div>
                  <button 
                    onClick={() => setActiveTab('verification')}
                    className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg transition-colors text-center text-[10px] uppercase tracking-wide cursor-pointer"
                  >
                    Review Registrations 📋
                  </button>
                </div>

                {/* Camp Campaign card */}
                <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/30 p-5 rounded-2xl border border-indigo-100 space-y-3 text-xs">
                  <span className="font-bold text-indigo-800 uppercase tracking-wider block">Camp Deployment Match Engine</span>
                  <div className="flex items-baseline space-x-1.5">
                    <span className="text-3xl font-black text-indigo-950">{campsCount}</span>
                    <span className="font-semibold text-indigo-700">Active Campaigns</span>
                  </div>
                  <button 
                    onClick={() => setActiveTab('camp-creation')}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors text-center text-[10px] uppercase tracking-wide cursor-pointer"
                  >
                    Configure Campaign ➕
                  </button>
                </div>

                {/* Communication invite card */}
                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/30 p-5 rounded-2xl border border-emerald-100 space-y-3 text-xs">
                  <span className="font-bold text-emerald-800 uppercase tracking-wider block">Communication Tracking</span>
                  <div className="flex items-baseline space-x-1.5">
                    <span className="text-3xl font-black text-emerald-950">{invitesCount}</span>
                    <span className="font-semibold text-emerald-700">Invites Sent</span>
                  </div>
                  <button 
                    onClick={() => setActiveTab('invitations-log')}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors text-center text-[10px] uppercase tracking-wide cursor-pointer"
                  >
                    View Invitations Logs 📨
                  </button>
                </div>

              </div>

              {/* Quick action section */}
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
                    onClick={() => handleTabChange('check-in')}
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

              {/* Active Camp Campaigns & Deployment Roster */}
              <div className="space-y-4 pt-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Active Camp Campaigns & Deployment Roster</h4>
                  <span className="bg-indigo-100 text-indigo-800 font-bold text-[10px] px-2.5 py-1 rounded-full">
                    {camps.length} Active Campaigns
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {camps.length === 0 ? (
                    <div className="md:col-span-2 p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-slate-400">
                      No camp campaigns currently defined. Use "Configure Camp" tab to register new fields.
                    </div>
                  ) : (
                    camps.map((camp: any) => {
                      const acceptedCount = invitations.filter((i: any) => i.camp_id === camp.id && i.status === 'Accepted').length;
                      const pendingCount = invitations.filter((i: any) => i.camp_id === camp.id && i.status === 'Pending').length;
                      
                      return (
                        <div 
                          key={camp.id} 
                          className="p-5 bg-slate-50 hover:bg-slate-100/70 border border-slate-200 rounded-2xl transition-all space-y-3 flex flex-col justify-between"
                        >
                          <div className="space-y-2">
                            <div className="flex justify-between items-start">
                              <span className={`px-2 py-0.5 rounded font-bold text-[9px] uppercase border ${
                                camp.status === 'Scheduled' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                              }`}>
                                {camp.status}
                              </span>
                              <span className="font-mono text-slate-400 text-[10px]">{camp.date}</span>
                            </div>
                            
                            <div>
                              <h5 className="font-extrabold text-slate-900 text-sm">{camp.name}</h5>
                              <p className="text-[10px] text-slate-500 font-medium uppercase mt-0.5 tracking-wider">
                                📍 {camp.location} • ⏱️ {camp.duration_days || 1} {(camp.duration_days || 1) === 1 ? 'Day' : 'Days'}
                              </p>
                              <p className="text-[10px] text-slate-400 mt-1">
                                Expected Patients: <strong className="text-slate-700">{camp.expected_patients}</strong> | Required Specialties: <strong className="text-slate-700">{camp.needed_specialties?.join(', ') || 'General Medicine'}</strong>
                              </p>
                            </div>
                          </div>

                          <div className="pt-3 border-t border-slate-200/60 flex justify-between items-center mt-2">
                            {camp.status === 'Drafting' ? (
                              <span className="text-[10px] text-amber-600 font-bold bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                Drafting - No Communication
                              </span>
                            ) : (
                              <div className="flex items-center space-x-2 text-[10px] font-semibold text-slate-600">
                                <span className="flex items-center space-x-1">
                                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                                  <span>{acceptedCount} Attending</span>
                                </span>
                                {pendingCount > 0 && (
                                  <span className="flex items-center space-x-1">
                                    <span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span>
                                    <span>{pendingCount} Pending</span>
                                  </span>
                                )}
                              </div>
                            )}
                            
                            <button
                              type="button"
                              onClick={() => handleOpenCampDetails(camp)}
                              className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg transition-colors cursor-pointer text-[10px]"
                            >
                              Details & RSVP Log ↗
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: VERIFICATION Roster */}
          {activeTab === 'verification' && (
            <div className="space-y-6 animate-fade-in">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-2xl font-extrabold text-slate-900">Volunteer Document Review Terminal</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Approve or flag applications. Ensure state registration numbers match licensing criteria before approving camps.
                </p>
              </div>

              {/* Sub-Tabs Selector */}
              <div className="flex border-b border-slate-200 text-xs">
                <button
                  onClick={() => setSubTab('pending')}
                  className={`pb-3 px-4 font-bold border-b-2 transition-all flex items-center space-x-2 cursor-pointer ${
                    subTab === 'pending'
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <span>⏳</span>
                  <span>Pending Verification</span>
                  <span className={`px-1.5 py-0.5 text-[10px] rounded-full ${
                    subTab === 'pending' ? 'bg-indigo-100 text-indigo-800 font-bold' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {pendingVols.length}
                  </span>
                </button>
                <button
                  onClick={() => setSubTab('approved')}
                  className={`pb-3 px-4 font-bold border-b-2 transition-all flex items-center space-x-2 cursor-pointer ${
                    subTab === 'approved'
                      ? 'border-emerald-600 text-emerald-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <span>✅</span>
                  <span>Onboarded / Approved</span>
                  <span className={`px-1.5 py-0.5 text-[10px] rounded-full ${
                    subTab === 'approved' ? 'bg-emerald-100 text-emerald-800 font-bold' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {approvedVols.length}
                  </span>
                </button>
                <button
                  onClick={() => setSubTab('rejected')}
                  className={`pb-3 px-4 font-bold border-b-2 transition-all flex items-center space-x-2 cursor-pointer ${
                    subTab === 'rejected'
                      ? 'border-rose-600 text-rose-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <span>❌</span>
                  <span>Rejected / Flagged</span>
                  <span className={`px-1.5 py-0.5 text-[10px] rounded-full ${
                    subTab === 'rejected' ? 'bg-rose-100 text-rose-800 font-bold' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {rejectedVols.length}
                  </span>
                </button>
              </div>

              {/* Volunteers Table */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                  <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                    {subTab === 'pending' && 'Awaiting Audit Reviews'}
                    {subTab === 'approved' && 'Onboarded Medical Professionals'}
                    {subTab === 'rejected' && 'Flagged / Declined Applications'}
                  </h4>
                  <span className={`font-bold text-[10px] px-2.5 py-1 rounded-full ${
                    subTab === 'pending' ? 'bg-indigo-100 text-indigo-800' :
                    subTab === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                    'bg-rose-100 text-rose-800'
                  }`}>
                    {visibleVolunteers.length} Active Records
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs min-w-3xl">
                    <thead>
                      <tr className="bg-slate-50/50 border-b border-slate-200 text-slate-500 uppercase text-[10px] tracking-wider font-semibold">
                        <th className="p-4">Volunteer Info</th>
                        <th className="p-4">Specialty & Role</th>
                        <th className="p-4">Reg Number</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {visibleVolunteers.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-slate-400">
                            No volunteers found in this list category.
                          </td>
                        </tr>
                      ) : (
                        visibleVolunteers.map((vol) => (
                          <tr key={vol.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="p-4">
                              <div className="flex items-center space-x-3">
                                <span className="text-2xl">{vol.avatar || '👨‍⚕️'}</span>
                                <div>
                                  <h5 className="font-bold text-slate-900">{vol.name}</h5>
                                  <p className="text-[10px] text-slate-400">Joined {new Date(vol.join_date).toLocaleDateString()}</p>
                                </div>
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="font-semibold text-slate-800">{vol.specialty}</div>
                              <div className="text-[10px] text-slate-400">
                                {vol.role}{vol.age ? ` (Age: ${vol.age})` : ''}
                              </div>
                            </td>
                            <td className="p-4 font-mono text-[11px] text-slate-600">
                              <div>{vol.reg_number}</div>
                              {vol.status === 'Rejected' && vol.rejection_reason && (
                                <div className="text-[10px] text-rose-600 mt-1 max-w-xs truncate font-sans italic" title={vol.rejection_reason}>
                                  Reason: "{vol.rejection_reason}"
                                </div>
                              )}
                            </td>
                            <td className="p-4">
                              <span className={`px-2.5 py-0.5 rounded-full font-bold text-[9px] uppercase tracking-wide border ${
                                vol.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                vol.status === 'Pending' ? 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse' :
                                'bg-rose-50 text-rose-700 border-rose-200'
                              }`}>
                                {vol.status}
                              </span>
                            </td>
                            <td className="p-4 text-right space-x-2">
                              <button 
                                onClick={() => handleOpenDocs(vol)}
                                className="px-2.5 py-1.5 rounded bg-slate-100 text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 font-bold text-[10px] transition-all cursor-pointer"
                              >
                                View Docs 📄
                              </button>
                              
                              {(vol.status === 'Pending' || vol.status === 'Rejected') && (
                                <button 
                                  onClick={() => handleUpdateStatus(vol.id, 'Approved')}
                                  className="px-2.5 py-1.5 rounded bg-emerald-600 text-white hover:bg-emerald-700 font-bold text-[10px] transition-all cursor-pointer"
                                >
                                  {vol.status === 'Rejected' ? 'Approve & Onboard' : 'Approve'}
                                </button>
                              )}

                              {(vol.status === 'Pending' || vol.status === 'Approved') && (
                                <button 
                                  onClick={() => { setRejectingVolId(vol.id); setRejectionReasonInput(''); }}
                                  className="px-2.5 py-1.5 rounded bg-rose-600 text-white hover:bg-rose-700 font-bold text-[10px] transition-all cursor-pointer"
                                >
                                  {vol.status === 'Approved' ? 'Suspend / Flag' : 'Decline'}
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: MANAGE FIELD LOCATIONS */}
          {activeTab === 'locations' && (
            <div className="space-y-6 animate-fade-in text-xs">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-2xl font-extrabold text-slate-900">Manage Field Locations</h2>
                <p className="text-xs text-slate-500 mt-1">Configure, add, or retire deployment field registry nodes for community healthcare campaigns.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Form to Add Location */}
                <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-4 h-fit">
                  <h4 className="font-bold text-slate-800 text-sm">📍 Add New Field Node</h4>
                  <form onSubmit={handleAddLocation} className="space-y-3">
                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">Location Name:</label>
                      <input 
                        type="text"
                        placeholder="e.g. Dharwad"
                        value={newLoc.name}
                        onChange={(e) => setNewLoc({ ...newLoc, name: e.target.value })}
                        className="w-full text-xs p-2 bg-white border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-slate-600 font-semibold mb-1">Region:</label>
                        <input 
                          type="text"
                          placeholder="e.g. West"
                          value={newLoc.region}
                          onChange={(e) => setNewLoc({ ...newLoc, region: e.target.value })}
                          className="w-full text-xs p-2 bg-white border border-slate-300 rounded focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-600 font-semibold mb-1">Commute (km):</label>
                        <input 
                          type="number"
                          value={newLoc.distance}
                          onChange={(e) => setNewLoc({ ...newLoc, distance: Number(e.target.value) })}
                          className="w-full text-xs p-2 bg-white border border-slate-300 rounded focus:outline-none"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-slate-600 font-semibold mb-1">Latitude:</label>
                        <input 
                          type="text"
                          placeholder="e.g. 15.45"
                          value={newLoc.latitude}
                          onChange={(e) => setNewLoc({ ...newLoc, latitude: e.target.value })}
                          className="w-full text-xs p-2 bg-white border border-slate-300 rounded focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-600 font-semibold mb-1">Longitude:</label>
                        <input 
                          type="text"
                          placeholder="e.g. 75.01"
                          value={newLoc.longitude}
                          onChange={(e) => setNewLoc({ ...newLoc, longitude: e.target.value })}
                          className="w-full text-xs p-2 bg-white border border-slate-300 rounded focus:outline-none"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-slate-600 font-semibold mb-1">Priority Order:</label>
                        <input 
                          type="number"
                          value={newLoc.priority}
                          onChange={(e) => setNewLoc({ ...newLoc, priority: Number(e.target.value) })}
                          className="w-full text-xs p-2 bg-white border border-slate-300 rounded focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-600 font-semibold mb-1">Active Cases:</label>
                        <input 
                          type="number"
                          value={newLoc.active_cases}
                          onChange={(e) => setNewLoc({ ...newLoc, active_cases: Number(e.target.value) })}
                          className="w-full text-xs p-2 bg-white border border-slate-300 rounded focus:outline-none"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded uppercase tracking-wider text-[10px] cursor-pointer mt-2"
                    >
                      Create Deployment Location
                    </button>
                  </form>
                </div>

                {/* List of Locations */}
                <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                  <div className="p-4 bg-slate-50 border-b border-slate-200">
                    <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Active Field Registries ({locations.length})</h4>
                  </div>
                  <div className="divide-y divide-slate-100 max-h-128 overflow-y-auto">
                    {locations.length === 0 ? (
                      <div className="p-8 text-center text-slate-400">No field locations defined yet.</div>
                    ) : (
                      locations.map(loc => (
                        <div key={loc.id} className="p-4 hover:bg-slate-50/50 transition-colors flex justify-between items-center">
                          <div>
                            <h5 className="font-extrabold text-slate-900 text-sm flex items-center space-x-1.5">
                              <span>📍 {loc.name}</span>
                              <span className="text-[10px] text-slate-400 font-mono">({loc.id})</span>
                            </h5>
                            <p className="text-[10px] text-slate-500 font-medium mt-0.5 uppercase tracking-wide">
                              Region: {loc.region} • Priority: {loc.priority} • Active Cases: {loc.active_cases}
                            </p>
                            <p className="text-[9px] text-slate-400 mt-0.5 font-mono">
                              Coords: {loc.latitude || 'N/A'}, {loc.longitude || 'N/A'} • Base Commute: {loc.distance} km
                            </p>
                          </div>
                          <button
                            onClick={() => handleDeleteLocation(loc.id)}
                            className="px-2.5 py-1.5 rounded bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold text-[10px] transition-all cursor-pointer"
                          >
                            Retire Node
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 4: VOLUNTEER SCHEDULES */}
          {activeTab === 'schedules' && (
            <div className="space-y-6 animate-fade-in text-xs">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-2xl font-extrabold text-slate-900">Volunteer Schedules</h2>
                <p className="text-xs text-slate-500 mt-1">Audit monthly availability calendars for approved clinical professionals.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Volunteer List Panel */}
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs h-fit">
                  <div className="p-4 bg-slate-50 border-b border-slate-200">
                    <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Approved Volunteers ({volunteers.filter(v => v.status === 'Approved').length})</h4>
                  </div>
                  <div className="divide-y divide-slate-100 max-h-128 overflow-y-auto">
                    {volunteers.filter(v => v.status === 'Approved').length === 0 ? (
                      <div className="p-8 text-center text-slate-400">No approved volunteers available.</div>
                    ) : (
                      volunteers.filter(v => v.status === 'Approved').map(vol => {
                        const isSelected = selectedSchedVolId === vol.id;
                        return (
                          <div 
                            key={vol.id} 
                            onClick={() => setSelectedSchedVolId(vol.id)}
                            className={`p-3.5 cursor-pointer transition-all flex items-center justify-between hover:bg-slate-50 ${
                              isSelected ? 'bg-indigo-50 border-r-4 border-indigo-600' : ''
                            }`}
                          >
                            <div className="flex items-center space-x-3">
                              <span className="text-2xl">{vol.avatar || '👨‍⚕️'}</span>
                              <div>
                                <h5 className="font-bold text-slate-900">{vol.name}</h5>
                                <p className="text-[10px] text-slate-500">{vol.specialty} • {vol.role}</p>
                              </div>
                            </div>
                            <span className="text-[10px] text-indigo-600 font-bold">
                              {Object.values(vol.available_months || {}).reduce((acc: number, curr: any) => acc + (curr?.length || 0), 0)} Days
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Calendar availability grid */}
                <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs min-h-128 flex flex-col">
                  {selectedSchedVolId ? (() => {
                    const volObj = volunteers.find(v => v.id === selectedSchedVolId);
                    if (!volObj) return <div className="flex-1 flex items-center justify-center text-slate-400">Volunteer not found.</div>;
                    
                    const volAvailableMonths = volObj.available_months || {};
                    const totalDays = Object.values(volAvailableMonths).reduce((acc: number, curr: any) => acc + (curr?.length || 0), 0);

                    return (
                      <div className="space-y-5 flex-1 flex flex-col">
                        <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                          <div>
                            <h4 className="font-extrabold text-slate-900 text-base">{volObj.name} Availability</h4>
                            <p className="text-[10px] text-slate-500 uppercase font-semibold tracking-wider">
                              Specialty: {volObj.specialty} • Total commitments: {volObj.committed_days || totalDays} Days
                            </p>
                          </div>
                          <div className="flex space-x-1 overflow-x-auto pb-1 max-w-[200px] sm:max-w-xs md:max-w-md">
                            {getNext12Months().map(({ label: m, year }) => (
                              <button
                                key={`${m}-${year}`}
                                onClick={() => setSchedMonth(m)}
                                className={`px-2.5 py-1 rounded-lg text-[9px] font-bold transition-all cursor-pointer flex-shrink-0 ${
                                  schedMonth === m 
                                    ? 'bg-indigo-600 text-white shadow-xs' 
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                                title={`${m} ${year}`}
                              >
                                {m}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Calendar visual */}
                        <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-3 flex-1 flex flex-col justify-center">
                          <div className="flex justify-between items-center">
                            <span className="font-extrabold text-slate-800 text-xs">
                              Days Selected in {schedMonth} {getNext12Months().find(m => m.label === schedMonth)?.year || new Date().getFullYear()}
                            </span>
                            <span className="bg-indigo-100 text-indigo-800 font-bold text-[10px] px-2 py-0.5 rounded-full">
                              {(volAvailableMonths[schedMonth] || []).length} Slots Blocked
                            </span>
                          </div>

                          <div className="grid grid-cols-7 gap-2 text-center text-xs flex-1 content-center">
                            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(h => (
                              <div key={h} className="font-bold text-slate-400 py-1 uppercase text-[10px] tracking-wider">{h}</div>
                            ))}

                            {Array.from({ length: 28 }).map((_, idx) => {
                              const dayNum = idx + 1;
                              const isSelected = (volAvailableMonths[schedMonth] || []).includes(dayNum);
                              return (
                                <div
                                  key={idx}
                                  className={`py-3.5 rounded-xl font-bold border transition-all flex flex-col justify-center items-center ${
                                    isSelected 
                                      ? 'bg-emerald-500 text-white border-emerald-600 shadow-sm' 
                                      : 'bg-white text-slate-400 border-slate-200/60'
                                  }`}
                                >
                                  <span className="block text-xs">{dayNum}</span>
                                  <span className="text-[8px] block opacity-85 mt-0.5">
                                    {isSelected ? 'Available' : 'Free'}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })() : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400 space-y-2">
                      <span className="text-3xl">📅</span>
                      <span>Select a volunteer from the roster on the left to audit their availability schedules.</span>
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

          {/* TAB 5: CONFIGURE CAMP */}
          {activeTab === 'camp-creation' && (
            <div className="space-y-6 animate-fade-in text-xs">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-2xl font-extrabold text-slate-900">Campaign Activation Framework</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Launch community camps. Set specialty needs and trigger smart matching to notify ideal personnel.
                </p>
              </div>

              <form onSubmit={handleCreateCamp} className="space-y-6">
                
                {/* Core Camp Info */}
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/60 space-y-4">
                  <h4 className="font-bold text-slate-800 text-sm">Camp Metadata Details</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Camp Campaign Name</label>
                      <input 
                        type="text" 
                        placeholder="Belgaum Diabetes Care & General Diagnostic Camp" 
                        value={newCamp.name}
                        onChange={(e) => setNewCamp({ ...newCamp, name: e.target.value })}
                        className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Target Rural Field Deployment Node</label>
                      <select 
                        value={newCamp.location}
                        onChange={(e) => setNewCamp({ ...newCamp, location: e.target.value })}
                        className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                      >
                        {locations.map(loc => (
                          <option key={loc.id} value={loc.name}>{loc.name} Area ({loc.region})</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-600 mb-1">Launch Date</label>
                      <input 
                        type="date" 
                        value={newCamp.date}
                        onChange={(e) => {
                          const dateVal = e.target.value;
                          const parts = dateVal.split('-');
                          const dayVal = parts.length === 3 ? parseInt(parts[2]) : 15;
                          setNewCamp({ ...newCamp, date: dateVal, day: dayVal });
                        }}
                        className="w-full p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-600 mb-1">Camp Duration (Days)</label>
                      <select
                        value={newCamp.durationDays}
                        onChange={(e) => setNewCamp({ ...newCamp, durationDays: Number(e.target.value) })}
                        className="w-full p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none font-bold text-indigo-950"
                      >
                        <option value={1}>1 Day</option>
                        <option value={2}>2 Days</option>
                        <option value={3}>3 Days</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-600 mb-1">Target Patients Projection</label>
                      <input 
                        type="number" 
                        value={newCamp.expectedPatients}
                        onChange={(e) => setNewCamp({ ...newCamp, expectedPatients: Number(e.target.value) })}
                        className="w-full p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-600 mb-1">Date Month Tag (for AI scheduling)</label>
                      <select 
                        value={newCamp.month}
                        onChange={(e) => setNewCamp({ ...newCamp, month: e.target.value })}
                        className="w-full p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                      >
                        <option value="Jul">July</option>
                        <option value="Aug">August</option>
                        <option value="Sep">September</option>
                        <option value="Oct">October</option>
                        <option value="Nov">November</option>
                        <option value="Dec">December</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Specialty Patient Need Estimates */}
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/60 space-y-4">
                  <h4 className="font-bold text-slate-800 text-sm">Specialty Patient Need Estimates</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Specify estimated patient volumes for each specific medical branch to help volunteers understand the exact needs of the camp.</p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-7 gap-3 text-xs">
                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">Eye (Patient Vol)</label>
                      <input
                        type="number"
                        placeholder="0"
                        value={newCamp.estimateEye}
                        onChange={(e) => setNewCamp({ ...newCamp, estimateEye: Number(e.target.value) })}
                        className="w-full p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">Dental (Patient Vol)</label>
                      <input
                        type="number"
                        placeholder="0"
                        value={newCamp.estimateDental}
                        onChange={(e) => setNewCamp({ ...newCamp, estimateDental: Number(e.target.value) })}
                        className="w-full p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">Gynecology (Patient Vol)</label>
                      <input
                        type="number"
                        placeholder="0"
                        value={newCamp.estimateGynec}
                        onChange={(e) => setNewCamp({ ...newCamp, estimateGynec: Number(e.target.value) })}
                        className="w-full p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">Diabetic (Patient Vol)</label>
                      <input
                        type="number"
                        placeholder="0"
                        value={newCamp.estimateDiabetic}
                        onChange={(e) => setNewCamp({ ...newCamp, estimateDiabetic: Number(e.target.value) })}
                        className="w-full p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">Cardiology (Patient Vol)</label>
                      <input
                        type="number"
                        placeholder="0"
                        value={newCamp.estimateCardio}
                        onChange={(e) => setNewCamp({ ...newCamp, estimateCardio: Number(e.target.value) })}
                        className="w-full p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">Therapy (Patient Vol)</label>
                      <input
                        type="number"
                        placeholder="0"
                        value={newCamp.estimateTherapy}
                        onChange={(e) => setNewCamp({ ...newCamp, estimateTherapy: Number(e.target.value) })}
                        className="w-full p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">Psychology (Patient Vol)</label>
                      <input
                        type="number"
                        placeholder="0"
                        value={newCamp.estimatePsychology}
                        onChange={(e) => setNewCamp({ ...newCamp, estimatePsychology: Number(e.target.value) })}
                        className="w-full p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                      />
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
                        value={newCamp.physicianCount}
                        onChange={(e) => setNewCamp({ ...newCamp, physicianCount: Number(e.target.value) })}
                        className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Nurses Required</label>
                      <input 
                        type="number" 
                        value={newCamp.nurseCount}
                        onChange={(e) => setNewCamp({ ...newCamp, nurseCount: Number(e.target.value) })}
                        className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Dieticians Required</label>
                      <input 
                        type="number" 
                        value={newCamp.nutritionistCount}
                        onChange={(e) => setNewCamp({ ...newCamp, nutritionistCount: Number(e.target.value) })}
                        className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Target Specialties List Required</label>
                    <div className="flex flex-wrap gap-2 text-xs">
                      {['General Medicine', 'Pediatrics', 'Orthopedics', 'Cardiology', 'Dermatology', 'Gynecology', 'Ophthalmology', 'psychologist', 'Other therapist'].map(spec => {
                        const checked = newCamp.neededSpecialties.includes(spec);
                        return (
                          <button
                            type="button"
                            key={spec}
                            onClick={() => {
                              if (checked) {
                                setNewCamp({ ...newCamp, neededSpecialties: newCamp.neededSpecialties.filter(s => s !== spec) });
                              } else {
                                setNewCamp({ ...newCamp, neededSpecialties: [...newCamp.neededSpecialties, spec] });
                              }
                            }}
                            className={`px-3 py-1.5 rounded-lg font-bold border transition-all cursor-pointer ${
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
                    className="px-6 py-3 bg-indigo-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg hover:bg-indigo-700 transition-colors cursor-pointer"
                  >
                    Launch Campaign & Go To Match Matching 🤖
                  </button>
                </div>

              </form>
            </div>
          )}

          {/* TAB 6: AI DOCTOR MATCHING */}
          {activeTab === 'matching' && (
            <div className="space-y-8 animate-fade-in text-xs">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-2xl font-extrabold text-slate-900">Intelligent Deployment Match Engine</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Apply intelligent weight scores based on specialties, distance, availability, and alignment vectors to identify candidate matches.
                </p>
              </div>

              {/* Weight Factor Info */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold uppercase tracking-wider text-slate-700">Weight Balancing Factor KPI Metrics</span>
                  <span className="text-[10px] text-slate-400 font-mono">System Core Logic</span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: 'Specialty Alignment', pct: '40%' },
                    { label: 'Location Priorities', pct: '40%' },
                    { label: 'Past Camp Service', pct: '10%' },
                    { label: 'Commute Index', pct: '10%' }
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

              {/* AI COPILOT CHAT BOX */}
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
                    onClick={() => { setAiQuery("show all available doctors for camp at Koya on July"); executeAISearch("show all available doctors for camp at Koya on July"); }}
                    className="p-1.5 px-3 bg-white/10 hover:bg-white/20 text-slate-200 rounded-full transition-all border border-white/5 font-semibold cursor-pointer"
                  >
                    "Show available doctors for Koya in July"
                  </button>
                  <button 
                    type="button"
                    onClick={() => { setAiQuery("show available pediatric specialty in July"); executeAISearch("show available pediatric specialty in July"); }}
                    className="p-1.5 px-3 bg-white/10 hover:bg-white/20 text-slate-200 rounded-full transition-all border border-white/5 font-semibold cursor-pointer"
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
                    onClick={() => executeAISearch(aiQuery)}
                    className="px-5 py-3 bg-indigo-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-indigo-500 transition-all shadow-md flex items-center space-x-1.5 cursor-pointer"
                  >
                    <span>Scan Match</span>
                  </button>
                </div>

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
                        type="button"
                        onClick={() => {
                          if (bulkCheckedDoctors.length === aiResult.results.length) {
                            setBulkCheckedDoctors([]);
                          } else {
                            setBulkCheckedDoctors(aiResult.results.map((m: any) => m.id));
                          }
                        }}
                        className="text-[10px] text-slate-300 hover:text-white font-bold cursor-pointer"
                      >
                        Toggle Select All Checked Matches
                      </button>
                    </div>

                    <div className="space-y-2">
                      {aiResult.results.map((match: any) => {
                        const isChecked = bulkCheckedDoctors.includes(match.id);
                        return (
                          <div key={match.id} className="p-3 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 transition-colors flex justify-between items-center">
                            <div className="flex items-center space-x-3 text-xs">
                              <input 
                                type="checkbox" 
                                checked={isChecked}
                                onChange={() => {
                                  if (isChecked) {
                                    setBulkCheckedDoctors(bulkCheckedDoctors.filter(dId => dId !== match.id));
                                  } else {
                                    setBulkCheckedDoctors([...bulkCheckedDoctors, match.id]);
                                  }
                                }}
                                className="rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                              />
                              <span className="text-xl">{match.avatar}</span>
                              <div>
                                <p className="font-bold text-white">{match.name}</p>
                                <p className="text-slate-400 text-[10px]">{match.specialty} • {match.reg_number}</p>
                              </div>
                            </div>

                            <div className="text-right text-xs">
                              <div className="flex items-center space-x-1 justify-end">
                                <span className="font-mono text-emerald-400 font-extrabold text-base">{match.calculatedScore}%</span>
                                <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest">Match Score</span>
                              </div>
                              <span className="text-slate-400 text-[10px]">
                                Base City: {match.base_clinic?.city || 'Bangalore'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Action dispatch for invitations */}
                    <div className="pt-3 border-t border-white/15 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div className="flex flex-col sm:flex-row gap-3 text-xs w-full sm:w-auto">
                        <div className="flex items-center space-x-2">
                          <span className="text-slate-300">Target Campaign:</span>
                          <select 
                            value={selectedCampId} 
                            onChange={(e) => setSelectedCampId(e.target.value)}
                            className="p-1 px-2 border border-white/20 rounded bg-slate-800 text-white text-xs focus:ring-1 focus:ring-indigo-500"
                          >
                            {camps.map(c => (
                              <option key={c.id} value={c.id}>{c.name} ({c.location}){c.status === 'Drafting' ? ' [DRAFT]' : ''}</option>
                            ))}
                          </select>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-slate-300">Delivery Channel:</span>
                          <select 
                            value={selectedChannel} 
                            onChange={(e) => setSelectedChannel(e.target.value)}
                            className="p-1 px-2 border border-white/20 rounded bg-slate-800 text-white text-xs focus:ring-1 focus:ring-indigo-500"
                          >
                            <option value="Web App Notification">Web App Notification</option>
                            <option value="Email Notification">Email Notification</option>
                            <option value="Web App & Email">Web App & Email</option>
                          </select>
                        </div>
                      </div>

                      {(() => {
                        const targetCamp = camps.find(c => c.id === selectedCampId);
                        const isDraftCamp = targetCamp?.status === 'Drafting';
                        return (
                          <button 
                            onClick={sendBulkInvitations}
                            disabled={bulkCheckedDoctors.length === 0 || !selectedCampId || isDraftCamp}
                            className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 disabled:opacity-40 text-white font-bold text-xs uppercase tracking-wider rounded-lg hover:bg-indigo-500 transition-colors shadow-lg cursor-pointer"
                          >
                            {isDraftCamp ? 'Cannot Invite to Draft Camp ⏳' : `Send Invites to Selected (${bulkCheckedDoctors.length}) ✉️`}
                          </button>
                        );
                      })()}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 7: INVITATION LOGS */}
          {activeTab === 'invitations-log' && (
            <div className="space-y-6 animate-fade-in text-xs">
              <div className="border-b border-slate-100 pb-4 flex flex-col md:flex-row justify-between items-start md:items-center">
                <div>
                  <h2 className="text-2xl font-extrabold text-slate-900">Campaign Invitation Logs</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Track the real-time RSVP responses and delivery channels of all campaign invitations.
                  </p>
                </div>
                <button
                  onClick={fetchInvitations}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg border border-slate-200 mt-2 md:mt-0 cursor-pointer flex items-center space-x-1"
                >
                  <span>🔄</span> <span>Refresh Roster</span>
                </button>
              </div>

              {/* Configured Camp Deployments Summary */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">📍 Configured Camp Deployment Registry</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">Summary of all registered campaigns, their scheduling status, and live RSVP delivery metrics. Click a camp to filter the invitation logs below.</p>
                  </div>
                  {invFilterCampId && (
                    <button
                      onClick={() => setInvFilterCampId('')}
                      className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-lg text-[10px] cursor-pointer transition-colors"
                    >
                      Clear Camp Filter ❌
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {camps.length === 0 ? (
                    <div className="col-span-3 py-6 text-center text-slate-400 italic">No camp campaigns configured yet.</div>
                  ) : (
                    camps.map((camp: any) => {
                      const campInvites = invitations.filter((i: any) => i.camp_id === camp.id);
                      const totalSent = campInvites.length;
                      const attending = campInvites.filter((i: any) => i.status === 'Accepted').length;
                      const pending = campInvites.filter((i: any) => i.status === 'Pending').length;
                      const declined = campInvites.filter((i: any) => i.status === 'Declined').length;
                      const isFiltered = invFilterCampId === camp.id;

                      return (
                        <div
                          key={camp.id}
                          onClick={() => setInvFilterCampId(isFiltered ? '' : camp.id)}
                          className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                            isFiltered
                              ? 'bg-indigo-50/50 border-indigo-400 ring-2 ring-indigo-600/15 shadow-sm'
                              : 'bg-slate-50 hover:bg-slate-100 border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="space-y-1">
                            <div className="flex justify-between items-start">
                              <span className={`px-2 py-0.5 rounded font-bold text-[8px] uppercase tracking-wide border ${
                                camp.status === 'Scheduled' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                              }`}>
                                {camp.status}
                              </span>
                              <span className="font-mono text-slate-400 text-[9px] font-semibold">{camp.date}</span>
                            </div>
                            <h5 className="font-bold text-slate-900 text-xs truncate" title={camp.name}>{camp.name}</h5>
                            <p className="text-[9px] text-slate-500 font-medium">📍 {camp.location} Area ({camp.duration_days || 1} {(camp.duration_days || 1) === 1 ? 'Day' : 'Days'})</p>
                          </div>

                          <div className="pt-2 border-t border-slate-200/50 grid grid-cols-4 gap-1 text-center text-[9px] font-semibold">
                            <div className="bg-white p-1 rounded border border-slate-100">
                              <span className="text-[8px] text-slate-400 block">Sent</span>
                              <span className="text-slate-800 font-bold block">{totalSent}</span>
                            </div>
                            <div className="bg-white p-1 rounded border border-slate-100">
                              <span className="text-[8px] text-emerald-500 block">Attnd</span>
                              <span className="text-emerald-700 font-bold block">{attending}</span>
                            </div>
                            <div className="bg-white p-1 rounded border border-slate-100">
                              <span className="text-[8px] text-amber-500 block">Pend</span>
                              <span className="text-amber-700 font-bold block">{pending}</span>
                            </div>
                            <div className="bg-white p-1 rounded border border-slate-100">
                              <span className="text-[8px] text-rose-500 block">Decl</span>
                              <span className="text-rose-750 font-bold block">{declined}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* KPI Status Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Dispatched</span>
                  <span className="text-2xl font-black text-slate-900 mt-0.5 block">{invitations.length}</span>
                </div>
                <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 text-center text-emerald-800">
                  <span className="block text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Attending / Accepted</span>
                  <span className="text-2xl font-black text-slate-950 mt-0.5 block">
                    {invitations.filter((i: any) => i.status === 'Accepted').length}
                  </span>
                </div>
                <div className="bg-rose-50 p-4 rounded-xl border border-rose-100 text-center text-rose-800">
                  <span className="block text-[10px] font-bold text-rose-600 uppercase tracking-wider">Declined (Unable to Attend)</span>
                  <span className="text-2xl font-black text-slate-950 mt-0.5 block">
                    {invitations.filter((i: any) => i.status === 'Declined').length}
                  </span>
                </div>
                <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 text-center text-amber-800">
                  <span className="block text-[10px] font-bold text-amber-600 uppercase tracking-wider">Pending Response</span>
                  <span className="text-2xl font-black text-slate-950 mt-0.5 block">
                    {invitations.filter((i: any) => i.status === 'Pending').length}
                  </span>
                </div>
              </div>

              {/* Filters Bar */}
              <div className="flex flex-col sm:flex-row gap-3 justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex flex-wrap gap-1">
                  {(['All', 'Pending', 'Accepted', 'Declined'] as const).map((status) => {
                    const count = status === 'All' ? invitations.length : invitations.filter((i: any) => i.status === status).length;
                    const isActive = invFilterStatus === status;
                    return (
                      <button
                        key={status}
                        onClick={() => setInvFilterStatus(status)}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer ${
                          isActive 
                            ? 'bg-indigo-600 text-white shadow-xs' 
                            : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                        }`}
                      >
                        {status} ({count})
                      </button>
                    );
                  })}
                </div>

                <div className="w-full sm:w-64">
                  <input
                    type="text"
                    placeholder="Search doctor, camp or location..."
                    value={invSearchQuery}
                    onChange={(e) => setInvSearchQuery(e.target.value)}
                    className="w-full text-xs p-2 bg-white border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Logs Table */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs min-w-3xl">
                    <thead>
                      <tr className="bg-slate-50/50 border-b border-slate-200 text-slate-500 uppercase text-[10px] tracking-wider font-semibold">
                        <th className="p-4">Volunteer Specialist</th>
                        <th className="p-4">Clinical Camp Campaign</th>
                        <th className="p-4">Delivery Channel</th>
                        <th className="p-4">Timestamp</th>
                        <th className="p-4">Rsvp Status</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredInvitations.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-slate-400">
                            No invitations match the select criteria.
                          </td>
                        </tr>
                      ) : (
                        filteredInvitations.map((inv) => {
                          const doc = inv.profiles || inv.profile || {};
                          const camp = inv.camps || inv.camp || {};
                          return (
                            <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="p-4">
                                <div className="flex items-center space-x-3">
                                  <span className="text-2xl">{doc.avatar || '👨‍⚕️'}</span>
                                  <div>
                                    <h5 className="font-bold text-slate-900">{doc.name || 'Unknown Doctor'}</h5>
                                    <p className="text-[10px] text-slate-400">
                                      {doc.specialty || 'General Medicine'} • {doc.role || 'Doctor'}
                                    </p>
                                    {inv.status === 'Accepted' && inv.custom_requests && (
                                      <div className="text-[9px] text-indigo-750 bg-indigo-50/55 border border-indigo-150 px-2 py-0.5 rounded-md mt-1.5 font-medium max-w-xs whitespace-normal">
                                        Transit Request: <strong>{inv.custom_requests}</strong>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="p-4">
                                <button
                                  type="button"
                                  onClick={() => handleOpenCampDetails(camp)}
                                  className="font-semibold text-slate-800 hover:text-indigo-600 transition-colors text-left focus:outline-none cursor-pointer"
                                >
                                  {camp.name || 'Unknown Camp'} ↗
                                </button>
                                <div className="text-[10px] text-slate-400">📍 {camp.location || 'N/A'}</div>
                              </td>
                              <td className="p-4 text-slate-600 font-medium">
                                <span className="px-2 py-1 bg-slate-100 rounded-md border border-slate-200 text-[10px]">
                                  {inv.sent_via || 'System Direct'}
                                </span>
                              </td>
                              <td className="p-4 text-slate-400 font-mono text-[11px]">
                                {inv.timestamp}
                              </td>
                              <td className="p-4">
                                <span className={`px-2.5 py-0.5 rounded-full font-bold text-[9px] uppercase tracking-wide border ${
                                  inv.status === 'Accepted' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                  inv.status === 'Pending' ? 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse' :
                                  'bg-rose-50 text-rose-700 border-rose-200'
                                }`}>
                                  {inv.status === 'Accepted' ? 'Attending ✓' : inv.status === 'Declined' ? 'Declined ✗' : 'Pending ⏳'}
                                </span>
                              </td>
                              <td className="p-4 text-right">
                                <button
                                  onClick={() => handleRetractInvitation(inv.id, inv.camp_id, inv.doctor_id)}
                                  className="px-2.5 py-1.5 rounded bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold text-[10px] cursor-pointer transition-all"
                                  title="Retract this invitation and clear volunteer roster state"
                                >
                                  Retract & Clear 🗑️
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: DAY-OF CHECK-IN MANAGER */}
          {activeTab === 'check-in' && (
            <div className="space-y-6 animate-fade-in text-xs">
              <div className="border-b border-slate-100 pb-4 flex flex-col md:flex-row justify-between items-start md:items-center">
                <div>
                  <h2 className="text-2xl font-extrabold text-slate-900">Day-of Camp Execution Terminal</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Simulate live attendance tracking during camp execution. Check volunteers in and out of active locations.
                  </p>
                </div>
                <button
                  onClick={() => Promise.all([fetchCamps(), fetchVolunteers(), fetchCheckIns()])}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg border border-slate-200 mt-2 md:mt-0 cursor-pointer flex items-center space-x-1"
                >
                  <span>🔄</span> <span>Refresh Terminal</span>
                </button>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs">
                <label className="font-bold text-slate-700 uppercase tracking-wide">Select Target Running Camp Campaign:</label>
                <select 
                  value={checkInCampId} 
                  onChange={(e) => setCheckInCampId(e.target.value)}
                  className="p-1.5 px-2 border border-slate-300 rounded bg-white font-semibold focus:ring-1 focus:ring-indigo-500 text-slate-800"
                >
                  {camps.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.location})</option>
                  ))}
                </select>
              </div>

              {(() => {
                const selectedCamp = camps.find(c => c.id === checkInCampId);
                if (!selectedCamp) {
                  return (
                    <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-slate-400">
                      No camp campaigns currently defined. Use "Configure Camp" tab to register new fields.
                    </div>
                  );
                }

                // Filter RSVP'd specialists (attending volunteers)
                const assignedVolIds = new Set<string>([
                  ...(selectedCamp.assigned_volunteers || []),
                  ...invitations.filter((i: any) => i.camp_id === selectedCamp.id && i.status === 'Accepted').map((i: any) => i.doctor_id)
                ]);
                const roster = volunteers.filter((v: any) => assignedVolIds.has(v.id));

                return (
                  <div className="space-y-6">
                    {/* Camp detail cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                      <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
                        <span className="font-bold text-slate-400 uppercase tracking-wider block">Camp Field</span>
                        <span className="text-sm font-extrabold text-slate-800 block mt-1">{selectedCamp.location} Area</span>
                      </div>
                      <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
                        <span className="font-bold text-slate-400 uppercase tracking-wider block">Target Capacity Patients</span>
                        <span className="text-sm font-extrabold text-slate-800 block mt-1">{selectedCamp.expected_patients || selectedCamp.expectedPatients} Patients</span>
                      </div>
                      <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
                        <span className="font-bold text-slate-400 uppercase tracking-wider block">Scheduled Date</span>
                        <span className="text-sm font-extrabold text-slate-800 block mt-1">{selectedCamp.date}</span>
                      </div>
                      <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
                        <span className="font-bold text-slate-400 uppercase tracking-wider block">Assigned Count</span>
                        <span className="text-sm font-extrabold text-slate-800 block mt-1">{roster.length} Enrolled</span>
                      </div>
                    </div>

                    {/* Volunteer Roster Check in Area */}
                    <div className="space-y-4">
                      <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Attendance Logs Roster</h4>
                      
                      {roster.length === 0 ? (
                        <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-xs text-slate-400">
                          No active volunteer practitioners mapped to this camp yet. Complete matchmaking steps first!
                        </div>
                      ) : (
                        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
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
                              {roster.map(doc => {
                                const attendance = checkIns.find(ci => ci.doctor_id === doc.id && ci.camp_id === selectedCamp.id);
                                const todayStr = new Date().toLocaleDateString('en-CA');
                                const isBeforeCampDate = todayStr < selectedCamp.date;

                                return (
                                  <tr key={doc.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="p-4 font-bold text-slate-900 flex items-center space-x-2">
                                      <span className="text-xl">{doc.avatar || '👨‍⚕️'}</span>
                                      <span>{doc.name}</span>
                                    </td>
                                    <td className="p-4 text-slate-600 font-semibold">{doc.specialty} ({doc.role})</td>
                                    <td className="p-4 font-mono text-slate-500">{attendance?.check_in_time || '--'}</td>
                                    <td className="p-4 font-mono text-slate-500">{attendance?.check_out_time || '--'}</td>
                                    <td className="p-4 text-right">
                                      {isBeforeCampDate ? (
                                        <span className="text-[10px] text-slate-400 font-bold bg-slate-100 border border-slate-200 px-2 py-1.5 rounded-lg select-none">
                                          Unavailable before {selectedCamp.date} ⏳
                                        </span>
                                      ) : (
                                        <button
                                          onClick={() => handleCheckInToggle(doc.id, selectedCamp.id)}
                                          className={`px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-all cursor-pointer ${
                                            !attendance ? 'bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-50' :
                                            attendance.status === 'Checked In' ? 'bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-50' :
                                            'bg-slate-300 text-slate-600 cursor-not-allowed'
                                          }`}
                                          disabled={attendance?.status === 'Checked Out'}
                                        >
                                          {!attendance ? 'Check In 🛫' :
                                           attendance.status === 'Checked In' ? 'Check Out 🛬' :
                                           'Completed ✓'}
                                        </button>
                                      )}
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
                );
              })()}
            </div>
          )}

        </main>
      </div>

      {/* --- REVIEW DOCUMENTS MODAL (SECURE VIEWER) --- */}
      {selectedVol && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4 animate-scale-up">
            
            <div className="flex justify-between items-start pb-2 border-b border-slate-100">
              <div className="flex items-center space-x-3 text-left">
                <div className="w-12 h-12 rounded-full overflow-hidden border border-slate-200 flex items-center justify-center bg-slate-50 flex-shrink-0">
                  {profilePhotoUrl ? (
                    <img src={profilePhotoUrl} alt={selectedVol.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl">{selectedVol.avatar || '👨‍⚕️'}</span>
                  )}
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm">{selectedVol.name} Credentials Audit</h4>
                  <p className="text-[10px] text-slate-400 font-mono">
                    {selectedVol.reg_number} • {selectedVol.role}
                  </p>
                  {selectedVol.professional_designation && (
                    <p className="text-[10px] text-indigo-600 font-bold italic mt-0.5">
                      Profession: {selectedVol.professional_designation}
                    </p>
                  )}
                </div>
              </div>
              <button 
                onClick={() => setSelectedVol(null)} 
                className="text-slate-400 hover:text-slate-900 font-bold text-lg cursor-pointer ml-2"
              >
                ×
              </button>
            </div>

             <div className="space-y-3 text-xs">
              {selectedVol.status === 'Rejected' && selectedVol.rejection_reason && (
                <div className="p-3.5 bg-rose-50 border border-rose-100 rounded-xl text-rose-800 text-[11px] space-y-1">
                  <span className="font-bold flex items-center space-x-1">
                    <span>⚠️</span> <span>Rejection Audit Feedback:</span>
                  </span>
                  <p className="text-rose-700 font-medium leading-relaxed bg-white/50 p-2 rounded-lg border border-rose-100/50">
                    "{selectedVol.rejection_reason}"
                  </p>
                </div>
              )}

              {/* Mission Service Preferences Card */}
              <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 space-y-2">
                <p className="font-bold text-slate-700 text-xs">Mission Service Preferences</p>
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div>
                    <span className="text-slate-400 font-semibold block">Age:</span>
                    <span className="font-bold text-slate-800">{selectedVol.age ? `${selectedVol.age} Years` : 'Not Specified'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block">Experience:</span>
                    <span className="font-bold text-slate-800">{selectedVol.experience ? `${selectedVol.experience} Years` : 'Not Specified'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block">Willingness to Serve:</span>
                    <span className="font-bold text-slate-800">{selectedVol.willingness_to_serve || 'Prefer to Discuss'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block">Teleconsultation:</span>
                    <span className="font-bold text-slate-800">{selectedVol.available_for_teleconsultation ? 'Yes' : 'No'}</span>
                  </div>
                  {selectedVol.specialty_description && (
                    <div className="col-span-2">
                      <span className="text-slate-400 font-semibold block">Specialty Description:</span>
                      <span className="font-bold text-slate-800 italic">"{selectedVol.specialty_description}"</span>
                    </div>
                  )}
                  <div className="col-span-2">
                    <span className="text-slate-400 font-semibold block">Areas of Interest:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedVol.areas_of_interest && selectedVol.areas_of_interest.length > 0 ? (
                        selectedVol.areas_of_interest.map((area: string) => (
                          <span key={area} className="bg-indigo-50 text-indigo-750 font-bold text-[9px] px-1.5 py-0.5 rounded">
                            {area}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-400 italic">None selected</span>
                      )}
                    </div>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400 font-semibold block">Preferred Geography:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedVol.preferred_geography && selectedVol.preferred_geography.length > 0 ? (
                        selectedVol.preferred_geography.map((geo: string) => (
                          <span key={geo} className="bg-emerald-50 text-emerald-750 font-bold text-[9px] px-1.5 py-0.5 rounded">
                            {geo}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-400 italic">None selected</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center space-x-3">
                <span className="text-xl">✅</span>
                <div>
                  <p className="font-bold text-indigo-950">National Council Registry Verification Check</p>
                  <p className="text-indigo-800 text-[10px]">Verify registration code in standard medical guidelines databases prior to campaign scheduling.</p>
                </div>
              </div>

              {/* Files download/view list */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-3">
                <p className="font-bold text-slate-700 text-center text-xs">Uploaded Digital Certification Scans</p>
                
                {fetchingUrls ? (
                  <div className="text-center py-4 text-slate-400 text-[11px] animate-pulse">
                    Generating secure signed URLs...
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {/* Degree Certificate */}
                    <div className="flex justify-between items-center bg-white p-2.5 rounded-lg border border-slate-200">
                      <span className="font-medium">Medical Degree scan</span>
                      {degreeUrl ? (
                        <a 
                          href={degreeUrl} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded text-[10px] transition-colors"
                        >
                          View Degree ↗
                        </a>
                      ) : (
                        <span className="text-[10px] text-rose-500 font-bold">No file uploaded</span>
                      )}
                    </div>

                    {/* License Copy */}
                    <div className="flex justify-between items-center bg-white p-2.5 rounded-lg border border-slate-200">
                      <span className="font-medium">Medical Council License</span>
                      {licenseUrl ? (
                        <a 
                          href={licenseUrl} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded text-[10px] transition-colors"
                        >
                          View License ↗
                        </a>
                      ) : (
                        <span className="text-[10px] text-rose-500 font-bold">No file uploaded</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Actions in Modal */}
            <div className="flex justify-between items-center pt-2 border-t border-slate-100">
              <div className="flex space-x-2">
                {(selectedVol.status === 'Pending' || selectedVol.status === 'Rejected') && (
                  <button 
                    onClick={() => handleUpdateStatus(selectedVol.id, 'Approved')}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
                  >
                    {selectedVol.status === 'Rejected' ? 'Approve & Onboard' : 'Approve Volunteer'}
                  </button>
                )}
                {(selectedVol.status === 'Pending' || selectedVol.status === 'Approved') && (
                  <button 
                    onClick={() => { setRejectingVolId(selectedVol.id); setRejectionReasonInput(''); }}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
                  >
                    {selectedVol.status === 'Approved' ? 'Suspend / Flag' : 'Decline Application'}
                  </button>
                )}
              </div>
              <button 
                onClick={() => setSelectedVol(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition-colors cursor-pointer"
              >
                Close Audit Viewer
              </button>
            </div>

          </div>
        </div>
      )}

      {/* --- ADMIN CAMP DETAILS MODAL --- */}
      {selectedCampDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 space-y-4 animate-scale-up text-xs text-slate-800">
            
            <div className="flex justify-between items-start pb-2 border-b border-slate-100">
              <div>
                <h4 className="font-extrabold text-slate-900 text-base">
                  {isEditingCamp ? 'Edit Camp Campaign' : isCancelingCamp ? 'Cancel Camp Campaign' : selectedCampDetails.name}
                </h4>
                <p className="text-[10px] text-indigo-600 font-semibold uppercase tracking-wider mt-0.5">
                  📍 {selectedCampDetails.location} • Date: {selectedCampDetails.date}
                </p>
              </div>
              <button 
                onClick={() => {
                  setSelectedCampDetails(null);
                  setIsEditingCamp(false);
                  setIsCancelingCamp(false);
                }} 
                className="text-slate-400 hover:text-slate-900 font-bold text-lg cursor-pointer"
              >
                ×
              </button>
            </div>

            {isEditingCamp ? (
              /* --- EDIT MODE VIEW --- */
              <form onSubmit={handleEditCampSubmit} className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">Camp Campaign Name</label>
                    <input 
                      type="text" 
                      value={editCampForm.name}
                      onChange={(e) => setEditCampForm({ ...editCampForm, name: e.target.value })}
                      className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-600 mb-1">Location Node</label>
                      <select 
                        value={editCampForm.location}
                        onChange={(e) => setEditCampForm({ ...editCampForm, location: e.target.value })}
                        className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                      >
                        {locations.map(loc => (
                          <option key={loc.id} value={loc.name}>{loc.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-600 mb-1">Status</label>
                      <select 
                        value={editCampForm.status}
                        onChange={(e) => setEditCampForm({ ...editCampForm, status: e.target.value })}
                        className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500 focus:outline-none font-bold"
                      >
                        <option value="Drafting">Drafting 📝</option>
                        <option value="Scheduled">Scheduled 🚀</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-600 mb-1">Patients Target</label>
                      <input 
                        type="number" 
                        value={editCampForm.expectedPatients}
                        onChange={(e) => setEditCampForm({ ...editCampForm, expectedPatients: Number(e.target.value) })}
                        className="w-full p-2 bg-slate-50 border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-600 mb-1">Camp Duration (Days)</label>
                      <select 
                        value={editCampForm.durationDays}
                        onChange={(e) => setEditCampForm({ ...editCampForm, durationDays: Number(e.target.value) })}
                        className="w-full p-2 bg-slate-50 border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500 focus:outline-none font-bold text-indigo-950"
                      >
                        <option value={1}>1 Day</option>
                        <option value={2}>2 Days</option>
                        <option value={3}>3 Days</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-600 mb-1">Date</label>
                      <input 
                        type="date" 
                        value={editCampForm.date}
                        onChange={(e) => {
                          const dateVal = e.target.value;
                          const parts = dateVal.split('-');
                          const dayVal = parts.length === 3 ? parseInt(parts[2]) : 15;
                          setEditCampForm({ ...editCampForm, date: dateVal, day: dayVal });
                        }}
                        className="w-full p-2 bg-slate-50 border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-600 mb-1">Month Tag</label>
                      <select 
                        value={editCampForm.month}
                        onChange={(e) => setEditCampForm({ ...editCampForm, month: e.target.value })}
                        className="w-full p-2 bg-slate-50 border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                      >
                        <option value="Jul">July</option>
                        <option value="Aug">August</option>
                        <option value="Sep">September</option>
                        <option value="Oct">October</option>
                        <option value="Nov">November</option>
                        <option value="Dec">December</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block font-semibold text-slate-700">Specialty Patient Need Estimates</label>
                    <div className="grid grid-cols-4 md:grid-cols-7 gap-2">
                      <div>
                        <label className="block text-slate-500 text-[10px]">Eye Vol</label>
                        <input
                          type="number"
                          value={editCampForm.estimateEye}
                          onChange={(e) => setEditCampForm({ ...editCampForm, estimateEye: Number(e.target.value) })}
                          className="w-full p-1 text-xs bg-slate-50 border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-500 text-[10px]">Dental Vol</label>
                        <input
                          type="number"
                          value={editCampForm.estimateDental}
                          onChange={(e) => setEditCampForm({ ...editCampForm, estimateDental: Number(e.target.value) })}
                          className="w-full p-1 text-xs bg-slate-50 border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-500 text-[10px]">Gynec Vol</label>
                        <input
                          type="number"
                          value={editCampForm.estimateGynec}
                          onChange={(e) => setEditCampForm({ ...editCampForm, estimateGynec: Number(e.target.value) })}
                          className="w-full p-1 text-xs bg-slate-50 border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-500 text-[10px]">Diabetic Vol</label>
                        <input
                          type="number"
                          value={editCampForm.estimateDiabetic}
                          onChange={(e) => setEditCampForm({ ...editCampForm, estimateDiabetic: Number(e.target.value) })}
                          className="w-full p-1 text-xs bg-slate-50 border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-500 text-[10px]">Cardio Vol</label>
                        <input
                          type="number"
                          value={editCampForm.estimateCardio}
                          onChange={(e) => setEditCampForm({ ...editCampForm, estimateCardio: Number(e.target.value) })}
                          className="w-full p-1 text-xs bg-slate-50 border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-500 text-[10px]">Therapy Vol</label>
                        <input
                          type="number"
                          value={editCampForm.estimateTherapy}
                          onChange={(e) => setEditCampForm({ ...editCampForm, estimateTherapy: Number(e.target.value) })}
                          className="w-full p-1 text-xs bg-slate-50 border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-500 text-[10px]">Psychology Vol</label>
                        <input
                          type="number"
                          value={editCampForm.estimatePsychology}
                          onChange={(e) => setEditCampForm({ ...editCampForm, estimatePsychology: Number(e.target.value) })}
                          className="w-full p-1 text-xs bg-slate-50 border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block font-semibold text-slate-600">Needed Specialties List</label>
                    <div className="flex flex-wrap gap-1">
                      {['General Medicine', 'Pediatrics', 'Orthopedics', 'Cardiology', 'Dermatology', 'Gynecology', 'Ophthalmology', 'psychologist', 'Other therapist'].map(spec => {
                        const checked = editCampForm.neededSpecialties.includes(spec);
                        return (
                          <button
                            type="button"
                            key={spec}
                            onClick={() => {
                              if (checked) {
                                setEditCampForm({ ...editCampForm, neededSpecialties: editCampForm.neededSpecialties.filter(s => s !== spec) });
                              } else {
                                setEditCampForm({ ...editCampForm, neededSpecialties: [...editCampForm.neededSpecialties, spec] });
                              }
                            }}
                            className={`px-2 py-1 rounded border text-[10px] font-bold transition-all cursor-pointer ${
                              checked 
                                ? 'bg-indigo-600 text-white border-indigo-700' 
                                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {checked ? '✓' : '+'} {spec}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                  <button 
                    type="button"
                    onClick={() => setIsEditingCamp(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            ) : isCancelingCamp ? (
              /* --- CANCELLATION WARNING MODE --- */
              <div className="space-y-4">
                <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl text-rose-800 space-y-2">
                  <p className="font-extrabold text-sm">⚠️ Confirm Camp Cancellation</p>
                  <p className="text-xs leading-relaxed">
                    This action will permanently delete the camp campaign <strong>{selectedCampDetails.name}</strong> and purge all invitations. 
                    Volunteers who accepted (<strong>{campRoster.filter(r => r.status === 'Accepted').length} specialists</strong>) will receive a cancellation notice.
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="block font-semibold text-slate-700">Cancellation Reason / Alert Note to Confirmed Doctors</label>
                  <textarea 
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="e.g. Due to unexpected road closures in Koya, this camp campaign has been postponed. Fresh invites will be dispatched."
                    className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded focus:ring-1 focus:ring-rose-500 focus:outline-none h-20"
                    required
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                  <button 
                    type="button"
                    onClick={() => {
                      setIsCancelingCamp(false);
                      setCancelReason('');
                    }}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg cursor-pointer"
                  >
                    Go Back
                  </button>
                  <button 
                    type="button"
                    onClick={handleCancelCampConfirm}
                    disabled={!cancelReason.trim()}
                    className="px-4 py-2 bg-rose-600 disabled:opacity-40 hover:bg-rose-700 text-white font-bold rounded-lg cursor-pointer"
                  >
                    Confirm & Cancel Campaign 🗑️
                  </button>
                </div>
              </div>
            ) : (
              /* --- STANDARD DISPLAY VIEW --- */
              <>
                <div className="space-y-4">
                  {/* Camp Info details */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <span className="text-[9px] text-slate-400 uppercase font-bold block">Camp Duration</span>
                      <span className="text-xs font-bold text-slate-950 mt-1 block">
                        {selectedCampDetails.duration_days || 1} {(selectedCampDetails.duration_days || 1) === 1 ? 'Day' : 'Days'}
                      </span>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <span className="text-[9px] text-slate-400 uppercase font-bold block">Expected Patients</span>
                      <span className="text-xs font-bold text-slate-950 mt-1 block">
                        {selectedCampDetails.expected_patients || selectedCampDetails.expectedPatients} patients
                      </span>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <span className="text-[9px] text-slate-400 uppercase font-bold block">Status</span>
                      <span className="text-xs font-bold mt-1 block">
                        <span className={`px-2 py-0.5 border rounded-full font-bold text-[9px] uppercase tracking-wide ${
                          selectedCampDetails.status === 'Scheduled' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {selectedCampDetails.status || 'Active'}
                        </span>
                      </span>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <span className="text-[9px] text-slate-400 uppercase font-bold block">Needed Specialties</span>
                      <span className="text-xs font-bold text-slate-950 mt-1 block truncate" title={selectedCampDetails.needed_specialties?.join(', ')}>
                        {selectedCampDetails.needed_specialties?.join(', ') || 'General Medicine'}
                      </span>
                    </div>
                  </div>

                  {/* Patient Need Estimates by Specialty */}
                  <div className="p-3.5 bg-indigo-50/30 border border-indigo-100 rounded-xl space-y-2">
                    <span className="font-bold text-indigo-950 block">Patient Estimates by Specialty:</span>
                    <div className="grid grid-cols-4 md:grid-cols-7 gap-2 text-center text-[10px]">
                      <div className="bg-white p-2 rounded border border-indigo-50">
                        <span className="text-slate-400 block font-semibold">Eye</span>
                        <span className="text-indigo-900 font-extrabold text-sm block mt-0.5">{selectedCampDetails.estimate_eye || 0}</span>
                      </div>
                      <div className="bg-white p-2 rounded border border-indigo-50">
                        <span className="text-slate-400 block font-semibold">Dental</span>
                        <span className="text-indigo-900 font-extrabold text-sm block mt-0.5">{selectedCampDetails.estimate_dental || 0}</span>
                      </div>
                      <div className="bg-white p-2 rounded border border-indigo-50">
                        <span className="text-slate-400 block font-semibold">Gynec</span>
                        <span className="text-indigo-900 font-extrabold text-sm block mt-0.5">{selectedCampDetails.estimate_gynec || 0}</span>
                      </div>
                      <div className="bg-white p-2 rounded border border-indigo-50">
                        <span className="text-slate-400 block font-semibold">Diabetic</span>
                        <span className="text-indigo-900 font-extrabold text-sm block mt-0.5">{selectedCampDetails.estimate_diabetic || 0}</span>
                      </div>
                      <div className="bg-white p-2 rounded border border-indigo-50">
                        <span className="text-slate-400 block font-semibold">Cardio</span>
                        <span className="text-indigo-900 font-extrabold text-sm block mt-0.5">{selectedCampDetails.estimate_cardio || 0}</span>
                      </div>
                      <div className="bg-white p-2 rounded border border-indigo-50">
                        <span className="text-slate-400 block font-semibold">Therapy</span>
                        <span className="text-indigo-900 font-extrabold text-sm block mt-0.5">{selectedCampDetails.estimate_therapy || 0}</span>
                      </div>
                      <div className="bg-white p-2 rounded border border-indigo-50">
                        <span className="text-slate-400 block font-semibold">Psychology</span>
                        <span className="text-indigo-900 font-extrabold text-sm block mt-0.5">{selectedCampDetails.estimate_psychology || 0}</span>
                      </div>
                    </div>
                  </div>

                  {/* Roster of invited doctors & status */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                    <div className="p-3 bg-slate-200/50 border-b border-slate-200 font-bold text-slate-700 flex justify-between items-center">
                      <span>Specialists Campaign RSVP Log</span>
                      <span className="bg-indigo-100 text-indigo-800 font-bold text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider">
                        {campRoster.length} Dispatched
                      </span>
                    </div>

                    <div className="divide-y divide-slate-200 max-h-48 overflow-y-auto bg-white">
                      {loadingRoster ? (
                        <div className="text-center py-6 text-slate-400 font-semibold animate-pulse">
                          Loading camp roster details...
                        </div>
                      ) : campRoster.length === 0 ? (
                        <div className="text-center py-6 text-slate-400 italic">
                          No invitations have been dispatched for this camp. Go to AI matching to invite specialists!
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
                                  {item.status === 'Accepted' && item.custom_requests && (
                                    <p className="text-[9px] text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded mt-1 font-semibold border border-indigo-150">
                                      Transit Need: "{item.custom_requests}"
                                    </p>
                                  )}
                                </div>
                              </div>
                              <span className={`px-2 py-0.5 rounded font-bold text-[9px] uppercase border ${
                                item.status === 'Accepted' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                item.status === 'Pending' ? 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse' :
                                'bg-rose-50 text-rose-700 border-rose-200'
                              }`}>
                                {item.status === 'Accepted' ? 'Attending ✓' : item.status === 'Declined' ? 'Declined ✗' : 'Pending ⏳'}
                              </span>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-2 border-t border-slate-100 space-x-2">
                  <button 
                    onClick={() => {
                      setEditCampForm({
                        name: selectedCampDetails.name,
                        location: selectedCampDetails.location,
                        date: selectedCampDetails.date,
                        month: selectedCampDetails.month || 'Jul',
                        day: selectedCampDetails.day || 15,
                        expectedPatients: selectedCampDetails.expected_patients || selectedCampDetails.expectedPatients || 0,
                        status: selectedCampDetails.status || 'Drafting',
                        neededSpecialties: selectedCampDetails.needed_specialties || [],
                        durationDays: selectedCampDetails.duration_days || 1,
                        estimateEye: selectedCampDetails.estimate_eye || 0,
                        estimateDental: selectedCampDetails.estimate_dental || 0,
                        estimateGynec: selectedCampDetails.estimate_gynec || 0,
                        estimateDiabetic: selectedCampDetails.estimate_diabetic || 0,
                        estimateCardio: selectedCampDetails.estimate_cardio || 0,
                        estimateTherapy: selectedCampDetails.estimate_therapy || 0,
                        estimatePsychology: selectedCampDetails.estimate_psychology || 0
                      });
                      setIsEditingCamp(true);
                    }}
                    className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg cursor-pointer transition-colors"
                  >
                    Edit Details ✏️
                  </button>
                  <button 
                    onClick={() => {
                      setIsCancelingCamp(true);
                      setCancelReason('');
                    }}
                    className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-lg cursor-pointer transition-colors"
                  >
                    Cancel Camp 🗑️
                  </button>
                  <button 
                    onClick={() => setSelectedCampDetails(null)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg cursor-pointer transition-colors"
                  >
                    Close Details
                  </button>
                </div>
              </>
            )}

          </div>
        </div>
      )}

      {rejectingVolId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <h4 className="font-extrabold text-slate-900 text-sm">Specify Rejection Reason</h4>
            <p className="text-xs text-slate-500">Provide volunteer feedback detailing why the credentials application has been flagged.</p>
            
            <textarea
              value={rejectionReasonInput}
              onChange={(e) => setRejectionReasonInput(e.target.value)}
              placeholder="e.g. Medical license scan is blurry. Please re-upload a clear file."
              className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-rose-500 focus:outline-none bg-slate-50 text-xs text-slate-800 h-24"
              required
            />

            <div className="flex justify-end space-x-2 text-xs">
              <button
                onClick={() => setRejectingVolId(null)}
                className="px-3 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={submitRejection}
                className="px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded font-semibold cursor-pointer"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="bg-slate-950 border-t border-slate-900 py-6 text-center text-slate-500 text-xs mt-auto">
        <p>© 2026 Avodah. Administrative Control Center.</p>
      </footer>
    </div>
  );
}
