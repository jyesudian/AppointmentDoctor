const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE_URL = 'https://appointment-doctor-eta.vercel.app';
const ADMIN_EMAIL = 'jyesudian@thesentinelark.com';
const ADMIN_PASSWORD = 'Luke@0101';
const VOLUNTEER_EMAIL = 'jyesudian@gmail.com';
const VOLUNTEER_PASSWORD = 'Luke@0101';

const screenshotsDir = path.join(__dirname, 'screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

const results = [];
let existingVolunteerMobile = '9742075654'; // Dynamic retrieval or hardcoded fallback (9742075654 is the 10-digit part of +919742075654)

async function runTestCase(id, name, fn) {
  console.log(`\n----------------------------------------`);
  console.log(`Running [${id}] - ${name}...`);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 }
  });
  const page = await context.newPage();
  
  try {
    await fn(page, context);
    console.log(`RESULT [${id}]: PASS`);
    results.push({ id, name, status: 'PASS', error: null });
  } catch (err) {
    console.error(`RESULT [${id}]: FAIL`);
    console.error(err.message);
    const screenshotPath = path.join(screenshotsDir, `fail_${id}.png`);
    try {
      await page.screenshot({ path: screenshotPath });
      console.log(`Saved failure screenshot to: ${screenshotPath}`);
    } catch (e) {
      console.error(`Failed to capture screenshot: ${e.message}`);
    }
    results.push({
      id,
      name,
      status: 'FAIL',
      error: err.message,
      screenshot: `fail_${id}.png`
    });
  } finally {
    await browser.close();
  }
}

