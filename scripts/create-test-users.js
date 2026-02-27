/**
 * Script para criar usuários de teste no Supabase
 * Executa: node scripts/create-test-users.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

const TEST_USERS = [
  {
    email: 'admin@example.com',
    password: 'admin123',
    name: 'Admin User',
    role: 'ADMIN'
  },
  {
    email: 'manager@example.com',
    password: 'manager123',
    name: 'General Manager',
    role: 'GENERAL_MANAGER'
  },
  {
    email: 'worker@example.com',
    password: 'worker123',
    name: 'Worker User',
    role: 'WORKER'
  }
];

async function createTestUsers() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY não configurados');
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  console.log('🚀 Criando usuários de teste...\n');

  for (const user of TEST_USERS) {
    try {
      console.log(`⏳ Criando ${user.email} (${user.role})...`);

      const { data, error } = await supabase.auth.signUp({
        email: user.email,
        password: user.password,
        options: {
          data: {
            name: user.name,
            role: user.role
          }
        }
      });

      if (error) {
        throw error;
      }

      console.log(`✅ ${user.email} criado com sucesso!`);
      console.log(`   ID: ${data.user?.id}\n`);
    } catch (err) {
      console.error(`❌ Erro ao criar ${user.email}:`, err.message);
    }
  }

  console.log('\n✨ Processo concluído!');
  console.log('\n📝 Credenciais de teste:');
  TEST_USERS.forEach(user => {
    console.log(`   ${user.email} / ${user.password}`);
  });
}

createTestUsers();
