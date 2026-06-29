async function check() {
  const emails = [
    'jyesudian@gmail.com',
    'ramesh.kumar@mednet.org',
    'f.ali@pediacare.in',
    'nonexistent@gmail.com'
  ];

  const mobiles = [
    '9742075654',
    '+919742075654',
    '9845012345',
    '+91 98450 12345',
    '9901234567',
    '1234567890'
  ];

  console.log('=== TESTING EMAIL DUPLICATE CHECK API ===');
  for (const email of emails) {
    try {
      const res = await fetch('https://appointment-doctor-eta.vercel.app/api/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      console.log(`Email: ${email} -> Status: ${res.status}, Response:`, data);
    } catch (err) {
      console.error(`Failed for ${email}:`, err.message);
    }
  }

  console.log('\n=== TESTING MOBILE DUPLICATE CHECK API ===');
  for (const mobile of mobiles) {
    try {
      const res = await fetch('https://appointment-doctor-eta.vercel.app/api/check-mobile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile })
      });
      const data = await res.json();
      console.log(`Mobile: ${mobile} -> Status: ${res.status}, Response:`, data);
    } catch (err) {
      console.error(`Failed for ${mobile}:`, err.message);
    }
  }
}

check();
