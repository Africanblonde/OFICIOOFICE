#!/usr/bin/env node

/**
 * Supabase Database Setup Script
 * Run this after creating a new Supabase project
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get environment variables
let SUPABASE_URL = process.env.VITE_SUPABASE_URL;
let SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Try to read from .env.local and .env.temp if not set
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  const envFiles = ['.env.local', '.env.temp'];
  for (const envFile of envFiles) {
    try {
      const envContent = readFileSync(join(__dirname, '..', envFile), 'utf8');
      envContent.split('\n').forEach(line => {
        const [key, ...value] = line.split('=');
        if (key && value.length) {
          const val = value.join('=').trim();
          if (key === 'VITE_SUPABASE_URL' && !SUPABASE_URL) SUPABASE_URL = val;
          if (key === 'SUPABASE_SERVICE_ROLE_KEY' && !SUPABASE_SERVICE_KEY) SUPABASE_SERVICE_KEY = val;
        }
      });
    } catch (err) {
      // File not found, continue
    }
  }
}

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing environment variables:');
  console.error('   VITE_SUPABASE_URL: Your Supabase project URL');
  console.error('   SUPABASE_SERVICE_ROLE_KEY: Service role key from Supabase dashboard');
  console.error('\nGet these from: https://supabase.com/dashboard/project/YOUR_PROJECT/settings/api');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const migrations = [
  'apply_now.sql',
  'faturamento_despesas_extension.sql',
  'collections_module_schema.sql',
  'custom_requisition_schema.sql',
  'ficha_individual_schema.sql'
];

async function runMigrations() {
  console.log('🚀 Starting database setup...\n');

  for (const migration of migrations) {
    try {
      console.log(`📄 Running migration: ${migration}`);
      const sqlPath = join(__dirname, '..', 'sql', migration);

      const sql = readFileSync(sqlPath, 'utf8');

      const { error } = await supabase.rpc('exec_sql', { sql });

      if (error) {
        console.error(`❌ Error in ${migration}:`, error.message);
        // Continue with other migrations
      } else {
        console.log(`✅ ${migration} completed`);
      }
    } catch (err) {
      console.error(`❌ Failed to read or execute ${migration}:`, err.message);
    }
  }

  console.log('\n🎉 Database setup complete!');
  console.log('You can now start the application with: npm run dev');
}

runMigrations().catch(console.error);