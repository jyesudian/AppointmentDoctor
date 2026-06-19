const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function run() {
  console.log('Starting screenshot capture session...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 }
  });
  const page = await context.newPage();

  const scratchDir = path.join(__dirname, 'screenshots');
  if (!fs.existsSync(scratchDir)) {
    fs.mkdirSync(scratchDir, { recursive: true });
  }

  // 1. Landing Page
  console.log('Navigating to landing page...');
  await page.goto('https://appointment-doctor-eta.vercel.app/');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(scratchDir, 'landing_page.png') });

  // 2. Admin Login Page
  console.log('Navigating to Admin Login page...');
  await page.goto('https://appointment-doctor-eta.vercel.app/admin/login');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(scratchDir, 'admin_login_page.png') });

  // Login as Admin
  console.log('Logging in as Admin...');
  await page.fill('input[type="email"]', 'jyesudian@thesentinelark.com');
  await page.fill('input[type="password"]', 'Luke@0101');
  await page.click('button[type="submit"]');
  
  // Wait for Admin Dashboard element
  console.log('Waiting for Admin Dashboard to mount...');
  await page.waitForSelector('text=ADMIN COMMAND CENTER', { timeout: 20000 });
  await page.waitForTimeout(3000);
  console.log('Admin Dashboard loaded.');

  // Admin Tab 1: Overview
  await page.screenshot({ path: path.join(scratchDir, 'admin_overview.png') });

  const adminTabs = [
    { name: 'verification', file: 'admin_verification.png', label: 'Verify Credentials' },
    { name: 'locations', file: 'admin_locations.png', label: 'Manage Field Locations' },
    { name: 'schedules', file: 'admin_schedules.png', label: 'Volunteer Schedules' },
    { name: 'camp-creation', file: 'admin_configure_camp.png', label: 'Configure Camp' },
    { name: 'matching', file: 'admin_matching.png', label: 'AI Doctor Matching' },
    { name: 'invitations-log', file: 'admin_invitation_logs.png', label: 'Invitation Logs' },
    { name: 'check-in', file: 'admin_checkin_manager.png', label: 'Check-in Manager' }
  ];

  for (const tab of adminTabs) {
    console.log(`Navigating to admin tab: ${tab.label}`);
    const button = page.locator(`aside nav button:has-text("${tab.label}")`);
    if (await button.count() > 0) {
      await button.click();
      await page.waitForTimeout(1500);
      await page.screenshot({ path: path.join(scratchDir, tab.file) });
    } else {
      console.log(`Warning: Could not find button for tab ${tab.label}`);
    }
  }

  // Logout Admin
  console.log('Logging out Admin...');
  await page.click('aside button:has-text("Log Out Admin")');
  await page.waitForTimeout(2000);

  // 3. Volunteer Login Page
  console.log('Navigating to Volunteer Login page...');
  await page.goto('https://appointment-doctor-eta.vercel.app/auth/login');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(scratchDir, 'volunteer_login_page.png') });

  // Login as Volunteer
  console.log('Logging in as Volunteer...');
  await page.fill('input[type="email"]', 'jyesudian@gmail.com');
  await page.fill('input[type="password"]', 'Luke@0101');
  await page.click('button[type="submit"]');

  // Wait for Volunteer Dashboard element
  console.log('Waiting for Volunteer Dashboard to mount...');
  await page.waitForSelector('text=VOLUNTEER PORTAL', { timeout: 20000 });
  await page.waitForTimeout(3000);
  console.log('Volunteer Dashboard loaded.');

  // Volunteer Tab 1: Dashboard Overview
  await page.screenshot({ path: path.join(scratchDir, 'volunteer_overview.png') });

  const volunteerTabs = [
    { name: 'Availability Planner', file: 'volunteer_availability.png' },
    { name: 'Preferred Fields', file: 'volunteer_preferred_fields.png' }
  ];

  for (const tab of volunteerTabs) {
    console.log(`Navigating to volunteer tab: ${tab.name}`);
    const button = page.locator(`aside nav button:has-text("${tab.name}")`);
    if (await button.count() > 0) {
      await button.click();
      await page.waitForTimeout(1500);
      await page.screenshot({ path: path.join(scratchDir, tab.file) });
    } else {
      console.log(`Warning: Could not find button for tab ${tab.name}`);
    }
  }

  // Return to Volunteer Dashboard home first to view camp cards
  console.log('Returning to Volunteer Dashboard tab...');
  await page.click('aside nav button:has-text("My Dashboard")');
  await page.waitForTimeout(1500);

  // Check if there is an active/completed camp detail modal we can open and screenshot
  console.log('Attempting to open camp detail modal in volunteer dashboard...');
  const campCard = page.locator('button:has-text("↗")').first();
  if (await campCard.count() > 0) {
    await campCard.click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(scratchDir, 'volunteer_camp_details.png') });
    
    const feedbackBtn = page.locator('button:has-text("Submit Feedback")').first();
    if (await feedbackBtn.count() > 0) {
      await feedbackBtn.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(scratchDir, 'volunteer_feedback_modal.png') });
      
      const closeFeedback = page.locator('button:has-text("×")').nth(1);
      if (await closeFeedback.count() > 0) {
        await closeFeedback.click();
      } else {
        await page.locator('button:has-text("×")').first().click();
      }
      await page.waitForTimeout(500);
    }
    
    const closeDetails = page.locator('button:has-text("×")').first();
    if (await closeDetails.count() > 0) {
      await closeDetails.click();
    }
    await page.waitForTimeout(1000);
  }

  // Logout Volunteer
  console.log('Logging out Volunteer...');
  await page.click('aside button:has-text("Sign Out")');
  await page.waitForTimeout(1500);

  await browser.close();
  console.log('Screenshot capture session completed successfully.');
}

run().catch(err => {
  console.error('Error in capture session:', err);
  process.exit(1);
});
