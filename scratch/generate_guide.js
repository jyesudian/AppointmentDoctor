const fs = require('fs');
const path = require('path');

function getBase64Image(filePath) {
  try {
    const fileData = fs.readFileSync(filePath);
    return `data:image/png;base64,${fileData.toString('base64')}`;
  } catch (err) {
    console.error(`Error reading image ${filePath}:`, err.message);
    return '';
  }
}

function run() {
  const screenshotsDir = path.join(__dirname, 'screenshots');
  const outputFile = path.join(__dirname, '..', 'avodani_user_guide.html');

  console.log('Encoding screenshots to Base64...');
  const images = {
    landing: getBase64Image(path.join(screenshotsDir, 'landing_page.png')),
    adminLogin: getBase64Image(path.join(screenshotsDir, 'admin_login_page.png')),
    adminOverview: getBase64Image(path.join(screenshotsDir, 'admin_overview.png')),
    adminVerification: getBase64Image(path.join(screenshotsDir, 'admin_verification.png')),
    adminLocations: getBase64Image(path.join(screenshotsDir, 'admin_locations.png')),
    adminSchedules: getBase64Image(path.join(screenshotsDir, 'admin_schedules.png')),
    adminConfigureCamp: getBase64Image(path.join(screenshotsDir, 'admin_configure_camp.png')),
    adminMatching: getBase64Image(path.join(screenshotsDir, 'admin_matching.png')),
    adminInvitationLogs: getBase64Image(path.join(screenshotsDir, 'admin_invitation_logs.png')),
    adminCheckinManager: getBase64Image(path.join(screenshotsDir, 'admin_checkin_manager.png')),
    volunteerLogin: getBase64Image(path.join(screenshotsDir, 'volunteer_login_page.png')),
    volunteerOverview: getBase64Image(path.join(screenshotsDir, 'volunteer_overview.png')),
    volunteerAvailability: getBase64Image(path.join(screenshotsDir, 'volunteer_availability.png')),
    volunteerPreferredFields: getBase64Image(path.join(screenshotsDir, 'volunteer_preferred_fields.png')),
    volunteerCampDetails: getBase64Image(path.join(screenshotsDir, 'volunteer_camp_details.png'))
  };

  console.log('Generating HTML content...');

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Avodani User Guide - Volunteer Medical Mission Portal</title>
  <!-- Google Fonts: Inter & Outfit -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Outfit:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  <!-- Tailwind CSS via CDN -->
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          fontFamily: {
            sans: ['Inter', 'sans-serif'],
            display: ['Outfit', 'sans-serif'],
          }
        }
      }
    }
  </script>
  <style>
    /* Styling for smooth display and PDF printing compatibility */
    @media print {
      .no-print {
        display: none !important;
      }
      .print-break {
        page-break-before: always;
      }
      body {
        background-color: white !important;
        color: black !important;
        font-size: 12px;
      }
      .content-container {
        max-width: 100% !important;
        width: 100% !important;
        padding: 0 !important;
        margin: 0 !important;
        box-shadow: none !important;
        border: none !important;
      }
      h1, h2 {
        page-break-after: avoid;
      }
      tr {
        page-break-inside: avoid;
      }
    }
    html {
      scroll-behavior: smooth;
    }
    /* Scrollbar styling */
    ::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }
    ::-webkit-scrollbar-track {
      background: #f1f5f9;
    }
    ::-webkit-scrollbar-thumb {
      background: #cbd5e1;
      border-radius: 4px;
    }
    ::-webkit-scrollbar-thumb:hover {
      background: #94a3b8;
    }
  </style>
