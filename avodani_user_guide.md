# Avodani User Guide: Administration Control & Volunteer Portal

Welcome to the **Avodani User Guide**. This document outlines the administrative features and practitioner workflows within the Avodani portal. Use this guide to onboard administrative staff, configure remote healthcare deployments, and guide clinical volunteers (doctors and nurses) through sign-in, scheduling, and RSVP actions.

---

## Table of Contents
1. [Avodani Product Overview](#1-avodani-product-overview)
2. [Administrative Portal User Guide](#2-administrative-portal-user-guide)
   * [Overview Dashboard](#21-overview-dashboard)
   * [Volunteer Verification Registry](#22-volunteer-verification-registry)
   * [Field Location Registry](#23-field-location-registry)
   * [Volunteer Schedules Calendar](#24-volunteer-schedules-calendar)
   * [Campaign Configuration & Activation](#25-campaign-configuration-activation)
   * [AI Match Engine & Invitations](#26-ai-match-engine-invitations)
   * [Invitation & RSVP Logs](#27-invitation--rsvp-logs)
   * [Day-of Check-in Manager](#28-day-of-check-in-manager)
3. [Volunteer Practitioner Portal User Guide](#3-volunteer-practitioner-portal-user-guide)
   * [Onboarding & Registration](#31-onboarding--registration)
   * [Profile & Preferences Setup](#32-profile--preferences-setup)
   * [Mission Invitation Center](#33-mission-invitation-center)
   * [My Dashboard Navigation](#34-my-dashboard-navigation)
4. [Exporting this Guide to PDF](#4-exporting-this-guide-to-pdf)

---

## 1. Avodani Product Overview

**Avodani** is a Hebrew-derived word signifying "my service" (rooted in the biblical concept of *Avodah*—work, service, or devotion done with our talents as acts of worship). The platform's foundation is built upon the biblical reference **1 Peter 4:10**: *"Each of you should use whatever gift you have received to serve others, as faithful stewards of God’s grace in its various forms."*

Avodani is a secure, coordinate-matching framework designed to bridge the gap between healthcare organizers and certified volunteer practitioners. The platform helps deployment coordinators:
* **Verify Qualifications**: Audit clinical registration documents and medical licenses securely.
* **Match by Score**: Use a multi-weighted KPI engine to select volunteers based on specialty, geography, commitment levels, and commute times.
* **Enforce Schedule Gates**: Strictly exclude volunteers who are unavailable on camp execution dates.
* **Track Attendance**: Manage check-ins and check-outs in real time on the day of the camp.

---

## 2. Administrative Portal User Guide

Administrators manage the remote healthcare networks, define camp deployment parameters, verify practitioner credentials, and coordinate matching rosters.

### 2.1 Overview Dashboard
The **Administrative Overview** tab provides a diagnostic assessment of the entire network:
* **Key KPI Cards**: Instantly view the counts of Approved Doctors, Approved Nurses, Active Locations, and Pending Verification Applications.
* **Active Camp Campaigns**: Displays all defined camps. Scheduled camps display live RSVP metrics (`Attending` / `Pending`). Camps in `Drafting` status display a `Drafting - No Communication` badge (indicating matching is blocked).
* **Details & RSVP Logs**: Click the button on any campaign card to view the exact specialists assigned and track pending invitation states.

### 2.2 Volunteer Verification Registry
To preserve clinical standards, all newly registered volunteers are held in a `Pending` state.
* **Document Audit**: In the **Verification Roster** tab, click **Audit Credentials** to open the secure document viewer. This retrieves secure, signed URL links to the doctor’s digital degree certificate and medical council license copy.
* **Approve / Flag Action**:
  * **Approve**: Activates the practitioner, allowing them to appear in the AI Match Engine.
  * **Decline / Suspend**: Prompts a text field to specify a reason (e.g., *“License scan blurry. Please re-upload.”*). This reason is shown immediately on the doctor's profile page so they can resolve the issue.

### 2.3 Field Location Registry
The **Field Location Registry** tab defines the target coordinates for outreach campaigns.
* **Registering Locations**: Enter the unique Location Node name, distance index (relative to coordinates center), active caseload status (to prioritize screening), and coordinates (Latitude/Longitude).
* **Importance**: The coordinates are evaluated by the AI Commute Index to calculate the travel scores of volunteers during matchmaking.

### 2.4 Volunteer Schedules Calendar
The **Volunteer Schedules** tab allows admins to select any practitioner and view their calendar commitment planner.
* Monthly grids highlight the specific days the volunteer has committed to be available.
* Useful for double-checking scheduling conflicts prior to defining camp campaign dates.

### 2.5 Campaign Configuration & Activation
The **Configure Camp** tab defines new remote healthcare events.
* **Parameters**: Enter the Camp Name, select a Registered Location Node, date, expected patient capacity, and target specialty checks (e.g., General Medicine, Pediatrics, Orthopedics).
* **Launch & Status**:
  * Newly created campaigns can be set to **Drafting** (retains parameters in database but suppresses volunteer matching/invitations) or **Scheduled** (immediately activates matching functions).
  * Admins can edit details (like modifying dates or adding required specialties) or cancel a camp entirely at any time by clicking the buttons inside the camp's details modal.

### 2.6 AI Match Engine & Invitations
The **AI Doctor Matching** engine handles recruitment automation:
* **Strict Availability Gate**: Evaluates the date of the selected campaign. Any doctor not explicitly marked "Available" for that month and day is automatically filtered out.
* **KPI Score Weights (100% Total)**:
  * **Specialty Alignment (40%)**: Matches camp required specialties list.
  * **Location Priorities (40%)**: Scaled based on the location priority ranks configured in the practitioner's profile.
  * **Past Camp Service (10%)**: Incentivizes volunteers with high historical completion counts.
  * **Commute Index (10%)**: Computed based on distance indexes (<= 20km: 10 pts; <= 100km: 8 pts; <= 200km: 5 pts; else: 2 pts).
* **Dispatch Controls**: Check the boxes of matched candidates, choose the dispatch channel (Web App, Email, or Both), and click **Send Invites**. Matching and invitations are disabled if the camp is a Draft.

### 2.7 Invitation & RSVP Logs
The **Invitation Logs** tab tracks outbound requests.
* Displays the Campaign Name, Doctor Name, Delivery Channel, and Response State (`Pending`, `Accepted`, `Declined`).
* **Retract Invite**: Click the trash icon to revoke pending requests or remove doctors from assigned roles, updating database rosters dynamically.

### 2.8 Day-of Check-in Manager
The **Check-in Execution Terminal** manages clinical log operations on-site.
* Select the active running camp. The page retrieves the roster of accepted and assigned volunteers.
* **Date Integrity check**: The **Check In 🛫** and **Check Out 🛬** buttons are locked until the scheduled date of the camp.
* **Action**: Click the action button on the execution date to timestamp checking in or out. This logs audit records directly to the `check_ins` database.

---

## 3. Volunteer Practitioner Portal User Guide

Practitioners use their dashboard to manage schedules, review invitations, and check their historical deployments.

### 3.1 Onboarding & Registration
1. Navigate to **Volunteer Portal** -> **Register as New Volunteer**.
2. Complete the contact profile and choose your clinical role (**Doctor** or **Nurse**).
3. Upload PDF/Image scans of your **Medical Degree** and **Medical Council License Copy**.
4. Submit your application. The account will display a `Pending Administrative Audit Check` banner until approved by an admin.

### 3.2 Profile & Preferences Setup
Once approved, volunteers log in to configure variables evaluated by the AI Matching Engine:
* **Location Priorities**: Drag or rank regions in order of priority (e.g., Hubli, Mangalore, Koya).
* **Calendar Planner**: Toggle calendar dates to indicate which specific days you are available to work.
* **Credentials Review**: View verification feedback if documents are rejected, allowing you to upload corrected credentials.

### 3.3 Mission Invitation Center
When invited to a scheduled campaign, the **Mission Invitation Center** panel updates:
* Review camp details, including target locations, required specialties, and patient capacity.
* Click **Accept Invitation ✓** (moves the camp to your upcoming missions list) or **Decline Invitation ✗** (allows the admin to select an alternate candidate).
* If a campaign is cancelled, you will receive an automatic email alert and dashboard notification.

### 3.4 My Dashboard Navigation
* **My Upcoming Missions**: Displays all accepted invitations with details and location parameters.
* **My Completed Campaigns**: Displays all past missions where you logged attendance checks.
* **Commitment Statistics**: Displays cumulative metrics showing your completed field days and active status index.

---

## 4. Exporting this Guide to PDF

To convert this document into a print-ready PDF, follow any of these methods:

### Method A: Using a Markdown Editor (VS Code / Obsidian)
1. Open this file (`avodani_user_guide.md`) in **VS Code**.
2. Install the extension **Markdown PDF** (by *yzane*).
3. Right-click anywhere in the editor panel and select **Markdown PDF: Export (pdf)**. A high-quality PDF will save to the same folder.

### Method B: Printing to PDF via Web Browser (Google Chrome / Microsoft Edge)
1. Open this file in any online Markdown previewer (or compile to an HTML file).
2. Right-click and choose **Print** (or press `Ctrl` + `P`).
3. Set Destination to **Save as PDF**.
4. In **More settings**, enable **Background graphics** and click **Save**.
