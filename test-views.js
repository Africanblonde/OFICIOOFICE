import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envContent = fs.readFileSync('.env.local', 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, ...value] = line.split('=');
  if (key && value.length) {
    envVars[key.trim()] = value.join('=').trim();
  }
});

const supabase = createClient(envVars.VITE_SUPABASE_URL, envVars.VITE_SUPABASE_ANON_KEY);

async function testViews() {
  console.log('🧪 Testando acesso às views...');

  try {
    // Testar v_overdue_invoices
    const { data: overdueData, error: overdueError } = await supabase
      .from('v_overdue_invoices')
      .select('*')
      .limit(1);

    if (overdueError) {
      console.log('❌ v_overdue_invoices:', overdueError.message);
    } else {
      console.log('✅ v_overdue_invoices: OK');
    }

    // Testar v_client_balances
    const { data: balancesData, error: balancesError } = await supabase
      .from('v_client_balances')
      .select('*')
      .limit(1);

    if (balancesError) {
      console.log('❌ v_client_balances:', balancesError.message);
    } else {
      console.log('✅ v_client_balances: OK');
    }

    // Testar v_overdue_installments
    const { data: installmentsData, error: installmentsError } = await supabase
      .from('v_overdue_installments')
      .select('*')
      .limit(1);

    if (installmentsError) {
      console.log('❌ v_overdue_installments:', installmentsError.message);
    } else {
      console.log('✅ v_overdue_installments: OK');
    }

  } catch (err) {
    console.log('❌ Erro inesperado:', err.message);
  }
}

testViews();