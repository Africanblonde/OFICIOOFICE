#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

try {
  // Load environment variables
  const envContent = readFileSync('.env.local', 'utf8');
  const envVars = {};

  envContent.split('\n').forEach(line => {
    const [key, ...value] = line.split('=');
    if (key && value.length) {
      envVars[key.trim()] = value.join('=').trim();
    }
  });

  const SUPABASE_URL = envVars.VITE_SUPABASE_URL;
  const SUPABASE_ANON_KEY = envVars.VITE_SUPABASE_ANON_KEY;

  console.log('🔄 Testing Supabase connection...');
  console.log('URL:', SUPABASE_URL ? '✅ Configured' : '❌ Missing');
  console.log('Key:', SUPABASE_ANON_KEY ? '✅ Configured' : '❌ Missing');

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.log('❌ Environment variables not configured');
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // Test connection
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    console.log('❌ Connection failed:', error.message);
  } else {
    console.log('✅ Supabase connection successful!');
    console.log('Session:', data.session ? 'Active' : 'None');
  }

} catch (err) {
  console.log('❌ Error:', err.message);
}