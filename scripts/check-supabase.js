#!/usr/bin/env node

/**
 * Supabase Project Recovery Script
 * Helps restore or create a new Supabase project with existing data
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

console.log('🔄 Supabase Project Recovery\n');

// Check current .env.local
const envPath = join(process.cwd(), '.env.local');
let envContent = '';

try {
  envContent = readFileSync(envPath, 'utf8');
} catch (err) {
  console.log('❌ .env.local not found');
  process.exit(1);
}

console.log('📋 Current .env.local status:');
console.log('=====================================');

const lines = envContent.split('\n');
let hasValidUrl = false;
let hasValidKey = false;

lines.forEach(line => {
  if (line.startsWith('VITE_SUPABASE_URL=')) {
    const url = line.split('=')[1];
    if (url && url !== 'https://your-project-ref.supabase.co') {
      console.log(`✅ URL: ${url}`);
      hasValidUrl = true;
    } else {
      console.log('❌ URL: Not configured');
    }
  }
  if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) {
    const key = line.split('=')[1];
    if (key && key !== 'your-anon-key-here' && key.length > 50) {
      console.log(`✅ Key: Configured (${key.substring(0, 20)}...)`);
      hasValidKey = true;
    } else {
      console.log('❌ Key: Not configured');
    }
  }
});

console.log('');

if (hasValidUrl && hasValidKey) {
  console.log('🎉 Environment variables are configured!');
  console.log('If you still get connection errors, the project may be:');
  console.log('  - Paused due to inactivity');
  console.log('  - Deleted');
  console.log('  - Region/network issues');
  console.log('');
  console.log('Try: npm run dev');
} else {
  console.log('❌ Environment variables need to be configured');
  console.log('');
  console.log('📝 To fix this:');
  console.log('');
  console.log('1. Go to https://supabase.com/dashboard');
  console.log('2. Check if your project still exists');
  console.log('3. If not, create a new project:');
  console.log('   - Name: office-florestal-olc');
  console.log('   - Choose database password');
  console.log('   - Select region');
  console.log('');
  console.log('4. Go to Settings → API');
  console.log('5. Copy Project URL and anon key');
  console.log('6. Update .env.local');
  console.log('');
  console.log('7. Run: npm run setup:db');
}

console.log('\n🔗 Useful links:');
console.log('- Dashboard: https://supabase.com/dashboard');
console.log('- Status: https://status.supabase.com');