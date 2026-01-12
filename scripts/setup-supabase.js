#!/usr/bin/env node

/**
 * Quick Supabase Project Setup
 * This script helps you create a new Supabase project and update environment variables
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

console.log('🚀 Supabase Project Setup Helper\n');

// Check if environment variables are set
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (supabaseUrl && supabaseUrl !== 'https://your-project-ref.supabase.co' && supabaseKey && supabaseKey !== 'your-anon-key-here') {
  console.log('✅ Environment variables are already configured!');
  console.log(`   URL: ${supabaseUrl}`);
  console.log('   Ready to run: npm run dev');
  process.exit(0);
}

console.log('📋 To set up Supabase:');
console.log('');
console.log('1. Go to https://supabase.com/dashboard');
console.log('2. Click "New Project"');
console.log('3. Fill in:');
console.log('   - Name: office-florestal-olc');
console.log('   - Choose a strong database password');
console.log('   - Select your region');
console.log('');
console.log('4. Wait for project creation (5-10 minutes)');
console.log('');
console.log('5. Go to Settings → API and copy:');
console.log('   - Project URL');
console.log('   - anon/public key');
console.log('');
console.log('6. Update your .env.local file with these values');
console.log('');
console.log('7. Run: npm run setup:db (you\'ll need the service_role key)');
console.log('');
console.log('📄 Your .env.local should look like:');
console.log('');
console.log('# Supabase Configuration');
console.log('VITE_SUPABASE_URL=https://abcdefghijklmnop.supabase.co');
console.log('VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');
console.log('');
console.log('# Gemini API Key');
console.log('GEMINI_API_KEY=your-gemini-key-here');
console.log('');
console.log('🔗 Useful links:');
console.log('- Dashboard: https://supabase.com/dashboard');
console.log('- Docs: https://supabase.com/docs');
console.log('- SQL Editor: https://supabase.com/dashboard/project/YOUR_PROJECT/sql');