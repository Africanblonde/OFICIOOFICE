#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

try {
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

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.log('❌ Environment variables not configured');
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  async function checkTables() {
    console.log('🔍 Verificando tabelas após aplicar schema...\n');

    const tables = [
      'users', 'invoices', 'invoice_items', 'cost_centers',
      'collections', 'expenses', 'collection_attempts', 'transactions',
      'invoice_installments', 'expense_attachments', 'requisition_sheets', 'fichas_individuais'
    ];

    let successCount = 0;

    for (const table of tables) {
      try {
        const { data, error } = await supabase.from(table).select('*').limit(1);
        if (error) {
          console.log('❌', table, ':', error.message);
        } else {
          console.log('✅', table, ': OK');
          successCount++;
        }
      } catch (err) {
        console.log('❌', table, ':', err.message);
      }
    }

    console.log(`\n📊 Resultado: ${successCount}/${tables.length} tabelas funcionando`);

    if (successCount >= 11) {
      console.log('🎉 Schema aplicado com sucesso! A aplicação está pronta.');
    } else {
      console.log('⚠️  Algumas tabelas ainda não foram criadas. Execute os SQLs restantes.');
    }
  }

  checkTables();

} catch (err) {
  console.log('❌ Error:', err.message);
}