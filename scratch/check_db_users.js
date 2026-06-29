const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Manually parse .env.local
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([^#=]+)\s*=\s*(.*)\s*$/);
  if (match) {
    env[match[1].trim()] = match[2].trim();
  }
});

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be defined in .env.local');
  process.exit(1);
}

const supabase = createClient(url, key);

async function check() {
  console.log('Querying profiles table...');
  const { data: profiles, error: pError } = await supabase
    .from('profiles')
    .select('id, name, email, mobile, status');
  
  if (pError) {
    console.error('Error fetching profiles:', pError);
    return;
  }
  
  console.log('Profiles:');
  console.log(JSON.stringify(profiles, null, 2));

  console.log('\nQuerying admins table...');
  const { data: admins, error: aError } = await supabase
    .from('admins')
    .select('*');

  if (aError) {
    console.error('Error fetching admins:', aError);
    return;
  }

  console.log('Admins:');
  console.log(JSON.stringify(admins, null, 2));
}

check();
