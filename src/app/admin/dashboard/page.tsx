'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';

const MONTH_NAMES: Record<string, string> = {
  Jan: 'January', Feb: 'February', Mar: 'March', Apr: 'April', May: 'May', Jun: 'June',
  Jul: 'July', Aug: 'August', Sep: 'September', Oct: 'October', Nov: 'November', Dec: 'December'
};

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

  // Manage Doctors Inline State
  const [selectedCampForAssignment, setSelectedCampForAssignment] = useState<any>(null);
  const [deliveryChannel, setDeliveryChannel] = useState('Web App Notification');
  const [filterAvailability, setFilterAvailability] = useState(true);
  const [filterSpecialties, setFilterSpecialties] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [filterLocationPriority, setFilterLocationPriority] = useState<string>('All');
  const [doctorSearchQuery, setDoctorSearchQuery] = useState('');
  const [sortField, setSortField] = useState<'name' | 'specialty' | 'completed_days' | 'location_priority'>('name');
  const [sortAsc, setSortAsc] = useState(true);
  const [selectedDoctorIds, setSelectedDoctorIds] = useState<string[]>([]);
  const [specialtyDropdownOpen, setSpecialtyDropdownOpen] = useState(false);

  const [activeTab, setActiveTab] = useState<'overview' | 'verification' | 'locations' | 'schedules' | 'camp-creation' | 'manage-doctors' | 'invitations-log' | 'check-in'>('overview');
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
      } else if (tabName === 'manage-doctors') {
        setSelectedCampForAssignment(null);
        await Promise.all([fetchCamps(), fetchVolunteers(), fetchInvitations()]);
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

  const handleGeocodeLocation = async (name: string) => {
    if (!name.trim()) return;
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(name)}`);
      const data = await res.json();
      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        setNewLoc(prev => ({
          ...prev,
          latitude: parseFloat(lat).toFixed(4),
          longitude: parseFloat(lon).toFixed(4)
        }));
      }
    } catch (err) {
      console.error('Error geocoding location name:', err);
    }
  };

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
    date: new Date().toISOString().split('T')[0],
    month: new Date().toLocaleString('en-US', { month: 'short' }),
    day: new Date().getDate(),
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
    date: new Date().toISOString().split('T')[0],
    month: new Date().toLocaleString('en-US', { month: 'short' }),
    day: new Date().getDate(),
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

  const handleResendInvitation = async (invite: any) => {
    try {
      const doc = volunteers.find(v => v.id === invite.doctor_id);
      if (!doc) return;

      const todayStr = new Date().toISOString().split('T')[0];
      const { error } = await supabase
        .from('invitations')
        .update({ timestamp: todayStr })
        .eq('id', invite.id);

      if (error) throw error;

      if (invite.sent_via.includes('Email') && doc.email) {
        try {
          await fetch('/api/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: doc.email,
              subject: `Resent Invitation: Healthcare Deployment Campaign - ${selectedCampForAssignment.name}`,
              html: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                <h2>Avodani Medical Mission Invitation (Resent)</h2>
                <p>Dear <strong>${doc.name}</strong>,</p>
                <p>This is a reminder of your match for the upcoming healthcare deployment campaign at <strong>${selectedCampForAssignment.location}</strong> on <strong>${selectedCampForAssignment.date}</strong>.</p>
              </div>`
            })
          });
        } catch (err) {
          console.error("Email resend failed", err);
        }
      }

      triggerToast(`Resent invitation to ${doc.name} successfully!`);
      await fetchInvitations();
    } catch (err: any) {
      triggerToast(`Failed to resend invitation: ${err.message}`);
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

      triggerToast(`Campaign launched: ${newCamp.name}`);
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
      handleTabChange('overview');
    } catch (err: any) {
      triggerToast(`Failed to create camp: ${err.message}`);
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

      // 3. Refresh global invitations and camps state
      await Promise.all([fetchInvitations(), fetchCamps()]);

      // 4. If the details modal is open for this camp, refresh its roster and details
      if (selectedCampDetails && selectedCampDetails.id === campId) {
        const { data: freshCamp } = await supabase
          .from('camps')
          .select('*')
          .eq('id', campId)
          .single();
        if (freshCamp) {
          setSelectedCampDetails(freshCamp);
        }

        const { data: freshRoster } = await supabase
          .from('invitations')
          .select(`
            *,
            profiles (
              *
            )
          `)
          .eq('camp_id', campId);
        if (freshRoster) {
          setCampRoster(freshRoster);
        }
      }
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
                <span className="text-xl font-extrabold tracking-tight text-slate-900">Avodani</span>
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
                  <h4 className="font-extrabold text-white text-sm">Avodani Command</h4>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">NGO Suite</p>
                </div>
              </div>
            </div>

            <nav className="space-y-1">
              <button
                onClick={() => handleTabChange('overview')}
                className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === 'overview' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
              >
                <span>📊</span> <span>Admin Overview</span>
              </button>

              <button
                onClick={() => handleTabChange('verification')}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === 'verification' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
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
                className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === 'locations' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
              >
                <span>📍</span> <span>Manage Field Locations</span>
              </button>

              <button
                onClick={() => handleTabChange('schedules')}
                className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === 'schedules' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
              >
                <span>📅</span> <span>Volunteer Schedules</span>
              </button>

              <button
                onClick={() => handleTabChange('camp-creation')}
                className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === 'camp-creation' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
              >
                <span>➕</span> <span>Configure Camp</span>
              </button>

              <button
                onClick={() => handleTabChange('manage-doctors')}
                className={`w-full flex items-center justify-start text-left space-x-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === 'manage-doctors' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
              >
                <span>👤</span> <span>Assign & Manage Doctors</span>
              </button>



              <button
                onClick={() => handleTabChange('invitations-log')}
                className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === 'invitations-log' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
              >
                <span>📨</span> <span>Invitation Logs</span>
              </button>

              <button
                onClick={() => handleTabChange('check-in')}
                className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === 'check-in' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
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
                <div className="grid grid-cols-1 gap-4">
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
                      const todayStr = new Date().toLocaleDateString('en-CA');
                      const isPast = camp.date < todayStr;

                      return (
                        <div
                          key={camp.id}
                          className="p-5 bg-slate-50 hover:bg-slate-100/70 border border-slate-200 rounded-2xl transition-all space-y-3 flex flex-col justify-between"
                        >
                          <div className="space-y-2">
                            <div className="flex justify-between items-start">
                              <span className={`px-2 py-0.5 rounded font-bold text-[9px] uppercase border ${isPast ? 'bg-slate-100 text-slate-700 border-slate-300' :
                                camp.status === 'Scheduled' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                  'bg-amber-50 text-amber-700 border-amber-200'
                                }`}>
                                {isPast ? 'Completed' : camp.status}
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
                              <p className="text-[10px] text-slate-400 mt-1">
                                Required Doctors: <strong className="text-slate-700">{(Object.values(camp.needed_counts || {}) as any[]).reduce((a: any, b: any) => Number(a) + Number(b), 0)}</strong> | Assigned Doctors: <strong className="text-slate-750">{acceptedCount}</strong>
                              </p>
                            </div>
                          </div>

                          <div className="pt-3 border-t border-slate-200/60 flex justify-between items-center mt-2 gap-2 flex-wrap">
                            {camp.status === 'Drafting' ? (
                              <span className="text-[10px] text-amber-600 font-bold bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                Drafting - No Communication
                              </span>
                            ) : (
                              <div className="flex items-center space-x-2 text-[10px] font-semibold text-slate-600">
                                <span className="flex items-center space-x-1">
                                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                                  <span>{acceptedCount} {isPast ? 'Attended' : 'Attending'}</span>
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
                  className={`pb-3 px-4 font-bold border-b-2 transition-all flex items-center space-x-2 cursor-pointer ${subTab === 'pending'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                >
                  <span>⏳</span>
                  <span>Pending Verification</span>
                  <span className={`px-1.5 py-0.5 text-[10px] rounded-full ${subTab === 'pending' ? 'bg-indigo-100 text-indigo-800 font-bold' : 'bg-slate-100 text-slate-600'
                    }`}>
                    {pendingVols.length}
                  </span>
                </button>
                <button
                  onClick={() => setSubTab('approved')}
                  className={`pb-3 px-4 font-bold border-b-2 transition-all flex items-center space-x-2 cursor-pointer ${subTab === 'approved'
                    ? 'border-emerald-600 text-emerald-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                >
                  <span>✅</span>
                  <span>Onboarded / Approved</span>
                  <span className={`px-1.5 py-0.5 text-[10px] rounded-full ${subTab === 'approved' ? 'bg-emerald-100 text-emerald-800 font-bold' : 'bg-slate-100 text-slate-600'
                    }`}>
                    {approvedVols.length}
                  </span>
                </button>
                <button
                  onClick={() => setSubTab('rejected')}
                  className={`pb-3 px-4 font-bold border-b-2 transition-all flex items-center space-x-2 cursor-pointer ${subTab === 'rejected'
                    ? 'border-rose-600 text-rose-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                >
                  <span>❌</span>
                  <span>Rejected / Flagged</span>
                  <span className={`px-1.5 py-0.5 text-[10px] rounded-full ${subTab === 'rejected' ? 'bg-rose-100 text-rose-800 font-bold' : 'bg-slate-100 text-slate-600'
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
                  <span className={`font-bold text-[10px] px-2.5 py-1 rounded-full ${subTab === 'pending' ? 'bg-indigo-100 text-indigo-800' :
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
                              <span className={`px-2.5 py-0.5 rounded-full font-bold text-[9px] uppercase tracking-wide border ${vol.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
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
                        onBlur={(e) => handleGeocodeLocation(e.target.value)}
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
                          placeholder="Auto-filled from Name"
                          value={newLoc.latitude}
                          readOnly
                          className="w-full text-xs p-2 bg-slate-100 border border-slate-300 rounded focus:outline-none cursor-not-allowed"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-600 font-semibold mb-1">Longitude:</label>
                        <input
                          type="text"
                          placeholder="Auto-filled from Name"
                          value={newLoc.longitude}
                          readOnly
                          className="w-full text-xs p-2 bg-slate-100 border border-slate-300 rounded focus:outline-none cursor-not-allowed"
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
                            className={`p-3.5 cursor-pointer transition-all flex items-center justify-between hover:bg-slate-50 ${isSelected ? 'bg-indigo-50 border-r-4 border-indigo-600' : ''
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
                                className={`px-2.5 py-1 rounded-lg text-[9px] font-bold transition-all cursor-pointer flex-shrink-0 ${schedMonth === m
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
                                  className={`py-3.5 rounded-xl font-bold border transition-all flex flex-col justify-center items-center ${isSelected
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
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Camp Campaign Name{"\u00a0"}<span className="text-rose-500">*</span>
                      </label>
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
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Target Rural Field Deployment Node{"\u00a0"}<span className="text-rose-500">*</span>
                      </label>
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

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-600 mb-1">
                        Launch Date{"\u00a0"}<span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={newCamp.date}
                        onChange={(e) => {
                          const dateVal = e.target.value;
                          const parts = dateVal.split('-');
                          const dayVal = parts.length === 3 ? parseInt(parts[2]) : 15;
                          // Derive month automatically from Launch Date:
                          const dateObj = new Date(dateVal);
                          const monthVal = parts.length === 3 ? dateObj.toLocaleString('en-US', { month: 'short' }) : 'Jul';
                          setNewCamp({ ...newCamp, date: dateVal, day: dayVal, month: monthVal });
                        }}
                        className="w-full p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-600 mb-1">
                        Camp Duration (Days){"\u00a0"}<span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={newCamp.durationDays}
                        onChange={(e) => setNewCamp({ ...newCamp, durationDays: Number(e.target.value) })}
                        className="w-full p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none font-bold text-indigo-955"
                      >
                        <option value={1}>1 Day</option>
                        <option value={2}>2 Days</option>
                        <option value={3}>3 Days</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-600 mb-1">
                        Target Patients Projection{"\u00a0"}<span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={newCamp.expectedPatients}
                        onChange={(e) => setNewCamp({ ...newCamp, expectedPatients: Number(e.target.value) })}
                        className="w-full p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Specialty Patient Need Estimates */}
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/60 space-y-4">
                  <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                    Specialty Patient Need Estimates <span className="text-xs font-normal text-slate-400">(Patient Vol)</span>
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Specify estimated patient volumes for each specific medical branch to help volunteers understand the exact needs of the camp.</p>

                  <div className="grid grid-cols-2 md:grid-cols-7 gap-3 text-xs">
                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">Eye</label>
                      <input
                        type="number"
                        placeholder="0"
                        value={newCamp.estimateEye}
                        onChange={(e) => setNewCamp({ ...newCamp, estimateEye: Number(e.target.value) })}
                        className="w-full p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">Dental</label>
                      <input
                        type="number"
                        placeholder="0"
                        value={newCamp.estimateDental}
                        onChange={(e) => setNewCamp({ ...newCamp, estimateDental: Number(e.target.value) })}
                        className="w-full p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">Gynecology</label>
                      <input
                        type="number"
                        placeholder="0"
                        value={newCamp.estimateGynec}
                        onChange={(e) => setNewCamp({ ...newCamp, estimateGynec: Number(e.target.value) })}
                        className="w-full p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">Diabetic</label>
                      <input
                        type="number"
                        placeholder="0"
                        value={newCamp.estimateDiabetic}
                        onChange={(e) => setNewCamp({ ...newCamp, estimateDiabetic: Number(e.target.value) })}
                        className="w-full p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">Cardiology</label>
                      <input
                        type="number"
                        placeholder="0"
                        value={newCamp.estimateCardio}
                        onChange={(e) => setNewCamp({ ...newCamp, estimateCardio: Number(e.target.value) })}
                        className="w-full p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">Therapy</label>
                      <input
                        type="number"
                        placeholder="0"
                        value={newCamp.estimateTherapy}
                        onChange={(e) => setNewCamp({ ...newCamp, estimateTherapy: Number(e.target.value) })}
                        className="w-full p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">Psychology</label>
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
                            className={`px-3 py-1.5 rounded-lg font-bold border transition-all cursor-pointer ${checked
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
                    Launch Campaign 🚀
                  </button>
                </div>

              </form>
            </div>
          )}

          {/* TAB: MANAGE DOCTORS */}
          {activeTab === 'manage-doctors' && (
            <div className="space-y-6 animate-fade-in text-xs">
              {selectedCampForAssignment === null ? (
                // VIEW 1: CAMP SELECTION
                <div className="space-y-6">
                  <div className="border-b border-slate-100 pb-4">
                    <h2 className="text-2xl font-extrabold text-slate-900 font-sans">Campaign Doctor Assignment</h2>
                    <p className="text-xs text-slate-500 mt-1">Select a campaign below to manually assign and invite medical specialists.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {camps.length === 0 ? (
                      <div className="md:col-span-2 p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-slate-400">
                        No campaigns configured. Go to "Configure Camp" to create one.
                      </div>
                    ) : (
                      camps.map((camp: any) => {
                        const acceptedCount = invitations.filter((i: any) => i.camp_id === camp.id && i.status === 'Accepted').length;
                        const pendingCount = invitations.filter((i: any) => i.camp_id === camp.id && i.status === 'Pending').length;
                        const reqDoctors = (Object.values(camp.needed_counts || {}) as any[]).reduce((a: any, b: any) => Number(a) + Number(b), 0);
                        const todayStr = new Date().toLocaleDateString('en-CA');
                        const isPast = camp.date < todayStr;

                        return (
                          <div
                            key={camp.id}
                            className="p-5 bg-slate-50 hover:bg-slate-100/70 border border-slate-200 rounded-2xl transition-all space-y-3 flex flex-col justify-between"
                          >
                            <div className="space-y-2">
                              <div className="flex justify-between items-start">
                                <span className={`px-2 py-0.5 rounded font-bold text-[9px] uppercase border ${isPast ? 'bg-slate-100 text-slate-700 border-slate-300' :
                                  camp.status === 'Scheduled' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                    'bg-amber-50 text-amber-700 border-amber-200'
                                  }`}>
                                  {isPast ? 'Completed' : camp.status}
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
                                <p className="text-[10px] text-slate-400 mt-1">
                                  Required Doctors: <strong className="text-slate-700">{reqDoctors}</strong> | Assigned Doctors: <strong className="text-slate-750">{acceptedCount}</strong>
                                </p>
                              </div>
                            </div>

                            <div className="pt-3 border-t border-slate-200/60 flex justify-between items-center mt-2 gap-2 flex-wrap">
                              <div className="flex items-center space-x-2 text-[10px] font-semibold text-slate-600">
                                <span className="flex items-center space-x-1">
                                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                                  <span>{acceptedCount} {isPast ? 'Attended' : 'Attending'}</span>
                                </span>
                                {pendingCount > 0 && (
                                  <span className="flex items-center space-x-1">
                                    <span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span>
                                    <span>{pendingCount} Pending</span>
                                  </span>
                                )}
                              </div>

                              {(() => {
                                const todayStr = new Date().toLocaleDateString('en-CA');
                                const isPast = camp.date < todayStr;
                                if (isPast) {
                                  return (
                                    <button
                                      type="button"
                                      disabled
                                      className="px-3 py-1.5 bg-slate-100 text-slate-400 font-bold rounded-lg text-[10px] cursor-not-allowed border border-slate-200"
                                    >
                                      Completed - Closed 🔒
                                    </button>
                                  );
                                }
                                return (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedCampForAssignment(camp);
                                      // Pre-fill default specialty filter to match camp specialties
                                      if (camp.needed_specialties && Array.isArray(camp.needed_specialties)) {
                                        setFilterSpecialties(camp.needed_specialties);
                                      } else {
                                        setFilterSpecialties([]);
                                      }
                                      setSelectedDoctorIds([]);
                                    }}
                                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors cursor-pointer text-[10px]"
                                  >
                                    Assign & Manage Doctors 👤
                                  </button>
                                );
                              })()}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              ) : (
                // VIEW 2: MANUAL ASSIGNMENT & FILTERS
                <div className="space-y-6">
                  <div className="text-left">
                    <button
                      onClick={() => setSelectedCampForAssignment(null)}
                      className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 hover:text-slate-900 rounded-lg transition-all text-[11px] font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      ← Back to Camp List
                    </button>
                  </div>
                  {/* Camp Header Details */}
                  <div className="border-b border-slate-200 pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 text-white p-5 rounded-2xl shadow-md">
                    <div className="space-y-1 text-left">
                      <h2 className="text-xl font-black text-white">{selectedCampForAssignment.name}</h2>
                      <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                        📍 Location: {selectedCampForAssignment.location} • 📅 Date: {selectedCampForAssignment.date} ({selectedCampForAssignment.month})
                      </p>
                    </div>

                    <div className="flex gap-4">
                      <div className="bg-slate-800 border border-slate-700 rounded-xl p-3 text-center min-w-[120px]">
                        <span className="text-[9px] font-bold text-slate-400 uppercase block">Required Specialties</span>
                        <span className="text-xs font-extrabold text-white block mt-0.5">
                          {selectedCampForAssignment.needed_specialties?.join(', ') || 'General Medicine'}
                        </span>
                      </div>
                      <div className="bg-slate-800 border border-slate-700 rounded-xl p-3 text-center min-w-[120px]">
                        <span className="text-[9px] font-bold text-slate-400 uppercase block">Assigned Doctors</span>
                        <span className="text-xs font-black text-indigo-400 block mt-0.5">
                          {(() => {
                            const isPast = selectedCampForAssignment.date < new Date().toLocaleDateString('en-CA');
                            return (
                              <>
                                {invitations.filter((i: any) => i.camp_id === selectedCampForAssignment.id && i.status === 'Accepted').length} {isPast ? 'Attended' : 'Attending'}
                              </>
                            );
                          })()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Manual Assignment Filters Panel */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4 text-left">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                      <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">Manual Assignment Filters</h3>
                      <button
                        onClick={() => {
                          setFilterAvailability(true);
                          setFilterSpecialties(selectedCampForAssignment.needed_specialties || []);
                          setFilterStatus('All');
                          setFilterLocationPriority('All');
                          setDoctorSearchQuery('');
                        }}
                        className="text-[10px] text-indigo-600 hover:text-indigo-850 font-bold transition-all cursor-pointer"
                      >
                        Reset Filters 🔄
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      {/* Availability Filter */}
                      <div className="flex flex-col justify-center">
                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Availability Filter</label>
                        <label className="flex items-center space-x-2 p-2 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100/70 transition-all">
                          <input
                            type="checkbox"
                            checked={filterAvailability}
                            onChange={(e) => setFilterAvailability(e.target.checked)}
                            className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          />
                          <span className="font-semibold text-slate-700 text-[11px]">Available on Camp Date ({selectedCampForAssignment.date})</span>
                        </label>
                      </div>

                      {/* Specialty Multi-select dropdown */}
                      <div className="space-y-1.5 relative">
                        <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Specialty Filter</label>
                        <button
                          type="button"
                          onClick={() => setSpecialtyDropdownOpen(!specialtyDropdownOpen)}
                          className="w-full p-2 border border-slate-300 bg-white rounded-lg focus:ring-1 focus:ring-indigo-500 text-left text-slate-700 font-semibold flex justify-between items-center text-xs"
                        >
                          <span className="truncate">{filterSpecialties.length === 0 ? "All Specialties" : `${filterSpecialties.length} Selected`}</span>
                          <span className="text-[10px] text-slate-400">{specialtyDropdownOpen ? '▲' : '▼'}</span>
                        </button>
                        {specialtyDropdownOpen && (
                          <div className="absolute z-50 mt-1 w-full bg-white border border-slate-300 rounded-xl shadow-lg p-2.5 max-h-48 overflow-y-auto space-y-1">
                            {(() => {
                              const specs = Array.from(new Set(volunteers.map(v => v.specialty).filter(Boolean))) as string[];
                              if (specs.length === 0) return <span className="text-slate-400 italic">No specialties found</span>;
                              return specs.map(spec => {
                                const checked = filterSpecialties.includes(spec);
                                return (
                                  <label key={spec} className="flex items-center space-x-2 cursor-pointer text-[10px] font-medium text-slate-700 hover:bg-slate-50 p-0.5 rounded">
                                    <input
                                      type="checkbox"
                                      checked={checked}
                                      onChange={() => {
                                        setFilterSpecialties(prev =>
                                          checked ? prev.filter(s => s !== spec) : [...prev, spec]
                                        );
                                      }}
                                      className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                    />
                                    <span>{spec}</span>
                                  </label>
                                );
                              });
                            })()}
                          </div>
                        )}
                      </div>

                      {/* Status Filter */}
                      <div className="space-y-1.5">
                        <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Status Filter</label>
                        <select
                          value={filterStatus}
                          onChange={(e) => setFilterStatus(e.target.value)}
                          className="w-full p-2 border border-slate-300 bg-white rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none text-slate-700 font-semibold"
                        >
                          <option value="All">All Statuses</option>
                          <option value="empty">No Invite</option>
                          <option value="pending">Pending</option>
                          <option value="accepted">Accepted</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </div>

                      {/* Location Priority Filter */}
                      <div className="space-y-1.5">
                        <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Location Priority Filter</label>
                        <select
                          value={filterLocationPriority}
                          onChange={(e) => setFilterLocationPriority(e.target.value)}
                          className="w-full p-2 border border-slate-300 bg-white rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none text-slate-700 font-semibold"
                        >
                          <option value="All">All Locations</option>
                          <option value="Priority 1">Priority 1 (Primary Location)</option>
                          <option value="Priority 2">Priority 2 (Secondary Location)</option>
                          <option value="Priority 3">Priority 3 (Tertiary Location)</option>
                        </select>
                      </div>
                    </div>

                    {/* Search Input */}
                    <div className="pt-2">
                      <input
                        type="text"
                        placeholder="Search doctor by Name, Email or Phone Number..."
                        value={doctorSearchQuery}
                        onChange={(e) => setDoctorSearchQuery(e.target.value)}
                        className="w-full p-2 border border-slate-300 bg-white rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 placeholder-slate-400"
                      />
                    </div>
                  </div>

                  {/* Doctors Checklist Table */}
                  <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs text-left">
                    <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div>
                        <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">Candidate Doctor Roster</h4>
                        <p className="text-[10px] text-slate-400 mt-0.5">Click column headers to sort candidate volunteers.</p>
                      </div>

                      <div className="flex flex-col sm:flex-row items-slate-stretch sm:items-center gap-2.5 w-full sm:w-auto">
                        <div className="flex items-center space-x-2 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-lg">
                          <span className="font-bold text-indigo-800 text-xs">Selected Doctors: {selectedDoctorIds.length}</span>
                        </div>

                        <select
                          value={deliveryChannel}
                          onChange={(e) => setDeliveryChannel(e.target.value)}
                          className="p-1 border border-slate-300 bg-white rounded text-slate-700 text-xs focus:ring-1 focus:ring-indigo-500"
                        >
                          <option value="Web App Notification">Web App Notification</option>
                          <option value="Email Notification">Email Notification</option>
                          <option value="Web App & Email">Web App & Email</option>
                        </select>

                        <button
                          onClick={async () => {
                            if (selectedDoctorIds.length === 0) return;
                            try {
                              const newInvites = selectedDoctorIds.map(dId => ({
                                id: `inv-${Date.now()}-${dId}`,
                                camp_id: selectedCampForAssignment.id,
                                doctor_id: dId,
                                status: 'Pending',
                                sent_via: deliveryChannel,
                                timestamp: new Date().toISOString().split('T')[0]
                              }));

                              const { error } = await supabase
                                .from('invitations')
                                .insert(newInvites);

                              if (error) throw error;

                              // Optional real email send
                              if (deliveryChannel.includes('Email')) {
                                selectedDoctorIds.forEach(async (dId) => {
                                  const doc = volunteers.find(v => v.id === dId);
                                  if (doc?.email) {
                                    try {
                                      await fetch('/api/send-email', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({
                                          to: doc.email,
                                          subject: `Invitation: Healthcare Deployment Campaign - ${selectedCampForAssignment.name}`,
                                          html: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                                            <h2>Avodani Medical Mission Invitation</h2>
                                            <p>Dear <strong>${doc.name}</strong>,</p>
                                            <p>You have been matched by manual coordination for an upcoming healthcare deployment campaign at <strong>${selectedCampForAssignment.location}</strong> on <strong>${selectedCampForAssignment.date}</strong>.</p>
                                          </div>`
                                        })
                                      });
                                    } catch (err) {
                                      console.error("Email send failed", err);
                                    }
                                  }
                                });
                              }

                              triggerToast(`Sent invitations to ${selectedDoctorIds.length} doctors successfully!`);
                              await fetchInvitations();
                              setSelectedDoctorIds([]);
                            } catch (err: any) {
                              triggerToast(`Failed to send invitations: ${err.message}`);
                            }
                          }}
                          disabled={selectedDoctorIds.length === 0}
                          className="px-3.5 py-1.5 bg-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs uppercase tracking-wider rounded-lg hover:bg-indigo-700 transition-colors shadow-md cursor-pointer"
                        >
                          Send Invitations ✉️
                        </button>
                      </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs min-w-3xl">
                        <thead>
                          <tr className="bg-slate-50/30 border-b border-slate-200 text-slate-500 uppercase text-[9px] tracking-wider font-semibold">
                            <th className="p-4 w-12 text-center">
                              <input
                                type="checkbox"
                                checked={(() => {
                                  const list = volunteers.filter(doc => {
                                    if (doc.status !== 'Approved') return false;
                                    if (filterAvailability) {
                                      if (!selectedCampForAssignment || !doc.available_months) return false;
                                      const availableDays = doc.available_months[selectedCampForAssignment.month];
                                      const isAvail = Array.isArray(availableDays) && availableDays.map(Number).includes(Number(selectedCampForAssignment.day));
                                      if (!isAvail) return false;
                                    }
                                    if (filterSpecialties.length > 0 && (!doc.specialty || !filterSpecialties.includes(doc.specialty))) return false;
                                    const existingInvite = invitations.find((i: any) => i.camp_id === selectedCampForAssignment.id && i.doctor_id === doc.id);
                                    const inviteStatus = existingInvite ? (existingInvite.status === 'Accepted' ? 'accepted' : existingInvite.status === 'Declined' ? 'rejected' : 'pending') : 'empty';
                                    if (filterStatus !== 'All') {
                                      if (filterStatus === 'empty' && inviteStatus !== 'empty') return false;
                                      if (filterStatus !== 'empty' && inviteStatus !== filterStatus) return false;
                                    }
                                    if (filterLocationPriority !== 'All') {
                                      if (!doc.location_priorities || !Array.isArray(doc.location_priorities)) return false;
                                      const campLocLower = selectedCampForAssignment.location.toLowerCase();
                                      const idx = doc.location_priorities.findIndex((loc: string) => loc.toLowerCase() === campLocLower);
                                      const label = idx === 0 ? 'Priority 1' : idx === 1 ? 'Priority 2' : idx === 2 ? 'Priority 3' : 'None';
                                      if (label !== filterLocationPriority) return false;
                                    }
                                    if (doctorSearchQuery.trim()) {
                                      const q = doctorSearchQuery.toLowerCase();
                                      if (!(doc.name || '').toLowerCase().includes(q) && !(doc.email || '').toLowerCase().includes(q) && !(doc.mobile || '').toLowerCase().includes(q)) return false;
                                    }
                                    return true;
                                  });
                                  const uninvitedList = list.filter(doc => !invitations.some((i: any) => i.camp_id === selectedCampForAssignment.id && i.doctor_id === doc.id));
                                  return uninvitedList.length > 0 && selectedDoctorIds.length === uninvitedList.length;
                                })()}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    const list = volunteers.filter(doc => {
                                      if (doc.status !== 'Approved') return false;
                                      if (filterAvailability) {
                                        if (!selectedCampForAssignment || !doc.available_months) return false;
                                        const availableDays = doc.available_months[selectedCampForAssignment.month];
                                        const isAvail = Array.isArray(availableDays) && availableDays.map(Number).includes(Number(selectedCampForAssignment.day));
                                        if (!isAvail) return false;
                                      }
                                      if (filterSpecialties.length > 0 && (!doc.specialty || !filterSpecialties.includes(doc.specialty))) return false;
                                      const existingInvite = invitations.find((i: any) => i.camp_id === selectedCampForAssignment.id && i.doctor_id === doc.id);
                                      const inviteStatus = existingInvite ? (existingInvite.status === 'Accepted' ? 'accepted' : existingInvite.status === 'Declined' ? 'rejected' : 'pending') : 'empty';
                                      if (filterStatus !== 'All') {
                                        if (filterStatus === 'empty' && inviteStatus !== 'empty') return false;
                                        if (filterStatus !== 'empty' && inviteStatus !== filterStatus) return false;
                                      }
                                      if (filterLocationPriority !== 'All') {
                                        if (!doc.location_priorities || !Array.isArray(doc.location_priorities)) return false;
                                        const campLocLower = selectedCampForAssignment.location.toLowerCase();
                                        const idx = doc.location_priorities.findIndex((loc: string) => loc.toLowerCase() === campLocLower);
                                        const label = idx === 0 ? 'Priority 1' : idx === 1 ? 'Priority 2' : idx === 2 ? 'Priority 3' : 'None';
                                        if (label !== filterLocationPriority) return false;
                                      }
                                      if (doctorSearchQuery.trim()) {
                                        const q = doctorSearchQuery.toLowerCase();
                                        if (!(doc.name || '').toLowerCase().includes(q) && !(doc.email || '').toLowerCase().includes(q) && !(doc.mobile || '').toLowerCase().includes(q)) return false;
                                      }
                                      return true;
                                    });
                                    const uninvitedList = list.filter(doc => !invitations.some((i: any) => i.camp_id === selectedCampForAssignment.id && i.doctor_id === doc.id));
                                    setSelectedDoctorIds(uninvitedList.map(d => d.id));
                                  } else {
                                    setSelectedDoctorIds([]);
                                  }
                                }}
                                className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                              />
                            </th>
                            <th className="p-4 cursor-pointer hover:bg-slate-100" onClick={() => { if (sortField === 'name') { setSortAsc(!sortAsc); } else { setSortField('name'); setSortAsc(true); } }}>
                              Doctor Name {sortField === 'name' ? (sortAsc ? '▲' : '▼') : ''}
                            </th>
                            <th className="p-4 cursor-pointer hover:bg-slate-100" onClick={() => { if (sortField === 'specialty') { setSortAsc(!sortAsc); } else { setSortField('specialty'); setSortAsc(true); } }}>
                              Specialty {sortField === 'specialty' ? (sortAsc ? '▲' : '▼') : ''}
                            </th>
                            <th className="p-4">Role</th>
                            <th className="p-4">Available on Camp Date</th>
                            <th className="p-4 cursor-pointer hover:bg-slate-100" onClick={() => { if (sortField === 'location_priority') { setSortAsc(!sortAsc); } else { setSortField('location_priority'); setSortAsc(true); } }}>
                              Location Priority {sortField === 'location_priority' ? (sortAsc ? '▲' : '▼') : ''}
                            </th>
                            <th className="p-4 cursor-pointer hover:bg-slate-100" onClick={() => { if (sortField === 'completed_days') { setSortAsc(!sortAsc); } else { setSortField('completed_days'); setSortAsc(true); } }}>
                              Completed Days {sortField === 'completed_days' ? (sortAsc ? '▲' : '▼') : ''}
                            </th>
                            <th className="p-4">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-150">
                          {(() => {
                            // Apply filters
                            let list = volunteers.filter(doc => {
                              if (doc.status !== 'Approved') return false;
                              if (filterAvailability) {
                                if (!selectedCampForAssignment || !doc.available_months) return false;
                                const availableDays = doc.available_months[selectedCampForAssignment.month];
                                const isAvail = Array.isArray(availableDays) && availableDays.map(Number).includes(Number(selectedCampForAssignment.day));
                                if (!isAvail) return false;
                              }
                              if (filterSpecialties.length > 0 && (!doc.specialty || !filterSpecialties.includes(doc.specialty))) return false;
                              const existingInvite = invitations.find((i: any) => i.camp_id === selectedCampForAssignment.id && i.doctor_id === doc.id);
                              const inviteStatus = existingInvite ? (existingInvite.status === 'Accepted' ? 'accepted' : existingInvite.status === 'Declined' ? 'rejected' : 'pending') : 'empty';
                              if (filterStatus !== 'All') {
                                if (filterStatus === 'empty' && inviteStatus !== 'empty') return false;
                                if (filterStatus !== 'empty' && inviteStatus !== filterStatus) return false;
                              }
                              if (filterLocationPriority !== 'All') {
                                if (!doc.location_priorities || !Array.isArray(doc.location_priorities)) return false;
                                const campLocLower = selectedCampForAssignment.location.toLowerCase();
                                const idx = doc.location_priorities.findIndex((loc: string) => loc.toLowerCase() === campLocLower);
                                const label = idx === 0 ? 'Priority 1' : idx === 1 ? 'Priority 2' : idx === 2 ? 'Priority 3' : 'None';
                                if (label !== filterLocationPriority) return false;
                              }
                              if (doctorSearchQuery.trim()) {
                                const q = doctorSearchQuery.toLowerCase();
                                if (!(doc.name || '').toLowerCase().includes(q) && !(doc.email || '').toLowerCase().includes(q) && !(doc.mobile || '').toLowerCase().includes(q)) return false;
                              }
                              return true;
                            });

                            // Apply sorting
                            list.sort((a, b) => {
                              let cmp = 0;
                              if (sortField === 'name') {
                                cmp = (a.name || '').localeCompare(b.name || '');
                              } else if (sortField === 'specialty') {
                                cmp = (a.specialty || '').localeCompare(b.specialty || '');
                              } else if (sortField === 'completed_days') {
                                cmp = (Number(a.completed_days) || 0) - (Number(b.completed_days) || 0);
                              } else if (sortField === 'location_priority') {
                                const getW = (doc: any) => {
                                  if (!doc.location_priorities || !selectedCampForAssignment) return 4;
                                  const campLocLower = selectedCampForAssignment.location.toLowerCase();
                                  const idx = doc.location_priorities.findIndex((l: string) => l.toLowerCase() === campLocLower);
                                  return idx === 0 ? 1 : idx === 1 ? 2 : idx === 2 ? 3 : 4;
                                };
                                cmp = getW(a) - getW(b);
                              }
                              return sortAsc ? cmp : -cmp;
                            });

                            if (list.length === 0) {
                              return (
                                <tr>
                                  <td colSpan={8} className="p-8 text-center text-slate-400">
                                    No doctors match the current filter criteria.
                                  </td>
                                </tr>
                              );
                            }

                            return list.map(doc => {
                              const isChecked = selectedDoctorIds.includes(doc.id);
                              const existingInvite = invitations.find((i: any) => i.camp_id === selectedCampForAssignment.id && i.doctor_id === doc.id);
                              // availability
                              const availableDays = doc.available_months?.[selectedCampForAssignment.month];
                              const isDocAvailable = Array.isArray(availableDays) && availableDays.map(Number).includes(Number(selectedCampForAssignment.day));
                              // priority
                              const priorityIdx = doc.location_priorities ? doc.location_priorities.findIndex((l: string) => l.toLowerCase() === selectedCampForAssignment.location.toLowerCase()) : -1;
                              const priorityLabel = priorityIdx === 0 ? 'Priority 1' : priorityIdx === 1 ? 'Priority 2' : priorityIdx === 2 ? 'Priority 3' : 'None';

                              return (
                                <tr key={doc.id} className={`hover:bg-slate-50/50 transition-colors ${isChecked ? 'bg-indigo-50/20' : ''}`}>
                                  <td className="p-4 text-center">
                                    <input
                                      type="checkbox"
                                      checked={isChecked || !!existingInvite}
                                      disabled={!!existingInvite}
                                      onChange={() => {
                                        if (existingInvite) return;
                                        setSelectedDoctorIds(prev =>
                                          prev.includes(doc.id) ? prev.filter(id => id !== doc.id) : [...prev, doc.id]
                                        );
                                      }}
                                      className={`rounded text-indigo-600 focus:ring-indigo-500 ${existingInvite ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                                    />
                                  </td>
                                  <td className="p-4">
                                    <div className="flex items-center space-x-2.5">
                                      <span className="text-xl">{doc.avatar || '👨‍⚕️'}</span>
                                      <div>
                                        <p className="font-bold text-slate-900">{doc.name}</p>
                                        <p className="text-[10px] text-slate-400">{doc.email} • {doc.mobile}</p>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="p-4 font-medium text-slate-700">{doc.specialty || 'General Medicine'}</td>
                                  <td className="p-4 text-slate-500">{doc.role || 'Doctor'}</td>
                                  <td className="p-4">
                                    <span className={`inline-flex items-center gap-1 whitespace-nowrap px-2 py-0.5 rounded-full font-bold text-[9px] uppercase border ${isDocAvailable
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                      : 'bg-rose-50 text-rose-700 border-rose-200'
                                      }`}>
                                      {isDocAvailable ? 'Available ✓' : 'Unavailable ✗'}
                                    </span>
                                  </td>
                                  <td className="p-4">
                                    <span className={`inline-flex items-center gap-1 whitespace-nowrap px-2 py-0.5 rounded font-semibold ${priorityLabel === 'Priority 1' ? 'bg-indigo-100 text-indigo-800' :
                                      priorityLabel === 'Priority 2' ? 'bg-slate-100 text-slate-700' :
                                        priorityLabel === 'Priority 3' ? 'bg-slate-100 text-slate-500' :
                                          'text-slate-400'
                                      }`}>
                                      {priorityLabel}
                                    </span>
                                  </td>
                                  <td className="p-4 font-mono font-bold text-slate-700">{doc.completed_days || 0} Days</td>
                                  <td className="p-4">
                                    {existingInvite ? (
                                      <div className="flex items-center gap-2">
                                        <span className={`inline-flex items-center gap-1 whitespace-nowrap px-2.5 py-0.5 rounded-full font-bold text-[9px] uppercase tracking-wide border ${existingInvite.status === 'Accepted' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                            existingInvite.status === 'Pending' ? 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse' :
                                              'bg-rose-50 text-rose-700 border-rose-200'
                                          }`}>
                                          {existingInvite.status === 'Accepted' ? 'Attending ✓' : existingInvite.status === 'Declined' ? 'Declined ✗' : 'Pending ⏳'}
                                        </span>
                                        {existingInvite.status === 'Pending' && (
                                          <button
                                            onClick={() => handleResendInvitation(existingInvite)}
                                            className="inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-700 font-bold rounded transition-colors cursor-pointer"
                                            title="Resend Invitation"
                                          >
                                            Resend 🔁
                                          </button>
                                        )}
                                      </div>
                                    ) : null}
                                  </td>
                                </tr>
                              );
                            });
                          })()}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
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
                          className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 ${isFiltered
                            ? 'bg-indigo-50/50 border-indigo-400 ring-2 ring-indigo-600/15 shadow-sm'
                            : 'bg-slate-50 hover:bg-slate-100 border-slate-200 hover:border-slate-300'
                            }`}
                        >
                          <div className="space-y-1">
                            <div className="flex justify-between items-start">
                              {(() => {
                                const todayStr = new Date().toLocaleDateString('en-CA');
                                const isPast = camp.date < todayStr;
                                const statusText = isPast ? 'Completed' : camp.status;
                                return (
                                  <span className={`px-2 py-0.5 rounded font-bold text-[8px] uppercase tracking-wide border ${statusText === 'Completed' ? 'bg-slate-100 text-slate-700 border-slate-300' :
                                    statusText === 'Scheduled' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                      'bg-amber-50 text-amber-700 border-amber-200'
                                    }`}>
                                    {statusText}
                                  </span>
                                );
                              })()}
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
              {(() => {
                const campFilteredInvitations = invitations.filter((inv: any) => {
                  if (invFilterCampId && inv.camp_id !== invFilterCampId) {
                    return false;
                  }
                  return true;
                });

                return (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Dispatched</span>
                        <span className="text-2xl font-black text-slate-900 mt-0.5 block">{campFilteredInvitations.length}</span>
                      </div>
                      <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 text-center text-emerald-800">
                        <span className="block text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Attending / Accepted</span>
                        <span className="text-2xl font-black text-slate-950 mt-0.5 block">
                          {campFilteredInvitations.filter((i: any) => i.status === 'Accepted').length}
                        </span>
                      </div>
                      <div className="bg-rose-50 p-4 rounded-xl border border-rose-100 text-center text-rose-800">
                        <span className="block text-[10px] font-bold text-rose-600 uppercase tracking-wider">Declined (Unable to Attend)</span>
                        <span className="text-2xl font-black text-slate-950 mt-0.5 block">
                          {campFilteredInvitations.filter((i: any) => i.status === 'Declined').length}
                        </span>
                      </div>
                      <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 text-center text-amber-800">
                        <span className="block text-[10px] font-bold text-amber-600 uppercase tracking-wider">Pending Response</span>
                        <span className="text-2xl font-black text-slate-950 mt-0.5 block">
                          {campFilteredInvitations.filter((i: any) => i.status === 'Pending').length}
                        </span>
                      </div>
                    </div>

                    {/* Filters Bar */}
                    <div className="flex flex-col sm:flex-row gap-3 justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <div className="flex flex-wrap gap-1">
                        {(['All', 'Pending', 'Accepted', 'Declined'] as const).map((status) => {
                          const count = status === 'All' ? campFilteredInvitations.length : campFilteredInvitations.filter((i: any) => i.status === status).length;
                          const isActive = invFilterStatus === status;
                          return (
                            <button
                              key={status}
                              onClick={() => setInvFilterStatus(status)}
                              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer ${isActive
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
                  </>
                );
              })()}

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
                                {(() => {
                                  const isPast = camp.date ? new Date(camp.date) < new Date(new Date().setHours(0,0,0,0)) : false;
                                  return (
                                    <span className={`inline-flex items-center gap-1 whitespace-nowrap px-2.5 py-0.5 rounded-full font-bold text-[9px] uppercase tracking-wide border ${inv.status === 'Accepted' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                      inv.status === 'Pending' ? 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse' :
                                        'bg-rose-50 text-rose-700 border-rose-200'
                                      }`}>
                                      {inv.status === 'Accepted' ? (isPast ? 'Attended ✓' : 'Attending ✓') : inv.status === 'Declined' ? 'Declined ✗' : 'Pending ⏳'}
                                    </span>
                                  );
                                })()}
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
                                          className={`px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-all cursor-pointer ${!attendance ? 'bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-50' :
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
                        className="w-full p-2 bg-slate-50 border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500 focus:outline-none text-indigo-950 font-bold"
                      >
                        {getNext12Months().map((m) => (
                          <option key={`${m.label}-${m.year}`} value={m.label}>
                            {MONTH_NAMES[m.label] || m.label} {m.year}
                          </option>
                        ))}
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
                            className={`px-2 py-1 rounded border text-[10px] font-bold transition-all cursor-pointer ${checked
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
                        {(() => {
                          const todayStr = new Date().toLocaleDateString('en-CA');
                          const isPast = selectedCampDetails.date < todayStr;
                          const statusText = isPast ? 'Completed' : selectedCampDetails.status;
                          return (
                            <span className={`px-2 py-0.5 border rounded-full font-bold text-[9px] uppercase tracking-wide ${statusText === 'Completed' ? 'bg-slate-100 text-slate-700 border-slate-300' :
                              statusText === 'Scheduled' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                'bg-amber-50 text-amber-700 border-amber-200'
                              }`}>
                              {statusText || 'Active'}
                            </span>
                          );
                        })()}
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
                                  {item.status === 'Accepted' && item.feedback && (
                                    <div className="mt-1.5 p-2 bg-emerald-50 border border-emerald-150 rounded-lg text-[9px] max-w-sm">
                                      <p className="font-bold text-emerald-950 uppercase text-[8px] tracking-wider">Post-Camp Feedback:</p>
                                      <div className="flex space-x-3 mt-0.5 text-slate-700 font-semibold">
                                        <span>Rating: <strong className="text-amber-500 font-extrabold">{"★".repeat(item.feedback.rating)}{"☆".repeat(5 - item.feedback.rating)}</strong></span>
                                        <span>Patients Served: <strong className="text-indigo-950">{item.feedback.patientsServed}</strong></span>
                                      </div>
                                      {item.feedback.comments && (
                                        <p className="text-slate-600 mt-0.5 italic">"{item.feedback.comments}"</p>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <span className={`inline-flex items-center gap-1 whitespace-nowrap px-2 py-0.5 rounded font-bold text-[9px] uppercase border ${item.status === 'Accepted' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
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
                  {(() => {
                    const todayStr = new Date().toLocaleDateString('en-CA');
                    const isPast = selectedCampDetails.date < todayStr;
                    if (isPast) {
                      return (
                        <button
                          type="button"
                          disabled
                          className="px-3 py-1.5 bg-slate-100 text-slate-400 font-bold rounded-lg text-xs cursor-not-allowed border border-slate-200"
                        >
                          Completed - Closed 🔒
                        </button>
                      );
                    }
                    return (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCampForAssignment(selectedCampDetails);
                          if (selectedCampDetails.needed_specialties && Array.isArray(selectedCampDetails.needed_specialties)) {
                            setFilterSpecialties(selectedCampDetails.needed_specialties);
                          } else {
                            setFilterSpecialties([]);
                          }
                          setSelectedDoctorIds([]);
                          setActiveTab('manage-doctors');
                          setSelectedCampDetails(null);
                        }}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg cursor-pointer transition-colors"
                      >
                        Assign & Manage Doctors 👤
                      </button>
                    );
                  })()}
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
        <p>© 2026 Avodani. Administrative Control Center.</p>
      </footer>
    </div>
  );
}