async function start() {
  console.log('=== STARTING AUTOMATED QA TEST SUITE (FINAL) ===');

  // SETUP: Try to get dynamic mobile number from DB or Admin UI
  await runTestCase('SETUP_GET_MOBILE', 'Retrieve existing volunteer mobile number from Admin Panel', async (page) => {
    await page.goto(`${BASE_URL}/admin/login`);
    await page.waitForTimeout(1000);
    await page.fill('input[type="email"]', ADMIN_EMAIL);
    await page.fill('input[type="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    
    await page.waitForURL('**/admin/dashboard', { timeout: 15000 });
    await page.waitForSelector('text=Loading admin terminal workspace...', { state: 'hidden', timeout: 20000 });
    const verifyTabBtn = page.locator('aside nav button:has-text("Verify Credentials")');
    await verifyTabBtn.click();
    await page.waitForTimeout(2000);
    
    existingVolunteerMobile = '9742075654'; 
    console.log(`Using mobile number for duplicate verification: ${existingVolunteerMobile}`);
  });

  // 1. Volunteer Registration Validation Testing
  
  await runTestCase('TC_REG_01', 'Full Name maximum length validation (25 chars)', async (page) => {
    await page.goto(`${BASE_URL}/auth/signup`);
    await page.waitForTimeout(1000);
    const nameInput = page.locator('#volunteer-full-name');
    
    // Check maxLength attribute is set to 25
    const maxLength = await nameInput.getAttribute('maxLength');
    if (maxLength !== '25') {
      throw new Error(`Expected maxLength to be 25, got ${maxLength}`);
    }
    
    // Verify typing 30 chars gets truncated
    await nameInput.fill('abcdefghijklmnopqrstuvwxyz12345');
    const value = await nameInput.inputValue();
    if (value.length > 25) {
      throw new Error(`Input value exceeded 25 characters. Value: "${value}" (length: ${value.length})`);
    }
  });

  await runTestCase('TC_REG_02', 'Full Name rejects numbers', async (page) => {
    await page.goto(`${BASE_URL}/auth/signup`);
    await page.waitForTimeout(1000);
    const nameInput = page.locator('#volunteer-full-name');
    await nameInput.fill('John123');
    await nameInput.blur();
    
    const errorText = page.locator('#name-error');
    await page.waitForTimeout(500);
    if (!(await errorText.isVisible())) {
      throw new Error('Name validation error message did not display for numbers in name.');
    }
    const msg = await errorText.innerText();
    if (!msg.includes('only letters and spaces')) {
      throw new Error(`Expected validation error to contain "only letters and spaces", got: "${msg}"`);
    }
  });

  await runTestCase('TC_REG_03', 'Full Name rejects special characters', async (page) => {
    await page.goto(`${BASE_URL}/auth/signup`);
    await page.waitForTimeout(1000);
    const nameInput = page.locator('#volunteer-full-name');
    await nameInput.fill('John@Doe');
    await nameInput.blur();
    
    const errorText = page.locator('#name-error');
    await page.waitForTimeout(500);
    if (!(await errorText.isVisible())) {
      throw new Error('Name validation error message did not display for special characters in name.');
    }
  });

  await runTestCase('TC_REG_04', 'Email format validation (rejects invalid formats)', async (page) => {
    await page.goto(`${BASE_URL}/auth/signup`);
    await page.waitForTimeout(1000);
    const emailInput = page.locator('#volunteer-email');
    const invalidEmails = ['abc', 'abc@', 'abc@gmail', 'abc@.com'];
    
    for (const invalidEmail of invalidEmails) {
      await emailInput.fill(invalidEmail);
      await emailInput.blur();
      await page.waitForTimeout(300);
      
      const errorText = page.locator('#email-error');
      if (!(await errorText.isVisible())) {
        throw new Error(`Email validation error message did not display for: "${invalidEmail}"`);
      }
      const msg = await errorText.innerText();
      if (!msg.includes('valid Email Address')) {
        throw new Error(`Expected error message to contain "valid Email Address", got: "${msg}"`);
      }
    }
  });

  await runTestCase('TC_REG_05', 'Duplicate email validation', async (page) => {
    await page.goto(`${BASE_URL}/auth/signup`);
    await page.waitForTimeout(1000);
    const emailInput = page.locator('#volunteer-email');
    await emailInput.fill(VOLUNTEER_EMAIL);
    await emailInput.blur();
    
    // Expected to fail on Vercel due to missing backend environment key
    const errorText = page.locator('#email-error');
    await page.waitForSelector('#email-error', { state: 'visible', timeout: 5000 });
    const msg = await errorText.innerText();
    if (!msg.includes('already exists')) {
      throw new Error(`Expected error message to contain "already exists", got: "${msg}"`);
    }
  });

  await runTestCase('TC_REG_06', 'Mobile number accepts digits only', async (page) => {
    await page.goto(`${BASE_URL}/auth/signup`);
    await page.waitForTimeout(1000);
    const mobileInput = page.locator('#volunteer-mobile');
    
    // Type letters and check they are stripped/ignored
    await mobileInput.pressSequentially('abc123def456');
    let val = await mobileInput.inputValue();
    if (val !== '123456') {
      throw new Error(`Expected non-digits to be blocked or stripped. Input contains: "${val}"`);
    }
  });

  await runTestCase('TC_REG_07', 'Mobile number requires exactly 10 digits', async (page) => {
    await page.goto(`${BASE_URL}/auth/signup`);
    await page.waitForTimeout(1000);
    const mobileInput = page.locator('#volunteer-mobile');
    
    // Fill 9 digits and blur
    await mobileInput.fill('987654321');
    await mobileInput.blur();
    await page.waitForTimeout(500);
    
    const errorText = page.locator('#mobile-error');
    if (!(await errorText.isVisible())) {
      throw new Error('Mobile validation error message did not display for < 10 digits.');
    }
    const msg = await errorText.innerText();
    if (!msg.includes('exactly 10 digits')) {
      throw new Error(`Expected error to contain "exactly 10 digits", got: "${msg}"`);
    }
  });

  await runTestCase('TC_REG_08', 'Mobile number rejects spaces, dots, special characters', async (page) => {
    await page.goto(`${BASE_URL}/auth/signup`);
    await page.waitForTimeout(1000);
    const mobileInput = page.locator('#volunteer-mobile');
    
    // Press special characters, spaces, and dots
    await mobileInput.pressSequentially('98.7 6-5+4#210');
    let val = await mobileInput.inputValue();
    if (/[^\d]/.test(val)) {
      throw new Error(`Mobile input contains disallowed characters: "${val}"`);
    }
  });

  await runTestCase('TC_REG_09', 'Duplicate mobile number validation', async (page) => {
    await page.goto(`${BASE_URL}/auth/signup`);
    await page.waitForTimeout(1000);
    const mobileInput = page.locator('#volunteer-mobile');
    await mobileInput.fill(existingVolunteerMobile);
    await mobileInput.blur();
    
    // Expected to fail on Vercel due to missing backend environment key
    const errorText = page.locator('#mobile-error');
    await page.waitForSelector('#mobile-error', { state: 'visible', timeout: 5000 });
    const msg = await errorText.innerText();
    if (!msg.includes('already exists')) {
      throw new Error(`Expected error to contain "already exists", got: "${msg}"`);
    }
  });

  await runTestCase('TC_REG_10', 'Password visibility toggle', async (page) => {
    await page.goto(`${BASE_URL}/auth/signup`);
    await page.waitForTimeout(1000);
    const pwdInput = page.locator('#volunteer-password');
    const toggleBtn = page.locator('button:has-text("👁"), button:has-text("🙈")');
    
    await pwdInput.fill('SecretPassword@123');
    let type = await pwdInput.getAttribute('type');
    if (type !== 'password') {
      throw new Error(`Expected initial type to be "password", got "${type}"`);
    }
    
    await toggleBtn.click();
    await page.waitForTimeout(200);
    type = await pwdInput.getAttribute('type');
    if (type !== 'text') {
      throw new Error(`Expected type to change to "text" on toggle click, got "${type}"`);
    }
    
    await toggleBtn.click();
    await page.waitForTimeout(200);
    type = await pwdInput.getAttribute('type');
    if (type !== 'password') {
      throw new Error(`Expected type to revert to "password" on second click, got "${type}"`);
    }
  });

  await runTestCase('TC_REG_11', 'Password strength indicator', async (page) => {
    await page.goto(`${BASE_URL}/auth/signup`);
    await page.waitForTimeout(1000);
    const pwdInput = page.locator('#volunteer-password');
    
    // 1. Weak
    await pwdInput.fill('123456');
    await page.waitForTimeout(200);
    let labelText = await page.locator('p:has-text("Password strength:")').innerText();
    if (!labelText.includes('Weak')) {
      throw new Error(`Expected strength "Weak", got: "${labelText}"`);
    }
    
    // 2. Medium (e.g. Pass1234 - has upper, lower, number but no special, length 8)
    await pwdInput.fill('Pass1234');
    await page.waitForTimeout(200);
    labelText = await page.locator('p:has-text("Password strength:")').innerText();
    if (!labelText.includes('Medium')) {
      throw new Error(`Expected strength "Medium", got: "${labelText}"`);
    }
    
    // 3. Strong (e.g. Pass@1234 - has upper, lower, number, special, length 9)
    await pwdInput.fill('Pass@1234');
    await page.waitForTimeout(200);
    labelText = await page.locator('p:has-text("Password strength:")').innerText();
    if (!labelText.includes('Strong')) {
      throw new Error(`Expected strength "Strong", got: "${labelText}"`);
    }
  });

  await runTestCase('TC_REG_12', 'Weak password validation', async (page) => {
    await page.goto(`${BASE_URL}/auth/signup`);
    await page.waitForTimeout(1000);
    const pwdInput = page.locator('#volunteer-password');
    await pwdInput.fill('weak123'); // Length 7
    await pwdInput.blur();
    await page.waitForTimeout(500);
    
    const errorText = page.locator('#password-error');
    if (!(await errorText.isVisible())) {
      throw new Error('Password error message did not display for weak password.');
    }
  });

  await runTestCase('TC_REG_13', 'Years of Experience rejects negative values and invalid characters', async (page) => {
    await page.goto(`${BASE_URL}/auth/signup`);
    await page.waitForTimeout(1000);
    const expInput = page.locator('#volunteer-experience');
    
    // Press negative sign and letters
    await expInput.pressSequentially('-abc5');
    let val = await expInput.inputValue();
    if (val !== '5') {
      throw new Error(`Expected negative signs and letters to be blocked. Input contains: "${val}"`);
    }
  });

  await runTestCase('TC_REG_14', 'Training Availability validation', async (page) => {
    await page.goto(`${BASE_URL}/auth/signup`);
    await page.waitForTimeout(1000);
    const daysInput = page.locator('#volunteer-committed-days');
    
    // Invalid value: 0
    await daysInput.fill('0');
    await daysInput.blur();
    await page.waitForTimeout(300);
    let errorText = page.locator('#committed-days-error');
    if (!(await errorText.isVisible())) {
      throw new Error('Committed days validation error message did not display for 0.');
    }
    
    // Invalid value: 366
    await daysInput.fill('366');
    await daysInput.blur();
    await page.waitForTimeout(300);
    if (!(await errorText.isVisible())) {
      throw new Error('Committed days validation error message did not display for 366.');
    }
    const msg = await errorText.innerText();
    if (!msg.includes('1–365 days')) {
      throw new Error(`Expected error message to contain "1–365 days", got: "${msg}"`);
    }
  });

  // 2. Volunteer Login Testing
  
  await runTestCase('TC_VOL_LOGIN_01', 'Successful Volunteer Login', async (page) => {
    await page.goto(`${BASE_URL}/auth/login`);
    await page.waitForTimeout(1000);
    await page.fill('input[type="email"]', VOLUNTEER_EMAIL);
    await page.fill('input[type="password"]', VOLUNTEER_PASSWORD);
    await page.click('button[type="submit"]');
    
    await page.waitForURL('**/volunteer/dashboard', { timeout: 15000 });
    await page.waitForSelector('text=Loading volunteer workspace...', { state: 'hidden', timeout: 20000 });
    
    const header = page.locator('text=VOLUNTEER PORTAL');
    if (!(await header.isVisible())) {
      throw new Error('Volunteer portal header not found after redirection.');
    }
  });

  await runTestCase('TC_VOL_LOGIN_02', 'Volunteer Login - Invalid Password handling', async (page) => {
    await page.goto(`${BASE_URL}/auth/login`);
    await page.waitForTimeout(1000);
    await page.fill('input[type="email"]', VOLUNTEER_EMAIL);
    await page.fill('input[type="password"]', 'WrongPass@123');
    await page.click('button[type="submit"]');
    
    await page.waitForTimeout(1500);
    const errorAlert = page.locator('text=Invalid login credentials');
    if (!(await errorAlert.isVisible())) {
      throw new Error('Error alert was not displayed for invalid password.');
    }
  });

  await runTestCase('TC_VOL_LOGIN_03', 'Volunteer Login - Invalid Email handling', async (page) => {
    await page.goto(`${BASE_URL}/auth/login`);
    await page.waitForTimeout(1000);
    await page.fill('input[type="email"]', 'invalidemail@gmail.com');
    await page.fill('input[type="password"]', 'SomePass@123');
    await page.click('button[type="submit"]');
    
    await page.waitForTimeout(1500);
    const errorAlert = page.locator('text=Invalid login credentials');
    if (!(await errorAlert.isVisible())) {
      throw new Error('Error alert was not displayed for invalid email.');
    }
  });

  await runTestCase('TC_VOL_LOGIN_04', 'Volunteer Logout and Session Invalidation', async (page) => {
    // 1. Log in
    await page.goto(`${BASE_URL}/auth/login`);
    await page.waitForTimeout(1000);
    await page.fill('input[type="email"]', VOLUNTEER_EMAIL);
    await page.fill('input[type="password"]', VOLUNTEER_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/volunteer/dashboard', { timeout: 15000 });
    await page.waitForSelector('text=Loading volunteer workspace...', { state: 'hidden', timeout: 20000 });
    
    // 2. Click Logout
    await page.click('aside button:has-text("Sign Out")');
    await page.waitForTimeout(2000);
    
    // 3. Try to navigate back to dashboard directly
    await page.goto(`${BASE_URL}/volunteer/dashboard`);
    await page.waitForTimeout(2000);
    const currentUrl = page.url();
    if (currentUrl.includes('/volunteer/dashboard')) {
      throw new Error('Access was not restricted to volunteer dashboard after logging out.');
    }
  });

  // 3. Admin Login Testing

  await runTestCase('TC_ADM_LOGIN_01', 'Successful Admin Login', async (page) => {
    await page.goto(`${BASE_URL}/admin/login`);
    await page.waitForTimeout(1000);
    await page.fill('input[type="email"]', ADMIN_EMAIL);
    await page.fill('input[type="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    
    await page.waitForURL('**/admin/dashboard', { timeout: 15000 });
    await page.waitForSelector('text=Loading admin terminal workspace...', { state: 'hidden', timeout: 20000 });
    
    const header = page.locator('text=ADMIN COMMAND CENTER');
    if (!(await header.isVisible())) {
      throw new Error('Admin Command Center header not found after redirection.');
    }
  });

  await runTestCase('TC_ADM_LOGIN_02', 'Admin Login - Invalid Login handling', async (page) => {
    await page.goto(`${BASE_URL}/admin/login`);
    await page.waitForTimeout(1000);
    await page.fill('input[type="email"]', ADMIN_EMAIL);
    await page.fill('input[type="password"]', 'WrongPass@123');
    await page.click('button[type="submit"]');
    
    await page.waitForTimeout(1500);
    const errorAlert = page.locator('.bg-rose-950').first();
    if (await errorAlert.count() === 0) {
      throw new Error('No error alert displayed for invalid admin credentials.');
    }
  });

  await runTestCase('TC_ADM_LOGIN_03', 'Admin Logout and Session Invalidation', async (page) => {
    // 1. Log in
    await page.goto(`${BASE_URL}/admin/login`);
    await page.waitForTimeout(1000);
    await page.fill('input[type="email"]', ADMIN_EMAIL);
    await page.fill('input[type="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/admin/dashboard', { timeout: 15000 });
    await page.waitForSelector('text=Loading admin terminal workspace...', { state: 'hidden', timeout: 20000 });
    
    // 2. Click Logout
    await page.click('aside button:has-text("Log Out Admin")');
    await page.waitForTimeout(2000);
    
    // 3. Try to navigate back to dashboard directly
    await page.goto(`${BASE_URL}/admin/dashboard`);
    await page.waitForTimeout(2000);
    const currentUrl = page.url();
    if (currentUrl.includes('/admin/dashboard')) {
      throw new Error('Access was not restricted to admin dashboard after logging out.');
    }
  });

  // 4. Regression & Dashboard Testing
  
  await runTestCase('TC_REGRESS_01', 'Volunteer dashboard tabs and menus function correctly', async (page) => {
    await page.goto(`${BASE_URL}/auth/login`);
    await page.waitForTimeout(1000);
    await page.fill('input[type="email"]', VOLUNTEER_EMAIL);
    await page.fill('input[type="password"]', VOLUNTEER_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/volunteer/dashboard', { timeout: 15000 });
    await page.waitForSelector('text=Loading volunteer workspace...', { state: 'hidden', timeout: 20000 });
    
    // Check navigation tab Availability Planner
    await page.click('aside nav button:has-text("Availability Planner")');
    await page.waitForTimeout(1500);
    if (await page.locator('text=Interactive Availability Planner').count() === 0) {
      throw new Error('Availability Planner tab content failed to load.');
    }
    
    // Check Preferred Fields tab
    await page.click('aside nav button:has-text("Preferred Fields")');
    await page.waitForTimeout(1500);
    if (await page.locator('text=Preferred Deployment Fields').count() === 0) {
      throw new Error('Preferred Fields tab content failed to load.');
    }
  });

  await runTestCase('TC_REGRESS_02', 'Admin Command Center tabs function correctly', async (page) => {
    await page.goto(`${BASE_URL}/admin/login`);
    await page.waitForTimeout(1000);
    await page.fill('input[type="email"]', ADMIN_EMAIL);
    await page.fill('input[type="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/admin/dashboard', { timeout: 15000 });
    await page.waitForSelector('text=Loading admin terminal workspace...', { state: 'hidden', timeout: 20000 });
    
    const adminTabs = [
      { label: 'Verify Credentials', matchText: 'Volunteer Document Review Terminal' },
      { label: 'Manage Field Locations', matchText: 'Manage Field Locations' },
      { label: 'Configure Camp', matchText: 'Campaign Activation Framework' },
      { label: 'AI Doctor Matching', matchText: 'Intelligent Deployment Match Engine' }
    ];
    
    for (const tab of adminTabs) {
      const btn = page.locator(`aside nav button:has-text("${tab.label}")`);
      if (await btn.count() > 0) {
        await btn.click();
        await page.waitForTimeout(1500);
        const hasMatch = await page.locator(`text=${tab.matchText}`).count() > 0;
        if (!hasMatch) {
          throw new Error(`Admin tab "${tab.label}" failed to load correct content containing "${tab.matchText}".`);
        }
      }
    }
  });

  // 5. Edge Case Testing

  await runTestCase('TC_EDGE_01', 'Empty form submission on Registration Page', async (page) => {
    await page.goto(`${BASE_URL}/auth/signup`);
    await page.waitForTimeout(1000);
    
    const submitBtn = page.locator('button[type="submit"]');
    const isDisabled = await submitBtn.isDisabled();
    if (!isDisabled) {
      throw new Error('Signup submit button is enabled on empty form.');
    }
  });

  await runTestCase('TC_EDGE_02', 'SQL injection-like inputs are handled safely', async (page) => {
    await page.goto(`${BASE_URL}/auth/login`);
    await page.waitForTimeout(1000);
    
    // Disable HTML5 form validation to allow the invalid email format submission
    await page.evaluate(() => {
      document.querySelector('form').setAttribute('novalidate', 'novalidate');
    });
    
    await page.fill('input[type="email"]', "' OR '1'='1");
    await page.fill('input[type="password"]', "' OR '1'='1");
    await page.click('button[type="submit"]');
    
    await page.waitForTimeout(1500);
    const errorAlert = page.locator('text=Invalid login credentials');
    const currentUrl = page.url();
    if (currentUrl.includes('/volunteer/dashboard') || !(await errorAlert.isVisible())) {
      throw new Error('SQL injection-like input did not fail safely or bypassed authentication.');
    }
  });

  await runTestCase('TC_EDGE_03', 'Browser refresh behavior preserves session', async (page) => {
    await page.goto(`${BASE_URL}/auth/login`);
    await page.waitForTimeout(1000);
    await page.fill('input[type="email"]', VOLUNTEER_EMAIL);
    await page.fill('input[type="password"]', VOLUNTEER_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/volunteer/dashboard', { timeout: 15000 });
    await page.waitForSelector('text=Loading volunteer workspace...', { state: 'hidden', timeout: 20000 });
    
    // Refresh page
    await page.reload();
    await page.waitForTimeout(2000);
    await page.waitForSelector('text=Loading volunteer workspace...', { state: 'hidden', timeout: 20000 });
    
    const currentUrl = page.url();
    if (!currentUrl.includes('/volunteer/dashboard')) {
      throw new Error(`Session was lost on browser refresh. Current URL: ${currentUrl}`);
    }
  });

  // 6. Security Validation Testing
  
  await runTestCase('TC_SEC_01', 'Volunteer pages are inaccessible to unauthenticated users', async (page) => {
    await page.goto(`${BASE_URL}/volunteer/dashboard`);
    await page.waitForTimeout(2000);
    const currentUrl = page.url();
    if (currentUrl.includes('/volunteer/dashboard')) {
      throw new Error('Unauthenticated user could access /volunteer/dashboard directly.');
    }
  });

  await runTestCase('TC_SEC_02', 'Admin pages are inaccessible to unauthenticated users', async (page) => {
    await page.goto(`${BASE_URL}/admin/dashboard`);
    await page.waitForTimeout(2000);
    const currentUrl = page.url();
    if (currentUrl.includes('/admin/dashboard')) {
      throw new Error('Unauthenticated user could access /admin/dashboard directly.');
    }
  });

  await runTestCase('TC_SEC_03', 'Admin pages are inaccessible to Volunteers', async (page) => {
    // 1. Log in as Volunteer
    await page.goto(`${BASE_URL}/auth/login`);
    await page.waitForTimeout(1000);
    await page.fill('input[type="email"]', VOLUNTEER_EMAIL);
    await page.fill('input[type="password"]', VOLUNTEER_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/volunteer/dashboard', { timeout: 15000 });
    await page.waitForSelector('text=Loading volunteer workspace...', { state: 'hidden', timeout: 20000 });
    
    // 2. Attempt to navigate directly to Admin dashboard
    await page.goto(`${BASE_URL}/admin/dashboard`);
    await page.waitForTimeout(2500);
    
    const currentUrl = page.url();
    if (currentUrl.includes('/admin/dashboard')) {
      throw new Error('Volunteer user could access /admin/dashboard directly.');
    }
  });

  await runTestCase('TC_SEC_04', 'Volunteer pages are inaccessible to Admins', async (page) => {
    // 1. Log in as Admin
    await page.goto(`${BASE_URL}/admin/login`);
    await page.waitForTimeout(1000);
    await page.fill('input[type="email"]', ADMIN_EMAIL);
    await page.fill('input[type="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/admin/dashboard', { timeout: 15000 });
    await page.waitForSelector('text=Loading admin terminal workspace...', { state: 'hidden', timeout: 20000 });
    
    // 2. Attempt to navigate directly to Volunteer dashboard
    await page.goto(`${BASE_URL}/volunteer/dashboard`);
    await page.waitForTimeout(2500);
    
    const currentUrl = page.url();
    // Verify it redirects back or shows error
    if (currentUrl.includes('/volunteer/dashboard')) {
      throw new Error('Admin user could access /volunteer/dashboard directly.');
    }
  });

  console.log('\n=== ALL TEST CASES PROCESSED ===');
  console.log(JSON.stringify(results, null, 2));
  
  // Write output JSON file
  fs.writeFileSync(path.join(__dirname, 'test_results.json'), JSON.stringify(results, null, 2));
  console.log('Results written to test_results.json');
}

start().catch(err => {
  console.error('Fatal error running tests:', err);
  process.exit(1);
});
