#!/usr/bin/env node

/**
 * Generate SQL execution instructions for Supabase
 */

import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const sqlDir = join(__dirname, '..', 'sql');
const migrations = [
  'apply_now.sql',
  'faturamento_despesas_extension.sql',
  'collections_module_schema.sql',
  'custom_requisition_schema.sql',
  'ficha_individual_schema.sql'
];

console.log('📋 Instruções para aplicar o schema no Supabase:\n');
console.log('1. Vá para: https://supabase.com/dashboard');
console.log('2. Selecione seu projeto');
console.log('3. Vá para: SQL Editor');
console.log('4. Execute os SQLs abaixo em ordem:\n');

migrations.forEach((migration, index) => {
  try {
    const sqlPath = join(sqlDir, migration);
    const sql = readFileSync(sqlPath, 'utf8');

    console.log(`${index + 1}. 📄 ${migration}`);
    console.log('```sql');
    console.log(sql.substring(0, 200) + (sql.length > 200 ? '\n... (arquivo completo)' : ''));
    console.log('```\n');
  } catch (err) {
    console.log(`${index + 1}. ❌ Erro ao ler ${migration}: ${err.message}\n`);
  }
});

console.log('5. Após executar todos os SQLs, verifique se as tabelas foram criadas:');
console.log('   - collections');
console.log('   - expenses');
console.log('   - collection_attempts');
console.log('   - invoice_installments');
console.log('   - cost_centers');
console.log('   - expense_attachments');
console.log('   - etc.\n');

console.log('6. Teste a aplicação: npm run dev');