</head>
<body class="bg-slate-50 text-slate-800 font-sans min-h-screen flex flex-col">

  <!-- TOP DECORATIVE BAR -->
  <div class="h-2 bg-gradient-to-r from-indigo-600 via-indigo-500 to-amber-500 w-full no-print"></div>

  <!-- MAIN APP CONTAINER -->
  <div class="flex flex-1 max-w-7xl mx-auto w-full relative">
    
    <!-- LEFT SIDEBAR: NAVIGATION & TABLE OF CONTENTS -->
    <aside class="w-80 bg-white border-r border-slate-200 p-6 space-y-6 hidden lg:block no-print sticky top-0 h-screen overflow-y-auto shrink-0">
      <div class="flex items-center space-x-3 pb-4 border-b border-slate-100">
        <div class="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-150">
          ➕
        </div>
        <div>
          <h2 class="font-display font-extrabold text-slate-900 text-lg leading-tight">Avodani</h2>
          <span class="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Portal User Guide</span>
        </div>
      </div>

      <nav class="space-y-6 text-sm">
        <div>
          <h4 class="font-display font-bold text-slate-900 uppercase tracking-wider text-xs mb-2">1. Executive Summary</h4>
          <ul class="space-y-1 text-slate-500 font-medium pl-3 border-l border-slate-100">
            <li><a href="#purpose" class="hover:text-indigo-600 block py-0.5">Purpose & Audience</a></li>
            <li><a href="#benefits" class="hover:text-indigo-600 block py-0.5">Key System Benefits</a></li>
            <li><a href="#diagram" class="hover:text-indigo-600 block py-0.5">Workflow Diagram</a></li>
          </ul>
        </div>

        <div>
          <h4 class="font-display font-bold text-slate-900 uppercase tracking-wider text-xs mb-2">2. System Overview</h4>
          <ul class="space-y-1 text-slate-500 font-medium pl-3 border-l border-slate-100">
            <li><a href="#landing" class="hover:text-indigo-600 block py-0.5">Landing Page</a></li>
            <li><a href="#access" class="hover:text-indigo-600 block py-0.5">Access & User Roles</a></li>
          </ul>
        </div>

        <div>
          <h4 class="font-display font-bold text-slate-900 uppercase tracking-wider text-xs mb-2">3. Administrator Guide</h4>
          <ul class="space-y-1 text-slate-500 font-medium pl-3 border-l border-slate-100">
            <li><a href="#adm-overview" class="hover:text-indigo-600 block py-0.5">3.1 Dashboard Overview</a></li>
            <li><a href="#adm-locations" class="hover:text-indigo-600 block py-0.5">3.2 Field Locations</a></li>
            <li><a href="#adm-schedules" class="hover:text-indigo-600 block py-0.5">3.3 Volunteer Schedules</a></li>
            <li><a href="#adm-camp-creation" class="hover:text-indigo-600 block py-0.5">3.4 Configure Camp</a></li>
            <li><a href="#adm-matching" class="hover:text-indigo-600 block py-0.5">3.5 AI Match Engine</a></li>
            <li><a href="#adm-inv-logs" class="hover:text-indigo-600 block py-0.5">3.6 Invitation Logs</a></li>
            <li><a href="#adm-check-in" class="hover:text-indigo-600 block py-0.5">3.7 Check-in Manager</a></li>
            <li><a href="#adm-active-camps" class="hover:text-indigo-600 block py-0.5">3.8 Active Campaigns</a></li>
            <li><a href="#adm-credentials" class="hover:text-indigo-600 block py-0.5">3.9 Verification Registry</a></li>
            <li><a href="#adm-comm-tracking" class="hover:text-indigo-600 block py-0.5">3.10 Email Audits</a></li>
          </ul>
        </div>

        <div>
          <h4 class="font-display font-bold text-slate-900 uppercase tracking-wider text-xs mb-2">4. Volunteer Guide</h4>
          <ul class="space-y-1 text-slate-500 font-medium pl-3 border-l border-slate-100">
            <li><a href="#vol-overview" class="hover:text-indigo-600 block py-0.5">4.1 My Dashboard Overview</a></li>
            <li><a href="#vol-availability" class="hover:text-indigo-600 block py-0.5">4.2 Availability Planner</a></li>
            <li><a href="#vol-fields" class="hover:text-indigo-600 block py-0.5">4.3 Preferred Fields</a></li>
            <li><a href="#vol-profile" class="hover:text-indigo-600 block py-0.5">4.4 Re-upload Documents</a></li>
            <li><a href="#vol-participation" class="hover:text-indigo-600 block py-0.5">4.5 RSVP & Feedback</a></li>
          </ul>
        </div>

        <div>
          <h4 class="font-display font-bold text-slate-900 uppercase tracking-wider text-xs mb-2">5. Verification Use Cases</h4>
          <ul class="space-y-1 text-slate-500 font-medium pl-3 border-l border-slate-100">
            <li><a href="#usecase-1" class="hover:text-indigo-600 block py-0.5">1. Volunteer Registration</a></li>
            <li><a href="#usecase-2" class="hover:text-indigo-600 block py-0.5">2. Camp & Matchmaking</a></li>
            <li><a href="#usecase-3" class="hover:text-indigo-600 block py-0.5">3. Post-Camp Feedback</a></li>
            <li><a href="#usecase-4" class="hover:text-indigo-600 block py-0.5">4. On-Site Check-in</a></li>
          </ul>
        </div>

        <div>
          <h4 class="font-display font-bold text-slate-900 uppercase tracking-wider text-xs mb-2">6. Supplemental Info</h4>
          <ul class="space-y-1 text-slate-500 font-medium pl-3 border-l border-slate-100">
            <li><a href="#faq" class="hover:text-indigo-600 block py-0.5">7. FAQ Section</a></li>
            <li><a href="#quickstart" class="hover:text-indigo-600 block py-0.5">8. Quick Start Guides</a></li>
            <li><a href="#appendix" class="hover:text-indigo-600 block py-0.5">9. Appendix & Glossary</a></li>
          </ul>
        </div>
      </nav>

      <div class="pt-6 border-t border-slate-100 flex flex-col space-y-2">
        <button onclick="window.print()" class="w-full py-2 bg-indigo-600 hover:bg-indigo-750 text-white rounded-lg text-xs font-bold shadow-md transition-colors flex items-center justify-center space-x-1.5 cursor-pointer">
          <span>🖨️</span> <span>Export Guide to PDF</span>
        </button>
      </div>
    </aside>

    <!-- RIGHT CONTENT AREA -->
    <main class="flex-1 bg-white min-w-0 border-r border-slate-200 content-container shadow-sm p-8 md:p-12 space-y-16">
      
      <!-- HERO TITLE BLOCK -->
      <header class="border-b border-slate-200 pb-8 space-y-4">
        <div class="flex items-center space-x-2 text-indigo-600 font-bold text-xs uppercase tracking-widest no-print">
          <span>📖</span> <span>Official Practitioner & Administrative Manual</span>
        </div>
        <h1 class="font-display font-extrabold text-slate-900 text-3xl md:text-4xl tracking-tight leading-none">
          Avodani Platform User Guide
        </h1>
        <p class="text-slate-500 text-base font-normal max-w-3xl leading-relaxed">
          A comprehensive operational guide detailing the volunteer workflow, credential auditing, and automated matchmaking engine of the Avodani Medical Mission Portal.
        </p>
        
        <div class="p-4 bg-indigo-50 border-l-4 border-indigo-500 rounded-r-xl text-indigo-900 text-xs leading-relaxed space-y-1">
          <p class="font-bold flex items-center"><span class="mr-1.5">🕊️</span> Stewardship & Service Mission</p>
          <p class="italic font-medium">
            "Each of you should use whatever gift you have received to serve others, as faithful stewards of God’s grace in its various forms." — 1 Peter 4:10
          </p>
        </div>
      </header>

      <!-- SECTION 1: EXECUTIVE SUMMARY -->
      <section id="purpose" class="space-y-6">
        <div class="flex items-center space-x-3">
          <span class="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 font-bold text-sm flex items-center justify-center">1</span>
          <h2 class="font-display font-black text-slate-900 text-xl md:text-2xl tracking-tight">Executive Summary</h2>
        </div>

        <div class="space-y-4 text-slate-600 text-xs leading-relaxed">
          <p>
            The **Avodani Medical Mission Assignment Portal** is a specialized volunteer management platform designed for non-governmental organizations (NGOs) and Christian medical outreach associations. Avodani connects certified medical practitioners (doctors and nurses) with community-driven clinics in rural and under-served sectors.
          </p>
          <p>
            By consolidating scheduling, credential auditing, travel logistics, and campaign reporting under a unified coordination dashboard, Avodani streamlines the deployment pipeline. The system eliminates coordination overhead, validates professional qualifications, and utilizes an AI commute-priority engine to match the right medical specialists with the right local clinics.
          </p>
        </div>

        <!-- KEY BENEFITS -->
        <div id="benefits" class="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          <div class="p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <span class="text-xl">🛡️</span>
            <h4 class="font-display font-bold text-slate-900 text-sm">Credential Safeguarding</h4>
            <p class="text-slate-500 text-[11px] leading-relaxed">
              Maintains high-trust safety standards via administrative verification gates. All practitioner license documents undergo credential audits.
            </p>
          </div>
          <div class="p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <span class="text-xl">🧠</span>
            <h4 class="font-display font-bold text-slate-900 text-sm">Automated Matchmaking</h4>
            <p class="text-slate-500 text-[11px] leading-relaxed">
              Evaluates volunteer parameters (availability, specialty, geographic ranking, distance) to match camps using a multi-weighted KPI engine.
            </p>
          </div>
          <div class="p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <span class="text-xl">⏱️</span>
            <h4 class="font-display font-bold text-slate-900 text-sm">Day-of Accountability</h4>
            <p class="text-slate-500 text-[11px] leading-relaxed">
              Provides real-time attendance logs via an on-site Check-in Manager. Restricts actions to scheduled dates for database audit integrity.
            </p>
          </div>
        </div>

        <!-- WORKFLOW DIAGRAM -->
        <div id="diagram" class="pt-6 space-y-3 print-break">
          <h3 class="font-display font-bold text-slate-900 text-sm uppercase tracking-wider">Mission Workflow Pipeline</h3>
          <div class="p-6 bg-slate-900 rounded-2xl text-white overflow-x-auto">
            <div class="flex items-center space-x-2 text-center font-mono text-[9px] min-w-[800px] justify-between">
              <div class="bg-indigo-600 px-3 py-2 rounded-lg font-bold">1. Registration<br/><span class="text-[8px] text-indigo-200 font-normal">Volunteer Portal</span></div>
              <span class="text-indigo-400 text-base">➔</span>
              <div class="bg-slate-800 border border-slate-700 px-3 py-2 rounded-lg font-bold">2. Verification<br/><span class="text-[8px] text-slate-400 font-normal">Admin Audit</span></div>
              <span class="text-indigo-400 text-base">➔</span>
              <div class="bg-slate-800 border border-slate-700 px-3 py-2 rounded-lg font-bold">3. Config Camp<br/><span class="text-[8px] text-slate-400 font-normal">Define Params</span></div>
              <span class="text-indigo-400 text-base">➔</span>
              <div class="bg-indigo-600 px-3 py-2 rounded-lg font-bold">4. AI Match<br/><span class="text-[8px] text-indigo-200 font-normal">KPI Scoring</span></div>
              <span class="text-indigo-400 text-base">➔</span>
              <div class="bg-slate-800 border border-slate-700 px-3 py-2 rounded-lg font-bold">5. Dispatch<br/><span class="text-[8px] text-slate-400 font-normal">Email / Web</span></div>
              <span class="text-indigo-400 text-base">➔</span>
              <div class="bg-indigo-600 px-3 py-2 rounded-lg font-bold">6. Check-In<br/><span class="text-[8px] text-indigo-200 font-normal">On-Site execution</span></div>
              <span class="text-indigo-400 text-base">➔</span>
              <div class="bg-slate-800 border border-slate-700 px-3 py-2 rounded-lg font-bold">7. Feedback<br/><span class="text-[8px] text-slate-400 font-normal">Metrics & Ratings</span></div>
            </div>
          </div>
          <p class="text-[10px] text-slate-400 text-center italic">Figure 1.1: Sequential deployment pipeline for medical mission campaigns.</p>
        </div>
      </section>

      <!-- SECTION 2: SYSTEM OVERVIEW -->
      <section id="landing" class="space-y-6 print-break">
        <div class="flex items-center space-x-3">
          <span class="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 font-bold text-sm flex items-center justify-center">2</span>
          <h2 class="font-display font-black text-slate-900 text-xl md:text-2xl tracking-tight">System Overview</h2>
        </div>

        <div class="space-y-4 text-slate-600 text-xs leading-relaxed">
          <p>
            The portal is divided into three functional domains:
          </p>
          <ul class="list-disc pl-5 space-y-1">
            <li><strong>Public Landing Page</strong>: Introduces the mission project, displays live network-wide metrics (Doctors, Nurses, Completed Campaigns, and Total Patients Served), and lists verified rural outreach locations.</li>
            <li><strong>Administrator Command Center</strong>: Accessible to authorized NGO personnel to manage locations, verify credentials, schedule camps, execute AI matches, and audit check-ins.</li>
            <li><strong>Volunteer Practitioner Portal</strong>: Dedicated to medical practitioners to update available dates, rank preferred locations, manage invitations, and submit campaign feedback.</li>
          </ul>
        </div>

        <!-- LANDING SCREENSHOT -->
        <div class="space-y-2">
          <div class="border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-slate-100">
            <img src="${images.landing}" alt="Public Landing Page" class="w-full h-auto object-cover"/>
          </div>
          <p class="text-[10px] text-slate-400 text-center italic">Figure 2.1: Avodani Public Landing Page featuring real-time statistics and a timeline.</p>
        </div>

        <!-- ACCESS AND LOGINS -->
        <div id="access" class="space-y-3 pt-4">
          <h3 class="font-display font-bold text-slate-900 text-sm">Access Control & Role Permissions</h3>
          <div class="overflow-x-auto border border-slate-200 rounded-xl">
            <table class="w-full text-left text-xs border-collapse">
              <thead>
                <tr class="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                  <th class="p-3">User Role</th>
                  <th class="p-3">Onboarding Channel</th>
                  <th class="p-3">Access Restrictions</th>
                  <th class="p-3">Core Modules</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr>
                  <td class="p-3 font-semibold text-indigo-700">Administrator</td>
                  <td class="p-3">Vetted Admin Accounts Only</td>
                  <td class="p-3">Full administrative and verification privileges</td>
                  <td class="p-3">Verify Credentials, Configure Camps, AI Matching, Field Locations, Check-in Terminal</td>
                </tr>
                <tr>
                  <td class="p-3 font-semibold text-amber-700">Volunteer Practitioner</td>
                  <td class="p-3">Public Registration & License Verification</td>
                  <td class="p-3">Restricted to own profile, scheduler, and invitation lists</td>
                  <td class="p-3">Availability Planner, Preferred Fields, RSVP Action, Post-Camp Feedback Forms</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- LOGIN SCREENSHOTS -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
          <div class="space-y-2">
            <div class="border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-slate-100">
              <img src="${images.adminLogin}" alt="Admin Portal Sign-In" class="w-full h-auto object-cover"/>
            </div>
            <p class="text-[10px] text-slate-400 text-center italic">Figure 2.2: NGO / Admin Portal Sign-In Interface.</p>
          </div>
          <div class="space-y-2">
            <div class="border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-slate-100">
              <img src="${images.volunteerLogin}" alt="Volunteer Practitioner Portal Sign-In" class="w-full h-auto object-cover"/>
            </div>
            <p class="text-[10px] text-slate-400 text-center italic">Figure 2.3: Volunteer Practitioner Sign-In Interface.</p>
          </div>
        </div>
      </section>

      <!-- SECTION 3: ADMINISTRATOR USER GUIDE -->
      <section id="adm-overview" class="space-y-8 print-break">
        <div class="flex items-center space-x-3">
          <span class="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 font-bold text-sm flex items-center justify-center">3</span>
          <h2 class="font-display font-black text-slate-900 text-xl md:text-2xl tracking-tight">Administrator User Guide</h2>
        </div>

        <!-- 3.1 DASHBOARD OVERVIEW -->
        <div class="space-y-4">
          <div class="flex items-center space-x-2">
            <span class="text-base font-bold text-slate-900">3.1</span>
            <h3 class="font-display font-extrabold text-slate-900 text-base">Dashboard Overview</h3>
          </div>
          <p class="text-slate-600 text-xs leading-relaxed">
            The **Admin Overview** is the command headquarters. It provides high-level diagnostics of the entire volunteer network, including live statistics, scheduled camp statuses, and pending credentials queue counts.
          </p>
          <div class="p-4 bg-amber-50 border-l-4 border-amber-500 rounded-r-xl text-amber-900 text-xs leading-relaxed">
            <strong>📊 Key Metrics Monitored:</strong> Approved Doctors Count, Approved Nurses Count, Active Registry Locations, and Pending Verification requests.
          </div>
          <div class="space-y-2">
            <div class="border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-slate-100">
              <img src="${images.adminOverview}" alt="Admin Dashboard Overview" class="w-full h-auto object-cover"/>
            </div>
            <p class="text-[10px] text-slate-400 text-center italic">Figure 3.1: Admin Command Center Overview Dashboard with metrics and campaigns.</p>
          </div>
        </div>

        <!-- 3.2 MANAGE FIELD LOCATIONS -->
        <div id="adm-locations" class="space-y-4 pt-6 print-break">
          <div class="flex items-center space-x-2">
            <span class="text-base font-bold text-slate-900">3.2</span>
            <h3 class="font-display font-extrabold text-slate-900 text-base">Manage Field Locations</h3>
          </div>
          <p class="text-slate-600 text-xs leading-relaxed">
            Field locations represent rural outreach clinics, healthcare centers, and remote coordinate targets. Defining accurate coordinates enables the AI commute engine to calculate distances of matched volunteers.
          </p>
          <div class="overflow-x-auto border border-slate-200 rounded-xl">
            <table class="w-full text-left text-xs border-collapse">
              <thead>
                <tr class="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                  <th class="p-3">Field Name</th>
                  <th class="p-3">Database Type</th>
                  <th class="p-3">Purpose / Business Role</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr>
                  <td class="p-3 font-mono font-bold text-slate-700">Location Name</td>
                  <td class="p-3">TEXT (Unique)</td>
                  <td class="p-3">The distinct identification name of the outreach node (e.g. "Dharwad").</td>
                </tr>
                <tr>
                  <td class="p-3 font-mono font-bold text-slate-700">Distance Index</td>
                  <td class="p-3">INTEGER</td>
                  <td class="p-3">Distance index from the headquarters or main hospital (in kilometers).</td>
                </tr>
                <tr>
                  <td class="p-3 font-mono font-bold text-slate-700">Region Tag</td>
                  <td class="p-3">TEXT</td>
                  <td class="p-3">Geographic classification area used for matching volunteer priorities.</td>
                </tr>
                <tr>
                  <td class="p-3 font-mono font-bold text-slate-700">Caseload Priority</td>
                  <td class="p-3">INTEGER</td>
                  <td class="p-3">Weighted priority index representing patient caseload demands.</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="space-y-2">
            <div class="border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-slate-100">
              <img src="${images.adminLocations}" alt="Manage Field Locations" class="w-full h-auto object-cover"/>
            </div>
            <p class="text-[10px] text-slate-400 text-center italic">Figure 3.2: Manage Field Locations Registry page.</p>
          </div>
        </div>

        <!-- 3.3 VOLUNTEER SCHEDULES -->
        <div id="adm-schedules" class="space-y-4 pt-6 print-break">
          <div class="flex items-center space-x-2">
            <span class="text-base font-bold text-slate-900">3.3</span>
            <h3 class="font-display font-extrabold text-slate-900 text-base">Volunteer Schedules</h3>
          </div>
          <p class="text-slate-600 text-xs leading-relaxed">
            Displays a monthly schedule grid for all approved doctors and nurses. Administrators select any practitioner from the dropdown to check their committed available dates before scheduling a campaign.
          </p>
          <div class="space-y-2">
            <div class="border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-slate-100">
              <img src="${images.adminSchedules}" alt="Volunteer Schedules" class="w-full h-auto object-cover"/>
            </div>
            <p class="text-[10px] text-slate-400 text-center italic">Figure 3.3: Volunteer Schedules Availability Calendar audit view.</p>
          </div>
        </div>

        <!-- 3.4 CONFIGURE CAMP -->
        <div id="adm-camp-creation" class="space-y-4 pt-6 print-break">
          <div class="flex items-center space-x-2">
            <span class="text-base font-bold text-slate-900">3.4</span>
            <h3 class="font-display font-extrabold text-slate-900 text-base">Configure Camp</h3>
          </div>
          <p class="text-slate-600 text-xs leading-relaxed">
            Allows the configuration and launch of campaigns. Campaigns can be saved in **Drafting** (retains details in database but blocks notifications and AI matchmaking) or **Scheduled** (immediately enables matching).
          </p>
          <div class="p-4 bg-green-50 border-l-4 border-green-500 rounded-r-xl text-green-900 text-xs leading-relaxed">
            <strong>💡 Dynamic Month Tagging:</strong> The selector automatically computes the upcoming 12 months (e.g. "June 2026"), so admins can target campaign schedules without manual database updates.
          </div>
          <div class="space-y-2">
            <div class="border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-slate-100">
              <img src="${images.adminConfigureCamp}" alt="Configure Camp" class="w-full h-auto object-cover"/>
            </div>
            <p class="text-[10px] text-slate-400 text-center italic">Figure 3.4: Camp Configuration Form & Required Specialties selector.</p>
          </div>
        </div>

        <!-- 3.5 AI DOCTOR MATCHING -->
        <div id="adm-matching" class="space-y-4 pt-6 print-break">
          <div class="flex items-center space-x-2">
            <span class="text-base font-bold text-slate-900">3.5</span>
            <h3 class="font-display font-extrabold text-slate-900 text-base">AI Doctor Matching</h3>
          </div>
          <p class="text-slate-600 text-xs leading-relaxed">
            An automated matchmaking engine designed to recruit candidates for scheduled campaigns. It enforces a **Strict Availability Gate**—if a volunteer is not marked as "Available" on the calendar for that specific date and month, they are excluded immediately.
          </p>
          
          <div class="p-4 bg-indigo-50 border border-indigo-200 rounded-xl text-xs space-y-2">
            <span class="font-bold text-indigo-950 block uppercase tracking-wider text-[10px]">AI Match Scoring Matrix (100% Total)</span>
            <ul class="list-decimal pl-5 space-y-1 text-slate-700">
              <li><strong>Specialty Alignment (40%)</strong>: Matches camp required specialties.</li>
              <li><strong>Location Priorities (40%)</strong>: Evaluates volunteer preference rankings for the target region.</li>
              <li><strong>Past Camp Service (10%)</strong>: Rewards active volunteers who have completed previous campaigns.</li>
              <li><strong>Commute Index (10%)</strong>: Evaluates physical distances (e.g., &le; 20km: 10 pts; &le; 100km: 8 pts; &le; 200km: 5 pts; else: 2 pts).</li>
            </ul>
          </div>

          <div class="space-y-2">
            <div class="border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-slate-100">
              <img src="${images.adminMatching}" alt="AI Doctor Matching" class="w-full h-auto object-cover"/>
            </div>
            <p class="text-[10px] text-slate-400 text-center italic">Figure 3.5: AI Doctor Match Engine listing candidates with match scores and details.</p>
          </div>
        </div>

        <!-- 3.6 INVITATION LOGS -->
        <div id="adm-inv-logs" class="space-y-4 pt-6 print-break">
          <div class="flex items-center space-x-2">
            <span class="text-base font-bold text-slate-900">3.6</span>
            <h3 class="font-display font-extrabold text-slate-900 text-base">Invitation Logs</h3>
          </div>
          <p class="text-slate-600 text-xs leading-relaxed">
            Tracks invitations, including dispatch channels (Email, Web, or Both) and current response status.
          </p>
          <div class="p-4 bg-rose-50 border-l-4 border-rose-500 rounded-r-xl text-rose-900 text-xs leading-relaxed">
            <strong>⚠️ Retract & Clear Feature:</strong> Click the trash icon to retract invitations. This purges invitations from the roster immediately, allowing coordinate re-assignment.
          </div>
          <div class="space-y-2">
            <div class="border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-slate-100">
              <img src="${images.adminInvitationLogs}" alt="Invitation Logs" class="w-full h-auto object-cover"/>
            </div>
            <p class="text-[10px] text-slate-400 text-center italic">Figure 3.6: Invitation Dispatch & RSVP Tracking Roster.</p>
          </div>
        </div>

        <!-- 3.7 CHECK-IN MANAGER -->
        <div id="adm-check-in" class="space-y-4 pt-6 print-break">
          <div class="flex items-center space-x-2">
            <span class="text-base font-bold text-slate-900">3.7</span>
            <h3 class="font-display font-extrabold text-slate-900 text-base">Check-in Manager</h3>
          </div>
          <p class="text-slate-600 text-xs leading-relaxed">
            The **Check-in Execution Terminal** manages clinical log operations on-site.
          </p>
          <div class="p-4 bg-indigo-50 border-l-4 border-indigo-500 rounded-r-xl text-indigo-900 text-xs leading-relaxed">
            <strong>⏱️ Date Gate:</strong> Check-in and check-out buttons are disabled until the campaign's scheduled execution date. Once checked out, the camp status is set to "Completed," which enables the feedback form for volunteers.
          </div>
          <div class="space-y-2">
            <div class="border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-slate-100">
              <img src="${images.adminCheckinManager}" alt="Check-in Manager" class="w-full h-auto object-cover"/>
            </div>
            <p class="text-[10px] text-slate-400 text-center italic">Figure 3.7: On-Site Check-in & Check-out Manager.</p>
          </div>
        </div>

        <!-- 3.8 ACTIVE CAMP CAMPAIGNS -->
        <div id="adm-active-camps" class="space-y-4 pt-6">
          <div class="flex items-center space-x-2">
            <span class="text-base font-bold text-slate-900">3.8</span>
            <h3 class="font-display font-extrabold text-slate-900 text-base">Active Camp Campaigns</h3>
          </div>
          <p class="text-slate-600 text-xs leading-relaxed">
            Administrators can monitor live campaigns, update details, or cancel scheduled campaigns. If a campaign is cancelled, notifications are dispatched to all confirmed volunteers.
          </p>
        </div>

        <!-- 3.9 CREDENTIAL ACTIONS -->
        <div id="adm-credentials" class="space-y-4 pt-6 print-break">
          <div class="flex items-center space-x-2">
            <span class="text-base font-bold text-slate-900">3.9</span>
            <h3 class="font-display font-extrabold text-slate-900 text-base">Credential Actions & Audits</h3>
          </div>
          <p class="text-slate-600 text-xs leading-relaxed">
            All volunteer practitioner accounts are locked upon registration. Administrators must audit uploaded qualification degrees and professional license certificates.
          </p>
          <div class="space-y-2">
            <div class="border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-slate-100">
              <img src="${images.adminVerification}" alt="Credential Audits" class="w-full h-auto object-cover"/>
            </div>
            <p class="text-[10px] text-slate-400 text-center italic">Figure 3.8: Practitioner Credential Audit & Approval Terminal.</p>
          </div>
        </div>

        <!-- 3.10 COMMUNICATION TRACKING -->
        <div id="adm-comm-tracking" class="space-y-4 pt-6">
          <div class="flex items-center space-x-2">
            <span class="text-base font-bold text-slate-900">3.10</span>
            <h3 class="font-display font-extrabold text-slate-900 text-base">Communication Tracking</h3>
          </div>
          <p class="text-slate-600 text-xs leading-relaxed">
            Audits and records the dispatch status of notifications sent via email. If a volunteer does not respond, admins can resend invitations directly from the log roster.
          </p>
        </div>
      </section>

      <!-- SECTION 4: VOLUNTEER USER GUIDE -->
      <section id="vol-overview" class="space-y-8 print-break">
        <div class="flex items-center space-x-3">
          <span class="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 font-bold text-sm flex items-center justify-center">4</span>
          <h2 class="font-display font-black text-slate-900 text-xl md:text-2xl tracking-tight">Volunteer Practitioner User Guide</h2>
        </div>

        <!-- 4.1 DASHBOARD OVERVIEW -->
        <div class="space-y-4">
          <div class="flex items-center space-x-2">
            <span class="text-base font-bold text-slate-900">4.1</span>
            <h3 class="font-display font-extrabold text-slate-900 text-base">Dashboard Overview</h3>
          </div>
          <p class="text-slate-600 text-xs leading-relaxed">
            Volunteers can track upcoming assignments, review credential status (Approved, Pending, or Rejected), check metrics, and review campaign invitations.
          </p>
          <div class="space-y-2">
            <div class="border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-slate-100">
              <img src="${images.volunteerOverview}" alt="Volunteer Dashboard" class="w-full h-auto object-cover"/>
            </div>
            <p class="text-[10px] text-slate-400 text-center italic">Figure 4.1: Volunteer Practitioner Portal Dashboard Overview.</p>
          </div>
        </div>

        <!-- 4.2 AVAILABILITY PLANNER -->
        <div id="vol-availability" class="space-y-4 pt-6 print-break">
          <div class="flex items-center space-x-2">
            <span class="text-base font-bold text-slate-900">4.2</span>
            <h3 class="font-display font-extrabold text-slate-900 text-base">Availability Planner</h3>
          </div>
          <p class="text-slate-600 text-xs leading-relaxed">
            Practitioners must mark their availability on the monthly calendar. The AI Matchmaking engine filters campaigns based on this calendar.
          </p>
          <div class="space-y-2">
            <div class="border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-slate-100">
              <img src="${images.volunteerAvailability}" alt="Availability Planner" class="w-full h-auto object-cover"/>
            </div>
            <p class="text-[10px] text-slate-400 text-center italic">Figure 4.2: Volunteer Availability Calendar planner.</p>
          </div>
        </div>

        <!-- 4.3 PREFERRED FIELDS -->
        <div id="vol-fields" class="space-y-4 pt-6 print-break">
          <div class="flex items-center space-x-2">
            <span class="text-base font-bold text-slate-900">4.3</span>
            <h3 class="font-display font-extrabold text-slate-900 text-base">Preferred Fields</h3>
          </div>
          <p class="text-slate-600 text-xs leading-relaxed">
            Drag-and-drop or priority rank available locations. The AI Match engine evaluates these preferences to prioritize assignments.
          </p>
          <div class="space-y-2">
            <div class="border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-slate-100">
              <img src="${images.volunteerPreferredFields}" alt="Preferred Fields" class="w-full h-auto object-cover"/>
            </div>
            <p class="text-[10px] text-slate-400 text-center italic">Figure 4.3: Location Priorities manager in Volunteer Portal.</p>
          </div>
        </div>

        <!-- 4.4 RE-UPLOAD DOCUMENTS -->
        <div id="vol-profile" class="space-y-4 pt-6">
          <div class="flex items-center space-x-2">
            <span class="text-base font-bold text-slate-900">4.4</span>
            <h3 class="font-display font-extrabold text-slate-900 text-base">Profile Management & Re-upload</h3>
          </div>
          <p class="text-slate-600 text-xs leading-relaxed">
            If credentials are flagged as blurry or incorrect, the dashboard displays feedback. Practitioners can upload corrected license files or degree scans to submit their profiles back for review.
          </p>
        </div>

        <!-- 4.5 RSVP & FEEDBACK -->
        <div id="vol-participation" class="space-y-4 pt-6 print-break">
          <div class="flex items-center space-x-2">
            <span class="text-base font-bold text-slate-900">4.5</span>
            <h3 class="font-display font-extrabold text-slate-900 text-base">Mission Participation, RSVP & Feedback</h3>
          </div>
          <p class="text-slate-600 text-xs leading-relaxed">
            Review and respond (Accept/Decline) to invitations in the Camp Details modal. Upon checkout, volunteers can submit feedback (rating, patient counts, and comments).
          </p>
          <div class="space-y-2">
            <div class="border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-slate-100">
              <img src="${images.volunteerCampDetails}" alt="RSVP and Feedback Details" class="w-full h-auto object-cover"/>
            </div>
            <p class="text-[10px] text-slate-400 text-center italic">Figure 4.4: Volunteer Camp Details view with RSVP controls and feedback options.</p>
          </div>
        </div>
      </section>

      <!-- SECTION 5: USE CASES -->
      <section id="usecases" class="space-y-8 print-break">
        <div class="flex items-center space-x-3">
          <span class="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 font-bold text-sm flex items-center justify-center">5</span>
          <h2 class="font-display font-black text-slate-900 text-xl md:text-2xl tracking-tight">System Use Cases</h2>
        </div>

        <!-- USE CASE 1 -->
        <div id="usecase-1" class="p-6 bg-white border border-slate-200 rounded-2xl space-y-4 shadow-xs">
          <h3 class="font-display font-bold text-indigo-600 text-sm">Use Case 1: Volunteer Registration & Onboarding</h3>
          <ul class="text-xs space-y-2 text-slate-600">
            <li><strong>Objective</strong>: Allow medical practitioners to register and securely upload credential files for audit.</li>
            <li><strong>Prerequisites</strong>: Practitioner must have an active medical registration number and credential certificates.</li>
            <li><strong>Step-by-Step Actions</strong>:
              <ol class="list-decimal pl-5 space-y-1 mt-1">
                <li>Navigate to landing page -> click <strong>Volunteer Portal</strong> -> click <strong>Register as New Volunteer</strong>.</li>
                <li>Complete contact details, role type (Doctor/Nurse), age, and council registration code.</li>
                <li>Choose local files and upload **Medical Degree Scan** and **Professional License Scan**. Click **Submit Registration**.</li>
              </ol>
            </li>
            <li><strong>Expected Outcome</strong>: A profile is created and set to "Pending" status. The volunteer is locked out of scheduling until approved by an administrator.</li>
          </ul>
        </div>

        <!-- USE CASE 2 -->
        <div id="usecase-2" class="p-6 bg-white border border-slate-200 rounded-2xl space-y-4 shadow-xs">
          <h3 class="font-display font-bold text-indigo-600 text-sm">Use Case 2: Camp Scheduling & AI Matchmaking</h3>
          <ul class="text-xs space-y-2 text-slate-600">
            <li><strong>Objective</strong>: Create an outreach camp and recruit qualified volunteers.</li>
            <li><strong>Prerequisites</strong>: Target location must be registered.</li>
            <li><strong>Step-by-Step Actions</strong>:
              <ol class="list-decimal pl-5 space-y-1 mt-1">
                <li>Login as Admin -> navigate to <strong>Configure Camp</strong>.</li>
                <li>Enter camp name, date, location, expected patient capacity, and select required specialties. Select status as **Scheduled**.</li>
                <li>Navigate to <strong>AI Doctor Matcher</strong> -> Select the campaign. The engine evaluates calendar schedules and score weights.</li>
                <li>Check the boxes of candidates, select communication channel (Web & Email), and click **Send Invites**.</li>
              </ol>
            </li>
            <li><strong>Expected Outcome</strong>: Roster invitations are recorded in the database, and invitation emails are sent.</li>
          </ul>
        </div>

        <!-- USE CASE 3 -->
        <div id="usecase-3" class="p-6 bg-white border border-slate-200 rounded-2xl space-y-4 shadow-xs">
          <h3 class="font-display font-bold text-indigo-600 text-sm">Use Case 3: Post-Camp Feedback Submission</h3>
          <ul class="text-xs space-y-2 text-slate-600">
            <li><strong>Objective</strong>: Collect clinical metrics and feedback from volunteers.</li>
            <li><strong>Prerequisites</strong>: Admin has checked out the volunteer, setting camp status to "Completed".</li>
            <li><strong>Step-by-Step Actions</strong>:
              <ol class="list-decimal pl-5 space-y-1 mt-1">
                <li>Login as Volunteer -> Open dashboard -> Click **Completed Campaigns**.</li>
                <li>Select the camp card to view details -> Click **Submit Feedback**.</li>
                <li>Rate the experience (1-5 stars), enter the patient count served, add comments, and click **Submit**.</li>
              </ol>
            </li>
            <li><strong>Expected Outcome</strong>: Feedback is stored on the invitation record, and the Details Modal closes automatically.</li>
          </ul>
        </div>

        <!-- USE CASE 4 -->
        <div id="usecase-4" class="p-6 bg-white border border-slate-200 rounded-2xl space-y-4 shadow-xs">
          <h3 class="font-display font-bold text-indigo-600 text-sm">Use Case 4: On-Site Check-in Terminal Operation</h3>
          <ul class="text-xs space-y-2 text-slate-600">
            <li><strong>Objective</strong>: Track volunteer attendance on-site.</li>
            <li><strong>Prerequisites</strong>: The current date must match or follow the scheduled camp date.</li>
            <li><strong>Step-by-Step Actions</strong>:
              <ol class="list-decimal pl-5 space-y-1 mt-1">
                <li>Login as Admin -> Navigate to **Check-in Manager**.</li>
                <li>Select the running campaign from the selector to retrieve the confirmed roster.</li>
                <li>Click **Check In** when a practitioner arrives. Click **Check Out** at the end of the shift.</li>
              </ol>
            </li>
            <li><strong>Expected Outcome</strong>: Attendance is timestamped, and metrics are updated.</li>
          </ul>
        </div>
      </section>

      <!-- SECTION 6: FAQ SECTION -->
      <section id="faq" class="space-y-6 print-break">
        <div class="flex items-center space-x-3">
          <span class="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 font-bold text-sm flex items-center justify-center">6</span>
          <h2 class="font-display font-black text-slate-900 text-xl md:text-2xl tracking-tight">FAQ Section</h2>
        </div>

        <div class="space-y-4 text-xs">
          <div class="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <h4 class="font-bold text-slate-900">How do I update my availability?</h4>
            <p class="text-slate-600 leading-relaxed">
              Login to the Volunteer Portal, navigate to **Availability Planner**, and select dates on the calendar. Only marked dates are evaluated by the matching engine.
            </p>
          </div>

          <div class="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <h4 class="font-bold text-slate-900">How does the AI Match Engine evaluate volunteers?</h4>
            <p class="text-slate-600 leading-relaxed">
              Filters by availability, then scores based on: Specialty Alignment (40%), Location Priority (40%), Completed Campaigns (10%), and Distance Commute (10%).
            </p>
          </div>

          <div class="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <h4 class="font-bold text-slate-900">How does an admin approve volunteer credentials?</h4>
            <p class="text-slate-600 leading-relaxed">
              Go to **Verify Credentials** on the Admin Dashboard, click **Audit Credentials** to view certificates, and click **Approve** or **Decline**.
            </p>
          </div>

          <div class="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <h4 class="font-bold text-slate-900">How do I track invitation responses?</h4>
            <p class="text-slate-600 leading-relaxed">
              Go to **Invitation Logs** on the Admin Dashboard. Current status is displayed as Pending, Accepted, or Declined.
            </p>
          </div>
        </div>
      </section>

      <!-- SECTION 7: QUICK START GUIDE -->
      <section id="quickstart" class="space-y-6 print-break">
        <div class="flex items-center space-x-3">
          <span class="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 font-bold text-sm flex items-center justify-center">7</span>
          <h2 class="font-display font-black text-slate-900 text-xl md:text-2xl tracking-tight">Quick Start Guide</h2>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div class="p-6 bg-slate-900 text-white rounded-2xl space-y-4">
            <h3 class="font-display font-bold text-indigo-400 text-base">Administrator Quick Start</h3>
            <ul class="space-y-3 text-xs text-slate-300 font-medium">
              <li class="flex items-start"><span class="text-amber-400 mr-2">1.</span> Audit registration documents in the **Verify Credentials** tab.</li>
              <li class="flex items-start"><span class="text-amber-400 mr-2">2.</span> Configure locations in the **Manage Field Locations** tab.</li>
              <li class="flex items-start"><span class="text-amber-400 mr-2">3.</span> Create a camp campaign in the **Configure Camp** tab.</li>
              <li class="flex items-start"><span class="text-amber-400 mr-2">4.</span> Use **AI Doctor Matching** to recruit matched candidates.</li>
              <li class="flex items-start"><span class="text-amber-400 mr-2">5.</span> Manage attendance check-ins on execution dates.</li>
            </ul>
          </div>

          <div class="p-6 bg-indigo-950 text-white rounded-2xl space-y-4">
            <h3 class="font-display font-bold text-amber-400 text-base">Volunteer Quick Start</h3>
            <ul class="space-y-3 text-xs text-slate-300 font-medium">
              <li class="flex items-start"><span class="text-amber-400 mr-2">1.</span> Register and upload degree and license certificates.</li>
              <li class="flex items-start"><span class="text-amber-400 mr-2">2.</span> Update available dates in the **Availability Planner**.</li>
              <li class="flex items-start"><span class="text-amber-400 mr-2">3.</span> Rank geographic preferences in the **Preferred Fields** tab.</li>
              <li class="flex items-start"><span class="text-amber-400 mr-2">4.</span> Accept or decline invitations in the **Invitation Center**.</li>
              <li class="flex items-start"><span class="text-amber-400 mr-2">5.</span> Submit post-camp feedback upon checkout.</li>
            </ul>
          </div>
        </div>
      </section>

      <!-- SECTION 8: APPENDIX -->
      <section id="appendix" class="space-y-6 print-break">
        <div class="flex items-center space-x-3">
          <span class="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 font-bold text-sm flex items-center justify-center">8</span>
          <h2 class="font-display font-black text-slate-900 text-xl md:text-2xl tracking-tight">Appendix & Glossary</h2>
        </div>

        <div class="space-y-4 text-xs text-slate-600 leading-relaxed">
          <h3 class="font-display font-bold text-slate-900 text-sm">Glossary of Terms</h3>
          <ul class="space-y-2">
            <li><strong>Avodani</strong>: The volunteer medical mission matching system, signifying "my service" in Hebrew.</li>
            <li><strong>RLS (Row Level Security)</strong>: Database security policies restricting row access to authorized owners or roles.</li>
            <li><strong>Campaign (Camp)</strong>: A structured rural medical outreach project scheduled at a specific location.</li>
            <li><strong>Matchmaking Score</strong>: A computed percentage representation of volunteer alignment.</li>
            <li><strong>Caseload Priority</strong>: Weighting metric assigned to field locations to prioritize matching.</li>
          </ul>
        </div>
      </section>

      <!-- BRAND FOOTER -->
      <footer class="border-t border-slate-100 pt-8 flex flex-col md:flex-row justify-between items-center text-slate-400 text-[10px] space-y-4 md:space-y-0">
        <div class="flex items-center space-x-2">
          <span class="font-bold text-slate-600">Avodani Portal Guide</span>
          <span>•</span>
          <span>© 2026. All Rights Reserved.</span>
        </div>
        <div>
          <span>Compiled on-demand via Playwright automation client.</span>
        </div>
      </footer>

    </main>
  </div>

</body>
</html>
`;

  fs.writeFileSync(outputFile, htmlContent);
  console.log(`User guide HTML successfully written to: ${outputFile}`);
}

run();
